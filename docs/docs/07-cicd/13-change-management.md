# 변경 관리와 Feature Flag

> 소프트웨어를 안전하게 변경하는 기술, 그게 바로 변경 관리와 Feature Flag예요. 요리로 비유하면, 변경 관리는 레시피를 바꿀 때 "시식 → 동료 평가 → 메뉴 등록" 순서를 지키는 것이고, Feature Flag는 새 메뉴를 전체 공개 전에 단골손님에게만 먼저 내놓는 것이에요. [CD 파이프라인](./04-cd-pipeline)으로 자동 배포를 구축했다면, 이제 **무엇을 언제 누구에게 노출할지** 정밀하게 제어하는 방법을 알아봐요.

---

## 🎯 왜 변경 관리와 Feature Flag를 알아야 하나요?

### 일상 비유: 아파트 리모델링

아파트 전체를 리모델링한다고 생각해 보세요.

- **변경 관리**: 리모델링 계획서 작성 → 관리사무소 승인 → 이웃 공지 → 단계별 공사 → 완료 검사
- **Feature Flag**: 거실은 다 끝났지만 주방은 아직이라 커튼으로 가려두는 것. 준비되면 커튼만 걷으면 돼요
- **점진적 릴리스**: 1층부터 리모델링하고, 괜찮으면 2층, 3층으로 확대하는 것
- **Kill Switch**: 공사 중 가스 누출이 감지되면 즉시 가스 밸브를 잠그는 것

만약 이런 절차 없이 한꺼번에 공사하면 어떨까요?

- 이웃 민원 폭주 (사용자 불만)
- 구조적 결함 발견 시 전체 철거 필요 (전면 롤백)
- 비용과 시간이 걷잡을 수 없이 증가

**변경 관리와 Feature Flag는 소프트웨어의 안전한 진화를 보장하는 시스템이에요.**

```
실무에서 변경 관리와 Feature Flag가 필요한 순간:

• "배포했는데 장애가 나서 긴급 롤백해야 해요"           → Feature Flag로 즉시 끄기
• "새 기능을 10%만 먼저 보여주고 싶어요"                → 점진적 릴리스
• "A안과 B안 중 어떤 게 나은지 데이터로 결정하고 싶어요" → A/B 테스트
• "대형 변경인데 승인 없이 배포되면 큰일나요"            → 변경 승인 프로세스
• "피처 플래그가 100개 넘는데 관리가 안 돼요"            → Flag 라이프사이클 관리
• "변경 실패율이 30%가 넘어요"                           → Change Failure Rate 관리
• "장애가 최근 변경 때문인지 알 수 없어요"               → 변경-인시던트 연결
```

### 변경 관리 없는 팀 vs 있는 팀

```mermaid
flowchart TD
    subgraph "❌ 변경 관리 없는 팀"
        NA["개발 완료"] -->|"바로 배포"| NB["프로덕션 반영"]
        NB --> NC["장애 발생! 😱"]
        NC --> ND["원인 파악 어려움"]
        ND --> NE["전면 롤백 (30분+)"]
        NE --> NF["재배포도 불안"]
    end

    subgraph "✅ 변경 관리 있는 팀"
        YA["개발 완료"] --> YB["변경 요청 & 리뷰"]
        YB --> YC["Feature Flag 뒤에 배포"]
        YC --> YD["5% → 25% → 100%<br/>점진적 오픈"]
        YD --> YE["문제 감지?"]
        YE -->|"Yes"| YF["Flag OFF (3초)"]
        YE -->|"No"| YG["전체 오픈 ✅"]
    end

    style NC fill:#e74c3c,color:#fff
    style NE fill:#e74c3c,color:#fff
    style YF fill:#f39c12,color:#fff
    style YG fill:#27ae60,color:#fff
```

---

## 🧠 핵심 개념 잡기

### 1. 변경 관리 (Change Management)

> **비유**: 병원의 수술 프로세스

아무리 실력 좋은 의사라도 수술 전 환자 확인 → 마취 확인 → 수술 부위 표시 → 팀 브리핑을 거쳐요. 변경 관리는 시스템을 변경할 때 **"이 변경이 안전한가?"**를 체계적으로 확인하는 프로세스예요.

### 2. Feature Flag (기능 플래그)

> **비유**: 전등 스위치

새 기능을 코드에 넣어두되, 스위치를 올려야만 켜지게 해요. 코드 배포와 기능 릴리스를 분리하는 핵심 기법이에요.

### 3. 점진적 릴리스 (Progressive Delivery)

> **비유**: 신약 임상 시험

신약을 바로 전국민에게 투여하지 않잖아요? 1상(소수) → 2상(중간 규모) → 3상(대규모)으로 점차 확대해요. 소프트웨어도 마찬가지예요.

### 4. A/B 테스트 (실험)

> **비유**: 음식점의 신메뉴 시식

A 테이블에는 기존 메뉴, B 테이블에는 신메뉴를 제공하고, 어느 쪽의 만족도가 높은지 비교하는 거예요.

### 5. Kill Switch (킬 스위치)

> **비유**: 비상 정지 버튼

공장의 비상 정지 버튼처럼, 문제가 발생하면 즉시 기능을 끌 수 있는 안전장치예요. 롤백과 달리 배포 없이 즉시 작동해요.

---

## 🔍 하나씩 자세히 알아보기

### 1. ITIL 변경 관리 프로세스

ITIL(IT Infrastructure Library)은 IT 서비스 관리의 국제 표준이에요. 변경 관리는 그중 핵심 프로세스예요.

```mermaid
flowchart TD
    A["변경 요청 (RFC)<br/>Request for Change"] --> B["변경 분류<br/>Standard / Normal / Emergency"]

    B -->|"Standard"| C["사전 승인된 변경<br/>자동 처리"]
    B -->|"Normal"| D["CAB 리뷰<br/>Change Advisory Board"]
    B -->|"Emergency"| E["ECAB 긴급 리뷰<br/>Emergency CAB"]

    C --> F["변경 실행"]
    D --> G{"승인?"}
    G -->|"Yes"| F
    G -->|"No"| H["반려 & 피드백"]
    E --> F

    F --> I["변경 후 검증<br/>Post-Implementation Review"]
    I --> J{"성공?"}
    J -->|"Yes"| K["변경 완료 & 기록"]
    J -->|"No"| L["롤백 실행"]
    L --> M["원인 분석 & 재계획"]

    style C fill:#27ae60,color:#fff
    style D fill:#f39c12,color:#fff
    style E fill:#e74c3c,color:#fff
    style K fill:#27ae60,color:#fff
    style L fill:#e74c3c,color:#fff
```

#### 변경의 3가지 유형

| 유형 | 설명 | 승인 방식 | 예시 |
|------|------|-----------|------|
| **Standard Change** | 사전 승인된 저위험 변경 | 자동 승인 | 의존성 패치, 설정 변경 |
| **Normal Change** | 일반적인 변경 | CAB 리뷰 필요 | 새 기능 릴리스, DB 스키마 변경 |
| **Emergency Change** | 긴급 장애 대응 변경 | ECAB 긴급 승인 | 보안 취약점 패치, 장애 핫픽스 |

#### CAB (Change Advisory Board)란?

CAB는 변경의 영향도와 위험성을 평가하는 위원회예요. 전통적인 ITIL에서는 주간 회의 형태로 운영했지만, 현대 DevOps에서는 자동화된 형태로 진화했어요.

```yaml
# 변경 요청서 (RFC) 예시
change_request:
  id: "CHG-2024-1234"
  title: "결제 시스템 새 PG사 연동"
  requester: "payments-team"
  type: "normal"

  risk_assessment:
    impact: "high"          # 결제 시스템 → 매출 직결
    urgency: "medium"       # 다음 스프린트 내 필요
    risk_level: "medium"    # 기존 PG사 유지, 신규 추가

  rollback_plan: |
    1. Feature Flag 'new-pg-provider' OFF
    2. 기존 PG사로 자동 폴백
    3. 실패 트랜잭션 재처리 스크립트 실행

  test_evidence:
    - unit_tests: "342 passed, 0 failed"
    - integration_tests: "28 passed, 0 failed"
    - load_test: "500 TPS 처리 확인"
    - staging_verification: "3일간 무장애 운영"

  approval:
    - tech_lead: "pending"
    - security_team: "approved"
    - ops_team: "pending"
```

---

### 2. Feature Flag 종류

Feature Flag는 용도에 따라 4가지로 나뉘어요. 각각의 수명과 관리 방식이 달라요.

#### 4가지 Feature Flag 유형

| 유형 | 목적 | 수명 | 동적 변경 | 예시 |
|------|------|------|-----------|------|
| **Release Flag** | 미완성 기능 숨기기 | 짧음 (일~주) | 필요 | 새 결제 UI 숨기기 |
| **Experiment Flag** | A/B 테스트 | 중간 (주~월) | 거의 없음 | 버튼 색상 실험 |
| **Ops Flag** | 운영 제어 | 길음 (영구 가능) | 자주 | 캐시 전략 전환 |
| **Permission Flag** | 사용자 권한 제어 | 길음 (영구 가능) | 드물게 | 프리미엄 기능 잠금 |

```typescript
// Feature Flag 종류별 코드 예시

// 1. Release Flag - 새 기능 릴리스 제어
if (featureFlags.isEnabled('new-checkout-flow')) {
  return <NewCheckoutPage />;
} else {
  return <LegacyCheckoutPage />;
}

// 2. Experiment Flag - A/B 테스트
const variant = featureFlags.getVariant('pricing-page-experiment', userId);
switch (variant) {
  case 'control':    return <PricingPageA />;  // 기존
  case 'variant-a':  return <PricingPageB />;  // 새 디자인
  case 'variant-b':  return <PricingPageC />;  // 또 다른 디자인
}

// 3. Ops Flag - 운영 제어
const cacheStrategy = featureFlags.isEnabled('use-redis-cache')
  ? new RedisCacheStrategy()
  : new InMemoryCacheStrategy();

// 4. Permission Flag - 사용자 권한 기반
if (featureFlags.isEnabled('premium-analytics', { userId, plan: user.plan })) {
  return <AdvancedAnalytics />;
} else {
  return <BasicAnalytics />;
}
```

#### Feature Flag의 수명 주기

```mermaid
flowchart LR
    A["🏗️ Flag 생성<br/>코드에 분기 추가"] --> B["🧪 테스트<br/>내부 환경에서 검증"]
    B --> C["📊 점진적 오픈<br/>5% → 25% → 50% → 100%"]
    C --> D["✅ 전체 오픈<br/>100% 사용자에게 노출"]
    D --> E["🧹 Flag 제거<br/>분기 코드 정리"]
    E --> F["📦 코드 배포<br/>깔끔한 코드만 남김"]

    style A fill:#3498db,color:#fff
    style C fill:#f39c12,color:#fff
    style D fill:#27ae60,color:#fff
    style E fill:#e74c3c,color:#fff
```

> **핵심 포인트**: Release Flag와 Experiment Flag는 반드시 제거해야 해요. 제거하지 않으면 기술 부채가 쌓여요. Ops Flag와 Permission Flag는 장기간 유지될 수 있어요.

---

### 3. Feature Flag 플랫폼 비교

직접 구현할 수도 있지만, 전문 플랫폼을 쓰면 관리, 분석, 타겟팅이 훨씬 편해요.

#### 주요 플랫폼 비교

| 기능 | LaunchDarkly | Unleash | Flagsmith | OpenFeature |
|------|-------------|---------|-----------|-------------|
| **유형** | SaaS (상용) | 오픈소스/SaaS | 오픈소스/SaaS | 표준 (SDK) |
| **가격** | 유료 ($10/seat~) | 무료/유료 | 무료/유료 | 무료 |
| **셀프호스팅** | 불가 | 가능 | 가능 | N/A |
| **SDK 언어** | 25+ | 15+ | 15+ | 벤더 중립 |
| **실시간 업데이트** | 스트리밍 | 폴링/웹훅 | 폴링/웹훅 | 벤더에 의존 |
| **A/B 테스트** | 내장 | 기본 | 기본 | 벤더에 의존 |
| **감사 로그** | 상세 | 기본 | 기본 | 벤더에 의존 |
| **적합한 조직** | 대규모 엔터프라이즈 | 오픈소스 선호 | 스타트업~중견 | 벤더 락인 방지 |

#### OpenFeature: 벤더 중립 표준

OpenFeature는 CNCF 프로젝트로, Feature Flag의 표준 인터페이스를 정의해요. 플랫폼을 바꿔도 애플리케이션 코드를 수정할 필요가 없어요.

```typescript
// OpenFeature 사용 예시 - 벤더 중립적 코드
import { OpenFeature } from '@openfeature/js-sdk';
import { LaunchDarklyProvider } from '@openfeature/launchdarkly-provider';
// import { UnleashProvider } from '@openfeature/unleash-provider';  // 언제든 교체 가능

// 프로바이더 설정 (벤더 연결)
OpenFeature.setProvider(new LaunchDarklyProvider({ sdkKey: 'sdk-key-123' }));
const client = OpenFeature.getClient();

// 애플리케이션 코드 - 벤더에 의존하지 않음
async function renderCheckout(userId: string) {
  const context = { targetingKey: userId, country: 'KR' };

  // Boolean Flag
  const newCheckout = await client.getBooleanValue(
    'new-checkout-flow', false, context
  );

  // String Variant Flag
  const checkoutTheme = await client.getStringValue(
    'checkout-theme', 'default', context
  );

  // Number Flag
  const maxRetries = await client.getNumberValue(
    'payment-max-retries', 3, context
  );

  if (newCheckout) {
    return renderNewCheckout({ theme: checkoutTheme, maxRetries });
  }
  return renderLegacyCheckout();
}
```

#### Unleash 셀프호스팅 구성 (Docker Compose)

```yaml
# docker-compose.yml
version: '3.8'

services:
  unleash-db:
    image: postgres:15
    environment:
      POSTGRES_DB: unleash
      POSTGRES_USER: unleash
      POSTGRES_PASSWORD: ${UNLEASH_DB_PASSWORD}
    volumes:
      - unleash-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U unleash"]
      interval: 5s
      timeout: 3s
      retries: 10

  unleash-server:
    image: unleashorg/unleash-server:latest
    depends_on:
      unleash-db:
        condition: service_healthy
    environment:
      DATABASE_URL: postgres://unleash:${UNLEASH_DB_PASSWORD}@unleash-db:5432/unleash
      DATABASE_SSL: "false"
      INIT_ADMIN_API_TOKENS: "*:*.unleash-admin-token"
    ports:
      - "4242:4242"
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:4242/health"]
      interval: 10s
      timeout: 3s
      retries: 5

volumes:
  unleash-data:
```

```typescript
// Unleash 클라이언트 사용 예시
import { initialize } from 'unleash-client';

const unleash = initialize({
  url: 'http://unleash-server:4242/api',
  appName: 'my-app',
  customHeaders: {
    Authorization: 'Bearer client-api-token',
  },
  // 폴링 간격 (15초마다 Flag 상태 확인)
  refreshInterval: 15000,
});

unleash.on('ready', () => {
  // Feature Flag 확인
  if (unleash.isEnabled('new-payment-method', { userId: 'user-123' })) {
    // 새 결제 수단 사용
    processWithNewPayment();
  } else {
    processWithLegacyPayment();
  }

  // Variant 확인 (A/B 테스트)
  const variant = unleash.getVariant('checkout-experiment', {
    userId: 'user-123',
  });
  console.log(`User assigned to: ${variant.name}`);
});
```

---

### 4. 점진적 릴리스 패턴

[배포 전략](./10-deployment-strategy)에서 Blue-Green, Canary를 배웠다면, 여기서는 Feature Flag를 활용한 더 세밀한 릴리스 전략을 알아봐요.

#### 패턴 1: Percentage Rollout (비율 기반 릴리스)

전체 사용자 중 일정 비율에게만 새 기능을 노출하는 방식이에요.

```
Day 1:   ████░░░░░░░░░░░░░░░░  5%  - 내부 직원
Day 3:   ████████░░░░░░░░░░░░  10% - 얼리어답터
Day 5:   ████████████░░░░░░░░  25% - 확대
Day 7:   ████████████████░░░░  50% - 절반
Day 10:  ████████████████████  100% - 전체 오픈

메트릭 모니터링: 각 단계에서 에러율, 응답시간, 전환율 확인
문제 발생 시:    즉시 0%로 전환 (Kill Switch)
```

```typescript
// Percentage Rollout 구현 예시
interface RolloutConfig {
  flagKey: string;
  percentage: number;        // 0-100
  stickyProperty: string;    // 같은 사용자에게 일관된 경험 보장
}

function isUserInRollout(
  config: RolloutConfig,
  userId: string
): boolean {
  // 해시 기반으로 일관된 버킷 할당
  // 같은 userId는 항상 같은 결과를 받음
  const hash = murmurhash3(config.flagKey + userId);
  const bucket = hash % 100;
  return bucket < config.percentage;
}

// 사용 예시
const rolloutConfig: RolloutConfig = {
  flagKey: 'new-search-algorithm',
  percentage: 25,  // 25%의 사용자에게 노출
  stickyProperty: 'userId',
};

app.get('/search', (req, res) => {
  if (isUserInRollout(rolloutConfig, req.user.id)) {
    return newSearchAlgorithm(req.query.q);
  }
  return legacySearchAlgorithm(req.query.q);
});
```

#### 패턴 2: User Targeting (사용자 타겟팅)

특정 조건을 만족하는 사용자에게만 기능을 노출해요.

```typescript
// 사용자 타겟팅 규칙 예시
const targetingRules = {
  'beta-dashboard': {
    rules: [
      // 규칙 1: 내부 직원은 항상 활성화
      {
        attribute: 'email',
        operator: 'ends_with',
        value: '@mycompany.com',
        enabled: true,
      },
      // 규칙 2: 한국 사용자 중 프리미엄 플랜만
      {
        conditions: [
          { attribute: 'country', operator: 'equals', value: 'KR' },
          { attribute: 'plan', operator: 'in', value: ['premium', 'enterprise'] },
        ],
        enabled: true,
      },
      // 규칙 3: 특정 사용자 ID 화이트리스트
      {
        attribute: 'userId',
        operator: 'in',
        value: ['user-001', 'user-002', 'user-003'],
        enabled: true,
      },
    ],
    // 규칙에 해당하지 않는 사용자: 기본값
    defaultValue: false,
  },
};
```

#### 패턴 3: Ring Deployment (링 배포)

Microsoft가 Windows 업데이트에 사용하는 패턴이에요. 동심원처럼 안쪽부터 바깥으로 확대해요.

```mermaid
flowchart TD
    subgraph Ring0["Ring 0: Canary (내부 개발팀)"]
        R0["개발자 50명<br/>즉시 배포<br/>최소 24시간 검증"]
    end

    subgraph Ring1["Ring 1: Early Adopters (사내 전체)"]
        R1["전 직원 500명<br/>Ring 0 통과 후 배포<br/>최소 48시간 검증"]
    end

    subgraph Ring2["Ring 2: Beta Users (외부 베타)"]
        R2["베타 사용자 5,000명<br/>Ring 1 통과 후 배포<br/>최소 1주일 검증"]
    end

    subgraph Ring3["Ring 3: General Availability"]
        R3["전체 사용자 500,000명<br/>Ring 2 통과 후 배포<br/>단계적 확대"]
    end

    R0 -->|"✅ 메트릭 정상"| R1
    R1 -->|"✅ 메트릭 정상"| R2
    R2 -->|"✅ 메트릭 정상"| R3

    R0 -->|"❌ 문제 발생"| STOP0["배포 중단 & 수정"]
    R1 -->|"❌ 문제 발생"| STOP1["롤백 to Ring 0"]
    R2 -->|"❌ 문제 발생"| STOP2["롤백 to Ring 1"]

    style R0 fill:#3498db,color:#fff
    style R1 fill:#2980b9,color:#fff
    style R2 fill:#f39c12,color:#fff
    style R3 fill:#27ae60,color:#fff
    style STOP0 fill:#e74c3c,color:#fff
    style STOP1 fill:#e74c3c,color:#fff
    style STOP2 fill:#e74c3c,color:#fff
```

```yaml
# Ring Deployment 설정 예시 (LaunchDarkly 스타일)
feature_flag:
  key: "new-recommendation-engine"
  name: "새 추천 엔진"

  targeting:
    rings:
      - name: "ring-0-canary"
        segments: ["internal-devs"]
        percentage: 100
        min_bake_time: "24h"
        promotion_criteria:
          error_rate_max: 0.1%
          p99_latency_max: 200ms

      - name: "ring-1-early"
        segments: ["all-employees"]
        percentage: 100
        min_bake_time: "48h"
        promotion_criteria:
          error_rate_max: 0.5%
          p99_latency_max: 300ms

      - name: "ring-2-beta"
        segments: ["beta-users"]
        percentage: 100
        min_bake_time: "7d"
        promotion_criteria:
          error_rate_max: 0.5%
          conversion_rate_min: "+2%"

      - name: "ring-3-ga"
        segments: ["all-users"]
        percentage_ramp: [5, 10, 25, 50, 100]
        ramp_interval: "6h"
```

---

### 5. 실험과 A/B 테스트

A/B 테스트는 데이터 기반으로 의사결정하는 핵심 도구예요. "내 생각에 A가 나을 것 같아"가 아니라, "데이터로 증명하자"는 접근이에요.

#### A/B 테스트 프로세스

```
[1단계: 가설 설정]
"결제 버튼을 초록색으로 바꾸면 전환율이 5% 이상 증가할 것이다"

[2단계: 메트릭 정의]
- Primary: 결제 전환율 (conversion rate)
- Guardrail: 페이지 로드 시간, 에러율 (악화되면 안 되는 메트릭)

[3단계: 실험 설계]
- Control (A): 기존 파란색 버튼 (50%)
- Variant (B): 새 초록색 버튼 (50%)
- 최소 샘플 크기: 10,000명 (통계적 유의성을 위해)
- 실험 기간: 2주

[4단계: 실험 실행]
- Feature Flag로 트래픽 분할
- 메트릭 수집 시작

[5단계: 결과 분석]
- 통계적 유의성 확인 (p-value < 0.05)
- 실질적 유의성 확인 (효과 크기가 의미 있는가?)
- Guardrail 메트릭 확인 (다른 지표가 악화되지 않았는가?)

[6단계: 의사결정]
- 유의미한 개선 → Variant 채택
- 유의미한 차이 없음 → Control 유지 (변경 비용 절약)
- 유의미한 악화 → Control 유지, 원인 분석
```

#### 통계적 유의성이란?

```
쉬운 예시:

동전을 10번 던져서 앞면 7번 나왔어요.
→ "이 동전은 앞면이 더 잘 나온다"라고 할 수 있을까요?
→ 10번은 너무 적어서 확신할 수 없어요 (우연일 수 있음)

동전을 10,000번 던져서 앞면 5,500번 나왔어요.
→ 이제 "앞면이 더 잘 나온다"를 통계적으로 확신할 수 있어요

A/B 테스트도 마찬가지예요:
- 충분한 샘플이 있어야 "이 차이가 우연이 아니다"라고 말할 수 있어요
- 보통 p-value < 0.05 (95% 신뢰 수준)를 기준으로 해요
- 이는 "이 결과가 우연일 확률이 5% 미만이다"라는 뜻이에요
```

#### A/B 테스트 구현 예시

```typescript
// A/B 테스트 설정
interface Experiment {
  key: string;
  hypothesis: string;
  primaryMetric: string;
  guardrailMetrics: string[];
  variants: Variant[];
  minimumSampleSize: number;
  maxDurationDays: number;
}

interface Variant {
  name: string;
  weight: number;    // 트래픽 비율 (0-100)
  description: string;
}

const checkoutExperiment: Experiment = {
  key: 'checkout-button-color',
  hypothesis: '결제 버튼을 초록색으로 바꾸면 전환율이 5% 이상 증가한다',
  primaryMetric: 'checkout_conversion_rate',
  guardrailMetrics: [
    'page_load_time',
    'error_rate',
    'cart_abandonment_rate',
  ],
  variants: [
    { name: 'control', weight: 50, description: '기존 파란색 버튼' },
    { name: 'green-button', weight: 50, description: '초록색 버튼' },
  ],
  minimumSampleSize: 10000,
  maxDurationDays: 14,
};

// 실험 할당 미들웨어
function assignExperiment(
  experiment: Experiment,
  userId: string
): string {
  // 일관된 할당을 위한 해시 (같은 사용자는 항상 같은 그룹)
  const hash = murmurhash3(experiment.key + userId) % 100;

  let cumulative = 0;
  for (const variant of experiment.variants) {
    cumulative += variant.weight;
    if (hash < cumulative) {
      // 할당 이벤트 기록
      analytics.track('experiment_assigned', {
        experiment: experiment.key,
        variant: variant.name,
        userId,
      });
      return variant.name;
    }
  }
  return experiment.variants[0].name;  // fallback
}

// 메트릭 수집
function trackConversion(userId: string, experiment: Experiment) {
  analytics.track('experiment_conversion', {
    experiment: experiment.key,
    variant: getAssignedVariant(experiment.key, userId),
    userId,
    timestamp: Date.now(),
  });
}
```

#### A/B 테스트 결과 해석 가이드

```
결과 시나리오별 의사결정:

시나리오 1: 명확한 승자
┌─────────────────────────────────────────┐
│ Control:  전환율 3.2%                    │
│ Variant:  전환율 4.1% (+28%)            │
│ p-value:  0.001 (매우 유의미)            │
│ Guardrail: 이상 없음                     │
│ → 결정: Variant 채택 ✅                  │
└─────────────────────────────────────────┘

시나리오 2: 유의미하지 않음
┌─────────────────────────────────────────┐
│ Control:  전환율 3.2%                    │
│ Variant:  전환율 3.3% (+3%)             │
│ p-value:  0.42 (유의미하지 않음)          │
│ → 결정: Control 유지, 변경 불필요 ✅      │
└─────────────────────────────────────────┘

시나리오 3: 트레이드오프 존재
┌─────────────────────────────────────────┐
│ Control:  전환율 3.2%, 로드타임 200ms    │
│ Variant:  전환율 4.0%, 로드타임 450ms    │
│ p-value:  0.01 (유의미)                  │
│ Guardrail 위반: 로드타임 125% 증가!      │
│ → 결정: 성능 최적화 후 재실험 ⚠️          │
└─────────────────────────────────────────┘
```

---

### 6. Kill Switch 패턴

Kill Switch는 장애 발생 시 배포 없이 즉시 기능을 끌 수 있는 안전장치예요. 롤백(분 단위)보다 훨씬 빠르게(초 단위) 대응할 수 있어요.

#### Kill Switch vs 롤백 비교

| 특성 | Kill Switch | 롤백 (Rollback) |
|------|-------------|----------------|
| **속도** | 초 단위 (Flag OFF) | 분 단위 (재배포) |
| **영향 범위** | 특정 기능만 | 전체 배포 버전 |
| **배포 필요** | 불필요 | 필요 |
| **사전 준비** | Feature Flag 필수 | 이전 버전 존재 필요 |
| **정밀도** | 기능 단위 | 배포 단위 |
| **적합한 상황** | 특정 기능 문제 | 전체적인 문제 |

```typescript
// Kill Switch 구현 패턴
class KillSwitchManager {
  private flagClient: FeatureFlagClient;
  private alertManager: AlertManager;

  // 자동 Kill Switch - 메트릭 기반
  async evaluateAutoKill(flagKey: string): Promise<void> {
    const metrics = await this.getMetrics(flagKey);

    const killCriteria = {
      errorRateThreshold: 5.0,      // 에러율 5% 초과 시
      latencyP99Threshold: 2000,     // P99 응답시간 2초 초과 시
      errorCountThreshold: 100,      // 에러 100건 초과 시
    };

    if (
      metrics.errorRate > killCriteria.errorRateThreshold ||
      metrics.latencyP99 > killCriteria.latencyP99Threshold ||
      metrics.errorCount > killCriteria.errorCountThreshold
    ) {
      await this.activateKillSwitch(flagKey, metrics);
    }
  }

  // Kill Switch 활성화 (기능 끄기)
  private async activateKillSwitch(
    flagKey: string,
    metrics: Metrics
  ): Promise<void> {
    // 1. Feature Flag 즉시 OFF
    await this.flagClient.disable(flagKey);

    // 2. 알림 발송
    await this.alertManager.send({
      severity: 'critical',
      title: `Kill Switch 활성화: ${flagKey}`,
      message: `자동 킬 스위치가 작동했어요.
        - 에러율: ${metrics.errorRate}%
        - P99 응답시간: ${metrics.latencyP99}ms
        - 에러 수: ${metrics.errorCount}`,
      channel: ['slack', 'pagerduty'],
    });

    // 3. 감사 로그 기록
    await this.auditLog.record({
      action: 'kill_switch_activated',
      flagKey,
      reason: 'auto_metrics_threshold',
      metrics,
      timestamp: new Date(),
    });
  }
}
```

#### Kill Switch 적용 가이드

```
어떤 기능에 Kill Switch를 달아야 할까요?

필수 (반드시 적용):
├── 결제/금융 관련 기능
├── 인증/권한 관련 변경
├── 외부 API 연동 (PG사, 배송사 등)
├── 데이터베이스 스키마 변경과 연관된 기능
└── 대규모 사용자에게 영향을 주는 UI 변경

권장 (되도록 적용):
├── 새로운 알고리즘 (검색, 추천 등)
├── 캐시 전략 변경
├── 서드파티 라이브러리 업그레이드
└── 성능 최적화 변경

선택 (판단에 따라):
├── 텍스트/문구 변경
├── 사소한 UI 조정
└── 내부 도구 변경
```

---

### 7. Feature Flag 기술 부채 관리

Feature Flag는 강력하지만, 관리하지 않으면 심각한 기술 부채가 돼요. "Feature Flag 무덤"에 빠지지 않으려면 체계적인 라이프사이클 관리가 필요해요.

#### Flag 라이프사이클 관리

```
Feature Flag 기술 부채 경고 신호:

🔴 위험: "이 Flag가 뭐 하는 건지 아무도 몰라요"
🔴 위험: "Flag가 200개 넘는데 활성화된 게 30개뿐이에요"
🟡 주의: "이 Flag는 6개월째 100%인데 코드에서 안 지웠어요"
🟡 주의: "Flag 조합 때문에 테스트가 기하급수적으로 늘어요"
🟢 정상: "새 Flag 만들 때 만료일을 설정해요"
🟢 정상: "매 스프린트마다 오래된 Flag를 정리해요"
```

```typescript
// Flag 라이프사이클 관리 시스템
interface FeatureFlagMetadata {
  key: string;
  type: 'release' | 'experiment' | 'ops' | 'permission';
  owner: string;              // 담당 팀/사람
  createdAt: Date;
  expiresAt: Date | null;     // release/experiment Flag는 필수
  jiraTicket: string;         // 관련 티켓
  cleanupTicket?: string;     // 제거용 티켓
  status: 'active' | 'rolled-out' | 'deprecated' | 'removed';
  rolloutPercentage: number;
  description: string;
}

// Flag 정리 자동화
class FlagCleanupAutomation {

  // 매일 실행: 만료된 Flag 알림
  async dailyCleanupCheck(): Promise<void> {
    const allFlags = await this.flagService.getAllFlags();

    for (const flag of allFlags) {
      // 1. 만료일이 지난 Flag
      if (flag.expiresAt && flag.expiresAt < new Date()) {
        await this.notifyOwner(flag, '만료일이 지났어요. Flag를 정리해 주세요.');
      }

      // 2. 100%로 30일 이상 유지된 Release Flag
      if (
        flag.type === 'release' &&
        flag.rolloutPercentage === 100 &&
        this.daysSinceFullRollout(flag) > 30
      ) {
        await this.notifyOwner(flag, '30일 이상 100%예요. 코드에서 제거할 때가 됐어요.');
        await this.createCleanupTicket(flag);
      }

      // 3. 생성 후 90일 이상 된 Experiment Flag
      if (
        flag.type === 'experiment' &&
        this.daysSinceCreation(flag) > 90
      ) {
        await this.notifyOwner(flag, '실험이 90일을 넘겼어요. 결론을 내리고 정리해 주세요.');
      }

      // 4. 담당자가 퇴사한 Flag (주인 없는 Flag)
      if (!(await this.isActiveEmployee(flag.owner))) {
        await this.notifyTeamLead(flag, '담당자가 퇴사했어요. 새 담당자를 지정해 주세요.');
      }
    }
  }

  // Flag 제거 체크리스트 생성
  async createCleanupTicket(flag: FeatureFlagMetadata): Promise<string> {
    return await this.jira.createTicket({
      title: `[Flag Cleanup] ${flag.key} 제거`,
      description: `
## Feature Flag 정리

- **Flag Key**: ${flag.key}
- **생성일**: ${flag.createdAt.toISOString()}
- **담당자**: ${flag.owner}
- **현재 상태**: ${flag.rolloutPercentage}% rollout

## 정리 체크리스트
- [ ] Flag 조건 분기 코드 제거 (승리한 variant 코드만 남기기)
- [ ] 관련 테스트 코드 업데이트
- [ ] Flag 플랫폼에서 Flag 삭제 (또는 아카이브)
- [ ] 코드 리뷰 및 머지
- [ ] 배포 후 정상 동작 확인
      `,
      labels: ['flag-cleanup', 'tech-debt'],
      priority: 'medium',
    });
  }
}
```

#### Flag 정리 프로세스

```
Flag 정리 단계 (Release Flag 기준):

Step 1: Flag가 100%에 도달하고 안정화 확인 (최소 1주일)
Step 2: 정리 티켓 생성 (자동 또는 수동)
Step 3: 코드에서 Flag 분기 제거
        - Flag 조건문 제거
        - 승리한 코드 경로만 남기기
        - 패배한 코드 경로 삭제
Step 4: 테스트 업데이트
        - Flag 관련 테스트 케이스 정리
        - 남은 코드 경로의 테스트 보강
Step 5: Flag 플랫폼에서 Flag 삭제 또는 아카이브
Step 6: PR 리뷰 → 머지 → 배포
Step 7: 배포 후 모니터링

주기: 스프린트마다 "Flag 정리 시간"을 할당하세요 (보통 전체 시간의 10%)
```

---

### 8. Change Failure Rate 관리

Change Failure Rate(변경 실패율)는 DORA 메트릭의 핵심 지표 중 하나예요. **배포 중 장애를 유발한 변경의 비율**을 나타내요.

```
Change Failure Rate = (실패한 변경 수 / 전체 변경 수) × 100%

DORA 기준:
┌──────────────┬──────────────────┐
│ 등급         │ Change Failure   │
│              │ Rate             │
├──────────────┼──────────────────┤
│ Elite        │ 0-5%             │
│ High         │ 6-10%            │
│ Medium       │ 11-15%           │
│ Low          │ 16-30%+          │
└──────────────┴──────────────────┘
```

#### Change Failure Rate 낮추는 전략

```yaml
# 변경 실패율 관리 대시보드 설정 예시
change_failure_rate:
  # 데이터 수집
  data_sources:
    - deployments: "GitHub Actions / ArgoCD 배포 기록"
    - incidents: "PagerDuty / Opsgenie 인시던트 기록"
    - rollbacks: "배포 롤백 이벤트"

  # 변경 실패로 판정하는 기준
  failure_criteria:
    - incident_created_within: "1h"    # 배포 후 1시간 내 인시던트 발생
    - rollback_triggered: true          # 롤백이 실행된 경우
    - hotfix_deployed_within: "4h"      # 4시간 내 핫픽스 배포
    - error_rate_spike: ">200%"         # 에러율 200% 이상 급등

  # 알림 설정
  alerts:
    - condition: "weekly_cfr > 15%"
      action: "팀 리드에게 Slack 알림"
    - condition: "monthly_cfr > 10%"
      action: "엔지니어링 매니저에게 보고"
    - condition: "consecutive_failures >= 3"
      action: "배포 동결 검토 회의 소집"
```

```
Change Failure Rate를 줄이는 실천 방법:

1. 변경 크기 줄이기
   - 대형 PR 대신 작은 PR 여러 개로 분리
   - 배포 단위를 작게 유지
   - Feature Flag로 미완성 기능 숨기기

2. 테스트 강화
   - 단위/통합/E2E 테스트 커버리지 향상
   - 스테이징 환경에서 충분히 검증
   - 카오스 엔지니어링으로 회복 탄성 테스트

3. 점진적 릴리스
   - Canary 배포로 소수에게 먼저 노출
   - Ring Deployment로 단계적 확대
   - 자동 롤백 설정

4. 사후 분석 (Postmortem)
   - 모든 실패한 변경에 대해 원인 분석
   - 재발 방지책 수립 및 추적
   - 팀 전체에 학습 내용 공유
```

---

### 9. 인시던트와 변경 관리 연결

장애(인시던트)가 발생했을 때 "최근에 뭘 바꿨지?"를 즉시 추적할 수 있어야 해요.

```mermaid
flowchart TD
    INC["🚨 인시던트 발생!<br/>에러율 급등 감지"] --> TIMELINE["📋 최근 변경 타임라인 조회"]

    TIMELINE --> CHG1["변경 1: 결제 API 업데이트<br/>30분 전 배포"]
    TIMELINE --> CHG2["변경 2: 캐시 설정 변경<br/>2시간 전 적용"]
    TIMELINE --> CHG3["변경 3: DB 인덱스 추가<br/>4시간 전 적용"]

    CHG1 --> CORR{"상관관계 분석<br/>타임라인 일치?<br/>영향 범위 일치?"}

    CORR -->|"변경 1이 원인"| ROLLBACK["🔄 변경 1 롤백<br/>Feature Flag OFF"]
    CORR -->|"원인 불명"| DEEP["🔍 심층 분석<br/>로그, 트레이스 확인"]

    ROLLBACK --> VERIFY["✅ 인시던트 해소 확인"]
    VERIFY --> POSTMORTEM["📝 포스트모템 작성<br/>재발 방지책 수립"]
    DEEP --> VERIFY

    style INC fill:#e74c3c,color:#fff
    style ROLLBACK fill:#f39c12,color:#fff
    style VERIFY fill:#27ae60,color:#fff
    style POSTMORTEM fill:#3498db,color:#fff
```

```typescript
// 변경-인시던트 추적 시스템 예시
interface ChangeRecord {
  id: string;
  type: 'deployment' | 'config-change' | 'feature-flag' | 'infra-change';
  description: string;
  author: string;
  timestamp: Date;
  affectedServices: string[];
  rollbackProcedure: string;
  featureFlags: string[];      // 관련 Feature Flag
}

class ChangeTracker {
  // 인시던트 발생 시 최근 변경 조회
  async getRecentChanges(
    incidentTime: Date,
    lookbackHours: number = 6
  ): Promise<ChangeRecord[]> {
    const cutoff = new Date(
      incidentTime.getTime() - lookbackHours * 60 * 60 * 1000
    );

    return await this.db.changes
      .find({ timestamp: { $gte: cutoff, $lte: incidentTime } })
      .sort({ timestamp: -1 })
      .toArray();
  }

  // 변경과 인시던트 간 상관관계 점수 계산
  calculateCorrelationScore(
    change: ChangeRecord,
    incident: Incident
  ): number {
    let score = 0;

    // 시간 근접성 (배포 직후일수록 높은 점수)
    const minutesSinceChange =
      (incident.startTime.getTime() - change.timestamp.getTime()) / 60000;
    if (minutesSinceChange < 30) score += 40;
    else if (minutesSinceChange < 120) score += 20;
    else score += 5;

    // 영향 서비스 겹침
    const serviceOverlap = change.affectedServices.filter(
      s => incident.affectedServices.includes(s)
    );
    score += serviceOverlap.length * 20;

    // 변경 크기/위험도
    if (change.type === 'deployment') score += 15;
    if (change.type === 'infra-change') score += 10;

    return Math.min(score, 100);
  }
}
```

---

### 10. 변경 승인 자동화

전통적인 CAB 회의는 느리고 병목이 돼요. DevOps에서는 자동화된 승인 프로세스로 속도와 안전성을 동시에 달성해요.

#### 수동 승인 vs 자동화된 승인

```
전통적 CAB (주 1회 회의):
Monday:  변경 요청 제출
Tuesday: CAB 위원 리뷰 시작
Thursday: CAB 회의 (1시간)
Friday:  승인 결과 통보
Saturday: 배포 창 (주말 새벽)
→ 리드타임: 5일

자동화된 승인 (Policy as Code):
14:00  PR 머지 → 자동 위험도 평가
14:01  Low Risk → 자동 승인 → 배포 시작
14:05  Canary 배포 완료
14:20  메트릭 검증 완료 → 전체 배포
→ 리드타임: 20분
```

```yaml
# 변경 승인 자동화 정책 (Policy as Code)
change_approval_policy:
  # 자동 승인 조건 (Standard Change)
  auto_approve:
    conditions:
      - test_coverage: ">= 80%"
      - all_tests_passed: true
      - security_scan: "no_critical"
      - change_size: "< 200 lines"
      - affected_services: "<= 2"
      - deployment_window: "business_hours"  # 새벽 배포 아닌 경우
      - no_database_migration: true
      - feature_flag_protected: true          # Flag 뒤에 있는 변경
    result: "auto_approved"

  # 단일 승인 필요 (Normal Change - Low Risk)
  single_approval:
    conditions:
      - all_tests_passed: true
      - security_scan: "no_critical"
      - change_size: "< 500 lines"
      - affected_services: "<= 3"
    result: "requires_tech_lead_approval"
    sla: "4 hours"

  # CAB 리뷰 필요 (Normal Change - High Risk)
  cab_review:
    conditions:
      - database_migration: true
      - affected_services: "> 3"
      - change_size: "> 500 lines"
      - affects_auth_or_payment: true
    result: "requires_cab_review"
    sla: "24 hours"
    reviewers:
      - tech_lead
      - security_engineer
      - ops_engineer

  # 긴급 변경 (Emergency Change)
  emergency:
    conditions:
      - incident_severity: "P1 or P2"
      - active_incident: true
    result: "emergency_approved"
    post_action: "retrospective_required_within_48h"
```

```typescript
// GitHub Actions - 자동 변경 승인 워크플로우
// .github/workflows/change-approval.yml 에 해당하는 로직

interface ChangeRiskAssessment {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  score: number;           // 0-100
  factors: RiskFactor[];
  approvalRequired: 'auto' | 'single' | 'cab' | 'emergency';
}

class AutomatedChangeApproval {

  async assessRisk(pullRequest: PullRequest): Promise<ChangeRiskAssessment> {
    const factors: RiskFactor[] = [];
    let score = 0;

    // 1. 변경 크기
    const linesChanged = pullRequest.additions + pullRequest.deletions;
    if (linesChanged > 500) {
      score += 20;
      factors.push({ name: 'large_change', detail: `${linesChanged} lines` });
    }

    // 2. 영향 받는 서비스 수
    const services = await this.detectAffectedServices(pullRequest);
    if (services.length > 3) {
      score += 25;
      factors.push({ name: 'multi_service', detail: services.join(', ') });
    }

    // 3. DB 마이그레이션 포함 여부
    if (await this.hasDatabaseMigration(pullRequest)) {
      score += 30;
      factors.push({ name: 'db_migration', detail: 'Schema change detected' });
    }

    // 4. 인증/결제 관련 코드 변경
    if (await this.touchesCriticalPaths(pullRequest)) {
      score += 25;
      factors.push({ name: 'critical_path', detail: 'Auth or payment code' });
    }

    // 5. Feature Flag 보호 여부 (있으면 위험도 감소)
    if (await this.isFeatureFlagProtected(pullRequest)) {
      score -= 15;
      factors.push({ name: 'flag_protected', detail: 'Behind feature flag' });
    }

    // 6. 테스트 커버리지
    const coverage = await this.getTestCoverage(pullRequest);
    if (coverage < 80) {
      score += 15;
      factors.push({ name: 'low_coverage', detail: `${coverage}%` });
    }

    const riskLevel =
      score >= 70 ? 'critical' :
      score >= 40 ? 'high' :
      score >= 20 ? 'medium' : 'low';

    const approvalRequired =
      riskLevel === 'critical' ? 'cab' :
      riskLevel === 'high' ? 'single' : 'auto';

    return { riskLevel, score: Math.max(0, score), factors, approvalRequired };
  }
}
```

---

## 💻 직접 해보기

### 실습 1: 간단한 Feature Flag 시스템 구축

직접 간단한 Feature Flag 시스템을 만들어 볼게요. 외부 의존성 없이 Node.js만으로 구현해요.

```typescript
// feature-flags.ts - 심플 Feature Flag 시스템

interface FlagConfig {
  key: string;
  enabled: boolean;
  rolloutPercentage: number;   // 0-100
  allowlist: string[];         // 항상 활성화할 사용자
  blocklist: string[];         // 항상 비활성화할 사용자
  metadata: {
    owner: string;
    createdAt: string;
    expiresAt: string | null;
    type: 'release' | 'experiment' | 'ops' | 'permission';
    description: string;
  };
}

interface FlagStore {
  flags: Record<string, FlagConfig>;
  version: number;
  lastUpdated: string;
}

// 간단한 해시 함수 (일관된 사용자 할당용)
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;  // 32bit 정수 변환
  }
  return Math.abs(hash);
}

class FeatureFlagService {
  private store: FlagStore;
  private configPath: string;

  constructor(configPath: string) {
    this.configPath = configPath;
    this.store = this.loadConfig();
  }

  // Flag 설정 파일 로드
  private loadConfig(): FlagStore {
    const fs = require('fs');
    const data = fs.readFileSync(this.configPath, 'utf-8');
    return JSON.parse(data);
  }

  // 설정 파일 갱신 (핫 리로드)
  reload(): void {
    this.store = this.loadConfig();
    console.log(`Flags reloaded. Version: ${this.store.version}`);
  }

  // Feature Flag 평가
  isEnabled(flagKey: string, userId?: string): boolean {
    const flag = this.store.flags[flagKey];

    // Flag가 없으면 기본값 false
    if (!flag) return false;

    // 전역 비활성화 (Kill Switch)
    if (!flag.enabled) return false;

    // 사용자 ID가 없으면 전역 상태만 반환
    if (!userId) return flag.enabled;

    // blocklist 확인 (항상 비활성화)
    if (flag.blocklist.includes(userId)) return false;

    // allowlist 확인 (항상 활성화)
    if (flag.allowlist.includes(userId)) return true;

    // 비율 기반 릴리스
    if (flag.rolloutPercentage < 100) {
      const hash = simpleHash(flagKey + userId);
      const bucket = hash % 100;
      return bucket < flag.rolloutPercentage;
    }

    return true;
  }

  // Flag 상태 변경 (Kill Switch용)
  async setEnabled(flagKey: string, enabled: boolean): Promise<void> {
    if (this.store.flags[flagKey]) {
      this.store.flags[flagKey].enabled = enabled;
      this.store.version++;
      this.store.lastUpdated = new Date().toISOString();
      this.saveConfig();

      console.log(
        `Flag '${flagKey}' ${enabled ? 'ENABLED' : 'DISABLED (Kill Switch)'}`
      );
    }
  }

  // Rollout 비율 변경
  async setRolloutPercentage(
    flagKey: string,
    percentage: number
  ): Promise<void> {
    if (this.store.flags[flagKey]) {
      this.store.flags[flagKey].rolloutPercentage =
        Math.max(0, Math.min(100, percentage));
      this.store.version++;
      this.store.lastUpdated = new Date().toISOString();
      this.saveConfig();

      console.log(
        `Flag '${flagKey}' rollout: ${percentage}%`
      );
    }
  }

  // 만료된 Flag 감지
  getExpiredFlags(): FlagConfig[] {
    const now = new Date();
    return Object.values(this.store.flags).filter(flag => {
      if (!flag.metadata.expiresAt) return false;
      return new Date(flag.metadata.expiresAt) < now;
    });
  }

  // Flag 현황 리포트
  getReport(): string {
    const flags = Object.values(this.store.flags);
    const expired = this.getExpiredFlags();

    return `
Feature Flag 현황 리포트
========================
총 Flag 수: ${flags.length}
활성화: ${flags.filter(f => f.enabled).length}
비활성화: ${flags.filter(f => !f.enabled).length}
만료됨 (정리 필요): ${expired.length}

유형별:
- Release: ${flags.filter(f => f.metadata.type === 'release').length}
- Experiment: ${flags.filter(f => f.metadata.type === 'experiment').length}
- Ops: ${flags.filter(f => f.metadata.type === 'ops').length}
- Permission: ${flags.filter(f => f.metadata.type === 'permission').length}

만료된 Flag (즉시 정리 필요):
${expired.map(f => `  - ${f.key} (만료: ${f.metadata.expiresAt}, 담당: ${f.metadata.owner})`).join('\n')}
    `.trim();
  }

  private saveConfig(): void {
    const fs = require('fs');
    fs.writeFileSync(
      this.configPath,
      JSON.stringify(this.store, null, 2)
    );
  }
}
```

```json
// flags.json - Feature Flag 설정 파일
{
  "flags": {
    "new-checkout-flow": {
      "key": "new-checkout-flow",
      "enabled": true,
      "rolloutPercentage": 25,
      "allowlist": ["admin-001", "tester-001"],
      "blocklist": [],
      "metadata": {
        "owner": "payments-team",
        "createdAt": "2024-03-01",
        "expiresAt": "2024-04-15",
        "type": "release",
        "description": "새 결제 플로우 UI"
      }
    },
    "search-algorithm-v2": {
      "key": "search-algorithm-v2",
      "enabled": true,
      "rolloutPercentage": 10,
      "allowlist": [],
      "blocklist": ["user-legacy-001"],
      "metadata": {
        "owner": "search-team",
        "createdAt": "2024-02-15",
        "expiresAt": "2024-05-01",
        "type": "release",
        "description": "새 검색 알고리즘 (벡터 검색 기반)"
      }
    },
    "redis-cache-strategy": {
      "key": "redis-cache-strategy",
      "enabled": true,
      "rolloutPercentage": 100,
      "allowlist": [],
      "blocklist": [],
      "metadata": {
        "owner": "platform-team",
        "createdAt": "2024-01-10",
        "expiresAt": null,
        "type": "ops",
        "description": "Redis 캐시 전략 전환 스위치"
      }
    }
  },
  "version": 42,
  "lastUpdated": "2024-03-10T15:30:00Z"
}
```

### 실습 2: 변경 승인 GitHub Actions 워크플로우

```yaml
# .github/workflows/change-approval.yml
name: Automated Change Approval

on:
  pull_request:
    types: [opened, synchronize, ready_for_review]

jobs:
  risk-assessment:
    runs-on: ubuntu-latest
    outputs:
      risk-level: ${{ steps.assess.outputs.risk-level }}
      approval-type: ${{ steps.assess.outputs.approval-type }}

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # 전체 히스토리 (diff 분석용)

      - name: Assess Change Risk
        id: assess
        run: |
          # 변경된 파일 수
          FILES_CHANGED=$(git diff --name-only origin/main...HEAD | wc -l)

          # 변경 라인 수
          LINES_ADDED=$(git diff --numstat origin/main...HEAD | awk '{sum+=$1} END {print sum}')
          LINES_DELETED=$(git diff --numstat origin/main...HEAD | awk '{sum+=$2} END {print sum}')
          TOTAL_LINES=$((LINES_ADDED + LINES_DELETED))

          # DB 마이그레이션 확인
          HAS_MIGRATION=$(git diff --name-only origin/main...HEAD | grep -c "migration" || true)

          # 인증/결제 코드 변경 확인
          HAS_CRITICAL=$(git diff --name-only origin/main...HEAD | grep -cE "(auth|payment|billing)" || true)

          # Feature Flag 보호 확인
          HAS_FLAG=$(git diff origin/main...HEAD | grep -c "featureFlag\|isEnabled\|feature_flag" || true)

          # 위험도 점수 계산
          RISK_SCORE=0

          if [ "$TOTAL_LINES" -gt 500 ]; then
            RISK_SCORE=$((RISK_SCORE + 20))
          fi

          if [ "$FILES_CHANGED" -gt 20 ]; then
            RISK_SCORE=$((RISK_SCORE + 15))
          fi

          if [ "$HAS_MIGRATION" -gt 0 ]; then
            RISK_SCORE=$((RISK_SCORE + 30))
          fi

          if [ "$HAS_CRITICAL" -gt 0 ]; then
            RISK_SCORE=$((RISK_SCORE + 25))
          fi

          if [ "$HAS_FLAG" -gt 0 ]; then
            RISK_SCORE=$((RISK_SCORE - 15))
          fi

          # 위험도 레벨 판정
          if [ "$RISK_SCORE" -ge 50 ]; then
            RISK_LEVEL="high"
            APPROVAL_TYPE="cab"
          elif [ "$RISK_SCORE" -ge 20 ]; then
            RISK_LEVEL="medium"
            APPROVAL_TYPE="single"
          else
            RISK_LEVEL="low"
            APPROVAL_TYPE="auto"
          fi

          echo "risk-level=$RISK_LEVEL" >> "$GITHUB_OUTPUT"
          echo "approval-type=$APPROVAL_TYPE" >> "$GITHUB_OUTPUT"

          echo "## Change Risk Assessment" >> "$GITHUB_STEP_SUMMARY"
          echo "| Metric | Value |" >> "$GITHUB_STEP_SUMMARY"
          echo "|--------|-------|" >> "$GITHUB_STEP_SUMMARY"
          echo "| Files Changed | $FILES_CHANGED |" >> "$GITHUB_STEP_SUMMARY"
          echo "| Lines Changed | $TOTAL_LINES |" >> "$GITHUB_STEP_SUMMARY"
          echo "| DB Migration | $HAS_MIGRATION |" >> "$GITHUB_STEP_SUMMARY"
          echo "| Critical Path | $HAS_CRITICAL |" >> "$GITHUB_STEP_SUMMARY"
          echo "| Feature Flag Protected | $HAS_FLAG |" >> "$GITHUB_STEP_SUMMARY"
          echo "| **Risk Score** | **$RISK_SCORE** |" >> "$GITHUB_STEP_SUMMARY"
          echo "| **Risk Level** | **$RISK_LEVEL** |" >> "$GITHUB_STEP_SUMMARY"
          echo "| **Approval Type** | **$APPROVAL_TYPE** |" >> "$GITHUB_STEP_SUMMARY"

  auto-approve:
    needs: risk-assessment
    if: needs.risk-assessment.outputs.approval-type == 'auto'
    runs-on: ubuntu-latest
    steps:
      - name: Auto Approve
        uses: hmarr/auto-approve-action@v3
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}

      - name: Comment
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: '✅ **자동 승인됨** - 위험도 평가 결과: Low Risk\n\n이 변경은 자동 승인 정책을 충족합니다.'
            })

  request-review:
    needs: risk-assessment
    if: needs.risk-assessment.outputs.approval-type != 'auto'
    runs-on: ubuntu-latest
    steps:
      - name: Request Review
        uses: actions/github-script@v7
        with:
          script: |
            const approvalType = '${{ needs.risk-assessment.outputs.approval-type }}';
            const riskLevel = '${{ needs.risk-assessment.outputs.risk-level }}';

            const reviewers = approvalType === 'cab'
              ? ['tech-lead', 'security-engineer', 'ops-engineer']
              : ['tech-lead'];

            // 리뷰어 요청
            await github.rest.pulls.requestReviewers({
              owner: context.repo.owner,
              repo: context.repo.repo,
              pull_number: context.issue.number,
              reviewers: reviewers,
            });

            // 코멘트 작성
            const emoji = riskLevel === 'high' ? '🔴' : '🟡';
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: `${emoji} **수동 승인 필요** - 위험도: ${riskLevel}\n\n승인 유형: ${approvalType}\n필요 리뷰어: ${reviewers.join(', ')}`
            });
```

### 실습 3: 점진적 릴리스 스크립트

```bash
#!/bin/bash
# progressive-rollout.sh - 점진적 릴리스 자동화 스크립트

set -euo pipefail

FLAG_KEY="${1:?Usage: $0 <flag-key>}"
UNLEASH_URL="${UNLEASH_URL:?UNLEASH_URL 환경변수를 설정해주세요}"
UNLEASH_TOKEN="${UNLEASH_TOKEN:?UNLEASH_TOKEN 환경변수를 설정해주세요}"
PROMETHEUS_URL="${PROMETHEUS_URL:-http://prometheus:9090}"

# 릴리스 단계 정의
STAGES=(5 10 25 50 100)
BAKE_TIME_MINUTES=(30 60 120 240 0)  # 각 단계별 대기 시간

# 메트릭 확인 함수
check_metrics() {
  local flag_key=$1

  # 에러율 확인
  ERROR_RATE=$(curl -s "${PROMETHEUS_URL}/api/v1/query" \
    --data-urlencode "query=rate(http_requests_total{status=~\"5..\",feature_flag=\"${flag_key}\"}[5m]) / rate(http_requests_total{feature_flag=\"${flag_key}\"}[5m]) * 100" \
    | jq -r '.data.result[0].value[1] // "0"')

  # P99 응답시간 확인
  P99_LATENCY=$(curl -s "${PROMETHEUS_URL}/api/v1/query" \
    --data-urlencode "query=histogram_quantile(0.99, rate(http_request_duration_seconds_bucket{feature_flag=\"${flag_key}\"}[5m]))" \
    | jq -r '.data.result[0].value[1] // "0"')

  echo "에러율: ${ERROR_RATE}%, P99: ${P99_LATENCY}s"

  # 임계값 확인
  if (( $(echo "$ERROR_RATE > 5.0" | bc -l) )); then
    echo "에러율이 임계값(5%)을 초과했어요!"
    return 1
  fi

  if (( $(echo "$P99_LATENCY > 2.0" | bc -l) )); then
    echo "P99 응답시간이 임계값(2s)을 초과했어요!"
    return 1
  fi

  return 0
}

# Unleash API로 rollout 비율 변경
set_rollout() {
  local flag_key=$1
  local percentage=$2

  curl -s -X PATCH "${UNLEASH_URL}/api/admin/projects/default/features/${flag_key}/environments/production/strategies" \
    -H "Authorization: Bearer ${UNLEASH_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"parameters\": {\"rollout\": \"${percentage}\"}}"

  echo "✅ ${flag_key} rollout → ${percentage}%"
}

# Kill Switch 함수
kill_switch() {
  local flag_key=$1

  echo "🚨 Kill Switch 활성화! ${flag_key} → 0%"
  set_rollout "$flag_key" 0

  # Slack 알림
  curl -s -X POST "${SLACK_WEBHOOK_URL:-}" \
    -H "Content-Type: application/json" \
    -d "{\"text\": \"🚨 Kill Switch 활성화: ${flag_key} - 메트릭 이상 감지\"}" \
    2>/dev/null || true

  exit 1
}

# 점진적 릴리스 실행
echo "🚀 점진적 릴리스 시작: ${FLAG_KEY}"
echo "단계: ${STAGES[*]}"

for i in "${!STAGES[@]}"; do
  PERCENTAGE=${STAGES[$i]}
  BAKE_TIME=${BAKE_TIME_MINUTES[$i]}

  echo ""
  echo "=============================="
  echo "📊 Stage $((i+1)): ${PERCENTAGE}% rollout"
  echo "=============================="

  # Rollout 비율 변경
  set_rollout "$FLAG_KEY" "$PERCENTAGE"

  if [ "$BAKE_TIME" -gt 0 ]; then
    echo "⏳ Bake time: ${BAKE_TIME}분 대기..."

    # 대기하면서 주기적으로 메트릭 확인
    ELAPSED=0
    CHECK_INTERVAL=5  # 5분마다 확인

    while [ "$ELAPSED" -lt "$BAKE_TIME" ]; do
      sleep $((CHECK_INTERVAL * 60))
      ELAPSED=$((ELAPSED + CHECK_INTERVAL))

      echo "  ⏰ ${ELAPSED}/${BAKE_TIME}분 경과 - 메트릭 확인 중..."

      if ! check_metrics "$FLAG_KEY"; then
        kill_switch "$FLAG_KEY"
      fi

      echo "  ✅ 메트릭 정상"
    done
  fi

  echo "✅ Stage $((i+1)) 완료: ${PERCENTAGE}%"
done

echo ""
echo "🎉 점진적 릴리스 완료! ${FLAG_KEY} → 100%"
echo "다음 할 일: Flag 정리 티켓을 생성하세요."
```

---

## 🏢 실무에서는?

### 회사 규모별 변경 관리 전략

```
스타트업 (1-20명):
├── 변경 관리: PR 리뷰 + 자동 테스트 통과 = 배포 가능
├── Feature Flag: 직접 구현 (간단한 JSON 설정) 또는 Unleash
├── 릴리스: trunk-based + Feature Flag
├── A/B 테스트: 필요할 때만 (Google Optimize 등)
└── 장점: 빠른 의사결정, 최소한의 프로세스

중견기업 (20-200명):
├── 변경 관리: 자동 위험도 평가 + 조건부 승인
├── Feature Flag: Unleash / Flagsmith (셀프호스팅)
├── 릴리스: Ring Deployment (내부 → 베타 → GA)
├── A/B 테스트: 제품 팀 주도, 전용 플랫폼 사용
└── 장점: 속도와 안전성 균형

대기업 (200명+):
├── 변경 관리: ITIL 기반 + 자동화 (Policy as Code)
├── Feature Flag: LaunchDarkly (SaaS) + OpenFeature
├── 릴리스: 다단계 Ring + Canary + 자동 롤백
├── A/B 테스트: 전문 실험 플랫폼 + 데이터 사이언스 팀
└── 장점: 체계적 거버넌스, 규제 준수
```

### 실무 사례: 대형 이커머스의 결제 시스템 변경

```
상황: 결제 시스템에 새 PG사를 추가해야 해요.

Step 1: 변경 요청 (RFC)
- 영향도: HIGH (매출 직결)
- 롤백 계획: Feature Flag로 기존 PG사 폴백
- 테스트 증거: 단위/통합/부하 테스트 결과 첨부

Step 2: CAB 승인 (자동 + 수동)
- 자동: 테스트 통과, 보안 스캔 클린 ✅
- 수동: 결제 팀 리드, 보안 엔지니어, 운영팀 승인 필요

Step 3: Feature Flag 뒤에 배포
- 코드는 프로덕션에 배포하되, Flag는 OFF 상태

Step 4: 점진적 릴리스
- Day 1: 내부 직원만 (100명) → 실제 결제 테스트
- Day 3: 얼리어답터 1% (약 1,000명)
- Day 5: 5% → 10%
- Day 7: 25% → 50%
- Day 10: 100%

Step 5: 모니터링 메트릭
- 결제 성공률: 99.5% 이상 유지
- 결제 응답시간: P99 < 3초
- 에러율: < 0.5%

Step 6: 전체 오픈 후 30일
- Flag 정리 티켓 자동 생성
- 기존 PG사 폴백 코드는 Ops Flag로 유지 (비상용)
```

### Feature Flag와 [GitOps](./11-gitops)의 조합

```yaml
# GitOps 기반 Feature Flag 관리 예시
# flags/production/payment-flags.yaml (Git으로 관리)

apiVersion: flags.openfeature.dev/v1alpha1
kind: FeatureFlagConfiguration
metadata:
  name: payment-flags
  namespace: payment-service
spec:
  flags:
    new-pg-provider:
      state: ENABLED
      variants:
        "on": true
        "off": false
      defaultVariant: "off"
      targeting:
        # 25% rollout + 내부 직원 전체
        rules:
          - action:
              variant: "on"
            conditions:
              - context: email
                op: ends_with
                value: "@mycompany.com"
          - action:
              variant: "on"
            conditions:
              - context: percentage
                op: less_than
                value: 25
```

> **실무 팁**: Feature Flag 설정을 Git으로 관리하면 변경 이력이 남고, PR 리뷰를 통해 실수를 방지할 수 있어요. [GitOps](./11-gitops)의 원칙인 "Git = Single Source of Truth"를 Flag 관리에도 적용하는 거예요.

---

## ⚠️ 자주 하는 실수

### 실수 1: Feature Flag를 정리하지 않기

```
❌ 잘못된 예:
"나중에 지워야지" → 6개월 후 → "이 Flag 뭐였더라?"
→ Flag 200개 중 실제 사용 30개, 나머지는 기술 부채

✅ 올바른 예:
- Flag 생성 시 만료일 필수 설정
- 매 스프린트 "Flag 정리 시간" 할당 (전체의 10%)
- 100% 도달 후 30일 내 코드 정리 자동 티켓 생성
- 만료된 Flag 담당자에게 자동 알림
```

### 실수 2: 모든 것에 Feature Flag 넣기

```
❌ 잘못된 예:
// 버튼 텍스트 변경까지 Flag를...
if (featureFlags.isEnabled('button-text-change')) {
  return "구매하기";
} else {
  return "구매";
}

✅ 올바른 예:
// Flag는 위험도가 있는 변경에만 사용
// - 새로운 결제 로직
// - 외부 API 연동
// - 대규모 UI 변경
// - 새로운 알고리즘
// 단순 텍스트, 스타일 변경은 그냥 배포하세요
```

### 실수 3: Flag 조합을 테스트하지 않기

```
❌ 잘못된 예:
Flag A (ON) + Flag B (ON)은 테스트했는데
Flag A (ON) + Flag B (OFF)는 테스트 안 함
→ 프로덕션에서 예상치 못한 조합으로 장애 발생

✅ 올바른 예:
# Flag 간 의존성 명시
flag_dependencies:
  new-checkout-flow:
    requires: ['payment-service-v2']  # 이 Flag가 ON이어야 함
    conflicts: ['legacy-checkout']     # 이 Flag가 OFF여야 함

# 의존성 검증 자동화
function validateFlagCombination(flags: Record<string, boolean>): boolean {
  if (flags['new-checkout-flow'] && !flags['payment-service-v2']) {
    throw new Error('new-checkout-flow는 payment-service-v2가 필요해요');
  }
  return true;
}
```

### 실수 4: A/B 테스트에서 충분한 샘플 없이 결론 내리기

```
❌ 잘못된 예:
"100명한테 테스트했는데 B가 5% 좋으니까 B로 가요"
→ 통계적으로 유의미하지 않음 (p-value > 0.05)
→ 우연일 수 있는 결과로 의사결정

✅ 올바른 예:
1. 실험 전 필요한 최소 샘플 크기 계산
   - 기대 효과 크기, 현재 전환율, 통계적 검정력 기반
2. 최소 샘플에 도달할 때까지 기다리기
3. p-value < 0.05 확인 후 결론
4. 효과 크기가 실질적으로 의미 있는지도 확인
   (통계적으로 유의미하지만 0.1% 차이면 의미 없을 수 있음)
```

### 실수 5: 변경 승인을 속도의 적으로 보기

```
❌ 잘못된 예:
"CAB 회의가 병목이니까 승인 없이 배포하자"
→ 장애 빈도 증가 → 더 많은 회의 → 더 느려짐 (악순환)

✅ 올바른 예:
"CAB 회의가 병목이니까 자동화하자"
→ Policy as Code로 자동 승인 기준 설정
→ 저위험 변경은 자동 승인 → 고위험 변경만 리뷰
→ 속도와 안전성 동시 확보

기억하세요: 좋은 변경 관리는 속도를 늦추는 게 아니라,
안전하게 빠르게 가는 방법이에요.
```

### 실수 6: Kill Switch 없이 큰 변경 배포하기

```
❌ 잘못된 예:
새 추천 알고리즘을 Feature Flag 없이 전체 배포
→ 성능 문제 발생 → 롤백에 15분 소요 → 사용자 영향

✅ 올바른 예:
새 추천 알고리즘을 Feature Flag 뒤에 배포
→ 성능 문제 감지 → Flag OFF (3초) → 즉시 이전 알고리즘으로 전환
→ 원인 파악 → 수정 → 다시 점진적 릴리스
```

---

## 📝 마무리

### 핵심 정리

```
변경 관리와 Feature Flag 핵심 요약:

1. 변경 관리: 시스템 변경의 안전성을 체계적으로 보장하는 프로세스
   - Standard / Normal / Emergency 분류
   - 자동 위험도 평가 + 조건부 승인 (Policy as Code)

2. Feature Flag: 코드 배포와 기능 릴리스를 분리하는 핵심 기법
   - Release / Experiment / Ops / Permission 4가지 유형
   - 플랫폼: LaunchDarkly, Unleash, Flagsmith, OpenFeature

3. 점진적 릴리스: 소수에서 시작해 전체로 확대하는 안전한 릴리스 방식
   - Percentage Rollout, User Targeting, Ring Deployment

4. A/B 테스트: 데이터 기반 의사결정의 핵심 도구
   - 가설 → 메트릭 → 실험 → 통계적 유의성 검증

5. Kill Switch: 배포 없이 즉시 기능을 끄는 안전장치
   - 초 단위 대응 (롤백의 분 단위 대비)

6. Flag 기술 부채: 만료일 설정, 정기 정리, 자동 알림으로 관리
   - "Flag를 만드는 것보다 지우는 게 더 중요해요"

7. Change Failure Rate: DORA 핵심 메트릭
   - Elite 수준: 0-5%, 작은 변경 + 점진적 릴리스로 달성

8. 변경-인시던트 연결: 장애 발생 시 최근 변경을 즉시 추적
```

### 변경 관리 성숙도 체크리스트

```
Level 1 (시작):
☐ PR 리뷰 프로세스가 있다
☐ 자동 테스트가 배포 전에 실행된다
☐ 기본적인 롤백 절차가 있다

Level 2 (표준화):
☐ 변경 유형별 분류가 있다 (Standard/Normal/Emergency)
☐ Feature Flag를 일부 기능에 사용한다
☐ 배포 후 기본 모니터링을 한다

Level 3 (자동화):
☐ 위험도 자동 평가가 있다
☐ 저위험 변경은 자동 승인된다
☐ Feature Flag로 점진적 릴리스를 한다
☐ A/B 테스트를 정기적으로 수행한다

Level 4 (최적화):
☐ Policy as Code로 변경 승인이 자동화됐다
☐ Kill Switch + 자동 롤백이 설정돼 있다
☐ Change Failure Rate를 추적하고 개선한다
☐ Feature Flag 라이프사이클이 관리된다
☐ 변경-인시던트 상관관계를 자동 추적한다

Level 5 (선도):
☐ Continuous Deployment (완전 자동 배포)
☐ 실험(A/B) 문화가 조직에 정착됐다
☐ 모든 변경이 자동 추적되고 분석된다
☐ 예측적 변경 관리 (장애 사전 예방)
```

---

> 🎉 **07-CI/CD 카테고리를 완료했어요!**
>
> Git 기초부터 브랜칭 전략, CI/CD 파이프라인, GitHub Actions, GitLab CI, Jenkins,
> 아티팩트 관리, 테스팅, 배포 전략, GitOps, 파이프라인 보안, 변경 관리까지
> 13개 강의를 모두 마쳤어요. 다음은 **Observability**를 배워볼게요!

---

## 🔗 다음 단계

### 이어서 학습하기

변경 관리와 Feature Flag의 기본을 익혔다면, 다음 단계로 넘어가 보세요.

| 주제 | 내용 | 링크 |
|------|------|------|
| **관측 가능성 기초** | 변경 후 시스템 상태를 어떻게 모니터링할까요? | [관측 가능성 기초](../08-observability/01-concept) |
| **CD 파이프라인** | 배포 자동화의 전체 그림 복습 | [CD 파이프라인](./04-cd-pipeline) |
| **배포 전략** | Blue-Green, Canary 등 인프라 레벨 배포 전략 | [배포 전략](./10-deployment-strategy) |
| **GitOps** | Git 기반 인프라/설정 관리 | [GitOps](./11-gitops) |

### 학습 경로 제안

```
현재 위치: 변경 관리와 Feature Flag ← 여기

추천 다음 단계:
1. [관측 가능성 기초](../08-observability/01-concept) - 다음 섹션 시작!
2. [배포 전략](./10-deployment-strategy) - 인프라 레벨 배포 패턴
3. [GitOps](./11-gitops) - Git 기반 선언적 관리
4. 실습: 팀 프로젝트에 Feature Flag 도입해 보기
```

> **마지막 팁**: 변경 관리의 핵심은 "느리게 가자"가 아니라 "안전하게 빠르게 가자"예요. Feature Flag, 점진적 릴리스, 자동화된 승인을 조합하면 속도를 유지하면서도 장애를 최소화할 수 있어요. 처음에는 간단한 Feature Flag부터 시작해서, 팀의 성숙도에 맞게 점진적으로 프로세스를 발전시켜 나가세요.
