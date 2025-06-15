# Certificate Verification System

A secure and scalable system for issuing, managing, and verifying digital certificates.

## Features

- Secure certificate issuance and verification
- QR code generation for easy verification
- Role-based access control (Admin, Staff, Student)
- Certificate templates management
- Audit logging for all operations
- Responsive design for all devices

## Getting Started

### Prerequisites

- Node.js 18 or later
- Docker and Docker Compose
- PostgreSQL 15 (or use the Docker Compose setup)
- Redis (or use the Docker Compose setup)

### Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/certificate-verification.git
   cd certificate-verification
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

4. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

5. Start the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Using Docker Compose (Recommended)

1. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. Run the development setup script:
   ```bash
   ./scripts/start-dev.sh
   ```
   
   This script will:
   - Create a default `.env` file if one doesn't exist
   - Start the Docker containers (Next.js app, PostgreSQL, Redis)
   - Verify that all services are running correctly

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

4. Useful Docker commands:
   ```bash
   # View logs
   docker-compose -f docker-compose.dev.yml logs -f
   
   # Stop the environment
   docker-compose -f docker-compose.dev.yml down
   
   # Restart the environment
   docker-compose -f docker-compose.dev.yml restart
   ```

## Production Deployment

### Secrets Management

For production deployment, secure secrets management is essential. See [Secrets Management](./docs/secrets-management.md) for details.

1. Generate secure secrets:
   ```bash
   ./scripts/generate-secrets.sh
   ```

2. Use a secrets management solution appropriate for your deployment platform.

3. Build and deploy using Docker Compose or Kubernetes.

### Docker Compose Deployment

For production deployment, use the full Docker Compose setup:

```bash
# Build the images
docker-compose build

# Start the services
docker-compose up -d
```

This will start:
- Multiple application instances for high availability
- PostgreSQL database with optimized settings
- Redis for caching and session storage
- Nginx as a reverse proxy with load balancing
- Certbot for SSL certificate management

For horizontal scaling, you can adjust the number of application instances:

```bash
# Scale up to 5 application instances
docker-compose up -d --scale app=5
```

For monitoring the deployed services:

```bash
# Check the status of all services
docker-compose ps

# View logs from all services
docker-compose logs -f

# View logs from a specific service
docker-compose logs -f app1
```

## Documentation

- [Secrets Management](./docs/secrets-management.md)
- [Database Backup and Recovery](./docs/database-backup.md)
- [Resource Management](./docs/resource-management.md)
- [Monitoring and Observability](./docs/monitoring.md)
- [SSL Certificate Management](./docs/ssl-management.md)
- [Caching Strategy](./docs/caching.md)
- [Database Optimization](./docs/database-optimization.md)
- [API Documentation](./docs/api.md)
- [Database Schema](./docs/database.md)
- [Testing](./docs/testing.md)
- [Frontend Optimization](./docs/frontend-optimization.md)
- [Continuous Integration](./github/workflows/ci.yml)

## Testing

The project includes comprehensive testing at multiple levels:

```bash
# Run all tests
npm test

# Run tests with coverage reporting
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run tests in watch mode
npm run test:watch

# Run end-to-end tests with Cypress
npx cypress open

# Run load tests
npm run test:load

# Run security scans
npm run security:scan
```

For more details on the testing strategy and implementation, see [Testing Documentation](./docs/testing.md).

## Troubleshooting

### Common Issues

1. **Module not found errors**
   - Make sure all dependencies are installed: `npm install`
   - If using Docker, rebuild the image: `docker-compose build --no-cache`

2. **Database connection issues**
   - Check that PostgreSQL is running: `docker-compose ps`
   - Verify the DATABASE_URL in your .env file
   - Try connecting manually: `psql -h localhost -U postgres -d certificate_verification`

3. **Redis connection issues**
   - Check that Redis is running: `docker-compose ps`
   - Verify the REDIS_URL in your .env file
   - Try connecting manually: `redis-cli ping`

4. **Next.js build errors**
   - Check for TypeScript errors: `npm run lint`
   - Clear the Next.js cache: `rm -rf .next`
   - Rebuild the application: `npm run build`

5. **Docker issues**
   - Check Docker logs: `docker-compose logs`
   - Restart Docker services: `docker-compose restart`
   - Rebuild from scratch: `docker-compose down -v && docker-compose up -d --build`

### Required VS Code Extensions

For the best development experience, install these VS Code extensions:

- ESLint
- Prettier
- Docker
- Prisma
- Tailwind CSS IntelliSense
- PostCSS Language Support

## License

This project is licensed under the MIT License - see the LICENSE file for details.