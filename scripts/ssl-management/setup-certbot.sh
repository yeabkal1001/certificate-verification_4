#!/bin/bash
# setup-certbot.sh - Script to set up Certbot for Let's Encrypt certificate management

set -e

# Configuration variables (can be overridden by environment variables)
DOMAIN=${DOMAIN:-"example.com"}
EMAIL=${EMAIL:-"admin@example.com"}
STAGING=${STAGING:-"true"}  # Set to "false" for production certificates
WEBROOT_PATH=${WEBROOT_PATH:-"/var/www/certbot"}
CERTBOT_CONTAINER_NAME=${CERTBOT_CONTAINER_NAME:-"certbot"}

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

# Check if domain is set
if [ "$DOMAIN" = "example.com" ]; then
  log "warn" "Using default domain (example.com). Set the DOMAIN environment variable for your actual domain."
fi

# Check if email is set
if [ "$EMAIL" = "admin@example.com" ]; then
  log "warn" "Using default email (admin@example.com). Set the EMAIL environment variable for your actual email."
fi

# Create required directories
log "info" "Creating required directories..."
mkdir -p /home/yeab/Projects/certificate-verification_4/nginx/certbot/conf
mkdir -p /home/yeab/Projects/certificate-verification_4/nginx/certbot/www

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
  log "error" "Docker is not installed. Please install Docker first."
  exit 1
fi

# Determine staging or production mode
STAGING_ARG=""
if [ "$STAGING" = "true" ]; then
  STAGING_ARG="--staging"
  log "info" "Running in staging mode. Certificates won't be trusted by browsers."
else
  log "info" "Running in production mode. Real certificates will be issued."
fi

# Run Certbot to obtain certificates
log "info" "Obtaining certificates for $DOMAIN..."
docker run --rm \
  -v /home/yeab/Projects/certificate-verification_4/nginx/certbot/conf:/etc/letsencrypt \
  -v /home/yeab/Projects/certificate-verification_4/nginx/certbot/www:/var/www/certbot \
  certbot/certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email $EMAIL \
  --agree-tos --no-eff-email \
  -d $DOMAIN \
  $STAGING_ARG

# Create symbolic links to the certificates
log "info" "Creating symbolic links to the certificates..."
mkdir -p /home/yeab/Projects/certificate-verification_4/nginx/ssl
ln -sf /home/yeab/Projects/certificate-verification_4/nginx/certbot/conf/live/$DOMAIN/fullchain.pem /home/yeab/Projects/certificate-verification_4/nginx/ssl/cert.pem
ln -sf /home/yeab/Projects/certificate-verification_4/nginx/certbot/conf/live/$DOMAIN/privkey.pem /home/yeab/Projects/certificate-verification_4/nginx/ssl/key.pem

log "info" "Certificate setup completed successfully!"
log "info" "Next steps:"
log "info" "1. Update your Nginx configuration to use the certificates"
log "info" "2. Set up automatic renewal using the renew-certificates.sh script"