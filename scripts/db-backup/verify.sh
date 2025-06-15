#!/bin/bash
# PostgreSQL Database Backup Verification Script
# This script verifies the integrity of database backups

# Load environment variables from .env file if it exists
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Configuration (can be overridden by environment variables)
BACKUP_DIR=${DB_BACKUP_DIR:-"/backups"}
POSTGRES_DB=${POSTGRES_DB:-"certificate_verification"}
SLACK_WEBHOOK_URL=${SLACK_WEBHOOK_URL:-""}

# Log file for verification operations
LOG_FILE="$BACKUP_DIR/verify_log.txt"

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

# Check if a specific backup file is provided
if [ -n "$1" ]; then
  BACKUP_FILES=("$BACKUP_DIR/$1")
  
  # Check if the specified backup file exists
  if [ ! -f "${BACKUP_FILES[0]}" ]; then
    echo "Error: Backup file not found: ${BACKUP_FILES[0]}"
    exit 1
  fi
else
  # Get the most recent backup files (up to 5)
  BACKUP_FILES=($(find $BACKUP_DIR -name "${POSTGRES_DB}_*.sql.gz" -type f -printf "%T@ %p\n" | sort -nr | head -n 5 | cut -d' ' -f2-))
  
  if [ ${#BACKUP_FILES[@]} -eq 0 ]; then
    echo "No backup files found in $BACKUP_DIR"
    exit 1
  fi
fi

echo "Starting backup verification at $(date)" >> $LOG_FILE
send_notification "info" "🔍 Starting verification of ${#BACKUP_FILES[@]} backup files"

# Initialize counters
VERIFIED_COUNT=0
FAILED_COUNT=0

# Verify each backup file
for BACKUP_FILE in "${BACKUP_FILES[@]}"; do
  FILENAME=$(basename "$BACKUP_FILE")
  echo "Verifying backup file: $FILENAME" >> $LOG_FILE
  
  # Check if the file exists and is readable
  if [ ! -r "$BACKUP_FILE" ]; then
    send_notification "error" "❌ Cannot read backup file: $FILENAME"
    ((FAILED_COUNT++))
    continue
  fi
  
  # Check file size (should be greater than 1KB)
  FILE_SIZE=$(du -k "$BACKUP_FILE" | cut -f1)
  if [ "$FILE_SIZE" -lt 1 ]; then
    send_notification "error" "❌ Backup file is too small (${FILE_SIZE}KB): $FILENAME"
    ((FAILED_COUNT++))
    continue
  fi
  
  # Verify gzip integrity
  if gzip -t "$BACKUP_FILE" 2>/dev/null; then
    # Check if the file contains SQL commands
    if gunzip -c "$BACKUP_FILE" | head -n 100 | grep -q "CREATE TABLE\|INSERT INTO\|BEGIN\|COMMIT"; then
      send_notification "success" "✅ Backup file verified successfully: $FILENAME (${FILE_SIZE}KB)"
      ((VERIFIED_COUNT++))
    else
      send_notification "error" "❌ Backup file does not contain expected SQL commands: $FILENAME"
      ((FAILED_COUNT++))
    fi
  else
    send_notification "error" "❌ Backup file is corrupted: $FILENAME"
    ((FAILED_COUNT++))
  fi
done

# Report summary
SUMMARY="Backup verification completed: $VERIFIED_COUNT successful, $FAILED_COUNT failed"
echo "$SUMMARY" >> $LOG_FILE
send_notification "info" "📊 $SUMMARY"

# Exit with error if any verification failed
if [ $FAILED_COUNT -gt 0 ]; then
  exit 1
fi

exit 0