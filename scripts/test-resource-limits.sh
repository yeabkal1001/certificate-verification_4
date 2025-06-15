#!/bin/bash
# Script to test application under resource constraints
# This script temporarily reduces resource limits to test application behavior

# Save current directory
CURRENT_DIR=$(pwd)

# Function to display usage information
usage() {
  echo "Usage: $0 [OPTIONS]"
  echo "Test the application under resource constraints"
  echo ""
  echo "Options:"
  echo "  --cpu LIMIT     Set CPU limit (e.g., 0.2 for 20% of a CPU core)"
  echo "  --memory LIMIT  Set memory limit (e.g., 128M for 128 MB)"
  echo "  --duration SEC  Test duration in seconds (default: 300)"
  echo "  --service NAME  Specific service to test (default: all)"
  echo "  --help          Display this help message"
  exit 1
}

# Parse command line arguments
CPU_LIMIT=""
MEMORY_LIMIT=""
DURATION=300
SERVICE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --cpu)
      CPU_LIMIT="$2"
      shift 2
      ;;
    --memory)
      MEMORY_LIMIT="$2"
      shift 2
      ;;
    --duration)
      DURATION="$2"
      shift 2
      ;;
    --service)
      SERVICE="$2"
      shift 2
      ;;
    --help)
      usage
      ;;
    *)
      echo "Unknown option: $1"
      usage
      ;;
  esac
done

# Validate arguments
if [ -z "$CPU_LIMIT" ] && [ -z "$MEMORY_LIMIT" ]; then
  echo "Error: At least one of --cpu or --memory must be specified"
  usage
fi

# Create temporary docker-compose override file
TMP_OVERRIDE="docker-compose.override.yml"

cat > $TMP_OVERRIDE << EOF
version: '3.8'

services:
EOF

# Add service configurations
if [ -n "$SERVICE" ]; then
  # Configure specific service
  cat >> $TMP_OVERRIDE << EOF
  $SERVICE:
    deploy:
      resources:
        limits:
EOF
  
  if [ -n "$CPU_LIMIT" ]; then
    echo "          cpus: '$CPU_LIMIT'" >> $TMP_OVERRIDE
  fi
  
  if [ -n "$MEMORY_LIMIT" ]; then
    echo "          memory: '$MEMORY_LIMIT'" >> $TMP_OVERRIDE
  fi
else
  # Configure all services
  for SVC in app postgres redis nginx; do
    cat >> $TMP_OVERRIDE << EOF
  $SVC:
    deploy:
      resources:
        limits:
EOF
    
    if [ -n "$CPU_LIMIT" ]; then
      echo "          cpus: '$CPU_LIMIT'" >> $TMP_OVERRIDE
    fi
    
    if [ -n "$MEMORY_LIMIT" ]; then
      echo "          memory: '$MEMORY_LIMIT'" >> $TMP_OVERRIDE
    fi
  done
fi

echo "Created temporary override file with the following resource constraints:"
if [ -n "$CPU_LIMIT" ]; then
  echo "- CPU limit: $CPU_LIMIT cores"
fi

if [ -n "$MEMORY_LIMIT" ]; then
  echo "- Memory limit: $MEMORY_LIMIT"
fi

echo "- Test duration: $DURATION seconds"
if [ -n "$SERVICE" ]; then
  echo "- Target service: $SERVICE"
else
  echo "- Target services: all"
fi

# Confirm before proceeding
read -p "Do you want to proceed with the test? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Test cancelled."
  rm $TMP_OVERRIDE
  exit 0
fi

# Apply resource constraints
echo "Applying resource constraints..."
docker-compose -f docker-compose.yml -f $TMP_OVERRIDE up -d

# Monitor application during test
echo "Monitoring application for $DURATION seconds..."
START_TIME=$(date +%s)
END_TIME=$((START_TIME + DURATION))

while [ $(date +%s) -lt $END_TIME ]; do
  REMAINING=$((END_TIME - $(date +%s)))
  echo "Test in progress... $REMAINING seconds remaining"
  
  # Check container health
  docker-compose ps
  
  # Show resource usage
  if [ -n "$SERVICE" ]; then
    docker stats --no-stream $(docker-compose ps -q $SERVICE)
  else
    docker stats --no-stream $(docker-compose ps -q)
  fi
  
  # Wait before next check
  sleep 10
done

# Restore normal configuration
echo "Test completed. Restoring normal configuration..."
rm $TMP_OVERRIDE
docker-compose up -d

echo "Resource constraint test completed successfully."
exit 0