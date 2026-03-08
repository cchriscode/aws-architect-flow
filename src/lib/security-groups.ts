/* eslint-disable @typescript-eslint/no-explicit-any */
import type { WizardState, SecurityGroup, SecurityGroupResult } from "@/lib/types";
import { toArrayFiltered } from "@/lib/shared";

/**
 * generateSecurityGroups -- generates SG rules and IaC code from wizard state.
 * Ported from the original monolithic JSX generateSecurityGroups().
 */
export function generateSecurityGroups(
  state: WizardState,
  lang: "ko" | "en" = "ko"
): SecurityGroupResult {
  const orchest = state.compute?.orchestration;
  const archP = state.compute?.arch_pattern;
  const dbArr = toArrayFiltered(state.data?.primary_db);
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
  const teamLang = state.team?.language;

  const _ = lang === "ko" ? {
    // NLB SG
    nlb_desc: "NLB는 L4 로드밸런서. TCP/UDP 전달. 클라이언트 IP가 타겟에 그대로 전달됨",
    nlb_in_443: "0.0.0.0/0 (TLS 종료 또는 TLS Passthrough)",
    nlb_in_80: "0.0.0.0/0 (TCP 트래픽)",
    nlb_out_eks: "eks_node_sg (앱 서버로 전달)",
    nlb_out_app: "app_sg (앱 서버로 전달)",
    // ALB SG
    alb_desc: "인터넷 → ALB 인바운드. CloudFront IP 또는 0.0.0.0/0",
    alb_in_443_cdn: "CloudFront Managed Prefix List (com.amazonaws.global.cloudfront.origin-facing) - HTTPS 트래픽",
    alb_in_443_nocdn: "0.0.0.0/0 (HTTPS 트래픽)",
    alb_in_80_cdn: "CloudFront Managed Prefix List - HTTP (→443 리다이렉트)",
    alb_in_80_nocdn: "0.0.0.0/0 (HTTP → 443 리다이렉트)",
    alb_out_eks: "eks_node_sg (앱 서버로 전달)",
    alb_out_app: "app_sg (앱 서버로 전달)",
    // App SG
    app_lb_nlb: "nlb_sg (NLB에서 앱으로)",
    app_lb_alb: "alb_sg (ALB에서 앱으로)",
    app_nlb_client_ip: "0.0.0.0/0 (NLB는 클라이언트 IP를 보존하여 전달. Target SG에서 허용 필요)",
    app_out_aws: "443 (VPC Endpoint - Secrets Manager, ECR, CloudWatch)",
    app_eks_cp_kubelet: "eks_control_plane_sg (EKS Control Plane → API webhook/admission (443))",
    app_eks_cp_metrics: "eks_control_plane_sg (EKS Control Plane → 노드 메트릭)",
    app_desc: "ALB → 앱 서버. 앱 → DB/캐시 아웃바운드",
    // Lambda SG
    lambda_desc: "Lambda VPC 배치 시 필요. 인바운드 없음(Lambda는 외부 호출 없음)",
    // DB SG
    db_in_app: "앱 서버에서만 접근 허용",
    db_in_bastion: "bastion_sg (Bastion 관리자 접근에서만 추가 허용)",
    db_desc: "DB는 앱/Lambda에서만 접근. 인터넷 접근 완전 차단",
    // Cache SG
    cache_desc: "Redis는 앱에서만 접근. 직접 노출 금지",
    cache_in_app: "앱 서버에서만 허용",
    // OpenSearch SG
    search_desc: "검색 엔진. 앱에서만 HTTPS로 접근",
    search_in_app: "HTTPS 앱에서만",
    search_in_dashboard: "OpenSearch Dashboard 관리",
    // Bastion SG
    bastion_out_ssh: "app_sg (앱 서버 SSH 필요시)",
    bastion_out_db: "db_sg (DB 직접 쿼리 비상시)",
    bastion_desc: "관리자 접근 전용. 사무실 IP만 허용",
    bastion_in_ssh: "사무실 고정 IP/32 (반드시 특정 IP로 제한) - SSH/SSM 관리자 접근",
    // EKS CP SG
    eks_cp_desc: "EKS 관리형 SG. 직접 수정 금지",
    eks_cp_in_api: "app_sg (노드 그룹) - kubectl API 접근",
    eks_cp_out_worker: "app_sg (노드 그룹) - kubelet + pods (10250+)",
    eks_cp_out_kubelet: "app_sg (노드 그룹) - API server HTTPS",
    // Comment
    comment_dynamic_port: "앱 스택에 따른 동적 포트 결정",
  } : {
    // NLB SG
    nlb_desc: "NLB is an L4 load balancer. Forwards TCP/UDP. Client IP is passed through to targets as-is",
    nlb_in_443: "0.0.0.0/0 (TLS termination or TLS Passthrough)",
    nlb_in_80: "0.0.0.0/0 (TCP traffic)",
    nlb_out_eks: "eks_node_sg (forward to app servers)",
    nlb_out_app: "app_sg (forward to app servers)",
    // ALB SG
    alb_desc: "Internet -> ALB inbound. CloudFront IP or 0.0.0.0/0",
    alb_in_443_cdn: "CloudFront Managed Prefix List (com.amazonaws.global.cloudfront.origin-facing) - HTTPS traffic",
    alb_in_443_nocdn: "0.0.0.0/0 (HTTPS traffic)",
    alb_in_80_cdn: "CloudFront Managed Prefix List - HTTP (redirect to 443)",
    alb_in_80_nocdn: "0.0.0.0/0 (HTTP -> 443 redirect)",
    alb_out_eks: "eks_node_sg (forward to app servers)",
    alb_out_app: "app_sg (forward to app servers)",
    // App SG
    app_lb_nlb: "nlb_sg (NLB to app)",
    app_lb_alb: "alb_sg (ALB to app)",
    app_nlb_client_ip: "0.0.0.0/0 (NLB preserves client IP. Must allow in target SG)",
    app_out_aws: "443 (VPC Endpoints - Secrets Manager, ECR, CloudWatch)",
    app_eks_cp_kubelet: "eks_control_plane_sg (EKS Control Plane -> API webhook/admission (443))",
    app_eks_cp_metrics: "eks_control_plane_sg (EKS Control Plane -> node metrics)",
    app_desc: "ALB -> app server. App -> DB/cache outbound",
    // Lambda SG
    lambda_desc: "Required when Lambda is placed in VPC. No inbound (Lambda has no external listener)",
    // DB SG
    db_in_app: "allow access from app servers only",
    db_in_bastion: "bastion_sg (additional access from bastion admin only)",
    db_desc: "DB accessible from app/Lambda only. Internet access fully blocked",
    // Cache SG
    cache_desc: "Redis accessible from app only. Never expose directly",
    cache_in_app: "allow from app servers only",
    // OpenSearch SG
    search_desc: "Search engine. HTTPS access from app only",
    search_in_app: "HTTPS from app only",
    search_in_dashboard: "OpenSearch Dashboard management",
    // Bastion SG
    bastion_out_ssh: "app_sg (app server SSH when needed)",
    bastion_out_db: "db_sg (DB direct query for emergencies)",
    bastion_desc: "Admin access only. Allow office IP only",
    bastion_in_ssh: "Office static IP/32 (must restrict to specific IP) - SSH/SSM admin access",
    // EKS CP SG
    eks_cp_desc: "EKS managed SG. Do not modify directly",
    eks_cp_in_api: "app_sg (node group) - kubectl API access",
    eks_cp_out_worker: "app_sg (node group) - kubelet + pods (10250+)",
    eks_cp_out_kubelet: "app_sg (node group) - API server HTTPS",
    // Comment
    comment_dynamic_port: "Dynamic port determination based on app stack",
  };

  // _.comment_dynamic_port
  const appPort = isEks ? "8080-9090" :
    teamLang === "spring_boot" ? "8080" :
    teamLang === "go" ? "8080" :
    teamLang === "python_fastapi" ? "8000" :
    "3000";
  const appPortNum = isEks ? "8080" : appPort;

  const groups: SecurityGroup[] = [];

  // ── NLB Security Group ──────────────────────────────────────────────
  if (isNlb) {
    groups.push({
      id: "nlb_sg",
      name: "NLB Security Group",
      desc: _.nlb_desc,
      color: "#2563eb",
      inbound: [
        {
          port: "443",
          from: _.nlb_in_443,
        },
        {
          port: "80",
          from: _.nlb_in_80,
        },
      ],
      outbound: [
        {
          port: appPort,
          to: isEks
            ? _.nlb_out_eks
            : _.nlb_out_app,
        },
      ],
    });
  }

  // ── ALB Security Group ──────────────────────────────────────────────
  if (!isNlb) {
    groups.push({
      id: "alb_sg",
      name: "ALB Security Group",
      desc: _.alb_desc,
      color: "#2563eb",
      inbound: [
        {
          port: "443",
          from:
            cdn !== "no"
              ? _.alb_in_443_cdn
              : _.alb_in_443_nocdn,
        },
        {
          port: "80",
          from:
            cdn !== "no"
              ? _.alb_in_80_cdn
              : _.alb_in_80_nocdn,
        },
      ],
      outbound: [
        {
          port: appPort,
          to: isEks
            ? _.alb_out_eks
            : _.alb_out_app,
        },
      ],
    });
  }

  // ── App Security Group ──────────────────────────────────────────────
  if (!isServerless) {
    const lbRef = isNlb ? _.app_lb_nlb : _.app_lb_alb;
    const appInbound: { port: string; from: string }[] = [
      {
        port: isEks ? "1025-65535" : appPort,
        from: lbRef,
      },
    ];
    if (isNlb && !isEks) {
      appInbound.push({
        port: appPort,
        from: _.app_nlb_client_ip,
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
      to: _.app_out_aws,
    });

    if (isEks) {
      appInbound.push({
        port: "443",
        from: _.app_eks_cp_kubelet,
      });
      appInbound.push({
        port: "10250",
        from: _.app_eks_cp_metrics,
      });
    }

    groups.push({
      id: "app_sg",
      name: isEks ? "EKS Node Security Group" : "App Security Group",
      desc: _.app_desc,
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
      desc: _.lambda_desc,
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
          ? `lambda_sg (${_.db_in_app})`
          : `app_sg (${_.db_in_app})`,
      },
    ];
    if (hasCritCert) {
      dbInbound.push({
        port: dbPort,
        from: _.db_in_bastion,
      });
    }

    groups.push({
      id: "db_sg",
      name: "Database Security Group",
      desc: _.db_desc,
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
      desc: _.cache_desc,
      color: "#7c3aed",
      inbound: [
        {
          port: "6379",
          from: isServerless
            ? `lambda_sg (${_.cache_in_app})`
            : `app_sg (${_.cache_in_app})`,
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
      desc: _.search_desc,
      color: "#0891b2",
      inbound: [
        {
          port: "443",
          from: isServerless
            ? `lambda_sg (${_.search_in_app})`
            : `app_sg (${_.search_in_app})`,
        },
        {
          port: "443",
          from: hasCritCert
            ? `bastion_sg (${_.search_in_dashboard})`
            : `app_sg (${_.search_in_dashboard})`,
        },
      ],
      outbound: [],
    });
  }

  // ── Bastion / VPN Endpoint SG (compliance / 3-tier) ─────────────────
  if (hasCritCert || subnet === "3tier") {
    const bastionOutbound: { port: string; to: string }[] = [
      { port: "22", to: _.bastion_out_ssh },
    ];
    if (hasRdbms) {
      bastionOutbound.push({
        port: dbArr.some((d) => d.includes("pg")) ? "5432" : "3306",
        to: _.bastion_out_db,
      });
    }

    groups.push({
      id: "bastion_sg",
      name: "Bastion / VPN Endpoint Security Group",
      desc: _.bastion_desc,
      color: "#374151",
      inbound: [
        {
          port: "22",
          from: _.bastion_in_ssh,
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
      desc: _.eks_cp_desc,
      color: "#1d4ed8",
      inbound: [
        {
          port: "443",
          from: _.eks_cp_in_api,
        },
      ],
      outbound: [
        {
          port: "1025-65535",
          to: _.eks_cp_out_worker,
        },
        {
          port: "443",
          to: _.eks_cp_out_kubelet,
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
        lang,
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
      lang,
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
  lang: "ko" | "en";
}

function generateCdkCode(p: CodeGenParams): string {
  const { cdn, isServerless, isEks, isNlb, hasRdbms, dbArr, cache, appPortNum, lang } = p;

  const _ = lang === "ko" ? {
    prefix_list_comment: "실제 prefix list ID는 리전에 따라 다를 수 있으므로 Fn.importValue 또는 lookup 사용 권장",
    prefix_list_verify: "aws ec2 describe-managed-prefix-lists로 확인",
    code_title: "AWS CDK -- Security Group 전체 체인",
    cf_prefix_lookup: "CloudFront Managed Prefix List ID 조회",
    cf_prefix_region: "ap-northeast-2: pl-22a6434b (리전별 상이, aws ec2 describe-managed-prefix-lists 명령으로 확인)",
    nlb_no_sg: "NLB는 Security Group 미사용 (L4 로드밸런서)",
    nlb_preserve_ip: "NLB는 클라이언트 IP를 보존하여 타겟에 전달하므로, 타겟 SG에서 0.0.0.0/0 허용 필요",
    aws_svc_outbound: "AWS 서비스 아웃바운드 (VPC Endpoint 경유)",
    cache_outbound: "App → Cache 아웃바운드 추가",
    db_outbound: "App → DB 아웃바운드 추가",
  } : {
    prefix_list_comment: "Actual prefix list ID may vary by region; use Fn.importValue or lookup",
    prefix_list_verify: "Verify with: aws ec2 describe-managed-prefix-lists",
    code_title: "AWS CDK -- Full Security Group chain",
    cf_prefix_lookup: "CloudFront Managed Prefix List ID lookup",
    cf_prefix_region: "ap-northeast-2: pl-22a6434b (varies by region, verify with aws ec2 describe-managed-prefix-lists)",
    nlb_no_sg: "NLB does not use Security Groups (L4 load balancer)",
    nlb_preserve_ip: "NLB preserves client IP to targets, so target SG must allow 0.0.0.0/0",
    aws_svc_outbound: "AWS services outbound (via VPC Endpoint)",
    cache_outbound: "Add App -> Cache outbound",
    db_outbound: "Add App -> DB outbound",
  };

  // _.prefix_list_comment
  const prefixListOrAny =
    cdn !== "no"
      ? `ec2.Peer.prefixList(cloudFrontPrefixListId)  // ${_.prefix_list_verify}`
      : "ec2.Peer.anyIpv4()";
  const appPort = parseInt(appPortNum) || (isEks ? 8080 : 3000);
  const appSgRef = isServerless ? "lambdaSg" : "appSg";
  const dbPort = dbArr.some((d) => d.includes("pg")) ? 5432 : 3306;

  let code = `// ${_.code_title}
import * as ec2 from 'aws-cdk-lib/aws-ec2';
${cdn !== "no" ? `
// ${_.cf_prefix_lookup}
// ${_.cf_prefix_region}
const cloudFrontPrefixListId = 'pl-22a6434b';
` : ""}
`;

  if (isNlb) {
    code += `// ${_.nlb_no_sg}
// ${_.nlb_preserve_ip}
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
// ${_.aws_svc_outbound}
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

// ${_.cache_outbound}
${appSgRef}.addEgressRule(ec2.Peer.securityGroupId(cacheSg.securityGroupId), ec2.Port.tcp(6379), 'App to Redis');
`;
  }

  if (hasRdbms) {
    code += `
// ${_.db_outbound}
${appSgRef}.addEgressRule(ec2.Peer.securityGroupId(dbSg.securityGroupId), ec2.Port.tcp(${dbPort}), 'App to DB');
`;
  }

  return code;
}

// ── Terraform code generation ───────────────────────────────────────────
function generateTerraformCode(p: CodeGenParams): string {
  const { cdn, isServerless, isEks, isNlb, hasRdbms, dbArr, cache, appPortNum, lang } = p;

  const _ = lang === "ko" ? {
    cf_prefix_comment: "CloudFront Managed Prefix List: 리전별 ID가 다름",
    cf_prefix_region: "ap-northeast-2: pl-22a6434b (aws ec2 describe-managed-prefix-lists 명령으로 확인)",
    cf_prefix_inline: "CloudFront Managed Prefix List (리전별 ID 상이, describe-managed-prefix-lists로 확인)",
    code_title: "Terraform -- Security Group 전체 체인",
    cf_prefix_lookup: "CloudFront Managed Prefix List 조회",
    nlb_no_sg: "NLB는 Security Group 미사용 (L4 로드밸런서, 2023.08부터 SG 지원 시작)",
    nlb_preserve_ip: "NLB는 클라이언트 IP를 보존하여 타겟에 전달",
    nlb_target_allow: "타겟 SG에서 클라이언트 IP 범위를 직접 허용해야 함",
    nlb_cidr_comment: "NLB는 클라이언트 IP 보존. 필요 시 CIDR 제한",
    lambda_no_inbound: "Lambda: 인바운드 없음 (Lambda는 항상 아웃바운드로만 통신)",
    vpc_endpoint_comment: "VPC Endpoint 경유 (Secrets Manager, ECR, CloudWatch)",
    db_no_outbound: "아웃바운드 없음 -- DB는 응답만 (stateful이므로 별도 허용 불필요)",
  } : {
    cf_prefix_comment: "CloudFront Managed Prefix List: ID varies by region",
    cf_prefix_region: "ap-northeast-2: pl-22a6434b (verify with aws ec2 describe-managed-prefix-lists)",
    cf_prefix_inline: "CloudFront Managed Prefix List (ID varies by region, verify with describe-managed-prefix-lists)",
    code_title: "Terraform -- Full Security Group chain",
    cf_prefix_lookup: "CloudFront Managed Prefix List lookup",
    nlb_no_sg: "NLB does not use Security Groups (L4 load balancer, SG support added Aug 2023)",
    nlb_preserve_ip: "NLB preserves client IP to targets",
    nlb_target_allow: "Target SG must directly allow client IP ranges",
    nlb_cidr_comment: "NLB preserves client IP. Restrict CIDR as needed",
    lambda_no_inbound: "Lambda: no inbound rules (Lambda only communicates outbound)",
    vpc_endpoint_comment: "Via VPC Endpoint (Secrets Manager, ECR, CloudWatch)",
    db_no_outbound: "No outbound -- DB only responds (stateful, no explicit allow needed)",
  };

  const appOrLambda = isServerless ? "lambda" : "app";
  const appOrLambdaLabel = isServerless ? "Lambda" : "Application";
  const dbPort = dbArr.some((d) => d.includes("pg")) ? 5432 : 3306;
  const port = parseInt(appPortNum) || (isEks ? 8080 : 3000);
  // _.cf_prefix_comment
  // _.cf_prefix_region
  const albIngressSource =
    cdn !== "no"
      ? `# ${_.cf_prefix_inline}\n    prefix_list_ids = [data.aws_ec2_managed_prefix_list.cloudfront.id]`
      : 'cidr_blocks = ["0.0.0.0/0"]';
  const albIngressDesc = cdn !== "no" ? "CloudFront" : "internet";

  let code = `# ${_.code_title}
${cdn !== "no" ? `
# ${_.cf_prefix_lookup}
data "aws_ec2_managed_prefix_list" "cloudfront" {
  name = "com.amazonaws.global.cloudfront.origin-facing"
}
` : ""}`;

  if (isNlb) {
    code += `# ${_.nlb_no_sg}
# ${_.nlb_preserve_ip}
# -> ${_.nlb_target_allow}

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
    cidr_blocks = ["0.0.0.0/0"]  # ${_.nlb_cidr_comment}
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
    code += `  # ${_.lambda_no_inbound}
`;
  }

  code += `
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # ${_.vpc_endpoint_comment}
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
  # ${_.db_no_outbound}
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
