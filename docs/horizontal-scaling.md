# Horizontal Scaling Implementation Guide

This document provides a comprehensive guide to the horizontal scaling implementation for the Certificate Verification System. It covers the architecture, configuration, and best practices for deploying and managing a distributed system.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Components](#components)
4. [Configuration](#configuration)
5. [Deployment](#deployment)
6. [Monitoring](#monitoring)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

## Overview

Horizontal scaling allows the Certificate Verification System to handle increased load by adding more application instances rather than increasing the resources of a single instance. This approach provides better fault tolerance, higher availability, and improved performance under load.

The implementation focuses on four key areas:
- Making the application stateless
- Configuring database connection pooling
- Implementing load balancing
- Testing under distributed deployment

## Architecture

The horizontally scaled architecture consists of:

1. **Load Balancer (Nginx)**: Distributes incoming requests across multiple application instances
2. **Application Instances**: Multiple stateless Next.js application containers
3. **Shared Redis**: Central Redis instance for session storage and caching
4. **Database**: PostgreSQL with connection pooling
5. **Monitoring**: Centralized logging and metrics collection

```
                           ┌─────────────┐
                           │    Nginx    │
                           │Load Balancer│
                           └──────┬──────┘
                                  │
                 ┌────────────────┼────────────────┐
                 │                │                │
        ┌────────▼─────┐  ┌───────▼──────┐  ┌──────▼───────┐
        │  App Instance │  │ App Instance │  │ App Instance │
        │     (app1)    │  │    (app2)    │  │    (app3)    │
        └────────┬─────┘  └───────┬──────┘  └──────┬───────┘
                 │                │                │
                 └────────────────┼────────────────┘
                                  │
                 ┌────────────────┼────────────────┐
                 │                │                │
        ┌────────▼─────┐  ┌───────▼──────┐
        │     Redis     │  │  PostgreSQL  │
        │  (Shared Cache)│  │  (Database)  │
        └──────────────┘  └──────────────┘
```

## Components

### 1. Stateless Application

The application has been made stateless by:
- Moving session storage to Redis
- Implementing a Redis client pool for better connection management
- Using distributed caching with cross-instance invalidation
- Ensuring no local state is used for critical operations

### 2. Database Connection Pooling

Database connections are managed through:
- Prisma connection pool configuration
- PostgreSQL connection pooling settings
- Connection limit management per instance

### 3. Load Balancing

Load balancing is implemented using:
- Nginx with least connections algorithm
- Health checks for automatic failover
- Optional sticky sessions for specific use cases
- Connection keepalive for better performance

### 4. Instance Management

Each application instance:
- Has a unique instance ID
- Reports its health and status
- Participates in distributed caching
- Can be monitored individually

## Configuration

### Environment Variables

The following environment variables control the scaling behavior:

| Variable | Description | Default |
|----------|-------------|---------|
| `INSTANCE_ID` | Unique identifier for each instance | Auto-generated |
| `PRISMA_CONNECTION_LIMIT` | Maximum database connections per instance | 10 |
| `REDIS_MAX_CLIENTS` | Maximum Redis clients per instance | 5 |
| `REDIS_URL` | URL for the shared Redis instance | redis://redis:6379 |
| `DATABASE_URL` | PostgreSQL connection string | postgresql://postgres:postgres@postgres:5432/certificate_verification |

### Nginx Configuration

The Nginx configuration in `nginx/conf.d/default.conf` includes:
- Upstream server group for load balancing
- Health check endpoints
- Proxy settings for distributed deployment
- Cache configuration for static assets and API responses

### Redis Configuration

Redis is configured for:
- Session storage
- Distributed caching
- Cache invalidation across instances
- Connection pooling

### PostgreSQL Configuration

PostgreSQL is configured with:
- Connection pooling
- Performance tuning for multiple clients
- Query optimization

## Deployment

### Prerequisites

- Docker and Docker Compose
- Sufficient system resources for multiple instances
- Network configuration for inter-service communication

### Deployment Steps

1. Build the application image:
   ```bash
   npm run docker:build
   ```

2. Start the distributed deployment:
   ```bash
   npm run scale:up
   ```

3. Check the status of all services:
   ```bash
   npm run scale:status
   ```

4. Test the deployment:
   ```bash
   npm run scale:test
   ```

### Scaling

To adjust the number of instances:

1. Modify the `docker-compose.yml` file to add or remove application instances
2. Update the Nginx configuration in `nginx/conf.d/default.conf` to include the new instances
3. Restart the services:
   ```bash
   npm run scale:down
   npm run scale:up
   ```

## Monitoring

### Health Checks

Each instance exposes a health check endpoint at `/api/health` that provides:
- Instance ID and system information
- Service status (database, Redis, API)
- Resource usage metrics

The combined instance information is available at `/api/instances`.

### Metrics

The system collects the following metrics:
- Request count and latency per instance
- Database connection usage
- Redis client pool statistics
- System resource utilization

### Logs

Logs from all instances are centralized and include the instance ID for correlation.

## Troubleshooting

### Common Issues

1. **Load Balancer Not Distributing Requests**
   - Check Nginx configuration
   - Verify all instances are healthy
   - Check network connectivity between services

2. **Session Persistence Issues**
   - Verify Redis connection from all instances
   - Check session configuration
   - Ensure cookies are properly configured

3. **Database Connection Errors**
   - Check connection pool configuration
   - Verify maximum connections setting in PostgreSQL
   - Monitor connection usage across instances

4. **Cache Inconsistency**
   - Check Redis pub/sub for cache invalidation
   - Verify cache keys include proper namespacing
   - Check for Redis connectivity issues

### Diagnostic Commands

```bash
# Check all instance health
npm run scale:health

# Monitor instances in real-time
npm run scale:monitor

# View logs from all instances
npm run scale:logs

# Test load balancing
bash scripts/test-distributed-deployment.sh
```

## Best Practices

1. **Instance Configuration**
   - Keep instances identical (same code, configuration)
   - Use environment variables for instance-specific settings
   - Implement proper health checks

2. **Database Management**
   - Monitor connection pool usage
   - Implement query timeouts
   - Use read replicas for scaling read operations (future enhancement)

3. **Caching Strategy**
   - Use distributed caching with invalidation
   - Implement proper TTLs based on data volatility
   - Consider cache stampede protection for high-traffic items

4. **Load Balancing**
   - Use health checks for automatic failover
   - Consider sticky sessions only when necessary
   - Monitor request distribution across instances

5. **Monitoring and Alerting**
   - Set up alerts for instance failures
   - Monitor resource usage across all instances
   - Track request latency and error rates per instance

## Conclusion

The horizontal scaling implementation provides a robust foundation for scaling the Certificate Verification System to handle increased load. By following the guidelines in this document, you can deploy, manage, and troubleshoot a distributed deployment effectively.

For further assistance or to report issues, please contact the system administrators.