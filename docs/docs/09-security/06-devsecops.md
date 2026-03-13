# DevSecOps — 보안을 개발 문화 속으로

> [파이프라인 보안](../07-cicd/12-pipeline-security)에서 CI/CD 파이프라인에 보안 도구를 통합하는 방법을 배웠고, [컨테이너 보안](./03-container-security)에서 이미지 스캐닝과 런타임 보안을 다뤘죠? 이번에는 한 단계 더 올라가서 — **보안을 개발 프로세스의 DNA로 만드는 DevSecOps 문화와 전략**을 깊이 있게 배워볼게요. 도구만 도입한다고 보안이 좋아지지 않아요. 사람, 프로세스, 기술이 함께 움직여야 해요.

---

## 🎯 왜 DevSecOps를 알아야 하나요?

### 일상 비유: 아파트 건축과 보안

아파트를 짓는 과정을 떠올려볼게요.

- **전통적 보안(Waterfall)**: 아파트를 다 짓고 나서 보안 점검 → "1층 기둥에 균열이 있네요" → 이미 20층까지 올렸는데 어떡해요? 😱
- **DevOps (보안 없음)**: 빠르게 짓긴 하는데 안전 검사를 건너뜀 → "빨리 입주하세요!" → 6개월 후 균열 발견
- **DevSecOps**: 기초 공사부터 매 층마다 안전 검사 → 설계 단계에서 내진 설계 반영 → 각 층 올릴 때마다 검수 → 안전하고 빠르게 완공

```
전통적 보안:
개발 ──────────────────────→ 테스트 ──→ 보안 검토 ──→ 배포
                                         ↑
                                    여기서 발견하면 너무 늦어요!
                                    비용 100x, 일정 지연

DevSecOps:
보안 ──→ 보안 ──→ 보안 ──→ 보안 ──→ 보안 ──→ 보안
 ↓        ↓        ↓        ↓        ↓        ↓
설계 ──→ 코딩 ──→ 빌드 ──→ 테스트 ──→ 배포 ──→ 운영
```

### 실무에서 DevSecOps가 필요한 순간

```
• 보안팀이 릴리스 직전에 "이거 안 돼요" 차단                    → Shift Left로 조기 발견
• 개발자가 보안을 "남의 일"로 여김                              → Security Champions 프로그램
• 취약점이 발견돼도 누가 고쳐야 할지 모름                       → Vulnerability Management Lifecycle
• OWASP Top 10 취약점이 프로덕션에서 계속 발견됨                → Security Pipeline 자동화
• "우리 보안 수준이 어느 정도인지" 답을 못 함                   → DevSecOps Maturity Model
• 보안 이슈 수정에 평균 45일 걸림                               → MTTR 메트릭 관리
• 위협 모델링 없이 설계해서 근본적 보안 결함 발생                → Threat Modeling (STRIDE/DREAD)
• 컴플라이언스 감사 때마다 증적 자료 만들기 바쁨                 → Compliance as Code
```

| 실제 사건 | 무슨 일이? | DevSecOps 교훈 |
|-----------|-----------|----------------|
| **Equifax (2017)** | Apache Struts 취약점 2개월 방치 → 1.4억 명 개인정보 유출 | Vulnerability Management + MTTR 관리 |
| **Capital One (2019)** | WAF 설정 오류 → 1억 명 데이터 유출 | Threat Modeling + Security Review |
| **SolarWinds (2020)** | 빌드 파이프라인 침해 → 18,000개 조직 영향 | Supply Chain Security + Pipeline 무결성 |
| **Log4Shell (2021)** | 오픈소스 의존성 취약점 → 전 세계 영향 | SCA + SBOM + 빠른 대응 체계 |

---

## 🧠 핵심 개념 잡기

### DevSecOps란?

**DevSecOps = Development + Security + Operations**

개발(Dev), 보안(Sec), 운영(Ops)을 하나의 통합된 문화와 프로세스로 만드는 것이에요. 핵심은 **보안을 별도의 게이트가 아니라 모든 단계에 녹여내는 것**이에요.

```mermaid
flowchart TD
    subgraph CULTURE["🏛️ DevSecOps 문화"]
        direction TB
        C1["공동 책임<br/>보안은 모두의 일"]
        C2["자동화 우선<br/>수동 검토 최소화"]
        C3["지속적 개선<br/>메트릭 기반 발전"]
    end

    subgraph PEOPLE["👥 사람"]
        P1["Security Champions"]
        P2["개발자 보안 교육"]
        P3["보안팀 ↔ 개발팀 협업"]
    end

    subgraph PROCESS["📋 프로세스"]
        PR1["Threat Modeling"]
        PR2["Secure Code Review"]
        PR3["Vulnerability Management"]
    end

    subgraph TECH["🔧 기술"]
        T1["SAST / DAST / SCA"]
        T2["Container Scanning"]
        T3["Runtime Protection"]
    end

    CULTURE --> PEOPLE
    CULTURE --> PROCESS
    CULTURE --> TECH

    style CULTURE fill:#2c3e50,color:#fff
    style PEOPLE fill:#2980b9,color:#fff
    style PROCESS fill:#27ae60,color:#fff
    style TECH fill:#8e44ad,color:#fff
```

### DevOps vs DevSecOps 비교

| 항목 | DevOps | DevSecOps |
|------|--------|-----------|
| **목표** | 빠른 전달 (Speed) | 빠르고 **안전한** 전달 (Speed + Security) |
| **보안 시점** | 배포 직전 또는 이후 | 설계 단계부터 모든 단계 |
| **보안 책임** | 보안팀 전담 | 모든 팀원 공동 책임 |
| **보안 검증** | 수동 감사/침투 테스트 | 자동화된 지속적 검증 |
| **취약점 발견** | 늦게 (비용 큼) | 일찍 (비용 작음) |
| **피드백 루프** | 느림 (릴리스 단위) | 빠름 (커밋 단위) |

### DevSecOps의 3가지 핵심 원칙

```
1. Shift Left Security     → 보안을 가능한 한 왼쪽(개발 초기)으로 이동
2. Security as Code        → 보안 정책을 코드로 관리하고 자동화
3. Continuous Security     → 일회성이 아닌 지속적인 보안 검증
```

### 전체 DevSecOps 파이프라인 한눈에 보기

```mermaid
flowchart LR
    subgraph PLAN["📐 Plan"]
        TM["Threat Modeling<br/>STRIDE / DREAD"]
        SR["Security<br/>Requirements"]
    end

    subgraph CODE["💻 Code"]
        IDE["IDE 보안 플러그인"]
        PRE["Pre-commit<br/>Hooks"]
        REVIEW["Secure Code<br/>Review"]
    end

    subgraph BUILD["🔨 Build"]
        SAST["SAST<br/>정적 분석"]
        SCA["SCA<br/>의존성 검사"]
        SECRET["Secret<br/>Detection"]
    end

    subgraph TEST["🧪 Test"]
        CSCAN["Container<br/>Scan"]
        DAST["DAST<br/>동적 분석"]
        IAST["IAST<br/>인터랙티브 분석"]
    end

    subgraph DEPLOY["🚀 Deploy"]
        SIGN["이미지 서명"]
        POLICY["Policy<br/>Enforcement"]
        COMP["Compliance<br/>Check"]
    end

    subgraph OPERATE["⚙️ Operate"]
        RASP["Runtime<br/>Protection"]
        MONITOR["Security<br/>Monitoring"]
        RESPOND["Incident<br/>Response"]
    end

    TM --> SR --> IDE --> PRE --> REVIEW
    REVIEW --> SAST --> SCA --> SECRET
    SECRET --> CSCAN --> DAST --> IAST
    IAST --> SIGN --> POLICY --> COMP
    COMP --> RASP --> MONITOR --> RESPOND
    RESPOND -->|"피드백 루프"| TM

    style TM fill:#e74c3c,color:#fff
    style SAST fill:#e67e22,color:#fff
    style DAST fill:#f39c12,color:#fff
    style CSCAN fill:#9b59b6,color:#fff
    style RASP fill:#2ecc71,color:#fff
    style SIGN fill:#3498db,color:#fff
```

---

## 🔍 하나씩 자세히 알아보기

### 1. Shift Left Security — 보안을 왼쪽으로!

#### 개념

"Shift Left"는 보안 활동을 소프트웨어 개발 생명주기(SDLC)의 **오른쪽(배포/운영)**에서 **왼쪽(설계/개발)**으로 이동시키는 것이에요.

```
비용 곡선 (취약점 수정 비용):

설계 단계: $                  ← 여기서 잡으면 거의 공짜!
코딩 단계: $$$
빌드 단계: $$$$$$
테스트 단계: $$$$$$$$$$$
프로덕션: $$$$$$$$$$$$$$$$$$   ← 여기서 잡으면 100배 비용!

→ 오른쪽으로 갈수록 수정 비용이 기하급수적으로 증가해요.
   IBM Systems Sciences Institute 연구: 프로덕션 수정 비용 = 설계 대비 100배
```

#### Shift Left 실천 방법

```yaml
# 1단계: IDE에서부터 보안 시작 (개발자 PC)
# .vscode/extensions.json — 팀 전체 IDE 보안 확장 추천
{
  "recommendations": [
    "SonarSource.sonarlint-vscode",      # 실시간 코드 보안 분석
    "snyk-security.snyk-vulnerability-scanner",  # 의존성 취약점
    "redhat.vscode-yaml"                 # YAML 스키마 검증 (IaC 보안)
  ]
}
```

```yaml
# 2단계: Pre-commit Hooks (커밋 전 자동 검사)
# .pre-commit-config.yaml
repos:
  # Secret 탐지 — 실수로 API 키 커밋하는 것 방지
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.0
    hooks:
      - id: gitleaks

  # 보안 린팅 — 코드 수준 취약점 탐지
  - repo: https://github.com/PyCQA/bandit
    rev: 1.7.7
    hooks:
      - id: bandit
        args: ['-c', 'pyproject.toml']

  # Dockerfile 보안 검사
  - repo: https://github.com/hadolint/hadolint
    rev: v2.12.0
    hooks:
      - id: hadolint

  # Terraform 보안 검사
  - repo: https://github.com/antonbabenko/pre-commit-terraform
    rev: v1.86.0
    hooks:
      - id: terraform_tfsec
```

```bash
# Pre-commit 설치 및 실행
pip install pre-commit
pre-commit install

# 커밋할 때 자동 실행!
git commit -m "feat: add user login"
# [gitleaks]  ✅ Passed
# [bandit]    ⚠️  B105: Possible hardcoded password → 커밋 차단!
# [hadolint]  ✅ Passed
```

```
Shift Left 단계별 체크포인트:

IDE:         보안 린트 플러그인, 자동완성으로 안전한 패턴 유도
Pre-commit:  Secrets 탐지, 기본 보안 린팅
PR/MR:       SAST, SCA, 보안 리뷰어 자동 할당
Build:       컨테이너 스캔, SBOM 생성
Staging:     DAST, 침투 테스트
Production:  Runtime 보호, 모니터링

→ 각 단계가 "안전망"이에요. 하나를 통과해도 다음에서 잡아줘요!
```

---

### 2. Threat Modeling — 위협 모델링

#### 비유: 은행 설계할 때 도둑의 시선으로 보기

은행을 설계한다고 상상해 보세요. 건축가만의 시선으로 보면 "예쁘고 편한 은행"이 되겠지만, **도둑의 시선으로 보면** 어디가 취약한지 보여요. 위협 모델링은 바로 그거예요 — **공격자의 관점**에서 시스템을 분석하는 것이죠.

#### STRIDE 위협 모델

Microsoft에서 만든 위협 분류 체계예요. 6가지 위협 유형의 첫 글자를 딴 거예요.

| 위협 | 설명 | 비유 | 예시 |
|------|------|------|------|
| **S**poofing (위장) | 다른 사람인 척 하기 | 남의 신분증 도용 | 세션 하이재킹, 인증서 위조 |
| **T**ampering (변조) | 데이터를 몰래 수정 | 계약서 위조 | API 요청 변조, DB 직접 수정 |
| **R**epudiation (부인) | "나 안 했어" 부인 | CCTV 없는 곳에서 범행 | 로그 없는 관리자 작업 |
| **I**nformation Disclosure (정보 노출) | 비밀 정보 유출 | 금고 비밀번호 메모 노출 | API 응답에 스택트레이스 노출 |
| **D**enial of Service (서비스 거부) | 서비스 못 쓰게 만들기 | 가게 앞에 시위대 배치 | DDoS, 리소스 고갈 공격 |
| **E**levation of Privilege (권한 상승) | 더 높은 권한 탈취 | 일반 직원이 금고 열쇠 획득 | 일반 사용자 → 관리자 권한 |

#### STRIDE 실습: 웹 애플리케이션 위협 분석

```mermaid
flowchart LR
    USER["👤 사용자<br/>(브라우저)"]
    LB["⚖️ Load<br/>Balancer"]
    API["🖥️ API<br/>Server"]
    DB["🗄️ Database"]
    CACHE["💾 Redis<br/>Cache"]
    EXT["🌐 External<br/>API"]

    USER -->|"HTTPS"| LB
    LB -->|"HTTP"| API
    API -->|"SQL"| DB
    API -->|"TCP"| CACHE
    API -->|"HTTPS"| EXT

    USER -.->|"❶ Spoofing<br/>세션 탈취"| LB
    LB -.->|"❷ Tampering<br/>요청 변조"| API
    API -.->|"❸ Info Disclosure<br/>SQL Injection"| DB
    API -.->|"❹ DoS<br/>캐시 플러딩"| CACHE
    API -.->|"❺ Spoofing<br/>SSRF 공격"| EXT

    style USER fill:#3498db,color:#fff
    style API fill:#e74c3c,color:#fff
    style DB fill:#e67e22,color:#fff
```

```yaml
# 위협 모델링 결과 문서 예시
# threat-model/user-auth-service.yaml
service: user-auth-service
data_flow: User → ALB → Auth API → PostgreSQL
date: 2026-03-13
participants:
  - backend-team
  - security-champion
  - infra-team

threats:
  - id: TM-001
    stride: Spoofing
    description: "공격자가 훔친 JWT로 다른 사용자 행세"
    component: Auth API
    severity: HIGH
    mitigation:
      - "JWT 만료 시간 15분 설정"
      - "Refresh Token Rotation 적용"
      - "IP 바인딩 또는 디바이스 핑거프린트"
    status: mitigated

  - id: TM-002
    stride: Information Disclosure
    description: "에러 응답에 스택트레이스 / DB 스키마 노출"
    component: Auth API
    severity: MEDIUM
    mitigation:
      - "프로덕션 환경 에러 응답 일반화"
      - "상세 에러는 내부 로그에만 기록"
    status: mitigated

  - id: TM-003
    stride: Elevation of Privilege
    description: "일반 사용자가 admin API 엔드포인트 접근"
    component: Auth API
    severity: CRITICAL
    mitigation:
      - "RBAC 미들웨어 적용"
      - "API Gateway 레벨 인가 검증"
      - "admin 엔드포인트 별도 네트워크 분리"
    status: in_progress
```

#### DREAD 위험도 평가

STRIDE로 위협을 **식별**했다면, DREAD로 **우선순위**를 매겨요.

| 기준 | 설명 | 점수 (1-10) |
|------|------|-------------|
| **D**amage (피해도) | 공격 성공 시 피해가 얼마나 큰가? | 1(미미) ~ 10(치명적) |
| **R**eproducibility (재현성) | 공격이 얼마나 쉽게 재현되나? | 1(어려움) ~ 10(항상) |
| **E**xploitability (악용 가능성) | 공격 실행이 얼마나 쉬운가? | 1(전문가만) ~ 10(누구나) |
| **A**ffected Users (영향 범위) | 얼마나 많은 사용자가 영향받나? | 1(소수) ~ 10(전체) |
| **D**iscoverability (발견 가능성) | 취약점이 얼마나 쉽게 발견되나? | 1(극히 어려움) ~ 10(공개됨) |

```python
# DREAD 점수 계산기
def calculate_dread(damage, reproducibility, exploitability, affected_users, discoverability):
    """DREAD 위험도 점수 계산 (평균)"""
    score = (damage + reproducibility + exploitability + affected_users + discoverability) / 5

    if score >= 8:
        return score, "CRITICAL", "즉시 수정 필요"
    elif score >= 6:
        return score, "HIGH", "이번 스프린트 내 수정"
    elif score >= 4:
        return score, "MEDIUM", "다음 스프린트 수정"
    else:
        return score, "LOW", "백로그에 추가"

# 예시: SQL Injection 취약점
score, level, action = calculate_dread(
    damage=9,            # DB 전체 유출 가능
    reproducibility=8,   # 쉽게 재현 가능
    exploitability=7,    # SQLMap 같은 도구로 자동화 가능
    affected_users=10,   # 전체 사용자 영향
    discoverability=8    # 스캐너로 쉽게 발견
)
# score=8.4, CRITICAL, "즉시 수정 필요"
```

```
실무 Threat Modeling 프로세스:

1️⃣ 범위 정의    → 어떤 시스템/기능을 분석할까?
2️⃣ DFD 작성     → Data Flow Diagram으로 시각화
3️⃣ STRIDE 적용  → 각 컴포넌트/데이터 흐름에 6가지 위협 대입
4️⃣ DREAD 평가   → 위험도 점수로 우선순위 결정
5️⃣ 대응 계획    → 완화/수용/전가/회피 결정
6️⃣ 검증         → 대응 조치 구현 후 재평가

⏰ 언제 하나요?
- 새로운 기능/서비스 설계 시 (필수!)
- 아키텍처 변경 시
- 분기별 정기 리뷰
- 보안 사고 발생 후
```

---

### 3. Security Champions 프로그램

#### 비유: 각 반의 안전 요원

학교에서 모든 안전 문제를 교감 선생님 한 분이 처리할 수 없잖아요? 각 반에 "안전 요원"을 두면 훨씬 효과적이에요. Security Champion은 **각 개발팀에 속한 보안 대변인**이에요.

#### Security Champion이란?

```
Security Champion ≠ 보안 전문가
Security Champion = 보안에 관심 있는 개발자 + 추가 보안 교육

역할:
├── 팀 내 보안 리뷰 1차 수행
├── Threat Modeling 세션 리드
├── 보안 도구 사용법 팀에 전파
├── 보안팀과 개발팀 사이 다리 역할
├── 팀 내 보안 이슈 트리아지 (1차 분류)
└── 보안 관련 의사결정 참여
```

#### Security Champions 프로그램 구축

```mermaid
flowchart TD
    subgraph SELECT["1️⃣ 선발"]
        S1["자원자 모집<br/>(강제 아님!)"]
        S2["팀당 1-2명"]
        S3["개발 경험 2년+<br/>보안에 관심"]
    end

    subgraph TRAIN["2️⃣ 교육"]
        T1["OWASP Top 10<br/>기본 교육"]
        T2["Threat Modeling<br/>워크숍"]
        T3["보안 도구<br/>실습"]
        T4["월 1회 Champion<br/>모임"]
    end

    subgraph PRACTICE["3️⃣ 실천"]
        P1["PR 보안 리뷰"]
        P2["팀 Threat<br/>Modeling 리드"]
        P3["보안 이슈<br/>1차 트리아지"]
        P4["보안 지식<br/>팀 내 전파"]
    end

    subgraph GROW["4️⃣ 성장"]
        G1["보안 컨퍼런스<br/>참석 지원"]
        G2["보안 인증<br/>취득 지원"]
        G3["경력 경로<br/>인정"]
        G4["성과 평가<br/>반영"]
    end

    SELECT --> TRAIN --> PRACTICE --> GROW
    GROW -->|"지속적 순환"| TRAIN

    style SELECT fill:#3498db,color:#fff
    style TRAIN fill:#e67e22,color:#fff
    style PRACTICE fill:#27ae60,color:#fff
    style GROW fill:#9b59b6,color:#fff
```

```yaml
# Security Champions 프로그램 운영 문서 예시
# security/champions-program.yaml
program:
  name: "Security Champions Program"
  owner: "Security Team"
  cadence:
    monthly_meeting: "매월 첫째 주 목요일 15:00"
    quarterly_training: "분기별 심화 교육"
    annual_review: "연 1회 프로그램 효과 평가"

champions:
  - name: "김개발"
    team: "결제 서비스팀"
    since: "2025-06"
    focus: "API 보안, 인증/인가"
    achievements:
      - "Threat Modeling 5회 리드"
      - "OWASP ZAP 도입 주도"

  - name: "이운영"
    team: "인프라팀"
    since: "2025-03"
    focus: "컨테이너 보안, IaC 보안"
    achievements:
      - "Trivy 파이프라인 통합"
      - "OPA 정책 15개 작성"

responsibilities:
  weekly:
    - "PR 보안 리뷰 (팀 내 최소 2건)"
    - "보안 스캔 결과 확인 및 트리아지"
  monthly:
    - "Champions 미팅 참석"
    - "팀 보안 현황 리포트"
  quarterly:
    - "Threat Modeling 세션 리드"
    - "보안 교육 콘텐츠 업데이트"

incentives:
  - "보안 컨퍼런스 참석비 지원"
  - "보안 인증(CSSLP, CEH) 비용 지원"
  - "성과 평가 시 활동 반영"
  - "Champion of the Quarter 선정 및 포상"
```

---

### 4. OWASP Top 10 — 반드시 알아야 할 웹 취약점

OWASP(Open Worldwide Application Security Project) Top 10은 **가장 심각한 웹 애플리케이션 보안 위험** 목록이에요. 개발자라면 반드시 알아야 해요.

```
OWASP Top 10 (2021 기준):

 순위  위험                              비유
 ─────────────────────────────────────────────────────────────
  A01  Broken Access Control             잠기지 않는 금고
  A02  Cryptographic Failures            약한 자물쇠 사용
  A03  Injection                         가짜 명령어 주입
  A04  Insecure Design                   설계 자체가 취약
  A05  Security Misconfiguration         문을 열어둔 채 퇴근
  A06  Vulnerable Components             썩은 부품 사용
  A07  Auth Failures                     허술한 출입 관리
  A08  Software/Data Integrity Failures  위조된 부품 사용
  A09  Logging/Monitoring Failures       CCTV 없는 건물
  A10  SSRF                              내부 직원이 외부에 문 열어줌
```

```python
# OWASP Top 10 취약점 → 자동화 도구 매핑
OWASP_TOOL_MAPPING = {
    "A01: Broken Access Control": {
        "sast": ["Semgrep (auth-rules)", "CodeQL"],
        "dast": ["OWASP ZAP (access-control plugin)"],
        "manual": ["권한 매트릭스 리뷰"],
        "prevention": "RBAC 미들웨어, 기본 거부 정책"
    },
    "A03: Injection": {
        "sast": ["Semgrep (injection-rules)", "Bandit"],
        "dast": ["OWASP ZAP (SQL Injection scanner)"],
        "manual": ["코드 리뷰 (사용자 입력 처리)"],
        "prevention": "Parameterized Query, ORM 사용"
    },
    "A06: Vulnerable Components": {
        "sca": ["Dependabot", "Snyk", "Trivy"],
        "sbom": ["Syft", "CycloneDX"],
        "manual": ["의존성 정기 검토"],
        "prevention": "자동 업데이트, 버전 고정, 취약점 알림"
    },
    "A09: Logging/Monitoring Failures": {
        "tools": ["ELK Stack", "Datadog", "CloudWatch"],
        "manual": ["로그 커버리지 검토"],
        "prevention": "구조화된 로깅, 보안 이벤트 알림"
    },
}
```

---

### 5. Security Pipeline 통합 — 전체 흐름

[파이프라인 보안](../07-cicd/12-pipeline-security)에서 개별 도구를 배웠다면, 이제 전체를 하나의 **통합 보안 파이프라인**으로 연결해볼게요.

#### 단계별 보안 게이트

```
개발자 PC          CI 파이프라인              CD 파이프라인          런타임
───────────       ─────────────────        ─────────────        ────────
Pre-commit    →   SAST  →  SCA  →         Container  →         Runtime
Hooks              정적분석   의존성검사     Scan   DAST          Protection
 │                  │         │              │      │              │
 ├ gitleaks        ├ Semgrep  ├ Dependabot  ├ Trivy ├ ZAP        ├ Falco
 ├ bandit          ├ CodeQL   ├ Snyk        ├ Grype ├ Nuclei     ├ RASP
 └ hadolint        └ SonarQube└ OSV-Scanner └ cosign└ Burp       └ WAF

            ←────── Shift Left ──────→           ←── Defense in Depth ──→
```

#### GitHub Actions 통합 보안 파이프라인

```yaml
# .github/workflows/devsecops-pipeline.yml
name: DevSecOps Pipeline

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

permissions:
  contents: read
  security-events: write
  pull-requests: write

jobs:
  # ──────────────────────────────────────
  # Stage 1: Secret Detection (가장 먼저!)
  # ──────────────────────────────────────
  secret-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  # ──────────────────────────────────────
  # Stage 2: SAST — 소스 코드 보안 분석
  # ──────────────────────────────────────
  sast:
    runs-on: ubuntu-latest
    needs: secret-scan
    steps:
      - uses: actions/checkout@v4

      # Semgrep — 빠르고 커스터마이징 가능
      - name: Semgrep Scan
        uses: semgrep/semgrep-action@v1
        with:
          config: >-
            p/owasp-top-ten
            p/python
            p/javascript
        env:
          SEMGREP_APP_TOKEN: ${{ secrets.SEMGREP_APP_TOKEN }}

      # CodeQL — GitHub 네이티브 깊은 분석
      - uses: github/codeql-action/init@v3
        with:
          languages: javascript, python
      - uses: github/codeql-action/autobuild@v3
      - uses: github/codeql-action/analyze@v3

  # ──────────────────────────────────────
  # Stage 3: SCA — 오픈소스 의존성 취약점 검사
  # ──────────────────────────────────────
  sca:
    runs-on: ubuntu-latest
    needs: secret-scan
    steps:
      - uses: actions/checkout@v4

      - name: Trivy Dependency Scan
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          severity: 'CRITICAL,HIGH'
          exit-code: '1'
          format: 'sarif'
          output: 'trivy-sca.sarif'

      - uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: trivy-sca.sarif
        if: always()

  # ──────────────────────────────────────
  # Stage 4: Container Image Scan
  # ──────────────────────────────────────
  container-scan:
    runs-on: ubuntu-latest
    needs: [sast, sca]
    steps:
      - uses: actions/checkout@v4

      - name: Build Image
        run: docker build -t myapp:${{ github.sha }} .

      - name: Trivy Image Scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: 'myapp:${{ github.sha }}'
          severity: 'CRITICAL,HIGH'
          exit-code: '1'
          format: 'sarif'
          output: 'trivy-image.sarif'

      # SBOM 생성
      - name: Generate SBOM
        uses: anchore/sbom-action@v0
        with:
          image: 'myapp:${{ github.sha }}'
          format: spdx-json
          output-file: sbom.spdx.json

      # 이미지 서명 (cosign)
      - name: Sign Image
        uses: sigstore/cosign-installer@v3
      - run: cosign sign --yes myapp:${{ github.sha }}
        env:
          COSIGN_EXPERIMENTAL: "true"

  # ──────────────────────────────────────
  # Stage 5: DAST — 동적 보안 테스트
  # ──────────────────────────────────────
  dast:
    runs-on: ubuntu-latest
    needs: container-scan
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      # Staging 환경에 배포 후 DAST 실행
      - name: Deploy to Staging
        run: ./scripts/deploy-staging.sh

      - name: OWASP ZAP Scan
        uses: zaproxy/action-baseline@v0.12.0
        with:
          target: 'https://staging.myapp.com'
          rules_file_name: '.zap/rules.tsv'
          fail_action: 'true'

  # ──────────────────────────────────────
  # Stage 6: Security Gate — 최종 판단
  # ──────────────────────────────────────
  security-gate:
    runs-on: ubuntu-latest
    needs: [sast, sca, container-scan, dast]
    if: always()
    steps:
      - name: Check Security Results
        run: |
          if [ "${{ needs.sast.result }}" == "failure" ] || \
             [ "${{ needs.sca.result }}" == "failure" ] || \
             [ "${{ needs.container-scan.result }}" == "failure" ]; then
            echo "::error::Security gate FAILED — 보안 취약점이 발견되었습니다!"
            exit 1
          fi
          echo "✅ All security checks passed!"
```

#### 보안 게이트 정책 설정

```yaml
# security/gate-policy.yaml — 언제 파이프라인을 차단할까?
gates:
  # PR 단계 — 엄격하게
  pull_request:
    sast:
      block_on: ["CRITICAL", "HIGH"]
      warn_on: ["MEDIUM"]
      allow: ["LOW", "INFO"]
    sca:
      block_on:
        - severity: "CRITICAL"
          fix_available: true       # 수정 가능한 Critical은 무조건 차단
        - severity: "HIGH"
          cvss_score: ">= 9.0"
      warn_on: ["HIGH"]
    secret_detection:
      block_on: ["*"]              # 모든 Secret 탐지 시 차단! (예외 없음)

  # main 브랜치 — 더 엄격하게
  main:
    container_scan:
      block_on: ["CRITICAL"]
      max_high: 5                  # HIGH 5개 초과 시 차단
    dast:
      block_on: ["HIGH"]

  # 정기 검사 — 기존 취약점도 관리
  scheduled:
    sca:
      notify_on: ["*"]            # 새 CVE 발견 시 Slack 알림
      create_issue_on: ["CRITICAL", "HIGH"]
```

---

### 6. Security Testing 자동화

#### 테스트 유형별 자동화 전략

```
보안 테스트 자동화 피라미드:

                    △
                   / \
                  /   \       침투 테스트 (Penetration Testing)
                 / 수동 \      → 분기별, 전문 업체 또는 내부 Red Team
                /───────\
               /         \    DAST (Dynamic)
              /  자동화    \   → 배포 후 자동 실행, Staging 환경
             /─────────────\
            /               \  IAST (Interactive)
           /    지속적       \  → 통합 테스트와 함께 실행
          /───────────────────\
         /                     \  SAST + SCA (Static)
        /      모든 커밋마다     \  → PR/커밋마다 자동 실행
       /─────────────────────────\
      /                           \  Pre-commit Hooks
     /        개발자 PC에서         \  → 커밋 전 로컬 실행
    /───────────────────────────────\

    아래로 갈수록: 빠르고, 저렴하고, 자주 실행
    위로 갈수록: 정밀하고, 비싸고, 덜 자주 실행
```

#### 커스텀 보안 테스트 작성

```python
# tests/security/test_auth_security.py
"""인증/인가 보안 자동 테스트"""
import pytest
import requests

BASE_URL = "https://staging.myapp.com/api"

class TestAuthSecurity:
    """A01: Broken Access Control 테스트"""

    def test_unauthenticated_access_blocked(self):
        """인증 없이 보호된 엔드포인트 접근 시 401 반환"""
        response = requests.get(f"{BASE_URL}/users/me")
        assert response.status_code == 401

    def test_user_cannot_access_other_user_data(self, normal_user_token):
        """일반 사용자가 다른 사용자의 데이터에 접근 불가"""
        headers = {"Authorization": f"Bearer {normal_user_token}"}
        # user_id=999는 다른 사용자
        response = requests.get(
            f"{BASE_URL}/users/999/profile",
            headers=headers
        )
        assert response.status_code == 403

    def test_user_cannot_access_admin_endpoint(self, normal_user_token):
        """일반 사용자가 관리자 엔드포인트 접근 불가"""
        headers = {"Authorization": f"Bearer {normal_user_token}"}
        response = requests.get(
            f"{BASE_URL}/admin/users",
            headers=headers
        )
        assert response.status_code == 403

    def test_expired_token_rejected(self, expired_token):
        """만료된 토큰으로 접근 시 401 반환"""
        headers = {"Authorization": f"Bearer {expired_token}"}
        response = requests.get(f"{BASE_URL}/users/me", headers=headers)
        assert response.status_code == 401


class TestInjectionPrevention:
    """A03: Injection 방어 테스트"""

    @pytest.mark.parametrize("payload", [
        "' OR '1'='1",
        "'; DROP TABLE users; --",
        "1 UNION SELECT * FROM users",
    ])
    def test_sql_injection_blocked(self, payload, auth_headers):
        """SQL Injection 페이로드가 차단되는지 확인"""
        response = requests.get(
            f"{BASE_URL}/search?q={payload}",
            headers=auth_headers
        )
        # 500이 아닌 정상 응답이어야 함 (에러가 아니라 빈 결과)
        assert response.status_code in [200, 400]
        assert "error" not in response.text.lower() or "sql" not in response.text.lower()

    @pytest.mark.parametrize("payload", [
        "<script>alert('xss')</script>",
        "<img src=x onerror=alert(1)>",
        "javascript:alert(1)",
    ])
    def test_xss_payload_sanitized(self, payload, auth_headers):
        """XSS 페이로드가 이스케이프되는지 확인"""
        response = requests.post(
            f"{BASE_URL}/comments",
            json={"content": payload},
            headers=auth_headers
        )
        if response.status_code == 200:
            # 저장된 내용에 원본 스크립트가 없어야 함
            assert "<script>" not in response.json().get("content", "")


class TestSecurityHeaders:
    """보안 헤더 검증"""

    def test_security_headers_present(self):
        """필수 보안 헤더가 설정되어 있는지 확인"""
        response = requests.get(BASE_URL)
        headers = response.headers

        assert "X-Content-Type-Options" in headers
        assert headers["X-Content-Type-Options"] == "nosniff"

        assert "X-Frame-Options" in headers
        assert headers["X-Frame-Options"] in ["DENY", "SAMEORIGIN"]

        assert "Strict-Transport-Security" in headers

        assert "Content-Security-Policy" in headers
```

```yaml
# 보안 테스트를 CI에 통합
# .github/workflows/security-tests.yml
security-integration-tests:
  runs-on: ubuntu-latest
  needs: deploy-staging
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-python@v5
      with:
        python-version: '3.12'

    - name: Install test dependencies
      run: pip install pytest requests

    - name: Run Security Tests
      run: |
        pytest tests/security/ \
          --tb=short \
          --junitxml=security-test-results.xml \
          -v
      env:
        TEST_BASE_URL: https://staging.myapp.com

    - name: Upload Results
      uses: actions/upload-artifact@v4
      with:
        name: security-test-results
        path: security-test-results.xml
      if: always()
```

---

### 7. Vulnerability Management Lifecycle

취약점은 "발견하고 끝"이 아니에요. 체계적인 **생명주기 관리**가 필요해요.

```mermaid
flowchart TD
    D["🔍 발견<br/>Discovery"]
    T["📋 분류<br/>Triage"]
    P["📊 우선순위<br/>Prioritize"]
    R["🔧 수정<br/>Remediate"]
    V["✅ 검증<br/>Verify"]
    C["📦 종료<br/>Close"]
    M["📈 모니터링<br/>Monitor"]

    D -->|"SAST/DAST/SCA<br/>자동 스캔"| T
    T -->|"중복 제거<br/>오탐 제외"| P
    P -->|"DREAD 점수<br/>비즈니스 영향"| R
    R -->|"코드 수정<br/>패치 적용"| V
    V -->|"재스캔으로<br/>수정 확인"| C
    C -->|"메트릭 기록"| M
    M -->|"새 취약점<br/>발견"| D

    T -->|"오탐<br/>(False Positive)"| FP["🚫 오탐 처리<br/>룰 업데이트"]
    P -->|"수용<br/>(Accept Risk)"| A["📝 위험 수용<br/>사유 기록"]

    style D fill:#3498db,color:#fff
    style T fill:#e67e22,color:#fff
    style P fill:#e74c3c,color:#fff
    style R fill:#9b59b6,color:#fff
    style V fill:#2ecc71,color:#fff
    style C fill:#27ae60,color:#fff
```

#### SLA 기반 취약점 수정 정책

```yaml
# security/vulnerability-sla.yaml
vulnerability_sla:
  # 심각도별 수정 기한
  critical:
    sla: "24시간"           # 발견 후 24시간 내 수정 또는 완화
    escalation: "즉시 CTO/CISO에게 보고"
    examples:
      - "RCE (Remote Code Execution)"
      - "인증 우회 (Authentication Bypass)"
      - "프로덕션 데이터 유출"

  high:
    sla: "7일"
    escalation: "3일 후 팀 리드에게 에스컬레이션"
    examples:
      - "SQL Injection"
      - "XSS (Stored)"
      - "SSRF"

  medium:
    sla: "30일"
    escalation: "14일 후 알림"
    examples:
      - "XSS (Reflected)"
      - "정보 노출 (Information Disclosure)"
      - "CSRF"

  low:
    sla: "90일"
    escalation: "60일 후 알림"
    examples:
      - "보안 헤더 미설정"
      - "쿠키 플래그 미설정"
      - "에러 메시지 정보 노출"

  # 예외 처리
  exception_process:
    approval_required: ["Security Lead", "Engineering Manager"]
    max_extension: "원래 SLA의 2배"
    documentation: "위험 수용 사유, 완화 조치, 재검토 일정"
```

#### 취약점 대시보드 구성

```python
# scripts/vuln-dashboard-metrics.py
"""취약점 관리 메트릭 수집 스크립트"""
from datetime import datetime, timedelta

def calculate_vulnerability_metrics(vulnerabilities: list[dict]) -> dict:
    """핵심 취약점 관리 메트릭 계산"""

    now = datetime.now()

    # 1. 심각도별 미해결 취약점 수
    open_by_severity = {
        "critical": 0, "high": 0, "medium": 0, "low": 0
    }
    for v in vulnerabilities:
        if v["status"] == "open":
            open_by_severity[v["severity"]] += 1

    # 2. MTTR (Mean Time to Remediate) — 평균 수정 시간
    resolved = [v for v in vulnerabilities if v["status"] == "closed"]
    mttr_by_severity = {}
    for severity in ["critical", "high", "medium", "low"]:
        severity_resolved = [
            v for v in resolved if v["severity"] == severity
        ]
        if severity_resolved:
            total_hours = sum(
                (v["resolved_at"] - v["discovered_at"]).total_seconds() / 3600
                for v in severity_resolved
            )
            mttr_by_severity[severity] = total_hours / len(severity_resolved)

    # 3. SLA 준수율
    sla_limits = {"critical": 24, "high": 168, "medium": 720, "low": 2160}
    sla_compliance = {}
    for severity, limit_hours in sla_limits.items():
        severity_resolved = [
            v for v in resolved if v["severity"] == severity
        ]
        if severity_resolved:
            within_sla = sum(
                1 for v in severity_resolved
                if (v["resolved_at"] - v["discovered_at"]).total_seconds() / 3600 <= limit_hours
            )
            sla_compliance[severity] = within_sla / len(severity_resolved) * 100

    # 4. Vulnerability Density (취약점 밀도)
    #    = 취약점 수 / 코드 라인 수 (KLOC)
    total_kloc = 150  # 예시: 15만 줄
    vuln_density = len([v for v in vulnerabilities if v["status"] == "open"]) / total_kloc

    # 5. 오탐률 (False Positive Rate)
    total_found = len(vulnerabilities)
    false_positives = len([v for v in vulnerabilities if v["status"] == "false_positive"])
    fp_rate = (false_positives / total_found * 100) if total_found > 0 else 0

    return {
        "open_vulnerabilities": open_by_severity,
        "mttr_hours": mttr_by_severity,
        "sla_compliance_percent": sla_compliance,
        "vulnerability_density_per_kloc": round(vuln_density, 2),
        "false_positive_rate_percent": round(fp_rate, 1),
    }

# 예시 출력:
# {
#   "open_vulnerabilities": {"critical": 0, "high": 3, "medium": 12, "low": 25},
#   "mttr_hours": {"critical": 8.5, "high": 72.3, "medium": 336.0, "low": 1200.0},
#   "sla_compliance_percent": {"critical": 95.0, "high": 88.5, "medium": 82.0, "low": 90.0},
#   "vulnerability_density_per_kloc": 0.27,
#   "false_positive_rate_percent": 12.3
# }
```

---

### 8. Security Metrics — 측정할 수 없으면 개선할 수 없다

#### 핵심 DevSecOps 메트릭

```
┌─────────────────────────────────────────────────────────────────┐
│                    DevSecOps 핵심 메트릭                         │
├─────────────────────┬───────────────────────────────────────────┤
│ MTTR for Vulns      │ 취약점 발견 → 수정 완료까지 평균 시간      │
│ (Mean Time to       │ 목표: Critical < 24h, High < 7d           │
│  Remediate)         │ 측정: (수정일 - 발견일)의 평균              │
├─────────────────────┼───────────────────────────────────────────┤
│ Vulnerability       │ 코드 1,000줄(KLOC) 당 취약점 수            │
│ Density             │ 목표: < 0.5 per KLOC                      │
│                     │ 측정: 미해결 취약점 수 / KLOC               │
├─────────────────────┼───────────────────────────────────────────┤
│ SLA Compliance      │ SLA 기한 내 수정 완료된 비율               │
│ Rate                │ 목표: Critical 95%, High 90%               │
│                     │ 측정: (SLA 내 수정 수 / 전체 수정 수) × 100 │
├─────────────────────┼───────────────────────────────────────────┤
│ Scan Coverage       │ 보안 스캔이 적용된 프로젝트 비율           │
│                     │ 목표: SAST 100%, DAST 80%, SCA 100%       │
│                     │ 측정: (스캔 적용 프로젝트 / 전체) × 100     │
├─────────────────────┼───────────────────────────────────────────┤
│ False Positive      │ 오탐(실제 취약점이 아닌 것) 비율           │
│ Rate                │ 목표: < 15%                                │
│                     │ 측정: (오탐 수 / 전체 탐지 수) × 100        │
├─────────────────────┼───────────────────────────────────────────┤
│ Security Debt       │ 미해결 보안 이슈의 누적량                  │
│                     │ 목표: 매 스프린트 감소 추세                 │
│                     │ 측정: 미해결 취약점 수 × 심각도 가중치       │
├─────────────────────┼───────────────────────────────────────────┤
│ Champion            │ Security Champion 활동 지표                │
│ Engagement          │ 목표: 월 2회 이상 보안 리뷰                │
│                     │ 측정: 리뷰 수, 교육 참석, 이슈 처리 건수    │
└─────────────────────┴───────────────────────────────────────────┘
```

#### Grafana 대시보드 예시 구성

```yaml
# grafana/dashboards/devsecops-metrics.json (핵심 패널 구성)
panels:
  - title: "Vulnerability MTTR Trend"
    type: timeseries
    query: |
      SELECT
        date_trunc('week', resolved_at) AS week,
        severity,
        AVG(EXTRACT(EPOCH FROM (resolved_at - discovered_at)) / 3600) AS mttr_hours
      FROM vulnerabilities
      WHERE status = 'closed'
      GROUP BY week, severity
      ORDER BY week
    description: "심각도별 주간 MTTR 추세"

  - title: "Open Vulnerabilities by Severity"
    type: gauge
    thresholds:
      - color: green
        value: 0
      - color: yellow
        value: 5
      - color: red
        value: 10

  - title: "SLA Compliance Rate"
    type: stat
    thresholds:
      - color: red
        value: 0
      - color: yellow
        value: 80
      - color: green
        value: 95

  - title: "Vulnerability Density per KLOC"
    type: timeseries
    description: "코드 규모 대비 취약점 밀도 추세"
```

---

### 9. DevSecOps Maturity Model — 우리 팀은 어디에 있나?

조직의 DevSecOps 성숙도를 평가하고 다음 단계를 계획하는 프레임워크예요.

```
DevSecOps Maturity Model (DSOMM 기반)

Level 0: 초기 (Initial)
─────────────────────────
• 보안은 "보안팀의 일"
• 수동 보안 검토 (릴리스 직전)
• 보안 도구 없음
• 취약점 관리 프로세스 없음
→ "불이 나야 소방차를 부르는 단계"

Level 1: 반복 (Managed)
─────────────────────────
• 기본 SAST/SCA 도구 도입
• CI 파이프라인에 일부 보안 스캔 통합
• 취약점 트래킹 시작 (스프레드시트)
• 보안 교육 연 1회
→ "소화기는 비치했지만 소방 훈련은 안 하는 단계"

Level 2: 정의 (Defined)
─────────────────────────
• Security Champions 프로그램 운영
• Threat Modeling 정기 수행
• 자동화된 보안 게이트 (PR 차단)
• Vulnerability SLA 정의 및 추적
• OWASP Top 10 교육 분기별
→ "소방 시스템 완비, 정기 소방 훈련 하는 단계"

Level 3: 측정 (Quantitatively Managed)
─────────────────────────
• MTTR, Vuln Density 등 메트릭 대시보드
• Security Debt 추적 및 감소 추세
• SBOM + Supply Chain 보안
• Compliance as Code 구현
• 보안 메트릭 기반 의사결정
→ "IoT 센서로 실시간 화재 감지, 데이터 기반 예방"

Level 4: 최적화 (Optimizing)
─────────────────────────
• 보안이 개발 문화에 완전 내재화
• AI 기반 취약점 예측 및 자동 수정
• Chaos Security Engineering
• Red Team / Blue Team 상시 운영
• 업계 벤치마크 대비 상위 수준
→ "자동 소화 시스템 + AI 화재 예측 + 완전 방재 건물"
```

#### 성숙도 자가 평가 체크리스트

```yaml
# security/maturity-assessment.yaml
assessment:
  culture:
    - question: "모든 개발자가 OWASP Top 10을 알고 있나요?"
      level_0: "아니오"
      level_1: "일부만"
      level_2: "대부분"
      level_3: "전원 + 정기 교육"
      level_4: "전원 + 실습 + CTF"

    - question: "Security Champion이 각 팀에 있나요?"
      level_0: "없음"
      level_1: "보안팀만 담당"
      level_2: "일부 팀에 Champion"
      level_3: "모든 팀에 Champion"
      level_4: "Champion + 자율 보안 개선"

  process:
    - question: "새 기능 개발 시 Threat Modeling을 하나요?"
      level_0: "안 함"
      level_1: "가끔"
      level_2: "주요 기능만"
      level_3: "모든 기능"
      level_4: "자동화 + 지속적 업데이트"

    - question: "취약점 수정 SLA가 있고 추적하나요?"
      level_0: "SLA 없음"
      level_1: "SLA만 정의"
      level_2: "SLA + 수동 추적"
      level_3: "SLA + 자동 추적 + 대시보드"
      level_4: "SLA + 예측적 관리"

  technology:
    - question: "CI/CD에 보안 스캔이 통합되어 있나요?"
      level_0: "없음"
      level_1: "SAST만"
      level_2: "SAST + SCA"
      level_3: "SAST + SCA + DAST + Container Scan"
      level_4: "전체 + Runtime Protection + AI 분석"

    - question: "보안 메트릭을 측정하고 있나요?"
      level_0: "측정 안 함"
      level_1: "취약점 수만"
      level_2: "MTTR + Vuln Count"
      level_3: "MTTR + Density + SLA Compliance + 대시보드"
      level_4: "예측 분석 + 벤치마킹 + 자동 개선"
```

---

## 💻 직접 해보기

### 실습 1: Threat Modeling 워크숍 (STRIDE)

```
시나리오: "온라인 쇼핑몰 결제 시스템"을 위협 모델링해 봐요.

아키텍처:
  사용자 → CDN → ALB → API Gateway → 결제 서비스 → PG사 API
                                        ↓
                                    PostgreSQL
                                        ↓
                                    Redis (세션)
```

```yaml
# 실습: STRIDE 적용 결과
# threat-model/payment-service.yaml
service: payment-service
participants: ["backend-dev", "security-champion", "infra-engineer"]

data_flows:
  - name: "사용자 → API Gateway"
    threats:
      - stride: Spoofing
        threat: "도난된 세션 토큰으로 다른 사용자의 결제 시도"
        dread: { D: 9, R: 7, E: 6, A: 8, D_disc: 5 }
        score: 7.0
        priority: HIGH
        mitigation: "세션 바인딩 (IP + Device Fingerprint)"

      - stride: Tampering
        threat: "결제 금액을 클라이언트에서 변조"
        dread: { D: 10, R: 9, E: 8, A: 10, D_disc: 7 }
        score: 8.8
        priority: CRITICAL
        mitigation: "서버사이드 금액 검증, 금액 서명 검증"

  - name: "결제 서비스 → PostgreSQL"
    threats:
      - stride: Information Disclosure
        threat: "카드 정보가 평문으로 DB에 저장"
        dread: { D: 10, R: 10, E: 3, A: 10, D_disc: 4 }
        score: 7.4
        priority: HIGH
        mitigation: "PCI DSS 준수, 토큰화, 암호화 저장"

      - stride: Repudiation
        threat: "결제 내역 변조 후 '결제한 적 없다' 부인"
        dread: { D: 8, R: 5, E: 4, A: 6, D_disc: 3 }
        score: 5.2
        priority: MEDIUM
        mitigation: "감사 로그 (변경 불가), 이벤트 소싱"

# 다음 단계:
#  1. CRITICAL/HIGH 대응 조치를 이번 스프린트 백로그에 추가
#  2. 대응 구현 후 재평가
#  3. 결과를 팀에 공유하고 Security Champion이 추적
```

### 실습 2: Pre-commit 보안 훅 설정

```bash
# 1. pre-commit 설치
pip install pre-commit

# 2. 설정 파일 생성
cat > .pre-commit-config.yaml << 'EOF'
repos:
  # Secret 탐지
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.0
    hooks:
      - id: gitleaks

  # Python 보안 린팅
  - repo: https://github.com/PyCQA/bandit
    rev: 1.7.7
    hooks:
      - id: bandit
        args: ['-ll', '-ii']  # LOW 이상, INFO 이상

  # Dockerfile 보안 검사
  - repo: https://github.com/hadolint/hadolint
    rev: v2.12.0
    hooks:
      - id: hadolint
EOF

# 3. Hook 설치
pre-commit install

# 4. 전체 파일 대상 테스트 실행
pre-commit run --all-files

# 5. 테스트: 일부러 Secret을 넣어보기
echo 'AWS_SECRET_KEY = "AKIAIOSFODNN7EXAMPLE"' > test_secret.py
git add test_secret.py
git commit -m "test"
# gitleaks..............................................................Failed
# - hook id: gitleaks
# - exit code: 1
#
# ○ Secret detected: test_secret.py:1
#   → AWS Secret Key가 감지되어 커밋 차단!

# 정리
rm test_secret.py
```

### 실습 3: 취약점 관리 대시보드 만들기

```yaml
# docker-compose.yml — DefectDojo (오픈소스 취약점 관리 플랫폼)
services:
  defectdojo:
    image: defectdojo/defectdojo-django:latest
    ports:
      - "8080:8080"
    environment:
      DD_DATABASE_URL: postgresql://defectdojo:password@db:5432/defectdojo
      DD_SECRET_KEY: "your-secret-key-change-me"
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: defectdojo
      POSTGRES_USER: defectdojo
      POSTGRES_PASSWORD: password
    volumes:
      - defectdojo-db:/var/lib/postgresql/data

volumes:
  defectdojo-db:
```

```bash
# DefectDojo에 스캔 결과 업로드 (CI에서 자동화)
# Trivy 결과를 DefectDojo에 업로드
curl -X POST "https://defectdojo.mycompany.com/api/v2/import-scan/" \
  -H "Authorization: Token ${DEFECTDOJO_TOKEN}" \
  -F "scan_type=Trivy Scan" \
  -F "file=@trivy-results.json" \
  -F "engagement=${ENGAGEMENT_ID}" \
  -F "verified=true" \
  -F "active=true"

# Semgrep 결과 업로드
curl -X POST "https://defectdojo.mycompany.com/api/v2/import-scan/" \
  -H "Authorization: Token ${DEFECTDOJO_TOKEN}" \
  -F "scan_type=Semgrep JSON Report" \
  -F "file=@semgrep-results.json" \
  -F "engagement=${ENGAGEMENT_ID}"
```

### 실습 4: Security Metrics 자동 수집

```yaml
# .github/workflows/security-metrics.yml
name: Security Metrics Collection

on:
  schedule:
    - cron: '0 9 * * 1'  # 매주 월요일 09:00 UTC

jobs:
  collect-metrics:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # 1. 취약점 밀도 계산
      - name: Count Lines of Code
        run: |
          KLOC=$(find src/ -name "*.py" -o -name "*.js" -o -name "*.ts" | \
                 xargs wc -l | tail -1 | awk '{print $1/1000}')
          echo "KLOC=${KLOC}" >> $GITHUB_ENV

      # 2. Trivy로 현재 취약점 수 수집
      - name: Trivy Scan
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          format: 'json'
          output: 'trivy-results.json'

      # 3. 메트릭 계산 및 전송
      - name: Calculate and Report Metrics
        run: |
          CRITICAL=$(jq '[.Results[].Vulnerabilities[]? | select(.Severity=="CRITICAL")] | length' trivy-results.json)
          HIGH=$(jq '[.Results[].Vulnerabilities[]? | select(.Severity=="HIGH")] | length' trivy-results.json)
          TOTAL=$((CRITICAL + HIGH))
          DENSITY=$(echo "scale=2; $TOTAL / $KLOC" | bc)

          echo "## Weekly Security Metrics" >> $GITHUB_STEP_SUMMARY
          echo "| Metric | Value |" >> $GITHUB_STEP_SUMMARY
          echo "|--------|-------|" >> $GITHUB_STEP_SUMMARY
          echo "| Critical Vulns | ${CRITICAL} |" >> $GITHUB_STEP_SUMMARY
          echo "| High Vulns | ${HIGH} |" >> $GITHUB_STEP_SUMMARY
          echo "| Vuln Density (per KLOC) | ${DENSITY} |" >> $GITHUB_STEP_SUMMARY
          echo "| Code Size (KLOC) | ${KLOC} |" >> $GITHUB_STEP_SUMMARY

      # 4. Slack 알림
      - name: Notify Slack
        uses: slackapi/slack-github-action@v1.25.0
        with:
          payload: |
            {
              "text": "📊 주간 보안 메트릭\nCritical: ${{ env.CRITICAL }}\nHigh: ${{ env.HIGH }}\nDensity: ${{ env.DENSITY }}/KLOC"
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_SECURITY_WEBHOOK }}
```

---

## 🏢 실무에서는?

### 스타트업 (10-50명) — Level 0 → Level 1

```
우선순위:
1. Pre-commit hooks (gitleaks) — 30분이면 설정 완료
2. GitHub Dependabot 활성화 — 클릭 몇 번이면 끝
3. Trivy를 CI에 추가 — 파이프라인 한 줄 추가
4. OWASP Top 10 팀 스터디 — 주 1회 30분

투자 시간: 주당 2-4시간
도구 비용: $0 (모두 무료/오픈소스)
효과: 가장 흔한 취약점 80% 자동 탐지
```

```yaml
# 스타트업용 최소 보안 파이프라인 (10분 설정)
# .github/workflows/basic-security.yml
name: Basic Security
on: [pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      # Secret Detection
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      # Dependency Scan
      - uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          severity: 'CRITICAL'
          exit-code: '1'
```

### 중견 기업 (50-500명) — Level 1 → Level 2

```
추가 투자:
1. Security Champions 프로그램 시작 (팀당 1명)
2. Threat Modeling 분기별 수행
3. SAST (Semgrep) + SCA (Trivy) + DAST (ZAP) 통합
4. Vulnerability SLA 정의 및 추적
5. 보안 교육 분기별 진행
6. DefectDojo로 취약점 중앙 관리

전담 인력: 보안 엔지니어 1-2명
도구 비용: $0-5,000/월
효과: 체계적 취약점 관리, 규정 준수 기반 마련
```

### 대기업/엔터프라이즈 (500명+) — Level 2 → Level 3/4

```
고급 투자:
1. Security Metrics 대시보드 (Grafana + 커스텀)
2. SBOM + Supply Chain Security (SLSA)
3. Runtime Protection (Falco, RASP)
4. Compliance as Code (OPA, Kyverno)
5. Red Team / Purple Team 운영
6. Bug Bounty 프로그램
7. AI 기반 취약점 분석/예측

전담 인력: AppSec팀 3-10명
도구 비용: $10,000-50,000+/월
효과: 선제적 보안, 규정 준수 자동화, 업계 리더 수준
```

### 실무 DevSecOps 문화 정착 팁

```
🎯 DO (해야 할 것):
─────────────────
✅ 보안을 "게이트"가 아닌 "가드레일"로 포지셔닝
   → "차단하는 것"이 아니라 "안전하게 가이드하는 것"

✅ 개발자가 직접 보안 이슈를 수정할 수 있도록 도구 + 교육 제공
   → "이 코드가 왜 위험한지" 설명하는 친절한 에러 메시지

✅ 작게 시작해서 점진적으로 확대
   → 처음부터 모든 도구를 도입하면 개발팀 저항만 생겨요

✅ 오탐(False Positive) 관리에 투자
   → 오탐이 많으면 개발자가 보안 알림을 무시하기 시작해요

✅ 보안 성과를 가시화하고 축하
   → "이번 분기 Critical 취약점 MTTR 50% 단축!" 공유


🚫 DON'T (하지 말아야 할 것):
──────────────────────────
❌ 보안팀이 일방적으로 도구를 강제
   → 개발팀과 함께 선정하고 파일럿 진행

❌ 모든 취약점을 동일하게 취급
   → Risk-based 우선순위로 정말 중요한 것부터

❌ "보안은 보안팀 책임" 문화 방치
   → 전사적 보안 인식 + Security Champions

❌ 메트릭 없이 "잘 하고 있다"고 판단
   → 데이터 기반 의사결정

❌ 처음부터 완벽한 보안을 목표
   → 점진적 개선 (Level 0 → 1 → 2 → ...)
```

---

## ⚠️ 자주 하는 실수

### 실수 1: 도구만 도입하고 문화는 무시

```
❌ "Semgrep 도입했으니 우리는 DevSecOps 한다!"
   → 개발자가 결과를 안 봄 → 알림 무시 → 취약점 방치

✅ 도구 도입 + 교육 + 프로세스 + 메트릭 = DevSecOps
   → Security Champion이 팀 내 결과 리뷰
   → 주간 보안 트리아지 미팅
   → MTTR 추적하며 개선
```

### 실수 2: 모든 것을 한 번에 도입

```
❌ Week 1: "SAST + DAST + SCA + IAST + SBOM + RASP 전부 켜!"
   → 수백 개 알림 → 개발팀 패닉 → "보안 끄자" 요구

✅ 점진적 도입 로드맵:
   Month 1: Pre-commit hooks + Secret detection (차단)
   Month 2: SAST - Critical만 차단, 나머지 경고
   Month 3: SCA + Dependabot 자동 PR
   Month 4: Container scanning
   Month 6: DAST (Staging 환경)
   Month 9: 전체 보안 게이트 강화
```

### 실수 3: 오탐(False Positive)을 관리하지 않음

```
❌ 보안 스캐너가 100건 탐지 → 70건이 오탐 → 개발자가 모든 알림 무시
   = "양치기 소년" 효과!

✅ 오탐 관리 프로세스:
   1. 오탐 발견 시 → 즉시 룰 예외 처리 또는 튜닝
   2. 오탐률 메트릭 추적 (목표: <15%)
   3. 커스텀 룰로 자사 코드 패턴에 맞게 조정
   4. 정기적으로 룰셋 리뷰 (분기별)
```

```yaml
# Semgrep 오탐 처리 예시
# .semgrep/settings.yml
# nosemgrep 코멘트로 개별 라인 예외 처리
# 예시: hash 함수를 비밀번호에 사용하는 게 아닌 경우
password_hash = hashlib.sha256(data).hexdigest()  # nosemgrep: use-defused-hashlib

# 파일/디렉토리 레벨 예외
exclude:
  - "tests/"           # 테스트 코드는 보안 스캔 제외
  - "migrations/"      # 자동 생성 코드 제외
  - "*_test.go"
```

### 실수 4: Threat Modeling을 "한 번 하고 끝"

```
❌ 프로젝트 시작 시 1회 Threat Model 작성 → 3년 동안 업데이트 안 함
   → 새 기능, 아키텍처 변경이 반영 안 됨

✅ Living Threat Model:
   - 새 기능/서비스 추가 시 → Threat Model 업데이트
   - 아키텍처 변경 시 → 해당 부분 재평가
   - 보안 사고 발생 후 → 교훈 반영
   - 최소 분기별 정기 리뷰
   - 코드 리포에 Threat Model 문서 함께 관리 (IaC처럼!)
```

### 실수 5: Security Champion을 "추가 업무"로 취급

```
❌ "원래 업무 100% + Champion 활동 추가" → 번아웃 → 이탈

✅ Champion 활동을 공식 업무로 인정:
   - 업무 시간의 10-20%를 Champion 활동에 할당
   - 성과 평가에 반영
   - 교육/컨퍼런스 비용 지원
   - Champion of the Quarter 포상
   - 커리어 성장 경로로 인정
```

### 실수 6: 메트릭을 수집만 하고 행동하지 않음

```
❌ "MTTR 대시보드 만들었어요!" → 매주 확인 → 숫자만 보고 끝
   → 3개월째 MTTR 동일 → "대시보드가 무슨 소용?"

✅ 메트릭 → 인사이트 → 행동 → 측정:
   1. MTTR Critical이 72시간? → SLA 24시간인데 왜?
   2. 분석: 수정 담당자 할당에 48시간 소요
   3. 행동: 자동 할당 + 에스컬레이션 정책 도입
   4. 재측정: MTTR Critical 18시간으로 단축! ✅
```

---

## 📝 마무리

### DevSecOps 핵심 요약

```mermaid
mindmap
  root((DevSecOps))
    문화
      공동 책임
      Security Champions
      지속적 교육
      보안 = 품질
    프로세스
      Shift Left
      Threat Modeling
        STRIDE
        DREAD
      Vulnerability Management
        SLA 기반
        Lifecycle 관리
    기술
      Security Pipeline
        Pre-commit
        SAST
        SCA
        Container Scan
        DAST
        Runtime Protection
      Security Metrics
        MTTR
        Vuln Density
        SLA Compliance
    성숙도
      Level 0 초기
      Level 1 반복
      Level 2 정의
      Level 3 측정
      Level 4 최적화
```

### 기억해야 할 핵심 원칙

```
1️⃣  Shift Left — 일찍 발견할수록 비용은 줄어들어요
2️⃣  사람 > 도구 — 도구는 수단일 뿐, 문화가 핵심이에요
3️⃣  자동화 우선 — 반복 작업은 기계에게, 판단은 사람에게
4️⃣  측정 → 개선 — 데이터 없이는 개선도 없어요
5️⃣  점진적 도입 — 완벽보다 시작이 중요해요 (Level 0 → 1이 가장 큰 변화!)
```

### DevSecOps 도입 로드맵

```
Phase 1 (1-2개월): 기초 다지기
├── Pre-commit hooks (gitleaks, hadolint)
├── Dependabot / Trivy 활성화
├── OWASP Top 10 팀 스터디
└── 목표: Level 0 → Level 1

Phase 2 (3-4개월): 자동화 강화
├── SAST (Semgrep) CI 통합
├── Container scanning CI 통합
├── Security Champions 1기 선발
├── 첫 Threat Modeling 워크숍
└── 목표: Level 1 → Level 2 진입

Phase 3 (5-8개월): 프로세스 정립
├── Vulnerability SLA 정의
├── DefectDojo 도입 (취약점 중앙 관리)
├── DAST (ZAP) Staging 자동화
├── Security Metrics 대시보드 v1
└── 목표: Level 2 안착

Phase 4 (9-12개월): 측정과 최적화
├── MTTR / Vuln Density / SLA Compliance 추적
├── SBOM + Supply Chain Security
├── Compliance as Code
├── 성숙도 재평가 및 다음 목표 설정
└── 목표: Level 2 → Level 3 진입
```

### 도구 선택 가이드

| 목적 | 무료/오픈소스 추천 | 엔터프라이즈 추천 |
|------|-------------------|-------------------|
| Secret Detection | gitleaks, detect-secrets | GitHub Advanced Security |
| SAST | Semgrep, CodeQL, Bandit | SonarQube Enterprise, Checkmarx |
| SCA | Dependabot, Trivy, OSV-Scanner | Snyk, Black Duck |
| DAST | OWASP ZAP, Nuclei | Burp Suite Enterprise, Rapid7 |
| Container Scan | Trivy, Grype | Prisma Cloud, Aqua Security |
| SBOM | Syft, CycloneDX CLI | Anchore Enterprise |
| Vuln Management | DefectDojo | Jira + Security Plugin, ServiceNow |
| Runtime Protection | Falco | Sysdig Secure, Aqua RASP |
| Threat Modeling | OWASP Threat Dragon, draw.io | IriusRisk, ThreatModeler |

---

## 🔗 다음 단계

```
현재 위치: DevSecOps ✅

선수 학습 (복습):
├── [파이프라인 보안](../07-cicd/12-pipeline-security) → SAST/DAST/SCA 도구 상세 실습
└── [컨테이너 보안](./03-container-security) → 이미지 스캐닝, rootless, 런타임 보안

다음 학습:
├── [인시던트 대응](./07-incident-response) → 보안 사고 대응 프로세스, IR Playbook
├── [AWS 보안 서비스](../05-cloud-aws/12-security) → GuardDuty, SecurityHub, WAF
└── [IaC 테스트와 정책](../06-iac/06-testing-policy) → Policy as Code, OPA, tfsec

실습 프로젝트:
1단계: Pre-commit hooks 설정 + 기본 보안 파이프라인 (30분)
2단계: Threat Modeling 워크숍 진행 (팀 프로젝트 대상)
3단계: 통합 보안 파이프라인 구축 (SAST + SCA + Container Scan)
4단계: Security Metrics 대시보드 구축 + 주간 리뷰 시작
5단계: Security Champions 프로그램 런칭
```

> **다음 강의 예고**: [인시던트 대응(Incident Response)](./07-incident-response)에서는 보안 사고가 실제로 발생했을 때 어떻게 대응하고 복구하는지를 배워볼 거예요. DevSecOps로 예방하는 것이 최선이지만, 100% 막을 수는 없으니까요. IR Playbook 작성, 포렌식 기초, 사고 후 개선(Post-Incident Review)까지 실무 중심으로 다뤄볼게요!
