# 파이프라인 보안 (Pipeline Security)

> [GitHub Actions 실무](./05-github-actions)에서 CI/CD 워크플로우 구축을 배웠고, [AWS 보안 서비스](../05-cloud-aws/12-security)에서 클라우드 보안의 기초를 다졌죠? 이번에는 **CI/CD 파이프라인 자체를 안전하게 만드는 방법**을 배워볼게요. Secrets 관리부터 코드 보안 스캔(SAST/DAST/SCA), SBOM, 공급망 보안, 컨테이너 이미지 스캔, 파이프라인 하드닝까지 — DevSecOps의 핵심을 실습과 함께 알아볼게요.

---

## 🎯 왜 파이프라인 보안을/를 알아야 하나요?

### 일상 비유: 공장의 보안 시스템

자동차 공장을 다시 떠올려볼게요. [GitHub Actions](./05-github-actions)에서는 "자동화된 생산 라인"을 만들었죠? 이번에는 그 **공장 자체의 보안**을 강화하는 거예요.

- **설계 도면이 유출**되면? → Secrets가 노출된 것과 같아요
- **불량 부품이 섞여 들어오면?** → 악성 의존성 패키지를 사용한 것과 같아요
- **조립 로봇이 해킹**당하면? → CI/CD 러너가 침해당한 것과 같아요
- **완성차에 결함**이 있으면? → 보안 취약점이 있는 코드를 배포한 것과 같아요
- **부품 출처를 모르면?** → SBOM 없이 소프트웨어를 배포한 것과 같아요

### 실무에서 파이프라인 보안이 필요한 순간

```
• AWS 키가 GitHub에 노출돼서 해킹당했어요                    → Secrets 관리 + Git secrets 탐지
• 오픈소스 라이브러리에 알려진 취약점이 있었어요              → SCA / Dependency Scanning
• 코드에 SQL Injection 취약점이 있는 걸 배포 후에 알았어요    → SAST (정적 분석)
• 배포된 웹앱에 XSS 취약점이 발견됐어요                      → DAST (동적 분석)
• "이 소프트웨어에 어떤 오픈소스가 들어갔나요?" 감사 요청     → SBOM 생성
• 사용하던 npm 패키지가 악성코드로 변조됐어요                 → Supply Chain Security
• 컨테이너 이미지에 CVE 취약점이 있었어요                     → Container Image Scanning
• SOC2/ISO27001 인증 받으려면 보안 증적이 필요해요            → Compliance as Code
```

| 실제 사건 | 무슨 일이? | 교훈 |
|-----------|-----------|------|
| **SolarWinds (2020)** | 빌드 파이프라인에 악성코드 주입 | Supply Chain Security 필수 |
| **Log4Shell (2021)** | 오픈소스 의존성의 치명적 취약점 | SCA + SBOM으로 영향 범위 즉시 파악 |
| **xz utils (2024)** | 오픈소스 메인테이너 계정 탈취, 백도어 | SLSA + 서명 검증 |

---

## 🧠 핵심 개념 잡기

### 비유: 공장 보안 시스템

| 공장 보안 | 파이프라인 보안 |
|-----------|----------------|
| 금고 (비밀 설계도 보관) | **Secrets Management** (GitHub Secrets, Vault, OIDC) |
| 설계도 검수팀 | **SAST** (Semgrep, SonarQube, CodeQL) |
| 완성차 충돌 테스트 | **DAST** (OWASP ZAP, Burp Suite) |
| 부품 수입 검사 | **SCA** (Dependabot, Snyk, Trivy) |
| 부품 명세서 (BOM) | **SBOM** (Syft, CycloneDX, SPDX) |
| 부품 원산지 증명서 | **Supply Chain Security** (SLSA, Sigstore, in-toto) |
| 컨테이너 X선 검사 | **Container Image Scanning** |
| 공장 출입 통제 | **Pipeline Hardening** (least privilege, pinned actions) |

### 전체 보안 파이프라인 한눈에 보기

```mermaid
flowchart LR
    subgraph DEV["👨‍💻 개발"]
        CODE["코드 작성"] --> PRECOMMIT["Pre-commit<br/>gitleaks"]
    end

    subgraph CI["🔧 CI"]
        SECRETS["🔐 Secrets 검사"]
        SAST["🔍 SAST"]
        SCA["📦 SCA"]
    end

    subgraph BUILD["📦 빌드"]
        SCAN["🔬 이미지 스캔"]
        SBOM["📋 SBOM 생성"]
        SIGN["✍️ 이미지 서명"]
    end

    subgraph CD["🚀 배포"]
        DAST["🌐 DAST"]
        VERIFY["✅ 서명 검증"]
        ATTEST["📜 Attestation"]
    end

    PRECOMMIT --> SECRETS --> SAST --> SCA
    SCA --> SCAN --> SBOM --> SIGN
    SIGN --> DAST --> VERIFY --> ATTEST

    style SECRETS fill:#e74c3c,color:#fff
    style SAST fill:#e67e22,color:#fff
    style SCAN fill:#9b59b6,color:#fff
    style SBOM fill:#3498db,color:#fff
    style SIGN fill:#2ecc71,color:#fff
```

### 보안 스캔 유형 비교

| 유형 | 무엇을 검사? | 언제? | 비유 |
|------|-------------|-------|------|
| **SAST** | 소스 코드 자체 | PR 시점 | 설계도 검토 (실행 전) |
| **DAST** | 실행 중인 앱 | 배포 후 | 완성차 충돌 테스트 |
| **SCA** | 오픈소스 의존성 | 빌드 시점 | 수입 부품 검사 |
| **Container Scan** | 컨테이너 이미지 | 이미지 빌드 후 | 컨테이너 X선 검사 |
| **Secret Scan** | 하드코딩된 비밀 | 커밋 시점 | 금고 열쇠 분실 감지 |

---

## 🔍 하나씩 자세히 알아보기

### 1. Secrets 관리 — 금고 시스템

#### 1-1. GitHub Secrets + Environment

```yaml
# .github/workflows/deploy.yml — Environment-level secrets (가장 권장)
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production  # 환경별 시크릿 + 승인 게이트
    steps:
      - name: Deploy
        env:
          DB_PASSWORD: ${{ secrets.PROD_DB_PASSWORD }}
        run: ./deploy.sh
```

#### 1-2. OIDC — 장기 키 없이 인증

```mermaid
sequenceDiagram
    participant GHA as GitHub Actions
    participant OIDC as GitHub OIDC
    participant AWS as AWS STS

    GHA->>OIDC: 1. OIDC 토큰 요청
    OIDC-->>GHA: 2. JWT 발급 (repo/branch 정보 포함)
    GHA->>AWS: 3. AssumeRoleWithWebIdentity (JWT)
    AWS-->>GHA: 4. 임시 자격증명 (15분~1시간)
    Note over GHA,AWS: 장기 키(Access Key) 저장 불필요!
```

```yaml
permissions:
  id-token: write
  contents: read

steps:
  - uses: aws-actions/configure-aws-credentials@v4
    with:
      role-to-assume: arn:aws:iam::123456789012:role/GitHubActionsRole
      aws-region: ap-northeast-2
      # Access Key 없음! OIDC로 임시 자격증명만 사용
```

> **핵심**: AWS Trust Policy에서 `repo:my-org/my-repo:ref:refs/heads/main`처럼 **특정 저장소 + 브랜치만** 허용하세요.

#### 1-3. HashiCorp Vault 연동

```yaml
- name: Import Secrets from Vault
  uses: hashicorp/vault-action@v3
  with:
    url: https://vault.mycompany.com
    method: jwt
    role: github-actions-role
    secrets: |
      secret/data/prod/db password | DB_PASSWORD ;
      secret/data/prod/api key | API_KEY
```

| 기능 | GitHub Secrets | HashiCorp Vault |
|------|---------------|-----------------|
| 난이도 | 쉬움 | 복잡 (별도 인프라) |
| 자동 로테이션 | 수동 | Dynamic Secrets 지원 |
| 감사 로그 | 기본적 | 상세 Audit Log |
| 비용 | 무료 | 오픈소스 / 엔터프라이즈 유료 |

---

### 2. Git Secrets 탐지 — 유출된 열쇠 찾기

```yaml
# .github/workflows/security-scan.yml
jobs:
  gitleaks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Pre-commit Hook으로 커밋 전 차단:**

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.0
    hooks:
      - id: gitleaks
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
```

---

### 3. SAST (Static Application Security Testing) — 설계도 검수

코드를 **실행하지 않고** 소스 코드 자체를 분석해서 보안 취약점을 찾아요.

#### Semgrep — 가볍고 빠른 SAST

```yaml
jobs:
  semgrep:
    runs-on: ubuntu-latest
    container: { image: semgrep/semgrep }
    steps:
      - uses: actions/checkout@v4
      - run: semgrep scan --config auto --sarif --output semgrep.sarif
      - uses: github/codeql-action/upload-sarif@v3
        with: { sarif_file: semgrep.sarif }
        if: always()
```

**커스텀 룰 예시:**

```yaml
# .semgrep/custom-rules.yml
rules:
  - id: sql-injection-risk
    patterns:
      - pattern: |
          $QUERY = f"... {$VAR} ..."
          cursor.execute($QUERY)
    message: "SQL Injection 위험! Parameterized query를 사용하세요."
    severity: ERROR
    languages: [python]
```

#### CodeQL — GitHub 네이티브 SAST

```yaml
jobs:
  codeql:
    runs-on: ubuntu-latest
    permissions: { security-events: write, actions: read, contents: read }
    strategy:
      matrix: { language: ['javascript', 'python'] }
    steps:
      - uses: actions/checkout@v4
      - uses: github/codeql-action/init@v3
        with: { languages: '${{ matrix.language }}', queries: +security-extended }
      - uses: github/codeql-action/autobuild@v3
      - uses: github/codeql-action/analyze@v3
```

| 도구 | 장점 | 단점 |
|------|------|------|
| **Semgrep** | 빠름, 커스텀 룰 쉬움 | 고급 데이터 흐름 분석 제한 |
| **CodeQL** | GitHub 네이티브, 강력 | GitHub 전용, 학습 곡선 |
| **SonarQube** | 코드 품질 + 보안, 대시보드 | 무거움, 별도 서버 필요 |

---

### 4. DAST (Dynamic Application Security Testing) — 충돌 테스트

실행 중인 앱에 **공격 패턴을 보내서** 취약점을 찾아요.

```mermaid
sequenceDiagram
    participant ZAP as OWASP ZAP
    participant APP as Staging App

    ZAP->>APP: 1. Spider (크롤링) — 엔드포인트 탐색
    ZAP->>APP: 2. SQL Injection 시도
    ZAP->>APP: 3. XSS 페이로드 전송
    ZAP->>APP: 4. CSRF / 인증 우회 테스트
    APP-->>ZAP: 5. 응답 분석
    Note over ZAP: 6. SARIF 리포트 생성<br/>Critical 발견 시 파이프라인 실패!
```

```yaml
jobs:
  zap-scan:
    runs-on: ubuntu-latest
    steps:
      - name: ZAP Baseline Scan
        uses: zaproxy/action-baseline@v0.12.0
        with:
          target: 'https://staging.myapp.com'
          rules_file_name: '.zap/rules.tsv'
```

| 특성 | SAST | DAST |
|------|------|------|
| 분석 대상 | 소스 코드 | 실행 중인 앱 |
| 속도 | 빠름 (분) | 느림 (시간) |
| False Positive | 많을 수 있음 | 적음 (실제 공격) |
| 추천 | **둘 다 사용하는 것이 최선!** | |

---

### 5. SCA (Software Composition Analysis) — 부품 수입 검사

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule: { interval: "weekly", day: "monday" }
    groups:
      production-dependencies:
        patterns: ["*"]
        exclude-patterns: ["@types/*", "eslint*"]
  - package-ecosystem: "docker"
    directory: "/"
    schedule: { interval: "weekly" }
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule: { interval: "weekly" }
```

**Trivy — 올인원 보안 스캐너:**

```yaml
- name: Trivy Filesystem Scan
  uses: aquasecurity/trivy-action@master
  with:
    scan-type: 'fs'
    scan-ref: '.'
    severity: 'CRITICAL,HIGH'
    exit-code: '1'
```

| 도구 | 장점 | 비용 |
|------|------|------|
| **Dependabot** | GitHub 네이티브, 자동 PR | 무료 |
| **Snyk** | Fix 제안, 라이선스 검사 | 무료 티어 / 유료 |
| **Trivy** | 올인원 (FS + 이미지 + IaC) | 오픈소스 무료 |

---

### 6. SBOM (Software Bill of Materials) — 부품 명세서

SBOM은 소프트웨어에 포함된 **모든 구성 요소의 목록**이에요. Log4Shell 사태 때 "우리 시스템에 Log4j가 어디 쓰이고 있지?"라는 질문에 **즉시 답할 수 있으려면** SBOM이 필요해요.

```mermaid
flowchart TB
    subgraph WITHOUT["❌ SBOM 없이"]
        Q1["CVE 발표!"] --> B1["전체 코드베이스 수동 검색..."]
        B1 --> D1["일주일 후 영향 범위 파악"]
    end

    subgraph WITH["✅ SBOM 있으면"]
        Q2["CVE 발표!"] --> A2["SBOM DB 조회"]
        A2 --> C2["30분 만에 영향 범위 파악 + 패치"]
    end

    style WITHOUT fill:#ffcccc,stroke:#e74c3c
    style WITH fill:#ccffcc,stroke:#27ae60
    style D1 fill:#e74c3c,color:#fff
    style C2 fill:#27ae60,color:#fff
```

```yaml
# Syft로 SBOM 생성 + Grype로 취약점 스캔
steps:
  - uses: anchore/sbom-action@v0
    with:
      image: 'my-app:${{ github.sha }}'
      format: cyclonedx-json
      output-file: sbom.cdx.json

  - uses: anchore/scan-action@v4
    with:
      sbom: sbom.cdx.json
      fail-build: true
      severity-cutoff: high
```

| SBOM 포맷 | 특징 | 사용처 |
|-----------|------|--------|
| **SPDX** | Linux Foundation 표준, 라이선스 중심 | 법적 컴플라이언스 |
| **CycloneDX** | OWASP 표준, 보안 중심 | 보안 취약점 관리 |

---

### 7. Supply Chain Security — 부품 원산지 증명

#### SLSA Framework (Supply-chain Levels for Software Artifacts)

SLSA(발음: "살사")는 소프트웨어 공급망 보안 성숙도를 측정하는 프레임워크예요. Google이 시작했고, OpenSSF(Open Source Security Foundation)에서 관리해요.

> **비유**: 식품 안전 등급과 비슷해요. 식당에 "위생 등급 A"가 붙어 있으면, 정해진 기준을 통과했다는 뜻이죠. SLSA도 마찬가지로 "이 소프트웨어는 Level 3 기준을 충족했으니 빌드 과정이 변조되지 않았어요"라고 증명해요.

```
SLSA 레벨:
Level 3: 격리된 빌드, 변조 방지, 소스 검증
Level 2: 서명된 출처 증명 (호스팅 빌드 서비스)
Level 1: 빌드 과정 문서화, 출처 증명 생성
Level 0: 보호 없음
```

| SLSA Level | 요구사항 | 보호 대상 | 예시 |
|------------|---------|----------|------|
| **Level 0** | 없음 | 없음 | 로컬에서 빌드 후 수동 배포 |
| **Level 1** | 빌드 프로세스 문서화, 출처 증명(provenance) 자동 생성 | 변조된 패키지가 아닌지 확인 가능 | GitHub Actions에서 `slsa-github-generator` 사용 |
| **Level 2** | 호스팅된 빌드 서비스 사용, 서명된 출처 증명 | 빌드 서비스의 신뢰성 보장 | GitHub Actions + Sigstore 서명 |
| **Level 3** | 격리된 빌드 환경, 소스/빌드 통합 검증, 변조 방지 보장 | 내부자 위협까지 방어 | 빌드 시스템이 완전히 격리된 환경에서 실행 |

```yaml
# GitHub Actions에서 SLSA Level 3 출처 증명 생성
name: SLSA Build
on: push

jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      digest: ${{ steps.hash.outputs.digest }}
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build
      - name: Generate artifact hash
        id: hash
        run: |
          sha256sum dist/app.tar.gz | awk '{print $1}' > digest.txt
          echo "digest=$(cat digest.txt)" >> "$GITHUB_OUTPUT"

  # SLSA GitHub Generator가 출처 증명서를 자동 생성
  provenance:
    needs: build
    permissions:
      actions: read
      id-token: write
      contents: write
    uses: slsa-framework/slsa-github-generator/.github/workflows/generator_generic_slsa3.yml@v2.0.0
    with:
      base64-subjects: "${{ needs.build.outputs.digest }}"
```

#### Sigstore: 키 없는 서명 (Keyless Signing)

Sigstore는 소프트웨어 서명을 위한 오픈소스 인프라예요. 가장 혁신적인 점은 **키리스 서명(Keyless Signing)**이에요 -- 개인 키를 관리할 필요가 없어요.

```
Sigstore 구성 요소:

  Cosign   — 컨테이너 이미지 서명/검증 도구
  Fulcio   — 단기 인증서 발급 CA (Certificate Authority)
  Rekor    — 변조 불가능한 서명 기록 투명성 로그

동작 원리:
  1. cosign sign 실행
  2. GitHub OIDC 토큰으로 Fulcio에서 단기 인증서 발급 (10분)
  3. 인증서로 이미지 서명
  4. 서명 기록이 Rekor 투명성 로그에 영구 기록
  5. 인증서 자동 만료 → 키 관리 불필요!
```

#### Sigstore / cosign — 이미지 서명

```yaml
jobs:
  build-sign:
    permissions: { contents: read, packages: write, id-token: write }
    steps:
      - uses: sigstore/cosign-installer@v3

      - name: Build and Push
        uses: docker/build-push-action@v5
        id: build
        with:
          push: true
          tags: ghcr.io/my-org/my-app:${{ github.sha }}

      # Keyless Signing (Sigstore + Fulcio)
      - run: cosign sign --yes ghcr.io/my-org/my-app@${{ steps.build.outputs.digest }}

      # SBOM 첨부 + 서명
      - run: |
          syft ghcr.io/my-org/my-app@${{ steps.build.outputs.digest }} -o cyclonedx-json > sbom.cdx.json
          cosign attach sbom --sbom sbom.cdx.json ghcr.io/my-org/my-app@${{ steps.build.outputs.digest }}

      # 검증
      - run: |
          cosign verify \
            --certificate-identity "https://github.com/my-org/my-app/.github/workflows/build.yml@refs/heads/main" \
            --certificate-oidc-issuer "https://token.actions.githubusercontent.com" \
            ghcr.io/my-org/my-app@${{ steps.build.outputs.digest }}
```

#### in-toto Attestations

```yaml
# 빌드 + 취약점 스캔 증명서 첨부
- run: |
    cosign attest --yes --type slsaprovenance \
      --predicate provenance.json \
      ghcr.io/my-org/my-app@${{ steps.build.outputs.digest }}
    cosign attest --yes --type vuln \
      --predicate trivy-results.json \
      ghcr.io/my-org/my-app@${{ steps.build.outputs.digest }}
```

#### 통합 파이프라인: SBOM 생성 + 서명 + 검증

실무에서는 SBOM 생성, 이미지 서명, 취약점 스캔을 하나의 파이프라인으로 통합해요.

```yaml
# .github/workflows/secure-build.yml
name: Secure Build Pipeline
on:
  push:
    branches: [main]

jobs:
  secure-build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
      id-token: write    # OIDC + cosign 서명에 필요

    steps:
      - uses: actions/checkout@v4

      # 1. Docker 이미지 빌드 + 푸시
      - uses: docker/build-push-action@v5
        id: build
        with:
          push: true
          tags: ghcr.io/my-org/my-app:${{ github.sha }}

      # 2. SBOM 생성 (Syft)
      - name: Generate SBOM
        uses: anchore/sbom-action@v0
        with:
          image: ghcr.io/my-org/my-app:${{ github.sha }}
          format: cyclonedx-json
          output-file: sbom.cdx.json

      # 3. 이미지 서명 (Cosign keyless)
      - uses: sigstore/cosign-installer@v3
      - name: Sign image
        run: cosign sign --yes ghcr.io/my-org/my-app@${{ steps.build.outputs.digest }}

      # 4. SBOM을 이미지에 첨부 + 서명
      - name: Attach and sign SBOM
        run: |
          cosign attach sbom --sbom sbom.cdx.json \
            ghcr.io/my-org/my-app@${{ steps.build.outputs.digest }}
          cosign sign --yes --attachment sbom \
            ghcr.io/my-org/my-app@${{ steps.build.outputs.digest }}

      # 5. 취약점 스캔 (Trivy)
      - name: Scan for vulnerabilities
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ghcr.io/my-org/my-app:${{ github.sha }}
          format: json
          output: trivy-results.json
          severity: CRITICAL,HIGH

      # 6. 취약점 결과를 증명서로 첨부
      - name: Attest vulnerability scan
        run: |
          cosign attest --yes --type vuln \
            --predicate trivy-results.json \
            ghcr.io/my-org/my-app@${{ steps.build.outputs.digest }}
```

> **핵심**: 이 파이프라인을 통과한 이미지는 "누가, 언제, 무엇으로, 어떤 의존성과 함께 빌드했는지"가 모두 암호학적으로 증명돼요. 배포 시 `cosign verify`로 서명을 검증하면 변조된 이미지가 프로덕션에 배포되는 것을 방지할 수 있어요.

---

### 8. Container Image Scanning + Pipeline Hardening

#### 안전한 Dockerfile

```dockerfile
FROM node:20-alpine AS builder
# ❌ FROM node:20 (full image = 더 많은 취약점)
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS runtime
RUN addgroup -g 1001 appgroup && adduser -u 1001 -G appgroup -D appuser
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
USER appuser
EXPOSE 3000
CMD ["node", "server.js"]
```

#### 최소 권한 파이프라인

```yaml
permissions: {}  # 기본으로 모든 권한 제거!

jobs:
  build:
    permissions: { contents: read }  # 필요한 것만!
  deploy:
    permissions: { contents: read, id-token: write, packages: write }
```

#### Actions 버전 SHA Pinning

```yaml
# ❌ 위험: tag 사용 (변조 가능)
- uses: actions/checkout@v4

# ✅ 안전: SHA pinning (변조 불가)
- uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11  # v4.1.1
```

#### Compliance as Code

```yaml
# OPA로 보안 정책 검증
- run: |
    cat > policy.rego << 'REGO'
    package pipeline.security
    deny[msg] { input.image_scan != true; msg := "Image scan required" }
    deny[msg] { input.sbom_generated != true; msg := "SBOM required" }
    deny[msg] { input.critical_vulns > 0; msg := sprintf("%d critical vulns", [input.critical_vulns]) }
    REGO
    opa eval -d policy.rego -i compliance-input.json "data.pipeline.security.deny"
```

---

## 💻 직접 해보기

### 실습: 종합 보안 파이프라인 구축

```yaml
# .github/workflows/security-pipeline.yml
name: "Security Pipeline"
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

permissions: {}

jobs:
  # Stage 1: Secret Detection
  secret-scan:
    runs-on: ubuntu-latest
    permissions: { contents: read }
    steps:
      - uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11
        with: { fetch-depth: 0 }
      - uses: gitleaks/gitleaks-action@v2
        env: { GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}" }

  # Stage 2: SAST
  sast:
    runs-on: ubuntu-latest
    permissions: { contents: read, security-events: write }
    steps:
      - uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11
      - uses: semgrep/semgrep-action@v1
        with: { config: "p/default p/owasp-top-ten" }

  # Stage 3: SCA
  sca:
    runs-on: ubuntu-latest
    permissions: { contents: read, security-events: write }
    steps:
      - uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11
      - uses: aquasecurity/trivy-action@master
        with: { scan-type: 'fs', severity: 'CRITICAL,HIGH', exit-code: '1' }

  # Stage 4: Build + Image Scan + SBOM + Sign
  build-scan:
    needs: [secret-scan, sast, sca]
    runs-on: ubuntu-latest
    permissions: { contents: read, packages: write, id-token: write }
    steps:
      - uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11
      - uses: docker/build-push-action@v5
        id: build
        with: { push: true, tags: "ghcr.io/${{ github.repository }}:${{ github.sha }}" }
      - uses: aquasecurity/trivy-action@master
        with: { image-ref: "ghcr.io/${{ github.repository }}:${{ github.sha }}", severity: 'CRITICAL,HIGH', exit-code: '1' }
      - uses: anchore/sbom-action@v0
        with: { image: "ghcr.io/${{ github.repository }}:${{ github.sha }}", format: cyclonedx-json }
      - uses: sigstore/cosign-installer@v3
      - run: cosign sign --yes ghcr.io/${{ github.repository }}@${{ steps.build.outputs.digest }}

  # Stage 5: Security Gate
  security-gate:
    needs: [secret-scan, sast, sca, build-scan]
    runs-on: ubuntu-latest
    if: always()
    steps:
      - run: |
          if [[ "${{ needs.secret-scan.result }}" == "failure" ]] || \
             [[ "${{ needs.sast.result }}" == "failure" ]] || \
             [[ "${{ needs.sca.result }}" == "failure" ]] || \
             [[ "${{ needs.build-scan.result }}" == "failure" ]]; then
            echo "::error::Security gate FAILED!"
            exit 1
          fi
          echo "All security checks passed!"
```

---

## 🏢 실무에서는?

### 조직 규모별 보안 전략

```mermaid
flowchart TB
    subgraph S["🚀 스타트업"]
        S1["GitHub Secret Scanning"]
        S2["Dependabot"]
        S3["gitleaks pre-commit"]
        S4["Trivy 기본 스캔"]
        S5["비용: 거의 무료"]
    end

    subgraph M["🏢 중견 기업"]
        M1["+ Semgrep / CodeQL"]
        M2["+ Snyk SCA"]
        M3["+ SBOM + cosign"]
        M4["+ OWASP ZAP"]
        M5["비용: 월 $500-2,000"]
    end

    subgraph E["🏛️ 대기업"]
        E1["+ SonarQube Enterprise"]
        E2["+ HashiCorp Vault"]
        E3["+ SLSA Level 3"]
        E4["+ Compliance as Code"]
        E5["비용: 월 $5,000+"]
    end

    S --> M --> E

    style S fill:#27ae60,color:#fff
    style M fill:#f39c12,color:#fff
    style E fill:#8e44ad,color:#fff
```

### 시나리오 1: "시크릿이 GitHub에 노출됐어요!"

```
긴급 대응 절차:
1. 즉시 해당 시크릿 무효화 (Revoke)
2. CloudTrail 로그로 비정상 사용 확인
3. 새 시크릿 발급 → GitHub Secrets/Vault에 보관
4. gitleaks pre-commit hook 설치 + Push Protection 활성화
5. 인시던트 보고서 작성
```

### 시나리오 2: "의존성에 Critical CVE가 발견됐어요!"

```
1. SBOM 조회 → 영향받는 서비스 목록 확인
2. CVSS 점수 + 공격 벡터 확인
3. 패치 있으면 → 즉시 업데이트 + 배포 / 없으면 → WAF 임시 완화
4. 패치 후 취약점 스캔 재실행
```

### 보안 메트릭 (실무 KPI)

| 메트릭 | 목표 | 측정 주기 |
|--------|------|-----------|
| Mean Time to Remediate (MTTR) | Critical < 24h, High < 7일 | 주간 |
| Open Critical Vulnerabilities | 0개 | 일간 |
| SBOM Coverage | 100% | 월간 |
| SAST Scan Pass Rate | > 95% | 주간 |
| Container Image Freshness | < 30일 | 주간 |

---

## ⚠️ 자주 하는 실수

### 실수 1: 시크릿을 코드에 하드코딩

```python
# ❌ 절대 하지 마세요!
AWS_ACCESS_KEY = "AKIAIOSFODNN7EXAMPLE"

# ✅ 환경변수 사용
import os
AWS_ACCESS_KEY = os.environ.get("AWS_ACCESS_KEY_ID")
```

### 실수 2: Actions를 태그로만 참조

```yaml
# ❌ 태그는 변조 가능 (supply chain 공격 벡터)
- uses: actions/checkout@v4

# ✅ SHA pinning (변조 불가)
- uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11  # v4.1.1
```

### 실수 3: 과도한 권한 부여

```yaml
# ❌ 위험
permissions: write-all

# ✅ 최소 권한
permissions:
  contents: read
```

### 실수 4: 보안 스캔 결과를 무시

```yaml
# ❌ 결과 무시
- run: trivy image my-app:latest || true

# ✅ 실패 시 차단
- uses: aquasecurity/trivy-action@master
  with: { severity: 'CRITICAL,HIGH', exit-code: '1', ignore-unfixed: true }
```

### 실수 5: SBOM을 생성만 하고 활용하지 않음

```
❌ SBOM 생성 → 아티팩트 저장 → 아무도 안 봄
✅ SBOM 생성 → Dependency-Track 업로드 → 새 CVE 자동 매칭 → 알림
```

### 실수 6: OIDC 신뢰 정책을 너무 넓게 설정

```json
// ❌ 모든 저장소에서 Role assume 가능
{ "sub": "repo:my-org/*" }

// ✅ 특정 저장소 + 브랜치만
{ "sub": "repo:my-org/my-repo:ref:refs/heads/main" }
```

### 파이프라인 보안 체크리스트

```
Secrets:
☐ 코드에 하드코딩된 시크릿 없음
☐ OIDC 사용 (임시 자격증명)
☐ Pre-commit hook + Push Protection 활성화

Scanning:
☐ SAST 스캔 PR마다 실행
☐ SCA / Dependency 스캔 활성화
☐ Container Image 스캔 활성화
☐ Critical/High 발견 시 배포 차단

Supply Chain:
☐ Actions SHA pinning
☐ SBOM 생성 및 보관
☐ 컨테이너 이미지 서명 (cosign)

Pipeline:
☐ 최소 권한 permissions
☐ Branch Protection Rules
☐ 배포 환경 승인 게이트
```

---

## 📝 마무리

### 핵심 원칙: Shift-Left + Defense in Depth

```mermaid
flowchart LR
    DEV["🖥️ IDE<br/>pre-commit<br/>$1"] -->|10x| PR["📋 PR<br/>SAST+SCA<br/>$10"]
    PR -->|10x| BUILD["📦 Build<br/>Image Scan<br/>$100"]
    BUILD -->|10x| STAGING["🧪 Staging<br/>DAST<br/>$1,000"]
    STAGING -->|10x| PROD["🚀 Prod<br/>Runtime<br/>$10,000"]

    style DEV fill:#27ae60,color:#fff
    style PR fill:#2ecc71,color:#fff
    style BUILD fill:#f39c12,color:#fff
    style STAGING fill:#e67e22,color:#fff
    style PROD fill:#e74c3c,color:#fff
```

> **수정 비용은 오른쪽으로 갈수록 10배씩 증가해요!** 가능한 한 왼쪽에서(Shift-Left) 문제를 잡는 것이 핵심이에요.

### 도구 선택 가이드

| 목적 | 무료 추천 | 엔터프라이즈 추천 |
|------|----------|-------------------|
| Secret Detection | gitleaks + Push Protection | GitHub Advanced Security |
| SAST | Semgrep + CodeQL | SonarQube Enterprise |
| SCA | Dependabot + Trivy | Snyk |
| DAST | OWASP ZAP | Burp Suite Enterprise |
| SBOM | Syft + Grype | Anchore Enterprise |
| Supply Chain | cosign + SLSA Generator | Chainguard |
| Secrets Mgmt | GitHub Secrets + OIDC | HashiCorp Vault |

---

## 🔗 다음 단계

```
현재 위치: 파이프라인 보안 ✅

다음 학습:
├── [변경 관리](./13-change-management) → 배포 승인, 변경 관리 자동화
├── [AWS 보안 서비스](../05-cloud-aws/12-security) → KMS, WAF, Shield, GuardDuty
├── [IaC 테스트와 정책](../06-iac/06-testing-policy) → Policy as Code, tfsec, OPA
└── [GitHub Actions 실무](./05-github-actions) → OIDC, Environment, Reusable Workflows

실습 프로젝트:
1단계: pre-commit hook + gitleaks 설정
2단계: GitHub Actions 보안 파이프라인 구축
3단계: SBOM 생성 + 이미지 서명 자동화
4단계: Compliance as Code 구현
```

> **다음 강의 예고**: [변경 관리(Change Management)](./13-change-management)에서는 배포 승인 프로세스, 변경 윈도우 관리, 롤백 전략, GitOps 기반 변경 관리를 배워볼 거예요. 이번 강의에서 배운 보안 게이트가 변경 관리 프로세스의 핵심이 된답니다!
