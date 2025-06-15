# SSL Certificate Management

This document outlines the SSL certificate management strategy for the Certificate Verification System.

## Overview

The system uses Let's Encrypt for SSL certificate management, which provides free, automated, and trusted certificates. The certificates are automatically renewed before expiration, and the system includes monitoring to alert administrators of any issues with certificate renewal.

## Components

1. **Let's Encrypt Certificates**: Free, automated, and trusted certificates
2. **Certbot**: Tool for obtaining and renewing Let's Encrypt certificates
3. **Nginx**: Web server that uses the SSL certificates
4. **Certificate Monitoring**: Scripts to monitor certificate expiration
5. **Automatic Renewal**: Scheduled tasks to renew certificates before expiration

## Initial Setup

### Prerequisites

- A registered domain name pointing to your server
- Docker and Docker Compose installed
- Ports 80 and 443 open on your firewall

### Setting Up Let's Encrypt Certificates

1. Create the required directories:
   ```bash
   mkdir -p nginx/certbot/conf
   mkdir -p nginx/certbot/www
   mkdir -p nginx/ssl
   ```

2. Configure your domain name:
   ```bash
   export DOMAIN=yourdomain.com
   export EMAIL=your-email@example.com
   ```

3. Run the setup script:
   ```bash
   ./scripts/ssl-management/setup-certbot.sh
   ```

4. For production certificates, set the `STAGING` environment variable to "false":
   ```bash
   export STAGING=false
   ./scripts/ssl-management/setup-certbot.sh
   ```

## Automatic Certificate Renewal

Certificates from Let's Encrypt are valid for 90 days. The system is configured to automatically renew certificates before they expire.

### How Automatic Renewal Works

1. The Certbot container attempts to renew certificates every 12 hours
2. Nginx reloads its configuration every 6 hours to pick up new certificates
3. A cron job runs daily to ensure certificates are renewed

### Setting Up Automatic Renewal

Run the setup script to configure automatic renewal:
```bash
./scripts/ssl-management/setup-auto-renewal.sh
```

This script:
- Makes the renewal scripts executable
- Sets up cron jobs for certificate renewal and monitoring
- Configures logging for renewal operations

## Certificate Monitoring

The system includes monitoring to alert administrators when certificates are nearing expiration.

### Monitoring Configuration

1. Set up monitoring parameters:
   ```bash
   export EXPIRY_THRESHOLD=30  # Alert when certificate expires in 30 days or less
   export SLACK_WEBHOOK_URL=https://hooks.slack.com/services/your-webhook-url
   export EMAIL_TO=admin@example.com
   ```

2. Run the monitoring script manually:
   ```bash
   ./scripts/ssl-management/monitor-certificates.sh
   ```

3. The monitoring script is scheduled to run weekly via cron

## Certificate Rotation

Certificate rotation is the process of replacing existing certificates with new ones. This is handled automatically by the renewal process, but can also be done manually if needed.

### Manual Certificate Rotation

1. Remove existing certificates:
   ```bash
   rm -rf nginx/certbot/conf/live/yourdomain.com
   rm nginx/ssl/cert.pem nginx/ssl/key.pem
   ```

2. Obtain new certificates:
   ```bash
   ./scripts/ssl-management/setup-certbot.sh
   ```

3. Reload Nginx:
   ```bash
   docker exec nginx nginx -s reload
   ```

## Troubleshooting

### Common Issues

1. **Certificate Renewal Failure**
   - Check Certbot logs: `docker logs certbot`
   - Verify domain DNS settings
   - Ensure ports 80 and 443 are open

2. **Nginx Cannot Find Certificates**
   - Check symbolic links in `nginx/ssl/`
   - Verify certificate paths in Nginx configuration
   - Ensure certificates exist in the expected location

3. **Certificate Validation Errors**
   - Verify domain ownership
   - Check DNS settings
   - Ensure `.well-known/acme-challenge/` is accessible

### Debugging Commands

```bash
# Check certificate expiration
openssl x509 -enddate -noout -in nginx/ssl/cert.pem

# Verify Nginx configuration
docker exec nginx nginx -t

# Test certificate renewal
docker exec certbot certbot renew --dry-run
```

## Security Considerations

1. **Private Key Protection**
   - Private keys are stored in Docker volumes
   - Access to the server should be restricted
   - Regular security audits should be performed

2. **HTTPS Configuration**
   - The system uses modern TLS protocols (TLSv1.2, TLSv1.3)
   - Weak ciphers are disabled
   - HSTS is enabled with a long max-age

3. **Certificate Transparency**
   - Let's Encrypt certificates are logged in Certificate Transparency logs
   - This provides additional security through public verification

## References

- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Certbot Documentation](https://certbot.eff.org/docs/)
- [Nginx SSL Configuration](https://nginx.org/en/docs/http/configuring_https_servers.html)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)