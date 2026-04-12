/**
 * 3-tier 차별화 검증 스크립트
 * 각 템플릿 × cost_first/balanced/perf_first 아키텍처 출력 비교
 */
import { TEMPLATES, adjustTemplateForBudget, type BudgetPriority } from "../src/data/templates";
import { generateArchitecture } from "../src/lib/architecture";
import { estimateMonthlyCost } from "../src/lib/cost";
import { validateState } from "../src/lib/validate";

const MODES: BudgetPriority[] = ["cost_first", "balanced", "perf_first"];

function getServiceNames(arch: any): string[] {
  return arch.layers.flatMap((l: any) => l.services.map((s: any) => s.name));
}

function getServiceDetails(arch: any): Record<string, string> {
  const map: Record<string, string> = {};
  for (const l of arch.layers) {
    for (const s of l.services) {
      map[s.name] = s.detail || "";
    }
  }
  return map;
}

function getServiceCosts(arch: any): Record<string, string> {
  const map: Record<string, string> = {};
  for (const l of arch.layers) {
    for (const s of l.services) {
      if (s.cost) map[s.name] = s.cost;
    }
  }
  return map;
}

function getInsights(arch: any): string[] {
  return arch.layers.flatMap((l: any) => (l.insights || []).filter((i: string) => i));
}

console.log("=" .repeat(100));
console.log("3-TIER DIFFERENTIATION CHECK");
console.log("=" .repeat(100));

let issueCount = 0;

for (const tpl of TEMPLATES) {
  console.log(`\n${"─".repeat(100)}`);
  console.log(`📋 ${tpl.id} (${tpl.label})`);
  console.log(`${"─".repeat(100)}`);

  const results: Record<string, any> = {};
  const costs: Record<string, any> = {};
  const services: Record<string, string[]> = {};
  const details: Record<string, Record<string, string>> = {};
  const costFields: Record<string, Record<string, string>> = {};
  const errors: Record<string, number> = {};

  for (const mode of MODES) {
    const { state } = adjustTemplateForBudget(tpl.state, mode);
    const arch = generateArchitecture(state, "ko");
    const cost = estimateMonthlyCost(state, "ko");
    const issues = validateState(state, "ko");

    results[mode] = arch;
    costs[mode] = cost;
    services[mode] = getServiceNames(arch);
    details[mode] = getServiceDetails(arch);
    costFields[mode] = getServiceCosts(arch);
    errors[mode] = issues.filter((i) => i.severity === "error").length;
  }

  // 1. 비용 차이 체크
  const costMin = MODES.map((m) => costs[m].totalMin);
  const costMax = MODES.map((m) => costs[m].totalMax);
  const costOk = costMin[0] <= costMin[1] && costMin[1] <= costMin[2];
  console.log(`\n  💰 비용 (min): cost=$${costMin[0]} ≤ balanced=$${costMin[1]} ≤ perf=$${costMin[2]}  ${costOk ? "✅" : "⚠️ 순서 불일치"}`);
  if (!costOk) issueCount++;

  // 2. 서비스 수 차이 체크
  const svcCounts = MODES.map((m) => services[m].length);
  console.log(`  📦 서비스 수: cost=${svcCounts[0]}, balanced=${svcCounts[1]}, perf=${svcCounts[2]}`);

  // 3. 서비스 차이 (cost_first에서 빠진 것, perf_first에서 추가된 것)
  const balancedSet = new Set(services["balanced"]);
  const costOnly = services["cost_first"].filter((s) => !balancedSet.has(s));
  const costMissing = services["balanced"].filter((s) => !new Set(services["cost_first"]).has(s));
  const perfOnly = services["perf_first"].filter((s) => !balancedSet.has(s));

  if (costMissing.length > 0) {
    console.log(`  🔻 cost_first에서 제거: ${costMissing.join(", ")}`);
  }
  if (perfOnly.length > 0) {
    console.log(`  🔺 perf_first에서 추가: ${perfOnly.join(", ")}`);
  }

  // 4. 핵심 서비스 detail 분화 체크
  const keyServices = ["Lambda", "ECS Fargate", "EC2 Auto Scaling Group",
    "EKS Fargate", "EKS on EC2", "ElastiCache (Valkey/Redis 호환)"];

  let detailDiffCount = 0;
  for (const svc of keyServices) {
    const d_cost = details["cost_first"][svc];
    const d_bal = details["balanced"][svc];
    const d_perf = details["perf_first"][svc];

    if (d_bal !== undefined) {
      const allSame = d_cost === d_bal && d_bal === d_perf;
      if (allSame) {
        console.log(`  ⚠️ ${svc}: detail 3개 tier 동일 — "${d_bal}"`);
        issueCount++;
      } else {
        detailDiffCount++;
        console.log(`  ✅ ${svc} detail 분화:`);
        if (d_cost !== d_bal) console.log(`     cost: ${d_cost}`);
        console.log(`     balanced: ${d_bal}`);
        if (d_perf !== d_bal) console.log(`     perf: ${d_perf}`);
      }
    }
  }

  // 5. DB cost 필드 분화 체크
  const dbNames = ["Aurora PostgreSQL", "Aurora MySQL", "RDS PostgreSQL", "RDS MySQL"];
  for (const db of dbNames) {
    const c_cost = costFields["cost_first"][db];
    const c_bal = costFields["balanced"][db];
    const c_perf = costFields["perf_first"][db];
    if (c_bal !== undefined) {
      const allSame = c_cost === c_bal && c_bal === c_perf;
      if (!allSame) {
        console.log(`  ✅ ${db} cost 분화: cost="${c_cost}" | balanced="${c_bal}" | perf="${c_perf}"`);
      }
    }
  }

  // 6. Validation error 체크
  for (const mode of MODES) {
    if (errors[mode] > 0) {
      console.log(`  ❌ ${mode}: ${errors[mode]}개 validation ERROR`);
      issueCount++;
    }
  }

  // 7. Insights 분화 체크 (cost optimization layer)
  const costInsight = getInsights(results["cost_first"]).find((i) => i.includes("비용") || i.includes("Cost"));
  const perfInsight = getInsights(results["perf_first"]).find((i) => i.includes("성능") || i.includes("Performance") || i.includes("안정"));
  if (costInsight && perfInsight && costInsight !== perfInsight) {
    console.log(`  ✅ Insights 분화 확인`);
  }
}

console.log(`\n${"=".repeat(100)}`);
console.log(`총 이슈: ${issueCount}개`);
console.log(`${"=".repeat(100)}`);
