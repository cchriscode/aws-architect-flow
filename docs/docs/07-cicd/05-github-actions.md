# GitHub Actions 실무

> CI 파이프라인의 개념을 [이전 강의](./03-ci-pipeline)에서, CD 전략을 [CD 강의](./04-cd-pipeline)에서 배웠죠? 이번에는 가장 인기 있는 CI/CD 플랫폼 중 하나인 **GitHub Actions**를 실무 수준으로 다뤄볼 거예요. Workflow YAML 구조부터 시작해서, 트리거, Actions Marketplace, Secrets 관리, Environment 보호, Matrix 전략, 재사용 워크플로우, 그리고 AWS OIDC 배포까지 — 전체를 실습과 함께 알아볼게요.

---

## 🎯 왜 GitHub Actions를/를 알아야 하나요?

### 일상 비유: 자동화된 공장 생산 라인

자동차 공장을 떠올려보세요. 설계 도면(코드)이 완성되면, **자동화된 생산 라인**이 부품 조립(빌드) → 품질 검사(테스트) → 도색과 마감(패키징) → 출하(배포)를 순서대로 처리하죠.

GitHub Actions는 바로 이 **소프트웨어 공장의 자동화 생산 라인**이에요.

- **Workflow** = 공장의 전체 생산 라인 설계도
- **Job** = 각 공정 (조립 공정, 검사 공정, 도색 공정)
- **Step** = 공정 안의 세부 작업 (볼트 조이기, 페인트 뿌리기)
- **Runner** = 실제로 작업을 수행하는 로봇 팔 (GitHub-hosted 또는 Self-hosted)
- **Trigger** = "새 주문이 들어왔다!" 같은 생산 개시 신호
- **Secrets** = 금고에 보관된 공장 출입 카드 (외부에 절대 노출 안 됨)

### 실무에서 GitHub Actions가 필요한 순간

```
실무에서 GitHub Actions가 필요한 순간:
• PR을 올리면 자동으로 빌드/테스트하고 싶어요              → on: pull_request
• main 브랜치에 머지하면 자동 배포하고 싶어요               → on: push + environment
• Node, Python, Go 등 여러 버전에서 동시에 테스트하고 싶어요  → matrix strategy
• AWS에 안전하게 배포하고 싶은데 장기 키는 쓰기 싫어요       → OIDC + assume role
• 여러 저장소에서 같은 CI 로직을 재사용하고 싶어요           → reusable workflows
• 배포 전에 팀장 승인을 받고 싶어요                        → environment protection rules
• 매일 새벽에 보안 스캔을 자동으로 돌리고 싶어요             → on: schedule (cron)
• 빌드 속도를 빠르게 하고 싶어요                           → caching + artifacts
```

[CI 파이프라인](./03-ci-pipeline)에서 배운 개념을 이제 **GitHub Actions로 직접 구현**해볼 거예요.

---

## 🧠 핵심 개념 잡기

GitHub Actions를 이해하려면 핵심 구성 요소 7가지를 먼저 잡아야 해요.

### 비유: 공장 자동화 시스템

| 공장 세계 | GitHub Actions |
|-----------|---------------|
| 전체 생산 라인 설계도 | **Workflow** (YAML 파일) |
| 생산 개시 신호 (새 주문, 정기 생산) | **Event/Trigger** (push, PR, schedule 등) |
| 각 공정 (조립, 검사, 도색) | **Job** (빌드, 테스트, 배포) |
| 공정 안의 세부 작업 | **Step** (checkout, install, test 등) |
| 작업을 수행하는 로봇 팔 | **Runner** (ubuntu-latest, self-hosted 등) |
| 공장 출입 카드/금고 비밀번호 | **Secrets** (API 키, 비밀번호) |
| 마켓에서 구매한 범용 부품 | **Actions** (actions/checkout, actions/cache 등) |

### 전체 구조 한눈에 보기

```mermaid
flowchart TB
    subgraph WF["📄 Workflow (.github/workflows/*.yml)"]
        direction TB

        subgraph TRIGGER["🔔 Event Triggers"]
            PUSH["push"]
            PR["pull_request"]
            SCHEDULE["schedule"]
            MANUAL["workflow_dispatch"]
        end

        subgraph JOB1["🔧 Job: build"]
            direction TB
            S1["Step 1: Checkout 코드"]
            S2["Step 2: Node.js 설정"]
            S3["Step 3: 의존성 설치"]
            S4["Step 4: 빌드"]
        end

        subgraph JOB2["🧪 Job: test"]
            direction TB
            S5["Step 1: Checkout 코드"]
            S6["Step 2: 테스트 실행"]
            S7["Step 3: 커버리지 리포트"]
        end

        subgraph JOB3["🚀 Job: deploy"]
            direction TB
            S8["Step 1: AWS 인증 (OIDC)"]
            S9["Step 2: 배포 실행"]
        end
    end

    TRIGGER --> JOB1
    JOB1 --> JOB2
    JOB2 --> JOB3

    S1 --> S2 --> S3 --> S4
    S5 --> S6 --> S7
    S8 --> S9

    style TRIGGER fill:#3498db,color:#fff
    style JOB1 fill:#2ecc71,color:#fff
    style JOB2 fill:#f39c12,color:#fff
    style JOB3 fill:#e74c3c,color:#fff
```

### Workflow YAML 파일의 위치

```
my-project/
├── .github/
│   └── workflows/           # ← 이 디렉토리 안에 YAML 파일을 넣어요
│       ├── ci.yml           # CI 워크플로우
│       ├── cd.yml           # CD 워크플로우
│       └── scheduled.yml    # 정기 실행 워크플로우
├── src/
├── tests/
└── package.json
```

> 핵심 포인트: `.github/workflows/` 디렉토리 안의 `.yml` 또는 `.yaml` 파일만 GitHub Actions가 인식해요. 파일 이름은 자유롭게 지을 수 있어요.

---

## 🔍 하나씩 자세히 알아보기

### 1. Workflow YAML 구조

GitHub Actions의 모든 것은 YAML 파일로 정의돼요. 기본 구조를 살펴볼게요.

```yaml
# .github/workflows/ci.yml

# ─────────────────────────────────────────────
# 1) Workflow 이름 (GitHub UI에 표시)
# ─────────────────────────────────────────────
name: CI Pipeline

# ─────────────────────────────────────────────
# 2) 언제 실행할지 (Event Trigger)
# ─────────────────────────────────────────────
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

# ─────────────────────────────────────────────
# 3) 환경 변수 (Workflow 전체에서 사용)
# ─────────────────────────────────────────────
env:
  NODE_VERSION: '20'
  CI: true

# ─────────────────────────────────────────────
# 4) 권한 설정 (GITHUB_TOKEN 범위)
# ─────────────────────────────────────────────
permissions:
  contents: read
  pull-requests: write

# ─────────────────────────────────────────────
# 5) 동시 실행 제어
# ─────────────────────────────────────────────
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

# ─────────────────────────────────────────────
# 6) Job 정의
# ─────────────────────────────────────────────
jobs:
  build:
    name: Build & Test
    runs-on: ubuntu-latest       # Runner 선택

    steps:
      - name: Checkout code       # Step 이름
        uses: actions/checkout@v4 # Action 사용

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:                     # Action에 전달할 입력값
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci               # 쉘 명령어 실행

      - name: Run tests
        run: npm test
```

이 YAML의 각 레벨이 무엇을 의미하는지 정리해볼게요.

| 레벨 | 키워드 | 역할 | 비유 |
|-------|--------|------|------|
| 최상위 | `name` | 워크플로우 이름 | 생산 라인 이름 |
| 최상위 | `on` | 트리거 이벤트 | 생산 개시 조건 |
| 최상위 | `env` | 전역 환경 변수 | 공장 전체 설정값 |
| 최상위 | `permissions` | GITHUB_TOKEN 권한 | 보안 출입 등급 |
| 최상위 | `concurrency` | 동시 실행 제어 | 같은 라인에 제품 2개 동시 투입 방지 |
| 최상위 | `jobs` | Job 목록 | 공정 목록 |
| Job 내 | `runs-on` | 실행 환경 | 어떤 로봇 팔을 쓸지 |
| Job 내 | `steps` | 실행할 Step 목록 | 세부 작업 순서 |
| Step 내 | `uses` | Action 사용 | 마켓에서 산 부품 장착 |
| Step 내 | `run` | 쉘 명령어 실행 | 직접 손으로 작업 |
| Step 내 | `with` | Action 입력값 | 부품에 전달할 설정값 |

---

### 2. Event Triggers (이벤트 트리거)

"언제 워크플로우를 실행할까?"를 정의하는 부분이에요. GitHub Actions는 30개 이상의 이벤트를 지원해요.

```mermaid
flowchart LR
    subgraph CODE["코드 이벤트"]
        PUSH["push<br/>코드 푸시"]
        PR_EVENT["pull_request<br/>PR 생성/업데이트"]
        PR_TARGET["pull_request_target<br/>외부 PR (fork)"]
    end

    subgraph SCHEDULE["시간 이벤트"]
        CRON["schedule<br/>크론 표현식"]
    end

    subgraph MANUAL["수동 이벤트"]
        DISPATCH["workflow_dispatch<br/>수동 실행 (UI/API)"]
        CALL["workflow_call<br/>다른 워크플로우에서 호출"]
    end

    subgraph OTHER["기타 이벤트"]
        RELEASE_EV["release<br/>릴리스 발행"]
        ISSUE["issues<br/>이슈 생성/수정"]
        TAG["push (tags)<br/>태그 생성"]
    end

    CODE --> WF["🔄 Workflow 실행"]
    SCHEDULE --> WF
    MANUAL --> WF
    OTHER --> WF

    style WF fill:#2ecc71,color:#fff
    style CODE fill:#3498db,color:#fff
    style SCHEDULE fill:#9b59b6,color:#fff
    style MANUAL fill:#f39c12,color:#fff
    style OTHER fill:#e74c3c,color:#fff
```

#### push 이벤트

```yaml
on:
  push:
    # 특정 브랜치에만 반응
    branches:
      - main
      - 'release/**'        # release/1.0, release/2.0 등

    # 특정 브랜치 제외
    branches-ignore:
      - 'experiment/**'

    # 특정 경로의 파일이 변경됐을 때만
    paths:
      - 'src/**'
      - 'package.json'

    # 특정 경로 제외
    paths-ignore:
      - 'docs/**'
      - '**.md'

    # 태그에 반응
    tags:
      - 'v*'                # v1.0.0, v2.1.3 등
```

#### pull_request 이벤트

```yaml
on:
  pull_request:
    branches: [main]
    types:
      - opened              # PR 새로 생성
      - synchronize         # PR에 새 커밋 추가
      - reopened            # 닫혔던 PR 다시 열림
    paths:
      - 'src/**'
      - 'tests/**'
```

> 주의: `pull_request`의 기본 types는 `[opened, synchronize, reopened]`이에요. `labeled`, `closed` 등을 쓰려면 명시적으로 지정해야 해요.

#### schedule 이벤트 (크론)

```yaml
on:
  schedule:
    # ┌───────────── minute (0-59)
    # │ ┌───────────── hour (0-23)
    # │ │ ┌───────────── day of month (1-31)
    # │ │ │ ┌───────────── month (1-12)
    # │ │ │ │ ┌───────────── day of week (0-6, 0=Sunday)
    # │ │ │ │ │
    - cron: '30 2 * * 1-5'   # 월~금 오전 2시 30분 (UTC)
    - cron: '0 9 * * 1'      # 매주 월요일 오전 9시 (UTC)
```

> 주의: schedule의 시간은 **UTC** 기준이에요. 한국 시간(KST)은 UTC+9이므로, 한국 새벽 2시에 돌리려면 UTC 17시(전날)로 설정해야 해요.

#### workflow_dispatch (수동 실행)

```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        description: '배포 대상 환경'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production

      version:
        description: '배포 버전 (예: v1.2.3)'
        required: false
        type: string

      dry_run:
        description: '테스트 모드 (실제 배포하지 않음)'
        required: false
        type: boolean
        default: false
```

수동 실행 시 전달받은 입력값은 `${{ github.event.inputs.environment }}` 으로 참조해요.

#### 복합 트리거

```yaml
# 여러 이벤트를 동시에 지정할 수 있어요
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 0'     # 매주 일요일 자정
  workflow_dispatch:          # 수동 실행도 가능
```

---

### 3. Jobs와 Steps

#### Job 기본 구조

```yaml
jobs:
  # Job ID (영문, 숫자, -, _ 사용 가능)
  build:
    name: Build Application        # GitHub UI에 표시되는 이름
    runs-on: ubuntu-latest         # Runner 선택
    timeout-minutes: 15            # 최대 실행 시간 (기본 360분)

    # 이 Job의 환경 변수
    env:
      BUILD_ENV: production

    steps:
      - uses: actions/checkout@v4
      - run: echo "Hello, World!"

  test:
    name: Run Tests
    runs-on: ubuntu-latest
    needs: build                    # build Job이 성공해야 실행

    steps:
      - uses: actions/checkout@v4
      - run: npm test

  deploy:
    name: Deploy
    runs-on: ubuntu-latest
    needs: [build, test]            # build와 test 둘 다 성공해야 실행
    if: github.ref == 'refs/heads/main'  # main 브랜치일 때만

    steps:
      - run: echo "Deploying..."
```

#### Job 간 의존 관계

```mermaid
flowchart LR
    subgraph PARALLEL["병렬 실행"]
        LINT["lint"]
        TYPECHECK["typecheck"]
    end

    BUILD["build"] --> PARALLEL
    LINT --> TEST["test"]
    TYPECHECK --> TEST
    TEST --> DEPLOY_STG["deploy-staging"]
    DEPLOY_STG --> APPROVE{"수동 승인<br/>(environment)"}
    APPROVE --> DEPLOY_PROD["deploy-production"]

    style BUILD fill:#3498db,color:#fff
    style LINT fill:#2ecc71,color:#fff
    style TYPECHECK fill:#2ecc71,color:#fff
    style TEST fill:#f39c12,color:#fff
    style DEPLOY_STG fill:#e67e22,color:#fff
    style APPROVE fill:#9b59b6,color:#fff
    style DEPLOY_PROD fill:#e74c3c,color:#fff
```

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build

  lint:
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v4
      - run: npm run lint

  typecheck:
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v4
      - run: npm run typecheck

  test:
    runs-on: ubuntu-latest
    needs: [lint, typecheck]         # lint와 typecheck 둘 다 끝나야 실행
    steps:
      - uses: actions/checkout@v4
      - run: npm test

  deploy-staging:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - run: echo "Deploying to staging..."

  deploy-production:
    runs-on: ubuntu-latest
    needs: deploy-staging
    environment: production           # 승인 필요!
    steps:
      - run: echo "Deploying to production..."
```

#### Step 상세

Step은 두 가지 방식으로 정의해요.

```yaml
steps:
  # 방식 1: Action 사용 (uses)
  - name: Checkout code
    uses: actions/checkout@v4       # {owner}/{repo}@{ref}
    with:                           # Action에 전달할 입력값
      fetch-depth: 0                # 전체 Git 히스토리

  # 방식 2: 쉘 명령어 (run)
  - name: Install dependencies
    run: |
      npm ci
      echo "설치 완료!"
    shell: bash                     # 기본값 (생략 가능)
    working-directory: ./frontend   # 실행 디렉토리 지정

  # Step 간 데이터 전달 (Output)
  - name: Get version
    id: version                     # 다른 Step에서 참조할 ID
    run: |
      VERSION=$(node -p "require('./package.json').version")
      echo "app_version=$VERSION" >> "$GITHUB_OUTPUT"

  - name: Use version
    run: echo "Version is ${{ steps.version.outputs.app_version }}"

  # 조건부 실행
  - name: Only on main branch
    if: github.ref == 'refs/heads/main'
    run: echo "This is main branch"

  # 항상 실행 (이전 Step이 실패해도)
  - name: Cleanup
    if: always()
    run: echo "Cleaning up..."

  # 이전 Step이 실패했을 때만 실행
  - name: Notify failure
    if: failure()
    run: echo "Something went wrong!"
```

#### Job 간 데이터 전달 (outputs)

```yaml
jobs:
  prepare:
    runs-on: ubuntu-latest
    # Job의 출력값 정의
    outputs:
      version: ${{ steps.get_version.outputs.version }}
      should_deploy: ${{ steps.check.outputs.deploy }}

    steps:
      - uses: actions/checkout@v4

      - name: Get version
        id: get_version
        run: echo "version=1.2.3" >> "$GITHUB_OUTPUT"

      - name: Check deployment
        id: check
        run: echo "deploy=true" >> "$GITHUB_OUTPUT"

  deploy:
    runs-on: ubuntu-latest
    needs: prepare
    if: needs.prepare.outputs.should_deploy == 'true'

    steps:
      - run: echo "Deploying version ${{ needs.prepare.outputs.version }}"
```

---

### 4. Runner (실행 환경)

Runner는 워크플로우가 실제로 실행되는 머신이에요.

#### GitHub-hosted Runner

GitHub에서 제공하는 가상 머신이에요. 매 Job마다 깨끗한 환경에서 시작해요.

```yaml
jobs:
  linux-job:
    runs-on: ubuntu-latest         # Ubuntu 22.04
    # runs-on: ubuntu-24.04        # 특정 버전 지정

  macos-job:
    runs-on: macos-latest          # macOS (Apple Silicon)
    # runs-on: macos-13            # Intel Mac 지정

  windows-job:
    runs-on: windows-latest        # Windows Server 2022
```

| Runner | vCPU | RAM | 스토리지 | 용도 |
|--------|------|-----|---------|------|
| `ubuntu-latest` | 4 | 16GB | 14GB SSD | 대부분의 CI/CD |
| `macos-latest` | 3 (M1) | 7GB | 14GB SSD | iOS/macOS 빌드 |
| `windows-latest` | 4 | 16GB | 14GB SSD | .NET/Windows 빌드 |

#### Self-hosted Runner

자체 서버를 Runner로 등록해서 사용할 수 있어요.

```yaml
jobs:
  deploy:
    # Self-hosted runner 사용
    runs-on: [self-hosted, linux, x64]

    # 또는 Label로 지정
    # runs-on: [self-hosted, gpu]          # GPU가 있는 Runner
    # runs-on: [self-hosted, production]   # 프로덕션 네트워크 접근 가능한 Runner
```

Self-hosted Runner가 필요한 경우:
- 내부 네트워크(VPC)에 접근해야 할 때
- 특수 하드웨어(GPU, ARM)가 필요할 때
- GitHub-hosted Runner의 스펙이 부족할 때
- 보안 정책상 외부 Runner를 쓸 수 없을 때

---

### 5. Actions Marketplace

Actions는 **재사용 가능한 단위 작업**이에요. 직접 만들 수도 있고, Marketplace에서 검증된 Action을 가져다 쓸 수도 있어요.

#### 자주 쓰는 공식 Actions

```yaml
steps:
  # 1. 코드 체크아웃 (거의 모든 워크플로우에서 사용)
  - uses: actions/checkout@v4
    with:
      fetch-depth: 0               # 전체 히스토리 (0), 최신 커밋만 (1, 기본)
      token: ${{ secrets.PAT }}    # private submodule이 있을 때

  # 2. Node.js 설정
  - uses: actions/setup-node@v4
    with:
      node-version: '20'
      cache: 'npm'                 # node_modules 캐시 자동 관리

  # 3. Python 설정
  - uses: actions/setup-python@v5
    with:
      python-version: '3.12'
      cache: 'pip'

  # 4. Java 설정
  - uses: actions/setup-java@v4
    with:
      distribution: 'temurin'
      java-version: '21'
      cache: 'gradle'

  # 5. Go 설정
  - uses: actions/setup-go@v5
    with:
      go-version: '1.22'
      cache: true

  # 6. Docker Buildx 설정
  - uses: docker/setup-buildx-action@v3

  # 7. Docker Hub 로그인
  - uses: docker/login-action@v3
    with:
      username: ${{ secrets.DOCKERHUB_USERNAME }}
      password: ${{ secrets.DOCKERHUB_TOKEN }}

  # 8. Docker 이미지 빌드 & 푸시
  - uses: docker/build-push-action@v6
    with:
      push: true
      tags: myapp:latest
      cache-from: type=gha          # GitHub Actions 캐시 사용
      cache-to: type=gha,mode=max

  # 9. AWS 인증 (OIDC)
  - uses: aws-actions/configure-aws-credentials@v4
    with:
      role-to-assume: arn:aws:iam::123456789012:role/GitHubActions
      aws-region: ap-northeast-2

  # 10. Terraform 설정
  - uses: hashicorp/setup-terraform@v3
    with:
      terraform_version: 1.7.0
```

#### Action 버전 지정 방법

```yaml
# 방법 1: 태그 (권장 - 메이저 버전 고정)
- uses: actions/checkout@v4          # v4.x.x 중 최신

# 방법 2: 정확한 태그
- uses: actions/checkout@v4.1.7      # 정확한 버전 고정

# 방법 3: SHA (가장 안전 - supply chain attack 방지)
- uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11

# 방법 4: 브랜치 (비권장 - 불안정)
- uses: actions/checkout@main        # 변경될 수 있어 위험!
```

> 실무 팁: 보안이 중요한 프로젝트에서는 SHA로 고정하고, Dependabot으로 자동 업데이트하는 것이 가장 안전해요.

---

### 6. Secrets와 Variables 관리

#### Secrets (비밀값)

Secrets는 암호화되어 저장되고, 로그에 마스킹되어 출력돼요.

```yaml
# Secret 사용 방법
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to server
        run: |
          echo "Deploying..."
          curl -X POST ${{ secrets.DEPLOY_URL }} \
            -H "Authorization: Bearer ${{ secrets.DEPLOY_TOKEN }}"
        env:
          # 환경 변수로 전달하는 것이 더 안전해요
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          API_KEY: ${{ secrets.API_KEY }}
```

Secret 설정 위치:

| 수준 | 적용 범위 | 설정 경로 |
|------|----------|----------|
| Repository | 해당 저장소만 | Settings → Secrets and variables → Actions |
| Environment | 특정 환경만 | Settings → Environments → [환경명] → Secrets |
| Organization | 조직 내 선택된 저장소 | Organization Settings → Secrets |

#### Variables (변수)

Secrets와 달리 암호화되지 않는 일반 설정값이에요.

```yaml
# Variable 사용 방법
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Build
        run: |
          echo "Building for ${{ vars.DEPLOY_REGION }}"
          echo "App name: ${{ vars.APP_NAME }}"
```

#### GITHUB_TOKEN (자동 제공)

GitHub가 워크플로우 실행 시 자동으로 제공하는 토큰이에요.

```yaml
permissions:
  contents: read           # 코드 읽기
  pull-requests: write     # PR 코멘트 작성
  issues: write            # 이슈 코멘트 작성
  packages: write          # GHCR 패키지 푸시
  id-token: write          # OIDC 토큰 발급 (AWS 인증에 필요!)

jobs:
  comment:
    runs-on: ubuntu-latest
    steps:
      - name: Comment on PR
        uses: actions/github-script@v7
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '빌드 성공! ✅'
            })
```

---

### 7. Environments (환경)와 Protection Rules

Environment는 배포 대상 환경을 정의하고, 보호 규칙을 설정할 수 있어요.

```yaml
jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    environment:
      name: staging
      url: https://staging.myapp.com    # GitHub UI에 링크 표시

    steps:
      - name: Deploy to staging
        run: echo "Deploying to staging..."
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}  # staging용 Secret

  deploy-production:
    runs-on: ubuntu-latest
    needs: deploy-staging
    environment:
      name: production
      url: https://myapp.com

    steps:
      - name: Deploy to production
        run: echo "Deploying to production..."
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}  # production용 Secret
```

#### Protection Rules 설정

GitHub 웹 UI에서 Settings → Environments → [환경명]에서 설정해요.

| 보호 규칙 | 설명 | 사용 예 |
|-----------|------|---------|
| Required reviewers | 지정된 사람이 승인해야 배포 | production 환경에 팀장 승인 |
| Wait timer | 승인 후 N분 대기 후 실행 | 배포 전 5분 대기 (취소 가능 시간) |
| Deployment branches | 특정 브랜치에서만 배포 가능 | main 브랜치만 production 배포 가능 |
| Custom rules | 외부 API로 승인/거부 | Jira 티켓 상태 확인, 보안 스캔 통과 등 |

```
승인 흐름 예시:

개발자가 main에 머지
    ↓
staging 환경에 자동 배포
    ↓
production 환경 배포 시도
    ↓
🔒 Protection Rule 발동!
    ↓
"김팀장님, 배포 승인 부탁드립니다" (Slack/Email 알림)
    ↓
김팀장 승인 → 5분 대기 (Wait timer) → 배포 시작
```

---

### 8. Matrix Strategy (매트릭스 전략)

여러 환경 조합을 동시에 테스트할 때 사용해요. Node 18, 20, 22에서 동시에 테스트하거나, Ubuntu와 Windows에서 동시에 빌드하는 식이에요.

```yaml
jobs:
  test:
    runs-on: ${{ matrix.os }}

    strategy:
      # 하나가 실패해도 나머지는 계속 실행
      fail-fast: false

      # 동시 실행 수 제한 (API rate limit 방지 등)
      max-parallel: 4

      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node-version: [18, 20, 22]

        # 특정 조합 추가
        include:
          - os: ubuntu-latest
            node-version: 22
            experimental: true         # 추가 변수 정의

        # 특정 조합 제외
        exclude:
          - os: macos-latest
            node-version: 18           # macOS + Node 18 조합은 제외

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}

      - run: npm ci
      - run: npm test
```

이 설정이 만들어내는 조합:

```
총 Job 수: 3 OS × 3 Node - 1 exclude = 8개 Job이 동시 실행!

✅ ubuntu-latest  + Node 18
✅ ubuntu-latest  + Node 20
✅ ubuntu-latest  + Node 22 (experimental: true)
✅ windows-latest + Node 18
✅ windows-latest + Node 20
✅ windows-latest + Node 22
❌ macos-latest   + Node 18 (exclude됨)
✅ macos-latest   + Node 20
✅ macos-latest   + Node 22
```

---

### 9. Caching (캐싱)

빌드 속도를 크게 높여주는 핵심 기능이에요. 의존성을 매번 다시 다운로드하지 않아도 돼요.

#### actions/cache 직접 사용

```yaml
steps:
  - uses: actions/checkout@v4

  # npm 캐시
  - name: Cache node_modules
    uses: actions/cache@v4
    id: npm-cache
    with:
      path: ~/.npm                    # 캐시할 경로
      key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
      restore-keys: |
        ${{ runner.os }}-npm-

  - name: Install dependencies
    if: steps.npm-cache.outputs.cache-hit != 'true'  # 캐시 미스일 때만
    run: npm ci
```

#### setup-* Action의 내장 캐시 (더 간편!)

```yaml
steps:
  # Node.js + npm 캐시 자동 관리
  - uses: actions/setup-node@v4
    with:
      node-version: '20'
      cache: 'npm'                    # 이것만 추가하면 끝!

  # Python + pip 캐시
  - uses: actions/setup-python@v5
    with:
      python-version: '3.12'
      cache: 'pip'

  # Go 모듈 캐시
  - uses: actions/setup-go@v5
    with:
      go-version: '1.22'
      cache: true
```

#### Docker 레이어 캐시

```yaml
steps:
  - uses: docker/setup-buildx-action@v3

  - uses: docker/build-push-action@v6
    with:
      push: true
      tags: myapp:latest
      # GitHub Actions 캐시 백엔드 사용
      cache-from: type=gha
      cache-to: type=gha,mode=max
```

> 캐시 사이즈 제한: 저장소당 최대 10GB. 오래된 캐시는 7일 후 자동 삭제돼요. 용량이 넘으면 가장 오래된 것부터 삭제돼요.

---

### 10. Artifacts (아티팩트)

빌드 결과물, 테스트 리포트 등을 Job 간에 공유하거나 다운로드할 수 있어요.

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build

      # 빌드 결과물 업로드
      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: dist/                  # 업로드할 디렉토리/파일
          retention-days: 7            # 보관 기간 (기본 90일)
          if-no-files-found: error     # 파일 없으면 에러

  deploy:
    runs-on: ubuntu-latest
    needs: build
    steps:
      # 빌드 결과물 다운로드
      - name: Download build artifact
        uses: actions/download-artifact@v4
        with:
          name: build-output
          path: dist/

      - name: Deploy
        run: |
          ls -la dist/
          echo "Deploying build artifacts..."

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm test -- --coverage

      # 테스트 리포트 업로드
      - name: Upload test results
        if: always()                   # 테스트 실패해도 리포트는 올림
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: |
            coverage/
            junit-report.xml
```

---

### 11. Concurrency (동시 실행 제어)

같은 브랜치에 빠르게 여러 번 push하면, 이전 워크플로우를 취소하고 최신 것만 실행할 수 있어요.

```yaml
# Workflow 레벨 concurrency
concurrency:
  # 같은 그룹의 워크플로우가 동시에 실행되지 않음
  group: ${{ github.workflow }}-${{ github.ref }}
  # 대기 중인 이전 실행을 취소
  cancel-in-progress: true

# 또는 Job 레벨에서 설정
jobs:
  deploy:
    runs-on: ubuntu-latest
    concurrency:
      group: deploy-${{ github.event.inputs.environment }}
      cancel-in-progress: false      # 배포는 취소하면 안 됨!
```

일반적인 패턴:

```yaml
# CI (PR 빌드): 이전 실행 취소 OK
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true          # 최신 커밋만 테스트하면 됨

# CD (배포): 취소하면 안 됨!
concurrency:
  group: deploy-production
  cancel-in-progress: false          # 진행 중인 배포는 완료되어야 함
```

---

### 12. Reusable Workflows와 Composite Actions

여러 저장소에서 같은 CI/CD 로직을 재사용하고 싶을 때 사용해요.

#### Reusable Workflow (재사용 워크플로우)

**정의하는 쪽** (`.github/workflows/reusable-build.yml`):

```yaml
# 다른 워크플로우에서 호출할 수 있는 재사용 워크플로우
name: Reusable Build

on:
  workflow_call:                     # ← 이것이 재사용 워크플로우의 핵심!
    inputs:
      node-version:
        description: 'Node.js 버전'
        required: false
        default: '20'
        type: string

      environment:
        description: '배포 환경'
        required: true
        type: string

    secrets:
      deploy-token:
        description: '배포 토큰'
        required: true

    outputs:
      build-version:
        description: '빌드된 버전'
        value: ${{ jobs.build.outputs.version }}

jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      version: ${{ steps.version.outputs.value }}

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ inputs.node-version }}
          cache: 'npm'

      - run: npm ci
      - run: npm run build

      - name: Get version
        id: version
        run: echo "value=$(node -p "require('./package.json').version")" >> "$GITHUB_OUTPUT"

      - name: Deploy
        run: echo "Deploying to ${{ inputs.environment }}"
        env:
          DEPLOY_TOKEN: ${{ secrets.deploy-token }}
```

**호출하는 쪽** (`.github/workflows/ci.yml`):

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]

jobs:
  call-build:
    # 같은 저장소의 재사용 워크플로우 호출
    uses: ./.github/workflows/reusable-build.yml
    with:
      node-version: '20'
      environment: 'staging'
    secrets:
      deploy-token: ${{ secrets.DEPLOY_TOKEN }}

  call-external:
    # 다른 저장소의 재사용 워크플로우 호출
    uses: my-org/shared-workflows/.github/workflows/deploy.yml@main
    with:
      environment: 'production'
    secrets: inherit                  # 모든 Secret 전달

  post-deploy:
    needs: call-build
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deployed version ${{ needs.call-build.outputs.build-version }}"
```

#### Composite Action (합성 액션)

여러 Step을 하나의 Action으로 묶어요.

**정의** (`.github/actions/setup-and-build/action.yml`):

```yaml
name: 'Setup and Build'
description: 'Node.js 설정 + 의존성 설치 + 빌드를 한 번에'

inputs:
  node-version:
    description: 'Node.js 버전'
    required: false
    default: '20'

  build-command:
    description: '빌드 명령어'
    required: false
    default: 'npm run build'

outputs:
  build-path:
    description: '빌드 출력 경로'
    value: ${{ steps.build.outputs.path }}

runs:
  using: 'composite'                 # ← Composite Action의 핵심!
  steps:
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ inputs.node-version }}
        cache: 'npm'

    - name: Install dependencies
      shell: bash                    # composite에서는 shell 필수!
      run: npm ci

    - name: Build
      id: build
      shell: bash
      run: |
        ${{ inputs.build-command }}
        echo "path=dist" >> "$GITHUB_OUTPUT"
```

**사용** (`.github/workflows/ci.yml`):

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # 로컬 Composite Action 사용
      - uses: ./.github/actions/setup-and-build
        with:
          node-version: '20'
          build-command: 'npm run build:prod'
```

#### Reusable Workflow vs Composite Action 비교

| 특성 | Reusable Workflow | Composite Action |
|------|-------------------|------------------|
| 정의 위치 | `.github/workflows/` | 어디든 (`action.yml`) |
| 호출 방법 | `uses:` (Job 레벨) | `uses:` (Step 레벨) |
| 자체 Runner | 있음 (`runs-on` 지정) | 없음 (호출한 Job의 Runner 사용) |
| Secret 전달 | 명시적 전달 또는 `inherit` | 환경 변수로 전달 |
| 중첩 호출 | 최대 4단계 | 최대 10단계 |
| 용도 | 전체 CI/CD 파이프라인 재사용 | 반복되는 Step 묶음 재사용 |

---

### 13. OIDC로 AWS 배포하기

전통적으로 AWS에 접근하려면 Access Key와 Secret Key를 GitHub Secrets에 저장했어요. 하지만 이 방식은 키 유출 위험이 있고, 키 로테이션 관리가 번거로워요.

**OIDC (OpenID Connect)** 를 사용하면 **장기 키 없이** GitHub Actions에서 AWS에 안전하게 접근할 수 있어요.

```mermaid
sequenceDiagram
    participant GA as GitHub Actions
    participant GH as GitHub OIDC Provider
    participant STS as AWS STS
    participant AWS as AWS Services

    GA->>GH: 1. OIDC 토큰 요청
    GH-->>GA: 2. JWT 토큰 발급 (단기, 자동 만료)
    GA->>STS: 3. AssumeRoleWithWebIdentity (JWT 제출)
    Note over STS: Trust Policy 검증<br/>- 올바른 GitHub 저장소인지<br/>- 올바른 브랜치인지
    STS-->>GA: 4. 임시 AWS 자격증명 발급 (1시간)
    GA->>AWS: 5. 임시 자격증명으로 AWS 서비스 호출
    Note over AWS: S3, ECS, Lambda 등
```

#### AWS 측 설정 ([Terraform](../06-iac/02-terraform-basics)으로 작성)

```hcl
# 1. GitHub OIDC Provider 등록
resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

# 2. IAM Role 생성 (GitHub Actions가 Assume할 역할)
resource "aws_iam_role" "github_actions" {
  name = "github-actions-deploy"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            # 특정 저장소만 허용
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            # 특정 저장소의 main 브랜치만 허용
            "token.actions.githubusercontent.com:sub" = "repo:my-org/my-repo:ref:refs/heads/main"
          }
        }
      }
    ]
  })
}

# 3. 필요한 권한 부여 (예: ECS 배포)
resource "aws_iam_role_policy_attachment" "ecs_deploy" {
  role       = aws_iam_role.github_actions.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonECS_FullAccess"
}
```

#### GitHub Actions 워크플로우에서 사용

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest

    # OIDC에 필수! id-token write 권한
    permissions:
      id-token: write
      contents: read

    steps:
      - uses: actions/checkout@v4

      # OIDC로 AWS 인증 (장기 키 불필요!)
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/github-actions-deploy
          aws-region: ap-northeast-2
          # role-session-name: github-actions-${{ github.run_id }}  # 선택사항

      # 이제 AWS CLI를 자유롭게 사용 가능
      - name: Verify AWS identity
        run: aws sts get-caller-identity

      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster my-cluster \
            --service my-service \
            --force-new-deployment
```

OIDC의 장점:

| 항목 | 기존 방식 (Access Key) | OIDC |
|------|----------------------|------|
| 키 관리 | 수동 로테이션 필요 | 자격증명이 자동 만료 (1시간) |
| 유출 위험 | Secret 유출 시 영구적 접근 | 토큰이 단기 유효, 저장소+브랜치 제한 |
| 설정 복잡도 | Secret에 키 저장만 하면 됨 | AWS에 OIDC Provider 등록 필요 |
| 보안 수준 | 보통 | 높음 (Zero Trust에 가까움) |

---

## 💻 직접 해보기

### 실습 1: 기본 CI 워크플로우

Node.js 프로젝트의 기본 CI 파이프라인을 만들어볼게요.

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
    paths-ignore:
      - 'docs/**'
      - '**.md'
  pull_request:
    branches: [main]

# 같은 브랜치의 이전 실행 취소
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  # ─────────────────────────────────────────
  # Job 1: 코드 품질 검사 (lint + typecheck)
  # ─────────────────────────────────────────
  quality:
    name: Code Quality
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run TypeScript check
        run: npm run typecheck

  # ─────────────────────────────────────────
  # Job 2: 테스트 (Matrix로 여러 Node 버전)
  # ─────────────────────────────────────────
  test:
    name: Test (Node ${{ matrix.node-version }})
    runs-on: ubuntu-latest
    needs: quality

    strategy:
      fail-fast: false
      matrix:
        node-version: [18, 20, 22]

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests with coverage
        run: npm test -- --coverage

      # 테스트 결과 업로드 (실패해도)
      - name: Upload coverage
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: coverage-node-${{ matrix.node-version }}
          path: coverage/
          retention-days: 7

  # ─────────────────────────────────────────
  # Job 3: 빌드
  # ─────────────────────────────────────────
  build:
    name: Build
    runs-on: ubuntu-latest
    needs: test

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      # 빌드 결과물 업로드 (배포 Job에서 사용)
      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: build-output
          path: dist/
          retention-days: 1
```

### 실습 2: Docker 빌드 + ECR 푸시 + ECS 배포

```yaml
# .github/workflows/cd.yml
name: CD - Build and Deploy

on:
  push:
    branches: [main]
    paths:
      - 'src/**'
      - 'Dockerfile'
      - 'package.json'

env:
  AWS_REGION: ap-northeast-2
  ECR_REPOSITORY: my-app
  ECS_CLUSTER: my-cluster
  ECS_SERVICE: my-service
  ECS_TASK_DEFINITION: .aws/task-definition.json
  CONTAINER_NAME: my-app

permissions:
  id-token: write
  contents: read

# 배포는 동시에 하나만
concurrency:
  group: deploy-production
  cancel-in-progress: false

jobs:
  # ─────────────────────────────────────────
  # Job 1: Docker 이미지 빌드 & ECR 푸시
  # ─────────────────────────────────────────
  build-and-push:
    name: Build & Push to ECR
    runs-on: ubuntu-latest
    outputs:
      image: ${{ steps.build-image.outputs.image }}

    steps:
      - uses: actions/checkout@v4

      # OIDC로 AWS 인증
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}

      # ECR 로그인
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      # Docker 이미지 빌드 & 푸시
      - name: Build, tag, and push image
        id: build-image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build \
            --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
            --build-arg GIT_SHA=${{ github.sha }} \
            -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG \
            -t $ECR_REGISTRY/$ECR_REPOSITORY:latest \
            .

          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest

          echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> "$GITHUB_OUTPUT"

  # ─────────────────────────────────────────
  # Job 2: Staging 배포
  # ─────────────────────────────────────────
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: build-and-push
    environment:
      name: staging
      url: https://staging.myapp.com

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}

      # Task Definition에 새 이미지 태그 반영
      - name: Update ECS task definition
        id: task-def
        uses: aws-actions/amazon-ecs-render-task-definition@v1
        with:
          task-definition: ${{ env.ECS_TASK_DEFINITION }}
          container-name: ${{ env.CONTAINER_NAME }}
          image: ${{ needs.build-and-push.outputs.image }}

      # ECS 서비스 업데이트
      - name: Deploy to ECS
        uses: aws-actions/amazon-ecs-deploy-task-definition@v2
        with:
          task-definition: ${{ steps.task-def.outputs.task-definition }}
          service: ${{ env.ECS_SERVICE }}-staging
          cluster: ${{ env.ECS_CLUSTER }}
          wait-for-service-stability: true

  # ─────────────────────────────────────────
  # Job 3: Production 배포 (승인 필요)
  # ─────────────────────────────────────────
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [build-and-push, deploy-staging]
    environment:
      name: production
      url: https://myapp.com

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Update ECS task definition
        id: task-def
        uses: aws-actions/amazon-ecs-render-task-definition@v1
        with:
          task-definition: ${{ env.ECS_TASK_DEFINITION }}
          container-name: ${{ env.CONTAINER_NAME }}
          image: ${{ needs.build-and-push.outputs.image }}

      - name: Deploy to ECS
        uses: aws-actions/amazon-ecs-deploy-task-definition@v2
        with:
          task-definition: ${{ steps.task-def.outputs.task-definition }}
          service: ${{ env.ECS_SERVICE }}
          cluster: ${{ env.ECS_CLUSTER }}
          wait-for-service-stability: true
```

### 실습 3: 재사용 워크플로우 활용

여러 마이크로서비스에서 같은 빌드+배포 로직을 공유하는 구조예요.

**공유 워크플로우 저장소** (`my-org/shared-workflows`):

```yaml
# .github/workflows/docker-deploy.yml
name: Reusable Docker Deploy

on:
  workflow_call:
    inputs:
      service-name:
        required: true
        type: string
      dockerfile-path:
        required: false
        type: string
        default: './Dockerfile'
      aws-region:
        required: false
        type: string
        default: 'ap-northeast-2'
      environment:
        required: true
        type: string

    secrets:
      aws-role-arn:
        required: true

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}

    permissions:
      id-token: write
      contents: read

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.aws-role-arn }}
          aws-region: ${{ inputs.aws-region }}

      - name: Login to ECR
        id: ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          context: .
          file: ${{ inputs.dockerfile-path }}
          push: true
          tags: |
            ${{ steps.ecr.outputs.registry }}/${{ inputs.service-name }}:${{ github.sha }}
            ${{ steps.ecr.outputs.registry }}/${{ inputs.service-name }}:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster main-cluster \
            --service ${{ inputs.service-name }}-${{ inputs.environment }} \
            --force-new-deployment
```

**각 마이크로서비스에서 호출**:

```yaml
# user-service/.github/workflows/deploy.yml
name: Deploy User Service

on:
  push:
    branches: [main]

jobs:
  deploy-staging:
    uses: my-org/shared-workflows/.github/workflows/docker-deploy.yml@main
    with:
      service-name: user-service
      environment: staging
    secrets:
      aws-role-arn: ${{ secrets.AWS_ROLE_ARN }}

  deploy-production:
    needs: deploy-staging
    uses: my-org/shared-workflows/.github/workflows/docker-deploy.yml@main
    with:
      service-name: user-service
      environment: production
    secrets:
      aws-role-arn: ${{ secrets.AWS_ROLE_ARN }}
```

```yaml
# order-service/.github/workflows/deploy.yml
name: Deploy Order Service

on:
  push:
    branches: [main]

jobs:
  deploy-staging:
    uses: my-org/shared-workflows/.github/workflows/docker-deploy.yml@main
    with:
      service-name: order-service
      environment: staging
    secrets:
      aws-role-arn: ${{ secrets.AWS_ROLE_ARN }}
```

### 실습 4: 완전한 CI/CD 파이프라인 (Build → Test → Deploy)

실무에서 바로 사용할 수 있는 완전한 파이프라인이에요.

```yaml
# .github/workflows/pipeline.yml
name: Full CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  workflow_dispatch:
    inputs:
      skip-tests:
        description: '테스트 건너뛰기 (긴급 배포용)'
        type: boolean
        default: false

env:
  NODE_VERSION: '20'
  AWS_REGION: ap-northeast-2

permissions:
  contents: read
  pull-requests: write
  id-token: write

concurrency:
  group: pipeline-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}

jobs:
  # ═══════════════════════════════════════════
  # Stage 1: 코드 품질 (병렬)
  # ═══════════════════════════════════════════
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  typecheck:
    name: Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run typecheck

  security:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm audit --audit-level=high

  # ═══════════════════════════════════════════
  # Stage 2: 테스트 (Matrix)
  # ═══════════════════════════════════════════
  test:
    name: Test (Node ${{ matrix.node-version }})
    runs-on: ubuntu-latest
    needs: [lint, typecheck]
    if: ${{ !inputs.skip-tests }}

    strategy:
      fail-fast: false
      matrix:
        node-version: [18, 20, 22]

    services:
      # 테스트용 PostgreSQL 컨테이너
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: testdb
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      # 테스트용 Redis 컨테이너
      redis:
        image: redis:7
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - run: npm ci

      - name: Run unit tests
        run: npm run test:unit -- --coverage
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/testdb
          REDIS_URL: redis://localhost:6379

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/testdb
          REDIS_URL: redis://localhost:6379

      - name: Upload coverage
        if: matrix.node-version == 20 && always()
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/

  # ═══════════════════════════════════════════
  # Stage 3: 빌드
  # ═══════════════════════════════════════════
  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [test, security]
    # test가 skip되어도 security가 성공하면 빌드 진행
    if: |
      always() &&
      (needs.test.result == 'success' || needs.test.result == 'skipped') &&
      needs.security.result == 'success'

    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}
      version: ${{ steps.version.outputs.value }}

    steps:
      - uses: actions/checkout@v4

      - name: Get version
        id: version
        run: echo "value=$(node -p "require('./package.json').version")-${{ github.sha }}" >> "$GITHUB_OUTPUT"

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to ECR
        id: ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Docker meta
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ steps.ecr.outputs.registry }}/my-app
          tags: |
            type=sha,prefix=
            type=raw,value=latest,enable={{is_default_branch}}

      - uses: docker/setup-buildx-action@v3

      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          context: .
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # ═══════════════════════════════════════════
  # Stage 4: Staging 배포
  # ═══════════════════════════════════════════
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment:
      name: staging
      url: https://staging.myapp.com

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Deploy to ECS (staging)
        run: |
          aws ecs update-service \
            --cluster main-cluster \
            --service my-app-staging \
            --force-new-deployment

      - name: Wait for deployment stability
        run: |
          aws ecs wait services-stable \
            --cluster main-cluster \
            --services my-app-staging

      - name: Health check
        run: |
          for i in $(seq 1 10); do
            STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://staging.myapp.com/health)
            if [ "$STATUS" = "200" ]; then
              echo "Health check passed!"
              exit 0
            fi
            echo "Attempt $i: status $STATUS, retrying in 10s..."
            sleep 10
          done
          echo "Health check failed!"
          exit 1

  # ═══════════════════════════════════════════
  # Stage 5: Production 배포 (승인 필요)
  # ═══════════════════════════════════════════
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: deploy-staging
    environment:
      name: production
      url: https://myapp.com

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Deploy to ECS (production)
        run: |
          aws ecs update-service \
            --cluster main-cluster \
            --service my-app-production \
            --force-new-deployment

      - name: Wait for deployment stability
        run: |
          aws ecs wait services-stable \
            --cluster main-cluster \
            --services my-app-production

      - name: Verify deployment
        run: |
          for i in $(seq 1 10); do
            STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://myapp.com/health)
            if [ "$STATUS" = "200" ]; then
              echo "Production deployment verified!"
              exit 0
            fi
            echo "Attempt $i: status $STATUS, retrying in 15s..."
            sleep 15
          done
          echo "Production health check failed!"
          exit 1

  # ═══════════════════════════════════════════
  # 알림: 배포 결과 Slack 전송
  # ═══════════════════════════════════════════
  notify:
    name: Notify
    runs-on: ubuntu-latest
    needs: [deploy-production]
    if: always()

    steps:
      - name: Notify Slack
        uses: slackapi/slack-github-action@v2
        with:
          webhook: ${{ secrets.SLACK_WEBHOOK_URL }}
          webhook-type: incoming-webhook
          payload: |
            {
              "text": "${{ needs.deploy-production.result == 'success' && 'Production 배포 성공!' || 'Production 배포 실패!' }}",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*${{ github.repository }}* 배포 결과\n결과: `${{ needs.deploy-production.result }}`\n브랜치: `${{ github.ref_name }}`\n커밋: `${{ github.sha }}`"
                  }
                }
              ]
            }
```

이 파이프라인의 전체 흐름을 다이어그램으로 보면:

```mermaid
flowchart TB
    subgraph TRIGGER["트리거"]
        PUSH_MAIN["push to main"]
        PUSH_DEV["push to develop"]
        PR_MAIN["PR to main"]
        MANUAL["수동 실행"]
    end

    subgraph STAGE1["Stage 1: 코드 품질 (병렬)"]
        LINT["lint"]
        TYPE["typecheck"]
        SEC["security scan"]
    end

    subgraph STAGE2["Stage 2: 테스트 (Matrix)"]
        T18["test Node 18"]
        T20["test Node 20"]
        T22["test Node 22"]
    end

    subgraph STAGE3["Stage 3: 빌드"]
        BUILD["Docker build<br/>+ ECR push"]
    end

    subgraph STAGE4["Stage 4: Staging"]
        STG["deploy-staging<br/>+ health check"]
    end

    subgraph STAGE5["Stage 5: Production"]
        APPROVE{"승인 대기<br/>(environment)"}
        PROD["deploy-production<br/>+ health check"]
    end

    NOTIFY["Slack 알림"]

    TRIGGER --> STAGE1
    LINT --> STAGE2
    TYPE --> STAGE2
    SEC --> BUILD
    STAGE2 --> BUILD
    BUILD --> STG
    STG --> APPROVE
    APPROVE --> PROD
    PROD --> NOTIFY

    style TRIGGER fill:#3498db,color:#fff
    style LINT fill:#2ecc71,color:#fff
    style TYPE fill:#2ecc71,color:#fff
    style SEC fill:#2ecc71,color:#fff
    style T18 fill:#f39c12,color:#fff
    style T20 fill:#f39c12,color:#fff
    style T22 fill:#f39c12,color:#fff
    style BUILD fill:#9b59b6,color:#fff
    style STG fill:#e67e22,color:#fff
    style APPROVE fill:#e74c3c,color:#fff
    style PROD fill:#e74c3c,color:#fff
    style NOTIFY fill:#1abc9c,color:#fff
```

---

## 🏢 실무에서는?

### 실무 패턴 1: 모노레포 경로 기반 트리거

```yaml
# 모노레포에서 변경된 서비스만 빌드/배포
name: Monorepo CI

on:
  push:
    branches: [main]

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      frontend: ${{ steps.changes.outputs.frontend }}
      backend: ${{ steps.changes.outputs.backend }}
      infra: ${{ steps.changes.outputs.infra }}

    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v3
        id: changes
        with:
          filters: |
            frontend:
              - 'apps/frontend/**'
            backend:
              - 'apps/backend/**'
            infra:
              - 'infra/**'

  build-frontend:
    needs: detect-changes
    if: needs.detect-changes.outputs.frontend == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Building frontend..."

  build-backend:
    needs: detect-changes
    if: needs.detect-changes.outputs.backend == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Building backend..."

  deploy-infra:
    needs: detect-changes
    if: needs.detect-changes.outputs.infra == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Applying Terraform..."
```

### 실무 패턴 2: PR 자동 리뷰 코멘트

```yaml
name: PR Checks

on:
  pull_request:
    branches: [main]

permissions:
  pull-requests: write
  contents: read

jobs:
  pr-size-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Check PR size
        uses: actions/github-script@v7
        with:
          script: |
            const { data: files } = await github.rest.pulls.listFiles({
              owner: context.repo.owner,
              repo: context.repo.repo,
              pull_number: context.issue.number,
            });

            const totalChanges = files.reduce((sum, f) => sum + f.changes, 0);

            let label, comment;
            if (totalChanges > 500) {
              label = 'size/XL';
              comment = '이 PR은 변경사항이 500줄 이상이에요. 작은 단위로 나눠주세요.';
            } else if (totalChanges > 200) {
              label = 'size/L';
              comment = '변경사항이 많아요. 리뷰에 시간이 걸릴 수 있어요.';
            } else {
              label = 'size/M';
              comment = '리뷰하기 좋은 크기의 PR이에요!';
            }

            await github.rest.issues.addLabels({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              labels: [label],
            });

            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: `📊 **PR 크기 분석**: ${totalChanges}줄 변경 (${files.length}개 파일)\n\n${comment}`,
            });
```

### 실무 패턴 3: 스케줄 기반 보안/의존성 점검

```yaml
name: Weekly Security Scan

on:
  schedule:
    - cron: '0 0 * * 1'    # 매주 월요일 00:00 UTC (한국 09:00)
  workflow_dispatch:

jobs:
  dependency-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: npm ci

      - name: Run audit
        id: audit
        run: |
          npm audit --json > audit-report.json 2>&1 || true
          VULNS=$(cat audit-report.json | jq '.metadata.vulnerabilities.high + .metadata.vulnerabilities.critical')
          echo "high_critical=$VULNS" >> "$GITHUB_OUTPUT"

      - name: Create issue if vulnerabilities found
        if: steps.audit.outputs.high_critical > 0
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `보안 취약점 발견: ${process.env.VULNS}개 (high/critical)`,
              body: '주간 보안 스캔에서 high/critical 취약점이 발견되었습니다.\n\n`npm audit`을 실행하여 확인해주세요.',
              labels: ['security', 'urgent'],
            });
        env:
          VULNS: ${{ steps.audit.outputs.high_critical }}
```

### 실무 패턴 4: Terraform + GitHub Actions 연동

[Terraform](../06-iac/02-terraform-basics)과 GitHub Actions를 연동하면 인프라 변경도 PR 기반으로 관리할 수 있어요.

```yaml
name: Terraform

on:
  push:
    branches: [main]
    paths: ['infra/**']
  pull_request:
    branches: [main]
    paths: ['infra/**']

permissions:
  id-token: write
  contents: read
  pull-requests: write

env:
  TF_WORKING_DIR: infra

jobs:
  plan:
    name: Terraform Plan
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ap-northeast-2

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: 1.7.0

      - name: Terraform Init
        working-directory: ${{ env.TF_WORKING_DIR }}
        run: terraform init

      - name: Terraform Plan
        id: plan
        working-directory: ${{ env.TF_WORKING_DIR }}
        run: terraform plan -no-color -out=tfplan
        continue-on-error: true

      # PR에 Plan 결과를 코멘트로 남기기
      - name: Comment Plan on PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const output = `#### Terraform Plan 📝
            \`\`\`
            ${{ steps.plan.outputs.stdout }}
            \`\`\`
            *Run ID: ${{ github.run_id }}*`;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: output
            });

  apply:
    name: Terraform Apply
    runs-on: ubuntu-latest
    needs: plan
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment: infrastructure

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ap-northeast-2

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: 1.7.0

      - name: Terraform Init
        working-directory: ${{ env.TF_WORKING_DIR }}
        run: terraform init

      - name: Terraform Apply
        working-directory: ${{ env.TF_WORKING_DIR }}
        run: terraform apply -auto-approve
```

### 실무 비용/시간 최적화 팁

| 최적화 기법 | 효과 | 방법 |
|-------------|------|------|
| 캐싱 | 빌드 시간 50~80% 단축 | `actions/cache`, setup-* 내장 캐시 |
| 경로 필터링 | 불필요한 실행 방지 | `paths`, `paths-ignore` |
| Concurrency | 중복 실행 방지 | `cancel-in-progress: true` |
| Matrix 최적화 | 필수 조합만 테스트 | `include`/`exclude` |
| Self-hosted Runner | 비용 절감, 성능 향상 | 자체 EC2/온프레미스 |
| Docker 레이어 캐시 | Docker 빌드 시간 단축 | `cache-from: type=gha` |
| Artifact 보관 기간 | 스토리지 비용 절감 | `retention-days: 1~7` |

---

## ⚠️ 자주 하는 실수

### 실수 1: Secret을 로그에 노출

```yaml
# 절대 하면 안 되는 것
- run: echo "Token is ${{ secrets.API_KEY }}"
  # GitHub가 마스킹하긴 하지만, 간접 노출 가능

# 더 위험한 실수: curl 응답에 Secret이 포함될 수 있음
- run: curl -v "${{ secrets.API_URL }}"
  # -v 옵션이 헤더를 출력하면서 토큰이 노출될 수 있어요!
```

**올바른 방법:**

```yaml
# 환경 변수로 전달하고, 로그 출력을 최소화
- name: Call API
  run: |
    curl -s -o /dev/null -w "%{http_code}" "$API_URL" \
      -H "Authorization: Bearer $API_KEY"
  env:
    API_URL: ${{ secrets.API_URL }}
    API_KEY: ${{ secrets.API_KEY }}
```

### 실수 2: OIDC permissions 누락

```yaml
# 이렇게 하면 OIDC 인증이 실패해요!
jobs:
  deploy:
    runs-on: ubuntu-latest
    # permissions가 없으면 id-token: write가 기본으로 꺼져 있음!
    steps:
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/my-role
          aws-region: ap-northeast-2
        # Error: Could not get ID token
```

**올바른 방법:**

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      id-token: write      # ← 반드시 명시!
      contents: read
    steps:
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/my-role
          aws-region: ap-northeast-2
```

### 실수 3: needs 없이 Job 순서 기대

```yaml
# 잘못된 예: build와 deploy가 병렬로 실행돼요!
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: npm run build

  deploy:
    runs-on: ubuntu-latest
    # needs가 없으면 build와 동시에 실행됨!
    steps:
      - run: echo "Build가 아직 안 끝났는데 배포 시작..."
```

**올바른 방법:**

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: npm run build

  deploy:
    runs-on: ubuntu-latest
    needs: build                # ← build가 끝나야 실행!
    steps:
      - run: echo "Build 완료 후 배포 시작"
```

### 실수 4: pull_request_target 오용

```yaml
# 매우 위험! fork에서 온 PR의 코드를 높은 권한으로 실행
on:
  pull_request_target:          # checkout하면 base 브랜치 코드를 가져옴
    types: [opened]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.pull_request.head.sha }}
          # ← 이렇게 하면 fork의 악성 코드가 Secret에 접근 가능!
```

> `pull_request_target`은 base 브랜치의 워크플로우를 실행하면서 Secret에 접근할 수 있어요. fork의 코드를 checkout하면 공격자의 코드가 Secret을 탈취할 수 있으므로, 절대 `ref: head.sha`와 함께 사용하면 안 돼요.

### 실수 5: 캐시 키를 잘못 설정

```yaml
# 잘못된 예: 캐시가 절대 히트하지 않음
- uses: actions/cache@v4
  with:
    path: node_modules
    key: ${{ runner.os }}-${{ github.sha }}    # 커밋마다 다른 키!

# 또 다른 실수: lock 파일이 아닌 package.json으로 해시
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-npm-${{ hashFiles('**/package.json') }}
    # package.json의 scripts만 바뀌어도 캐시 무효화됨
```

**올바른 방법:**

```yaml
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-npm-
```

### 실수 6: concurrency 없이 배포

```yaml
# 위험: 같은 서비스에 동시에 2개의 배포가 실행될 수 있음
jobs:
  deploy:
    runs-on: ubuntu-latest
    # concurrency가 없으면 빠르게 2번 push했을 때
    # 두 워크플로우가 동시에 배포하면서 충돌!
```

**올바른 방법:**

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    concurrency:
      group: deploy-${{ github.ref }}
      cancel-in-progress: false      # 배포는 취소하면 안 됨
```

### 실수 모음 체크리스트

```
배포 전 확인사항:
❌ Secret을 echo나 curl -v로 출력하고 있지 않나요?
❌ OIDC 사용 시 permissions.id-token: write를 빼먹지 않았나요?
❌ Job 간 의존관계(needs)를 빠뜨리지 않았나요?
❌ pull_request_target에서 fork의 코드를 checkout하고 있지 않나요?
❌ 캐시 키에 hashFiles('lock파일')을 사용하고 있나요?
❌ 배포 Job에 concurrency를 설정했나요?
❌ Action 버전을 branch(main)가 아닌 tag(v4)나 SHA로 고정했나요?
❌ schedule의 시간이 UTC 기준인 것을 감안했나요?
❌ paths-ignore에 docs, md 파일을 넣어 불필요한 실행을 막았나요?
❌ environment protection rules로 production 배포를 보호하고 있나요?
```

---

## 📝 마무리

### 핵심 요약 테이블

| 개념 | 설명 | 비유 |
|------|------|------|
| **Workflow** | YAML로 정의된 자동화 파이프라인 | 공장 생산 라인 설계도 |
| **Event/Trigger** | 워크플로우 실행 조건 | 생산 개시 신호 |
| **Job** | 같은 Runner에서 실행되는 Step 묶음 | 공정 (조립, 검사, 도색) |
| **Step** | Job 내의 개별 작업 단위 | 세부 작업 (볼트 조이기) |
| **Runner** | 워크플로우가 실행되는 머신 | 작업 로봇 팔 |
| **Action** | 재사용 가능한 작업 단위 | 마켓에서 산 범용 부품 |
| **Secret** | 암호화된 비밀 값 | 금고에 보관된 출입카드 |
| **Environment** | 배포 대상 + 보호 규칙 | 출하 검수 게이트 |
| **Matrix** | 여러 조합을 동시에 테스트 | 여러 라인에서 동시 생산 |
| **Reusable Workflow** | 다른 워크플로우에서 호출 가능 | 표준화된 공정 매뉴얼 |
| **OIDC** | 장기 키 없이 클라우드 인증 | 일회용 출입증 |

### GitHub Actions 핵심 키워드 요약

| 키워드 | 위치 | 역할 |
|--------|------|------|
| `name` | Workflow / Job / Step | 이름 지정 (UI 표시) |
| `on` | Workflow | 트리거 이벤트 |
| `jobs` | Workflow | Job 목록 |
| `runs-on` | Job | Runner 선택 |
| `needs` | Job | 의존 관계 |
| `if` | Job / Step | 조건부 실행 |
| `strategy.matrix` | Job | 조합 테스트 |
| `environment` | Job | 배포 환경 + 보호 |
| `steps` | Job | Step 목록 |
| `uses` | Step | Action 사용 |
| `run` | Step | 쉘 명령어 |
| `with` | Step | Action 입력값 |
| `env` | Workflow / Job / Step | 환경 변수 |
| `secrets` | Step | 비밀값 참조 |
| `permissions` | Workflow / Job | GITHUB_TOKEN 권한 |
| `concurrency` | Workflow / Job | 동시 실행 제어 |
| `outputs` | Job / Step | 출력값 정의 |

### 체크리스트

이번 강의를 마치고 아래 항목을 확인해보세요.

```
✅ Workflow YAML의 기본 구조 (name, on, jobs, steps)를 이해했나요?
✅ push, pull_request, schedule, workflow_dispatch 트리거를 설정할 수 있나요?
✅ Job 간 의존관계(needs)와 데이터 전달(outputs)을 알겠나요?
✅ GitHub-hosted Runner와 Self-hosted Runner의 차이를 설명할 수 있나요?
✅ Actions Marketplace에서 Action을 찾아 사용할 수 있나요?
✅ Secrets와 Variables의 차이를 알고, GITHUB_TOKEN 권한을 설정할 수 있나요?
✅ Environment와 Protection Rules로 배포를 보호할 수 있나요?
✅ Matrix Strategy로 여러 환경 조합을 테스트할 수 있나요?
✅ Reusable Workflow와 Composite Action의 차이를 설명할 수 있나요?
✅ OIDC로 AWS에 안전하게 인증하는 방법을 이해했나요?
✅ actions/cache로 빌드 속도를 최적화할 수 있나요?
✅ Artifacts로 Job 간에 데이터를 공유할 수 있나요?
✅ concurrency로 동시 배포 충돌을 방지할 수 있나요?
✅ Build → Test → Deploy 전체 파이프라인을 구성할 수 있나요?
```

---

## 🔗 다음 단계

이번 강의에서 GitHub Actions의 실무 활용을 배웠어요. 다음 강의에서는 또 다른 인기 CI/CD 플랫폼을 다뤄요.

| 다음 강의 | 내용 |
|-----------|------|
| [GitLab CI 실무](./06-gitlab-ci) | `.gitlab-ci.yml` 구조, Pipeline/Stage/Job, GitLab Runner, Auto DevOps, GitLab Container Registry |

### 관련 참고 강의

| 강의 | 관련성 |
|------|--------|
| [CI 파이프라인](./03-ci-pipeline) | CI의 개념과 빌드/캐시/병렬화 원리 |
| [CD 파이프라인](./04-cd-pipeline) | CD의 개념과 롤백/Preview 환경 전략 |
| [Terraform 기초](../06-iac/02-terraform-basics) | OIDC용 IAM Role을 Terraform으로 생성하는 방법 |
| [배포 전략](./10-deployment-strategy) | Rolling, Blue-Green, Canary 배포 전략 |
| [파이프라인 보안](./12-pipeline-security) | Secrets 관리, SAST, SBOM 심화 |
