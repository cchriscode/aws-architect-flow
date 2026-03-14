# SRE 학습 환경 준비

> SRE(Site Reliability Engineering) 강의를 시작하기 전에, 실습에 필요한 도구들을 미리 설치하고 확인해요. 부하 테스트, 모니터링, Chaos Engineering 등 다양한 실습이 있어서 **준비할 것이 꽤 많지만**, 이 문서를 따라가면 하나씩 설치할 수 있어요.

---

## 선수 과목

SRE 과정을 시작하기 전에 아래 내용을 먼저 학습하거나 익혀두세요.

```
필수 선수 지식:

[01-linux]     리눅스 기본 명령어     → 서버 접속, 프로세스 관리, 로그 확인
[03-containers] Docker 기본 사용법    → 컨테이너로 서비스 실행/관리
[08-observability] 모니터링 기초      → Prometheus, Grafana 이해
```

이 과정에서는 위 내용을 **이미 알고 있다는 전제**로 진행해요. 특히 Docker와 모니터링 도구는 거의 매 실습에서 사용돼요.

---

## 1. Docker + Docker Compose 설치

SRE 실습의 대부분은 Docker 컨테이너 위에서 진행돼요. 아직 설치하지 않았다면 [03-containers](../03-containers/02-docker-basics)를 참고하세요.

### 이미 설치한 경우 버전 확인

```bash
docker --version
```

### 예상 출력

```text
Docker version 27.1.1, build 6312585
```

```bash
docker compose version
```

### 예상 출력

```text
Docker Compose version v2.29.1
```

### 주의

- Docker Compose는 **v2** 이상을 사용하세요. 예전 `docker-compose` (하이픈 포함) 명령어는 v1이에요.
- Windows/Mac은 Docker Desktop을 설치하면 Compose가 함께 포함돼요.
- Linux는 별도로 Docker Compose 플러그인을 설치해야 할 수 있어요.

```bash
# Linux에서 Docker Compose 플러그인 설치
sudo apt update
sudo apt install docker-compose-plugin
```

---

## 2. Prometheus + Grafana 설치

SRE에서 SLI/SLO를 측정하고 대시보드를 만들 때 필수적인 도구예요. [08-observability](../08-observability/01-concept)에서 이미 다뤘지만, 여기서 빠르게 Docker로 띄우는 방법을 정리해요.

### Docker Compose로 한 번에 설치

아래 내용을 `docker-compose-monitoring.yml` 파일로 저장하세요.

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

### 기본 Prometheus 설정 파일

`prometheus.yml` 파일을 같은 디렉토리에 만드세요.

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: "prometheus"
    static_configs:
      - targets: ["localhost:9090"]
```

### 실행

```bash
docker compose -f docker-compose-monitoring.yml up -d
```

### 확인

```bash
# Prometheus 확인
curl -s http://localhost:9090/-/healthy
```

```text
Prometheus Server is Healthy.
```

```bash
# Grafana 확인 (초기 로그인: admin / admin)
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/login
```

```text
200
```

### 실무 팁

- Grafana 초기 비밀번호는 `admin`이에요. 실습 환경에서는 그대로 써도 되지만, 실무에서는 반드시 변경하세요.
- Prometheus 데이터는 컨테이너를 삭제하면 사라져요. 영구 보관이 필요하면 Docker 볼륨을 마운트하세요.

---

## 3. 부하 테스트 도구 설치

SRE에서는 "시스템이 얼마나 버티는지" 테스트하는 것이 핵심이에요. 부하 테스트 도구를 설치해요.

### 3.1 stress-ng (시스템 리소스 부하)

CPU, 메모리, 디스크에 부하를 줘서 시스템의 한계를 테스트하는 도구예요.

```bash
# Ubuntu / Debian
sudo apt update
sudo apt install -y stress-ng
```

```bash
# Mac
brew install stress-ng
```

### 확인

```bash
stress-ng --version
```

### 예상 출력

```text
stress-ng, version 0.17.08
```

### 간단한 테스트

```bash
# CPU 2코어에 10초 동안 부하
stress-ng --cpu 2 --timeout 10s --metrics-brief
```

### 예상 출력

```text
stress-ng: info:  [12345] setting to a 10 secs run per stressor
stress-ng: info:  [12345] dispatching hogs: 2 cpu
stress-ng: info:  [12345] stressor       bogo ops real time  usr time  sys time
stress-ng: info:  [12345]                           (secs)    (secs)    (secs)
stress-ng: info:  [12345] cpu               18934     10.00     19.97      0.01
stress-ng: info:  [12345] successful run completed in 10.00s
```

### 주의

- 프로덕션 서버에서는 **절대 실행하지 마세요**. 실습 환경 또는 별도의 테스트 서버에서만 사용하세요.
- `--timeout` 옵션을 반드시 지정하세요. 안 그러면 수동으로 중지할 때까지 계속 돌아가요.

---

### 3.2 hey (HTTP 부하 테스트)

웹 서버에 HTTP 요청을 대량으로 보내서 성능을 측정하는 도구예요. Apache Bench(ab)의 현대적인 대안이에요.

#### Go가 설치된 경우

```bash
go install github.com/rakyll/hey@latest
```

#### Mac

```bash
brew install hey
```

#### Linux (바이너리 직접 다운로드)

```bash
wget https://hey-release.s3.us-east-2.amazonaws.com/hey_linux_amd64
chmod +x hey_linux_amd64
sudo mv hey_linux_amd64 /usr/local/bin/hey
```

### 확인

```bash
hey --help | head -1
```

### 예상 출력

```text
Usage: hey [options...] <url>
```

### 간단한 테스트

```bash
# 로컬 서버에 요청 10개 보내기 (서버가 실행 중이어야 함)
hey -n 10 -c 2 http://localhost:8080/
```

### 예상 출력

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

### 3.3 wrk (고급 HTTP 부하 테스트, optional)

hey보다 더 정밀한 부하 테스트가 필요할 때 사용해요. Lua 스크립트로 요청을 커스터마이징할 수 있어요.

```bash
# Ubuntu / Debian
sudo apt install -y wrk
```

```bash
# Mac
brew install wrk
```

### 확인

```bash
wrk --version
```

### 예상 출력

```text
wrk 4.2.0 [epoll] Copyright (C) 2012 Will Glozer
```

### 실무 팁

- **hey**는 간단한 부하 테스트에 적합하고, **wrk**는 Lua 스크립트로 복잡한 시나리오(인증 토큰 포함, POST 요청 등)를 만들 수 있어요.
- 실습에서는 주로 **hey**를 사용해요. wrk는 필요할 때 추가로 설치해도 돼요.

---

## 4. Chaos Engineering 도구 소개

Chaos Engineering은 "의도적으로 장애를 주입해서 시스템의 약점을 미리 찾는" 접근법이에요. 여기서는 도구만 소개하고, **실제 설치와 실습은 Kubernetes 편에서 진행**해요.

### 주요 도구

| 도구 | 설명 | 설치 시점 |
|------|------|-----------|
| **Litmus** | Kubernetes 네이티브 Chaos Engineering 플랫폼 | [05-chaos-engineering](./05-chaos-engineering)에서 |
| **Chaos Monkey** | Netflix가 만든 원조 Chaos Engineering 도구 | 클라우드 환경 실습 시 |
| **Gremlin** | 상용 Chaos Engineering 플랫폼 (무료 티어 제공) | 선택 사항 |
| **chaos-mesh** | CNCF 프로젝트, K8s 기반 | K8s 고급 실습 시 |

### 지금 설치하지 않는 이유

```
Chaos Engineering 도구들은 대부분 Kubernetes 위에서 동작해요.
K8s 클러스터가 있어야 설치하고 실습할 수 있어요.

이 단계에서는:
  - 개념을 이해하고
  - Docker 기반 간단한 장애 시뮬레이션(네트워크 지연, 컨테이너 종료)을 먼저 연습해요

본격적인 Chaos Engineering은 05-chaos-engineering 강의에서 다뤄요.
```

---

## 5. 샘플 애플리케이션 준비

SRE 실습에는 "부하를 받을 대상 서비스"가 필요해요. 간단한 웹 애플리케이션을 Docker Compose로 준비해요.

### Flask 기반 샘플 앱

프로젝트 디렉토리를 만들고, 아래 파일들을 생성하세요.

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
    """의도적으로 느린 엔드포인트 (SLO 위반 테스트용)"""
    delay = random.uniform(0.5, 3.0)
    time.sleep(delay)
    return jsonify({"status": "ok", "delay_seconds": round(delay, 2)})

@app.route("/error")
def error():
    """의도적으로 에러를 발생시키는 엔드포인트"""
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

### 실행

```bash
cd ~/sre-lab
docker compose up -d --build
```

### 확인

```bash
curl http://localhost:8080/
```

### 예상 출력

```json
{"service":"sre-sample","status":"ok"}
```

```bash
curl http://localhost:8080/health
```

### 예상 출력

```json
{"status":"healthy"}
```

### 부하 테스트 연습

```bash
# 100개 요청, 동시 10개
hey -n 100 -c 10 http://localhost:8080/

# 느린 엔드포인트에 부하
hey -n 20 -c 5 http://localhost:8080/slow
```

### 실무 팁

- `/slow`와 `/error` 엔드포인트는 SLI/SLO 위반을 테스트할 때 사용해요.
- `deploy.resources.limits`로 CPU와 메모리를 제한해 두었어요. 이렇게 해야 부하 테스트 때 리소스 고갈 상황을 시뮬레이션할 수 있어요.
- 나중에 Prometheus가 이 앱의 메트릭을 수집하도록 연결할 거예요.

---

## 6. 알림(Alerting) 실습 도구 (Optional)

실제 인시던트 관리를 체험하려면 알림 서비스 계정이 있으면 좋아요. **필수는 아니에요.**

| 서비스 | 무료 티어 | 용도 |
|--------|-----------|------|
| **PagerDuty** | 14일 무료 체험 | 온콜 스케줄링, 에스컬레이션 |
| **Opsgenie** (Atlassian) | 5명까지 무료 | 알림 라우팅, 온콜 관리 |
| **Slack Webhook** | 무료 | 간단한 알림 수신 |

### 가장 간단한 방법: Slack Webhook

Slack 워크스페이스가 있다면, Incoming Webhook을 만들어서 알림 실습에 사용할 수 있어요.

```bash
# Slack Webhook 테스트
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"SRE 알림 테스트입니다!"}' \
  https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### 주의

- PagerDuty나 Opsgenie는 **무료 체험 기간이 제한**돼요. 강의 진도에 맞춰서 가입하는 것을 권장해요.
- Slack Webhook만으로도 알림 실습의 핵심은 충분히 경험할 수 있어요.

---

## 최종 환경 확인 체크리스트

모든 설치가 완료되었는지 아래 명령어를 순서대로 실행해서 확인하세요.

```bash
echo "=== Docker ==="
docker --version
docker compose version

echo ""
echo "=== 부하 테스트 도구 ==="
stress-ng --version
hey --help | head -1

echo ""
echo "=== 모니터링 ==="
curl -s http://localhost:9090/-/healthy
curl -s -o /dev/null -w "Grafana HTTP: %{http_code}\n" http://localhost:3000/login

echo ""
echo "=== 샘플 앱 ==="
curl -s http://localhost:8080/health
```

### 예상 출력

```text
=== Docker ===
Docker version 27.1.1, build 6312585
Docker Compose version v2.29.1

=== 부하 테스트 도구 ===
stress-ng, version 0.17.08
Usage: hey [options...] <url>

=== 모니터링 ===
Prometheus Server is Healthy.
Grafana HTTP: 200

=== 샘플 앱 ===
{"status":"healthy"}
```

### 주의

- 위 출력에서 버전 번호는 설치 시점에 따라 다를 수 있어요. 명령어가 정상 실행되면 괜찮아요.
- 모니터링과 샘플 앱은 Docker 컨테이너가 **실행 중**이어야 응답해요. `docker ps`로 확인하세요.
- wrk는 optional이라 체크리스트에 포함하지 않았어요. 설치했다면 `wrk --version`으로 확인하면 돼요.

---

## 문제 해결

### Docker 관련

```bash
# 컨테이너가 안 뜰 때 로그 확인
docker compose logs -f

# 포트 충돌 시 사용 중인 프로세스 확인
sudo lsof -i :8080
sudo lsof -i :9090
sudo lsof -i :3000
```

### stress-ng 설치 실패 시

```bash
# 패키지 목록 업데이트 후 재시도
sudo apt update && sudo apt install -y stress-ng

# 그래도 안 되면 소스에서 빌드
git clone https://github.com/ColinIanKing/stress-ng.git
cd stress-ng
make
sudo make install
```

### hey 설치 실패 시 (Go 없는 환경)

```bash
# 바이너리 직접 다운로드 (Linux amd64)
wget https://hey-release.s3.us-east-2.amazonaws.com/hey_linux_amd64
chmod +x hey_linux_amd64
sudo mv hey_linux_amd64 /usr/local/bin/hey

# Mac에서는 brew가 가장 간단
brew install hey
```

---

## 다음 단계

환경 준비가 완료되었다면, [SRE 원칙](./01-principles)부터 학습을 시작하세요. 첫 번째 강의에서는 SRE의 핵심 철학과 SLI/SLO/SLA의 개념을 다뤄요.
