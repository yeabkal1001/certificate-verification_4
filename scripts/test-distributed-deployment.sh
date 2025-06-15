#!/bin/bash
# Test script for distributed deployment
# This script tests the application under distributed deployment

# Set colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting distributed deployment test...${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}Error: Docker is not running. Please start Docker and try again.${NC}"
  exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose > /dev/null 2>&1; then
  echo -e "${RED}Error: Docker Compose is not installed. Please install Docker Compose and try again.${NC}"
  exit 1
fi

# Function to check if a service is healthy
check_service_health() {
  local service=$1
  local max_attempts=$2
  local attempt=1
  
  echo -e "${YELLOW}Checking health of $service (max attempts: $max_attempts)...${NC}"
  
  while [ $attempt -le $max_attempts ]; do
    if docker-compose ps $service | grep -q "Up (healthy)"; then
      echo -e "${GREEN}$service is healthy!${NC}"
      return 0
    fi
    
    echo -e "${YELLOW}Attempt $attempt/$max_attempts: $service is not healthy yet. Waiting...${NC}"
    sleep 5
    attempt=$((attempt + 1))
  done
  
  echo -e "${RED}$service failed to become healthy after $max_attempts attempts.${NC}"
  return 1
}

# Start the application with multiple instances
echo -e "${YELLOW}Starting application with multiple instances...${NC}"
docker-compose up -d

# Wait for services to be healthy
echo -e "${YELLOW}Waiting for services to be healthy...${NC}"
check_service_health postgres 12 || exit 1
check_service_health redis 6 || exit 1
check_service_health app1 12 || exit 1
check_service_health app2 12 || exit 1
check_service_health app3 12 || exit 1
check_service_health nginx 6 || exit 1

echo -e "${GREEN}All services are healthy!${NC}"

# Test load balancing by making requests to the API
echo -e "${YELLOW}Testing load balancing...${NC}"
echo -e "${YELLOW}Making 10 requests to the API to verify load balancing...${NC}"

for i in {1..10}; do
  echo -e "${YELLOW}Request $i:${NC}"
  curl -s -k https://localhost/api/health | grep -o '"id":"[^"]*"' || echo "Failed to get instance ID"
  sleep 1
done

# Test session persistence
echo -e "${YELLOW}Testing session persistence across instances...${NC}"
echo -e "${YELLOW}This test requires manual verification by checking the logs.${NC}"

# Check Redis for shared session data
echo -e "${YELLOW}Checking Redis for shared session data...${NC}"
docker-compose exec redis redis-cli KEYS "*session*" | wc -l

# Test database connection pooling
echo -e "${YELLOW}Testing database connection pooling...${NC}"
echo -e "${YELLOW}Checking active database connections...${NC}"
docker-compose exec postgres psql -U postgres -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"

# Generate some load to test scaling
echo -e "${YELLOW}Generating load to test scaling...${NC}"
echo -e "${YELLOW}Making 100 concurrent requests to the API...${NC}"

if command -v ab > /dev/null 2>&1; then
  ab -n 100 -c 10 -k https://localhost/api/health
else
  echo -e "${YELLOW}Apache Bench (ab) not found. Skipping load test.${NC}"
  echo -e "${YELLOW}You can install it with: apt-get install apache2-utils${NC}"
  
  # Alternative: use curl in a loop
  for i in {1..30}; do
    curl -s -k https://localhost/api/health > /dev/null &
  done
  wait
fi

# Check instance health
echo -e "${YELLOW}Checking instance health...${NC}"
curl -s -k https://localhost/api/health | grep -o '"status":"[^"]*"'

# Print summary
echo -e "${GREEN}Distributed deployment test completed!${NC}"
echo -e "${YELLOW}To stop the application, run: docker-compose down${NC}"

exit 0