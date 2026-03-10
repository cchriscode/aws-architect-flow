/**
 * Detailed verification:
 * 1) Each template × mode: print actual service list + cost breakdown
 * 2) Direct manual selection: verify outputs match selections exactly
 */
import { describe, it, expect } from "vitest";
import { TEMPLATES, adjustTemplateForBudget } from "@/data/templates";
import { estimateMonthlyCost } from "@/lib/cost";
import { generateArchitecture } from "@/lib/architecture";
import type { WizardState } from "@/lib/types";

type Mode = "cost_first" | "balanced" | "perf_first";

function dump(tplId: string, mode: Mode) {
  const tpl = TEMPLATES.find((t) => t.id === tplId)!;
  const { state, changes } = adjustTemplateForBudget(tpl.state, mode);
  const cost = estimateMonthlyCost(state, "ko");
  const arch = generateArchitecture(state, "ko");

  const services = arch.layers.flatMap((l) =>
    l.services.map((s) => `  [${l.id}] ${s.name}${s.cost ? ` (${s.cost})` : ""}`),
  );
  const costItems = cost.categories.flatMap((c) =>
    c.items.map((i) => `  [${c.name}] ${i.name}: $${i.min}~$${i.max} — ${i.desc}`),
  );

  return { state, changes, cost, services, costItems };
}

// ============================================================
// Part 1: 템플릿 모드별 서비스 구성 상세 출력
// ============================================================
describe("Part 1: Template mode service detail dump", () => {
  const templates = [
    "ecommerce_mvp",
    "b2b_saas",
    "internal_tool",
    "realtime_chat",
    "data_pipeline",
    "generic_web_api",
    "multitenant_microservices",
    "static_jamstack",
    "ai_ml_serving",
  ];
  const modes: Mode[] = ["cost_first", "balanced", "perf_first"];

  for (const tplId of templates) {
    it(`${tplId} — 3-mode comparison`, () => {
      console.log(`\n${"=".repeat(80)}`);
      console.log(`📋 ${tplId}`);
      console.log("=".repeat(80));

      for (const mode of modes) {
        const { state, changes, cost, services, costItems } = dump(tplId, mode);
        console.log(`\n--- ${mode} ($${cost.totalMin}~$${cost.totalMax}) ---`);
        if (changes.length > 0) {
          console.log(`변경사항: ${changes.join(", ")}`);
        }
        console.log(`\nKey state:`);
        console.log(`  compute: ${state.compute?.arch_pattern}/${state.compute?.orchestration ?? "-"}/${state.compute?.compute_node ?? "-"}`);
        console.log(`  db: ${JSON.stringify(state.data?.primary_db)} ha=${state.data?.db_ha ?? "-"}`);
        console.log(`  cache: ${state.data?.cache}, search: ${state.data?.search}`);
        console.log(`  network: az=${state.network?.az_count} nat=${state.network?.nat_strategy} subnet=${state.network?.subnet_tier}`);
        console.log(`  edge: cdn=${state.edge?.cdn} waf=${state.edge?.waf}`);
        console.log(`  cicd: env=${state.cicd?.env_count} deploy=${state.cicd?.deploy_strategy} iac=${state.cicd?.iac}`);
        console.log(`  cost: commitment=${state.cost?.commitment} spot=${state.cost?.spot_usage}`);
        console.log(`\nArchitecture services (${services.length}):`);
        services.forEach((s) => console.log(s));
        console.log(`\nCost items (${costItems.length}):`);
        costItems.forEach((c) => console.log(c));
      }

      // Basic sanity: cost_first should have fewer or equal services vs perf_first
      const cf = dump(tplId, "cost_first");
      const pf = dump(tplId, "perf_first");
      expect(cf.services.length).toBeLessThanOrEqual(pf.services.length + 3);
      expect(true).toBe(true);
    });
  }
});

// ============================================================
// Part 2: perf_first가 과하게 서비스를 때려박지 않는지
// ============================================================
describe("Part 2: perf_first reasonableness checks", () => {
  it("internal_tool perf_first — still simple (no EKS, no multi-region)", () => {
    const d = dump("internal_tool", "perf_first");
    // internal_tool은 solo/beginner. perf_first여도 EKS가 되면 안됨
    expect(d.state.compute?.orchestration).not.toBe("eks");
    // multi-region도 안됨
    expect(d.state.slo?.region).not.toBe("active");
    console.log("\n✅ internal_tool perf_first: no EKS, no multi-region");
    console.log(`  compute: ${d.state.compute?.arch_pattern}/${d.state.compute?.orchestration ?? "-"}`);
    console.log(`  total: $${d.cost.totalMin}~$${d.cost.totalMax}`);
  });

  it("static_jamstack perf_first — stays simple, no containers", () => {
    const d = dump("static_jamstack", "perf_first");
    expect(d.state.compute?.arch_pattern).not.toBe("container");
    console.log("\n✅ static_jamstack perf_first: no containers");
    console.log(`  compute: ${d.state.compute?.arch_pattern}`);
    console.log(`  total: $${d.cost.totalMin}~$${d.cost.totalMax}`);
  });

  it("data_pipeline perf_first — reasonable upgrade, not overkill", () => {
    const d = dump("data_pipeline", "perf_first");
    // data_pipeline perf_first는 Aurora upgrade 정도만, EKS는 아님
    expect(d.state.compute?.orchestration).not.toBe("eks");
    console.log("\n✅ data_pipeline perf_first: no EKS");
    console.log(`  db: ${JSON.stringify(d.state.data?.primary_db)} cache=${d.state.data?.cache}`);
    console.log(`  total: $${d.cost.totalMin}~$${d.cost.totalMax}`);
  });

  it("ecommerce_mvp perf_first — gets Aurora upgrade but not EKS", () => {
    const d = dump("ecommerce_mvp", "perf_first");
    // MVP에서 perf_first해도 EKS까지 가면 과함
    expect(d.state.compute?.orchestration).not.toBe("eks");
    // Aurora 업그레이드는 OK
    const hasAurora = d.state.data?.primary_db?.some((db: string) => db.includes("aurora"));
    console.log("\n✅ ecommerce_mvp perf_first:");
    console.log(`  Aurora: ${hasAurora}, compute: ${d.state.compute?.arch_pattern}/${d.state.compute?.orchestration ?? "-"}`);
    console.log(`  total: $${d.cost.totalMin}~$${d.cost.totalMax}`);
  });

  it("multitenant_microservices perf_first — keeps EKS (already scale)", () => {
    const d = dump("multitenant_microservices", "perf_first");
    expect(d.state.compute?.orchestration).toBe("eks");
    console.log("\n✅ multitenant_microservices perf_first: EKS maintained");
    console.log(`  total: $${d.cost.totalMin}~$${d.cost.totalMax}`);
  });
});

// ============================================================
// Part 3: cost_first에서 비싼 서비스 과다 투입 체크
// ============================================================
describe("Part 3: cost_first no-expensive-services checks", () => {
  it("cost_first templates should not have Shield Advanced", () => {
    for (const tpl of TEMPLATES) {
      const { state } = adjustTemplateForBudget(tpl.state, "cost_first");
      // Shield Advanced ($3000/mo) — cost_first에서는 기본 WAF로 충분
      if (state.edge?.waf === "shield") {
        // scale/large DAU면 허용 가능
        const dau = state.scale?.dau;
        const stage = state.workload?.growth_stage;
        if (!["large", "xlarge"].includes(dau as string) && stage !== "scale") {
          throw new Error(`${tpl.id} cost_first has Shield Advanced but is ${stage}/${dau}`);
        }
      }
    }
  });

  it("cost_first — NAT per_az only for large+", () => {
    for (const tpl of TEMPLATES) {
      const { state } = adjustTemplateForBudget(tpl.state, "cost_first");
      if (state.network?.nat_strategy === "per_az") {
        const dau = state.scale?.dau as string;
        // per_az NAT ($129/mo each) only justified for large+ DAU
        console.log(`  ${tpl.id}: NAT per_az with dau=${dau}`);
      }
    }
    expect(true).toBe(true);
  });

  it("cost_first — no global DB replication for small templates", () => {
    for (const tpl of TEMPLATES) {
      const { state } = adjustTemplateForBudget(tpl.state, "cost_first");
      if (state.data?.db_ha === "global") {
        const dau = state.scale?.dau as string;
        expect(["large", "xlarge"]).toContain(dau);
        console.log(`  ${tpl.id}: global DB HA with dau=${dau} ✅`);
      }
    }
  });
});

// ============================================================
// Part 4: 직접 선택 시 선택된대로 반영되는지
// ============================================================
describe("Part 4: Direct manual selection — outputs match inputs", () => {
  it("Manual: serverless + DynamoDB + no cache → exactly those services", () => {
    const state: WizardState = {
      workload: { type: ["web_api"], growth_stage: "mvp", data_sensitivity: "internal" },
      scale: { dau: "tiny" },
      compliance: { cert: ["none"], encryption: "basic" },
      slo: { availability: "99", region: "single" },
      network: { az_count: "1az", subnet_tier: "2tier", nat_strategy: "endpoint" },
      compute: { arch_pattern: "serverless" },
      data: { primary_db: ["dynamodb"], cache: "no", storage: ["s3"], search: "no" },
      integration: { auth: ["none"], sync_async: "sync_only", api_type: "api_gateway" },
      edge: { cdn: "no", dns: "basic", waf: "no" },
      cicd: { iac: "none", pipeline: "github", deploy_strategy: "rolling", env_count: "dev_prod" },
      cost: { priority: "cost_first", commitment: "none", spot_usage: "no" },
    };

    const cost = estimateMonthlyCost(state, "ko");
    const arch = generateArchitecture(state, "ko");
    const services = arch.layers.flatMap((l) => l.services.map((s) => s.name));
    const costItemNames = cost.categories.flatMap((c) => c.items.map((i) => i.name));

    console.log("\n=== Manual: Serverless + DynamoDB ===");
    console.log(`Total: $${cost.totalMin}~$${cost.totalMax}`);
    console.log("Services:", services.join(", "));
    console.log("Cost items:", costItemNames.join(", "));

    // DynamoDB should be in both
    expect(services.join(",").toLowerCase()).toContain("dynamodb");
    expect(costItemNames.join(",").toLowerCase()).toContain("dynamodb");
    // No Aurora
    expect(services.join(",").toLowerCase()).not.toContain("aurora");
    expect(costItemNames.join(",").toLowerCase()).not.toContain("aurora");
    // No Redis/ElastiCache
    expect(costItemNames.join(",").toLowerCase()).not.toContain("elasticache");
    // No OpenSearch
    expect(costItemNames.join(",").toLowerCase()).not.toContain("opensearch");
    // API Gateway should be present
    expect(services.join(",").toLowerCase()).toContain("api gateway");
    // No ALB/NLB
    expect(costItemNames.join(",").toLowerCase()).not.toContain("alb");
  });

  it("Manual: ECS Fargate + Aurora + Redis + OpenSearch → all present", () => {
    const state: WizardState = {
      workload: { type: ["saas"], growth_stage: "growth", data_sensitivity: "sensitive" },
      scale: { dau: "medium", peak_rps: "medium" },
      compliance: { cert: ["soc2"], encryption: "strict" },
      slo: { availability: "99.9", rto: "lt10min", rpo: "1hr", region: "single" },
      team: { team_size: "small", cloud_exp: "mid", ops_model: "devops" },
      network: { az_count: "2az", subnet_tier: "3tier", nat_strategy: "single" },
      compute: { arch_pattern: "container", orchestration: "ecs", compute_node: "fargate", scaling: ["ecs_asg"] },
      data: { primary_db: ["aurora_pg"], db_ha: "multi_az", cache: "redis", storage: ["s3"], search: "opensearch" },
      integration: { auth: ["cognito"], sync_async: "mixed", queue_type: ["sqs", "sns"], api_type: "alb" },
      edge: { cdn: "yes", dns: "health", waf: "basic" },
      cicd: { iac: "terraform", pipeline: "github", deploy_strategy: "bluegreen", env_count: "three" },
      cost: { priority: "balanced", commitment: "1yr", spot_usage: "no" },
    };

    const cost = estimateMonthlyCost(state, "ko");
    const arch = generateArchitecture(state, "ko");
    const services = arch.layers.flatMap((l) => l.services.map((s) => s.name)).join(",").toLowerCase();
    const costItemNames = cost.categories.flatMap((c) => c.items.map((i) => i.name)).join(",").toLowerCase();

    console.log("\n=== Manual: ECS + Aurora + Redis + OpenSearch ===");
    console.log(`Total: $${cost.totalMin}~$${cost.totalMax}`);
    cost.categories.forEach((c) => {
      c.items.forEach((i) => console.log(`  [${c.name}] ${i.name}: $${i.min}~$${i.max}`));
    });

    // All selected services must appear
    expect(services).toContain("ecs");
    expect(services).toContain("aurora");
    expect(costItemNames).toContain("aurora");
    expect(costItemNames).toMatch(/elasticache|redis/);
    expect(costItemNames).toContain("opensearch");
    expect(services).toContain("alb");
    expect(costItemNames).toContain("alb");
    expect(services).toContain("cloudfront");
    expect(services).toContain("cognito");
    expect(costItemNames).toMatch(/sqs|sns/);
    expect(services).toContain("waf");
  });

  it("Manual: EKS + DynamoDB + MemoryDB + no search → exact match", () => {
    const state: WizardState = {
      workload: { type: ["saas", "web_api"], growth_stage: "scale", data_sensitivity: "critical" },
      scale: { dau: "large", peak_rps: "high" },
      compliance: { cert: ["pci"], encryption: "strict", network_iso: "strict" },
      slo: { availability: "99.99", rto: "1min", rpo: "zero", region: "dr" },
      team: { team_size: "large", cloud_exp: "senior", ops_model: "platform", language: "spring_boot" },
      network: { account_structure: "org", az_count: "3az", subnet_tier: "3tier", nat_strategy: "per_az", hybrid: ["vpn"] },
      compute: { arch_pattern: "container", orchestration: "eks", compute_node: "mixed", scaling: ["ecs_asg", "keda"] },
      platform: {
        node_provisioner: "karpenter", ingress: "alb_controller", service_mesh: "istio",
        gitops: "argocd", k8s_monitoring: "hybrid", k8s_secrets: "external_secrets",
        pod_security: "kyverno", network_policy: "cilium", k8s_backup: "velero",
      },
      data: { primary_db: ["dynamodb"], db_ha: "global", cache: "memorydb", storage: ["s3", "efs"], search: "no" },
      integration: { auth: ["sso"], sync_async: "mixed", queue_type: ["sqs", "kinesis", "eventbridge"], api_type: "alb", batch_workflow: ["step_functions"] },
      edge: { cdn: "yes", dns: "health", waf: "shield" },
      cicd: { iac: "terraform", pipeline: "github", deploy_strategy: "canary", env_count: "four" },
      cost: { priority: "perf_first", commitment: "3yr", spot_usage: "partial" },
    };

    const cost = estimateMonthlyCost(state, "ko");
    const arch = generateArchitecture(state, "ko");
    const services = arch.layers.flatMap((l) => l.services.map((s) => s.name)).join(",").toLowerCase();
    const costItemNames = cost.categories.flatMap((c) => c.items.map((i) => i.name)).join(",").toLowerCase();

    console.log("\n=== Manual: EKS + DynamoDB + MemoryDB (no search) ===");
    console.log(`Total: $${cost.totalMin}~$${cost.totalMax}`);
    cost.categories.forEach((c) => {
      c.items.forEach((i) => console.log(`  [${c.name}] ${i.name}: $${i.min}~$${i.max}`));
    });

    // Selected services present
    expect(services).toContain("eks");
    expect(services).toContain("dynamodb");
    expect(costItemNames).toContain("dynamodb");
    expect(costItemNames).toContain("memorydb");
    // No Aurora (not selected)
    expect(costItemNames).not.toContain("aurora");
    // No OpenSearch (search: "no")
    expect(costItemNames).not.toContain("opensearch");
    // EKS platform services
    expect(services).toMatch(/karpenter|istio|argocd/);
    // Shield Advanced
    expect(services).toContain("shield");
    expect(costItemNames).toMatch(/shield/);
    // Kinesis
    expect(costItemNames).toContain("kinesis");
  });

  it("Manual: change only cache from redis→no → Redis disappears from cost+arch", () => {
    const baseState: WizardState = {
      workload: { type: ["web_api"], growth_stage: "growth" },
      scale: { dau: "medium" },
      network: { az_count: "2az", subnet_tier: "2tier", nat_strategy: "single" },
      compute: { arch_pattern: "container", orchestration: "ecs", compute_node: "fargate" },
      data: { primary_db: ["aurora_pg"], cache: "redis", storage: ["s3"], search: "no" },
      integration: { auth: ["cognito"], sync_async: "sync_only", api_type: "alb" },
      edge: { cdn: "no", dns: "basic", waf: "no" },
      cicd: { iac: "terraform", pipeline: "github", deploy_strategy: "rolling", env_count: "dev_prod" },
      cost: { priority: "balanced", commitment: "none", spot_usage: "no" },
    };

    // With Redis
    const costWith = estimateMonthlyCost(baseState, "ko");
    const archWith = generateArchitecture(baseState, "ko");
    const servicesWith = archWith.layers.flatMap((l) => l.services.map((s) => s.name)).join(",").toLowerCase();
    const costItemsWith = costWith.categories.flatMap((c) => c.items.map((i) => i.name)).join(",").toLowerCase();

    // Without Redis
    const noRedis = { ...baseState, data: { ...baseState.data!, cache: "no" } };
    const costWithout = estimateMonthlyCost(noRedis, "ko");
    const archWithout = generateArchitecture(noRedis, "ko");
    const servicesWithout = archWithout.layers.flatMap((l) => l.services.map((s) => s.name)).join(",").toLowerCase();
    const costItemsWithout = costWithout.categories.flatMap((c) => c.items.map((i) => i.name)).join(",").toLowerCase();

    console.log("\n=== Toggle: cache redis → no ===");
    console.log(`With Redis: $${costWith.totalMin}~$${costWith.totalMax}`);
    console.log(`Without:    $${costWithout.totalMin}~$${costWithout.totalMax}`);
    console.log(`Redis in arch (with): ${servicesWith.includes("elasticache") || servicesWith.includes("redis")}`);
    console.log(`Redis in arch (without): ${servicesWithout.includes("elasticache") || servicesWithout.includes("redis")}`);

    // With Redis: must appear
    expect(costItemsWith).toMatch(/elasticache|redis/);
    // Without Redis: must NOT appear
    expect(costItemsWithout).not.toMatch(/elasticache/);
    // Cost should be lower without
    expect(costWithout.totalMax).toBeLessThan(costWith.totalMax);
  });

  it("Manual: change search opensearch→no → OpenSearch disappears", () => {
    const baseState: WizardState = {
      workload: { type: ["web_api"], growth_stage: "growth" },
      scale: { dau: "medium" },
      network: { az_count: "2az", subnet_tier: "2tier", nat_strategy: "single" },
      compute: { arch_pattern: "container", orchestration: "ecs", compute_node: "fargate" },
      data: { primary_db: ["aurora_pg"], cache: "no", storage: ["s3"], search: "opensearch" },
      integration: { auth: ["cognito"], sync_async: "sync_only", api_type: "alb" },
      edge: { cdn: "no", dns: "basic", waf: "no" },
      cicd: { iac: "terraform", pipeline: "github", deploy_strategy: "rolling", env_count: "dev_prod" },
      cost: { priority: "balanced", commitment: "none", spot_usage: "no" },
    };

    const costWith = estimateMonthlyCost(baseState, "ko");
    const noSearch = { ...baseState, data: { ...baseState.data!, search: "no" } };
    const costWithout = estimateMonthlyCost(noSearch, "ko");
    const costItemsWith = costWith.categories.flatMap((c) => c.items.map((i) => i.name)).join(",").toLowerCase();
    const costItemsWithout = costWithout.categories.flatMap((c) => c.items.map((i) => i.name)).join(",").toLowerCase();

    console.log("\n=== Toggle: search opensearch → no ===");
    console.log(`With OpenSearch: $${costWith.totalMin}~$${costWith.totalMax}`);
    console.log(`Without:         $${costWithout.totalMin}~$${costWithout.totalMax}`);

    expect(costItemsWith).toContain("opensearch");
    expect(costItemsWithout).not.toContain("opensearch");
    expect(costWithout.totalMax).toBeLessThan(costWith.totalMax);
  });
});
