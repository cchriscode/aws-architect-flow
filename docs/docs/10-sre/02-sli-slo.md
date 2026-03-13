# SLI/SLO 실무 — 서비스 신뢰성을 숫자로 약속하는 기술

> 시스템이 "잘 돌아간다"는 말은 사람마다 기준이 달라요. 개발자에게는 에러가 없으면 OK, PM에게는 사용자 불만이 없으면 OK, 경영진에게는 매출이 떨어지지 않으면 OK. [SRE 원칙](./01-principles)에서 "신뢰성은 가장 중요한 기능"이라고 배웠다면, 이제 그 신뢰성을 **측정 가능한 숫자**로 정의하고, **팀 전체가 합의한 목표**로 관리하는 방법을 알아볼 거예요. SLI, SLO, Error Budget — 이 세 가지가 SRE의 심장이에요.

---

## 🎯 왜 SLI/SLO를 알아야 하나요?

### 일상 비유: 택배 배송 약속

인터넷 쇼핑을 하면 "내일 도착 보장"이라는 문구를 자주 보죠? 이걸 SRE 용어로 바꿔볼게요.

- **SLI (Service Level Indicator)**: "주문 후 실제 배송까지 걸린 시간" — 측정 가능한 지표
- **SLO (Service Level Objective)**: "주문의 99%가 24시간 내 배송" — 팀 내부 목표
- **SLA (Service Level Agreement)**: "24시간 내 미배송 시 배송비 환불" — 고객과의 계약
- **Error Budget**: "한 달에 1%까지는 늦어도 괜찮아" — 실패 허용량

택배 회사가 "우리는 빠릅니다!"라고만 하면 아무 의미가 없어요. "99%의 택배가 24시간 내 도착합니다"라고 해야 비로소 약속이 되는 거예요. 서비스도 마찬가지예요.

```
실무에서 SLI/SLO가 필요한 순간:

• "서비스가 느려요" vs "P99 지연이 2초를 넘겼어요"              → SLI로 정량화 필요
• "가용성 100%를 목표로 합시다!" → 비현실적                    → SLO로 현실적 목표 설정
• "새 기능 배포 vs 안정성 개선, 뭐가 먼저?"                    → Error Budget으로 의사결정
• "알림이 너무 많아서 중요한 걸 놓쳤어요"                      → SLO 기반 알림 전환 필요
• "장애가 났는데 고객 보상을 해야 하나요?"                     → SLA vs SLO 기준 필요
• "우리 서비스 신뢰성이 경쟁사보다 좋은가요?"                  → SLI 기반 비교 가능
• "개발 속도를 높이고 싶은데 장애가 두려워요"                  → Error Budget Policy 필요
```

### SLI/SLO가 없는 팀 vs 있는 팀

```mermaid
flowchart TD
    subgraph NO_SLO["❌ SLI/SLO가 없는 팀"]
        N1["'서비스 느린 것 같아요'<br/>감에 의존"] -->|"기준 불명확"| N2["개발팀 vs 운영팀<br/>'얼마나 느린데요?'"]
        N2 -->|"갈등"| N3["새 기능 vs 안정성<br/>끝없는 논쟁"]
        N3 -->|"정치적 결정"| N4["한쪽이 불만족<br/>팀 사기 저하"]
    end

    subgraph YES_SLO["✅ SLI/SLO가 있는 팀"]
        Y1["'P99 지연 1.2초<br/>SLO 1초 위반 중'"] -->|"데이터 기반"| Y2["Error Budget 잔여: 15%<br/>객관적 현황 공유"]
        Y2 -->|"자동 판단"| Y3["Budget 여유 → 기능 개발<br/>Budget 소진 → 안정성 작업"]
        Y3 -->|"합의된 결정"| Y4["팀 전체가 납득<br/>갈등 최소화"]
    end

    style N4 fill:#e74c3c,color:#fff
    style N3 fill:#e67e22,color:#fff
    style Y4 fill:#27ae60,color:#fff
    style Y3 fill:#3498db,color:#fff
```

### SRE 성숙도와 SLI/SLO

```
SRE 성숙도 단계:

Level 0: 모니터링 없음    ██████████████████████████████████████  "고객이 알려줌"
Level 1: 기본 메트릭      ████████████████████████████████        "CPU/메모리 감시"
Level 2: 증상 기반 알림   ████████████████████████                "에러율, 지연시간"
Level 3: SLI/SLO 도입     ████████████████                        "Error Budget 관리"  ← 여기가 목표!
Level 4: SLO 문화 정착    ████████                                "전사적 SLO 기반 의사결정"

→ 이번 챕터에서 Level 3~4를 달성하는 방법을 배워요
```

---

## 🧠 핵심 개념 잡기

### 1. SLI, SLO, SLA의 관계

> **비유**: 학교 시험 — SLI는 시험 점수, SLO는 부모님과의 약속, SLA는 장학금 기준

| 개념 | 정의 | 누가 정하나 | 위반 시 결과 | 비유 |
|------|------|------------|-------------|------|
| **SLI** | 서비스 품질을 측정하는 지표 | 엔지니어링팀 | - (측정값일 뿐) | 시험 점수 |
| **SLO** | SLI에 대한 내부 목표 | 엔지니어링 + 비즈니스 | Error Budget 소진 → 안정성 작업 | "90점 이상 맞기" (부모님 약속) |
| **SLA** | 고객과의 공식 계약 | 비즈니스 + 법무 | 금전적 보상 (크레딧/환불) | "80점 미만이면 용돈 삭감" |

```mermaid
flowchart TB
    SLI["📊 SLI<br/>Service Level Indicator<br/>'무엇을 측정할까?'<br/>예: 성공 요청 비율"]
    SLO["🎯 SLO<br/>Service Level Objective<br/>'목표가 뭐지?'<br/>예: 99.9% 성공률"]
    SLA["📜 SLA<br/>Service Level Agreement<br/>'어기면 어떻게 되지?'<br/>예: 위반 시 10% 크레딧"]
    EB["💰 Error Budget<br/>'얼마나 실패해도 되지?'<br/>예: 0.1% = 월 43.8분"]

    SLI -->|"목표 설정"| SLO
    SLO -->|"남은 여유"| EB
    SLO -->|"외부 계약 (더 느슨하게)"| SLA

    style SLI fill:#3498db,color:#fff
    style SLO fill:#2ecc71,color:#fff
    style SLA fill:#e74c3c,color:#fff
    style EB fill:#f39c12,color:#fff
```

**핵심 원칙: SLO는 항상 SLA보다 엄격해야 해요!**

```
SLO와 SLA의 관계:

내부 SLO:  99.95% ← 더 엄격 (내부 경고선)
외부 SLA:  99.9%  ← 더 느슨 (고객 약속)

이렇게 하는 이유:
SLO 위반 시점에 이미 경고를 받아서 조치하면
SLA 위반까지 가지 않아요 (안전 마진)

비유: 연료 경고등이 연료 0일 때 켜지면 너무 늦어요
      잔여 연료 20%에서 켜져야 주유소에 갈 시간이 있죠
```

### 2. SLI 종류 5가지

> **비유**: 레스토랑 평가 항목 — 맛만 좋으면 되나요? 서비스 속도, 위생, 메뉴 다양성도 봐야죠

| SLI 종류 | 정의 | 계산 방식 | 비유 |
|----------|------|----------|------|
| **Availability** | 서비스가 정상 응답하는 비율 | 성공 요청 / 전체 요청 | 가게 문이 열려있는 시간 |
| **Latency** | 요청 처리에 걸리는 시간 | P50, P95, P99 응답시간 | 음식 나오는 속도 |
| **Throughput** | 처리할 수 있는 요청량 | 초당 처리 요청 수 (RPS) | 시간당 손님 수용량 |
| **Correctness** | 올바른 결과를 반환하는 비율 | 정확한 응답 / 전체 응답 | 주문한 메뉴가 맞게 나오는 비율 |
| **Freshness** | 데이터가 최신 상태인 비율 | 업데이트 지연 < 임계값 | 오늘의 메뉴판이 실제로 오늘 것인지 |

```
서비스별 중요 SLI 예시:

API 서비스:       Availability ●●●●● | Latency ●●●●● | Correctness ●●●○○
결제 시스템:      Availability ●●●●● | Correctness ●●●●● | Latency ●●●○○
검색 엔진:        Latency ●●●●● | Freshness ●●●●○ | Throughput ●●●●○
데이터 파이프라인: Freshness ●●●●● | Correctness ●●●●● | Throughput ●●●○○
스트리밍 서비스:   Availability ●●●●● | Throughput ●●●●● | Latency ●●●●○
CDN/정적 파일:    Availability ●●●●● | Latency ●●●●● | Throughput ●●●○○

→ 서비스 특성에 따라 우선순위가 달라요!
```

### 3. Error Budget 한눈에 보기

```
Error Budget 계산 (30일 기준):

SLO 목표    Error Budget(%)   허용 다운타임(분)   허용 다운타임(시간)
─────────   ────────────────  ────────────────    ─────────────────
99%         1.0%              432분               7시간 12분
99.5%       0.5%              216분               3시간 36분
99.9%       0.1%              43.2분              약 43분
99.95%      0.05%             21.6분              약 22분
99.99%      0.01%             4.32분              약 4분
99.999%     0.001%            0.432분             약 26초

→ "9"가 하나 늘어날 때마다 허용 시간이 10분의 1로 줄어요!
→ 99.999%(Five Nines)는 한 달에 26초만 다운 가능 — 거의 불가능에 가까워요
```

---

## 🔍 하나씩 자세히 알아보기

### 1. SLI Specification vs SLI Implementation

SLI를 정할 때 두 단계를 거쳐요. 먼저 "무엇을 측정할지" 정의하고(Specification), 그 다음에 "어떻게 측정할지" 구현해요(Implementation).

> **비유**: "맛있는 음식" (Specification) vs "MSG 함량 측정기로 감칠맛 수치 측정" (Implementation)

```
SLI Specification (무엇을):
  "사용자가 경험하는 API 응답 시간이 빠른 비율"

SLI Implementation (어떻게):
  방법 1: 서버 사이드 로그 기반
    → Nginx access log에서 upstream_response_time 추출
    → 장점: 구현 쉬움  |  단점: 네트워크 지연 미포함

  방법 2: 로드밸런서 메트릭 기반
    → ALB의 TargetResponseTime 메트릭 사용
    → 장점: 인프라 지연 포함  |  단점: 클라이언트 지연 미포함

  방법 3: 클라이언트 사이드 측정
    → 브라우저 Performance API로 실제 사용자 경험 측정
    → 장점: 가장 정확  |  단점: 구현 복잡, 노이즈 많음

  방법 4: Synthetic Monitoring
    → 외부에서 주기적으로 요청 보내서 측정
    → 장점: 일관된 측정  |  단점: 실제 사용자 패턴과 다름
```

**SLI 측정 지점에 따른 정확도 차이:**

```mermaid
flowchart LR
    CLIENT["👤 클라이언트<br/>브라우저/앱"] -->|"④ 가장 정확<br/>전체 경험 포함"| CDN["🌐 CDN<br/>CloudFront"]
    CDN -->|"③ 네트워크 포함"| LB["⚖️ 로드밸런서<br/>ALB/NLB"]
    LB -->|"② 인프라 포함"| SERVER["🖥️ 서버<br/>Nginx/App"]
    SERVER -->|"① 가장 쉬움<br/>서버 처리만"| DB["🗄️ DB<br/>RDS"]

    style CLIENT fill:#27ae60,color:#fff
    style LB fill:#f39c12,color:#fff
    style SERVER fill:#e67e22,color:#fff
    style DB fill:#e74c3c,color:#fff
```

**각 SLI 종류별 Specification & Implementation 예시:**

| SLI 종류 | Specification | Implementation (Prometheus) |
|----------|--------------|---------------------------|
| Availability | 성공적으로 처리된 요청의 비율 | `sum(rate(http_requests_total{code!~"5.."}[5m])) / sum(rate(http_requests_total[5m]))` |
| Latency | 200ms 이내에 응답한 요청의 비율 | `sum(rate(http_request_duration_seconds_bucket{le="0.2"}[5m])) / sum(rate(http_request_duration_seconds_count[5m]))` |
| Throughput | 초당 처리 가능한 요청 수 | `sum(rate(http_requests_total[5m]))` |
| Correctness | 올바른 결과를 반환한 비율 | `sum(rate(http_requests_total{code="200",result="correct"}[5m])) / sum(rate(http_requests_total{code="200"}[5m]))` |
| Freshness | N초 이내에 업데이트된 데이터 비율 | `sum(data_freshness_seconds < 60) / count(data_freshness_seconds)` |

### 2. SLO 설정 방법론

SLO를 설정하는 건 과학이자 예술이에요. 너무 높으면 개발 속도가 떨어지고, 너무 낮으면 사용자가 떠나요.

#### 방법 1: 히스토리 기반 (과거 데이터 활용)

```
SLO 설정 프로세스 (히스토리 기반):

Step 1: 최근 30일 SLI 데이터 수집
  → 가용성: 99.95%, P99 지연: 450ms, 에러율: 0.03%

Step 2: 현재 성능에서 마진 설정
  → 가용성 SLO: 99.9% (현재 99.95%에서 0.05% 마진)
  → 지연 SLO: P99 < 500ms (현재 450ms에서 50ms 마진)

Step 3: 비즈니스 팀과 협의
  → "이 수준이면 사용자 경험에 문제없나요?"
  → "경쟁사 대비 충분한 수준인가요?"

Step 4: 4주간 시범 운영
  → SLO 위반 없이 운영 가능한지 확인
  → 필요 시 조정

Step 5: 공식 SLO로 채택
  → 팀 전체 합의 → 문서화 → 대시보드 구성 → 알림 설정
```

#### 방법 2: 사용자 기대치 기반

```
사용자 행동 데이터에서 SLO 도출:

"페이지 로딩 시간과 이탈률의 관계"

응답 시간    이탈률
─────────   ──────
< 200ms     2%       ← 최상의 경험
200-500ms   5%       ← 대부분 만족
500ms-1s    12%      ← 불만 시작
1s-2s       25%      ← 상당수 이탈
2s-3s       40%      ← 심각한 이탈
> 3s        55%+     ← 대부분 이탈

→ SLO 결정: "P99 < 500ms" (이탈률 5% 이하 유지)
→ 더 엄격하게: "P95 < 200ms" (대부분 최상의 경험)
```

#### 방법 3: Percentile 기반 SLO

```
왜 평균(Average)이 아니라 백분위(Percentile)를 써야 하나요?

시나리오: 요청 10개의 응답시간
  50ms, 55ms, 60ms, 65ms, 70ms, 75ms, 80ms, 85ms, 90ms, 5000ms

  평균: 563ms    ← "563ms? 좀 느리네" (실상: 9명은 빠르고 1명만 극단적)
  P50:  70ms    ← 절반은 70ms 이내 (중앙값)
  P90:  90ms    ← 90%는 90ms 이내
  P99:  5000ms  ← 최악의 1%는 5초 (이 사용자들이 불만을 만들어요!)

  → 평균은 극단값을 숨겨요
  → P99를 보면 "가장 불행한 1% 사용자"의 경험을 알 수 있어요
```

**권장 SLO Percentile 조합:**

```
서비스 유형별 권장 SLO:

┌──────────────────┬──────────────────────────────────────────────┐
│ 서비스 유형       │ 권장 SLO                                     │
├──────────────────┼──────────────────────────────────────────────┤
│ 사용자 API        │ Availability: 99.9%                          │
│                   │ Latency: P50 < 100ms, P99 < 500ms           │
├──────────────────┼──────────────────────────────────────────────┤
│ 결제 시스템        │ Availability: 99.99%                         │
│                   │ Correctness: 99.999%                         │
│                   │ Latency: P99 < 1s                            │
├──────────────────┼──────────────────────────────────────────────┤
│ 내부 배치 작업     │ Freshness: 99.9% (1시간 내 처리)              │
│                   │ Correctness: 99.99%                          │
├──────────────────┼──────────────────────────────────────────────┤
│ 스트리밍/실시간    │ Availability: 99.95%                         │
│                   │ Latency: P99 < 200ms                         │
│                   │ Throughput: > 10K RPS                        │
└──────────────────┴──────────────────────────────────────────────┘
```

### 3. Error Budget 심화

#### Error Budget 계산 실전

```
Error Budget 계산 공식:

  Error Budget = 1 - SLO 목표
  허용 다운타임 = Error Budget × 기간

예제: SLO 99.9%, 30일(43,200분) 기준

  Error Budget = 1 - 0.999 = 0.001 (0.1%)
  허용 다운타임 = 0.001 × 43,200분 = 43.2분

  즉, 한 달에 43.2분까지는 장애가 나도 SLO를 지킨 것!

실전 소진 시나리오:
  ─────────────────────────────────────────────────
  이벤트                         소진량      잔여 Budget
  ─────────────────────────────────────────────────
  월초 시작                       -          43.2분 (100%)
  3일차: 배포 롤백 (5분 다운)     -5분       38.2분 (88.4%)
  10일차: DB 페일오버 (3분)       -3분       35.2분 (81.5%)
  15일차: 네트워크 이슈 (10분)    -10분      25.2분 (58.3%)  ← 주의!
  20일차: 대규모 장애 (15분)      -15분      10.2분 (23.6%)  ← 위험!
  25일차: 여유분                  보존       10.2분 (23.6%)
  ─────────────────────────────────────────────────

  → 15일차에 이미 절반 이상 소진 — 남은 기간은 안정성에 집중해야 해요!
```

#### Error Budget Policy (에러 버짓 정책)

Error Budget Policy는 "Error Budget이 이렇게 되면 이렇게 행동한다"는 팀 합의 문서예요.

```
Error Budget Policy 예시:

┌─────────────────────────┬────────────────────────────────────────────┐
│ Error Budget 잔여량       │ 팀 행동                                    │
├─────────────────────────┼────────────────────────────────────────────┤
│ 75~100% (여유)           │ • 새 기능 개발 자유롭게 진행                  │
│                          │ • 공격적인 실험/배포 가능                     │
│                          │ • 카나리 배포 비율 높여도 OK                  │
├─────────────────────────┼────────────────────────────────────────────┤
│ 50~75% (주의)            │ • 새 기능 개발 계속하되 신중하게               │
│                          │ • 배포 전 추가 테스트 필수                    │
│                          │ • 주간 SLO 리뷰 시작                        │
├─────────────────────────┼────────────────────────────────────────────┤
│ 25~50% (경고)            │ • 새 기능 개발 속도 줄이기                    │
│                          │ • 안정성 개선 작업 우선순위 올리기              │
│                          │ • 배포 횟수 제한 (주 2회)                    │
│                          │ • 모든 배포에 롤백 계획 필수                  │
├─────────────────────────┼────────────────────────────────────────────┤
│ 0~25% (위험)             │ • 🚨 새 기능 개발 전면 중단 (Feature Freeze) │
│                          │ • 안정성/신뢰성 작업만 수행                   │
│                          │ • 모든 변경에 추가 리뷰 필수                  │
│                          │ • 경영진에게 상황 리포트                      │
├─────────────────────────┼────────────────────────────────────────────┤
│ 소진 완료 (0%)           │ • 🔴 변경 완전 동결                         │
│                          │ • 장애 원인 분석 및 포스트모템 수행            │
│                          │ • 재발 방지 대책 완료 후에만 개발 재개         │
│                          │ • 다음 SLO 기간까지 보수적 운영               │
└─────────────────────────┴────────────────────────────────────────────┘
```

```mermaid
flowchart TD
    START["📊 매일 Error Budget 확인"] --> CHECK{"Error Budget<br/>잔여량은?"}

    CHECK -->|"75~100%"| GREEN["🟢 여유<br/>새 기능 개발 자유"]
    CHECK -->|"50~75%"| YELLOW["🟡 주의<br/>신중한 배포"]
    CHECK -->|"25~50%"| ORANGE["🟠 경고<br/>안정성 작업 우선"]
    CHECK -->|"0~25%"| RED["🔴 위험<br/>Feature Freeze"]
    CHECK -->|"0% 소진"| BLACK["⛔ 소진<br/>변경 완전 동결"]

    GREEN --> DEPLOY_FREE["공격적 배포 OK<br/>실험 OK"]
    YELLOW --> DEPLOY_CAREFUL["추가 테스트 필수<br/>주간 리뷰"]
    ORANGE --> SLOW_DOWN["배포 횟수 제한<br/>롤백 계획 필수"]
    RED --> FREEZE["기능 개발 중단<br/>안정성만 작업"]
    BLACK --> POSTMORTEM["포스트모템 필수<br/>재발 방지 후 재개"]

    style GREEN fill:#27ae60,color:#fff
    style YELLOW fill:#f1c40f,color:#000
    style ORANGE fill:#e67e22,color:#fff
    style RED fill:#e74c3c,color:#fff
    style BLACK fill:#2c3e50,color:#fff
```

### 4. Multi-Window, Multi-Burn-Rate Alerts

기존 알림 방식(예: "에러율이 1%를 넘으면 알림")은 문제가 있어요. 순간적인 스파이크에도 알림이 울리고(오탐), 천천히 소진되는 경우는 놓치기 쉬워요. 이걸 해결하는 게 **Multi-Window, Multi-Burn-Rate Alert**이에요.

> **비유**: 통장 잔고 감시 — "오늘 50만원 썼다"보다 "이 속도면 3일 후에 바닥난다"가 더 유용해요

#### Burn Rate 개념

```
Burn Rate = 실제 에러율 / SLO 허용 에러율

예: SLO 99.9% (허용 에러율 0.1%)

  실제 에러율   Burn Rate   의미
  ──────────   ─────────   ────
  0.1%         1x          → 딱 SLO 한계선 (한 달 꽉 채워 소진)
  0.2%         2x          → 2배 속도로 소진 (15일에 소진)
  1.0%         10x         → 10배 속도 (3일에 소진!)
  1.44%        14.4x       → 1시간에 1%씩 소진 (3일에 100% 소진)
  10%          100x        → 약 7시간에 소진!
  100%         1000x       → 약 43분에 전체 소진 (완전 장애)
```

#### Multi-Window 알림 설계

```
Multi-Window, Multi-Burn-Rate Alert 전략:

┌───────────┬────────────┬─────────────┬──────────────┬─────────────────┐
│ Severity  │ Burn Rate  │ Long Window │ Short Window │ 의미             │
├───────────┼────────────┼─────────────┼──────────────┼─────────────────┤
│ Critical  │ 14.4x      │ 1시간       │ 5분          │ 3일 안에 소진!   │
│ (Page)    │            │             │              │ → 즉시 대응      │
├───────────┼────────────┼─────────────┼──────────────┼─────────────────┤
│ Critical  │ 6x         │ 6시간       │ 30분         │ 1주 안에 소진!   │
│ (Page)    │            │             │              │ → 빠른 대응      │
├───────────┼────────────┼─────────────┼──────────────┼─────────────────┤
│ Warning   │ 3x         │ 1일         │ 2시간        │ 10일 안에 소진   │
│ (Ticket)  │            │             │              │ → 업무시간 대응  │
├───────────┼────────────┼─────────────┼──────────────┼─────────────────┤
│ Warning   │ 1x         │ 3일         │ 6시간        │ 한 달에 딱 소진  │
│ (Ticket)  │            │             │              │ → 계획적 대응    │
└───────────┴────────────┴─────────────┴──────────────┴─────────────────┘

왜 두 개의 윈도우(Long + Short)를 쓰나요?

Long Window만 쓰면:  과거의 에러가 포함되어 이미 복구된 후에도 알림이 계속 울려요
Short Window만 쓰면: 짧은 스파이크에도 오탐이 발생해요

둘 다 충족해야 알림 → 정확도가 크게 올라가요!
```

#### Prometheus 알림 규칙 구현

```yaml
# Multi-Window, Multi-Burn-Rate Alert Rules
# SLO: 99.9% availability (30일 기준)

groups:
  - name: slo-availability-alerts
    rules:
      # ─── 사전 계산: Error Rate Recording Rules ───
      - record: slo:error_rate:ratio_rate5m
        expr: |
          sum(rate(http_requests_total{code=~"5.."}[5m]))
          /
          sum(rate(http_requests_total[5m]))

      - record: slo:error_rate:ratio_rate30m
        expr: |
          sum(rate(http_requests_total{code=~"5.."}[30m]))
          /
          sum(rate(http_requests_total[30m]))

      - record: slo:error_rate:ratio_rate1h
        expr: |
          sum(rate(http_requests_total{code=~"5.."}[1h]))
          /
          sum(rate(http_requests_total[1h]))

      - record: slo:error_rate:ratio_rate6h
        expr: |
          sum(rate(http_requests_total{code=~"5.."}[6h]))
          /
          sum(rate(http_requests_total[6h]))

      - record: slo:error_rate:ratio_rate1d
        expr: |
          sum(rate(http_requests_total{code=~"5.."}[1d]))
          /
          sum(rate(http_requests_total[1d]))

      - record: slo:error_rate:ratio_rate3d
        expr: |
          sum(rate(http_requests_total{code=~"5.."}[3d]))
          /
          sum(rate(http_requests_total[3d]))

      # ─── Critical: Burn Rate 14.4x (1h + 5m) ───
      - alert: SLOHighBurnRate_Critical_Fast
        expr: |
          slo:error_rate:ratio_rate1h > (14.4 * 0.001)
          and
          slo:error_rate:ratio_rate5m > (14.4 * 0.001)
        for: 2m
        labels:
          severity: critical
          slo: availability
          burn_rate: "14.4x"
        annotations:
          summary: "SLO Burn Rate 14.4x - 3일 안에 Error Budget 소진!"
          description: |
            서비스 {{ $labels.service }}의 에러율이 SLO 대비 14.4배 속도로 증가 중.
            현재 1시간 에러율: {{ $value | humanizePercentage }}
            이 속도면 약 3일 후 Error Budget이 완전 소진됩니다.
            즉시 조치가 필요합니다.
          runbook_url: "https://wiki.example.com/runbooks/slo-burn-rate"

      # ─── Critical: Burn Rate 6x (6h + 30m) ───
      - alert: SLOHighBurnRate_Critical_Slow
        expr: |
          slo:error_rate:ratio_rate6h > (6 * 0.001)
          and
          slo:error_rate:ratio_rate30m > (6 * 0.001)
        for: 5m
        labels:
          severity: critical
          slo: availability
          burn_rate: "6x"
        annotations:
          summary: "SLO Burn Rate 6x - 1주 안에 Error Budget 소진!"
          description: |
            서비스 {{ $labels.service }}의 에러율이 SLO 대비 6배 속도로 증가 중.
            현재 6시간 에러율: {{ $value | humanizePercentage }}

      # ─── Warning: Burn Rate 3x (1d + 2h) ───
      - alert: SLOHighBurnRate_Warning_Slow
        expr: |
          slo:error_rate:ratio_rate1d > (3 * 0.001)
          and
          slo:error_rate:ratio_rate2h > (3 * 0.001)
        for: 10m
        labels:
          severity: warning
          slo: availability
          burn_rate: "3x"
        annotations:
          summary: "SLO Burn Rate 3x - 10일 안에 Error Budget 소진"

      # ─── Warning: Burn Rate 1x (3d + 6h) ───
      - alert: SLOHighBurnRate_Warning_Gradual
        expr: |
          slo:error_rate:ratio_rate3d > (1 * 0.001)
          and
          slo:error_rate:ratio_rate6h > (1 * 0.001)
        for: 30m
        labels:
          severity: warning
          slo: availability
          burn_rate: "1x"
        annotations:
          summary: "SLO Burn Rate 1x - 월말까지 Error Budget 소진 예상"
```

### 5. SLO Dashboard 설계 (Grafana)

[대시보드 설계](../08-observability/10-dashboard-design)에서 배운 원칙을 SLO에 적용해볼게요.

#### SLO 대시보드 구조

```
SLO Dashboard 계층 구조:

Level 1: Executive Overview (경영진용)
├── 전체 서비스 SLO 준수율 (초록/노랑/빨강)
├── Error Budget 잔여량 (월간)
└── 주요 서비스 상태 요약

Level 2: Service Overview (팀 리드용)
├── 서비스별 SLI 현황 (Availability, Latency, Correctness)
├── Error Budget 소진 추이 (번다운 차트)
├── SLO 위반 이력 (최근 30일)
└── 알림 발생 횟수 및 MTTR

Level 3: SLI Detail (엔지니어용)
├── SLI 실시간 값 (1분/5분/1시간 윈도우)
├── Burn Rate 현황
├── 에러 유형별 분석
└── 배포 이벤트 오버레이
```

#### Grafana Dashboard JSON (핵심 패널)

```json
{
  "panels": [
    {
      "title": "SLO Status Overview",
      "type": "stat",
      "description": "현재 SLO 달성률",
      "targets": [
        {
          "expr": "1 - (sum(rate(http_requests_total{code=~\"5..\"}[30d])) / sum(rate(http_requests_total[30d])))",
          "legendFormat": "Availability SLO"
        }
      ],
      "fieldConfig": {
        "defaults": {
          "thresholds": {
            "steps": [
              { "value": 0, "color": "red" },
              { "value": 0.999, "color": "yellow" },
              { "value": 0.9995, "color": "green" }
            ]
          },
          "unit": "percentunit"
        }
      }
    },
    {
      "title": "Error Budget Remaining",
      "type": "gauge",
      "description": "월간 Error Budget 잔여율",
      "targets": [
        {
          "expr": "1 - (sum(increase(http_requests_total{code=~\"5..\"}[30d])) / (sum(increase(http_requests_total[30d])) * (1 - 0.999)))",
          "legendFormat": "Budget Remaining"
        }
      ],
      "fieldConfig": {
        "defaults": {
          "min": 0,
          "max": 1,
          "thresholds": {
            "steps": [
              { "value": 0, "color": "red" },
              { "value": 0.25, "color": "orange" },
              { "value": 0.5, "color": "yellow" },
              { "value": 0.75, "color": "green" }
            ]
          },
          "unit": "percentunit"
        }
      }
    },
    {
      "title": "Error Budget Burndown",
      "type": "timeseries",
      "description": "Error Budget 소진 추이 (이상적 vs 실제)",
      "targets": [
        {
          "expr": "1 - (sum(increase(http_requests_total{code=~\"5..\"}[$__range])) / (sum(increase(http_requests_total[$__range])) * 0.001))",
          "legendFormat": "실제 Error Budget"
        }
      ]
    },
    {
      "title": "Burn Rate (Multi-Window)",
      "type": "timeseries",
      "description": "각 윈도우별 Burn Rate 추이",
      "targets": [
        {
          "expr": "slo:error_rate:ratio_rate5m / 0.001",
          "legendFormat": "Burn Rate (5m window)"
        },
        {
          "expr": "slo:error_rate:ratio_rate1h / 0.001",
          "legendFormat": "Burn Rate (1h window)"
        },
        {
          "expr": "slo:error_rate:ratio_rate6h / 0.001",
          "legendFormat": "Burn Rate (6h window)"
        }
      ]
    },
    {
      "title": "SLI: Latency Distribution",
      "type": "heatmap",
      "description": "응답시간 분포 (히트맵)",
      "targets": [
        {
          "expr": "sum(rate(http_request_duration_seconds_bucket[5m])) by (le)",
          "legendFormat": "{{le}}"
        }
      ]
    }
  ]
}
```

#### 핵심 대시보드 패널 구성

```
SLO Dashboard 권장 레이아웃 (가로 24칸 기준):

Row 1: 핵심 지표 (높이 4)
┌────────────┬────────────┬────────────┬────────────┐
│ SLO 달성률  │ EB 잔여(%) │ Burn Rate  │ 위반 횟수   │
│   Stat     │   Gauge    │   Stat     │   Stat     │
│  (6칸)     │  (6칸)     │  (6칸)     │  (6칸)     │
└────────────┴────────────┴────────────┴────────────┘

Row 2: Error Budget 번다운 (높이 8)
┌────────────────────────────────────────────────────┐
│              Error Budget Burndown Chart            │
│  이상적 소진선 (점선) vs 실제 소진 (실선)             │
│  배포 이벤트 마커 포함                               │
│                    (24칸)                           │
└────────────────────────────────────────────────────┘

Row 3: SLI 상세 (높이 8)
┌──────────────────────────┬──────────────────────────┐
│   Availability (에러율)   │   Latency (P50/P95/P99)  │
│   Time Series            │   Time Series            │
│       (12칸)             │       (12칸)             │
└──────────────────────────┴──────────────────────────┘

Row 4: 분석 도구 (높이 8)
┌──────────────────────────┬──────────────────────────┐
│  Burn Rate (Multi-Window)│  Latency Heatmap         │
│   Time Series            │   Heatmap                │
│       (12칸)             │       (12칸)             │
└──────────────────────────┴──────────────────────────┘
```

### 6. SLO 도구: Sloth & Pyrra

수동으로 Recording Rule, Alert Rule을 작성하는 건 실수하기 쉬워요. SLO 전용 도구를 사용하면 자동으로 생성해줘요.

#### Sloth (슬로스)

Sloth는 YAML로 SLO를 정의하면 Prometheus Recording Rules과 Alert Rules를 자동 생성해주는 도구예요.

```yaml
# sloth.yaml - SLO 정의 파일
version: "prometheus/v1"
service: "api-gateway"
labels:
  owner: "platform-team"
  tier: "tier-1"

slos:
  # ─── Availability SLO ───
  - name: "api-availability"
    objective: 99.9  # 99.9% SLO
    description: "API Gateway의 가용성 SLO"
    sli:
      events:
        error_query: |
          sum(rate(http_requests_total{service="api-gateway",code=~"5.."}[{{.window}}]))
        total_query: |
          sum(rate(http_requests_total{service="api-gateway"}[{{.window}}]))
    alerting:
      name: "APIGatewayAvailability"
      labels:
        team: "platform"
      annotations:
        runbook: "https://wiki.example.com/runbooks/api-availability"
      page_alert:
        labels:
          severity: "critical"
          routing_key: "platform-oncall"
      ticket_alert:
        labels:
          severity: "warning"
          routing_key: "platform-tickets"

  # ─── Latency SLO ───
  - name: "api-latency"
    objective: 99.0  # P99 요청의 99%가 500ms 이내
    description: "API Gateway의 응답시간 SLO (P99 < 500ms)"
    sli:
      events:
        error_query: |
          sum(rate(http_request_duration_seconds_count{service="api-gateway"}[{{.window}}]))
          -
          sum(rate(http_request_duration_seconds_bucket{service="api-gateway",le="0.5"}[{{.window}}]))
        total_query: |
          sum(rate(http_request_duration_seconds_count{service="api-gateway"}[{{.window}}]))
    alerting:
      name: "APIGatewayLatency"
      labels:
        team: "platform"
      annotations:
        runbook: "https://wiki.example.com/runbooks/api-latency"
```

```bash
# Sloth 사용법
# 1. SLO 정의 파일 생성
# 2. Prometheus rules 자동 생성
sloth generate -i sloth.yaml -o prometheus-rules/

# 생성되는 파일:
# - recording rules (5m, 30m, 1h, 2h, 6h, 1d, 3d 윈도우)
# - multi-burn-rate alert rules (page + ticket)
# - SLO metadata labels
```

#### Pyrra

Pyrra는 Kubernetes 환경에서 SLO를 관리하는 도구로, CRD(Custom Resource Definition)와 웹 UI를 제공해요.

```yaml
# pyrra-slo.yaml - Kubernetes CRD
apiVersion: pyrra.dev/v1alpha1
kind: ServiceLevelObjective
metadata:
  name: api-gateway-availability
  namespace: monitoring
  labels:
    pyrra.dev/team: platform
spec:
  target: "99.9"
  window: 30d
  description: "API Gateway 가용성 SLO"
  indicator:
    ratio:
      errors:
        metric: http_requests_total{service="api-gateway",code=~"5.."}
      total:
        metric: http_requests_total{service="api-gateway"}
  alerting:
    disabled: false
---
apiVersion: pyrra.dev/v1alpha1
kind: ServiceLevelObjective
metadata:
  name: api-gateway-latency
  namespace: monitoring
spec:
  target: "99"
  window: 30d
  description: "API Gateway 응답시간 SLO (500ms 이내)"
  indicator:
    latency:
      success:
        metric: http_request_duration_seconds_bucket{service="api-gateway",le="0.5"}
      total:
        metric: http_request_duration_seconds_count{service="api-gateway"}
```

```bash
# Pyrra 설치 및 사용
kubectl apply -f pyrra-slo.yaml

# Pyrra 웹 UI 접속 (SLO 대시보드 자동 생성)
kubectl port-forward svc/pyrra 9099:9099 -n monitoring
# http://localhost:9099 에서 SLO 현황 확인
```

#### Sloth vs Pyrra 비교

```
SLO 도구 비교:

┌─────────────────┬──────────────────────┬──────────────────────┐
│ 항목             │ Sloth                │ Pyrra                │
├─────────────────┼──────────────────────┼──────────────────────┤
│ 방식             │ CLI 기반 코드 생성     │ Kubernetes Operator  │
│ 입력             │ YAML 파일             │ Kubernetes CRD       │
│ 출력             │ Prometheus Rules 파일 │ 자동 적용 + 웹 UI     │
│ 대시보드          │ Grafana JSON 생성     │ 내장 웹 UI           │
│ K8s 필수?        │ 아니요               │ 예                   │
│ GitOps 친화성    │ 높음 (파일 기반)       │ 높음 (CRD 기반)      │
│ 학습 곡선         │ 낮음                 │ 보통                 │
│ 추천 환경         │ 범용                 │ Kubernetes           │
└─────────────────┴──────────────────────┴──────────────────────┘
```

### 7. SLO 문서화 템플릿

SLO는 정의만 해서는 안 되고, 반드시 문서화해서 팀 전체가 공유해야 해요.

```markdown
# SLO 문서 템플릿

## 서비스 정보
- **서비스명**: [예: api-gateway]
- **서비스 소유팀**: [예: Platform Team]
- **서비스 설명**: [예: 모든 외부 API 트래픽의 진입점]
- **Tier**: [예: Tier-1 (비즈니스 크리티컬)]
- **의존 서비스**: [예: auth-service, user-service, payment-service]

## SLI 정의

### SLI 1: Availability
- **Specification**: 성공적으로 처리된 HTTP 요청의 비율
- **Implementation**: HTTP 5xx 응답을 제외한 요청 / 전체 요청
- **측정 지점**: Application Load Balancer (ALB)
- **데이터 소스**: Prometheus (ALB exporter)
- **쿼리**: `sum(rate(http_requests_total{code!~"5.."}[5m])) / sum(rate(http_requests_total[5m]))`

### SLI 2: Latency
- **Specification**: 500ms 이내에 응답한 요청의 비율
- **Implementation**: 응답시간 500ms 이하 요청 / 전체 요청
- **측정 지점**: 서버 사이드 (application metric)
- **데이터 소스**: Prometheus (histogram)
- **쿼리**: `sum(rate(http_request_duration_seconds_bucket{le="0.5"}[5m])) / sum(rate(http_request_duration_seconds_count[5m]))`

## SLO 목표

| SLI | SLO 목표 | 기간 | Error Budget (30일) |
|-----|---------|------|-------------------|
| Availability | 99.9% | 30일 롤링 | 43.2분 |
| Latency (P99 < 500ms) | 99.0% | 30일 롤링 | 432분 |

## Error Budget Policy
- **75~100%**: 정상 개발 진행
- **50~75%**: 신중한 배포, 주간 리뷰
- **25~50%**: 안정성 작업 우선, 배포 제한
- **0~25%**: Feature Freeze
- **소진**: 변경 동결, 포스트모템 필수

## 알림 설정
- **Critical (Page)**: Burn Rate 14.4x (1h/5m), 6x (6h/30m)
- **Warning (Ticket)**: Burn Rate 3x (1d/2h), 1x (3d/6h)
- **수신자**: Platform On-call (PagerDuty), #platform-alerts (Slack)

## 리뷰 주기
- **일간**: Error Budget 잔여량 확인 (자동 Slack 리포트)
- **주간**: SLO 준수율 리뷰 (팀 미팅)
- **월간**: SLO 목표 적정성 재검토
- **분기**: SLI/SLO 전면 재검토

## 히스토리
| 날짜 | 변경 내용 | 사유 |
|------|----------|------|
| 2025-01-15 | 최초 SLO 설정 | 서비스 런칭 |
| 2025-04-01 | Latency SLO 99.5% → 99.0% 완화 | 신규 기능 추가로 지연 증가 |
| 2025-07-01 | Availability SLO 99.9% → 99.95% 강화 | 인프라 개선 완료 |
```

### 8. SLA와 SLO의 관계

```
SLA ⊂ SLO ⊂ SLI 관계 정리:

SLI (지표 — 엔지니어가 정의)
 │
 ├── 가용성: 현재 99.95%
 ├── 지연시간: P99 현재 320ms
 └── 정확성: 현재 99.99%
       │
       ▼
SLO (내부 목표 — 엔지니어 + 비즈니스 합의)
 │
 ├── 가용성 SLO: 99.9%     ← SLA보다 0.05% 엄격
 ├── 지연시간 SLO: P99 < 500ms
 └── 정확성 SLO: 99.99%
       │
       ▼
SLA (외부 계약 — 비즈니스 + 법무)
 │
 ├── 가용성 SLA: 99.85%    ← SLO보다 느슨
 ├── 지연시간 SLA: P99 < 1s
 └── 위반 시: 월 사용료 10% 크레딧
```

```
실제 클라우드 벤더 SLA 예시:

AWS:
  • EC2:           99.99%  (월 4.32분 다운 허용)
  • S3:            99.9%   (월 43.2분 다운 허용)
  • RDS Multi-AZ:  99.95%  (월 21.6분 다운 허용)
  • Lambda:        99.95%

GCP:
  • Compute Engine: 99.99%
  • Cloud SQL:      99.95%
  • Cloud Run:      99.95%

Azure:
  • Virtual Machines: 99.99% (가용성 세트)
  • Azure SQL:        99.99%

→ 클라우드 벤더도 100%를 약속하지 않아요!
→ 여러 서비스를 조합하면 전체 가용성은 더 낮아져요
```

**복합 서비스 가용성 계산:**

```
직렬 구성 (A → B → C): 전체 = A × B × C
  예: 99.9% × 99.9% × 99.9% = 99.7% (개별보다 훨씬 낮아짐!)

병렬 구성 (A || B, 중복): 전체 = 1 - (1-A) × (1-B)
  예: 1 - (1-99.9%) × (1-99.9%) = 99.9999%

실제 아키텍처 계산:
  CDN(99.9%) → LB(99.99%) → App(99.9%) → DB(99.95%)
  = 0.999 × 0.9999 × 0.999 × 0.9995
  = 99.74%

  → 개별 컴포넌트가 모두 99.9% 이상이어도
    전체 서비스는 99.74% 밖에 안 돼요!
  → 이게 SLO를 설정할 때 반드시 고려해야 하는 포인트예요
```

---

## 💻 직접 해보기

### 실습 1: 나의 서비스에 SLI/SLO 정의하기

간단한 웹 API 서비스를 예로 들어서 SLI/SLO를 처음부터 설정해볼게요.

#### Step 1: 서비스 분석 및 SLI 선정

```bash
# 현재 서비스 메트릭 확인 (Prometheus)
# 1. 어떤 메트릭이 있는지 확인
curl -s http://prometheus:9090/api/v1/label/__name__/values | jq '.data[]' | grep http

# 예상 결과:
# "http_requests_total"
# "http_request_duration_seconds_bucket"
# "http_request_duration_seconds_count"
# "http_request_duration_seconds_sum"
```

```bash
# 2. 최근 30일 가용성 확인
curl -s 'http://prometheus:9090/api/v1/query' \
  --data-urlencode 'query=
    1 - (
      sum(increase(http_requests_total{code=~"5.."}[30d]))
      /
      sum(increase(http_requests_total[30d]))
    )
  ' | jq '.data.result[0].value[1]'

# 예상 결과: "0.99957" → 현재 가용성 99.957%
```

```bash
# 3. 최근 30일 P99 지연시간 확인
curl -s 'http://prometheus:9090/api/v1/query' \
  --data-urlencode 'query=
    histogram_quantile(0.99,
      sum(rate(http_request_duration_seconds_bucket[30d])) by (le)
    )
  ' | jq '.data.result[0].value[1]'

# 예상 결과: "0.342" → P99 지연시간 342ms
```

#### Step 2: SLO 설정

```yaml
# my-service-slo.yaml
# 현재 성능 데이터 기반으로 SLO 설정

service: my-web-api
team: backend-team
tier: tier-2

current_performance:  # 최근 30일 실측
  availability: 99.957%
  latency_p99: 342ms
  error_rate: 0.043%

slo_targets:  # SLO 목표 (현재보다 약간 느슨하게)
  availability:
    target: 99.9%           # 현재 99.957%에서 0.057% 마진
    error_budget: 43.2min   # 월간 허용 다운타임
    rationale: "과거 30일 기준 99.95% 이상 유지, 0.05% 마진 확보"

  latency:
    target: 99%             # P99 요청의 99%가 500ms 이내
    threshold: 500ms        # 현재 342ms에서 158ms 마진
    error_budget: 432min    # 1% 허용
    rationale: "사용자 이탈률 데이터 기반, 500ms 이내 이탈률 5% 미만"
```

#### Step 3: Prometheus Recording Rules 작성

```yaml
# prometheus-recording-rules.yaml
groups:
  - name: my-web-api-sli
    interval: 30s
    rules:
      # ─── Availability SLI ───
      - record: my_web_api:sli:availability
        expr: |
          sum(rate(http_requests_total{service="my-web-api",code!~"5.."}[5m]))
          /
          sum(rate(http_requests_total{service="my-web-api"}[5m]))

      # ─── Latency SLI (500ms 이내 비율) ───
      - record: my_web_api:sli:latency_good_ratio
        expr: |
          sum(rate(http_request_duration_seconds_bucket{service="my-web-api",le="0.5"}[5m]))
          /
          sum(rate(http_request_duration_seconds_count{service="my-web-api"}[5m]))

      # ─── Error Budget 잔여율 (30일 롤링) ───
      - record: my_web_api:error_budget:remaining
        expr: |
          1 - (
            sum(increase(http_requests_total{service="my-web-api",code=~"5.."}[30d]))
            /
            (sum(increase(http_requests_total{service="my-web-api"}[30d])) * 0.001)
          )

      # ─── Multi-Window Error Rates ───
      - record: my_web_api:error_rate:5m
        expr: |
          sum(rate(http_requests_total{service="my-web-api",code=~"5.."}[5m]))
          / sum(rate(http_requests_total{service="my-web-api"}[5m]))

      - record: my_web_api:error_rate:30m
        expr: |
          sum(rate(http_requests_total{service="my-web-api",code=~"5.."}[30m]))
          / sum(rate(http_requests_total{service="my-web-api"}[30m]))

      - record: my_web_api:error_rate:1h
        expr: |
          sum(rate(http_requests_total{service="my-web-api",code=~"5.."}[1h]))
          / sum(rate(http_requests_total{service="my-web-api"}[1h]))

      - record: my_web_api:error_rate:6h
        expr: |
          sum(rate(http_requests_total{service="my-web-api",code=~"5.."}[6h]))
          / sum(rate(http_requests_total{service="my-web-api"}[6h]))
```

#### Step 4: Sloth로 SLO 자동 생성

```yaml
# sloth-my-web-api.yaml
version: "prometheus/v1"
service: "my-web-api"
labels:
  owner: "backend-team"
  tier: "tier-2"

slos:
  - name: "availability"
    objective: 99.9
    description: "my-web-api 서비스의 HTTP 가용성"
    sli:
      events:
        error_query: |
          sum(rate(http_requests_total{service="my-web-api",code=~"5.."}[{{.window}}]))
        total_query: |
          sum(rate(http_requests_total{service="my-web-api"}[{{.window}}]))
    alerting:
      name: "MyWebApiAvailability"
      labels:
        team: "backend"
      annotations:
        runbook: "https://wiki.internal/runbooks/my-web-api-availability"
      page_alert:
        labels:
          severity: "critical"
      ticket_alert:
        labels:
          severity: "warning"

  - name: "latency"
    objective: 99.0
    description: "my-web-api 서비스의 응답시간 (P99 < 500ms)"
    sli:
      events:
        error_query: |
          (
            sum(rate(http_request_duration_seconds_count{service="my-web-api"}[{{.window}}]))
            -
            sum(rate(http_request_duration_seconds_bucket{service="my-web-api",le="0.5"}[{{.window}}]))
          )
        total_query: |
          sum(rate(http_request_duration_seconds_count{service="my-web-api"}[{{.window}}]))
    alerting:
      name: "MyWebApiLatency"
      labels:
        team: "backend"
      annotations:
        runbook: "https://wiki.internal/runbooks/my-web-api-latency"
```

```bash
# Sloth로 Prometheus rules 자동 생성
sloth generate -i sloth-my-web-api.yaml -o rules/

# 생성된 파일 확인
ls rules/
# my-web-api-availability.yml
# my-web-api-latency.yml

# Prometheus에 rules 적용
cp rules/*.yml /etc/prometheus/rules/
# Prometheus reload
curl -X POST http://prometheus:9090/-/reload
```

#### Step 5: 결과 확인

```bash
# Error Budget 잔여량 확인
curl -s 'http://prometheus:9090/api/v1/query' \
  --data-urlencode 'query=my_web_api:error_budget:remaining' \
  | jq '.data.result[0].value[1]'

# 예상 결과: "0.87" → Error Budget 87% 남음

# Burn Rate 확인
curl -s 'http://prometheus:9090/api/v1/query' \
  --data-urlencode 'query=my_web_api:error_rate:1h / 0.001' \
  | jq '.data.result[0].value[1]'

# 예상 결과: "0.45" → Burn Rate 0.45x (아주 건강한 상태)
```

### 실습 2: Grafana SLO 대시보드 만들기

```bash
# Grafana에 SLO 대시보드 프로비저닝
# 1. 대시보드 JSON 파일 준비 (위의 JSON 참고)
# 2. Grafana API로 대시보드 생성

curl -X POST http://admin:admin@grafana:3000/api/dashboards/db \
  -H "Content-Type: application/json" \
  -d '{
    "dashboard": {
      "title": "My Web API - SLO Dashboard",
      "uid": "my-web-api-slo",
      "tags": ["slo", "my-web-api"],
      "panels": [
        {
          "id": 1,
          "title": "Availability SLO (target: 99.9%)",
          "type": "stat",
          "gridPos": {"h": 4, "w": 6, "x": 0, "y": 0},
          "targets": [{
            "expr": "my_web_api:sli:availability",
            "legendFormat": "Availability"
          }],
          "fieldConfig": {
            "defaults": {
              "unit": "percentunit",
              "thresholds": {
                "steps": [
                  {"value": 0, "color": "red"},
                  {"value": 0.999, "color": "yellow"},
                  {"value": 0.9995, "color": "green"}
                ]
              }
            }
          }
        },
        {
          "id": 2,
          "title": "Error Budget Remaining",
          "type": "gauge",
          "gridPos": {"h": 4, "w": 6, "x": 6, "y": 0},
          "targets": [{
            "expr": "my_web_api:error_budget:remaining",
            "legendFormat": "Budget"
          }],
          "fieldConfig": {
            "defaults": {
              "unit": "percentunit",
              "min": 0, "max": 1,
              "thresholds": {
                "steps": [
                  {"value": 0, "color": "red"},
                  {"value": 0.25, "color": "orange"},
                  {"value": 0.5, "color": "yellow"},
                  {"value": 0.75, "color": "green"}
                ]
              }
            }
          }
        }
      ]
    },
    "overwrite": true
  }'
```

---

## 🏢 실무에서는?

### 사례 1: 스타트업에서 처음 SLO 도입하기

```
상황: 20명 규모 스타트업, SRE 전담 인력 없음

접근법:
1. 가장 중요한 서비스 1개만 선택 (결제 API)
2. SLI 2개만 정의 (Availability, Latency)
3. SLO는 현재 성능 기준으로 설정 (보수적)
4. Error Budget은 스프레드시트로 수동 추적
5. 3개월 운영 후 확대

타임라인:
  1주차: 메트릭 수집 확인 및 SLI 정의
  2주차: SLO 설정 및 Recording Rules 작성
  3주차: Grafana 대시보드 구성
  4주차: 팀 공유 및 Error Budget Policy 합의
  2개월차: 알림 규칙 추가 (Burn Rate 기반)
  3개월차: 두 번째 서비스로 확장

핵심 교훈:
  → 처음부터 완벽하려 하지 마세요
  → SLO는 "한 번 정하면 끝"이 아니라 계속 조정하는 거예요
  → 팀 합의가 기술보다 중요해요
```

### 사례 2: 대규모 조직에서 SLO 문화 확산

```
상황: 500명 규모 회사, 50+개 마이크로서비스

도전 과제:
  - 팀마다 SLO 기준이 다름
  - "우리 서비스는 SLO가 필요 없어요" 라는 저항
  - SLO 위반해도 아무 일도 안 일어남

해결 전략:
  1. SLO 챔피언 프로그램
     → 각 팀에서 1명씩 SLO 챔피언 선정
     → 월 1회 SLO 챔피언 미팅으로 베스트 프랙티스 공유

  2. SLO 표준 템플릿 제공
     → 서비스 Tier별 표준 SLO 가이드라인
     → Sloth 기반 자동화 파이프라인 제공

  3. SLO를 성과 지표에 반영
     → 팀 OKR에 SLO 관련 목표 포함
     → Error Budget 소진 시 포스트모템 필수화

  4. SLO 리뷰 제도화
     → 월간 SLO 리뷰 미팅 (전사)
     → 분기별 SLO 적정성 재검토

결과:
  - 6개월 만에 80% 서비스에 SLO 적용
  - MTTR 평균 45분 → 12분으로 감소
  - Alert Fatigue 70% 감소 (SLO 기반 알림 전환 효과)
```

### 사례 3: Error Budget 소진 시 실제 대응

```
실제 시나리오:

[Day 1] Error Budget 잔여: 85%
  → 정상 운영, 새 기능 개발 진행 중

[Day 7] Error Budget 잔여: 62% (대규모 배포 후 에러 스파이크)
  → 주간 리뷰에서 상황 공유
  → 원인: 새 API 버전 호환성 이슈
  → 조치: 핫픽스 배포, 테스트 커버리지 강화 결정

[Day 14] Error Budget 잔여: 45%
  → Error Budget Policy에 따라 배포 속도 감소
  → 안정성 개선 작업 시작 (타임아웃 조정, 재시도 로직 개선)

[Day 18] Error Budget 잔여: 28%
  → Feature Freeze 돌입
  → 모든 엔지니어가 안정성 작업에 집중
  → 부하 테스트 실시, 병목 구간 최적화

[Day 25] Error Budget 잔여: 22%
  → Feature Freeze 유지
  → 추가 장애 없이 잔여 Budget 보존
  → 이번 달 SLO는 간신히 지킴

[포스트모템]
  근본 원인: 배포 전 통합 테스트 미흡
  재발 방지: Staging 환경 E2E 테스트 필수화
  SLO 조정: 현행 99.9% 유지 (적절한 수준으로 판단)
```

### SLO 기반 알림과 기존 알림 비교

[알림(Alerting)](../08-observability/11-alerting) 챕터에서 배운 알림 설계 원칙을 SLO 관점에서 다시 정리해볼게요.

```
기존 알림 방식 vs SLO 기반 알림:

기존 (Threshold 기반):
  "에러율 > 1% 이면 알림"
  → 문제: 순간 스파이크에도 알림 (오탐)
  → 문제: 0.5%가 1주일 지속되면? 알림 안 울림 (미탐)
  → 문제: "이게 얼마나 심각한 건지" 맥락 부재

SLO 기반 (Burn Rate):
  "Error Budget이 3일 안에 소진될 속도이면 Critical 알림"
  → 장점: 사용자 영향 기반 판단
  → 장점: 심각도가 자동으로 결정됨
  → 장점: 오탐 대폭 감소 (Multi-Window 효과)
  → 장점: "얼마나 급한지"가 명확함

실제 비교 데이터 (가상):
  ┌──────────────────┬───────────────┬──────────────┐
  │ 지표              │ Threshold 기반│ SLO 기반      │
  ├──────────────────┼───────────────┼──────────────┤
  │ 월간 알림 수       │ 180건        │ 12건          │
  │ 오탐률             │ 45%          │ 5%           │
  │ 미탐률             │ 15%          │ 3%           │
  │ 평균 MTTR          │ 35분         │ 12분          │
  │ On-call 만족도     │ 3.2/10       │ 7.8/10       │
  └──────────────────┴───────────────┴──────────────┘
```

---

## ⚠️ 자주 하는 실수

### 실수 1: SLO를 100%로 설정하기

```
❌ 잘못된 접근:
  "우리 서비스는 100% 가용성을 목표로 합니다!"

왜 나쁜가:
  - Error Budget = 0 → 어떤 변경도 할 수 없음
  - 배포 자체가 불가능 (배포 중 잠깐이라도 에러 발생 가능)
  - 팀이 변경을 두려워하게 됨 → 기술 부채 누적
  - 100%는 물리적으로 불가능 (하드웨어 장애, 네트워크 이슈 등)

✅ 올바른 접근:
  "서비스 특성에 맞는 현실적인 SLO를 설정합니다"
  - 결제 서비스: 99.99% (매우 높지만 100%는 아님)
  - 일반 API: 99.9%
  - 내부 도구: 99.5%
  - 배치 처리: 99%

기억하세요: Google도 100%를 약속하지 않아요!
```

### 실수 2: SLI를 내부 메트릭으로만 정의하기

```
❌ 잘못된 SLI:
  - CPU 사용률 < 80%
  - 메모리 사용률 < 70%
  - 디스크 I/O < 1000 IOPS

왜 나쁜가:
  - CPU 80%여도 사용자 경험에 문제가 없을 수 있어요
  - 반대로 CPU 30%인데 애플리케이션 버그로 에러가 날 수도 있어요
  - 리소스 메트릭은 "원인"이지 "증상"이 아니에요

✅ 올바른 SLI:
  - 성공 응답 비율 (사용자가 정상 결과를 받는 비율)
  - 응답 시간 (사용자가 기다리는 시간)
  - 데이터 정확성 (사용자가 받는 결과가 맞는 비율)

원칙: SLI는 "사용자가 느끼는 품질"을 측정해야 해요
```

### 실수 3: SLO를 정하고 방치하기

```
❌ 잘못된 패턴:
  1. SLO를 한 번 정함
  2. 대시보드를 만듦
  3. ... 6개월 후 아무도 안 봄
  4. SLO가 현실과 동떨어짐

✅ 올바른 패턴:
  1. SLO를 정하고 Error Budget Policy도 함께 정함
  2. 주간 미팅에서 Error Budget 잔여량 리뷰
  3. 분기마다 SLO 적정성 재검토
  4. SLO 위반 시 자동으로 프로세스 트리거 (포스트모템 등)
  5. SLO 변경 히스토리를 문서화

핵심: SLO는 살아있는 문서예요. 서비스가 변하면 SLO도 변해야 해요.
```

### 실수 4: 모든 서비스에 같은 SLO 적용하기

```
❌ 잘못된 접근:
  "전사 표준 SLO: 모든 서비스 99.9%"

왜 나쁜가:
  - 결제 서비스에는 너무 낮을 수 있어요 (돈이 걸려있으니까)
  - 내부 관리 도구에는 너무 높을 수 있어요 (비용 낭비)
  - 서비스마다 사용자 기대치가 다르니까요

✅ 올바른 접근:
  서비스 Tier 기반 SLO 가이드라인:

  Tier 1 (비즈니스 크리티컬): 결제, 인증
    → Availability: 99.99%, Latency P99: < 200ms

  Tier 2 (사용자 대면): 검색, 상품 조회
    → Availability: 99.9%, Latency P99: < 500ms

  Tier 3 (내부 서비스): 관리자 도구, 로그 수집
    → Availability: 99.5%, Latency P99: < 2s

  Tier 4 (배치/비동기): 데이터 파이프라인, 리포트
    → Freshness: 99%, Correctness: 99.9%
```

### 실수 5: Error Budget을 "남기면 좋은 것"으로 오해하기

```
❌ 잘못된 이해:
  "Error Budget이 100% 남았어요! 우리 팀 최고!"

실제 의미:
  Error Budget 100% 남음
  = 한 달 내내 단 한 번도 에러가 없었음
  = 이건 좋은 게 아니라 "변경이 없었다"는 뜻일 수 있어요!

Error Budget은 "혁신의 연료"예요:
  - Budget이 남아있으면 → 새로운 기능 배포, 실험, 마이그레이션 가능
  - Budget을 "아껴만" 두면 → 기술 부채가 쌓이고, 개선이 멈춤

✅ 건강한 Error Budget 사용:
  - 월말 기준 25~50% 잔여가 이상적
  - 너무 많이 남으면: SLO가 너무 느슨하거나, 변경이 부족한 것
  - 너무 적게 남으면: 안정성 개선이 필요한 것
```

### 실수 6: SLO 알림에 Multi-Window를 적용하지 않기

```
❌ 단일 윈도우 알림:
  alert: HighErrorRate
  expr: error_rate_5m > 0.001  # 5분 윈도우만 사용

  문제: 5분간 스파이크가 있으면 즉시 알림 → 곧 복구돼도 불필요한 페이지
  문제: 느린 소진은 감지 못함

✅ Multi-Window 알림:
  alert: SLOBurnRate
  expr: |
    error_rate_1h > (14.4 * 0.001)   # Long Window: 1시간 동안 지속
    AND
    error_rate_5m > (14.4 * 0.001)   # Short Window: 현재도 진행 중

  장점: Long Window로 지속성 확인, Short Window로 현재 상태 확인
  장점: 이미 복구된 이슈에 대한 오탐 방지
```

---

## 📝 마무리

### 핵심 요약

```
SLI/SLO 실무 핵심 정리:

1. SLI는 "사용자 관점"의 지표를 선택해요
   → Availability, Latency, Correctness, Freshness, Throughput

2. SLO는 "현실적인 목표"를 설정해요
   → 100%는 절대 안 돼요! 과거 데이터 + 비즈니스 요구 기반

3. Error Budget은 "혁신과 안정의 균형"을 맞춰요
   → 남은 Budget → 새 기능 | 소진된 Budget → 안정성 작업

4. Multi-Window Multi-Burn-Rate Alert로 "정확한 알림"을 구현해요
   → 오탐은 줄이고, 미탐은 방지

5. SLO 문화는 "팀 합의"가 핵심이에요
   → Error Budget Policy → 주간 리뷰 → 분기 재검토

6. SLO 도구(Sloth, Pyrra)로 "자동화"해요
   → 수작업 Recording Rule/Alert Rule 작성 실수 방지
```

### 전체 흐름 복습

```mermaid
flowchart TD
    START["서비스 분석"] --> SLI["SLI 선정<br/>Availability, Latency,<br/>Correctness, Freshness"]
    SLI --> SPEC["SLI Specification<br/>'무엇을 측정할까?'"]
    SPEC --> IMPL["SLI Implementation<br/>'어떻게 측정할까?'<br/>Prometheus 쿼리 작성"]
    IMPL --> SLO["SLO 설정<br/>히스토리 기반 + 비즈니스 협의"]
    SLO --> EB["Error Budget 계산<br/>예: 99.9% → 43.2분/월"]
    EB --> POLICY["Error Budget Policy<br/>팀 합의 문서 작성"]
    POLICY --> ALERT["Multi-Window Alert<br/>Burn Rate 기반 알림"]
    ALERT --> DASH["SLO Dashboard<br/>Grafana 구성"]
    DASH --> REVIEW["주간/월간 리뷰<br/>SLO 적정성 확인"]
    REVIEW -->|"조정 필요"| SLO
    REVIEW -->|"정상 운영"| CULTURE["SLO 문화 정착<br/>전사 확산"]

    style START fill:#3498db,color:#fff
    style SLO fill:#2ecc71,color:#fff
    style EB fill:#f39c12,color:#fff
    style ALERT fill:#e74c3c,color:#fff
    style CULTURE fill:#9b59b6,color:#fff
```

### SLI/SLO 체크리스트

```
SLI/SLO 도입 체크리스트:

Phase 1: 준비 (1주)
  □ 대상 서비스 선정 (가장 중요한 1~2개)
  □ 현재 메트릭 수집 상태 확인
  □ SLI 종류 선정 (Availability, Latency 우선)
  □ 최근 30일 성능 데이터 분석

Phase 2: 설정 (1주)
  □ SLI Specification 작성
  □ SLI Implementation (Prometheus 쿼리)
  □ SLO 목표 설정 (과거 데이터 + 비즈니스 협의)
  □ Error Budget 계산

Phase 3: 자동화 (1주)
  □ Recording Rules 작성 (또는 Sloth/Pyrra 사용)
  □ Multi-Window Alert Rules 설정
  □ Grafana SLO Dashboard 구성
  □ Slack/PagerDuty 연동

Phase 4: 문화 (지속)
  □ Error Budget Policy 팀 합의
  □ SLO 문서화 (표준 템플릿 사용)
  □ 주간 SLO 리뷰 시작
  □ 월간 Error Budget 리포트 자동화
  □ 분기별 SLO 재검토 일정 확정

Phase 5: 확산 (3개월+)
  □ 다른 서비스로 SLO 확대
  □ SLO 챔피언 프로그램 운영
  □ SLO 기반 의사결정 프로세스 정착
  □ SLO를 팀 OKR에 반영
```

---

## 🔗 다음 단계

### 이어서 공부하면 좋은 내용

```
학습 로드맵:

현재 위치: SLI/SLO 실무
     │
     ├── 선수 학습 (이미 완료했어야 하는 것)
     │   ├── SRE 원칙 (./01-principles)
     │   ├── Prometheus 기초 (../08-observability/02-prometheus)
     │   ├── Grafana 기초 (../08-observability/03-grafana)
     │   └── 대시보드 설계 (../08-observability/10-dashboard-design)
     │
     ├── 바로 다음 단계
     │   ├── 인시던트 관리 (./03-incident-management) ← 다음 챕터!
     │   │   → SLO 위반 시 어떻게 대응하나요?
     │   │   → 포스트모템은 어떻게 작성하나요?
     │   └── 알림 심화 (../08-observability/11-alerting)
     │       → Multi-Burn-Rate Alert의 Alertmanager 설정 상세
     │
     └── 심화 학습
         ├── Chaos Engineering → SLO가 현실적인지 검증
         ├── Capacity Planning → SLO를 지키려면 리소스가 얼마나 필요한지
         └── Platform Engineering → 전사 SLO 플랫폼 구축
```

### 추천 자료

```
공식 자료:
  - Google SRE Book, Chapter 4: "Service Level Objectives"
    https://sre.google/sre-book/service-level-objectives/
  - Google SRE Workbook, Chapter 2: "Implementing SLOs"
    https://sre.google/workbook/implementing-slos/
  - The Art of SLOs (Google Cloud 워크숍)
    https://cloud.google.com/architecture/adopting-slos

도구:
  - Sloth: https://github.com/slok/sloth
  - Pyrra: https://github.com/pyrra-dev/pyrra
  - OpenSLO: https://openslo.com/ (벤더 중립 SLO 표준)

커뮤니티:
  - SLOconf: https://www.sloconf.com/ (SLO 전문 컨퍼런스)
```

---

> **핵심 한 줄**: SLI/SLO는 "감"이 아닌 "숫자"로 신뢰성을 관리하는 도구이며, Error Budget은 혁신과 안정의 균형을 자동으로 맞춰주는 나침반이에요. 기술보다 팀의 합의와 문화가 더 중요하다는 걸 잊지 마세요.
