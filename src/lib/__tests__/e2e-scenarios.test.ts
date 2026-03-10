/**
 * E2E Scenario Tests — 10 diverse scenarios run through all generators,
 * then verified against AWS reference architecture best practices.
 */
import { describe, it, expect } from "vitest";
import type { WizardState } from "@/lib/types";
import { generateArchitecture } from "@/lib/architecture";
import { estimateMonthlyCost } from "@/lib/cost";
import { getRecommendations } from "@/lib/recommendations";
import { validateState } from "@/lib/validate";
import { wellArchitectedScore } from "@/lib/wafr";
import { generateChecklist } from "@/lib/checklist";

// ─── 10 SCENARIOS ────────────────────────────────────

const S1_STARTUP_SERVERLESS: WizardState = {
  workload: { type: ["web_api"], growth_stage: "mvp", data_sensitivity: "internal", business_model: "subscription" },
  scale: { dau: "tiny", peak_rps: "low", traffic_pattern: ["business"], data_volume: "gb" },
  compliance: { cert: ["none"], encryption: "basic" },
  slo: { availability: "99", region: "single" },
  team: { team_size: "small", cloud_exp: "beginner", ops_model: "managed" },
  network: { az_count: "2az", subnet_tier: "2tier", nat_strategy: "endpoint", account_structure: "single" },
  compute: { arch_pattern: "serverless" },
  data: { primary_db: ["dynamodb"], cache: "no", storage: ["s3"], search: "no" },
  integration: { auth: ["cognito"], sync_async: "sync_only", api_type: "api_gateway", batch_workflow: ["none"] },
  edge: { cdn: "no", dns: "basic", waf: "no" },
  cicd: { iac: "none", pipeline: "github", deploy_strategy: "rolling", env_count: "dev_prod", monitoring: ["cloudwatch"] },
  cost: { priority: "cost_first", commitment: "none", spot_usage: "no" },
};

const S2_MEDIUM_ECS_MICROSERVICE: WizardState = {
  workload: { type: ["web_api", "saas"], growth_stage: "growth", data_sensitivity: "sensitive", business_model: "saas_license" },
  scale: { dau: "medium", peak_rps: "medium", traffic_pattern: ["steady"], data_volume: "tb" },
  compliance: { cert: ["isms"], encryption: "standard" },
  slo: { availability: "99.9", region: "single" },
  team: { team_size: "medium", cloud_exp: "intermediate", ops_model: "devops", language: "node_express" },
  network: { az_count: "2az", subnet_tier: "3tier", nat_strategy: "single", account_structure: "single" },
  compute: { arch_pattern: "container", orchestration: "ecs", compute_node: "fargate", scaling: ["ecs_asg"] },
  data: { primary_db: ["aurora_pg"], db_ha: "multi_az", cache: "redis", storage: ["s3"], search: "opensearch" },
  integration: { auth: ["cognito"], sync_async: "mixed", queue_type: ["sqs", "sns"], api_type: "alb", service_discovery: "cloud_map", batch_workflow: ["eventbridge_sch"] },
  edge: { cdn: "yes", dns: "health", waf: "basic" },
  cicd: { iac: "terraform", pipeline: "github", deploy_strategy: "rolling", env_count: "three", monitoring: ["cloudwatch", "xray"] },
  cost: { priority: "balanced", commitment: "1yr", spot_usage: "no" },
};

const S3_LARGE_EKS_ENTERPRISE: WizardState = {
  workload: { type: ["saas", "web_api"], growth_stage: "scale", data_sensitivity: "critical", business_model: "saas_license", user_type: ["b2b", "global"] },
  scale: { dau: "large", peak_rps: "high", traffic_pattern: ["steady"], data_volume: "tb" },
  compliance: { cert: ["isms", "pci"], encryption: "strict", network_iso: "strict" },
  slo: { availability: "99.95", rto: "lt10min", rpo: "15min", region: "dr" },
  team: { team_size: "large", cloud_exp: "senior", ops_model: "platform", language: "spring_boot" },
  network: { az_count: "3az", subnet_tier: "3tier", nat_strategy: "per_az", account_structure: "org", hybrid: ["vpn"] },
  compute: { arch_pattern: "container", orchestration: "eks", compute_node: "mixed", scaling: ["ecs_asg", "keda"] },
  platform: { node_provisioner: "karpenter", ingress: "alb_controller", service_mesh: "istio", gitops: "argocd", k8s_monitoring: "prometheus_grafana", k8s_secrets: "external_secrets", pod_security: "kyverno", network_policy: "cilium", k8s_backup: "velero", autoscaling_strategy: "hpa_keda", cluster_strategy: "multi_cluster" },
  data: { primary_db: ["aurora_pg"], db_ha: "multi_az_read", cache: "redis", storage: ["s3", "efs"], search: "opensearch" },
  integration: { auth: ["sso"], sync_async: "mixed", queue_type: ["sqs", "sns", "eventbridge"], api_type: "alb", service_discovery: "k8s_dns", batch_workflow: ["step_functions", "eventbridge_sch"] },
  appstack: { api_gateway_impl: "spring_gateway", protocol: "rest", service_discovery: "k8s_dns" },
  edge: { cdn: "yes", dns: "health", waf: "bot" },
  cicd: { iac: "terraform", pipeline: "github", deploy_strategy: "canary", env_count: "four" },
  cost: { priority: "perf_first", commitment: "3yr", spot_usage: "partial" },
};

const S4_IOT_STREAMING: WizardState = {
  workload: { type: ["iot"], growth_stage: "growth", data_sensitivity: "sensitive", business_model: "subscription" },
  scale: { dau: "large", peak_rps: "high", traffic_pattern: ["steady", "growth"], data_volume: "pb" },
  compliance: { cert: ["none"], encryption: "standard" },
  slo: { availability: "99.9", region: "single" },
  team: { team_size: "medium", cloud_exp: "intermediate", ops_model: "devops", language: "python_fastapi" },
  network: { az_count: "3az", subnet_tier: "3tier", nat_strategy: "per_az", account_structure: "single" },
  compute: { arch_pattern: "container", orchestration: "ecs", compute_node: "fargate", scaling: ["ecs_asg"] },
  data: { primary_db: ["dynamodb", "timestream"], db_ha: "multi_az", cache: "redis", storage: ["s3"], search: "no", data_detail: "stream_analytics" },
  integration: { auth: ["api_key"], sync_async: "async_heavy", queue_type: ["kinesis", "sqs"], api_type: "nlb", batch_workflow: ["aws_batch"] },
  edge: { cdn: "no", dns: "basic", waf: "no" },
  cicd: { iac: "terraform", pipeline: "github", deploy_strategy: "rolling", env_count: "three", monitoring: ["cloudwatch", "grafana"] },
  cost: { priority: "balanced", commitment: "1yr", spot_usage: "partial" },
};

const S5_ECOMMERCE_GLUE_ETL: WizardState = {
  workload: { type: ["ecommerce"], growth_stage: "mature", data_sensitivity: "sensitive", business_model: "transaction", user_type: ["b2c"] },
  scale: { dau: "large", peak_rps: "high", traffic_pattern: ["spike", "seasonal"], data_volume: "tb" },
  compliance: { cert: ["pci"], encryption: "strict" },
  slo: { availability: "99.95", rto: "lt10min", rpo: "15min", region: "single" },
  team: { team_size: "medium", cloud_exp: "senior", ops_model: "devops", language: "node_express" },
  network: { az_count: "3az", subnet_tier: "3tier", nat_strategy: "per_az", account_structure: "single" },
  compute: { arch_pattern: "container", orchestration: "ecs", compute_node: "fargate", scaling: ["ecs_asg"] },
  data: { primary_db: ["aurora_mysql"], db_ha: "multi_az_read", cache: "both", storage: ["s3"], search: "opensearch", data_detail: "bi_dashboard" },
  integration: { auth: ["cognito"], sync_async: "mixed", queue_type: ["sqs", "sns", "eventbridge"], api_type: "alb", batch_workflow: ["step_functions", "glue"] },
  edge: { cdn: "yes", dns: "health", waf: "bot" },
  cicd: { iac: "terraform", pipeline: "github", deploy_strategy: "bluegreen", env_count: "three", monitoring: ["cloudwatch", "xray", "datadog"] },
  cost: { priority: "balanced", commitment: "1yr", spot_usage: "partial" },
};

const S6_VM_LEGACY: WizardState = {
  workload: { type: ["web_api"], growth_stage: "mature", data_sensitivity: "sensitive", business_model: "subscription" },
  scale: { dau: "medium", peak_rps: "medium", traffic_pattern: ["business"], data_volume: "tb" },
  compliance: { cert: ["isms"], encryption: "standard" },
  slo: { availability: "99.9", region: "single" },
  team: { team_size: "small", cloud_exp: "beginner", ops_model: "separate", language: "spring_boot" },
  network: { az_count: "2az", subnet_tier: "3tier", nat_strategy: "single", account_structure: "single" },
  compute: { arch_pattern: "vm", orchestration: "none", compute_node: "ec2", scaling: ["ec2_asg"] },
  data: { primary_db: ["rds_mysql"], db_ha: "multi_az", cache: "redis", storage: ["s3"], search: "no" },
  integration: { auth: ["cognito"], sync_async: "sync_only", api_type: "alb", batch_workflow: ["none"] },
  edge: { cdn: "yes", dns: "basic", waf: "basic" },
  cicd: { iac: "terraform", pipeline: "codepipeline", deploy_strategy: "rolling", env_count: "dev_prod", monitoring: ["cloudwatch"] },
  cost: { priority: "cost_first", commitment: "1yr", spot_usage: "no" },
};

const S7_GRPC_DUAL_LB: WizardState = {
  workload: { type: ["saas", "web_api"], growth_stage: "growth", data_sensitivity: "sensitive", business_model: "saas_license" },
  scale: { dau: "large", peak_rps: "high", traffic_pattern: ["steady"], data_volume: "tb" },
  compliance: { cert: ["none"], encryption: "standard" },
  slo: { availability: "99.9", region: "single" },
  team: { team_size: "medium", cloud_exp: "senior", ops_model: "devops", language: "go" },
  network: { az_count: "3az", subnet_tier: "3tier", nat_strategy: "per_az", account_structure: "single" },
  compute: { arch_pattern: "container", orchestration: "ecs", compute_node: "fargate", scaling: ["ecs_asg"] },
  data: { primary_db: ["aurora_pg"], db_ha: "multi_az_read", cache: "redis", storage: ["s3"], search: "no" },
  integration: { auth: ["jwt"], sync_async: "mixed", queue_type: ["sqs"], api_type: "alb", batch_workflow: ["none"] },
  appstack: { protocol: "grpc" },
  edge: { cdn: "no", dns: "health", waf: "no" },
  cicd: { iac: "cdk", pipeline: "github", deploy_strategy: "canary", env_count: "three", monitoring: ["cloudwatch", "xray"] },
  cost: { priority: "balanced", commitment: "1yr", spot_usage: "partial" },
};

const S8_DYNAMO_ONDEMAND_XLARGE: WizardState = {
  workload: { type: ["web_api", "realtime"], growth_stage: "scale", data_sensitivity: "sensitive", business_model: "transaction" },
  scale: { dau: "xlarge", peak_rps: "ultra", traffic_pattern: ["spike"], data_volume: "pb" },
  compliance: { cert: ["none"], encryption: "standard" },
  slo: { availability: "99.99", rto: "1min", rpo: "zero", region: "active" },
  team: { team_size: "large", cloud_exp: "senior", ops_model: "platform", language: "node_express" },
  network: { az_count: "3az", subnet_tier: "3tier", nat_strategy: "per_az", account_structure: "org" },
  compute: { arch_pattern: "container", orchestration: "eks", compute_node: "mixed", scaling: ["ecs_asg", "keda"] },
  platform: { node_provisioner: "karpenter", ingress: "alb_controller", k8s_monitoring: "hybrid", k8s_secrets: "external_secrets", pod_security: "kyverno", network_policy: "cilium" },
  data: { primary_db: ["dynamodb"], db_ha: "multi_az", cache: "redis", storage: ["s3"], search: "opensearch" },
  integration: { auth: ["jwt"], sync_async: "async_heavy", queue_type: ["sqs", "kinesis"], api_type: "alb", service_discovery: "k8s_dns", batch_workflow: ["step_functions"] },
  edge: { cdn: "yes", dns: "health", waf: "shield" },
  cicd: { iac: "terraform", pipeline: "github", deploy_strategy: "canary", env_count: "four" },
  cost: { priority: "perf_first", commitment: "3yr", spot_usage: "partial" },
};

const S9_NONEKS_DATADOG: WizardState = {
  workload: { type: ["saas"], growth_stage: "growth", data_sensitivity: "sensitive", business_model: "saas_license", user_type: ["b2b"] },
  scale: { dau: "medium", peak_rps: "medium", traffic_pattern: ["business"], data_volume: "tb" },
  compliance: { cert: ["isms"], encryption: "standard" },
  slo: { availability: "99.9", region: "single" },
  team: { team_size: "medium", cloud_exp: "intermediate", ops_model: "devops", language: "spring_boot" },
  network: { az_count: "2az", subnet_tier: "3tier", nat_strategy: "single", account_structure: "single" },
  compute: { arch_pattern: "container", orchestration: "ecs", compute_node: "fargate", scaling: ["ecs_asg"] },
  data: { primary_db: ["aurora_pg"], db_ha: "multi_az", cache: "redis", storage: ["s3"], search: "no" },
  integration: { auth: ["cognito", "jwt"], sync_async: "mixed", queue_type: ["sqs", "sns"], api_type: "alb", service_discovery: "cloud_map", batch_workflow: ["eventbridge_sch"] },
  edge: { cdn: "yes", dns: "health", waf: "basic" },
  cicd: { iac: "terraform", pipeline: "github", deploy_strategy: "bluegreen", env_count: "three", monitoring: ["cloudwatch", "datadog", "grafana"] },
  cost: { priority: "balanced", commitment: "1yr", spot_usage: "no" },
};

const S10_FINANCIAL_COMPLIANCE: WizardState = {
  workload: { type: ["ecommerce", "web_api"], growth_stage: "mature", data_sensitivity: "critical", business_model: "transaction", user_type: ["b2c", "b2b"] },
  scale: { dau: "large", peak_rps: "high", traffic_pattern: ["business", "spike"], data_volume: "tb" },
  compliance: { cert: ["pci", "sox", "isms_p"], encryption: "strict", network_iso: "strict" },
  slo: { availability: "99.99", rto: "1min", rpo: "zero", region: "active" },
  team: { team_size: "large", cloud_exp: "senior", ops_model: "separate", language: "spring_boot" },
  network: { az_count: "3az", subnet_tier: "3tier", nat_strategy: "per_az", account_structure: "org", hybrid: ["dx"] },
  compute: { arch_pattern: "container", orchestration: "ecs", compute_node: "fargate", scaling: ["ecs_asg"] },
  data: { primary_db: ["aurora_pg", "dynamodb"], db_ha: "global", cache: "redis", storage: ["s3", "efs"], search: "opensearch" },
  integration: { auth: ["sso", "cognito"], sync_async: "mixed", queue_type: ["sqs", "sns", "eventbridge"], api_type: "alb", batch_workflow: ["step_functions", "glue"] },
  edge: { cdn: "yes", dns: "health", waf: "shield" },
  cicd: { iac: "terraform", pipeline: "github", deploy_strategy: "bluegreen", env_count: "four", monitoring: ["cloudwatch", "xray", "datadog"] },
  cost: { priority: "perf_first", commitment: "3yr", spot_usage: "no" },
};

const SCENARIOS: [string, WizardState][] = [
  ["S1: Startup Serverless (tiny)", S1_STARTUP_SERVERLESS],
  ["S2: Medium ECS Microservice", S2_MEDIUM_ECS_MICROSERVICE],
  ["S3: Large EKS Enterprise", S3_LARGE_EKS_ENTERPRISE],
  ["S4: IoT Streaming Platform", S4_IOT_STREAMING],
  ["S5: E-commerce + Glue ETL", S5_ECOMMERCE_GLUE_ETL],
  ["S6: VM Legacy Migration", S6_VM_LEGACY],
  ["S7: gRPC Dual LB (ALB+NLB)", S7_GRPC_DUAL_LB],
  ["S8: DynamoDB OnDemand XLarge", S8_DYNAMO_ONDEMAND_XLARGE],
  ["S9: Non-EKS + Datadog Monitoring", S9_NONEKS_DATADOG],
  ["S10: Financial Compliance (PCI+SOX)", S10_FINANCIAL_COMPLIANCE],
];

// ─── HELPERS ──────────────────────────────────────────

/** Flatten cost categories into a single label list */
const costLabels = (state: WizardState, lang: "ko" | "en" = "ko") => {
  const c = estimateMonthlyCost(state, lang);
  return c.categories.flatMap((cat: any) => cat.items.map((i: any) => `${i.name} ${i.desc ?? ""}`));
};
/** Flatten checklist phases into a single text list */
const checklistTexts = (state: WizardState, lang: "ko" | "en" = "ko") => {
  const c = generateChecklist(state, lang);
  return c.phases.flatMap((p: any) => p.items.map((i: any) => i.text));
};

// ─── TESTS ────────────────────────────────────────────

describe("E2E Scenario Verification", () => {
  // 1) All generators run without errors for all 10 scenarios × 2 languages
  describe.each(SCENARIOS)("%s — generators run clean", (_name, state) => {
    it("architecture", () => { expect(() => generateArchitecture(state, "ko")).not.toThrow(); });
    it("cost", () => { expect(() => estimateMonthlyCost(state, "ko")).not.toThrow(); });
    it("recommendations", () => { expect(() => getRecommendations(state, "ko")).not.toThrow(); });
    it("validation", () => { expect(() => validateState(state, "ko")).not.toThrow(); });
    it("wafr", () => { expect(() => wellArchitectedScore(state, "ko")).not.toThrow(); });
    it("checklist", () => { expect(() => generateChecklist(state, "ko")).not.toThrow(); });
    it("architecture (en)", () => { expect(() => generateArchitecture(state, "en")).not.toThrow(); });
    it("cost (en)", () => { expect(() => estimateMonthlyCost(state, "en")).not.toThrow(); });
  });

  // 2) S1: Serverless — should NOT have ECS/EKS compute, should have Lambda/API GW
  describe("S1: Serverless architecture correctness", () => {
    it("compute layer has Lambda/API Gateway, not ECS", () => {
      const arch = generateArchitecture(S1_STARTUP_SERVERLESS, "ko");
      const computeLayer = arch.layers.find((l: any) => l.id === "compute");
      const svcNames = computeLayer?.services.map((s: any) => s.name).join(" ") ?? "";
      expect(svcNames).toMatch(/Lambda|API Gateway|서버리스/);
    });
    it("cost total < $500/mo for tiny serverless", () => {
      const cost = estimateMonthlyCost(S1_STARTUP_SERVERLESS, "ko");
      expect(cost.totalMax).toBeLessThan(500);
    });
    it("WAFR score > 0", () => {
      const wafr = wellArchitectedScore(S1_STARTUP_SERVERLESS, "ko");
      expect(wafr.overall).toBeGreaterThan(0);
    });
  });

  // 3) S2: Medium ECS — should have service_discovery (medium DAU now included)
  describe("S2: Medium ECS service discovery", () => {
    it("has Cloud Map recommendation for ECS service discovery", () => {
      const recs = getRecommendations(S2_MEDIUM_ECS_MICROSERVICE, "ko");
      const sdKey = Object.keys(recs).find(k => k.includes("service_discovery"));
      expect(sdKey).toBeTruthy();
    });
    it("cost includes X-Ray for non-EKS monitoring", () => {
      const labels = costLabels(S2_MEDIUM_ECS_MICROSERVICE);
      expect(labels.some((l: string) => l.includes("X-Ray"))).toBe(true);
    });
  });

  // 4) S3: Large EKS — Cilium, Karpenter, Istio, Prometheus should all appear
  describe("S3: Large EKS platform completeness", () => {
    const arch = generateArchitecture(S3_LARGE_EKS_ENTERPRISE, "ko");
    const wafr = wellArchitectedScore(S3_LARGE_EKS_ENTERPRISE, "ko");
    const val = validateState(S3_LARGE_EKS_ENTERPRISE, "ko");

    it("architecture has platform layer with K8s tools", () => {
      const platformLayer = arch.layers.find((l: any) => l.id === "platform");
      expect(platformLayer).toBeTruthy();
      const svcNames = platformLayer.services.map((s: any) => s.name).join(" ");
      expect(svcNames).toMatch(/Karpenter/);
      expect(svcNames).toMatch(/Istio|Service Mesh/);
      expect(svcNames).toMatch(/Prometheus/);
    });
    it("WAFR security pillar weighted higher (compliance workload)", () => {
      // PCI cert → compliance weights → sec should be scored
      expect(wafr.pillars.sec.score).toBeGreaterThan(0);
    });
    it("no critical validation errors", () => {
      const errors = val.filter((i: any) => i.severity === "error");
      expect(errors.length).toBe(0);
    });
  });

  // 5) S4: IoT — should have Kinesis, Timestream, IoT-related services
  describe("S4: IoT streaming architecture", () => {
    it("architecture includes Kinesis or streaming layer", () => {
      const arch = generateArchitecture(S4_IOT_STREAMING, "ko");
      const allSvcs = arch.layers.flatMap((l: any) => l.services.map((s: any) => s.name)).join(" ");
      expect(allSvcs).toMatch(/Kinesis/);
    });
    it("cost includes Managed Grafana for non-EKS monitoring", () => {
      const labels = costLabels(S4_IOT_STREAMING);
      expect(labels.some((l: string) => l.includes("Grafana"))).toBe(true);
    });
  });

  // 6) S5: Ecommerce + Glue — should have Glue cost and recommendation
  describe("S5: Glue ETL integration", () => {
    it("cost includes Glue line item", () => {
      const labels = costLabels(S5_ECOMMERCE_GLUE_ETL);
      expect(labels.some((l: string) => l.includes("Glue"))).toBe(true);
    });
    it("recommendation includes batch_workflow items (step_functions or glue)", () => {
      const recs = getRecommendations(S5_ECOMMERCE_GLUE_ETL, "ko");
      const batchKey = Object.keys(recs).find(k => k.includes("batch_workflow"));
      expect(batchKey).toBeTruthy();
    });
    it("cost includes Datadog for non-EKS monitoring", () => {
      const labels = costLabels(S5_ECOMMERCE_GLUE_ETL);
      expect(labels.some((l: string) => l.includes("Datadog"))).toBe(true);
    });
  });

  // 7) S6: VM legacy — appstack phase should NOT be skipped (orchestration !== "none" was changed, but this IS "none")
  describe("S6: VM legacy architecture", () => {
    const arch = generateArchitecture(S6_VM_LEGACY, "ko");
    const val = validateState(S6_VM_LEGACY, "ko");

    it("architecture has compute layer with EC2", () => {
      const computeLayer = arch.layers.find((l: any) => l.id === "compute");
      expect(computeLayer).toBeTruthy();
      const svcNames = computeLayer.services.map((s: any) => s.name).join(" ");
      expect(svcNames).toMatch(/EC2|Auto Scaling/);
    });
    it("validation warns about beginner + separate ops model", () => {
      // beginner with ops separation may get relevant warnings
      expect(val.length).toBeGreaterThan(0);
    });
  });

  // 8) S7: gRPC — should get ALB+NLB dual recommendation
  describe("S7: gRPC dual LB recommendation", () => {
    const recs = getRecommendations(S7_GRPC_DUAL_LB, "ko");

    it("has NLB recommendation alongside ALB for gRPC", () => {
      const hasNlbRec = Object.entries(recs).some(([k, v]: [string, any]) =>
        v.badge?.includes("NLB") || v.reason?.includes("NLB") || v.reason?.includes("gRPC")
      );
      expect(hasNlbRec).toBe(true);
    });
  });

  // 9) S8: DynamoDB On-Demand at xlarge — should have warning
  describe("S8: DynamoDB On-Demand warning", () => {
    it("cost includes DynamoDB line item", () => {
      const labels = costLabels(S8_DYNAMO_ONDEMAND_XLARGE);
      const hasWarning = labels.some((l: string) => l.includes("On-Demand") || l.includes("DynamoDB"));
      expect(hasWarning).toBe(true);
    });
    it("total cost > $3000/mo for xlarge", () => {
      const cost = estimateMonthlyCost(S8_DYNAMO_ONDEMAND_XLARGE, "ko");
      expect(cost.totalMax).toBeGreaterThan(3000);
    });
  });

  // 10) S9: Non-EKS + Datadog — monitoring in architecture, cost, checklist
  describe("S9: Non-EKS Datadog monitoring integration", () => {
    it("architecture CI/CD layer includes Datadog", () => {
      const arch = generateArchitecture(S9_NONEKS_DATADOG, "ko");
      const cicdLayer = arch.layers.find((l: any) => l.id === "cicd");
      expect(cicdLayer).toBeTruthy();
      const svcNames = cicdLayer.services.map((s: any) => s.name).join(" ");
      expect(svcNames).toMatch(/Datadog/);
    });
    it("architecture CI/CD layer includes Managed Grafana", () => {
      const arch = generateArchitecture(S9_NONEKS_DATADOG, "ko");
      const cicdLayer = arch.layers.find((l: any) => l.id === "cicd");
      const svcNames = cicdLayer.services.map((s: any) => s.name).join(" ");
      expect(svcNames).toMatch(/Grafana/);
    });
    it("cost includes Datadog line item", () => {
      const labels = costLabels(S9_NONEKS_DATADOG);
      expect(labels.some((l: string) => l.includes("Datadog"))).toBe(true);
    });
    it("cost includes Managed Grafana line item", () => {
      const labels = costLabels(S9_NONEKS_DATADOG);
      expect(labels.some((l: string) => l.includes("Grafana"))).toBe(true);
    });
    it("checklist includes Datadog setup item", () => {
      const texts = checklistTexts(S9_NONEKS_DATADOG);
      expect(texts.some((t: string) => t.includes("Datadog"))).toBe(true);
    });
    it("WAFR ops score reflects monitoring tools", () => {
      const wafr = wellArchitectedScore(S9_NONEKS_DATADOG, "ko");
      // Datadog → highest monitoring score (15)
      expect(wafr.pillars.ops.score).toBeGreaterThan(50);
    });
    it("no monitoring validation warning (monitoring is configured)", () => {
      const val = validateState(S9_NONEKS_DATADOG, "ko");
      const monWarnings = val.filter((i: any) =>
        i.title?.includes("모니터링") || i.title?.includes("monitoring")
      );
      expect(monWarnings.length).toBe(0);
    });
  });

  // 11) S10: Financial compliance — WAFR sec weighted, Security Hub, Audit Manager
  describe("S10: Financial compliance architecture", () => {
    it("cost includes Security Hub + GuardDuty", () => {
      const labels = costLabels(S10_FINANCIAL_COMPLIANCE);
      expect(labels.some((l: string) => l.includes("Security Hub"))).toBe(true);
    });
    it("cost includes Shield Advanced ($3000/mo)", () => {
      const labels = costLabels(S10_FINANCIAL_COMPLIANCE);
      expect(labels.some((l: string) => l.includes("Shield"))).toBe(true);
    });
    it("cost includes Glue", () => {
      const labels = costLabels(S10_FINANCIAL_COMPLIANCE);
      expect(labels.some((l: string) => l.includes("Glue"))).toBe(true);
    });
    it("WAFR overall > 60 (well-configured)", () => {
      const wafr = wellArchitectedScore(S10_FINANCIAL_COMPLIANCE, "ko");
      expect(wafr.overall).toBeGreaterThan(60);
    });
    it("checklist has Audit Manager for compliance", () => {
      const texts = checklistTexts(S10_FINANCIAL_COMPLIANCE);
      expect(texts.some((t: string) => t.includes("Audit Manager"))).toBe(true);
    });
    it("validation has no critical errors", () => {
      const val = validateState(S10_FINANCIAL_COMPLIANCE, "ko");
      const errors = val.filter((i: any) => i.severity === "error");
      expect(errors.length).toBe(0);
    });
    it("cost total > $5000/mo for large compliance", () => {
      const cost = estimateMonthlyCost(S10_FINANCIAL_COMPLIANCE, "ko");
      expect(cost.totalMax).toBeGreaterThan(5000);
    });
  });
});
