/**
 * 전체 템플릿 아키텍처 정합성 검사
 * AWS Best Practice 기준으로 부적절한 서비스 조합/배치 탐지
 */
import { TEMPLATES, adjustTemplateForBudget } from "../src/data/templates";
import { generateArchitecture } from "../src/lib/architecture";
import { validateState } from "../src/lib/validate";

interface Issue {
  template: string;
  severity: "ERROR" | "WARN" | "INFO";
  category: string;
  message: string;
}

const issues: Issue[] = [];

function addIssue(tpl: string, sev: Issue["severity"], cat: string, msg: string) {
  issues.push({ template: tpl, severity: sev, category: cat, message: msg });
}

for (const tpl of TEMPLATES) {
  const { state } = adjustTemplateForBudget(tpl.state, "balanced");
  const arch = generateArchitecture(state, "ko");
  const valIssues = validateState(state, "ko");

  const allServices: string[] = [];
  const layerMap: Record<string, string[]> = {};
  for (const l of arch.layers) {
    const names = l.services.map((s: any) => s.name);
    layerMap[l.id] = names;
    allServices.push(...names);
  }
  const has = (name: string) => allServices.some((s) => s.includes(name));
  const hasInLayer = (layer: string, name: string) => (layerMap[layer] || []).some((s) => s.includes(name));
  const tplState = state;

  // ── 1. WAF 정합성 ──
  if (has("WAF")) {
    // WAF는 CloudFront, ALB, API Gateway에만 붙을 수 있음
    const hasWafTarget = has("CloudFront") || has("ALB") || has("API Gateway") || has("App Runner");
    if (!hasWafTarget) {
      addIssue(tpl.id, "ERROR", "WAF", "WAF가 있지만 연결 대상(CloudFront/ALB/APIGW)이 없음");
    }
    // IoT에서 WAF는 디바이스 MQTT 트래픽에 무의미
    if (tplState.workload?.type?.includes?.("iot") && !has("CloudFront")) {
      addIssue(tpl.id, "WARN", "WAF", "IoT 워크로드에 WAF — 디바이스는 MQTT로 통신하므로 HTTP WAF 효과 제한적");
    }
    // internal_tool에 WAF
    if (tplState.workload?.type?.includes?.("internal") && has("WAF")) {
      addIssue(tpl.id, "WARN", "WAF", "내부 도구에 WAF — 외부 트래픽 없으면 불필요");
    }
  }

  // ── 2. ALB vs API Gateway 정합성 ──
  if (has("ALB") && tplState.compute?.arch_pattern === "serverless") {
    addIssue(tpl.id, "ERROR", "LB", "서버리스(Lambda)인데 ALB 사용 — API Gateway가 표준");
  }
  if (has("API Gateway") && tplState.compute?.arch_pattern === "container" && !has("Lambda")) {
    addIssue(tpl.id, "WARN", "LB", "컨테이너(ECS/EKS)인데 API Gateway — ALB가 더 적합 (API GW는 Lambda 최적화)");
  }

  // ── 3. NAT Gateway 정합성 ──
  if (has("NAT") && tplState.network?.subnet_tier === "2tier" && tplState.compute?.arch_pattern === "serverless") {
    // 서버리스 + 2tier면 NAT 필요성 낮음 (Lambda는 VPC 밖에서도 실행 가능)
    const natService = allServices.find((s) => s.includes("NAT"));
    if (natService && !natService.includes("최소화") && !natService.includes("Endpoint")) {
      addIssue(tpl.id, "INFO", "NAT", "서버리스 + 2tier인데 NAT GW — VPC 외부 Lambda면 불필요할 수 있음");
    }
  }

  // ── 4. EKS + ECS 혼용 체크 ──
  if (has("EKS") && has("ECS Fargate") && !tplState.compute?.arch_pattern?.includes("hybrid")) {
    addIssue(tpl.id, "ERROR", "Compute", "EKS와 ECS Fargate 동시 존재 — 하나만 선택해야 함");
  }

  // ── 5. CloudFront 정합성 ──
  if (has("CloudFront") && tplState.workload?.user_type?.includes?.("internal")) {
    addIssue(tpl.id, "WARN", "CDN", "내부 사용자 전용인데 CloudFront — 외부 트래픽 없으면 불필요");
  }

  // ── 6. IoT 특화 체크 ──
  if (tplState.workload?.type?.includes?.("iot")) {
    if (!has("IoT Core")) {
      addIssue(tpl.id, "ERROR", "IoT", "IoT 워크로드인데 IoT Core 서비스 없음");
    }
    if (has("ALB") && !has("API Gateway")) {
      addIssue(tpl.id, "WARN", "IoT", "IoT에서 ALB를 인제스트용으로 쓰면 비효율 — IoT Core + API Gateway(관리API)가 표준");
    }
    if (has("Cognito") && !has("IoT Core")) {
      addIssue(tpl.id, "WARN", "IoT", "IoT 디바이스 인증에 Cognito — X.509 인증서(IoT Core)가 표준");
    }
  }

  // ── 7. DB HA 정합성 ──
  if (tplState.data?.db_ha === "single_az" && tplState.slo?.availability === "99.99") {
    addIssue(tpl.id, "ERROR", "DB", "99.99% SLA인데 DB Single-AZ — Multi-AZ 필수");
  }
  if (tplState.data?.db_ha === "global" && tplState.slo?.region === "single") {
    addIssue(tpl.id, "WARN", "DB", "단일 리전인데 Global DB — 멀티 리전 아니면 불필요");
  }

  // ── 8. 서버리스에 불필요한 서비스 ──
  if (tplState.compute?.arch_pattern === "serverless") {
    if (has("ECR")) {
      addIssue(tpl.id, "WARN", "Compute", "서버리스인데 ECR(컨테이너 레지스트리) — Lambda 컨테이너 이미지 아니면 불필요");
    }
    if (has("Systems Manager")) {
      addIssue(tpl.id, "ERROR", "Compute", "서버리스인데 Systems Manager(SSM) — EC2 전용 서비스");
    }
  }

  // ── 9. 캐시 + DB 정합성 ──
  if (has("DAX") && !tplState.data?.primary_db?.includes?.("dynamodb")) {
    addIssue(tpl.id, "ERROR", "Cache", "DAX가 있지만 DynamoDB가 없음 — DAX는 DynamoDB 전용");
  }
  if (has("ElastiCache") && has("DAX") && tplState.data?.primary_db?.length === 1 && tplState.data?.primary_db?.[0] === "dynamodb") {
    addIssue(tpl.id, "WARN", "Cache", "DynamoDB만 쓰는데 ElastiCache + DAX 동시 — DAX만으로 충분할 수 있음");
  }

  // ── 10. 메시징 정합성 ──
  if (has("Kinesis") && has("MSK")) {
    addIssue(tpl.id, "WARN", "Messaging", "Kinesis + MSK(Kafka) 동시 — 기능 중복, 하나만 선택 권장");
  }
  if (has("SQS") && has("Kinesis") && !tplState.workload?.type?.includes?.("data") && !tplState.workload?.type?.includes?.("iot")) {
    addIssue(tpl.id, "INFO", "Messaging", "SQS + Kinesis 동시 — 용도가 명확히 다르면 OK, 아니면 하나로 통합 검토");
  }

  // ── 11. 배포 전략 정합성 ──
  if (tplState.cicd?.deploy_strategy === "canary" && tplState.compute?.arch_pattern === "serverless") {
    // Lambda + Canary는 CodeDeploy로 가능하므로 OK
  }
  if (tplState.cicd?.deploy_strategy === "bluegreen" && tplState.compute?.arch_pattern === "serverless" && !has("ALB")) {
    addIssue(tpl.id, "INFO", "Deploy", "서버리스 Blue/Green — Lambda Alias로 가능하지만 API Gateway 단에서 처리 확인 필요");
  }

  // ── 12. 모니터링 정합성 ──
  if (has("Prometheus") && !has("EKS")) {
    addIssue(tpl.id, "WARN", "Monitoring", "Prometheus가 있지만 EKS 없음 — ECS/서버리스에선 CloudWatch가 표준");
  }
  if (has("Grafana") && !has("Prometheus") && !has("CloudWatch")) {
    addIssue(tpl.id, "WARN", "Monitoring", "Grafana 있지만 데이터 소스(Prometheus/CloudWatch) 없음");
  }

  // ── 13. 네트워크 정합성 ──
  if (tplState.network?.subnet_tier === "3tier" && tplState.compliance?.cert?.length === 1 && tplState.compliance?.cert?.[0] === "none") {
    if (tplState.cost?.priority === "cost_first") {
      addIssue(tpl.id, "WARN", "Network", "비용 최우선 + 컴플라이언스 없음 + 3-tier — 2-tier면 충분, 비용 절감 가능");
    }
  }
  if (tplState.network?.az_count === "1az" && tplState.slo?.availability !== "99" && tplState.slo?.availability !== undefined) {
    addIssue(tpl.id, "WARN", "Network", "1AZ인데 99% 초과 가용성 — Multi-AZ 필요");
  }

  // ── 14. 인증 정합성 ──
  if (has("Cognito") && tplState.workload?.user_type?.includes?.("internal") && !tplState.workload?.user_type?.includes?.("b2c")) {
    addIssue(tpl.id, "INFO", "Auth", "내부 사용자 전용인데 Cognito — SSO/IAM Identity Center가 더 적합할 수 있음");
  }

  // ── 15. Validation errors ──
  const errs = valIssues.filter((i) => i.severity === "error");
  if (errs.length > 0) {
    for (const e of errs) {
      addIssue(tpl.id, "ERROR", "Validate", e.title);
    }
  }

  // ── 16. OpenSearch 정합성 ──
  if (has("OpenSearch") && tplState.scale?.dau === "tiny") {
    addIssue(tpl.id, "WARN", "Search", "DAU tiny인데 OpenSearch — DB 검색으로 충분, 비용 과잉");
  }

  // ── 17. Spot + 트랜잭션 ──
  if (tplState.cost?.spot_usage !== "no" && (tplState.workload?.type?.includes?.("ticketing") || tplState.workload?.type?.includes?.("ecommerce"))) {
    if (tplState.cost?.spot_usage === "heavy") {
      addIssue(tpl.id, "ERROR", "Cost", "결제/티켓팅에 Spot heavy — 2분 강제종료로 트랜잭션 유실 위험");
    }
  }

  // ── 18. RDS Proxy 정합성 ──
  if (has("RDS Proxy") && !has("Lambda")) {
    addIssue(tpl.id, "INFO", "DB", "RDS Proxy 있지만 Lambda 없음 — 컨테이너는 커넥션 풀링 자체 처리 가능");
  }

  // ── 19. Shield Advanced 비용 체크 ──
  if (has("Shield Advanced") && tplState.scale?.dau === "small") {
    addIssue(tpl.id, "WARN", "Security", "DAU small인데 Shield Advanced($3,000/월) — WAF Basic으로 충분");
  }

  // ── 20. AppStack 정합성 ──
  if (has("Spring Cloud Gateway") && !has("EKS")) {
    addIssue(tpl.id, "WARN", "AppStack", "Spring Cloud Gateway인데 EKS 없음 — ECS에서는 ALB가 더 적합");
  }
  if (has("K8s") && has("k8s") && tplState.compute?.orchestration !== "eks") {
    addIssue(tpl.id, "ERROR", "AppStack", "K8s 관련 서비스가 있지만 EKS가 아님");
  }
}

// ── 결과 출력 ──
console.log("=".repeat(100));
console.log("ARCHITECTURE SANITY CHECK — ALL TEMPLATES (balanced tier)");
console.log("=".repeat(100));

const grouped: Record<string, Issue[]> = {};
for (const issue of issues) {
  if (!grouped[issue.template]) grouped[issue.template] = [];
  grouped[issue.template].push(issue);
}

let errorCount = 0, warnCount = 0, infoCount = 0;
const cleanTemplates: string[] = [];

for (const tpl of TEMPLATES) {
  const tplIssues = grouped[tpl.id];
  if (!tplIssues || tplIssues.length === 0) {
    cleanTemplates.push(tpl.id);
    continue;
  }

  console.log(`\n📋 ${tpl.id} (${tpl.label})`);
  for (const issue of tplIssues) {
    const icon = issue.severity === "ERROR" ? "❌" : issue.severity === "WARN" ? "⚠️" : "ℹ️";
    console.log(`  ${icon} [${issue.category}] ${issue.message}`);
    if (issue.severity === "ERROR") errorCount++;
    else if (issue.severity === "WARN") warnCount++;
    else infoCount++;
  }
}

if (cleanTemplates.length > 0) {
  console.log(`\n✅ 이슈 없음: ${cleanTemplates.join(", ")}`);
}

console.log(`\n${"=".repeat(100)}`);
console.log(`총계: ❌ ERROR ${errorCount}개 | ⚠️ WARN ${warnCount}개 | ℹ️ INFO ${infoCount}개`);
console.log(`${"=".repeat(100)}`);
