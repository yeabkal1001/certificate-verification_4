#!/bin/bash

# Start development environment script for Certificate Verification System
# This script helps set up and run the development environment

echo "=== Certificate Verification System Development Environment ==="
echo "Starting development environment at $(date)"
echo "----------------------------------------"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker and Docker Compose."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose is not installed. Please install Docker Compose."
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

# Start the development environment
echo "Starting Docker containers..."
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 5

# Check if services are running
echo "Checking if services are running..."
if ! docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
    echo "Error: Services failed to start. Please check the logs with 'docker-compose -f docker-compose.dev.yml logs'."
    exit 1
fi

echo "----------------------------------------"
echo "Development environment is ready!"
echo "The application is running at: http://localhost:3000"
echo "----------------------------------------"
echo "Useful commands:"
echo "- View logs: docker-compose -f docker-compose.dev.yml logs -f"
echo "- Stop environment: docker-compose -f docker-compose.dev.yml down"
echo "- Restart environment: docker-compose -f docker-compose.dev.yml restart"
echo "----------------------------------------"