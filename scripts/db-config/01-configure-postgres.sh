#!/bin/bash
# PostgreSQL performance tuning script
# This script configures PostgreSQL for optimal performance based on container resources

# Get available memory in MB
TOTAL_MEM_MB=$(free -m | grep Mem | awk '{print $2}')

# Calculate memory parameters based on available memory
# These are conservative settings that work well for most workloads
SHARED_BUFFERS=${POSTGRES_SHARED_BUFFERS:-"$(( TOTAL_MEM_MB / 4 ))MB"}
WORK_MEM=${POSTGRES_WORK_MEM:-"$(( TOTAL_MEM_MB / 32 ))MB"}
MAINTENANCE_WORK_MEM=${POSTGRES_MAINTENANCE_WORK_MEM:-"$(( TOTAL_MEM_MB / 16 ))MB"}
EFFECTIVE_CACHE_SIZE=${POSTGRES_EFFECTIVE_CACHE_SIZE:-"$(( TOTAL_MEM_MB / 2 ))MB"}
MAX_CONNECTIONS=${POSTGRES_MAX_CONNECTIONS:-100}

# Create a custom PostgreSQL configuration
cat <<EOF >> /var/lib/postgresql/data/postgresql.conf

# Custom performance settings
shared_buffers = $SHARED_BUFFERS
work_mem = $WORK_MEM
maintenance_work_mem = $MAINTENANCE_WORK_MEM
effective_cache_size = $EFFECTIVE_CACHE_SIZE
max_connections = $MAX_CONNECTIONS

# Connection settings
listen_addresses = '*'
max_connections = $MAX_CONNECTIONS
superuser_reserved_connections = 3

# Query tuning
random_page_cost = 1.1
effective_io_concurrency = 200

# Logging settings
log_min_duration_statement = 1000  # Log queries taking more than 1 second
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on
log_temp_files = 0
log_autovacuum_min_duration = 0
log_error_verbosity = default

# Autovacuum settings
autovacuum = on
autovacuum_max_workers = 3
autovacuum_naptime = 1min
autovacuum_vacuum_threshold = 50
autovacuum_analyze_threshold = 50

# Write-Ahead Log settings
wal_buffers = 16MB
checkpoint_timeout = 15min
checkpoint_completion_target = 0.9
EOF

echo "PostgreSQL configuration updated with optimized settings"
echo "shared_buffers = $SHARED_BUFFERS"
echo "work_mem = $WORK_MEM"
echo "maintenance_work_mem = $MAINTENANCE_WORK_MEM"
echo "effective_cache_size = $EFFECTIVE_CACHE_SIZE"
echo "max_connections = $MAX_CONNECTIONS"