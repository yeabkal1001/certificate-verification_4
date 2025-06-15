#!/bin/bash
# PostgreSQL Database Restore Script
# This script restores a PostgreSQL database from a backup file

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
SLACK_WEBHOOK_URL=${SLACK_WEBHOOK_URL:-""}

# Log file for restore operations
LOG_FILE="$BACKUP_DIR/restore_log.txt"

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

# Check if backup file is provided
if [ -z "$1" ]; then
  echo "Error: No backup file specified"
  echo "Usage: $0 <backup_file>"
  echo "Example: $0 ${POSTGRES_DB}_20230101_120000.sql.gz"
  exit 1
fi

BACKUP_FILE="$BACKUP_DIR/$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file not found: $BACKUP_FILE"
  exit 1
fi

# Confirm restore operation
echo "WARNING: This will overwrite the current database with the backup."
echo "Database: $POSTGRES_DB"
echo "Backup file: $BACKUP_FILE"
read -p "Are you sure you want to proceed? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Restore operation cancelled."
  exit 0
fi

# Start restore operation
echo "Starting database restore at $(date)" >> $LOG_FILE
send_notification "info" "🔄 Database restore started for file: $(basename $BACKUP_FILE)"

# Verify the backup file
if ! gzip -t $BACKUP_FILE; then
  send_notification "error" "❌ Backup verification failed for file: $(basename $BACKUP_FILE)"
  exit 1
fi

# Perform the restore
if gunzip -c $BACKUP_FILE | PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER -d $POSTGRES_DB; then
  send_notification "success" "✅ Database restore completed successfully from file: $(basename $BACKUP_FILE)"
else
  send_notification "error" "❌ Database restore failed"
  exit 1
fi

exit 0