#!/bin/bash
# Test script for database backup and restore functionality

# Set up test environment
echo "Setting up test environment..."
TEST_DB="certificate_verification_test"
TEST_BACKUP_DIR="/tmp/db-backup-test"
mkdir -p $TEST_BACKUP_DIR

# Export test environment variables
export POSTGRES_DB=$TEST_DB
export DB_BACKUP_DIR=$TEST_BACKUP_DIR
export DB_BACKUP_RETENTION_DAYS=1

# Create test database
echo "Creating test database: $TEST_DB"
docker exec -it postgres psql -U postgres -c "DROP DATABASE IF EXISTS $TEST_DB;"
docker exec -it postgres psql -U postgres -c "CREATE DATABASE $TEST_DB;"

# Seed test database with sample data
echo "Seeding test database with sample data..."
docker exec -it postgres psql -U postgres -d $TEST_DB -c "
CREATE TABLE test_certificates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  issue_date TIMESTAMP NOT NULL DEFAULT NOW(),
  data TEXT
);

INSERT INTO test_certificates (name, data) VALUES 
('Test Certificate 1', 'Sample data 1'),
('Test Certificate 2', 'Sample data 2'),
('Test Certificate 3', 'Sample data 3');
"

# Count initial records
INITIAL_COUNT=$(docker exec -it postgres psql -U postgres -d $TEST_DB -t -c "SELECT COUNT(*) FROM test_certificates;")
echo "Initial record count: $INITIAL_COUNT"

# Perform backup
echo "Performing backup..."
docker exec -e POSTGRES_DB=$TEST_DB -e DB_BACKUP_DIR=$TEST_BACKUP_DIR -it postgres /scripts/backup.sh

# Verify backup was created
BACKUP_FILE=$(docker exec -it postgres ls -t $TEST_BACKUP_DIR | grep $TEST_DB | head -n 1)
if [ -z "$BACKUP_FILE" ]; then
  echo "❌ Backup failed: No backup file found"
  exit 1
else
  echo "✅ Backup created: $BACKUP_FILE"
fi

# Verify backup integrity
echo "Verifying backup integrity..."
docker exec -e POSTGRES_DB=$TEST_DB -e DB_BACKUP_DIR=$TEST_BACKUP_DIR -it postgres /scripts/verify.sh $BACKUP_FILE
if [ $? -ne 0 ]; then
  echo "❌ Backup verification failed"
  exit 1
else
  echo "✅ Backup verified successfully"
fi

# Modify the database to simulate changes
echo "Modifying database to simulate changes..."
docker exec -it postgres psql -U postgres -d $TEST_DB -c "
DELETE FROM test_certificates WHERE id = 1;
INSERT INTO test_certificates (name, data) VALUES ('New Certificate', 'New data');
"

# Count modified records
MODIFIED_COUNT=$(docker exec -it postgres psql -U postgres -d $TEST_DB -t -c "SELECT COUNT(*) FROM test_certificates;")
echo "Modified record count: $MODIFIED_COUNT"

# Restore from backup
echo "Restoring from backup..."
docker exec -e POSTGRES_DB=$TEST_DB -e DB_BACKUP_DIR=$TEST_BACKUP_DIR -it postgres bash -c "echo 'y' | /scripts/restore.sh $BACKUP_FILE"

# Count restored records
RESTORED_COUNT=$(docker exec -it postgres psql -U postgres -d $TEST_DB -t -c "SELECT COUNT(*) FROM test_certificates;")
echo "Restored record count: $RESTORED_COUNT"

# Verify restoration was successful
if [ "$INITIAL_COUNT" = "$RESTORED_COUNT" ]; then
  echo "✅ Restore successful: Record count matches initial state"
else
  echo "❌ Restore failed: Record count does not match initial state"
  exit 1
fi

# Clean up
echo "Cleaning up test environment..."
docker exec -it postgres psql -U postgres -c "DROP DATABASE IF EXISTS $TEST_DB;"
rm -rf $TEST_BACKUP_DIR

echo "✅ Backup and restore test completed successfully"
exit 0