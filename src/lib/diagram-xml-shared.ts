/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Architecture, ArchService, WizardState } from "@/lib/types";

// ─── 1. Types & Shape Catalog ─────────────────────────────────────────

export type PlacementZone =
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

export interface ShapeInfo {
  shape: string;
  fillColor: string;
  zone: PlacementZone;
  label: string;
}

/** Maps lowercase keyword → draw.io shape info. First match wins. */
export const SHAPE_CATALOG: [string, ShapeInfo][] = [
  // ── External / Edge ──
  ["route 53",       { shape: "mxgraph.aws4.route_53",                   fillColor: "#8C4FFF", zone: "external", label: "Route 53" }],
  ["cloudfront",     { shape: "mxgraph.aws4.cloudfront",                 fillColor: "#8C4FFF", zone: "external", label: "CloudFront" }],
  ["bot control",    { shape: "mxgraph.aws4.waf",                        fillColor: "#DD344C", zone: "external", label: "Bot Control" }],
  ["shield",         { shape: "mxgraph.aws4.shield",                     fillColor: "#DD344C", zone: "external", label: "Shield" }],
  ["waf",            { shape: "mxgraph.aws4.waf",                        fillColor: "#DD344C", zone: "external", label: "WAF" }],
  ["lambda@edge",    { shape: "mxgraph.aws4.lambda",                     fillColor: "#ED7100", zone: "external", label: "Lambda@Edge" }],
  ["global accelerator",{ shape: "mxgraph.aws4.global_accelerator",     fillColor: "#8C4FFF", zone: "external", label: "Global Accelerator" }],

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
  ["app runner",     { shape: "mxgraph.aws4.ecs_service",                fillColor: "#ED7100", zone: "region", label: "App Runner" }],
  ["ecs fargate",    { shape: "mxgraph.aws4.ecs_service",                fillColor: "#ED7100", zone: "app", label: "ECS Fargate" }],
  ["fargate",        { shape: "mxgraph.aws4.ecs_service",                fillColor: "#ED7100", zone: "app", label: "ECS Fargate" }],
  ["eks",            { shape: "mxgraph.aws4.eks",  fillColor: "#ED7100", zone: "app", label: "EKS" }],
  ["lambda",         { shape: "mxgraph.aws4.lambda",                     fillColor: "#ED7100", zone: "app", label: "Lambda" }],
  ["ec2 auto",       { shape: "mxgraph.aws4.ec2",                        fillColor: "#ED7100", zone: "app", label: "EC2" }],
  ["rds proxy",      { shape: "mxgraph.aws4.rds_proxy",                  fillColor: "#C925D1", zone: "app", label: "RDS Proxy" }],
  ["redis pub/sub",  { shape: "mxgraph.aws4.elasticache_for_redis",      fillColor: "#C925D1", zone: "app", label: "Redis Pub/Sub" }],

  // ── Private Data Subnet (cache) ──
  ["elasticache",    { shape: "mxgraph.aws4.elasticache_for_redis",      fillColor: "#C925D1", zone: "data", label: "ElastiCache Redis" }],
  ["elasticache serverless",{ shape: "mxgraph.aws4.elasticache_for_redis", fillColor: "#C925D1", zone: "data", label: "ElastiCache SL" }],
  ["dax",            { shape: "mxgraph.aws4.dynamodb_dax",               fillColor: "#C925D1", zone: "data", label: "DynamoDB DAX" }],

  // ── Private Data Subnet (database) ──
  ["aurora postgresql", { shape: "mxgraph.aws4.aurora_instance",          fillColor: "#C925D1", zone: "data", label: "Aurora PG" }],
  ["aurora mysql",   { shape: "mxgraph.aws4.aurora_instance",            fillColor: "#C925D1", zone: "data", label: "Aurora MySQL" }],
  ["aurora global",  { shape: "mxgraph.aws4.aurora",                     fillColor: "#C925D1", zone: "data", label: "Aurora Global" }],
  ["aurora",         { shape: "mxgraph.aws4.aurora",                     fillColor: "#C925D1", zone: "data", label: "Aurora" }],
  ["rds postgresql", { shape: "mxgraph.aws4.rds_postgresql_instance",    fillColor: "#C925D1", zone: "data", label: "RDS PG" }],
  ["rds mysql",      { shape: "mxgraph.aws4.rds_mysql_instance",         fillColor: "#C925D1", zone: "data", label: "RDS MySQL" }],
  ["documentdb",     { shape: "mxgraph.aws4.documentdb_with_mongodb_compatibility", fillColor: "#C925D1", zone: "data", label: "DocumentDB" }],
  ["neptune",        { shape: "mxgraph.aws4.neptune",                    fillColor: "#C925D1", zone: "data", label: "Neptune" }],
  ["memorydb",       { shape: "mxgraph.aws4.elasticache_for_redis",      fillColor: "#C925D1", zone: "data", label: "MemoryDB" }],
  ["opensearch",     { shape: "mxgraph.aws4.elasticsearch_service",      fillColor: "#C925D1", zone: "data", label: "OpenSearch" }],

  // ── Private Data Subnet (VPC-bound messaging/storage) ──
  ["amazon mq",      { shape: "mxgraph.aws4.mq",                         fillColor: "#E7157B", zone: "data", label: "Amazon MQ" }],
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
  ["security hub",   { shape: "mxgraph.aws4.security_hub",               fillColor: "#DD344C", zone: "region", label: "Security Hub" }],
  ["audit manager",  { shape: "mxgraph.aws4.audit_manager",              fillColor: "#DD344C", zone: "region", label: "Audit Manager" }],
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
  ["iot greengrass", { shape: "mxgraph.aws4.greengrass",                  fillColor: "#7AA116", zone: "region", label: "Greengrass" }],
  ["sagemaker",      { shape: "mxgraph.aws4.sagemaker",                  fillColor: "#1B660F", zone: "region", label: "SageMaker" }],
  ["bedrock",        { shape: "mxgraph.aws4.sagemaker",                  fillColor: "#1B660F", zone: "region", label: "Bedrock" }],
  ["quicksight",     { shape: "mxgraph.aws4.quicksight",                 fillColor: "#8C4FFF", zone: "region", label: "QuickSight" }],
  ["vpc lattice",    { shape: "mxgraph.aws4.app_mesh",                   fillColor: "#8C4FFF", zone: "region", label: "VPC Lattice" }],
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
  ["network firewall", { shape: "mxgraph.aws4.network_firewall",        fillColor: "#DD344C", zone: "region", label: "Network FW" }],
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
  ["datadog",        { shape: "mxgraph.aws4.cloudwatch",                 fillColor: "#E7157B", zone: "region", label: "Datadog" }],
  ["argocd",         { shape: "mxgraph.aws4.codepipeline",               fillColor: "#E7157B", zone: "cicd", label: "ArgoCD" }],
  ["flux",           { shape: "mxgraph.aws4.codepipeline",               fillColor: "#E7157B", zone: "cicd", label: "Flux" }],
  ["prometheus",     { shape: "mxgraph.aws4.cloudwatch",                 fillColor: "#E7157B", zone: "region", label: "Prometheus" }],
  ["grafana",        { shape: "mxgraph.aws4.cloudwatch",                 fillColor: "#E7157B", zone: "region", label: "Grafana" }],
  ["container insights", { shape: "mxgraph.aws4.cloudwatch",             fillColor: "#E7157B", zone: "region", label: "Container Insights" }],
  ["helm",           { shape: "mxgraph.aws4.cloudformation",             fillColor: "#E7157B", zone: "cicd", label: "Helm" }],
  ["cert-manager",   { shape: "mxgraph.aws4.certificate_manager",        fillColor: "#DD344C", zone: "app", label: "cert-manager" }],
  ["external secrets",{ shape: "mxgraph.aws4.secrets_manager",           fillColor: "#DD344C", zone: "app", label: "Ext Secrets" }],
  ["secrets store csi",{ shape: "mxgraph.aws4.secrets_manager",          fillColor: "#DD344C", zone: "app", label: "Secrets CSI" }],
  ["istio gateway",    { shape: "mxgraph.aws4.eks",  fillColor: "#ED7100", zone: "app", label: "Istio GW" }],
  ["gateway api",      { shape: "mxgraph.aws4.eks",  fillColor: "#ED7100", zone: "app", label: "Gateway API" }],
  ["managed prometheus",{ shape: "mxgraph.aws4.cloudwatch",             fillColor: "#E7157B", zone: "region", label: "AMP" }],
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
  [".net",            { shape: "mxgraph.aws4.ecs_service",                fillColor: "#ED7100", zone: "appstack", label: ".NET" }],
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

export function lookupShape(name: string): ShapeInfo | null {
  const n = name.toLowerCase();
  for (const [kw, info] of SHAPE_CATALOG) {
    if (n.includes(kw)) return info;
  }
  return null;
}

// ─── 2. Service Classification ────────────────────────────────────────

export type SvcItem = { svc: ArchService; info: ShapeInfo };

export interface ClassifiedServices {
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

export function classifyServices(arch: Architecture): ClassifiedServices {
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

export const ICON_W = 48, ICON_H = 48;
export const ICON_GAP = 30;
export const ICON_LABEL_H = 40;
export const MAX_PER_ROW = 5;

export const SUBNET_PAD = { top: 40, bottom: 15, left: 20, right: 20 };
export const AZ_PAD = { top: 40, bottom: 15, left: 15, right: 15 };
export const VPC_PAD = { top: 45, bottom: 20, left: 20, right: 20 };
export const REGION_PAD = { top: 40, bottom: 20, left: 20, right: 20 };
export const CLOUD_PAD = { top: 40, bottom: 20, left: 20, right: 20 };

export const AZ_GAP = 40;
export const SUBNET_GAP = 15;
export const USERS_Y = 20;
export const USERS_TO_CLOUD_GAP = 60;
export const EXTERNAL_TO_REGION_GAP = 40;
export const SIDEBAR_W = 220;
export const SIDEBAR_COLS = 2;
export const SIDEBAR_GROUP_LABEL_H = 22;
export const SIDEBAR_GROUP_GAP = 12;
export const SIDEBAR_ICON_COL_W = ICON_W + ICON_GAP;
export const IGW_SPACE = 60;
export const ENTRY_TO_VPC_GAP = 40;
export const VPCBDRY_GAP = 15;
export const CLUSTER_PAD = { top: 35, bottom: 12, left: 15, right: 15 };
export const CLUSTER_GAP = 10;

// ── Category boxes (non-AWS services, below Cloud) ──
export const CAT_MAX_PER_ROW = 4;
export const CAT_PAD = { top: 35, bottom: 10, left: 15, right: 15 };
export const CAT_BOX_GAP = 20;
export const CAT_ROW_GAP = 30;

export interface CategoryDef {
  key: string;
  label: string;
  borderColor: string;
  position: "top" | "bottom";
  items: SvcItem[];
  w: number;
  h: number;
}

export const CATEGORY_META: { key: keyof ClassifiedServices; label: string; borderColor: string; position: "top" | "bottom" }[] = [
  { key: "cicd",       label: "CI/CD",                  borderColor: "#ED7100", position: "top" },
  { key: "appstack",   label: "App Stack",              borderColor: "#147EBA", position: "top" },
];

// ── Sidebar sub-group definitions for region services ──
export interface SidebarGroupDef {
  key: string;
  label: string;
  items: SvcItem[];
  rows: number;
  h: number;
}

export const SIDEBAR_GROUP_ORDER = ["security", "storage", "integration", "observability", "networking", "devops", "analytics"];
export const SIDEBAR_GROUP_LABELS: Record<string, string> = {
  security: "Security", storage: "Storage", integration: "Integration",
  observability: "Observability", networking: "Networking", devops: "DevOps", analytics: "Analytics",
};
export const SIDEBAR_GROUP_MAP = new Map<string, string>([
  ["ACM", "security"], ["Cognito", "security"], ["IAM SSO", "security"],
  ["Secrets Mgr", "security"], ["KMS", "security"], ["GuardDuty", "security"],
  ["Inspector", "security"], ["Macie", "security"], ["IAM Roles", "security"],
  ["Security Group", "security"], ["Config", "security"], ["Organizations", "security"],
  ["Synthetics", "security"],
  ["S3", "storage"], ["S3 CRR", "storage"], ["AWS Backup", "storage"],
  ["DynamoDB", "storage"], ["DynamoDB PITR", "storage"], ["Global Tables", "storage"],
  ["Timestream", "storage"], ["ECR", "storage"], ["Aurora Global", "storage"],
  ["SQS", "integration"], ["SNS", "integration"], ["EventBridge", "integration"],
  ["Kinesis", "integration"], ["Step Functions", "integration"],
  ["AppSync", "integration"], ["Cloud Map", "integration"], ["EB Scheduler", "integration"],
  ["IoT Core", "integration"],
  ["CloudWatch", "observability"], ["X-Ray", "observability"], ["CloudTrail", "observability"],
  ["VPC Flow Logs", "observability"], ["SSM", "observability"],
  ["Prometheus", "observability"], ["Grafana", "observability"], ["Container Insights", "observability"],
  ["Transit GW", "networking"], ["VPN", "networking"], ["Direct Connect", "networking"],
  ["VPN+DX", "networking"], ["R53 Failover", "networking"],
  ["CDK", "devops"], ["CFn", "devops"], ["CodePipeline", "devops"],
  ["AWS Batch", "devops"], ["ECS Scheduled", "devops"],
  ["Glue ETL", "analytics"], ["Athena", "analytics"], ["Redshift", "analytics"],
  ["Lake Formation", "analytics"], ["Schema Registry", "analytics"],
]);

export function buildSidebarGroups(regionItems: SvcItem[]): SidebarGroupDef[] {
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

export function catBoxSize(count: number): { w: number; h: number } {
  if (count === 0) return { w: 0, h: 0 };
  const perRow = Math.min(count, CAT_MAX_PER_ROW);
  const rows = Math.ceil(count / CAT_MAX_PER_ROW);
  const w = CAT_PAD.left + perRow * (ICON_W + ICON_GAP) - ICON_GAP + CAT_PAD.right;
  const h = CAT_PAD.top + rows * (ICON_H + ICON_LABEL_H) + CAT_PAD.bottom;
  return { w: Math.max(w, 130), h };
}

// ─── 4. Size Calculation Helpers ──────────────────────────────────────

export function subnetSize(count: number): { w: number; h: number } {
  if (count === 0) return { w: 0, h: 0 };
  const perRow = Math.min(count, MAX_PER_ROW);
  const rows = Math.ceil(count / MAX_PER_ROW);
  const w = SUBNET_PAD.left + perRow * (ICON_W + ICON_GAP) - ICON_GAP + SUBNET_PAD.right;
  const h = SUBNET_PAD.top + rows * (ICON_H + ICON_LABEL_H) + SUBNET_PAD.bottom;
  return { w: Math.max(w, 200), h };
}

export interface SubnetDef {
  label: string;
  count: number;
  styleKey: string;
}

export interface SubnetSizeInfo {
  w: number;
  h: number;
  clusterH: number;
}

export const COMPUTE_KEYWORDS = ["ecs", "eks", "fargate", "lambda", "ec2"];
export const CLUSTER_ADDON_KEYWORDS = [
  "karpenter", "cluster autoscaler", "alb ingress", "nginx ingress",
  "kong", "traefik", "istio", "kiali", "app mesh",
  "cert-manager", "external secrets", "secrets store csi",
  "velero", "keda", "vpa", "k8s dns",
];

export function isComputeService(name: string): boolean {
  const n = name.toLowerCase();
  return COMPUTE_KEYWORDS.some(kw => n.includes(kw));
}

export function isClusterService(name: string): boolean {
  const n = name.toLowerCase();
  return COMPUTE_KEYWORDS.some(kw => n.includes(kw))
      || CLUSTER_ADDON_KEYWORDS.some(kw => n.includes(kw));
}

// ─── 5. XML Builder Helpers ───────────────────────────────────────────

let _id = 1;
export function resetIdCounter(): void { _id = 1; }
export function nextId(): string { return `c${_id++}`; }

export function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function mxGeo(x: number, y: number, w: number, h: number): string {
  return `<mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/>`;
}

export function groupCell(id: string, value: string, style: string, parent: string, x: number, y: number, w: number, h: number): string {
  return `<mxCell id="${id}" value="${esc(value)}" style="${style}" vertex="1" connectable="0" parent="${parent}">${mxGeo(x, y, w, h)}</mxCell>`;
}

export function iconCell(id: string, value: string, shape: string, fillColor: string, parent: string, x: number, y: number, w = ICON_W, h = ICON_H): string {
  const style = `sketch=0;points=[[0,0,0],[0.25,0,0],[0.5,0,0],[0.75,0,0],[1,0,0],[0,1,0],[0.25,1,0],[0.5,1,0],[0.75,1,0],[1,1,0],[0,0.25,0],[0,0.5,0],[0,0.75,0],[1,0.25,0],[1,0.5,0],[1,0.75,0]];outlineConnect=0;fontColor=#232F3E;gradientColor=none;fillColor=${fillColor};strokeColor=#ffffff;dashed=0;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;fontSize=10;fontStyle=0;aspect=fixed;pointerEvents=1;shape=mxgraph.aws4.resourceIcon;resIcon=${shape};`;
  return `<mxCell id="${id}" value="${esc(value)}" style="${style}" vertex="1" parent="${parent}">${mxGeo(x, y, w, h)}</mxCell>`;
}

export interface EdgeOpts {
  exitX?: number;  exitY?: number;
  entryX?: number; entryY?: number;
}

export function edgeCell(id: string, source: string, target: string, strokeColor: string, label?: string, dashed = false, opts?: EdgeOpts): string {
  const dashStyle = dashed ? "dashed=1;dashPattern=8 4;" : "dashed=0;";
  let anchor = "";
  if (opts?.exitX !== undefined)  anchor += `exitX=${opts.exitX};exitY=${opts.exitY ?? 0.5};exitDx=0;exitDy=0;`;
  if (opts?.entryX !== undefined) anchor += `entryX=${opts.entryX};entryY=${opts.entryY ?? 0.5};entryDx=0;entryDy=0;`;
  const style = `edgeStyle=orthogonalEdgeStyle;html=1;rounded=1;strokeColor=${strokeColor};strokeWidth=2;${dashStyle}${anchor}fontColor=#232F3E;fontSize=10;`;
  const val = label ? esc(label) : "";
  return `<mxCell id="${id}" value="${val}" style="${style}" edge="1" source="${source}" target="${target}" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell>`;
}

// ── AWS Official Group Styles ──

export const GROUP_POINTS = "points=[[0,0],[0.25,0],[0.5,0],[0.75,0],[1,0],[1,0.25],[1,0.5],[1,0.75],[1,1],[0.75,1],[0.5,1],[0.25,1],[0,1],[0,0.75],[0,0.5],[0,0.25]];";

export function awsCloudStyle(): string {
  return `sketch=0;${GROUP_POINTS}outlineConnect=0;gradientColor=none;html=1;whiteSpace=wrap;fontSize=12;fontStyle=0;shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_aws_cloud_alt;strokeColor=#232F3E;fillColor=none;verticalAlign=top;align=left;spacingLeft=30;fontColor=#232F3E;dashed=0;container=1;pointerEvents=0;collapsible=0;recursiveResize=0;`;
}

export function regionStyle(): string {
  return `sketch=0;${GROUP_POINTS}outlineConnect=0;gradientColor=none;html=1;whiteSpace=wrap;fontSize=12;fontStyle=0;shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_region;strokeColor=#00A4A6;fillColor=none;verticalAlign=top;align=left;spacingLeft=30;fontColor=#147EBA;dashed=1;container=1;pointerEvents=0;collapsible=0;recursiveResize=0;`;
}

export function vpcStyle(): string {
  return `sketch=0;${GROUP_POINTS}outlineConnect=0;gradientColor=none;html=1;whiteSpace=wrap;fontSize=12;fontStyle=0;shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_vpc;strokeColor=#248814;fillColor=none;verticalAlign=top;align=left;spacingLeft=30;fontColor=#AAB7B8;dashed=0;container=1;pointerEvents=0;collapsible=0;recursiveResize=0;`;
}

export function azStyle(): string {
  return `sketch=0;${GROUP_POINTS}outlineConnect=0;gradientColor=none;html=1;whiteSpace=wrap;fontSize=12;fontStyle=0;shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_availability_zone;strokeColor=#545B64;fillColor=none;verticalAlign=top;align=left;spacingLeft=30;fontColor=#545B64;dashed=1;container=1;pointerEvents=0;collapsible=0;recursiveResize=0;`;
}

export function flatAzStyle(): string {
  return "fillColor=none;strokeColor=#147EBA;dashed=1;verticalAlign=bottom;fontStyle=1;fontColor=#147EBA;html=1;fontSize=15;strokeWidth=2;container=0;labelPosition=center;verticalLabelPosition=top;align=center;";
}

export function publicSubnetStyle(): string {
  return `sketch=0;${GROUP_POINTS}outlineConnect=0;gradientColor=none;html=1;whiteSpace=wrap;fontSize=12;fontStyle=0;shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_security_group;grStroke=0;strokeColor=#248814;fillColor=#E9F3E6;verticalAlign=top;align=left;spacingLeft=30;fontColor=#248814;dashed=0;container=1;pointerEvents=0;collapsible=0;recursiveResize=0;`;
}

export function privateSubnetStyle(): string {
  return `sketch=0;${GROUP_POINTS}outlineConnect=0;gradientColor=none;html=1;whiteSpace=wrap;fontSize=12;fontStyle=0;shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_security_group;grStroke=0;strokeColor=#147EBA;fillColor=#E6F2F8;verticalAlign=top;align=left;spacingLeft=30;fontColor=#147EBA;dashed=0;container=1;pointerEvents=0;collapsible=0;recursiveResize=0;`;
}

export function isolatedSubnetStyle(): string {
  return `sketch=0;${GROUP_POINTS}outlineConnect=0;gradientColor=none;html=1;whiteSpace=wrap;fontSize=12;fontStyle=0;shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_security_group;grStroke=0;strokeColor=#3F8624;fillColor=#E6F6E4;verticalAlign=top;align=left;spacingLeft=30;fontColor=#3F8624;dashed=0;container=1;pointerEvents=0;collapsible=0;recursiveResize=0;`;
}

export function cacheSubnetStyle(): string {
  return `sketch=0;${GROUP_POINTS}outlineConnect=0;gradientColor=none;html=1;whiteSpace=wrap;fontSize=12;fontStyle=0;shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_security_group;grStroke=0;strokeColor=#DD344C;fillColor=#FCE9E9;verticalAlign=top;align=left;spacingLeft=30;fontColor=#DD344C;dashed=0;container=1;pointerEvents=0;collapsible=0;recursiveResize=0;`;
}

export function clusterContainerStyle(): string {
  return "sketch=0;fillColor=none;strokeColor=#ED7100;dashed=1;dashPattern=5 5;fontColor=#ED7100;fontSize=10;fontStyle=0;container=1;pointerEvents=0;collapsible=0;recursiveResize=0;html=1;whiteSpace=wrap;verticalAlign=top;rounded=1;arcSize=3;";
}

export function asgContainerStyle(): string {
  return `sketch=0;${GROUP_POINTS}outlineConnect=0;gradientColor=none;html=1;whiteSpace=wrap;fontSize=10;fontStyle=0;shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_auto_scaling_group;strokeColor=#ED7100;fillColor=none;verticalAlign=top;align=left;spacingLeft=30;fontColor=#ED7100;dashed=1;container=1;pointerEvents=0;collapsible=0;recursiveResize=0;`;
}

export function eksClusterStyle(): string {
  return `sketch=0;${GROUP_POINTS}outlineConnect=0;gradientColor=none;html=1;whiteSpace=wrap;fontSize=12;fontStyle=0;shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_ec2_instance_contents;strokeColor=#D86613;fillColor=none;verticalAlign=top;align=left;spacingLeft=30;fontColor=#D86613;dashed=0;container=1;pointerEvents=0;collapsible=0;recursiveResize=0;`;
}

export function mskClusterStyle(): string {
  return `sketch=0;${GROUP_POINTS}outlineConnect=0;gradientColor=none;html=1;whiteSpace=wrap;fontSize=12;fontStyle=0;shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_aws_cloud_alt;strokeColor=#8C4FFF;fillColor=none;verticalAlign=top;align=left;spacingLeft=30;fontColor=#8C4FFF;dashed=1;container=1;pointerEvents=0;collapsible=0;recursiveResize=0;`;
}

export function categoryBoxStyle(borderColor: string): string {
  return `fillColor=none;strokeColor=${borderColor};dashed=1;dashPattern=3 3;fontColor=${borderColor};fontSize=10;fontStyle=1;container=1;pointerEvents=0;collapsible=0;recursiveResize=0;html=1;whiteSpace=wrap;verticalAlign=top;rounded=1;arcSize=5;`;
}

// ─── 6. Edge Generation Logic ─────────────────────────────────────────

export interface IdMap { [serviceLower: string]: string }
export type PosMap = Record<string, { x: number; y: number }>;

type AnchorSide = "top" | "bottom" | "left" | "right";

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

function countPathObstacles(
  src: { x: number; y: number }, tgt: { x: number; y: number },
  exit: AnchorSide, entry: AnchorSide,
  posMap: PosMap, exclude: Set<string>,
): number {
  const vExit = exit === "bottom" || exit === "top";
  const vEntry = entry === "top" || entry === "bottom";

  if (vExit && vEntry) {
    const midY = (src.y + tgt.y) / 2;
    return obstaclesOnVertical(src.x, src.y, midY, posMap, exclude)
         + obstaclesOnHorizontal(midY, src.x, tgt.x, posMap, exclude)
         + obstaclesOnVertical(tgt.x, midY, tgt.y, posMap, exclude);
  }
  if (!vExit && !vEntry) {
    const midX = (src.x + tgt.x) / 2;
    return obstaclesOnHorizontal(src.y, src.x, midX, posMap, exclude)
         + obstaclesOnVertical(midX, src.y, tgt.y, posMap, exclude)
         + obstaclesOnHorizontal(tgt.y, midX, tgt.x, posMap, exclude);
  }
  if (vExit) {
    return obstaclesOnVertical(src.x, src.y, tgt.y, posMap, exclude)
         + obstaclesOnHorizontal(tgt.y, src.x, tgt.x, posMap, exclude);
  }
  return obstaclesOnHorizontal(src.y, src.x, tgt.x, posMap, exclude)
       + obstaclesOnVertical(tgt.x, src.y, tgt.y, posMap, exclude);
}

function hasNearbyIcon(
  origin: { x: number; y: number }, side: AnchorSide,
  posMap: PosMap, exclude: Set<string>,
): boolean {
  const range = ICON_H + ICON_GAP;
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

export function bestSides(
  src: { x: number; y: number }, tgt: { x: number; y: number },
  posMap: PosMap, srcId: string, tgtId: string,
): { exit: AnchorSide; entry: AnchorSide } {
  const dx = tgt.x - src.x;
  const dy = tgt.y - src.y;
  const exclude = new Set([srcId, tgtId]);
  const primaryVert = Math.abs(dy) >= Math.abs(dx);

  const vE: AnchorSide = dy >= 0 ? "bottom" : "top";
  const vN: AnchorSide = dy >= 0 ? "top" : "bottom";
  const hE: AnchorSide = dx >= 0 ? "right" : "left";
  const hN: AnchorSide = dx >= 0 ? "left" : "right";

  const pairs: [AnchorSide, AnchorSide, boolean][] = [
    [vE, vN, true],
    [hE, hN, true],
    [vE, hN, false],
    [hE, vN, false],
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
    if (a.score !== b.score) return a.score - b.score;
    if (a.straight !== b.straight) return a.straight ? -1 : 1;
    if (a.primary !== b.primary) return a.primary ? -1 : 1;
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

export function generateEdges(classified: ClassifiedServices, idMap: IdMap, posMap: PosMap): string[] {
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
  const waf = findId("waf", "bot control");
  const alb = findId("alb", "nlb");
  const apiGw = findId("api gateway", "websocket api");
  const appSvcs = findAllIds("ecs", "eks", "lambda", "ec2 auto");

  interface EdgeDef { src: string; tgt: string; color: string; label?: string; dashed: boolean }
  const defs: EdgeDef[] = [];

  // Ingress flow chain only: Users → Route53 → CloudFront → API GW → ALB → App
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

  // WAF attachment
  if (waf && cloudfront) {
    defs.push({ src: waf, tgt: cloudfront, color: edgeColor, label: "Protect", dashed: false });
  } else if (waf && alb) {
    defs.push({ src: waf, tgt: alb, color: edgeColor, label: "Protect", dashed: false });
  }

  // Phase 2: compute best sides
  const edgeSides: { exit: AnchorSide; entry: AnchorSide }[] = [];
  for (const def of defs) {
    const srcPos = posMap[def.src];
    const tgtPos = posMap[def.tgt];
    const sides = srcPos && tgtPos
      ? bestSides(srcPos, tgtPos, posMap, def.src, def.tgt)
      : { exit: "bottom" as AnchorSide, entry: "top" as AnchorSide };
    edgeSides.push(sides);
  }

  // Phase 2.5: group per side, sort by target/source position
  const exitGroups: Record<string, number[]> = {};
  const entryGroups: Record<string, number[]> = {};
  for (let i = 0; i < defs.length; i++) {
    const ek = `${defs[i].src}:${edgeSides[i].exit}`;
    const nk = `${defs[i].tgt}:${edgeSides[i].entry}`;
    (exitGroups[ek] ??= []).push(i);
    (entryGroups[nk] ??= []).push(i);
  }

  for (const [key, indices] of Object.entries(exitGroups)) {
    const side = key.split(":")[1] as AnchorSide;
    indices.sort((a, b) => {
      const pa = posMap[defs[a].tgt];
      const pb = posMap[defs[b].tgt];
      if (!pa || !pb) return 0;
      return (side === "left" || side === "right") ? pa.y - pb.y : pa.x - pb.x;
    });
  }

  for (const [key, indices] of Object.entries(entryGroups)) {
    const side = key.split(":")[1] as AnchorSide;
    indices.sort((a, b) => {
      const pa = posMap[defs[a].src];
      const pb = posMap[defs[b].src];
      if (!pa || !pb) return 0;
      return (side === "left" || side === "right") ? pa.y - pb.y : pa.x - pb.x;
    });
  }

  const exitOrder: number[] = new Array(defs.length).fill(0);
  const entryOrder: number[] = new Array(defs.length).fill(0);
  for (const indices of Object.values(exitGroups)) {
    indices.forEach((di, order) => { exitOrder[di] = order; });
  }
  for (const indices of Object.values(entryGroups)) {
    indices.forEach((di, order) => { entryOrder[di] = order; });
  }

  // Phase 3: generate cells with position-ordered slots
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

// ─── 7. Common Helpers ────────────────────────────────────────────────

export function getMirrorLabel(label: string, svcName: string): string {
  const n = svcName.toLowerCase();
  if (n.includes("aurora") || n.includes("rds")) return `${label} (Standby)`;
  if (n.includes("elasticache") || n.includes("redis") || n.includes("dax")) return `${label} (Replica)`;
  return label;
}

/** Place flat icons in a subnet (grid layout), recording absolute positions */
export function placeIcons(
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

/** Wrap cells array into full draw.io XML */
export function wrapDiagramXml(cells: string[], totalW: number, totalH: number): string {
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<mxfile host="app.diagrams.net" type="device">`,
    `<diagram name="Architecture" id="arch-diagram">`,
    `<mxGraphModel dx="${Math.ceil(totalW + 100)}" dy="${Math.ceil(totalH + 100)}" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${Math.ceil(totalW + 200)}" pageHeight="${Math.ceil(totalH + 200)}" math="0" shadow="0">`,
    `<root>`,
    ...cells,
    `</root>`,
    `</mxGraphModel>`,
    `</diagram>`,
    `</mxfile>`,
  ].join("\n");
}
