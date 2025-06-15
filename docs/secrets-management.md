# Secrets Management

This document outlines the approach to secrets management in the Certificate Verification System.

## Environment Variables

The application uses environment variables for all sensitive configuration. These variables are loaded from:

1. `.env` file (for local development, not committed to the repository)
2. Environment variables passed to Docker containers (for production)

## Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `POSTGRES_USER` | PostgreSQL database username | `dbuser` |
| `POSTGRES_PASSWORD` | PostgreSQL database password | `strong-password` |
| `POSTGRES_DB` | PostgreSQL database name | `certificate_verification` |
| `DATABASE_URL` | Full PostgreSQL connection string | `postgresql://dbuser:strong-password@postgres:5432/certificate_verification?schema=public` |
| `NEXTAUTH_SECRET` | Secret key for NextAuth.js | `random-string-at-least-32-chars` |
| `JWT_SECRET` | Secret key for JWT signing | `another-random-string-at-least-32-chars` |
| `CERTIFICATE_SECRET` | Secret key for certificate signing | `yet-another-random-string` |
| `NEXTAUTH_URL` | Base URL for NextAuth.js | `https://your-domain.com` |

## Generating Secure Secrets

For production environments, generate strong random secrets:

```bash
# Generate a random string for NEXTAUTH_SECRET
openssl rand -base64 32

# Generate a random string for JWT_SECRET
openssl rand -base64 32

# Generate a random string for CERTIFICATE_SECRET
openssl rand -base64 32
```

## Production Deployment

For production deployments, never store secrets in files. Instead:

1. Use a secrets management service like AWS Secrets Manager, HashiCorp Vault, or Docker Swarm/Kubernetes secrets
2. Pass secrets as environment variables to containers
3. Rotate secrets regularly

### Using Docker Secrets (for Docker Swarm)

If using Docker Swarm, you can use Docker secrets:

```yaml
version: '3.8'

services:
  app:
    image: certificate-verification-app
    secrets:
      - postgres_password
      - nextauth_secret
      - jwt_secret
      - certificate_secret
    environment:
      - DATABASE_URL=postgresql://dbuser:/run/secrets/postgres_password@postgres:5432/certificate_verification?schema=public
      - NEXTAUTH_SECRET=/run/secrets/nextauth_secret
      # ... other environment variables

secrets:
  postgres_password:
    external: true
  nextauth_secret:
    external: true
  jwt_secret:
    external: true
  certificate_secret:
    external: true
```

### Using Kubernetes Secrets

If using Kubernetes, use Kubernetes secrets and mount them as environment variables.

## Local Development

For local development:

1. Copy `.env.example` to `.env`
2. Fill in the required values
3. Never commit `.env` to the repository (it's already in `.gitignore`)

## CI/CD Pipeline

In CI/CD pipelines, inject secrets as environment variables from your CI/CD platform's secrets management.