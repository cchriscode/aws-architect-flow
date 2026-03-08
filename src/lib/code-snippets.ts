/* eslint-disable @typescript-eslint/no-explicit-any */
import type { WizardState, CodeSnippet } from "@/lib/types";
import { toArray, toArrayFiltered, azToNum } from "@/lib/shared";

/**
 * generateCodeSnippets -- generates IaC code snippets (Terraform / CDK)
 * from the wizard state selections. Ported from the original monolithic JSX.
 */
export function generateCodeSnippets(state: WizardState): CodeSnippet[] {
  const orchest  = state.compute?.orchestration;
  const archP    = state.compute?.arch_pattern;
  const nodeType = state.compute?.compute_node;
  const dbArr    = toArrayFiltered(state.data?.primary_db);
  const dbHa     = state.data?.db_ha;
  const cache    = state.data?.cache;
  const azNum    = azToNum(state.network?.az_count);
  const iac      = state.cicd?.iac || "terraform";
  const deploy   = state.cicd?.deploy_strategy;
  const pipeline = state.cicd?.pipeline;
  const waf      = state.edge?.waf;
  const cdn      = state.edge?.cdn;
  const natStrat = state.network?.nat_strategy;
  const subnet   = state.network?.subnet_tier;
  const region   = state.slo?.region;
  const scaling  = state.compute?.scaling;
  const gitops   = state.platform?.gitops;
  const dau      = state.scale?.dau;
  const types    = toArray(state.workload?.type);
  const cert     = toArray(state.compliance?.cert);
  const encr     = state.compliance?.encryption;
  const nodeP    = state.platform?.node_provisioner;
  const secrets  = state.platform?.k8s_secrets;
  const authArr  = toArray(state.integration?.auth);
  const queueArr = toArray(state.integration?.queue_type);
  const account  = state.network?.account_structure;
  const hybrid   = state.network?.hybrid;
  const search   = state.data?.search;
  const storArr  = toArray(state.data?.storage);
  const avail    = state.slo?.availability;
  const envCnt   = state.cicd?.env_count;
  const commit   = state.cost?.commitment;
  const spot     = state.cost?.spot_usage;
  const monitor  = state.platform?.k8s_monitoring;
  const podSec   = state.platform?.pod_security;

  const isTx        = types.includes("ecommerce") || types.includes("ticketing") || state.workload?.business_model === "transaction";
  const isServerless= archP === "serverless";
  const isEks       = orchest === "eks";
  const isEcs       = !isEks && !isServerless;
  const isLarge     = dau === "large" || dau === "xlarge";
  const hasCritCert = cert.some((c) => ["pci", "hipaa", "sox"].includes(c));
  const hasPersonal = ["sensitive","critical"].includes(state.workload?.data_sensitivity);
  const hasAurora   = dbArr.includes("aurora_mysql") || dbArr.includes("aurora_pg");
  const hasRds      = dbArr.includes("rds_mysql") || dbArr.includes("rds_pg");
  const hasDynamo   = dbArr.includes("dynamodb");
  const hasRedis    = cache === "redis" || cache === "both";
  const isPg        = dbArr.includes("aurora_pg") || dbArr.includes("rds_pg");
  const maxNodes    = dau === "xlarge" ? 50 : dau === "large" ? 20 : 10;
  const minNodes    = azNum;

  const snippets: CodeSnippet[] = [];
  const TF = iac === "terraform" || iac === "cfn" || !iac || iac === "none";
  const CDK = iac === "cdk";
  const lang = CDK ? "typescript" : "hcl";

  // ── 1. VPC & 서브넷
  snippets.push({
    category: "네트워크",
    title: "VPC & 서브넷 전체 구성",
    lang,
    desc: `${azNum}AZ, ${subnet === "3tier" ? "3계층" : "2계층"} 서브넷 + VPC Endpoint`,
    code: CDK ? `// AWS CDK — VPC 완전 구성
import * as ec2 from 'aws-cdk-lib/aws-ec2';

const vpc = new ec2.Vpc(this, 'AppVpc', {
  maxAzs: ${azNum},
  natGateways: ${natStrat === "per_az" ? azNum : natStrat === "shared" ? 1 : 0},
  ipAddresses: ec2.IpAddresses.cidr(props.vpcCidr ?? '10.0.0.0/16'),
  subnetConfiguration: [
    { name: 'Public',  subnetType: ec2.SubnetType.PUBLIC,               cidrMask: 24 },
    { name: 'Private', subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,  cidrMask: 24 },${subnet === "3tier" ? `
    { name: 'Isolated',subnetType: ec2.SubnetType.PRIVATE_ISOLATED,     cidrMask: 24 },` : ""}
  ],
  // VPC Flow Logs
  flowLogs: {
    's3': { destination: ec2.FlowLogDestination.toS3(logBucket) }
  },
});

// S3 / DynamoDB Gateway Endpoint (무료, NAT 비용 절감)
vpc.addGatewayEndpoint('S3Ep',       { service: ec2.GatewayVpcEndpointAwsService.S3 });
vpc.addGatewayEndpoint('DynamoDbEp', { service: ec2.GatewayVpcEndpointAwsService.DYNAMODB });

// Interface Endpoints (ECR / Secrets Manager / CloudWatch / SSM)
const ifaceEps = [
  ec2.InterfaceVpcEndpointAwsService.ECR,
  ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER,
  ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
  ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
  ec2.InterfaceVpcEndpointAwsService.SSM,
];
ifaceEps.forEach((svc, i) =>
  vpc.addInterfaceEndpoint(\`Ep\${i}\`, {
    service: svc,
    subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    privateDnsEnabled: true,
  })
);` : `# Terraform — VPC 완전 구성
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "\${var.project}-\${var.env}-vpc"
  cidr = var.vpc_cidr

  azs              = ${azNum === 3 ? '["ap-northeast-2a","ap-northeast-2b","ap-northeast-2c"]' : '["ap-northeast-2a","ap-northeast-2b"]'}
  public_subnets   = ${azNum === 3 ? '["10.0.101.0/24","10.0.102.0/24","10.0.103.0/24"]' : '["10.0.101.0/24","10.0.102.0/24"]'}
  private_subnets  = ${azNum === 3 ? '["10.0.1.0/24","10.0.2.0/24","10.0.3.0/24"]' : '["10.0.1.0/24","10.0.2.0/24"]'}${subnet === "3tier" ? `
  database_subnets = ${azNum === 3 ? '["10.0.201.0/24","10.0.202.0/24","10.0.203.0/24"]' : '["10.0.201.0/24","10.0.202.0/24"]'}
  create_database_subnet_group = true` : ""}

  enable_nat_gateway     = ${natStrat !== "endpoint" ? "true" : "false"}
  single_nat_gateway     = ${natStrat === "shared" ? "true" : "false"}
  one_nat_gateway_per_az = ${natStrat === "per_az" ? "true" : "false"}

  # VPC Flow Logs → S3
  enable_flow_log                      = true
  flow_log_destination_type            = "s3"
  flow_log_destination_arn             = aws_s3_bucket.logs.arn

  # 태그 (EKS 자동 검색용)
  public_subnet_tags  = { "kubernetes.io/role/elb" = "1" }
  private_subnet_tags = { "kubernetes.io/role/internal-elb" = "1" }

  tags = local.common_tags
}

# S3 / DynamoDB Gateway Endpoint (무료)
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = module.vpc.vpc_id
  service_name      = "com.amazonaws.ap-northeast-2.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = module.vpc.private_route_table_ids
}

resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = module.vpc.vpc_id
  service_name      = "com.amazonaws.ap-northeast-2.dynamodb"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = module.vpc.private_route_table_ids
}`,
  });

  // ── 2. Terraform Remote State
  if (TF) {
    snippets.push({
      category: "IaC 기반",
      title: "Terraform Remote State 설정",
      lang: "hcl",
      desc: "S3 + DynamoDB Locking. 팀 협업 필수 설정",
      code: `# backend.tf — Remote State 설정
# 먼저 수동으로 S3 버킷과 DynamoDB 테이블을 생성해야 합니다:
#   aws s3 mb s3://\${PROJECT}-terraform-state --region ap-northeast-2
#   aws s3api put-bucket-versioning --bucket \${PROJECT}-terraform-state \\
#       --versioning-configuration Status=Enabled
#   aws dynamodb create-table --table-name terraform-locks \\
#       --attribute-definitions AttributeName=LockID,AttributeType=S \\
#       --key-schema AttributeName=LockID,KeyType=HASH \\
#       --billing-mode PAY_PER_REQUEST

terraform {
  required_version = ">= 1.7"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # backend 블록은 변수/함수 사용 불가. 리터럴만 허용됩니다.
  # 환경별 분리: terraform init -backend-config="env/prod.backend.hcl"
  backend "s3" {
    bucket         = "myproject-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "ap-northeast-2"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}

provider "aws" {
  region = "ap-northeast-2"

  default_tags {
    tags = {
      Project     = var.project
      Environment = var.env
      ManagedBy   = "terraform"
    }
  }
}

# ── variables.tf
variable "project"  { type = string }
variable "env"      { type = string }  # dev / staging / prod
variable "vpc_cidr" { type = string  default = "10.0.0.0/16" }

# ── 환경별 backend 설정 파일 (backend-config)
# env/dev.backend.hcl:
#   bucket = "myproject-terraform-state"
#   key    = "dev/terraform.tfstate"
#
# env/prod.backend.hcl:
#   bucket = "myproject-terraform-state"
#   key    = "prod/terraform.tfstate"
#
# terraform init -backend-config="env/prod.backend.hcl"

# ⚠️ Prod 환경은 별도 backend(S3 버킷 or 키)를 사용 권장.
#    terraform workspace는 dev/stage에 적합하지만,
#    Prod은 별도 state 파일로 완전 격리가 더 안전합니다.

# ── 환경별 .tfvars 파일
# terraform apply -var-file="prod.tfvars"

# dev.tfvars
# project  = "myapp"
# env      = "dev"
# vpc_cidr = "10.0.0.0/16"

# prod.tfvars
# project  = "myapp"
# env      = "prod"
# vpc_cidr = "10.1.0.0/16"`,
    });
  }

  // ── 3. IAM — OIDC + GitHub Actions Role
  if (pipeline === "github") {
    snippets.push({
      category: "IAM / 보안",
      title: "GitHub Actions OIDC IAM Role",
      lang,
      desc: "장기 자격증명 없이 GitHub Actions에서 AWS 배포",
      code: CDK ? `// AWS CDK — GitHub Actions OIDC Role
import * as iam from 'aws-cdk-lib/aws-iam';

// GitHub OIDC Provider (계정당 1번만 생성)
const githubProvider = new iam.OpenIdConnectProvider(this, 'GithubOidc', {
  url: 'https://token.actions.githubusercontent.com',
  clientIds: ['sts.amazonaws.com'],
  thumbprints: ['6938fd4d98bab03faadb97b34396831e3780aea1'],
});

// 배포 Role
const deployRole = new iam.Role(this, 'GithubDeployRole', {
  roleName: 'github-deploy-role',
  assumedBy: new iam.WebIdentityPrincipal(githubProvider.openIdConnectProviderArn, {
    StringEquals: {
      'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
    },
    StringLike: {
      // 특정 레포/브랜치만 허용
      'token.actions.githubusercontent.com:sub': 'repo:YOUR_ORG/YOUR_REPO:ref:refs/heads/main',
    },
  }),
  maxSessionDuration: cdk.Duration.hours(1),
});

// ECR 푸시 권한
deployRole.addToPolicy(new iam.PolicyStatement({
  actions: ['ecr:GetAuthorizationToken','ecr:BatchCheckLayerAvailability',
            'ecr:PutImage','ecr:InitiateLayerUpload','ecr:UploadLayerPart','ecr:CompleteLayerUpload'],
  resources: ['*'],
}));
// ECS 배포 권한
deployRole.addToPolicy(new iam.PolicyStatement({
  actions: ['ecs:UpdateService','ecs:DescribeServices','ecs:RegisterTaskDefinition'],
  resources: ['*'],
}));` : `# Terraform — GitHub Actions OIDC Role
data "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
}

# 없으면 생성
resource "aws_iam_openid_connect_provider" "github" {
  count           = length(data.aws_iam_openid_connect_provider.github.arn) == 0 ? 1 : 0
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

resource "aws_iam_role" "github_deploy" {
  name = "github-deploy-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Federated = coalesce(data.aws_iam_openid_connect_provider.github.arn, aws_iam_openid_connect_provider.github[0].arn) }
      Action    = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = { "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com" }
        StringLike   = {
          # 레포와 브랜치를 반드시 제한할 것
          "token.actions.githubusercontent.com:sub" = "repo:YOUR_ORG/YOUR_REPO:ref:refs/heads/main"
        }
      }
    }]
  })
}

resource "aws_iam_role_policy" "github_deploy" {
  role = aws_iam_role.github_deploy.name
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ECRPush"
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability", "ecr:PutImage",
          "ecr:InitiateLayerUpload", "ecr:UploadLayerPart", "ecr:CompleteLayerUpload"
        ]
        Resource = "*"
      },
      {
        Sid    = "ECSDeployOrEKS"
        Effect = "Allow"
        Action = [
          "ecs:UpdateService", "ecs:DescribeServices", "ecs:RegisterTaskDefinition",
          "iam:PassRole",
          ${isEks ? '"eks:DescribeCluster",' : ""}
        ]
        Resource = "*"
      }
    ]
  })
}

# .github/workflows/deploy.yml에서:
# - uses: aws-actions/configure-aws-credentials@v4
#   with:
#     role-to-assume: arn:aws:iam::ACCOUNT:role/github-deploy-role
#     aws-region: ap-northeast-2`,
    });
  }

  // ── 4. ECS Task Role
  if (isEcs) {
    snippets.push({
      category: "IAM / 보안",
      title: "ECS Task Role + Execution Role",
      lang,
      desc: "앱 권한(Task Role) + 인프라 권한(Execution Role) 분리",
      code: CDK ? `// AWS CDK — ECS Task + Execution Role
import * as iam from 'aws-cdk-lib/aws-iam';

// Execution Role: ECS 에이전트가 사용 (ECR 풀, Secrets 읽기, 로그 쓰기)
const executionRole = new iam.Role(this, 'EcsExecRole', {
  assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
  managedPolicies: [
    iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
  ],
});
// Secrets Manager 읽기 추가
executionRole.addToPolicy(new iam.PolicyStatement({
  actions: ['secretsmanager:GetSecretValue', 'kms:Decrypt'],
  resources: ['arn:aws:secretsmanager:ap-northeast-2:*:secret:app/*'],
}));

// Task Role: 앱 코드가 사용 (S3, DynamoDB 등 최소 권한)
const taskRole = new iam.Role(this, 'EcsTaskRole', {
  assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
});
// 필요한 서비스만 추가 (예시: S3 읽기)
taskRole.addToPolicy(new iam.PolicyStatement({
  actions: ['s3:GetObject', 's3:PutObject'],
  resources: [\`\${appBucket.bucketArn}/*\`],
}));
${hasDynamo ? `taskRole.addToPolicy(new iam.PolicyStatement({
  actions: ['dynamodb:GetItem','dynamodb:PutItem','dynamodb:UpdateItem','dynamodb:Query'],
  resources: [appTable.tableArn, \`\${appTable.tableArn}/index/*\`],
}));` : ""}` : `# Terraform — ECS Task + Execution Role
# Execution Role (ECS 에이전트용)
resource "aws_iam_role" "ecs_execution" {
  name = "\${var.project}-\${var.env}-ecs-execution"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{ Effect="Allow", Principal={ Service="ecs-tasks.amazonaws.com" }, Action="sts:AssumeRole" }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution_managed" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "ecs_execution_secrets" {
  role = aws_iam_role.ecs_execution.name
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["secretsmanager:GetSecretValue", "kms:Decrypt"]
      Resource = ["arn:aws:secretsmanager:ap-northeast-2:*:secret:app/*"]
    }]
  })
}

# Task Role (앱 코드용 — 최소 권한)
resource "aws_iam_role" "ecs_task" {
  name = "\${var.project}-\${var.env}-ecs-task"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{ Effect="Allow", Principal={ Service="ecs-tasks.amazonaws.com" }, Action="sts:AssumeRole" }]
  })
}

resource "aws_iam_role_policy" "ecs_task_app" {
  role = aws_iam_role.ecs_task.name
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      ${storArr.includes("s3") ? `{
        Effect   = "Allow"
        Action   = ["s3:GetObject","s3:PutObject","s3:DeleteObject"]
        Resource = ["\${aws_s3_bucket.app.arn}/*"]
      },` : ""}
      ${hasDynamo ? `{
        Effect   = "Allow"
        Action   = ["dynamodb:GetItem","dynamodb:PutItem","dynamodb:UpdateItem","dynamodb:DeleteItem","dynamodb:Query","dynamodb:Scan"]
        Resource = [aws_dynamodb_table.app.arn, "\${aws_dynamodb_table.app.arn}/index/*"]
      },` : ""}
      {
        Effect   = "Allow"
        Action   = ["xray:PutTraceSegments","xray:PutTelemetryRecords"]
        Resource = "*"
      }
    ]
  })
}`,
    });
  }

  // ── 5. ECS Task Definition 완전체
  if (isEcs) {
    snippets.push({
      category: "컴퓨팅",
      title: "ECS Task Definition 완전 구성",
      lang,
      desc: "환경변수 Secrets Manager 주입 + 헬스체크 + X-Ray 사이드카",
      code: CDK ? `// AWS CDK — ECS Fargate Task Definition
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as logs from 'aws-cdk-lib/aws-logs';

const logGroup = new logs.LogGroup(this, 'AppLogs', {
  logGroupName: '/ecs/\${var.project}-\${var.env}',
  retention: logs.RetentionDays.ONE_MONTH,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

const taskDef = new ecs.FargateTaskDefinition(this, 'AppTask', {
  cpu: ${dau === "xlarge" ? 2048 : dau === "large" ? 1024 : 512},
  memoryLimitMiB: ${dau === "xlarge" ? 4096 : dau === "large" ? 2048 : 1024},
  executionRole,
  taskRole,
  runtimePlatform: {
    cpuArchitecture: ecs.CpuArchitecture.ARM64,  // Graviton 비용 절감
    operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
  },
});

const container = taskDef.addContainer('app', {
  image: ecs.ContainerImage.fromEcrRepository(ecrRepo, 'latest'),
  portMappings: [{ containerPort: 3000, name: 'http' }],
  logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'app', logGroup }),
  healthCheck: {
    command: ['CMD-SHELL', 'curl -f http://localhost:3000/health || exit 1'],
    interval: cdk.Duration.seconds(30),
    timeout: cdk.Duration.seconds(5),
    retries: 3,
    startPeriod: cdk.Duration.seconds(60),
  },
  environment: {
    NODE_ENV: 'production',
    PORT: '3000',
  },
  secrets: {
    // Secrets Manager에서 주입
    DB_PASSWORD:  ecs.Secret.fromSecretsManager(dbSecret, 'password'),
    DB_HOST:      ecs.Secret.fromSecretsManager(dbSecret, 'host'),
    REDIS_HOST:   ecs.Secret.fromSecretsManager(redisSecret, 'host'),
  },
});` : `# Terraform — ECS Task Definition 완전체
resource "aws_ecs_task_definition" "app" {
  family                   = "\${var.project}-\${var.env}"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = ${dau === "xlarge" ? 2048 : dau === "large" ? 1024 : 512}
  memory                   = ${dau === "xlarge" ? 4096 : dau === "large" ? 2048 : 1024}
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  # Graviton ARM (비용 절감)
  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "ARM64"
  }

  container_definitions = jsonencode([
    {
      name         = "app"
      image        = "\${aws_ecr_repository.app.repository_url}:latest"
      portMappings = [{ containerPort = 3000, name = "http" }]
      essential    = true

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/\${var.project}-\${var.env}"
          "awslogs-region"        = "ap-northeast-2"
          "awslogs-stream-prefix" = "app"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }

      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "PORT",     value = "3000" },
      ]

      # Secrets Manager에서 자동 주입
      secrets = [
        { name = "DB_PASSWORD", valueFrom = "\${aws_secretsmanager_secret.db.arn}:password::" },
        { name = "DB_HOST",     valueFrom = "\${aws_secretsmanager_secret.db.arn}:host::" },
        ${hasRedis ? `{ name = "REDIS_HOST", valueFrom = "\${aws_secretsmanager_secret.redis.arn}:host::" },` : ""}
      ]

      # X-Ray 사이드카 (분산 추적)
    },
    {
      name      = "xray-daemon"
      image     = "amazon/aws-xray-daemon"
      essential = false
      portMappings = [{ containerPort = 2000, protocol = "udp" }]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/\${var.project}-\${var.env}"
          "awslogs-region"        = "ap-northeast-2"
          "awslogs-stream-prefix" = "xray"
        }
      }
    }
  ])
}`,
    });
  }

  // ── 6. ECS Service + ALB
  if (isEcs) {
    snippets.push({
      category: "컴퓨팅",
      title: "ECS Service + ALB + Auto Scaling",
      lang,
      desc: `Circuit Breaker + ${deploy === "bluegreen" ? "Blue/Green" : "Rolling"} 배포 + CPU 기반 Auto Scaling`,
      code: CDK ? `// AWS CDK — ECS Fargate Service + ALB
import * as ecs from 'aws-cdk-lib/aws-ecs-patterns';

const service = new ecs.ApplicationLoadBalancedFargateService(this, 'AppService', {
  cluster,
  taskDefinition: taskDef,
  desiredCount: ${minNodes},
  publicLoadBalancer: true,
  listenerPort: 443,
  certificate: acmCert,
  redirectHTTP: true,
  deploymentController: {
    type: ecs.DeploymentControllerType.${deploy === "bluegreen" ? "CODE_DEPLOY" : "ECS"},
  },
  circuitBreaker: { rollback: true },  // 배포 실패 시 자동 롤백
});

// 헬스체크
service.targetGroup.configureHealthCheck({
  path: '/health',
  healthyHttpCodes: '200',
  interval: cdk.Duration.seconds(30),
  timeout: cdk.Duration.seconds(5),
  healthyThresholdCount: 2,
  unhealthyThresholdCount: 3,
});

// Auto Scaling
const scaling = service.service.autoScaleTaskCount({
  minCapacity: ${minNodes},
  maxCapacity: ${maxNodes},
});
scaling.scaleOnCpuUtilization('CpuScaling', {
  targetUtilizationPercent: 70,
  scaleInCooldown: cdk.Duration.seconds(60),
  scaleOutCooldown: cdk.Duration.seconds(30),
});` : `# Terraform — ECS Service + ALB + Auto Scaling
resource "aws_lb" "app" {
  name_prefix        = "app-"
  load_balancer_type = "application"
  subnets            = module.vpc.public_subnets
  security_groups    = [aws_security_group.alb.id]
  drop_invalid_header_fields = true
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.app.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate.app.arn
  default_action { type = "forward"; target_group_arn = aws_lb_target_group.app.arn }
}

resource "aws_lb_listener" "http_redirect" {
  load_balancer_arn = aws_lb.app.arn
  port = 80; protocol = "HTTP"
  default_action {
    type = "redirect"
    redirect { port = "443"; protocol = "HTTPS"; status_code = "HTTP_301" }
  }
}

resource "aws_lb_target_group" "app" {
  name_prefix = "app-"
  port        = 3000; protocol = "HTTP"
  target_type = "ip"; vpc_id = module.vpc.vpc_id
  health_check {
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 30
    timeout             = 5
    matcher             = "200"
  }
}

resource "aws_ecs_service" "app" {
  name            = "\${var.project}-\${var.env}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = ${minNodes}
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = module.vpc.private_subnets
    security_groups  = [aws_security_group.app.id]
    assign_public_ip = false
  }
  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "app"; container_port = 3000
  }
  deployment_circuit_breaker { enable = true; rollback = true }
}

# Auto Scaling
resource "aws_appautoscaling_target" "ecs" {
  max_capacity = ${maxNodes}; min_capacity = ${minNodes}
  resource_id        = "service/\${aws_ecs_cluster.main.name}/\${aws_ecs_service.app.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}
resource "aws_appautoscaling_policy" "cpu" {
  name               = "cpu-scaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace
  policy_type        = "TargetTrackingScaling"
  target_tracking_scaling_policy_configuration {
    predefined_metric_specification { predefined_metric_type = "ECSServiceAverageCPUUtilization" }
    target_value       = 70
    scale_in_cooldown  = 60
    scale_out_cooldown = 30
  }
}`,
    });
  }

  // ── 7. EKS Cluster
  if (isEks) {
    snippets.push({
      category: "컴퓨팅",
      title: "EKS 클러스터 완전 구성",
      lang,
      desc: `프라이빗 엔드포인트 + ${nodeP === "karpenter" ? "Karpenter" : "관리형 노드 그룹"} + 필수 애드온`,
      code: CDK ? `// AWS CDK — EKS 클러스터
import * as eks from 'aws-cdk-lib/aws-eks';

const cluster = new eks.Cluster(this, 'AppCluster', {
  version: eks.KubernetesVersion.V1_30,
  clusterName: \`\${project}-\${env}\`,
  defaultCapacity: 0,  // Karpenter가 노드 관리
  endpointAccess: eks.EndpointAccess.PRIVATE,  // 퍼블릭 엔드포인트 차단
  vpcSubnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }],
  clusterLogging: [
    eks.ClusterLoggingTypes.API,
    eks.ClusterLoggingTypes.AUTHENTICATOR,
    eks.ClusterLoggingTypes.SCHEDULER,
    eks.ClusterLoggingTypes.CONTROLLER_MANAGER,
    eks.ClusterLoggingTypes.AUDIT,
  ],
});

// 필수 애드온
const addons = ['vpc-cni','coredns','kube-proxy','aws-ebs-csi-driver','eks-pod-identity-agent'];
addons.forEach((name, i) =>
  new eks.CfnAddon(this, \`Addon\${i}\`, {
    clusterName: cluster.clusterName,
    addonName: name,
    resolveConflicts: 'OVERWRITE',
  })
);` : `# Terraform — EKS 클러스터
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = "\${var.project}-\${var.env}"
  cluster_version = "1.30"

  cluster_endpoint_private_access = true
  cluster_endpoint_public_access  = false  # Bastion/VPN으로만 접근
  cluster_enabled_log_types = ["api","audit","authenticator","controllerManager","scheduler"]

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  cluster_addons = {
    coredns                = { most_recent = true }
    kube-proxy             = { most_recent = true }
    vpc-cni                = { most_recent = true }
    aws-ebs-csi-driver     = { most_recent = true }
    eks-pod-identity-agent = { most_recent = true }
  }

${nodeP === "karpenter" ? `  # Karpenter가 노드 관리 — 초기 노드만 bootstrapping용
  eks_managed_node_groups = {
    bootstrap = {
      instance_types = ["m7g.medium"]  # Graviton ARM
      min_size = ${minNodes}; max_size = ${minNodes}; desired_size = ${minNodes}
      taints = [{ key = "CriticalAddonsOnly", value = "true", effect = "NO_SCHEDULE" }]
    }
  }` : `  eks_managed_node_groups = {
    main = {
      instance_types = ["m7g.medium","m7g.large"]  # Graviton ARM
      min_size     = ${minNodes}
      max_size     = ${maxNodes}
      desired_size = ${minNodes}
      use_mixed_instances_policy = ${spot === "partial" || spot === "heavy"}
      ${spot !== "no" ? `mixed_instances_policy = {
        instances_distribution = {
          on_demand_base_capacity                  = ${minNodes}
          on_demand_percentage_above_base_capacity = ${spot === "heavy" ? 0 : 30}
          spot_allocation_strategy                 = "price-capacity-optimized"
        }
      }` : ""}
    }
  }`}

  tags = local.common_tags
}`,
    });
  }

  // ── 8. Aurora Serverless v2
  if (hasAurora) {
    const isPgLocal = dbArr.includes("aurora_pg");
    snippets.push({
      category: "데이터베이스",
      title: `Aurora ${isPgLocal ? "PostgreSQL" : "MySQL"} Serverless v2 완전 구성`,
      lang,
      desc: `자동 스케일링 + Multi-AZ + 삭제방지 + 파라미터 그룹`,
      code: CDK ? `// AWS CDK — Aurora Serverless v2
import * as rds from 'aws-cdk-lib/aws-rds';

const dbSg = new ec2.SecurityGroup(this, 'DbSg', {
  vpc, description: 'Aurora DB SG', allowAllOutbound: false,
});

const paramGroup = new rds.ParameterGroup(this, 'DbParams', {
  engine: rds.DatabaseClusterEngine.${isPgLocal ? "auroraPostgres({ version: rds.AuroraPostgresEngineVersion.VER_16_3 })" : "auroraMysql({ version: rds.AuroraMysqlEngineVersion.VER_3_07_0 })"},
  parameters: {
    ${isPgLocal ? `log_min_duration_statement: '1000',  // 1초 이상 쿼리 로깅
    shared_preload_libraries: 'pg_stat_statements',` : `slow_query_log: '1',
    long_query_time: '1',
    general_log: '0',`}
  },
});

const dbSecret = new secretsmanager.Secret(this, 'DbSecret', {
  secretName: 'app/db-credentials',
  generateSecretString: {
    secretStringTemplate: JSON.stringify({ username: 'appuser' }),
    generateStringKey: 'password',
    excludePunctuation: true,
    passwordLength: 32,
  },
});

const dbCluster = new rds.DatabaseCluster(this, 'AppDb', {
  engine: rds.DatabaseClusterEngine.${isPgLocal ? "auroraPostgres({ version: rds.AuroraPostgresEngineVersion.VER_16_3 })" : "auroraMysql({ version: rds.AuroraMysqlEngineVersion.VER_3_07_0 })"},
  writer: rds.ClusterInstance.serverlessV2('writer', {
    parameterGroup,
    enablePerformanceInsights: true,
  }),${dbHa === "multi_az_read" || dbHa === "global" ? `
  readers: [
    rds.ClusterInstance.serverlessV2('reader1', { scaleWithWriter: true }),
  ],` : ""}
  serverlessV2MinCapacity: 0.5,
  serverlessV2MaxCapacity: ${dau === "xlarge" ? 128 : dau === "large" ? 64 : dau === "medium" ? 16 : 4},
  vpc,
  vpcSubnets: { subnetType: ec2.SubnetType.${subnet === "3tier" ? "PRIVATE_ISOLATED" : "PRIVATE_WITH_EGRESS"} },
  securityGroups: [dbSg],
  storageEncrypted: true,
  credentials: rds.Credentials.fromSecret(dbSecret),
  backup: { retention: cdk.Duration.days(${dau === "large" || dau === "xlarge" ? 35 : 7}), preferredWindow: '17:00-18:00' },
  deletionProtection: true,
  removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
  parameterGroup,
  cloudwatchLogsExports: [${isPgLocal ? "'postgresql'" : "'error','slowquery'"}],
  cloudwatchLogsRetention: logs.RetentionDays.ONE_MONTH,
});` : `# Terraform — Aurora Serverless v2 완전 구성
resource "aws_db_subnet_group" "app" {
  name_prefix = "\${var.project}-\${var.env}-"
  subnet_ids  = ${subnet === "3tier" ? "module.vpc.database_subnets" : "module.vpc.private_subnets"}
}

resource "aws_rds_cluster_parameter_group" "app" {
  family = "${isPgLocal ? "aurora-postgresql16" : "aurora-mysql8.0"}"
  name_prefix = "\${var.project}-\${var.env}-"

  parameter {
    name  = "${isPgLocal ? "log_min_duration_statement" : "slow_query_log"}"
    value = "${isPgLocal ? "1000" : "1"}"
  }
  parameter {
    name  = "${isPgLocal ? "shared_preload_libraries" : "long_query_time"}"
    value = "${isPgLocal ? "pg_stat_statements" : "1"}"
  }
}

resource "aws_rds_cluster" "app" {
  cluster_identifier              = "\${var.project}-\${var.env}"
  engine                          = "${isPgLocal ? "aurora-postgresql" : "aurora-mysql"}"
  engine_mode                     = "provisioned"
  engine_version                  = "${isPgLocal ? "16.3" : "8.0.mysql_aurora.3.07.0"}"
  database_name                   = "appdb"
  master_username                 = "appuser"
  manage_master_user_password     = true  # Secrets Manager 자동 관리

  serverlessv2_scaling_configuration {
    min_capacity = 0.5
    max_capacity = ${dau === "xlarge" ? 128 : dau === "large" ? 64 : dau === "medium" ? 16 : 4}
  }

  db_subnet_group_name            = aws_db_subnet_group.app.name
  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.app.name
  vpc_security_group_ids          = [aws_security_group.db.id]

  storage_encrypted               = true
  ${encr === "strict" ? `kms_key_id                      = aws_kms_key.db.arn` : ""}
  deletion_protection             = true
  skip_final_snapshot             = false
  final_snapshot_identifier       = "\${var.project}-\${var.env}-final"

  backup_retention_period         = ${dau === "large" || dau === "xlarge" ? 35 : 7}
  preferred_backup_window         = "17:00-18:00"
  preferred_maintenance_window    = "sun:18:00-sun:19:00"

  enabled_cloudwatch_logs_exports = [${isPgLocal ? '"postgresql"' : '"error","slowquery"'}]

  tags = local.common_tags
}

resource "aws_rds_cluster_instance" "writer" {
  cluster_identifier         = aws_rds_cluster.app.id
  instance_class             = "db.serverless"
  engine                     = aws_rds_cluster.app.engine
  engine_version             = aws_rds_cluster.app.engine_version
  performance_insights_enabled = true
  monitoring_interval        = 60  # Enhanced Monitoring
  monitoring_role_arn        = aws_iam_role.rds_monitoring.arn
}${dbHa === "multi_az_read" || dbHa === "global" ? `

resource "aws_rds_cluster_instance" "reader" {
  cluster_identifier = aws_rds_cluster.app.id
  instance_class     = "db.serverless"
  engine             = aws_rds_cluster.app.engine
  engine_version     = aws_rds_cluster.app.engine_version
  promotion_tier     = 1  # 페일오버 우선순위 최고
}` : ""}`,
    });
  }

  // ── 9. DynamoDB
  if (hasDynamo) {
    snippets.push({
      category: "데이터베이스",
      title: "DynamoDB 테이블 + GSI + PITR",
      lang,
      desc: `On-Demand + Point-in-Time Recovery${region === "active" ? " + Global Tables" : ""}`,
      code: CDK ? `// AWS CDK — DynamoDB
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

const table = new dynamodb.TableV2(this, 'AppTable', {
  tableName: 'app-items',
  partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
  sortKey:      { name: 'sk', type: dynamodb.AttributeType.STRING },
  billing: dynamodb.Billing.onDemand(),
  pointInTimeRecovery: true,
  encryption: dynamodb.TableEncryption.AWS_MANAGED,
  timeToLiveAttribute: 'ttl',  // 오래된 항목 자동 삭제${region === "active" ? `
  replicas: [{ region: 'us-east-1' }],  // Global Tables` : ""}
});

// GSI 추가 (예: 사용자별 조회)
table.addGlobalSecondaryIndex({
  indexName: 'gsi-user-id',
  partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
  sortKey:      { name: 'createdAt', type: dynamodb.AttributeType.STRING },
  projectionType: dynamodb.ProjectionType.INCLUDE,
  nonKeyAttributes: ['status','title'],
});` : `# Terraform — DynamoDB + GSI + Stream
resource "aws_dynamodb_table" "app" {
  name         = "\${var.project}-\${var.env}-items"
  billing_mode = "PAY_PER_REQUEST"  # On-Demand
  hash_key     = "pk"
  range_key    = "sk"

  attribute { name = "pk";     type = "S" }
  attribute { name = "sk";     type = "S" }
  attribute { name = "userId"; type = "S" }

  global_secondary_index {
    name            = "gsi-user-id"
    hash_key        = "userId"
    range_key       = "sk"
    projection_type = "INCLUDE"
    non_key_attributes = ["status","title","createdAt"]
  }

  point_in_time_recovery { enabled = true }
  server_side_encryption  { enabled = true }  # AWS Managed Key
  ttl { attribute_name = "ttl"; enabled = true }

  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"  # Lambda 이벤트 처리${region === "active" ? `

  # Global Tables (멀티리전 복제)
  replica { region_name = "us-east-1" }` : ""}

  tags = local.common_tags
}

${region === "active" ? `# Global Tables는 provider 설정 필요
# provider "aws" { alias = "us_east_1"; region = "us-east-1" }` : ""}`,
    });
  }

  // ── 10. ElastiCache Valkey/Redis
  if (hasRedis) {
    snippets.push({
      category: "데이터베이스",
      title: "ElastiCache Valkey (Redis 호환) 클러스터",
      lang,
      desc: `Multi-AZ Replication Group + 전송 중/저장 암호화`,
      code: CDK ? `// AWS CDK — ElastiCache Serverless (신규 권장)
import * as elasticache from 'aws-cdk-lib/aws-elasticache';

// 방법 1: ElastiCache Serverless (2023년 출시, 가장 간단)
const serverlessCache = new elasticache.CfnServerlessCache(this, 'AppCache', {
  serverlessCacheName: \`\${project}-\${env}\`,
  engine: 'valkey',
  subnetIds: vpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }).subnetIds,
  securityGroupIds: [cacheSg.securityGroupId],
  cacheUsageLimits: {
    dataStorage:     { maximum: ${dau === "xlarge" ? 100 : 20}, unit: 'GB' },
    ecpuPerSecond:   { maximum: ${dau === "xlarge" ? 100000 : 10000} },
  },
});` : `# Terraform — ElastiCache Valkey (Redis 호환)
resource "aws_elasticache_subnet_group" "app" {
  name_prefix = "\${var.project}-\${var.env}-"
  subnet_ids  = module.vpc.private_subnets
}

resource "aws_elasticache_replication_group" "app" {
  replication_group_id = "\${var.project}-\${var.env}"
  description          = "Valkey cache cluster"
  engine               = "valkey"
  engine_version       = "8.0"
  node_type            = "${dau === "xlarge" ? "cache.r7g.xlarge" : dau === "large" ? "cache.r7g.large" : "cache.r7g.medium"}"
  port                 = 6379

  num_cache_clusters         = ${azNum}
  automatic_failover_enabled = ${azNum > 1}
  multi_az_enabled           = ${azNum > 1}

  subnet_group_name          = aws_elasticache_subnet_group.app.name
  security_group_ids         = [aws_security_group.cache.id]

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = random_password.redis_auth.result  # AUTH 비밀번호

  # 파라미터 그룹 (메모리 정책)
  parameter_group_name       = aws_elasticache_parameter_group.app.name

  snapshot_retention_limit   = 3
  snapshot_window            = "03:00-04:00"

  tags = local.common_tags
}

resource "aws_elasticache_parameter_group" "app" {
  family = "valkey8"
  name_prefix = "\${var.project}-\${var.env}-"

  # 메모리 초과 시 LRU 방식으로 오래된 캐시 제거
  parameter { name = "maxmemory-policy"; value = "allkeys-lru" }
}

resource "random_password" "redis_auth" {
  length  = 32
  special = false
}

resource "aws_secretsmanager_secret_version" "redis" {
  secret_id = aws_secretsmanager_secret.redis.id
  secret_string = jsonencode({
    host     = aws_elasticache_replication_group.app.primary_endpoint_address
    port     = 6379
    auth_token = random_password.redis_auth.result
  })
}`,
    });
  }

  // ── 11. CloudFront + S3 OAC
  if (cdn !== "no") {
    snippets.push({
      category: "엣지 / CDN",
      title: "CloudFront + S3 OAC 완전 구성",
      lang,
      desc: "OAC(Origin Access Control) 방식. OAI는 deprecated",
      code: CDK ? `// AWS CDK — CloudFront + S3 OAC
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';

const staticBucket = new s3.Bucket(this, 'StaticBucket', {
  encryption: s3.BucketEncryption.S3_MANAGED,
  blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,  // 퍼블릭 완전 차단
  versioned: true,
});

const distribution = new cloudfront.Distribution(this, 'AppCdn', {
  defaultBehavior: {
    origin: new origins.LoadBalancerV2Origin(alb, {
      protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
      httpsPort: 443,
    }),
    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
    cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
    cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,  // API: 캐시 없음
  },
  additionalBehaviors: {
    '/static/*': {
      origin: new origins.S3BucketOrigin.withOriginAccessControl(staticBucket),
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      cachePolicy: new cloudfront.CachePolicy(this, 'StaticCachePolicy', {
        defaultTtl: cdk.Duration.days(30),
        maxTtl: cdk.Duration.days(365),
        minTtl: cdk.Duration.seconds(0),
        enableAcceptEncodingGzip: true,
      }),
    },
  },
  domainNames: ['app.example.com'],
  certificate: acmCertUsEast1,  // us-east-1 인증서 필수
  priceClass: cloudfront.PriceClass.PRICE_CLASS_200,
  httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
  minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
  ${waf && waf !== "no" ? "webAclId: webAcl.attrArn," : ""}
});` : `# Terraform — CloudFront + S3 OAC
resource "aws_cloudfront_origin_access_control" "s3" {
  name                              = "\${var.project}-\${var.env}-s3-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "app" {
  enabled             = true
  http_version        = "http2and3"
  price_class         = "PriceClass_200"  # 한국/아시아/유럽/미국
  aliases             = ["app.example.com"]
  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.app_us_east.arn  # us-east-1 인증서
    minimum_protocol_version = "TLSv1.2_2021"
    ssl_support_method       = "sni-only"
  }

  # API Origin (ALB)
  origin {
    domain_name = aws_lb.app.dns_name
    origin_id   = "alb"
    custom_origin_config {
      http_port              = 80; https_port = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # 정적 파일 Origin (S3)
  origin {
    domain_name              = aws_s3_bucket.static.bucket_regional_domain_name
    origin_id                = "s3-static"
    origin_access_control_id = aws_cloudfront_origin_access_control.s3.id
  }

  # API: 캐시 없음
  default_cache_behavior {
    target_origin_id       = "alb"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["DELETE","GET","HEAD","OPTIONS","PATCH","POST","PUT"]
    cached_methods         = ["GET","HEAD"]
    cache_policy_id        = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"  # CachingDisabled
    compress               = true
  }

  # 정적 파일: 장기 캐시
  ordered_cache_behavior {
    path_pattern           = "/static/*"
    target_origin_id       = "s3-static"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET","HEAD"]
    cached_methods         = ["GET","HEAD"]
    cache_policy_id        = "658327ea-f89d-4fab-a63d-7e88639e58f6"  # CachingOptimized
    compress               = true
  }

  restrictions { geo_restriction { restriction_type = "none" } }
  ${waf && waf !== "no" ? `web_acl_id = aws_wafv2_web_acl.app.arn  # us-east-1 WAF` : ""}

  tags = local.common_tags
}

# S3 버킷 정책 — CloudFront OAC만 접근
resource "aws_s3_bucket_policy" "static" {
  bucket = aws_s3_bucket.static.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "cloudfront.amazonaws.com" }
      Action    = "s3:GetObject"
      Resource  = "\${aws_s3_bucket.static.arn}/*"
      Condition = {
        StringEquals = { "AWS:SourceArn" = aws_cloudfront_distribution.app.arn }
      }
    }]
  })
}`,
    });
  }

  // ── 12. CloudWatch 알람 기본 세트
  snippets.push({
    category: "운영 / 모니터링",
    title: "CloudWatch 알람 기본 세트",
    lang,
    desc: "ALB + 컴퓨팅 + DB + 캐시 핵심 알람. SNS로 Slack/이메일 알림",
    code: CDK ? `// AWS CDK — CloudWatch 알람 세트
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';

const alertTopic = new sns.Topic(this, 'AlertTopic', { topicName: 'app-alerts' });
// 이메일 구독
new sns.Subscription(this, 'EmailSub', {
  topic: alertTopic, protocol: sns.SubscriptionProtocol.EMAIL,
  endpoint: 'oncall@company.com',
});

const alarmAction = new actions.SnsAction(alertTopic);
const mkAlarm = (id: string, metric: cloudwatch.Metric, threshold: number, desc: string) =>
  new cloudwatch.Alarm(this, id, {
    metric, threshold, evaluationPeriods: 2,
    alarmDescription: desc, actionsEnabled: true,
  }).addAlarmAction(alarmAction);

// ALB
mkAlarm('Alb5xx',  albMetric('HTTPCode_Target_5XX_Count', cdk.Duration.minutes(1)), 10, 'ALB 5xx 오류 > 10/분');
mkAlarm('AlbP99',  albMetric('TargetResponseTime', cdk.Duration.minutes(5), 'p99'), 2, 'ALB p99 응답시간 > 2초');
mkAlarm('AlbHost', albMetric('HealthyHostCount',  cdk.Duration.minutes(1), 'min'), 1, 'Healthy 호스트 < 2');` : `# Terraform — CloudWatch 알람 전체 세트
resource "aws_sns_topic" "alerts" {
  name = "\${var.project}-\${var.env}-alerts"
}
resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

locals {
  alarm_actions = [aws_sns_topic.alerts.arn]
  eval_periods  = 2
}

# ── ALB 알람
resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  alarm_name          = "\${var.project}-\${var.env}-alb-5xx"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = local.eval_periods
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "ALB 5xx 오류 > 10/분"
  alarm_actions       = local.alarm_actions
  dimensions          = { LoadBalancer = aws_lb.app.arn_suffix }
}

resource "aws_cloudwatch_metric_alarm" "alb_latency_p99" {
  alarm_name          = "\${var.project}-\${var.env}-alb-p99"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = local.eval_periods
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = 300; extended_statistic = "p99"; threshold = 2
  alarm_actions       = local.alarm_actions
  dimensions          = { LoadBalancer = aws_lb.app.arn_suffix }
}

${isEcs ? `# ── ECS 알람
resource "aws_cloudwatch_metric_alarm" "ecs_cpu" {
  alarm_name          = "\${var.project}-\${var.env}-ecs-cpu"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = local.eval_periods
  metric_name = "CPUUtilization"; namespace = "AWS/ECS"; period = 60
  statistic = "Average"; threshold = 80
  alarm_actions = local.alarm_actions
  dimensions = { ClusterName = aws_ecs_cluster.main.name, ServiceName = aws_ecs_service.app.name }
}

resource "aws_cloudwatch_metric_alarm" "ecs_memory" {
  alarm_name          = "\${var.project}-\${var.env}-ecs-memory"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = local.eval_periods
  metric_name = "MemoryUtilization"; namespace = "AWS/ECS"; period = 60
  statistic = "Average"; threshold = 85
  alarm_actions = local.alarm_actions
  dimensions = { ClusterName = aws_ecs_cluster.main.name, ServiceName = aws_ecs_service.app.name }
}` : ""}

${hasAurora || hasRds ? `# ── DB 알람
resource "aws_cloudwatch_metric_alarm" "db_cpu" {
  alarm_name          = "\${var.project}-\${var.env}-db-cpu"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = local.eval_periods
  metric_name = "CPUUtilization"; namespace = "AWS/RDS"; period = 60
  statistic = "Average"; threshold = 80
  alarm_actions = local.alarm_actions
  dimensions = { DBClusterIdentifier = aws_rds_cluster.app.cluster_identifier }
}

resource "aws_cloudwatch_metric_alarm" "db_connections" {
  alarm_name          = "\${var.project}-\${var.env}-db-connections"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = local.eval_periods
  metric_name = "DatabaseConnections"; namespace = "AWS/RDS"; period = 60
  statistic = "Average"; threshold = 200
  alarm_actions = local.alarm_actions
  dimensions = { DBClusterIdentifier = aws_rds_cluster.app.cluster_identifier }
}` : ""}

${hasRedis ? `# ── ElastiCache 알람
resource "aws_cloudwatch_metric_alarm" "redis_cpu" {
  alarm_name          = "\${var.project}-\${var.env}-redis-cpu"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = local.eval_periods
  metric_name = "EngineCPUUtilization"; namespace = "AWS/ElastiCache"; period = 60
  statistic = "Average"; threshold = 80
  alarm_actions = local.alarm_actions
  dimensions = { ReplicationGroupId = aws_elasticache_replication_group.app.id }
}

resource "aws_cloudwatch_metric_alarm" "redis_evictions" {
  alarm_name          = "\${var.project}-\${var.env}-redis-evictions"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = local.eval_periods
  metric_name = "Evictions"; namespace = "AWS/ElastiCache"; period = 60
  statistic = "Sum"; threshold = 1000
  alarm_actions = local.alarm_actions
  dimensions = { ReplicationGroupId = aws_elasticache_replication_group.app.id }
}` : ""}

# ── 비용 알람
resource "aws_budgets_budget" "monthly" {
  name         = "\${var.project}-\${var.env}-monthly"
  budget_type  = "COST"
  limit_amount = var.monthly_budget_usd
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  notification {
    comparison_operator = "GREATER_THAN"
    threshold           = 80
    threshold_type      = "PERCENTAGE"
    notification_type   = "ACTUAL"
    subscriber_email_addresses = [var.alert_email]
  }
}`,
  });

  // ── 13. GitHub Actions 배포 워크플로
  if (pipeline === "github") {
    snippets.push({
      category: "CI/CD",
      title: `GitHub Actions ${deploy === "bluegreen" ? "Blue/Green" : deploy === "canary" ? "Canary" : "Rolling"} 배포`,
      lang: "yaml",
      desc: `ECR 빌드 → ${isEks ? "EKS" : "ECS"} 배포. 멀티 환경(${envCnt === "three" ? "dev/stage/prod" : "dev/prod"}) 지원`,
      code: `# .github/workflows/deploy.yml
name: Deploy to ${isEks ? "EKS" : "ECS"}
on:
  push:
    branches:
      - main      # → prod
      - develop   # → staging

env:
  AWS_REGION: ap-northeast-2
  ECR_REPOSITORY: \${{ vars.ECR_REPOSITORY }}

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      id-token: write  # OIDC
      contents: read

    steps:
      - uses: actions/checkout@v4

      - name: Set environment
        run: |
          if [ "\${{ github.ref }}" = "refs/heads/main" ]; then
            echo "ENV=prod" >> \$GITHUB_ENV
            echo "ROLE_ARN=\${{ secrets.AWS_DEPLOY_ROLE_PROD }}" >> \$GITHUB_ENV
          else
            echo "ENV=staging" >> \$GITHUB_ENV
            echo "ROLE_ARN=\${{ secrets.AWS_DEPLOY_ROLE_STAGING }}" >> \$GITHUB_ENV
          fi

      - name: Configure AWS credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: \${{ env.ROLE_ARN }}
          aws-region: \${{ env.AWS_REGION }}

      - name: Login to ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build, tag, push image
        env:
          ECR_REGISTRY: \${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: \${{ github.sha }}
        run: |
          docker build -t \$ECR_REGISTRY/\$ECR_REPOSITORY:\$IMAGE_TAG .
          docker build -t \$ECR_REGISTRY/\$ECR_REPOSITORY:latest .
          docker push \$ECR_REGISTRY/\$ECR_REPOSITORY:\$IMAGE_TAG
          docker push \$ECR_REGISTRY/\$ECR_REPOSITORY:latest
          echo "image=\$ECR_REGISTRY/\$ECR_REPOSITORY:\$IMAGE_TAG" >> \$GITHUB_OUTPUT

${isEks ? `      - name: Update kubeconfig
        run: aws eks update-kubeconfig --name \${{ vars.EKS_CLUSTER_NAME }}-\${{ env.ENV }} --region \${{ env.AWS_REGION }}

      - name: Deploy to EKS
        env:
          IMAGE_TAG: \${{ github.sha }}
        run: |
          kubectl set image deployment/app app=\$ECR_REGISTRY/\$ECR_REPOSITORY:\$IMAGE_TAG -n \${{ env.ENV }}
          kubectl rollout status deployment/app -n \${{ env.ENV }} --timeout=5m

      - name: Rollback on failure
        if: failure()
        run: kubectl rollout undo deployment/app -n \${{ env.ENV }}` : `      - name: Deploy to ECS${deploy === "bluegreen" ? ` (Blue/Green via CodeDeploy)
        uses: aws-actions/amazon-ecs-deploy-task-definition@v2
        with:
          task-definition: task-definition.json
          service: \${{ vars.ECS_SERVICE }}-\${{ env.ENV }}
          cluster: \${{ vars.ECS_CLUSTER }}-\${{ env.ENV }}
          codedeploy-appspec: appspec.json
          codedeploy-application: \${{ vars.ECS_SERVICE }}-\${{ env.ENV }}
          codedeploy-deployment-group: \${{ vars.ECS_SERVICE }}-\${{ env.ENV }}-dg
          wait-for-service-stability: true` : `
        uses: aws-actions/amazon-ecs-deploy-task-definition@v2
        with:
          task-definition: task-definition.json
          service: \${{ vars.ECS_SERVICE }}-\${{ env.ENV }}
          cluster: \${{ vars.ECS_CLUSTER }}-\${{ env.ENV }}
          wait-for-service-stability: true`}`}

      - name: Notify on failure
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: failure
          fields: repo,message,commit,author,action
        env:
          SLACK_WEBHOOK_URL: \${{ secrets.SLACK_WEBHOOK }}`,
    });
  }

  // ── 14. Secrets Manager 완전 구성
  if (hasPersonal || hasCritCert || secrets === "secrets_csi" || encr === "strict") {
    snippets.push({
      category: "IAM / 보안",
      title: "Secrets Manager + 자동 교체 설정",
      lang,
      desc: "DB 비밀번호 30일 자동 교체 Lambda. 앱 재시작 없이 적용",
      code: CDK ? `// AWS CDK — Secrets Manager + 자동 교체
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

const dbSecret = new secretsmanager.Secret(this, 'DbSecret', {
  secretName: 'app/db-credentials',
  description: 'Aurora DB 접속 정보',
  generateSecretString: {
    secretStringTemplate: JSON.stringify({
      username: 'appuser',
      engine: '${isPg ? "postgres" : "mysql"}',
      host: dbCluster.clusterEndpoint.hostname,
      port: ${isPg ? 5432 : 3306},
      dbname: 'appdb',
    }),
    generateStringKey: 'password',
    excludePunctuation: true,
    passwordLength: 32,
  },
});

// 30일 자동 교체
dbSecret.addRotationSchedule('RotationSchedule', {
  hostedRotation: secretsmanager.HostedRotation.${isPg ? "postgreSqlSingleUser" : "mysqlSingleUser"}({
    functionName: 'db-secret-rotation',
    vpc,
    vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    securityGroups: [rotationSg],
  }),
  automaticallyAfter: cdk.Duration.days(30),
});

// 앱에서 사용 시 (ECS Secrets 참조)
// secrets: { DB_PASSWORD: ecs.Secret.fromSecretsManager(dbSecret, 'password') }` : `# Terraform — Secrets Manager + 자동 교체
resource "aws_secretsmanager_secret" "db" {
  name_prefix             = "\${var.project}/\${var.env}/db-credentials-"
  description             = "Aurora DB 접속 정보"
  recovery_window_in_days = 7
  ${encr === "strict" ? `kms_key_id              = aws_kms_key.secrets.arn` : ""}
}

resource "aws_secretsmanager_secret_version" "db_initial" {
  secret_id = aws_secretsmanager_secret.db.id
  secret_string = jsonencode({
    username = "appuser"
    password = random_password.db.result
    engine   = "${isPg ? "postgres" : "mysql"}"
    host     = aws_rds_cluster.app.endpoint
    port     = ${isPg ? 5432 : 3306}
    dbname   = "appdb"
  })
}

resource "random_password" "db" {
  length  = 32
  special = false  # Aurora 특수문자 제한 때문에 false
}

# 30일 자동 교체
resource "aws_secretsmanager_secret_rotation" "db" {
  secret_id           = aws_secretsmanager_secret.db.id
  rotation_lambda_arn = aws_lambda_function.secret_rotation.arn

  rotation_rules {
    automatically_after_days = 30
  }
}

# ECS Task Definition에서 참조
# secrets = [
#   { name = "DB_PASSWORD", valueFrom = "\${aws_secretsmanager_secret.db.arn}:password::" }
# ]`,
    });
  }

  // ── 15. WAF Web ACL
  if (waf && waf !== "no") {
    snippets.push({
      category: "엣지 / CDN",
      title: `WAF v2${waf === "bot" ? " + Bot Control" : waf === "shield" ? " + Shield Advanced" : ""}`,
      lang,
      desc: "반드시 us-east-1에 생성 (CloudFront 연결 시)",
      code: CDK ? `// AWS CDK — WAF v2 (us-east-1 Stack에서 생성)
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';

// CloudFront WAF는 반드시 us-east-1에!
// const usEast1Stack = new Stack(app, 'WafStack', { env: { region: 'us-east-1' } });

const webAcl = new wafv2.CfnWebACL(this, 'AppWaf', {
  scope: 'CLOUDFRONT',
  defaultAction: { allow: {} },
  visibilityConfig: { sampledRequestsEnabled: true, cloudWatchMetricsEnabled: true, metricName: 'AppWaf' },
  rules: [
    {
      name: 'RateLimit',
      priority: 0,
      action: { block: {} },
      statement: {
        rateBasedStatement: {
          limit: 2000,  // IP당 5분 2000요청
          aggregateKeyType: 'IP',
        },
      },
      visibilityConfig: { sampledRequestsEnabled: true, cloudWatchMetricsEnabled: true, metricName: 'RateLimit' },
    },
    {
      name: 'CommonRules',
      priority: 1,
      overrideAction: { none: {} },
      statement: {
        managedRuleGroupStatement: { vendorName: 'AWS', name: 'AWSManagedRulesCommonRuleSet' },
      },
      visibilityConfig: { sampledRequestsEnabled: true, cloudWatchMetricsEnabled: true, metricName: 'CommonRules' },
    },${waf === "bot" ? `
    {
      name: 'BotControl',
      priority: 2,
      overrideAction: { none: {} },
      statement: {
        managedRuleGroupStatement: {
          vendorName: 'AWS', name: 'AWSManagedRulesBotControlRuleSet',
          managedRuleGroupConfigs: [
            { awsManagedRulesBotControlRuleSet: { inspectionLevel: 'TARGETED' } }
          ],
        },
      },
      visibilityConfig: { sampledRequestsEnabled: true, cloudWatchMetricsEnabled: true, metricName: 'BotControl' },
    },` : ""}
  ],
});` : `# Terraform — WAF v2 (us-east-1 provider 필요)
# provider "aws" { alias = "us_east_1"; region = "us-east-1" }

resource "aws_wafv2_web_acl" "app" {
  provider = aws.us_east_1  # CloudFront용은 us-east-1 필수
  name     = "\${var.project}-\${var.env}-waf"
  scope    = "CLOUDFRONT"

  default_action { allow {} }

  # IP 기반 요청 제한
  rule {
    name     = "RateLimit"
    priority = 0
    action { block {} }
    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }
    visibility_config { sampled_requests_enabled = true; cloudwatch_metrics_enabled = true; metric_name = "RateLimit" }
  }

  rule {
    name     = "CommonRules"
    priority = 1
    override_action { none {} }
    statement {
      managed_rule_group_statement { vendor_name = "AWS"; name = "AWSManagedRulesCommonRuleSet" }
    }
    visibility_config { sampled_requests_enabled = true; cloudwatch_metrics_enabled = true; metric_name = "CommonRules" }
  }

  rule {
    name     = "BadInputs"
    priority = 2
    override_action { none {} }
    statement {
      managed_rule_group_statement { vendor_name = "AWS"; name = "AWSManagedRulesKnownBadInputsRuleSet" }
    }
    visibility_config { sampled_requests_enabled = true; cloudwatch_metrics_enabled = true; metric_name = "BadInputs" }
  }
${waf === "bot" ? `
  rule {
    name     = "BotControl"
    priority = 3
    override_action { none {} }
    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesBotControlRuleSet"
        managed_rule_group_configs {
          aws_managed_rules_bot_control_rule_set { inspection_level = "TARGETED" }
        }
      }
    }
    visibility_config { sampled_requests_enabled = true; cloudwatch_metrics_enabled = true; metric_name = "BotControl" }
  }` : ""}

  visibility_config { sampled_requests_enabled = true; cloudwatch_metrics_enabled = true; metric_name = "AppWaf" }

  tags = local.common_tags
}`,
    });
  }

  // ── 16. SQS FIFO (결제/이커머스)
  if ((queueArr.includes("sqs") || isTx) && state.integration?.sync_async !== "sync_only") {
    snippets.push({
      category: "메시징 / 통합",
      title: "SQS FIFO + DLQ (주문/결제 처리)",
      lang,
      desc: "순서 보장 + 데드레터 큐 + 가시성 타임아웃 설정",
      code: CDK ? `// AWS CDK — SQS FIFO + DLQ
import * as sqs from 'aws-cdk-lib/aws-sqs';

const dlq = new sqs.Queue(this, 'OrderDlq', {
  queueName: 'order-dlq.fifo',
  fifo: true,
  retentionPeriod: cdk.Duration.days(14),
  encryption: sqs.QueueEncryption.KMS_MANAGED,
});

const orderQueue = new sqs.Queue(this, 'OrderQueue', {
  queueName: 'order-queue.fifo',
  fifo: true,
  contentBasedDeduplication: true,  // 중복 제거
  visibilityTimeout: cdk.Duration.seconds(300),  // Lambda 타임아웃 × 6
  encryption: sqs.QueueEncryption.KMS_MANAGED,
  deadLetterQueue: {
    queue: dlq,
    maxReceiveCount: 3,  // 3번 실패 시 DLQ로
  },
});

// DLQ 알람
new cloudwatch.Alarm(this, 'DlqAlarm', {
  metric: dlq.metricApproximateNumberOfMessagesVisible(),
  threshold: 1,
  evaluationPeriods: 1,
  alarmDescription: '주문 처리 실패 — DLQ에 메시지 존재',
}).addAlarmAction(new actions.SnsAction(alertTopic));` : `# Terraform — SQS FIFO + DLQ
resource "aws_sqs_queue" "order_dlq" {
  name                        = "\${var.project}-\${var.env}-order-dlq.fifo"
  fifo_queue                  = true
  message_retention_seconds   = 1209600  # 14일
  kms_master_key_id           = "alias/aws/sqs"
}

resource "aws_sqs_queue" "order_queue" {
  name                        = "\${var.project}-\${var.env}-order.fifo"
  fifo_queue                  = true
  content_based_deduplication = true
  visibility_timeout_seconds  = 300  # Lambda 타임아웃 × 6

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.order_dlq.arn
    maxReceiveCount     = 3  # 3번 실패 → DLQ
  })

  kms_master_key_id = "alias/aws/sqs"
  tags = local.common_tags
}

# DLQ에 메시지 도착 시 즉시 알람
resource "aws_cloudwatch_metric_alarm" "dlq" {
  alarm_name          = "\${var.project}-\${var.env}-order-dlq"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 60; statistic = "Sum"; threshold = 1
  alarm_actions       = [aws_sns_topic.alerts.arn]
  dimensions          = { QueueName = aws_sqs_queue.order_dlq.name }
}`,
    });
  }

  // ── 17. Karpenter NodePool (EKS)
  if (isEks && nodeP === "karpenter") {
    snippets.push({
      category: "컴퓨팅",
      title: "Karpenter NodePool + EC2NodeClass",
      lang: "yaml",
      desc: "Graviton ARM + Spot 혼합. 5초 이내 노드 프로비저닝",
      code: `# EC2NodeClass — AWS 리소스 설정
apiVersion: karpenter.k8s.aws/v1
kind: EC2NodeClass
metadata:
  name: default
spec:
  amiSelectorTerms:
    - alias: al2023@latest  # Amazon Linux 2023 최신
  role: "KarpenterNodeRole-\${CLUSTER_NAME}"
  subnetSelectorTerms:
    - tags:
        karpenter.sh/discovery: "\${CLUSTER_NAME}"  # 프라이빗 서브넷 자동 선택
  securityGroupSelectorTerms:
    - tags:
        karpenter.sh/discovery: "\${CLUSTER_NAME}"
  instanceStorePolicy: RAID0  # NVMe 인스턴스 스토어 활용

---
# NodePool — 인스턴스 선택 정책
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: default
spec:
  template:
    metadata:
      labels:
        karpenter.sh/nodepool: default
    spec:
      nodeClassRef:
        group: karpenter.k8s.aws
        kind: EC2NodeClass
        name: default
      requirements:
        - key: kubernetes.io/arch
          operator: In
          values: ["arm64"]  # Graviton 전용
        - key: karpenter.sh/capacity-type
          operator: In
          values: ${spot === "no" ? '["on-demand"]' : '["spot","on-demand"]'}
        - key: karpenter.k8s.aws/instance-family
          operator: In
          values: ["m7g","m6g","c7g","c6g","r7g"]  # Graviton 패밀리
        - key: karpenter.k8s.aws/instance-size
          operator: NotIn
          values: ["nano","micro","small"]  # 너무 작은 인스턴스 제외
      expireAfter: 720h  # 30일마다 노드 교체 (보안 업데이트)

  limits:
    cpu: ${dau === "xlarge" ? 1000 : dau === "large" ? 500 : 200}
    memory: ${dau === "xlarge" ? "2000Gi" : dau === "large" ? "1000Gi" : "400Gi"}

  disruption:
    consolidationPolicy: WhenEmptyOrUnderutilized
    consolidateAfter: 1m  # 1분 유휴 시 노드 제거

---
# Pod Disruption Budget — 배포 중 최소 가용 Pod 보장
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: app-pdb
spec:
  minAvailable: "50%"  # 항상 50% 이상 실행 중 보장
  selector:
    matchLabels:
      app: app`,
    });
  }

  // ── 18. ArgoCD App-of-Apps (EKS + GitOps)
  if (isEks && gitops === "argocd") {
    snippets.push({
      category: "CI/CD",
      title: "ArgoCD App-of-Apps GitOps 패턴",
      lang: "yaml",
      desc: "모든 앱을 Git으로 관리. 드리프트 자동 감지 및 복구",
      code: `# 루트 App (apps/ 디렉토리의 모든 앱 자동 배포)
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: apps
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/YOUR_ORG/YOUR_REPO
    targetRevision: HEAD
    path: argocd/apps  # 이 디렉토리의 모든 Application을 배포
  destination:
    server: https://kubernetes.default.svc
    namespace: argocd
  syncPolicy:
    automated:
      prune: true      # Git에서 삭제된 리소스 자동 제거
      selfHeal: true   # 드리프트 자동 복구

---
# 개별 앱 Application (argocd/apps/app.yaml)
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: app
  namespace: argocd
  annotations:
    notifications.argoproj.io/subscribe.on-sync-failed.slack: deploy-alerts
spec:
  project: default
  source:
    repoURL: https://github.com/YOUR_ORG/YOUR_REPO
    targetRevision: HEAD
    path: k8s/app
    kustomize:
      images:
        - app=\${ECR_REPOSITORY}:latest
  destination:
    server: https://kubernetes.default.svc
    namespace: prod
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
      - PrunePropagationPolicy=foreground
    retry:
      limit: 3
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m`,
    });
  }

  // ── 19. HPA + KEDA (EKS)
  const scalingArr = Array.isArray(scaling) ? scaling : (scaling ? [scaling] : []);
  if (isEks && scalingArr.includes("keda")) {
    snippets.push({
      category: "컴퓨팅",
      title: "HPA + KEDA 이벤트 기반 스케일링",
      lang: "yaml",
      desc: "SQS 메시지 수 기반 정밀 스케일링. CPU 기반 HPA와 병행",
      code: `# KEDA ScaledObject — SQS 메시지 수 기반
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: app-worker-scaler
  namespace: prod
spec:
  scaleTargetRef:
    name: app-worker
  minReplicaCount: ${minNodes}
  maxReplicaCount: ${maxNodes}
  # 스케일 다운 대기 시간 (처리 완료 후 축소)
  cooldownPeriod: 60
  fallback:
    failureThreshold: 3
    replicas: ${minNodes}  # KEDA 장애 시 최소 유지
  triggers:
    - type: aws-sqs-queue
      authenticationRef:
        name: keda-aws-credentials
      metadata:
        queueURL: https://sqs.ap-northeast-2.amazonaws.com/ACCOUNT_ID/\${QUEUE_NAME}
        queueLength: "5"         # Pod 1개당 처리 메시지 수
        awsRegion: ap-northeast-2
        identityOwner: operator  # EKS Pod Identity 사용

---
# TriggerAuthentication — EKS Pod Identity 사용 (IRSA보다 간단)
apiVersion: keda.sh/v1alpha1
kind: TriggerAuthentication
metadata:
  name: keda-aws-credentials
  namespace: prod
spec:
  podIdentity:
    provider: aws  # EKS Pod Identity Agent

---
# 기본 HPA도 병행 (CPU 기반 스케일링)
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: app-hpa
  namespace: prod
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: app
  minReplicas: ${minNodes}
  maxReplicas: ${maxNodes}
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80`,
    });
  }

  // ── 20. Cognito User Pool
  if (authArr.includes("cognito")) {
    snippets.push({
      category: "IAM / 보안",
      title: "Cognito User Pool + App Client",
      lang,
      desc: "소셜 로그인 + MFA + 커스텀 도메인 설정",
      code: CDK ? `// AWS CDK — Cognito User Pool
import * as cognito from 'aws-cdk-lib/aws-cognito';

const userPool = new cognito.UserPool(this, 'AppUserPool', {
  userPoolName: \`\${project}-\${env}\`,
  selfSignUpEnabled: true,
  signInAliases: { email: true },
  autoVerify: { email: true },
  passwordPolicy: {
    minLength: 12,
    requireLowercase: true, requireUppercase: true,
    requireDigits: true, requireSymbols: true,
    tempPasswordValidity: cdk.Duration.days(7),
  },
  mfa: cognito.Mfa.OPTIONAL,
  mfaSecondFactor: { sms: false, otp: true },
  accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
  advancedSecurityMode: cognito.AdvancedSecurityMode.ENFORCED,
});

const appClient = userPool.addClient('WebClient', {
  userPoolClientName: 'web',
  authFlows: { userSrp: true },
  oAuth: {
    flows: { authorizationCodeGrant: true },
    scopes: [cognito.OAuthScope.EMAIL, cognito.OAuthScope.OPENID, cognito.OAuthScope.PROFILE],
    callbackUrls: [\`https://\${domainName}/callback\`],
    logoutUrls: [\`https://\${domainName}/logout\`],
  },
  preventUserExistenceErrors: true,
  enableTokenRevocation: true,
  accessTokenValidity: cdk.Duration.hours(1),
  refreshTokenValidity: cdk.Duration.days(30),
});

// 커스텀 도메인
userPool.addDomain('CognitoDomain', {
  customDomain: { domainName: \`auth.\${domainName}\`, certificate: acmCert },
});` : `# Terraform — Cognito User Pool
resource "aws_cognito_user_pool" "app" {
  name = "\${var.project}-\${var.env}"

  username_attributes = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 12
    require_lowercase = true
    require_uppercase = true
    require_numbers   = true
    require_symbols   = true
    temporary_password_validity_days = 7
  }

  mfa_configuration = "OPTIONAL"
  software_token_mfa_configuration { enabled = true }

  account_recovery_setting {
    recovery_mechanism { name = "verified_email"; priority = 1 }
  }

  user_pool_add_ons { advanced_security_mode = "ENFORCED" }

  tags = local.common_tags
}

resource "aws_cognito_user_pool_client" "web" {
  name         = "web"
  user_pool_id = aws_cognito_user_pool.app.id

  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["email","openid","profile"]
  callback_urls = ["https://\${var.domain_name}/callback"]
  logout_urls   = ["https://\${var.domain_name}/logout"]

  supported_identity_providers = ["COGNITO"]
  prevent_user_existence_errors = "ENABLED"
  enable_token_revocation       = true
  access_token_validity         = 1    # 1시간
  refresh_token_validity        = 30   # 30일
  token_validity_units {
    access_token  = "hours"
    refresh_token = "days"
  }
}`,
    });
  }

  // ── TRACK 2: Terraform 모듈 구조 & 환경별 변수 파일 ─────────────
  // T2-1: Terraform 변수 파일 (dev/staging/prod)
  if (TF) {
    snippets.push({
      category: "IaC 기반",
      title: "Terraform 환경별 변수 파일 (dev/staging/prod)",
      lang: "hcl",
      desc: "3개 환경 설정값 분리. Workspace + tfvars 패턴",
      code: `# ── locals.tf (공통 태그/계산)
locals {
  common_tags = {
    Project     = var.project
    Environment = var.env
    ManagedBy   = "terraform"
    Team        = var.team_name
  }

  # 환경별 설정 맵
  env_config = {
    dev = {
      az_count          = 2
      nat_gateway_count = 1      # dev는 NAT GW 1개로 비용 절감
      db_min_capacity   = 0.5
      db_max_capacity   = ${dau === "xlarge" ? 8 : 4}
      db_backup_days    = 1
      enable_deletion_protection = false
      db_skip_final_snapshot    = true
      ecs_desired_count         = 1
      ecs_max_count             = 3
      enable_waf                = false  # dev는 WAF 비활성화
    }
    staging = {
      az_count          = 2
      nat_gateway_count = ${azNum > 1 ? 2 : 1}
      db_min_capacity   = 0.5
      db_max_capacity   = ${dau === "xlarge" ? 32 : dau === "large" ? 16 : 8}
      db_backup_days    = 7
      enable_deletion_protection = true
      db_skip_final_snapshot    = false
      ecs_desired_count         = ${minNodes}
      ecs_max_count             = ${Math.round(maxNodes * 0.5)}
      enable_waf                = true
    }
    prod = {
      az_count          = ${azNum}
      nat_gateway_count = ${natStrat === "per_az" ? azNum : 1}
      db_min_capacity   = 0.5
      db_max_capacity   = ${dau === "xlarge" ? 128 : dau === "large" ? 64 : dau === "medium" ? 16 : 4}
      db_backup_days    = ${dau === "large" || dau === "xlarge" ? 35 : 14}
      enable_deletion_protection = true
      db_skip_final_snapshot    = false
      ecs_desired_count         = ${minNodes}
      ecs_max_count             = ${maxNodes}
      enable_waf                = true
    }
  }

  cfg = local.env_config[var.env]
}

# ── variables.tf
variable "project"   { type = string }
variable "env"       { type = string; validation { condition = contains(["dev","staging","prod"], var.env); error_message = "env must be dev, staging, or prod" } }
variable "team_name" { type = string; default = "platform" }
variable "alert_email"       { type = string }
variable "monthly_budget_usd"{ type = number; default = 1000 }

# ── dev.tfvars
# project            = "${state.workload?.type?.[0] || "myapp"}"
# env                = "dev"
# team_name          = "engineering"
# alert_email        = "dev-team@company.com"
# monthly_budget_usd = 200

# ── staging.tfvars
# project            = "${state.workload?.type?.[0] || "myapp"}"
# env                = "staging"
# team_name          = "engineering"
# alert_email        = "dev-team@company.com"
# monthly_budget_usd = 500

# ── prod.tfvars
# project            = "${state.workload?.type?.[0] || "myapp"}"
# env                = "prod"
# team_name          = "engineering"
# alert_email        = "oncall@company.com"
# monthly_budget_usd = 5000

# ── 사용법
# terraform workspace new prod
# terraform apply -var-file="prod.tfvars"
#
# 또는 환경변수:
# export TF_VAR_env=prod
# export TF_VAR_project=myapp`,
    });

    // T2-2: Terraform 모듈 구조
    snippets.push({
      category: "IaC 기반",
      title: "Terraform 모듈 디렉토리 구조",
      lang: "hcl",
      desc: "modules/로 분리된 재사용 가능한 모듈 구조",
      code: `# 권장 디렉토리 구조
# ├── main.tf           (루트: 모듈 호출)
# ├── variables.tf      (입력 변수)
# ├── outputs.tf        (출력값)
# ├── locals.tf         (계산값/태그)
# ├── backend.tf        (Remote State)
# ├── dev.tfvars
# ├── staging.tfvars
# ├── prod.tfvars
# └── modules/
#     ├── vpc/          (네트워크)
#     ├── security/     (SG, IAM, KMS)
#     ├── data/         (RDS, ElastiCache, S3)
#     ├── compute/      (ECS/EKS, ALB)
#     └── monitoring/   (CloudWatch, SNS)

# ── main.tf (루트 모듈)
module "vpc" {
  source      = "./modules/vpc"
  project     = var.project
  env         = var.env
  az_count    = local.cfg.az_count
  nat_count   = local.cfg.nat_gateway_count
  tags        = local.common_tags
}

module "security" {
  source      = "./modules/security"
  project     = var.project
  env         = var.env
  vpc_id      = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  tags        = local.common_tags
}

module "data" {
  source              = "./modules/data"
  project             = var.project
  env                 = var.env
  vpc_id              = module.vpc.vpc_id
  db_subnet_ids       = module.vpc.database_subnet_ids
  db_sg_id            = module.security.db_sg_id
  db_min_capacity     = local.cfg.db_min_capacity
  db_max_capacity     = local.cfg.db_max_capacity
  db_backup_days      = local.cfg.db_backup_days
  deletion_protection = local.cfg.enable_deletion_protection
  skip_final_snapshot = local.cfg.db_skip_final_snapshot
  tags                = local.common_tags
}

module "compute" {
  source              = "./modules/compute"
  project             = var.project
  env                 = var.env
  vpc_id              = module.vpc.vpc_id
  public_subnet_ids   = module.vpc.public_subnet_ids
  private_subnet_ids  = module.vpc.private_subnet_ids
  alb_sg_id           = module.security.alb_sg_id
  app_sg_id           = module.security.app_sg_id
  execution_role_arn  = module.security.ecs_execution_role_arn
  task_role_arn       = module.security.ecs_task_role_arn
  db_secret_arn       = module.data.db_secret_arn
  desired_count       = local.cfg.ecs_desired_count
  max_count           = local.cfg.ecs_max_count
  tags                = local.common_tags
}

module "monitoring" {
  source        = "./modules/monitoring"
  project       = var.project
  env           = var.env
  alb_arn       = module.compute.alb_arn_suffix
  ecs_cluster   = module.compute.ecs_cluster_name
  ecs_service   = module.compute.ecs_service_name
  db_identifier = module.data.db_cluster_identifier
  alert_email   = var.alert_email
  budget_usd    = var.monthly_budget_usd
  tags          = local.common_tags
}

# ── outputs.tf
output "alb_dns"        { value = module.compute.alb_dns_name }
output "db_endpoint"    { value = module.data.db_endpoint; sensitive = true }
output "ecr_repository" { value = module.compute.ecr_repository_url }`,
    });
  }

  // T2-3: CDK Stack 분리 패턴
  if (CDK) {
    snippets.push({
      category: "IaC 기반",
      title: "CDK Stack 분리 패턴 (NetworkStack → AppStack)",
      lang: "typescript",
      desc: "스택 간 의존성 관리 + 환경별 context 설정",
      code: `// bin/app.ts — 진입점
import * as cdk from 'aws-cdk-lib';
import { NetworkStack } from '../lib/network-stack';
import { SecurityStack } from '../lib/security-stack';
import { DataStack } from '../lib/data-stack';
import { AppStack } from '../lib/app-stack';
import { MonitoringStack } from '../lib/monitoring-stack';

const app = new cdk.App();

const envConfig = {
  dev: {
    azCount: 2, dbMaxCapacity: ${dau === "xlarge" ? 8 : 4},
    desiredCount: 1, enableWaf: false,
  },
  staging: {
    azCount: 2, dbMaxCapacity: ${dau === "xlarge" ? 32 : 16},
    desiredCount: ${minNodes}, enableWaf: true,
  },
  prod: {
    azCount: ${azNum}, dbMaxCapacity: ${dau === "xlarge" ? 128 : dau === "large" ? 64 : 16},
    desiredCount: ${minNodes}, enableWaf: true,
  },
};

const envName = app.node.tryGetContext('env') || 'dev';
const cfg = envConfig[envName as keyof typeof envConfig];
const awsEnv = { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'ap-northeast-2' };

const networkStack = new NetworkStack(app, \`\${envName}-Network\`, { env: awsEnv, cfg });
const securityStack = new SecurityStack(app, \`\${envName}-Security\`, {
  env: awsEnv, vpc: networkStack.vpc,
});
const dataStack = new DataStack(app, \`\${envName}-Data\`, {
  env: awsEnv, vpc: networkStack.vpc,
  dbSg: securityStack.dbSg, cfg,
});
const appStack = new AppStack(app, \`\${envName}-App\`, {
  env: awsEnv, vpc: networkStack.vpc,
  albSg: securityStack.albSg, appSg: securityStack.appSg,
  executionRole: securityStack.ecsExecutionRole,
  taskRole: securityStack.ecsTaskRole,
  dbSecret: dataStack.dbSecret, cfg,
});
new MonitoringStack(app, \`\${envName}-Monitoring\`, {
  env: awsEnv, alb: appStack.alb, service: appStack.service,
  dbCluster: dataStack.dbCluster,
});

// 배포 명령:
// cdk deploy --all --context env=dev
// cdk deploy --all --context env=prod`,
    });
  }

  return snippets;
}
