#!/bin/bash
# generate-self-signed.sh - Script to generate self-signed certificates for development

set -e

# Configuration variables
DOMAIN=${DOMAIN:-"localhost"}
CERT_DIR=${CERT_DIR:-"/home/yeab/Projects/certificate-verification_4/nginx/ssl"}
DAYS_VALID=${DAYS_VALID:-365}

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

# Create directory if it doesn't exist
mkdir -p "$CERT_DIR"

# Generate private key
log "info" "Generating private key..."
openssl genrsa -out "$CERT_DIR/key.pem" 2048

# Generate certificate signing request
log "info" "Generating certificate signing request..."
openssl req -new -key "$CERT_DIR/key.pem" -out "$CERT_DIR/csr.pem" -subj "/CN=$DOMAIN/O=Certificate Verification System/C=US"

# Generate self-signed certificate
log "info" "Generating self-signed certificate..."
openssl x509 -req -days "$DAYS_VALID" -in "$CERT_DIR/csr.pem" -signkey "$CERT_DIR/key.pem" -out "$CERT_DIR/cert.pem"

# Remove CSR file
rm "$CERT_DIR/csr.pem"

log "info" "Self-signed certificate generated successfully!"
log "info" "Certificate location: $CERT_DIR/cert.pem"
log "info" "Private key location: $CERT_DIR/key.pem"
log "info" "Certificate is valid for $DAYS_VALID days"
log "warn" "This is a self-signed certificate and should only be used for development"