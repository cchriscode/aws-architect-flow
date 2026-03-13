# CI(Continuous Integration) 파이프라인

> 코드를 작성하고 Push하면 자동으로 빌드하고, 테스트하고, 품질 검사까지 해주는 시스템 — 마치 자동차 공장의 품질검사 라인처럼요. 개발자가 직접 "빌드 잘 되나?" 확인하던 시대에서, 코드를 올리기만 하면 CI가 알아서 검증해주는 시대로 넘어가봐요. [Git 기초](./01-git-basics)와 [브랜칭 전략](./02-branching)을 배웠으니, 이제 그 위에 자동화를 얹어볼 차례예요.

---

## 🎯 왜 CI(Continuous Integration)를 알아야 하나요?

### 일상 비유: 자동차 공장의 품질검사 라인

자동차 공장을 상상해보세요. 부품이 조립 라인을 따라 이동하면서 각 단계마다 검사를 받아요.

- 엔진 조립 후 → 엔진 테스트
- 도장(페인트) 후 → 외관 품질 검사
- 전자 장비 설치 후 → 전기 계통 테스트
- 최종 조립 후 → 종합 주행 테스트

만약 엔진에 문제가 있으면 **도장 단계로 넘어가기 전에** 바로 잡아내요. 최종 출고 직전에 엔진 결함을 발견하면 전체를 분해해야 하잖아요? **문제를 빨리 발견할수록 수정 비용이 적어요.**

**이게 바로 CI 파이프라인의 핵심 철학이에요.**

```
실무에서 CI가 필요한 순간:

• 10명의 개발자가 동시에 코드를 수정하고 있음       → 통합할 때마다 충돌과 버그
• "내 컴퓨터에서는 잘 되는데요?"                    → 환경 의존성 문제
• 금요일 저녁에 merge 했는데 월요일에 장애 발견       → 피드백 루프가 너무 김
• 코드 리뷰 때 "테스트 돌려봤어요?" "아뇨..."       → 수동 검증의 한계
• 배포 후 타입 에러가 프로덕션에서 발견됨            → lint/type check 부재
• 보안 취약점이 있는 라이브러리를 모르고 사용         → SAST/SCA 부재
• 빌드에 30분 걸려서 개발자들이 CI를 안 돌림         → 캐싱/병렬화 필요
```

### CI 없는 팀 vs CI 있는 팀

```mermaid
flowchart TD
    subgraph "❌ CI 없는 팀"
        DEV_A["개발자 A<br/>기능 개발 3일"] -->|"수동 빌드"| BUILD_A["로컬 빌드<br/>성공 ✅"]
        DEV_B["개발자 B<br/>버그 수정 2일"] -->|"수동 빌드"| BUILD_B["로컬 빌드<br/>성공 ✅"]
        BUILD_A -->|"merge"| MAIN_X["main 브랜치"]
        BUILD_B -->|"merge"| MAIN_X
        MAIN_X -->|"통합 후"| BROKEN["💥 빌드 실패!<br/>A와 B의 코드가 충돌"]
        BROKEN -->|"원인 추적<br/>2시간 소요"| FIX["수동 수정"]
    end

    subgraph "✅ CI 있는 팀"
        DEV_C["개발자 C<br/>기능 개발"] -->|"Push"| CI_PIPE["CI 파이프라인<br/>자동 실행"]
        CI_PIPE -->|"5분 후"| RESULT{"빌드 & 테스트<br/>결과"}
        RESULT -->|"✅ 성공"| MERGE["안전하게 merge"]
        RESULT -->|"❌ 실패"| NOTIFY["즉시 알림<br/>3분 만에 수정"]
    end

    style BROKEN fill:#e74c3c,color:#fff
    style MERGE fill:#27ae60,color:#fff
    style CI_PIPE fill:#3498db,color:#fff
    style NOTIFY fill:#f39c12,color:#fff
```

### 비용 곡선: 늦게 발견할수록 비싸요

```
결함 발견 시점별 수정 비용 (상대적)

코딩 중 발견        ████                           x1
CI에서 발견         ████████                       x4
QA에서 발견         ████████████████               x10
스테이징 발견       ████████████████████████       x40
프로덕션 발견       ████████████████████████████████████████  x100+

→ CI의 목표: 결함을 가능한 한 "왼쪽"에서 잡아내기 (Shift Left)
```

---

## 🧠 핵심 개념 잡기

### 1. Continuous Integration (CI)

> **비유**: 요리사들이 각자 만든 재료를 자주 맛보면서 합치는 것

여러 요리사가 하나의 코스 요리를 만든다고 해봐요. 전채, 메인, 디저트를 각각 만들되, **매일 한 번씩** 맛을 합쳐보고 전체 밸런스를 확인해요. 일주일 뒤에 처음 합쳐보면? 맛이 안 맞아서 전부 다시 만들어야 할 수도 있어요.

CI의 핵심 원칙 3가지:

- **자주 통합하기 (Frequent Integration)**: 하루에 여러 번 main에 merge
- **빠른 피드백 (Fast Feedback)**: 통합 결과를 10분 이내에 알려주기
- **자동화된 검증 (Automated Testing)**: 사람이 아니라 기계가 검증하기

### 2. CI 파이프라인

> **비유**: 자동차 공장의 조립 라인

코드가 여러 단계의 검사를 순서대로 통과하는 자동화된 프로세스예요. 각 단계(Stage)가 통과해야 다음 단계로 넘어가요.

### 3. 빌드(Build)

> **비유**: 레고 블록으로 완성품 조립하기

소스 코드를 실행 가능한 형태(바이너리, Docker 이미지, 번들 등)로 변환하는 과정이에요.

### 4. 아티팩트(Artifact)

> **비유**: 공장에서 나온 완성된 제품

빌드 과정에서 생산된 결과물이에요. JAR 파일, Docker 이미지, npm 패키지 등이 아티팩트예요.

### 5. 캐싱(Caching)

> **비유**: 재료를 매번 시장에서 사오지 않고 냉장고에 보관하는 것

의존성(node_modules, .m2 등)을 매번 다운로드하지 않고 저장해두면 빌드 시간이 확 줄어요.

### 6. 매트릭스 빌드(Matrix Build)

> **비유**: 같은 시험을 여러 교실에서 동시에 보는 것

여러 환경(Node 18/20/22, Ubuntu/macOS/Windows)에서 동시에 테스트를 실행하는 방식이에요.

---

## 🔍 하나씩 자세히 알아보기

### 1. CI의 핵심 원칙

#### Frequent Integration — 자주 통합하기

Martin Fowler가 정의한 CI의 가장 중요한 원칙이에요. 코드를 오래 격리하면 할수록 통합할 때 충돌이 커져요.

```
❌ Anti-Pattern: Big Bang Integration
─────────────────────────────────────────
개발자 A: ──────────────────────── merge ─→ 💥 충돌 3000줄
                                          (2주간 격리)

개발자 B: ──────────────────────── merge ─→ 💥 충돌 2000줄
                                          (2주간 격리)

✅ CI 방식: Frequent Integration
─────────────────────────────────────────
개발자 A: ──── merge → merge → merge → merge ─→ ✅ 충돌 0~10줄
              (매일)   (매일)   (매일)   (매일)

개발자 B: ─── merge → merge → merge → merge ──→ ✅ 충돌 0~10줄
              (매일)   (매일)   (매일)   (매일)
```

#### Fast Feedback — 빠른 피드백

CI 파이프라인은 빨라야 해요. 개발자가 Push하고 30분 후에 결과를 받으면 이미 다른 작업을 하고 있어서 컨텍스트 스위칭 비용이 발생해요.

```
CI 파이프라인 속도 기준:

🟢 이상적: 5분 이내     → 개발자가 커피 한 잔 마시는 동안
🟡 허용 가능: 10분 이내  → 다른 작업 시작 전에 결과 확인
🟠 경고: 10-20분       → 피드백 루프가 느려지기 시작
🔴 위험: 20분 초과      → 개발자들이 CI를 무시하기 시작
```

#### Automated Testing — 자동화된 검증

사람의 수동 확인에 의존하면 실수가 생겨요. 모든 검증을 자동화해야 해요.

```
수동 검증의 한계:
- 사람은 피로해요 → 금요일 오후에는 검증이 느슨해짐
- 사람은 잊어요 → "이번에는 테스트 안 돌려도 되겠지"
- 사람은 느려요 → 100개의 테스트 케이스를 수동으로?
- 사람은 주관적이에요 → "이 정도면 괜찮지 않나?"

자동화된 검증:
- 매번 동일한 기준으로 검사
- 24시간 쉬지 않고 실행
- 수백 개의 테스트를 분 단위로 실행
- 객관적인 Pass/Fail 판정
```

---

### 2. CI 파이프라인 구성 요소

CI 파이프라인은 여러 단계(Stage)로 구성돼요. 각 단계가 실패하면 파이프라인이 즉시 중단되고 개발자에게 알려줘요.

```mermaid
flowchart LR
    TRIGGER["🔔 트리거<br/>Push / PR"] --> CHECKOUT["📥 Checkout<br/>코드 가져오기"]
    CHECKOUT --> INSTALL["📦 Install<br/>의존성 설치"]
    INSTALL --> LINT["🔍 Lint<br/>코드 스타일 검사"]
    LINT --> BUILD["🔨 Build<br/>빌드"]
    BUILD --> TEST["🧪 Test<br/>단위/통합 테스트"]
    TEST --> SAST["🔐 SAST<br/>보안 검사"]
    SAST --> ARTIFACT["📦 Artifact<br/>결과물 저장"]
    ARTIFACT --> NOTIFY["📢 Notify<br/>결과 알림"]

    LINT -->|"❌ 실패"| FAIL["🚫 파이프라인 중단<br/>+ 알림"]
    BUILD -->|"❌ 실패"| FAIL
    TEST -->|"❌ 실패"| FAIL
    SAST -->|"❌ 실패"| FAIL

    style TRIGGER fill:#9b59b6,color:#fff
    style LINT fill:#f39c12,color:#fff
    style BUILD fill:#3498db,color:#fff
    style TEST fill:#27ae60,color:#fff
    style SAST fill:#e74c3c,color:#fff
    style ARTIFACT fill:#1abc9c,color:#fff
    style FAIL fill:#e74c3c,color:#fff
```

#### 2-1. Trigger (트리거)

CI 파이프라인이 실행되는 조건이에요. "언제 파이프라인을 시작할까?"를 정의해요.

```yaml
# GitHub Actions 트리거 예시
on:
  push:
    branches: [main, develop]          # main, develop에 Push할 때
  pull_request:
    branches: [main]                    # main으로 PR을 올릴 때
  schedule:
    - cron: '0 2 * * 1'                # 매주 월요일 새벽 2시 (정기 빌드)
  workflow_dispatch:                     # 수동 실행 버튼
```

```
트리거 종류와 용도:

Push 트리거        → main/develop 브랜치에 코드가 Push될 때
PR 트리거          → Pull Request를 생성하거나 업데이트할 때
Schedule 트리거    → 주기적으로 (보안 스캔, 의존성 검사)
Tag 트리거         → v1.0.0 같은 태그가 생성될 때 (릴리스)
Manual 트리거      → 수동으로 실행 (긴급 배포, 디버깅)
Webhook 트리거     → 외부 시스템에서 호출 (Slack 커맨드 등)
```

#### 2-2. Checkout (코드 가져오기)

CI 서버가 Git 저장소에서 코드를 가져오는 단계예요.

```yaml
# GitHub Actions
steps:
  - name: Checkout code
    uses: actions/checkout@v4
    with:
      fetch-depth: 0    # 전체 히스토리 (git blame, 변경 분석 등에 필요)
      # fetch-depth: 1  # 최신 커밋만 (빠르지만 히스토리 없음)
```

#### 2-3. 의존성 설치 (Install Dependencies)

프로젝트가 사용하는 라이브러리를 설치하는 단계예요. 캐싱과 함께 사용하면 속도가 크게 향상돼요.

```yaml
# Node.js 프로젝트 예시
steps:
  - name: Setup Node.js
    uses: actions/setup-node@v4
    with:
      node-version: '20'
      cache: 'npm'           # npm 캐시 자동 관리

  - name: Install dependencies
    run: npm ci               # npm install이 아닌 npm ci 사용!
    # npm ci vs npm install:
    # - npm ci: lock 파일 기준으로 정확히 설치 (CI에 적합)
    # - npm install: lock 파일을 업데이트할 수도 있음 (개발에 적합)
```

#### 2-4. Lint (코드 스타일 검사)

코드의 스타일, 규칙 위반, 잠재적 오류를 검사해요. 빌드 전에 빠르게 실행돼요.

```yaml
steps:
  - name: Run ESLint
    run: npx eslint . --max-warnings 0    # 경고도 허용하지 않음

  - name: Run Prettier check
    run: npx prettier --check .           # 포맷이 맞는지 확인만

  - name: Run TypeScript type check
    run: npx tsc --noEmit                 # 타입 검사 (빌드 없이)
```

```
Lint가 잡아주는 것들:

코드 스타일      → 들여쓰기, 세미콜론, 따옴표 통일
잠재적 버그      → 사용하지 않는 변수, 도달 불가능한 코드
타입 에러        → TypeScript 타입 불일치
보안 패턴        → eval() 사용, innerHTML 직접 할당
복잡도           → 너무 복잡한 함수, 중첩이 깊은 코드
접근성           → (React) alt 속성 누락, aria 규칙 위반
```

#### 2-5. Build (빌드)

소스 코드를 실행 가능한 형태로 변환하는 단계예요. 언어와 프로젝트에 따라 빌드 방식이 다양해요.

```yaml
# 다양한 빌드 예시
steps:
  # Java/Kotlin (Gradle)
  - name: Build with Gradle
    run: ./gradlew build -x test    # 테스트는 별도 단계에서

  # Go
  - name: Build Go binary
    run: go build -o app ./cmd/server

  # Node.js (Next.js)
  - name: Build Next.js
    run: npm run build

  # Docker 이미지 빌드
  - name: Build Docker image
    run: docker build -t myapp:${{ github.sha }} .

  # Rust
  - name: Build Rust
    run: cargo build --release
```

#### 2-6. Test (테스트)

자동화된 테스트를 실행하는 가장 핵심적인 단계예요.

```yaml
steps:
  # 단위 테스트 (Unit Test)
  - name: Run unit tests
    run: npm test -- --coverage --ci
    # --coverage: 테스트 커버리지 리포트 생성
    # --ci: CI 환경에 최적화된 모드

  # 통합 테스트 (Integration Test)
  - name: Run integration tests
    run: npm run test:integration
    env:
      DATABASE_URL: postgres://localhost:5432/testdb
      REDIS_URL: redis://localhost:6379

  # E2E 테스트 (End-to-End Test)
  - name: Run E2E tests
    run: npx playwright test
```

```
테스트 피라미드:

            /  E2E  \              느리지만 현실적
           / (10%)   \             - 브라우저 테스트
          /───────────\            - API 시나리오 테스트
         / Integration \           적당한 속도
        /   (20%)       \          - DB 연동 테스트
       /─────────────────\         - API 통합 테스트
      /     Unit Tests    \        빠르고 많이
     /      (70%)          \       - 함수 단위 테스트
    /───────────────────────\      - 비즈니스 로직 테스트

CI에서의 전략:
- Unit: 항상 실행 (빠르니까)
- Integration: PR과 main 브랜치에서 실행
- E2E: main 브랜치 merge 시 또는 정기적으로 실행
```

#### 2-7. SAST (정적 보안 분석)

코드에 보안 취약점이 있는지 자동으로 검사하는 단계예요.

```yaml
steps:
  # 코드 보안 분석 (SAST)
  - name: Run CodeQL analysis
    uses: github/codeql-action/analyze@v3

  # 의존성 취약점 검사 (SCA)
  - name: Check for vulnerabilities
    run: npm audit --audit-level=high

  # Secret 누출 검사
  - name: Scan for secrets
    uses: trufflesecurity/trufflehog@main
    with:
      path: ./
```

```
SAST vs DAST:

SAST (Static Application Security Testing)
  - 코드를 실행하지 않고 분석
  - CI 파이프라인에서 실행
  - 빠르고 개발 초기에 발견 가능
  - SQL Injection, XSS, 하드코딩된 비밀 등

DAST (Dynamic Application Security Testing)
  - 실행 중인 애플리케이션을 공격해서 테스트
  - 배포 후 또는 스테이징에서 실행
  - 실제 공격 시나리오 재현
  - 런타임 취약점 발견
```

#### 2-8. Artifact (아티팩트 저장)

빌드 결과물을 저장하는 단계예요. CD(지속적 배포)에서 이 아티팩트를 가져다 배포해요.

```yaml
steps:
  # 빌드 결과물 업로드
  - name: Upload build artifact
    uses: actions/upload-artifact@v4
    with:
      name: build-output
      path: dist/
      retention-days: 7          # 7일간 보관

  # Docker 이미지를 레지스트리에 Push
  - name: Push to ECR
    run: |
      aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_REGISTRY
      docker push $ECR_REGISTRY/myapp:${{ github.sha }}

  # 테스트 결과 리포트 업로드
  - name: Upload test results
    if: always()                  # 테스트 실패해도 리포트는 저장
    uses: actions/upload-artifact@v4
    with:
      name: test-results
      path: coverage/
```

---

### 3. 캐싱 전략 (Caching Strategies)

CI 빌드에서 가장 시간을 많이 잡아먹는 건 의존성 다운로드예요. 캐싱으로 이 시간을 대폭 줄일 수 있어요.

```mermaid
flowchart TD
    START["CI 시작"] --> CHECK{"캐시<br/>존재?"}
    CHECK -->|"✅ 캐시 Hit"| RESTORE["캐시 복원<br/>(수 초)"]
    CHECK -->|"❌ 캐시 Miss"| DOWNLOAD["의존성 다운로드<br/>(수 분)"]
    RESTORE --> BUILD["빌드 실행"]
    DOWNLOAD --> SAVE["캐시 저장"]
    SAVE --> BUILD
    BUILD --> END["완료"]

    RESTORE -.->|"⚡ 3~5배 빠름"| BUILD

    style RESTORE fill:#27ae60,color:#fff
    style DOWNLOAD fill:#e74c3c,color:#fff
    style CHECK fill:#f39c12,color:#fff
```

#### 캐시 키 전략

캐시가 유효한지 판별하는 키(Key) 설계가 중요해요.

```yaml
# GitHub Actions 캐싱
- name: Cache node_modules
  uses: actions/cache@v4
  with:
    path: node_modules
    key: node-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
    restore-keys: |
      node-${{ runner.os }}-
    # 캐시 키 전략:
    # 1순위: OS + lock 파일 해시가 정확히 일치 → 완벽한 캐시
    # 2순위: OS만 일치 → 부분 캐시 (일부만 다운로드하면 됨)
```

#### 언어별 캐시 대상

```yaml
# ── Node.js ──
- uses: actions/cache@v4
  with:
    path: |
      node_modules
      ~/.npm
    key: node-${{ hashFiles('package-lock.json') }}

# ── Python ──
- uses: actions/cache@v4
  with:
    path: |
      ~/.cache/pip
      .venv
    key: python-${{ hashFiles('requirements.txt') }}

# ── Go ──
- uses: actions/cache@v4
  with:
    path: |
      ~/go/pkg/mod
      ~/.cache/go-build
    key: go-${{ hashFiles('go.sum') }}

# ── Gradle (Java/Kotlin) ──
- uses: actions/cache@v4
  with:
    path: |
      ~/.gradle/caches
      ~/.gradle/wrapper
    key: gradle-${{ hashFiles('**/*.gradle*', '**/gradle-wrapper.properties') }}

# ── Docker 레이어 캐시 ──
- uses: docker/build-push-action@v5
  with:
    cache-from: type=gha         # GitHub Actions 캐시 사용
    cache-to: type=gha,mode=max  # 모든 레이어 캐시
```

#### 캐싱 효과 비교

```
캐싱 전후 빌드 시간 비교:

프로젝트 타입          캐시 없음    캐시 있음    절감
──────────────────────────────────────────────────
Node.js (대형)         4분 30초    1분 20초    70% ↓
Python ML 프로젝트      8분 00초    2분 30초    69% ↓
Java (Gradle)          6분 00초    2분 00초    67% ↓
Go 프로젝트            3분 00초    0분 45초    75% ↓
Docker 빌드            12분 00초   3분 00초    75% ↓

→ 캐싱만 잘 해도 CI 시간이 평균 60~70% 줄어들어요!
```

---

### 4. 병렬 실행과 매트릭스 빌드

#### 병렬 실행 (Parallel Jobs)

서로 의존성이 없는 작업은 동시에 실행해서 전체 시간을 줄여요.

```
순차 실행 vs 병렬 실행:

❌ 순차 실행 (총 15분):
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│  Lint   │→│  Build  │→│  Unit   │→│ Integ   │→│  SAST   │
│  3분    │ │  4분    │ │  3분    │ │  3분    │ │  2분    │
└─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘

✅ 병렬 실행 (총 7분):
┌─────────┐
│  Lint   │  3분
├─────────┤
│  Build  │  4분 ──→ ┌─────────┐ ┌─────────┐
├─────────┤          │  Unit   │ │  SAST   │
│  Types  │  2분     │  3분    │ │  2분    │
└─────────┘          └─────────┘ └─────────┘
                     (Build 이후 병렬)

→ 15분 → 7분 (53% 절감)
```

```yaml
# GitHub Actions 병렬 실행
name: CI Pipeline

on:
  pull_request:
    branches: [main]

jobs:
  # ── Stage 1: 독립적 검사 (병렬) ──
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run lint

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx tsc --noEmit

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm audit --audit-level=high

  # ── Stage 2: 빌드 (lint, typecheck 통과 후) ──
  build:
    needs: [lint, typecheck]       # lint와 typecheck가 둘 다 통과해야 실행
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: build
          path: dist/

  # ── Stage 3: 테스트 (빌드 후 병렬) ──
  unit-test:
    needs: [build]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test -- --coverage

  integration-test:
    needs: [build]
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:integration

  e2e-test:
    needs: [build]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test
```

#### 매트릭스 빌드 (Matrix Build)

여러 환경 조합에서 동시에 테스트하는 전략이에요.

```yaml
# Node.js 버전 + OS 매트릭스
jobs:
  test:
    strategy:
      matrix:
        node-version: [18, 20, 22]
        os: [ubuntu-latest, macos-latest, windows-latest]
        # 총 3 x 3 = 9개의 조합이 동시에 실행됨!
      fail-fast: false               # 하나가 실패해도 나머지 계속 실행
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm ci
      - run: npm test

  # 특정 조합 제외
  test-with-exclude:
    strategy:
      matrix:
        node-version: [18, 20, 22]
        os: [ubuntu-latest, macos-latest, windows-latest]
        exclude:
          - node-version: 18
            os: windows-latest       # Node 18 + Windows 조합은 건너뜀
      fail-fast: false
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test
```

```mermaid
flowchart TD
    PUSH["코드 Push"] --> MATRIX["매트릭스 빌드 시작"]

    MATRIX --> N18U["Node 18<br/>Ubuntu"]
    MATRIX --> N18M["Node 18<br/>macOS"]
    MATRIX --> N20U["Node 20<br/>Ubuntu"]
    MATRIX --> N20M["Node 20<br/>macOS"]
    MATRIX --> N20W["Node 20<br/>Windows"]
    MATRIX --> N22U["Node 22<br/>Ubuntu"]
    MATRIX --> N22M["Node 22<br/>macOS"]
    MATRIX --> N22W["Node 22<br/>Windows"]

    N18U --> RESULT{"전체 결과"}
    N18M --> RESULT
    N20U --> RESULT
    N20M --> RESULT
    N20W --> RESULT
    N22U --> RESULT
    N22M --> RESULT
    N22W --> RESULT

    RESULT -->|"모두 ✅"| PASS["파이프라인 통과"]
    RESULT -->|"하나라도 ❌"| FAIL["실패 알림"]

    style MATRIX fill:#9b59b6,color:#fff
    style PASS fill:#27ae60,color:#fff
    style FAIL fill:#e74c3c,color:#fff
```

---

### 5. Monorepo CI 전략

하나의 저장소에 여러 프로젝트가 있는 Monorepo에서는 "변경된 부분만" 빌드하는 것이 핵심이에요.

```
Monorepo 구조 예시:

my-monorepo/
├── apps/
│   ├── web/              # 프론트엔드 (Next.js)
│   ├── api/              # 백엔드 (NestJS)
│   └── admin/            # 어드민 대시보드
├── packages/
│   ├── ui/               # 공유 UI 컴포넌트
│   ├── utils/            # 공유 유틸리티
│   └── config/           # 공유 설정
├── package.json
└── turbo.json
```

#### 변경 감지 기반 CI

```yaml
# GitHub Actions — 변경된 부분만 CI 실행
name: Monorepo CI

on:
  pull_request:
    branches: [main]

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      web: ${{ steps.changes.outputs.web }}
      api: ${{ steps.changes.outputs.api }}
      packages: ${{ steps.changes.outputs.packages }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v3
        id: changes
        with:
          filters: |
            web:
              - 'apps/web/**'
              - 'packages/ui/**'       # UI 패키지가 바뀌면 web도 빌드
              - 'packages/utils/**'
            api:
              - 'apps/api/**'
              - 'packages/utils/**'    # utils가 바뀌면 api도 빌드
            packages:
              - 'packages/**'

  # web이 변경된 경우에만 실행
  ci-web:
    needs: detect-changes
    if: needs.detect-changes.outputs.web == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx turbo run lint build test --filter=web...

  # api가 변경된 경우에만 실행
  ci-api:
    needs: detect-changes
    if: needs.detect-changes.outputs.api == 'true'
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx turbo run lint build test --filter=api...
```

#### Turborepo / Nx를 활용한 Monorepo CI

```yaml
# Turborepo 활용 — 의존성 그래프 기반 빌드
steps:
  - uses: actions/checkout@v4
    with:
      fetch-depth: 0                    # 변경 감지를 위해 전체 히스토리

  - name: Setup Turborepo cache
    uses: actions/cache@v4
    with:
      path: .turbo
      key: turbo-${{ github.sha }}
      restore-keys: turbo-

  - name: Build affected packages
    run: npx turbo run build --filter=...[origin/main]
    # "origin/main 이후 변경된 패키지만" 빌드
    # 의존성 그래프를 분석해서 영향받는 패키지까지 포함

  - name: Test affected packages
    run: npx turbo run test --filter=...[origin/main]
```

```
Monorepo CI에서 전체 빌드 vs 영향 범위 빌드:

전체 빌드: apps/web만 수정했는데...
  web ✅ → api ✅ → admin ✅ → ui ✅ → utils ✅ → config ✅
  총 15분 (불필요한 빌드 포함)

영향 범위 빌드: apps/web만 수정했으면...
  web ✅ (web이 의존하는 ui, utils도 검사)
  총 4분 (필요한 것만!)

packages/utils 수정했으면?
  utils ✅ → web ✅ → api ✅ → admin ✅ (utils에 의존하는 모든 앱)
  총 10분 (영향받는 것만!)
```

---

### 6. CI 도구 비교

#### 주요 CI 도구 한눈에 보기

| 항목 | GitHub Actions | GitLab CI | Jenkins | CircleCI |
|------|---------------|-----------|---------|----------|
| **호스팅** | SaaS (GitHub) | SaaS / Self-hosted | Self-hosted | SaaS / Self-hosted |
| **설정 파일** | `.github/workflows/*.yml` | `.gitlab-ci.yml` | `Jenkinsfile` | `.circleci/config.yml` |
| **언어** | YAML | YAML | Groovy (DSL) | YAML |
| **무료 범위** | Public: 무제한<br/>Private: 2,000분/월 | 400분/월 | 무료 (서버 비용) | 6,000분/월 |
| **러너** | GitHub-hosted / Self-hosted | GitLab Runner | Agent (노드) | Docker / Machine |
| **장점** | GitHub 통합, 마켓플레이스 | GitLab 통합, Auto DevOps | 무한 커스터마이징 | 빠른 속도, Docker 최적화 |
| **단점** | GitHub 종속 | GitLab 종속 | 관리 부담 큼 | 비용 증가 |
| **학습 난이도** | 쉬움 | 쉬움 | 어려움 | 보통 |
| **추천 대상** | GitHub 사용 팀 | GitLab 사용 팀 | 대기업, 커스텀 필요 | 속도 중시 팀 |

#### GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - run: npm test -- --coverage
```

```
GitHub Actions 특징:
✅ GitHub와 완벽한 통합 (PR 체크, 이슈 연동)
✅ 마켓플레이스에 19,000+ 액션 (재사용 가능한 빌드 블록)
✅ Public 리포지토리는 무료
✅ 설정이 직관적이고 쉬움
⚠️ GitHub에 종속됨
⚠️ Private 리포의 무료 분 제한
⚠️ Self-hosted 러너 관리 필요 (고성능이 필요한 경우)
```

#### GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - validate
  - build
  - test

variables:
  NODE_VERSION: "20"

cache:
  key:
    files:
      - package-lock.json
  paths:
    - node_modules/

lint:
  stage: validate
  image: node:${NODE_VERSION}
  script:
    - npm ci
    - npm run lint

build:
  stage: build
  image: node:${NODE_VERSION}
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 hour

test:
  stage: test
  image: node:${NODE_VERSION}
  script:
    - npm ci
    - npm test -- --coverage
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
  artifacts:
    reports:
      junit: junit.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
```

```
GitLab CI 특징:
✅ GitLab과 완벽한 통합 (MR, 이슈, 보안 스캔)
✅ Auto DevOps (설정 없이도 기본 CI/CD 제공)
✅ 내장 컨테이너 레지스트리
✅ 내장 보안 스캔 (SAST, DAST, 의존성 검사)
⚠️ GitLab에 종속됨
⚠️ 복잡한 파이프라인은 YAML이 길어질 수 있음
⚠️ Runner 성능에 따라 속도 차이가 큼
```

#### Jenkins

```groovy
// Jenkinsfile (Declarative Pipeline)
pipeline {
    agent any

    tools {
        nodejs 'Node-20'
    }

    stages {
        stage('Install') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Parallel Checks') {
            parallel {
                stage('Lint') {
                    steps {
                        sh 'npm run lint'
                    }
                }
                stage('Type Check') {
                    steps {
                        sh 'npx tsc --noEmit'
                    }
                }
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Test') {
            steps {
                sh 'npm test -- --coverage --ci'
            }
            post {
                always {
                    junit 'test-results/**/*.xml'
                    publishHTML([
                        reportDir: 'coverage/lcov-report',
                        reportFiles: 'index.html',
                        reportName: 'Coverage Report'
                    ])
                }
            }
        }
    }

    post {
        failure {
            slackSend channel: '#dev-alerts',
                      message: "CI 실패: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
        }
    }
}
```

```
Jenkins 특징:
✅ 완전한 자유도 (어떤 것이든 빌드 가능)
✅ 1,800+ 플러그인 생태계
✅ Self-hosted (데이터 통제)
✅ 오랜 역사, 큰 커뮤니티
⚠️ 서버 관리 부담 (업데이트, 보안, 스케일링)
⚠️ Groovy 학습 필요
⚠️ UI가 다소 구식
⚠️ 플러그인 호환성 문제 가능
```

#### CircleCI

```yaml
# .circleci/config.yml
version: 2.1

orbs:
  node: circleci/node@5.2

jobs:
  lint-and-test:
    docker:
      - image: cimg/node:20.11
      - image: cimg/postgres:16.2    # 서비스 컨테이너
    steps:
      - checkout
      - node/install-packages:
          pkg-manager: npm
      - run:
          name: Lint
          command: npm run lint
      - run:
          name: Build
          command: npm run build
      - run:
          name: Test
          command: npm test -- --coverage --ci
      - store_test_results:
          path: test-results
      - store_artifacts:
          path: coverage

workflows:
  ci:
    jobs:
      - lint-and-test
```

```
CircleCI 특징:
✅ Docker에 최적화된 실행 환경
✅ 뛰어난 캐싱 성능
✅ Orbs (재사용 가능한 설정 패키지)
✅ SSH 디버깅 (실패한 빌드에 SSH로 접속)
⚠️ 무료 범위를 초과하면 비용 증가
⚠️ GitHub/GitLab 별도 연동 필요
⚠️ 복잡한 워크플로우는 config가 복잡해짐
```

#### CI 도구 선택 가이드

```mermaid
flowchart TD
    START["CI 도구 선택"] --> Q1{"소스 코드<br/>어디에 있나요?"}

    Q1 -->|"GitHub"| Q2{"팀 규모와<br/>요구사항?"}
    Q1 -->|"GitLab"| GITLAB["✅ GitLab CI<br/>통합 환경 활용"]
    Q1 -->|"Bitbucket"| Q3{"커스텀<br/>필요한가요?"}
    Q1 -->|"Self-hosted Git"| JENKINS["✅ Jenkins<br/>자유로운 커스텀"]

    Q2 -->|"소규모, 간단"| GHA["✅ GitHub Actions<br/>빠른 시작"]
    Q2 -->|"대규모, 복잡"| Q4{"Self-hosted<br/>필요?"}

    Q4 -->|"예"| JENKINS
    Q4 -->|"아니오"| CIRCLE["✅ CircleCI<br/>빠른 빌드"]

    Q3 -->|"많이"| JENKINS
    Q3 -->|"적게"| BB["✅ Bitbucket<br/>Pipelines"]

    style GHA fill:#3498db,color:#fff
    style GITLAB fill:#e67e22,color:#fff
    style JENKINS fill:#27ae60,color:#fff
    style CIRCLE fill:#9b59b6,color:#fff
    style BB fill:#2c3e50,color:#fff
```

---

### 7. CI 성능 최적화

빌드가 느리면 개발자들이 CI를 무시하기 시작해요. 빠른 CI는 좋은 CI 문화의 핵심이에요.

#### 최적화 기법 종합

```
CI 성능 최적화 전략 (효과 순):

1. 캐싱 (60~75% 시간 절감)
   - 의존성 캐시 (node_modules, pip, gradle)
   - Docker 레이어 캐시
   - 빌드 캐시 (turbo, nx, ccache)

2. 병렬화 (40~60% 시간 절감)
   - 독립적 Job 병렬 실행
   - 테스트 분할 실행 (test splitting)
   - 매트릭스 빌드

3. 영향 범위 분석 (30~50% 시간 절감)
   - 변경된 파일 기반 빌드 (monorepo)
   - 의존성 그래프 기반 스킵
   - path-filter로 불필요한 빌드 건너뛰기

4. 러너 최적화 (20~40% 시간 절감)
   - Self-hosted 러너 (고사양 머신)
   - ARM 러너 사용 (비용 효율적)
   - 커스텀 Docker 이미지 (pre-installed 도구)

5. 빌드 최적화 (10~30% 시간 절감)
   - 증분 빌드 (incremental build)
   - 불필요한 단계 제거
   - 가벼운 베이스 이미지 사용
```

#### 테스트 분할 실행 (Test Splitting)

테스트가 많으면 여러 러너에 나누어서 동시에 실행할 수 있어요.

```yaml
# CircleCI 테스트 분할 예시
jobs:
  test:
    parallelism: 4           # 4개의 러너에서 동시 실행
    steps:
      - checkout
      - run:
          name: Split and run tests
          command: |
            # 테스트 파일을 4등분해서 각 러너에 배분
            TESTS=$(circleci tests glob "tests/**/*.test.ts" | circleci tests split --split-by=timings)
            npx jest $TESTS

# GitHub Actions에서 유사한 구현
jobs:
  test:
    strategy:
      matrix:
        shard: [1, 2, 3, 4]        # 4개의 샤드
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx jest --shard=${{ matrix.shard }}/4
        # Jest가 테스트를 4등분해서 해당 샤드만 실행
```

```
테스트 분할 효과:

테스트 400개, 총 12분 소요:

분할 없음:  ████████████████████████████████████████████████  12분
2분할:      ████████████████████████                          6분
4분할:      ████████████                                      3분
8분할:      ██████                                            ~2분 (오버헤드 포함)

→ 분할할수록 빨라지지만, 러너 초기화 오버헤드가 있어서
  무한정 빨라지지는 않아요. 보통 4~8분할이 효율적이에요.
```

#### 커스텀 러너 이미지

```dockerfile
# .github/images/ci-runner/Dockerfile
# CI에 필요한 도구가 미리 설치된 커스텀 이미지
FROM node:20-slim

# 자주 사용하는 CI 도구 미리 설치
RUN apt-get update && apt-get install -y \
    git \
    curl \
    jq \
    && rm -rf /var/lib/apt/lists/*

# Playwright 브라우저 미리 설치 (E2E 테스트용)
RUN npx playwright install --with-deps chromium

# 글로벌 도구 미리 설치
RUN npm install -g turbo@latest

# → 매 빌드마다 설치하는 대신, 이미지에 포함해두면
#   빌드 시간이 크게 줄어들어요
```

---

### 8. 빌드 실패 관리

CI에서 빌드가 실패했을 때 어떻게 대응하느냐가 팀의 개발 문화를 결정해요.

#### 빌드 실패 대응 프로세스

```
빌드 실패 시 대응 플로우:

1. 🔔 즉시 알림 (Slack, Email, PR 코멘트)
2. 🔍 원인 파악 (로그 확인, 실패한 단계 식별)
3. 🏷️ 분류
   ├── Flaky Test (불안정한 테스트) → 재실행 후 원인 분석
   ├── 코드 버그 → 즉시 수정 PR
   ├── 환경 문제 → 인프라 팀 알림
   └── 의존성 문제 → lock 파일 업데이트
4. 🔧 수정 (가능한 빨리, 다른 작업보다 우선)
5. ✅ 확인 (CI 통과 확인)
6. 📝 기록 (반복되는 실패 패턴 문서화)
```

#### Flaky Test 관리

```yaml
# Flaky Test 대응: 자동 재시도
# GitHub Actions
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - name: Run tests with retry
        uses: nick-fields/retry@v3
        with:
          timeout_minutes: 10
          max_attempts: 3              # 최대 3번 재시도
          command: npm test
          # ⚠️ 주의: 재시도는 임시 방편일 뿐!
          # Flaky test의 근본 원인을 반드시 해결해야 해요.
```

```
Flaky Test 흔한 원인:

1. 타이밍 의존성
   ❌ expect(result).toBe(true)   // setTimeout 완료 전에 검사
   ✅ await waitFor(() => expect(result).toBe(true))

2. 순서 의존성
   ❌ 테스트 A가 DB에 데이터를 넣고, 테스트 B가 그걸 읽음
   ✅ 각 테스트가 독립적으로 setup/teardown

3. 환경 의존성
   ❌ 특정 시간대에서만 통과하는 테스트
   ✅ 시간을 mock으로 고정

4. 네트워크 의존성
   ❌ 외부 API를 직접 호출하는 테스트
   ✅ Mock 서버 사용 또는 VCR 패턴
```

#### 빌드 상태 가시화

```yaml
# PR에 빌드 상태 표시
# GitHub Actions에서는 자동으로 PR 체크로 표시됨

# Branch Protection Rule 설정 (GitHub)
# Settings → Branches → Branch protection rules:
# ✅ Require status checks to pass before merging
#    - ci / lint
#    - ci / build
#    - ci / test
# ✅ Require branches to be up to date before merging

# Slack 알림
jobs:
  notify:
    needs: [lint, build, test]
    if: always()
    runs-on: ubuntu-latest
    steps:
      - name: Notify Slack
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          fields: repo,message,commit,author,action,eventName
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 💻 직접 해보기

### 실습 1: 기본 CI 파이프라인 구축 (GitHub Actions)

Node.js 프로젝트에 처음부터 CI를 구축해봐요.

```bash
# 1. 프로젝트 초기화
mkdir my-ci-project && cd my-ci-project
git init
npm init -y

# 2. 개발 도구 설치
npm install --save-dev typescript jest ts-jest @types/jest eslint prettier

# 3. TypeScript 설정
npx tsc --init --target es2020 --module commonjs --outDir dist --strict

# 4. Jest 설정
cat > jest.config.js << 'EOF'
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
EOF

# 5. ESLint 설정
cat > .eslintrc.json << 'EOF'
{
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "extends": ["eslint:recommended"],
  "rules": {
    "no-unused-vars": "error",
    "no-console": "warn"
  }
}
EOF
```

```typescript
// src/calculator.ts — 간단한 비즈니스 로직
export function add(a: number, b: number): number {
  return a + b;
}

export function divide(a: number, b: number): number {
  if (b === 0) {
    throw new Error('Division by zero');
  }
  return a / b;
}

export function fibonacci(n: number): number {
  if (n < 0) throw new Error('Negative number not allowed');
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
```

```typescript
// src/__tests__/calculator.test.ts — 테스트 작성
import { add, divide, fibonacci } from '../calculator';

describe('Calculator', () => {
  describe('add', () => {
    it('should add two positive numbers', () => {
      expect(add(2, 3)).toBe(5);
    });

    it('should handle negative numbers', () => {
      expect(add(-1, 1)).toBe(0);
    });
  });

  describe('divide', () => {
    it('should divide two numbers', () => {
      expect(divide(10, 2)).toBe(5);
    });

    it('should throw on division by zero', () => {
      expect(() => divide(10, 0)).toThrow('Division by zero');
    });
  });

  describe('fibonacci', () => {
    it('should return correct fibonacci numbers', () => {
      expect(fibonacci(0)).toBe(0);
      expect(fibonacci(1)).toBe(1);
      expect(fibonacci(10)).toBe(55);
    });

    it('should throw on negative input', () => {
      expect(() => fibonacci(-1)).toThrow('Negative number not allowed');
    });
  });
});
```

```yaml
# .github/workflows/ci.yml — CI 파이프라인
name: CI Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

# 같은 브랜치에서 새 Push가 오면 이전 실행을 취소
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  # ── 코드 품질 검사 (빠른 피드백) ──
  quality:
    name: Code Quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npx eslint src/ --max-warnings 0

      - name: Type check
        run: npx tsc --noEmit

      - name: Format check
        run: npx prettier --check "src/**/*.ts"

  # ── 빌드 ──
  build:
    name: Build
    needs: quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npx tsc

      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
          retention-days: 3

  # ── 테스트 ──
  test:
    name: Test
    needs: quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests with coverage
        run: npx jest --coverage --ci

      - name: Upload coverage report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: coverage
          path: coverage/
```

```bash
# 6. package.json scripts 추가
# (package.json의 scripts 섹션)
# "scripts": {
#   "build": "tsc",
#   "test": "jest",
#   "lint": "eslint src/ --max-warnings 0",
#   "format": "prettier --check \"src/**/*.ts\""
# }

# 7. 커밋하고 Push
git add .
git commit -m "feat: initial project with CI pipeline"
git push origin main

# 8. GitHub에서 Actions 탭에서 CI 실행 확인!
```

---

### 실습 2: 병렬 + 캐싱 최적화 CI

더 현실적인 프로젝트에서 성능을 최적화하는 CI를 만들어봐요.

```yaml
# .github/workflows/ci-optimized.yml
name: CI (Optimized)

on:
  pull_request:
    branches: [main]

concurrency:
  group: ci-${{ github.head_ref }}
  cancel-in-progress: true

env:
  NODE_VERSION: '20'

jobs:
  # ── 의존성 설치 + 캐시 (한 번만!) ──
  install:
    name: Install Dependencies
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Cache node_modules
        id: cache
        uses: actions/cache@v4
        with:
          path: node_modules
          key: deps-${{ runner.os }}-${{ hashFiles('package-lock.json') }}

      - name: Install dependencies
        if: steps.cache.outputs.cache-hit != 'true'
        run: npm ci

  # ── 병렬 검사 (의존성 설치 후) ──
  lint:
    name: Lint
    needs: install
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      - uses: actions/cache@v4
        with:
          path: node_modules
          key: deps-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
      - run: npm run lint

  typecheck:
    name: Type Check
    needs: install
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      - uses: actions/cache@v4
        with:
          path: node_modules
          key: deps-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
      - run: npx tsc --noEmit

  security:
    name: Security Audit
    needs: install
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      - uses: actions/cache@v4
        with:
          path: node_modules
          key: deps-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
      - run: npm audit --audit-level=high

  # ── 빌드 (병렬 검사 모두 통과 후) ──
  build:
    name: Build
    needs: [lint, typecheck]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      - uses: actions/cache@v4
        with:
          path: node_modules
          key: deps-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: build
          path: dist/

  # ── 테스트 (빌드 후 병렬) ──
  unit-test:
    name: Unit Tests (${{ matrix.shard }}/3)
    needs: build
    runs-on: ubuntu-latest
    strategy:
      matrix:
        shard: [1, 2, 3]               # 테스트를 3등분
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      - uses: actions/cache@v4
        with:
          path: node_modules
          key: deps-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
      - run: npx jest --shard=${{ matrix.shard }}/3 --ci

  integration-test:
    name: Integration Tests
    needs: build
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: testdb
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        ports:
          - 6379:6379
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      - uses: actions/cache@v4
        with:
          path: node_modules
          key: deps-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
      - run: npm run test:integration
        env:
          DATABASE_URL: postgres://test:test@localhost:5432/testdb
          REDIS_URL: redis://localhost:6379
```

---

### 실습 3: GitLab CI 파이프라인 구축

GitLab을 사용하는 팀을 위한 CI 파이프라인이에요.

```yaml
# .gitlab-ci.yml
stages:
  - install
  - validate
  - build
  - test
  - report

# 전역 캐시 설정
default:
  image: node:20-slim
  cache:
    key:
      files:
        - package-lock.json
    paths:
      - node_modules/
    policy: pull                       # 기본은 캐시를 읽기만

# ── 의존성 설치 (캐시 생성) ──
install:
  stage: install
  cache:
    key:
      files:
        - package-lock.json
    paths:
      - node_modules/
    policy: pull-push                  # 이 Job만 캐시를 생성
  script:
    - npm ci

# ── 병렬 검증 ──
lint:
  stage: validate
  script:
    - npm run lint
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"

typecheck:
  stage: validate
  script:
    - npx tsc --noEmit
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"

# ── 빌드 ──
build:
  stage: build
  script:
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 hour

# ── 테스트 (병렬) ──
unit-test:
  stage: test
  script:
    - npm test -- --coverage --ci
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
  artifacts:
    when: always
    reports:
      junit: junit.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

integration-test:
  stage: test
  services:
    - name: postgres:16
      alias: db
    - name: redis:7
      alias: cache
  variables:
    POSTGRES_DB: testdb
    POSTGRES_USER: test
    POSTGRES_PASSWORD: test
    DATABASE_URL: postgres://test:test@db:5432/testdb
    REDIS_URL: redis://cache:6379
  script:
    - npm run test:integration

# ── 리포트 ──
pages:
  stage: report
  script:
    - mv coverage/lcov-report public
  artifacts:
    paths:
      - public
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

---

### 실습 4: Docker 빌드 CI 파이프라인

컨테이너 기반 프로젝트의 CI 파이프라인이에요.

```yaml
# .github/workflows/ci-docker.yml
name: Docker CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  lint-and-test:
    name: Lint & Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm test -- --ci

  docker-build:
    name: Docker Build & Push
    needs: lint-and-test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4

      # Docker Buildx 설정 (멀티 플랫폼, 캐시 지원)
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      # 컨테이너 레지스트리 로그인
      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      # 이미지 태그 메타데이터
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=
            type=ref,event=branch
            type=ref,event=pr

      # 빌드 + 캐시 + Push
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          # PR에서는 빌드만, main에서는 Push까지

      # 이미지 보안 스캔
      - name: Scan image for vulnerabilities
        if: github.event_name != 'pull_request'
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload scan results
        if: github.event_name != 'pull_request'
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-results.sarif'
```

---

## 🏢 실무에서는?

### 실무 CI 파이프라인 전체 아키텍처

```mermaid
flowchart TD
    DEV["개발자<br/>코드 작성"] -->|"git push"| GIT["Git Repository<br/>(GitHub/GitLab)"]

    GIT -->|"Webhook"| CI["CI 서버<br/>(Actions/GitLab CI)"]

    CI --> S1["Stage 1: Quality Gate"]
    S1 --> LINT["Lint<br/>ESLint, Prettier"]
    S1 --> TYPE["Type Check<br/>TypeScript"]
    S1 --> SEC["Security<br/>npm audit, CodeQL"]

    LINT --> S2["Stage 2: Build"]
    TYPE --> S2
    SEC --> S2
    S2 --> BUILD["Build<br/>tsc, webpack, Docker"]

    BUILD --> S3["Stage 3: Test"]
    S3 --> UNIT["Unit Test<br/>Jest (shard 1/3)"]
    S3 --> UNIT2["Unit Test<br/>Jest (shard 2/3)"]
    S3 --> UNIT3["Unit Test<br/>Jest (shard 3/3)"]
    S3 --> INTEG["Integration Test<br/>DB, Redis 연동"]

    UNIT --> S4["Stage 4: Publish"]
    UNIT2 --> S4
    UNIT3 --> S4
    INTEG --> S4
    S4 --> ARTIFACT["Artifact 저장<br/>Docker → ECR<br/>npm → Registry"]

    ARTIFACT -->|"성공"| NOTIFY_OK["✅ Slack 알림<br/>PR 체크 통과"]
    CI -->|"실패"| NOTIFY_FAIL["❌ Slack 알림<br/>PR 체크 실패"]

    ARTIFACT -->|"main 브랜치"| CD["CD 파이프라인으로<br/>(다음 강의)"]

    style CI fill:#3498db,color:#fff
    style CD fill:#9b59b6,color:#fff
    style NOTIFY_OK fill:#27ae60,color:#fff
    style NOTIFY_FAIL fill:#e74c3c,color:#fff
```

### 기업 규모별 CI 전략

```
스타트업 (5~15명):
─────────────────
- GitHub Actions + 기본 CI
- Lint → Build → Test (직렬 또는 간단한 병렬)
- 캐싱만 적용해도 충분
- Docker 빌드는 필요할 때만
- 예산: GitHub Actions 무료 범위로 충분

중견 기업 (15~100명):
─────────────────────
- GitHub Actions / GitLab CI + 최적화된 CI
- 병렬 실행 + 매트릭스 빌드
- Monorepo라면 영향 범위 분석 필수
- Self-hosted 러너 고려 (비용/성능)
- 보안 스캔(SAST/SCA) 의무화
- 예산: 월 $200~$1,000

대기업 (100명+):
────────────────
- Jenkins / GitLab CI (Self-hosted)
- 전용 CI 인프라 (Kubernetes 기반 러너)
- 멀티 리포/멀티 팀 CI 표준화
- 보안 게이트 의무화 (컴플라이언스)
- 빌드 메트릭 모니터링 대시보드
- CI 전담 DevOps 엔지니어
- 예산: 월 $5,000~$50,000+
```

### 실무 팁

```
🔑 CI 성공을 위한 핵심 원칙:

1. "빌드가 깨지면 최우선으로 고쳐라"
   - 깨진 빌드를 방치하면 모든 개발자가 영향받아요
   - "빌드 수리 당번"을 정하는 팀도 있어요

2. "CI를 무시하는 문화를 만들지 마라"
   - CI가 느리면 사람들이 무시하기 시작해요
   - 10분 이내를 목표로 최적화하세요

3. "main 브랜치는 항상 배포 가능한 상태"
   - Branch Protection Rule 필수 설정
   - CI 통과 없이 merge 불가능하게

4. "테스트 커버리지를 맹신하지 마라"
   - 커버리지 80%가 목표가 아니라 최소선
   - 의미 있는 테스트를 작성하는 게 중요해요

5. "Secret을 CI 설정에 하드코딩하지 마라"
   - GitHub Secrets, GitLab CI Variables 사용
   - .env 파일은 절대 커밋하지 않기
```

### Branch Protection과 CI 연동

```yaml
# GitHub Branch Protection Rule 추천 설정:
#
# Settings → Branches → Branch protection rules → main:
#
# ✅ Require a pull request before merging
#    ✅ Require approvals: 1
#    ✅ Dismiss stale pull request approvals when new commits are pushed
#
# ✅ Require status checks to pass before merging
#    ✅ Require branches to be up to date before merging
#    Status checks:
#      - CI Pipeline / quality
#      - CI Pipeline / build
#      - CI Pipeline / test
#
# ✅ Require conversation resolution before merging
#
# ✅ Do not allow bypassing the above settings
```

---

## ⚠️ 자주 하는 실수

### 실수 1: CI 파이프라인이 너무 느림

```yaml
# ❌ 나쁜 예: 모든 것을 순차 실행
jobs:
  ci:
    steps:
      - run: npm ci             # 2분
      - run: npm run lint       # 1분
      - run: npx tsc --noEmit  # 1분
      - run: npm run build     # 3분
      - run: npm test          # 5분
      - run: npm audit         # 1분
      # 총 13분 (순차)

# ✅ 좋은 예: 독립 작업은 병렬로
jobs:
  lint:                          # 3분 (install + lint)
    steps: [checkout, install, lint]
  typecheck:                     # 3분 (install + tsc)
    steps: [checkout, install, tsc]
  security:                      # 3분 (install + audit)
    steps: [checkout, install, audit]
  build:
    needs: [lint, typecheck]     # 4분 (install + build)
    steps: [checkout, install, build]
  test:
    needs: [build]               # 6분 (install + test)
    steps: [checkout, install, test]
  # 총 ~7분 (병렬, 캐싱 적용 시)
```

### 실수 2: 캐시 키를 잘못 설정

```yaml
# ❌ 나쁜 예: 캐시 키가 너무 넓음
- uses: actions/cache@v4
  with:
    path: node_modules
    key: my-cache
    # 모든 브랜치에서 같은 캐시 → lock 파일이 바뀌어도 캐시 사용
    # → 의존성 불일치 발생!

# ❌ 나쁜 예: 캐시 키가 너무 좁음
- uses: actions/cache@v4
  with:
    path: node_modules
    key: ${{ github.sha }}
    # 매 커밋마다 새 캐시 → 캐시 히트율 0%
    # → 캐싱의 의미가 없음!

# ✅ 좋은 예: lock 파일 해시 기반
- uses: actions/cache@v4
  with:
    path: node_modules
    key: deps-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
    restore-keys: |
      deps-${{ runner.os }}-
    # lock 파일이 같으면 캐시 히트 → 빠름
    # lock 파일이 바뀌면 새로 설치 → 정확함
```

### 실수 3: Secret을 로그에 노출

```yaml
# ❌ 나쁜 예: 시크릿을 echo로 출력
- run: echo "Token is ${{ secrets.API_TOKEN }}"
  # GitHub가 자동으로 마스킹하지만, 완전하지 않을 수 있음

# ❌ 나쁜 예: curl 결과에 토큰이 포함
- run: curl -v -H "Authorization: Bearer ${{ secrets.API_TOKEN }}" https://api.example.com
  # -v 옵션으로 헤더가 로그에 출력됨!

# ✅ 좋은 예: 시크릿을 환경 변수로 전달
- run: curl -s -H "Authorization: Bearer $TOKEN" https://api.example.com
  env:
    TOKEN: ${{ secrets.API_TOKEN }}
  # -s (silent) + 환경 변수로 간접 전달
```

### 실수 4: 테스트를 건너뛰거나 비활성화

```yaml
# ❌ 나쁜 예: 빌드가 깨져서 테스트를 스킵
- run: npm test || true
  # 테스트 실패를 무시! CI의 의미가 없어짐

# ❌ 나쁜 예: 특정 테스트를 주석 처리
# it.skip('should validate email', () => {  // "나중에 고칠게요..."
#   expect(validateEmail('bad')).toBe(false);
# });

# ✅ 좋은 예: 테스트가 실패하면 파이프라인도 실패
- run: npm test -- --ci
  # 실패 시 파이프라인 중단 → 고치고 다시 Push
```

### 실수 5: npm install vs npm ci

```yaml
# ❌ 나쁜 예: CI에서 npm install 사용
- run: npm install
  # npm install은 package-lock.json을 수정할 수 있음
  # → 재현 불가능한 빌드, 의존성 불일치

# ✅ 좋은 예: CI에서 npm ci 사용
- run: npm ci
  # npm ci는 package-lock.json을 정확히 따름
  # → 항상 동일한 의존성, 재현 가능한 빌드
  # + node_modules를 삭제 후 설치 → 깨끗한 상태 보장
```

### 실수 6: 빌드 실패를 방치

```
❌ 흔한 안티패턴:

월요일 09:00  개발자 A가 Push → CI 실패 💥
월요일 10:00  "아 나중에 고칠게" → 다른 작업 시작
월요일 14:00  개발자 B가 Push → CI 실패 (A의 코드 때문)
월요일 15:00  개발자 C가 Push → CI 실패 (A의 코드 때문)
화요일 09:00  "CI가 맨날 빨간색이네, 무시하자"
...
1주일 후      CI를 아무도 안 봄. 사실상 CI 없는 상태.

✅ 올바른 대응:

월요일 09:00  개발자 A가 Push → CI 실패 💥
월요일 09:05  Slack 알림 → A가 즉시 확인
월요일 09:15  A가 수정 Push → CI 통과 ✅
              (다른 작업보다 빌드 수정이 최우선!)
```

---

## 📝 마무리

### 배운 내용 요약

```
CI 파이프라인 핵심 정리:

1. CI의 3대 원칙
   - 자주 통합 (하루 여러 번)
   - 빠른 피드백 (10분 이내)
   - 자동화된 검증 (사람이 아닌 기계가)

2. 파이프라인 구성 요소
   Trigger → Checkout → Install → Lint → Build → Test → SAST → Artifact

3. 성능 최적화 3대 전략
   - 캐싱: 의존성 다운로드 시간 70% 절감
   - 병렬화: 독립 작업을 동시 실행으로 50% 절감
   - 영향 범위 분석: 변경된 부분만 빌드

4. CI 도구 선택
   - GitHub 사용 → GitHub Actions
   - GitLab 사용 → GitLab CI
   - 커스텀 필요 → Jenkins
   - 속도 중시 → CircleCI

5. 빌드 실패 관리
   - 빌드 실패 = 최우선 수정 대상
   - Branch Protection으로 깨진 코드 merge 방지
   - Flaky Test는 임시 재시도 + 근본 원인 해결
```

### CI 성숙도 체크리스트

```
레벨 1 — 기초:
  □ CI 파이프라인이 존재한다
  □ Push 시 자동으로 빌드된다
  □ 테스트가 자동으로 실행된다
  □ 빌드 실패 시 알림이 온다

레벨 2 — 중급:
  □ Lint, Type Check이 CI에 포함되어 있다
  □ 의존성 캐싱이 적용되어 있다
  □ 병렬 실행으로 빌드 시간을 최적화했다
  □ Branch Protection Rule이 설정되어 있다
  □ 테스트 커버리지를 측정하고 있다

레벨 3 — 고급:
  □ 보안 스캔(SAST/SCA)이 CI에 포함되어 있다
  □ 테스트 분할(sharding)을 사용하고 있다
  □ Docker 빌드 + 이미지 스캔이 자동화되어 있다
  □ Monorepo 영향 범위 분석이 적용되어 있다
  □ CI 파이프라인이 10분 이내에 완료된다

레벨 4 — 엘리트:
  □ CI 빌드 메트릭을 모니터링하고 있다
  □ Flaky Test 자동 감지 + 리포팅이 되고 있다
  □ 빌드 시간 SLO가 정의되어 있다
  □ CI 설정이 코드로 관리되고 버전 관리된다
  □ CI 파이프라인 자체에 대한 테스트가 있다
```

### 핵심 한 줄 요약

> **CI는 "코드가 항상 건강한 상태인지" 자동으로 확인해주는 시스템이에요.
> 자주 통합하고, 빠르게 피드백받고, 자동으로 검증하세요.
> 그리고 빌드가 깨지면 — 무조건 최우선으로 고치세요.**

---

## 🔗 다음 단계

### 이 강의와 연결되는 내용

```
이전 강의:
← Git 기초 (./01-git-basics)
   - Git의 기본 동작 원리와 명령어
   - CI의 트리거가 되는 push, PR을 이해하기 위한 기초

← 브랜칭 전략 (./02-branching)
   - Git Flow, GitHub Flow, Trunk Based Development
   - 어떤 브랜치 전략이냐에 따라 CI 트리거가 달라져요

다음 강의:
→ CD(Continuous Delivery/Deployment) 파이프라인 (./04-cd-pipeline)
   - CI에서 만든 아티팩트를 자동으로 배포하는 방법
   - 블루-그린, 카나리, 롤링 배포 전략
   - CI와 CD를 연결하는 전체 파이프라인 설계
```

### 추천 학습 자료

```
공식 문서:
- GitHub Actions: https://docs.github.com/actions
- GitLab CI/CD: https://docs.gitlab.com/ee/ci/
- Jenkins Pipeline: https://www.jenkins.io/doc/book/pipeline/

연습 프로젝트:
1. 개인 프로젝트에 GitHub Actions CI 적용하기
2. 매트릭스 빌드로 Node 18/20/22에서 테스트하기
3. Docker 빌드 + 이미지 스캔 파이프라인 만들기
4. Monorepo (Turborepo)에서 영향 범위 빌드 설정하기

심화 주제:
- GitHub Actions Composite Actions (재사용 가능한 액션 만들기)
- Self-hosted Runner 구축 (AWS EC2, Kubernetes)
- CI 메트릭 대시보드 (Grafana + GitHub API)
```

---

> **다음 강의 예고**: [CD 파이프라인](./04-cd-pipeline)에서는 CI로 만든 아티팩트를 어떻게 안전하게 프로덕션에 배포하는지 배워볼 거예요. 블루-그린 배포, 카나리 배포, 롤링 업데이트 같은 전략들을 실습과 함께 알아봐요!
