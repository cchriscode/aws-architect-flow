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

export function wellArchitectedScore(state: WizardState): WafrResult {
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
  const isTx = types.includes("ecommerce") || types.includes("ticketing") || types.includes("realtime");
  const dbArr = Array.isArray(state.data?.primary_db) ? state.data.primary_db : (state.data?.primary_db ? [state.data.primary_db] : []);
  const azNum = az === "3az" ? 3 : az === "1az" ? 1 : 2;

  // ── 운영 우수성 ──────────────────────────────────
  const opsItems: WafrItem[] = [
    I("인프라가 코드(IaC)로 정의되어 있습니까?", 20,
      iac && iac !== "none" ? 20 : 0,
      "IaC(Terraform/CDK)로 인프라를 코드화하면 재현성과 감사성이 크게 향상됩니다"),
    I("CI/CD 파이프라인이 자동화되어 있습니까?", 20,
      pipeline && pipeline !== "none" ? 20 : 0,
      "CI/CD 파이프라인 없이 수동 배포는 운영 사고의 주요 원인입니다"),
    I("안전한 배포 전략(Blue/Green, Canary)을 사용합니까?", 12,
      deploy === "canary" || deploy === "bluegreen" ? 12 : deploy === "rolling" ? 6 : 0,
      "Blue/Green 또는 Canary 배포로 롤백 능력을 강화하세요"),
    I("충분한 환경 분리(Dev/Stage/Prod)가 되어 있습니까?", 15,
      envCnt === "three" || envCnt === "four" ? 15 : envCnt === "dev_prod" ? 8 : 0,
      "Stage 환경 추가로 프로덕션 배포 전 검증하세요"),
    ...(isEks ? [
      I("K8s 모니터링(Prometheus/CloudWatch)이 설정되어 있습니까?", 15,
        monitor === "prometheus_grafana" || monitor === "hybrid" ? 15 : monitor === "cloudwatch" ? 10 : 5,
        "Prometheus + Grafana로 K8s 메트릭 가시성을 높이세요"),
      I("GitOps로 배포 이력과 드리프트를 관리합니까?", 10,
        gitops === "argocd" || gitops === "flux" ? 10 : 0,
        "GitOps(ArgoCD/Flux)로 배포 이력 관리와 드리프트 감지를 자동화하세요"),
    ] : [
      I("CloudWatch 모니터링이 기본 제공됩니다", 12, 12),
      I("CI/CD 파이프라인이 배포 이력을 관리합니다", 8, 8),
    ]),
    I("멀티 계정으로 환경이 분리되어 있습니까?", 10,
      account !== "single" ? 10 : 0,
      "멀티 계정 분리로 환경별 변경 영향을 격리하세요"),
    I("감사 이력(CloudTrail) 체계가 갖춰져 있습니까?", 5,
      hasCritCert || cert.includes("isms") ? 5 : 0,
      "CloudTrail 전 리전 활성화로 API 호출 감사 이력을 확보하세요"),
  ];

  // ── 보안 ─────────────────────────────────────────
  const secItems: WafrItem[] = [
    I("저장 데이터 암호화(KMS)가 적용되어 있습니까?", 20,
      encr === "strict" ? 20 : encr === "standard" ? 14 : 4,
      encr === "standard"
        ? "CMK + CloudTrail 키 감사로 암호화 수준을 높이세요"
        : "저장 데이터 암호화(KMS)를 즉시 활성화하세요"),
    I("네트워크 계층 격리가 구현되어 있습니까?", 18,
      netIso === "private" ? 18 : netIso === "strict" ? 14 : 6,
      "DB를 퍼블릭에서 분리된 프라이빗 서브넷으로 이동하세요"),
    I("인터넷 노출 서비스에 WAF가 적용되어 있습니까?", 16,
      waf === "shield" ? 16 : waf === "bot" ? 14 : waf === "basic" ? 10 : 0,
      waf === "basic"
        ? "WAF Bot Control 추가로 자동화된 공격을 차단하세요"
        : "WAF 없는 공개 서비스는 SQL 인젝션 등에 무방비 상태입니다"),
    I("인증 서비스가 도입되어 있습니까?", 12,
      authArr.includes("sso") || authArr.includes("selfmgd") ? 12 : authArr.includes("cognito") ? 10 : 3,
      "인증 서비스(Cognito, SSO 등)를 도입하세요"),
    ...(isEks ? [
      I("K8s 시크릿이 Secrets Manager로 관리됩니까?", 8,
        secrets === "secrets_csi" || secrets === "external_secrets" ? 8 : secrets === "native" ? 4 : 2,
        secrets === "native"
          ? "Secrets Manager CSI Driver로 시크릿 자동 교체를 구현하세요"
          : "K8s 시크릿 관리 솔루션을 도입하세요"),
      I("파드 보안 정책이 적용되어 있습니까?", 6,
        podSec && podSec !== "psa" ? 6 : podSec === "psa" ? 3 : 1,
        podSec === "psa"
          ? "Kyverno/OPA 정책으로 특권 컨테이너 실행을 차단하세요"
          : "파드 보안 정책을 설정하세요"),
    ] : [
      I("Secrets Manager/SSM이 기본 통합됩니다", 7, 7),
      I("ECS Task Role/Lambda Role로 격리됩니다", 5, 5),
    ]),
    I("멀티 계정으로 IAM 경계가 분리되어 있습니까?", 5,
      account !== "single" ? 5 : 0,
      "IAM 권한 경계를 계정 수준에서 설정하려면 멀티 계정을 사용하세요"),
    I("데이터 민감도에 맞는 보호 수준입니까?", 7,
      dataS && dataS !== "public" ? 7 : 0,
      "VPC Flow Logs 활성화로 비정상 트래픽 탐지와 포렌식을 준비하세요"),
    I("3계층 서브넷 분리가 구성되어 있습니까?", 5,
      subnet === "3tier" ? 5 : (subnet === "private" || subnet === "2tier") ? 3 : 0,
      "3계층(public/private/isolated) 서브넷 분리로 DB 공격 표면을 최소화하세요"),
    I("보안 컴플라이언스 체계가 적용되어 있습니까?", 5,
      hasCritCert ? 5 : (dataS && ["sensitive", "critical"].includes(dataS)) ? 3 : 0,
      "PCI/HIPAA 등 보안 인증으로 데이터 보호 체계를 강화하세요"),
  ];

  // ── 안정성 ───────────────────────────────────────
  const relItems: WafrItem[] = [
    I("멀티 AZ 배포가 구성되어 있습니까?", 18,
      azNum >= 3 ? 18 : azNum === 2 ? 12 : 3,
      azNum === 2
        ? "3 AZ로 가용성을 99.99%까지 높일 수 있습니다"
        : "단일 AZ는 AZ 장애 시 전체 중단됩니다. Multi-AZ 필수"),
    I("데이터베이스 고가용성이 설정되어 있습니까?", 18,
      dbHa === "global" ? 18 : dbHa === "multi_az_read" ? 15 : dbHa === "multi_az" ? 10 : 3,
      dbHa === "multi_az"
        ? "Read Replica 추가로 읽기 부하 분산과 페일오버 속도를 개선하세요"
        : "DB Single-AZ는 운영 서비스에 절대 권장하지 않습니다"),
    I("캐싱 계층이 존재합니까?", 8,
      cache && cache !== "no" ? 8 : 0,
      "ElastiCache로 DB 장애 시 캐시 우선 서비스 가능하게 하세요"),
    I("멀티 리전 전략이 수립되어 있습니까?", 18,
      region === "active" ? 18 : region === "dr" ? 12 : 5,
      "리전 전체 장애 대비 DR 또는 Active-Active 멀티리전을 검토하세요"),
    ...(isEks ? [
      I("K8s 리소스 백업(Velero)이 설정되어 있습니까?", 8,
        backup === "velero" ? 8 : 0,
        "Velero로 K8s 상태와 PVC를 정기 백업하세요"),
    ] : [
      I("AWS Backup이 기본 통합됩니다", 6, 6),
    ]),
    ...(dbArr.includes("dynamodb")
      ? [I("DynamoDB 기본 3-AZ 복제가 안정성을 강화합니다", 5, 5)]
      : []),
    I("자동 DNS 페일오버(Route53 헬스체크)가 구성되어 있습니까?", 8,
      dns === "health" || dns === "latency" ? 8 : 0,
      "Route53 헬스체크로 장애 시 자동 DNS 전환을 구성하세요"),
    I("Auto Scaling이 설정되어 있습니까?", 8,
      (scalingArr.length > 0 && !scalingArr.every((s: string) => s === "manual")) || isServerless ? 8 : 0,
      "자동 스케일링으로 트래픽 급증 시 자동 대응하세요"),
    ...(isEks ? [
      I("K8s 모니터링으로 장애를 조기 감지합니까?", 7,
        monitor === "prometheus_grafana" || monitor === "hybrid" ? 7 : monitor === "cloudwatch" ? 5 : 2,
        "Prometheus/CloudWatch 알람으로 장애 조기 감지와 자동 대응을 구성하세요"),
    ] : [
      I("CloudWatch 알람으로 장애를 조기 감지합니다", 6, 6),
    ]),
    I("안전한 배포로 즉각 롤백이 가능합니까?", 5,
      deploy === "bluegreen" || deploy === "canary" ? 5 : 0,
      "Blue/Green 또는 Canary 배포로 장애 시 즉각 롤백 능력을 확보하세요"),
  ];

  // ── 성능 효율성 ──────────────────────────────────
  const perfItems: WafrItem[] = [
    I("서버리스 또는 컨테이너 기반 아키텍처입니까?", 18,
      isServerless ? 18 : archP === "container" ? 14 : 0,
      "컨테이너/서버리스 아키텍처로 리소스 효율을 높이세요"),
    I("오케스트레이터(EKS/ECS)로 리소스를 관리합니까?", 8,
      isEks ? 8 : orchest === "ecs" ? 6 : isServerless ? 6 : 0,
      "EKS/ECS 오케스트레이터로 리소스를 효율적으로 관리하세요"),
    I("자동 스케일링이 최적화되어 있습니까?", 12,
      scalingArr.includes("keda") ? 12
        : (scalingArr.includes("scheduled") || scalingArr.includes("hpa")) ? 10
        : scalingArr.includes("ecs_asg") ? 8
        : isServerless ? 10 : 0,
      "자동 스케일링을 구성하면 트래픽 변화에 효율적으로 대응할 수 있습니다"),
    I("캐시를 통해 DB 부하를 줄이고 있습니까?", 15,
      cache && cache !== "no" ? 15 : 0,
      "ElastiCache Redis로 DB 쿼리를 캐시해 응답시간 10배 개선 가능"),
    I("CDN으로 정적 콘텐츠를 캐싱합니까?", 15,
      cdn && cdn !== "no" ? 15 : 0,
      "CloudFront로 정적 파일 응답시간을 50ms 이하로 줄이세요"),
    I("컴퓨팅 노드 타입이 최적화되어 있습니까?", 8,
      nodeType === "ec2_node" ? 8 : nodeType === "mixed" ? 6 : nodeType === "fargate" ? 4 : isServerless ? 4 : 0,
      "워크로드에 맞는 인스턴스 타입으로 성능을 최적화하세요"),
    I("DNS 라우팅이 지연시간 기반으로 최적화되어 있습니까?", 8,
      dns === "latency" ? 8 : dns === "geoloc" ? 6 : dns === "health" ? 4 : 0,
      "Route53 지연시간 기반 라우팅으로 사용자 응답시간을 최적화하세요"),
    I("Graviton(ARM) 인스턴스를 활용합니까?", 5,
      (nodeType === "ec2_node" || nodeType === "mixed") ? 5 : isServerless ? 5 : nodeType === "fargate" ? 4 : 0,
      "Graviton(ARM) 인스턴스로 x86 대비 20~40% 가성비 향상 가능"),
  ];

  // ── 비용 최적화 ──────────────────────────────────
  const costItems: WafrItem[] = [
    I("비용 최적화 전략이 수립되어 있습니까?", 15,
      priority === "cost_first" ? 15 : priority === "balanced" ? 12 : 5,
      "비용 최적화 우선순위를 설정해 예산을 관리하세요"),
    I("약정(Reserved/Savings Plans)을 활용합니까?", 22,
      commit === "3yr" ? 22 : commit === "1yr" ? 18 : 5,
      commit === "1yr"
        ? "3년 약정으로 최대 72% 추가 절감 가능합니다"
        : "안정적 트래픽이면 1년 RI/Savings Plans로 40% 절감을 시작하세요"),
    I("Spot 인스턴스를 활용합니까?", 18,
      spot === "heavy" ? (isTx ? 10 : 18) : spot === "partial" ? 14 : 4,
      spot === "heavy" && isTx
        ? "결제/실시간 서비스에 Heavy Spot은 위험. Stateless 배치만 Spot 적용 권장"
        : spot === "partial"
          ? "배치/데이터 처리에 Spot을 더 적극 활용하면 추가 절감 가능"
          : "중단 허용 워크로드에 Spot 인스턴스로 70% 절감"),
    I("효율적인 NAT 전략이 적용되어 있습니까?", 12,
      natStrat === "endpoint" ? 12 : natStrat === "shared" ? 8 : 4,
      natStrat === "shared"
        ? "S3/DynamoDB Gateway Endpoint로 NAT GW 비용을 줄이세요"
        : "NAT GW 공유 또는 VPC Endpoint 전환으로 비용 절감 가능"),
    I("서버리스/관리형 서비스로 비용 효율화를 합니까?", 10,
      isServerless ? 10 : nodeType === "fargate" ? 6 : (nodeType === "ec2_node" && commit) ? 8 : nodeType === "mixed" ? 5 : 0,
      "서버리스 또는 Fargate로 유휴 리소스 비용을 줄이세요"),
    I("멀티 계정으로 비용 추적 체계를 갖췄습니까?", 8,
      account === "org" ? 8 : account === "envs" ? 6 : 3,
      account === "envs"
        ? "AWS Cost Explorer + 리소스 태그 전략으로 서비스별 비용을 추적하세요"
        : "리소스 태그 전략으로 비용 추적과 최적화 기회를 파악하세요"),
  ];

  // ── 지속가능성 ───────────────────────────────────
  const susItems: WafrItem[] = [
    I("서버리스/컨테이너로 유휴 리소스를 최소화합니까?", 22,
      isServerless ? 22 : archP === "container" ? (cache && cache !== "no" ? 20 : 15) : 0,
      archP === "container" && !(cache && cache !== "no")
        ? "캐시 활용으로 DB 부하를 줄여 컴퓨팅 리소스 효율을 높이세요"
        : "서버리스/컨테이너로 유휴 리소스를 줄이세요"),
    I("Spot 인스턴스로 AWS 유휴 용량을 활용합니까?", 18,
      (spot === "heavy" || spot === "partial") ? 18 : 0,
      "Spot 인스턴스 활용으로 AWS 유휴 용량을 활용해 탄소 효율 개선"),
    I("CDN으로 오리진 서버 부하를 줄입니까?", 12,
      cdn && cdn !== "no" ? 12 : 0,
      "CDN으로 오리진 서버 요청을 줄여 에너지 소비를 낮추세요"),
    I("VPC Endpoint로 네트워크 경로를 최적화합니까?", 8,
      natStrat === "endpoint" ? 8 : natStrat === "shared" ? 4 : 0,
      "VPC Endpoint로 네트워크 트래픽 경로를 최소화하세요"),
    I("자동 스케일링으로 과잉 프로비저닝을 방지합니까?", 12,
      scalingArr.includes("keda") || scalingArr.includes("scheduled") ? 12
        : (scalingArr.includes("ecs_asg") || scalingArr.includes("hpa")) ? 10
        : isServerless ? 12 : 0,
      "자동 스케일링으로 유휴 리소스를 최소화하세요"),
    I("Graviton(ARM) 또는 서버리스로 에너지 효율을 높입니까?", 12,
      (nodeType === "ec2_node" || nodeType === "mixed") ? 12 : isServerless ? 10 : nodeType === "fargate" ? 8 : 4,
      "EC2 Graviton(ARM) 인스턴스로 Intel 대비 60% 에너지 효율 향상"),
    I("로그/스토리지 보존 정책이 최적화되어 있습니까?", 6,
      (natStrat === "endpoint" || isServerless) ? 6 : 3,
      "CloudWatch 로그 보존 기간 최적화 + S3 Glacier 아카이브로 자원 효율 개선"),
  ];

  // ── 결과 조합 ────────────────────────────────────
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
