# Resource Management

This document outlines the resource management strategy for the Certificate Verification System.

## Resource Limits

The system implements resource limits for all containers to ensure:

1. **Predictable Performance**: By allocating appropriate resources to each service
2. **Stability**: By preventing any single container from consuming all available resources
3. **Efficient Resource Utilization**: By setting appropriate reservations and limits
4. **Cost Optimization**: By right-sizing container resources

## Container Resource Configuration

### Application (Node.js)

| Resource | Reservation | Limit | Environment Variable |
|----------|-------------|-------|---------------------|
| CPU | 0.1 cores | 0.5 cores | APP_CPU_RESERVATION, APP_CPU_LIMIT |
| Memory | 128 MB | 512 MB | APP_MEMORY_RESERVATION, APP_MEMORY_LIMIT |

### Database (PostgreSQL)

| Resource | Reservation | Limit | Environment Variable |
|----------|-------------|-------|---------------------|
| CPU | 0.2 cores | 1.0 cores | DB_CPU_RESERVATION, DB_CPU_LIMIT |
| Memory | 256 MB | 1 GB | DB_MEMORY_RESERVATION, DB_MEMORY_LIMIT |

### Cache (Redis)

| Resource | Reservation | Limit | Environment Variable |
|----------|-------------|-------|---------------------|
| CPU | 0.1 cores | 0.3 cores | REDIS_CPU_RESERVATION, REDIS_CPU_LIMIT |
| Memory | 64 MB | 256 MB | REDIS_MEMORY_RESERVATION, REDIS_MEMORY_LIMIT |

### Web Server (Nginx)

| Resource | Reservation | Limit | Environment Variable |
|----------|-------------|-------|---------------------|
| CPU | 0.1 cores | 0.3 cores | NGINX_CPU_RESERVATION, NGINX_CPU_LIMIT |
| Memory | 64 MB | 128 MB | NGINX_MEMORY_RESERVATION, NGINX_MEMORY_LIMIT |

## Database Performance Tuning

PostgreSQL is configured with performance parameters based on available resources:

| Parameter | Value | Description |
|-----------|-------|-------------|
| shared_buffers | 25% of RAM | Memory used for shared memory buffers |
| work_mem | 3% of RAM | Memory used for query operations |
| maintenance_work_mem | 6% of RAM | Memory used for maintenance operations |
| effective_cache_size | 50% of RAM | Planner's assumption about disk cache |
| max_connections | 100 | Maximum number of concurrent connections |

These parameters are automatically calculated based on the container's available memory.

## Redis Configuration

Redis is configured with memory limits and eviction policies:

| Parameter | Value | Description |
|-----------|-------|-------------|
| maxmemory | 100 MB | Maximum memory Redis can use |
| maxmemory-policy | allkeys-lru | Eviction policy when memory limit is reached |

## Health Monitoring

All containers have health checks configured:

| Service | Health Check | Interval | Timeout | Retries |
|---------|--------------|----------|---------|---------|
| Application | HTTP GET /api/health | 30s | 5s | 3 |
| Database | pg_isready | 10s | 5s | 5 |
| Redis | redis-cli ping | 10s | 5s | 5 |
| Nginx | HTTP GET /health | 30s | 5s | 3 |

## Resource Monitoring

The system includes a resource monitoring service that:

1. Monitors CPU and memory usage of all containers
2. Sends alerts when usage exceeds defined thresholds
3. Logs resource usage for historical analysis

### Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| THRESHOLD_CPU | 80% | CPU usage threshold for alerts |
| THRESHOLD_MEM | 80% | Memory usage threshold for alerts |
| CHECK_INTERVAL | 300s | Interval between checks |
| SLACK_WEBHOOK_URL | - | Slack webhook for notifications |
| EMAIL_TO | - | Email address for notifications |

## Testing Resource Constraints

The system includes a script to test application behavior under resource constraints:

```bash
# Test app service with limited CPU
./scripts/test-resource-limits.sh --service app --cpu 0.2 --duration 300

# Test all services with limited memory
./scripts/test-resource-limits.sh --memory 128M --duration 300
```

## Best Practices

1. **Monitor Resource Usage**: Regularly review resource usage to identify optimization opportunities
2. **Scale Appropriately**: Adjust resource limits based on actual usage patterns
3. **Test Under Constraints**: Periodically test the application under resource constraints
4. **Set Alerts**: Configure alerts for resource usage thresholds
5. **Right-size Resources**: Allocate resources based on actual needs, not theoretical maximums

## Scaling Considerations

For higher loads, consider:

1. **Horizontal Scaling**: Add more application instances behind a load balancer
2. **Database Scaling**: Implement read replicas for PostgreSQL
3. **Cache Optimization**: Increase Redis memory and implement proper caching strategies
4. **Resource Adjustment**: Increase resource limits for bottleneck services