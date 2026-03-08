/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Architecture, ArchService, WizardState } from "@/lib/types";

// ─── 1. Types & Shape Catalog ─────────────────────────────────────────

type PlacementZone =
  | "external"     // Users, Route 53, CloudFront, WAF, Shield
  | "entrypoint"   // API Gateway, WebSocket API — Region 내, VPC 위 트래픽 진입점
  | "region"       // S3, DynamoDB, SQS, SNS, CloudWatch, GuardDuty, CodePipeline 등 모든 AWS 관리형
  | "public"       // ALB, NLB, NAT GW
  | "app"          // ECS, EKS, EC2, Lambda, RDS Proxy — Private App Subnet
  | "data"         // RDS, Aurora, ElastiCache, OpenSearch, MSK, EFS — Private Data Subnet
  | "vpcBoundary"  // VPC Endpoint — VPC 내부, AZ 밖
  | "cicd"         // Terraform, GitHub Actions, GitLab CI, Helm — 비-AWS 외부 CI/CD
  | "appstack"     // Spring Boot, Node.js, FastAPI — 비-AWS 프레임워크/런타임
  | "skip";        // abstract services not shown

interface ShapeInfo {
  shape: string;
  fillColor: string;
  zone: PlacementZone;
  label: string;
}

/** Maps lowercase keyword → draw.io shape info. First match wins. */
const SHAPE_CATALOG: [string, ShapeInfo][] = [
  // ── External / Edge ──
  ["route 53",       { shape: "mxgraph.aws4.route_53",                   fillColor: "#8C4FFF", zone: "external", label: "Route 53" }],
  ["cloudfront",     { shape: "mxgraph.aws4.cloudfront",                 fillColor: "#8C4FFF", zone: "external", label: "CloudFront" }],
  ["bot control",    { shape: "mxgraph.aws4.waf",                        fillColor: "#DD344C", zone: "external", label: "Bot Control" }],
  ["shield",         { shape: "mxgraph.aws4.shield",                     fillColor: "#DD344C", zone: "external", label: "Shield" }],
  ["waf",            { shape: "mxgraph.aws4.waf",                        fillColor: "#DD344C", zone: "external", label: "WAF" }],
  ["lambda@edge",    { shape: "mxgraph.aws4.lambda",                     fillColor: "#ED7100", zone: "external", label: "Lambda@Edge" }],

  // ── Region (managed, VPC-external) ──
  ["certificate manager", { shape: "mxgraph.aws4.certificate_manager",   fillColor: "#DD344C", zone: "region", label: "ACM" }],
  ["synthetics",     { shape: "mxgraph.aws4.cloudwatch",                 fillColor: "#DD344C", zone: "region", label: "Synthetics" }],
  ["api gateway",    { shape: "mxgraph.aws4.api_gateway",                fillColor: "#E7157B", zone: "entrypoint", label: "API Gateway" }],
  ["websocket api",  { shape: "mxgraph.aws4.api_gateway",                fillColor: "#E7157B", zone: "entrypoint", label: "WebSocket API" }],
  ["cognito",        { shape: "mxgraph.aws4.cognito",                    fillColor: "#DD344C", zone: "region", label: "Cognito" }],
  ["iam identity",   { shape: "mxgraph.aws4.identity_and_access_management", fillColor: "#DD344C", zone: "region", label: "IAM SSO" }],
  ["dynamodb global",{ shape: "mxgraph.aws4.global_secondary_index",     fillColor: "#C925D1", zone: "region", label: "Global Tables" }],
  ["dynamodb pitr",  { shape: "mxgraph.aws4.dynamodb",                   fillColor: "#C925D1", zone: "region", label: "DynamoDB PITR" }],
  ["dynamodb",       { shape: "mxgraph.aws4.dynamodb",                   fillColor: "#C925D1", zone: "region", label: "DynamoDB" }],
  ["timestream",     { shape: "mxgraph.aws4.timestream",                 fillColor: "#C925D1", zone: "region", label: "Timestream" }],
  ["sqs",            { shape: "mxgraph.aws4.sqs",                        fillColor: "#E7157B", zone: "region", label: "SQS" }],
  ["sns",            { shape: "mxgraph.aws4.sns",                        fillColor: "#E7157B", zone: "region", label: "SNS" }],
  ["eventbridge",    { shape: "mxgraph.aws4.eventbridge",                fillColor: "#E7157B", zone: "region", label: "EventBridge" }],
  ["kinesis",        { shape: "mxgraph.aws4.kinesis",                    fillColor: "#8C4FFF", zone: "region", label: "Kinesis" }],

  // ── Public Subnet ──
  ["nat gw",         { shape: "mxgraph.aws4.nat_gateway",                fillColor: "#8C4FFF", zone: "public", label: "NAT GW" }],
  ["nat gateway",    { shape: "mxgraph.aws4.nat_gateway",                fillColor: "#8C4FFF", zone: "public", label: "NAT GW" }],
  ["alb",            { shape: "mxgraph.aws4.application_load_balancer",  fillColor: "#8C4FFF", zone: "public", label: "ALB" }],
  ["nlb",            { shape: "mxgraph.aws4.network_load_balancer",      fillColor: "#8C4FFF", zone: "public", label: "NLB" }],

  // ── Private App Subnet (compute) ──
  ["ecs fargate",    { shape: "mxgraph.aws4.ecs_service",                fillColor: "#ED7100", zone: "app", label: "ECS Fargate" }],
  ["fargate",        { shape: "mxgraph.aws4.ecs_service",                fillColor: "#ED7100", zone: "app", label: "ECS Fargate" }],
  ["eks",            { shape: "mxgraph.aws4.eks",  fillColor: "#ED7100", zone: "app", label: "EKS" }],
  ["lambda",         { shape: "mxgraph.aws4.lambda",                     fillColor: "#ED7100", zone: "app", label: "Lambda" }],
  ["ec2 auto",       { shape: "mxgraph.aws4.auto_scaling2",              fillColor: "#ED7100", zone: "app", label: "EC2 ASG" }],
  ["rds proxy",      { shape: "mxgraph.aws4.rds_proxy",                  fillColor: "#C925D1", zone: "app", label: "RDS Proxy" }],
  ["redis pub/sub",  { shape: "mxgraph.aws4.elasticache_for_redis",      fillColor: "#C925D1", zone: "app", label: "Redis Pub/Sub" }],

  // ── Private Data Subnet (cache) ──
  ["elasticache",    { shape: "mxgraph.aws4.elasticache_for_redis",      fillColor: "#C925D1", zone: "data", label: "ElastiCache Redis" }],
  ["dax",            { shape: "mxgraph.aws4.dynamodb_dax",               fillColor: "#C925D1", zone: "data", label: "DynamoDB DAX" }],

  // ── Private Data Subnet (database) ──
  ["aurora postgresql", { shape: "mxgraph.aws4.aurora_instance",          fillColor: "#C925D1", zone: "data", label: "Aurora PG" }],
  ["aurora mysql",   { shape: "mxgraph.aws4.aurora_instance",            fillColor: "#C925D1", zone: "data", label: "Aurora MySQL" }],
  ["aurora global",  { shape: "mxgraph.aws4.aurora",                     fillColor: "#C925D1", zone: "data", label: "Aurora Global" }],
  ["aurora",         { shape: "mxgraph.aws4.aurora",                     fillColor: "#C925D1", zone: "data", label: "Aurora" }],
  ["rds postgresql", { shape: "mxgraph.aws4.rds_postgresql_instance",    fillColor: "#C925D1", zone: "data", label: "RDS PG" }],
  ["rds mysql",      { shape: "mxgraph.aws4.rds_mysql_instance",         fillColor: "#C925D1", zone: "data", label: "RDS MySQL" }],
  ["opensearch",     { shape: "mxgraph.aws4.elasticsearch_service",      fillColor: "#C925D1", zone: "data", label: "OpenSearch" }],

  // ── Private Data Subnet (VPC-bound messaging/storage) ──
  ["msk",            { shape: "mxgraph.aws4.managed_streaming_for_kafka", fillColor: "#E7157B", zone: "data", label: "MSK Kafka" }],
  ["efs",            { shape: "mxgraph.aws4.elastic_file_system",        fillColor: "#7AA116", zone: "data", label: "EFS" }],
  ["ebs",            { shape: "mxgraph.aws4.elastic_block_store",        fillColor: "#7AA116", zone: "data", label: "EBS" }],

  // ── Region-level managed services ──
  ["ecr",            { shape: "mxgraph.aws4.ecr",                        fillColor: "#ED7100", zone: "region", label: "ECR" }],
  ["s3 cross",       { shape: "mxgraph.aws4.s3",                         fillColor: "#7AA116", zone: "region", label: "S3 CRR" }],
  ["s3",             { shape: "mxgraph.aws4.s3",                         fillColor: "#7AA116", zone: "region", label: "S3" }],
  ["aws backup",     { shape: "mxgraph.aws4.backup",                     fillColor: "#7AA116", zone: "region", label: "AWS Backup" }],
  ["secrets manager",{ shape: "mxgraph.aws4.secrets_manager",            fillColor: "#DD344C", zone: "region", label: "Secrets Mgr" }],
  ["kms",            { shape: "mxgraph.aws4.key_management_service",      fillColor: "#DD344C", zone: "region", label: "KMS" }],
  ["guardduty",      { shape: "mxgraph.aws4.guardduty",                  fillColor: "#DD344C", zone: "region", label: "GuardDuty" }],
  ["inspector",      { shape: "mxgraph.aws4.inspector",                  fillColor: "#DD344C", zone: "region", label: "Inspector" }],
  ["macie",          { shape: "mxgraph.aws4.macie",                      fillColor: "#DD344C", zone: "region", label: "Macie" }],
  ["cloudwatch",     { shape: "mxgraph.aws4.cloudwatch",                 fillColor: "#E7157B", zone: "region", label: "CloudWatch" }],
  ["x-ray",          { shape: "mxgraph.aws4.xray",                      fillColor: "#E7157B", zone: "region", label: "X-Ray" }],
  ["cloudtrail",     { shape: "mxgraph.aws4.cloudtrail",                 fillColor: "#E7157B", zone: "region", label: "CloudTrail" }],
  ["vpc flow",       { shape: "mxgraph.aws4.flow_logs",                  fillColor: "#8C4FFF", zone: "region", label: "VPC Flow Logs" }],
  ["iam roles",      { shape: "mxgraph.aws4.role",                       fillColor: "#DD344C", zone: "region", label: "IAM Roles" }],
  ["security group", { shape: "mxgraph.aws4.network_firewall",           fillColor: "#DD344C", zone: "region", label: "Security Group" }],
  ["config",         { shape: "mxgraph.aws4.config",                     fillColor: "#DD344C", zone: "region", label: "Config" }],
  ["systems manager",{ shape: "mxgraph.aws4.systems_manager",            fillColor: "#E7157B", zone: "region", label: "SSM" }],

  // ── CI/CD ──
  ["terraform",      { shape: "mxgraph.aws4.cloudformation",             fillColor: "#E7157B", zone: "cicd", label: "Terraform" }],
  ["aws cdk",        { shape: "mxgraph.aws4.cloudformation",             fillColor: "#E7157B", zone: "region", label: "CDK" }],
  ["cloudformation", { shape: "mxgraph.aws4.cloudformation",             fillColor: "#E7157B", zone: "region", label: "CFn" }],
  ["github actions", { shape: "mxgraph.aws4.codepipeline",               fillColor: "#E7157B", zone: "cicd", label: "GitHub Actions" }],
  ["codepipeline",   { shape: "mxgraph.aws4.codepipeline",               fillColor: "#E7157B", zone: "region", label: "CodePipeline" }],
  ["gitlab",         { shape: "mxgraph.aws4.codepipeline",               fillColor: "#E7157B", zone: "cicd", label: "GitLab CI" }],

  // ── Region: Batch / Workflow ──
  ["step functions", { shape: "mxgraph.aws4.step_functions",             fillColor: "#E7157B", zone: "region", label: "Step Functions" }],
  ["aws batch",      { shape: "mxgraph.aws4.batch",                      fillColor: "#ED7100", zone: "region", label: "AWS Batch" }],
  ["ecs scheduled",  { shape: "mxgraph.aws4.ecs_service",                fillColor: "#ED7100", zone: "region", label: "ECS Scheduled" }],
  ["glue",           { shape: "mxgraph.aws4.glue",                       fillColor: "#8C4FFF", zone: "region", label: "Glue ETL" }],
  ["athena",         { shape: "mxgraph.aws4.athena",                     fillColor: "#8C4FFF", zone: "region", label: "Athena" }],
  ["redshift",       { shape: "mxgraph.aws4.redshift",                   fillColor: "#8C4FFF", zone: "region", label: "Redshift" }],
  ["lake formation", { shape: "mxgraph.aws4.lake_formation",             fillColor: "#8C4FFF", zone: "region", label: "Lake Formation" }],
  ["iot core",       { shape: "mxgraph.aws4.iot_core",                   fillColor: "#7AA116", zone: "region", label: "IoT Core" }],
  ["iot greengrass", { shape: "mxgraph.aws4.iot_greengrass",              fillColor: "#7AA116", zone: "region", label: "Greengrass" }],
  ["sagemaker",      { shape: "mxgraph.aws4.sagemaker",                  fillColor: "#1B660F", zone: "region", label: "SageMaker" }],
  ["privatelink",    { shape: "mxgraph.aws4.endpoints",                  fillColor: "#8C4FFF", zone: "region", label: "PrivateLink" }],

  // ── Region: DR ──
  ["failover",       { shape: "mxgraph.aws4.route_53",                   fillColor: "#8C4FFF", zone: "region", label: "R53 Failover" }],
  ["global database",{ shape: "mxgraph.aws4.aurora",                     fillColor: "#C925D1", zone: "region", label: "Aurora Global" }],
  ["cross-region",   { shape: "mxgraph.aws4.s3",                         fillColor: "#7AA116", zone: "region", label: "S3 CRR" }],

  // ── Region: Network Extras ──
  ["vpc endpoint",   { shape: "mxgraph.aws4.endpoints",                  fillColor: "#8C4FFF", zone: "vpcBoundary", label: "VPC Endpoint" }],
  ["transit gateway",{ shape: "mxgraph.aws4.transit_gateway",             fillColor: "#8C4FFF", zone: "region", label: "Transit GW" }],
  ["site-to-site",   { shape: "mxgraph.aws4.vpn_gateway",                fillColor: "#8C4FFF", zone: "region", label: "VPN" }],
  ["direct connect", { shape: "mxgraph.aws4.direct_connect",             fillColor: "#8C4FFF", zone: "region", label: "Direct Connect" }],
  ["vpn + dx",       { shape: "mxgraph.aws4.vpn_gateway",                fillColor: "#8C4FFF", zone: "region", label: "VPN+DX" }],

  // ── K8s ecosystem (in-cluster add-ons → app zone, inside EKS cluster container) ──
  ["karpenter",      { shape: "mxgraph.aws4.eks",  fillColor: "#ED7100", zone: "app", label: "Karpenter" }],
  ["cluster autoscaler", { shape: "mxgraph.aws4.auto_scaling2",          fillColor: "#ED7100", zone: "app", label: "Cluster AS" }],
  ["alb ingress",    { shape: "mxgraph.aws4.application_load_balancer",  fillColor: "#8C4FFF", zone: "app", label: "ALB Controller" }],
  ["nginx ingress",  { shape: "mxgraph.aws4.eks",  fillColor: "#ED7100", zone: "app", label: "NGINX Ingress" }],
  ["kong gateway",   { shape: "mxgraph.aws4.eks",  fillColor: "#ED7100", zone: "app", label: "Kong" }],
  ["traefik",        { shape: "mxgraph.aws4.eks",  fillColor: "#ED7100", zone: "app", label: "Traefik" }],
  ["istio",          { shape: "mxgraph.aws4.eks",  fillColor: "#ED7100", zone: "app", label: "Istio" }],
  ["kiali",          { shape: "mxgraph.aws4.eks",  fillColor: "#ED7100", zone: "app", label: "Kiali" }],
  ["app mesh",       { shape: "mxgraph.aws4.app_mesh",                   fillColor: "#ED7100", zone: "app", label: "App Mesh" }],
  ["argocd",         { shape: "mxgraph.aws4.codepipeline",               fillColor: "#E7157B", zone: "cicd", label: "ArgoCD" }],
  ["flux",           { shape: "mxgraph.aws4.codepipeline",               fillColor: "#E7157B", zone: "cicd", label: "Flux" }],
  ["prometheus",     { shape: "mxgraph.aws4.cloudwatch",                 fillColor: "#E7157B", zone: "region", label: "Prometheus" }],
  ["grafana",        { shape: "mxgraph.aws4.cloudwatch",                 fillColor: "#E7157B", zone: "region", label: "Grafana" }],
  ["container insights", { shape: "mxgraph.aws4.cloudwatch",             fillColor: "#E7157B", zone: "region", label: "Container Insights" }],
  ["helm",           { shape: "mxgraph.aws4.cloudformation",             fillColor: "#E7157B", zone: "cicd", label: "Helm" }],
  ["cert-manager",   { shape: "mxgraph.aws4.certificate_manager",        fillColor: "#DD344C", zone: "app", label: "cert-manager" }],
  ["external secrets",{ shape: "mxgraph.aws4.secrets_manager",           fillColor: "#DD344C", zone: "app", label: "Ext Secrets" }],
  ["secrets store csi",{ shape: "mxgraph.aws4.secrets_manager",          fillColor: "#DD344C", zone: "app", label: "Secrets CSI" }],
  ["velero",         { shape: "mxgraph.aws4.backup",                     fillColor: "#7AA116", zone: "app", label: "Velero" }],
  ["keda",           { shape: "mxgraph.aws4.auto_scaling2",              fillColor: "#ED7100", zone: "app", label: "KEDA" }],
  ["vpa",            { shape: "mxgraph.aws4.auto_scaling2",              fillColor: "#ED7100", zone: "app", label: "VPA" }],

  // ── App Stack (frameworks/runtimes) ──
  ["spring boot",    { shape: "mxgraph.aws4.ecs_service",                fillColor: "#ED7100", zone: "appstack", label: "Spring Boot" }],
  ["spring cloud",   { shape: "mxgraph.aws4.api_gateway",                fillColor: "#E7157B", zone: "appstack", label: "Spring Cloud GW" }],
  ["node.js",        { shape: "mxgraph.aws4.ecs_service",                fillColor: "#ED7100", zone: "appstack", label: "Node.js" }],
  ["python",         { shape: "mxgraph.aws4.ecs_service",                fillColor: "#ED7100", zone: "appstack", label: "FastAPI" }],
  ["go",             { shape: "mxgraph.aws4.ecs_service",                fillColor: "#ED7100", zone: "appstack", label: "Go" }],
  ["rust",           { shape: "mxgraph.aws4.ecs_service",                fillColor: "#ED7100", zone: "appstack", label: "Rust" }],
  ["apollo",         { shape: "mxgraph.aws4.api_gateway",                fillColor: "#E7157B", zone: "appstack", label: "Apollo GraphQL" }],
  ["appsync",        { shape: "mxgraph.aws4.appsync",                    fillColor: "#E7157B", zone: "region", label: "AppSync" }],
  ["grpc",           { shape: "mxgraph.aws4.api_gateway",                fillColor: "#E7157B", zone: "appstack", label: "gRPC" }],
  ["cloud map",      { shape: "mxgraph.aws4.cloud_map",                  fillColor: "#E7157B", zone: "region", label: "Cloud Map" }],
  ["k8s dns",        { shape: "mxgraph.aws4.eks",  fillColor: "#ED7100", zone: "app", label: "K8s DNS" }],
  ["eureka",         { shape: "mxgraph.aws4.ecs_service",                fillColor: "#ED7100", zone: "appstack", label: "Eureka" }],

  // ── Account / Org ──
  ["organizations",  { shape: "mxgraph.aws4.organizations",              fillColor: "#E7157B", zone: "region", label: "Organizations" }],

  // ── Skip (abstract / cost / deploy strategy) ──
  ["blue/green",     { shape: "", fillColor: "", zone: "skip", label: "" }],
  ["canary",         { shape: "", fillColor: "", zone: "skip", label: "" }],
  ["rolling",        { shape: "", fillColor: "", zone: "skip", label: "" }],
  ["배포 전략",       { shape: "", fillColor: "", zone: "skip", label: "" }],
  ["환경별 계정",     { shape: "", fillColor: "", zone: "skip", label: "" }],
  ["단일 계정",       { shape: "", fillColor: "", zone: "skip", label: "" }],
  ["테넌트 격리",     { shape: "", fillColor: "", zone: "skip", label: "" }],
  ["vpc",            { shape: "", fillColor: "", zone: "skip", label: "" }],
  ["서브넷",         { shape: "", fillColor: "", zone: "skip", label: "" }],
  ["subnet",         { shape: "", fillColor: "", zone: "skip", label: "" }],
  ["인증 이중",       { shape: "", fillColor: "", zone: "skip", label: "" }],
  ["자체 인증",       { shape: "", fillColor: "", zone: "skip", label: "" }],
  ["api 버전",        { shape: "", fillColor: "", zone: "skip", label: "" }],
  ["폴리글랏",       { shape: "", fillColor: "", zone: "skip", label: "" }],
  ["rest (외부)",     { shape: "", fillColor: "", zone: "skip", label: "" }],
  ["alb 직접",        { shape: "", fillColor: "", zone: "skip", label: "" }],
  ["멀티 클러스터",    { shape: "", fillColor: "", zone: "skip", label: "" }],
  ["k8s secret",      { shape: "", fillColor: "", zone: "skip", label: "" }],
  ["kyverno",         { shape: "", fillColor: "", zone: "skip", label: "" }],
  ["opa gatekeeper",  { shape: "", fillColor: "", zone: "skip", label: "" }],
  ["pod security",    { shape: "", fillColor: "", zone: "skip", label: "" }],
  ["cilium",          { shape: "", fillColor: "", zone: "skip", label: "" }],
  ["vpc cni",         { shape: "", fillColor: "", zone: "skip", label: "" }],
  ["spot 미사용",      { shape: "", fillColor: "", zone: "skip", label: "" }],
  ["캐싱으로",         { shape: "", fillColor: "", zone: "skip", label: "" }],
  ["graviton",         { shape: "", fillColor: "", zone: "skip", label: "" }],
  ["미사용 리소스",     { shape: "", fillColor: "", zone: "skip", label: "" }],
  ["reserved instance",{ shape: "", fillColor: "", zone: "skip", label: "" }],
  ["savings plans",    { shape: "", fillColor: "", zone: "skip", label: "" }],
  ["fargate spot",     { shape: "", fillColor: "", zone: "skip", label: "" }],
  ["cloudfront 캐시",  { shape: "", fillColor: "", zone: "skip", label: "" }],
  ["로그 보존",         { shape: "", fillColor: "", zone: "skip", label: "" }],
  ["eventbridge scheduler", { shape: "mxgraph.aws4.eventbridge",         fillColor: "#E7157B", zone: "region", label: "EB Scheduler" }],
  ["glue schema",     { shape: "mxgraph.aws4.glue",                      fillColor: "#8C4FFF", zone: "region", label: "Schema Registry" }],
  ["confluent",       { shape: "mxgraph.aws4.managed_streaming_for_kafka",fillColor: "#E7157B", zone: "region", label: "Schema Registry" }],
];

function lookupShape(name: string): ShapeInfo | null {
  const n = name.toLowerCase();
  for (const [kw, info] of SHAPE_CATALOG) {
    if (n.includes(kw)) return info;
  }
  return null;
}

// ─── 2. Service Classification ────────────────────────────────────────

type SvcItem = { svc: ArchService; info: ShapeInfo };

interface ClassifiedServices {
  external:    SvcItem[];
  entrypoint:  SvcItem[];
  region:      SvcItem[];
  public:      SvcItem[];
  app:         SvcItem[];
  data:        SvcItem[];
  vpcBoundary: SvcItem[];
  cicd:        SvcItem[];
  appstack:    SvcItem[];
}

function classifyServices(arch: Architecture): ClassifiedServices {
  const result: ClassifiedServices = {
    external: [], entrypoint: [], region: [], public: [], app: [], data: [],
    vpcBoundary: [], cicd: [], appstack: [],
  };
  const seen = new Set<string>();
  const seenLabels = new Set<string>();

  for (const layer of arch.layers) {
    for (const svc of layer.services) {
      if (!svc || !svc.name) continue;
      const key = svc.name.toLowerCase().trim();
      if (seen.has(key)) continue;
      seen.add(key);

      const info = lookupShape(svc.name);
      if (!info || info.zone === "skip") continue;

      // Deduplicate by resolved label+zone to prevent duplicate shapes
      const labelKey = `${info.zone}:${info.label}`;
      if (seenLabels.has(labelKey)) continue;
      seenLabels.add(labelKey);

      const zone = info.zone as keyof ClassifiedServices;
      result[zone].push({ svc, info });
    }
  }
  return result;
}

// ─── 3. Layout Constants ──────────────────────────────────────────────

const ICON_W = 48, ICON_H = 48;
const ICON_GAP = 30;
const ICON_LABEL_H = 40;
const MAX_PER_ROW = 5;

const SUBNET_PAD = { top: 40, bottom: 15, left: 20, right: 20 };
const AZ_PAD = { top: 40, bottom: 15, left: 15, right: 15 };
const VPC_PAD = { top: 45, bottom: 20, left: 20, right: 20 };
const REGION_PAD = { top: 40, bottom: 20, left: 20, right: 20 };
const CLOUD_PAD = { top: 40, bottom: 20, left: 20, right: 20 };

const AZ_GAP = 40;
const SUBNET_GAP = 15;
const USERS_Y = 20;
const USERS_TO_CLOUD_GAP = 60;
const EXTERNAL_TO_REGION_GAP = 40;
const SIDEBAR_W = 220;
const SIDEBAR_COLS = 2;
const SIDEBAR_GROUP_LABEL_H = 22;
const SIDEBAR_GROUP_GAP = 12;
const SIDEBAR_ICON_COL_W = ICON_W + ICON_GAP; // 78px per column
const IGW_SPACE = 60;
const ENTRY_TO_VPC_GAP = 40;
const VPCBDRY_GAP = 15;
const CLUSTER_PAD = { top: 30, bottom: 10, left: 15, right: 15 };
const CLUSTER_GAP = 10;

// ── Category boxes (non-AWS services, below Cloud) ──
const CAT_MAX_PER_ROW = 4;
const CAT_PAD = { top: 35, bottom: 10, left: 15, right: 15 };
const CAT_BOX_GAP = 20;
const CAT_ROW_GAP = 30;

interface CategoryDef {
  key: string;
  label: string;
  borderColor: string;
  position: "top" | "bottom";
  items: SvcItem[];
  w: number;
  h: number;
}

const CATEGORY_META: { key: keyof ClassifiedServices; label: string; borderColor: string; position: "top" | "bottom" }[] = [
  { key: "cicd",       label: "CI/CD",                  borderColor: "#ED7100", position: "top" },
  { key: "appstack",   label: "App Stack",              borderColor: "#147EBA", position: "top" },
];

// ── Sidebar sub-group definitions for region services ──
interface SidebarGroupDef {
  key: string;
  label: string;
  items: SvcItem[];
  rows: number;
  h: number;
}

const SIDEBAR_GROUP_ORDER = ["security", "storage", "integration", "observability", "networking", "devops", "analytics"];
const SIDEBAR_GROUP_LABELS: Record<string, string> = {
  security: "Security", storage: "Storage", integration: "Integration",
  observability: "Observability", networking: "Networking", devops: "DevOps", analytics: "Analytics",
};
const SIDEBAR_GROUP_MAP = new Map<string, string>([
  // Security
  ["ACM", "security"], ["Cognito", "security"], ["IAM SSO", "security"],
  ["Secrets Mgr", "security"], ["KMS", "security"], ["GuardDuty", "security"],
  ["Inspector", "security"], ["Macie", "security"], ["IAM Roles", "security"],
  ["Security Group", "security"], ["Config", "security"], ["Organizations", "security"],
  ["Synthetics", "security"],
  // Storage
  ["S3", "storage"], ["S3 CRR", "storage"], ["AWS Backup", "storage"],
  ["DynamoDB", "storage"], ["DynamoDB PITR", "storage"], ["Global Tables", "storage"],
  ["Timestream", "storage"], ["ECR", "storage"], ["Aurora Global", "storage"],
  // Integration
  ["SQS", "integration"], ["SNS", "integration"], ["EventBridge", "integration"],
  ["Kinesis", "integration"], ["Step Functions", "integration"],
  ["AppSync", "integration"], ["Cloud Map", "integration"], ["EB Scheduler", "integration"],
  ["IoT Core", "integration"],
  // Observability
  ["CloudWatch", "observability"], ["X-Ray", "observability"], ["CloudTrail", "observability"],
  ["VPC Flow Logs", "observability"], ["SSM", "observability"],
  ["Prometheus", "observability"], ["Grafana", "observability"], ["Container Insights", "observability"],
  // Networking
  ["Transit GW", "networking"], ["VPN", "networking"], ["Direct Connect", "networking"],
  ["VPN+DX", "networking"], ["R53 Failover", "networking"],
  // DevOps
  ["CDK", "devops"], ["CFn", "devops"], ["CodePipeline", "devops"],
  ["AWS Batch", "devops"], ["ECS Scheduled", "devops"],
  // Analytics
  ["Glue ETL", "analytics"], ["Athena", "analytics"], ["Redshift", "analytics"],
  ["Lake Formation", "analytics"], ["Schema Registry", "analytics"],
]);

function buildSidebarGroups(regionItems: SvcItem[]): SidebarGroupDef[] {
  const grouped = new Map<string, SvcItem[]>();
  for (const item of regionItems) {
    const g = SIDEBAR_GROUP_MAP.get(item.info.label) ?? "storage";
    if (!grouped.has(g)) grouped.set(g, []);
    grouped.get(g)!.push(item);
  }
  const result: SidebarGroupDef[] = [];
  for (const key of SIDEBAR_GROUP_ORDER) {
    const items = grouped.get(key);
    if (!items || items.length === 0) continue;
    const rows = Math.ceil(items.length / SIDEBAR_COLS);
    const h = SIDEBAR_GROUP_LABEL_H + rows * (ICON_H + ICON_LABEL_H);
    result.push({ key, label: SIDEBAR_GROUP_LABELS[key], items, rows, h });
  }
  return result;
}

function catBoxSize(count: number): { w: number; h: number } {
  if (count === 0) return { w: 0, h: 0 };
  const perRow = Math.min(count, CAT_MAX_PER_ROW);
  const rows = Math.ceil(count / CAT_MAX_PER_ROW);
  const w = CAT_PAD.left + perRow * (ICON_W + ICON_GAP) - ICON_GAP + CAT_PAD.right;
  const h = CAT_PAD.top + rows * (ICON_H + ICON_LABEL_H) + CAT_PAD.bottom;
  return { w: Math.max(w, 130), h };
}

// ─── 4. Size Calculation Helpers ──────────────────────────────────────

function subnetSize(count: number): { w: number; h: number } {
  if (count === 0) return { w: 0, h: 0 };
  const perRow = Math.min(count, MAX_PER_ROW);
  const rows = Math.ceil(count / MAX_PER_ROW);
  const w = SUBNET_PAD.left + perRow * (ICON_W + ICON_GAP) - ICON_GAP + SUBNET_PAD.right;
  const h = SUBNET_PAD.top + rows * (ICON_H + ICON_LABEL_H) + SUBNET_PAD.bottom;
  return { w: Math.max(w, 200), h };
}

interface SubnetDef {
  label: string;
  count: number;
  styleKey: string;
}

interface SubnetSizeInfo {
  w: number;
  h: number;
  clusterH: number;
}

const COMPUTE_KEYWORDS = ["ecs", "eks", "fargate", "lambda", "ec2"];
const CLUSTER_ADDON_KEYWORDS = [
  "karpenter", "cluster autoscaler", "alb ingress", "nginx ingress",
  "kong", "traefik", "istio", "kiali", "app mesh",
  "cert-manager", "external secrets", "secrets store csi",
  "velero", "keda", "vpa", "k8s dns",
];

function isComputeService(name: string): boolean {
  const n = name.toLowerCase();
  return COMPUTE_KEYWORDS.some(kw => n.includes(kw));
}

function isClusterService(name: string): boolean {
  const n = name.toLowerCase();
  return COMPUTE_KEYWORDS.some(kw => n.includes(kw))
      || CLUSTER_ADDON_KEYWORDS.some(kw => n.includes(kw));
}

function computeLayout(classified: ClassifiedServices, azNum: number, subnetTier: string) {
  // Separate cluster services (compute + K8s add-ons) vs others in app zone
  const hasEks = classified.app.some(item => item.svc.name.toLowerCase().includes("eks"));
  const hasEc2Asg = classified.app.some(item => item.svc.name.toLowerCase().includes("ec2 auto"));
  const needsCluster = hasEks;
  const needsAsg = hasEc2Asg && !hasEks;

  // When EKS: compute + K8s add-ons go inside cluster. When ASG: only compute.
  const appCompute = classified.app.filter(item =>
    needsCluster ? isClusterService(item.svc.name) : isComputeService(item.svc.name));
  const appOther = classified.app.filter(item =>
    needsCluster ? !isClusterService(item.svc.name) : !isComputeService(item.svc.name));
  const hasClusterContainer = (needsCluster || needsAsg) && appCompute.length > 0;

  // Merge app+data into one list for 2tier / private
  const allPrivate = [...classified.app, ...classified.data];
  const mergedCount = allPrivate.length;

  // Build subnet definitions based on subnet_tier selection
  const subnets: SubnetDef[] = [];

  if (subnetTier === "private") {
    // ── private: 공개 구역 없음, 모든 서비스 내부 ──
    if (mergedCount > 0) {
      subnets.push({ label: "Private Subnet", count: mergedCount, styleKey: "merged" });
    }
  } else if (subnetTier === "3tier") {
    // ── 3tier: Public + App + Data(Isolated) ──
    if (classified.public.length > 0) {
      subnets.push({ label: "Public Subnet", count: classified.public.length, styleKey: "public" });
    }
    if (classified.app.length > 0) {
      subnets.push({ label: "Private App Subnet", count: classified.app.length, styleKey: "app" });
    }
    if (classified.data.length > 0) {
      subnets.push({ label: "Private Data Subnet (Isolated)", count: classified.data.length, styleKey: "data" });
    }
  } else {
    // ── 2tier (default): Public + Private (app+data 합침) ──
    if (classified.public.length > 0) {
      subnets.push({ label: "Public Subnet", count: classified.public.length, styleKey: "public" });
    }
    if (mergedCount > 0) {
      subnets.push({ label: "Private Subnet", count: mergedCount, styleKey: "merged" });
    }
  }

  // For "merged" styleKey, non-compute = appOther + data
  const mergedOther = [...appOther, ...classified.data];

  // Calculate subnet sizes
  const subnetSizes: SubnetSizeInfo[] = subnets.map(s => {
    const needsClusterHere = (s.styleKey === "app" || s.styleKey === "merged") && hasClusterContainer;
    if (needsClusterHere) {
      const compPerRow = Math.min(appCompute.length, MAX_PER_ROW);
      const compRows = Math.ceil(appCompute.length / MAX_PER_ROW);
      const clusterH = CLUSTER_PAD.top + compRows * (ICON_H + ICON_LABEL_H) + CLUSTER_PAD.bottom;

      const others = s.styleKey === "merged" ? mergedOther : appOther;
      const otherPerRow = Math.min(others.length || 0, MAX_PER_ROW);
      const otherRows = Math.ceil((others.length || 0) / MAX_PER_ROW);
      const otherH = others.length > 0 ? otherRows * (ICON_H + ICON_LABEL_H) : 0;

      const maxPerRow = Math.max(compPerRow, otherPerRow, 1);
      const w = SUBNET_PAD.left + maxPerRow * (ICON_W + ICON_GAP) - ICON_GAP + SUBNET_PAD.right;
      const h = SUBNET_PAD.top + clusterH + (otherH > 0 ? CLUSTER_GAP + otherH : 0) + SUBNET_PAD.bottom;
      return { w: Math.max(w, 200), h, clusterH };
    }
    const size = subnetSize(s.count);
    return { ...size, clusterH: 0 };
  });

  const maxSubnetW = subnetSizes.reduce((m, s) => Math.max(m, s.w), 200);
  const totalSubnetH = subnetSizes.reduce((sum, s) => sum + s.h, 0)
    + Math.max(0, subnets.length - 1) * SUBNET_GAP;

  const azW = AZ_PAD.left + maxSubnetW + AZ_PAD.right;
  const azH = AZ_PAD.top + totalSubnetH + AZ_PAD.bottom;

  const vpcW = VPC_PAD.left + azNum * azW + (azNum - 1) * AZ_GAP + VPC_PAD.right;
  const hasIgw = subnetTier !== "private";

  // VPC Boundary icons (VPC Endpoint etc.) — inside VPC below AZs
  const vpcBdryCount = classified.vpcBoundary.length;
  const vpcBdryH = vpcBdryCount > 0 ? VPCBDRY_GAP + ICON_H + ICON_LABEL_H : 0;

  const vpcH = VPC_PAD.top + (hasIgw ? IGW_SPACE : 0) + azH + vpcBdryH + VPC_PAD.bottom;

  const hasVpc = subnets.length > 0;

  // Sidebar for region services (grouped)
  const sidebarGroups = buildSidebarGroups(classified.region);
  const sidebarNeeded = classified.region.length > 0;
  const sidebarContentH = sidebarGroups.reduce((sum, g) => sum + g.h, 0)
    + Math.max(0, sidebarGroups.length - 1) * SIDEBAR_GROUP_GAP + 40;
  const sidebarH = Math.max(hasVpc ? vpcH : 100, sidebarContentH);

  // Category boxes (non-AWS services)
  const categories: CategoryDef[] = [];
  for (const meta of CATEGORY_META) {
    const items = classified[meta.key] as SvcItem[];
    if (items.length > 0) {
      const size = catBoxSize(items.length);
      categories.push({ ...meta, items, ...size });
    }
  }
  // Split into top (CI/CD, App Stack — above Cloud) and bottom (K8s — below Cloud)
  const topCats = categories.filter(c => c.position === "top");
  const bottomCats = categories.filter(c => c.position === "bottom");
  const hasTopCats = topCats.length > 0;
  const hasBottomCats = bottomCats.length > 0;
  const topCatRowW = hasTopCats
    ? topCats.reduce((sum, c) => sum + c.w, 0) + (topCats.length - 1) * CAT_BOX_GAP : 0;
  const topCatRowH = hasTopCats ? Math.max(...topCats.map(c => c.h)) : 0;
  const bottomCatRowW = hasBottomCats
    ? bottomCats.reduce((sum, c) => sum + c.w, 0) + (bottomCats.length - 1) * CAT_BOX_GAP : 0;
  const bottomCatRowH = hasBottomCats ? Math.max(...bottomCats.map(c => c.h)) : 0;

  // Entrypoint row (API GW etc.) — inside Region, above VPC
  const entryCount = classified.entrypoint.length;
  const entryRowW = entryCount * (ICON_W + ICON_GAP) - (entryCount > 0 ? ICON_GAP : 0);
  const entryRowH = entryCount > 0 ? ICON_H + ICON_LABEL_H + ENTRY_TO_VPC_GAP : 0;

  const mainContentH = Math.max(hasVpc ? vpcH : 100, sidebarH);
  const regionContentW = (hasVpc ? vpcW : 0) + (sidebarNeeded ? SIDEBAR_W + 30 : 0);
  const regionW = REGION_PAD.left + Math.max(regionContentW, entryRowW + 40, 400) + REGION_PAD.right;
  const regionH = REGION_PAD.top + entryRowH + mainContentH + REGION_PAD.bottom;

  // External row (inside Cloud, above Region)
  const extCount = classified.external.length;
  const extRowW = extCount * (ICON_W + ICON_GAP) - (extCount > 0 ? ICON_GAP : 0);
  const extRowH = extCount > 0 ? ICON_H + ICON_LABEL_H + EXTERNAL_TO_REGION_GAP : 0;

  // Cloud dimensions
  const cloudContentW = Math.max(regionW, extRowW + 60);
  const cloudW = CLOUD_PAD.left + cloudContentW + CLOUD_PAD.right;
  const cloudH = CLOUD_PAD.top + extRowH + regionH + CLOUD_PAD.bottom;

  // Total diagram: [Users + top cats same row] → Cloud → [bottom cats]
  // Top row: Users centered above Cloud, top cats to the right — same Y
  const usersH = ICON_H + ICON_LABEL_H;
  const topRowH = hasTopCats ? Math.max(usersH, topCatRowH) : usersH;
  const cloudY = USERS_Y + topRowH + USERS_TO_CLOUD_GAP;
  // Ensure totalW fits Cloud + right-side cat boxes
  const topCatsNeededW = hasTopCats ? cloudW + CAT_BOX_GAP + topCatRowW + 40 : 0;
  const totalW = Math.max(cloudW + 40, topCatsNeededW, hasBottomCats ? bottomCatRowW + 40 : 0, 600);
  const totalH = cloudY + cloudH + (hasBottomCats ? CAT_ROW_GAP + bottomCatRowH : 0) + 40;

  return {
    subnets, subnetSizes, maxSubnetW,
    azW, azH, azNum,
    vpcW, vpcH, hasVpc, hasIgw,
    sidebarNeeded, sidebarH, sidebarGroups,
    regionW, regionH, mainContentH,
    cloudW, cloudH, cloudY,
    extRowW, extRowH, extCount,
    totalW, totalH,
    subnetTier,
    appCompute, appOther, mergedOther, allPrivate,
    needsCluster, needsAsg, hasClusterContainer,
    topCats, bottomCats, hasTopCats, hasBottomCats,
    topCatRowW, topCatRowH, bottomCatRowW, bottomCatRowH,
    entryRowW, entryRowH, entryCount,
    vpcBdryCount, vpcBdryH,
  };
}

// ─── 5. XML Builder Helpers ───────────────────────────────────────────

let _id = 1;
function nextId(): string { return `c${_id++}`; }

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function mxGeo(x: number, y: number, w: number, h: number): string {
  return `<mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/>`;
}

function groupCell(id: string, value: string, style: string, parent: string, x: number, y: number, w: number, h: number): string {
  return `<mxCell id="${id}" value="${esc(value)}" style="${style}" vertex="1" connectable="0" parent="${parent}">${mxGeo(x, y, w, h)}</mxCell>`;
}

function iconCell(id: string, value: string, shape: string, fillColor: string, parent: string, x: number, y: number, w = ICON_W, h = ICON_H): string {
  const style = `sketch=0;points=[[0,0,0],[0.25,0,0],[0.5,0,0],[0.75,0,0],[1,0,0],[0,1,0],[0.25,1,0],[0.5,1,0],[0.75,1,0],[1,1,0],[0,0.25,0],[0,0.5,0],[0,0.75,0],[1,0.25,0],[1,0.5,0],[1,0.75,0]];outlineConnect=0;fontColor=#232F3E;gradientColor=none;fillColor=${fillColor};strokeColor=#ffffff;dashed=0;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;fontSize=10;fontStyle=0;aspect=fixed;pointerEvents=1;shape=mxgraph.aws4.resourceIcon;resIcon=${shape};`;
  return `<mxCell id="${id}" value="${esc(value)}" style="${style}" vertex="1" parent="${parent}">${mxGeo(x, y, w, h)}</mxCell>`;
}

interface EdgeOpts {
  exitX?: number;  exitY?: number;
  entryX?: number; entryY?: number;
}

function edgeCell(id: string, source: string, target: string, strokeColor: string, label?: string, dashed = false, opts?: EdgeOpts): string {
  const dashStyle = dashed ? "dashed=1;dashPattern=8 4;" : "dashed=0;";
  let anchor = "";
  if (opts?.exitX !== undefined)  anchor += `exitX=${opts.exitX};exitY=${opts.exitY ?? 0.5};exitDx=0;exitDy=0;`;
  if (opts?.entryX !== undefined) anchor += `entryX=${opts.entryX};entryY=${opts.entryY ?? 0.5};entryDx=0;entryDy=0;`;
  const style = `edgeStyle=orthogonalEdgeStyle;html=1;rounded=1;strokeColor=${strokeColor};strokeWidth=2;${dashStyle}${anchor}fontColor=#232F3E;fontSize=10;`;
  const val = label ? esc(label) : "";
  return `<mxCell id="${id}" value="${val}" style="${style}" edge="1" source="${source}" target="${target}" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell>`;
}

// ── AWS Official Group Styles ──

const GROUP_POINTS = "points=[[0,0],[0.25,0],[0.5,0],[0.75,0],[1,0],[1,0.25],[1,0.5],[1,0.75],[1,1],[0.75,1],[0.5,1],[0.25,1],[0,1],[0,0.75],[0,0.5],[0,0.25]];";

function awsCloudStyle(): string {
  return `sketch=0;${GROUP_POINTS}outlineConnect=0;gradientColor=none;html=1;whiteSpace=wrap;fontSize=12;fontStyle=0;shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_aws_cloud_alt;strokeColor=#232F3E;fillColor=none;verticalAlign=top;align=left;spacingLeft=30;fontColor=#232F3E;dashed=0;container=1;pointerEvents=0;collapsible=0;recursiveResize=0;`;
}

function regionStyle(): string {
  return `sketch=0;${GROUP_POINTS}outlineConnect=0;gradientColor=none;html=1;whiteSpace=wrap;fontSize=12;fontStyle=0;shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_region;strokeColor=#00A4A6;fillColor=none;verticalAlign=top;align=left;spacingLeft=30;fontColor=#147EBA;dashed=1;container=1;pointerEvents=0;collapsible=0;recursiveResize=0;`;
}

function vpcStyle(): string {
  return `sketch=0;${GROUP_POINTS}outlineConnect=0;gradientColor=none;html=1;whiteSpace=wrap;fontSize=12;fontStyle=0;shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_vpc;strokeColor=#248814;fillColor=none;verticalAlign=top;align=left;spacingLeft=30;fontColor=#AAB7B8;dashed=0;container=1;pointerEvents=0;collapsible=0;recursiveResize=0;`;
}

function azStyle(): string {
  return `sketch=0;${GROUP_POINTS}outlineConnect=0;gradientColor=none;html=1;whiteSpace=wrap;fontSize=12;fontStyle=0;shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_availability_zone;strokeColor=#545B64;fillColor=none;verticalAlign=top;align=left;spacingLeft=30;fontColor=#545B64;dashed=1;container=1;pointerEvents=0;collapsible=0;recursiveResize=0;`;
}

function publicSubnetStyle(): string {
  return `sketch=0;${GROUP_POINTS}outlineConnect=0;gradientColor=none;html=1;whiteSpace=wrap;fontSize=12;fontStyle=0;shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_security_group;grStroke=0;strokeColor=#248814;fillColor=#E9F3E6;verticalAlign=top;align=left;spacingLeft=30;fontColor=#248814;dashed=0;container=1;pointerEvents=0;collapsible=0;recursiveResize=0;`;
}

function privateSubnetStyle(): string {
  return `sketch=0;${GROUP_POINTS}outlineConnect=0;gradientColor=none;html=1;whiteSpace=wrap;fontSize=12;fontStyle=0;shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_security_group;grStroke=0;strokeColor=#147EBA;fillColor=#E6F2F8;verticalAlign=top;align=left;spacingLeft=30;fontColor=#147EBA;dashed=0;container=1;pointerEvents=0;collapsible=0;recursiveResize=0;`;
}

function clusterContainerStyle(): string {
  return "sketch=0;fillColor=none;strokeColor=#ED7100;dashed=1;dashPattern=5 5;fontColor=#ED7100;fontSize=10;fontStyle=0;container=1;pointerEvents=0;collapsible=0;recursiveResize=0;html=1;whiteSpace=wrap;verticalAlign=top;rounded=1;arcSize=3;";
}

function asgContainerStyle(): string {
  return `sketch=0;${GROUP_POINTS}outlineConnect=0;gradientColor=none;html=1;whiteSpace=wrap;fontSize=10;fontStyle=0;shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_auto_scaling_group;strokeColor=#ED7100;fillColor=none;verticalAlign=top;align=left;spacingLeft=30;fontColor=#ED7100;dashed=1;container=1;pointerEvents=0;collapsible=0;recursiveResize=0;`;
}

function categoryBoxStyle(borderColor: string): string {
  return `fillColor=none;strokeColor=${borderColor};dashed=1;dashPattern=3 3;fontColor=${borderColor};fontSize=10;fontStyle=1;container=1;pointerEvents=0;collapsible=0;recursiveResize=0;html=1;whiteSpace=wrap;verticalAlign=top;rounded=1;arcSize=5;`;
}

// ─── 6. Edge Generation Logic ─────────────────────────────────────────

interface IdMap { [serviceLower: string]: string }
type PosMap = Record<string, { x: number; y: number }>;

type AnchorSide = "top" | "bottom" | "left" | "right";

/** Count icons near a vertical segment at x, between y1 and y2 */
function obstaclesOnVertical(
  x: number, y1: number, y2: number,
  posMap: PosMap, exclude: Set<string>,
): number {
  const minY = Math.min(y1, y2) + ICON_H / 2;
  const maxY = Math.max(y1, y2) - ICON_H / 2;
  let count = 0;
  for (const [id, pos] of Object.entries(posMap)) {
    if (exclude.has(id)) continue;
    if (Math.abs(pos.x - x) < ICON_W && pos.y > minY && pos.y < maxY) count++;
  }
  return count;
}

/** Count icons near a horizontal segment at y, between x1 and x2 */
function obstaclesOnHorizontal(
  y: number, x1: number, x2: number,
  posMap: PosMap, exclude: Set<string>,
): number {
  const minX = Math.min(x1, x2) + ICON_W / 2;
  const maxX = Math.max(x1, x2) - ICON_W / 2;
  let count = 0;
  for (const [id, pos] of Object.entries(posMap)) {
    if (exclude.has(id)) continue;
    if (Math.abs(pos.y - y) < ICON_H && pos.x > minX && pos.x < maxX) count++;
  }
  return count;
}

/** Count obstacles on the ACTUAL orthogonal path for a given (exit, entry) pair.
 *  Z-shape (same-axis exit/entry): 3 segments — exit + jog + entry.
 *  L-shape (mixed-axis): 2 segments — exit + entry.
 *  Jog midpoint approximated at center between src and tgt. */
function countPathObstacles(
  src: { x: number; y: number }, tgt: { x: number; y: number },
  exit: AnchorSide, entry: AnchorSide,
  posMap: PosMap, exclude: Set<string>,
): number {
  const vExit = exit === "bottom" || exit === "top";
  const vEntry = entry === "top" || entry === "bottom";

  if (vExit && vEntry) {
    // Z-shape: vertical at src.x → horizontal jog at midY → vertical at tgt.x
    const midY = (src.y + tgt.y) / 2;
    return obstaclesOnVertical(src.x, src.y, midY, posMap, exclude)
         + obstaclesOnHorizontal(midY, src.x, tgt.x, posMap, exclude)
         + obstaclesOnVertical(tgt.x, midY, tgt.y, posMap, exclude);
  }
  if (!vExit && !vEntry) {
    // Z-shape: horizontal at src.y → vertical jog at midX → horizontal at tgt.y
    const midX = (src.x + tgt.x) / 2;
    return obstaclesOnHorizontal(src.y, src.x, midX, posMap, exclude)
         + obstaclesOnVertical(midX, src.y, tgt.y, posMap, exclude)
         + obstaclesOnHorizontal(tgt.y, midX, tgt.x, posMap, exclude);
  }
  if (vExit) {
    // L-shape: vertical at src.x → horizontal at tgt.y
    return obstaclesOnVertical(src.x, src.y, tgt.y, posMap, exclude)
         + obstaclesOnHorizontal(tgt.y, src.x, tgt.x, posMap, exclude);
  }
  // L-shape: horizontal at src.y → vertical at tgt.x
  return obstaclesOnHorizontal(src.y, src.x, tgt.x, posMap, exclude)
       + obstaclesOnVertical(tgt.x, src.y, tgt.y, posMap, exclude);
}

/** Is there an icon immediately adjacent (within 1 icon+gap) in the exit/entry direction?
 *  This catches cases where the path count is 0 but the line visually starts INTO an obstacle. */
function hasNearbyIcon(
  origin: { x: number; y: number }, side: AnchorSide,
  posMap: PosMap, exclude: Set<string>,
): boolean {
  const range = ICON_H + ICON_GAP; // ~78px
  for (const [id, pos] of Object.entries(posMap)) {
    if (exclude.has(id)) continue;
    const dx = pos.x - origin.x;
    const dy = pos.y - origin.y;
    switch (side) {
      case "right":  if (dx > 0 && dx < range && Math.abs(dy) < ICON_H) return true; break;
      case "left":   if (dx < 0 && dx > -range && Math.abs(dy) < ICON_H) return true; break;
      case "bottom": if (dy > 0 && dy < range && Math.abs(dx) < ICON_W) return true; break;
      case "top":    if (dy < 0 && dy > -range && Math.abs(dx) < ICON_W) return true; break;
    }
  }
  return false;
}

/** Choose best (exit, entry) following 4 principles:
 *  1. Shortest path — score actual orthogonal path obstacles
 *  2. Straight line preferred — straight pairs beat L-shapes at equal score
 *  3. Obstacle avoidance — path obstacles + immediate neighbor penalty
 *  4. Unique anchor points — handled by slot distribution in Phase 2.5 */
function bestSides(
  src: { x: number; y: number }, tgt: { x: number; y: number },
  posMap: PosMap, srcId: string, tgtId: string,
): { exit: AnchorSide; entry: AnchorSide } {
  const dx = tgt.x - src.x;
  const dy = tgt.y - src.y;
  const exclude = new Set([srcId, tgtId]);
  const primaryVert = Math.abs(dy) >= Math.abs(dx);

  // Direction toward target on each axis
  const vE: AnchorSide = dy >= 0 ? "bottom" : "top";
  const vN: AnchorSide = dy >= 0 ? "top" : "bottom";
  const hE: AnchorSide = dx >= 0 ? "right" : "left";
  const hN: AnchorSide = dx >= 0 ? "left" : "right";

  // 4 candidates: 2 straight (aligned) + 2 L-shapes (mixed)
  const pairs: [AnchorSide, AnchorSide, boolean][] = [
    [vE, vN, true],   // straight vertical
    [hE, hN, true],   // straight horizontal
    [vE, hN, false],  // L: vertical-first → horizontal
    [hE, vN, false],  // L: horizontal-first → vertical
  ];

  const NEAR_PENALTY = 5;
  const scored = pairs.map(([exit, entry, straight]) => ({
    exit, entry,
    score: countPathObstacles(src, tgt, exit, entry, posMap, exclude)
         + (hasNearbyIcon(src, exit, posMap, exclude) ? NEAR_PENALTY : 0)
         + (hasNearbyIcon(tgt, entry, posMap, exclude) ? NEAR_PENALTY : 0),
    straight,
    primary: straight && (primaryVert ? exit === vE : exit === hE),
  }));

  scored.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;         // fewest obstacles
    if (a.straight !== b.straight) return a.straight ? -1 : 1; // prefer straight
    if (a.primary !== b.primary) return a.primary ? -1 : 1;    // prefer primary axis
    return 0;
  });

  return { exit: scored[0].exit, entry: scored[0].entry };
}

function sideToAnchor(side: AnchorSide, slot: number): { x: number; y: number } {
  switch (side) {
    case "top": return { x: slot, y: 0 };
    case "bottom": return { x: slot, y: 1 };
    case "left": return { x: 0, y: slot };
    case "right": return { x: 1, y: slot };
  }
}

function generateEdges(classified: ClassifiedServices, idMap: IdMap, posMap: PosMap): string[] {
  const edgeColor = "#545B64";

  function findId(...keywords: string[]): string | null {
    for (const kw of keywords) {
      for (const [k, v] of Object.entries(idMap)) {
        if (k.includes(kw)) return v;
      }
    }
    return null;
  }

  function findAllIds(...keywords: string[]): string[] {
    const ids: string[] = [];
    for (const kw of keywords) {
      for (const [k, v] of Object.entries(idMap)) {
        if (k.includes(kw) && !ids.includes(v)) ids.push(v);
      }
    }
    return ids;
  }

  const usersId = idMap["__users__"];
  const route53 = findId("route 53");
  const cloudfront = findId("cloudfront");
  const waf = findId("waf");
  const alb = findId("alb", "nlb");
  const apiGw = findId("api gateway", "websocket api");
  const appSvcs = findAllIds("ecs", "eks", "lambda", "ec2 auto");
  const cacheSvc = findId("elasticache", "dax");
  const rdsProxy = findId("rds proxy");
  const dbSvcs = findAllIds("aurora", "rds postgresql", "rds mysql", "dynamodb", "opensearch");
  const msgSvcs = findAllIds("sqs", "sns", "eventbridge", "kinesis", "msk");
  const s3 = findId("s3");
  const ecr = findId("ecr");

  // ── Phase 1: collect edge definitions ──
  interface EdgeDef { src: string; tgt: string; color: string; label?: string; dashed: boolean }
  const defs: EdgeDef[] = [];

  // Main flow chain (AWS reference):
  // With API GW:    Users → Route53 → CloudFront → API GW → ALB → App  (VPC Link, no IGW)
  // Without API GW: Users → Route53 → CloudFront → IGW → ALB → App     (public internet)
  const igw = idMap["__igw__"];
  const flowChain: { id: string; key: string }[] = [];
  if (usersId)    flowChain.push({ id: usersId, key: "users" });
  if (route53)    flowChain.push({ id: route53, key: "route53" });
  if (cloudfront) flowChain.push({ id: cloudfront, key: "cloudfront" });
  if (apiGw)      flowChain.push({ id: apiGw, key: "apigw" });
  if (igw && alb && !apiGw) flowChain.push({ id: igw, key: "igw" });
  if (alb)        flowChain.push({ id: alb, key: "alb" });
  if (appSvcs[0]) flowChain.push({ id: appSvcs[0], key: "app" });

  for (let i = 0; i < flowChain.length - 1; i++) {
    const label = flowChain[i].key === "users" ? "HTTPS" : undefined;
    defs.push({ src: flowChain[i].id, tgt: flowChain[i + 1].id, color: edgeColor, label, dashed: false });
  }

  // WAF → CloudFront or ALB
  if (waf && cloudfront) {
    defs.push({ src: waf, tgt: cloudfront, color: edgeColor, label: "Protect", dashed: false });
  } else if (waf && alb) {
    defs.push({ src: waf, tgt: alb, color: edgeColor, label: "Protect", dashed: false });
  }

  // App → Cache
  if (appSvcs.length > 0 && cacheSvc) {
    defs.push({ src: appSvcs[0], tgt: cacheSvc, color: edgeColor, dashed: false });
  }

  // App → DB (via proxy if exists)
  if (appSvcs.length > 0 && dbSvcs.length > 0) {
    if (rdsProxy) {
      defs.push({ src: appSvcs[0], tgt: rdsProxy, color: edgeColor, dashed: false });
      defs.push({ src: rdsProxy, tgt: dbSvcs[0], color: edgeColor, dashed: false });
    } else {
      defs.push({ src: appSvcs[0], tgt: dbSvcs[0], color: edgeColor, dashed: false });
    }
  }

  // App → Messaging
  if (appSvcs.length > 0 && msgSvcs.length > 0) {
    defs.push({ src: appSvcs[0], tgt: msgSvcs[0], color: edgeColor, label: "Events", dashed: true });
  }

  // CloudFront → S3
  if (cloudfront && s3) {
    defs.push({ src: cloudfront, tgt: s3, color: edgeColor, label: "Static", dashed: false });
  }

  // ECR → App
  if (ecr && appSvcs.length > 0) {
    defs.push({ src: ecr, tgt: appSvcs[0], color: "#888888", label: "Pull", dashed: true });
  }

  // ── Phase 2: compute best sides (obstacle-aware) ──
  const edgeSides: { exit: AnchorSide; entry: AnchorSide }[] = [];
  for (const def of defs) {
    const srcPos = posMap[def.src];
    const tgtPos = posMap[def.tgt];
    const sides = srcPos && tgtPos
      ? bestSides(srcPos, tgtPos, posMap, def.src, def.tgt)
      : { exit: "bottom" as AnchorSide, entry: "top" as AnchorSide };
    edgeSides.push(sides);
  }

  // ── Phase 2.5: group per side, sort by target/source position ──
  // This ensures: edges going UP start from a higher slot than edges going DOWN
  const exitGroups: Record<string, number[]> = {};
  const entryGroups: Record<string, number[]> = {};
  for (let i = 0; i < defs.length; i++) {
    const ek = `${defs[i].src}:${edgeSides[i].exit}`;
    const nk = `${defs[i].tgt}:${edgeSides[i].entry}`;
    (exitGroups[ek] ??= []).push(i);
    (entryGroups[nk] ??= []).push(i);
  }

  // Sort exit groups by target position (Y for left/right sides, X for top/bottom)
  for (const [key, indices] of Object.entries(exitGroups)) {
    const side = key.split(":")[1] as AnchorSide;
    indices.sort((a, b) => {
      const pa = posMap[defs[a].tgt];
      const pb = posMap[defs[b].tgt];
      if (!pa || !pb) return 0;
      return (side === "left" || side === "right") ? pa.y - pb.y : pa.x - pb.x;
    });
  }

  // Sort entry groups by source position
  for (const [key, indices] of Object.entries(entryGroups)) {
    const side = key.split(":")[1] as AnchorSide;
    indices.sort((a, b) => {
      const pa = posMap[defs[a].src];
      const pb = posMap[defs[b].src];
      if (!pa || !pb) return 0;
      return (side === "left" || side === "right") ? pa.y - pb.y : pa.x - pb.x;
    });
  }

  // Build per-edge slot order from sorted groups
  const exitOrder: number[] = new Array(defs.length).fill(0);
  const entryOrder: number[] = new Array(defs.length).fill(0);
  for (const indices of Object.values(exitGroups)) {
    indices.forEach((di, order) => { exitOrder[di] = order; });
  }
  for (const indices of Object.values(entryGroups)) {
    indices.forEach((di, order) => { entryOrder[di] = order; });
  }

  // ── Phase 3: generate cells with position-ordered slots ──
  const cells: string[] = [];
  for (let i = 0; i < defs.length; i++) {
    const def = defs[i];
    const sides = edgeSides[i];
    const ek = `${def.src}:${sides.exit}`;
    const nk = `${def.tgt}:${sides.entry}`;

    const exitSlot = (exitOrder[i] + 1) / (exitGroups[ek].length + 1);
    const entrySlot = (entryOrder[i] + 1) / (entryGroups[nk].length + 1);
    const ea = sideToAnchor(sides.exit, exitSlot);
    const na = sideToAnchor(sides.entry, entrySlot);

    cells.push(edgeCell(nextId(), def.src, def.tgt, def.color, def.label, def.dashed, {
      exitX: ea.x, exitY: ea.y, entryX: na.x, entryY: na.y,
    }));
  }

  return cells;
}

// ─── 7. Main Export ───────────────────────────────────────────────────

function getMirrorLabel(label: string, svcName: string): string {
  const n = svcName.toLowerCase();
  if (n.includes("aurora") || n.includes("rds")) return `${label} (Standby)`;
  if (n.includes("elasticache") || n.includes("redis") || n.includes("dax")) return `${label} (Replica)`;
  return label;
}

/** Place flat icons in a subnet (grid layout), recording absolute positions */
function placeIcons(
  items: { svc: ArchService; info: ShapeInfo }[],
  parentId: string,
  startY: number,
  cells: string[],
  idMap: IdMap,
  posMap: PosMap,
  parentAbsX: number,
  parentAbsY: number,
  mirror = false,
) {
  items.forEach((item, idx) => {
    const row = Math.floor(idx / MAX_PER_ROW);
    const col = idx % MAX_PER_ROW;
    const x = SUBNET_PAD.left + col * (ICON_W + ICON_GAP);
    const y = startY + row * (ICON_H + ICON_LABEL_H);
    const id = nextId();
    const label = mirror ? getMirrorLabel(item.info.label, item.svc.name) : item.info.label;
    cells.push(iconCell(id, label, item.info.shape, item.info.fillColor, parentId, x, y));
    if (!mirror) {
      const key = item.svc.name.toLowerCase();
      if (!idMap[key]) idMap[key] = id;
      posMap[id] = { x: parentAbsX + x + ICON_W / 2, y: parentAbsY + y + ICON_H / 2 };
    }
  });
}

export function generateDiagramXml(arch: Architecture, state: WizardState): string {
  _id = 1; // reset counter

  const classified = classifyServices(arch);
  const azNum = state.network?.az_count === "3az" ? 3 : state.network?.az_count === "1az" ? 1 : 2;
  const subnetTier = state.network?.subnet_tier || "2tier";
  const layout = computeLayout(classified, azNum, subnetTier);

  const cells: string[] = [];
  const idMap: IdMap = {};
  const posMap: PosMap = {};

  // Root cells
  cells.push(`<mxCell id="0"/>`);
  cells.push(`<mxCell id="1" parent="0"/>`);

  // ── Users icon (outside AWS Cloud, centered above Cloud) ──
  const usersId = nextId();
  const cloudX = (layout.totalW - layout.cloudW) / 2;
  const usersX = cloudX + (layout.cloudW - ICON_W) / 2;
  const usersLabel = subnetTier === "private" ? "Internal Users" : "Users";
  cells.push(iconCell(usersId, usersLabel, "mxgraph.aws4.users", "#232F3E", "1", usersX, USERS_Y));
  idMap["__users__"] = usersId;
  posMap[usersId] = { x: usersX + ICON_W / 2, y: USERS_Y + ICON_H / 2 };

  // ── AWS Cloud container ──
  const cloudId = nextId();
  cells.push(groupCell(cloudId, "AWS Cloud", awsCloudStyle(), "1",
    cloudX, layout.cloudY, layout.cloudW, layout.cloudH));

  // ── External services (inside Cloud, above Region) ──
  if (classified.external.length > 0) {
    const startX = (layout.cloudW - layout.extRowW) / 2;
    classified.external.forEach((item, i) => {
      const id = nextId();
      const x = startX + i * (ICON_W + ICON_GAP);
      cells.push(iconCell(id, item.info.label, item.info.shape, item.info.fillColor, cloudId, x, CLOUD_PAD.top));
      idMap[item.svc.name.toLowerCase()] = id;
      posMap[id] = { x: cloudX + x + ICON_W / 2, y: layout.cloudY + CLOUD_PAD.top + ICON_H / 2 };
    });
  }

  // ── Region container (inside Cloud) ──
  const regionId = nextId();
  const regionX = (layout.cloudW - layout.regionW) / 2;
  const regionY = CLOUD_PAD.top + layout.extRowH;
  cells.push(groupCell(regionId, "Region (ap-northeast-2)", regionStyle(), cloudId,
    regionX, regionY, layout.regionW, layout.regionH));

  // ── Entrypoint icons (API GW etc. — inside Region, above VPC) ──
  const regionAbsX = cloudX + regionX;
  const regionAbsY = layout.cloudY + regionY;
  if (classified.entrypoint.length > 0) {
    const entryStartX = REGION_PAD.left + (layout.hasVpc ? (layout.vpcW - layout.entryRowW) / 2 : 20);
    classified.entrypoint.forEach((item, i) => {
      const id = nextId();
      const x = entryStartX + i * (ICON_W + ICON_GAP);
      cells.push(iconCell(id, item.info.label, item.info.shape, item.info.fillColor, regionId, x, REGION_PAD.top));
      idMap[item.svc.name.toLowerCase()] = id;
      posMap[id] = { x: regionAbsX + x + ICON_W / 2, y: regionAbsY + REGION_PAD.top + ICON_H / 2 };
    });
  }

  // ── VPC container (inside Region, shifted down by entrypoint row) ──
  const vpcOffsetY = REGION_PAD.top + layout.entryRowH;
  let vpcId = "";
  if (layout.hasVpc) {
    vpcId = nextId();
    const vpcX = REGION_PAD.left;
    const vpcY = vpcOffsetY;
    cells.push(groupCell(vpcId, "VPC (10.0.0.0/16)", vpcStyle(), regionId,
      vpcX, vpcY, layout.vpcW, layout.vpcH));

    const vpcAbsX = regionAbsX + vpcX;
    const vpcAbsY = regionAbsY + vpcY;

    // ── Internet Gateway (straddles VPC top border) ──
    if (layout.hasIgw) {
      const igwId = nextId();
      const igwX = (layout.vpcW - ICON_W) / 2;
      const igwY = -(ICON_H / 2); // half above, half below VPC border
      cells.push(iconCell(igwId, "Internet Gateway", "mxgraph.aws4.internet_gateway", "#8C4FFF", vpcId, igwX, igwY));
      idMap["__igw__"] = igwId;
      posMap[igwId] = { x: vpcAbsX + igwX + ICON_W / 2, y: vpcAbsY + igwY + ICON_H / 2 };
    }

    // ── AZ containers ──
    for (let azIdx = 0; azIdx < azNum; azIdx++) {
      const azId = nextId();
      const azX = VPC_PAD.left + azIdx * (layout.azW + AZ_GAP);
      const azY = VPC_PAD.top + (layout.hasIgw ? IGW_SPACE : 0);
      const azLabel = `Availability Zone ${azIdx + 1}`;
      cells.push(groupCell(azId, azLabel, azStyle(), vpcId,
        azX, azY, layout.azW, layout.azH));

      const azAbsX = vpcAbsX + azX;
      const azAbsY = vpcAbsY + azY;

      // ── Subnets inside this AZ ──
      let subnetY = AZ_PAD.top;
      layout.subnets.forEach((sub, si) => {
        const subId = nextId();
        const subW = layout.maxSubnetW;
        const subH = layout.subnetSizes[si].h;
        if (subH === 0) return;

        const subX = AZ_PAD.left;
        const style = sub.styleKey === "public" ? publicSubnetStyle() : privateSubnetStyle();
        cells.push(groupCell(subId, sub.label, style, azId,
          subX, subnetY, subW, subH));

        const subAbsX = azAbsX + subX;
        const subAbsY = azAbsY + subnetY;

        // Place service icons in all AZs; mirror AZs (b/c) skip idMap/posMap
        const mirror = azIdx > 0;

        if (sub.styleKey === "public") {
          placeIcons(classified.public, subId, SUBNET_PAD.top, cells, idMap, posMap, subAbsX, subAbsY, mirror);

        } else if (sub.styleKey === "app" || sub.styleKey === "merged") {
          // "app" = 3tier app subnet, "merged" = 2tier/private combined subnet
          const others = sub.styleKey === "merged" ? layout.mergedOther : layout.appOther;

          if (layout.hasClusterContainer && layout.appCompute.length > 0) {
            // EKS Cluster or ASG container wrapping compute icons
            const clusterId = nextId();
            const clusterX = SUBNET_PAD.left;
            const clusterY = SUBNET_PAD.top;
            const clusterW = subW - SUBNET_PAD.left - SUBNET_PAD.right;
            const clusterH = layout.subnetSizes[si].clusterH;
            const clusterLabel = layout.needsCluster ? "EKS Cluster" : "Auto Scaling Group";
            const clusterSt = layout.needsCluster ? clusterContainerStyle() : asgContainerStyle();
            cells.push(groupCell(clusterId, clusterLabel, clusterSt, subId,
              clusterX, clusterY, clusterW, clusterH));

            const clusterAbsX = subAbsX + clusterX;
            const clusterAbsY = subAbsY + clusterY;

            // Compute icons inside cluster
            layout.appCompute.forEach((item, idx) => {
              const row = Math.floor(idx / MAX_PER_ROW);
              const col = idx % MAX_PER_ROW;
              const iconX = CLUSTER_PAD.left + col * (ICON_W + ICON_GAP);
              const iconY = CLUSTER_PAD.top + row * (ICON_H + ICON_LABEL_H);
              const iconId = nextId();
              const iconLabel = mirror ? getMirrorLabel(item.info.label, item.svc.name) : item.info.label;
              cells.push(iconCell(iconId, iconLabel, item.info.shape, item.info.fillColor, clusterId, iconX, iconY));
              if (!mirror) {
                const key = item.svc.name.toLowerCase();
                if (!idMap[key]) idMap[key] = iconId;
                posMap[iconId] = { x: clusterAbsX + iconX + ICON_W / 2, y: clusterAbsY + iconY + ICON_H / 2 };
              }
            });

            // Non-compute icons after cluster
            if (others.length > 0) {
              const otherStartY = clusterY + clusterH + CLUSTER_GAP;
              placeIcons(others, subId, otherStartY, cells, idMap, posMap, subAbsX, subAbsY, mirror);
            }
          } else {
            // No cluster — place all icons directly
            const allItems = sub.styleKey === "merged" ? layout.allPrivate : classified.app;
            placeIcons(allItems, subId, SUBNET_PAD.top, cells, idMap, posMap, subAbsX, subAbsY, mirror);
          }

        } else if (sub.styleKey === "data") {
          // Data subnet (3tier only) — flat layout
          placeIcons(classified.data, subId, SUBNET_PAD.top, cells, idMap, posMap, subAbsX, subAbsY, mirror);
        }

        subnetY += subH + SUBNET_GAP;
      });
    }
  }

  // ── VPC Boundary icons (VPC Endpoint — inside VPC, below AZs) ──
  if (vpcId && classified.vpcBoundary.length > 0) {
    const vpcAbsX2 = regionAbsX + REGION_PAD.left;
    const vpcAbsY2 = regionAbsY + vpcOffsetY;
    const bdryY = VPC_PAD.top + (layout.hasIgw ? IGW_SPACE : 0) + layout.azH + VPCBDRY_GAP;
    classified.vpcBoundary.forEach((item, i) => {
      const id = nextId();
      const x = VPC_PAD.left + i * (ICON_W + ICON_GAP);
      cells.push(iconCell(id, item.info.label, item.info.shape, item.info.fillColor, vpcId, x, bdryY));
      idMap[item.svc.name.toLowerCase()] = id;
      posMap[id] = { x: vpcAbsX2 + x + ICON_W / 2, y: vpcAbsY2 + bdryY + ICON_H / 2 };
    });
  }

  // ── Region sidebar (managed services, grouped) ──
  if (layout.sidebarNeeded) {
    const sideX = REGION_PAD.left + (layout.hasVpc ? layout.vpcW + 30 : 20);
    const sideGroupId = nextId();
    cells.push(groupCell(sideGroupId, "Managed Services",
      "fillColor=none;strokeColor=#545B64;dashed=1;dashPattern=3 3;fontColor=#545B64;fontSize=11;fontStyle=1;container=1;pointerEvents=0;collapsible=0;recursiveResize=0;html=1;whiteSpace=wrap;verticalAlign=top;rounded=1;arcSize=3;",
      regionId, sideX, vpcOffsetY, SIDEBAR_W, layout.sidebarH));

    const sideAbsX = regionAbsX + sideX;
    const sideAbsY = regionAbsY + vpcOffsetY;
    let sideY = 30; // initial padding for "Managed Services" title

    for (const group of layout.sidebarGroups) {
      // Group label
      const labelId = nextId();
      cells.push(`<mxCell id="${labelId}" value="${esc(group.label)}" style="text;html=1;fontSize=10;fontStyle=1;fontColor=#232F3E;align=left;verticalAlign=middle;spacingLeft=5;fillColor=none;strokeColor=none;" vertex="1" parent="${sideGroupId}"><mxGeometry x="5" y="${sideY}" width="${SIDEBAR_W - 10}" height="${SIDEBAR_GROUP_LABEL_H}" as="geometry"/></mxCell>`);
      sideY += SIDEBAR_GROUP_LABEL_H;

      // Icons in 2-col grid
      const padLeft = (SIDEBAR_W - SIDEBAR_COLS * ICON_W - (SIDEBAR_COLS - 1) * ICON_GAP) / 2;
      group.items.forEach((item, idx) => {
        const col = idx % SIDEBAR_COLS;
        const row = Math.floor(idx / SIDEBAR_COLS);
        const iconX = padLeft + col * SIDEBAR_ICON_COL_W;
        const iconY = sideY + row * (ICON_H + ICON_LABEL_H);
        const iconId = nextId();
        cells.push(iconCell(iconId, item.info.label, item.info.shape, item.info.fillColor, sideGroupId, iconX, iconY));
        const key = item.svc.name.toLowerCase();
        if (!idMap[key]) idMap[key] = iconId;
        posMap[iconId] = { x: sideAbsX + iconX + ICON_W / 2, y: sideAbsY + iconY + ICON_H / 2 };
      });

      sideY += group.rows * (ICON_H + ICON_LABEL_H) + SIDEBAR_GROUP_GAP;
    }
  }

  // ── Helper: render category boxes at given Y ──
  function renderCatRow(cats: typeof layout.topCats, rowW: number, y: number) {
    const startX = (layout.totalW - rowW) / 2;
    let catX = startX;
    for (const cat of cats) {
      const catId = nextId();
      cells.push(groupCell(catId, cat.label, categoryBoxStyle(cat.borderColor), "1",
        catX, y, cat.w, cat.h));
      cat.items.forEach((item, idx) => {
        const row = Math.floor(idx / CAT_MAX_PER_ROW);
        const col = idx % CAT_MAX_PER_ROW;
        const iconX = CAT_PAD.left + col * (ICON_W + ICON_GAP);
        const iconY = CAT_PAD.top + row * (ICON_H + ICON_LABEL_H);
        const iconId = nextId();
        cells.push(iconCell(iconId, item.info.label, item.info.shape, item.info.fillColor, catId, iconX, iconY));
        const key = item.svc.name.toLowerCase();
        if (!idMap[key]) idMap[key] = iconId;
        posMap[iconId] = { x: catX + iconX + ICON_W / 2, y: y + iconY + ICON_H / 2 };
      });
      catX += cat.w + CAT_BOX_GAP;
    }
  }

  // ── Top category boxes (CI/CD, App Stack — right of Cloud, same Y as Users) ──
  if (layout.hasTopCats) {
    const topCatX = cloudX + layout.cloudW + CAT_BOX_GAP;
    let tcX = topCatX;
    for (const cat of layout.topCats) {
      const catId = nextId();
      cells.push(groupCell(catId, cat.label, categoryBoxStyle(cat.borderColor), "1",
        tcX, USERS_Y, cat.w, cat.h));
      cat.items.forEach((item, idx) => {
        const row = Math.floor(idx / CAT_MAX_PER_ROW);
        const col = idx % CAT_MAX_PER_ROW;
        const iconX = CAT_PAD.left + col * (ICON_W + ICON_GAP);
        const iconY = CAT_PAD.top + row * (ICON_H + ICON_LABEL_H);
        const iconId = nextId();
        cells.push(iconCell(iconId, item.info.label, item.info.shape, item.info.fillColor, catId, iconX, iconY));
        const key = item.svc.name.toLowerCase();
        if (!idMap[key]) idMap[key] = iconId;
        posMap[iconId] = { x: tcX + iconX + ICON_W / 2, y: USERS_Y + iconY + ICON_H / 2 };
      });
      tcX += cat.w + CAT_BOX_GAP;
    }
  }

  // ── Bottom category boxes (K8s Ecosystem — below Cloud) ──
  if (layout.hasBottomCats) {
    const bottomCatY = layout.cloudY + layout.cloudH + CAT_ROW_GAP;
    renderCatRow(layout.bottomCats, layout.bottomCatRowW, bottomCatY);
  }

  // ── Edges ──
  const edgeCells = generateEdges(classified, idMap, posMap);
  cells.push(...edgeCells);

  // Build final XML
  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<mxfile host="app.diagrams.net" type="device">`,
    `<diagram name="Architecture" id="arch-diagram">`,
    `<mxGraphModel dx="${Math.ceil(layout.totalW + 100)}" dy="${Math.ceil(layout.totalH + 100)}" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${Math.ceil(layout.totalW + 200)}" pageHeight="${Math.ceil(layout.totalH + 200)}" math="0" shadow="0">`,
    `<root>`,
    ...cells,
    `</root>`,
    `</mxGraphModel>`,
    `</diagram>`,
    `</mxfile>`,
  ].join("\n");

  return xml;
}
