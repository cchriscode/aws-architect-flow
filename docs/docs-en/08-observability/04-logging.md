# Logging (Structured Logging, ELK Stack, Grafana Loki)

> When a server fails, the first thing we look for is logs. But when logs from dozens of servers pour in and you're stuck using `tail -f` in a terminal, you quickly hit limits. To quickly find "which server, which request, why it failed", you need a systematic logging system. If we dealt with logs on a single server in [Linux Log Management](../01-linux/08-log), now we'll learn how to collect, search, and analyze logs from **entire distributed systems**.

---

## 🎯 Why Do You Need to Know About Logging?

### Everyday Analogy: Large Shopping Mall CCTV Control Room

Imagine a large shopping mall with hundreds of CCTV cameras in each building.

- **Watching just 1 CCTV** (single server logs): `tail -f /var/log/syslog` is enough
- **Watching 500 CCTVs** (distributed system logs): Need a central control room to watch one screen, search, and auto-detect anomalies

A logging system is this **central control room**. It collects video feeds (logs) from each CCTV (server), organizes them chronologically, and quickly finds needed footage.

```
Real-world moments where a logging system is needed:

• "Order failed, don't know which server errored"       → Central log search
• "Need to track specific user's request flow"           → Correlation ID tracking
• "Errors spiked at 3 AM, need to find root cause"      → Time-based log analysis
• "Log file consumed all server disk space"             → Log retention/rotation policy
• "Need 6 months of logs for audit"                     → Log archiving
• "Customer PII is unmasked in logs!"                   → PII masking
• "500GB logs daily, costs are exploding"               → Log level/filtering strategy
```

---

## 🧠 Core Concepts

### 1. Unstructured vs Structured Logs

There are two main log formats:

**Unstructured Log** - Plain text easy for humans to read:

```
2024-03-12 14:23:45 ERROR Failed to process order #12345 for user john@example.com - DB connection timeout after 30s
```

**Structured Log** - Machine-parseable format (mostly JSON):

```json
{
  "timestamp": "2024-03-12T14:23:45.123Z",
  "level": "ERROR",
  "service": "order-service",
  "message": "Failed to process order",
  "orderId": "12345",
  "userId": "user-789",
  "error": "DB connection timeout",
  "timeoutMs": 30000,
  "traceId": "abc-123-def-456",
  "host": "order-svc-pod-3"
}
```

Why is structured logging important?

```
Unstructured log problem:
"Failed to process order #12345 for user john@example.com"
Q: Want to extract just order number?
A: Parse with regex... 😫
   /order #(\d+)/ → If log format changes, regex breaks

Structured log advantage:
{"orderId": "12345", "userId": "user-789", ...}
Q: Want order number?
A: json.orderId → Done! Format changes don't affect field names
```

### 2. Log Levels

Similar to [Linux logs](../01-linux/08-log), applications typically use 5 levels:

- **FATAL/CRITICAL** (Red): App cannot run, immediate action needed
- **ERROR** (Orange): Request processing failed, fast action needed
- **WARN** (Yellow): Potential issue, monitoring needed
- **INFO** (Blue): Normal operation, service status tracking
- **DEBUG** (Gray): Development/debugging details, usually OFF in production

---

## 🔍 Understanding Each in Detail

### 1. Structured Logging Deep Dive

#### Good Structured Log Essential Fields

```json
{
  // === Required fields (all logs) ===
  "timestamp": "2024-03-12T14:23:45.123Z",   // ISO 8601, UTC
  "level": "ERROR",                           // Log level
  "message": "Order processing failed",       // Human-readable
  "service": "order-service",                 // Service name

  // === Tracing fields (distributed systems) ===
  "traceId": "abc-123-def-456",               // Full request tracking
  "spanId": "span-789",                       // Current operation unit
  "requestId": "req-001",                     // Individual request

  // === Context fields (important for diagnosis) ===
  "userId": "user-789",                       // Related user
  "orderId": "order-12345",                   // Business entity
  "host": "order-svc-pod-3",                  // Host/Pod name
  "environment": "production",                // Environment

  // === Error fields (ERROR level) ===
  "error": {
    "type": "DatabaseTimeoutException",
    "message": "Connection timeout after 30000ms",
    "stackTrace": "at OrderRepository.save(OrderRepository.java:45)..."
  }
}
```

#### Structured Logging by Language

**Python (structlog)**:
```python
import structlog

logger = structlog.get_logger()

# Basic logging
logger.info("order_created", order_id="12345", user_id="user-789", total=49900)

# Error logging with context
logger.error("payment_failed",
            order_id="12345",
            error_type=type(e).__name__,
            error_message=str(e),
            exc_info=True)
```

**Node.js (pino)**:
```javascript
const pino = require('pino');
const logger = pino();

// Basic logging
logger.info({ orderId: '12345', userId: 'user-789' }, 'Order created');

// Error logging
logger.error({ err: error, orderId: '12345' }, 'Payment failed');
```

### 2. Correlation ID / Request ID Implementation

In microservices, one user request goes through multiple services. **Correlation ID** tracks the complete journey.

```
User → API Gateway → Order Service → Payment Service → Notification Service

If all logs have same traceId: "abc-123":
→ Search "abc-123" to see entire request flow!
```

#### Node.js Express Middleware Example

```javascript
const { v4: uuidv4 } = require('uuid');
const pino = require('pino');
const logger = pino();

function correlationIdMiddleware(req, res, next) {
  // Use existing ID or create new
  const traceId = req.headers['x-trace-id'] || uuidv4();
  const requestId = req.headers['x-request-id'] || uuidv4();

  req.traceId = traceId;
  req.requestId = requestId;

  // Add to response headers for client
  res.setHeader('X-Trace-Id', traceId);
  res.setHeader('X-Request-Id', requestId);

  // Per-request logger (auto-includes IDs)
  req.log = logger.child({ traceId, requestId });

  req.log.info('Request started');

  res.on('finish', () => {
    req.log.info({ statusCode: res.statusCode }, 'Request completed');
  });

  next();
}

app.use(correlationIdMiddleware);

app.post('/orders', (req, res) => {
  req.log.info({ userId: req.body.userId }, 'Creating order');

  // When calling other services, propagate traceId
  const response = await axios.post('http://payment-service/pay', data, {
    headers: {
      'X-Trace-Id': req.traceId,        // Same traceId!
      'X-Request-Id': uuidv4(),         // New requestId
    }
  });

  req.log.info({ orderId: order.id }, 'Order created');
  res.json(order);
});
```

### 3. ELK Stack (Elasticsearch + Logstash + Kibana)

ELK Stack was the **de facto standard** for log collection and analysis.

#### ELK Architecture Components

**Elasticsearch** - Log storage + search engine:
- Distributed search engine (Apache Lucene-based)
- Stores JSON documents with full-text search
- Indexes data by time (logs-2024.03.12)
- Shards for distributed storage, Replicas for HA

**Logstash** - Log processing pipeline:
```ruby
input {
  beats { port => 5044 }
}

filter {
  json { source => "message" }
  date { match => ["timestamp", "ISO8601"] }
  mutate { remove_field => ["agent"] }
}

output {
  elasticsearch {
    hosts => ["http://elasticsearch:9200"]
    index => "logs-%{[service]}-%{+YYYY.MM.dd}"
  }
}
```

**Filebeat** - Lightweight log collector:
```yaml
filebeat.inputs:
  - type: filestream
    paths: ["/var/log/app/*.log"]
    parsers:
      - ndjson:
          keys_under_root: true

output.logstash:
  hosts: ["logstash:5044"]
```

**Kibana** - Visualization & search UI
- KQL (Kibana Query Language) for searching
- Dashboards and visualizations
- Alerting on conditions

#### Docker Compose ELK Setup

```yaml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.12.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms1g -Xmx1g"
    ports: ["9200:9200"]

  logstash:
    image: docker.elastic.co/logstash/logstash:8.12.0
    ports: ["5044:5044"]
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline

  kibana:
    image: docker.elastic.co/kibana/kibana:8.12.0
    ports: ["5601:5601"]
    environment:
      ELASTICSEARCH_HOSTS: '["http://elasticsearch:9200"]'
```

### 4. Grafana Loki

Loki is **lightweight log collection** by Grafana Labs. "Treat logs like Prometheus treats metrics."

#### Loki Core Philosophy: Label-based Indexing

```
Elasticsearch:
  Indexes ALL text (Full-Text Index)
  → Free search, but resource-intensive and expensive
  → Like indexing every word in every book

Loki:
  Indexes only labels (metadata)
  → Requires label filtering first, then text search
  → Like classifying books by "genre" and "author" first, then searching
```

#### Loki Architecture

Logs flow: Pods → Promtail → Loki → Grafana

Key components:
- **Distributor**: Receives logs and distributes
- **Ingester**: Compresses logs into chunks
- **Object Storage**: S3/GCS for compressed chunks
- **Querier**: Handles LogQL queries

#### LogQL - Loki Query Language

LogQL is inspired by PromQL:

```
# Select stream by labels
{service="order-service"}                        # All logs
{service="order-service", level="ERROR"}         # Filtered

# Pipelines (chainable)
{service="order-service"} |= "timeout"           # Contains "timeout"
{service="order-service"} | json                 # Parse JSON
{service="order-service"} | json | duration > 1000  # Numeric comparison

# Metrics from logs
sum(count_over_time({level="ERROR"}[5m])) by (service)
```

### 5. ELK Stack vs Grafana Loki

| Item | ELK Stack | Grafana Loki |
|------|-----------|--------------|
| **Indexing** | Full-text | Labels only |
| **Search Speed** | Fast | Requires label filtering |
| **Resource Use** | High | 10-20x less |
| **Cost** | High | Low |
| **Operations** | Complex | Simple |
| **Best For** | Large-scale, complex search | Small-medium, Kubernetes |

---

## 💻 Hands-On Practice

### Exercise 1: Loki Stack with Docker Compose

```bash
# 1. Create docker-compose.yml with Loki, Promtail, Grafana
docker compose up -d

# 2. Generate logs
for i in $(seq 1 100); do
  curl -s http://localhost:8080 > /dev/null
done

# 3. Access Grafana: http://localhost:3000
# → Add Loki data source
# → Explore with LogQL queries
```

### Exercise 2: Structured Logging in Python

```python
import structlog
import uuid

structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.add_log_level,
        structlog.processors.JSONRenderer(),
    ],
)

logger = structlog.get_logger()

def process_request(user_id):
    trace_id = str(uuid.uuid4())[:8]
    log = logger.bind(trace_id=trace_id, user_id=user_id)

    log.info("request_started")
    # ... process request ...
    log.info("request_completed", status="success")

# Usage
for i in range(5):
    process_request(f"user-{i}")
```

### Exercise 3: LogQL Query Practice

```
# 1. Basic
{service="order-service"} | json | level="ERROR"

# 2. Time-based
sum(count_over_time({level="ERROR"}[1h])) by (service)

# 3. Trace ID filtering
{job="app"} |= "trace-abc-123"

# 4. Numeric comparison
{service="order-service"} | json | duration_ms > 500
```

---

## 🏢 In Production

### Large-scale Logging Architecture

```
Daily logs: ~2TB (50 microservices, 200 instances)

Architecture:
Apps → Fluentd DaemonSet → Kafka → Elasticsearch + S3 Archive

Monthly cost with ELK: ~$3,700
Monthly cost with Loki: ~$1,200 (68% savings)
```

### Kubernetes Best Practices

```yaml
# 1. Log to stdout/stderr
CMD ["node", "server.js"]

# 2. JSON format
env:
  - name: LOG_FORMAT
    value: "json"

# 3. Pod labels for searching
labels:
  app: order-service
  team: commerce
```

### On-Call Engineer's Log Investigation Workflow

```
Outage Alert → Slack/PagerDuty

Step 1: Understand Scope (30 sec)
  → Check error rate graph
  → "Which service? When? Severity?"

Step 2: Review Errors (1 min)
  → LogQL: {service="order-service", level="ERROR"} | json
  → Check error messages and stack traces

Step 3: Impact Analysis (2 min)
  → Find related services also erroring

Step 4: Request Tracing (3 min)
  → Find trace_id of failed request
  → {job="app"} |= "trace-abc-123"
  → Which service started the problem?

Step 5: Root Cause & Response
  → Identify root cause
  → Immediate action (rollback, config change, scale up)
```

---

## ⚠️ Common Mistakes

### Mistake 1: Leaving PII Unmasked in Logs

```python
# ❌ Wrong: Passwords and card numbers in logs
logger.info(f"User login: email={email}, password={password}")

# ✅ Right: Mask sensitive data
logger.info("User login", email=mask_email(email))
```

### Mistake 2: Leaving DEBUG Level Enabled in Production

```
# ❌ Wrong: DEBUG stays on after debugging
# → Log volume 4x → Costs explode → Disk full → Second outage!

# ✅ Right:
# 1. Outage: Change LOG_LEVEL=DEBUG
# 2. After diagnosis: Restore LOG_LEVEL=INFO
# 3. Automate: Auto-revert after time period
```

### Mistake 3: Insufficient Context in Logs

```python
# ❌ Wrong: No context
logger.error("Failed to process request")
logger.error("Database error")

# ✅ Right: Full context
logger.error("order_processing_failed",
            order_id="ORD-12345",
            user_id="user-789",
            error_type="DatabaseTimeout")
```

### Mistake 4: Wrong Log Level Usage

```python
# ❌ Wrong
logger.error("User not found")           # 404 is normal, not ERROR
logger.info(f"SQL: {sql_query}")         # Volume explosion

# ✅ Right
logger.info("user_not_found", user_id="user-789")  # Normal case
logger.debug("sql_executed", query=sql_query)      # Debug only
```

### Mistake 5: Unstructured Logs Relying on String Format

```python
# ❌ Wrong: Hard to parse
logger.info(f"Order {order_id} by {user_id} with {count} items")

# ✅ Right: Structured fields
logger.info("order_created",
           order_id=order_id,
           user_id=user_id,
           item_count=count)
```

### Mistake 6: No Log Retention Policy

```
# ❌ Wrong: No retention
# 6 months later: "Elasticsearch disk 97%... emergency!"

# ✅ Right: Set retention from start
# DEBUG: 3 days, INFO: 14 days, ERROR: 90 days
```

### Mistake 7: All Logs in Same Index

```
# ❌ Wrong: All services in "logs-*"
# → Slow searches, no per-service policies

# ✅ Right: Service-separated indexes
logs-order-service-2024.03.12
logs-payment-service-2024.03.12
logs-notification-service-2024.03.12
```

---

## 📝 Summary

### Core Takeaway

```
1. Structured Logging
   → JSON format unified for all services
   → Essential fields: timestamp, level, service, message, traceId

2. Log Levels
   → FATAL > ERROR > WARN > INFO > DEBUG
   → Production: INFO+ only (cost savings)
   → Temporary DEBUG during outages

3. Correlation ID
   → Distributed systems need request tracing
   → Create at API Gateway, propagate to all services

4. ELK Stack
   → Full-text search powerful, complex analysis
   → Resources and costs high, but rich ecosystem

5. Grafana Loki
   → Label-based indexing, cost-efficient
   → Natural integration with Prometheus/Grafana
   → Perfect for Kubernetes

6. Log Retention/Rotation
   → Tiered retention by level and type
   → Storage tiering (SSD → HDD → S3) for cost optimization

7. Log Security
   → Always mask PII, auth info, financial data
   → Mask at app level for maximum safety
```

### At-a-Glance Comparison

```
┌───────────────────┬────────────────────┬────────────────────┐
│                   │ ELK Stack          │ Grafana Loki       │
├───────────────────┼────────────────────┼────────────────────┤
│ Indexing          │ Full-text          │ Labels only        │
│ Search Speed      │ ⭐⭐⭐⭐⭐        │ ⭐⭐⭐ (needs label)│
│ Cost              │ ⭐⭐               │ ⭐⭐⭐⭐⭐        │
│ Operations        │ ⭐⭐               │ ⭐⭐⭐⭐          │
│ Scalability       │ ⭐⭐⭐⭐          │ ⭐⭐⭐⭐⭐        │
│ K8s Integration   │ ⭐⭐⭐            │ ⭐⭐⭐⭐⭐        │
└───────────────────┴────────────────────┴────────────────────┘
```

### Implementation Checklist

```
□ All services output JSON logs?
□ Required fields included (timestamp, level, service, traceId)?
□ Correlation IDs propagated across services?
□ Production log level set to INFO+?
□ Log retention policy documented?
□ PII masking implemented?
□ Log-based alerting configured?
□ Search/analysis dashboard ready?
□ Log collection agent running stably?
□ Disaster recovery plan for pipeline?
```

---

## 🔗 Next Steps

### Recommended Learning Path

1. **[Observability Concepts](./01-concept)** - Review 3 pillars of observability
2. **[Linux Log Management](../01-linux/08-log)** - Single server log fundamentals
3. **Current Lesson** - Distributed system logging strategy
4. **Log Collection Pipeline** - Advanced Fluentd/Fluent Bit architecture

### Further Study

```
Structured Logging:
• The Twelve-Factor App - Logs
• OpenTelemetry Logging Specification

ELK Stack:
• Elastic Official Documentation
• Elasticsearch Definitive Guide

Grafana Loki:
• Loki Official Documentation
• LogQL Syntax Guide

Distributed Tracing (Next):
• OpenTelemetry (unified Logs + Metrics + Traces)
• Jaeger / Zipkin
```

### Practice Exercises

```
1. (Beginner) Apply structlog/pino to Python/Node app,
   output JSON logs

2. (Intermediate) Docker Compose Loki stack setup,
   collect and search app logs in Grafana

3. (Intermediate) Implement Correlation ID middleware,
   track requests across services

4. (Advanced) ELK Stack Docker Compose setup,
   compare with Loki (speed, resources)

5. (Advanced) Build PII masking processor,
   test multiple patterns (email, phone, card)
```

---

> **Next Lecture**: [Observability Stack Integration](./05-integration) - Bringing Metrics, Logs, and Traces together in unified dashboards!
