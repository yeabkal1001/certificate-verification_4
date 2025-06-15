#!/bin/bash

# Health check script for Certificate Verification System
# This script checks the health of the application and its dependencies

echo "=== Certificate Verification System Health Check ==="
echo "Starting health check at $(date)"
echo "----------------------------------------"

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker."
    exit 1
else
    echo "✅ Docker is running."
fi

# Check if the application containers are running
if docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
    echo "✅ Application containers are running."
else
    echo "❌ Application containers are not running. Start them with: ./scripts/start-dev.sh"
    exit 1
fi

# Check PostgreSQL
if docker-compose -f docker-compose.dev.yml exec postgres pg_isready -U postgres &> /dev/null; then
    echo "✅ PostgreSQL is running and accepting connections."
else
    echo "❌ PostgreSQL is not healthy. Check the logs with: docker-compose -f docker-compose.dev.yml logs postgres"
    exit 1
fi

# Check Redis
if docker-compose -f docker-compose.dev.yml exec redis redis-cli ping | grep -q "PONG"; then
    echo "✅ Redis is running and accepting connections."
else
    echo "❌ Redis is not healthy. Check the logs with: docker-compose -f docker-compose.dev.yml logs redis"
    exit 1
fi

# Check the application
if curl -s http://localhost:3000/api/health | grep -q "healthy"; then
    echo "✅ Application is running and healthy."
else
    echo "❌ Application is not healthy. Check the logs with: docker-compose -f docker-compose.dev.yml logs app"
    exit 1
fi

echo "----------------------------------------"
echo "All systems are healthy! 🎉"
echo "----------------------------------------"