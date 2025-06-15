#!/bin/bash
# renew-certificates.sh - Script to renew Let's Encrypt certificates

set -e

# Configuration variables
CERTBOT_CONTAINER_NAME=${CERTBOT_CONTAINER_NAME:-"certbot"}
NGINX_CONTAINER_NAME=${NGINX_CONTAINER_NAME:-"nginx"}
RENEWAL_DAYS=${RENEWAL_DAYS:-30}

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

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
  log "error" "Docker is not installed. Please install Docker first."
  exit 1
fi

# Run Certbot to renew certificates
log "info" "Attempting to renew certificates..."
docker run --rm \
  -v /home/yeab/Projects/certificate-verification_4/nginx/certbot/conf:/etc/letsencrypt \
  -v /home/yeab/Projects/certificate-verification_4/nginx/certbot/www:/var/www/certbot \
  certbot/certbot renew --webroot -w /var/www/certbot

# Reload Nginx to apply new certificates
log "info" "Reloading Nginx configuration..."
docker exec $NGINX_CONTAINER_NAME nginx -s reload

log "info" "Certificate renewal process completed!"