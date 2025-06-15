#!/bin/bash
# Script to set up scheduled database backups using cron

# Default backup schedule (daily at 2 AM)
DEFAULT_SCHEDULE="0 2 * * *"

# Parse command line arguments
SCHEDULE=${1:-$DEFAULT_SCHEDULE}
PROJECT_DIR=$(pwd)

# Validate cron schedule format
if ! [[ $SCHEDULE =~ ^[0-9*,-/]+" "[0-9*,-/]+" "[0-9*,-/]+" "[0-9*,-/]+" "[0-9*,-/]+$ ]]; then
  echo "Error: Invalid cron schedule format"
  echo "Usage: $0 [CRON_SCHEDULE]"
  echo "Example: $0 \"0 2 * * *\" (daily at 2 AM)"
  exit 1
fi

# Create the cron job command
CRON_CMD="cd $PROJECT_DIR && docker-compose -f docker-compose.backup.yml up --rm db-backup > /dev/null 2>&1"

# Create a temporary file with the current crontab
crontab -l > /tmp/current-crontab 2>/dev/null || echo "" > /tmp/current-crontab

# Check if the backup job already exists
if grep -q "docker-compose -f docker-compose.backup.yml up --rm db-backup" /tmp/current-crontab; then
  # Update the existing job
  sed -i "/docker-compose -f docker-compose.backup.yml up --rm db-backup/c\\$SCHEDULE $CRON_CMD" /tmp/current-crontab
  echo "Updated existing backup schedule to: $SCHEDULE"
else
  # Add the new job
  echo "$SCHEDULE $CRON_CMD" >> /tmp/current-crontab
  echo "Added new backup schedule: $SCHEDULE"
fi

# Install the updated crontab
crontab /tmp/current-crontab
rm /tmp/current-crontab

echo "Database backups scheduled successfully"
echo "To view the current schedule, run: crontab -l"
exit 0