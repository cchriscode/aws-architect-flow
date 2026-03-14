# 옵저버빌리티 학습 환경 준비

> 이 문서는 옵저버빌리티(Observability) 강의를 시작하기 **전에** 필요한 도구를 설치하고 실습 환경을 세팅하는 가이드예요. Prometheus, Grafana, 로그 수집 도구까지 Docker Compose로 한 번에 띄울 수 있도록 준비해요. 모든 단계를 완료하면 [옵저버빌리티 개념](./01-concept)부터 바로 시작할 수 있어요.

---

## 필요한 도구 목록

```
도구              용도                              필수 여부
─────────────────────────────────────────────────────────────
Docker            컨테이너 실행 환경                   필수
Docker Compose    여러 컨테이너 한 번에 관리            필수
Prometheus        메트릭 수집 및 조회                  필수
Grafana           대시보드 시각화                      필수
node_exporter     Linux 시스템 메트릭 수집             권장
Loki              로그 수집 (ELK 대안)                 선택
curl              API 테스트 및 메트릭 확인            필수
```

---

## 1. Docker + Docker Compose 설치

옵저버빌리티 실습 도구들은 전부 Docker로 실행해요. Docker가 없으면 아무것도 진행할 수 없어요.

### 설치 확인

이미 [03-containers](../03-containers/02-docker-basics) 과정에서 Docker를 설치했다면, 아래 명령어로 확인만 하면 돼요.

```bash
docker --version
docker compose version
```

### 예상 출력

```text
Docker version 24.0.7, build afdd53b
Docker Compose version v2.23.3
```

### 아직 설치하지 않았다면

| OS | 설치 방법 |
|-----|----------|
| **Windows** | [Docker Desktop](https://www.docker.com/products/docker-desktop/) 다운로드 및 설치 (WSL2 백엔드 활성화) |
| **Mac** | [Docker Desktop](https://www.docker.com/products/docker-desktop/) 다운로드 및 설치 또는 `brew install --cask docker` |
| **Linux (Ubuntu)** | 아래 명령어 실행 |

```bash
# Linux 설치
sudo apt update
sudo apt install docker.io docker-compose-v2 -y
sudo usermod -aG docker $USER
newgrp docker
```

### 주의

- Windows에서는 **WSL2 백엔드**가 활성화되어 있어야 해요. Docker Desktop 설정에서 확인하세요.
- `docker compose` 명령어가 안 되면 `docker-compose`(하이픈 포함)를 시도해보세요. 구버전 Docker Compose는 별도 바이너리로 설치돼요.
- Linux에서 `docker` 명령어 앞에 매번 `sudo`를 붙여야 한다면, `usermod` 명령어를 실행한 후 **터미널을 재시작**하세요.

---

## 2. Prometheus + Grafana Docker Compose 파일 준비

실습용 디렉토리를 만들고, Docker Compose 파일을 작성해요. 이 파일 하나로 Prometheus와 Grafana를 동시에 실행할 수 있어요.

### 2.1 디렉토리 구조 만들기

```bash
mkdir -p ~/observability-lab
cd ~/observability-lab
```

### 2.2 Prometheus 설정 파일 작성

```bash
cat > ~/observability-lab/prometheus.yml << 'EOF'
# Prometheus 기본 설정 파일
global:
  scrape_interval: 15s          # 15초마다 메트릭 수집
  evaluation_interval: 15s      # 15초마다 알림 규칙 평가

scrape_configs:
  # Prometheus 자체 메트릭 수집
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]

  # Node Exporter (시스템 메트릭)
  - job_name: "node-exporter"
    static_configs:
      - targets: ["node-exporter:9100"]
EOF
```

각 항목 설명:

| 항목 | 설명 |
|------|------|
| `scrape_interval` | 메트릭을 수집하는 주기. 15초가 기본값이에요 |
| `scrape_configs` | 어디서 메트릭을 가져올지 정의해요 |
| `job_name` | 수집 작업의 이름. Grafana에서 이 이름으로 필터링해요 |
| `targets` | 메트릭을 가져올 주소. `호스트:포트` 형식이에요 |

### 2.3 Docker Compose 파일 작성

```bash
cat > ~/observability-lab/docker-compose.yml << 'EOF'
version: "3.8"

services:
  # ── Prometheus: 메트릭 수집 및 저장 ──
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

  # ── Grafana: 시각화 대시보드 ──
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

  # ── Node Exporter: Linux 시스템 메트릭 ──
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

### 실무 팁

- `storage.tsdb.retention.time=7d`는 메트릭 데이터를 7일간 보관한다는 뜻이에요. 실습 환경이니까 7일이면 충분해요.
- `restart: unless-stopped`를 설정하면, 컴퓨터를 재부팅해도 Docker가 자동으로 컨테이너를 다시 시작해요.
- 볼륨(`prometheus_data`, `grafana_data`)을 사용하면 컨테이너를 삭제해도 데이터가 유지돼요.

---

## 3. 실습 환경 실행

### 3.1 컨테이너 실행

```bash
cd ~/observability-lab
docker compose up -d
```

### 예상 출력

```text
[+] Running 4/4
 ✔ Network observability-lab_default  Created    0.1s
 ✔ Container node-exporter            Started    0.5s
 ✔ Container prometheus               Started    0.5s
 ✔ Container grafana                  Started    0.5s
```

### 3.2 컨테이너 상태 확인

```bash
docker compose ps
```

### 예상 출력

```text
NAME             IMAGE                      COMMAND                  SERVICE          PORTS                    STATUS
grafana          grafana/grafana:latest      "/run.sh"                grafana          0.0.0.0:3000->3000/tcp   Up 10 seconds
node-exporter    prom/node-exporter:latest   "/bin/node_exporter"     node-exporter    0.0.0.0:9100->9100/tcp   Up 10 seconds
prometheus       prom/prometheus:latest      "/bin/prometheus --c…"   prometheus       0.0.0.0:9090->9090/tcp   Up 10 seconds
```

세 개 컨테이너의 STATUS가 모두 `Up`이면 성공이에요.

### 주의

- `port is already allocated` 에러가 나오면, 해당 포트를 이미 다른 프로세스가 사용하고 있는 거예요. `docker compose down` 후 포트를 변경하거나, 기존 프로세스를 종료하세요.
- 이미지를 처음 다운로드하면 시간이 좀 걸려요. 네트워크 상태에 따라 1~5분 정도 소요돼요.

---

## 4. Prometheus 접속 확인

### 웹 UI 확인

브라우저에서 [http://localhost:9090](http://localhost:9090)에 접속해요.

Prometheus 웹 화면이 나오면 성공이에요. 상단의 **Status > Targets** 메뉴에서 수집 대상 목록을 확인할 수 있어요.

### API로 확인

```bash
curl http://localhost:9090/api/v1/targets
```

### 예상 출력 (일부 발췌)

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

`"health": "up"`이 표시되면 정상적으로 메트릭을 수집하고 있는 거예요.

### 간단한 쿼리 테스트

Prometheus 웹 UI의 쿼리 입력창에 아래를 입력하고 **Execute**를 클릭해보세요.

```promql
up
```

### 예상 결과

```text
up{instance="localhost:9090", job="prometheus"}    1
up{instance="node-exporter:9100", job="node-exporter"}    1
```

값이 `1`이면 해당 대상이 정상 동작 중이라는 뜻이에요. `0`이면 연결에 문제가 있는 거예요.

---

## 5. Grafana 접속 확인

### 웹 UI 접속

브라우저에서 [http://localhost:3000](http://localhost:3000)에 접속해요.

### 로그인

```text
Username: admin
Password: admin
```

처음 접속하면 비밀번호 변경을 요청해요. 실습 환경이면 **Skip**을 눌러도 돼요.

### 주의

- 비밀번호를 변경한 후 잊어버리면, Grafana 볼륨을 삭제해야 초기화돼요. `docker compose down -v` 후 다시 `docker compose up -d`를 실행하세요. 단, **모든 대시보드 설정도 함께 삭제**돼요.

---

## 6. Grafana에 Prometheus 데이터소스 추가

Grafana에서 Prometheus 메트릭을 보려면, 데이터소스를 등록해야 해요.

### 등록 절차

1. Grafana 왼쪽 메뉴에서 **Connections > Data sources** 클릭
2. **Add data source** 클릭
3. **Prometheus** 선택
4. **Connection** 섹션에서 URL 입력:

```text
http://prometheus:9090
```

5. 나머지는 기본값 그대로 두고, 하단의 **Save & test** 클릭

### 예상 결과

```text
✓ Successfully queried the Prometheus API.
```

### 주의

URL에 `localhost`가 아니라 **`prometheus`**를 입력해야 해요. Docker Compose에서 같은 네트워크에 있는 컨테이너끼리는 **서비스 이름**으로 통신해요. `localhost`를 쓰면 Grafana 컨테이너 자기 자신을 가리키기 때문에 연결이 실패해요.

### 실무 팁

- 데이터소스를 추가한 후, Grafana에서 **Dashboards > Import**로 커뮤니티 대시보드를 가져올 수 있어요.
- Node Exporter 대시보드 ID: **1860** (검색창에 1860을 입력하면 바로 가져올 수 있어요)
- 이 대시보드를 가져오면 CPU, 메모리, 디스크, 네트워크 등 시스템 메트릭을 한눈에 볼 수 있어요.

---

## 7. node_exporter (Linux 시스템 메트릭)

Docker Compose에 이미 node_exporter가 포함되어 있어요. 별도 설치 없이 바로 확인할 수 있어요.

### 메트릭 직접 확인

```bash
curl http://localhost:9100/metrics | head -20
```

### 예상 출력 (일부)

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

### 실무에서 자주 보는 메트릭

| 메트릭 | 설명 |
|--------|------|
| `node_cpu_seconds_total` | CPU 사용 시간 (모드별) |
| `node_memory_MemTotal_bytes` | 전체 메모리 크기 |
| `node_memory_MemAvailable_bytes` | 사용 가능한 메모리 |
| `node_filesystem_avail_bytes` | 디스크 여유 공간 |
| `node_network_receive_bytes_total` | 네트워크 수신 바이트 |

### Linux 호스트에 직접 설치하려면 (선택)

Docker가 아닌 Linux 호스트의 메트릭을 수집하고 싶다면, 직접 설치할 수도 있어요.

```bash
# Ubuntu/Debian
sudo apt install prometheus-node-exporter -y

# 서비스 시작
sudo systemctl start node_exporter
sudo systemctl enable node_exporter

# 확인
curl http://localhost:9100/metrics | head -5
```

---

## 8. ELK Stack / Loki 소개 (로그 수집, 선택)

메트릭은 Prometheus로 수집하지만, **로그**는 별도 도구가 필요해요. 대표적으로 ELK Stack과 Loki가 있어요.

### ELK vs Loki 비교

| 항목 | ELK Stack | Loki |
|------|-----------|------|
| 구성 | Elasticsearch + Logstash + Kibana | Loki + Promtail + Grafana |
| 리소스 | 무거움 (메모리 많이 필요) | 가벼움 (인덱싱 안 함) |
| 학습 곡선 | 높음 | 낮음 (Prometheus와 유사) |
| 검색 방식 | 전문 검색 (Full-text) | 라벨 기반 필터링 |
| 실습 추천 | 대규모 환경 | 학습 환경, 소규모 |

### Loki Docker Compose 추가 (선택)

기존 `docker-compose.yml`에 아래 내용을 추가하면 Loki도 함께 실행할 수 있어요.

```yaml
  # ── Loki: 로그 수집 및 저장 ──
  loki:
    image: grafana/loki:latest
    container_name: loki
    ports:
      - "3100:3100"
    restart: unless-stopped

  # ── Promtail: 로그 수집 에이전트 ──
  promtail:
    image: grafana/promtail:latest
    container_name: promtail
    volumes:
      - /var/log:/var/log:ro
    command: -config.file=/etc/promtail/config.yml
    restart: unless-stopped
```

Loki를 추가한 후 Grafana에서 데이터소스로 등록하면, 메트릭(Prometheus)과 로그(Loki)를 **같은 대시보드**에서 볼 수 있어요.

### 실무 팁

- 실습 환경에서는 **Loki를 권장**해요. ELK Stack은 Elasticsearch만으로도 최소 4GB 메모리가 필요해서, 노트북에서 돌리기 부담스러워요.
- Loki는 Prometheus와 같은 Grafana Labs 제품이라, Grafana와 자연스럽게 연동돼요.

---

## 9. 전체 환경 확인

모든 설치가 끝났으면 아래 명령어로 한 번에 확인해요.

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

### 예상 출력

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

### 최소 필수 체크리스트

```
[  ] docker compose ps                → 3개 컨테이너 모두 Up
[  ] curl localhost:9090              → Prometheus 웹 UI 접속
[  ] curl localhost:3000              → Grafana 웹 UI 접속 (admin/admin)
[  ] Grafana 데이터소스 추가           → "Successfully queried" 메시지
[  ] curl localhost:9100/metrics      → Node Exporter 메트릭 출력
```

### 실습 환경 관리

```bash
# 중지 (데이터 유지)
cd ~/observability-lab && docker compose stop

# 다시 시작
cd ~/observability-lab && docker compose start

# 완전 삭제 (데이터도 삭제)
cd ~/observability-lab && docker compose down -v
```

### 주의

- `docker compose down`은 컨테이너만 삭제하고, `-v` 옵션을 붙여야 볼륨(데이터)도 삭제돼요.
- 실습 중에는 `stop/start`를 사용하고, 완전히 초기화하고 싶을 때만 `down -v`를 사용하세요.
- 포트 충돌이 발생하면 `docker compose down` 후 `docker-compose.yml`에서 포트 번호를 변경하세요 (예: `"9091:9090"`).

---

## 다음 단계

환경 준비가 끝났으면, [옵저버빌리티 개념](./01-concept)부터 시작하세요. 모니터링, 로깅, 트레이싱의 차이와 왜 옵저버빌리티가 중요한지 먼저 이해하고 나면, Prometheus와 Grafana를 왜 이렇게 구성하는지 자연스럽게 이해돼요.
