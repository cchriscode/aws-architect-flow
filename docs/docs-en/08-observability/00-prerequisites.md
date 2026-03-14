# Observability Learning Environment Setup

> This document is a guide for installing the necessary tools and setting up the lab environment **before** starting the Observability course. We will prepare everything so that Prometheus, Grafana, and log collection tools can all be launched at once with Docker Compose. Once you complete all the steps, you can jump right into [Observability Concepts](./01-concept).

---

## Required Tools

```
Tool              Purpose                              Required
─────────────────────────────────────────────────────────────
Docker            Container runtime environment          Required
Docker Compose    Manage multiple containers at once     Required
Prometheus        Metric collection and querying         Required
Grafana           Dashboard visualization                Required
node_exporter     Linux system metric collection         Recommended
Loki              Log collection (ELK alternative)       Optional
curl              API testing and metric verification    Required
```

---

## 1. Install Docker + Docker Compose

All observability lab tools run on Docker. Nothing can proceed without Docker installed.

### Verify Installation

If you already installed Docker during the [03-containers](../03-containers/02-docker-basics) section, just verify with the commands below.

```bash
docker --version
docker compose version
```

### Expected Output

```text
Docker version 24.0.7, build afdd53b
Docker Compose version v2.23.3
```

### If Not Yet Installed

| OS | Installation Method |
|-----|----------|
| **Windows** | Download and install [Docker Desktop](https://www.docker.com/products/docker-desktop/) (enable WSL2 backend) |
| **Mac** | Download and install [Docker Desktop](https://www.docker.com/products/docker-desktop/) or run `brew install --cask docker` |
| **Linux (Ubuntu)** | Run the commands below |

```bash
# Linux installation
sudo apt update
sudo apt install docker.io docker-compose-v2 -y
sudo usermod -aG docker $USER
newgrp docker
```

### Note

- On Windows, the **WSL2 backend** must be enabled. Check in Docker Desktop settings.
- If the `docker compose` command does not work, try `docker-compose` (with a hyphen). Older versions of Docker Compose are installed as a separate binary.
- On Linux, if you need to prefix every `docker` command with `sudo`, **restart your terminal** after running the `usermod` command.

---

## 2. Prepare Prometheus + Grafana Docker Compose File

Create a lab directory and write a Docker Compose file. This single file will let you run Prometheus and Grafana simultaneously.

### 2.1 Create the Directory Structure

```bash
mkdir -p ~/observability-lab
cd ~/observability-lab
```

### 2.2 Write the Prometheus Configuration File

```bash
cat > ~/observability-lab/prometheus.yml << 'EOF'
# Prometheus basic configuration file
global:
  scrape_interval: 15s          # Collect metrics every 15 seconds
  evaluation_interval: 15s      # Evaluate alerting rules every 15 seconds

scrape_configs:
  # Collect Prometheus's own metrics
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]

  # Node Exporter (system metrics)
  - job_name: "node-exporter"
    static_configs:
      - targets: ["node-exporter:9100"]
EOF
```

Field descriptions:

| Field | Description |
|-------|-------------|
| `scrape_interval` | The interval for collecting metrics. The default is 15 seconds |
| `scrape_configs` | Defines where to fetch metrics from |
| `job_name` | The name of the scrape job. You can filter by this name in Grafana |
| `targets` | The addresses to fetch metrics from, in `host:port` format |

### 2.3 Write the Docker Compose File

```bash
cat > ~/observability-lab/docker-compose.yml << 'EOF'
version: "3.8"

services:
  # ── Prometheus: Metric collection and storage ──
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - "--config.file=/etc/prometheus/prometheus.yml"
      - "--storage.tsdb.retention.time=7d"
    restart: unless-stopped

  # ── Grafana: Visualization dashboard ──
  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3000:3000"
    volumes:
      - grafana_data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin
    restart: unless-stopped

  # ── Node Exporter: Linux system metrics ──
  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    ports:
      - "9100:9100"
    restart: unless-stopped

volumes:
  prometheus_data:
  grafana_data:
EOF
```

### Practical Tips

- `storage.tsdb.retention.time=7d` means metric data is retained for 7 days. For a lab environment, 7 days is sufficient.
- Setting `restart: unless-stopped` ensures Docker automatically restarts the containers even after a system reboot.
- Using volumes (`prometheus_data`, `grafana_data`) preserves data even if the containers are deleted.

---

## 3. Launch the Lab Environment

### 3.1 Start the Containers

```bash
cd ~/observability-lab
docker compose up -d
```

### Expected Output

```text
[+] Running 4/4
 ✔ Network observability-lab_default  Created    0.1s
 ✔ Container node-exporter            Started    0.5s
 ✔ Container prometheus               Started    0.5s
 ✔ Container grafana                  Started    0.5s
```

### 3.2 Check Container Status

```bash
docker compose ps
```

### Expected Output

```text
NAME             IMAGE                      COMMAND                  SERVICE          PORTS                    STATUS
grafana          grafana/grafana:latest      "/run.sh"                grafana          0.0.0.0:3000->3000/tcp   Up 10 seconds
node-exporter    prom/node-exporter:latest   "/bin/node_exporter"     node-exporter    0.0.0.0:9100->9100/tcp   Up 10 seconds
prometheus       prom/prometheus:latest      "/bin/prometheus --c…"   prometheus       0.0.0.0:9090->9090/tcp   Up 10 seconds
```

If the STATUS of all three containers shows `Up`, you are good to go.

### Note

- If you see a `port is already allocated` error, another process is already using that port. Run `docker compose down` and either change the port or terminate the existing process.
- Downloading the images for the first time takes some time, approximately 1 to 5 minutes depending on your network.

---

## 4. Verify Prometheus Access

### Web UI Check

Open [http://localhost:9090](http://localhost:9090) in your browser.

If the Prometheus web interface appears, it is working. You can check the list of scrape targets under the **Status > Targets** menu.

### Verify via API

```bash
curl http://localhost:9090/api/v1/targets
```

### Expected Output (Excerpt)

```json
{
  "status": "success",
  "data": {
    "activeTargets": [
      {
        "discoveredLabels": {
          "__address__": "localhost:9090",
          "job": "prometheus"
        },
        "health": "up"
      },
      {
        "discoveredLabels": {
          "__address__": "node-exporter:9100",
          "job": "node-exporter"
        },
        "health": "up"
      }
    ]
  }
}
```

If `"health": "up"` is displayed, metrics are being collected normally.

### Simple Query Test

Enter the following in the query input field of the Prometheus web UI and click **Execute**.

```promql
up
```

### Expected Result

```text
up{instance="localhost:9090", job="prometheus"}    1
up{instance="node-exporter:9100", job="node-exporter"}    1
```

A value of `1` means the target is operating normally. A value of `0` indicates a connection issue.

---

## 5. Verify Grafana Access

### Web UI Access

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Login

```text
Username: admin
Password: admin
```

On first access, you will be prompted to change the password. For a lab environment, you can click **Skip**.

### Note

- If you change the password and forget it, you need to delete the Grafana volume to reset it. Run `docker compose down -v` and then `docker compose up -d` again. However, **all dashboard settings will also be deleted**.

---

## 6. Add Prometheus as a Data Source in Grafana

To view Prometheus metrics in Grafana, you need to register a data source.

### Registration Steps

1. Click **Connections > Data sources** in the Grafana left menu
2. Click **Add data source**
3. Select **Prometheus**
4. In the **Connection** section, enter the URL:

```text
http://prometheus:9090
```

5. Leave everything else at the defaults and click **Save & test** at the bottom

### Expected Result

```text
✓ Successfully queried the Prometheus API.
```

### Note

You must enter **`prometheus`** in the URL, not `localhost`. Containers in the same Docker Compose network communicate with each other using their **service names**. Using `localhost` would point to the Grafana container itself, causing the connection to fail.

### Practical Tips

- After adding the data source, you can import community dashboards via **Dashboards > Import** in Grafana.
- Node Exporter dashboard ID: **1860** (enter 1860 in the search field to import it directly)
- Importing this dashboard lets you see system metrics such as CPU, memory, disk, and network at a glance.

---

## 7. node_exporter (Linux System Metrics)

The Docker Compose file already includes node_exporter. You can verify it immediately without any additional installation.

### View Metrics Directly

```bash
curl http://localhost:9100/metrics | head -20
```

### Expected Output (Excerpt)

```text
# HELP node_cpu_seconds_total Seconds the CPUs spent in each mode.
# TYPE node_cpu_seconds_total counter
node_cpu_seconds_total{cpu="0",mode="idle"} 12345.67
node_cpu_seconds_total{cpu="0",mode="system"} 234.56
node_cpu_seconds_total{cpu="0",mode="user"} 567.89
# HELP node_memory_MemTotal_bytes Memory information field MemTotal_bytes.
# TYPE node_memory_MemTotal_bytes gauge
node_memory_MemTotal_bytes 1.6777216e+10
```

### Commonly Used Metrics in Practice

| Metric | Description |
|--------|-------------|
| `node_cpu_seconds_total` | CPU time spent (by mode) |
| `node_memory_MemTotal_bytes` | Total memory size |
| `node_memory_MemAvailable_bytes` | Available memory |
| `node_filesystem_avail_bytes` | Available disk space |
| `node_network_receive_bytes_total` | Network bytes received |

### Installing Directly on a Linux Host (Optional)

If you want to collect metrics from the Linux host itself rather than from Docker, you can install it directly.

```bash
# Ubuntu/Debian
sudo apt install prometheus-node-exporter -y

# Start the service
sudo systemctl start node_exporter
sudo systemctl enable node_exporter

# Verify
curl http://localhost:9100/metrics | head -5
```

---

## 8. ELK Stack / Loki Overview (Log Collection, Optional)

Metrics are collected with Prometheus, but **logs** require a separate tool. The two most common options are the ELK Stack and Loki.

### ELK vs Loki Comparison

| Category | ELK Stack | Loki |
|----------|-----------|------|
| Components | Elasticsearch + Logstash + Kibana | Loki + Promtail + Grafana |
| Resources | Heavy (requires a lot of memory) | Lightweight (no indexing) |
| Learning Curve | High | Low (similar to Prometheus) |
| Search Method | Full-text search | Label-based filtering |
| Recommended For | Large-scale environments | Learning environments, small-scale |

### Add Loki to Docker Compose (Optional)

You can add the following to your existing `docker-compose.yml` to run Loki alongside the other services.

```yaml
  # ── Loki: Log collection and storage ──
  loki:
    image: grafana/loki:latest
    container_name: loki
    ports:
      - "3100:3100"
    restart: unless-stopped

  # ── Promtail: Log collection agent ──
  promtail:
    image: grafana/promtail:latest
    container_name: promtail
    volumes:
      - /var/log:/var/log:ro
    command: -config.file=/etc/promtail/config.yml
    restart: unless-stopped
```

After adding Loki and registering it as a data source in Grafana, you can view metrics (Prometheus) and logs (Loki) on the **same dashboard**.

### Practical Tips

- For lab environments, **Loki is recommended**. The ELK Stack requires at least 4GB of memory for Elasticsearch alone, which can be demanding on a laptop.
- Loki is made by Grafana Labs, the same company behind Prometheus, so it integrates seamlessly with Grafana.

---

## 9. Full Environment Verification

Once everything is installed, verify all at once with the following commands.

```bash
echo "=== Docker Compose 상태 ==="
cd ~/observability-lab && docker compose ps

echo ""
echo "=== Prometheus API ==="
curl -s http://localhost:9090/api/v1/targets | python3 -m json.tool | head -10

echo ""
echo "=== Grafana 상태 ==="
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:3000

echo ""
echo "=== Node Exporter 상태 ==="
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:9100/metrics
```

### Expected Output

```text
=== Docker Compose 상태 ===
NAME             IMAGE                      SERVICE          STATUS
grafana          grafana/grafana:latest      grafana          Up 5 minutes
node-exporter    prom/node-exporter:latest   node-exporter    Up 5 minutes
prometheus       prom/prometheus:latest      prometheus       Up 5 minutes

=== Prometheus API ===
{
    "status": "success",
    "data": {
        "activeTargets": [
            {

=== Grafana 상태 ===
HTTP Status: 200

=== Node Exporter 상태 ===
HTTP Status: 200
```

### Minimum Required Checklist

```
[  ] docker compose ps                → All 3 containers Up
[  ] curl localhost:9090              → Prometheus web UI accessible
[  ] curl localhost:3000              → Grafana web UI accessible (admin/admin)
[  ] Add Grafana data source          → "Successfully queried" message
[  ] curl localhost:9100/metrics      → Node Exporter metrics output
```

### Lab Environment Management

```bash
# Stop (preserve data)
cd ~/observability-lab && docker compose stop

# Restart
cd ~/observability-lab && docker compose start

# Full removal (data is also deleted)
cd ~/observability-lab && docker compose down -v
```

### Note

- `docker compose down` only deletes containers. Add the `-v` option to also delete volumes (data).
- During labs, use `stop/start`. Only use `down -v` when you want a full reset.
- If a port conflict occurs, run `docker compose down` and change the port number in `docker-compose.yml` (e.g., `"9091:9090"`).

---

## Next Steps

Once the environment is ready, start with [Observability Concepts](./01-concept). Once you understand the differences between monitoring, logging, and tracing, and why observability matters, you will naturally understand why Prometheus and Grafana are configured this way.
