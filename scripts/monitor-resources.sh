#!/bin/bash
# Container Resource Monitoring Script
# This script monitors resource usage of Docker containers and sends alerts if thresholds are exceeded

# Configuration (can be overridden by environment variables)
THRESHOLD_CPU=${THRESHOLD_CPU:-80}  # CPU usage threshold in percent
THRESHOLD_MEM=${THRESHOLD_MEM:-80}  # Memory usage threshold in percent
SLACK_WEBHOOK_URL=${SLACK_WEBHOOK_URL:-""}
EMAIL_TO=${EMAIL_TO:-""}
CHECK_INTERVAL=${CHECK_INTERVAL:-300}  # Check every 5 minutes
LOG_FILE="./logs/resource-monitor.log"

# Create log directory if it doesn't exist
mkdir -p ./logs

# Function to send Slack notification
send_slack_notification() {
  local container=$1
  local resource=$2
  local usage=$3
  local threshold=$4
  
  if [ -n "$SLACK_WEBHOOK_URL" ]; then
    curl -s -X POST -H 'Content-type: application/json' \
      --data "{\"attachments\":[{\"color\":\"danger\",\"title\":\"Resource Alert\",\"text\":\"Container *$container* has high $resource usage: $usage% (threshold: $threshold%)\"}]}" \
      $SLACK_WEBHOOK_URL
  fi
}

# Function to send email notification
send_email_notification() {
  local container=$1
  local resource=$2
  local usage=$3
  local threshold=$4
  
  if [ -n "$EMAIL_TO" ]; then
    echo "Resource Alert: Container $container has high $resource usage: $usage% (threshold: $threshold%)" | \
    mail -s "Docker Resource Alert: $container" $EMAIL_TO
  fi
}

# Function to log message
log_message() {
  local message=$1
  echo "$(date '+%Y-%m-%d %H:%M:%S') - $message" >> $LOG_FILE
}

# Main monitoring loop
log_message "Starting resource monitoring with CPU threshold: $THRESHOLD_CPU%, Memory threshold: $THRESHOLD_MEM%"

while true; do
  # Get list of running containers in our application
  CONTAINERS=$(docker-compose ps --services | xargs)
  
  for CONTAINER in $CONTAINERS; do
    # Get container ID
    CONTAINER_ID=$(docker-compose ps -q $CONTAINER)
    
    if [ -z "$CONTAINER_ID" ]; then
      continue
    fi
    
    # Get CPU usage percentage
    CPU_USAGE=$(docker stats $CONTAINER_ID --no-stream --format "{{.CPUPerc}}" | sed 's/%//')
    
    # Get memory usage percentage
    MEM_USAGE=$(docker stats $CONTAINER_ID --no-stream --format "{{.MemPerc}}" | sed 's/%//')
    
    # Log current usage
    log_message "Container: $CONTAINER, CPU: $CPU_USAGE%, Memory: $MEM_USAGE%"
    
    # Check CPU threshold
    if (( $(echo "$CPU_USAGE > $THRESHOLD_CPU" | bc -l) )); then
      ALERT_MESSAGE="High CPU usage alert: Container $CONTAINER is using $CPU_USAGE% CPU (threshold: $THRESHOLD_CPU%)"
      log_message "$ALERT_MESSAGE"
      send_slack_notification "$CONTAINER" "CPU" "$CPU_USAGE" "$THRESHOLD_CPU"
      send_email_notification "$CONTAINER" "CPU" "$CPU_USAGE" "$THRESHOLD_CPU"
    fi
    
    # Check memory threshold
    if (( $(echo "$MEM_USAGE > $THRESHOLD_MEM" | bc -l) )); then
      ALERT_MESSAGE="High memory usage alert: Container $CONTAINER is using $MEM_USAGE% memory (threshold: $THRESHOLD_MEM%)"
      log_message "$ALERT_MESSAGE"
      send_slack_notification "$CONTAINER" "memory" "$MEM_USAGE" "$THRESHOLD_MEM"
      send_email_notification "$CONTAINER" "memory" "$MEM_USAGE" "$THRESHOLD_MEM"
    fi
  done
  
  # Wait for next check
  sleep $CHECK_INTERVAL
done