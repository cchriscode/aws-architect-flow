# AWS Architecture Wizard - 사고 흐름 (Thinking Flow)

이 문서는 AWS 아키텍처 위자드가 사용자 입력을 받아 아키텍처를 구상하는 전체 사고 흐름을 설명합니다.

---

## 전체 파이프라인 개요

```
사용자 입력 (14단계 위자드)
    ↓
WizardState (중첩 객체)
    ↓
generateArchitecture() → 13개 레이어 아키텍처
    ↓
9개 분석 함수 병렬 실행
    ├─ validateState()         → 78+ 검증 규칙
    ├─ estimateMonthlyCost()   → 비용 산정 (min/mid/max)
    ├─ wellArchitectedScore()  → AWS 5대 축 점수
    ├─ generateChecklist()     → 구현 체크리스트
    ├─ generateSecurityGroups()→ 보안그룹 규칙
    ├─ generateCodeSnippets()  → Terraform/CDK 코드
    ├─ getRecommendations()    → 옵션별 배지/추천
    ├─ generateSummary()       → 요약 보고서
    └─ checkGuardrails()       → 실시간 가드레일
    ↓
결과 화면 (10개 탭)
```

---

## 1단계: 사용자 입력 수집 (14개 Phase)

### Phase 순서 및 핵심 질문

| Phase | ID | 주제 | 핵심 결정 사항 |
|-------|----|------|---------------|
| 1 | `workload` | 서비스 정의 | **무엇을 만드는가?** 서비스 유형(이커머스/티켓팅/실시간/SaaS/IoT 등) + 성장 단계(MVP/성장/확장/성숙) + 비즈니스 모델 |
| 2 | `team` | 팀/운영 | **누가 운영하는가?** 팀 규모 + AWS 경험(초급/중급/시니어) + 운영 모델 + 백엔드 언어 |
| 3 | `scale` | 규모/트래픽 | **얼마나 큰가?** DAU + 피크 RPS + 트래픽 패턴(정상/업무시간/스파이크/버스트) + 데이터량 |
| 4 | `compliance` | 보안/규정준수 | **법적 요구사항?** 인증(PCI/HIPAA/GDPR/SOX/ISMS) + 암호화 수준 + 네트워크 격리 |
| 5 | `slo` | 가용성/신뢰성 | **얼마나 안정적이어야 하는가?** 가용성(99%~99.99%) + RTO + RPO + 리전 전략 |
| 6 | `cost` | 비용 전략 | **비용 최적화?** 우선순위(비용/균형/성능) + 약정(없음/1년/3년) + 스팟 사용 |
| 7 | `data` | 데이터 저장 | **DB 선택?** Primary DB(Aurora/RDS/DynamoDB) + HA 전략 + 캐시 + 검색 + 스토리지 |
| 8 | `compute` | 컴퓨트 선택 | **실행 모델?** 아키텍처 패턴(서버리스/컨테이너/VM/하이브리드) |
| 9 | `platform` | K8s 생태계 | **[EKS 선택 시만]** 오케스트레이션 + 노드 타입 + GitOps + 시크릿 관리 |
| 10 | `network` | 네트워크 설계 | **네트워크 토폴로지?** 계정 구조 + AZ 분배(1/2/3) + 서브넷 티어 + NAT 전략 + 하이브리드 |
| 11 | `integration` | 서비스 연결 | **비동기 패턴?** 인증 방식 + 동기/비동기 + 큐 타입 + API 타입 |
| 12 | `appstack` | 앱 스택 | **[VM 제외]** API Gateway 구현 + 프로토콜(REST/GraphQL/gRPC) |
| 13 | `edge` | 사용자 전달 | **CDN & 보안?** CDN 사용 + DNS 전략 + WAF 수준 |
| 14 | `cicd` | 배포/운영 | **배포 파이프라인?** IaC 도구 + 파이프라인 + 배포 전략 + 환경 수 |

### 조건부 Phase 건너뛰기

- **Phase 9 (Platform)**: `compute.orchestration === "eks"`일 때만 표시
- **Phase 12 (AppStack)**: `compute.arch_pattern === "vm"`이면 건너뜀

### 답변 변경 시 연쇄 초기화 (CLEAR_DEPS)

```
compute.arch_pattern 변경 시
  → orchestration, compute_node, scaling 필드 초기화
  → platform Phase 전체 초기화

compute.orchestration 변경 시
  → platform Phase 전체 초기화

integration.sync_async 변경 시
  → queue_type 필드 초기화
```

---

## 2단계: 상태(State) 구조

위자드의 모든 답변은 하나의 `WizardState` 객체에 저장됩니다.

```typescript
WizardState = Record<string, Record<string, any>>

{
  workload: { type[], growth_stage, business_model, data_sensitivity, user_type[], ecommerce_detail, ticketing_detail }
  team:     { team_size, cloud_exp, ops_model, language }
  scale:    { dau, peak_rps, traffic_pattern[], data_volume }
  compliance: { cert[], encryption, network_iso }
  slo:      { availability, rto, rpo, region }
  cost:     { priority, commitment, spot_usage }
  data:     { primary_db[], db_ha, cache, search, storage[] }
  compute:  { arch_pattern, orchestration, compute_node, scaling[], node_provisioner }
  platform: { gitops, k8s_secrets, k8s_monitoring, pod_security, node_provisioner }
  network:  { account_structure, az_count, subnet_tier, nat_strategy, hybrid[] }
  integration: { auth[], sync_async, queue_type[], api_type, batch_workflow[] }
  appstack: { api_gateway_impl, protocol }
  edge:     { cdn, dns, waf }
  cicd:     { iac, pipeline, deploy_strategy, env_count }
}
```

---

## 3단계: 공통 파생 플래그 계산

State에서 9개 분석 함수가 공통으로 사용하는 **파생 플래그(DerivedFlags)**를 계산합니다.

### 배열 정규화

```
toArray(val)         — string|string[]|undefined → string[]
toArrayFiltered(val) — 위 + "none" 항목 필터링
azToNum(az)          — "3az"→3, "1az"→1, default 2
```

### 25개 불리언 플래그

| 카테고리 | 플래그 | 판단 기준 |
|---------|--------|----------|
| **컴퓨팅** | `isEks` | orchestration === "eks" |
| | `isEcs` | !isEks && archP === "container" |
| | `isServerless` | archP === "serverless" |
| **스케일** | `isXL` | dau === "xlarge" |
| | `isLarge` | dau === "large" |
| | `isMedium` | dau === "medium" |
| | `isSmall` | dau === "small" or "tiny" |
| **컴플라이언스** | `hasCritCert` | cert에 pci/hipaa/sox 포함 |
| | `isGdpr` | cert에 gdpr 포함 |
| | `hasPersonalData` | data_sensitivity === "personal" or "financial" |
| **워크로드** | `isTx` | type에 "ecommerce" or "ticketing" 포함 |
| | `isHighAvail` | availability >= 99.95% |
| | `isGlobal` | region === "active-active" |
| | `isInternalOnly` | type이 모두 "internal" |
| | `isCostFirst` | priority === "cost_first" |
| **데이터** | `hasAurora` | primary_db에 "aurora" 포함 |
| | `hasRds` | primary_db에 "rds" 포함 |
| | `hasRdbms` | hasAurora or hasRds |
| | `hasDynamo` | primary_db에 "dynamodb" 포함 |
| | `hasRedis` | cache에 "redis" 포함 |
| **타입** | `isRealtime` | type에 "realtime" 포함 |
| | `isSaaS` | type에 "saas" 포함 |
| | `isIoT` | type에 "iot" 포함 |
| | `isEcom` | type에 "ecommerce" 포함 |
| | `isTick` | type에 "ticketing" 포함 |

> **주의**: `isTx` 정의가 파일마다 다를 수 있음. wafr.ts에서만 `isTx`에 "realtime" 포함 → `f.isTx || f.isRealtime` 조합 사용.

---

## 4단계: 아키텍처 생성 (`generateArchitecture`)

State를 받아 **13개 레이어**로 구성된 AWS 아키텍처를 생성합니다.

### 13개 레이어 구조

```
Layer 1:  계정/조직 구조     ← network.account_structure
Layer 2:  네트워크(VPC)       ← network.az_count, subnet_tier, nat_strategy
Layer 3:  엣지(CDN/DNS)      ← edge.cdn, dns, waf
Layer 4:  CDN 함수           ← CloudFront Functions / Lambda@Edge
Layer 5:  API 레이어         ← integration.api_type (ALB/NLB/API GW)
Layer 6:  컴퓨트             ← compute.arch_pattern, orchestration
Layer 7:  K8s 생태계         ← [EKS만] Karpenter, ArgoCD, Service Mesh
Layer 8:  데이터 스토어       ← data.primary_db, db_ha, cache
Layer 9:  검색               ← data.search (OpenSearch)
Layer 10: 메시징             ← integration.queue_type (SQS/SNS/Kinesis/EventBridge)
Layer 11: 운영/모니터링       ← CloudWatch, Prometheus, CloudTrail, GuardDuty
Layer 12: 개발/배포 도구      ← cicd.iac, pipeline, deploy_strategy
Layer 13: 보안/컴플라이언스   ← KMS, Secrets Manager, Certificate Manager
```

### 각 레이어의 서비스 항목 구조

```typescript
{
  name: "서비스명",
  detail: "구현 상세 (예: Aurora MySQL 8.0, r6g.xlarge)",
  reason: "선택 이유 (예: 트랜잭션 처리 + 읽기 복제본 필요)",
  cost: "월간 비용 추정 (예: ~$450/월)",
  opt: "최적화 팁 (예: Reserved Instance로 34% 절감 가능)",
  insights: ["아키텍처 인사이트 배열"]
}
```

### 핵심 결정 로직 예시

```
IF isTicketing && isFlash:
  → DynamoDB (원자적 카운터) + Redis (분산 락) + SQS FIFO (순서 보장)

IF isServerless:
  → Lambda + API Gateway + DynamoDB (서버리스 스택)
  → IF hasRdbms: RDS Proxy 필수 (커넥션 풀링)

IF isEks:
  → EKS + Karpenter/CA + ALB Ingress Controller
  → IF gitops === "argocd": ArgoCD + Sealed Secrets

IF isHighAvail && azNum >= 3:
  → Multi-AZ 배포 + Global Accelerator
  → IF region === "active-active": Aurora Global Database

IF hasCritCert (PCI/HIPAA/SOX):
  → 3-tier 네트워크 + CMK 암호화 + CloudTrail + Config Rules
```

---

## 5단계: 9개 분석 함수 (병렬 실행)

아키텍처 생성 후, 동일한 State를 9개 관점에서 동시 분석합니다.

### 5-1. 검증 (`validateState`) — 78+ 규칙

**검증 카테고리와 사고 흐름:**

```
가용성/신뢰성 검증:
  99.99% + single AZ → ❌ 에러 (물리적으로 불가능)
  99.99% + 2 AZ     → ⚠️ 경고 (3 AZ 권장)
  single-AZ DB + multi-AZ 컴퓨트 → ⚠️ 경고 (DB가 SPOF)

컴플라이언스 검증:
  PCI/HIPAA/SOX + 2-tier 네트워크 → ❌ 에러 (3-tier 필수)
  PCI + 기본 암호화 → ❌ 에러 (CMK 필수)
  GDPR + active-active 다른 대륙 → ⚠️ 경고 (데이터 이동 규정)

컴퓨트 검증:
  EKS + 초급 팀 → ⚠️ 경고 (복잡도 높음)
  Spot + 트랜잭션 처리 → ❌ 에러 (중단 위험)
  Lambda + RDS (프록시 없음) → ⚠️ 경고 (커넥션 폭발)

데이터 검증:
  대규모 DAU + 캐시 없음 → ⚠️ 경고 (DB 부하)
  티켓팅 + Redis 없음 → ⚠️ 경고 (동시성 제어 불가)
  DynamoDB + 트랜잭션 격리 필요 → ⚠️ 경고

배포 검증:
  Rolling + 결제 트랜잭션 → ⚠️ 경고 (Blue/Green 권장)
  Blue/Green + 비용 우선 → ⚠️ 경고 (2배 인프라 비용)
```

**출력**: `{ severity: "error"|"warn", title, message, phases[] }`

### 5-2. 비용 산정 (`estimateMonthlyCost`) — min/mid/max

**비용 계산 사고 흐름:**

```
1. 기본 비용 계산 (DAU × 스케일 계수)
   DAU_SCALE = { xlarge: 8, large: 4, medium: 2, small: 1, tiny: 0.5 }

2. 카테고리별 비용 산정:
   ├─ 컴퓨트: ECS Fargate / Lambda / EC2 + ALB
   ├─ 데이터: Aurora / RDS / DynamoDB / ElastiCache / RDS Proxy
   ├─ 네트워크: NAT Gateway / VPN / Direct Connect / 데이터 전송
   ├─ 엣지: CloudFront / WAF / Shield
   ├─ 스토리지: S3 / EFS
   ├─ 메시징: SQS / Kinesis / EventBridge
   ├─ 운영: CloudWatch / Prometheus / Security Hub
   └─ 멀티리전: Global DB 복제

3. 할인 적용:
   약정 할인 = { 3yr: 0.34, 1yr: 0.65, none: 1.0 }
   Fargate 약정 = { 3yr: 0.48, 1yr: 0.78, none: 1.0 }
   Spot 할인 = { heavy: 0.30, partial: 0.70, no: 1.0 }

4. 범위 산출: min(×0.7) / mid(×1.0) / max(×1.4)
```

**출력**: `{ totalMin, totalMid, totalMax, categories[] }`

### 5-3. Well-Architected 점수 (`wellArchitectedScore`) — 5대 축

**AWS Well-Architected Framework 5대 축 평가:**

```
1. 운영 우수성 (Operational Excellence)
   ├─ IaC 사용 여부 (Terraform/CDK/CloudFormation)
   ├─ CI/CD 파이프라인 구성
   ├─ 배포 전략 (Canary > Blue/Green > Rolling)
   ├─ 모니터링/로깅
   ├─ 멀티 계정 구조
   └─ 감사 추적

2. 보안 (Security)
   ├─ 저장 데이터 암호화 (CMK > 기본)
   ├─ 전송 중 암호화 (TLS)
   ├─ 네트워크 격리 (private > strict > basic)
   ├─ WAF 구성
   ├─ 인증 방식 (SAML/OAuth > Cognito)
   ├─ 시크릿 관리
   └─ IAM 권한 경계

3. 신뢰성 (Reliability)
   ├─ AZ 분산 (3AZ > 2AZ > 1AZ)
   ├─ DB HA (Global > Multi-AZ > Single)
   ├─ 캐시 사용
   ├─ 멀티 리전 전략
   ├─ 백업/복구
   ├─ 오토스케일링
   ├─ DNS 장애조치
   └─ 롤백 능력

4. 성능 효율성 (Performance Efficiency)
   ├─ 워크로드에 맞는 아키텍처 패턴
   ├─ 오케스트레이션 선택
   ├─ 스케일링 전략
   └─ 캐싱 전략

5. 비용 최적화 (Cost Optimization)
   ├─ 적정 사이징
   ├─ 약정 전략 (RI/Savings Plans)
   ├─ 오토스케일링
   └─ 서비스 선택 (관리형 vs 자체 운영)
```

**각 항목**: `{ question, maxPts, earnedPts, rec(부족 시 권장사항) }`
**출력**: `{ overall: number, pillars: Record<pillar, { items[], score }> }`

### 5-4. 추천 배지 (`getRecommendations`)

**배지 사고 흐름:**

```
각 질문의 각 옵션에 대해:

⭐ 강력 추천 (워크로드 타입 + 스케일 기반)
  예: MVP + tiny DAU → "⭐ MVP에 이상적"
  예: 99.99% 가용성 → "⭐ 고가용성 필수"

✨ 추천 (Best Practice)
  예: 가용성 99.9% 이상 → Multi-AZ 추천
  예: Spring Boot + 컨테이너 → EKS 추천 (JVM 콜드스타트)

💚 비용 절감
  예: 비용 우선 + 비핵심 워크로드 → Spot 추천
  예: 비용 우선 → 공유 NAT 추천

⚠️ 주의
  예: 비용 우선 + EKS → "ECS Fargate가 더 저렴"
  예: 글로벌 사용자 + 단일 리전 + CDN 없음 → "지연시간 경고"
```

**출력**: `Record<"phase.questionId.optionValue", { badge, reason }>`

### 5-5. 체크리스트 (`generateChecklist`) — 구현 런북

**11개 구현 단계:**

```
Phase 1:  AWS 계정 & 조직 설정     ← Organization, Control Tower, SCP, MFA
Phase 2:  VPC & 네트워크 구성       ← VPC, 서브넷, 게이트웨이, 엔드포인트
Phase 3:  보안 & IAM 설정          ← KMS, Secrets Manager, WAF, 네트워크 정책
Phase 4:  데이터 계층 구성          ← RDS/Aurora, 백업, 읽기 복제본
Phase 5:  컴퓨팅 계층 구성          ← ECR, 서비스 정의, 로드밸런서
Phase 6:  K8s 설정 [EKS만]         ← 컨트롤 플레인, 노드 그룹, 애드온
Phase 7:  엣지 & DNS 구성          ← Route 53, ACM, CloudFront
Phase 8:  모니터링 & 로깅          ← CloudWatch, 알람, X-Ray
Phase 9:  CI/CD 파이프라인          ← CodePipeline, CodeBuild, 배포 자동화
Phase 10: 런칭 준비                ← DNS TTL, 트래픽 전환, 모니터링
Phase 11: 백업 & 복구              ← Backup Vault, RTO/RPO 테스트, DR 런북
```

**각 항목**: `{ id, text, critical(배포 차단 여부) }`
**출력**: `{ phases[], totalItems, criticalItems }`

### 5-6. 보안그룹 (`generateSecurityGroups`)

**생성되는 보안그룹:**

```
ALB/NLB SG       ← 인터넷 인바운드 (80/443) → 앱 서버로 아웃바운드
App Server SG    ← LB에서 인바운드 → DB/캐시/AWS 서비스로 아웃바운드
Database SG      ← 앱에서만 인바운드 (3306/5432) → 아웃바운드 없음
Cache SG         ← 앱에서만 인바운드 (6379)
Lambda SG        ← 인바운드 없음 (Lambda가 시작) → DB/캐시로 아웃바운드
OpenSearch SG    ← 앱에서 인바운드 (443/9200)
EKS Control SG   ← 노드에서 인바운드 → 노드로 아웃바운드
EKS Node SG      ← ALB + 컨트롤 플레인에서 인바운드
Bastion SG       ← 특정 IP에서 인바운드 (22) → 앱/DB로 아웃바운드
```

**출력**: `{ groups[], code(Terraform), iac(CDK) }`

### 5-7. 코드 스니펫 (`generateCodeSnippets`) — ~40개

**카테고리:**

```
VPC & 네트워킹    ← VPC + 서브넷 + NAT + Endpoints
데이터베이스      ← Aurora, DynamoDB, RDS Proxy
컴퓨트           ← ECS Fargate Task, EKS 클러스터, Lambda
메시징           ← SQS, SNS, EventBridge
보안             ← 보안그룹, KMS, IAM
운영             ← CloudWatch 로그/알람
CI/CD            ← CodePipeline, CodeBuild
K8s 리소스        ← Deployment, Service, Ingress, Karpenter
로드밸런서        ← ALB 리스너, 타겟 그룹
엣지             ← CloudFront, WAF
```

**각 스니펫**: Terraform(HCL) + CDK(TypeScript) 양쪽 제공

### 5-8. 요약 (`generateSummary`)

```
출력:
  headline: "이커머스 MVP 아키텍처"
  oneLiner: "ECS Fargate + Aurora + CloudFront 기반 서버리스 컨테이너 아키텍처"
  teamReq: "중급 2명 + DevOps 1명"
  rolloutPhases: ["네트워크/DB 구성 (2주)", "앱 배포 (1주)", "모니터링/최적화 (1주)"]
```

### 5-9. 가드레일 (`checkGuardrails`) — 실시간

**위자드 진행 중 실시간 경고:**

```
경험 수준 기반:
  Istio 선택 + 시니어 아님 → ⚠️ "시니어 경험 필요"
  EKS 선택 + 초급 → ⚠️ "EKS는 중급 이상 권장"
  Prometheus 선택 + 초급 → ⚠️ "관리형 CloudWatch 권장"

맥락 기반:
  PCI 선택 → ⚠️ "감사 부담 주의"
  HIPAA 선택 → ⚠️ "BAA 계약 필요"
  99.99% + MVP → ⚠️ "비용 과다 경고"
  EKS + 비용 우선 → ⚠️ "ECS가 더 비용 효율적"
  Shield Advanced + 소규모 → ⚠️ "과잉 투자"
```

---

## 6단계: 결과 표시 (10개 탭)

```
┌─────────────────────────────────────────────────────┐
│ Tab 1: 요약        │ 헤드라인 + 원라이너 + 팀 요건 + 출시 로드맵 │
│ Tab 2: 서비스 상세  │ 13개 레이어별 서비스 카드                   │
│ Tab 3: 다이어그램   │ 시각적 아키텍처 (draw.io 연동)              │
│ Tab 4: 검증        │ 에러/경고 목록 + 해당 Phase 표시             │
│ Tab 5: 체크리스트   │ 드래그 가능한 구현 태스크 (localStorage 저장) │
│ Tab 6: 보안그룹    │ 인바운드/아웃바운드 규칙 + IaC 코드          │
│ Tab 7: 비용        │ 카테고리별 min/mid/max 바 차트               │
│ Tab 8: WAFR       │ 5대 축 점수 + 개선 권장사항                  │
│ Tab 9: 코드        │ 검색 가능한 Terraform/CDK 스니펫 + 복사 버튼  │
│ Tab 10: 상태 요약  │ 사이드바 - 모든 Phase 선택값 요약            │
└─────────────────────────────────────────────────────┘
```

---

## 7단계: 의사결정 흐름 예시

### 예시 1: 티켓팅 서비스 (플래시 세일)

```
입력:
  workload.type = ["ticketing"], ticketing_detail = "flash"
  scale.peak_rps = "ultra", traffic_pattern = ["spike"]
  cost.priority = "balanced"

파생 플래그:
  isTick=true, isFlash=true, isUltraRPS=true, hasSpike=true

아키텍처 결정:
  → DynamoDB (원자적 카운터) + Redis (분산 락) + SQS FIFO (순서 보장)
  → ECS Fargate (스파이크 대응 오토스케일링)
  → Route 53 + CloudFront (지리 분산)
  → ALB (요청 속도 제한)

검증:
  ❗ 티켓팅에 Redis/DynamoDB 없으면 → 데드락 경고
  ❗ 스파이크 트래픽에 오토스케일링 없으면 → 에러

비용: Mid ~$15k/월 (이벤트 시 $50k+ 급등)
WAFR: 성능 70%, 신뢰성 85%, 비용 60%
```

### 예시 2: 내부 B2B SaaS (성숙 단계)

```
입력:
  workload.type = ["saas"], growth_stage = "mature"
  scale.dau = "large"
  cost.priority = "cost_first"
  team.cloud_exp = "mid"

파생 플래그:
  isSaaS=true, isLarge=true, isCostFirst=true

아키텍처 결정:
  → Aurora MySQL (비용 최적화 RDS) + 읽기 복제본
  → ECS Fargate + ALB (EKS보다 단순)
  → 2 AZ (99.9% 가용성)
  → 공유 NAT (AZ별 아님)
  → RDS Proxy (커넥션 풀링)

추천: 💚 RI(1년 약정), 💚 공유 NAT
검증: ⚠️ "EKS + 비용 우선은 과잉"

비용: Min $8k (1년 RI) / Mid $12k / Max $15k
```

### 예시 3: IoT 플랫폼 (MVP)

```
입력:
  workload.type = ["iot"]
  scale.dau = "small", data_volume = "medium"
  compute.arch_pattern = "serverless"

파생 플래그:
  isIoT=true, isSmall=true, isServerless=true

아키텍처 결정:
  → AWS IoT Core (디바이스 연결)
  → Lambda (이벤트 처리)
  → DynamoDB (시계열 데이터)
  → Kinesis Data Streams (실시간 수집)
  → S3 (장기 저장)
  → API Gateway (REST API)

검증: ⚠️ IoT + Lambda 콜드스타트 주의
추천: ⭐ DynamoDB (IoT 시계열에 최적)

비용: Mid ~$3k/월
```

---

## 8단계: UX 실시간 기능

### 위자드 진행 중

```
1. 질문 답변 시 → 실시간 가드레일 경고 표시
2. Phase 이동 시 → 조건부 Phase 건너뛰기 자동 처리
3. 답변 변경 시 → 연쇄 초기화 (CLEAR_DEPS)
4. 매 Phase 완료 시 → localStorage 자동 저장
```

### 결과 화면

```
1. 자동 추천 적용 버튼 → 미답변 질문에 최고 우선순위 추천 자동 선택
2. JSON 내보내기/가져오기 → 상태 파일로 저장/복원
3. URL 공유 → Base64 압축된 상태를 쿼리 파라미터로 공유
4. 히스토리 저장 → Google 로그인 후 서버 저장
5. 체크리스트 진행률 → localStorage에 체크 상태 영구 저장
```

---

## 핵심 설계 원리

1. **다차원 동시 분석**: 동일한 State를 9개 관점(비용, 신뢰성, 보안, 성능, 운영, 컴플라이언스, 복잡도, 팀 역량, 구현 준비도)에서 동시 평가
2. **조건부 로직 체인**: 워크로드 유형 → 스케일 → 컴플라이언스 → 컴퓨트 선택이 연쇄적으로 아키텍처를 결정
3. **트레이드오프 명시**: 모든 결정에 이유(reason) + 비용(cost) + 최적화 팁(opt) 제공
4. **양방향 피드백**: 검증 → 해당 Phase 표시 → 사용자가 돌아가서 수정 가능
5. **i18n 완전 지원**: 모든 텍스트가 ko/en 이중 언어로 제공
