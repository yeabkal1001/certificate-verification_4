#!/bin/bash
# PostgreSQL Database Backup Script
# This script creates a backup of the PostgreSQL database and manages retention

# Load environment variables from .env file if it exists
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Configuration (can be overridden by environment variables)
BACKUP_DIR=${DB_BACKUP_DIR:-"/backups"}
POSTGRES_HOST=${POSTGRES_HOST:-"postgres"}
POSTGRES_PORT=${POSTGRES_PORT:-"5432"}
POSTGRES_DB=${POSTGRES_DB:-"certificate_verification"}
POSTGRES_USER=${POSTGRES_USER:-"postgres"}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-"postgres"}
RETENTION_DAYS=${DB_BACKUP_RETENTION_DAYS:-"7"}
S3_BUCKET=${DB_BACKUP_S3_BUCKET:-""}
SLACK_WEBHOOK_URL=${SLACK_WEBHOOK_URL:-""}

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Generate timestamp for the backup file
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/${POSTGRES_DB}_${TIMESTAMP}.sql.gz"

# Log file for backup operations
LOG_FILE="$BACKUP_DIR/backup_log.txt"

# Function to send notifications
send_notification() {
  local status=$1
  local message=$2
  
  echo "$(date): $message" >> $LOG_FILE
  
  # Send Slack notification if webhook URL is configured
  if [ -n "$SLACK_WEBHOOK_URL" ]; then
    local color="good"
    if [ "$status" != "success" ]; then
      color="danger"
    fi
    
    curl -s -X POST -H 'Content-type: application/json' \
      --data "{\"attachments\":[{\"color\":\"$color\",\"text\":\"$message\"}]}" \
      $SLACK_WEBHOOK_URL
  fi
}

# Perform the backup
echo "Starting database backup at $(date)" >> $LOG_FILE
if PGPASSWORD=$POSTGRES_PASSWORD pg_dump -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $POSTGRES_DB -F p | gzip > $BACKUP_FILE; then
  # Get the size of the backup file
  BACKUP_SIZE=$(du -h $BACKUP_FILE | cut -f1)
  
  # Verify the backup file
  if gzip -t $BACKUP_FILE; then
    send_notification "success" "✅ Database backup completed successfully. File: $(basename $BACKUP_FILE), Size: $BACKUP_SIZE"
    
    # Upload to S3 if configured
    if [ -n "$S3_BUCKET" ]; then
      echo "Uploading backup to S3 bucket: $S3_BUCKET" >> $LOG_FILE
      if aws s3 cp $BACKUP_FILE s3://$S3_BUCKET/$(basename $BACKUP_FILE); then
        send_notification "success" "✅ Backup uploaded to S3: s3://$S3_BUCKET/$(basename $BACKUP_FILE)"
      else
        send_notification "error" "❌ Failed to upload backup to S3"
      fi
    fi
  else
    send_notification "error" "❌ Backup verification failed for file: $(basename $BACKUP_FILE)"
    exit 1
  fi
else
  send_notification "error" "❌ Database backup failed"
  exit 1
fi

# Clean up old backups
echo "Cleaning up backups older than $RETENTION_DAYS days" >> $LOG_FILE
find $BACKUP_DIR -name "${POSTGRES_DB}_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

# Clean up old log entries (keep last 100 lines)
if [ -f $LOG_FILE ] && [ $(wc -l < $LOG_FILE) -gt 100 ]; then
  tail -n 100 $LOG_FILE > $LOG_FILE.tmp
  mv $LOG_FILE.tmp $LOG_FILE
fi

exit 0