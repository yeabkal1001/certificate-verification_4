#!/bin/bash

# Start local development script for Certificate Verification System
# This script helps set up and run the development environment without Docker

echo "=== Certificate Verification System Local Development ==="
echo "Starting local development environment at $(date)"
echo "----------------------------------------"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js."
    exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "pnpm is not installed. Please install pnpm with 'npm install -g pnpm'."
    exit 1
fi

# Check if .env file exists, if not create it from example
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo "Creating .env file from .env.example..."
        cp .env.example .env
    else
        echo "No .env or .env.example file found. Creating default .env file..."
        cat > .env << EOL
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/certificate_verification?schema=public
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=certificate_verification

# Redis
REDIS_URL=redis://localhost:6379

# Next Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=development-secret-key-change-in-production

# JWT
JWT_SECRET=development-jwt-secret-key-change-in-production

# Certificate
CERTIFICATE_SECRET=development-certificate-secret-key-change-in-production

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
EOL
    fi
    echo "Created .env file with default values. Please update it with your own values if needed."
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "Installing dependencies..."
    pnpm install
else
    echo "Dependencies already installed."
fi

# Generate Prisma client
echo "Generating Prisma client..."
pnpm prisma generate

# Start the development server
echo "Starting development server..."
pnpm run dev

echo "----------------------------------------"
echo "Development server stopped at $(date)"
echo "----------------------------------------"