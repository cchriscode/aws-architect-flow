/* eslint-disable @typescript-eslint/no-explicit-any */
import type { WizardState, WafrResult, WafrItem } from "@/lib/types";

/** rec is only included when earnedPts < maxPts */
function I(q: string, maxPts: number, earnedPts: number, rec?: string): WafrItem {
  return { q, maxPts, earnedPts, ...(rec && earnedPts < maxPts ? { rec } : {}) };
}

function pillarScore(items: WafrItem[]): number {
  const max = items.reduce((s, i) => s + i.maxPts, 0);
  if (max === 0) return 0;
  const earned = items.reduce((s, i) => s + i.earnedPts, 0);
  return Math.round((earned / max) * 100);
}

// ── i18n dictionaries ────────────────────────────────────

interface WafrStrings {
  // Operational Excellence
  ops_iac_q: string;
  ops_iac_rec: string;
  ops_cicd_q: string;
  ops_cicd_rec: string;
  ops_deploy_q: string;
  ops_deploy_rec: string;
  ops_env_q: string;
  ops_env_rec: string;
  ops_k8s_monitor_q: string;
  ops_k8s_monitor_rec: string;
  ops_gitops_q: string;
  ops_gitops_rec: string;
  ops_cw_monitor: string;
  ops_cicd_history: string;
  ops_multi_account_q: string;
  ops_multi_account_rec: string;
  ops_audit_q: string;
  ops_audit_rec: string;

  // Security
  sec_encrypt_q: string;
  sec_encrypt_rec_standard: string;
  sec_encrypt_rec_other: string;
  sec_netiso_q: string;
  sec_netiso_rec: string;
  sec_waf_q: string;
  sec_waf_rec_basic: string;
  sec_waf_rec_other: string;
  sec_auth_q: string;
  sec_auth_rec: string;
  sec_k8s_secrets_q: string;
  sec_k8s_secrets_rec_native: string;
  sec_k8s_secrets_rec_other: string;
  sec_pod_sec_q: string;
  sec_pod_sec_rec_psa: string;
  sec_pod_sec_rec_other: string;
  sec_sm_ssm: string;
  sec_task_role: string;
  sec_iam_boundary_q: string;
  sec_iam_boundary_rec: string;
  sec_data_sens_q: string;
  sec_data_sens_rec: string;
  sec_subnet_q: string;
  sec_subnet_rec: string;
  sec_compliance_q: string;
  sec_compliance_rec: string;

  // Reliability
  rel_az_q: string;
  rel_az_rec_2: string;
  rel_az_rec_1: string;
  rel_db_ha_q: string;
  rel_db_ha_rec_multi_az: string;
  rel_db_ha_rec_other: string;
  rel_cache_q: string;
  rel_cache_rec: string;
  rel_region_q: string;
  rel_region_rec: string;
  rel_k8s_backup_q: string;
  rel_k8s_backup_rec: string;
  rel_aws_backup: string;
  rel_dynamodb_repl: string;
  rel_dns_failover_q: string;
  rel_dns_failover_rec: string;
  rel_autoscale_q: string;
  rel_autoscale_rec: string;
  rel_k8s_monitor_q: string;
  rel_k8s_monitor_rec: string;
  rel_cw_alarm: string;
  rel_deploy_rollback_q: string;
  rel_deploy_rollback_rec: string;

  // Performance Efficiency
  perf_arch_q: string;
  perf_arch_rec: string;
  perf_orch_q: string;
  perf_orch_rec: string;
  perf_scale_q: string;
  perf_scale_rec: string;
  perf_cache_q: string;
  perf_cache_rec: string;
  perf_cdn_q: string;
  perf_cdn_rec: string;
  perf_node_q: string;
  perf_node_rec: string;
  perf_dns_q: string;
  perf_dns_rec: string;
  perf_graviton_q: string;
  perf_graviton_rec: string;

  // Cost Optimization
  cost_strategy_q: string;
  cost_strategy_rec: string;
  cost_commit_q: string;
  cost_commit_rec_1yr: string;
  cost_commit_rec_other: string;
  cost_spot_q: string;
  cost_spot_rec_heavy_tx: string;
  cost_spot_rec_partial: string;
  cost_spot_rec_other: string;
  cost_nat_q: string;
  cost_nat_rec_shared: string;
  cost_nat_rec_other: string;
  cost_serverless_q: string;
  cost_serverless_rec: string;
  cost_account_q: string;
  cost_account_rec_envs: string;
  cost_account_rec_other: string;

  // Sustainability
  sus_idle_q: string;
  sus_idle_rec_container: string;
  sus_idle_rec_other: string;
  sus_spot_q: string;
  sus_spot_rec: string;
  sus_cdn_q: string;
  sus_cdn_rec: string;
  sus_endpoint_q: string;
  sus_endpoint_rec: string;
  sus_autoscale_q: string;
  sus_autoscale_rec: string;
  sus_graviton_q: string;
  sus_graviton_rec: string;
  sus_log_q: string;
  sus_log_rec: string;
}

const ko: WafrStrings = {
  // Operational Excellence
  ops_iac_q: "인프라가 코드(IaC)로 정의되어 있습니까?",
  ops_iac_rec: "IaC(Terraform/CDK)로 인프라를 코드화하면 재현성과 감사성이 크게 향상됩니다",
  ops_cicd_q: "CI/CD 파이프라인이 자동화되어 있습니까?",
  ops_cicd_rec: "CI/CD 파이프라인 없이 수동 배포는 운영 사고의 주요 원인입니다",
  ops_deploy_q: "안전한 배포 전략(Blue/Green, Canary)을 사용합니까?",
  ops_deploy_rec: "Blue/Green 또는 Canary 배포로 롤백 능력을 강화하세요",
  ops_env_q: "충분한 환경 분리(Dev/Stage/Prod)가 되어 있습니까?",
  ops_env_rec: "Stage 환경 추가로 프로덕션 배포 전 검증하세요",
  ops_k8s_monitor_q: "K8s 모니터링(Prometheus/CloudWatch)이 설정되어 있습니까?",
  ops_k8s_monitor_rec: "Prometheus + Grafana로 K8s 메트릭 가시성을 높이세요",
  ops_gitops_q: "GitOps로 배포 이력과 드리프트를 관리합니까?",
  ops_gitops_rec: "GitOps(ArgoCD/Flux)로 배포 이력 관리와 드리프트 감지를 자동화하세요",
  ops_cw_monitor: "CloudWatch 모니터링이 기본 제공됩니다",
  ops_cicd_history: "CI/CD 파이프라인이 배포 이력을 관리합니다",
  ops_multi_account_q: "멀티 계정으로 환경이 분리되어 있습니까?",
  ops_multi_account_rec: "멀티 계정 분리로 환경별 변경 영향을 격리하세요",
  ops_audit_q: "감사 이력(CloudTrail) 체계가 갖춰져 있습니까?",
  ops_audit_rec: "CloudTrail 전 리전 활성화로 API 호출 감사 이력을 확보하세요",

  // Security
  sec_encrypt_q: "저장 데이터 암호화(KMS)가 적용되어 있습니까?",
  sec_encrypt_rec_standard: "CMK + CloudTrail 키 감사로 암호화 수준을 높이세요",
  sec_encrypt_rec_other: "저장 데이터 암호화(KMS)를 즉시 활성화하세요",
  sec_netiso_q: "네트워크 계층 격리가 구현되어 있습니까?",
  sec_netiso_rec: "DB를 퍼블릭에서 분리된 프라이빗 서브넷으로 이동하세요",
  sec_waf_q: "인터넷 노출 서비스에 WAF가 적용되어 있습니까?",
  sec_waf_rec_basic: "WAF Bot Control 추가로 자동화된 공격을 차단하세요",
  sec_waf_rec_other: "WAF 없는 공개 서비스는 SQL 인젝션 등에 무방비 상태입니다",
  sec_auth_q: "인증 서비스가 도입되어 있습니까?",
  sec_auth_rec: "인증 서비스(Cognito, SSO 등)를 도입하세요",
  sec_k8s_secrets_q: "K8s 시크릿이 Secrets Manager로 관리됩니까?",
  sec_k8s_secrets_rec_native: "Secrets Manager CSI Driver로 시크릿 자동 교체를 구현하세요",
  sec_k8s_secrets_rec_other: "K8s 시크릿 관리 솔루션을 도입하세요",
  sec_pod_sec_q: "파드 보안 정책이 적용되어 있습니까?",
  sec_pod_sec_rec_psa: "Kyverno/OPA 정책으로 특권 컨테이너 실행을 차단하세요",
  sec_pod_sec_rec_other: "파드 보안 정책을 설정하세요",
  sec_sm_ssm: "Secrets Manager/SSM이 기본 통합됩니다",
  sec_task_role: "ECS Task Role/Lambda Role로 격리됩니다",
  sec_iam_boundary_q: "멀티 계정으로 IAM 경계가 분리되어 있습니까?",
  sec_iam_boundary_rec: "IAM 권한 경계를 계정 수준에서 설정하려면 멀티 계정을 사용하세요",
  sec_data_sens_q: "데이터 민감도에 맞는 보호 수준입니까?",
  sec_data_sens_rec: "VPC Flow Logs 활성화로 비정상 트래픽 탐지와 포렌식을 준비하세요",
  sec_subnet_q: "3계층 서브넷 분리가 구성되어 있습니까?",
  sec_subnet_rec: "3계층(public/private/isolated) 서브넷 분리로 DB 공격 표면을 최소화하세요",
  sec_compliance_q: "보안 컴플라이언스 체계가 적용되어 있습니까?",
  sec_compliance_rec: "PCI/HIPAA 등 보안 인증으로 데이터 보호 체계를 강화하세요",

  // Reliability
  rel_az_q: "멀티 AZ 배포가 구성되어 있습니까?",
  rel_az_rec_2: "3 AZ로 가용성을 99.99%까지 높일 수 있습니다",
  rel_az_rec_1: "단일 AZ는 AZ 장애 시 전체 중단됩니다. Multi-AZ 필수",
  rel_db_ha_q: "데이터베이스 고가용성이 설정되어 있습니까?",
  rel_db_ha_rec_multi_az: "Read Replica 추가로 읽기 부하 분산과 페일오버 속도를 개선하세요",
  rel_db_ha_rec_other: "DB Single-AZ는 운영 서비스에 절대 권장하지 않습니다",
  rel_cache_q: "캐싱 계층이 존재합니까?",
  rel_cache_rec: "ElastiCache로 DB 장애 시 캐시 우선 서비스 가능하게 하세요",
  rel_region_q: "멀티 리전 전략이 수립되어 있습니까?",
  rel_region_rec: "리전 전체 장애 대비 DR 또는 Active-Active 멀티리전을 검토하세요",
  rel_k8s_backup_q: "K8s 리소스 백업(Velero)이 설정되어 있습니까?",
  rel_k8s_backup_rec: "Velero로 K8s 상태와 PVC를 정기 백업하세요",
  rel_aws_backup: "AWS Backup이 기본 통합됩니다",
  rel_dynamodb_repl: "DynamoDB 기본 3-AZ 복제가 안정성을 강화합니다",
  rel_dns_failover_q: "자동 DNS 페일오버(Route53 헬스체크)가 구성되어 있습니까?",
  rel_dns_failover_rec: "Route53 헬스체크로 장애 시 자동 DNS 전환을 구성하세요",
  rel_autoscale_q: "Auto Scaling이 설정되어 있습니까?",
  rel_autoscale_rec: "자동 스케일링으로 트래픽 급증 시 자동 대응하세요",
  rel_k8s_monitor_q: "K8s 모니터링으로 장애를 조기 감지합니까?",
  rel_k8s_monitor_rec: "Prometheus/CloudWatch 알람으로 장애 조기 감지와 자동 대응을 구성하세요",
  rel_cw_alarm: "CloudWatch 알람으로 장애를 조기 감지합니다",
  rel_deploy_rollback_q: "안전한 배포로 즉각 롤백이 가능합니까?",
  rel_deploy_rollback_rec: "Blue/Green 또는 Canary 배포로 장애 시 즉각 롤백 능력을 확보하세요",

  // Performance Efficiency
  perf_arch_q: "서버리스 또는 컨테이너 기반 아키텍처입니까?",
  perf_arch_rec: "컨테이너/서버리스 아키텍처로 리소스 효율을 높이세요",
  perf_orch_q: "오케스트레이터(EKS/ECS)로 리소스를 관리합니까?",
  perf_orch_rec: "EKS/ECS 오케스트레이터로 리소스를 효율적으로 관리하세요",
  perf_scale_q: "자동 스케일링이 최적화되어 있습니까?",
  perf_scale_rec: "자동 스케일링을 구성하면 트래픽 변화에 효율적으로 대응할 수 있습니다",
  perf_cache_q: "캐시를 통해 DB 부하를 줄이고 있습니까?",
  perf_cache_rec: "ElastiCache Redis로 DB 쿼리를 캐시해 응답시간 10배 개선 가능",
  perf_cdn_q: "CDN으로 정적 콘텐츠를 캐싱합니까?",
  perf_cdn_rec: "CloudFront로 정적 파일 응답시간을 50ms 이하로 줄이세요",
  perf_node_q: "컴퓨팅 노드 타입이 최적화되어 있습니까?",
  perf_node_rec: "워크로드에 맞는 인스턴스 타입으로 성능을 최적화하세요",
  perf_dns_q: "DNS 라우팅이 지연시간 기반으로 최적화되어 있습니까?",
  perf_dns_rec: "Route53 지연시간 기반 라우팅으로 사용자 응답시간을 최적화하세요",
  perf_graviton_q: "Graviton(ARM) 인스턴스를 활용합니까?",
  perf_graviton_rec: "Graviton(ARM) 인스턴스로 x86 대비 20~40% 가성비 향상 가능",

  // Cost Optimization
  cost_strategy_q: "비용 최적화 전략이 수립되어 있습니까?",
  cost_strategy_rec: "비용 최적화 우선순위를 설정해 예산을 관리하세요",
  cost_commit_q: "약정(Reserved/Savings Plans)을 활용합니까?",
  cost_commit_rec_1yr: "3년 약정으로 전환하면 총 최대 72%까지 절감 가능합니다",
  cost_commit_rec_other: "안정적 트래픽이면 1년 RI/Savings Plans로 40% 절감을 시작하세요",
  cost_spot_q: "Spot 인스턴스를 활용합니까?",
  cost_spot_rec_heavy_tx: "결제/실시간 서비스에 Heavy Spot은 위험. Stateless 배치만 Spot 적용 권장",
  cost_spot_rec_partial: "배치/데이터 처리에 Spot을 더 적극 활용하면 추가 절감 가능",
  cost_spot_rec_other: "중단 허용 워크로드에 Spot 인스턴스로 70% 절감",
  cost_nat_q: "효율적인 NAT 전략이 적용되어 있습니까?",
  cost_nat_rec_shared: "S3/DynamoDB Gateway Endpoint로 NAT GW 비용을 줄이세요",
  cost_nat_rec_other: "NAT GW 공유 또는 VPC Endpoint 전환으로 비용 절감 가능",
  cost_serverless_q: "서버리스/관리형 서비스로 비용 효율화를 합니까?",
  cost_serverless_rec: "서버리스 또는 Fargate로 유휴 리소스 비용을 줄이세요",
  cost_account_q: "멀티 계정으로 비용 추적 체계를 갖췄습니까?",
  cost_account_rec_envs: "AWS Cost Explorer + 리소스 태그 전략으로 서비스별 비용을 추적하세요",
  cost_account_rec_other: "리소스 태그 전략으로 비용 추적과 최적화 기회를 파악하세요",

  // Sustainability
  sus_idle_q: "서버리스/컨테이너로 유휴 리소스를 최소화합니까?",
  sus_idle_rec_container: "캐시 활용으로 DB 부하를 줄여 컴퓨팅 리소스 효율을 높이세요",
  sus_idle_rec_other: "서버리스/컨테이너로 유휴 리소스를 줄이세요",
  sus_spot_q: "Spot 인스턴스로 AWS 유휴 용량을 활용합니까?",
  sus_spot_rec: "Spot 인스턴스 활용으로 AWS 유휴 용량을 활용해 탄소 효율 개선",
  sus_cdn_q: "CDN으로 오리진 서버 부하를 줄입니까?",
  sus_cdn_rec: "CDN으로 오리진 서버 요청을 줄여 에너지 소비를 낮추세요",
  sus_endpoint_q: "VPC Endpoint로 네트워크 경로를 최적화합니까?",
  sus_endpoint_rec: "VPC Endpoint로 네트워크 트래픽 경로를 최소화하세요",
  sus_autoscale_q: "자동 스케일링으로 과잉 프로비저닝을 방지합니까?",
  sus_autoscale_rec: "자동 스케일링으로 유휴 리소스를 최소화하세요",
  sus_graviton_q: "Graviton(ARM) 또는 서버리스로 에너지 효율을 높입니까?",
  sus_graviton_rec: "EC2 Graviton(ARM) 인스턴스로 Intel 대비 60% 에너지 효율 향상",
  sus_log_q: "로그/스토리지 보존 정책이 최적화되어 있습니까?",
  sus_log_rec: "CloudWatch 로그 보존 기간 최적화 + S3 Glacier 아카이브로 자원 효율 개선",
};

const en: WafrStrings = {
  // Operational Excellence
  ops_iac_q: "Is your infrastructure defined as code (IaC)?",
  ops_iac_rec: "Codifying infrastructure with IaC (Terraform/CDK) greatly improves reproducibility and auditability",
  ops_cicd_q: "Is your CI/CD pipeline automated?",
  ops_cicd_rec: "Manual deployments without a CI/CD pipeline are a leading cause of operational incidents",
  ops_deploy_q: "Do you use a safe deployment strategy (Blue/Green, Canary)?",
  ops_deploy_rec: "Strengthen rollback capabilities with Blue/Green or Canary deployments",
  ops_env_q: "Do you have sufficient environment separation (Dev/Stage/Prod)?",
  ops_env_rec: "Add a Stage environment to validate before production deployments",
  ops_k8s_monitor_q: "Is K8s monitoring (Prometheus/CloudWatch) configured?",
  ops_k8s_monitor_rec: "Increase K8s metric visibility with Prometheus + Grafana",
  ops_gitops_q: "Do you manage deployment history and drift via GitOps?",
  ops_gitops_rec: "Automate deployment history tracking and drift detection with GitOps (ArgoCD/Flux)",
  ops_cw_monitor: "CloudWatch monitoring is included by default",
  ops_cicd_history: "CI/CD pipeline manages deployment history",
  ops_multi_account_q: "Are environments isolated using multi-account structure?",
  ops_multi_account_rec: "Isolate blast radius of changes per environment with multi-account separation",
  ops_audit_q: "Is an audit trail (CloudTrail) system in place?",
  ops_audit_rec: "Enable CloudTrail across all regions to capture API call audit trails",

  // Security
  sec_encrypt_q: "Is encryption at rest (KMS) applied?",
  sec_encrypt_rec_standard: "Elevate encryption by using CMK with CloudTrail key auditing",
  sec_encrypt_rec_other: "Enable encryption at rest (KMS) immediately",
  sec_netiso_q: "Is network layer isolation implemented?",
  sec_netiso_rec: "Move databases to private subnets isolated from public access",
  sec_waf_q: "Is WAF applied to internet-facing services?",
  sec_waf_rec_basic: "Add WAF Bot Control to block automated attacks",
  sec_waf_rec_other: "Public services without WAF are defenseless against SQL injection and other attacks",
  sec_auth_q: "Is an authentication service in place?",
  sec_auth_rec: "Adopt an authentication service (Cognito, SSO, etc.)",
  sec_k8s_secrets_q: "Are K8s secrets managed via Secrets Manager?",
  sec_k8s_secrets_rec_native: "Implement automatic secret rotation with Secrets Manager CSI Driver",
  sec_k8s_secrets_rec_other: "Adopt a K8s secrets management solution",
  sec_pod_sec_q: "Are pod security policies applied?",
  sec_pod_sec_rec_psa: "Block privileged container execution with Kyverno/OPA policies",
  sec_pod_sec_rec_other: "Configure pod security policies",
  sec_sm_ssm: "Secrets Manager/SSM is integrated by default",
  sec_task_role: "Isolated via ECS Task Role/Lambda Role",
  sec_iam_boundary_q: "Are IAM boundaries separated using multi-account?",
  sec_iam_boundary_rec: "Use multi-account to set IAM permission boundaries at the account level",
  sec_data_sens_q: "Is the protection level appropriate for data sensitivity?",
  sec_data_sens_rec: "Enable VPC Flow Logs to detect anomalous traffic and prepare for forensics",
  sec_subnet_q: "Is 3-tier subnet separation configured?",
  sec_subnet_rec: "Minimize DB attack surface with 3-tier (public/private/isolated) subnet separation",
  sec_compliance_q: "Is a security compliance framework applied?",
  sec_compliance_rec: "Strengthen data protection with security certifications such as PCI/HIPAA",

  // Reliability
  rel_az_q: "Is Multi-AZ deployment configured?",
  rel_az_rec_2: "Increase availability up to 99.99% with 3 AZs",
  rel_az_rec_1: "A single AZ causes complete outage on AZ failure. Multi-AZ is essential",
  rel_db_ha_q: "Is database high availability configured?",
  rel_db_ha_rec_multi_az: "Add Read Replicas to distribute read load and improve failover speed",
  rel_db_ha_rec_other: "DB Single-AZ is never recommended for production services",
  rel_cache_q: "Is a caching layer in place?",
  rel_cache_rec: "Use ElastiCache to enable cache-first serving during DB failures",
  rel_region_q: "Is a multi-region strategy established?",
  rel_region_rec: "Consider DR or Active-Active multi-region to prepare for full region failures",
  rel_k8s_backup_q: "Is K8s resource backup (Velero) configured?",
  rel_k8s_backup_rec: "Regularly back up K8s state and PVCs with Velero",
  rel_aws_backup: "AWS Backup is integrated by default",
  rel_dynamodb_repl: "DynamoDB built-in 3-AZ replication enhances reliability",
  rel_dns_failover_q: "Is automatic DNS failover (Route53 health checks) configured?",
  rel_dns_failover_rec: "Configure automatic DNS failover on failure with Route53 health checks",
  rel_autoscale_q: "Is Auto Scaling configured?",
  rel_autoscale_rec: "Respond automatically to traffic spikes with Auto Scaling",
  rel_k8s_monitor_q: "Does K8s monitoring detect failures early?",
  rel_k8s_monitor_rec: "Configure Prometheus/CloudWatch alarms for early failure detection and automated response",
  rel_cw_alarm: "CloudWatch alarms detect failures early",
  rel_deploy_rollback_q: "Can you roll back immediately with safe deployments?",
  rel_deploy_rollback_rec: "Ensure immediate rollback capability with Blue/Green or Canary deployments",

  // Performance Efficiency
  perf_arch_q: "Is the architecture serverless or container-based?",
  perf_arch_rec: "Improve resource efficiency with container/serverless architecture",
  perf_orch_q: "Are resources managed by an orchestrator (EKS/ECS)?",
  perf_orch_rec: "Manage resources efficiently with an EKS/ECS orchestrator",
  perf_scale_q: "Is Auto Scaling optimized?",
  perf_scale_rec: "Configuring Auto Scaling enables efficient response to traffic changes",
  perf_cache_q: "Are you reducing DB load through caching?",
  perf_cache_rec: "Cache DB queries with ElastiCache Redis for up to 10x response time improvement",
  perf_cdn_q: "Is static content cached via CDN?",
  perf_cdn_rec: "Reduce static file response time to under 50ms with CloudFront",
  perf_node_q: "Is the compute node type optimized?",
  perf_node_rec: "Optimize performance with instance types matched to your workload",
  perf_dns_q: "Is DNS routing optimized for latency?",
  perf_dns_rec: "Optimize user response time with Route53 latency-based routing",
  perf_graviton_q: "Are you using Graviton (ARM) instances?",
  perf_graviton_rec: "Graviton (ARM) instances offer 20-40% better price-performance vs x86",

  // Cost Optimization
  cost_strategy_q: "Is a cost optimization strategy established?",
  cost_strategy_rec: "Set cost optimization priorities to manage your budget",
  cost_commit_q: "Are you using commitments (Reserved/Savings Plans)?",
  cost_commit_rec_1yr: "Upgrade to a 3-year commitment for up to 72% total savings",
  cost_commit_rec_other: "Start saving 40% with 1-year RI/Savings Plans for stable traffic",
  cost_spot_q: "Are you using Spot instances?",
  cost_spot_rec_heavy_tx: "Aggressive Spot usage is risky for payment/real-time services. Apply Spot only to stateless batch workloads",
  cost_spot_rec_partial: "Further savings possible by using Spot more aggressively for batch/data processing",
  cost_spot_rec_other: "Save 70% with Spot instances for interruption-tolerant workloads",
  cost_nat_q: "Is an efficient NAT strategy applied?",
  cost_nat_rec_shared: "Reduce NAT GW costs with S3/DynamoDB Gateway Endpoints",
  cost_nat_rec_other: "Reduce costs by sharing NAT GW or switching to VPC Endpoints",
  cost_serverless_q: "Are you optimizing costs with serverless/managed services?",
  cost_serverless_rec: "Reduce idle resource costs with serverless or Fargate",
  cost_account_q: "Do you have cost tracking via multi-account?",
  cost_account_rec_envs: "Track per-service costs with AWS Cost Explorer and resource tagging strategy",
  cost_account_rec_other: "Identify cost tracking and optimization opportunities with resource tagging strategy",

  // Sustainability
  sus_idle_q: "Are you minimizing idle resources with serverless/containers?",
  sus_idle_rec_container: "Improve compute resource efficiency by reducing DB load through caching",
  sus_idle_rec_other: "Reduce idle resources with serverless/containers",
  sus_spot_q: "Are you utilizing AWS spare capacity with Spot instances?",
  sus_spot_rec: "Improve carbon efficiency by utilizing AWS spare capacity with Spot instances",
  sus_cdn_q: "Are you reducing origin server load with CDN?",
  sus_cdn_rec: "Lower energy consumption by reducing origin server requests with CDN",
  sus_endpoint_q: "Are you optimizing network paths with VPC Endpoints?",
  sus_endpoint_rec: "Minimize network traffic paths with VPC Endpoints",
  sus_autoscale_q: "Are you preventing over-provisioning with Auto Scaling?",
  sus_autoscale_rec: "Minimize idle resources with Auto Scaling",
  sus_graviton_q: "Are you improving energy efficiency with Graviton (ARM) or serverless?",
  sus_graviton_rec: "EC2 Graviton (ARM) instances offer 60% energy efficiency improvement over Intel",
  sus_log_q: "Are log/storage retention policies optimized?",
  sus_log_rec: "Improve resource efficiency with CloudWatch log retention optimization + S3 Glacier archiving",
};

const dicts: Record<"ko" | "en", WafrStrings> = { ko, en };

// ── Main scoring function ────────────────────────────────

export function wellArchitectedScore(state: WizardState, lang: "ko" | "en" = "ko"): WafrResult {
  const t = dicts[lang];

  const types    = state.workload?.type || [];
  const az       = state.network?.az_count;
  const dbHa     = state.data?.db_ha;
  const cert     = state.compliance?.cert || [];
  const encr     = state.compliance?.encryption;
  const netIso   = state.compliance?.network_iso;
  const orchest  = state.compute?.orchestration;
  const scaling  = state.compute?.scaling;
  const archP    = state.compute?.arch_pattern;
  const nodeType = state.compute?.compute_node;
  const iac      = state.cicd?.iac;
  const pipeline = state.cicd?.pipeline;
  const deploy   = state.cicd?.deploy_strategy;
  const envCnt   = state.cicd?.env_count;
  const waf      = state.edge?.waf;
  const cdn      = state.edge?.cdn;
  const dns      = state.edge?.dns;
  const commit   = state.cost?.commitment;
  const spot     = state.cost?.spot_usage;
  const priority = state.cost?.priority;
  const cache    = state.data?.cache;
  const region   = state.slo?.region;
  const monitor  = state.platform?.k8s_monitoring;
  const gitops   = state.platform?.gitops;
  const secrets  = state.platform?.k8s_secrets;
  const podSec   = state.platform?.pod_security;
  const backup   = state.platform?.k8s_backup;
  const account  = state.network?.account_structure;
  const natStrat = state.network?.nat_strategy;
  const subnet   = state.network?.subnet_tier;
  const auth     = state.integration?.auth || [];
  const authArr  = Array.isArray(auth) ? auth : [auth];
  const hasCritCert = cert.includes("pci") || cert.includes("hipaa") || cert.includes("sox");
  const dataS    = state.workload?.data_sensitivity;

  const isEks = orchest === "eks";
  const isServerless = archP === "serverless";
  const scalingArr = Array.isArray(scaling) ? scaling : (scaling ? [scaling] : []);
  const isTx = state.workload?.business_model === "transaction" || types.includes("ecommerce") || types.includes("ticketing") || types.includes("realtime");
  const dbArr = Array.isArray(state.data?.primary_db) ? state.data.primary_db : (state.data?.primary_db ? [state.data.primary_db] : []);
  const azNum = az === "3az" ? 3 : az === "1az" ? 1 : 2;

  // Workload context for conditional scoring
  const growthStage = state.workload?.growth_stage;
  const isMvp = growthStage === "mvp";
  const userTypes = state.workload?.user_type || [];
  const isInternalOnly = types.length > 0 && types.every((tp: string) => ["internal", "data", "iot"].includes(tp)) && !userTypes.includes("b2c") && !userTypes.includes("global");
  const availTarget = state.slo?.availability;
  const isLowSlo = availTarget && parseFloat(availTarget) <= 99;
  const dau = state.scale?.dau;
  const isLowTraffic = isInternalOnly && (dau === "tiny" || dau === "small");

  // ── Operational Excellence ─────────────────────────────
  const opsItems: WafrItem[] = [
    I(t.ops_iac_q, 20,
      iac && iac !== "none" ? 20 : 0,
      t.ops_iac_rec),
    I(t.ops_cicd_q, 20,
      pipeline && pipeline !== "none" ? 20 : 0,
      t.ops_cicd_rec),
    I(t.ops_deploy_q, 12,
      deploy === "canary" || deploy === "bluegreen" ? 12 : deploy === "rolling" ? 6 : 0,
      t.ops_deploy_rec),
    I(t.ops_env_q, 15,
      envCnt === "three" || envCnt === "four" ? 15 : envCnt === "dev_prod" ? 8 : 0,
      t.ops_env_rec),
    ...(isEks ? [
      I(t.ops_k8s_monitor_q, 15,
        monitor === "hybrid" ? 15 : monitor === "prometheus_grafana" ? 13 : monitor === "cloudwatch" ? 10 : 5,
        t.ops_k8s_monitor_rec),
      I(t.ops_gitops_q, 10,
        gitops === "argocd" || gitops === "flux" ? 10 : 0,
        t.ops_gitops_rec),
    ] : [
      I(t.ops_cw_monitor, 12, 12),
      I(t.ops_cicd_history, 8, 8),
    ]),
    I(t.ops_multi_account_q, 10,
      account !== "single" ? 10 : 0,
      t.ops_multi_account_rec),
    I(t.ops_audit_q, 5,
      hasCritCert || cert.includes("isms") ? 5 : 2,
      t.ops_audit_rec),
  ];

  // ── Security ───────────────────────────────────────────
  const secItems: WafrItem[] = [
    I(t.sec_encrypt_q, 20,
      encr === "strict" ? 20 : encr === "standard" ? 14 : 4,
      encr === "standard"
        ? t.sec_encrypt_rec_standard
        : t.sec_encrypt_rec_other),
    I(t.sec_netiso_q, 18,
      netIso === "strict" ? 18 : netIso === "private" ? 14 : 6,
      t.sec_netiso_rec),
    // Skip WAF scoring for internal-only/data workloads with no WAF
    ...(isInternalOnly && (!waf || waf === "no") ? [] : [
      I(t.sec_waf_q, 16,
        waf === "shield" ? 16 : waf === "bot" ? 14 : waf === "basic" ? 10 : 0,
        waf === "basic"
          ? t.sec_waf_rec_basic
          : t.sec_waf_rec_other),
    ]),
    I(t.sec_auth_q, 12,
      authArr.includes("sso") ? 12 : authArr.includes("cognito") ? 10 : authArr.includes("selfmgd") ? 8 : 3,
      t.sec_auth_rec),
    ...(isEks ? [
      I(t.sec_k8s_secrets_q, 8,
        secrets === "secrets_csi" || secrets === "external_secrets" ? 8 : secrets === "native" ? 4 : 2,
        secrets === "native"
          ? t.sec_k8s_secrets_rec_native
          : t.sec_k8s_secrets_rec_other),
      I(t.sec_pod_sec_q, 6,
        (podSec === "kyverno" || podSec === "opa_gatekeeper") ? 6 : podSec === "psa" ? 4 : 1,
        podSec === "psa"
          ? t.sec_pod_sec_rec_psa
          : t.sec_pod_sec_rec_other),
    ] : [
      I(t.sec_sm_ssm, 7, 7),
      I(t.sec_task_role, 5, 5),
    ]),
    I(t.sec_iam_boundary_q, 5,
      account !== "single" ? 5 : 0,
      t.sec_iam_boundary_rec),
    I(t.sec_data_sens_q, 7,
      dataS === "critical" ? 7 : dataS === "sensitive" ? 5 : 0,
      t.sec_data_sens_rec),
    I(t.sec_subnet_q, 5,
      subnet === "3tier" ? 5 : (subnet === "private" || subnet === "2tier") ? 3 : 0,
      t.sec_subnet_rec),
    I(t.sec_compliance_q, 5,
      hasCritCert ? 5 : (dataS && ["sensitive", "critical"].includes(dataS)) ? 3 : 0,
      t.sec_compliance_rec),
  ];

  // ── Reliability ────────────────────────────────────────
  const relItems: WafrItem[] = [
    I(t.rel_az_q, 18,
      azNum >= 3 ? 18 : azNum === 2 ? 12 : isLowSlo ? 5 : 2,
      azNum === 2
        ? t.rel_az_rec_2
        : t.rel_az_rec_1),
    I(t.rel_db_ha_q, 18,
      dbHa === "global" ? 18 : dbHa === "multi_az_read" ? 15 : dbHa === "multi_az" ? 12
        : isLowSlo ? 4 : 2,
      dbHa === "multi_az"
        ? t.rel_db_ha_rec_multi_az
        : t.rel_db_ha_rec_other),
    // Skip cache scoring for low-traffic internal workloads
    ...(isLowTraffic && (!cache || cache === "no") ? [] : [
      I(t.rel_cache_q, 8,
        cache && cache !== "no" ? 8 : 0,
        t.rel_cache_rec),
    ]),
    I(t.rel_region_q, 18,
      region === "active" ? 18 : region === "dr" ? 12 : 5,
      t.rel_region_rec),
    ...(isEks ? [
      I(t.rel_k8s_backup_q, 8,
        backup === "velero" ? 8 : 0,
        t.rel_k8s_backup_rec),
    ] : [
      I(t.rel_aws_backup, 6, 6),
    ]),
    ...(dbArr.includes("dynamodb")
      ? [I(t.rel_dynamodb_repl, 5, 5)]
      : []),
    // Skip DNS failover scoring for internal-only workloads
    ...(isInternalOnly && dns !== "health" && dns !== "latency" ? [] : [
      I(t.rel_dns_failover_q, 8,
        dns === "health" || dns === "latency" ? 8 : 0,
        t.rel_dns_failover_rec),
    ]),
    I(t.rel_autoscale_q, 8,
      (scalingArr.length > 0 && !scalingArr.every((s: string) => s === "manual")) || isServerless ? 8 : 0,
      t.rel_autoscale_rec),
    ...(isEks ? [
      I(t.rel_k8s_monitor_q, 7,
        monitor === "hybrid" ? 7 : monitor === "prometheus_grafana" ? 6 : monitor === "cloudwatch" ? 5 : 2,
        t.rel_k8s_monitor_rec),
    ] : [
      I(t.rel_cw_alarm, 6, 6),
    ]),
    I(t.rel_deploy_rollback_q, 5,
      deploy === "bluegreen" || deploy === "canary" ? 5 : 0,
      t.rel_deploy_rollback_rec),
  ];

  // ── Performance Efficiency ─────────────────────────────
  const perfItems: WafrItem[] = [
    I(t.perf_arch_q, 18,
      isServerless ? 18 : archP === "container" || archP === "hybrid" ? 14 : archP === "vm" ? 4 : 0,
      t.perf_arch_rec),
    I(t.perf_orch_q, 8,
      isEks ? 8 : orchest === "ecs" ? 6 : isServerless ? 6 : 0,
      t.perf_orch_rec),
    I(t.perf_scale_q, 12,
      scalingArr.includes("keda") ? 12
        : scalingArr.includes("scheduled") ? 10
        : scalingArr.includes("ecs_asg") ? 8
        : isServerless ? 10 : 0,
      t.perf_scale_rec),
    // Skip cache scoring for low-traffic internal workloads
    ...(isLowTraffic && (!cache || cache === "no") ? [] : [
      I(t.perf_cache_q, 15,
        cache && cache !== "no" ? 15 : 0,
        t.perf_cache_rec),
    ]),
    // Skip CDN scoring for internal-only/data workloads
    ...(isInternalOnly ? [] : [
      I(t.perf_cdn_q, 15,
        cdn && cdn !== "no" ? 15 : 0,
        t.perf_cdn_rec),
    ]),
    I(t.perf_node_q, 8,
      nodeType === "ec2_node" ? 8 : nodeType === "mixed" ? 6 : nodeType === "fargate" ? 4 : isServerless ? 4 : 0,
      t.perf_node_rec),
    // Skip DNS latency scoring for internal-only workloads
    ...(isInternalOnly && dns !== "latency" && dns !== "geoloc" ? [] : [
      I(t.perf_dns_q, 8,
        dns === "latency" ? 8 : dns === "geoloc" ? 6 : dns === "health" ? 4 : 0,
        t.perf_dns_rec),
    ]),
    I(t.perf_graviton_q, 5,
      (nodeType === "ec2_node" || nodeType === "mixed") ? 5 : isServerless ? 5 : nodeType === "fargate" ? 4 : 0,
      t.perf_graviton_rec),
  ];

  // ── Cost Optimization ──────────────────────────────────
  const costItems: WafrItem[] = [
    I(t.cost_strategy_q, 15,
      priority === "cost_first" ? 15 : priority === "balanced" ? 12 : 8,
      t.cost_strategy_rec),
    I(t.cost_commit_q, 22,
      commit === "3yr" ? 22 : commit === "1yr" ? 18 : isMvp ? 8 : 5,
      commit === "1yr"
        ? t.cost_commit_rec_1yr
        : t.cost_commit_rec_other),
    I(t.cost_spot_q, 18,
      spot === "heavy" ? (isTx ? 4 : 18) : spot === "partial" ? 14 : (isMvp || isTx) ? 8 : 4,
      spot === "heavy" && isTx
        ? t.cost_spot_rec_heavy_tx
        : spot === "partial"
          ? t.cost_spot_rec_partial
          : t.cost_spot_rec_other),
    ...(subnet === "private" ? [] : [I(t.cost_nat_q, 12,
      natStrat === "endpoint" ? 12 : natStrat === "shared" ? 8 : 4,
      natStrat === "shared"
        ? t.cost_nat_rec_shared
        : t.cost_nat_rec_other)]),
    I(t.cost_serverless_q, 10,
      isServerless ? 10 : nodeType === "fargate" ? 8 : (nodeType === "ec2_node" && commit) ? 6 : nodeType === "mixed" ? 5 : nodeType === "ec2_node" ? 2 : 0,
      t.cost_serverless_rec),
    I(t.cost_account_q, 8,
      account === "org" ? 8 : account === "envs" ? 6 : 3,
      account === "envs"
        ? t.cost_account_rec_envs
        : t.cost_account_rec_other),
  ];

  // ── Sustainability ─────────────────────────────────────
  const susItems: WafrItem[] = [
    I(t.sus_idle_q, 22,
      isServerless ? 22 : archP === "container" || archP === "hybrid" ? (cache && cache !== "no" ? 20 : 15) : archP === "vm" ? 5 : 0,
      archP === "container" && !(cache && cache !== "no")
        ? t.sus_idle_rec_container
        : t.sus_idle_rec_other),
    // Skip Spot scoring for serverless (no instances to Spot)
    ...(isServerless ? [] : [
      I(t.sus_spot_q, 18,
        (spot === "heavy" || spot === "partial") ? 18 : 0,
        t.sus_spot_rec),
    ]),
    // Skip CDN scoring for internal-only/data workloads
    ...(isInternalOnly ? [] : [
      I(t.sus_cdn_q, 12,
        cdn && cdn !== "no" ? 12 : 0,
        t.sus_cdn_rec),
    ]),
    ...(subnet === "private" ? [] : [I(t.sus_endpoint_q, 8,
      natStrat === "endpoint" ? 8 : natStrat === "shared" ? 4 : natStrat === "per_az" ? 3 : 0,
      t.sus_endpoint_rec)]),
    I(t.sus_autoscale_q, 12,
      scalingArr.includes("keda") || scalingArr.includes("scheduled") ? 12
        : scalingArr.includes("ecs_asg") ? 10
        : isServerless ? 12 : 0,
      t.sus_autoscale_rec),
    I(t.sus_graviton_q, 12,
      isServerless ? 12 : (nodeType === "ec2_node" || nodeType === "mixed") ? 10 : nodeType === "fargate" ? 8 : 4,
      t.sus_graviton_rec),
    I(t.sus_log_q, 6,
      (natStrat === "endpoint" || isServerless) ? 6 : 3,
      t.sus_log_rec),
  ];

  // ── Result composition ─────────────────────────────────
  const P = (items: WafrItem[]) => ({ items, score: pillarScore(items) });
  const pillars: Record<string, { items: WafrItem[]; score: number }> = {
    ops: P(opsItems),
    sec: P(secItems),
    rel: P(relItems),
    perf: P(perfItems),
    cost: P(costItems),
    sus: P(susItems),
  };

  const overall = Math.round(Object.values(pillars).reduce((s, p) => s + p.score, 0) / 6);
  return { overall, pillars };
}
