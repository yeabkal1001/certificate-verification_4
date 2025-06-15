# Database Optimization

This document outlines the database optimization strategies implemented in the Certificate Verification System to improve performance, scalability, and reliability.

## Overview

The system uses PostgreSQL as its primary database, accessed through Prisma ORM. The optimization strategy focuses on:

1. **Query Optimization**: Improving database query performance
2. **Connection Pooling**: Efficiently managing database connections
3. **Database Monitoring**: Tracking and analyzing database performance
4. **Schema Optimization**: Enhancing database schema with proper indexes
5. **PostgreSQL Configuration**: Tuning PostgreSQL for optimal performance

## Query Optimization

### Raw SQL Queries

For performance-critical operations, we've replaced Prisma's high-level query API with optimized raw SQL queries:

```typescript
// Before optimization
const certificates = await prisma.certificate.findMany({
  where,
  include: {
    recipient: true,
    issuer: true,
    template: true,
  },
});

// After optimization
const certificates = await prisma.$queryRaw`
  SELECT 
    c.id, 
    c."certificateId", 
    c.title, 
    c."issueDate", 
    r.name as "recipientName", 
    i.name as "issuerName", 
    t.name as "templateName"
  FROM "Certificate" c
  JOIN "User" r ON c."recipientId" = r.id
  JOIN "User" i ON c."issuerId" = i.id
  JOIN "Template" t ON c."templateId" = t.id
  WHERE ${where.status ? prisma.sql`c.status = ${where.status}` : prisma.sql`1=1`}
`;
```

Benefits:
- Reduced data transfer between database and application
- Minimized join overhead by selecting only needed fields
- Improved query execution time

### Query Optimization Techniques

1. **Selective Field Retrieval**: Only retrieving fields that are actually needed
2. **Optimized JOINs**: Using explicit joins instead of nested includes
3. **Pagination**: Implementing proper LIMIT and OFFSET for large result sets
4. **Indexing**: Ensuring queries use available indexes

## Connection Pooling

Connection pooling is implemented to efficiently manage database connections:

```typescript
// Connection pool configuration
const connectionPoolConfig = {
  max_connections: process.env.PRISMA_CONNECTION_LIMIT || 10,
  connection_timeout: process.env.PRISMA_CONNECTION_TIMEOUT || 15000,
  pool_timeout: process.env.PRISMA_POOL_TIMEOUT || 10000,
  idle_timeout: process.env.PRISMA_IDLE_TIMEOUT || 60000,
};
```

Benefits:
- Reduced connection establishment overhead
- Better handling of connection spikes
- Prevention of connection leaks
- Improved application scalability

## Database Monitoring

A comprehensive database monitoring system has been implemented:

### Metrics Collection

The system collects the following metrics:
- Query execution time
- Query count by model and operation
- Error count by model, operation, and error type
- Database size and connection statistics

### Slow Query Detection

Slow queries are automatically detected and logged:

```typescript
if (duration * 1000 > SLOW_QUERY_THRESHOLD) {
  logger.warn('Slow database query detected', {
    model,
    operation,
    duration: `${(duration * 1000).toFixed(2)}ms`,
    args: JSON.stringify(args),
  });
}
```

### Performance Statistics API

A dedicated API endpoint provides database performance statistics:

```
GET /api/db-stats
GET /api/db-stats?type=slow-queries
GET /api/db-stats?type=tables
GET /api/db-stats?type=indexes
```

## Schema Optimization

### Indexing Strategy

The database schema has been optimized with appropriate indexes:

```prisma
model Certificate {
  // Fields...
  
  @@index([recipientId])
  @@index([issuerId])
  @@index([templateId])
  @@index([status])
  @@index([issueDate])
  @@index([certificateId])
  @@index([createdAt])
}
```

Indexes were added based on:
- Fields used in WHERE clauses
- Fields used in JOIN conditions
- Fields used in ORDER BY clauses
- Fields with high cardinality

### Composite Indexes

Composite indexes were added for frequently combined query conditions:

```prisma
model VerificationLog {
  // Fields...
  
  @@index([certificateId, timestamp])
  @@index([isValid, timestamp])
}
```

## PostgreSQL Configuration

PostgreSQL has been configured for optimal performance:

### Memory Settings

```
shared_buffers = 128MB
work_mem = 4MB
maintenance_work_mem = 64MB
effective_cache_size = 512MB
```

### Query Planner Settings

```
random_page_cost = 1.1
effective_io_concurrency = 2
default_statistics_target = 100
```

### Autovacuum Settings

```
autovacuum = on
autovacuum_max_workers = 3
autovacuum_naptime = 1min
autovacuum_vacuum_threshold = 50
autovacuum_analyze_threshold = 50
```

## Database Maintenance

### Regular Optimization

A database optimization script is provided to perform regular maintenance:

```bash
npm run db:optimize
```

This script performs:
- Table analysis to update statistics
- Vacuum to reclaim space
- Reindexing to optimize indexes

### Performance Testing

A database performance testing script is available:

```bash
npm run db:test-performance
```

This script tests various database operations and measures their performance.

## Best Practices

1. **Use Transactions**: For operations that modify multiple records
2. **Batch Operations**: Group multiple operations to reduce round trips
3. **Avoid N+1 Queries**: Use proper joins instead of nested queries
4. **Regular Maintenance**: Schedule regular database optimization
5. **Monitor Performance**: Regularly check database performance metrics

## References

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Performance Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Database Indexing Strategies](https://use-the-index-luke.com/)
- [PostgreSQL Query Optimization](https://www.postgresql.org/docs/current/performance-tips.html)