/* eslint-disable @typescript-eslint/no-explicit-any */
import type { WizardState, CostEstimate, CostCategory } from "@/lib/types";
import { toArray, toArrayFiltered, azToNum } from "@/lib/shared";
import { COMMITMENT_DISCOUNT, FARGATE_COMMITMENT_DISCOUNT, SPOT_DISCOUNT } from "@/lib/shared";

// ── Seoul (ap-northeast-2) region pricing reference ──
// All cost estimates below use Seoul region pricing as default.
// Key rates: NAT GW $0.059/hr ($43/mo), ALB $0.0288/hr ($21/mo),
// NLB $0.0252/hr ($18/mo), t3.medium $0.052/hr, S3 $0.025/GB,
// Aurora ACU $0.12/hr, ECS Fargate vCPU $0.04048/hr.
// Virginia (us-east-1) is typically 10-31% cheaper.

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
    apiGatewayDesc: "HTTP/REST API 기준",
    alb: "ALB (Application Load Balancer)",
    albDesc: "LCU 기준",
    nlb: "NLB (Network Load Balancer)",
    nlbDesc: "NLCU 기준",
    stepFunctions: "Step Functions",
    stepFunctionsDesc: "Standard $25/100만 전환, Express $1/100만",
    awsBatch: "AWS Batch 컴퓨트",
    awsBatchDesc: "Batch 무료, Fargate/EC2 실행 비용",
    ecsScheduled: "ECS Scheduled Task",
    ecsScheduledDesc: "Fargate 실행 시간 기준",

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
    opensearchDesc: (azNum: number) => `${azNum} 노드 클러스터`,
    rdsProxy: "RDS Proxy",
    rdsProxyDesc: "Lambda→RDS 커넥션 풀링 (DB 비용의 ~15%)",
    dax: "DAX (DynamoDB Accelerator)",
    daxDesc: (azNum: number) => `dax.r5.large × ${azNum} 노드`,

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
    msk: "MSK (Managed Kafka)",
    mskDesc: "kafka.m5.large × 3 브로커",

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
    cognito: "Cognito User Pool",
    cognitoDesc: "첫 50K MAU 무료, 이후 $0.0055/MAU",
    iotCore: "IoT Core",
    iotCoreDesc: "디바이스 연결 + 메시지 $1/1M",
    ecr: "ECR (컨테이너 레지스트리)",
    ecrDesc: "$0.10/GB/월 이미지 저장 + 스캔",
    documentdb: "DocumentDB",
    documentdbDesc: "db.r6g.large 클러스터",
    neptune: "Neptune",
    neptuneDesc: "db.r6g.large 그래프 DB",
    timestream: "Timestream",
    timestreamDesc: "서버리스 시계열 DB (쓰기+쿼리)",
    memorydb: "MemoryDB for Redis",
    memorydbDesc: (azNum: number) => `db.r7g.large × ${azNum} 노드`,
    amazonMq: "Amazon MQ",
    amazonMqDesc: "mq.m5.large Active/Standby",
    appRunner: "App Runner",
    appRunnerDesc: "vCPU 시간 + 메모리 기준",
    vpcLattice: "VPC Lattice",
    vpcLatticeDesc: "요청당 + 데이터 전송 과금",
    bedrock: "Amazon Bedrock",
    bedrockDesc: "토큰 기반 과금 (입력+출력)",
    athena: "Athena",
    athenaDesc: "스캔 데이터 $5/TB",
    redshiftServerless: "Redshift Serverless",
    redshiftServerlessDesc: "RPU 시간당 과금, 유휴 시 무과금",
    glue: "AWS Glue",
    glueDesc: "DPU 시간 $0.44/시간",
    quicksight: "QuickSight",
    quicksightDesc: "Author $24/월, Reader $0.30/세션",
    inspector: "Inspector",
    inspectorDesc: "인스턴스당 $0.01/시간",
    macie: "Macie",
    macieDesc: "첫 1GB 무료, 이후 $1/GB",
    datadog: "Datadog (Infrastructure + APM)",
    datadogDesc: "호스트당 ~$23/월 + APM 추가",
    xray: "AWS X-Ray (분산 추적)",
    xrayDesc: "추적 $5/백만 건, 샘플링 설정 권장",
    managedGrafana: "Amazon Managed Grafana",
    managedGrafanaDesc: "에디터 $9/월 + 뷰어 $5/월",

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
    apiGatewayDesc: "HTTP/REST API based",
    alb: "ALB (Application Load Balancer)",
    albDesc: "Based on LCU",
    nlb: "NLB (Network Load Balancer)",
    nlbDesc: "Based on NLCU",
    stepFunctions: "Step Functions",
    stepFunctionsDesc: "Standard $25/1M transitions, Express $1/1M",
    awsBatch: "AWS Batch Compute",
    awsBatchDesc: "Batch free, Fargate/EC2 execution cost only",
    ecsScheduled: "ECS Scheduled Task",
    ecsScheduledDesc: "Based on Fargate execution time",

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
    opensearchDesc: (azNum: number) => `${azNum}-node cluster`,
    rdsProxy: "RDS Proxy",
    rdsProxyDesc: "Lambda-to-RDS connection pooling (~15% of DB cost)",
    dax: "DAX (DynamoDB Accelerator)",
    daxDesc: (azNum: number) => `dax.r5.large × ${azNum} nodes`,

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
    msk: "MSK (Managed Kafka)",
    mskDesc: "kafka.m5.large × 3 brokers",

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
    cognito: "Cognito User Pool",
    cognitoDesc: "First 50K MAU free, then $0.0055/MAU",
    iotCore: "IoT Core",
    iotCoreDesc: "Device connections + messages $1/1M",
    ecr: "ECR (Container Registry)",
    ecrDesc: "$0.10/GB/mo image storage + scanning",
    documentdb: "DocumentDB",
    documentdbDesc: "db.r6g.large cluster",
    neptune: "Neptune",
    neptuneDesc: "db.r6g.large graph DB",
    timestream: "Timestream",
    timestreamDesc: "Serverless time-series DB (writes+queries)",
    memorydb: "MemoryDB for Redis",
    memorydbDesc: (azNum: number) => `db.r7g.large × ${azNum} nodes`,
    amazonMq: "Amazon MQ",
    amazonMqDesc: "mq.m5.large Active/Standby",
    appRunner: "App Runner",
    appRunnerDesc: "vCPU hours + memory based",
    vpcLattice: "VPC Lattice",
    vpcLatticeDesc: "Per-request + data transfer billing",
    bedrock: "Amazon Bedrock",
    bedrockDesc: "Token-based billing (input+output)",
    athena: "Athena",
    athenaDesc: "Scanned data $5/TB",
    redshiftServerless: "Redshift Serverless",
    redshiftServerlessDesc: "Per-RPU hour billing, zero cost when idle",
    glue: "AWS Glue",
    glueDesc: "DPU hour $0.44/hr",
    quicksight: "QuickSight",
    quicksightDesc: "Author $24/mo, Reader $0.30/session",
    inspector: "Inspector",
    inspectorDesc: "$0.01/instance/hr",
    macie: "Macie",
    macieDesc: "First 1GB free, then $1/GB",
    datadog: "Datadog (Infrastructure + APM)",
    datadogDesc: "~$23/host/mo + APM add-on",
    xray: "AWS X-Ray (Distributed Tracing)",
    xrayDesc: "Traces $5/1M, sampling config recommended",
    managedGrafana: "Amazon Managed Grafana",
    managedGrafanaDesc: "Editor $9/mo + Viewer $5/mo",

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
  const dbArr    = toArrayFiltered(state.data?.primary_db);
  const dbHa     = state.data?.db_ha;
  const cache    = state.data?.cache;
  const azNum    = azToNum(state.network?.az_count);
  const natStrat = state.network?.nat_strategy;
  const hybridArr = toArray(state.network?.hybrid);
  const waf      = state.edge?.waf;
  const cdn      = state.edge?.cdn;
  const dau      = state.scale?.dau;
  const region   = state.slo?.region;
  const iac      = state.cicd?.iac;
  const commit   = state.cost?.commitment;
  const spot     = state.cost?.spot_usage;
  const priority = state.cost?.priority;
  const encr     = state.compliance?.encryption;
  const cert     = toArray(state.compliance?.cert);
  const monitor  = state.platform?.k8s_monitoring;
  const account  = state.network?.account_structure;
  const search   = state.data?.search;
  const storArr  = toArray(state.data?.storage);
  const types    = toArray(state.workload?.type);
  const queueArr = toArray(state.integration?.queue_type);
  const syncMode = state.integration?.sync_async;
  const nodeP    = state.platform?.node_provisioner;
  const gitops   = state.platform?.gitops;
  const apiType  = state.integration?.api_type;
  const batchArr = toArray(state.integration?.batch_workflow).filter((v: string) => v !== "none");
  const authArr  = toArray(state.integration?.auth);

  const isEks       = orchest === "eks";
  const isEcs       = !isEks && archP !== "serverless";
  const isServerless= archP === "serverless";
  const isLarge     = dau === "large" || dau === "xlarge";
  const isXL        = dau === "xlarge";
  const isMedium    = dau === "medium";
  const hasCritCert = cert.some((c: string) => ["pci", "hipaa", "sox"].includes(c));
  const hasAurora   = dbArr.some((d: string) => d.startsWith("aurora"));
  const hasRds      = dbArr.some((d: string) => d.startsWith("rds"));
  const hasDynamo   = dbArr.includes("dynamodb");
  const hasRedis    = cache === "redis" || cache === "both";

  // Commitment & spot discount rates
  const commitDiscount = COMMITMENT_DISCOUNT[commit as keyof typeof COMMITMENT_DISCOUNT] ?? 1.0;
  const fargateCommitDiscount = FARGATE_COMMITMENT_DISCOUNT[commit as keyof typeof FARGATE_COMMITMENT_DISCOUNT] ?? 1.0;
  const spotDiscount = SPOT_DISCOUNT[spot as keyof typeof SPOT_DISCOUNT] ?? 1.0;

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
  if (!isServerless && apiType !== "nlb") {
    I(t.compute, t.alb, t.albDesc, isXL ? 150 : isLarge ? 60 : 20, isXL ? 400 : isLarge ? 150 : 50);
  }
  if (apiType === "nlb") {
    I(t.compute, t.nlb, t.nlbDesc, isXL ? 100 : isLarge ? 40 : 15, isXL ? 300 : isLarge ? 100 : 40);
  }
  if (types.includes("iot") && state.workload?.iot_detail === "industrial") {
    const greenDevices = isXL ? 500 : isLarge ? 100 : 20;
    I(t.compute, lang === "ko" ? "IoT Greengrass" : "IoT Greengrass", lang === "ko" ? `코어 디바이스 ${greenDevices}대 기준` : `Based on ${greenDevices} core devices`, Math.round(greenDevices * 0.16), Math.round(greenDevices * 0.16 * 1.5));
  }
  if (types.includes("iot")) {
    const iotDevices = isXL ? 10000 : isLarge ? 1000 : 100;
    I(t.compute, t.iotCore, t.iotCoreDesc, Math.round(iotDevices * 0.001), Math.round(iotDevices * 0.005));
  }
  if (types.includes("data") && state.workload?.data_detail === "ml_pipeline") {
    I(t.compute, "Amazon SageMaker", lang === "ko" ? "ml.m5.xlarge 노트북 + 학습 인스턴스" : "ml.m5.xlarge notebook + training instances", 138, 276);
  }
  if (batchArr.includes("step_functions")) {
    I(t.compute, t.stepFunctions, t.stepFunctionsDesc, isXL ? 50 : isLarge ? 25 : 5, isXL ? 200 : isLarge ? 80 : 20);
  }
  if (batchArr.includes("aws_batch")) {
    const batchBase = isXL ? 300 : isLarge ? 150 : 50;
    I(t.compute, t.awsBatch, t.awsBatchDesc, Math.round(batchBase * Math.min(commitDiscount, spot !== "no" ? spotDiscount : 1)), Math.round(batchBase * commitDiscount));
  }
  if (batchArr.includes("ecs_scheduled")) {
    I(t.compute, t.ecsScheduled, t.ecsScheduledDesc, isXL ? 30 : isLarge ? 15 : 5, isXL ? 100 : isLarge ? 50 : 15);
  }
  // Glue from batch_workflow (skip if already added via data_detail analytics)
  const dataDetail = state.workload?.data_detail;
  const glueAlreadyAdded = types.includes("data") && (dataDetail === "log_analytics" || dataDetail === "bi_dashboard");
  if (batchArr.includes("glue") && !glueAlreadyAdded) {
    I(t.operations, t.glue, t.glueDesc, isXL ? 100 : isLarge ? 40 : 10, isXL ? 400 : isLarge ? 150 : 30);
  }
  if (archP === "app_runner") {
    const arBase = isXL ? 200 : isLarge ? 100 : 30;
    I(t.compute, t.appRunner, t.appRunnerDesc, arBase, Math.round(arBase * 2.5));
  }

  // -- Database
  if (hasAurora) {
    const auroraBase = isXL ? 800 : isLarge ? 400 : isMedium ? 200 : isServerless ? 75 : 120;
    const maxAcu = isXL ? 128 : isLarge ? 64 : 8;
    I(t.database, t.auroraServerless, t.auroraServerlessDesc(maxAcu),
      Math.round(auroraBase * 0.75 * commitDiscount), Math.round(auroraBase * commitDiscount));
    if (dbHa === "multi_az_read" || dbHa === "global") {
      I(t.database, t.auroraReadReplica, t.auroraReadReplicaDesc,
        Math.round(auroraBase * 0.8 * commitDiscount), Math.round(auroraBase * 1.0 * commitDiscount));
    }
    I(t.database, t.auroraStorage, t.auroraStorageDesc, isXL ? 200 : isLarge ? 80 : 20, isXL ? 600 : isLarge ? 200 : 60);
  }
  if (hasRds) {
    const rdsBase = isXL ? 700 : isLarge ? 350 : isMedium ? 180 : 75;
    const rdsMaFactor = dbHa !== "single_az" ? 2.0 : 1.0;
    I(t.database, t.rdsInstance, `${dbHa !== "single_az" ? "Multi-AZ" : "Single-AZ"}`,
      Math.round(rdsBase * rdsMaFactor * commitDiscount), Math.round(rdsBase * rdsMaFactor * 1.2 * commitDiscount));
  }
  if (hasDynamo) {
    I(t.database, t.dynamodb, t.dynamodbDesc, isXL ? 200 : isLarge ? 80 : 10, isXL ? 800 : isLarge ? 300 : 40);
    // On-Demand cost warning for large-scale DynamoDB
    if (isLarge) {
      I(t.database,
        lang === "ko" ? "⚠️ DynamoDB On-Demand 비용 주의" : "⚠️ DynamoDB On-Demand cost warning",
        lang === "ko"
          ? "대규모 트래픽에서 On-Demand는 Provisioned 대비 5-7배 비쌀 수 있습니다. Reserved Capacity 검토를 권장합니다."
          : "At high traffic, On-Demand can cost 5-7x more than Provisioned. Consider Reserved Capacity.",
        0, 0);
    }
  }
  if (hasRedis) {
    const redisPerNode = isXL ? 150 : isLarge ? 80 : isMedium ? 50 : 30;
    I(t.database, t.elasticache, t.elasticacheDesc(azNum),
      Math.round(redisPerNode * azNum * commitDiscount),
      Math.round(redisPerNode * azNum * 1.3 * commitDiscount));
  }
  if (search === "opensearch") {
    const osPerNode = isXL ? 280 : isLarge ? 140 : isMedium ? 60 : 30;
    I(t.database, t.opensearch, t.opensearchDesc(azNum),
      osPerNode * azNum, Math.round(osPerNode * azNum * 2));
  }
  if (isServerless && (hasAurora || hasRds)) {
    const rdsProxyBase = hasAurora ? (isXL ? 50 : isLarge ? 25 : 8) : (isXL ? 40 : isLarge ? 20 : 6);
    I(t.database, t.rdsProxy, t.rdsProxyDesc, rdsProxyBase, Math.round(rdsProxyBase * 1.5));
  }
  if (cache === "dax" || cache === "both") {
    const daxBase = isXL ? 300 : isLarge ? 150 : 80;
    I(t.database, t.dax, t.daxDesc(azNum), Math.round(daxBase * commitDiscount), Math.round(daxBase * 1.2 * commitDiscount));
  }
  if (dbArr.includes("documentdb")) {
    const docdbBase = isXL ? 500 : isLarge ? 250 : 150;
    I(t.database, t.documentdb, t.documentdbDesc,
      Math.round(docdbBase * commitDiscount), Math.round(docdbBase * 1.2 * commitDiscount));
  }
  if (dbArr.includes("neptune")) {
    const neptuneBase = isXL ? 500 : isLarge ? 250 : 200;
    I(t.database, t.neptune, t.neptuneDesc,
      Math.round(neptuneBase * commitDiscount), Math.round(neptuneBase * 1.2 * commitDiscount));
  }
  if (dbArr.includes("timestream")) {
    I(t.database, t.timestream, t.timestreamDesc, isXL ? 100 : isLarge ? 40 : 10, isXL ? 500 : isLarge ? 200 : 50);
  }
  if (cache === "memorydb") {
    const memdbPerNode = isXL ? 180 : isLarge ? 90 : isMedium ? 55 : 35;
    I(t.database, t.memorydb, t.memorydbDesc(azNum),
      Math.round(memdbPerNode * azNum * commitDiscount),
      Math.round(memdbPerNode * azNum * 1.2 * commitDiscount));
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
  if (types.includes("data") && state.workload?.data_detail === "stream_analytics") {
    I(t.messaging, "Kinesis Data Firehose", lang === "ko" ? "$0.029/GB 수집 기준" : "$0.029/GB ingestion based", 30, isXL ? 150 : isLarge ? 80 : 40);
  }
  if (queueArr.includes("msk")) {
    I(t.messaging, t.msk, t.mskDesc, isXL ? 1500 : isLarge ? 600 : 150, isXL ? 3000 : isLarge ? 1500 : 450);
  }
  if (queueArr.includes("amazon_mq")) {
    I(t.messaging, t.amazonMq, t.amazonMqDesc, isXL ? 800 : isLarge ? 400 : 100, isXL ? 1500 : isLarge ? 800 : 300);
  }
  if (state.platform?.service_mesh === "vpc_lattice") {
    I(t.messaging, t.vpcLattice, t.vpcLatticeDesc, isXL ? 50 : isLarge ? 20 : 5, isXL ? 200 : isLarge ? 80 : 20);
  }

  // -- Operations / Security
  I(t.operations, t.cloudwatch, t.cloudwatchDesc, isXL ? 50 : isLarge ? 25 : 10, isXL ? 200 : isLarge ? 80 : 30);
  if (isEks && (monitor === "prometheus_grafana" || monitor === "hybrid")) {
    I(t.operations, t.prometheus, t.prometheusDesc, isXL ? 100 : 40, isXL ? 300 : 100);
  }
  if (!isEks) {
    const cicdMon = toArray(state.cicd?.monitoring);
    if (cicdMon.includes("datadog")) {
      const hosts = isXL ? 50 : isLarge ? 20 : isMedium ? 5 : 2;
      I(t.operations, t.datadog, t.datadogDesc, hosts * 23, hosts * 38);
    }
    if (cicdMon.includes("xray")) {
      I(t.operations, t.xray, t.xrayDesc, isLarge ? 10 : 3, isXL ? 50 : isLarge ? 25 : 8);
    }
    if (cicdMon.includes("grafana")) {
      I(t.operations, t.managedGrafana, t.managedGrafanaDesc, 9, isLarge ? 45 : 18);
    }
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
  if (authArr.includes("cognito")) {
    const mau = isXL ? 100000 : isLarge ? 50000 : 10000;
    const cognitoCost = mau <= 50000 ? 0 : Math.round((mau - 50000) * 0.0055);
    I(t.operations, t.cognito, t.cognitoDesc, 0, cognitoCost);
  }
  if (isEks || isEcs) {
    I(t.operations, t.ecr, t.ecrDesc, 1, isXL ? 20 : isLarge ? 10 : 5);
  }
  if (types.includes("data") && state.workload?.data_detail === "ai_genai") {
    I(t.operations, t.bedrock, t.bedrockDesc, isXL ? 500 : isLarge ? 200 : 50, isXL ? 3000 : isLarge ? 1000 : 200);
  }
  // Analytics services
  if (types.includes("data") && (state.workload?.data_detail === "log_analytics" || state.workload?.data_detail === "bi_dashboard")) {
    I(t.operations, t.athena, t.athenaDesc, isXL ? 50 : isLarge ? 20 : 5, isXL ? 300 : isLarge ? 100 : 20);
    I(t.operations, t.glue, t.glueDesc, isXL ? 100 : isLarge ? 40 : 10, isXL ? 400 : isLarge ? 150 : 30);
  }
  if (types.includes("data") && state.workload?.data_detail === "bi_dashboard") {
    I(t.operations, t.redshiftServerless, t.redshiftServerlessDesc, isXL ? 200 : isLarge ? 80 : 20, isXL ? 800 : isLarge ? 300 : 80);
    I(t.operations, t.quicksight, t.quicksightDesc, 24, isXL ? 500 : isLarge ? 200 : 50);
  }
  // Security services
  if (hasCritCert || hasPersonalData) {
    I(t.operations, t.inspector, t.inspectorDesc, 10, isXL ? 80 : isLarge ? 40 : 15);
  }
  if (cert.includes("isms_p") || cert.includes("pci") || (hasPersonalData && storArr.includes("s3"))) {
    I(t.operations, t.macie, t.macieDesc, 0, isXL ? 100 : isLarge ? 30 : 5);
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
