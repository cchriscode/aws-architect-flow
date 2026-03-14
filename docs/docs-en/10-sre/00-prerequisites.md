# Preparing the SRE Learning Environment

> Before starting the SRE (Site Reliability Engineering) course, let's install and verify the tools required for hands-on exercises. There are load testing, monitoring, Chaos Engineering, and various other exercises, so **there is quite a bit to prepare**, but you can install everything step by step by following this document.

---

## Prerequisites

Complete or familiarize yourself with the following topics before starting the SRE course.

```
Required prerequisite knowledge:

[01-linux]     Basic Linux commands        -> Server access, process management, log inspection
[03-containers] Basic Docker usage         -> Running/managing services with containers
[08-observability] Monitoring fundamentals -> Understanding Prometheus and Grafana
```

This course assumes you **already know** the topics listed above. Docker and monitoring tools, in particular, are used in nearly every exercise.

---

## 1. Installing Docker + Docker Compose

Most SRE exercises run on Docker containers. If you haven't installed Docker yet, refer to [03-containers](../03-containers/02-docker-basics).

### If already installed, check the version

```bash
docker --version
```

### Expected output

```text
Docker version 27.1.1, build 6312585
```

```bash
docker compose version
```

### Expected output

```text
Docker Compose version v2.29.1
```

### Notes

- Use Docker Compose **v2** or later. The old `docker-compose` command (with a hyphen) is v1.
- On Windows/Mac, installing Docker Desktop includes Compose automatically.
- On Linux, you may need to install the Docker Compose plugin separately.

```bash
# Install Docker Compose plugin on Linux
sudo apt update
sudo apt install docker-compose-plugin
```

---

## 2. Installing Prometheus + Grafana

These are essential tools for measuring SLI/SLO and building dashboards in SRE. They were already covered in [08-observability](../08-observability/01-concept), but here is a quick summary of how to spin them up with Docker.

### Install everything at once with Docker Compose

Save the following content as a `docker-compose-monitoring.yml` file.

```yaml
version: "3.8"

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    restart: unless-stopped
```

### Basic Prometheus configuration file

Create a `prometheus.yml` file in the same directory.

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]
```

### Start

```bash
docker compose -f docker-compose-monitoring.yml up -d
```

### Verify

```bash
# Check Prometheus
curl -s http://localhost:9090/-/healthy
```

```text
Prometheus Server is Healthy.
```

```bash
# Check Grafana (default login: admin / admin)
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/login
```

```text
200
```

### Practical tips

- The default Grafana password is `admin`. This is fine for a lab environment, but make sure to change it in production.
- Prometheus data is lost when the container is deleted. If you need persistent storage, mount a Docker volume.

---

## 3. Installing Load Testing Tools

A core part of SRE is testing "how much the system can handle." Let's install load testing tools.

### 3.1 stress-ng (System resource load)

A tool that stresses CPU, memory, and disk to test system limits.

```bash
# Ubuntu / Debian
sudo apt update
sudo apt install -y stress-ng
```

```bash
# Mac
brew install stress-ng
```

### Verify

```bash
stress-ng --version
```

### Expected output

```text
stress-ng, version 0.17.08
```

### Quick test

```bash
# Apply load to 2 CPU cores for 10 seconds
stress-ng --cpu 2 --timeout 10s --metrics-brief
```

### Expected output

```text
stress-ng: info:  [12345] setting to a 10 secs run per stressor
stress-ng: info:  [12345] dispatching hogs: 2 cpu
stress-ng: info:  [12345] stressor       bogo ops real time  usr time  sys time
stress-ng: info:  [12345]                           (secs)    (secs)    (secs)
stress-ng: info:  [12345] cpu               18934     10.00     19.97      0.01
stress-ng: info:  [12345] successful run completed in 10.00s
```

### Notes

- **Never run this on a production server.** Only use it in lab environments or dedicated test servers.
- Always specify the `--timeout` option. Otherwise, it will keep running until you manually stop it.

---

### 3.2 hey (HTTP load testing)

A tool that sends a large volume of HTTP requests to a web server to measure performance. It is a modern alternative to Apache Bench (ab).

#### If Go is installed

```bash
go install github.com/rakyll/hey@latest
```

#### Mac

```bash
brew install hey
```

#### Linux (direct binary download)

```bash
wget https://hey-release.s3.us-east-2.amazonaws.com/hey_linux_amd64
chmod +x hey_linux_amd64
sudo mv hey_linux_amd64 /usr/local/bin/hey
```

### Verify

```bash
hey --help | head -1
```

### Expected output

```text
Usage: hey [options...] <url>
```

### Quick test

```bash
# Send 10 requests to a local server (the server must be running)
hey -n 10 -c 2 http://localhost:8080/
```

### Expected output

```text
Summary:
  Total:        0.0234 secs
  Slowest:      0.0123 secs
  Fastest:      0.0012 secs
  Average:      0.0045 secs
  Requests/sec: 427.3504

  Total data:   1230 bytes
  Size/request: 123 bytes

Response time histogram:
  0.001 [1]  |■■■■
  0.003 [3]  |■■■■■■■■■■■■
  0.005 [4]  |■■■■■■■■■■■■■■■■
  ...

Status code distribution:
  [200] 10 responses
```

---

### 3.3 wrk (Advanced HTTP load testing, optional)

Use this when you need more precise load testing than hey. It supports customizing requests with Lua scripts.

```bash
# Ubuntu / Debian
sudo apt install -y wrk
```

```bash
# Mac
brew install wrk
```

### Verify

```bash
wrk --version
```

### Expected output

```text
wrk 4.2.0 [epoll] Copyright (C) 2012 Will Glozer
```

### Practical tips

- **hey** is suitable for simple load testing, while **wrk** can create complex scenarios using Lua scripts (e.g., including auth tokens, POST requests, etc.).
- In the exercises, we primarily use **hey**. You can install wrk later when needed.

---

## 4. Introduction to Chaos Engineering Tools

Chaos Engineering is an approach that "intentionally injects failures to discover system weaknesses in advance." Here we only introduce the tools; **actual installation and exercises will be covered in the Kubernetes section.**

### Key tools

| Tool | Description | When to install |
|------|-------------|-----------------|
| **Litmus** | Kubernetes-native Chaos Engineering platform | In [05-chaos-engineering](./05-chaos-engineering) |
| **Chaos Monkey** | The original Chaos Engineering tool created by Netflix | During cloud environment exercises |
| **Gremlin** | Commercial Chaos Engineering platform (free tier available) | Optional |
| **chaos-mesh** | CNCF project, K8s-based | During advanced K8s exercises |

### Why we don't install them now

```
Most Chaos Engineering tools run on top of Kubernetes.
You need a K8s cluster to install and practice with them.

At this stage:
  - Understand the concepts
  - Practice simple failure simulations with Docker first (network delays, container termination)

Full Chaos Engineering is covered in the 05-chaos-engineering lesson.
```

---

## 5. Preparing the Sample Application

SRE exercises require a "target service to receive load." Let's prepare a simple web application with Docker Compose.

### Flask-based sample app

Create a project directory and generate the following files.

```bash
mkdir -p ~/sre-lab && cd ~/sre-lab
```

#### app.py

```python
from flask import Flask, jsonify
import time
import random

app = Flask(__name__)

@app.route("/")
def home():
    return jsonify({"status": "ok", "service": "sre-sample"})

@app.route("/health")
def health():
    return jsonify({"status": "healthy"}), 200

@app.route("/slow")
def slow():
    """Intentionally slow endpoint (for SLO violation testing)"""
    delay = random.uniform(0.5, 3.0)
    time.sleep(delay)
    return jsonify({"status": "ok", "delay_seconds": round(delay, 2)})

@app.route("/error")
def error():
    """Endpoint that intentionally generates errors"""
    if random.random() < 0.3:
        return jsonify({"error": "internal server error"}), 500
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
```

#### requirements.txt

```text
flask==3.0.0
```

#### Dockerfile

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .
EXPOSE 8080
CMD ["python", "app.py"]
```

#### docker-compose.yml

```yaml
version: "3.8"

services:
  web:
    build: .
    ports:
      - "8080:8080"
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: "0.5"
          memory: 256M
```

### Start

```bash
cd ~/sre-lab
docker compose up -d --build
```

### Verify

```bash
curl http://localhost:8080/
```

### Expected output

```json
{"service":"sre-sample","status":"ok"}
```

```bash
curl http://localhost:8080/health
```

### Expected output

```json
{"status":"healthy"}
```

### Load testing practice

```bash
# 100 requests, 10 concurrent
hey -n 100 -c 10 http://localhost:8080/

# Load on the slow endpoint
hey -n 20 -c 5 http://localhost:8080/slow
```

### Practical tips

- The `/slow` and `/error` endpoints are used for testing SLI/SLO violations.
- CPU and memory are limited via `deploy.resources.limits`. This is necessary to simulate resource exhaustion scenarios during load testing.
- Later, we will connect Prometheus to collect metrics from this app.

---

## 6. Alerting Tools (Optional)

To experience real incident management, it helps to have an alerting service account. **This is not required.**

| Service | Free tier | Purpose |
|---------|-----------|---------|
| **PagerDuty** | 14-day free trial | On-call scheduling, escalation |
| **Opsgenie** (Atlassian) | Free for up to 5 users | Alert routing, on-call management |
| **Slack Webhook** | Free | Simple alert receiving |

### Simplest method: Slack Webhook

If you have a Slack workspace, you can create an Incoming Webhook and use it for alerting exercises.

```bash
# Slack Webhook test
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"SRE alert test!"}' \
  https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### Notes

- PagerDuty and Opsgenie have **limited free trial periods**. We recommend signing up in sync with the course schedule.
- A Slack Webhook alone is sufficient to experience the core concepts of alerting exercises.

---

## Final Environment Verification Checklist

Run the following commands in order to verify that everything is installed correctly.

```bash
echo "=== Docker ==="
docker --version
docker compose version

echo ""
echo "=== Load Testing Tools ==="
stress-ng --version
hey --help | head -1

echo ""
echo "=== Monitoring ==="
curl -s http://localhost:9090/-/healthy
curl -s -o /dev/null -w "Grafana HTTP: %{http_code}\n" http://localhost:3000/login

echo ""
echo "=== Sample App ==="
curl -s http://localhost:8080/health
```

### Expected output

```text
=== Docker ===
Docker version 27.1.1, build 6312585
Docker Compose version v2.29.1

=== Load Testing Tools ===
stress-ng, version 0.17.08
Usage: hey [options...] <url>

=== Monitoring ===
Prometheus Server is Healthy.
Grafana HTTP: 200

=== Sample App ===
{"status":"healthy"}
```

### Notes

- The version numbers shown above may differ depending on when you installed them. As long as the commands execute successfully, you are fine.
- The monitoring and sample app checks require the Docker containers to be **running**. Verify with `docker ps`.
- wrk is optional and is not included in the checklist. If you installed it, you can verify with `wrk --version`.

---

## Troubleshooting

### Docker-related

```bash
# Check logs when a container won't start
docker compose logs -f

# Check which process is using a port when there's a port conflict
sudo lsof -i :8080
sudo lsof -i :9090
sudo lsof -i :3000
```

### If stress-ng installation fails

```bash
# Update package list and retry
sudo apt update && sudo apt install -y stress-ng

# If it still fails, build from source
git clone https://github.com/ColinIanKing/stress-ng.git
cd stress-ng
make
sudo make install
```

### If hey installation fails (environment without Go)

```bash
# Direct binary download (Linux amd64)
wget https://hey-release.s3.us-east-2.amazonaws.com/hey_linux_amd64
chmod +x hey_linux_amd64
sudo mv hey_linux_amd64 /usr/local/bin/hey

# On Mac, brew is the simplest method
brew install hey
```

---

## Next Steps

Once your environment is ready, start learning from [SRE Principles](./01-principles). The first lesson covers the core philosophy of SRE and the concepts of SLI/SLO/SLA.
