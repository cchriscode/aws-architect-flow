# AWS Architect Flow

14단계 위저드를 통해 AWS 아키텍처를 자동 설계하는 웹 애플리케이션입니다.
사용자의 요구사항(워크로드, 규모, SLO, 보안 등)을 수집하고, AWS 베스트 프랙티스에 기반한 아키텍처 결과물을 생성합니다.

> **Live**: Vercel에 배포 | **Stack**: Next.js 16 + React 19 + TypeScript + Tailwind CSS

---

## 주요 기능

### 14단계 설계 위저드
워크로드 유형 → 팀 구성 → 규모 → 데이터 → SLO → 네트워크 → 컴퓨팅 → 통합 → K8s 플랫폼(EKS 전용) → 엣지/CDN → CI/CD → 비용 → 컴플라이언스 → 모니터링

### 6가지 결과물 자동 생성
| 결과물 | 설명 |
|--------|------|
| **아키텍처 다이어그램** | 서비스 배치, 서브넷 구조, 연결 관계 시각화 |
| **WAFR 점수** | Well-Architected 6 Pillar 점수 (보안/안정성/성능/비용/운영/지속가능성) |
| **월간 비용 추정** | 서울 리전(ap-northeast-2) 기준 min~max 범위 |
| **검증 경고/에러** | 50+ 규칙으로 안티패턴 자동 감지 |
| **구현 체크리스트** | 10단계 구현 가이드 (AWS 콘솔 설정 수준) |
| **보안 그룹 체인** | 계층별 SG 규칙 + CDK/Terraform 코드 |

### 추가 기능
- **8개 퀵스타트 템플릿** (이커머스 MVP, B2B SaaS, 실시간 채팅, IoT 등)
- **비용/성능 우선 추천 배지** (옵션별 컨텍스트 기반 추천)
- **경험 기반 가드레일** (비용 주의, 운영 복잡도 경고)
- **한국어/영어 완전 지원** (i18n)
- **Google 로그인** (NextAuth.js)
- **설계 이력 저장** (Prisma + DB)

---

## 프로젝트 구조

```
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # 메인 위저드 페이지
│   ├── login/                    # 로그인
│   ├── history/                  # 설계 이력
│   └── api/                      # API 라우트 (auth, history)
├── components/
│   ├── wizard/                   # 위저드 UI 컴포넌트
│   ├── result/                   # 결과 화면 컴포넌트
│   └── layout/                   # 헤더, 레이아웃
├── data/
│   ├── templates.ts              # 8개 퀵스타트 템플릿
│   └── phases.ts                 # 14단계 위저드 페이즈 정의
└── lib/
    ├── validate.ts               # 검증 규칙 엔진 (50+ rules)
    ├── cost.ts                   # 비용 추정 엔진
    ├── wafr.ts                   # WAFR 6 Pillar 점수
    ├── recommendations.ts        # 컨텍스트 기반 추천
    ├── architecture.ts           # 아키텍처 다이어그램 생성
    ├── checklist.ts              # 구현 체크리스트
    ├── guardrails.ts             # 경험 기반 가드레일
    ├── security-groups.ts        # 보안 그룹 규칙 + IaC 코드
    ├── summary.ts                # 결과 요약
    ├── info-db.ts                # 서비스 정보 툴팁 (KO)
    ├── info-db-en.ts             # 서비스 정보 툴팁 (EN)
    ├── questions.ts              # 위저드 질문 정의
    ├── questions-i18n.ts         # 질문 ko/en 번역
    └── i18n/                     # UI 번역 (ko.ts, en.ts)
```

---

## 시작하기

### 필수 요구사항
- Node.js 18+
- npm / yarn / pnpm

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
npm start
```

`http://localhost:3000`에서 확인할 수 있습니다.

### 환경 변수

```env
# NextAuth.js (Google OAuth)
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

# Database (Prisma)
DATABASE_URL=
```

---

## 핵심 로직 설명

### 검증 엔진 (validate.ts)
사용자 선택 조합에서 AWS 안티패턴을 감지합니다.

```
예시 규칙:
- 99.95% 가용성 + Single-AZ → ERROR (HA 불가)
- PCI-DSS + DynamoDB + 비엄격 암호화 → ERROR (CMK 필수)
- Cost-first + 3-AZ → WARNING (비용 과다)
- Canary 배포 + 실시간 서비스 → WARNING (WebSocket 연결 드롭)
```

### 비용 엔진 (cost.ts)
서울 리전(ap-northeast-2) 기준 월간 비용을 min~max 범위로 추정합니다.

```
주요 가격 기준:
- NAT Gateway: $43/mo + $0.059/GB
- EKS Control Plane: $73/mo
- Fargate Savings Plans: 3yr 52%, 1yr 22% 할인
- EC2 Reserved Instance: 3yr 66%, 1yr 35% 할인
- RDS Multi-AZ: 인스턴스 비용 2.0x
```

### WAFR 점수 (wafr.ts)
AWS Well-Architected Framework 6개 Pillar별 점수를 산출합니다.

```
6 Pillars:
1. Security (보안)         — 인증, 암호화, 네트워크 격리, 감사
2. Reliability (안정성)     — AZ, DB HA, 배포 롤백, 캐시
3. Performance (성능)       — 아키텍처, 스케일링, Graviton
4. Cost Optimization (비용) — 약정, Spot, NAT, 서버리스
5. Operational Excellence   — 모니터링, IaC, GitOps
6. Sustainability (지속가능) — 서버리스, 컨테이너, 유휴 최적화
```

---

## 품질 보증

113건의 감사 수정을 거쳐 AWS 공식 레퍼런스 및 베스트 프랙티스와 일치하도록 보정되었습니다.

- **검증 규칙**: AWS 안티패턴 레퍼런스 대조 완료
- **비용 추정**: ap-northeast-2 실제 가격 검증 완료
- **WAFR 점수**: 6 Pillar 점수 반전/불균형 해소
- **텍스트**: 팩트 정확성, 가독성, ko/en 번역 일치 검증

자세한 감사 내역은 [`docs/AUDIT_REPORT.md`](docs/AUDIT_REPORT.md)를 참조하세요.

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19 + Tailwind CSS + Radix UI |
| Auth | NextAuth.js v5 (Google OAuth) |
| Database | Prisma ORM |
| Deploy | Vercel |
| Analytics | Vercel Web Analytics |
| Language | TypeScript (strict) |

---

## 라이선스

Private repository.
