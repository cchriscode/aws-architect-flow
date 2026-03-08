/* eslint-disable @typescript-eslint/no-explicit-any */
import type { WizardState, CostEstimate, CostCategory } from "@/lib/types";

const dict = {
  ko: {
    // Category names
    compute: "컴퓨팅",
    database: "데이터베이스",
    network: "네트워크",
    edge: "엣지",
    storage: "스토리지",
    messaging: "메시징",
    operations: "운영",
    multiRegion: "멀티리전",

    // Compute items
    eksCluster: "EKS 클러스터",
    eksClusterDesc: (azNum: number) => `Control Plane $73/월 + Graviton 노드 ${azNum}AZ`,
    karpenter: "Karpenter 노드 동적 프로비저닝",
    karpenterDesc: "Spot 혼합으로 최대 70% 절감",
    argocd: "ArgoCD (EC2)",
    argocdDesc: "t3.medium 1대",
    ecsFargate: "ECS Fargate (ARM64)",
    ecsFargateDesc: (azNum: number) => `${azNum}AZ, CPU/메모리 기준`,
    lambda: "Lambda 함수",
    lambdaDesc: "1M+ 요청/월 기준 (첫 1M 무료)",
    apiGateway: "API Gateway",
    apiGatewayDesc: "HTTP API 기준",
    alb: "ALB (Application Load Balancer)",
    albDesc: "LCU 기준",

    // Database items
    auroraServerless: "Aurora Serverless v2",
    auroraServerlessDesc: (maxAcu: number) => `min 0.5 ~ max ${maxAcu} ACU`,
    auroraReadReplica: "Aurora Read Replica",
    auroraReadReplicaDesc: "읽기 분산용 리더 인스턴스",
    auroraStorage: "Aurora 스토리지 + I/O",
    auroraStorageDesc: "Aurora I/O-Optimized 기준",
    rdsInstance: "RDS 인스턴스",
    dynamodb: "DynamoDB (On-Demand)",
    dynamodbDesc: "읽기/쓰기 요청 건당 과금",
    elasticache: "ElastiCache Valkey/Redis",
    elasticacheDesc: (azNum: number) => `${azNum}AZ Replication Group`,
    opensearch: "OpenSearch",
    opensearchDesc: (azNum: number) => `r6g.large × ${azNum}`,
    rdsProxy: "RDS Proxy",
    rdsProxyDesc: "Lambda→RDS 커넥션 풀링 (DB 비용의 ~15%)",

    // Network items
    natGateway: (count: number) => `NAT Gateway (${count}개)`,
    natGatewayDesc: "$0.059/시간 + 데이터 처리 비용",
    dataTransfer: "데이터 전송 (outbound)",
    dataTransferDesc: "인터넷 아웃바운드 첫 1GB 무료",
    vpn: "Site-to-Site VPN",
    vpnDesc: "$0.05/시간 (2 터널 포함) + 데이터 전송 $0.09/GB",
    directConnect: "Direct Connect (1Gbps)",
    directConnectDesc: "포트 $0.30/시간(1Gbps) + 아웃바운드 $0.02-0.09/GB",
    vpcEndpoints: "VPC Interface Endpoints",
    vpcEndpointsDesc: "Interface Endpoint 4개 ($7/개/월)",

    // Edge items
    cloudfront: "CloudFront",
    cloudfrontDesc: "데이터 전송 + 요청 건당",
    wafAcl: "WAF Web ACL",
    wafAclDesc: "$5/월 + 규칙/요청 비용",
    botControl: "Bot Control",
    botControlDesc: "$10/월 + $1/1M 요청",
    shieldAdvanced: "Shield Advanced",
    shieldAdvancedDesc: "고정 $3,000/월 (DRT 포함)",

    // Storage items
    s3: "S3 (Standard + Intelligent-Tiering)",
    s3Desc: "저장 + 요청 + 데이터 전송",
    efs: "EFS",
    efsDesc: "Standard $0.30/GB/월, One Zone $0.16/GB/월",

    // Messaging items
    sqs: "SQS",
    sqsDesc: "첫 1M 무료, 이후 $0.4/1M",
    kinesis: "Kinesis Data Streams",
    kinesisDesc: "샤드 시간 + 데이터 처리",
    eventbridge: "EventBridge",
    eventbridgeDesc: "이벤트 건당 $1/1M",

    // Operations items
    cloudwatch: "CloudWatch (로그+메트릭+알람)",
    cloudwatchDesc: "기본 포함, 상세 모니터링 추가",
    prometheus: "Amazon Managed Prometheus + Grafana",
    prometheusDesc: "메트릭 수집 + 대시보드",
    securityHub: "Security Hub + GuardDuty + Config",
    securityHubDesc: "규정 준수 / 민감 데이터 모니터링",
    cloudtrail: "CloudTrail (S3 저장)",
    cloudtrailDesc: "이벤트 기록 + 쿼리",
    kms: "KMS CMK (서비스별)",
    kmsDesc: "키 사용 건당 + 월 $1/키",
    controlTower: "Control Tower + AWS Config (조직)",
    controlTowerDesc: "전체 계정 감사",

    // Multi-Region items
    replicaRegion: "복제 리전 인프라",
    replicaRegionDesc: "DR 리전 기본 인프라 비용",
    route53Global: "Route53 헬스체크 + 글로벌 가속",
    route53GlobalDesc: "헬스체크 + GlobalAccelerator",
  },
  en: {
    // Category names
    compute: "Compute",
    database: "Database",
    network: "Network",
    edge: "Edge",
    storage: "Storage",
    messaging: "Messaging",
    operations: "Operations",
    multiRegion: "Multi-Region",

    // Compute items
    eksCluster: "EKS Cluster",
    eksClusterDesc: (azNum: number) => `Control Plane $73/mo + Graviton nodes ${azNum}AZ`,
    karpenter: "Karpenter Dynamic Node Provisioning",
    karpenterDesc: "Up to 70% savings with Spot mix",
    argocd: "ArgoCD (EC2)",
    argocdDesc: "1x t3.medium instance",
    ecsFargate: "ECS Fargate (ARM64)",
    ecsFargateDesc: (azNum: number) => `${azNum}AZ, CPU/memory based`,
    lambda: "Lambda Functions",
    lambdaDesc: "Based on 1M+ requests/mo (first 1M free)",
    apiGateway: "API Gateway",
    apiGatewayDesc: "Based on HTTP API",
    alb: "ALB (Application Load Balancer)",
    albDesc: "Based on LCU",

    // Database items
    auroraServerless: "Aurora Serverless v2",
    auroraServerlessDesc: (maxAcu: number) => `min 0.5 ~ max ${maxAcu} ACU`,
    auroraReadReplica: "Aurora Read Replica",
    auroraReadReplicaDesc: "Reader instance for read distribution",
    auroraStorage: "Aurora Storage + I/O",
    auroraStorageDesc: "Based on Aurora I/O-Optimized",
    rdsInstance: "RDS Instance",
    dynamodb: "DynamoDB (On-Demand)",
    dynamodbDesc: "Billed per read/write request",
    elasticache: "ElastiCache Valkey/Redis",
    elasticacheDesc: (azNum: number) => `${azNum}AZ Replication Group`,
    opensearch: "OpenSearch",
    opensearchDesc: (azNum: number) => `r6g.large × ${azNum}`,
    rdsProxy: "RDS Proxy",
    rdsProxyDesc: "Lambda-to-RDS connection pooling (~15% of DB cost)",

    // Network items
    natGateway: (count: number) => `NAT Gateway (${count})`,
    natGatewayDesc: "$0.059/hr + data processing charges",
    dataTransfer: "Data Transfer (outbound)",
    dataTransferDesc: "Internet outbound, first 1GB free",
    vpn: "Site-to-Site VPN",
    vpnDesc: "$0.05/hr per connection (incl. 2 tunnels) + data transfer $0.09/GB",
    directConnect: "Direct Connect (1Gbps)",
    directConnectDesc: "Port $0.30/hr (1Gbps) + outbound $0.02-0.09/GB",
    vpcEndpoints: "VPC Interface Endpoints",
    vpcEndpointsDesc: "4 Interface Endpoints ($7/each/mo)",

    // Edge items
    cloudfront: "CloudFront",
    cloudfrontDesc: "Data transfer + per-request charges",
    wafAcl: "WAF Web ACL",
    wafAclDesc: "$5/mo + rule/request charges",
    botControl: "Bot Control",
    botControlDesc: "$10/mo + $1/1M requests",
    shieldAdvanced: "Shield Advanced",
    shieldAdvancedDesc: "Fixed $3,000/mo (includes DDoS Response Team (DRT))",

    // Storage items
    s3: "S3 (Standard + Intelligent-Tiering)",
    s3Desc: "Storage + requests + data transfer",
    efs: "EFS",
    efsDesc: "Standard $0.30/GB/mo, One Zone $0.16/GB/mo",

    // Messaging items
    sqs: "SQS",
    sqsDesc: "First 1M free, then $0.4/1M",
    kinesis: "Kinesis Data Streams",
    kinesisDesc: "Shard hours + data processing",
    eventbridge: "EventBridge",
    eventbridgeDesc: "$1/1M events",

    // Operations items
    cloudwatch: "CloudWatch (Logs + Metrics + Alarms)",
    cloudwatchDesc: "Included by default, detailed monitoring extra",
    prometheus: "Amazon Managed Prometheus + Grafana",
    prometheusDesc: "Metrics collection + dashboards",
    securityHub: "Security Hub + GuardDuty + Config",
    securityHubDesc: "Compliance / sensitive data monitoring",
    cloudtrail: "CloudTrail (S3 storage)",
    cloudtrailDesc: "Event logging + queries",
    kms: "KMS CMK (per service)",
    kmsDesc: "Per key usage + $1/key/mo",
    controlTower: "Control Tower + AWS Config (Organization)",
    controlTowerDesc: "Full account auditing",

    // Multi-Region items
    replicaRegion: "Replica Region Infrastructure",
    replicaRegionDesc: "DR region base infrastructure cost",
    route53Global: "Route53 Health Checks + Global Accelerator",
    route53GlobalDesc: "Health checks + GlobalAccelerator",
  },
} as const;

type Lang = "ko" | "en";
type Dict = (typeof dict)[Lang];

export function estimateMonthlyCost(state: WizardState, lang: Lang = "ko"): CostEstimate {
  const t = dict[lang];

  const orchest  = state.compute?.orchestration;
  const archP    = state.compute?.arch_pattern;
  const nodeType = state.compute?.compute_node;
  const db       = state.data?.primary_db || [];
  const dbArr    = Array.isArray(db) ? db : (db && db !== "none" ? [db] : []);
  const dbHa     = state.data?.db_ha;
  const cache    = state.data?.cache;
  const az       = state.network?.az_count;
  const azNum    = az === "3az" ? 3 : az === "1az" ? 1 : 2;
  const natStrat = state.network?.nat_strategy;
  const hybridRaw = state.network?.hybrid;
  const hybridArr = Array.isArray(hybridRaw) ? hybridRaw : (hybridRaw ? [hybridRaw] : []);
  const waf      = state.edge?.waf;
  const cdn      = state.edge?.cdn;
  const dau      = state.scale?.dau;
  const region   = state.slo?.region;
  const iac      = state.cicd?.iac;
  const commit   = state.cost?.commitment;
  const spot     = state.cost?.spot_usage;
  const priority = state.cost?.priority;
  const encr     = state.compliance?.encryption;
  const cert     = state.compliance?.cert || [];
  const monitor  = state.platform?.k8s_monitoring;
  const account  = state.network?.account_structure;
  const search   = state.data?.search;
  const storArr  = Array.isArray(state.data?.storage) ? state.data.storage : [];
  const types    = state.workload?.type || [];
  const queueRaw = state.integration?.queue_type;
  const queueArr = Array.isArray(queueRaw) ? queueRaw : (queueRaw ? [queueRaw] : []);
  const syncMode = state.integration?.sync_async;
  const nodeP    = state.platform?.node_provisioner;
  const gitops   = state.platform?.gitops;

  const isEks       = orchest === "eks";
  const isEcs       = !isEks && archP !== "serverless";
  const isServerless= archP === "serverless";
  const isLarge     = dau === "large" || dau === "xlarge";
  const isXL        = dau === "xlarge";
  const isMedium    = dau === "medium";
  const hasCritCert = cert.includes("pci") || cert.includes("hipaa") || cert.includes("sox");
  const hasAurora   = dbArr.some((d: string) => d.startsWith("aurora"));
  const hasRds      = dbArr.some((d: string) => d.startsWith("rds"));
  const hasDynamo   = dbArr.includes("dynamodb");
  const hasRedis    = cache === "redis" || cache === "both";

  // Commitment discount rate
  const commitDiscount = commit === "3yr" ? 0.34 : commit === "1yr" ? 0.65 : 1.0;
  const fargateCommitDiscount = commit === "3yr" ? 0.48 : commit === "1yr" ? 0.78 : 1.0;
  const spotDiscount   = spot === "heavy" ? 0.30 : spot === "partial" ? 0.70 : 1.0;

  // Scale coefficient by DAU
  const scale = dau === "xlarge" ? 8 : dau === "large" ? 4 : dau === "medium" ? 2 : dau === "small" ? 1 : 0.5;

  const categories: CostCategory[] = [];
  const I = (cat: string, name: string, desc: string, min: number, max: number) => {
    const existing = categories.find(c => c.name === cat);
    const item = { name, desc, min: Math.round(min), max: Math.round(max) };
    if (existing) {
      existing.items.push(item);
    } else {
      categories.push({ name: cat, total: { min: 0, max: 0 }, items: [item] });
    }
  };

  // -- Compute
  if (isEks) {
    const nodeBase = isXL ? 800 : isLarge ? 400 : 180;
    const nodeMin  = Math.round(nodeBase * Math.min(commitDiscount, spot !== "no" ? spotDiscount : 1));
    const nodeMax  = Math.round(nodeBase * 1.4 * commitDiscount);
    I(t.compute, t.eksCluster, t.eksClusterDesc(azNum), 73 + nodeMin, 73 + nodeMax);
    if (nodeP === "karpenter") {
      I(t.compute, t.karpenter, t.karpenterDesc, 0, 0);
    }
    if (gitops === "argocd") I(t.compute, t.argocd, t.argocdDesc, 30, 50);
  } else if (isEcs) {
    const fargateBase = isXL ? 600 : isLarge ? 300 : 120;
    I(t.compute, t.ecsFargate, t.ecsFargateDesc(azNum),
      Math.round(fargateBase * Math.min(fargateCommitDiscount, spot !== "no" ? spotDiscount : 1)),
      Math.round(fargateBase * 1.4 * fargateCommitDiscount));
  } else if (isServerless) {
    const lambdaBase = isXL ? 150 : isLarge ? 60 : 15;
    I(t.compute, t.lambda, t.lambdaDesc, 0, lambdaBase);
    I(t.compute, t.apiGateway, t.apiGatewayDesc, isXL ? 50 : isLarge ? 20 : 5, isXL ? 150 : isLarge ? 60 : 20);
  }
  if (!isServerless) {
    I(t.compute, t.alb, t.albDesc, isXL ? 150 : isLarge ? 60 : 20, isXL ? 400 : isLarge ? 150 : 50);
  }

  // -- Database
  if (hasAurora) {
    const auroraBase = isXL ? 800 : isLarge ? 400 : isMedium ? 200 : isServerless ? 30 : 120;
    const maxAcu = isXL ? 128 : isLarge ? 64 : 8;
    I(t.database, t.auroraServerless, t.auroraServerlessDesc(maxAcu),
      Math.round(auroraBase * 0.6 * commitDiscount), Math.round(auroraBase * commitDiscount));
    if (dbHa === "multi_az_read" || dbHa === "global") {
      I(t.database, t.auroraReadReplica, t.auroraReadReplicaDesc,
        Math.round(auroraBase * 0.8 * commitDiscount), Math.round(auroraBase * 1.0 * commitDiscount));
    }
    I(t.database, t.auroraStorage, t.auroraStorageDesc, isXL ? 200 : isLarge ? 80 : 20, isXL ? 600 : isLarge ? 200 : 60);
  }
  if (hasRds) {
    const rdsBase = isXL ? 700 : isLarge ? 350 : isMedium ? 180 : 100;
    const rdsMaFactor = dbHa !== "single_az" ? 2.0 : 1.0;
    I(t.database, t.rdsInstance, `${dbHa !== "single_az" ? "Multi-AZ" : "Single-AZ"}`,
      Math.round(rdsBase * rdsMaFactor * commitDiscount), Math.round(rdsBase * rdsMaFactor * 1.2 * commitDiscount));
  }
  if (hasDynamo) {
    I(t.database, t.dynamodb, t.dynamodbDesc, isXL ? 200 : isLarge ? 80 : 10, isXL ? 800 : isLarge ? 300 : 40);
  }
  if (hasRedis) {
    const redisBase = isXL ? 400 : isLarge ? 200 : isMedium ? 120 : 80;
    I(t.database, t.elasticache, t.elasticacheDesc(azNum),
      Math.round(redisBase * commitDiscount), Math.round(redisBase * 1.2 * commitDiscount));
  }
  if (search === "opensearch") {
    I(t.database, t.opensearch, t.opensearchDesc(azNum), isXL ? 800 : isLarge ? 400 : 150, isXL ? 1800 : isLarge ? 800 : 300);
  }
  if (isServerless && (hasAurora || hasRds)) {
    const rdsProxyBase = hasAurora ? (isXL ? 50 : isLarge ? 25 : 8) : (isXL ? 40 : isLarge ? 20 : 6);
    I(t.database, t.rdsProxy, t.rdsProxyDesc, rdsProxyBase, Math.round(rdsProxyBase * 1.5));
  }

  // -- Network
  const natCount = natStrat === "per_az" ? azNum : natStrat === "endpoint" ? 0 : 1;
  if (natCount > 0) {
    I(t.network, t.natGateway(natCount), t.natGatewayDesc,
      natCount * 43, natCount * 43 + (isXL ? 450 : isLarge ? 150 : 45));
  }
  I(t.network, t.dataTransfer, t.dataTransferDesc, isXL ? 80 : isLarge ? 30 : 5, isXL ? 300 : isLarge ? 100 : 20);
  if (hybridArr.includes("vpn")) I(t.network, t.vpn, t.vpnDesc, 36, 72 + (isXL ? 90 : isLarge ? 45 : 10));
  if (hybridArr.includes("dx")) I(t.network, t.directConnect, t.directConnectDesc, 180, 400);
  if (encr === "strict" || hasCritCert) {
    I(t.network, t.vpcEndpoints, t.vpcEndpointsDesc, 28, 40);
  }

  // -- Edge
  if (cdn !== "no") {
    I(t.edge, t.cloudfront, t.cloudfrontDesc, isXL ? 100 : isLarge ? 40 : 5, isXL ? 500 : isLarge ? 150 : 30);
  }
  if (waf === "basic" || waf === "bot") {
    I(t.edge, t.wafAcl, t.wafAclDesc, 20, isXL ? 150 : isLarge ? 80 : 30);
  }
  if (waf === "bot") {
    I(t.edge, t.botControl, t.botControlDesc, 10, isXL ? 100 : isLarge ? 50 : 20);
  }
  if (waf === "shield") {
    I(t.edge, t.shieldAdvanced, t.shieldAdvancedDesc, 3000, 3000);
  }

  // -- Storage
  if (storArr.includes("s3")) {
    I(t.storage, t.s3, t.s3Desc, isXL ? 50 : isLarge ? 20 : 5, isXL ? 300 : isLarge ? 80 : 20);
  }
  if (storArr.includes("efs")) {
    I(t.storage, t.efs, t.efsDesc, isXL ? 150 : isLarge ? 60 : 15, isXL ? 500 : isLarge ? 200 : 50);
  }

  // -- Messaging
  if (queueArr.includes("sqs") || (syncMode !== "sync_only")) {
    I(t.messaging, t.sqs, t.sqsDesc, 0, isXL ? 50 : isLarge ? 20 : 5);
  }
  if (queueArr.includes("kinesis")) {
    I(t.messaging, t.kinesis, t.kinesisDesc, isXL ? 200 : isLarge ? 80 : 20, isXL ? 600 : isLarge ? 250 : 60);
  }
  if (queueArr.includes("eventbridge")) {
    I(t.messaging, t.eventbridge, t.eventbridgeDesc, 0, isXL ? 30 : 10);
  }

  // -- Operations / Security
  I(t.operations, t.cloudwatch, t.cloudwatchDesc, isXL ? 50 : isLarge ? 25 : 10, isXL ? 200 : isLarge ? 80 : 30);
  if (isEks && (monitor === "prometheus_grafana" || monitor === "hybrid")) {
    I(t.operations, t.prometheus, t.prometheusDesc, isXL ? 100 : 40, isXL ? 300 : 100);
  }
  const hasPersonalData = ["sensitive","critical"].includes(state.workload?.data_sensitivity);
  if (hasCritCert || hasPersonalData) {
    I(t.operations, t.securityHub, t.securityHubDesc, 80, 200);
    I(t.operations, t.cloudtrail, t.cloudtrailDesc, 20, 60);
  }
  if (encr === "strict") {
    I(t.operations, t.kms, t.kmsDesc, 10, 30);
  }
  if (account === "org") {
    I(t.operations, t.controlTower, t.controlTowerDesc, 30, 80);
  }

  // -- Multi-Region
  if (region === "active" || region === "dr") {
    I(t.multiRegion, t.replicaRegion, t.replicaRegionDesc, isXL ? 800 : isLarge ? 400 : 150, isXL ? 2000 : isLarge ? 1000 : 400);
    I(t.multiRegion, t.route53Global, t.route53GlobalDesc, 35, 100);
  }

  // Total calculation
  let totalMin = 0;
  let totalMax = 0;
  categories.forEach(cat => {
    cat.total = { min: 0, max: 0 };
    cat.items.forEach(item => {
      cat.total.min += item.min;
      cat.total.max += item.max;
      totalMin += item.min;
      totalMax += item.max;
    });
  });

  return {
    categories,
    totalMin,
    totalMax,
    totalMid: Math.round((totalMin + totalMax) / 2),
    hasCommit: !!(commit && commit !== "none"),
    hasSpot: !!(spot && spot !== "no"),
  };
}
