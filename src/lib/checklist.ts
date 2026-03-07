/* eslint-disable @typescript-eslint/no-explicit-any */
import type { WizardState } from "@/lib/types";

export function generateChecklist(state: WizardState) {
  const types    = state.workload?.type || [];
  const dau      = state.scale?.dau;
  const az       = state.network?.az_count;
  const azNum    = az === "3az" ? 3 : az === "1az" ? 1 : 2;
  const orchest  = state.compute?.orchestration;
  const archP    = state.compute?.arch_pattern;
  const nodeType = state.compute?.compute_node;
  const db       = state.data?.primary_db || [];
  const dbArr    = Array.isArray(db) ? db : (db && db !== "none" ? [db] : []);
  const dbHa     = state.data?.db_ha;
  const cache    = state.data?.cache;
  const search   = state.data?.search;
  const storage  = state.data?.storage || [];
  const storArr  = Array.isArray(storage) ? storage : (storage ? [storage] : []);
  const cert     = state.compliance?.cert || [];
  const encr     = state.compliance?.encryption;
  const netIso   = state.compliance?.network_iso;
  const subnet   = state.network?.subnet_tier;
  const natStrat = state.network?.nat_strategy;
  const account  = state.network?.account_structure;
  const hybrid   = state.network?.hybrid;
  const waf      = state.edge?.waf;
  const cdn      = state.edge?.cdn;
  const dns      = state.edge?.dns;
  const iac      = state.cicd?.iac;
  const pipeline = state.cicd?.pipeline;
  const deploy   = state.cicd?.deploy_strategy;
  const envCnt   = state.cicd?.env_count;
  const avail    = state.slo?.availability;
  const region   = state.slo?.region;
  const auth     = state.integration?.auth || [];
  const authArr  = Array.isArray(auth) ? auth : [auth];
  const syncMode = state.integration?.sync_async;
  const queueRaw = state.integration?.queue_type;
  const queueArr = Array.isArray(queueRaw) ? queueRaw : (queueRaw ? [queueRaw] : []);
  const apiType  = state.integration?.api_type;
  const gitops   = state.platform?.gitops;
  const nodeP    = state.platform?.node_provisioner;
  const secrets  = state.platform?.k8s_secrets;
  const commit   = state.cost?.commitment;
  const spot     = state.cost?.spot_usage;
  const stage    = state.workload?.growth_stage;
  const teamSize = state.team?.team_size;
  const exp      = state.team?.cloud_exp;

  const hasCritCert = cert.includes("pci") || cert.includes("hipaa") || cert.includes("sox");
  const hasPersonal = ["sensitive","critical"].includes(state.workload?.data_sensitivity);
  const isTx        = types.includes("ecommerce") || types.includes("ticketing") || state.workload?.business_model === "transaction";
  const isEks       = orchest === "eks";
  const isEcs       = orchest === "ecs" || (archP === "container" && !isEks);
  const isServerless= archP === "serverless";
  const isLarge     = dau === "large" || dau === "xlarge";
  const isGlobal    = (state.workload?.user_type || []).includes("global");

  let id = 0;
  const item = (text: string, detail = "", critical = false, link = "") => ({
    id: ++id, text, detail, critical, link,
  });

  const phases: any[] = [];

  // ── PHASE 1: AWS 계정 & 조직 설정
  const p1: any = { phase: "Phase 1", label: "AWS 계정 & 조직 설정", icon: "🏢", items: [] };
  if (account === "org") {
    p1.items.push(item("AWS Organizations 루트 계정 생성 및 MFA 활성화", "루트 계정은 Organizations 관리용으로만 사용. IAM 사용자 생성 후 루트는 잠금", true));
    p1.items.push(item("Control Tower Landing Zone 배포", "ap-northeast-2 홈 리전 지정. Log Archive 계정 + Audit 계정 자동 생성", false, "https://docs.aws.amazon.com/controltower/latest/userguide/getting-started-with-control-tower.html"));
    p1.items.push(item("Service Control Policy (SCP) 기본 정책 설정", "루트 리전 제한(ap-northeast-2 only), 루트 계정 액션 차단, CloudTrail 비활성화 차단"));
    p1.items.push(item("멤버 계정 생성: Prod / Stage / Dev", "각 계정에 AdministratorAccess 위임 역할 생성. SSO(IAM Identity Center) 연동"));
  } else if (account === "envs") {
    p1.items.push(item("AWS 계정 생성 (Prod 전용)", "Prod 계정은 별도 이메일 주소 사용. billing alert 즉시 설정", true));
    p1.items.push(item("루트 계정 MFA 활성화", "루트 계정은 잠금 후 비상시에만 사용"));
    p1.items.push(item("IAM Identity Center(SSO) 설정", "개인 IAM 사용자 대신 SSO로 계정 접근 관리"));
  } else {
    p1.items.push(item("루트 계정 MFA 활성화", "루트 계정 직접 사용 금지. Admin IAM 사용자 생성 후 일상 사용", true));
    p1.items.push(item("Billing Alert 설정", "월 예산의 80% 도달 시 이메일 알림. Cost Anomaly Detection 활성화"));
  }
  p1.items.push(item("루트 계정 MFA 복구 코드 안전 보관", "MFA 장치 분실 시 계정 잠금 방지. 복구 코드를 안전한 오프라인 장소에 보관", true));
  p1.items.push(item("S3 Block Public Access 계정 레벨 설정", "s3:PutBucketPublicAccessBlock 계정 수준 활성화. 개별 버킷보다 계정 레벨 차단이 우선", true));
  p1.items.push(item("CloudTrail 활성화 (모든 리전)", "S3 버킷에 90일+ 보존. 조직 수준 Trail 권장", hasCritCert));
  p1.items.push(item("AWS Config 활성화", "리소스 변경 이력 추적. 규정 준수 규칙 자동 평가", hasCritCert));
  p1.items.push(item("Cost Budget 알림 설정", "월 예상 비용의 80%/100% 알림. 서비스별 예산 분리 설정"));
  phases.push(p1);

  // ── PHASE 2: 네트워크 기반 구성
  const p2: any = { phase: "Phase 2", label: "VPC & 네트워크 구성", icon: "🌐", items: [] };
  p2.items.push(item("VPC 생성 (ap-northeast-2, /16 CIDR)", "10.0.0.0/16 권장. 미래 피어링 고려해 CIDR 설계", true));
  p2.items.push(item(`퍼블릭 서브넷 ${azNum}개 생성 (/24 각)`, `ALB 배치용. ${azNum === 3 ? "10.0.101-103.0/24" : "10.0.101-102.0/24"}`, true));
  if (subnet !== "private") {
    p2.items.push(item(`프라이빗 서브넷 ${azNum}개 생성 (/24 각)`, `앱 서버 배치용. ${azNum === 3 ? "10.0.1-3.0/24" : "10.0.1-2.0/24"}`, true));
  }
  if (subnet === "3tier" || hasCritCert) {
    p2.items.push(item(`격리(Isolated) 서브넷 ${azNum}개 생성 (/24 각)`, `DB 전용. 인터넷 라우팅 없음. ${azNum === 3 ? "10.0.201-203.0/24" : "10.0.201-202.0/24"}`, true));
  }
  p2.items.push(item("Internet Gateway 생성 및 퍼블릭 서브넷에 라우팅 연결", "IGW를 VPC에 연결 후 퍼블릭 서브넷 라우팅 테이블에 0.0.0.0/0 추가"));
  if (natStrat === "per_az") {
    p2.items.push(item(`NAT Gateway ${azNum}개 생성 (AZ당 1개)`, "각 퍼블릭 서브넷에 EIP와 함께 생성. 프라이빗 서브넷 라우팅에 연결", true));
  } else if (natStrat === "shared" || natStrat === "endpoint") {
    p2.items.push(item("NAT Gateway 1개 생성", "ap-northeast-2a 퍼블릭 서브넷에 생성. 모든 프라이빗 서브넷 라우팅 연결"));
  }
  p2.items.push(item("VPC Endpoint 생성: S3, DynamoDB (Gateway)", "무료 Gateway Endpoint. 프라이빗 서브넷에서 S3/DynamoDB 직접 접근", false, ""));
  if (hasCritCert || encr === "strict") {
    p2.items.push(item("VPC Endpoint 생성: ECR, Secrets Manager, CloudWatch, SSM", "Interface Endpoint. 인터넷 없이 AWS 서비스 접근 ($7/월/개)", true));
  }
  const hybridArr = Array.isArray(hybrid) ? hybrid : (hybrid ? [hybrid] : []);
  if (hybridArr.includes("vpn")) {
    p2.items.push(item("Site-to-Site VPN 구성", "Virtual Private Gateway 생성 → Customer Gateway 등록 → VPN Connection 생성"));
  }
  if (hybridArr.includes("dx")) {
    p2.items.push(item("Direct Connect 연결 설정", "DX 파트너 선정 → Virtual Interface 생성 → BGP 피어링 설정", true));
  }
  p2.items.push(item("VPC Flow Logs 활성화", "S3 또는 CloudWatch Logs로 전송. 보안 분석 및 트래픽 디버깅용", hasCritCert));
  phases.push(p2);

  // ── PHASE 3: 보안 & IAM
  const p3: any = { phase: "Phase 3", label: "보안 & IAM 설정", icon: "🔒", items: [] };
  p3.items.push(item("KMS CMK 생성 (서비스별 전용 키)", encr === "strict" ? "DB용 / S3용 / Secrets Manager용 별도 키. 키 로테이션 365일 자동 설정" : "AWS Managed Key 사용 (추가 비용 없음)", encr === "strict"));
  if (hasCritCert) {
    p3.items.push(item("KMS 키 정책 설정", "최소 권한 원칙. 루트 계정만 키 관리자. 서비스 역할만 사용자로 지정", true));
  }
  p3.items.push(item("ACM 인증서 발급 (ap-northeast-2)", "도메인 소유 확인(DNS 방식 권장). ALB에 연결할 인증서", true));
  if (cdn !== "no" || isGlobal) {
    p3.items.push(item("ACM 인증서 발급 (us-east-1)", "CloudFront 전용. us-east-1에 별도 발급 필수 (다른 리전 인증서 사용 불가)", true));
  }
  p3.items.push(item("Secrets Manager 시크릿 생성", "DB 비밀번호, API 키, OAuth 시크릿. 30일 자동 교체 Lambda 설정", hasPersonal || hasCritCert));
  if (authArr.includes("cognito")) {
    p3.items.push(item("Cognito User Pool 생성", "비밀번호 정책 설정. MFA 활성화(선택). 소셜 IDP 연동(선택). 커스텀 도메인 설정"));
    p3.items.push(item("Cognito App Client 생성", "웹/모바일 클라이언트 분리. Callback URL / Logout URL 설정. PKCE 활성화"));
  }
  if (authArr.includes("sso")) {
    p3.items.push(item("SAML/OIDC Identity Provider 등록", "고객사 IdP(Okta, Azure AD 등) SAML 메타데이터 등록. 속성 매핑 설정", true));
  }
  if (isEks) {
    p3.items.push(item("EKS Pod Identity / IRSA 설정", "서비스어카운트별 IAM Role 바인딩. 최소 권한 원칙 적용"));
  }
  if (isEcs) {
    p3.items.push(item("ECS Task Execution Role 생성", "ECR 읽기 + Secrets Manager 읽기 + CloudWatch Logs 쓰기 권한"));
    p3.items.push(item("ECS Task Role 생성 (앱별)", "앱이 실제로 필요한 AWS 서비스 권한만. S3, DynamoDB 등 최소 권한"));
  }
  if (pipeline === "github" || pipeline === "gitlab") {
    p3.items.push(item("CI/CD OIDC Role 생성 (GitHub Actions)", "GitHub OIDC Provider 등록. 브랜치별 권한 제한. ECR 푸시 + ECS/EKS 배포 권한"));
  }
  p3.items.push(item("GuardDuty 활성화", "모든 계정/리전. 위협 탐지 자동화. 심각도 HIGH 알림 SNS 연동", hasCritCert));
  if (hasCritCert) {
    p3.items.push(item("Security Hub 활성화", "CIS AWS Foundations Benchmark 자동 평가. 보안 점수 추적", true));
    p3.items.push(item("AWS Config 규정 준수 규칙 설정", "암호화 미적용 리소스 자동 감지. 공개 S3 버킷 차단 규칙", true));
  }
  phases.push(p3);

  // ── PHASE 4: 데이터 계층
  const p4: any = { phase: "Phase 4", label: "데이터 계층 구성", icon: "🗄️", items: [] };
  if (dbArr.includes("aurora_mysql") || dbArr.includes("aurora_pg")) {
    const eng = dbArr.includes("aurora_pg") ? "PostgreSQL 16.x" : "MySQL 8.0";
    p4.items.push(item(`Aurora ${eng} 서브넷 그룹 생성`, "격리/프라이빗 서브넷 선택. DB 보안 그룹 연결", true));
    p4.items.push(item(`Aurora ${eng} 파라미터 그룹 생성`, "slow_query_log=ON, long_query_time=1, general_log=OFF. 운영 환경 튜닝 값"));
    p4.items.push(item(`Aurora ${eng} 클러스터 생성 (Serverless v2)`, `min 0.5 ACU, max ${dau === "xlarge" ? 128 : dau === "large" ? 64 : dau === "medium" ? 16 : 4} ACU. Multi-AZ 자동 설정`, true));
    if (dbHa === "multi_az_read") {
      p4.items.push(item("Aurora Read Replica 인스턴스 추가", "scaleWithWriter 설정. promotion_tier=1 (페일오버 우선순위)"));
    }
    p4.items.push(item("Aurora 백업 보존 기간 설정", "최소 7일(운영 35일 권장). Point-in-Time Recovery 확인"));
    p4.items.push(item("Aurora 삭제 방지(Deletion Protection) 활성화", "운영 DB 실수 삭제 방지. CloudFormation/Terraform 스택 삭제 시에도 보호", true));
    p4.items.push(item("DB 초기 스키마 적용", "마이그레이션 도구 선택(Flyway/Liquibase/Prisma). 버전 관리 시작"));
    p4.items.push(item("DB 연결 정보 Secrets Manager 등록", "자동 교체 Lambda 활성화. 앱에서는 환경변수가 아닌 Secrets Manager 참조"));
  }
  if (dbArr.includes("rds_mysql") || dbArr.includes("rds_pg")) {
    p4.items.push(item("RDS 파라미터 그룹 생성", "slow_query_log=1, long_query_time=1 설정"));
    p4.items.push(item("RDS 인스턴스 생성", `t3.micro(MVP) 또는 r7g.large(운영). ${dbHa === "multi_az" ? "Multi-AZ=Yes" : "Single-AZ"}. 암호화=Yes`, true));
    p4.items.push(item("RDS 자동 스냅샷 보존 기간 7일 설정", "매일 새벽 백업 윈도우 설정. 유지보수 윈도우는 트래픽 낮은 시간대"));
  }
  if (dbArr.includes("dynamodb")) {
    p4.items.push(item("DynamoDB 테이블 생성 (On-Demand)", "파티션 키 + 정렬 키 설계. GSI 미리 설계(나중에 추가 불가한 변경 있음)", true));
    p4.items.push(item("DynamoDB Point-in-Time Recovery 활성화", "스토리지 비용의 약 20% 추가. 35일 임의 시점 복구 가능. 항상 활성화 권장", true));
    p4.items.push(item("DynamoDB Streams 활성화 (이벤트 처리 시)", "Lambda 트리거 연결. 변경 이벤트를 다른 서비스에 전파"));
    if (hasCritCert) {
      p4.items.push(item("DynamoDB CMK 암호화 설정", "AWS 기본 키 대신 CMK 사용. 키 정책에 테이블 ARN 명시", true));
    }
  }
  if (cache === "redis" || cache === "both") {
    p4.items.push(item("ElastiCache 서브넷 그룹 생성", "프라이빗 서브넷. Cache SG 연결"));
    p4.items.push(item("ElastiCache Valkey/Redis 클러스터 생성", `${dau === "xlarge" ? "cache.r7g.xlarge" : dau === "large" ? "cache.r7g.large" : "cache.r7g.medium"}. Multi-AZ=${azNum > 1}. 전송 중 암호화=Yes`));
    p4.items.push(item("Redis 연결 정보 Secrets Manager 등록", "호스트/포트 저장. 앱 코드에서 직접 참조 금지"));
  }
  if (storArr.includes("s3")) {
    p4.items.push(item("S3 버킷 생성", "버킷명: {프로젝트}-{환경}-{용도}. 퍼블릭 액세스 차단(4개 옵션 모두) 활성화", true));
    p4.items.push(item("S3 버킷 정책 설정", hasCritCert ? "CloudFront OAC에서만 접근. PutObject/DeleteObject 명시적 제한" : "CloudFront OAC 또는 앱 역할만 접근 허용"));
    p4.items.push(item("S3 버전 관리 활성화", "중요 파일 버킷은 버전 관리 ON. 라이프사이클 규칙으로 오래된 버전 자동 삭제"));
    p4.items.push(item("S3 Intelligent-Tiering 설정", "30일 후 자동으로 저렴한 티어로 이동. 대용량 버킷 비용 절감"));
  }
  if (search === "opensearch") {
    p4.items.push(item("OpenSearch 도메인 생성", `or1.medium (소), r6g.large (중대). VPC 배치. ${azNum}AZ. 암호화=Yes`));
    p4.items.push(item("OpenSearch 인덱스 설계", "한글 형태소 분석기(nori) 플러그인 설정. 샤드 수 = 노드 수 × 3 이하"));
  }
  phases.push(p4);

  // ── PHASE 5: 컴퓨팅 계층
  const p5: any = { phase: "Phase 5", label: "컴퓨팅 계층 구성", icon: "🖥️", items: [] };
  p5.items.push(item("ECR 프라이빗 레포지토리 생성", "이미지 스캔 활성화(푸시 시). 이미지 수명 주기 정책(최신 10개 유지)", true));
  p5.items.push(item("초기 Docker 이미지 빌드 및 ECR 푸시", "베이스 이미지: node:20-alpine 또는 python:3.12-slim. Non-root 사용자 설정"));
  if (isEks) {
    p5.items.push(item("EKS 클러스터 생성 (최신 안정 버전)", "프라이빗 엔드포인트 전용. VPC CNI 최신 버전. 로깅 전체 활성화", true));
    p5.items.push(item("EKS 기본 애드온 설치", "CoreDNS / kube-proxy / VPC CNI / EBS CSI Driver / Pod Identity Agent"));
    if (nodeP === "karpenter") {
      p5.items.push(item("Karpenter 설치 및 NodePool 생성", "Helm으로 설치. NodeClass(서브넷/SG) + NodePool(인스턴스 타입/Spot 혼합) 설정", true));
    } else {
      p5.items.push(item("EKS 관리형 노드 그룹 생성", `m7g.medium(ARM). min=${azNum} max=${dau === "xlarge" ? 50 : 20}. Spot 혼합 설정`));
    }
    p5.items.push(item("AWS Load Balancer Controller 설치", "ALB Ingress 자동 생성. Helm으로 설치. IRSA 연결 필수", true));
    if (gitops === "argocd") {
      p5.items.push(item("ArgoCD 설치 (argocd 네임스페이스)", "Helm 설치. admin 비밀번호 변경. SSO 연동(선택). App-of-Apps 패턴 설정"));
    }
    p5.items.push(item("Namespace 분리 구성", "앱별 네임스페이스. ResourceQuota + LimitRange 설정. Network Policy 적용"));
    p5.items.push(item("HPA 설정 (Metrics Server 필요)", "CPU 70% 기준. min=2 max=10(기본). KEDA 사용 시 ScaledObject로 교체"));
  } else if (isEcs) {
    p5.items.push(item("ECS 클러스터 생성", "Fargate 전용 클러스터. Container Insights 활성화", true));
    p5.items.push(item("ECS Task Definition 생성", `CPU: ${dau === "xlarge" ? 2048 : dau === "large" ? 1024 : 512}, Memory: ${dau === "xlarge" ? 4096 : dau === "large" ? 2048 : 1024}. 환경변수 Secrets Manager 참조`, true));
    p5.items.push(item("ALB + Target Group 생성", "HTTPS 리스너(443). HTTP→HTTPS 리다이렉트. 헬스체크 경로 설정(/health)"));
    p5.items.push(item("ECS Service 생성", `desired=${azNum}. 롤링 최소 50%/최대 200%. ${deploy === "bluegreen" ? "CodeDeploy Blue/Green 설정" : "자체 롤링 배포"}`, true));
    p5.items.push(item("ECS Auto Scaling 설정", "CPU 70% Target Tracking. min=2 max=" + (dau === "xlarge" ? 50 : 20)));
  } else if (isServerless) {
    p5.items.push(item("Lambda 함수 생성", "VPC 배치(DB 접근 시). 메모리 512MB~1GB. 타임아웃 29초(API GW 한도)", true));
    p5.items.push(item("API Gateway REST/HTTP API 생성", "HTTPS Only. 스테이지 변수 설정. 스로틀링 설정(기본 10,000 RPS)"));
    p5.items.push(item("Lambda 동시성 설정", "Reserved Concurrency로 다른 함수 영향 차단. Provisioned Concurrency(콜드스타트 제거)"));
  }
  phases.push(p5);

  // ── PHASE 6: 엣지 & DNS
  const p6: any = { phase: "Phase 6", label: "엣지 & DNS 구성", icon: "⚡", items: [] };
  p6.items.push(item("Route 53 호스팅 영역 생성", "퍼블릭 호스팅 영역. 도메인 등록사에서 NS 레코드 업데이트", true));
  if (cdn !== "no") {
    p6.items.push(item("CloudFront 배포 생성", "오리진: ALB. OAC(Origin Access Control) 설정. HTTPS만 허용. 가격 등급: PriceClass_200", true));
    p6.items.push(item("CloudFront 캐시 정책 설정", "정적 파일: max-age 31536000. API: cache 없음(no-store). 압축 활성화"));
    p6.items.push(item("CloudFront 오리진 요청 정책 설정", "Host 헤더 전달 설정. 필요한 헤더만 오리진에 전달"));
    if (storArr.includes("s3")) {
      p6.items.push(item("CloudFront S3 OAC 연결", "S3 버킷 직접 접근 차단. OAC(Origin Access Control) 방식 사용(OAI deprecated)", true));
    }
  }
  if (waf && waf !== "no") {
    p6.items.push(item("WAF Web ACL 생성 (us-east-1)", "CloudFront 연결 시 반드시 us-east-1에 생성. AWS Managed Rules 활성화", true));
    p6.items.push(item("WAF 관리형 규칙 활성화", "AWSManagedRulesCommonRuleSet + AWSManagedRulesKnownBadInputsRuleSet"));
    if (waf === "bot") {
      p6.items.push(item("Bot Control 규칙 활성화", "TARGETED 수준. 토큰 기반 검증. 이벤트 당일 COUNT→BLOCK 전환 계획 수립", true));
    }
    if (waf === "shield") {
      p6.items.push(item("Shield Advanced 구독", "$3,000/월 고정. DRT(DDoS Response Team) 지원 활성화. SRT 역할 생성", true));
    }
  }
  if (dns === "health" || dns === "latency") {
    p6.items.push(item("Route 53 헬스체크 생성", "HTTPS 30초 간격. 3회 실패 시 Unhealthy. CloudWatch 알람 연동"));
    p6.items.push(item("Route 53 페일오버 레코드 설정", "Primary: 메인 CloudFront/ALB. Secondary: 유지보수 페이지 S3"));
  }
  p6.items.push(item("Route 53 A 레코드 생성 (Alias)", "CloudFront 또는 ALB를 Alias 타겟으로 설정. Apex 도메인 사용 가능"));
  phases.push(p6);

  // ── PHASE 7: 메시징 & 통합
  if (syncMode !== "sync_only" || types.includes("iot")) {
    const p7: any = { phase: "Phase 7", label: "메시징 & 통합 구성", icon: "📨", items: [] };
    if (queueArr.includes("sqs") || isTx) {
      p7.items.push(item("SQS FIFO 큐 생성 (주문/결제)", "콘텐츠 기반 중복 제거 활성화. MessageGroupId로 순서 보장. DLQ 연결", true));
      p7.items.push(item("SQS 데드레터 큐(DLQ) 생성", "최대 수신 횟수: 3회. DLQ 알람으로 처리 실패 즉시 감지"));
    }
    if (queueArr.includes("sns")) {
      p7.items.push(item("SNS 토픽 생성 (이벤트별)", "암호화 활성화(CMK). 구독 확인 이메일 전송 설정"));
      p7.items.push(item("SNS → SQS 구독 설정", "Fan-out 패턴. 각 소비자(재고/배송/분석)별 SQS 큐 구독"));
    }
    if (queueArr.includes("kinesis")) {
      p7.items.push(item("Kinesis Data Streams 생성", `샤드 수: ${dau === "xlarge" ? 20 : dau === "large" ? 10 : 4}개 (초당 1MB/샤드). Enhanced Fan-Out 활성화`));
      p7.items.push(item("Kinesis Firehose 생성 (S3 장기 보관)", "Parquet 변환. S3 파티셔닝 설정(년/월/일). Glue 카탈로그 연동"));
    }
    if (queueArr.includes("eventbridge")) {
      p7.items.push(item("EventBridge 이벤트 버스 생성", "커스텀 버스 생성. 이벤트 스키마 레지스트리 활성화"));
      p7.items.push(item("EventBridge 규칙 생성", "이벤트 패턴 정의. 타겟(Lambda/SQS/Step Functions) 설정"));
    }
    if (types.includes("iot")) {
      p7.items.push(item("IoT Core 설정", "Thing 유형 등록. 인증서 기반 인증. MQTT 정책 최소 권한 적용", true));
      p7.items.push(item("IoT Core 규칙 생성", "Kinesis/DynamoDB/Lambda 타겟 연결. SQL 필터로 불필요 데이터 제거"));
    }
    phases.push(p7);
  }

  // ── PHASE 8: CI/CD 파이프라인
  const p8: any = { phase: "Phase 8", label: "CI/CD 파이프라인 구성", icon: "🚀", items: [] };
  if (iac === "terraform") {
    p8.items.push(item("Terraform Remote State 설정", "S3 버킷 + DynamoDB 테이블 생성. 버킷 버전 관리 ON. 암호화 활성화", true));
    p8.items.push(item("Terraform 모듈 구조 설정", "modules/vpc, modules/compute, modules/data, modules/security 분리"));
    p8.items.push(item("Terraform Workspace 설정", "dev/staging/prod workspace. .tfvars 파일 환경별 분리"));
    p8.items.push(item("terraform init & plan 실행 확인", "에러 없이 plan 완료 확인. 예상 리소스 수 검증"));
    p8.items.push(item("terraform apply (dev 환경 먼저)", "dev 환경 전체 프로비저닝. 출력값(ALB DNS, DB 엔드포인트) 확인", true));
  } else if (iac === "cdk") {
    p8.items.push(item("CDK Bootstrap 실행 (계정/리전별)", "cdk bootstrap aws://ACCOUNT/ap-northeast-2. S3 버킷 + ECR 레포 자동 생성", true));
    p8.items.push(item("CDK Stack 분리 구성", "NetworkStack / SecurityStack / DataStack / AppStack으로 분리"));
    p8.items.push(item("cdk synth 실행 확인", "CloudFormation 템플릿 생성 확인. 에러 없음 검증"));
    p8.items.push(item("cdk deploy --all (dev 환경)", "dev 스택 순차 배포. 의존성 순서 자동 처리", true));
  }
  if (pipeline === "github") {
    p8.items.push(item("GitHub Actions OIDC 설정", "AWS에 GitHub OIDC Provider 등록. Role ARN을 GitHub Secrets에 저장", true));
    p8.items.push(item(".github/workflows/deploy.yml 작성", `브랜치별 배포 환경 매핑(main→prod, develop→stage). ${deploy === "bluegreen" ? "Blue/Green" : deploy === "canary" ? "Canary" : "Rolling"} 배포 설정`));
    p8.items.push(item("GitHub Secrets 등록", "AWS_ACCOUNT_ID, ECR_REPOSITORY, ECS_SERVICE 등. 환경별 Secrets 분리"));
  }
  if (iac === "terraform") {
    p8.items.push(item("Infracost PR 코멘트 설정", "terraform plan 결과를 비용 추정으로 변환. PR에 자동 코멘트로 비용 영향 시각화"));
  }
  const envLabel = envCnt === "four" ? "dev/stage/preprod/prod" : envCnt === "three" ? "dev/stage/prod" : "dev/prod";
  p8.items.push(item(`배포 환경 ${envLabel} 분리 설정`, "각 환경별 변수 파일 분리. Prod 배포는 수동 승인(approval) 단계 추가", true));
  p8.items.push(item("첫 번째 자동 배포 테스트", "feature 브랜치 → PR → 자동 빌드 → stage 배포 → 수동 승인 → prod 배포 전체 흐름 검증"));
  phases.push(p8);

  // ── PHASE 9: 모니터링 & 운영
  const p9: any = { phase: "Phase 9", label: "모니터링 & 운영 설정", icon: "📊", items: [] };
  p9.items.push(item("CloudWatch 로그 그룹 생성", "앱 로그, DB 슬로우 쿼리, ALB 액세스 로그. 보존 기간 30일(운영)"));
  p9.items.push(item("CloudWatch 대시보드 생성", "ALB RPS, ECS CPU/메모리, DB 연결 수, 캐시 히트율, 에러율 위젯 구성"));
  p9.items.push(item("ALB 알람 설정", "5xx 비율 > 1%, 응답시간 p99 > 2초, HealthyHostCount < 2", true));
  if (isEcs) p9.items.push(item("ECS 알람 설정", "CPUUtilization > 80%, MemoryUtilization > 85%, Running Task < min"));
  if (isEks) p9.items.push(item("EKS Container Insights 활성화", "클러스터 수준 모니터링. CloudWatch Logs Insights 쿼리 저장"));
  if (dbArr.some((d: string) => d.startsWith("aurora") || d.startsWith("rds"))) {
    p9.items.push(item("RDS/Aurora 알람 설정", "FreeStorage < 10GB, CPUUtilization > 80%, DatabaseConnections > 200, ReplicationLag > 1s", true));
  }
  if (dbArr.includes("dynamodb")) {
    p9.items.push(item("DynamoDB 알람 설정", "SystemErrors > 0, ThrottledRequests > 0, ConsumedWriteCapacityUnits 추적"));
  }
  if (cache === "redis" || cache === "both") {
    p9.items.push(item("ElastiCache 알람 설정", "EngineCPUUtilization > 80%, Evictions > 1000/min, CurrConnections > 500"));
  }
  if (avail === "99.95" || avail === "99.99") {
    p9.items.push(item("CloudWatch Synthetics Canary 설정", "주요 API 엔드포인트별 Canary 생성. 5분 간격 헬스체크. 실패 시 CloudWatch Alarm → SNS 즉시 알림", true));
  }
  p9.items.push(item("SNS 알림 토픽 생성 (on-call)", "이메일 + Slack(ChatBot) 구독. 심각도별 에스컬레이션 설정"));
  p9.items.push(item("X-Ray 분산 추적 활성화", "ALB → 앱 → DB 전 구간 추적. 느린 요청 원인 분석"));
  if (hasCritCert) {
    p9.items.push(item("CloudTrail 로그 무결성 검증 활성화", "로그 파일 검증 활성화. 감사 시 로그 위변조 여부 확인 가능", true));
    p9.items.push(item("AWS Cost Anomaly Detection 설정", "서비스별 이상 비용 자동 감지. 임계값 초과 시 즉시 알림", true));
  }
  phases.push(p9);

  // ── PHASE 10: 성능 테스트 & 론칭 준비
  const p10: any = { phase: "Phase 10", label: "성능 테스트 & 론칭 준비", icon: "🎯", items: [] };
  p10.items.push(item("부하 테스트 실행 (k6 또는 Artillery)", `목표 RPS의 1.5배로 테스트. ${dau === "xlarge" || dau === "large" ? "10분 이상 지속 테스트" : "5분 테스트"}. 병목 지점 확인`));
  p10.items.push(item("Auto Scaling 동작 검증", "CPU 임계값 초과 유도 후 Scale-out 시간 측정. Scale-in 정상 동작 확인"));
  p10.items.push(item("DB 페일오버 테스트", "Aurora 페일오버 강제 실행. 앱 재연결 시간 측정. Read Replica 승격 확인", true));
  p10.items.push(item("DR 복구 절차 문서화", "장애 시나리오별 대응 절차. 연락망. 에스컬레이션 체계. 분기 1회 훈련"));
  p10.items.push(item("보안 취약점 스캔 실행", "Amazon Inspector(EC2/Lambda/ECR 이미지). 심각도 HIGH 이상 즉시 수정", hasCritCert));
  if (hasCritCert) {
    p10.items.push(item("침투 테스트 계획 수립", "AWS 침투 테스트 허용 서비스 범위 확인. 외부 보안 업체 계약", true));
    p10.items.push(item("규정 준수 문서 준비", cert.join("+") + " 감사 준비. CloudTrail/Config/GuardDuty 리포트 수집"));
  }
  p10.items.push(item("롤백 절차 검증", `${deploy === "bluegreen" ? "Blue/Green 전환 후 즉시 롤백 테스트" : deploy === "canary" ? "카나리 에러 감지 → 자동 롤백 테스트" : "이전 Task Definition으로 수동 롤백 테스트"}`));
  p10.items.push(item("모니터링 대시보드 팀 공유", "운영팀 CloudWatch 접근 권한 부여. 알람 수신자 등록. 온콜 스케줄 설정"));
  p10.items.push(item("론칭 체크리스트 최종 확인", "DNS TTL 낮추기(5분) → 트래픽 전환 → 10분 모니터링 → TTL 복구"));
  phases.push(p10);

  const totalItems = phases.reduce((s: number, p: any) => s + p.items.length, 0);
  const criticalItems = phases.reduce((s: number, p: any) => s + p.items.filter((i: any) => i.critical).length, 0);

  return { phases, totalItems, criticalItems };
}
