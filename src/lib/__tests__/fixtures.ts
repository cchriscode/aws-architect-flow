/**
 * Test fixtures: re-export template states + edge-case states
 * for snapshot testing of all 9 core lib functions.
 */
import { TEMPLATES } from "@/data/templates";
import type { WizardState } from "@/lib/types";

// Re-export the 8 template states by name
export const ECOMMERCE_MVP = TEMPLATES.find((t) => t.id === "ecommerce_mvp")!.state;
export const B2B_SAAS = TEMPLATES.find((t) => t.id === "b2b_saas")!.state;
export const INTERNAL_TOOL = TEMPLATES.find((t) => t.id === "internal_tool")!.state;
export const REALTIME_CHAT = TEMPLATES.find((t) => t.id === "realtime_chat")!.state;
export const DATA_PIPELINE = TEMPLATES.find((t) => t.id === "data_pipeline")!.state;
export const GENERIC_WEB_API = TEMPLATES.find((t) => t.id === "generic_web_api")!.state;
export const TICKETING = TEMPLATES.find((t) => t.id === "ticketing")!.state;
export const IOT_PLATFORM = TEMPLATES.find((t) => t.id === "iot_platform")!.state;

// Edge-case states
export const MINIMAL_STATE: WizardState = {
  workload: { type: [] },
  cost: { commitment: "none", spot_usage: "no" },
};

export const SERVERLESS_STATE: WizardState = {
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

export const EKS_FULL_STATE: WizardState = {
  workload: {
    type: ["saas", "web_api"],
    growth_stage: "scale",
    business_model: "saas_license",
    data_sensitivity: "critical",
    user_type: ["b2b", "global"],
  },
  scale: { dau: "xlarge", peak_rps: "ultra", traffic_pattern: ["steady"], data_volume: "pb" },
  compliance: { cert: ["pci", "hipaa"], encryption: "strict", network_iso: "strict" },
  slo: { availability: "99.99", rto: "1min", rpo: "zero", region: "active" },
  team: { team_size: "large", cloud_exp: "senior", ops_model: "platform", language: "spring_boot" },
  network: {
    account_structure: "org",
    az_count: "3az",
    subnet_tier: "3tier",
    nat_strategy: "per_az",
    hybrid: ["dx", "vpn"],
  },
  compute: {
    arch_pattern: "container",
    orchestration: "eks",
    compute_node: "mixed",
    scaling: ["ecs_asg", "keda"],
  },
  platform: {
    node_provisioner: "karpenter",
    ingress: "alb_controller",
    service_mesh: "istio",
    gitops: "argocd",
    k8s_monitoring: "hybrid",
    k8s_secrets: "external_secrets",
    pod_security: "kyverno",
    network_policy: "cilium",
    k8s_backup: "velero",
  },
  data: {
    primary_db: ["aurora_pg", "dynamodb"],
    db_ha: "global",
    cache: "redis",
    storage: ["s3", "efs"],
    search: "opensearch",
  },
  integration: {
    auth: ["sso"],
    sync_async: "mixed",
    queue_type: ["sqs", "sns", "kinesis", "eventbridge"],
    api_type: "alb",
    batch_workflow: ["step_functions", "eventbridge_sch"],
  },
  appstack: {
    api_gateway_impl: "spring_gateway",
    protocol: "graphql",
    service_discovery: "k8s_dns",
  },
  edge: { cdn: "yes", dns: "health", waf: "shield" },
  cicd: {
    iac: "terraform",
    pipeline: "github",
    deploy_strategy: "canary",
    env_count: "four",
  },
  cost: { priority: "perf_first", commitment: "3yr", spot_usage: "partial" },
};

export const COMPLIANCE_STATE: WizardState = {
  workload: {
    type: ["ecommerce"],
    growth_stage: "mature",
    business_model: "transaction",
    data_sensitivity: "critical",
    user_type: ["b2c"],
  },
  scale: { dau: "large", peak_rps: "high", traffic_pattern: ["spike"], data_volume: "tb" },
  compliance: { cert: ["pci", "sox"], encryption: "strict", network_iso: "strict" },
  slo: { availability: "99.99", rto: "lt10min", rpo: "15min", region: "dr" },
  team: { team_size: "medium", cloud_exp: "senior", ops_model: "devops", language: "node_express" },
  network: {
    account_structure: "org",
    az_count: "3az",
    subnet_tier: "3tier",
    nat_strategy: "per_az",
    hybrid: ["no"],
  },
  compute: {
    arch_pattern: "container",
    orchestration: "ecs",
    compute_node: "fargate",
    scaling: ["ecs_asg"],
  },
  data: {
    primary_db: ["aurora_pg"],
    db_ha: "multi_az_read",
    cache: "redis",
    storage: ["s3"],
    search: "opensearch",
  },
  integration: {
    auth: ["cognito"],
    sync_async: "mixed",
    queue_type: ["sqs", "sns"],
    api_type: "alb",
    batch_workflow: ["step_functions"],
  },
  edge: { cdn: "yes", dns: "health", waf: "bot" },
  cicd: {
    iac: "terraform",
    pipeline: "github",
    deploy_strategy: "bluegreen",
    env_count: "three",
    monitoring: ["cloudwatch", "xray", "datadog"],
  },
  cost: { priority: "balanced", commitment: "1yr", spot_usage: "no" },
};

/** All fixtures as named entries for iteration */
export const ALL_FIXTURES: [string, WizardState][] = [
  ["ecommerce_mvp", ECOMMERCE_MVP],
  ["b2b_saas", B2B_SAAS],
  ["internal_tool", INTERNAL_TOOL],
  ["realtime_chat", REALTIME_CHAT],
  ["data_pipeline", DATA_PIPELINE],
  ["generic_web_api", GENERIC_WEB_API],
  ["ticketing", TICKETING],
  ["iot_platform", IOT_PLATFORM],
  ["minimal", MINIMAL_STATE],
  ["serverless", SERVERLESS_STATE],
  ["eks_full", EKS_FULL_STATE],
  ["compliance", COMPLIANCE_STATE],
];
