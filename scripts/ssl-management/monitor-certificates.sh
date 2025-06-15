#!/bin/bash
# monitor-certificates.sh - Script to monitor SSL certificate expiration

set -e

# Configuration variables
DOMAIN=${DOMAIN:-"example.com"}
EXPIRY_THRESHOLD=${EXPIRY_THRESHOLD:-30}  # Days before expiration to trigger alert
SLACK_WEBHOOK_URL=${SLACK_WEBHOOK_URL:-""}
EMAIL_TO=${EMAIL_TO:-""}
CERT_PATH=${CERT_PATH:-"/home/yeab/Projects/certificate-verification_4/nginx/ssl/cert.pem"}

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

# Check if OpenSSL is installed
if ! command -v openssl &> /dev/null; then
  log "error" "OpenSSL is not installed. Please install OpenSSL first."
  exit 1
fi

# Check if certificate file exists
if [ ! -f "$CERT_PATH" ]; then
  log "error" "Certificate file not found at $CERT_PATH"
  exit 1
fi

# Get certificate expiration date
expiry_date=$(openssl x509 -enddate -noout -in "$CERT_PATH" | cut -d= -f2)
expiry_epoch=$(date -d "$expiry_date" +%s)
current_epoch=$(date +%s)
seconds_until_expiry=$((expiry_epoch - current_epoch))
days_until_expiry=$((seconds_until_expiry / 86400))

log "info" "Certificate for $DOMAIN expires in $days_until_expiry days (on $expiry_date)"

# Check if certificate is nearing expiration
if [ $days_until_expiry -le $EXPIRY_THRESHOLD ]; then
  alert_message="⚠️ WARNING: SSL certificate for $DOMAIN will expire in $days_until_expiry days (on $expiry_date)"
  log "warn" "$alert_message"
  
  # Send Slack notification if webhook URL is configured
  if [ -n "$SLACK_WEBHOOK_URL" ]; then
    log "info" "Sending Slack notification..."
    curl -s -X POST -H 'Content-type: application/json' \
      --data "{\"text\":\"$alert_message\"}" \
      "$SLACK_WEBHOOK_URL"
  fi
  
  # Send email notification if email is configured
  if [ -n "$EMAIL_TO" ]; then
    log "info" "Sending email notification to $EMAIL_TO..."
    echo "$alert_message" | mail -s "SSL Certificate Expiration Warning - $DOMAIN" "$EMAIL_TO"
  fi
  
  # Exit with non-zero status to indicate warning
  exit 2
else
  log "info" "Certificate is valid for more than $EXPIRY_THRESHOLD days. No action needed."
  exit 0
fi