# Certificate Verification System Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying and operating the Certificate Verification System in various environments. It covers prerequisites, installation steps, configuration options, and operational procedures.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Deployment Options](#deployment-options)
3. [Environment Configuration](#environment-configuration)
4. [Docker Deployment](#docker-deployment)
5. [Manual Deployment](#manual-deployment)
6. [SSL Certificate Setup](#ssl-certificate-setup)
7. [Database Setup](#database-setup)
8. [Monitoring Setup](#monitoring-setup)
9. [Scaling Configuration](#scaling-configuration)
10. [Backup and Recovery](#backup-and-recovery)
11. [Maintenance Procedures](#maintenance-procedures)
12. [Troubleshooting](#troubleshooting)

## Prerequisites

### Hardware Requirements

- **Minimum Requirements**:
  - CPU: 2 cores
  - RAM: 4 GB
  - Storage: 20 GB SSD
  - Network: 100 Mbps

- **Recommended Requirements**:
  - CPU: 4+ cores
  - RAM: 8+ GB
  - Storage: 50+ GB SSD
  - Network: 1 Gbps

### Software Requirements

- Docker and Docker Compose (for containerized deployment)
- Node.js v16+ (for manual deployment)
- PostgreSQL v14+ (for manual deployment)
- Redis v6+ (for manual deployment)
- Nginx (for manual deployment)
- Let's Encrypt Certbot (for SSL certificates)

### Network Requirements

- Open ports:
  - 80 (HTTP)
  - 443 (HTTPS)
  - 5432 (PostgreSQL, internal only)
  - 6379 (Redis, internal only)
  - 9090, 9100, 3000 (Monitoring, internal only)

## Deployment Options

The Certificate Verification System can be deployed in several ways:

1. **Docker Deployment (Recommended)**:
   - Uses Docker and Docker Compose
   - Simplifies setup and maintenance
   - Provides consistent environments
   - Supports easy scaling

2. **Manual Deployment**:
   - Direct installation on the host
   - More control over configuration
   - Requires more setup and maintenance

3. **Cloud Deployment**:
   - AWS, Azure, GCP
   - Uses container orchestration (Kubernetes, ECS)
   - Provides managed services for databases and caching

## Environment Configuration

The system is configured using environment variables. Create a `.env` file based on the provided `.env.example`:

```bash
# Copy the example environment file
cp .env.example .env

# Edit the environment file
nano .env
```

### Critical Environment Variables

```
# Database
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/certificate_verification?schema=public"

# NextAuth
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-nextauth-secret-key-change-in-production"

# JWT
JWT_SECRET="your-jwt-secret-key-change-in-production"

# Certificate Verification
CERTIFICATE_SECRET="your-certificate-signing-secret-change-in-production"
QR_CODE_BASE_URL="https://your-domain.com/verify"

# Security Configuration
CORS_ALLOWED_ORIGINS=https://your-domain.com
CSRF_TOKEN_EXPIRY=3600
```

### Generate Secure Secrets

Use the provided script to generate secure random secrets:

```bash
./scripts/generate-secrets.sh
```

This will update your `.env` file with secure random values for:
- `NEXTAUTH_SECRET`
- `JWT_SECRET`
- `CERTIFICATE_SECRET`

### Validate Environment Configuration

Validate your environment configuration:

```bash
npm run validate:env
```

## Docker Deployment

### Prerequisites

- Docker Engine v20.10+
- Docker Compose v2.0+

### Deployment Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-org/certificate-verification.git
   cd certificate-verification
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ./scripts/generate-secrets.sh
   ```

3. **Build and start the containers**:
   ```bash
   docker-compose build
   docker-compose up -d
   ```

4. **Initialize the database**:
   ```bash
   docker-compose exec app npx prisma migrate deploy
   docker-compose exec app npx prisma db seed
   ```

5. **Verify the deployment**:
   ```bash
   docker-compose ps
   curl http://localhost/api/health
   ```

### Docker Compose Configuration

The system uses multiple Docker Compose files for different purposes:

- `docker-compose.yml`: Main configuration for production
- `docker-compose.debug.yml`: Configuration for development with debugging
- `docker-compose.monitoring.yml`: Configuration for monitoring stack
- `docker-compose.backup.yml`: Configuration for database backup service

To use a specific configuration:

```bash
# Production with monitoring
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d

# Production with backup service
docker-compose -f docker-compose.yml -f docker-compose.backup.yml up -d

# Development with debugging
docker-compose -f docker-compose.yml -f docker-compose.debug.yml up -d
```

## Manual Deployment

### Prerequisites

- Node.js v16+
- PostgreSQL v14+
- Redis v6+
- Nginx

### Deployment Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-org/certificate-verification.git
   cd certificate-verification
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ./scripts/generate-secrets.sh
   ```

4. **Build the application**:
   ```bash
   npm run build
   ```

5. **Initialize the database**:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

6. **Start the application**:
   ```bash
   npm start
   ```

7. **Configure Nginx**:
   ```bash
   # Copy the Nginx configuration
   sudo cp nginx/conf.d/default.conf /etc/nginx/conf.d/certificate-verification.conf
   
   # Edit the configuration
   sudo nano /etc/nginx/conf.d/certificate-verification.conf
   
   # Test and reload Nginx
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### Process Management

For production deployments, use a process manager like PM2:

```bash
# Install PM2
npm install -g pm2

# Start the application with PM2
pm2 start npm --name "certificate-verification" -- start

# Configure PM2 to start on boot
pm2 startup
pm2 save
```

## SSL Certificate Setup

### Using Let's Encrypt (Recommended)

1. **Install Certbot**:
   ```bash
   sudo apt-get update
   sudo apt-get install certbot python3-certbot-nginx
   ```

2. **Obtain certificates**:
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

3. **Configure auto-renewal**:
   ```bash
   sudo systemctl status certbot.timer
   ```

### Using Self-Signed Certificates (Development Only)

1. **Generate self-signed certificates**:
   ```bash
   ./scripts/ssl-management/generate-self-signed.sh your-domain.com
   ```

2. **Configure Nginx to use the certificates**:
   ```bash
   # Edit the Nginx configuration
   sudo nano /etc/nginx/conf.d/certificate-verification.conf
   
   # Update SSL certificate paths
   # ssl_certificate /path/to/your-domain.com.crt;
   # ssl_certificate_key /path/to/your-domain.com.key;
   
   # Test and reload Nginx
   sudo nginx -t
   sudo systemctl reload nginx
   ```

## Database Setup

### PostgreSQL Configuration

1. **Configure PostgreSQL**:
   ```bash
   # Apply optimized PostgreSQL configuration
   ./scripts/db-config/01-configure-postgres.sh
   ```

2. **Create the database and user**:
   ```bash
   sudo -u postgres psql
   
   CREATE DATABASE certificate_verification;
   CREATE USER certuser WITH ENCRYPTED PASSWORD 'your-password';
   GRANT ALL PRIVILEGES ON DATABASE certificate_verification TO certuser;
   
   \q
   ```

3. **Update environment variables**:
   ```bash
   # Update DATABASE_URL in .env
   DATABASE_URL="postgresql://certuser:your-password@localhost:5432/certificate_verification?schema=public"
   ```

### Database Migration and Seeding

1. **Run database migrations**:
   ```bash
   npx prisma migrate deploy
   ```

2. **Seed the database with initial data**:
   ```bash
   npx prisma db seed
   ```

## Monitoring Setup

### Prometheus, Loki, and Grafana

1. **Start the monitoring stack**:
   ```bash
   docker-compose -f docker-compose.monitoring.yml up -d
   ```

2. **Access Grafana**:
   - URL: http://your-domain.com:3000
   - Default credentials: admin/admin

3. **Configure alerting**:
   ```bash
   # Edit alerting configuration
   nano monitoring/alertmanager/config/alertmanager.yml
   
   # Restart Alertmanager
   docker-compose -f docker-compose.monitoring.yml restart alertmanager
   ```

### Exporters Configuration

1. **Configure exporters**:
   ```bash
   docker-compose -f docker-compose.exporters.yml up -d
   ```

2. **Verify exporter metrics**:
   ```bash
   # Node Exporter
   curl http://localhost:9100/metrics
   
   # PostgreSQL Exporter
   curl http://localhost:9187/metrics
   
   # Redis Exporter
   curl http://localhost:9121/metrics
   
   # Nginx Exporter
   curl http://localhost:9113/metrics
   ```

## Scaling Configuration

### Horizontal Scaling

1. **Configure for horizontal scaling**:
   ```bash
   # Edit docker-compose.yml to add more app instances
   nano docker-compose.yml
   
   # Update the app service to use multiple replicas
   # app:
   #   deploy:
   #     replicas: 3
   ```

2. **Configure Nginx for load balancing**:
   ```bash
   # Edit Nginx configuration
   nano nginx/conf.d/default.conf
   
   # Ensure upstream configuration is correct
   # upstream app_servers {
   #   server app-1:3000;
   #   server app-2:3000;
   #   server app-3:3000;
   # }
   ```

3. **Test distributed deployment**:
   ```bash
   ./scripts/test-distributed-deployment.sh
   ```

### Database Connection Pooling

1. **Configure Prisma connection pooling**:
   ```bash
   # Update environment variables in .env
   PRISMA_CONNECTION_LIMIT=10
   PRISMA_CONNECTION_TIMEOUT=15000
   PRISMA_POOL_TIMEOUT=10000
   PRISMA_IDLE_TIMEOUT=60000
   ```

### Redis Client Pool

1. **Configure Redis client pool**:
   ```bash
   # Update environment variables in .env
   REDIS_POOL_MIN_SIZE=5
   REDIS_POOL_MAX_SIZE=20
   ```

## Backup and Recovery

### Database Backup

1. **Configure scheduled backups**:
   ```bash
   ./scripts/db-backup/schedule-backups.sh
   ```

2. **Verify backup configuration**:
   ```bash
   crontab -l
   ```

3. **Test backup and restore**:
   ```bash
   ./scripts/db-backup/test-backup-restore.sh
   ```

### Manual Backup

1. **Create a manual backup**:
   ```bash
   ./scripts/db-backup/backup.sh
   ```

2. **Verify the backup**:
   ```bash
   ./scripts/db-backup/verify.sh /path/to/backup/file.sql.gz
   ```

### Restore from Backup

1. **Restore from a backup**:
   ```bash
   ./scripts/db-backup/restore.sh /path/to/backup/file.sql.gz
   ```

## Maintenance Procedures

### Regular Maintenance Tasks

1. **Database optimization**:
   ```bash
   # Run database optimization script
   ./scripts/optimize-database.js
   ```

2. **Certificate cleanup**:
   ```bash
   # Archive expired certificates
   npm run certificates:archive-expired
   ```

3. **Log rotation**:
   ```bash
   # Rotate logs
   npm run logs:rotate
   ```

### Updating the Application

1. **Update the codebase**:
   ```bash
   git pull
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run database migrations**:
   ```bash
   npx prisma migrate deploy
   ```

4. **Build the application**:
   ```bash
   npm run build
   ```

5. **Restart the application**:
   ```bash
   # With Docker
   docker-compose restart app
   
   # With PM2
   pm2 restart certificate-verification
   ```

### Monitoring Resources

1. **Check system resources**:
   ```bash
   ./scripts/monitor-resources.sh
   ```

2. **View application logs**:
   ```bash
   # With Docker
   docker-compose logs -f app
   
   # With PM2
   pm2 logs certificate-verification
   ```

## Troubleshooting

### Common Issues

1. **Database Connection Issues**:
   ```bash
   # Check database connection
   npx prisma db execute --stdin < /dev/null
   
   # Check PostgreSQL logs
   sudo tail -f /var/log/postgresql/postgresql-14-main.log
   ```

2. **Redis Connection Issues**:
   ```bash
   # Check Redis connection
   redis-cli ping
   
   # Check Redis logs
   sudo tail -f /var/log/redis/redis-server.log
   ```

3. **Application Startup Issues**:
   ```bash
   # Check application logs
   docker-compose logs app
   
   # Check for environment issues
   npm run validate:env
   ```

4. **Nginx Configuration Issues**:
   ```bash
   # Test Nginx configuration
   sudo nginx -t
   
   # Check Nginx logs
   sudo tail -f /var/log/nginx/error.log
   ```

### Health Checks

1. **API Health Check**:
   ```bash
   curl http://your-domain.com/api/health
   ```

2. **Database Health Check**:
   ```bash
   curl http://your-domain.com/api/db-stats
   ```

3. **Instance Health Check**:
   ```bash
   curl http://your-domain.com/api/instances
   ```

### Performance Issues

1. **Identify slow queries**:
   ```bash
   # Check slow query log
   sudo tail -f /var/log/postgresql/postgresql-14-main-slow.log
   ```

2. **Check API response times**:
   ```bash
   # Use curl with timing information
   curl -w "@curl-format.txt" -o /dev/null -s http://your-domain.com/api/health
   ```

3. **Run performance tests**:
   ```bash
   # Test database performance
   ./scripts/test-db-performance.js
   
   # Test caching performance
   ./scripts/test-caching.js
   ```

## Conclusion

This deployment guide covers the essential steps for deploying and operating the Certificate Verification System. For more detailed information on specific components, refer to the following documentation:

- [Architecture Documentation](./architecture.md)
- [API Documentation](./api.md)
- [Database Backup and Recovery](./database-backup.md)
- [Monitoring](./monitoring.md)
- [SSL Certificate Management](./ssl-management.md)
- [Horizontal Scaling](./horizontal-scaling.md)
- [API Security](./api-security.md)