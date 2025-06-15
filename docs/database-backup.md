# Database Backup and Recovery

This document outlines the database backup and recovery strategy for the Certificate Verification System.

## Backup Strategy

The system implements a comprehensive backup strategy with the following components:

1. **Regular Automated Backups**: Daily backups scheduled via cron
2. **Backup Verification**: Automatic verification of backup integrity
3. **Retention Policy**: Configurable retention period for backups
4. **Offsite Storage**: Optional S3 bucket integration for offsite storage
5. **Notifications**: Optional Slack notifications for backup status

## Configuration

Backup configuration is managed through environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_HOST` | PostgreSQL host | `postgres` |
| `POSTGRES_PORT` | PostgreSQL port | `5432` |
| `POSTGRES_DB` | Database name | `certificate_verification` |
| `POSTGRES_USER` | Database username | `postgres` |
| `POSTGRES_PASSWORD` | Database password | `postgres` |
| `DB_BACKUP_DIR` | Directory to store backups | `/backups` |
| `DB_BACKUP_RETENTION_DAYS` | Number of days to keep backups | `7` |
| `DB_BACKUP_S3_BUCKET` | S3 bucket for offsite storage | `` (empty) |
| `SLACK_WEBHOOK_URL` | Slack webhook for notifications | `` (empty) |

## Backup Scripts

The following scripts are available in the `scripts/db-backup` directory:

### backup.sh

Creates a compressed backup of the PostgreSQL database.

Features:
- Compressed SQL dump format
- Automatic verification of backup integrity
- Cleanup of old backups based on retention policy
- Optional upload to S3 bucket
- Notification of backup status

### verify.sh

Verifies the integrity of database backups.

Features:
- Checks file size and readability
- Verifies gzip integrity
- Validates SQL content
- Detailed reporting

### restore.sh

Restores the database from a backup file.

Features:
- Interactive confirmation to prevent accidental restores
- Backup verification before restore
- Detailed logging and notifications

### schedule-backups.sh

Sets up scheduled backups using cron.

Usage:
```bash
./scripts/db-backup/schedule-backups.sh "0 2 * * *"  # Daily at 2 AM
```

## Backup Procedures

### Manual Backup

To perform a manual backup:

```bash
# Using Docker Compose
docker-compose -f docker-compose.backup.yml up --rm db-backup

# Or directly using the script
docker exec -it postgres /scripts/backup.sh
```

### Scheduled Backups

To set up scheduled backups:

```bash
# Set up daily backups at 2 AM
./scripts/db-backup/schedule-backups.sh "0 2 * * *"

# Set up backups every 6 hours
./scripts/db-backup/schedule-backups.sh "0 */6 * * *"
```

### Backup Verification

To verify backup integrity:

```bash
# Verify the most recent backups
docker exec -it postgres /scripts/verify.sh

# Verify a specific backup
docker exec -it postgres /scripts/verify.sh certificate_verification_20230101_120000.sql.gz
```

## Recovery Procedures

### Restore from Backup

To restore the database from a backup:

```bash
# List available backups
docker exec -it postgres ls -la /backups

# Restore from a specific backup
docker exec -it postgres /scripts/restore.sh certificate_verification_20230101_120000.sql.gz
```

### Point-in-Time Recovery

For point-in-time recovery (PITR), PostgreSQL's WAL archiving should be configured. This is beyond the scope of the basic backup strategy but can be implemented for production environments.

## Disaster Recovery

In case of a complete system failure:

1. Set up a new PostgreSQL instance
2. Restore the most recent backup
3. Verify application functionality

For offsite recovery:
1. Download the latest backup from S3
2. Follow the restore procedure

## Monitoring and Alerting

Backup operations are logged to:
- `/backups/backup_log.txt`
- `/backups/restore_log.txt`
- `/backups/verify_log.txt`

If configured, Slack notifications will be sent for:
- Successful backups
- Failed backups
- Successful restores
- Failed restores
- Backup verification results

## Best Practices

1. **Regular Testing**: Periodically test the restore process to ensure backups are valid
2. **Offsite Storage**: Always store backups in a separate location from the production database
3. **Encryption**: Consider encrypting sensitive backup data, especially when using S3
4. **Monitoring**: Set up alerts for backup failures
5. **Documentation**: Keep this documentation updated with any changes to the backup strategy