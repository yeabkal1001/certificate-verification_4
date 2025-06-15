#!/bin/bash
# setup-auto-renewal.sh - Script to set up automatic certificate renewal

set -e

# Configuration variables
CRON_SCHEDULE=${CRON_SCHEDULE:-"0 3 * * *"}  # Default: 3 AM every day
SCRIPTS_DIR=${SCRIPTS_DIR:-"/home/yeab/Projects/certificate-verification_4/scripts/ssl-management"}
CRON_USER=${CRON_USER:-$(whoami)}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to display messages
log() {
  local level=$1
  local message=$2
  
  case $level in
    "info")
      echo -e "${GREEN}[INFO]${NC} $message"
      ;;
    "warn")
      echo -e "${YELLOW}[WARNING]${NC} $message"
      ;;
    "error")
      echo -e "${RED}[ERROR]${NC} $message"
      ;;
    *)
      echo "$message"
      ;;
  esac
}

# Make scripts executable
log "info" "Making scripts executable..."
chmod +x "$SCRIPTS_DIR/renew-certificates.sh"
chmod +x "$SCRIPTS_DIR/monitor-certificates.sh"

# Create temporary crontab file
log "info" "Setting up cron jobs for certificate renewal and monitoring..."
TEMP_CRONTAB=$(mktemp)

# Export current crontab
crontab -l > "$TEMP_CRONTAB" 2>/dev/null || echo "" > "$TEMP_CRONTAB"

# Check if cron job already exists
if grep -q "renew-certificates.sh" "$TEMP_CRONTAB"; then
  log "warn" "Certificate renewal cron job already exists. Skipping..."
else
  # Add certificate renewal cron job
  echo "# Certificate renewal - runs at $CRON_SCHEDULE" >> "$TEMP_CRONTAB"
  echo "$CRON_SCHEDULE $SCRIPTS_DIR/renew-certificates.sh >> /var/log/cert-renewal.log 2>&1" >> "$TEMP_CRONTAB"
  log "info" "Added certificate renewal cron job."
fi

# Check if monitoring cron job already exists
if grep -q "monitor-certificates.sh" "$TEMP_CRONTAB"; then
  log "warn" "Certificate monitoring cron job already exists. Skipping..."
else
  # Add certificate monitoring cron job (runs at 9 AM every Monday)
  echo "# Certificate expiration monitoring - runs at 9 AM every Monday" >> "$TEMP_CRONTAB"
  echo "0 9 * * 1 $SCRIPTS_DIR/monitor-certificates.sh >> /var/log/cert-monitoring.log 2>&1" >> "$TEMP_CRONTAB"
  log "info" "Added certificate monitoring cron job."
fi

# Install new crontab
crontab "$TEMP_CRONTAB"
rm "$TEMP_CRONTAB"

log "info" "Automatic certificate renewal has been set up successfully!"
log "info" "Renewal will run at $CRON_SCHEDULE"
log "info" "Monitoring will run at 9 AM every Monday"