/* eslint-disable @typescript-eslint/no-explicit-any */
import type { WizardState, SecurityGroup, SecurityGroupResult } from "@/lib/types";

/**
 * generateSecurityGroups -- generates SG rules and IaC code from wizard state.
 * Ported from the original monolithic JSX generateSecurityGroups().
 */
export function generateSecurityGroups(
  state: WizardState
): SecurityGroupResult {
  const orchest = state.compute?.orchestration;
  const archP = state.compute?.arch_pattern;
  const db = state.data?.primary_db || [];
  const dbArr: string[] = Array.isArray(db)
    ? db
    : db && db !== "none"
      ? [db]
      : [];
  const cache = state.data?.cache;
  const search = state.data?.search;
  const cdn = state.edge?.cdn;
  const subnet = state.network?.subnet_tier;
  const iac = state.cicd?.iac;
  const hasCritCert = (state.compliance?.cert || []).some((c: string) =>
    ["pci", "hipaa", "sox"].includes(c)
  );
  const isServerless = archP === "serverless";
  const isEks = orchest === "eks";
  const apiType = state.integration?.api_type;
  const isNlb = apiType === "nlb";
  const lang = state.team?.language;

  // 앱 스택에 따른 동적 포트 결정
  const appPort = isEks ? "8080-9090" :
    lang === "spring_boot" ? "8080" :
    lang === "go" ? "8080" :
    lang === "python_fastapi" ? "8000" :
    "3000";
  const appPortNum = isEks ? "8080" : appPort;

  const groups: SecurityGroup[] = [];

  // ── NLB Security Group (NLB 선택 시) ──────────────────────────────
  if (isNlb) {
    groups.push({
      id: "nlb_sg",
      name: "NLB Security Group",
      desc: "NLB는 L4 로드밸런서. TCP/UDP 전달. 클라이언트 IP가 타겟에 그대로 전달됨",
      color: "#2563eb",
      inbound: [
        {
          port: "443",
          from: "0.0.0.0/0 (TLS 종료 또는 TLS Passthrough)",
        },
        {
          port: "80",
          from: "0.0.0.0/0 (TCP 트래픽)",
        },
      ],
      outbound: [
        {
          port: appPort,
          to: isEks
            ? "eks_node_sg (앱 서버로 전달)"
            : "app_sg (앱 서버로 전달)",
        },
      ],
    });
  }

  // ── ALB Security Group (NLB가 아닌 경우) ──────────────────────────
  if (!isNlb) {
    groups.push({
      id: "alb_sg",
      name: "ALB Security Group",
      desc: "인터넷 → ALB 인바운드. CloudFront IP 또는 0.0.0.0/0",
      color: "#2563eb",
      inbound: [
        {
          port: "443",
          from:
            cdn !== "no"
              ? "CloudFront Managed Prefix List (com.amazonaws.global.cloudfront.origin-facing) - HTTPS 트래픽"
              : "0.0.0.0/0 (HTTPS 트래픽)",
        },
        {
          port: "80",
          from:
            cdn !== "no"
              ? "CloudFront Managed Prefix List - HTTP (→443 리다이렉트)"
              : "0.0.0.0/0 (HTTP → 443 리다이렉트)",
        },
      ],
      outbound: [
        {
          port: appPort,
          to: isEks
            ? "eks_node_sg (앱 서버로 전달)"
            : "app_sg (앱 서버로 전달)",
        },
      ],
    });
  }

  // ── App Security Group ──────────────────────────────────────────────
  if (!isServerless) {
    const lbRef = isNlb ? "nlb_sg (NLB에서 앱으로)" : "alb_sg (ALB에서 앱으로)";
    const appInbound: { port: string; from: string }[] = [
      {
        port: isEks ? "1025-65535" : appPort,
        from: lbRef,
      },
    ];
    // NLB는 클라이언트 IP를 그대로 전달하므로, 클라이언트 IP 범위도 허용 필요할 수 있음
    if (isNlb && !isEks) {
      appInbound.push({
        port: appPort,
        from: "0.0.0.0/0 (NLB는 클라이언트 IP를 보존하여 전달. Target SG에서 허용 필요)",
      });
    }
    const appOutbound: { port: string; to: string }[] = [];

    if (dbArr.some((d) => d.includes("pg") || d.includes("aurora_pg"))) {
      appOutbound.push({ port: "5432", to: "db_sg (PostgreSQL/Aurora PG)" });
    }
    if (
      dbArr.some((d) => d.includes("mysql") || d.includes("aurora_mysql"))
    ) {
      appOutbound.push({ port: "3306", to: "db_sg (MySQL/Aurora MySQL)" });
    }
    if (cache === "redis" || cache === "both") {
      appOutbound.push({ port: "6379", to: "cache_sg (ElastiCache Redis)" });
    }
    if (search === "opensearch") {
      appOutbound.push({ port: "443", to: "search_sg (OpenSearch HTTPS)" });
    }
    appOutbound.push({
      port: "443",
      to: "0.0.0.0/0 VPC Endpoint 경유 (AWS 서비스 - Secrets Manager, ECR, CloudWatch)",
    });

    if (isEks) {
      appInbound.push({
        port: "443",
        from: "eks_control_plane_sg (EKS Control Plane → kubelet)",
      });
      appInbound.push({
        port: "10250",
        from: "eks_control_plane_sg (EKS Control Plane → 노드 메트릭)",
      });
    }

    groups.push({
      id: "app_sg",
      name: isEks ? "EKS Node Security Group" : "App Security Group",
      desc: "ALB → 앱 서버. 앱 → DB/캐시 아웃바운드",
      color: "#059669",
      inbound: appInbound,
      outbound: appOutbound,
    });
  }

  // ── Lambda SG (serverless) ──────────────────────────────────────────
  if (isServerless) {
    const lambdaOutbound: { port: string; to: string }[] = [];

    if (dbArr.some((d) => d.includes("pg"))) {
      lambdaOutbound.push({ port: "5432", to: "db_sg (Aurora PG)" });
    }
    if (dbArr.some((d) => d.includes("mysql"))) {
      lambdaOutbound.push({ port: "3306", to: "db_sg (Aurora MySQL)" });
    }
    if (cache === "redis" || cache === "both") {
      lambdaOutbound.push({ port: "6379", to: "cache_sg (ElastiCache)" });
    }
    lambdaOutbound.push({
      port: "443",
      to: "0.0.0.0/0 VPC Endpoint (Secrets Manager, DynamoDB, S3)",
    });

    groups.push({
      id: "lambda_sg",
      name: "Lambda Security Group",
      desc: "Lambda VPC 배치 시 필요. 인바운드 없음(Lambda는 외부 호출 없음)",
      color: "#f59e0b",
      inbound: [],
      outbound: lambdaOutbound,
    });
  }

  // ── DB Security Group ───────────────────────────────────────────────
  const hasRdbms = dbArr.some((d) =>
    ["aurora_mysql", "aurora_pg", "rds_mysql", "rds_pg"].includes(d)
  );
  if (hasRdbms) {
    const dbPort = dbArr.some((d) => d.includes("pg")) ? "5432" : "3306";
    const dbInbound: { port: string; from: string }[] = [
      {
        port: dbPort,
        from: isServerless
          ? "lambda_sg (앱 서버에서만 접근 허용)"
          : "app_sg (앱 서버에서만 접근 허용)",
      },
    ];
    if (hasCritCert) {
      dbInbound.push({
        port: dbPort,
        from: "bastion_sg (Bastion 관리자 접근에서만 추가 허용)",
      });
    }

    groups.push({
      id: "db_sg",
      name: "Database Security Group",
      desc: "DB는 앱/Lambda에서만 접근. 인터넷 접근 완전 차단",
      color: "#dc2626",
      inbound: dbInbound,
      outbound: [],
    });
  }

  // ── Cache Security Group ────────────────────────────────────────────
  if (cache === "redis" || cache === "both") {
    groups.push({
      id: "cache_sg",
      name: "ElastiCache Security Group",
      desc: "Redis는 앱에서만 접근. 직접 노출 금지",
      color: "#7c3aed",
      inbound: [
        {
          port: "6379",
          from: isServerless
            ? "lambda_sg (앱 서버에서만 허용)"
            : "app_sg (앱 서버에서만 허용)",
        },
      ],
      outbound: [],
    });
  }

  // ── OpenSearch Security Group ───────────────────────────────────────
  if (search === "opensearch") {
    groups.push({
      id: "search_sg",
      name: "OpenSearch Security Group",
      desc: "검색 엔진. 앱에서만 HTTPS로 접근",
      color: "#0891b2",
      inbound: [
        {
          port: "443",
          from: isServerless
            ? "lambda_sg (HTTPS 앱에서만)"
            : "app_sg (HTTPS 앱에서만)",
        },
        {
          port: "443",
          from: hasCritCert
            ? "bastion_sg (OpenSearch Dashboard 관리)"
            : "app_sg (OpenSearch Dashboard 관리)",
        },
      ],
      outbound: [],
    });
  }

  // ── Bastion / VPN Endpoint SG (compliance / 3-tier) ─────────────────
  if (hasCritCert || subnet === "3tier") {
    const bastionOutbound: { port: string; to: string }[] = [
      { port: "22", to: "app_sg (앱 서버 SSH 필요시)" },
    ];
    if (hasRdbms) {
      bastionOutbound.push({
        port: dbArr.some((d) => d.includes("pg")) ? "5432" : "3306",
        to: "db_sg (DB 직접 쿼리 비상시)",
      });
    } else {
      bastionOutbound.push({
        port: "443",
        to: "db_sg (DB 직접 쿼리 비상시)",
      });
    }

    groups.push({
      id: "bastion_sg",
      name: "Bastion / VPN Endpoint Security Group",
      desc: "관리자 접근 전용. 사무실 IP만 허용",
      color: "#374151",
      inbound: [
        {
          port: "22",
          from: "사무실 고정 IP/32 (반드시 특정 IP로 제한) - SSH/SSM 관리자 접근",
        },
      ],
      outbound: bastionOutbound,
    });
  }

  // ── EKS Control Plane SG ────────────────────────────────────────────
  if (isEks) {
    groups.push({
      id: "eks_control_plane_sg",
      name: "EKS Control Plane Security Group",
      desc: "EKS 관리형 SG. 직접 수정 금지",
      color: "#1d4ed8",
      inbound: [
        {
          port: "443",
          from: "app_sg (노드 그룹) - kubectl API 접근",
        },
      ],
      outbound: [
        {
          port: "1025-65535",
          to: "app_sg (노드 그룹) - 워커 노드 통신",
        },
        {
          port: "443",
          to: "app_sg (노드 그룹) - kubelet HTTPS",
        },
      ],
    });
  }

  // ── IaC Code Generation ─────────────────────────────────────────────
  const generateSgCode = (): string => {
    if (iac === "cdk") {
      return generateCdkCode({
        cdn,
        isServerless,
        isEks,
        isNlb,
        hasRdbms,
        dbArr,
        cache,
        appPortNum,
      });
    }
    return generateTerraformCode({
      cdn,
      isServerless,
      isEks,
      isNlb,
      hasRdbms,
      dbArr,
      cache,
      appPortNum,
    });
  };

  return { groups, code: generateSgCode(), iac: iac === "cdk" ? "cdk" : "terraform" };
}

// ── CDK code generation ─────────────────────────────────────────────────
interface CodeGenParams {
  cdn: any;
  isServerless: boolean;
  isEks: boolean;
  isNlb: boolean;
  hasRdbms: boolean;
  dbArr: string[];
  cache: any;
  appPortNum: string;
}

function generateCdkCode(p: CodeGenParams): string {
  const { cdn, isServerless, isEks, isNlb, hasRdbms, dbArr, cache, appPortNum } = p;
  // AWS Managed Prefix List: CloudFront Origin-Facing
  // 실제 prefix list ID는 리전에 따라 다를 수 있으므로 Fn.importValue 또는 lookup 사용 권장
  const prefixListOrAny =
    cdn !== "no"
      ? "ec2.Peer.prefixList(cloudFrontPrefixListId)  // aws ec2 describe-managed-prefix-lists로 확인"
      : "ec2.Peer.anyIpv4()";
  const appPort = parseInt(appPortNum) || (isEks ? 8080 : 3000);
  const appSgRef = isServerless ? "lambdaSg" : "appSg";
  const dbPort = dbArr.some((d) => d.includes("pg")) ? 5432 : 3306;

  let code = `// AWS CDK -- Security Group 전체 체인
import * as ec2 from 'aws-cdk-lib/aws-ec2';
${cdn !== "no" ? `
// CloudFront Managed Prefix List ID 조회
// ap-northeast-2: pl-22a6434b (리전별 상이, aws ec2 describe-managed-prefix-lists 명령으로 확인)
const cloudFrontPrefixListId = 'pl-22a6434b';
` : ""}
`;

  if (isNlb) {
    code += `// NLB는 Security Group 미사용 (L4 로드밸런서)
// NLB는 클라이언트 IP를 보존하여 타겟에 전달하므로, 타겟 SG에서 0.0.0.0/0 허용 필요
`;
  } else {
    code += `// ALB Security Group
const albSg = new ec2.SecurityGroup(this, 'AlbSg', {
  vpc, description: 'ALB Security Group', allowAllOutbound: false,
});
albSg.addIngressRule(${prefixListOrAny}, ec2.Port.tcp(443), 'HTTPS');
albSg.addIngressRule(${prefixListOrAny}, ec2.Port.tcp(80), 'HTTP redirect');

`;
  }

  if (!isServerless) {
    code += `// App Security Group
const appSg = new ec2.SecurityGroup(this, 'AppSg', {
  vpc, description: 'Application Security Group', allowAllOutbound: false,
});
appSg.addIngressRule(ec2.Peer.securityGroupId(albSg.securityGroupId), ec2.Port.tcp(${appPort}), 'ALB to App');
// AWS 서비스 아웃바운드 (VPC Endpoint 경유)
appSg.addEgressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'AWS services via VPC Endpoint');
`;
  } else {
    code += `// Lambda Security Group
const lambdaSg = new ec2.SecurityGroup(this, 'LambdaSg', {
  vpc, description: 'Lambda Security Group', allowAllOutbound: false,
});
`;
  }

  if (hasRdbms) {
    code += `
// DB Security Group
const dbSg = new ec2.SecurityGroup(this, 'DbSg', {
  vpc, description: 'Database Security Group - No internet access', allowAllOutbound: false,
});
dbSg.addIngressRule(
  ec2.Peer.securityGroupId(${appSgRef}.securityGroupId),
  ec2.Port.tcp(${dbPort}),
  'App to DB only'
);
`;
  }

  if (cache === "redis" || cache === "both") {
    code += `
// Cache Security Group
const cacheSg = new ec2.SecurityGroup(this, 'CacheSg', {
  vpc, description: 'ElastiCache Security Group', allowAllOutbound: false,
});
cacheSg.addIngressRule(
  ec2.Peer.securityGroupId(${appSgRef}.securityGroupId),
  ec2.Port.tcp(6379), 'App to Redis only'
);

// App → Cache 아웃바운드 추가
${appSgRef}.addEgressRule(ec2.Peer.securityGroupId(cacheSg.securityGroupId), ec2.Port.tcp(6379), 'App to Redis');
`;
  }

  if (hasRdbms) {
    code += `
// App → DB 아웃바운드 추가
${appSgRef}.addEgressRule(ec2.Peer.securityGroupId(dbSg.securityGroupId), ec2.Port.tcp(${dbPort}), 'App to DB');
`;
  }

  return code;
}

// ── Terraform code generation ───────────────────────────────────────────
function generateTerraformCode(p: CodeGenParams): string {
  const { cdn, isServerless, isEks, isNlb, hasRdbms, dbArr, cache, appPortNum } = p;
  const appOrLambda = isServerless ? "lambda" : "app";
  const appOrLambdaLabel = isServerless ? "Lambda" : "Application";
  const dbPort = dbArr.some((d) => d.includes("pg")) ? 5432 : 3306;
  const port = parseInt(appPortNum) || (isEks ? 8080 : 3000);
  // CloudFront Managed Prefix List: 리전별 ID가 다름
  // ap-northeast-2: pl-22a6434b (aws ec2 describe-managed-prefix-lists 명령으로 확인)
  const albIngressSource =
    cdn !== "no"
      ? '# CloudFront Managed Prefix List (리전별 ID 상이, describe-managed-prefix-lists로 확인)\n    prefix_list_ids = [data.aws_ec2_managed_prefix_list.cloudfront.id]'
      : 'cidr_blocks = ["0.0.0.0/0"]';
  const albIngressDesc = cdn !== "no" ? "CloudFront" : "internet";

  let code = `# Terraform -- Security Group 전체 체인
${cdn !== "no" ? `
# CloudFront Managed Prefix List 조회
data "aws_ec2_managed_prefix_list" "cloudfront" {
  name = "com.amazonaws.global.cloudfront.origin-facing"
}
` : ""}`;

  if (isNlb) {
    code += `# NLB는 Security Group 미사용 (L4 로드밸런서, 2023.08부터 SG 지원 시작)
# NLB는 클라이언트 IP를 보존하여 타겟에 전달
# → 타겟 SG에서 클라이언트 IP 범위를 직접 허용해야 함

`;
  } else {
    code += `
# ── ALB Security Group
resource "aws_security_group" "alb" {
  name_prefix = "alb-"
  vpc_id      = module.vpc.vpc_id
  description = "ALB Security Group"

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    ${albIngressSource}
    description = "HTTPS from ${albIngressDesc}"
  }
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    ${albIngressSource}
    description = "HTTP (redirect to HTTPS)"
  }
  egress {
    from_port       = ${isEks ? 8080 : port}
    to_port         = ${isEks ? 9090 : port}
    protocol        = "tcp"
    security_groups = [aws_security_group.${appOrLambda}.id]
    description     = "ALB to App"
  }
}
`;
  }

  code += `
# ── ${appOrLambdaLabel} Security Group
resource "aws_security_group" "${appOrLambda}" {
  name_prefix = "${appOrLambda}-"
  vpc_id      = module.vpc.vpc_id
  description = "${appOrLambdaLabel} Security Group"

`;

  if (!isServerless) {
    if (isNlb) {
      code += `  ingress {
    from_port   = ${port}
    to_port     = ${port}
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # NLB는 클라이언트 IP 보존. 필요 시 CIDR 제한
    description = "NLB to App (client IP preserved)"
  }
`;
    } else {
      code += `  ingress {
    from_port       = ${port}
    to_port         = ${port}
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "ALB to App"
  }
`;
    }
  } else {
    code += `  # Lambda: 인바운드 없음 (Lambda는 항상 아웃바운드로만 통신)
`;
  }

  code += `
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # VPC Endpoint 경유 (Secrets Manager, ECR, CloudWatch)
    description = "AWS services via VPC Endpoint"
  }
`;

  if (hasRdbms) {
    code += `  egress {
    from_port       = ${dbPort}
    to_port         = ${dbPort}
    protocol        = "tcp"
    security_groups = [aws_security_group.db.id]
    description     = "${appOrLambdaLabel} to DB"
  }
`;
  }

  if (cache === "redis" || cache === "both") {
    code += `  egress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.cache.id]
    description     = "${appOrLambdaLabel} to Redis"
  }
`;
  }

  code += `}
`;

  if (hasRdbms) {
    code += `
# ── DB Security Group
resource "aws_security_group" "db" {
  name_prefix = "db-"
  vpc_id      = module.vpc.vpc_id
  description = "Database SG -- no internet, app/lambda only"

  ingress {
    from_port       = ${dbPort}
    to_port         = ${dbPort}
    protocol        = "tcp"
    security_groups = [aws_security_group.${appOrLambda}.id]
    description     = "From app only"
  }
  # 아웃바운드 없음 -- DB는 응답만 (stateful이므로 별도 허용 불필요)
}
`;
  }

  if (cache === "redis" || cache === "both") {
    code += `
# ── Cache Security Group
resource "aws_security_group" "cache" {
  name_prefix = "cache-"
  vpc_id      = module.vpc.vpc_id
  description = "ElastiCache SG -- app only"

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.${appOrLambda}.id]
    description     = "Redis from app only"
  }
}
`;
  }

  return code;
}
