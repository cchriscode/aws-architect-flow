/**
 * 수동 위저드 시뮬레이션: 음식 배달 플랫폼
 *
 * 시나리오: 성장기 B2C 배달앱 백엔드
 * - 실시간 주문 추적 + 결제 처리 + 라이더 매칭
 * - DAU 10만, 점심/저녁 피크, 결제 데이터 민감
 * - 5인 팀, 클라우드 중급, DevOps 체제
 */
import { generateArchitecture } from "../src/lib/architecture";
import { generateCodeSnippets } from "../src/lib/code-snippets";
import { validateState } from "../src/lib/validate";
import { estimateMonthlyCost } from "../src/lib/cost";
import { wellArchitectedScore } from "../src/lib/wafr";
import { generateSecurityGroups } from "../src/lib/security-groups";
import { classifyServices } from "../src/lib/diagram-xml-shared";
import type { WizardState } from "../src/lib/types";

// ════════════════════════════════════════════════════════
// 14 Phase 의사결정 흐름
// ════════════════════════════════════════════════════════

const state: WizardState = {

  // Phase 1: 워크로드 정의
  // → 이커머스(결제) + 실시간(라이더 위치 추적) 복합 워크로드
  workload: {
    type: ["ecommerce", "realtime"],
    ecommerce_detail: "general_shop",
    realtime_detail: "location",
    growth_stage: "growth",
    business_model: "transaction",
    data_sensitivity: "critical",    // 결제 데이터
    user_type: ["b2c"],
  },

  // Phase 2: 팀 구성
  // → 5인 팀, 중급, DevOps (스타트업 성장기)
  team: {
    team_size: "small",
    cloud_exp: "mid",
    ops_model: "devops",
    language: "node_express",
  },

  // Phase 3: 규모
  // → DAU 10만, 피크 RPS 높음, 점심/저녁 스파이크
  scale: {
    dau: "medium",
    peak_rps: "high",
    traffic_pattern: ["spike"],
    data_volume: "tb",
  },

  // Phase 4: 컴플라이언스
  // → PCI 필수 아님(PG사 위임), 하지만 암호화는 엄격
  compliance: {
    cert: ["none"],
    encryption: "strict",
    network_iso: "strict",
  },

  // Phase 5: SLO
  // → 99.9% (배달앱은 다운되면 매출 직격탄)
  // → RTO 분 단위, RPO 1시간
  slo: {
    availability: "99.9",
    rto: "minutes",
    rpo: "1h",
    region: "single",
  },

  // Phase 6: 비용 전략
  // → 균형 (성장기, 무리한 절약도 과투자도 안 됨)
  cost: {
    priority: "balanced",
    commitment: "none",    // 아직 트래픽 패턴 안정화 전
    spot_usage: "no",      // 결제 서비스에 Spot 위험
  },

  // Phase 7: 데이터
  // → Aurora PG (주문/결제 트랜잭션) + DynamoDB (라이더 위치 실시간)
  // → Redis (세션, 장바구니, 실시간 위치 캐시)
  data: {
    primary_db: ["aurora_pg", "dynamodb"],
    db_ha: "multi_az",
    cache: "redis",
    storage: ["s3"],
    search: "no",     // 검색은 아직 불필요
  },

  // Phase 8: 컴퓨트
  // → 컨테이너 (ECS Fargate) — 팀 중급이라 EKS는 과잉
  compute: {
    arch_pattern: "container",
    orchestration: "ecs",
    compute_node: "fargate",
    scaling: ["ecs_asg"],
  },

  // Phase 9: platform (EKS 아니므로 스킵)

  // Phase 10: 네트워크
  // → 환경 분리, 2AZ, 3-tier (결제 데이터 격리), NAT 공유
  network: {
    account_structure: "envs",
    az_count: "2az",
    subnet_tier: "3tier",
    nat_strategy: "shared",
    hybrid: ["no"],
  },

  // Phase 11: 통합
  // → Cognito (사용자 인증), 비동기 혼합 (주문→결제→알림)
  // → SQS (주문 큐) + SNS (알림 팬아웃)
  integration: {
    auth: ["cognito"],
    sync_async: "mixed",
    queue_type: ["sqs", "sns"],
    api_type: "alb",
    batch_workflow: ["eventbridge_sch"],
  },

  // Phase 12: 앱 스택
  // → ALB 직접 (API Gateway 불필요, ECS에 ALB가 표준)
  appstack: {
    api_gateway_impl: "alb_only",
    protocol: "rest",
  },

  // Phase 13: 엣지
  // → CDN (정적 자산), Route53 헬스체크, WAF Bot Control (주문 봇 방지)
  edge: {
    cdn: "yes",
    dns: "health",
    waf: "bot",
  },

  // Phase 14: CI/CD
  // → Terraform, GitHub Actions, Blue/Green (결제 서비스 안전 배포), 3환경
  cicd: {
    iac: "terraform",
    pipeline: "github",
    deploy_strategy: "bluegreen",
    env_count: "three",
    monitoring: ["cloudwatch", "xray"],
  },
};

// ════════════════════════════════════════════════════════
// 결과 생성 & 검증
// ════════════════════════════════════════════════════════

console.log("═".repeat(80));
console.log("🍔 음식 배달 플랫폼 — 수동 위저드 시뮬레이션");
console.log("═".repeat(80));

// 1. 아키텍처 생성
const arch = generateArchitecture(state, "ko");
console.log("\n📐 아키텍처 레이어:", arch.layers.length);
for (const l of arch.layers) {
  console.log(`  [${l.id}] ${l.label} — ${l.services.length}개 서비스`);
  for (const s of l.services) {
    console.log(`    • ${s.name}${s.detail ? ` (${s.detail.substring(0, 50)})` : ""}`);
  }
}

// 2. 검증
const issues = validateState(state, "ko");
const errors = issues.filter(i => i.severity === "error");
const warnings = issues.filter(i => i.severity === "warn");
console.log(`\n🔍 검증: ❌ ${errors.length} errors, ⚠️ ${warnings.length} warnings`);
for (const e of errors) console.log(`  ❌ ${e.title}`);
for (const w of warnings) console.log(`  ⚠️ ${w.title}`);

// 3. 비용
const cost = estimateMonthlyCost(state, "ko");
console.log(`\n💰 월 비용: $${cost.totalMin} ~ $${cost.totalMax} (mid: $${cost.totalMid})`);

// 4. Well-Architected
const wafr = wellArchitectedScore(state, "ko");
console.log(`\n📊 Well-Architected Score: ${wafr.overall}%`);
for (const [k, v] of Object.entries(wafr.pillars)) {
  console.log(`  ${k}: ${v.score}%`);
}

// 5. 코드 스니펫
const snippets = generateCodeSnippets(state);
console.log(`\n📝 코드 스니펫: ${snippets.length}개`);
for (const s of snippets) {
  console.log(`  [${s.category}] ${s.title} (${s.lang})`);
}

// 6. Security Groups
const sg = generateSecurityGroups(state, "ko");
console.log(`\n🔒 Security Groups: ${sg.groups.length}개`);
for (const g of sg.groups) {
  console.log(`  ${g.name}: in=${g.inbound.length} rules, out=${g.outbound.length} rules`);
}

// 7. 정합성 체크
console.log("\n" + "─".repeat(80));
console.log("✅ 정합성 체크");
console.log("─".repeat(80));

const allServices = arch.layers.flatMap(l => l.services.map(s => s.name));
const snippetText = snippets.map(s => s.title + " " + s.code).join(" ").toLowerCase();

const checks = [
  // 아키텍처에 있어야 하는 서비스
  ["Aurora PostgreSQL 있어야 함", allServices.some(s => s.includes("Aurora"))],
  ["DynamoDB 있어야 함", allServices.some(s => s.includes("DynamoDB"))],
  ["ElastiCache Redis 있어야 함", allServices.some(s => s.includes("ElastiCache"))],
  ["ECS Fargate 있어야 함", allServices.some(s => s.includes("ECS"))],
  ["ALB 있어야 함", allServices.some(s => s.includes("ALB"))],
  ["CloudFront 있어야 함", allServices.some(s => s.includes("CloudFront"))],
  ["WAF Bot Control 있어야 함", allServices.some(s => s.includes("WAF") && s.includes("Bot"))],
  ["Route 53 있어야 함", allServices.some(s => s.includes("Route 53"))],
  ["SQS 있어야 함", allServices.some(s => s.includes("SQS"))],
  ["SNS 있어야 함", allServices.some(s => s.includes("SNS"))],
  ["Cognito 있어야 함", allServices.some(s => s.includes("Cognito"))],
  ["GuardDuty 있어야 함", allServices.some(s => s.includes("GuardDuty"))],
  ["NAT GW 있어야 함", allServices.some(s => s.includes("NAT"))],
  ["Blue/Green 배포 있어야 함", allServices.some(s => s.includes("Blue/Green"))],
  // 아키텍처에 없어야 하는 서비스
  ["EKS 없어야 함 (ECS 선택)", !allServices.some(s => s.includes("EKS"))],
  ["Lambda 없어야 함 (컨테이너 선택)", !allServices.some(s => s.includes("Lambda"))],
  ["OpenSearch 없어야 함 (search=no)", !allServices.some(s => s.includes("OpenSearch"))],
  ["API Gateway 없어야 함 (ALB 선택)", !allServices.some(s => s.includes("API Gateway"))],
  // 스니펫 정합성
  ["스니펫에 ECS 있어야 함", snippetText.includes("ecs")],
  ["스니펫에 Aurora 있어야 함", snippetText.includes("aurora")],
  ["스니펫에 DynamoDB 있어야 함", snippetText.includes("dynamodb")],
  ["스니펫에 ElastiCache 있어야 함", snippetText.includes("elasticache")],
  ["스니펫에 CloudFront 있어야 함", snippetText.includes("cloudfront")],
  ["스니펫에 WAF 있어야 함", snippetText.includes("waf")],
  ["스니펫에 SQS 있어야 함", snippetText.includes("sqs")],
  // SG 정합성
  ["SG에 ALB 있어야 함", sg.groups.some(g => g.name.includes("ALB"))],
  ["SG에 App 있어야 함", sg.groups.some(g => g.name.includes("App") || g.name.includes("ECS"))],
  ["SG에 DB 있어야 함", sg.groups.some(g => g.name.includes("DB") || g.name.includes("데이터"))],
  ["SG에 Cache 있어야 함", sg.groups.some(g => g.name.includes("Cache") || g.name.includes("캐시"))],
  // 검증 에러 없어야 함
  ["Validation 에러 0개", errors.length === 0],
];

let passed = 0, failed = 0;
for (const [label, ok] of checks) {
  console.log(`  ${ok ? "✅" : "❌"} ${label}`);
  if (ok) passed++; else failed++;
}

console.log(`\n${"═".repeat(80)}`);
console.log(`결과: ${passed}/${passed + failed} 통과 ${failed > 0 ? `(❌ ${failed}개 실패)` : "(전체 통과)"}`);
console.log(`${"═".repeat(80)}`);
