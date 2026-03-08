/* eslint-disable @typescript-eslint/no-explicit-any */
import type { WizardState } from "@/lib/types";

// ── i18n dictionary ──────────────────────────────────────────────────────────
type Lang = "ko" | "en";

const dict: Record<string, Record<Lang, string>> = {
  // Phase labels
  p1_label:  { ko: "AWS 계정 & 조직 설정", en: "AWS Account & Organization Setup" },
  p2_label:  { ko: "VPC & 네트워크 구성", en: "VPC & Network Configuration" },
  p3_label:  { ko: "보안 & IAM 설정", en: "Security & IAM Setup" },
  p4_label:  { ko: "데이터 계층 구성", en: "Data Layer Configuration" },
  p5_label:  { ko: "컴퓨팅 계층 구성", en: "Compute Layer Configuration" },
  p6_label:  { ko: "엣지 & DNS 구성", en: "Edge & DNS Configuration" },
  p7_label:  { ko: "메시징 & 통합 구성", en: "Messaging & Integration Configuration" },
  p8_label:  { ko: "CI/CD 파이프라인 구성", en: "CI/CD Pipeline Configuration" },
  p9_label:  { ko: "모니터링 & 운영 설정", en: "Monitoring & Operations Setup" },
  p10_label: { ko: "성능 테스트 & 론칭 준비", en: "Performance Testing & Launch Preparation" },

  // ── Phase 1 items ──
  p1_org_root: {
    ko: "AWS Organizations 루트 계정 생성 및 MFA 활성화",
    en: "Create AWS Organizations root account and enable MFA",
  },
  p1_org_root_d: {
    ko: "루트 계정은 Organizations 관리용으로만 사용. IAM 사용자 생성 후 루트는 잠금",
    en: "Use root account only for Organizations management. Lock root after creating IAM users",
  },
  p1_control_tower: {
    ko: "Control Tower Landing Zone 배포",
    en: "Deploy Control Tower Landing Zone",
  },
  p1_control_tower_d: {
    ko: "ap-northeast-2 홈 리전 지정. Log Archive 계정 + Audit 계정 자동 생성",
    en: "Set ap-northeast-2 as home region. Auto-create Log Archive account + Audit account",
  },
  p1_scp: {
    ko: "Service Control Policy (SCP) 기본 정책 설정",
    en: "Configure default Service Control Policies (SCP)",
  },
  p1_scp_d: {
    ko: "루트 리전 제한(ap-northeast-2 only), 루트 계정 액션 차단, CloudTrail 비활성화 차단",
    en: "Restrict to root region (ap-northeast-2 only), block root account actions, prevent CloudTrail disabling",
  },
  p1_member_accounts: {
    ko: "멤버 계정 생성: Prod / Stage / Dev",
    en: "Create member accounts: Prod / Stage / Dev",
  },
  p1_member_accounts_d: {
    ko: "각 계정에 AdministratorAccess 위임 역할 생성. SSO(IAM Identity Center) 연동",
    en: "Create AdministratorAccess delegation role per account. Integrate SSO (IAM Identity Center)",
  },
  p1_envs_prod: {
    ko: "AWS 계정 생성 (Prod 전용)",
    en: "Create AWS account (Prod dedicated)",
  },
  p1_envs_prod_d: {
    ko: "Prod 계정은 별도 이메일 주소 사용. billing alert 즉시 설정",
    en: "Use separate email for Prod account. Set up billing alert immediately",
  },
  p1_envs_mfa: {
    ko: "루트 계정 MFA 활성화",
    en: "Enable root account MFA",
  },
  p1_envs_mfa_d: {
    ko: "루트 계정은 잠금 후 비상시에만 사용",
    en: "Lock root account and use only for emergencies",
  },
  p1_envs_sso: {
    ko: "IAM Identity Center(SSO) 설정",
    en: "Set up IAM Identity Center (SSO)",
  },
  p1_envs_sso_d: {
    ko: "개인 IAM 사용자 대신 SSO로 계정 접근 관리",
    en: "Manage account access via SSO instead of individual IAM users",
  },
  p1_single_mfa: {
    ko: "루트 계정 MFA 활성화",
    en: "Enable root account MFA",
  },
  p1_single_mfa_d: {
    ko: "루트 계정 직접 사용 금지. Admin IAM 사용자 생성 후 일상 사용",
    en: "Do not use root account directly. Create Admin IAM user for daily use",
  },
  p1_single_billing: {
    ko: "Billing Alert 설정",
    en: "Set up Billing Alerts",
  },
  p1_single_billing_d: {
    ko: "월 예산의 80% 도달 시 이메일 알림. Cost Anomaly Detection 활성화",
    en: "Email alert at 80% of monthly budget. Enable Cost Anomaly Detection",
  },
  p1_mfa_recovery: {
    ko: "루트 계정 MFA 복구 코드 안전 보관",
    en: "Securely store root account MFA recovery codes",
  },
  p1_mfa_recovery_d: {
    ko: "MFA 장치 분실 시 계정 잠금 방지. 복구 코드를 안전한 오프라인 장소에 보관",
    en: "Prevent account lockout on MFA device loss. Store recovery codes in a secure offline location",
  },
  p1_s3_block: {
    ko: "S3 Block Public Access 계정 레벨 설정",
    en: "Enable S3 Block Public Access at account level",
  },
  p1_s3_block_d: {
    ko: "s3:PutAccountPublicAccessBlock 계정 수준 활성화. 개별 버킷보다 계정 레벨 차단이 우선",
    en: "Enable s3:PutAccountPublicAccessBlock at account level. Account-level block takes precedence over individual buckets",
  },
  p1_cloudtrail: {
    ko: "CloudTrail 활성화 (모든 리전)",
    en: "Enable CloudTrail (all regions)",
  },
  p1_cloudtrail_d: {
    ko: "S3 버킷에 90일+ 보존. 조직 수준 Trail 권장",
    en: "Retain in S3 bucket for 90+ days. Organization-level Trail recommended",
  },
  p1_config: {
    ko: "AWS Config 활성화",
    en: "Enable AWS Config",
  },
  p1_config_d: {
    ko: "리소스 변경 이력 추적. 규정 준수 규칙 자동 평가",
    en: "Track resource change history. Automated compliance rule evaluation",
  },
  p1_budget: {
    ko: "Cost Budget 알림 설정",
    en: "Set up Cost Budget alerts",
  },
  p1_budget_d: {
    ko: "월 예상 비용의 80%/100% 알림. 서비스별 예산 분리 설정",
    en: "Alert at 80%/100% of monthly estimated cost. Separate budgets per service",
  },

  // ── Phase 2 items ──
  p2_vpc: {
    ko: "VPC 생성 (ap-northeast-2, /16 CIDR)",
    en: "Create VPC (ap-northeast-2, /16 CIDR)",
  },
  p2_vpc_d: {
    ko: "10.0.0.0/16 권장. 미래 피어링 고려해 CIDR 설계",
    en: "10.0.0.0/16 recommended. Design CIDR considering future peering",
  },
  p2_pub_subnet: {
    ko: (n: number) => `퍼블릭 서브넷 ${n}개 생성 (/24 각)`,
    en: (n: number) => `Create ${n} public subnets (/24 each)`,
  } as any,
  p2_pub_subnet_d_3: {
    ko: "ALB 배치용. 10.0.101.0/24, 10.0.102.0/24, 10.0.103.0/24",
    en: "For ALB placement. 10.0.101.0/24, 10.0.102.0/24, 10.0.103.0/24",
  },
  p2_pub_subnet_d_other: {
    ko: "ALB 배치용. 10.0.101.0/24, 10.0.102.0/24",
    en: "For ALB placement. 10.0.101.0/24, 10.0.102.0/24",
  },
  p2_priv_subnet: {
    ko: (n: number) => `프라이빗 서브넷 ${n}개 생성 (/24 각)`,
    en: (n: number) => `Create ${n} private subnets (/24 each)`,
  } as any,
  p2_priv_subnet_d_3: {
    ko: "앱 서버 배치용. 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24",
    en: "For app server placement. 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24",
  },
  p2_priv_subnet_d_other: {
    ko: "앱 서버 배치용. 10.0.1.0/24, 10.0.2.0/24",
    en: "For app server placement. 10.0.1.0/24, 10.0.2.0/24",
  },
  p2_iso_subnet: {
    ko: (n: number) => `격리(Isolated) 서브넷 ${n}개 생성 (/24 각)`,
    en: (n: number) => `Create ${n} isolated subnets (/24 each)`,
  } as any,
  p2_iso_subnet_d_3: {
    ko: "DB 전용. 인터넷 라우팅 없음. 10.0.201.0/24, 10.0.202.0/24, 10.0.203.0/24",
    en: "DB only. No internet routing. 10.0.201.0/24, 10.0.202.0/24, 10.0.203.0/24",
  },
  p2_iso_subnet_d_other: {
    ko: "DB 전용. 인터넷 라우팅 없음. 10.0.201.0/24, 10.0.202.0/24",
    en: "DB only. No internet routing. 10.0.201.0/24, 10.0.202.0/24",
  },
  p2_igw: {
    ko: "Internet Gateway 생성 및 퍼블릭 서브넷에 라우팅 연결",
    en: "Create Internet Gateway and attach routing to public subnets",
  },
  p2_igw_d: {
    ko: "IGW를 VPC에 연결 후 퍼블릭 서브넷 라우팅 테이블에 0.0.0.0/0 추가",
    en: "Attach IGW to VPC then add 0.0.0.0/0 to public subnet route tables",
  },
  p2_nat_per_az: {
    ko: (n: number) => `NAT Gateway ${n}개 생성 (AZ당 1개)`,
    en: (n: number) => `Create ${n} NAT Gateways (1 per AZ)`,
  } as any,
  p2_nat_per_az_d: {
    ko: "각 퍼블릭 서브넷에 EIP와 함께 생성. 프라이빗 서브넷 라우팅에 연결",
    en: "Create with EIP in each public subnet. Attach to private subnet routing",
  },
  p2_nat_shared: {
    ko: "NAT Gateway 1개 생성",
    en: "Create 1 NAT Gateway",
  },
  p2_nat_shared_d: {
    ko: "ap-northeast-2a 퍼블릭 서브넷에 생성. 모든 프라이빗 서브넷 라우팅 연결",
    en: "Create in ap-northeast-2a public subnet. Attach routing for all private subnets",
  },
  p2_vpce_gw: {
    ko: "VPC Endpoint 생성: S3, DynamoDB (Gateway)",
    en: "Create VPC Endpoints: S3, DynamoDB (Gateway)",
  },
  p2_vpce_gw_d: {
    ko: "무료 Gateway Endpoint. 프라이빗 서브넷에서 S3/DynamoDB 직접 접근",
    en: "Free Gateway Endpoints. Direct access to S3/DynamoDB from private subnets",
  },
  p2_vpce_if: {
    ko: "VPC Endpoint 생성: ECR, Secrets Manager, CloudWatch, SSM",
    en: "Create VPC Endpoints: ECR, Secrets Manager, CloudWatch, SSM",
  },
  p2_vpce_if_d: {
    ko: "Interface Endpoint. 인터넷 없이 AWS 서비스 접근 ($7~10/AZ/월/개)",
    en: "Interface Endpoints. Access AWS services without internet ($7-10/AZ/month each)",
  },
  p2_vpn: {
    ko: "Site-to-Site VPN 구성",
    en: "Configure Site-to-Site VPN",
  },
  p2_vpn_d: {
    ko: "Virtual Private Gateway 생성 → Customer Gateway 등록 → VPN Connection 생성",
    en: "Create Virtual Private Gateway -> Register Customer Gateway -> Create VPN Connection",
  },
  p2_dx: {
    ko: "Direct Connect 연결 설정",
    en: "Set up Direct Connect connection",
  },
  p2_dx_d: {
    ko: "DX 파트너 선정 → Virtual Interface 생성 → BGP 피어링 설정",
    en: "Select DX partner -> Create Virtual Interface -> Configure BGP peering",
  },
  p2_flow_logs: {
    ko: "VPC Flow Logs 활성화",
    en: "Enable VPC Flow Logs",
  },
  p2_flow_logs_d: {
    ko: "S3 또는 CloudWatch Logs로 전송. 보안 분석 및 트래픽 디버깅용",
    en: "Send to S3 or CloudWatch Logs. For security analysis and traffic debugging",
  },

  // ── Phase 3 items ──
  p3_kms: {
    ko: "KMS CMK 생성 (서비스별 전용 키)",
    en: "Create KMS CMK (dedicated key per service)",
  },
  p3_kms_strict_d: {
    ko: "DB용 / S3용 / Secrets Manager용 별도 키. 키 로테이션 365일 자동 설정",
    en: "Separate keys for DB / S3 / Secrets Manager. Auto key rotation every 365 days",
  },
  p3_kms_default_d: {
    ko: "AWS Managed Key 사용 (추가 비용 없음)",
    en: "Use AWS Managed Key (no additional cost)",
  },
  p3_kms_policy: {
    ko: "KMS 키 정책 설정",
    en: "Configure KMS key policy",
  },
  p3_kms_policy_d: {
    ko: "최소 권한 원칙. 지정된 IAM 역할만 Key Administrator로 설정. root 계정은 기본 접근만 유지. 서비스 역할만 사용자로 지정",
    en: "Least privilege principle. Designate specific IAM roles as Key Administrators. Keep root account with default access only. Only service roles as users",
  },
  p3_acm_apne2: {
    ko: "ACM 인증서 발급 (ap-northeast-2)",
    en: "Issue ACM certificate (ap-northeast-2)",
  },
  p3_acm_apne2_d: {
    ko: "도메인 소유 확인(DNS 방식 권장). ALB에 연결할 인증서",
    en: "Verify domain ownership (DNS method recommended). Certificate for ALB attachment",
  },
  p3_acm_use1: {
    ko: "ACM 인증서 발급 (us-east-1)",
    en: "Issue ACM certificate (us-east-1)",
  },
  p3_acm_use1_d: {
    ko: "CloudFront 전용. us-east-1에 별도 발급 필수 (다른 리전 인증서 사용 불가)",
    en: "CloudFront only. Must be issued separately in us-east-1 (certificates from other regions not supported)",
  },
  p3_secrets: {
    ko: "Secrets Manager 시크릿 생성",
    en: "Create Secrets Manager secrets",
  },
  p3_secrets_d: {
    ko: "DB 비밀번호, API 키, OAuth 시크릿. RDS/Aurora는 네이티브 자동 로테이션. 커스텀 시크릿만 Lambda 필요",
    en: "DB passwords, API keys, OAuth secrets. RDS/Aurora use native auto-rotation. Lambda only needed for custom secrets",
  },
  p3_cognito_pool: {
    ko: "Cognito User Pool 생성",
    en: "Create Cognito User Pool",
  },
  p3_cognito_pool_d: {
    ko: "비밀번호 정책 설정. MFA 활성화(선택). 소셜 IDP 연동(선택). 커스텀 도메인 설정",
    en: "Set password policy. Enable MFA (optional). Social IDP integration (optional). Custom domain setup",
  },
  p3_cognito_client: {
    ko: "Cognito App Client 생성",
    en: "Create Cognito App Client",
  },
  p3_cognito_client_d: {
    ko: "웹/모바일 클라이언트 분리. Callback URL / Logout URL 설정. PKCE 활성화",
    en: "Separate web/mobile clients. Set Callback URL / Logout URL. Enable PKCE",
  },
  p3_saml: {
    ko: "SAML/OIDC Identity Provider 등록",
    en: "Register SAML/OIDC Identity Provider",
  },
  p3_saml_d: {
    ko: "고객사 IdP(Okta, Azure AD 등) SAML 메타데이터 등록. 속성 매핑 설정",
    en: "Register customer IdP (Okta, Azure AD, etc.) SAML metadata. Configure attribute mapping",
  },
  p3_eks_irsa: {
    ko: "EKS Pod Identity / IRSA 설정",
    en: "Set up EKS Pod Identity / IRSA",
  },
  p3_eks_irsa_d: {
    ko: "서비스어카운트별 IAM Role 바인딩. 최소 권한 원칙 적용",
    en: "IAM Role binding per service account. Apply least privilege principle",
  },
  p3_ecs_exec_role: {
    ko: "ECS Task Execution Role 생성",
    en: "Create ECS Task Execution Role",
  },
  p3_ecs_exec_role_d: {
    ko: "ECR 읽기 + Secrets Manager 읽기 + CloudWatch Logs 쓰기 권한",
    en: "ECR read + Secrets Manager read + CloudWatch Logs write permissions",
  },
  p3_ecs_task_role: {
    ko: "ECS Task Role 생성 (앱별)",
    en: "Create ECS Task Role (per app)",
  },
  p3_ecs_task_role_d: {
    ko: "앱이 실제로 필요한 AWS 서비스 권한만. S3, DynamoDB 등 최소 권한",
    en: "Only AWS service permissions the app actually needs. Least privilege for S3, DynamoDB, etc.",
  },
  p3_cicd_oidc: {
    ko: "CI/CD OIDC Role 생성 (GitHub Actions)",
    en: "Create CI/CD OIDC Role (GitHub Actions)",
  },
  p3_cicd_oidc_d: {
    ko: "GitHub OIDC Provider 등록. 브랜치별 권한 제한. ECR 푸시 + ECS/EKS 배포 권한",
    en: "Register GitHub OIDC Provider. Restrict permissions per branch. ECR push + ECS/EKS deploy permissions",
  },
  p3_guardduty: {
    ko: "GuardDuty 활성화",
    en: "Enable GuardDuty",
  },
  p3_guardduty_d: {
    ko: "모든 계정/리전. 위협 탐지 자동화. 심각도 HIGH 알림 SNS 연동",
    en: "All accounts/regions. Automated threat detection. HIGH severity alerts via SNS",
  },
  p3_securityhub: {
    ko: "Security Hub 활성화",
    en: "Enable Security Hub",
  },
  p3_securityhub_d: {
    ko: "CIS AWS Foundations Benchmark 자동 평가. 보안 점수 추적",
    en: "CIS AWS Foundations Benchmark automated assessment. Track security score",
  },
  p3_config_rules: {
    ko: "AWS Config 규정 준수 규칙 설정",
    en: "Set up AWS Config compliance rules",
  },
  p3_config_rules_d: {
    ko: "암호화 미적용 리소스 자동 감지. 공개 S3 버킷 차단 규칙",
    en: "Auto-detect unencrypted resources. Block public S3 bucket rules",
  },

  // ── Phase 4 items ──
  p4_aurora_subnet: {
    ko: (eng: string) => `Aurora ${eng} 서브넷 그룹 생성`,
    en: (eng: string) => `Create Aurora ${eng} subnet group`,
  } as any,
  p4_aurora_subnet_d: {
    ko: "격리/프라이빗 서브넷 선택. DB 보안 그룹 연결",
    en: "Select isolated/private subnets. Attach DB security group",
  },
  p4_aurora_param: {
    ko: (eng: string) => `Aurora ${eng} 파라미터 그룹 생성`,
    en: (eng: string) => `Create Aurora ${eng} parameter group`,
  } as any,
  p4_aurora_param_d: {
    ko: "slow_query_log=ON, long_query_time=1, general_log=OFF. 운영 환경 튜닝 값",
    en: "slow_query_log=ON, long_query_time=1, general_log=OFF. Production tuning values",
  },
  p4_aurora_cluster: {
    ko: (eng: string) => `Aurora ${eng} 클러스터 생성 (Serverless v2)`,
    en: (eng: string) => `Create Aurora ${eng} cluster (Serverless v2)`,
  } as any,
  p4_aurora_cluster_d: {
    ko: (maxAcu: number) => `min 0.5 ACU, max ${maxAcu} ACU. Multi-AZ는 Reader 인스턴스 추가 필요`,
    en: (maxAcu: number) => `min 0.5 ACU, max ${maxAcu} ACU. Multi-AZ requires adding a Reader instance`,
  } as any,
  p4_aurora_replica: {
    ko: "Aurora Read Replica 인스턴스 추가",
    en: "Add Aurora Read Replica instance",
  },
  p4_aurora_replica_d: {
    ko: "scaleWithWriter 설정. promotion_tier=1 (페일오버 우선순위)",
    en: "Set scaleWithWriter. promotion_tier=1 (failover priority)",
  },
  p4_aurora_backup: {
    ko: "Aurora 백업 보존 기간 설정",
    en: "Set Aurora backup retention period",
  },
  p4_aurora_backup_d: {
    ko: "최소 7일(운영 35일 권장). Point-in-Time Recovery 확인",
    en: "Minimum 7 days (35 days recommended for production). Verify Point-in-Time Recovery",
  },
  p4_aurora_del_prot: {
    ko: "Aurora 삭제 방지(Deletion Protection) 활성화",
    en: "Enable Aurora Deletion Protection",
  },
  p4_aurora_del_prot_d: {
    ko: "운영 DB 실수 삭제 방지. CloudFormation/Terraform 스택 삭제 시에도 보호",
    en: "Prevent accidental production DB deletion. Protection persists even during CloudFormation/Terraform stack deletion",
  },
  p4_db_schema: {
    ko: "DB 초기 스키마 적용",
    en: "Apply initial DB schema",
  },
  p4_db_schema_d: {
    ko: "마이그레이션 도구 선택(Flyway/Liquibase/Prisma). 버전 관리 시작",
    en: "Choose migration tool (Flyway/Liquibase/Prisma). Start version control",
  },
  p4_db_secrets: {
    ko: "DB 연결 정보 Secrets Manager 등록",
    en: "Register DB connection info in Secrets Manager",
  },
  p4_db_secrets_d: {
    ko: "자동 교체 Lambda 활성화. 앱에서는 환경변수가 아닌 Secrets Manager 참조",
    en: "Enable auto-rotation Lambda. App should reference Secrets Manager, not environment variables",
  },
  p4_rds_param: {
    ko: "RDS 파라미터 그룹 생성",
    en: "Create RDS parameter group",
  },
  p4_rds_param_d: {
    ko: "slow_query_log=1, long_query_time=1 설정",
    en: "Set slow_query_log=1, long_query_time=1",
  },
  p4_rds_instance: {
    ko: "RDS 인스턴스 생성",
    en: "Create RDS instance",
  },
  p4_rds_instance_d: {
    ko: (multiAz: boolean) => `t3.micro(MVP) 또는 r7g.large(운영). ${multiAz ? "Multi-AZ=Yes" : "Single-AZ"}. 암호화=Yes`,
    en: (multiAz: boolean) => `t3.micro (MVP) or r7g.large (production). ${multiAz ? "Multi-AZ=Yes" : "Single-AZ"}. Encryption=Yes`,
  } as any,
  p4_rds_snapshot: {
    ko: "RDS 자동 스냅샷 보존 기간 7일 설정",
    en: "Set RDS automatic snapshot retention to 7 days",
  },
  p4_rds_snapshot_d: {
    ko: "매일 새벽 백업 윈도우 설정. 유지보수 윈도우는 트래픽 낮은 시간대",
    en: "Set daily backup window at dawn. Maintenance window during low-traffic hours",
  },
  p4_ddb_table: {
    ko: "DynamoDB 테이블 생성 (On-Demand)",
    en: "Create DynamoDB table (On-Demand)",
  },
  p4_ddb_table_d: {
    ko: "파티션 키 + 정렬 키 설계. GSI 미리 설계(나중에 추가 불가한 변경 있음)",
    en: "Design partition key + sort key. Pre-design GSIs (some changes cannot be added later)",
  },
  p4_ddb_pitr: {
    ko: "DynamoDB Point-in-Time Recovery 활성화",
    en: "Enable DynamoDB Point-in-Time Recovery",
  },
  p4_ddb_pitr_d: {
    ko: "별도 GB당 과금 (테이블 스토리지와 동일 단가). 35일 임의 시점 복구 가능. 항상 활성화 권장",
    en: "Billed per GB at the same rate as table storage. 35-day arbitrary point-in-time recovery. Always recommended",
  },
  p4_ddb_streams: {
    ko: "DynamoDB Streams 활성화 (이벤트 처리 시)",
    en: "Enable DynamoDB Streams (for event processing)",
  },
  p4_ddb_streams_d: {
    ko: "Lambda 트리거 연결. 변경 이벤트를 다른 서비스에 전파",
    en: "Connect Lambda trigger. Propagate change events to other services",
  },
  p4_ddb_cmk: {
    ko: "DynamoDB CMK 암호화 설정",
    en: "Configure DynamoDB CMK encryption",
  },
  p4_ddb_cmk_d: {
    ko: "AWS 기본 키 대신 CMK 사용. 키 정책에 테이블 ARN 명시",
    en: "Use CMK instead of AWS default key. Specify table ARN in key policy",
  },
  p4_elasticache_subnet: {
    ko: "ElastiCache 서브넷 그룹 생성",
    en: "Create ElastiCache subnet group",
  },
  p4_elasticache_subnet_d: {
    ko: "프라이빗 서브넷. Cache SG 연결",
    en: "Private subnets. Attach Cache security group",
  },
  p4_elasticache_cluster: {
    ko: "ElastiCache Valkey/Redis 클러스터 생성",
    en: "Create ElastiCache Valkey/Redis cluster",
  },
  p4_elasticache_cluster_d: {
    ko: (instanceType: string, multiAz: boolean) => `${instanceType}. Multi-AZ=${multiAz}. 전송 중 암호화=Yes`,
    en: (instanceType: string, multiAz: boolean) => `${instanceType}. Multi-AZ=${multiAz}. In-transit encryption=Yes`,
  } as any,
  p4_redis_secrets: {
    ko: "Redis 연결 정보 Secrets Manager 등록",
    en: "Register Redis connection info in Secrets Manager",
  },
  p4_redis_secrets_d: {
    ko: "호스트/포트 저장. 앱 코드에서 직접 참조 금지",
    en: "Store host/port. Do not reference directly in app code",
  },
  p4_s3_bucket: {
    ko: "S3 버킷 생성",
    en: "Create S3 bucket",
  },
  p4_s3_bucket_d: {
    ko: "버킷명: {프로젝트}-{환경}-{용도}. 퍼블릭 액세스 차단(4개 옵션 모두) 활성화",
    en: "Bucket name: {project}-{env}-{purpose}. Enable Block Public Access (all 4 options)",
  },
  p4_s3_policy: {
    ko: "S3 버킷 정책 설정",
    en: "Configure S3 bucket policy",
  },
  p4_s3_policy_strict_d: {
    ko: "CloudFront OAC에서만 접근. PutObject/DeleteObject 명시적 제한",
    en: "Access only from CloudFront OAC. Explicit restrictions on PutObject/DeleteObject",
  },
  p4_s3_policy_default_d: {
    ko: "CloudFront OAC 또는 앱 역할만 접근 허용",
    en: "Allow access only from CloudFront OAC or app roles",
  },
  p4_s3_versioning: {
    ko: "S3 버전 관리 활성화",
    en: "Enable S3 versioning",
  },
  p4_s3_versioning_d: {
    ko: "중요 파일 버킷은 버전 관리 ON. 라이프사이클 규칙으로 오래된 버전 자동 삭제",
    en: "Enable versioning for important file buckets. Auto-delete old versions via lifecycle rules",
  },
  p4_s3_tiering: {
    ko: "S3 Intelligent-Tiering 설정",
    en: "Set up S3 Intelligent-Tiering",
  },
  p4_s3_tiering_d: {
    ko: "30일 후 자동으로 저렴한 티어로 이동. 대용량 버킷 비용 절감",
    en: "Auto-move to cheaper tier after 30 days. Cost savings for large buckets",
  },
  p4_opensearch: {
    ko: "OpenSearch 도메인 생성",
    en: "Create OpenSearch domain",
  },
  p4_opensearch_d: {
    ko: (azNum: number) => `t3.small.search (소), r6g.large (중대). VPC 배치. ${azNum}AZ. 암호화=Yes`,
    en: (azNum: number) => `t3.small.search (small), r6g.large (medium-large). VPC placement. ${azNum} AZs. Encryption=Yes`,
  } as any,
  p4_opensearch_index: {
    ko: "OpenSearch 인덱스 설계",
    en: "Design OpenSearch index",
  },
  p4_opensearch_index_d: {
    ko: "한글 형태소 분석기(nori) 플러그인 설정. 샤드 수 = 노드 수 × 3 이하",
    en: "Configure Korean morphological analyzer (nori) plugin. Shards <= nodes x 3",
  },

  // ── Phase 5 items ──
  p5_ecr: {
    ko: "ECR 프라이빗 레포지토리 생성",
    en: "Create ECR private repository",
  },
  p5_ecr_d: {
    ko: "이미지 스캔 활성화(푸시 시). 이미지 수명 주기 정책(최신 10개 유지)",
    en: "Enable image scan on push. Image lifecycle policy (keep latest 10)",
  },
  p5_docker: {
    ko: "초기 Docker 이미지 빌드 및 ECR 푸시",
    en: "Build initial Docker image and push to ECR",
  },
  p5_docker_d: {
    ko: "베이스 이미지: node:20-alpine 또는 python:3.12-slim. Non-root 사용자 설정",
    en: "Base image: node:20-alpine or python:3.12-slim. Configure non-root user",
  },
  p5_eks_cluster: {
    ko: "EKS 클러스터 생성 (최신 안정 버전)",
    en: "Create EKS cluster (latest stable version)",
  },
  p5_eks_cluster_d: {
    ko: "프라이빗 엔드포인트 전용. VPC CNI 최신 버전. 로깅 전체 활성화",
    en: "Private endpoint only. Latest VPC CNI version. Enable all logging",
  },
  p5_eks_addons: {
    ko: "EKS 기본 애드온 설치",
    en: "Install EKS default add-ons",
  },
  p5_eks_addons_d: {
    ko: "CoreDNS / kube-proxy / VPC CNI / EBS CSI Driver / Pod Identity Agent",
    en: "CoreDNS / kube-proxy / VPC CNI / EBS CSI Driver / Pod Identity Agent",
  },
  p5_karpenter: {
    ko: "Karpenter 설치 및 NodePool 생성",
    en: "Install Karpenter and create NodePool",
  },
  p5_karpenter_d: {
    ko: "Helm으로 설치. NodeClass(서브넷/SG) + NodePool(인스턴스 타입/Spot 혼합) 설정",
    en: "Install via Helm. Configure NodeClass (subnet/SG) + NodePool (instance types/Spot mix)",
  },
  p5_eks_mng: {
    ko: "EKS 관리형 노드 그룹 생성",
    en: "Create EKS managed node group",
  },
  p5_eks_mng_d: {
    ko: (azNum: number, max: number) => `m7g.medium(ARM). min=${azNum} max=${max}. Spot 혼합 설정`,
    en: (azNum: number, max: number) => `m7g.medium (ARM). min=${azNum} max=${max}. Spot mix configuration`,
  } as any,
  p5_alb_controller: {
    ko: "AWS Load Balancer Controller 설치",
    en: "Install AWS Load Balancer Controller",
  },
  p5_alb_controller_d: {
    ko: "ALB Ingress 자동 생성. Helm으로 설치. IRSA 연결 필수",
    en: "Auto-create ALB Ingress. Install via Helm. IRSA connection required",
  },
  p5_argocd: {
    ko: "ArgoCD 설치 (argocd 네임스페이스)",
    en: "Install ArgoCD (argocd namespace)",
  },
  p5_argocd_d: {
    ko: "Helm 설치. admin 비밀번호 변경. SSO 연동(선택). App-of-Apps 패턴 설정",
    en: "Install via Helm. Change admin password. SSO integration (optional). App-of-Apps pattern setup",
  },
  p5_ns: {
    ko: "Namespace 분리 구성",
    en: "Configure namespace separation",
  },
  p5_ns_d: {
    ko: "앱별 네임스페이스. ResourceQuota + LimitRange 설정. Network Policy 적용",
    en: "Namespace per app. Set ResourceQuota + LimitRange. Apply Network Policy",
  },
  p5_hpa: {
    ko: "HPA 설정 (Metrics Server 필요)",
    en: "Set up HPA (Metrics Server required)",
  },
  p5_hpa_d: {
    ko: "CPU 70% 기준. min=2 max=10(기본). KEDA 사용 시 ScaledObject로 교체",
    en: "CPU 70% threshold. min=2 max=10 (default). Replace with ScaledObject if using KEDA",
  },
  p5_ecs_cluster: {
    ko: "ECS 클러스터 생성",
    en: "Create ECS cluster",
  },
  p5_ecs_cluster_d: {
    ko: "Fargate 전용 클러스터. Container Insights 활성화",
    en: "Fargate-only cluster. Enable Container Insights",
  },
  p5_ecs_taskdef: {
    ko: "ECS Task Definition 생성",
    en: "Create ECS Task Definition",
  },
  p5_ecs_taskdef_d: {
    ko: (cpu: number, mem: number) => `CPU: ${cpu}, Memory: ${mem}. 환경변수 Secrets Manager 참조`,
    en: (cpu: number, mem: number) => `CPU: ${cpu}, Memory: ${mem}. Reference environment variables from Secrets Manager`,
  } as any,
  p5_ecs_alb: {
    ko: "ALB + Target Group 생성",
    en: "Create ALB + Target Group",
  },
  p5_ecs_alb_d: {
    ko: "HTTPS 리스너(443). HTTP→HTTPS 리다이렉트. 헬스체크 경로 설정(/health)",
    en: "HTTPS listener (443). HTTP->HTTPS redirect. Set health check path (/health)",
  },
  p5_ecs_service: {
    ko: "ECS Service 생성",
    en: "Create ECS Service",
  },
  p5_ecs_service_d: {
    ko: (desired: number, deployStr: string) => `desired=${desired}. 롤링 최소 50%/최대 200%. ${deployStr}`,
    en: (desired: number, deployStr: string) => `desired=${desired}. Rolling min 50% / max 200%. ${deployStr}`,
  } as any,
  p5_ecs_deploy_bg: {
    ko: "CodeDeploy Blue/Green 설정",
    en: "CodeDeploy Blue/Green setup",
  },
  p5_ecs_deploy_rolling: {
    ko: "자체 롤링 배포",
    en: "Self-managed rolling deployment",
  },
  p5_ecs_autoscaling: {
    ko: "ECS Auto Scaling 설정",
    en: "Set up ECS Auto Scaling",
  },
  p5_lambda: {
    ko: "Lambda 함수 생성",
    en: "Create Lambda function",
  },
  p5_lambda_d: {
    ko: "VPC 배치(DB 접근 시). 메모리 512MB~1GB. 타임아웃 29초(API Gateway) 또는 60초(ALB)",
    en: "VPC placement (for DB access). Memory 512MB-1GB. Timeout 29s (API Gateway) or 60s (ALB)",
  },
  p5_apigw: {
    ko: "API Gateway REST/HTTP API 생성",
    en: "Create API Gateway REST/HTTP API",
  },
  p5_apigw_d: {
    ko: "HTTPS Only. 스테이지 변수 설정. 계정 전체 10,000 RPS 한도. 스테이지별 별도 설정 필수",
    en: "HTTPS only. Set stage variables. Account-wide 10,000 RPS limit. Per-stage throttle configuration required",
  },
  p5_lambda_concurrency: {
    ko: "Lambda 동시성 설정",
    en: "Configure Lambda concurrency",
  },
  p5_lambda_concurrency_d: {
    ko: "Reserved Concurrency로 다른 함수 영향 차단. Provisioned Concurrency(콜드스타트 제거)",
    en: "Isolate impact on other functions with Reserved Concurrency. Provisioned Concurrency (eliminate cold starts)",
  },

  // ── Phase 6 items ──
  p6_r53_zone: {
    ko: "Route 53 호스팅 영역 생성",
    en: "Create Route 53 hosted zone",
  },
  p6_r53_zone_d: {
    ko: "퍼블릭 호스팅 영역. 도메인 등록사에서 NS 레코드 업데이트",
    en: "Public hosted zone. Update NS records at domain registrar",
  },
  p6_cf_dist: {
    ko: "CloudFront 배포 생성",
    en: "Create CloudFront distribution",
  },
  p6_cf_dist_d: {
    ko: "Origin: ALB. HTTPS만 허용, ALB SG에서 CloudFront IP만 허용. 가격 등급: PriceClass_200",
    en: "Origin: ALB. HTTPS only. Restrict ALB SG to CloudFront IPs. Price class: PriceClass_200",
  },
  p6_cf_cache: {
    ko: "CloudFront 캐시 정책 설정",
    en: "Configure CloudFront cache policy",
  },
  p6_cf_cache_d: {
    ko: "정적 파일: max-age 31536000. API: cache 없음(no-store). 압축 활성화",
    en: "Static files: max-age 31536000. API: no cache (no-store). Enable compression",
  },
  p6_cf_origin: {
    ko: "CloudFront 오리진 요청 정책 설정",
    en: "Configure CloudFront origin request policy",
  },
  p6_cf_origin_d: {
    ko: "Host 헤더 전달 설정. 필요한 헤더만 오리진에 전달",
    en: "Set Host header forwarding. Forward only necessary headers to origin",
  },
  p6_cf_s3_oac: {
    ko: "CloudFront S3 OAC 연결",
    en: "Connect CloudFront S3 OAC",
  },
  p6_cf_s3_oac_d: {
    ko: "S3 버킷 직접 접근 차단. OAC(Origin Access Control) 방식 사용(OAI deprecated)",
    en: "Block direct S3 bucket access. Use OAC (Origin Access Control) method (OAI deprecated)",
  },
  p6_waf_acl: {
    ko: (hasCf: boolean) => hasCf ? "WAF Web ACL 생성 (us-east-1)" : "WAF Web ACL 생성 (서비스 리전)",
    en: (hasCf: boolean) => hasCf ? "Create WAF Web ACL (us-east-1)" : "Create WAF Web ACL (service region)",
  } as any,
  p6_waf_acl_d: {
    ko: (hasCf: boolean) => hasCf ? "CloudFront 연결 시 반드시 us-east-1에 생성. AWS Managed Rules 활성화" : "ALB/API Gateway 연결 시 서비스 리전(ap-northeast-2)에 생성. AWS Managed Rules 활성화",
    en: (hasCf: boolean) => hasCf ? "Must create in us-east-1 when connecting to CloudFront. Enable AWS Managed Rules" : "Create in service region (ap-northeast-2) when connecting to ALB/API Gateway. Enable AWS Managed Rules",
  } as any,
  p6_waf_managed: {
    ko: "WAF 관리형 규칙 활성화",
    en: "Enable WAF managed rules",
  },
  p6_waf_managed_d: {
    ko: "AWSManagedRulesCommonRuleSet + AWSManagedRulesKnownBadInputsRuleSet",
    en: "AWSManagedRulesCommonRuleSet + AWSManagedRulesKnownBadInputsRuleSet",
  },
  p6_bot: {
    ko: "Bot Control 규칙 활성화",
    en: "Enable Bot Control rules",
  },
  p6_bot_d: {
    ko: "TARGETED 수준. 토큰 기반 검증. 이벤트 당일 COUNT→BLOCK 전환 계획 수립",
    en: "TARGETED level. Token-based verification. Plan COUNT->BLOCK transition for event day",
  },
  p6_shield: {
    ko: "Shield Advanced 구독",
    en: "Subscribe to Shield Advanced",
  },
  p6_shield_d: {
    ko: "$3,000/월 고정. DRT(DDoS Response Team) 지원 활성화. SRT 역할 생성",
    en: "$3,000/mo fixed. Enable DRT (DDoS Response Team) support. Create SRT role",
  },
  p6_r53_health: {
    ko: "Route 53 헬스체크 생성",
    en: "Create Route 53 health check",
  },
  p6_r53_health_d: {
    ko: "HTTPS 30초 간격. 3회 실패 시 Unhealthy. CloudWatch 알람 연동",
    en: "HTTPS every 30s. Unhealthy after 3 failures. CloudWatch alarm integration",
  },
  p6_r53_failover: {
    ko: "Route 53 페일오버 레코드 설정",
    en: "Configure Route 53 failover records",
  },
  p6_r53_failover_d: {
    ko: "Primary: 메인 CloudFront/ALB. Secondary: 유지보수 페이지 S3",
    en: "Primary: Main CloudFront/ALB. Secondary: Maintenance page S3",
  },
  p6_r53_alias: {
    ko: "Route 53 A 레코드 생성 (Alias)",
    en: "Create Route 53 A record (Alias)",
  },
  p6_r53_alias_d: {
    ko: "CloudFront 또는 ALB를 Alias 타겟으로 설정. Apex 도메인 사용 가능",
    en: "Set CloudFront or ALB as Alias target. Apex domain supported",
  },

  // ── Phase 7 items ──
  p7_sqs_fifo: {
    ko: "SQS FIFO 큐 생성 (주문/결제)",
    en: "Create SQS FIFO queue (orders/payments)",
  },
  p7_sqs_fifo_d: {
    ko: "콘텐츠 기반 중복 제거 활성화. MessageGroupId로 순서 보장. DLQ 연결",
    en: "Enable content-based deduplication. Order guarantee via MessageGroupId. Connect DLQ",
  },
  p7_sqs_dlq: {
    ko: "SQS 데드레터 큐(DLQ) 생성",
    en: "Create SQS Dead Letter Queue (DLQ)",
  },
  p7_sqs_dlq_d: {
    ko: "최대 수신 횟수: 3회. DLQ 알람으로 처리 실패 즉시 감지",
    en: "Max receive count: 3. Detect processing failures immediately via DLQ alarm",
  },
  p7_sns_topic: {
    ko: "SNS 토픽 생성 (이벤트별)",
    en: "Create SNS topics (per event)",
  },
  p7_sns_topic_d: {
    ko: "암호화 활성화(CMK). 구독 확인 이메일 전송 설정",
    en: "Enable encryption (CMK). Set up subscription confirmation email",
  },
  p7_sns_sqs: {
    ko: "SNS → SQS 구독 설정",
    en: "Set up SNS -> SQS subscription",
  },
  p7_sns_sqs_d: {
    ko: "Fan-out 패턴. 각 소비자(재고/배송/분석)별 SQS 큐 구독",
    en: "Fan-out pattern. SQS queue subscription per consumer (inventory/shipping/analytics)",
  },
  p7_kinesis: {
    ko: "Kinesis Data Streams 생성",
    en: "Create Kinesis Data Streams",
  },
  p7_kinesis_d: {
    ko: (shards: number) => `샤드 수: ${shards}개 (초당 1MB/샤드). Enhanced Fan-Out 활성화`,
    en: (shards: number) => `Shard count: ${shards} (1MB/s per shard). Enable Enhanced Fan-Out`,
  } as any,
  p7_firehose: {
    ko: "Amazon Data Firehose 생성 (S3 장기 보관)",
    en: "Create Amazon Data Firehose (S3 long-term storage)",
  },
  p7_firehose_d: {
    ko: "Parquet 변환. S3 파티셔닝 설정(년/월/일). Glue 카탈로그 연동",
    en: "Parquet conversion. S3 partitioning (year/month/day). Glue catalog integration",
  },
  p7_eb_bus: {
    ko: "EventBridge 이벤트 버스 생성",
    en: "Create EventBridge event bus",
  },
  p7_eb_bus_d: {
    ko: "커스텀 버스 생성. 이벤트 스키마 레지스트리 활성화",
    en: "Create custom bus. Enable event schema registry",
  },
  p7_eb_rule: {
    ko: "EventBridge 규칙 생성",
    en: "Create EventBridge rules",
  },
  p7_eb_rule_d: {
    ko: "이벤트 패턴 정의. 타겟(Lambda/SQS/Step Functions) 설정",
    en: "Define event patterns. Set targets (Lambda/SQS/Step Functions)",
  },
  p7_iot: {
    ko: "IoT Core 설정",
    en: "Set up IoT Core",
  },
  p7_iot_d: {
    ko: "Thing 유형 등록. 인증서 기반 인증. MQTT 정책 최소 권한 적용",
    en: "Register Thing types. Certificate-based authentication. Apply least privilege MQTT policies",
  },
  p7_iot_rule: {
    ko: "IoT Core 규칙 생성",
    en: "Create IoT Core rules",
  },
  p7_iot_rule_d: {
    ko: "Kinesis/DynamoDB/Lambda 타겟 연결. SQL 필터로 불필요 데이터 제거",
    en: "Connect Kinesis/DynamoDB/Lambda targets. Filter unnecessary data with SQL",
  },

  // ── Phase 8 items ──
  p8_tf_state: {
    ko: "Terraform Remote State 설정",
    en: "Set up Terraform Remote State",
  },
  p8_tf_state_d: {
    ko: "S3 버킷 + DynamoDB 테이블 생성. 버킷 버전 관리 ON. 암호화 활성화",
    en: "Create S3 bucket + DynamoDB table. Bucket versioning ON. Enable encryption",
  },
  p8_tf_modules: {
    ko: "Terraform 모듈 구조 설정",
    en: "Set up Terraform module structure",
  },
  p8_tf_modules_d: {
    ko: "modules/vpc, modules/compute, modules/data, modules/security 분리",
    en: "Separate modules/vpc, modules/compute, modules/data, modules/security",
  },
  p8_tf_workspace: {
    ko: "Terraform Workspace 설정",
    en: "Set up Terraform Workspace",
  },
  p8_tf_workspace_d: {
    ko: "dev/staging/prod workspace. .tfvars 파일 환경별 분리",
    en: "dev/staging/prod workspace. Separate .tfvars files per environment",
  },
  p8_tf_plan: {
    ko: "terraform init & plan 실행 확인",
    en: "Verify terraform init & plan execution",
  },
  p8_tf_plan_d: {
    ko: "에러 없이 plan 완료 확인. 예상 리소스 수 검증",
    en: "Confirm plan completes without errors. Verify expected resource count",
  },
  p8_tf_apply: {
    ko: "terraform apply (dev 환경 먼저)",
    en: "terraform apply (dev environment first)",
  },
  p8_tf_apply_d: {
    ko: "dev 환경 전체 프로비저닝. 출력값(ALB DNS, DB 엔드포인트) 확인",
    en: "Full provisioning of dev environment. Verify outputs (ALB DNS, DB endpoint)",
  },
  p8_cdk_bootstrap: {
    ko: "CDK Bootstrap 실행 (계정/리전별)",
    en: "Run CDK Bootstrap (per account/region)",
  },
  p8_cdk_bootstrap_d: {
    ko: "cdk bootstrap aws://ACCOUNT/ap-northeast-2. S3 버킷 + IAM 역할 자동 생성",
    en: "cdk bootstrap aws://ACCOUNT/ap-northeast-2. Auto-creates S3 bucket + IAM roles",
  },
  p8_cdk_stacks: {
    ko: "CDK Stack 분리 구성",
    en: "Configure CDK Stack separation",
  },
  p8_cdk_stacks_d: {
    ko: "NetworkStack / SecurityStack / DataStack / AppStack으로 분리",
    en: "Separate into NetworkStack / SecurityStack / DataStack / AppStack",
  },
  p8_cdk_synth: {
    ko: "cdk synth 실행 확인",
    en: "Verify cdk synth execution",
  },
  p8_cdk_synth_d: {
    ko: "CloudFormation 템플릿 생성 확인. 에러 없음 검증",
    en: "Confirm CloudFormation template generation. Verify no errors",
  },
  p8_cdk_deploy: {
    ko: "cdk deploy --all (dev 환경)",
    en: "cdk deploy --all (dev environment)",
  },
  p8_cdk_deploy_d: {
    ko: "dev 스택 순차 배포. 의존성 순서 자동 처리",
    en: "Sequential deployment of dev stacks. Auto-handle dependency order",
  },
  p8_gh_oidc: {
    ko: "GitHub Actions OIDC 설정",
    en: "Set up GitHub Actions OIDC",
  },
  p8_gh_oidc_d: {
    ko: "AWS에 GitHub OIDC Provider 등록. Role ARN을 GitHub Secrets에 저장",
    en: "Register GitHub OIDC Provider in AWS. Store Role ARN in GitHub Secrets",
  },
  p8_gh_workflow: {
    ko: ".github/workflows/deploy.yml 작성",
    en: "Write .github/workflows/deploy.yml",
  },
  p8_gh_workflow_d: {
    ko: (deployStr: string) => `브랜치별 배포 환경 매핑(main→prod, develop→stage). ${deployStr} 배포 설정`,
    en: (deployStr: string) => `Map deployment environments per branch (main->prod, develop->stage). ${deployStr} deployment setup`,
  } as any,
  p8_gh_secrets: {
    ko: "GitHub Secrets 등록",
    en: "Register GitHub Secrets",
  },
  p8_gh_secrets_d: {
    ko: "AWS_ACCOUNT_ID, ECR_REPOSITORY, ECS_SERVICE 등. 환경별 Secrets 분리",
    en: "AWS_ACCOUNT_ID, ECR_REPOSITORY, ECS_SERVICE, etc. Separate Secrets per environment",
  },
  p8_infracost: {
    ko: "Infracost PR 코멘트 설정",
    en: "Set up Infracost PR comments",
  },
  p8_infracost_d: {
    ko: "terraform plan 결과를 비용 추정으로 변환. PR에 자동 코멘트로 비용 영향 시각화",
    en: "Convert terraform plan results to cost estimates. Auto-comment on PRs to visualize cost impact",
  },
  p8_env_sep: {
    ko: (envLabel: string) => `배포 환경 ${envLabel} 분리 설정`,
    en: (envLabel: string) => `Set up ${envLabel} deployment environment separation`,
  } as any,
  p8_env_sep_d: {
    ko: "각 환경별 변수 파일 분리. Prod 배포는 수동 승인(approval) 단계 추가",
    en: "Separate variable files per environment. Add manual approval step for Prod deployment",
  },
  p8_first_deploy: {
    ko: "첫 번째 자동 배포 테스트",
    en: "Test first automated deployment",
  },
  p8_first_deploy_d: {
    ko: "feature 브랜치 → PR → 자동 빌드 → stage 배포 → 수동 승인 → prod 배포 전체 흐름 검증",
    en: "Verify full flow: feature branch -> PR -> auto build -> stage deploy -> manual approval -> prod deploy",
  },

  // ── Phase 9 items ──
  p9_cw_logs: {
    ko: "CloudWatch 로그 그룹 생성",
    en: "Create CloudWatch log groups",
  },
  p9_cw_logs_d: {
    ko: "앱 로그, DB 슬로우 쿼리, ALB 액세스 로그. 보존 기간 30일(운영)",
    en: "App logs, DB slow queries, ALB access logs. 30-day retention (production)",
  },
  p9_cw_dashboard: {
    ko: "CloudWatch 대시보드 생성",
    en: "Create CloudWatch dashboard",
  },
  p9_cw_dashboard_d: {
    ko: "ALB RPS, ECS CPU/메모리, DB 연결 수, 캐시 히트율, 에러율 위젯 구성",
    en: "Compose widgets: ALB RPS, ECS CPU/memory, DB connections, cache hit rate, error rate",
  },
  p9_alb_alarm: {
    ko: "ALB 알람 설정",
    en: "Set up ALB alarms",
  },
  p9_alb_alarm_d: {
    ko: "5xx 비율 > 1%, 응답시간 p99 > 2초, HealthyHostCount < 2",
    en: "5xx rate > 1%, response time p99 > 2s, HealthyHostCount < 2",
  },
  p9_ecs_alarm: {
    ko: "ECS 알람 설정",
    en: "Set up ECS alarms",
  },
  p9_ecs_alarm_d: {
    ko: "CPUUtilization > 80%, MemoryUtilization > 85%, Running Task < min",
    en: "CPUUtilization > 80%, MemoryUtilization > 85%, Running Task < min",
  },
  p9_eks_insights: {
    ko: "EKS Container Insights 활성화",
    en: "Enable EKS Container Insights",
  },
  p9_eks_insights_d: {
    ko: "클러스터 수준 모니터링. CloudWatch Logs Insights 쿼리 저장",
    en: "Cluster-level monitoring. Save CloudWatch Logs Insights queries",
  },
  p9_rds_alarm: {
    ko: "RDS/Aurora 알람 설정",
    en: "Set up RDS/Aurora alarms",
  },
  p9_rds_alarm_d: {
    ko: "FreeStorage < 10GB, CPUUtilization > 80%, DatabaseConnections > 200, ReplicationLag > 1s",
    en: "FreeStorage < 10GB, CPUUtilization > 80%, DatabaseConnections > 200, ReplicationLag > 1s",
  },
  p9_ddb_alarm: {
    ko: "DynamoDB 알람 설정",
    en: "Set up DynamoDB alarms",
  },
  p9_ddb_alarm_d: {
    ko: "SystemErrors > 0, ThrottledRequests > 0, ConsumedWriteCapacityUnits 추적",
    en: "SystemErrors > 0, ThrottledRequests > 0, Track ConsumedWriteCapacityUnits",
  },
  p9_cache_alarm: {
    ko: "ElastiCache 알람 설정",
    en: "Set up ElastiCache alarms",
  },
  p9_cache_alarm_d: {
    ko: "EngineCPUUtilization > 80%, Evictions > 1000/min, CurrConnections > 500",
    en: "EngineCPUUtilization > 80%, Evictions > 1000/min, CurrConnections > 500",
  },
  p9_synthetics: {
    ko: "CloudWatch Synthetics Canary 설정",
    en: "Set up CloudWatch Synthetics Canary",
  },
  p9_synthetics_d: {
    ko: "주요 API 엔드포인트별 Canary 생성. 5분 간격 헬스체크. 실패 시 CloudWatch Alarm → SNS 즉시 알림",
    en: "Create Canary per major API endpoint. 5-min health check intervals. On failure: CloudWatch Alarm -> SNS immediate alert",
  },
  p9_sns_oncall: {
    ko: "SNS 알림 토픽 생성 (on-call)",
    en: "Create SNS alert topic (on-call)",
  },
  p9_sns_oncall_d: {
    ko: "이메일 + Slack(ChatBot) 구독. 심각도별 에스컬레이션 설정",
    en: "Email + Slack (ChatBot) subscription. Configure severity-based escalation",
  },
  p9_xray: {
    ko: "X-Ray 분산 추적 활성화",
    en: "Enable X-Ray distributed tracing",
  },
  p9_xray_d: {
    ko: "ALB → 앱 → DB 전 구간 추적. 느린 요청 원인 분석",
    en: "Trace entire path: ALB -> App -> DB. Analyze slow request causes",
  },
  p9_ct_integrity: {
    ko: "CloudTrail 로그 무결성 검증 활성화",
    en: "Enable CloudTrail log integrity validation",
  },
  p9_ct_integrity_d: {
    ko: "로그 파일 검증 활성화. 감사 시 로그 위변조 여부 확인 가능",
    en: "Enable log file validation. Verify log tampering during audits",
  },
  p9_cost_anomaly: {
    ko: "AWS Cost Anomaly Detection 설정",
    en: "Set up AWS Cost Anomaly Detection",
  },
  p9_cost_anomaly_d: {
    ko: "서비스별 이상 비용 자동 감지. 임계값 초과 시 즉시 알림",
    en: "Auto-detect anomalous costs per service. Immediate alert when threshold exceeded",
  },

  // ── Phase 10 items ──
  p10_load_test: {
    ko: "부하 테스트 실행 (k6 또는 Artillery)",
    en: "Run load test (k6 or Artillery)",
  },
  p10_load_test_d: {
    ko: (durationStr: string) => `목표 RPS의 1.5배로 테스트. ${durationStr}. 병목 지점 확인`,
    en: (durationStr: string) => `Test at 1.5x target RPS. ${durationStr}. Identify bottlenecks`,
  } as any,
  p10_load_test_long: {
    ko: "10분 이상 지속 테스트",
    en: "Sustained test for 10+ minutes",
  },
  p10_load_test_short: {
    ko: "5분 테스트",
    en: "5-minute test",
  },
  p10_autoscale_verify: {
    ko: "Auto Scaling 동작 검증",
    en: "Verify Auto Scaling behavior",
  },
  p10_autoscale_verify_d: {
    ko: "CPU 임계값 초과 유도 후 Scale-out 시간 측정. Scale-in 정상 동작 확인",
    en: "Trigger CPU threshold breach then measure scale-out time. Verify scale-in works correctly",
  },
  p10_db_failover: {
    ko: "DB 페일오버 테스트",
    en: "Test DB failover",
  },
  p10_db_failover_d: {
    ko: "Aurora 페일오버 강제 실행. 앱 재연결 시간 측정. Read Replica 승격 확인",
    en: "Force Aurora failover. Measure app reconnection time. Verify Read Replica promotion",
  },
  p10_dr_doc: {
    ko: "DR 복구 절차 문서화",
    en: "Document DR recovery procedures",
  },
  p10_dr_doc_d: {
    ko: "장애 시나리오별 대응 절차. 연락망. 에스컬레이션 체계. 분기 1회 훈련",
    en: "Response procedures per failure scenario. Contact list. Escalation framework. Quarterly drills",
  },
  p10_vuln_scan: {
    ko: "보안 취약점 스캔 실행",
    en: "Run security vulnerability scan",
  },
  p10_vuln_scan_d: {
    ko: "Amazon Inspector(EC2/Lambda/ECR 이미지). 심각도 HIGH 이상 즉시 수정",
    en: "Amazon Inspector (EC2/Lambda/ECR images). Fix HIGH severity and above immediately",
  },
  p10_pentest: {
    ko: "침투 테스트 계획 수립",
    en: "Plan penetration testing",
  },
  p10_pentest_d: {
    ko: "AWS 침투 테스트 허용 서비스 범위 확인. 외부 보안 업체 계약",
    en: "Verify AWS-permitted penetration test service scope. Contract external security firm",
  },
  p10_compliance_docs: {
    ko: "규정 준수 문서 준비",
    en: "Prepare compliance documentation",
  },
  p10_compliance_docs_d: {
    ko: (certStr: string) => `${certStr} 감사 준비. CloudTrail/Config/GuardDuty 리포트 수집`,
    en: (certStr: string) => `${certStr} audit preparation. Collect CloudTrail/Config/GuardDuty reports`,
  } as any,
  p10_rollback: {
    ko: "롤백 절차 검증",
    en: "Verify rollback procedures",
  },
  p10_rollback_bg: {
    ko: "Blue/Green 전환 후 즉시 롤백 테스트",
    en: "Test immediate rollback after Blue/Green switch",
  },
  p10_rollback_canary: {
    ko: "카나리 에러 감지 → 자동 롤백 테스트",
    en: "Canary error detection -> auto-rollback test",
  },
  p10_rollback_rolling: {
    ko: "이전 Task Definition으로 수동 롤백 테스트",
    en: "Manual rollback test to previous Task Definition",
  },
  p10_dashboard_share: {
    ko: "모니터링 대시보드 팀 공유",
    en: "Share monitoring dashboard with team",
  },
  p10_dashboard_share_d: {
    ko: "운영팀 CloudWatch 접근 권한 부여. 알람 수신자 등록. 온콜 스케줄 설정",
    en: "Grant operations team CloudWatch access. Register alarm recipients. Set on-call schedule",
  },
  p10_launch: {
    ko: "론칭 체크리스트 최종 확인",
    en: "Final launch checklist review",
  },
  p10_launch_d: {
    ko: "DNS TTL 낮추기(5분) → 트래픽 전환 → 10분 모니터링 → TTL 복구",
    en: "Lower DNS TTL (5 min) -> switch traffic -> monitor 10 min -> restore TTL",
  },
};

// Helper to look up a translation. Supports both static strings and function-based entries.
function t(key: string, lang: Lang, ...args: any[]): string {
  const entry = dict[key];
  if (!entry) return key;
  const val = entry[lang];
  if (typeof val === "function") return (val as (...a: any[]) => string)(...args);
  return val;
}

export function generateChecklist(state: WizardState, lang: Lang = "ko") {
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

  // ── PHASE 1: AWS Account & Organization Setup
  const p1: any = { phase: "Phase 1", label: t("p1_label", lang), icon: "\u{1F3E2}", items: [] };
  if (account === "org") {
    p1.items.push(item(t("p1_org_root", lang), t("p1_org_root_d", lang), true));
    p1.items.push(item(t("p1_control_tower", lang), t("p1_control_tower_d", lang), false, "https://docs.aws.amazon.com/controltower/latest/userguide/getting-started-with-control-tower.html"));
    p1.items.push(item(t("p1_scp", lang), t("p1_scp_d", lang)));
    p1.items.push(item(t("p1_member_accounts", lang), t("p1_member_accounts_d", lang)));
  } else if (account === "envs") {
    p1.items.push(item(t("p1_envs_prod", lang), t("p1_envs_prod_d", lang), true));
    p1.items.push(item(t("p1_envs_mfa", lang), t("p1_envs_mfa_d", lang)));
    p1.items.push(item(t("p1_envs_sso", lang), t("p1_envs_sso_d", lang)));
  } else {
    p1.items.push(item(t("p1_single_mfa", lang), t("p1_single_mfa_d", lang), true));
    p1.items.push(item(t("p1_single_billing", lang), t("p1_single_billing_d", lang)));
  }
  p1.items.push(item(t("p1_mfa_recovery", lang), t("p1_mfa_recovery_d", lang), true));
  p1.items.push(item(t("p1_s3_block", lang), t("p1_s3_block_d", lang), true));
  p1.items.push(item(t("p1_cloudtrail", lang), t("p1_cloudtrail_d", lang), hasCritCert));
  p1.items.push(item(t("p1_config", lang), t("p1_config_d", lang), hasCritCert));
  p1.items.push(item(t("p1_budget", lang), t("p1_budget_d", lang)));
  phases.push(p1);

  // ── PHASE 2: VPC & Network Configuration
  const p2: any = { phase: "Phase 2", label: t("p2_label", lang), icon: "\u{1F310}", items: [] };
  p2.items.push(item(t("p2_vpc", lang), t("p2_vpc_d", lang), true));
  p2.items.push(item(t("p2_pub_subnet", lang, azNum), t(azNum === 3 ? "p2_pub_subnet_d_3" : "p2_pub_subnet_d_other", lang), true));
  if (subnet !== "private") {
    p2.items.push(item(t("p2_priv_subnet", lang, azNum), t(azNum === 3 ? "p2_priv_subnet_d_3" : "p2_priv_subnet_d_other", lang), true));
  }
  if (subnet === "3tier" || hasCritCert) {
    p2.items.push(item(t("p2_iso_subnet", lang, azNum), t(azNum === 3 ? "p2_iso_subnet_d_3" : "p2_iso_subnet_d_other", lang), true));
  }
  p2.items.push(item(t("p2_igw", lang), t("p2_igw_d", lang)));
  if (natStrat === "per_az") {
    p2.items.push(item(t("p2_nat_per_az", lang, azNum), t("p2_nat_per_az_d", lang), true));
  } else if (natStrat === "shared" || natStrat === "endpoint") {
    p2.items.push(item(t("p2_nat_shared", lang), t("p2_nat_shared_d", lang)));
  }
  p2.items.push(item(t("p2_vpce_gw", lang), t("p2_vpce_gw_d", lang), false, ""));
  if (hasCritCert || encr === "strict") {
    p2.items.push(item(t("p2_vpce_if", lang), t("p2_vpce_if_d", lang), true));
  }
  const hybridArr = Array.isArray(hybrid) ? hybrid : (hybrid ? [hybrid] : []);
  if (hybridArr.includes("vpn")) {
    p2.items.push(item(t("p2_vpn", lang), t("p2_vpn_d", lang)));
  }
  if (hybridArr.includes("dx")) {
    p2.items.push(item(t("p2_dx", lang), t("p2_dx_d", lang), true));
  }
  p2.items.push(item(t("p2_flow_logs", lang), t("p2_flow_logs_d", lang), hasCritCert));
  phases.push(p2);

  // ── PHASE 3: Security & IAM
  const p3: any = { phase: "Phase 3", label: t("p3_label", lang), icon: "\u{1F512}", items: [] };
  p3.items.push(item(t("p3_kms", lang), encr === "strict" ? t("p3_kms_strict_d", lang) : t("p3_kms_default_d", lang), encr === "strict"));
  if (hasCritCert) {
    p3.items.push(item(t("p3_kms_policy", lang), t("p3_kms_policy_d", lang), true));
  }
  p3.items.push(item(t("p3_acm_apne2", lang), t("p3_acm_apne2_d", lang), true));
  if (cdn !== "no" || isGlobal) {
    p3.items.push(item(t("p3_acm_use1", lang), t("p3_acm_use1_d", lang), true));
  }
  p3.items.push(item(t("p3_secrets", lang), t("p3_secrets_d", lang), hasPersonal || hasCritCert));
  if (authArr.includes("cognito")) {
    p3.items.push(item(t("p3_cognito_pool", lang), t("p3_cognito_pool_d", lang)));
    p3.items.push(item(t("p3_cognito_client", lang), t("p3_cognito_client_d", lang)));
  }
  if (authArr.includes("sso")) {
    p3.items.push(item(t("p3_saml", lang), t("p3_saml_d", lang), true));
  }
  if (isEks) {
    p3.items.push(item(t("p3_eks_irsa", lang), t("p3_eks_irsa_d", lang)));
  }
  if (isEcs) {
    p3.items.push(item(t("p3_ecs_exec_role", lang), t("p3_ecs_exec_role_d", lang)));
    p3.items.push(item(t("p3_ecs_task_role", lang), t("p3_ecs_task_role_d", lang)));
  }
  if (pipeline === "github" || pipeline === "gitlab") {
    p3.items.push(item(t("p3_cicd_oidc", lang), t("p3_cicd_oidc_d", lang)));
  }
  p3.items.push(item(t("p3_guardduty", lang), t("p3_guardduty_d", lang), hasCritCert));
  if (hasCritCert) {
    p3.items.push(item(t("p3_securityhub", lang), t("p3_securityhub_d", lang), true));
    p3.items.push(item(t("p3_config_rules", lang), t("p3_config_rules_d", lang), true));
  }
  phases.push(p3);

  // ── PHASE 4: Data Layer
  const p4: any = { phase: "Phase 4", label: t("p4_label", lang), icon: "\u{1F5C4}\uFE0F", items: [] };
  if (dbArr.includes("aurora_mysql") || dbArr.includes("aurora_pg")) {
    const eng = dbArr.includes("aurora_pg") ? "PostgreSQL 16.x" : "MySQL 8.0";
    const maxAcu = dau === "xlarge" ? 128 : dau === "large" ? 64 : dau === "medium" ? 16 : 4;
    p4.items.push(item(t("p4_aurora_subnet", lang, eng), t("p4_aurora_subnet_d", lang), true));
    p4.items.push(item(t("p4_aurora_param", lang, eng), t("p4_aurora_param_d", lang)));
    p4.items.push(item(t("p4_aurora_cluster", lang, eng), t("p4_aurora_cluster_d", lang, maxAcu), true));
    if (dbHa === "multi_az_read") {
      p4.items.push(item(t("p4_aurora_replica", lang), t("p4_aurora_replica_d", lang)));
    }
    p4.items.push(item(t("p4_aurora_backup", lang), t("p4_aurora_backup_d", lang)));
    p4.items.push(item(t("p4_aurora_del_prot", lang), t("p4_aurora_del_prot_d", lang), true));
    p4.items.push(item(t("p4_db_schema", lang), t("p4_db_schema_d", lang)));
    p4.items.push(item(t("p4_db_secrets", lang), t("p4_db_secrets_d", lang)));
  }
  if (dbArr.includes("rds_mysql") || dbArr.includes("rds_pg")) {
    p4.items.push(item(t("p4_rds_param", lang), t("p4_rds_param_d", lang)));
    p4.items.push(item(t("p4_rds_instance", lang), t("p4_rds_instance_d", lang, dbHa === "multi_az"), true));
    p4.items.push(item(t("p4_rds_snapshot", lang), t("p4_rds_snapshot_d", lang)));
  }
  if (dbArr.includes("dynamodb")) {
    p4.items.push(item(t("p4_ddb_table", lang), t("p4_ddb_table_d", lang), true));
    p4.items.push(item(t("p4_ddb_pitr", lang), t("p4_ddb_pitr_d", lang), true));
    p4.items.push(item(t("p4_ddb_streams", lang), t("p4_ddb_streams_d", lang)));
    if (hasCritCert) {
      p4.items.push(item(t("p4_ddb_cmk", lang), t("p4_ddb_cmk_d", lang), true));
    }
  }
  if (cache === "redis" || cache === "both") {
    const instanceType = dau === "xlarge" ? "cache.r7g.xlarge" : dau === "large" ? "cache.r7g.large" : "cache.r7g.medium";
    p4.items.push(item(t("p4_elasticache_subnet", lang), t("p4_elasticache_subnet_d", lang)));
    p4.items.push(item(t("p4_elasticache_cluster", lang), t("p4_elasticache_cluster_d", lang, instanceType, azNum > 1)));
    p4.items.push(item(t("p4_redis_secrets", lang), t("p4_redis_secrets_d", lang)));
  }
  if (storArr.includes("s3")) {
    p4.items.push(item(t("p4_s3_bucket", lang), t("p4_s3_bucket_d", lang), true));
    p4.items.push(item(t("p4_s3_policy", lang), hasCritCert ? t("p4_s3_policy_strict_d", lang) : t("p4_s3_policy_default_d", lang)));
    p4.items.push(item(t("p4_s3_versioning", lang), t("p4_s3_versioning_d", lang)));
    p4.items.push(item(t("p4_s3_tiering", lang), t("p4_s3_tiering_d", lang)));
  }
  if (search === "opensearch") {
    p4.items.push(item(t("p4_opensearch", lang), t("p4_opensearch_d", lang, azNum)));
    p4.items.push(item(t("p4_opensearch_index", lang), t("p4_opensearch_index_d", lang)));
  }
  phases.push(p4);

  // ── PHASE 5: Compute Layer
  const p5: any = { phase: "Phase 5", label: t("p5_label", lang), icon: "\u{1F5A5}\uFE0F", items: [] };
  p5.items.push(item(t("p5_ecr", lang), t("p5_ecr_d", lang), true));
  p5.items.push(item(t("p5_docker", lang), t("p5_docker_d", lang)));
  if (isEks) {
    p5.items.push(item(t("p5_eks_cluster", lang), t("p5_eks_cluster_d", lang), true));
    p5.items.push(item(t("p5_eks_addons", lang), t("p5_eks_addons_d", lang)));
    if (nodeP === "karpenter") {
      p5.items.push(item(t("p5_karpenter", lang), t("p5_karpenter_d", lang), true));
    } else {
      p5.items.push(item(t("p5_eks_mng", lang), t("p5_eks_mng_d", lang, azNum, dau === "xlarge" ? 50 : 20)));
    }
    p5.items.push(item(t("p5_alb_controller", lang), t("p5_alb_controller_d", lang), true));
    if (gitops === "argocd") {
      p5.items.push(item(t("p5_argocd", lang), t("p5_argocd_d", lang)));
    }
    p5.items.push(item(t("p5_ns", lang), t("p5_ns_d", lang)));
    p5.items.push(item(t("p5_hpa", lang), t("p5_hpa_d", lang)));
  } else if (isEcs) {
    const cpu = dau === "xlarge" ? 2048 : dau === "large" ? 1024 : 512;
    const mem = dau === "xlarge" ? 4096 : dau === "large" ? 2048 : 1024;
    p5.items.push(item(t("p5_ecs_cluster", lang), t("p5_ecs_cluster_d", lang), true));
    p5.items.push(item(t("p5_ecs_taskdef", lang), t("p5_ecs_taskdef_d", lang, cpu, mem), true));
    p5.items.push(item(t("p5_ecs_alb", lang), t("p5_ecs_alb_d", lang)));
    const deployStr = deploy === "bluegreen" ? t("p5_ecs_deploy_bg", lang) : t("p5_ecs_deploy_rolling", lang);
    p5.items.push(item(t("p5_ecs_service", lang), t("p5_ecs_service_d", lang, azNum, deployStr), true));
    p5.items.push(item(t("p5_ecs_autoscaling", lang), "CPU 70% Target Tracking. min=2 max=" + (dau === "xlarge" ? 50 : 20)));
  } else if (isServerless) {
    p5.items.push(item(t("p5_lambda", lang), t("p5_lambda_d", lang), true));
    p5.items.push(item(t("p5_apigw", lang), t("p5_apigw_d", lang)));
    p5.items.push(item(t("p5_lambda_concurrency", lang), t("p5_lambda_concurrency_d", lang)));
  }
  phases.push(p5);

  // ── PHASE 6: Edge & DNS
  const p6: any = { phase: "Phase 6", label: t("p6_label", lang), icon: "\u26A1", items: [] };
  p6.items.push(item(t("p6_r53_zone", lang), t("p6_r53_zone_d", lang), true));
  if (cdn !== "no") {
    p6.items.push(item(t("p6_cf_dist", lang), t("p6_cf_dist_d", lang), true));
    p6.items.push(item(t("p6_cf_cache", lang), t("p6_cf_cache_d", lang)));
    p6.items.push(item(t("p6_cf_origin", lang), t("p6_cf_origin_d", lang)));
    if (storArr.includes("s3")) {
      p6.items.push(item(t("p6_cf_s3_oac", lang), t("p6_cf_s3_oac_d", lang), true));
    }
  }
  if (waf && waf !== "no") {
    const hasCf = cdn !== "no" && !!cdn;
    p6.items.push(item(t("p6_waf_acl", lang, hasCf), t("p6_waf_acl_d", lang, hasCf), true));
    p6.items.push(item(t("p6_waf_managed", lang), t("p6_waf_managed_d", lang)));
    if (waf === "bot") {
      p6.items.push(item(t("p6_bot", lang), t("p6_bot_d", lang), true));
    }
    if (waf === "shield") {
      p6.items.push(item(t("p6_shield", lang), t("p6_shield_d", lang), true));
    }
  }
  if (dns === "health" || dns === "latency") {
    p6.items.push(item(t("p6_r53_health", lang), t("p6_r53_health_d", lang)));
    p6.items.push(item(t("p6_r53_failover", lang), t("p6_r53_failover_d", lang)));
  }
  p6.items.push(item(t("p6_r53_alias", lang), t("p6_r53_alias_d", lang)));
  phases.push(p6);

  // ── PHASE 7: Messaging & Integration
  if (syncMode !== "sync_only" || types.includes("iot")) {
    const p7: any = { phase: "Phase 7", label: t("p7_label", lang), icon: "\u{1F4E8}", items: [] };
    if (queueArr.includes("sqs") || isTx) {
      p7.items.push(item(t("p7_sqs_fifo", lang), t("p7_sqs_fifo_d", lang), true));
      p7.items.push(item(t("p7_sqs_dlq", lang), t("p7_sqs_dlq_d", lang)));
    }
    if (queueArr.includes("sns")) {
      p7.items.push(item(t("p7_sns_topic", lang), t("p7_sns_topic_d", lang)));
      p7.items.push(item(t("p7_sns_sqs", lang), t("p7_sns_sqs_d", lang)));
    }
    if (queueArr.includes("kinesis")) {
      const shards = dau === "xlarge" ? 20 : dau === "large" ? 10 : 4;
      p7.items.push(item(t("p7_kinesis", lang), t("p7_kinesis_d", lang, shards)));
      p7.items.push(item(t("p7_firehose", lang), t("p7_firehose_d", lang)));
    }
    if (queueArr.includes("eventbridge")) {
      p7.items.push(item(t("p7_eb_bus", lang), t("p7_eb_bus_d", lang)));
      p7.items.push(item(t("p7_eb_rule", lang), t("p7_eb_rule_d", lang)));
    }
    if (types.includes("iot")) {
      p7.items.push(item(t("p7_iot", lang), t("p7_iot_d", lang), true));
      p7.items.push(item(t("p7_iot_rule", lang), t("p7_iot_rule_d", lang)));
    }
    phases.push(p7);
  }

  // ── PHASE 8: CI/CD Pipeline
  const p8: any = { phase: "Phase 8", label: t("p8_label", lang), icon: "\u{1F680}", items: [] };
  if (iac === "terraform") {
    p8.items.push(item(t("p8_tf_state", lang), t("p8_tf_state_d", lang), true));
    p8.items.push(item(t("p8_tf_modules", lang), t("p8_tf_modules_d", lang)));
    p8.items.push(item(t("p8_tf_workspace", lang), t("p8_tf_workspace_d", lang)));
    p8.items.push(item(t("p8_tf_plan", lang), t("p8_tf_plan_d", lang)));
    p8.items.push(item(t("p8_tf_apply", lang), t("p8_tf_apply_d", lang), true));
  } else if (iac === "cdk") {
    p8.items.push(item(t("p8_cdk_bootstrap", lang), t("p8_cdk_bootstrap_d", lang), true));
    p8.items.push(item(t("p8_cdk_stacks", lang), t("p8_cdk_stacks_d", lang)));
    p8.items.push(item(t("p8_cdk_synth", lang), t("p8_cdk_synth_d", lang)));
    p8.items.push(item(t("p8_cdk_deploy", lang), t("p8_cdk_deploy_d", lang), true));
  }
  if (pipeline === "github") {
    p8.items.push(item(t("p8_gh_oidc", lang), t("p8_gh_oidc_d", lang), true));
    const deployLabel = deploy === "bluegreen" ? "Blue/Green" : deploy === "canary" ? "Canary" : "Rolling";
    p8.items.push(item(t("p8_gh_workflow", lang), t("p8_gh_workflow_d", lang, deployLabel)));
    p8.items.push(item(t("p8_gh_secrets", lang), t("p8_gh_secrets_d", lang)));
  }
  if (iac === "terraform") {
    p8.items.push(item(t("p8_infracost", lang), t("p8_infracost_d", lang)));
  }
  const envLabel = envCnt === "four" ? "dev/stage/preprod/prod" : envCnt === "three" ? "dev/stage/prod" : "dev/prod";
  p8.items.push(item(t("p8_env_sep", lang, envLabel), t("p8_env_sep_d", lang), true));
  p8.items.push(item(t("p8_first_deploy", lang), t("p8_first_deploy_d", lang)));
  phases.push(p8);

  // ── PHASE 9: Monitoring & Operations
  const p9: any = { phase: "Phase 9", label: t("p9_label", lang), icon: "\u{1F4CA}", items: [] };
  p9.items.push(item(t("p9_cw_logs", lang), t("p9_cw_logs_d", lang)));
  p9.items.push(item(t("p9_cw_dashboard", lang), t("p9_cw_dashboard_d", lang)));
  p9.items.push(item(t("p9_alb_alarm", lang), t("p9_alb_alarm_d", lang), true));
  if (isEcs) p9.items.push(item(t("p9_ecs_alarm", lang), t("p9_ecs_alarm_d", lang)));
  if (isEks) p9.items.push(item(t("p9_eks_insights", lang), t("p9_eks_insights_d", lang)));
  if (dbArr.some((d: string) => d.startsWith("aurora") || d.startsWith("rds"))) {
    p9.items.push(item(t("p9_rds_alarm", lang), t("p9_rds_alarm_d", lang), true));
  }
  if (dbArr.includes("dynamodb")) {
    p9.items.push(item(t("p9_ddb_alarm", lang), t("p9_ddb_alarm_d", lang)));
  }
  if (cache === "redis" || cache === "both") {
    p9.items.push(item(t("p9_cache_alarm", lang), t("p9_cache_alarm_d", lang)));
  }
  if (avail === "99.9" || avail === "99.95" || avail === "99.99") {
    p9.items.push(item(t("p9_synthetics", lang), t("p9_synthetics_d", lang), true));
  }
  p9.items.push(item(t("p9_sns_oncall", lang), t("p9_sns_oncall_d", lang)));
  p9.items.push(item(t("p9_xray", lang), t("p9_xray_d", lang)));
  if (hasCritCert) {
    p9.items.push(item(t("p9_ct_integrity", lang), t("p9_ct_integrity_d", lang), true));
    p9.items.push(item(t("p9_cost_anomaly", lang), t("p9_cost_anomaly_d", lang), true));
  }
  phases.push(p9);

  // ── PHASE 10: Performance Testing & Launch Preparation
  const p10: any = { phase: "Phase 10", label: t("p10_label", lang), icon: "\u{1F3AF}", items: [] };
  const durationStr = (dau === "xlarge" || dau === "large")
    ? t("p10_load_test_long", lang)
    : t("p10_load_test_short", lang);
  p10.items.push(item(t("p10_load_test", lang), t("p10_load_test_d", lang, durationStr)));
  p10.items.push(item(t("p10_autoscale_verify", lang), t("p10_autoscale_verify_d", lang)));
  p10.items.push(item(t("p10_db_failover", lang), t("p10_db_failover_d", lang), true));
  p10.items.push(item(t("p10_dr_doc", lang), t("p10_dr_doc_d", lang)));
  p10.items.push(item(t("p10_vuln_scan", lang), t("p10_vuln_scan_d", lang), hasCritCert));
  if (hasCritCert) {
    p10.items.push(item(t("p10_pentest", lang), t("p10_pentest_d", lang), true));
    p10.items.push(item(t("p10_compliance_docs", lang), t("p10_compliance_docs_d", lang, cert.join("+"))));
  }
  const rollbackDetail = deploy === "bluegreen"
    ? t("p10_rollback_bg", lang)
    : deploy === "canary"
      ? t("p10_rollback_canary", lang)
      : t("p10_rollback_rolling", lang);
  p10.items.push(item(t("p10_rollback", lang), rollbackDetail));
  p10.items.push(item(t("p10_dashboard_share", lang), t("p10_dashboard_share_d", lang)));
  p10.items.push(item(t("p10_launch", lang), t("p10_launch_d", lang)));
  phases.push(p10);

  const totalItems = phases.reduce((s: number, p: any) => s + p.items.length, 0);
  const criticalItems = phases.reduce((s: number, p: any) => s + p.items.filter((i: any) => i.critical).length, 0);

  return { phases, totalItems, criticalItems };
}
