import type { WizardState, Architecture } from "@/lib/types";
import { generateArchitecture } from "@/lib/architecture";
import { estimateMonthlyCost } from "@/lib/cost";
import { wellArchitectedScore } from "@/lib/wafr";
import { validateState } from "@/lib/validate";

export interface ArchSummary {
  headline: string;
  oneLiner: string;
  complexity: { level: string; score: number; factors: string[] };
  teamReqs: { minDevs: number; roles: string[]; skills: string[] };
  keyServices: { name: string; role: string; icon: string }[];
  rolloutPath: { phase: string; duration: string; tasks: string[] }[];
  stats: {
    monthlyCost: number;
    availability: string;
    wafrScore: number;
    errors: number;
    warnings: number;
  };
  nextSteps: string[];
  warnings: string[];
}

type Lang = "ko" | "en";

/* ------------------------------------------------------------------ */
/*  i18n dictionaries                                                  */
/* ------------------------------------------------------------------ */

const WORKLOAD_LABELS: Record<Lang, Record<string, string>> = {
  ko: {
    web_api: "웹/API",
    ecommerce: "이커머스",
    ticketing: "티켓팅/예약",
    realtime: "실시간",
    data: "데이터 파이프라인",
    saas: "SaaS",
    iot: "IoT",
    internal: "사내 도구",
  },
  en: {
    web_api: "Web/API",
    ecommerce: "E-Commerce",
    ticketing: "Ticketing/Reservation",
    realtime: "Real-time",
    data: "Data Pipeline",
    saas: "SaaS",
    iot: "IoT",
    internal: "Internal Tools",
  },
};

const COMPUTE_LABELS: Record<Lang, Record<string, string>> = {
  ko: {
    serverless: "서버리스(서버 관리 불필요)",
    container: "컨테이너(앱 패키징 실행)",
    vm: "가상 서버(EC2)",
    hybrid: "하이브리드(혼합)",
  },
  en: {
    serverless: "Serverless (no server management)",
    container: "Container (packaged app execution)",
    vm: "Virtual Server (EC2)",
    hybrid: "Hybrid (mixed)",
  },
};

const ORCH_LABELS: Record<Lang, Record<string, string>> = {
  ko: {
    ecs: "ECS Fargate(관리형 컨테이너)",
    eks: "EKS(쿠버네티스)",
  },
  en: {
    ecs: "ECS Fargate (managed containers)",
    eks: "EKS (Kubernetes)",
  },
};

const HEADLINE_TEMPLATE: Record<Lang, (compute: string, type: string) => string> = {
  ko: (compute, type) => `${compute} 기반 ${type} 서비스`,
  en: (compute, type) => `${type} service powered by ${compute}`,
};

const STAGE_MAP: Record<Lang, Record<string, string>> = {
  ko: {
    mvp: "빠른 검증을 위한 최소 비용 구성",
    growth: "사용자 확보와 안정성을 동시에 잡는 구성",
    scale: "대규모 트래픽을 안정적으로 처리하는 구성",
    mature: "비용 최적화와 고가용성을 모두 달성하는 구성",
  },
  en: {
    mvp: "Minimum-cost configuration for rapid validation",
    growth: "Configuration balancing growth and stability",
    scale: "Configuration for reliably handling large-scale traffic",
    mature: "Configuration achieving both cost optimization and high availability",
  },
};

const COMPLEXITY_FACTORS: Record<Lang, Record<string, string | ((n: string) => string)>> = {
  ko: {
    kubernetes: "쿠버네티스 사용",
    service_mesh: "서비스 간 통신 관리",
    multi_region_active: "다중 리전 동시 운영",
    dr_region: "재해 복구용 보조 리전",
    regulatory: "규정 준수 필수",
    financial_audit: "재무 감사 준수",
    workload_composite: (n: string) => `${n}개 워크로드 복합`,
    dau_xlarge: "일일 사용자 100만+",
    dau_large: "일일 사용자 10만+",
    gitops: "자동 배포 관리",
  },
  en: {
    kubernetes: "Uses Kubernetes",
    service_mesh: "Service mesh communication management",
    multi_region_active: "Multi-region active-active operation",
    dr_region: "Disaster recovery secondary region",
    regulatory: "Regulatory compliance required",
    financial_audit: "Financial audit compliance",
    workload_composite: (n: string) => `${n} workloads combined`,
    dau_xlarge: "1M+ daily active users",
    dau_large: "100K+ daily active users",
    gitops: "Automated deployment management",
  },
};

const COMPLEXITY_LEVELS: Record<Lang, Record<string, string>> = {
  ko: { easy: "쉬움", medium: "보통", hard: "복잡", very_hard: "매우 복잡" },
  en: { easy: "Easy", medium: "Medium", hard: "Complex", very_hard: "Very Complex" },
};

const TEAM_REQS: Record<Lang, {
  roles: Record<string, string[]>;
  skills: Record<string, string[]>;
}> = {
  ko: {
    roles: {
      low: ["풀스택 개발자"],
      mid: ["백엔드 개발자", "인프라/배포 겸직"],
      high: ["백엔드 개발자", "인프라 엔지니어", "프론트엔드 개발자"],
      very_high: ["백엔드", "시스템 안정성(SRE)", "보안", "프론트엔드", "DB 관리자"],
    },
    skills: {
      low: ["AWS 기본 사용법", "인프라 자동화 입문"],
      mid: ["컨테이너/DB 운영", "자동 배포 구축", "인프라 코드화"],
      high: ["쿠버네티스 관리", "인프라 자동화", "시스템 모니터링", "보안 관리"],
      very_high: ["쿠버네티스 운영", "서비스 메시", "자동 배포/복구", "다중 리전 운영", "규정 준수 관리"],
    },
  },
  en: {
    roles: {
      low: ["Full-stack Developer"],
      mid: ["Backend Developer", "Infrastructure/Deployment"],
      high: ["Backend Developer", "Infrastructure Engineer", "Frontend Developer"],
      very_high: ["Backend", "SRE", "Security", "Frontend", "DBA"],
    },
    skills: {
      low: ["AWS fundamentals", "Infrastructure automation basics"],
      mid: ["Container/DB operations", "CI/CD pipeline setup", "Infrastructure as Code"],
      high: ["Kubernetes management", "Infrastructure automation", "System monitoring", "Security management"],
      very_high: ["Kubernetes operations", "Service mesh", "Automated deployment/recovery", "Multi-region operations", "Compliance management"],
    },
  },
};

const SVC_LABELS: Record<Lang, Record<string, string>> = {
  ko: {
    "Amazon Aurora": "데이터베이스 (Aurora)",
    "Amazon RDS": "데이터베이스 (RDS)",
    "Amazon DynamoDB": "키-값 NoSQL DB (DynamoDB)",
    "DynamoDB": "키-값 NoSQL DB (DynamoDB)",
    "ElastiCache Redis": "캐시 서버 (Valkey/Redis)",
    "Amazon S3": "파일 저장소 (S3)",
    "Lambda": "서버리스 함수 (Lambda)",
    "ECS Fargate": "컨테이너 실행 (Fargate)",
    "Amazon ECS": "컨테이너 관리 (ECS)",
    "Amazon EKS": "쿠버네티스 (EKS)",
    "CloudFront": "콘텐츠 빠른 전송 (CDN)",
    "Route 53": "DNS/도메인 관리",
    "ALB": "트래픽 분산기 (ALB)",
    "API Gateway": "API 연결 관리",
    "Amazon SQS": "메시지 대기열 (SQS)",
    "Amazon SNS": "메시지 발행/구독 (SNS)",
    "EventBridge": "이벤트 라우팅",
    "Amazon Kinesis": "실시간 스트림 (Kinesis)",
    "Amazon ECR": "컨테이너 이미지 저장소",
    "AWS WAF": "웹 보안 방화벽 (WAF)",
    "Amazon Cognito": "로그인/인증 (Cognito)",
    "AWS KMS": "암호화 키 관리",
    "CloudWatch": "시스템 모니터링",
    "CloudTrail": "작업 기록 추적",
    "Step Functions": "워크플로우 자동화",
    "OpenSearch": "검색 엔진 (OpenSearch)",
    "Terraform": "인프라 코드화 (Terraform)",
    "GitHub Actions": "자동 배포 (GitHub Actions)",
    "VPC": "가상 네트워크 (VPC)",
    "NAT Gateway": "프라이빗 서브넷 외부 통신 (NAT)",
    "GuardDuty": "보안 위협 감지",
    "AWS Config": "설정 변경 추적",
    "Secrets Manager": "비밀번호 관리",
  },
  en: {
    "Amazon Aurora": "Database (Aurora)",
    "Amazon RDS": "Database (RDS)",
    "Amazon DynamoDB": "Key-Value NoSQL DB (DynamoDB)",
    "DynamoDB": "Key-Value NoSQL DB (DynamoDB)",
    "ElastiCache Redis": "Cache Server (Valkey/Redis)",
    "Amazon S3": "File Storage (S3)",
    "Lambda": "Serverless Functions (Lambda)",
    "ECS Fargate": "Container Runtime (Fargate)",
    "Amazon ECS": "Container Management (ECS)",
    "Amazon EKS": "Kubernetes (EKS)",
    "CloudFront": "Content Delivery (CDN)",
    "Route 53": "DNS/Domain Management",
    "ALB": "Load Balancer (ALB)",
    "API Gateway": "API Management (API Gateway)",
    "Amazon SQS": "Message Queue (SQS)",
    "Amazon SNS": "Pub/Sub Messaging (SNS)",
    "EventBridge": "Event Routing",
    "Amazon Kinesis": "Real-time Streaming (Kinesis)",
    "Amazon ECR": "Container Image Registry",
    "AWS WAF": "Web Application Firewall (WAF)",
    "Amazon Cognito": "Authentication (Cognito)",
    "AWS KMS": "Encryption Key Management",
    "CloudWatch": "System Monitoring",
    "CloudTrail": "Activity Audit Trail",
    "Step Functions": "Workflow Automation",
    "OpenSearch": "Search Engine (OpenSearch)",
    "Terraform": "Infrastructure as Code (Terraform)",
    "GitHub Actions": "CI/CD (GitHub Actions)",
    "VPC": "Virtual Network (VPC)",
    "NAT Gateway": "NAT Gateway",
    "GuardDuty": "Threat Detection",
    "AWS Config": "Configuration Change Tracking",
    "Secrets Manager": "Secrets Management",
  },
};

const NEXT_STEPS: Record<Lang, {
  iac_none: string;
  iac_template: (name: string) => string;
  container: string;
  serverless: string;
  cicd: string;
  monitoring: string;
  security: string;
}> = {
  ko: {
    iac_none: "인프라 자동화 도구 도입하기 — 서버/네트워크를 코드로 관리하면 실수가 줄고 반복 작업이 없어집니다",
    iac_template: (name) => `${name}으로 기본 네트워크 구성 코드 작성하기 — 서버들이 통신할 기본 환경을 만듭니다`,
    container: "컨테이너 실행 환경 만들고 첫 서비스 배포하기 — 앱을 패키징해서 클라우드에 올립니다",
    serverless: "서버리스 함수와 API 연결 설정하기 — 요청이 올 때만 실행되어 비용이 절약됩니다",
    cicd: "자동 배포 파이프라인 구축하기 — 코드 변경 시 개발→테스트→운영 환경으로 자동 배포됩니다",
    monitoring: "시스템 모니터링 및 알람 설정하기 — 장애 발생 시 즉시 알림을 받을 수 있습니다",
    security: "보안 체크리스트 검토하기 — 계정별 최소 권한만 부여하고 보안 설정을 확인합니다",
  },
  en: {
    iac_none: "Adopt Infrastructure as Code tooling — managing servers/networks as code reduces errors and eliminates repetitive work",
    iac_template: (name) => `Write base network configuration with ${name} — sets up the foundational environment for service communication`,
    container: "Set up container runtime and deploy first service — package your app and deploy it to the cloud",
    serverless: "Configure serverless functions and API integration — runs only on request, saving costs",
    cicd: "Build a CI/CD pipeline — code changes are automatically deployed through dev, test, and production",
    monitoring: "Set up system monitoring and alerting — receive immediate notifications when incidents occur",
    security: "Review the security checklist — apply least-privilege access per account and verify security settings",
  },
};

/* ------------------------------------------------------------------ */
/*  Rollout path i18n                                                  */
/* ------------------------------------------------------------------ */

type RolloutPhase = { phase: string; duration: string; tasks: string[] };

const ROLLOUT_PATHS: Record<Lang, {
  mvp: (pattern: string) => RolloutPhase[];
  growth: () => RolloutPhase[];
  default: () => RolloutPhase[];
}> = {
  ko: {
    mvp: (pattern) => [
      { phase: "1단계: 기반 구축", duration: "2–4주", tasks: ["네트워크 환경 생성 (서버들이 통신할 기본 환경)", "데이터베이스 생성", "자동 배포 환경 설정"] },
      { phase: "2단계: MVP 배포", duration: "1–2주", tasks: [pattern === "serverless" ? "서버리스 함수 배포" : "첫 서비스 배포", "도메인 연결 및 보안 접속(HTTPS) 적용", "시스템 상태 모니터링 기본 설정"] },
      { phase: "3단계: 안정화", duration: "2–4주", tasks: ["접속자 증가 시 자동 확장 테스트", "장애 발생 시 복구 훈련", "비용 최적화 검토"] },
    ],
    growth: () => [
      { phase: "1단계: 인프라 기반", duration: "3–4주", tasks: ["인프라를 코드로 관리하기 (수동 설정 제거)", "다중 가용 영역 구성 (장애 시 자동 전환)", "환경 분리 (개발/테스트/운영)"] },
      { phase: "2단계: 서비스 배포", duration: "2–3주", tasks: ["앱 배포 및 실행 환경 구축", "자주 쓰는 데이터 캐시 추가 (속도 향상)", "전 세계 빠른 응답을 위한 CDN 설정"] },
      { phase: "3단계: 운영 고도화", duration: "2–4주", tasks: ["비용 분석 및 장기 할인 요금제 검토", "보안 자동 감사 설정", "부하 테스트 및 자동 확장 조정"] },
    ],
    default: () => [
      { phase: "1단계: 설계 및 기반", duration: "4–6주", tasks: ["팀/환경별 별도 AWS 계정 구성", "네트워크 설계 (서버 간 통신 환경)", "인프라 코드 모듈화 (재사용 가능한 블록)"] },
      { phase: "2단계: 핵심 서비스", duration: "3–4주", tasks: ["컨테이너 실행 플랫폼 구축", "DB 고가용성 구성 (장애 시 자동 전환)", "서비스 간 메시징 인프라 구축"] },
      { phase: "3단계: 운영 플랫폼", duration: "2–4주", tasks: ["시스템 모니터링/로그 수집 플랫폼", "자동 배포 파이프라인 구축", "보안 강화 (권한 관리, 암호화)"] },
      { phase: "4단계: 최적화", duration: "2–4주", tasks: ["비용 최적화 (장기 할인/여유 서버 활용)", "성능 최적화 (병목 해소)", "재해 복구 훈련 (장애 대비 시나리오)"] },
    ],
  },
  en: {
    mvp: (pattern) => [
      { phase: "Phase 1: Foundation", duration: "2–4 weeks", tasks: ["Create network environment (base infrastructure for service communication)", "Set up database", "Configure CI/CD environment"] },
      { phase: "Phase 2: MVP Deployment", duration: "1–2 weeks", tasks: [pattern === "serverless" ? "Deploy serverless functions" : "Deploy first service", "Connect domain and enable HTTPS", "Set up basic system health monitoring"] },
      { phase: "Phase 3: Stabilization", duration: "2–4 weeks", tasks: ["Test auto-scaling under increased traffic", "Run disaster recovery drills", "Review cost optimization"] },
    ],
    growth: () => [
      { phase: "Phase 1: Infrastructure Foundation", duration: "3–4 weeks", tasks: ["Manage infrastructure as code (eliminate manual configuration)", "Configure multi-AZ setup (automatic failover on outage)", "Separate environments (dev/staging/production)"] },
      { phase: "Phase 2: Service Deployment", duration: "2–3 weeks", tasks: ["Build app deployment and runtime environment", "Add caching for frequently accessed data (performance boost)", "Configure CDN for global low-latency responses"] },
      { phase: "Phase 3: Operations Maturity", duration: "2–4 weeks", tasks: ["Analyze costs and evaluate reserved/savings plans", "Set up automated security auditing", "Run load tests and tune auto-scaling"] },
    ],
    default: () => [
      { phase: "Phase 1: Design & Foundation", duration: "4–6 weeks", tasks: ["Set up separate AWS accounts per team/environment", "Design network architecture (inter-service communication)", "Modularize infrastructure code (reusable building blocks)"] },
      { phase: "Phase 2: Core Services", duration: "3–4 weeks", tasks: ["Build container orchestration platform", "Configure database high availability (automatic failover)", "Build inter-service messaging infrastructure"] },
      { phase: "Phase 3: Operations Platform", duration: "2–4 weeks", tasks: ["Set up monitoring and log aggregation platform", "Build CI/CD pipeline", "Harden security (access control, encryption)"] },
      { phase: "Phase 4: Optimization", duration: "2–4 weeks", tasks: ["Cost optimization (reserved instances, spot capacity)", "Performance optimization (eliminate bottlenecks)", "Disaster recovery drills (failure scenario exercises)"] },
    ],
  },
};

/* ------------------------------------------------------------------ */
/*  generateSummary                                                    */
/* ------------------------------------------------------------------ */

export function generateSummary(
  state: WizardState,
  precomputed?: {
    arch?: Architecture;
    cost?: { totalMid: number };
    wafr?: { overall: number };
    issues?: { severity: "error" | "warn"; title: string; message: string }[];
  },
  lang: Lang = "ko"
): ArchSummary {
  const arch = precomputed?.arch || generateArchitecture(state, lang);
  const cost = precomputed?.cost || estimateMonthlyCost(state, lang);
  const wafr = precomputed?.wafr || wellArchitectedScore(state, lang);
  const issues = precomputed?.issues || validateState(state, lang);

  // headline
  const types: string[] = state.workload?.type || [];
  const typeLabel = types.map((t) => WORKLOAD_LABELS[lang][t] || t).join(" + ");
  const pattern = state.compute?.arch_pattern || "container";
  const orch = state.compute?.orchestration;
  const computeLabel = orch ? ORCH_LABELS[lang][orch] || orch : COMPUTE_LABELS[lang][pattern] || pattern;
  const headline = HEADLINE_TEMPLATE[lang](computeLabel, typeLabel);

  // oneLiner
  const stage = state.workload?.growth_stage || "mvp";
  const oneLiner = STAGE_MAP[lang][stage] || STAGE_MAP[lang].mvp;

  // complexity
  let score = 1;
  const factors: string[] = [];
  const cf = COMPLEXITY_FACTORS[lang];
  if (orch === "eks") { score += 3; factors.push(cf.kubernetes as string); }
  if (state.platform?.service_mesh === "istio") { score += 2; factors.push(cf.service_mesh as string); }
  if (state.slo?.region === "active") { score += 2; factors.push(cf.multi_region_active as string); }
  else if (state.slo?.region === "dr") { score += 1; factors.push(cf.dr_region as string); }
  const cert: string[] = state.compliance?.cert || [];
  if (cert.includes("pci") || cert.includes("hipaa")) { score += 2; factors.push(cf.regulatory as string); }
  if (cert.includes("sox")) { score += 1; factors.push(cf.financial_audit as string); }
  if (types.length > 2) { score += 1; factors.push((cf.workload_composite as (n: string) => string)(String(types.length))); }
  const dau = state.scale?.dau;
  if (dau === "xlarge") { score += 2; factors.push(cf.dau_xlarge as string); }
  else if (dau === "large") { score += 1; factors.push(cf.dau_large as string); }
  if (state.platform?.gitops === "argocd" || state.platform?.gitops === "flux") { score += 1; factors.push(cf.gitops as string); }
  score = Math.min(score, 10);

  const cl = COMPLEXITY_LEVELS[lang];
  const level = score <= 3 ? cl.easy : score <= 5 ? cl.medium : score <= 7 ? cl.hard : cl.very_hard;

  // teamReqs
  let minDevs: number;
  const roles: string[] = [];
  const skills: string[] = [];
  const tr = TEAM_REQS[lang];

  if (score <= 3) {
    minDevs = 1;
    roles.push(...tr.roles.low);
    skills.push(...tr.skills.low);
  } else if (score <= 5) {
    minDevs = 3;
    roles.push(...tr.roles.mid);
    skills.push(...tr.skills.mid);
  } else if (score <= 7) {
    minDevs = 5;
    roles.push(...tr.roles.high);
    skills.push(...tr.skills.high);
  } else {
    minDevs = 8;
    roles.push(...tr.roles.very_high);
    skills.push(...tr.skills.very_high);
  }

  // keyServices - prioritize important layers (compute, data, edge) over infra (org, network)
  const svcLabels = SVC_LABELS[lang];
  const keyServices: { name: string; role: string; icon: string }[] = [];
  const priorityOrder = ["compute", "data", "edge", "messaging", "platform", "appstack", "cicd", "security", "dr", "batch", "observability", "network", "org", "cost"];
  const sortedLayers = [...arch.layers].sort((a, b) => {
    const ai = priorityOrder.indexOf(a.id);
    const bi = priorityOrder.indexOf(b.id);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
  for (const layer of sortedLayers) {
    for (const svc of layer.services) {
      if (keyServices.length >= 8) break;
      keyServices.push({
        name: svcLabels[svc.name] || svc.name,
        role: svc.detail || svc.reason || "",
        icon: layer.icon,
      });
    }
  }

  // rolloutPath
  const rolloutPath = buildRolloutPath(state, lang);

  // stats
  const errors = issues.filter((i) => i.severity === "error").length;
  const warnings = issues.filter((i) => i.severity === "warn").length;

  // nextSteps
  const ns = NEXT_STEPS[lang];
  const nextSteps: string[] = [];
  if (!state.cicd?.iac || state.cicd.iac === "none")
    nextSteps.push(ns.iac_none);
  else {
    const iacName = state.cicd.iac === "terraform" ? "Terraform" : state.cicd.iac === "cdk" ? "CDK" : "CloudFormation";
    nextSteps.push(ns.iac_template(iacName));
  }

  if (pattern === "container")
    nextSteps.push(ns.container);
  else if (pattern === "serverless")
    nextSteps.push(ns.serverless);

  nextSteps.push(ns.cicd);
  nextSteps.push(ns.monitoring);
  nextSteps.push(ns.security);

  // warnings
  const critWarnings = issues
    .filter((i) => i.severity === "error")
    .map((i) => `${i.title}: ${i.message}`);

  return {
    headline,
    oneLiner,
    complexity: { level, score, factors },
    teamReqs: { minDevs, roles, skills },
    keyServices,
    rolloutPath,
    stats: {
      monthlyCost: cost.totalMid,
      availability: state.slo?.availability || "99.9",
      wafrScore: wafr.overall,
      errors,
      warnings,
    },
    nextSteps,
    warnings: critWarnings,
  };
}

function buildRolloutPath(
  state: WizardState,
  lang: Lang
): { phase: string; duration: string; tasks: string[] }[] {
  const stage = state.workload?.growth_stage || "mvp";
  const pattern = state.compute?.arch_pattern || "container";
  const paths = ROLLOUT_PATHS[lang];

  if (stage === "mvp") return paths.mvp(pattern);
  if (stage === "growth") return paths.growth();
  return paths.default();
}
