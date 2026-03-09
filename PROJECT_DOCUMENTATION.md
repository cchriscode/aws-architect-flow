# AWS Architect Flow (ArchFlow) — 프로젝트 상세 문서

> **최종 업데이트**: 2026-03-09
> **라이브 URL**: https://archflow-aws.online

---

## 1. 프로젝트 개요

ArchFlow는 **14단계 위저드**를 통해 AWS 아키텍처를 자동 설계하는 교육용 웹 애플리케이션입니다.
사용자가 워크로드, 규모, SLO, 보안, 비용 등의 요구사항을 입력하면 다음을 자동 생성합니다:

- 아키텍처 다이어그램 (draw.io 호환)
- 월간 비용 추정 (8개 카테고리, 50+ 항목)
- AWS Well-Architected Framework 6대 필라 점수
- 보안 그룹 규칙 + Terraform/CDK IaC 코드
- 70+ 검증 규칙 기반 안티패턴 탐지
- 10단계 구현 체크리스트
- 컨텍스트 기반 서비스 추천 배지

---

## 2. 기술 스택

| 카테고리 | 기술 | 버전 |
|----------|------|------|
| **프레임워크** | Next.js (App Router) | 16.1.6 |
| **UI** | React | 19.2.3 |
| **언어** | TypeScript | ^5 |
| **CSS** | Tailwind CSS v4 + tw-animate-css | ^4 |
| **컴포넌트** | Radix UI (shadcn/ui, new-york 스타일) | ^1.4.3 |
| **아이콘** | lucide-react | ^0.577.0 |
| **인증** | NextAuth v5 (JWT 전략, Google OAuth) | ^5.0.0-beta.30 |
| **DB** | PostgreSQL + Prisma ORM | ^6.19.2 |
| **배포** | Vercel (Analytics 포함) | — |
| **테스트** | Vitest (스냅샷 테스트) | ^4.0.18 |
| **린트** | ESLint + eslint-config-next | ^9 |

---

## 3. 프로젝트 구조

```
aws_architect_flow/
├── prisma/
│   └── schema.prisma          # DB 스키마 (User, Account, HistoryEntry, Share)
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── page.tsx           # 메인 위저드 + 결과 뷰
│   │   ├── login/             # Google OAuth 로그인
│   │   ├── privacy/           # 개인정보처리방침
│   │   ├── history/           # 저장된 설계 이력
│   │   ├── glossary/          # AWS 용어사전 (120+ 용어)
│   │   ├── share/[id]/        # 공유 링크 뷰
│   │   ├── api/               # API 라우트
│   │   │   ├── auth/          # NextAuth 핸들러
│   │   │   ├── history/       # 이력 CRUD
│   │   │   ├── share/         # 공유 생성/조회
│   │   │   └── og/[id]/       # 동적 OG 이미지 생성
│   │   ├── opengraph-image.tsx # 기본 OG 이미지 (Edge)
│   │   └── layout.tsx         # 루트 레이아웃
│   ├── components/
│   │   ├── wizard/            # 위저드 UI (ProgressBar, QuestionCard, InfoPanel, TemplateSelector)
│   │   ├── result/            # 결과 탭 9개 (Summary, Arch, Diagram, Validation, Checklist, SG, Cost, WAFR, Code)
│   │   ├── layout/            # Header, UserMenu
│   │   ├── landing/           # HeroSection (랜딩 데모)
│   │   ├── auth/              # SessionProvider
│   │   └── ui/                # shadcn/ui 기본 컴포넌트 (button, card, dialog, tabs 등)
│   ├── data/
│   │   ├── glossary.ts        # 용어사전 DB (120+ 항목, 한/영, 비유 포함)
│   │   └── templates.ts       # 빠른 시작 템플릿 8종
│   ├── hooks/
│   │   ├── use-wizard.ts      # 위저드 상태 관리 훅
│   │   └── use-mobile.ts      # 모바일 감지 훅
│   └── lib/                   # ✨ 핵심 비즈니스 로직
│       ├── questions.ts       # 14단계 질문 정의 (조건부 노출 로직)
│       ├── questions-i18n.ts  # 질문 영문 번역
│       ├── architecture.ts    # 아키텍처 레이어 생성 엔진
│       ├── architecture-dict.ts # 아키텍처 i18n 사전
│       ├── cost.ts            # 월간 비용 추정 엔진
│       ├── wafr.ts            # Well-Architected 6대 필라 점수 엔진
│       ├── validate.ts        # 70+ 검증 규칙 엔진
│       ├── recommendations.ts # 컨텍스트 기반 추천 배지 엔진
│       ├── security-groups.ts # 보안 그룹 + IaC 코드 생성
│       ├── checklist.ts       # 10단계 구현 체크리스트 생성
│       ├── checklist-dict.ts  # 체크리스트 i18n 사전
│       ├── guardrails.ts      # 경험 수준 기반 가드레일
│       ├── code-snippets.ts   # Terraform/CDK 코드 스니펫
│       ├── diagram-xml.ts     # draw.io XML 생성 (100+ 셰이프 카탈로그)
│       ├── summary.ts         # 아키텍처 요약 (헤드라인, 복잡도, 롤아웃 경로)
│       ├── info-db.ts         # 서비스 정보 DB (한국어)
│       ├── info-db-en.ts      # 서비스 정보 DB (영어)
│       ├── history.ts         # 이력 API 클라이언트
│       ├── types.ts           # 전체 TypeScript 타입 정의
│       ├── prisma.ts          # Prisma 클라이언트 싱글턴
│       ├── auth.ts            # NextAuth 설정
│       ├── utils.ts           # cn() 유틸 (clsx + tailwind-merge)
│       ├── i18n/              # 다국어 시스템
│       │   ├── context.tsx    # LangProvider, useLang, useDict
│       │   ├── ko.ts          # 한국어 UI 사전
│       │   ├── en.ts          # 영어 UI 사전
│       │   └── types.ts       # Dict 타입 인터페이스 (330줄)
│       └── shared/            # 공유 유틸리티
│           ├── constants.ts   # 할인율, DAU 계수, 인증 목록
│           ├── state-accessors.ts # toArray, azToNum, deriveFlags
│           └── index.ts       # 재내보내기
└── docs/
    └── AUDIT_REPORT.md        # 113항목 감사 보고서
```

---

## 4. 데이터베이스 스키마

**PostgreSQL** + Prisma ORM

```
┌─────────────┐     ┌──────────────┐
│    User      │────▶│   Account    │  (Google OAuth)
│  id (UUID)   │     │  provider    │
│  name        │     │  access_token│
│  email       │     └──────────────┘
│  image       │
└──────┬───────┘
       │
       ├──▶ HistoryEntry          # 사용자별 설계 이력
       │    ├─ state (JSON)       # 전체 WizardState 스냅샷
       │    ├─ headline           # "EKS + Aurora + Redis"
       │    ├─ monthlyCost        # 월간 추정 비용
       │    └─ wafrScore          # WAFR 전체 점수
       │
       └──▶ Share                 # 공유 링크 (로그인 불필요)
            ├─ shortId (unique)   # 8자 base64url
            ├─ state (JSON)       # WizardState
            ├─ expiresAt          # 90일 후 만료
            └─ serviceCount       # 사용 서비스 수
```

---

## 5. 14단계 위저드 흐름

사용자의 아키텍처 의사결정 사고 순서를 그대로 따릅니다:

```
① 워크로드 유형    "무엇을 만드는가?" (웹API, 이커머스, 티켓팅, 실시간, 데이터, SaaS, IoT, 내부)
      ↓
② 팀 역량         "누가 만드는가?" (팀 규모, 클라우드 경험, 운영 모델, 언어/프레임워크)
      ↓
③ 규모            "얼마나 큰가?" (DAU, 피크 RPS, 트래픽 패턴, 데이터 볼륨)
      ↓
④ 컴플라이언스     "어떤 규제를 따르는가?" (PCI, HIPAA, SOX, GDPR, ISMS/ISMS-P, 암호화, 네트워크 격리)
      ↓
⑤ SLO             "얼마나 안정적이어야 하는가?" (가용성 99~99.99%, RTO, RPO, 멀티리전)
      ↓
⑥ 비용 전략        "비용을 어떻게 최적화하는가?" (약정, 스팟, 비용/균형/성능 우선)
      ↓
⑦ 데이터           "데이터를 어떻게 저장하는가?" (DB 종류, HA 모드, 캐시, 스토리지, 검색)
      ↓
⑧ 컴퓨트           "어떻게 실행하는가?" (서버리스, 컨테이너, VM, 하이브리드)
      ↓
⑨ 플랫폼(EKS)     "쿠버네티스를 어떻게 구성하는가?" (노드, GitOps, 서비스메시, 모니터링, 시크릿)
      ↓
⑩ 네트워크         "네트워크를 어떻게 설계하는가?" (계정 구조, AZ, 서브넷, NAT, 하이브리드)
      ↓
⑪ 통합             "서비스를 어떻게 연결하는가?" (동기/비동기, 큐, 배치, 인증, API 타입)
      ↓
⑫ 앱스택           "API를 어떻게 관리하는가?" (게이트웨이, 프로토콜, 서비스 디스커버리)
      ↓
⑬ 엣지             "사용자 접점을 어떻게 관리하는가?" (CDN, WAF, DNS 라우팅)
      ↓
⑭ CI/CD            "어떻게 배포하는가?" (IaC 도구, 파이프라인, 배포 전략, 환경 수)
      ↓
🎯 결과 생성        9개 탭으로 결과 표시
```

### 조건부 흐름

- **⑨ 플랫폼 단계**: EKS 선택 시에만 노출
- **⑫ 앱스택 단계**: VM(EC2) 선택 시 스킵
- 각 질문의 옵션도 이전 답변에 따라 조건부 표시 (예: Spring Cloud Gateway는 Spring Boot 선택 시에만)

---

## 6. 핵심 알고리즘

### 6.1 비용 추정 엔진 (`cost.ts`)

**입력**: WizardState, 언어
**출력**: `CostEstimate { totalMin, totalMid, totalMax, items[] }`

```
                    ┌─────────────────┐
                    │  WizardState    │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        DAU Scale      Commitment      Spot Discount
        (0.5x~8x)     (0.34~1.0)      (0.30~1.0)
              │              │              │
              └──────────────┼──────────────┘
                             ▼
                    8개 카테고리별 계산
                             │
    ┌────────┬────────┬──────┴──────┬────────┬────────┬────────┬────────┐
    ▼        ▼        ▼            ▼        ▼        ▼        ▼        ▼
 Compute  Database  Network     Edge    Storage  Messaging  Ops    Multi-Region
```

**비용 수정자**:
| 수정자 | 값 |
|--------|-----|
| EC2 3년 약정 | 34% (66% 절감) |
| EC2 1년 약정 | 65% (35% 절감) |
| Fargate 3년 약정 | 60% (40% 절감) |
| Fargate 1년 약정 | 78% (22% 절감) |
| 스팟 Heavy | 30% (70% 절감) |
| DAU xlarge (100만+) | 8x 배수 |
| DAU tiny (1만 이하) | 0.5x 배수 |

**패턴**: `I(category, serviceName, description, minCost, maxCost)` 헬퍼로 항목 추가

---

### 6.2 Well-Architected 점수 엔진 (`wafr.ts`)

**6대 필라 × 항목별 점수 = 전체 점수**

```
┌──────────────────────────────────────────────────────────────┐
│                    WAFR 6대 필라                              │
├─────────────┬────────────┬───────────┬───────────┬──────────┤
│ 운영 우수성  │   보안     │  안정성    │  성능 효율 │ 비용 최적│
│ (IaC,CI/CD  │ (암호화,   │ (Multi-AZ, │ (캐시,CDN │ (약정,   │
│  모니터링,   │  WAF,인증, │  DB HA,    │  스케일링, │  스팟,   │
│  GitOps)    │  격리,인증) │  백업,DNS) │  Graviton) │  NAT)   │
├─────────────┴────────────┴───────────┴───────────┴──────────┤
│                      지속 가능성                              │
│              (유휴자원, 스팟, CDN, 오토스케일링)                │
└──────────────────────────────────────────────────────────────┘
```

**점수 계산**:
```typescript
// 각 항목: { question, maxPts, earnedPts, recommendation }
// 필라 점수 = sum(earnedPts) / sum(maxPts) × 100
// 전체 점수 = 6개 필라 평균
```

**컨텍스트 인식**: 워크로드 유형에 따라 항목 포함/제외
- 내부 전용 → WAF 점수 제외
- 데이터 파이프라인 → CDN 점수 제외
- 서버리스 → 컴퓨트 관리 항목 자동 만점

---

### 6.3 검증 규칙 엔진 (`validate.ts`)

**70+ 규칙**, 심각도 2단계:

| 심각도 | 설명 | 예시 |
|--------|------|------|
| **ERROR** | 아키텍처 실패 위험 | 99.99% + 단일AZ, PCI + 암호화 미적용, Spring Boot + Lambda |
| **WARN** | 개선 권장 | 캐시 미사용 (대규모), WAF 미적용 (퍼블릭), beginner + EKS |

**패턴**: `E(title, message, phases)` / `W(title, message, phases)` 헬퍼

---

### 6.4 아키텍처 다이어그램 엔진 (`architecture.ts` + `diagram-xml.ts`)

```
WizardState → generateArchitecture() → Architecture { layers[] }
                                             │
                                             ▼
                                     generateDiagramXml()
                                             │
                                             ▼
                                    draw.io 호환 XML
                                    (100+ AWS 셰이프 카탈로그)
```

**레이어 구성**:
1. Organization — 계정 구조
2. Network — VPC, 서브넷, NAT, VPN/DX
3. Edge — Route53, CloudFront, WAF
4. Compute — EKS/ECS/Lambda/App Runner
5. Data — DB, 캐시, 검색, 스토리지
6. Integration — 메시징, 이벤트, API
7. Monitoring — CloudWatch, Prometheus
8. CI/CD — CodePipeline, ArgoCD
9. Security — GuardDuty, Inspector, IAM
10. Cost — 비용 최적화 권고

각 서비스에 `name`, `detail`, `reason`(선택 이유), `cost`(비용), `opt`(최적화 팁) 포함.

---

### 6.5 보안 그룹 엔진 (`security-groups.ts`)

```
WizardState → generateSecurityGroups()
                    │
                    ├─→ SG 규칙 목록 (시각화용)
                    ├─→ Terraform HCL 코드
                    └─→ AWS CDK TypeScript 코드
```

**생성되는 SG**:
| SG | 인바운드 포트 | 소스 |
|----|-------------|------|
| ALB/NLB SG | 80, 443 | 0.0.0.0/0 |
| App SG | 8080/3000/8000 (언어별) | ALB SG |
| DB SG | 5432/3306/27017/8182 (DB별) | App SG, Lambda SG |
| Cache SG | 6379/8111 | App SG |
| MQ SG | 5671 (AMQP TLS) | App SG |
| MSK SG | 9094 (Kafka TLS) | App SG |

---

### 6.6 추천 엔진 (`recommendations.ts`)

```
WizardState의 컨텍스트 분석
       │
       ├─ DAU, 팀 규모, 경험, 워크로드 유형
       ├─ 성장 단계, RPS, 트래픽 패턴
       └─ 비용 우선순위
       │
       ▼
R(phase, questionId, optionValue, badge, reason)
       │
       ▼
QuestionCard에 배지 표시: ⭐필수 / ✨추천 / 🍃비용절감
```

---

### 6.7 가드레일 시스템 (`guardrails.ts`)

**경험 수준 기반 경고**:
| 최소 경험 | 서비스/옵션 |
|----------|------------|
| **senior** | Istio, OPA/Gatekeeper, Cilium, Rust, Kong, MSK |
| **mid** | EKS, EC2 노드, Prometheus, Canary, CloudFormation, OpenSearch, Kinesis, DocumentDB, Neptune, Amazon MQ |

**컨텍스트 경고**: PCI 감사 부담, HIPAA BAA 필요, SLO 비용 영향 등

---

## 7. 상태 관리

### `useWizard()` 훅 (`hooks/use-wizard.ts`)

```
┌────────────────────────────────────────────────┐
│                 WizardState                     │
│  Record<phaseId, Record<questionId, answer>>    │
├────────────────────────────────────────────────┤
│  localStorage 자동 저장 (aws_arch_designer_v1)  │
│  URL ?d=<base64> 파라미터로 가져오기 지원         │
│  의존성 클리어: 부모 답변 변경 시 자식 자동 초기화  │
│  단계 스킵: skipPhase() 조건에 따라 자동 건너뛰기  │
│  템플릿 적용: 8종 프리셋 → 전체 상태 프리필        │
└────────────────────────────────────────────────┘
```

**의존성 클리어 예시**:
- `arch_pattern` 변경 → `orchestration`, `compute_node`, 전체 `platform` 단계 초기화
- `workload.type` 변경 → 하위 디테일 질문 초기화

---

## 8. 다국어 시스템 (i18n)

```
LangProvider (React Context)
       │
       ├─ useLang() → { lang: "ko" | "en", setLang }
       └─ useDict() → Dict 객체 (330줄 타입 인터페이스)
```

**3가지 i18n 레이어**:

| 레이어 | 파일 | 용도 |
|--------|------|------|
| **UI 사전** | `i18n/ko.ts`, `i18n/en.ts` | 버튼, 레이블, 안내 문구 |
| **질문 번역** | `questions-i18n.ts` | 위저드 질문/옵션 텍스트 |
| **엔진 사전** | 각 엔진 파일 내 인라인 | 비용, WAFR, 검증 등 결과 텍스트 |

**패턴**: 엔진 내부에서 `lang==="ko" ? "한국어" : "English"` 인라인 삼항 연산자 사용

---

## 9. 공유 기능

```
사용자 → "공유" 클릭
       │
       ▼
POST /api/share  ←── { state, completedPhases }
       │
       ├─ shortId 생성 (8자 base64url, 충돌 시 재시도)
       ├─ 요약 계산 (headline, cost, WAFR, serviceCount)
       └─ DB 저장 (90일 만료)
       │
       ▼
https://archflow-aws.online/share/{shortId}
       │
       ├─ 서버 컴포넌트: 메타데이터 생성 (OG 태그)
       ├─ 동적 OG 이미지: /api/og/{shortId} (1200×630 PNG)
       └─ 클라이언트: 전체 결과 뷰 (9탭)
```

---

## 10. 용어사전

**120+ 용어**, 5개 배지 필터:

| 배지 | 설명 | 용어 수 |
|------|------|---------|
| AWS | AWS 서비스 | ~60 |
| General | 일반 개념 | ~30 |
| K8s | 쿠버네티스 생태계 | ~20 |
| Docker | 도커/컨테이너 | 7 |

각 용어 포함 정보:
- `name`, `desc` (한/영 설명)
- `placement` (아키텍처 위치: edge, vpc-public, vpc-private, vpc-isolated, regional-managed, account-level, concept)
- `related` (관련 서비스 링크)
- `analogy` (한/영 비유 설명 — 비전공자 이해 지원)

---

## 11. 빠른 시작 템플릿

8종의 프리셋으로 14단계를 즉시 완료:

| 템플릿 | 워크로드 | 아키텍처 |
|--------|---------|---------|
| 이커머스 MVP | ecommerce | 서버리스 + DynamoDB |
| B2B SaaS | saas | ECS Fargate + Aurora |
| 실시간 채팅 | realtime | ECS + ElastiCache |
| IoT 플랫폼 | iot | 서버리스 + Timestream |
| 데이터 파이프라인 | data | Glue + Athena + Redshift |
| 티켓팅 시스템 | ticketing | ECS + Redis + DynamoDB |
| 엔터프라이즈 EKS | saas | EKS + Aurora + Istio |
| 미니멀 내부 도구 | internal | 서버리스 + RDS |

---

## 12. 테스트 전략

**Vitest** 스냅샷 테스트 기반:

```
src/lib/__tests__/
├── fixtures.ts                          # 공유 테스트 픽스처 (WizardState 샘플)
├── cost.snapshot.test.ts               # 비용 추정 스냅샷
├── architecture.snapshot.test.ts       # 아키텍처 생성 스냅샷
├── wafr.snapshot.test.ts               # WAFR 점수 스냅샷
├── validate.snapshot.test.ts           # 검증 규칙 스냅샷
├── recommendations.snapshot.test.ts    # 추천 배지 스냅샷
├── checklist.snapshot.test.ts          # 체크리스트 스냅샷
├── summary.snapshot.test.ts            # 요약 스냅샷
├── security-groups.snapshot.test.ts    # 보안 그룹 스냅샷
├── code-snippets.snapshot.test.ts      # 코드 스니펫 스냅샷
└── shared/
    ├── state-accessors.test.ts         # 유닛 테스트
    └── constants.test.ts               # 상수 검증
```

**233개 테스트**, 모든 엔진의 결과를 다양한 입력 조합으로 스냅샷 검증.

---

## 13. 지원 AWS 서비스 목록

### 사용자 선택 가능 서비스 (~40개)

**컴퓨트**: EKS, ECS, Lambda, Fargate, EC2, App Runner, AWS Batch
**데이터베이스**: Aurora (PG/MySQL), RDS (PG/MySQL), DynamoDB, DocumentDB, Neptune, Timestream
**캐시**: ElastiCache Redis, DAX, MemoryDB
**메시징**: SQS, SNS, Kinesis, MSK, EventBridge, Amazon MQ, Step Functions
**서비스 메시**: VPC Lattice, App Mesh (EOL 경고), Istio, ECS Service Connect
**API 게이트웨이**: AWS API Gateway, ALB, Spring Cloud Gateway, Kong
**GitOps**: ArgoCD, Flux v2
**모니터링**: CloudWatch, Prometheus+Grafana, Datadog
**IaC**: Terraform, CDK, CloudFormation, Pulumi
**CI/CD**: CodePipeline, GitHub Actions, GitLab CI

### 자동 포함 서비스 (~20개)

**보안**: GuardDuty, Inspector, Macie, Security Hub, IAM Access Analyzer, Audit Manager, WAF, Shield
**데이터**: Athena, Redshift Serverless, Glue, QuickSight, Kinesis Firehose, SageMaker
**인프라**: VPC, Route53, CloudFront, ACM, NAT Gateway, VPC Endpoints, CloudTrail, AWS Config

---

## 14. 디자인 시스템

| 요소 | 값 |
|------|-----|
| **주 색상** | Indigo (bg-indigo-600) |
| **성공** | Emerald |
| **경고** | Amber |
| **오류** | Red |
| **WAFR** | Violet |
| **폰트** | Pretendard (CDN, variable subset) |
| **Border Radius** | 0.625rem (기본) |
| **반응형** | 모바일 퍼스트, `md:` 브레이크포인트 |
| **다크 모드** | CSS 변수 준비 (미활성) |

---

## 15. SEO & 메타데이터

- `robots.ts`: `/api/`, `/history` 차단
- `sitemap.ts`: 4개 URL (홈, 용어사전, 로그인, 개인정보)
- JSON-LD: WebApplication 스키마
- OG/Twitter 카드: 동적 이미지 생성 (Edge Runtime)
- Google/Naver 사이트 인증 메타 태그

---

## 16. 개발 명령어

```bash
# 개발 서버
npm run dev

# 프로덕션 빌드
npm run build

# 테스트
npm test              # watch 모드
npm run test:run      # 1회 실행

# 스냅샷 업데이트
npx vitest run --update

# Prisma
npx prisma generate   # 클라이언트 생성
npx prisma db push    # 스키마 적용
npx prisma studio     # DB GUI

# 린트
npm run lint
```
