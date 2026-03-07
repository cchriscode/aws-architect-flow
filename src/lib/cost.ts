/* eslint-disable @typescript-eslint/no-explicit-any */
import type { WizardState, CostEstimate, CostCategory } from "@/lib/types";

export function estimateMonthlyCost(state: WizardState): CostEstimate {
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
  const hasCritCert = cert.includes("pci") || cert.includes("hipaa") || cert.includes("sox");
  const hasAurora   = dbArr.some((d: string) => d.startsWith("aurora"));
  const hasRds      = dbArr.some((d: string) => d.startsWith("rds"));
  const hasDynamo   = dbArr.includes("dynamodb");
  const hasRedis    = cache === "redis" || cache === "both";

  // 약정 할인율
  const commitDiscount = commit === "3yr" ? 0.34 : commit === "1yr" ? 0.40 : 1.0;
  const spotDiscount   = spot === "heavy" ? 0.30 : spot === "partial" ? 0.70 : 1.0;

  // 규모별 기본 계수
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

  // -- 컴퓨팅
  if (isEks) {
    const nodeBase = isXL ? 800 : isLarge ? 400 : 180;
    const nodeMin  = Math.round(nodeBase * commitDiscount * (spot !== "no" ? spotDiscount : 1));
    const nodeMax  = Math.round(nodeBase * 1.4 * commitDiscount);
    I("컴퓨팅", "EKS 클러스터", `Control Plane $73/월 + Graviton 노드 ${azNum}AZ`, 73 + nodeMin, 73 + nodeMax);
    if (nodeP === "karpenter") {
      I("컴퓨팅", "Karpenter 노드 동적 프로비저닝", "Spot 혼합으로 최대 70% 절감", 0, 0);
    }
    if (gitops === "argocd") I("컴퓨팅", "ArgoCD (EC2)", "t3.medium 1대", 30, 50);
  } else if (isEcs) {
    const fargateBase = isXL ? 600 : isLarge ? 300 : 120;
    I("컴퓨팅", "ECS Fargate (ARM64)", `${azNum}AZ, CPU/메모리 기준`,
      Math.round(fargateBase * commitDiscount * (spot !== "no" ? spotDiscount : 1)),
      Math.round(fargateBase * 1.4));
  } else if (isServerless) {
    const lambdaBase = isXL ? 150 : isLarge ? 60 : 15;
    I("컴퓨팅", "Lambda 함수", "1M+ 요청/월 기준 (첫 1M 무료)", 0, lambdaBase);
    I("컴퓨팅", "API Gateway", "HTTP API 기준", isXL ? 50 : isLarge ? 20 : 5, isXL ? 150 : isLarge ? 60 : 20);
  }
  if (!isServerless) {
    I("컴퓨팅", "ALB (Application Load Balancer)", "LCU 기준", isXL ? 80 : isLarge ? 40 : 16, isXL ? 200 : isLarge ? 100 : 40);
  }

  // -- 데이터베이스
  if (hasAurora) {
    const auroraBase = isXL ? 800 : isLarge ? 400 : isServerless ? 30 : 120;
    I("데이터베이스", "Aurora Serverless v2", `min 0.5 ~ max ${isXL?128:isLarge?64:8} ACU`,
      Math.round(auroraBase * 0.6 * commitDiscount), Math.round(auroraBase * commitDiscount));
    if (dbHa === "multi_az_read" || dbHa === "global") {
      I("데이터베이스", "Aurora Read Replica", "읽기 분산용 리더 인스턴스",
        Math.round(auroraBase * 0.3 * commitDiscount), Math.round(auroraBase * 0.5 * commitDiscount));
    }
    I("데이터베이스", "Aurora 스토리지 + I/O", "Aurora I/O-Optimized 기준", isXL ? 200 : isLarge ? 80 : 20, isXL ? 600 : isLarge ? 200 : 60);
  }
  if (hasRds) {
    const rdsBase = isXL ? 700 : isLarge ? 350 : 100;
    I("데이터베이스", "RDS 인스턴스", `${dbHa === "multi_az" ? "Multi-AZ" : "Single-AZ"}`,
      Math.round(rdsBase * commitDiscount), Math.round(rdsBase * 1.3 * commitDiscount));
  }
  if (hasDynamo) {
    I("데이터베이스", "DynamoDB (On-Demand)", "읽기/쓰기 요청 건당 과금", isXL ? 200 : isLarge ? 80 : 10, isXL ? 800 : isLarge ? 300 : 40);
  }
  if (hasRedis) {
    const redisBase = isXL ? 400 : isLarge ? 200 : 80;
    I("데이터베이스", "ElastiCache Valkey/Redis", `${azNum}AZ Replication Group`,
      Math.round(redisBase * commitDiscount), Math.round(redisBase * 1.2 * commitDiscount));
  }
  if (search === "opensearch") {
    I("데이터베이스", "OpenSearch", `r6g.large × ${azNum}`, isXL ? 500 : isLarge ? 250 : 100, isXL ? 1000 : isLarge ? 500 : 200);
  }
  if (isServerless && (hasAurora || hasRds)) {
    const rdsProxyBase = hasAurora ? (isXL ? 50 : isLarge ? 25 : 8) : (isXL ? 40 : isLarge ? 20 : 6);
    I("데이터베이스", "RDS Proxy", "Lambda→RDS 커넥션 풀링 (DB 비용의 ~3%)", rdsProxyBase, Math.round(rdsProxyBase * 1.5));
  }

  // -- 네트워크
  const natCount = natStrat === "per_az" ? azNum : natStrat === "endpoint" ? 0 : 1;
  if (natCount > 0) {
    I("네트워크", `NAT Gateway (${natCount}개)`, "$0.059/시간 + 데이터 처리 비용",
      natCount * 43, natCount * 43 + (isXL ? 200 : isLarge ? 100 : 30));
  }
  I("네트워크", "데이터 전송 (outbound)", "인터넷 아웃바운드 첫 1GB 무료", isXL ? 80 : isLarge ? 30 : 5, isXL ? 300 : isLarge ? 100 : 20);
  if (hybridArr.includes("vpn")) I("네트워크", "Site-to-Site VPN", "$0.05/시간 × 2 터널 + 데이터 전송 $0.09/GB", 36, 72 + (isXL ? 90 : isLarge ? 45 : 10));
  if (hybridArr.includes("dx")) I("네트워크", "Direct Connect (1Gbps)", "포트 $0.30/시간(1Gbps) + 아웃바운드 $0.02-0.09/GB", 180, 400);
  if (encr === "strict" || hasCritCert) {
    I("네트워크", "VPC Interface Endpoints", "Interface Endpoint 4개 ($7/개/월)", 28, 40);
  }

  // -- 엣지
  if (cdn !== "no") {
    I("엣지", "CloudFront", "데이터 전송 + 요청 건당", isXL ? 100 : isLarge ? 40 : 5, isXL ? 500 : isLarge ? 150 : 30);
  }
  if (waf === "basic" || waf === "bot") {
    I("엣지", "WAF Web ACL", "$5/월 + 규칙/요청 비용", 20, isXL ? 150 : isLarge ? 80 : 30);
  }
  if (waf === "bot") {
    I("엣지", "Bot Control", "$10/월 + $1/1M 요청", 10, isXL ? 100 : isLarge ? 50 : 20);
  }
  if (waf === "shield") {
    I("엣지", "Shield Advanced", "고정 $3,000/월 (DRT 포함)", 3000, 3000);
  }

  // -- 스토리지
  if (storArr.includes("s3")) {
    I("스토리지", "S3 (Standard + Intelligent-Tiering)", "저장 + 요청 + 데이터 전송", isXL ? 50 : isLarge ? 20 : 5, isXL ? 300 : isLarge ? 80 : 20);
  }
  if (storArr.includes("efs")) {
    I("스토리지", "EFS", "Standard $0.30/GB/월, One Zone $0.16/GB/월", isXL ? 150 : isLarge ? 60 : 15, isXL ? 500 : isLarge ? 200 : 50);
  }

  // -- 메시징
  if (queueArr.includes("sqs") || (syncMode !== "sync_only")) {
    I("메시징", "SQS", "첫 1M 무료, 이후 $0.4/1M", 0, isXL ? 50 : isLarge ? 20 : 5);
  }
  if (queueArr.includes("kinesis")) {
    I("메시징", "Kinesis Data Streams", "샤드 시간 + 데이터 처리", isXL ? 200 : isLarge ? 80 : 20, isXL ? 600 : isLarge ? 250 : 60);
  }
  if (queueArr.includes("eventbridge")) {
    I("메시징", "EventBridge", "이벤트 건당 $1/1M", 0, isXL ? 30 : 10);
  }

  // -- 운영 / 보안
  I("운영", "CloudWatch (로그+메트릭+알람)", "기본 포함, 상세 모니터링 추가", isXL ? 50 : isLarge ? 25 : 10, isXL ? 200 : isLarge ? 80 : 30);
  if (isEks && monitor === "prometheus_grafana") {
    I("운영", "Amazon Managed Prometheus + Grafana", "메트릭 수집 + 대시보드", isXL ? 100 : 40, isXL ? 300 : 100);
  }
  const hasPersonalData = ["sensitive","critical"].includes(state.workload?.data_sensitivity);
  if (hasCritCert || hasPersonalData) {
    I("운영", "Security Hub + GuardDuty + Config", "규정 준수 / 민감 데이터 모니터링", 80, 200);
    I("운영", "CloudTrail (S3 저장)", "이벤트 기록 + 쿼리", 20, 60);
  }
  if (encr === "strict") {
    I("운영", "KMS CMK (서비스별)", "키 사용 건당 + 월 $1/키", 10, 30);
  }
  if (account === "org") {
    I("운영", "Control Tower + AWS Config (조직)", "전체 계정 감사", 30, 80);
  }

  // -- 멀티리전
  if (region === "active" || region === "dr") {
    I("멀티리전", "복제 리전 인프라", "DR 리전 기본 인프라 비용", isXL ? 800 : isLarge ? 400 : 150, isXL ? 2000 : isLarge ? 1000 : 400);
    I("멀티리전", "Route53 헬스체크 + 글로벌 가속", "헬스체크 + GlobalAccelerator", 35, 100);
  }

  // 총합 계산
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
