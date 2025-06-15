# Monitoring and Observability

This document outlines the monitoring and observability setup for the Certificate Verification System.

## Overview

The monitoring stack consists of the following components:

1. **Prometheus**: For metrics collection and storage
2. **Grafana**: For visualization and dashboards
3. **Loki**: For centralized log aggregation
4. **Alertmanager**: For notifications and alerts
5. **Promtail**: For log collection and forwarding
6. **Exporters**: For collecting metrics from various services

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Application │     │  PostgreSQL │     │    Redis    │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │                   │                   │
┌──────▼──────┐     ┌──────▼──────┐     ┌──────▼──────┐
│ App Metrics  │     │ PG Exporter │     │Redis Exporter│
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────┬───────┴───────────┬──────┘
                   │                   │
             ┌─────▼─────┐       ┌─────▼─────┐
             │ Prometheus │◄──────│ Promtail  │
             └─────┬─────┘       └─────┬─────┘
                   │                   │
                   ▼                   ▼
             ┌─────────────┐     ┌─────────────┐
             │Alertmanager │     │    Loki     │
             └─────┬───────┘     └─────┬───────┘
                   │                   │
                   └─────────┬─────────┘
                             │
                       ┌─────▼─────┐
                       │  Grafana  │
                       └───────────┘
```

## Metrics Collection

### Application Metrics

The application exposes metrics at the `/api/metrics` endpoint. These metrics include:

- HTTP request counts by method, path, and status code
- HTTP request duration by method and path
- Database query counts and duration
- Node.js runtime metrics (heap usage, event loop lag, etc.)
- Custom business metrics (certificate operations, etc.)

### System Metrics

System-level metrics are collected by:

- **Node Exporter**: Host-level metrics (CPU, memory, disk, network)
- **cAdvisor**: Container-level metrics (CPU, memory, network)

### Service Metrics

Service-specific metrics are collected by:

- **PostgreSQL Exporter**: Database metrics (connections, queries, etc.)
- **Redis Exporter**: Cache metrics (memory usage, operations, etc.)
- **Nginx Exporter**: Web server metrics (requests, connections, etc.)

## Log Collection

Logs are collected from various sources:

- **Application Logs**: From the application container
- **Nginx Logs**: From the Nginx container
- **System Logs**: From the host system
- **Docker Logs**: From the Docker daemon

Logs are collected by Promtail and sent to Loki for storage and querying.

## Dashboards

The following dashboards are available in Grafana:

1. **Application Dashboard**: Shows application-specific metrics
   - HTTP request rate and latency
   - Error rates
   - Node.js runtime metrics
   - Database query performance

2. **System Dashboard**: Shows system-level metrics
   - CPU, memory, and disk usage
   - Network traffic
   - Container resource usage

3. **Logs Dashboard**: Shows centralized logs
   - Application logs
   - Nginx logs
   - Error logs
   - Log statistics

## Alerting

Alerts are configured for various conditions:

### System Alerts
- High CPU usage (> 80% for 5 minutes)
- High memory usage (> 80% for 5 minutes)
- High disk usage (> 80% for 5 minutes)
- Service down (any service not responding)

### Application Alerts
- High error rate (> 5% for 5 minutes)
- High API latency (90th percentile > 1s for 5 minutes)
- Node.js memory leaks (heap usage continuously increasing)
- Event loop lag (> 100ms for 5 minutes)

### Database Alerts
- High connection count (> 80% of max connections)
- Slow queries (queries running for > 60s)
- Replication lag (if applicable)

### Cache Alerts
- High memory usage (> 80% of max memory)
- High eviction rate

## Notification Channels

Alerts can be sent to the following channels:

- **Slack**: For immediate team notification
- **Email**: For detailed reports and non-urgent issues

## Setup and Configuration

### Starting the Monitoring Stack

```bash
# Start the monitoring stack
docker-compose -f docker-compose.monitoring.yml up -d

# Start the exporters
docker-compose -f docker-compose.exporters.yml up -d
```

### Accessing the Dashboards

- **Grafana**: http://localhost:3001 (default credentials: admin/admin)
- **Prometheus**: http://localhost:9090
- **Alertmanager**: http://localhost:9093
- **Loki**: http://localhost:3100

### Configuration Files

- **Prometheus**: `monitoring/prometheus/config/prometheus.yml`
- **Alertmanager**: `monitoring/alertmanager/config/alertmanager.yml`
- **Loki**: `monitoring/loki/config/loki-config.yml`
- **Promtail**: `monitoring/promtail/config/promtail-config.yml`
- **Grafana**: `monitoring/grafana/config/`

## Best Practices

1. **Regular Review**: Regularly review dashboards and alerts to ensure they are relevant
2. **Alert Tuning**: Adjust alert thresholds based on actual usage patterns
3. **Dashboard Iteration**: Continuously improve dashboards based on operational needs
4. **Log Levels**: Use appropriate log levels to avoid log noise
5. **Retention Policies**: Configure appropriate retention policies for metrics and logs

## Troubleshooting

### Common Issues

1. **Prometheus not scraping targets**
   - Check if the target is up and running
   - Verify network connectivity between Prometheus and the target
   - Check if the target is exposing metrics at the expected endpoint

2. **Loki not receiving logs**
   - Check if Promtail is running
   - Verify the log paths in Promtail configuration
   - Check if Loki is accessible from Promtail

3. **Grafana not showing data**
   - Verify data source configuration
   - Check if Prometheus and Loki are accessible from Grafana
   - Test queries directly in Prometheus/Loki UI

### Useful Commands

```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets | jq

# Check Loki status
curl http://localhost:3100/ready

# View Prometheus alerts
curl http://localhost:9090/api/v1/alerts | jq

# Test a specific alert rule
curl -g 'http://localhost:9090/api/v1/query?query=ALERT_EXPRESSION' | jq
```

## Extending the Monitoring Stack

### Adding New Metrics

1. Define new metrics in `lib/metrics.ts`
2. Use the metrics in your code
3. Update dashboards to include the new metrics

### Adding New Alerts

1. Add new alert rules in `monitoring/prometheus/config/rules/alerts.yml`
2. Restart Prometheus to apply the changes
3. Test the new alerts

### Adding New Dashboards

1. Create a new dashboard in Grafana
2. Export the dashboard to JSON
3. Add the JSON file to `monitoring/grafana/config/dashboards/json/`
4. Restart Grafana to apply the changes

## References

- [Prometheus Documentation](https://prometheus.io/docs/introduction/overview/)
- [Grafana Documentation](https://grafana.com/docs/grafana/latest/)
- [Loki Documentation](https://grafana.com/docs/loki/latest/)
- [Node.js Prometheus Client](https://github.com/siimon/prom-client)
- [Alertmanager Documentation](https://prometheus.io/docs/alerting/latest/alertmanager/)