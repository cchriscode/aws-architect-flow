/**
 * 아키텍처 서비스 vs 코드 스니펫 정합성 검증
 * 아키텍처에 있는 서비스가 스니펫에도 있는지, 빠진 건 없는지 확인
 */
import { TEMPLATES, adjustTemplateForBudget } from "../src/data/templates";
import { generateArchitecture } from "../src/lib/architecture";
import { generateCodeSnippets } from "../src/lib/code-snippets";

// 스니펫이 있어야 하는 핵심 서비스 매핑
const SERVICE_TO_SNIPPET: Record<string, string> = {
  "Lambda": "Lambda",
  "ECS Fargate": "ECS",
  "EKS": "EKS",
  "EC2 Auto Scaling": "EC2",
  "Aurora": "Aurora",
  "RDS PostgreSQL": "RDS",
  "RDS MySQL": "RDS",
  "DynamoDB": "DynamoDB",
  "ElastiCache": "ElastiCache",
  "CloudFront": "CloudFront",
  "WAF": "WAF",
  "API Gateway": "API Gateway",
};

console.log("=".repeat(90));
console.log("ARCHITECTURE → CODE SNIPPET COVERAGE CHECK");
console.log("=".repeat(90));

let totalMissing = 0;

for (const tpl of TEMPLATES) {
  const { state } = adjustTemplateForBudget(tpl.state, "balanced");
  const arch = generateArchitecture(state, "ko");
  const snippets = generateCodeSnippets(state);

  // Get all architecture service names
  const archServices = new Set<string>();
  for (const l of arch.layers) {
    for (const s of l.services) {
      archServices.add(s.name);
    }
  }

  // Get all snippet titles + code content
  const snippetText = snippets.map(s => s.title + " " + s.code).join(" ").toLowerCase();

  const missing: string[] = [];
  const covered: string[] = [];

  for (const [archKey, snippetKey] of Object.entries(SERVICE_TO_SNIPPET)) {
    const inArch = [...archServices].some(s => s.includes(archKey));
    if (!inArch) continue;

    const inSnippet = snippetText.includes(snippetKey.toLowerCase());
    if (inSnippet) {
      covered.push(archKey);
    } else {
      missing.push(archKey);
    }
  }

  if (missing.length > 0) {
    console.log(`\n❌ ${tpl.id} (${tpl.label})`);
    console.log(`   아키텍처에 있지만 스니펫 없음: ${missing.join(", ")}`);
    totalMissing += missing.length;
  } else {
    console.log(`✅ ${tpl.id} — 핵심 서비스 ${covered.length}개 모두 커버`);
  }
}

console.log(`\n${"=".repeat(90)}`);
console.log(`결과: ${totalMissing === 0 ? "✅ 전 템플릿 정합성 통과" : `❌ 총 ${totalMissing}개 누락`}`);
console.log(`${"=".repeat(90)}`);
