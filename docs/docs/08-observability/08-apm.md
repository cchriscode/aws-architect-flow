# APM(Application Performance Monitoring) — 애플리케이션 성능의 모든 것을 한눈에

> [분산 추적](./06-tracing)에서 요청의 여정을 따라가는 법을 배웠고, [Observability 개념](./01-concept)에서 메트릭-로그-트레이스 세 기둥을 살펴봤죠? APM은 이 세 기둥을 **하나의 통합된 화면**에서 볼 수 있게 해주는 도구예요. 단순히 "서버가 살아있나?"를 넘어서 "사용자가 겪는 실제 경험이 어떤가?"를 측정하고, 병목을 찾고, 문제가 발생하기 전에 미리 알려주는 것 — 그게 APM이에요. Datadog, New Relic, Dynatrace, AWS X-Ray까지, 현대 DevOps 엔지니어가 반드시 알아야 하는 APM의 세계로 들어가 볼게요.

---

## 🎯 왜 APM을/를 알아야 하나요?

### 일상 비유: 자동차 계기판 이야기

여러분이 자동차를 운전한다고 상상해 보세요.

- **속도계만 있다면**: "지금 빠르긴 한데... 엔진에 문제가 있는지는 모르겠어요"
- **경고등도 있다면**: "엔진 경고등이 켜졌어! 근데 뭐가 문제인지는 몰라요"
- **종합 진단 시스템이 있다면**: "엔진 3번 실린더 점화 불량, 연비 15% 하락, 수리 권장"

**APM은 바로 이 종합 진단 시스템이에요.**

- 기본 모니터링 = 속도계 (CPU, Memory 같은 단순 메트릭)
- 알림 시스템 = 경고등 (임계값 초과 알림)
- APM = 종합 진단 시스템 (성능 병목, 에러 원인, 의존성 관계까지 전부 파악)

### APM이 없으면 생기는 문제

```
실무에서 APM이 필요한 순간:

• "사용자가 느리다고 하는데 서버 지표는 정상이에요"        → Transaction-level 성능 분석 필요
• "어떤 API가 가장 느린지 모르겠어요"                     → Endpoint별 응답시간 분석 필요
• "에러율이 올라갔는데 어떤 코드에서 발생하는지 몰라요"    → Error Tracking + Stack Trace 필요
• "DB 쿼리가 느린 건지, 외부 API가 느린 건지 구분이 안 돼요" → Dependency Mapping 필요
• "배포 후 성능이 나빠졌는데 어디가 문제인지 찾기 어려워요"  → 배포 전후 비교 분석 필요
• "마이크로서비스 간 호출 관계가 복잡해서 전체 그림이 안 보여요" → Service Map 필요
• "장애 원인을 찾는 데 매번 3시간씩 걸려요"                → AI 기반 근본 원인 분석 필요
```

### APM 없는 팀 vs APM 있는 팀

```mermaid
flowchart TD
    subgraph NO_APM["❌ APM 없는 팀"]
        N1["사용자: '결제가 느려요!'"] -->|"20분 후 인지"| N2["어디가 느린 거지?"]
        N2 -->|"서버 접속"| N3["로그 파일 grep...<br/>CPU? 메모리? DB?"]
        N3 -->|"30분 추측"| N4["결제 서비스인 것 같은데..."]
        N4 -->|"코드 분석"| N5["아, 외부 PG사 API가<br/>타임아웃 나고 있었어!"]
        N5 -->|"총 MTTR: 2시간+"| N6["😰 매출 손실"]
    end

    subgraph YES_APM["✅ APM 있는 팀"]
        Y1["APM 자동 감지<br/>결제 API P99 3초 초과"] -->|"즉시 알람"| Y2["Service Map 확인"]
        Y2 -->|"1분"| Y3["결제→PG사 API 구간<br/>응답시간 급증 확인"]
        Y3 -->|"2분"| Y4["PG사 API 타임아웃<br/>에러 스택 트레이스 확인"]
        Y4 -->|"5분"| Y5["Fallback 결제 수단<br/>활성화 + PG사 연락"]
        Y5 -->|"총 MTTR: 8분"| Y6["✅ 빠른 대응"]
    end

    style N6 fill:#e74c3c,color:#fff
    style N5 fill:#e74c3c,color:#fff
    style Y6 fill:#27ae60,color:#fff
    style Y5 fill:#27ae60,color:#fff
```

> **면접 단골 질문**: "모니터링과 APM의 차이를 설명해주세요"
> - **모니터링**: 인프라 수준의 지표 (CPU, Memory, Disk)를 감시해요
> - **APM**: 애플리케이션 수준의 성능 (트랜잭션 응답시간, 에러율, 의존성 성능)을 분석해요
> - 모니터링은 "서버가 건강한가?"를, APM은 "사용자가 만족하는가?"를 답해요

---

## 🧠 핵심 개념 잡기

### APM의 핵심 구성 요소

APM은 크게 **5가지 핵심 기능**으로 구성돼요.

| 기능 | 설명 | 비유 |
|------|------|------|
| **Transaction Tracking** | 사용자 요청의 시작부터 끝까지 추적 | 환자의 진료 기록 (접수→진찰→검사→처방→수납) |
| **Error Tracking** | 에러 발생 위치, 빈도, 스택 트레이스 수집 | 병원 오진 기록 시스템 (언제, 어디서, 왜 발생했나) |
| **Dependency Mapping** | 서비스 간 호출 관계와 외부 의존성 시각화 | 병원 부서 간 환자 이동 경로도 |
| **Performance Profiling** | 코드 레벨의 성능 병목 분석 | 정밀 검사 (어떤 장기의 어떤 부분이 문제인지) |
| **Real User Monitoring** | 실제 사용자가 체감하는 성능 측정 | 환자 만족도 조사 (실제 대기 시간, 경험 품질) |

### APM 데이터 흐름

```mermaid
flowchart LR
    subgraph APP["애플리케이션"]
        direction TB
        CODE["소스 코드"] -->|"자동 계측"| AGENT["APM Agent/SDK"]
        AGENT -->|"수집"| DATA["트랜잭션 데이터<br/>에러 데이터<br/>의존성 데이터<br/>프로파일링 데이터"]
    end

    subgraph TRANSPORT["전송 계층"]
        COLLECTOR["Collector / Daemon"]
    end

    subgraph BACKEND["APM 백엔드"]
        direction TB
        STORE["저장소<br/>시계열 DB + 검색 엔진"]
        AI["AI/ML 분석 엔진<br/>이상 탐지, 근본 원인 분석"]
        VIZ["시각화<br/>Service Map, Dashboard"]
    end

    subgraph OUTPUT["결과물"]
        direction TB
        DASHBOARD["대시보드"]
        ALERT["알림"]
        REPORT["보고서"]
    end

    DATA -->|"비동기 전송"| COLLECTOR
    COLLECTOR -->|"정제/집계"| STORE
    STORE --> AI
    STORE --> VIZ
    AI --> ALERT
    VIZ --> DASHBOARD
    AI --> REPORT

    style APP fill:#3498db,color:#fff
    style TRANSPORT fill:#f39c12,color:#fff
    style BACKEND fill:#2ecc71,color:#fff
    style OUTPUT fill:#9b59b6,color:#fff
```

### 핵심 용어 정리

| 용어 | 설명 | 예시 |
|------|------|------|
| **Transaction** | 사용자 요청 하나의 전체 처리 과정 | `POST /api/checkout` 요청의 시작~응답 |
| **Span** | Transaction 내의 개별 작업 단위 | DB 쿼리, HTTP 호출, 캐시 조회 |
| **Service Map** | 서비스 간 호출 관계를 시각화한 지도 | 주문→결제→재고→배송 의존성 그래프 |
| **Throughput** | 단위 시간당 처리한 트랜잭션 수 | 500 req/s |
| **Latency (P50/P95/P99)** | 응답 시간의 백분위수 | P99 = 200ms (99%의 요청이 200ms 이내) |
| **Error Rate** | 전체 요청 중 에러 비율 | 0.5% (1000건 중 5건 에러) |
| **Apdex Score** | 사용자 만족도 지수 (0~1) | 0.95 (매우 만족), 0.5 (불만족) |
| **Agent** | 애플리케이션에 설치하는 데이터 수집기 | Datadog Agent, New Relic Agent |
| **Instrumentation** | 코드에 측정 포인트를 삽입하는 과정 | 자동 계측 vs 수동 계측 |

### Apdex Score 이해하기

Apdex(Application Performance Index)는 사용자 만족도를 0~1로 수치화한 지표예요.

```
Apdex = (만족 수 + 허용 수 × 0.5) / 전체 요청 수

• 만족(Satisfied): 응답시간 ≤ T (예: 0.5초 이내)
• 허용(Tolerating): T < 응답시간 ≤ 4T (예: 0.5~2초)
• 불만족(Frustrated): 응답시간 > 4T (예: 2초 초과)

예시 (T = 0.5초, 총 1000건):
  - 만족: 800건, 허용: 150건, 불만족: 50건
  - Apdex = (800 + 150 × 0.5) / 1000 = 0.875

Apdex 해석:
  0.94 ~ 1.00  → Excellent (훌륭함)
  0.85 ~ 0.93  → Good (양호)
  0.70 ~ 0.84  → Fair (보통)
  0.50 ~ 0.69  → Poor (나쁨)
  0.00 ~ 0.49  → Unacceptable (심각)
```

---

## 🔍 하나씩 자세히 알아보기

### 1. Datadog APM

> **한 줄 요약**: "올인원 관측 플랫폼의 APM. 설치 쉽고, AI가 알아서 이상 징후를 찾아줘요."

#### Datadog 아키텍처

```mermaid
flowchart TB
    subgraph APP_LAYER["애플리케이션 레이어"]
        direction LR
        APP1["Python App<br/>dd-trace-py"]
        APP2["Java App<br/>dd-trace-java"]
        APP3["Node.js App<br/>dd-trace-js"]
    end

    subgraph HOST_LAYER["호스트 레이어"]
        DD_AGENT["Datadog Agent<br/>(포트 8126)"]
        DD_AGENT -->|"트레이스 수집"| BUFFER["로컬 버퍼<br/>+ 샘플링"]
    end

    subgraph DATADOG_CLOUD["Datadog 클라우드"]
        direction TB
        INTAKE["Trace Intake API"]
        STORE_DD["저장 + 인덱싱"]
        WATCHDOG["Watchdog AI<br/>이상 탐지 엔진"]
        SVC_MAP["Service Map"]
        DASH["Dashboards"]
        ALERTS_DD["Monitors & Alerts"]
    end

    APP1 & APP2 & APP3 -->|"트레이스 전송"| DD_AGENT
    BUFFER -->|"HTTPS"| INTAKE
    INTAKE --> STORE_DD
    STORE_DD --> WATCHDOG
    STORE_DD --> SVC_MAP
    STORE_DD --> DASH
    WATCHDOG --> ALERTS_DD

    style APP_LAYER fill:#632ca6,color:#fff
    style HOST_LAYER fill:#774aa4,color:#fff
    style DATADOG_CLOUD fill:#632ca6,color:#fff
```

#### Datadog Agent 설치 및 설정

```bash
# Linux에 Datadog Agent 설치
DD_API_KEY=<YOUR_API_KEY> DD_SITE="datadoghq.com" \
  bash -c "$(curl -L https://install.datadoghq.com/scripts/install_script_agent7.sh)"

# Agent 상태 확인
sudo datadog-agent status

# APM 활성화 확인 (기본적으로 활성화되어 있음)
# /etc/datadog-agent/datadog.yaml
```

```yaml
# /etc/datadog-agent/datadog.yaml
api_key: <YOUR_API_KEY>

# APM 설정
apm_config:
  enabled: true
  # 수집할 트레이스의 최대 수 (초당)
  max_traces_per_second: 10
  # 환경별 태그
  env: production

# 로그 수집 (트레이스-로그 연결을 위해)
logs_enabled: true

# 프로세스 모니터링
process_config:
  process_collection:
    enabled: true
```

#### Python 애플리케이션에 Datadog APM 적용

```python
# requirements.txt에 추가
# ddtrace>=2.0.0

# 방법 1: 자동 계측 (가장 간단!)
# 실행 시 ddtrace-run을 앞에 붙이면 됩니다
# $ ddtrace-run python app.py

# 방법 2: 코드 내 수동 설정
from ddtrace import tracer, patch_all

# 자동 패치 - Django, Flask, requests, psycopg2 등 자동 계측
patch_all()

# 트레이서 설정
tracer.configure(
    hostname='localhost',  # Datadog Agent 호스트
    port=8126,            # Datadog Agent APM 포트
)

# Flask 예시
from flask import Flask
app = Flask(__name__)

@app.route('/api/orders', methods=['POST'])
def create_order():
    # 자동으로 트레이스가 생성됩니다!

    # 커스텀 스팬 추가 (선택사항)
    with tracer.trace('order.validate', service='order-service') as span:
        span.set_tag('order.type', 'standard')
        validate_order(request.json)

    with tracer.trace('order.payment', service='order-service') as span:
        result = process_payment(request.json)
        span.set_tag('payment.method', result['method'])
        span.set_tag('payment.amount', result['amount'])

    with tracer.trace('order.save', service='order-service') as span:
        order = save_to_database(request.json)
        span.set_tag('order.id', order['id'])

    return jsonify(order), 201
```

```python
# 환경변수로 설정하는 방법 (Docker/Kubernetes에서 권장)
# docker-compose.yml
"""
services:
  web:
    build: .
    environment:
      - DD_AGENT_HOST=datadog-agent
      - DD_TRACE_AGENT_PORT=8126
      - DD_SERVICE=order-service
      - DD_ENV=production
      - DD_VERSION=1.2.3
      - DD_TRACE_SAMPLE_RATE=1.0
      - DD_LOGS_INJECTION=true    # 로그에 trace_id 자동 주입
      - DD_PROFILING_ENABLED=true # 프로파일링 활성화
    command: ddtrace-run python app.py

  datadog-agent:
    image: gcr.io/datadoghq/agent:7
    environment:
      - DD_API_KEY=${DD_API_KEY}
      - DD_APM_ENABLED=true
      - DD_LOGS_ENABLED=true
      - DD_PROCESS_AGENT_ENABLED=true
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - /proc/:/host/proc/:ro
      - /sys/fs/cgroup/:/host/sys/fs/cgroup:ro
    ports:
      - "8126:8126"    # APM
      - "8125:8125"    # StatsD
"""
```

#### Watchdog AI - Datadog의 자동 이상 탐지

Watchdog은 Datadog의 AI 엔진으로, **사람이 알림 규칙을 만들지 않아도** 자동으로 이상 징후를 감지해요.

```
Watchdog AI가 감지하는 것들:

🔍 성능 이상
  • "order-service의 P99 레이턴시가 평소 대비 300% 증가했어요"
  • "결제 API의 에러율이 0.1%에서 5%로 급증했어요"
  • "DB 커넥션 풀 사용률이 비정상적으로 높아요"

🔍 근본 원인 분석
  • "order-service 레이턴시 증가 → payment-service 응답 지연이 원인"
  • "에러율 증가 → 15:30 배포 이후 시작됨"
  • "메모리 사용량 급증 → 특정 엔드포인트의 N+1 쿼리가 원인"

🔍 자동 상관 관계
  • 메트릭 이상 + 관련 로그 + 영향받는 트레이스를 자동으로 연결
  • 배포 이벤트와 성능 변화 자동 상관 분석
```

---

### 2. New Relic

> **한 줄 요약**: "Full-Stack Observability 플랫폼. NRQL이라는 강력한 쿼리 언어로 데이터를 자유자재로 분석해요."

#### New Relic 핵심 특징

```
New Relic의 차별점:

1. Full-Stack Observability
   └─ APM + Infrastructure + Browser + Mobile + Synthetics + Logs = 한 곳에서

2. NRQL (New Relic Query Language)
   └─ SQL 같은 쿼리 언어로 모든 텔레메트리 데이터를 분석

3. Entity Explorer
   └─ 모든 서비스, 호스트, 컨테이너를 "엔티티"로 추상화하여 관리

4. AI Ops (Applied Intelligence)
   └─ 이상 탐지 + 인시던트 상관 분석 + 노이즈 제거

5. 무료 티어가 매우 넉넉
   └─ 매월 100GB 데이터 무료 수집 (1명의 Full Platform 사용자)
```

#### New Relic Agent 설치 (Python)

```python
# requirements.txt에 추가
# newrelic>=9.0.0

# newrelic.ini 설정 파일 생성
# $ newrelic-admin generate-config YOUR_LICENSE_KEY newrelic.ini
```

```ini
# newrelic.ini
[newrelic]
app_name = order-service
license_key = YOUR_LICENSE_KEY

# 분산 추적 활성화
distributed_tracing.enabled = true

# 트랜잭션 트레이서
transaction_tracer.enabled = true
transaction_tracer.transaction_threshold = apdex_f
transaction_tracer.record_sql = obfuscated

# 에러 수집
error_collector.enabled = true
error_collector.ignore_status_codes = 404

# 로그 포워딩
application_logging.enabled = true
application_logging.forwarding.enabled = true
application_logging.forwarding.max_samples_stored = 10000
```

```python
# Flask + New Relic 적용
import newrelic.agent
newrelic.agent.initialize('newrelic.ini')

from flask import Flask
app = Flask(__name__)

@app.route('/api/orders', methods=['POST'])
@newrelic.agent.function_trace()  # 커스텀 함수 트레이싱
def create_order():
    # New Relic이 자동으로 Flask 라우트를 트랜잭션으로 추적합니다

    # 커스텀 속성 추가
    newrelic.agent.add_custom_attributes([
        ('order.type', 'standard'),
        ('customer.tier', 'premium'),
    ])

    # 커스텀 이벤트 기록
    newrelic.agent.record_custom_event('OrderCreated', {
        'order_id': 'ord-123',
        'amount': 50000,
        'payment_method': 'card',
    })

    return process_order(request.json)

# 실행
# $ NEW_RELIC_CONFIG_FILE=newrelic.ini newrelic-admin run-program python app.py
```

#### NRQL (New Relic Query Language) 핵심 쿼리

```sql
-- 1. 서비스별 평균 응답 시간
SELECT average(duration) FROM Transaction
WHERE appName = 'order-service'
FACET name
SINCE 1 hour ago

-- 2. P99 레이턴시 트렌드
SELECT percentile(duration, 99) FROM Transaction
WHERE appName = 'order-service'
TIMESERIES 5 minutes
SINCE 6 hours ago

-- 3. 에러율 분석
SELECT percentage(count(*), WHERE error IS true) AS 'Error Rate'
FROM Transaction
WHERE appName = 'order-service'
FACET name
SINCE 1 hour ago

-- 4. 느린 트랜잭션 Top 10
SELECT average(duration), count(*)
FROM Transaction
WHERE appName = 'order-service'
FACET name
SINCE 1 hour ago
ORDER BY average(duration) DESC
LIMIT 10

-- 5. 외부 서비스 의존성 분석
SELECT average(duration), count(*)
FROM ExternalService
WHERE appName = 'order-service'
FACET externalHost
SINCE 1 hour ago

-- 6. 데이터베이스 쿼리 성능
SELECT average(databaseDuration), count(*)
FROM Transaction
WHERE appName = 'order-service' AND databaseDuration IS NOT NULL
FACET databaseCallCount
SINCE 1 hour ago

-- 7. 배포 전후 비교
SELECT average(duration), percentage(count(*), WHERE error IS true)
FROM Transaction
WHERE appName = 'order-service'
SINCE 1 hour ago
COMPARE WITH 1 day ago

-- 8. 커스텀 이벤트 분석
SELECT count(*), average(amount)
FROM OrderCreated
FACET payment_method
SINCE 24 hours ago
```

---

### 3. Dynatrace

> **한 줄 요약**: "OneAgent 하나만 설치하면 전체 스택을 자동으로 계측해요. Davis AI가 근본 원인까지 알려줘요."

#### Dynatrace 핵심 특징

```
Dynatrace의 차별점:

1. OneAgent
   └─ 하나의 에이전트가 인프라 + 애플리케이션 + 네트워크 + 프로세스 전부 수집
   └─ "Zero Configuration" — 설치만 하면 자동으로 모든 것을 발견하고 계측

2. Smartscape
   └─ 전체 인프라의 토폴로지를 자동으로 시각화
   └─ 호스트 → 프로세스 → 서비스 → 애플리케이션까지 수직적 연결

3. Davis AI (인과 관계 분석 AI)
   └─ 단순 이상 탐지를 넘어 "왜" 발생했는지 근본 원인을 알려줌
   └─ "디스크 I/O 증가 → DB 쿼리 지연 → 서비스 A 레이턴시 증가 → 사용자 경험 저하"

4. PurePath
   └─ 코드 레벨까지 드릴다운 가능한 분산 트레이스
   └─ 메서드 호출 단위까지 자동 추적

5. 자동 기준선(Baseline)
   └─ 정상 성능 패턴을 자동 학습하고, 벗어나면 알림
```

#### OneAgent 설치

```bash
# Linux에 OneAgent 설치 (원라인 커맨드)
wget -O Dynatrace-OneAgent.sh \
  "https://{your-environment-id}.live.dynatrace.com/api/v1/deployment/installer/agent/unix/default/latest?Api-Token={your-api-token}&arch=x86&flavor=default" \
  && sudo /bin/sh Dynatrace-OneAgent.sh \
  --set-app-log-content-access=true \
  --set-infra-only=false

# Kubernetes에 OneAgent 설치 (Helm)
helm repo add dynatrace https://raw.githubusercontent.com/Dynatrace/dynatrace-operator/main/config/helm/repos/stable
helm repo update

helm install dynatrace-operator dynatrace/dynatrace-operator \
  --namespace dynatrace \
  --create-namespace \
  --set apiUrl="https://{your-environment-id}.live.dynatrace.com/api" \
  --set apiToken="{your-api-token}" \
  --set paasToken="{your-paas-token}"
```

```yaml
# Kubernetes: DynaKube CRD 설정
apiVersion: dynatrace.com/v1beta1
kind: DynaKube
metadata:
  name: dynakube
  namespace: dynatrace
spec:
  apiUrl: https://{your-environment-id}.live.dynatrace.com/api
  tokens: dynakube

  # OneAgent 배포 모드
  oneAgent:
    cloudNativeFullStack:
      # 모든 Pod에 자동 주입
      enabled: true

  # ActiveGate (옵션)
  activeGate:
    capabilities:
      - routing
      - kubernetes-monitoring
      - dynatrace-api
```

#### Davis AI 동작 원리

```
Davis AI의 근본 원인 분석 흐름:

1단계: 이상 탐지
  "order-service의 응답 시간이 자동 학습된 기준선 대비 3배 증가"

2단계: 영향 범위 파악
  "영향받는 엔티티: order-service (3 인스턴스), checkout-page (모든 사용자)"

3단계: 인과 관계 분석 (Smartscape 토폴로지 활용)
  order-service 응답 지연
    ↑ 원인: payment-service DB 쿼리 지연
      ↑ 원인: PostgreSQL 디스크 I/O 급증
        ↑ 근본 원인: 호스트 디스크 사용량 95% (host-prod-db-01)

4단계: 자동 알림
  "근본 원인: host-prod-db-01의 디스크 공간 부족으로 인한 결제 서비스 DB 쿼리 지연"
  "영향: checkout-page의 사용자 95%가 5초 이상 대기"
  "권장 조치: 디스크 확장 또는 불필요한 로그 정리"
```

---

### 4. AWS X-Ray

> **한 줄 요약**: "AWS 네이티브 분산 추적 서비스. AWS 서비스와 긴밀하게 통합되어 Lambda, ECS, API Gateway 추적이 자연스러워요."

#### X-Ray 핵심 개념

| 개념 | 설명 | 비유 |
|------|------|------|
| **Segment** | 서비스가 처리한 요청 단위 | 택배가 물류센터에서 처리된 기록 |
| **Subsegment** | Segment 내의 세부 작업 (DB 호출, HTTP 호출 등) | 물류센터 내 분류/포장/검수 단계 |
| **Trace** | 요청의 전체 경로 (여러 Segment의 집합) | 택배 전체 배송 경로 |
| **X-Ray Daemon** | Segment를 수집하여 X-Ray API로 전송하는 프로세스 | 각 물류센터의 기록 수집원 |
| **Service Map** | 서비스 간 호출 관계를 시각화한 지도 | 물류 네트워크 지도 |
| **Sampling Rule** | 어떤 요청을 추적할지 결정하는 규칙 | "100개 중 5개만 정밀 추적" |
| **Annotation** | 검색 가능한 키-값 메타데이터 | 택배 분류 라벨 (검색 가능) |
| **Metadata** | 검색 불가능한 추가 데이터 | 택배 내부 상품 상세 (검색 불가) |

#### X-Ray 아키텍처

```mermaid
flowchart TB
    subgraph CLIENT["클라이언트"]
        BROWSER["브라우저 / 모바일"]
    end

    subgraph AWS_SERVICES["AWS 서비스"]
        APIGW["API Gateway<br/>자동 계측"]
        LAMBDA["Lambda<br/>자동 계측"]
        ECS["ECS / EKS<br/>SDK 계측"]
        EC2_APP["EC2 App<br/>SDK 계측"]
    end

    subgraph XRAY_INFRA["X-Ray 인프라"]
        DAEMON["X-Ray Daemon<br/>(UDP 2000)"]
        XRAY_API["X-Ray API"]
        XRAY_CONSOLE["X-Ray Console<br/>Service Map + Traces"]
    end

    subgraph AWS_INTEGRATED["통합 AWS 서비스"]
        DDB["DynamoDB"]
        SQS["SQS"]
        SNS["SNS"]
        S3_XRAY["S3"]
    end

    BROWSER -->|"요청"| APIGW
    APIGW --> LAMBDA
    APIGW --> ECS
    LAMBDA --> DDB
    LAMBDA --> SQS
    ECS --> EC2_APP
    EC2_APP --> S3_XRAY

    APIGW & LAMBDA & ECS & EC2_APP -->|"Segment 전송"| DAEMON
    DAEMON -->|"배치 전송"| XRAY_API
    XRAY_API --> XRAY_CONSOLE

    style CLIENT fill:#232f3e,color:#fff
    style AWS_SERVICES fill:#ff9900,color:#fff
    style XRAY_INFRA fill:#3498db,color:#fff
    style AWS_INTEGRATED fill:#27ae60,color:#fff
```

#### Python 애플리케이션에 X-Ray 적용

```python
# requirements.txt에 추가
# aws-xray-sdk>=2.12.0

# Flask + X-Ray 설정
from aws_xray_sdk.core import xray_recorder, patch_all
from aws_xray_sdk.ext.flask.middleware import XRayMiddleware
from flask import Flask

# X-Ray 레코더 설정
xray_recorder.configure(
    service='order-service',
    sampling=True,
    context_missing='LOG_ERROR',  # 컨텍스트 누락 시 로그만 남김
    plugins=('EC2Plugin', 'ECSPlugin'),  # AWS 환경 자동 감지
)

# 자동 패치 (boto3, requests, psycopg2, mysql 등)
patch_all()

app = Flask(__name__)
XRayMiddleware(app, xray_recorder)

@app.route('/api/orders', methods=['POST'])
def create_order():
    # 자동으로 Segment가 생성됩니다!

    # 커스텀 Subsegment 추가
    subsegment = xray_recorder.begin_subsegment('validate_order')
    try:
        validate_order(request.json)
        subsegment.put_annotation('order_type', 'standard')  # 검색 가능
        subsegment.put_metadata('order_details', request.json)  # 검색 불가
    except Exception as e:
        subsegment.add_exception(e)
        raise
    finally:
        xray_recorder.end_subsegment()

    # DynamoDB 호출 (자동 추적됨)
    table = boto3.resource('dynamodb').Table('orders')
    table.put_item(Item={'order_id': 'ord-123', 'status': 'created'})

    return jsonify({'order_id': 'ord-123'}), 201
```

#### Lambda + X-Ray 연동

```python
# Lambda에서 X-Ray는 설정만 켜면 자동으로 동작합니다!
# SAM template에서 Tracing 활성화:

"""
# template.yaml (AWS SAM)
Resources:
  OrderFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: app.lambda_handler
      Runtime: python3.12
      Tracing: Active           # X-Ray 활성화! 이 한 줄이면 됩니다
      Policies:
        - AWSXRayDaemonWriteAccess
      Environment:
        Variables:
          TABLE_NAME: !Ref OrderTable
"""

# Lambda 함수 코드
import json
import boto3
from aws_xray_sdk.core import patch_all

patch_all()  # boto3 등 자동 패치

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('orders')

def lambda_handler(event, context):
    # Lambda 자체가 하나의 Segment가 됩니다
    # DynamoDB 호출은 자동으로 Subsegment로 추적됩니다

    order_id = event['pathParameters']['id']
    response = table.get_item(Key={'order_id': order_id})

    return {
        'statusCode': 200,
        'body': json.dumps(response.get('Item', {}))
    }
```

#### X-Ray Sampling Rules

```json
{
  "version": 2,
  "default": {
    "fixed_target": 1,
    "rate": 0.05
  },
  "rules": [
    {
      "description": "결제 관련 요청은 100% 추적",
      "host": "*",
      "http_method": "*",
      "url_path": "/api/payments/*",
      "fixed_target": 10,
      "rate": 1.0
    },
    {
      "description": "헬스체크는 추적 안 함",
      "host": "*",
      "http_method": "GET",
      "url_path": "/health",
      "fixed_target": 0,
      "rate": 0.0
    },
    {
      "description": "일반 API는 5% 샘플링",
      "host": "*",
      "http_method": "*",
      "url_path": "/api/*",
      "fixed_target": 1,
      "rate": 0.05
    }
  ]
}
```

---

### 5. APM 도구 종합 비교

#### 한눈에 보는 비교표

| 항목 | Datadog | New Relic | Dynatrace | AWS X-Ray |
|------|---------|-----------|-----------|-----------|
| **타입** | SaaS | SaaS | SaaS / Self-hosted | AWS 네이티브 |
| **Agent** | Datadog Agent + 언어별 라이브러리 | 언어별 Agent | OneAgent (단일) | SDK + Daemon |
| **자동 계측** | 좋음 | 좋음 | 최고 (Zero-Config) | AWS 서비스만 자동 |
| **AI 분석** | Watchdog | Applied Intelligence | Davis AI (가장 강력) | 제한적 |
| **쿼리 언어** | 자체 쿼리 | NRQL (SQL 유사) | DQL | 필터 기반 |
| **Service Map** | 있음 | 있음 | Smartscape (가장 상세) | 있음 (AWS 한정) |
| **프로파일링** | Continuous Profiler | 코드 레벨 분석 | PurePath | 없음 |
| **가격** | 호스트 + 수집량 기반 | 수집량 기반 | 호스트 기반 | 추적량 기반 |
| **무료 티어** | 14일 체험 | 100GB/월 무료 | 15일 체험 | 프리티어 있음 |
| **강점** | 올인원 + 쉬운 UX | NRQL 유연성 + 가격 | AI + 자동화 | AWS 통합 |
| **약점** | 가격이 높음 | UI가 복잡할 수 있음 | 가격이 가장 높음 | AWS 외부 제한적 |
| **적합한 경우** | 다양한 환경 + 빠른 도입 | 데이터 분석 중심 팀 | 대규모 엔터프라이즈 | AWS 올인 환경 |

#### 오픈소스 vs SaaS APM 비교

| 항목 | 오픈소스 APM | SaaS APM |
|------|-------------|----------|
| **대표 도구** | Jaeger, Zipkin, SigNoz, Grafana Tempo | Datadog, New Relic, Dynatrace |
| **초기 비용** | 무료 (인프라 비용만) | 구독료 (보통 호스트/데이터량 기반) |
| **운영 비용** | 높음 (직접 인프라 관리) | 낮음 (벤더가 관리) |
| **설치 난이도** | 높음 (직접 구축) | 낮음 (Agent 설치만) |
| **커스터마이징** | 무제한 | 벤더 제공 범위 내 |
| **AI/ML 기능** | 직접 구축해야 함 | 기본 제공 |
| **데이터 소유권** | 완전 소유 | 벤더에 의존 |
| **확장성** | 직접 스케일링 필요 | 자동 스케일링 |
| **지원** | 커뮤니티 | 전문 지원팀 |
| **적합한 경우** | 데이터 민감, 커스터마이징 필수 | 빠른 도입, 운영 부담 최소화 |

```
오픈소스 APM 선택 가이드:

• SigNoz: OpenTelemetry 네이티브, Datadog의 오픈소스 대안을 원할 때
  └─ Metrics + Traces + Logs 통합, ClickHouse 기반

• Jaeger + Prometheus + Grafana: 이미 Prometheus를 쓰고 있고, 트레이싱을 추가할 때
  └─ CNCF 생태계, Kubernetes 친화적

• Grafana Tempo + Loki + Mimir: Grafana 스택에 올인할 때
  └─ 오브젝트 스토리지(S3) 기반으로 비용 효율적

• Apache SkyWalking: Java 생태계 중심, 바이트코드 주입 방식이 필요할 때
  └─ 코드 수정 없이 자동 계측
```

---

### 6. OpenTelemetry + APM 연동

> [분산 추적](./06-tracing)에서 OpenTelemetry의 기본 개념을 배웠죠? 여기서는 OTel을 APM 벤더와 연동하는 실전 방법을 다뤄요.

**OpenTelemetry(OTel)가 중요한 이유**: 벤더 종속(Vendor Lock-in) 없이, 한 번 계측하면 **어떤 APM 백엔드로든** 데이터를 보낼 수 있어요.

```mermaid
flowchart LR
    subgraph APP["애플리케이션"]
        OTEL_SDK["OpenTelemetry SDK<br/>(벤더 중립 계측)"]
    end

    subgraph COLLECTOR["OTel Collector"]
        RECV["Receivers<br/>OTLP, Jaeger, Zipkin"]
        PROC["Processors<br/>배치, 샘플링, 필터"]
        EXPORT["Exporters<br/>벤더별 전송"]
    end

    subgraph BACKENDS["APM 백엔드 (선택)"]
        DD_BE["Datadog"]
        NR_BE["New Relic"]
        DT_BE["Dynatrace"]
        XRAY_BE["AWS X-Ray"]
        JAEGER_BE["Jaeger<br/>(오픈소스)"]
    end

    OTEL_SDK -->|"OTLP"| RECV
    RECV --> PROC
    PROC --> EXPORT
    EXPORT -->|"Datadog Exporter"| DD_BE
    EXPORT -->|"OTLP Exporter"| NR_BE
    EXPORT -->|"OTLP Exporter"| DT_BE
    EXPORT -->|"AWS X-Ray Exporter"| XRAY_BE
    EXPORT -->|"Jaeger Exporter"| JAEGER_BE

    style APP fill:#4361ee,color:#fff
    style COLLECTOR fill:#f39c12,color:#fff
    style BACKENDS fill:#2ecc71,color:#fff
```

#### OTel Collector 설정 예시

```yaml
# otel-collector-config.yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    timeout: 5s
    send_batch_size: 1000

  # 불필요한 트레이스 필터링
  filter:
    traces:
      span:
        - 'attributes["http.target"] == "/health"'
        - 'attributes["http.target"] == "/readiness"'

  # 메모리 제한 (OOM 방지)
  memory_limiter:
    check_interval: 1s
    limit_mib: 512
    spike_limit_mib: 128

  # 테일 기반 샘플링 (에러/느린 요청은 100% 수집)
  tail_sampling:
    decision_wait: 10s
    policies:
      - name: error-policy
        type: status_code
        status_code: { status_codes: [ERROR] }
      - name: latency-policy
        type: latency
        latency: { threshold_ms: 1000 }
      - name: default-rate
        type: probabilistic
        probabilistic: { sampling_percentage: 10 }

exporters:
  # Datadog으로 전송
  datadog:
    api:
      key: ${DD_API_KEY}
      site: datadoghq.com

  # New Relic으로 전송
  otlp/newrelic:
    endpoint: https://otlp.nr-data.net:4317
    headers:
      api-key: ${NEW_RELIC_LICENSE_KEY}

  # AWS X-Ray로 전송
  awsxray:
    region: ap-northeast-2

  # 디버깅용 콘솔 출력
  logging:
    loglevel: info

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, filter, tail_sampling, batch]
      exporters: [datadog]  # 원하는 백엔드로 변경

    metrics:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [datadog]

    logs:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [datadog]
```

#### Python OTel SDK + Datadog 연동

```python
# requirements.txt
# opentelemetry-api>=1.20.0
# opentelemetry-sdk>=1.20.0
# opentelemetry-instrumentation-flask>=0.41b0
# opentelemetry-instrumentation-requests>=0.41b0
# opentelemetry-instrumentation-psycopg2>=0.41b0
# opentelemetry-exporter-otlp>=1.20.0

from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.instrumentation.flask import FlaskInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from opentelemetry.instrumentation.psycopg2 import Psycopg2Instrumentor

# 리소스 정의 (서비스 정보)
resource = Resource.create({
    "service.name": "order-service",
    "service.version": "1.2.3",
    "deployment.environment": "production",
})

# 트레이서 프로바이더 설정
provider = TracerProvider(resource=resource)

# OTel Collector로 전송하는 Exporter
exporter = OTLPSpanExporter(
    endpoint="http://otel-collector:4317",  # OTel Collector 주소
    insecure=True,
)
provider.add_span_processor(BatchSpanProcessor(exporter))
trace.set_tracer_provider(provider)

# 자동 계측 활성화
from flask import Flask
app = Flask(__name__)

FlaskInstrumentor().instrument_app(app)
RequestsInstrumentor().instrument()
Psycopg2Instrumentor().instrument()

# 트레이서 가져오기
tracer = trace.get_tracer(__name__)

@app.route('/api/orders', methods=['POST'])
def create_order():
    # Flask 자동 계측에 의해 Span이 자동 생성됩니다

    # 커스텀 Span 추가
    with tracer.start_as_current_span("validate_order") as span:
        span.set_attribute("order.type", "standard")
        validate_order(request.json)

    with tracer.start_as_current_span("process_payment") as span:
        result = process_payment(request.json)
        span.set_attribute("payment.amount", result['amount'])

    return jsonify({'status': 'created'}), 201
```

---

### 7. APM 도입 ROI

APM을 도입하면 어떤 가치를 얻을 수 있을까요? 경영진을 설득할 때 사용할 수 있는 지표들이에요.

```
APM 도입 ROI 계산 프레임워크:

1. MTTR(평균 복구 시간) 단축
   ┌─────────────────────────────────────────────────┐
   │ Before: 장애 발생 → 원인 파악 2시간 → 복구 30분  │
   │ After:  장애 발생 → APM으로 원인 파악 10분 → 복구 10분 │
   │ 절감:   매 장애당 약 2시간 10분                    │
   │ 가치:   엔지니어 시급 × 절감 시간 × 월 장애 건수    │
   │ 예시:   5만원/시간 × 2시간 × 10건/월 = 100만원/월   │
   └─────────────────────────────────────────────────┘

2. 사용자 경험 개선 → 매출 증대
   ┌─────────────────────────────────────────────────┐
   │ Google 연구: 페이지 로드 1초 지연 → 전환율 7% 감소  │
   │ Amazon 연구: 100ms 지연 → 매출 1% 감소             │
   │ APM으로 P95 응답시간 3초 → 1초 개선                │
   │ 예시: 월 매출 1억 × 3% 개선 = 300만원/월 매출 증가  │
   └─────────────────────────────────────────────────┘

3. 개발 생산성 향상
   ┌─────────────────────────────────────────────────┐
   │ 성능 문제 디버깅 시간: 주 5시간 → 주 1시간         │
   │ 개발자 10명 × 4시간/주 절감 = 40시간/주            │
   │ 예시: 40시간 × 5만원 × 4주 = 800만원/월 생산성 향상 │
   └─────────────────────────────────────────────────┘

4. 인프라 비용 최적화
   ┌─────────────────────────────────────────────────┐
   │ APM으로 불필요한 오버프로비저닝 발견                 │
   │ 실제 사용량 기반 Right-sizing 가능                  │
   │ 예시: 서버 20% 축소 → 월 200만원 인프라 비용 절감   │
   └─────────────────────────────────────────────────┘

총 월간 ROI 예시:
  100만(MTTR) + 300만(매출) + 800만(생산성) + 200만(인프라) = 1,400만원/월
  APM 비용: 월 300만원 (50호스트 기준)
  순 ROI: 월 1,100만원 (약 4.7배 투자 대비 수익)
```

---

### 8. APM 비용 최적화 전략

APM은 강력하지만 비용이 빠르게 증가할 수 있어요. 현명하게 사용하는 전략을 알아볼게요.

```
비용 최적화 5가지 전략:

전략 1: 스마트 샘플링
  ├─ 모든 요청을 100% 추적하지 마세요
  ├─ 에러/느린 요청: 100% 수집 (가장 중요한 데이터)
  ├─ 정상 요청: 5~10% 샘플링 (통계적 유의미성 충분)
  └─ 헬스체크/내부 요청: 0% (불필요한 노이즈)

전략 2: 환경별 차등 적용
  ├─ Production: 풀 기능 APM (필수)
  ├─ Staging: APM 활성화하되 보존 기간 짧게 (7일)
  ├─ Development: 기본 모니터링만 또는 오픈소스 APM
  └─ 비용 절감: 개발환경 APM만 줄여도 30~40% 절감

전략 3: 데이터 보존 기간 최적화
  ├─ 상세 트레이스: 7~14일 (일반적으로 충분)
  ├─ 집계 메트릭: 13~15개월 (트렌드 분석용)
  ├─ 에러 데이터: 30일 (디버깅용)
  └─ 커스텀 이벤트: 필요한 것만 선별적으로

전략 4: 불필요한 데이터 필터링
  ├─ 헬스체크 엔드포인트 제외 (/health, /readiness, /liveness)
  ├─ 정적 자산 요청 제외 (CSS, JS, 이미지)
  ├─ 내부 관리용 엔드포인트 제외
  └─ 중복되는 커스텀 메트릭 정리

전략 5: 하이브리드 접근
  ├─ 핵심 서비스: 상용 APM (Datadog, New Relic 등)
  ├─ 비핵심 서비스: 오픈소스 APM (SigNoz, Jaeger)
  ├─ OpenTelemetry로 계측 → 백엔드만 교체 가능
  └─ 벤더 종속 최소화 + 비용 절감
```

#### 월별 비용 비교 (50호스트 기준, 2026년 기준 참고용)

```
⚠️ 실제 가격은 협상, 사용량, 약정 기간에 따라 크게 달라질 수 있어요.
   아래는 공개된 가격 기준의 대략적인 비교예요.

Datadog APM:
  호스트 비용: $31/호스트/월 × 50 = $1,550
  Indexed Span: $1.70/100만 건 (추가 수집량에 따라 변동)
  예상 총비용: $2,000~3,500/월

New Relic:
  데이터 수집: 100GB 무료, 이후 $0.35/GB
  사용자 비용: Full Platform $549/사용자/월
  예상 총비용: $1,500~3,000/월 (사용자 수에 따라)

Dynatrace:
  호스트 비용: $74/호스트/월(연간) × 50 = $3,700
  DEM(Digital Experience): 추가
  예상 총비용: $4,000~6,000/월

AWS X-Ray:
  추적 기록: $5/100만 건
  추적 검색: $0.50/100만 건
  예상 총비용: $200~800/월 (추적량에 따라)

오픈소스 (SigNoz + 자체 인프라):
  인프라 비용: EC2/EKS 운영비 $300~800/월
  인건비: 관리 인력 공수 (간접 비용)
  예상 총비용: $300~800/월 + 운영 인건비
```

---

## 💻 직접 해보기

### 실습 1: Docker Compose로 SigNoz(오픈소스 APM) 체험하기

비용 걱정 없이 APM을 경험해 보기 좋은 방법이에요.

```yaml
# docker-compose-signoz.yaml
# SigNoz는 OpenTelemetry 네이티브 오픈소스 APM이에요.
# 설치 방법: git clone https://github.com/SigNoz/signoz.git && cd signoz/deploy && docker compose up -d

version: '3.8'

services:
  # 여러분의 애플리케이션
  order-service:
    build: .
    environment:
      - OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
      - OTEL_SERVICE_NAME=order-service
      - OTEL_RESOURCE_ATTRIBUTES=deployment.environment=local
    depends_on:
      - otel-collector

  # OTel Collector (SigNoz로 데이터 전송)
  otel-collector:
    image: signoz/signoz-otel-collector:latest
    command: ["--config=/etc/otel-collector-config.yaml"]
    volumes:
      - ./otel-collector-config.yaml:/etc/otel-collector-config.yaml
    ports:
      - "4317:4317"   # OTLP gRPC
      - "4318:4318"   # OTLP HTTP

  # SigNoz 프론트엔드 + 백엔드는 별도 설치
  # https://signoz.io/docs/install/docker/ 참조
```

### 실습 2: Flask 앱에 OpenTelemetry 자동 계측 적용

```python
# app.py - 간단한 Flask 주문 서비스
import time
import random
from flask import Flask, jsonify, request

app = Flask(__name__)

# 가짜 데이터베이스
orders_db = {}

@app.route('/api/orders', methods=['POST'])
def create_order():
    """주문 생성 - APM에서 트랜잭션으로 추적됩니다"""
    order_id = f"ord-{random.randint(1000, 9999)}"

    # DB 저장 시뮬레이션
    time.sleep(random.uniform(0.01, 0.05))
    orders_db[order_id] = {
        'id': order_id,
        'status': 'created',
        'items': request.json.get('items', []),
    }

    # 외부 결제 API 호출 시뮬레이션
    time.sleep(random.uniform(0.1, 0.5))

    # 간헐적 에러 시뮬레이션 (10% 확률)
    if random.random() < 0.1:
        raise Exception("Payment gateway timeout")

    return jsonify({'order_id': order_id, 'status': 'created'}), 201

@app.route('/api/orders/<order_id>', methods=['GET'])
def get_order(order_id):
    """주문 조회"""
    time.sleep(random.uniform(0.005, 0.02))

    order = orders_db.get(order_id)
    if not order:
        return jsonify({'error': 'Order not found'}), 404

    return jsonify(order)

@app.route('/health')
def health():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

```bash
# OpenTelemetry 자동 계측으로 실행 (코드 수정 없이!)
pip install flask opentelemetry-distro opentelemetry-exporter-otlp
opentelemetry-bootstrap -a install  # 자동으로 필요한 instrumentation 패키지 설치

# 환경변수 설정 후 실행
OTEL_SERVICE_NAME=order-service \
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317 \
OTEL_TRACES_SAMPLER=parentbased_traceidratio \
OTEL_TRACES_SAMPLER_ARG=0.5 \
opentelemetry-instrument python app.py

# 테스트 요청 보내기
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"items": [{"name": "Widget", "qty": 2}]}'
```

### 실습 3: AWS X-Ray로 Lambda 함수 추적하기

```yaml
# template.yaml (AWS SAM)
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Globals:
  Function:
    Timeout: 30
    Runtime: python3.12
    Tracing: Active  # X-Ray 활성화

Resources:
  OrderApi:
    Type: AWS::Serverless::Api
    Properties:
      StageName: prod
      TracingEnabled: true  # API Gateway X-Ray 활성화

  CreateOrderFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: src/
      Handler: create_order.handler
      Policies:
        - AWSXRayDaemonWriteAccess
        - DynamoDBCrudPolicy:
            TableName: !Ref OrdersTable
      Environment:
        Variables:
          TABLE_NAME: !Ref OrdersTable
      Events:
        CreateOrder:
          Type: Api
          Properties:
            RestApiId: !Ref OrderApi
            Path: /orders
            Method: post

  OrdersTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: orders
      AttributeDefinitions:
        - AttributeName: order_id
          AttributeType: S
      KeySchema:
        - AttributeName: order_id
          KeyType: HASH
      BillingMode: PAY_PER_REQUEST
```

```python
# src/create_order.py
import json
import uuid
import boto3
from aws_xray_sdk.core import xray_recorder, patch_all

# 자동 패치 (boto3 호출이 자동으로 Subsegment로 추적됨)
patch_all()

dynamodb = boto3.resource('dynamodb')
import os
table = dynamodb.Table(os.environ['TABLE_NAME'])

def handler(event, context):
    order_id = str(uuid.uuid4())[:8]

    # 커스텀 Subsegment: 주문 검증
    with xray_recorder.in_subsegment('validate_order') as subseg:
        body = json.loads(event.get('body', '{}'))
        items = body.get('items', [])
        subseg.put_annotation('item_count', len(items))

        if not items:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'No items provided'})
            }

    # DynamoDB 저장 (자동 추적됨)
    order = {
        'order_id': order_id,
        'items': items,
        'status': 'created',
    }
    table.put_item(Item=order)

    return {
        'statusCode': 201,
        'body': json.dumps({'order_id': order_id, 'status': 'created'})
    }
```

```bash
# 배포 및 테스트
sam build && sam deploy --guided

# 테스트 요청
curl -X POST https://{api-id}.execute-api.ap-northeast-2.amazonaws.com/prod/orders \
  -H "Content-Type: application/json" \
  -d '{"items": [{"name": "Widget", "qty": 2}]}'

# X-Ray 콘솔에서 Service Map과 Trace 확인
# AWS Console → X-Ray → Service Map
```

### 실습 4: Datadog + Docker Compose 전체 구성

```yaml
# docker-compose.yaml - Datadog APM 전체 구성
version: '3.8'

services:
  # Datadog Agent
  datadog-agent:
    image: gcr.io/datadoghq/agent:7
    environment:
      - DD_API_KEY=${DD_API_KEY}
      - DD_APM_ENABLED=true
      - DD_APM_NON_LOCAL_TRAFFIC=true  # 다른 컨테이너에서 접근 허용
      - DD_LOGS_ENABLED=true
      - DD_LOGS_CONFIG_CONTAINER_COLLECT_ALL=true
      - DD_PROCESS_AGENT_ENABLED=true
      - DD_DOGSTATSD_NON_LOCAL_TRAFFIC=true
      - DD_ENV=local
      - DD_TAGS=team:backend,project:order-system
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - /proc/:/host/proc/:ro
      - /sys/fs/cgroup/:/host/sys/fs/cgroup:ro
    ports:
      - "8126:8126"  # APM traces
      - "8125:8125"  # DogStatsD metrics

  # 주문 서비스
  order-service:
    build:
      context: ./order-service
    environment:
      - DD_AGENT_HOST=datadog-agent
      - DD_TRACE_AGENT_PORT=8126
      - DD_SERVICE=order-service
      - DD_ENV=local
      - DD_VERSION=1.0.0
      - DD_LOGS_INJECTION=true
      - DD_TRACE_SAMPLE_RATE=1.0
      - DATABASE_URL=postgresql://user:pass@postgres:5432/orders
    command: ddtrace-run python app.py
    depends_on:
      - datadog-agent
      - postgres
    ports:
      - "5001:5000"
    labels:
      com.datadoghq.ad.logs: '[{"source":"python","service":"order-service"}]'

  # 결제 서비스
  payment-service:
    build:
      context: ./payment-service
    environment:
      - DD_AGENT_HOST=datadog-agent
      - DD_TRACE_AGENT_PORT=8126
      - DD_SERVICE=payment-service
      - DD_ENV=local
      - DD_VERSION=1.0.0
      - DD_LOGS_INJECTION=true
    command: ddtrace-run python app.py
    depends_on:
      - datadog-agent
    ports:
      - "5002:5000"

  # PostgreSQL
  postgres:
    image: postgres:16
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=orders
    ports:
      - "5432:5432"
```

---

## 🏢 실무에서는?

### 실무 APM 도입 로드맵

```
Phase 1: 기초 (1~2주)
  ├─ 핵심 서비스에 APM Agent 설치 (2~3개 서비스부터)
  ├─ 기본 대시보드 구성 (Throughput, Latency, Error Rate)
  ├─ 주요 알림 설정 (P99 레이턴시, 에러율 임계값)
  └─ 검증: Service Map에 서비스가 보이는지 확인

Phase 2: 확장 (3~4주)
  ├─ 전체 서비스로 APM 확대
  ├─ 커스텀 메트릭/이벤트 추가 (비즈니스 KPI 연동)
  ├─ 로그-트레이스 연결 (Correlation) 설정
  ├─ 샘플링 규칙 최적화 (비용 절감)
  └─ 검증: 장애 시뮬레이션으로 MTTR 측정

Phase 3: 최적화 (2~3개월)
  ├─ AI 기반 이상 탐지 활성화 (Watchdog, Davis AI 등)
  ├─ SLO/SLI 설정 및 Error Budget 모니터링
  ├─ CI/CD 파이프라인에 성능 게이트 추가
  ├─ 비용 최적화 (샘플링, 보존 기간, 필터링)
  └─ 검증: MTTR 50% 이상 단축 확인

Phase 4: 성숙 (지속적)
  ├─ 프로파일링 연동 (코드 레벨 최적화)
  ├─ RUM(Real User Monitoring) 추가
  ├─ 비즈니스 메트릭과 기술 메트릭 상관 분석
  ├─ 인시던트 자동화 (PagerDuty/Slack 연동)
  └─ 검증: 프로액티브하게 문제를 예방하는 문화 정착
```

### 실무 대시보드 구성 가이드

```
RED Method 기반 APM 대시보드:

┌─────────────────────────────────────────────────────────┐
│  Service: order-service                    Env: prod    │
├─────────────────────┬───────────────────────────────────┤
│                     │                                   │
│  Rate (Throughput)  │  Errors (에러율)                   │
│  ┌───────────────┐  │  ┌───────────────┐                │
│  │ 📊 500 req/s  │  │  │ 📊 0.3%       │                │
│  │ ▁▂▃▄▅▆▇█▇▆▅  │  │  │ ▁▁▁▂▁▁▁▁▃▁▁  │                │
│  └───────────────┘  │  └───────────────┘                │
│                     │                                   │
│  Duration (응답시간) │  Apdex Score                      │
│  ┌───────────────┐  │  ┌───────────────┐                │
│  │ P50: 45ms     │  │  │ 📊 0.94       │                │
│  │ P95: 120ms    │  │  │ ████████████░░│                │
│  │ P99: 350ms    │  │  │ Excellent     │                │
│  └───────────────┘  │  └───────────────┘                │
├─────────────────────┴───────────────────────────────────┤
│  Top 5 Slowest Endpoints                               │
│  1. POST /api/orders          P95: 450ms  ████████░░░░  │
│  2. GET  /api/orders/:id      P95: 120ms  ███░░░░░░░░░  │
│  3. POST /api/payments        P95: 380ms  ███████░░░░░  │
│  4. GET  /api/inventory       P95:  80ms  ██░░░░░░░░░░  │
│  5. POST /api/notifications   P95:  60ms  █░░░░░░░░░░░  │
├─────────────────────────────────────────────────────────┤
│  Dependency Health                                      │
│  PostgreSQL:  ✅ P95: 15ms   Redis: ✅ P95: 2ms         │
│  payment-api: ⚠️ P95: 380ms  S3:    ✅ P95: 25ms        │
└─────────────────────────────────────────────────────────┘
```

### 실무 알림 규칙 설정

```yaml
# Datadog Monitor 설정 예시

# 1. 에러율 알림
- name: "[order-service] Error Rate > 1%"
  type: metric alert
  query: >
    sum(last_5m):sum:trace.flask.request.errors{service:order-service}
    / sum:trace.flask.request.hits{service:order-service} > 0.01
  message: |
    ## order-service 에러율 경고
    현재 에러율: {{value}}%
    최근 5분간 에러율이 1%를 초과했습니다.

    확인 사항:
    1. [Service Map](링크) 에서 의존성 확인
    2. [Error Tracking](링크) 에서 에러 상세 확인
    3. 최근 배포 이력 확인

    @slack-oncall @pagerduty-backend
  options:
    thresholds:
      critical: 0.01
      warning: 0.005
    notify_no_data: true
    evaluation_delay: 60

# 2. P99 레이턴시 알림
- name: "[order-service] P99 Latency > 2s"
  type: metric alert
  query: >
    avg(last_5m):trace.flask.request.duration.by.service.99p{service:order-service} > 2
  message: |
    ## order-service P99 레이턴시 경고
    현재 P99: {{value}}s

    @slack-oncall
  options:
    thresholds:
      critical: 2
      warning: 1

# 3. Apdex Score 알림
- name: "[order-service] Apdex < 0.85"
  type: metric alert
  query: >
    avg(last_10m):trace.flask.request.apdex.by.service{service:order-service} < 0.85
  message: |
    ## order-service 사용자 만족도 저하
    현재 Apdex: {{value}}
    사용자 경험이 나빠지고 있습니다. 즉시 확인이 필요합니다.

    @slack-oncall @pagerduty-backend
```

### 실무 팁: APM 선택 기준

```
회사 규모/상황별 APM 추천:

🏠 스타트업 (서비스 1~10개, 엔지니어 1~10명)
  ├─ 추천: New Relic (무료 100GB) 또는 SigNoz (오픈소스)
  ├─ 이유: 초기 비용 부담 없이 시작, 성장하면서 확장
  └─ 팁: OpenTelemetry로 계측해두면 나중에 벤더 변경 용이

🏢 중견기업 (서비스 10~50개, 엔지니어 10~50명)
  ├─ 추천: Datadog 또는 New Relic
  ├─ 이유: 올인원 플랫폼으로 운영 부담 최소화, AI 기능 활용
  └─ 팁: 연간 계약으로 할인 협상, 샘플링으로 비용 관리

🏗️ 대기업/엔터프라이즈 (서비스 50개+, 엔지니어 50명+)
  ├─ 추천: Dynatrace 또는 Datadog
  ├─ 이유: AI 기반 자동화, 복잡한 환경 자동 발견
  └─ 팁: PoC 진행 후 협상, 하이브리드 전략 검토

☁️ AWS 올인 환경
  ├─ 추천: AWS X-Ray + CloudWatch
  ├─ 이유: AWS 서비스와 네이티브 통합, 추가 Agent 불필요
  └─ 팁: Lambda/API Gateway 중심이면 X-Ray로 충분할 수 있음
```

---

## ⚠️ 자주 하는 실수

### 실수 1: 모든 것을 100% 추적하기

```
❌ 잘못된 방법:
  모든 환경, 모든 요청을 100% 샘플링으로 추적
  → 월 비용이 예상의 10배로 폭증
  → 데이터가 너무 많아 오히려 분석이 어려움

✅ 올바른 방법:
  - Production: 에러/느린 요청 100%, 정상 요청 5~10%
  - Staging: 50% 샘플링
  - Development: 오픈소스 APM 또는 비활성화
  - 헬스체크, 정적 자산: 무조건 제외
```

### 실수 2: APM을 설치만 하고 활용하지 않기

```
❌ 잘못된 방법:
  Agent 설치 → 대시보드 한 번 보고 → 그냥 방치
  "비싼 돈 내고 아무도 안 봐요..."

✅ 올바른 방법:
  - 주간 성능 리뷰 미팅에서 APM 대시보드 기반으로 논의
  - 온콜 엔지니어의 장애 대응 프로세스에 APM 단계 포함
  - 배포 후 반드시 APM에서 성능 변화 확인하는 문화
  - 신규 입사자 온보딩에 APM 사용법 포함
```

### 실수 3: 커스텀 메트릭을 과도하게 추가하기

```
❌ 잘못된 방법:
  모든 변수, 모든 함수에 커스텀 스팬/메트릭 추가
  → 카디널리티 폭발 (high cardinality)
  → 비용 급증 + 성능 오버헤드

✅ 올바른 방법:
  - 자동 계측으로 기본 데이터 수집 (80%는 자동으로 충분)
  - 비즈니스적으로 의미 있는 커스텀 메트릭만 추가
  - 태그 값의 카디널리티 제한 (user_id를 태그로 넣지 말 것!)
  - 태그 예: payment_method=card|bank|crypto (카디널리티 3)
  - 안티패턴: user_id=usr-12345 (카디널리티 수백만)
```

### 실수 4: 벤더 종속에 빠지기

```
❌ 잘못된 방법:
  특정 APM 벤더의 독자 SDK를 깊이 사용
  → 다른 도구로 변경하려면 모든 코드를 수정해야 함

✅ 올바른 방법:
  - OpenTelemetry SDK로 계측 (벤더 중립)
  - OTel Collector를 중간에 두고, Exporter만 변경
  - 벤더 고유 기능은 필요한 만큼만 제한적으로 사용
  - 멀티 벤더 전략: 핵심은 SaaS, 비핵심은 오픈소스
```

### 실수 5: APM이 애플리케이션 성능에 미치는 영향 무시하기

```
❌ 잘못된 방법:
  APM Agent의 오버헤드를 고려하지 않고 모든 기능 활성화
  → CPU 5~10% 추가 사용, 메모리 100~200MB 추가
  → 프로파일링까지 켜면 더 증가

✅ 올바른 방법:
  - 스테이징에서 먼저 오버헤드 측정 후 프로덕션 적용
  - 일반적으로 2~3% CPU 오버헤드가 허용 범위
  - 프로파일링은 필요할 때만 활성화 (Always-On보다 On-Demand)
  - Agent 버전 업데이트 시 릴리스 노트에서 성능 변경 확인
  - 리소스 제한 설정: Agent의 CPU/메모리 사용량 상한선 설정
```

### 실수 6: 알림 폭풍(Alert Fatigue) 방치하기

```
❌ 잘못된 방법:
  "일단 알림 많이 걸어두자" → 하루에 알림 100개+ → 모두 무시
  "늑대 소년" 현상 → 정작 중요한 알림도 놓침

✅ 올바른 방법:
  - 알림은 "즉시 행동이 필요한 것"만 (Critical: 5개 이하)
  - Warning 레벨은 대시보드에서 확인 (알림 X)
  - 중복 알림 그룹화 (같은 근본 원인의 알림은 하나로)
  - 주기적 알림 리뷰: 한 달간 한 번도 행동하지 않은 알림은 삭제
  - 알림 피로도 메트릭 추적: 알림 대비 실제 조치 비율 모니터링
```

---

## 📝 마무리

### 핵심 요약

```
1. APM이란?
   └─ 애플리케이션 성능을 트랜잭션 단위로 추적/분석/최적화하는 도구
   └─ "서버가 살아있나?" → "사용자가 만족하는가?"로 관점 전환

2. APM의 5대 기능
   └─ Transaction Tracking + Error Tracking + Dependency Mapping
      + Performance Profiling + Real User Monitoring

3. 주요 APM 도구
   ├─ Datadog: 올인원 + Watchdog AI + 쉬운 UX
   ├─ New Relic: NRQL 유연성 + 넉넉한 무료 티어
   ├─ Dynatrace: OneAgent + Davis AI + 자동 발견
   └─ AWS X-Ray: AWS 네이티브 + Lambda/API Gateway 통합

4. OpenTelemetry가 핵심
   └─ 벤더 중립 계측 → OTel Collector → 어떤 백엔드로든 전송
   └─ 벤더 종속 방지의 가장 좋은 방법

5. 비용 최적화
   └─ 스마트 샘플링 + 환경별 차등 + 데이터 보존 기간 최적화
   └─ 하이브리드 전략 (핵심: SaaS, 비핵심: 오픈소스)
```

### APM 도구 선택 의사결정 트리

```mermaid
flowchart TD
    START["APM 도구를 선택해야 해요"] --> Q1{"AWS 서비스 중심인가요?"}

    Q1 -->|"네, Lambda/ECS 위주"| Q1A{"예산이 넉넉한가요?"}
    Q1A -->|"아니오"| XRAY["AWS X-Ray<br/>+ CloudWatch"]
    Q1A -->|"네"| Q1B{"AI 기반 분석이<br/>필요한가요?"}
    Q1B -->|"네"| DATADOG_A["Datadog 또는<br/>Dynatrace"]
    Q1B -->|"아니오"| XRAY

    Q1 -->|"아니오, 멀티클라우드/온프레미스"| Q2{"팀 규모와 예산은?"}

    Q2 -->|"스타트업<br/>(소규모, 저예산)"| Q2A{"데이터 주권이<br/>중요한가요?"}
    Q2A -->|"네"| SIGNOZ["SigNoz<br/>(오픈소스)"]
    Q2A -->|"아니오"| NEWRELIC["New Relic<br/>(무료 100GB)"]

    Q2 -->|"중견기업<br/>(중규모, 적정 예산)"| DATADOG_B["Datadog"]

    Q2 -->|"대기업<br/>(대규모, 충분한 예산)"| Q3{"자동화 수준은?"}
    Q3 -->|"최대한 자동화"| DYNATRACE["Dynatrace"]
    Q3 -->|"유연한 분석 중심"| DATADOG_C["Datadog"]

    style XRAY fill:#ff9900,color:#fff
    style DATADOG_A fill:#632ca6,color:#fff
    style DATADOG_B fill:#632ca6,color:#fff
    style DATADOG_C fill:#632ca6,color:#fff
    style NEWRELIC fill:#1ce783,color:#000
    style DYNATRACE fill:#1496ff,color:#fff
    style SIGNOZ fill:#f05a28,color:#fff
    style DYNATRACE fill:#1496ff,color:#fff
```

### 면접 대비 핵심 질문

```
Q1: "APM과 기존 모니터링의 차이점은?"
A1: 모니터링은 인프라 수준(CPU, Memory)을 감시하고,
    APM은 애플리케이션 수준(트랜잭션, 에러, 의존성)을 분석해요.
    모니터링이 "서버가 건강한가?"라면, APM은 "사용자가 만족하는가?"를 답해요.

Q2: "Datadog과 Dynatrace의 가장 큰 차이는?"
A2: Datadog은 유연한 올인원 플랫폼으로 다양한 환경을 지원하고,
    Dynatrace는 OneAgent 하나로 전체 스택을 자동 발견/계측하며
    Davis AI가 근본 원인까지 인과 관계를 분석해줘요.
    Dynatrace가 자동화 수준이 높지만, 가격도 더 높아요.

Q3: "APM 비용을 어떻게 최적화하나요?"
A3: 다섯 가지 전략을 씁니다:
    1) 테일 기반 샘플링 (에러/느린 요청 100%, 정상 5~10%)
    2) 환경별 차등 적용 (개발환경은 오픈소스)
    3) 데이터 보존 기간 최적화 (트레이스 7~14일)
    4) 불필요한 데이터 필터링 (헬스체크, 정적 자산)
    5) 하이브리드 전략 (핵심 SaaS + 비핵심 오픈소스)

Q4: "OpenTelemetry를 APM과 함께 쓰는 이유는?"
A4: 벤더 종속을 방지하기 위해서예요. OTel SDK로 한 번 계측하면
    Exporter만 바꿔서 어떤 APM 백엔드로든 데이터를 보낼 수 있어요.
    Datadog에서 New Relic으로 바꿀 때 애플리케이션 코드 수정이 없어요.

Q5: "Apdex Score가 뭔가요?"
A5: Application Performance Index의 약자로, 0~1 사이의 사용자 만족도 지수예요.
    응답 시간 기준값(T)을 정하고, T 이내면 만족, 4T 이내면 허용, 초과면 불만족으로 계산해요.
    0.94 이상이면 Excellent, 0.7 미만이면 조치가 필요해요.
```

---

## 🔗 다음 단계

### 학습 경로

```
현재 위치: APM (Application Performance Monitoring)
                    │
    ┌───────────────┼───────────────┐
    │               │               │
    ▼               ▼               ▼
이전 학습         심화 학습        다음 단계

• Observability    • SLO/SLI       • Profiling
  개념               Error Budget     (코드 레벨 최적화)
  (01-concept)    설정              (09-profiling)

• 분산 추적        • RUM 설정       • Chaos Engineering
  (06-tracing)    (Real User       (장애 주입 테스트)
                     Monitoring)

• AWS 관리 서비스  • 인시던트 관리   • FinOps
  (../05-cloud-aws    자동화           (클라우드 비용 최적화)
  /13-management)
```

### 추천 학습 자료

```
공식 문서:
  • Datadog APM: https://docs.datadoghq.com/tracing/
  • New Relic APM: https://docs.newrelic.com/docs/apm/
  • Dynatrace: https://www.dynatrace.com/support/help/
  • AWS X-Ray: https://docs.aws.amazon.com/xray/
  • OpenTelemetry: https://opentelemetry.io/docs/

실습 환경:
  • Datadog: 14일 무료 체험 (datadoghq.com)
  • New Relic: 100GB/월 영구 무료 (newrelic.com)
  • SigNoz: 오픈소스, Docker로 즉시 시작 (signoz.io)
  • AWS X-Ray: AWS 프리티어 내 사용 가능

심화 학습:
  • "Observability Engineering" by Charity Majors (O'Reilly)
  • "Distributed Systems Observability" by Cindy Sridharan
  • OpenTelemetry Community: https://opentelemetry.io/community/
```

### 다음 강의 예고: 프로파일링(Profiling)

> APM이 "어떤 서비스가 느린지"를 알려준다면, 프로파일링은 "그 서비스의 어떤 코드 라인이 느린지"를 알려줘요. [다음 강의](./09-profiling)에서는 Continuous Profiling, CPU/Memory/IO 프로파일링, 그리고 Datadog/Pyroscope 같은 도구를 활용해서 **코드 레벨의 성능 최적화**를 다뤄볼 거예요.
