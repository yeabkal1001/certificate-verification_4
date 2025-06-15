#!/bin/bash

# Script to generate secure random secrets for production deployment
# Usage: ./scripts/generate-secrets.sh

echo "Generating secure secrets for production deployment..."

echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"
echo "JWT_SECRET=$(openssl rand -base64 32)"
echo "CERTIFICATE_SECRET=$(openssl rand -base64 32)"

echo ""
echo "Copy these values to your production environment variables."
echo "DO NOT store these in files that might be committed to the repository."
echo "Consider using a secrets management service for production."