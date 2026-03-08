/* eslint-disable @typescript-eslint/no-explicit-any */
import type { WizardState } from "@/lib/types";
import { toArray, toArrayFiltered, azToNum } from "@/lib/shared";
import { T } from "./architecture-dict";

export function generateArchitecture(state: WizardState, lang: "ko" | "en" = "ko") {
  const s = state;
  const t = (k: string) => T[k] ? T[k][lang==="ko"?0:1] : k;

  // ── 배열 필드 헬퍼 (multi:true 전환된 필드들)
  const types        = toArray(s.workload?.type);
  const userTypes    = toArray(s.workload?.user_type);
  const trafficPats  = toArray(s.scale?.traffic_pattern);
  const primaryDbs   = toArrayFiltered(s.data?.primary_db);
  const authMethods  = toArrayFiltered(s.integration?.auth);
  const hybridConns  = toArray(s.network?.hybrid).filter((v) => v !== "no");

  const isCritical = s.workload?.data_sensitivity === "critical";
  const isHighAvail = ["99.99","99.95"].includes(s.slo?.availability);
  const isLargeScale = ["large","xlarge"].includes(s.scale?.dau);
  const isServerless = s.compute?.arch_pattern === "serverless";
  const isK8s = s.compute?.orchestration === "eks";
  const isTicketing = types.includes("ticketing");
  const isRealtime  = types.includes("realtime");
  const isIoT       = types.includes("iot");
  const isData      = types.includes("data");
  const isSaaS      = types.includes("saas");
  const isGlobal    = userTypes.includes("global");
  const isBtoC      = userTypes.includes("b2c");
  const hasSpike    = trafficPats.includes("spike");
  const hasBurst    = trafficPats.includes("burst");
  const azNum = azToNum(s.network?.az_count);
  const needsAsync = s.integration?.sync_async !== "sync_only";
  const hasCDN = s.edge?.cdn !== "no";
  const hasCache = s.data?.cache !== "no" && s.data?.cache;
  const hasSearch = s.data?.search === "opensearch";

  const layers: any[] = [];

  // ── 1. 계정/조직 ──────────────────────────────────
  layers.push({
    id:"org", label:t("org.label"), icon:"🏢", color:"#374151", bg:"#f9fafb",
    services:[
      s.network?.account_structure === "org"
        ? { name:"AWS Organizations", detail:t("org.orgs.detail"), reason:t("org.orgs.reason"), cost:t("net.vpc.cost"), opt:t("org.orgs.opt") }
        : s.network?.account_structure === "envs"
        ? { name:t("org.envs.name"), detail:t("org.envs.detail"), reason:t("org.envs.reason"), cost:t("net.vpc.cost"), opt:t("org.envs.opt") }
        : { name:t("org.single.name"), detail:t("org.single.detail"), reason:t("org.single.reason"), cost:t("net.vpc.cost"), opt:t("org.single.opt") },
    ],
    insights:[
      t("org.insight.prod"),
      s.network?.account_structure !== "single" ? t("org.insight.ct") : t("org.insight.single"),
    ]
  });

  // ── 2. 네트워크 ────────────────────────────────────
  const isPrivateNet = s.network?.subnet_tier === "private";
  const subnetDesc = s.network?.subnet_tier === "3tier"
    ? (lang==="ko" ? `퍼블릭 ×${azNum} + 프라이빗 ×${azNum} + 격리 ×${azNum} (총 ${azNum*3}개)` : `Public ×${azNum} + Private ×${azNum} + Isolated ×${azNum} (${azNum*3} total)`)
    : isPrivateNet
    ? (lang==="ko" ? `프라이빗 전용 ×${azNum} (인터넷 없음, VPN/DX 전용 접근)` : `Private only ×${azNum} (no internet, VPN/DX access only)`)
    : (lang==="ko" ? `퍼블릭 ×${azNum} + 프라이빗 ×${azNum} (총 ${azNum*2}개)` : `Public ×${azNum} + Private ×${azNum} (${azNum*2} total)`);
  const hasNat = !isPrivateNet && s.network?.nat_strategy;
  const natDesc = s.network?.nat_strategy === "per_az"
    ? (lang==="ko" ? `NAT GW ${azNum}개 (AZ당 1개, HA)` : `NAT GW ×${azNum} (1 per AZ, HA)`) : s.network?.nat_strategy === "shared"
    ? (lang==="ko" ? "NAT GW 1개 (공유, 비용절감)" : "NAT GW ×1 (shared, cost saving)") : s.network?.nat_strategy === "endpoint"
    ? (lang==="ko" ? "NAT GW 최소화 + VPC Endpoint" : "Minimize NAT GW + VPC Endpoint") : null;

  layers.push({
    id:"network", label:t("net.label"), icon:"🌐", color:"#4f46e5", bg:"#eef2ff",
    services:[
      { name:"VPC", detail:`ap-northeast-2, /16 CIDR, ${azNum} AZ`, reason:t("net.vpc.reason"), cost:t("net.vpc.cost"), opt:t("net.vpc.opt") },
      { name:t("net.subnet.name"), detail:subnetDesc, reason:s.network?.subnet_tier === "3tier" ? t("net.3tier.reason") : isPrivateNet ? t("net.private.reason") : t("net.2tier.reason"), cost:t("net.vpc.cost"), opt:t("net.subnet.opt") },
      ...(natDesc ? [{ name:natDesc, detail:t("net.nat.detail"), reason:t("net.nat.reason"), cost:`~$43/${lang==="ko"?"월/개":"mo each"} + $0.045/GB`, opt:t("net.nat.opt") }] : []),
      ...(isPrivateNet ? [{ name:"Transit Gateway / VPN Endpoint", detail:t("net.tgw.detail"), reason:t("net.tgw.reason"), cost:"TGW $0.05/hr + $0.02/GB", opt:t("net.tgw.opt") }] : []),
      { name:"VPC Endpoint", detail:t("net.vpcep.detail"), reason:t("net.vpcep.reason"), cost:lang==="ko"?"Gateway EP 무료, Interface EP $7/월/개":"Gateway EP free, Interface EP $7/mo each", opt:t("net.vpcep.opt") },
      ...(hybridConns.includes("vpn") ? [{ name:"Site-to-Site VPN", detail:t("net.vpn.detail"), reason:t("net.vpn.reason"), cost:lang==="ko"?"~$36/월 + 데이터전송":"~$36/mo + data transfer", opt:t("net.vpn.opt") }] : []),
      ...(hybridConns.includes("dx")  ? [{ name:"Direct Connect", detail:t("net.dx.detail"), reason:t("net.dx.reason"), cost:lang==="ko"?"포트 시간당 과금":"Billed per port-hour", opt:t("net.dx.opt") }] : []),
      ...(hybridConns.includes("vpn") && hybridConns.includes("dx") ? [{ name:t("net.dual.name"), detail:t("net.dual.detail"), reason:t("net.dual.reason"), cost:t("net.dual.cost"), opt:t("net.dual.opt") }] : []),
      ...(s.network?.account_structure === "org" ? [{ name:"Transit Gateway", detail:t("net.tgwhub.detail"), reason:t("net.tgwhub.reason"), cost:"$0.05/hr + $0.02/GB", opt:t("net.tgwhub.opt") }] : []),
    ],
    insights:[
      s.network?.subnet_tier === "3tier" ? t("net.insight.3tier") : t("net.insight.default"),
      isPrivateNet ? t("net.insight.fullpriv") : s.network?.nat_strategy === "per_az" ? `NAT GW ${azNum}${t("net.insight.natperaz")}` : s.network?.nat_strategy === "endpoint" ? (lang==="ko"?"VPC Endpoint 중심: NAT GW 최소화로 비용 절감. 인터넷 필요 시 최소 NAT GW 1개 유지":"VPC Endpoint focused: cost savings by minimizing NAT GW. Keep at least 1 NAT GW for internet access") : t("net.insight.natshared"),
      t("net.insight.sg"),
      s.compliance?.network_iso === "private" && s.network?.subnet_tier !== "private" ? t("net.insight.mismatch") : "",
      ["strict","private"].includes(s.compliance?.network_iso) && !["3tier","private"].includes(s.network?.subnet_tier) ? t("net.insight.zone") : "",
    ].filter(Boolean)
  });

  // ── 3. 엣지/CDN (Route 53은 CDN/WAF 없어도 항상 포함) ──────
  {
    const edgeServices = [
      { name:"Route 53", detail:`${s.edge?.dns === "health" ? t("edge.r53.health") : s.edge?.dns === "latency" ? t("edge.r53.latency") : s.edge?.dns === "geoloc" ? t("edge.r53.geoloc") : t("edge.r53.basic")}`, reason:t("edge.r53.reason"), cost:lang==="ko"?"$0.50/호스팅존/월":"$0.50/hosted zone/mo", opt:t("edge.r53.opt") },
      { name:"AWS Certificate Manager (ACM)", detail:t("edge.acm.detail"), reason:t("edge.acm.reason"), cost:t("edge.acm.cost"), opt:t("edge.acm.opt") },
      ...(hasCDN ? [{ name:"CloudFront", detail:t("edge.cf.detail"), reason:t("edge.cf.reason"), cost:lang==="ko"?"$0.120/GB (한국, 첫 10TB)":"$0.120/GB (Korea, first 10TB)", opt:t("edge.cf.opt") }] : []),
      ...(s.edge?.waf !== "no" ? [{ name:`WAF${s.edge?.waf === "bot" ? " + Bot Control" : s.edge?.waf === "shield" ? " + Shield Advanced" : ""}`, detail:t("edge.waf.detail"), reason:`OWASP${s.edge?.waf === "bot" ? ", "+t("edge.waf.bot") : ""}${s.edge?.waf === "shield" ? ", "+t("edge.waf.ddos") : ""}`, cost:s.edge?.waf === "shield" ? lang==="ko"?"$3,000/월 고정":"$3,000/mo fixed" : lang==="ko"?"~$20/월+":"~$20/mo+", opt:t("edge.waf.opt") }] : []),
    ];
    // CloudFront Functions / Lambda@Edge (CDN 선택 시)
    if(hasCDN && (isGlobal || isSaaS || isTicketing || types.includes("ecommerce") || isBtoC)) {
      edgeServices.push({ name:"CloudFront Functions / Lambda@Edge", detail:t("edge.func.detail"), reason:`${isTicketing ? t("edge.func.bot") : isSaaS ? t("edge.func.tenant") : t("edge.func.geo")}`, cost:lang==="ko"?"CloudFront Functions $0.1/100만 요청, Lambda@Edge $0.6/100만":"CloudFront Functions $0.1/1M req, Lambda@Edge $0.6/1M", opt:t("edge.func.opt") });
    }
    // CloudWatch Synthetics (고가용성 시)
    if(isHighAvail) {
      edgeServices.push({ name:"CloudWatch Synthetics", detail:t("edge.synth.detail"), reason:t("edge.synth.reason"), cost:lang==="ko"?"$0.0012/실행 (5분 간격 약 $5/월)":"$0.0012/run (~$5/mo at 5min intervals)", opt:t("edge.synth.opt") });
    }

    const edgeInsights = [
      t("edge.insight.alb"),
      hasCDN ? t("edge.insight.shield") : "",
      isTicketing ? t("edge.insight.bot") : "",
      s.slo?.region === "dr" ? t("edge.insight.failover") : "",
      s.edge?.dns === "health" ? t("edge.insight.healthint") : "",
      isHighAvail ? t("edge.insight.canary") : "",
      isSaaS && isGlobal && s.edge?.cdn === "global" ? (lang==="ko"?"Global Accelerator 검토: TCP/UDP 워크로드(API 서버)에 CloudFront보다 낮은 레이턴시. Anycast IP로 고정 엔트리포인트 제공":"Consider Global Accelerator: lower latency than CloudFront for TCP/UDP workloads (API servers). Fixed entry point with Anycast IP") : "",
    ].filter(Boolean);
    layers.push({ id:"edge", label:t("edge.label"), icon:"🚀", color:"#0891b2", bg:"#ecfeff", services:edgeServices, insights:edgeInsights });
  }

  // ── 4. 컴퓨트 ──────────────────────────────────────
  const computeServices: any[] = [];
  const lbType = s.integration?.api_type;
  const isVM = s.compute?.arch_pattern === "vm";

  // 로드밸런서 / API 입구
  if(lbType === "nlb") {
    computeServices.push({ name:"NLB (Network Load Balancer)", detail:t("comp.nlb.detail"), reason:t("comp.nlb.reason"), cost:lang==="ko"?"~$16/월 + $0.006/NLCU":"~$16/mo + $0.006/NLCU", opt:t("comp.nlb.opt") });
  } else if(lbType === "api_gateway") {
    computeServices.push({ name:"API Gateway", detail:"REST/HTTP API", reason:t("comp.apigw.reason"), cost:lang==="ko"?"$3.50/100만 요청":"$3.50/1M requests", opt:t("comp.apigw.opt") });
  } else if(lbType === "both") {
    computeServices.push({ name:"ALB (Application Load Balancer)", detail:t("comp.alb.detail"), reason:t("comp.alb.reason"), cost:lang==="ko"?"~$16/월 + $0.008/LCU":"~$16/mo + $0.008/LCU", opt:t("comp.alb.opt") });
    computeServices.push({ name:"API Gateway", detail:"REST/HTTP API", reason:t("comp.apigw.reason"), cost:lang==="ko"?"$3.50/100만 요청":"$3.50/1M requests", opt:t("comp.apigw.opt") });
  } else {
    computeServices.push({ name:"ALB (Application Load Balancer)", detail:t("comp.alb.detail"), reason:t("comp.alb.reason"), cost:lang==="ko"?"~$16/월 + $0.008/LCU":"~$16/mo + $0.008/LCU", opt:t("comp.alb.opt") });
  }

  // realtime 워크로드 → WebSocket 서비스 카드 추가
  if(isRealtime) {
    if(lbType === "api_gateway") {
      computeServices.push({ name:"API Gateway WebSocket API", detail:t("comp.ws.detail"), reason:t("comp.ws.reason"), cost:lang==="ko"?"$1/100만 메시지 + $0.25/100만 연결 분":"$1/1M messages + $0.25/1M connection min", opt:t("comp.ws.opt") });
    }
    if(!hasCache) {
      computeServices.push({ name:t("comp.redis.name"), detail:t("comp.redis.detail"), reason:t("comp.redis.reason"), cost:lang==="ko"?"ElastiCache Redis ~$100/월":"ElastiCache Redis ~$100/mo", opt:t("comp.redis.opt") });
    } else {
      computeServices.push({ name:t("comp.redis2.name"), detail:t("comp.redis2.detail"), reason:t("comp.redis2.reason"), cost:t("comp.redis2.cost"), opt:t("comp.redis2.opt") });
    }
  }

  // 인증 레이어 - multi 지원
  if(authMethods.includes("cognito")) {
    computeServices.push({ name:"Amazon Cognito", detail:"User Pool + Identity Pool", reason:t("comp.cognito.reason"), cost:t("comp.cognito.cost"), opt:t("comp.cognito.opt") });
  }
  if(authMethods.includes("sso")) {
    computeServices.push({ name:"IAM Identity Center (SSO)", detail:"SAML 2.0 / OIDC", reason:t("comp.sso.reason"), cost:t("net.vpc.cost"), opt:t("comp.sso.opt") });
  }
  if(authMethods.includes("selfmgd")) {
    computeServices.push({ name:t("comp.selfauth.name"), detail:t("comp.selfauth.detail"), reason:t("comp.selfauth.reason"), cost:t("comp.selfauth.cost"), opt:t("comp.selfauth.opt") });
  }
  if(authMethods.includes("cognito") && authMethods.includes("sso")) {
    computeServices.push({ name:t("comp.dualauth.name"), detail:t("comp.dualauth.detail"), reason:t("comp.dualauth.reason"), cost:t("comp.dualauth.cost"), opt:t("comp.dualauth.opt") });
  }

  // 서버리스
  if(isServerless || s.compute?.arch_pattern === "hybrid") {
    computeServices.push({ name:"Lambda", detail:`ARM/Graviton2, 512MB~3GB`, reason:t("comp.lambda.reason"), cost:t("comp.lambda.cost"), opt:t("comp.lambda.opt") });
    const hasRdsDb = primaryDbs.some((db: string) => db !== "dynamodb" && db !== "none");
    if(hasRdsDb) {
      computeServices.push({ name:"RDS Proxy", detail:t("comp.rdsproxy.detail"), reason:t("comp.rdsproxy.reason"), cost:lang==="ko"?"db 비용의 ~3%":"~3% of DB cost", opt:t("comp.rdsproxy.opt") });
    }
  }

  // ECR: 컨테이너 패턴 시 이미지 저장소 추가
  const isContainer = !isServerless && !isVM;
  if(isContainer) {
    computeServices.push({ name:"Amazon ECR", detail:t("comp.ecr.detail"), reason:t("comp.ecr.reason"), cost:lang==="ko"?"$0.10/GB/월 (저장) + $0.09/GB (전송)":"$0.10/GB/mo (storage) + $0.09/GB (transfer)", opt:t("comp.ecr.opt") });
  }

  // vm 패턴 → EC2 Auto Scaling
  if(isVM) {
    computeServices.push({ name:"EC2 Auto Scaling Group", detail:lang==="ko"?`프라이빗 서브넷, ${azNum}AZ, AMI 기반`:`Private subnet, ${azNum}AZ, AMI-based`, reason:t("comp.ec2.reason"), cost:t("comp.ec2.cost"), opt:t("comp.ec2.opt") });
    computeServices.push({ name:"Systems Manager (SSM)", detail:"Session Manager + Patch Manager", reason:t("comp.ssm.reason"), cost:t("net.vpc.cost"), opt:t("comp.ssm.opt") });
  } else if(!isServerless) {
    if(isK8s) {
      computeServices.push(
        { name:`EKS ${s.compute?.compute_node === "fargate" ? "Fargate" : "on EC2"}`, detail:`${azNum}AZ, ${lang==="ko"?"서비스":"services"} 10+`, reason:t("comp.eks.reason"), cost:lang==="ko"?`$73/월(클러스터) + 노드비용`:`$73/mo (cluster) + node cost`, opt:s.compute?.compute_node === "ec2_node" ? (lang==="ko"?"Karpenter로 Spot+On-Demand 자동 혼합":"Auto-mix Spot+On-Demand with Karpenter") : (lang==="ko"?"KEDA로 이벤트 기반 스케일링":"Event-driven scaling with KEDA") }
      );
    } else {
      computeServices.push(
        { name:`ECS Fargate`, detail:lang==="ko"?`프라이빗 서브넷, ${azNum}AZ`:`Private subnet, ${azNum}AZ`, reason:t("comp.ecs.reason"), cost:lang==="ko"?"$0.04048/vCPU·시간":"$0.04048/vCPU-hr", opt:`${s.cost?.spot_usage !== "no" ? t("comp.ecs.spotopt") : t("comp.ecs.spopt")}` }
      );
    }
    if(s.compute?.compute_node === "ec2_node" || s.compute?.compute_node === "mixed") {
      computeServices.push({ name:"EC2 Auto Scaling", detail:t("comp.ec2as.detail"), reason:t("comp.ec2as.reason"), cost:lang==="ko"?"On-Demand 기준":"On-Demand basis", opt:t("comp.ec2as.opt") });
    }
  }

  layers.push({
    id:"compute", label:t("comp.label"), icon:"⚙️", color:"#059669", bg:"#ecfdf5",
    services: computeServices,
    insights:[
      isVM ? t("comp.i.vm") :
        isK8s ? (lang==="ko" ? `EKS 클러스터 고정 비용 $72/월. 서비스 ${isLargeScale ? "많을수록 효율↑" : "10개 미만이면 ECS가 유리"}` : `EKS cluster fixed cost $72/mo. ${isLargeScale ? "More services = better efficiency" : "Under 10 services, ECS is more suitable"}`) : t("comp.i.ecs"),
      (isK8s && s.compute?.compute_node === "ec2_node") ? t("comp.i.ssm") : "",
      !isServerless && !isVM && isLargeScale ? t("comp.i.svccon") : "",
      isServerless && primaryDbs.some((db: string) => db !== "dynamodb") ? t("comp.i.rdsproxy") : "",
      isTicketing && (!s.data?.cache || s.data.cache === "no") ? t("comp.i.ticket") : "",
      types.includes("ecommerce") && (!s.data?.cache || s.data.cache === "no") ? t("comp.i.ecom") : "",
      isRealtime && s.integration?.api_type !== "nlb" ? t("comp.i.rt") : "",
      isRealtime && lbType === "alb" ? t("comp.i.rtalb") : "",
      s.cost?.spot_usage !== "no" ? t("comp.i.spot") : "",
      (() => {
        const scalings = Array.isArray(s.compute?.scaling) ? s.compute.scaling : (s.compute?.scaling ? [s.compute.scaling] : []);
        if(isServerless) return t("comp.i.lambdascale");
        const parts: string[] = [];
        if(scalings.includes("ecs_asg"))   parts.push(lang==="ko"?"CPU 70% 기준 Target Tracking":"CPU 70% Target Tracking");
        if(scalings.includes("scheduled")) parts.push(lang==="ko"?"Scheduled Scaling (이벤트 전 사전 확장)":"Scheduled Scaling (pre-scale before events)");
        if(scalings.includes("keda"))      parts.push(lang==="ko"?"KEDA SQS 큐 깊이 기반 정밀 확장":"KEDA precision scaling based on SQS queue depth");
        if(scalings.includes("manual"))    parts.push(lang==="ko"?"수동 조절 (Auto Scaling 없음)":"Manual (no Auto Scaling)");
        return `${lang==="ko"?"스케일링":"Scaling"}: ${parts.length ? parts.join(" + ") : (lang==="ko"?"CPU 70% 기준 Target Tracking":"CPU 70% Target Tracking")}`;
      })(),
      hasSpike ? t("comp.i.spike") : "",
      isServerless && (hasSpike || isRealtime || hasBurst) ? t("comp.i.lambdacold") : "",
      hasBurst && !isServerless ? t("comp.i.burst") : "",
      trafficPats.includes("business") ? t("comp.i.biz") : "",
      s.scale?.peak_rps === "ultra" ? t("comp.i.ultra") : "",
      s.scale?.peak_rps === "high" ? t("comp.i.high") : "",
    ].filter(Boolean)
  });


  // ── 4-b. K8s 생태계 플랫폼 레이어 (EKS 선택 시) ──────────────────────
  if(isK8s) {
    const np = s.platform?.node_provisioner;
    const ingress = s.platform?.ingress;
    const mesh = s.platform?.service_mesh;
    const gitops = s.platform?.gitops;
    const k8sMon = s.platform?.k8s_monitoring;

    const platformSvcs: any[] = [];

    // 노드 프로비저닝
    if(np === "karpenter") {
      platformSvcs.push({ name:"Karpenter", detail:lang==="ko"?"노드 자동 프로비저닝 (EC2 직접 관리)":"Automatic node provisioning (direct EC2 management)", reason:lang==="ko"?"Cluster Autoscaler 대비 5배 빠른 스케일아웃, Spot 자동 다양화":"5x faster scale-out than Cluster Autoscaler, auto Spot diversification", cost:lang==="ko"?"무료 (EC2 비용만)":"Free (EC2 costs only)", opt:lang==="ko"?"NodePool + EC2NodeClass로 비용 최적화. Consolidation 정책으로 낭비 노드 자동 제거":"Optimize costs with NodePool + EC2NodeClass. Auto-remove wasteful nodes with Consolidation policy" });
    } else if(np === "cluster_autoscaler") {
      platformSvcs.push({ name:"Cluster Autoscaler", detail:lang==="ko"?"Auto Scaling Group 기반 노드 확장":"Node scaling based on Auto Scaling Groups", reason:lang==="ko"?"검증된 방법, 레퍼런스 풍부":"Proven method, abundant references", cost:t("net.vpc.cost"), opt:lang==="ko"?"Node Group 최소/최대 설정 필수. 스케일다운 지연 10분 기본":"Node Group min/max settings required. Default 10min scale-down delay" });
    }

    // Ingress Controller
    if(ingress === "alb_controller") {
      platformSvcs.push({ name:"AWS ALB Ingress Controller", detail:lang==="ko"?"ALB를 K8s Ingress 리소스로 관리":"Manage ALB as K8s Ingress resource", reason:lang==="ko"?"ALB·WAF·ACM·Target Group 자동 통합":"Auto-integration with ALB, WAF, ACM, Target Group", cost:"ALB ($0.008/LCU-hr)", opt:lang==="ko"?"IngressClass 분리로 내부/외부 트래픽 구분 관리":"Separate internal/external traffic with IngressClass" });
    } else if(ingress === "nginx") {
      platformSvcs.push({ name:"NGINX Ingress Controller", detail:lang==="ko"?"K8s 표준 Ingress, NLB 뒷단 배치":"K8s standard Ingress, placed behind NLB", reason:lang==="ko"?"멀티클라우드 이식성, 풍부한 레퍼런스":"Multi-cloud portability, abundant references", cost:lang==="ko"?"무료 (NLB 비용 별도)":"Free (NLB cost separate)", opt:lang==="ko"?"ConfigMap으로 업스트림 타임아웃·버퍼 크기 조정 필수":"Must adjust upstream timeout and buffer size via ConfigMap" });
    } else if(ingress === "kong") {
      platformSvcs.push({ name:"Kong Gateway (K8s)", detail:lang==="ko"?"API Gateway + Ingress 통합, KongIngress CRD":"API Gateway + Ingress integration, KongIngress CRD", reason:lang==="ko"?"100+ 플러그인: 인증·속도제한·변환 중앙 관리":"100+ plugins: centralized auth, rate limiting, transformation", cost:lang==="ko"?"Kong OSS 무료, PostgreSQL 필요":"Kong OSS free, PostgreSQL required", opt:lang==="ko"?"DB-less 모드로 단순화 가능. Rate Limiting 플러그인 필수 적용":"Simplify with DB-less mode. Rate Limiting plugin required" });
    } else if(ingress === "traefik") {
      platformSvcs.push({ name:"Traefik Ingress", detail:lang==="ko"?"자동 TLS, IngressRoute CRD":"Auto TLS, IngressRoute CRD", reason:lang==="ko"?"설정 단순, cert-manager 없이 인증서 자동 갱신":"Simple config, auto-renew certs without cert-manager", cost:t("net.vpc.cost"), opt:lang==="ko"?"Dashboard 활성화로 라우팅 규칙 시각화":"Visualize routing rules with Dashboard" });
    }

    // 서비스 메시
    if(mesh === "istio") {
      platformSvcs.push({ name:"Istio Service Mesh", detail:lang==="ko"?"Envoy 사이드카 자동 주입, mTLS 전면 적용":"Auto Envoy sidecar injection, full mTLS", reason:lang==="ko"?"서비스 간 암호화·서킷브레이커·트래픽 미러링":"Inter-service encryption, circuit breaker, traffic mirroring", cost:lang==="ko"?"사이드카당 CPU 50m + 메모리 128Mi 추가":"CPU 50m + 128Mi memory per sidecar", opt:lang==="ko"?"PeerAuthentication STRICT 모드로 mTLS 강제. VirtualService로 카나리 배포 비율 조정":"Enforce mTLS with PeerAuthentication STRICT. Adjust canary deployment ratio with VirtualService" });
      platformSvcs.push({ name:lang==="ko"?"Kiali (Istio 대시보드)":"Kiali (Istio Dashboard)", detail:lang==="ko"?"서비스 토폴로지 시각화·트래픽 흐름 실시간":"Service topology visualization, real-time traffic flow", reason:lang==="ko"?"MSA 복잡성 가시화, 장애 지점 즉시 파악":"Visualize MSA complexity, instantly identify failure points", cost:t("net.vpc.cost"), opt:lang==="ko"?"Jaeger 트레이싱과 연동 필수":"Jaeger tracing integration required" });
    } else if(mesh === "aws_app_mesh") {
      platformSvcs.push({ name:"AWS App Mesh", detail:lang==="ko"?"Envoy 프록시 AWS 관리형, Virtual Service/Node":"AWS-managed Envoy proxy, Virtual Service/Node", reason:lang==="ko"?"X-Ray·CloudWatch 자동 통합, 설정 단순":"Auto X-Ray/CloudWatch integration, simple config", cost:lang==="ko"?"무료 (Envoy 리소스 비용)":"Free (Envoy resource costs)", opt:lang==="ko"?"Virtual Gateway로 외부 트래픽 메시 진입점 설정":"Set mesh entry point for external traffic with Virtual Gateway" });
    }

    // GitOps
    if(gitops === "argocd") {
      platformSvcs.push({ name:"ArgoCD", detail:lang==="ko"?"Git → K8s 자동 동기화, Web UI 대시보드":"Git -> K8s auto-sync, Web UI dashboard", reason:lang==="ko"?"배포 상태 가시화, 자동 드리프트 감지·수정":"Deployment state visualization, auto drift detection/correction", cost:lang==="ko"?"무료 (설치 필요)":"Free (installation required)", opt:lang==="ko"?"App of Apps 패턴으로 멀티 앱 중앙 관리. RBAC으로 팀별 배포 권한 분리":"Centralize multi-app management with App of Apps pattern. Separate deployment permissions per team with RBAC" });
    } else if(gitops === "flux") {
      platformSvcs.push({ name:"Flux v2 (GitOps)", detail:lang==="ko"?"Pull 기반 GitOps, Kustomize·Helm 네이티브":"Pull-based GitOps, Kustomize/Helm native", reason:lang==="ko"?"경량·CLI 중심, 멀티테넌트 강점":"Lightweight, CLI-centric, multi-tenant strength", cost:t("net.vpc.cost"), opt:lang==="ko"?"ImageUpdateAutomation으로 새 이미지 태그 감지 시 Git 자동 커밋":"Auto-commit to Git on new image tag detection with ImageUpdateAutomation" });
    }

    // K8s 모니터링
    if(k8sMon === "prometheus_grafana") {
      platformSvcs.push({ name:"Prometheus Operator", detail:lang==="ko"?"kube-state-metrics + node-exporter 자동 수집":"Auto-collect kube-state-metrics + node-exporter", reason:lang==="ko"?"K8s 표준 메트릭 스택, 무료·상세":"K8s standard metrics stack, free and detailed", cost:lang==="ko"?"무료 (스토리지 비용)":"Free (storage costs)", opt:lang==="ko"?"kube-prometheus-stack Helm 차트로 한 번에 설치":"Install at once with kube-prometheus-stack Helm chart" });
      platformSvcs.push({ name:"Grafana", detail:lang==="ko"?"K8s 전용 대시보드 (ID: 315, 6417)":"K8s dashboards (ID: 315, 6417)", reason:lang==="ko"?"실시간 클러스터·Pod·노드 시각화":"Real-time cluster/Pod/node visualization", cost:lang==="ko"?"무료 (OSS)":"Free (OSS)", opt:lang==="ko"?"Grafana Loki 추가 시 로그도 함께 분석 가능":"Add Grafana Loki for combined log analysis" });
    } else if(k8sMon === "cloudwatch") {
      platformSvcs.push({ name:"CloudWatch Container Insights", detail:lang==="ko"?"EKS 노드·Pod·컨테이너 메트릭 자동 수집":"Auto-collect EKS node/Pod/container metrics", reason:lang==="ko"?"추가 설치 없음, EKS 콘솔 통합":"No additional installation, EKS console integrated", cost:lang==="ko"?"$0.30/커스텀 메트릭/월":"$0.30/custom metric/mo", opt:lang==="ko"?"Fluent Bit DaemonSet으로 컨테이너 로그 CloudWatch Logs 전송":"Send container logs to CloudWatch Logs via Fluent Bit DaemonSet" });
    } else if(k8sMon === "hybrid") {
      platformSvcs.push({ name:lang==="ko"?"CloudWatch + Prometheus 혼합":"CloudWatch + Prometheus hybrid", detail:lang==="ko"?"인프라 알람은 CloudWatch, 앱 메트릭은 Prometheus":"CloudWatch for infra alarms, Prometheus for app metrics", reason:lang==="ko"?"각 도구 장점 취합, 대규모 환경 표준":"Best of both tools, standard for large environments", cost:lang==="ko"?"CloudWatch 메트릭 비용 + Prometheus 스토리지":"CloudWatch metric cost + Prometheus storage", opt:lang==="ko"?"Amazon Managed Prometheus(AMP)로 Prometheus 서버 관리 부담 제거":"Eliminate Prometheus server management with Amazon Managed Prometheus (AMP)" });
    }

    // 공통 K8s 도구
    platformSvcs.push({ name:"Helm", detail:lang==="ko"?"K8s 패키지 매니저, Chart 버전 관리":"K8s package manager, Chart version management", reason:lang==="ko"?"복잡한 K8s 리소스를 템플릿으로 재사용":"Reuse complex K8s resources as templates", cost:t("net.vpc.cost"), opt:lang==="ko"?"values.yaml로 환경별(dev/prod) 설정 분리":"Separate per-environment (dev/prod) settings with values.yaml" });
    platformSvcs.push({ name:"cert-manager", detail:lang==="ko"?"TLS 인증서 자동 발급·갱신 (Let's Encrypt / ACM)":"Auto-issue/renew TLS certificates (Let's Encrypt / ACM)", reason:lang==="ko"?"인증서 만료 장애 원천 차단":"Prevent certificate expiry outages", cost:t("net.vpc.cost"), opt:lang==="ko"?"ClusterIssuer로 전체 네임스페이스 인증서 통합 관리":"Manage all namespace certificates centrally with ClusterIssuer" });

    const secrets    = s.platform?.k8s_secrets;
    const podSec     = s.platform?.pod_security;
    const netPol     = s.platform?.network_policy;
    const k8sBackup  = s.platform?.k8s_backup;
    const asStrategy = s.platform?.autoscaling_strategy;
    const clusterStr = s.platform?.cluster_strategy;

    // K8s Secrets 관리
    if(secrets === "external_secrets") {
      platformSvcs.push({ name:"External Secrets Operator", detail:lang==="ko"?"Secrets Manager → K8s Secret 자동 동기화":"Secrets Manager -> K8s Secret auto-sync", reason:lang==="ko"?"비밀값 로테이션 시 자동 반영, IRSA 권한 연동":"Auto-reflect on secret rotation, IRSA permission integration", cost:lang==="ko"?"무료 (Secrets Manager 비용 별도)":"Free (Secrets Manager cost separate)", opt:lang==="ko"?"ExternalSecret 리소스에 refreshInterval 설정으로 주기적 동기화. 삭제 정책 설정 필수":"Set refreshInterval on ExternalSecret for periodic sync. Deletion policy required" });
    } else if(secrets === "secrets_csi") {
      platformSvcs.push({ name:"Secrets Store CSI Driver", detail:lang==="ko"?"비밀값 파일 마운트 방식, Parameter Store·Secrets Manager 연동":"File mount for secrets, Parameter Store/Secrets Manager integration", reason:lang==="ko"?"환경변수 노출 없이 파일로 안전하게 소비":"Consume secrets safely as files without env var exposure", cost:t("net.vpc.cost"), opt:lang==="ko"?"SecretProviderClass에 객체 타입·버전 명시. syncSecret으로 K8s Secret 병행 생성 가능":"Specify object type/version in SecretProviderClass. Create K8s Secret in parallel with syncSecret" });
    } else {
      platformSvcs.push({ name:lang==="ko"?"K8s Secret (네이티브)":"K8s Secret (native)", detail:lang==="ko"?"Base64 저장, RBAC + 암호화 설정 필요":"Base64 storage, RBAC + encryption setup required", reason:lang==="ko"?"단순 구성":"Simple configuration", cost:t("net.vpc.cost"), opt:lang==="ko"?"etcd 암호화(Envelope Encryption) + AWS KMS 연동 필수. Secret 접근 RBAC 최소 권한":"etcd encryption (Envelope Encryption) + AWS KMS integration required. Least privilege RBAC for Secret access" });
    }

    // 정책 엔진
    if(podSec === "kyverno") {
      platformSvcs.push({ name:"Kyverno", detail:lang==="ko"?"YAML 기반 정책: 이미지 검증·라벨 자동 주입·리소스 제한 강제":"YAML-based policies: image verification, auto label injection, resource limit enforcement", reason:lang==="ko"?"OPA보다 쉬운 진입장벽, K8s 네이티브":"Lower barrier than OPA, K8s native", cost:t("net.vpc.cost"), opt:lang==="ko"?"enforce 모드는 점진적 적용. audit 모드로 먼저 위반 파악 후 전환":"Apply enforce mode gradually. Start with audit mode to identify violations first" });
    } else if(podSec === "opa_gatekeeper") {
      platformSvcs.push({ name:"OPA Gatekeeper", detail:lang==="ko"?"Rego 언어 기반 커스텀 정책, ConstraintTemplate":"Custom policies in Rego language, ConstraintTemplate", reason:lang==="ko"?"금융·공공 규정 준수 필수 환경, 매우 세밀한 정책":"Required for financial/public compliance, highly granular policies", cost:t("net.vpc.cost"), opt:lang==="ko"?"정책 라이브러리(gatekeeper-library) 활용으로 빠른 시작 가능":"Quick start with gatekeeper-library policy library" });
    } else {
      platformSvcs.push({ name:"Pod Security Admission", detail:lang==="ko"?"K8s 내장 baseline/restricted 프로필":"K8s built-in baseline/restricted profiles", reason:lang==="ko"?"추가 설치 없이 기본 Pod 보안 강제":"Enforce basic Pod security without additional installation", cost:t("net.vpc.cost"), opt:lang==="ko"?"네임스페이스 레이블로 적용: pod-security.kubernetes.io/enforce=restricted":"Apply via namespace label: pod-security.kubernetes.io/enforce=restricted" });
    }

    // NetworkPolicy
    if(netPol === "vpc_cni") {
      platformSvcs.push({ name:"VPC CNI NetworkPolicy", detail:lang==="ko"?"K8s 표준 NetworkPolicy, EKS 1.25+ 네이티브":"K8s standard NetworkPolicy, EKS 1.25+ native", reason:lang==="ko"?"별도 플러그인 없이 Pod 간 트래픽 격리":"Pod traffic isolation without additional plugins", cost:t("net.vpc.cost"), opt:lang==="ko"?"기본 deny-all 정책 먼저 적용 후 필요한 통신만 허용 (화이트리스트)":"Apply default deny-all first, then allow only required traffic (whitelist)" });
    } else if(netPol === "cilium") {
      platformSvcs.push({ name:"Cilium (eBPF)", detail:lang==="ko"?"L3/L4/L7 정책, eBPF 고성능, K8s NetworkPolicy 확장":"L3/L4/L7 policies, high-performance eBPF, extended K8s NetworkPolicy", reason:lang==="ko"?"iptables 없는 고성능, HTTP 경로·gRPC 메서드 레벨 정책":"High performance without iptables, HTTP path/gRPC method level policies", cost:lang==="ko"?"무료 (엔터프라이즈 유료)":"Free (enterprise paid)", opt:lang==="ko"?"Cilium Hubble로 네트워크 흐름 실시간 가시화. Tetragon 연동 시 런타임 보안":"Real-time network flow visibility with Cilium Hubble. Runtime security with Tetragon integration" });
    }

    // K8s 백업
    if(k8sBackup === "velero") {
      platformSvcs.push({ name:"Velero", detail:lang==="ko"?"K8s 리소스 + PVC 볼륨 S3 백업·복구":"K8s resources + PVC volume S3 backup/restore", reason:lang==="ko"?"클러스터 재해복구, 다른 클러스터 마이그레이션":"Cluster disaster recovery, cross-cluster migration", cost:lang==="ko"?"무료 (S3 스토리지 비용)":"Free (S3 storage cost)", opt:lang==="ko"?"Schedule CRD로 매일 자동 백업. 복구 테스트 정기 실행 필수":"Daily auto-backup via Schedule CRD. Regular restore testing required" });
    }

    // HPA/VPA/KEDA
    if(asStrategy === "hpa_keda") {
      platformSvcs.push({ name:"KEDA (K8s Event Driven Autoscaling)", detail:lang==="ko"?"SQS 메시지 수·Kinesis Shard·Prometheus 메트릭 기반 확장":"Scale based on SQS message count, Kinesis Shard, Prometheus metrics", reason:lang==="ko"?"CPU/메모리 외 커스텀 메트릭으로 정밀한 배치 확장":"Precise batch scaling with custom metrics beyond CPU/memory", cost:t("net.vpc.cost"), opt:lang==="ko"?"ScaledObject에 pollingInterval·cooldownPeriod 설정. minReplicaCount=0으로 비용 최소화 (이벤트 없을 때 0 Pod)":"Set pollingInterval/cooldownPeriod on ScaledObject. Minimize cost with minReplicaCount=0 (0 Pods when no events)" });
    } else if(asStrategy === "hpa_vpa") {
      platformSvcs.push({ name:"VPA (Vertical Pod Autoscaler)", detail:lang==="ko"?"Pod CPU·메모리 Requests 자동 최적화":"Auto-optimize Pod CPU/memory Requests", reason:lang==="ko"?"리소스 낭비 없는 정밀 할당, 비용 절감":"Precise allocation without resource waste, cost savings", cost:t("net.vpc.cost"), opt:lang==="ko"?"⚠️ HPA(CPU 기준)와 VPA 동시 사용 금지. VPA를 Off 모드로 추천값만 수집 후 수동 적용 권장":"⚠️ Do not use HPA (CPU-based) and VPA simultaneously. Recommend VPA in Off mode to collect recommendations, then apply manually" });
    }

    // 클러스터 전략
    if(clusterStr === "multi_cluster") {
      platformSvcs.push({ name:lang==="ko"?"멀티 클러스터 전략":"Multi-cluster strategy", detail:lang==="ko"?"Prod 클러스터 완전 분리, EKS × 2 이상":"Full Prod cluster separation, EKS x2+", reason:lang==="ko"?"운영/개발 완전 격리, 보안 사고 범위 최소화":"Full ops/dev isolation, minimize security incident scope", cost:lang==="ko"?"클러스터당 $72/월 추가":"$72/mo per additional cluster", opt:lang==="ko"?"ArgoCD ApplicationSet으로 멀티 클러스터 배포 중앙 관리. AWS Organizations SCP로 계정 분리 연동":"Centralize multi-cluster deployments with ArgoCD ApplicationSet. Integrate account separation with AWS Organizations SCP" });
    }

    const platformInsights = [
      np === "karpenter" ? (lang==="ko"?"Karpenter: Spot 인터럽션 시 자동 노드 교체. PodDisruptionBudget 설정으로 중단 최소화":"Karpenter: auto node replacement on Spot interruption. Minimize disruption with PodDisruptionBudget") : (lang==="ko"?"Cluster Autoscaler: Node Group min/max 설정 후 HPA와 함께 사용":"Cluster Autoscaler: set Node Group min/max, use with HPA"),
      ingress === "nginx" ? (lang==="ko"?"NGINX: NLB(L4) 뒤에 배치. HTTP/2, WebSocket, gRPC 모두 지원":"NGINX: placed behind NLB (L4). Supports HTTP/2, WebSocket, gRPC") : ingress === "kong" ? (lang==="ko"?"Kong: DB 모드는 PostgreSQL RDS 필요. DB-less KongIngress 모드로 단순화 가능":"Kong: DB mode requires PostgreSQL RDS. Simplify with DB-less KongIngress mode") : (lang==="ko"?"ALB Controller: 서브넷 태그(kubernetes.io/role/elb=1) 필수":"ALB Controller: subnet tag (kubernetes.io/role/elb=1) required"),
      mesh === "istio" ? (lang==="ko"?"⚠️ Istio 리소스 오버헤드: 서비스 수 × 사이드카 메모리 추가. 소규모에선 과한 복잡도":"⚠️ Istio resource overhead: service count x sidecar memory. Excessive complexity for small scale") : mesh === "none" ? (lang==="ko"?"서비스 메시 없음: Security Group으로 Pod 간 트래픽 제어, ECS Service Connect 대안 검토":"No service mesh: control Pod traffic with Security Groups, consider ECS Service Connect") : "",
      gitops !== "none" ? (lang==="ko"?"GitOps: main 브랜치 보호 규칙 + PR 리뷰 필수. 직접 클러스터 접근 차단":"GitOps: main branch protection rules + PR review required. Block direct cluster access") : "",
      secrets === "native" ? (lang==="ko"?"⚠️ K8s Secret 기본: etcd 암호화(aws-encryption-provider + KMS) 설정 필수":"⚠️ K8s Secret default: etcd encryption (aws-encryption-provider + KMS) setup required") : secrets === "external_secrets" ? (lang==="ko"?"External Secrets: IRSA로 Secrets Manager 읽기 권한만 부여. 네임스페이스별 ESO 분리 운영":"External Secrets: grant only Secrets Manager read via IRSA. Operate ESO separately per namespace") : "",
      podSec === "kyverno" ? (lang==="ko"?"Kyverno: 정책 위반 시 Pod 생성 거부. CI 파이프라인에서 kubectl dry-run으로 사전 검증":"Kyverno: reject Pod creation on policy violation. Pre-validate with kubectl dry-run in CI pipeline") : podSec === "opa_gatekeeper" ? (lang==="ko"?"OPA: ConstraintTemplate + Constraint 쌍으로 정책 정의. audit 로그 → CloudWatch Logs 전송":"OPA: define policies with ConstraintTemplate + Constraint pairs. Send audit logs to CloudWatch Logs") : "",
      netPol === "cilium" ? (lang==="ko"?"Cilium: eBPF 기반으로 iptables 없음. kube-proxy 대체 가능. Hubble로 네트워크 흐름 실시간 모니터링":"Cilium: eBPF-based, no iptables. Can replace kube-proxy. Real-time network flow monitoring with Hubble") : netPol === "vpc_cni" ? (lang==="ko"?"NetworkPolicy: 기본 deny-all 네임스페이스 정책 + 서비스별 허용 규칙. namespace selector로 Cross-NS 허용":"NetworkPolicy: default deny-all namespace policy + per-service allow rules. Allow cross-NS with namespace selector") : "",
      asStrategy === "hpa_vpa" ? (lang==="ko"?"⚠️ HPA+VPA: VPA를 Recommender 모드로만 사용하고 수동 조정 권장. CPU 기반 HPA와 VPA 동시 적용 금지":"⚠️ HPA+VPA: use VPA in Recommender mode only and adjust manually. Do not apply CPU-based HPA and VPA simultaneously") : "",
      clusterStr === "multi_cluster" ? (lang==="ko"?"멀티 클러스터: EKS 클러스터 간 직접 통신 불가. PrivateLink 또는 VPC Peering으로 서비스 엔드포인트 공유":"Multi-cluster: no direct communication between EKS clusters. Share service endpoints via PrivateLink or VPC Peering") : "",
      lang==="ko"?"kubectl 직접 접근 차단: EKS Access Entry로 IAM 기반 권한만 허용":"Block direct kubectl access: allow only IAM-based permissions via EKS Access Entry",
    ].filter(Boolean);

    if(platformSvcs.length > 0) {
      layers.push({
        id:"platform",
        label:lang==="ko"?"K8s 생태계 플랫폼":"K8s Ecosystem Platform",
        icon:"⚙️",
        color:"#6366f1",
        bg:"#eef2ff",
        services: platformSvcs,
        insights: platformInsights,
      });
    }
  }

  // ── 4-c. 애플리케이션 스택 레이어 ──────────────────────────────────────
  if(s.compute?.arch_pattern !== "vm" && s.team?.language) {
    const devLang = s.team?.language;
    const gw = s.appstack?.api_gateway_impl;
    const proto = s.appstack?.protocol;
    const sd = s.appstack?.service_discovery;

    const appSvcs: any[] = [];
    const appInsights: string[] = [];

    const langMap: Record<string, any> = {
      spring_boot:   { name:"Spring Boot (Java)", detail:lang==="ko"?"JVM, Spring Cloud 생태계":"JVM, Spring Cloud ecosystem", reason:lang==="ko"?"국내 기업 표준, 풍부한 레퍼런스":"Enterprise standard, abundant references", cost:lang==="ko"?"컨테이너 최소 512MB RAM 필요":"Container min 512MB RAM required", opt:lang==="ko"?"컨테이너화 필수. Lambda 사용 시 GraalVM Native Image로 콜드스타트 단축 가능":"Containerization required. GraalVM Native Image for shorter cold start on Lambda" },
      node_express:  { name:"Node.js / Express·Fastify", detail:lang==="ko"?"V8 엔진, 비동기 I/O 특화":"V8 engine, async I/O specialized", reason:lang==="ko"?"Lambda·컨테이너 모두 적합, 콜드스타트 짧음":"Suitable for both Lambda and containers, short cold start", cost:lang==="ko"?"Lambda 128~256MB 충분":"Lambda 128-256MB sufficient", opt:lang==="ko"?"ESM + esbuild 번들링으로 Lambda 패키지 크기 최소화":"Minimize Lambda package size with ESM + esbuild bundling" },
      python_fastapi:{ name:"Python / FastAPI", detail:lang==="ko"?"타입 힌트, OpenAPI 자동 생성":"Type hints, auto OpenAPI generation", reason:lang==="ko"?"AI/ML 연동 최적, 빠른 개발":"Optimal for AI/ML integration, rapid development", cost:lang==="ko"?"Lambda 256MB 권장":"Lambda 256MB recommended", opt:lang==="ko"?"Lambda Layer로 무거운 패키지(numpy, torch) 분리":"Separate heavy packages (numpy, torch) with Lambda Layers" },
      go:            { name:"Go", detail:lang==="ko"?"정적 바이너리, 메모리 효율 최상":"Static binary, best memory efficiency", reason:lang==="ko"?"컨테이너 이미지 10~15MB, 동시성 강점":"Container image 10-15MB, concurrency strength", cost:lang==="ko"?"Lambda 128MB로 충분, 컨테이너 최소 사이즈":"Lambda 128MB sufficient, minimum container size", opt:lang==="ko"?"multi-stage Docker build로 최종 이미지 최소화":"Minimize final image with multi-stage Docker build" },
      rust:          { name:"Rust", detail:lang==="ko"?"메모리 안전, 제로 코스트 추상화":"Memory safety, zero-cost abstractions", reason:lang==="ko"?"Lambda 콜드스타트 < 1ms, 최소 메모리":"Lambda cold start <1ms, minimal memory", cost:lang==="ko"?"Lambda 64MB로 가능":"Lambda 64MB possible", opt:lang==="ko"?"cargo lambda로 크로스 컴파일. Axum 프레임워크 권장":"Cross-compile with cargo lambda. Axum framework recommended" },
      mixed:         { name:lang==="ko"?"폴리글랏 (다중 언어)":"Polyglot (multi-language)", detail:lang==="ko"?"서비스별 최적 언어 선택":"Optimal language selection per service", reason:lang==="ko"?"각 서비스 특성에 최적화":"Optimized for each service's characteristics", cost:lang==="ko"?"팀 역량 분산 주의":"Beware of team skill fragmentation", opt:lang==="ko"?"공통 라이브러리는 Lambda Layer 또는 내부 패키지로 공유":"Share common libraries via Lambda Layers or internal packages" },
    };
    if(langMap[devLang]) appSvcs.push(langMap[devLang]);

    if(devLang === "spring_boot") {
      appInsights.push(lang==="ko"?"⚠️ Spring Boot + Lambda: JVM 콜드스타트 1~3초. Lambda 최소 1GB RAM 설정, Provisioned Concurrency 필수":"⚠️ Spring Boot + Lambda: JVM cold start 1-3s. Set Lambda min 1GB RAM, Provisioned Concurrency required");
      appInsights.push(lang==="ko"?"Spring Boot 컨테이너: Health Check grace period 60초 이상 설정 (JVM 워밍업 시간)":"Spring Boot container: set Health Check grace period to 60s+ (JVM warmup time)");
      appInsights.push(lang==="ko"?"Spring Cloud Config Server → AWS AppConfig로 대체하면 관리 서버 불필요":"Replace Spring Cloud Config Server with AWS AppConfig to eliminate management server");
    } else if(devLang === "go") {
      appInsights.push(lang==="ko"?"Go 컨테이너 이미지: alpine 기반 멀티스테이지 빌드로 최종 10~15MB 달성. ECR 비용 최소화":"Go container image: achieve 10-15MB final size with alpine multi-stage build. Minimize ECR costs");
    } else if(devLang === "python_fastapi") {
      appInsights.push(lang==="ko"?"Python Lambda: 무거운 ML 라이브러리는 Lambda Layer 또는 컨테이너 이미지(10GB) 배포 활용":"Python Lambda: use Lambda Layers or container image (10GB) deployment for heavy ML libraries");
    }

    const gwMap: Record<string, any> = {
      aws_apigw:      { name:"AWS API Gateway", detail:lang==="ko"?"인증·속도제한·CORS AWS 관리형":"AWS-managed auth, rate limiting, CORS", reason:lang==="ko"?"Lambda·ECS 통합 용이, 운영 부담 없음":"Easy Lambda/ECS integration, no operational burden", cost:lang==="ko"?"$3.50/100만 요청":"$3.50/1M requests", opt:lang==="ko"?"Usage Plan으로 파트너별 API 키 + 요청 할당량 관리":"Manage per-partner API keys + request quotas with Usage Plan" },
      alb_only:       { name:lang==="ko"?"ALB 직접 연결":"ALB direct connection", detail:lang==="ko"?"컨테이너 직접 노출, 인증은 앱 처리":"Container directly exposed, auth handled by app", reason:lang==="ko"?"가장 단순·저렴한 구성":"Simplest and cheapest configuration", cost:"$0.008/LCU-hr", opt:lang==="ko"?"WAF 연결로 기본 보안 강화. ALB 액세스 로그 S3 저장 필수":"Enhance security with WAF. ALB access logs to S3 required" },
      spring_gateway:  { name:"Spring Cloud Gateway", detail:lang==="ko"?"ECS/EKS에 Gateway 서비스 별도 배포":"Separate Gateway service deployed on ECS/EKS", reason:lang==="ko"?"Spring Boot 생태계 표준, 코드 기반 라우팅":"Spring Boot ecosystem standard, code-based routing", cost:lang==="ko"?"ECS Task 추가 (0.25vCPU, 512MB)":"Additional ECS Task (0.25vCPU, 512MB)", opt:lang==="ko"?"Circuit Breaker(Resilience4j) 내장. Redis로 Rate Limiting 구현":"Built-in Circuit Breaker (Resilience4j). Implement Rate Limiting with Redis" },
      kong:           { name:"Kong Gateway", detail:lang==="ko"?"선언형 플러그인, PostgreSQL 필요":"Declarative plugins, PostgreSQL required", reason:lang==="ko"?"100+ 플러그인, 중앙 API 정책 관리":"100+ plugins, centralized API policy management", cost:lang==="ko"?"PostgreSQL RDS 추가 비용":"Additional PostgreSQL RDS cost", opt:lang==="ko"?"Kong Deck으로 선언형 설정 관리. Prometheus 플러그인으로 메트릭 수집":"Manage declarative config with Kong Deck. Collect metrics with Prometheus plugin" },
      nginx:          { name:lang==="ko"?"NGINX / Envoy 프록시":"NGINX / Envoy proxy", detail:lang==="ko"?"고성능 리버스 프록시, Lua 스크립팅":"High-performance reverse proxy, Lua scripting", reason:lang==="ko"?"가장 낮은 레이턴시, 유연한 설정":"Lowest latency, flexible configuration", cost:lang==="ko"?"컨테이너 리소스 최소":"Minimal container resources", opt:lang==="ko"?"upstream keepalive 설정으로 커넥션 재사용. limit_req_zone으로 IP 기반 속도제한":"Reuse connections with upstream keepalive. IP-based rate limiting with limit_req_zone" },
    };
    if(gw && gwMap[gw]) appSvcs.push(gwMap[gw]);

    if(gw === "spring_gateway") {
      appInsights.push(lang==="ko"?"Spring Cloud Gateway: ECS에 별도 서비스로 배포. 최소 2 Task 이상 (HA). 모든 트래픽이 통과하므로 High CPU 프로파일 설정":"Spring Cloud Gateway: deploy as separate service on ECS. Min 2 Tasks (HA). Set High CPU profile since all traffic passes through");
    } else if(gw === "kong") {
      appInsights.push(lang==="ko"?"Kong DB 모드: PostgreSQL RDS 필수 (Aurora PG 권장). DB 장애 시 Kong 전체 영향 → DB-less 모드 검토":"Kong DB mode: PostgreSQL RDS required (Aurora PG recommended). DB failure impacts all of Kong -- consider DB-less mode");
    }

    if(proto === "grpc") {
      appSvcs.push({ name:"gRPC + Protobuf", detail:lang==="ko"?"HTTP/2 바이너리, 스키마 기반 강타입":"HTTP/2 binary, schema-based strong typing", reason:lang==="ko"?"REST 대비 5~10배 성능, 타입 안전 계약":"5-10x performance vs REST, type-safe contracts", cost:lang==="ko"?"Protobuf 관리 도구 필요":"Protobuf management tools needed", opt:lang==="ko"?"gRPC-Web 또는 Envoy 변환으로 브라우저 지원. Schema Registry로 호환성 관리":"Browser support via gRPC-Web or Envoy transcoding. Manage compatibility with Schema Registry" });
      appInsights.push(lang==="ko"?"gRPC: ALB HTTP/2 리스너 활성화 필수 (기본 비활성). 헬스체크는 gRPC Health Protocol 사용":"gRPC: ALB HTTP/2 listener must be enabled (disabled by default). Use gRPC Health Protocol for health checks");
      appInsights.push(lang==="ko"?"Protobuf 스키마: Buf CLI로 lint·breaking change 감지. buf.build 레지스트리 활용 가능":"Protobuf schema: detect lint/breaking changes with Buf CLI. buf.build registry available");
    } else if(proto === "graphql") {
      const useAppSync = !s.team?.language || ["python_fastapi","node_express"].includes(s.team.language);
      appSvcs.push({ name: useAppSync ? (lang==="ko"?"AWS AppSync (GraphQL 관리형)":"AWS AppSync (managed GraphQL)") : "Apollo Server (GraphQL)", detail: useAppSync ? (lang==="ko"?"GraphQL API AWS 완전 관리형, DynamoDB·Lambda·RDS 직접 연결":"Fully managed GraphQL API, direct DynamoDB/Lambda/RDS connection") : (lang==="ko"?"GraphQL 서버 ECS/EKS 배포, DataLoader N+1 방지":"GraphQL server on ECS/EKS, DataLoader N+1 prevention"), reason: useAppSync ? (lang==="ko"?"운영 부담 없음, 실시간 구독(WebSocket) 내장":"No operational burden, built-in real-time subscriptions (WebSocket)") : (lang==="ko"?"스키마 퍼스트 개발, Federation으로 MSA 분산 가능":"Schema-first development, MSA distribution via Federation"), cost: useAppSync ? (lang==="ko"?"$4/100만 쿼리·변이":"$4/1M queries/mutations") : (lang==="ko"?"컨테이너 리소스":"Container resources"), opt: useAppSync ? (lang==="ko"?"API Key·Cognito·IAM 인증 선택 가능":"API Key, Cognito, IAM auth selectable") : (lang==="ko"?"DataLoader 필수 (N+1 → Redis 캐시). Apollo Federation으로 서비스별 서브그래프 분리":"DataLoader required (N+1 -> Redis cache). Separate sub-graphs per service with Apollo Federation") });
      appInsights.push(lang==="ko"?"GraphQL N+1 문제: DataLoader 패턴 필수. 미적용 시 복잡한 쿼리 한 번에 수백 개 DB 쿼리 발생":"GraphQL N+1 problem: DataLoader pattern required. Without it, a single complex query can trigger hundreds of DB queries");
      appInsights.push(lang==="ko"?"GraphQL Depth Limit + Query Complexity 제한 설정으로 DDoS 형태 복잡 쿼리 방어":"Defend against DDoS-style complex queries with GraphQL Depth Limit + Query Complexity restrictions");
    } else if(proto === "mixed") {
      appSvcs.push({ name:lang==="ko"?"REST (외부) + gRPC (내부 MSA)":"REST (external) + gRPC (internal MSA)", detail:lang==="ko"?"외부 API는 REST, 내부 서비스 간은 gRPC":"REST for external APIs, gRPC between internal services", reason:lang==="ko"?"범용 외부 호환성 + 내부 고성능 통신":"Universal external compatibility + high-performance internal communication", cost:lang==="ko"?"ALB HTTP/2 + REST 리스너 분리":"ALB HTTP/2 + REST listener separation", opt:lang==="ko"?"Envoy 사이드카로 gRPC ↔ REST 변환. API Gateway는 외부 REST만 처리":"gRPC <-> REST transcoding via Envoy sidecar. API Gateway handles external REST only" });
      appInsights.push(lang==="ko"?"혼합 프로토콜: Ingress 레벨에서 /api/* REST, /grpc/* gRPC 경로 분리. ALB 리스너 규칙으로 라우팅":"Mixed protocol: separate /api/* REST, /grpc/* gRPC paths at Ingress level. Route via ALB listener rules");
    }

    const sdMap: Record<string, any> = {
      k8s_dns:    { name:lang==="ko"?"K8s 내장 DNS (CoreDNS)":"K8s built-in DNS (CoreDNS)", detail:"service.namespace.svc.cluster.local", reason:lang==="ko"?"EKS 자동 제공, 설정 불필요":"Auto-provided by EKS, no setup needed", cost:t("net.vpc.cost"), opt:lang==="ko"?"ExternalDNS로 Route 53 레코드 자동 동기화":"Auto-sync Route 53 records with ExternalDNS" },
      cloud_map:  { name:"AWS Cloud Map", detail:lang==="ko"?"ECS 서비스 이름 기반 디스커버리":"ECS service name-based discovery", reason:lang==="ko"?"ECS·Lambda·EC2 통합, Route 53 연동":"ECS/Lambda/EC2 integration, Route 53 linked", cost:lang==="ko"?"$1/100만 쿼리":"$1/1M queries", opt:lang==="ko"?"ECS Service Connect와 함께 사용 시 자동 등록":"Auto-registration when used with ECS Service Connect" },
      eureka:     { name:"Spring Cloud Eureka", detail:lang==="ko"?"서비스 레지스트리 서버 별도 배포":"Separate service registry server deployment", reason:lang==="ko"?"Spring Boot 전통 방식, 풍부한 레퍼런스":"Traditional Spring Boot approach, abundant references", cost:lang==="ko"?"ECS Task 추가":"Additional ECS Task", opt:lang==="ko"?"AWS Cloud Map으로 대체 시 관리 서버 제거 가능. 신규 프로젝트는 Cloud Map 권장":"Eliminate management server by switching to AWS Cloud Map. Cloud Map recommended for new projects" },
    };
    if(sd && sdMap[sd]) appSvcs.push(sdMap[sd]);
    if(sd === "eureka") appInsights.push(lang==="ko"?"Eureka: 별도 서버 운영 부담. AWS Cloud Map + ECS Service Connect 조합으로 마이그레이션 고려":"Eureka: separate server operational burden. Consider migrating to AWS Cloud Map + ECS Service Connect");

    const apiVer = s.appstack?.api_versioning;
    if(apiVer === "url_path") {
      appSvcs.push({ name:lang==="ko"?"API 버전 관리 (URL 경로)":"API Versioning (URL path)", detail:lang==="ko"?"/v1/, /v2/ 경로 분리":"/v1/, /v2/ path separation", reason:lang==="ko"?"명확한 버전 표현, ALB 규칙으로 라우팅":"Clear version expression, routing via ALB rules", cost:t("net.vpc.cost"), opt:lang==="ko"?"구버전 deprecated 헤더 추가 후 6개월 유지·공지 → 제거":"Add deprecated header to old version, maintain 6 months with notice, then remove" });
      appInsights.push(lang==="ko"?"URL 버전: ALB 리스너 규칙에 /v1/* → 구 타겟 그룹, /v2/* → 신 타겟 그룹 분리 설정":"URL versioning: ALB listener rules /v1/* -> old target group, /v2/* -> new target group");
    } else if(apiVer === "header") {
      appSvcs.push({ name:lang==="ko"?"API 버전 관리 (헤더)":"API Versioning (header)", detail:lang==="ko"?"Accept-Version 헤더 기반 라우팅":"Accept-Version header-based routing", reason:lang==="ko"?"URL 변경 없이 버전 분리":"Version separation without URL changes", cost:t("net.vpc.cost"), opt:lang==="ko"?"API Gateway 스테이지 변수나 Lambda 별칭(Alias)으로 버전 라우팅 구현":"Implement version routing with API Gateway stage variables or Lambda aliases" });
    } else if(apiVer === "subdomain") {
      appSvcs.push({ name:lang==="ko"?"API 버전 관리 (서브도메인)":"API Versioning (subdomain)", detail:lang==="ko"?"v2.api.example.com → 별도 ALB":"v2.api.example.com -> separate ALB", reason:lang==="ko"?"버전별 완전 독립 배포":"Fully independent deployment per version", cost:lang==="ko"?"ACM 인증서 추가":"Additional ACM certificate", opt:lang==="ko"?"Route 53 CNAME + 버전별 ALB 리스너. 구 버전 서브도메인은 폐기 전 301 리다이렉트":"Route 53 CNAME + per-version ALB listener. 301 redirect old version subdomains before decommission" });
    }

    const schReg = s.appstack?.schema_registry;
    if(schReg === "glue_registry") {
      appSvcs.push({ name:"AWS Glue Schema Registry", detail:lang==="ko"?"Avro·JSON Schema·Protobuf 버전 관리":"Avro/JSON Schema/Protobuf version management", reason:lang==="ko"?"MSK/Kinesis 메시지 스키마 호환성 보장":"Ensure MSK/Kinesis message schema compatibility", cost:lang==="ko"?"무료 (SDK 사용 시)":"Free (when using SDK)", opt:lang==="ko"?"BACKWARD 호환성 정책 권장. 스키마 변경 시 소비자 먼저 업데이트 후 생산자 변경":"BACKWARD compatibility policy recommended. Update consumers first, then producers on schema changes" });
      appInsights.push(lang==="ko"?"Glue Schema Registry: MSK와 자동 통합. BACKWARD/FORWARD/FULL 호환성 정책 선택 필수":"Glue Schema Registry: auto-integration with MSK. Must select BACKWARD/FORWARD/FULL compatibility policy");
    } else if(schReg === "confluent_registry") {
      appSvcs.push({ name:"Confluent Schema Registry", detail:lang==="ko"?"Kafka 생태계 표준, REST API":"Kafka ecosystem standard, REST API", reason:lang==="ko"?"풍부한 호환성 정책, 광범위한 클라이언트 지원":"Rich compatibility policies, broad client support", cost:lang==="ko"?"자체 운영 또는 Confluent Cloud":"Self-managed or Confluent Cloud", opt:lang==="ko"?"MSK와 함께 ECS에 자체 운영. Avro 직렬화로 메시지 크기 60~70% 절감":"Self-manage on ECS with MSK. 60-70% message size reduction with Avro serialization" });
    }

    if(appSvcs.length > 0) {
      layers.push({
        id:"appstack",
        label:lang==="ko"?"애플리케이션 스택":"Application Stack",
        icon:"🖥️",
        color:"#0891b2",
        bg:"#ecfeff",
        services: appSvcs,
        insights: appInsights.filter(Boolean),
      });
    }
  }

  // ── 5. 데이터베이스 ────────────────────────────────
  const dbServices: any[] = [];
  const effectiveDbHa = (s.data?.db_ha === "global" && s.slo?.region === "single") ? "multi_az" : s.data?.db_ha;
  const haDetail = effectiveDbHa === "multi_az" ? (lang==="ko"?"Multi-AZ, 자동 페일오버 ~30초":"Multi-AZ, auto failover ~30s")
    : effectiveDbHa === "multi_az_read" ? "Multi-AZ + Read Replica"
    : effectiveDbHa === "global" ? (lang==="ko"?"Global Database, 크로스 리전 복제":"Global Database, cross-region replication")
    : "Single-AZ";

  const DB_NAMES: Record<string, string> = { aurora_pg:"Aurora PostgreSQL", aurora_mysql:"Aurora MySQL", rds_pg:"RDS PostgreSQL", rds_mysql:"RDS MySQL", dynamodb:"DynamoDB" };
  const isTrafficSteady = trafficPats.includes("steady") || trafficPats.includes("business");

  for(const dbId of primaryDbs) {
    const dbName = DB_NAMES[dbId] || dbId;
    const isDynamo = dbId === "dynamodb";
    const isAurora = dbId.startsWith("aurora");
    const isRds    = dbId.startsWith("rds_");

    let dbOpt = "";
    if(isAurora) {
      dbOpt = s.cost?.commitment !== "none"
        ? (lang==="ko" ? `RI ${s.cost.commitment === "3yr" ? "3년 최대 66%" : "1년 최대 40%"} 절약. 트래픽 변동 클 경우 Aurora Serverless v2 검토 (0.5 ACU~)` : `RI ${s.cost.commitment === "3yr" ? "3yr up to 66%" : "1yr up to 40%"} savings. Consider Aurora Serverless v2 for variable traffic (0.5 ACU~)`)
        : (lang==="ko"?"Aurora Serverless v2: 가변 트래픽에서 비용 40~60% 절감. 안정화 후 RI 전환":"Aurora Serverless v2: 40-60% cost reduction for variable traffic. Switch to RI after stabilization");
    } else if(isDynamo) {
      dbOpt = isTrafficSteady
        ? (lang==="ko"?"Provisioned + Auto Scaling: 예측 가능한 트래픽에서 On-Demand 대비 60~80% 절감. PITR 반드시 활성화":"Provisioned + Auto Scaling: 60-80% savings vs On-Demand for predictable traffic. PITR must be enabled")
        : (lang==="ko"?"On-Demand 모드: 예측 불가 트래픽에 적합. PITR 활성화 필수 (35일 이내 임의 시점 복구)":"On-Demand mode: suitable for unpredictable traffic. PITR required (point-in-time recovery within 35 days)");
    } else if(isRds) {
      dbOpt = s.cost?.commitment !== "none"
        ? (lang==="ko" ? `RI ${s.cost.commitment === "3yr" ? "3년 최대 66%" : "1년 최대 40%"} 절약. 백업 보존 기간 ${isCritical ? "35일" : "7일"} 설정 필수` : `RI ${s.cost.commitment === "3yr" ? "3yr up to 66%" : "1yr up to 40%"} savings. Backup retention ${isCritical ? "35 days" : "7 days"} required`)
        : (lang==="ko" ? `백업 보존 기간 ${isCritical ? "35일" : "7일"} 설정. 안정화 후 RI 전환` : `Set backup retention to ${isCritical ? "35 days" : "7 days"}. Switch to RI after stabilization`);
    }

    // RDS doesn't support Global Database — downgrade to cross-region read replica
    const dbHaDetail = (isRds && effectiveDbHa === "global")
      ? (lang==="ko"?"크로스 리전 Read Replica, 수동 프로모션":"Cross-region Read Replica, manual promotion")
      : haDetail;

    dbServices.push({
      name: dbName,
      detail: isDynamo ? `${dbHaDetail.replace("Multi-AZ, ", (lang==="ko"?"Global Table 가능, ":"Global Table available, "))}, On-Demand/Provisioned` : `${dbHaDetail}, ${s.network?.subnet_tier === "3tier" ? (lang==="ko"?"격리 서브넷":"isolated subnet") : (lang==="ko"?"프라이빗 서브넷":"private subnet")}`,
      reason: primaryDbs.length > 1
        ? (isDynamo ? (lang==="ko"?"세션·상태·실시간 NoSQL (낮은 지연)":"Session/state/real-time NoSQL (low latency)") : (lang==="ko"?"트랜잭션·관계형 데이터 SoT":"Transactional/relational data SoT"))
        : (lang==="ko"?"주요 데이터 SoT (Source of Truth)":"Primary data SoT (Source of Truth)"),
      cost: isAurora ? (lang==="ko"?"r6g.large: ~$200/월/인스턴스":"r6g.large: ~$200/mo/instance") : isDynamo ? (lang==="ko"?"On-Demand: 요청당 과금":"On-Demand: per-request billing") : (lang==="ko"?"db.t3.medium: 서울 ~$70/월":"db.t3.medium: Seoul ~$70/mo"),
      opt: dbOpt
    });

    if(isAurora || isRds) {
      dbServices.push({
        name: "AWS Backup",
        detail: lang==="ko"?`백업 보존 ${isCritical ? "35일" : "7일"}, 크로스 리전 복사`:`Backup retention ${isCritical ? "35 days" : "7 days"}, cross-region copy`,
        reason: lang==="ko"?"중앙 백업 정책으로 RPO 보장, 규정 준수 감사 로그 자동화":"Guarantee RPO with centralized backup policy, automated compliance audit logs",
        cost: lang==="ko"?"스토리지 $0.05/GB/월":"Storage $0.05/GB/mo",
        opt: lang==="ko"?"Backup Vault Lock으로 백업 변조 방지 (WORM). 복구 테스트 분기 1회 실시":"Prevent backup tampering with Backup Vault Lock (WORM). Quarterly restore testing"
      });
    }
    if(isDynamo) {
      dbServices.push({
        name: "DynamoDB PITR + Backup",
        detail: lang==="ko"?"Point-in-Time Recovery (35일) + AWS Backup 정책":"Point-in-Time Recovery (35 days) + AWS Backup policy",
        reason: lang==="ko"?"임의 시점 복구로 RPO 최소화. 실수로 인한 데이터 삭제 복구":"Minimize RPO with point-in-time recovery. Recover accidentally deleted data",
        cost: lang==="ko"?"PITR: 스토리지 비용의 약 20%":"PITR: ~20% of storage cost",
        opt: lang==="ko"?"Global Tables 사용 시 각 리전별 PITR 개별 활성화 필요":"PITR must be enabled individually per region when using Global Tables"
      });
    }
  }
  if(hasCache) {
    if(s.data.cache === "redis" || s.data.cache === "both") {
      dbServices.push({
        name: "ElastiCache Redis",
        detail: `${isHighAvail ? "Cluster Mode, Multi-AZ" : "Cluster Mode"}`,
        reason: lang==="ko"?"세션, 좌석 잠금(SET NX), Rate Limit, Pub/Sub 브로드캐스트":"Sessions, seat locking (SET NX), Rate Limit, Pub/Sub broadcast",
        cost: lang==="ko"?"cache.r7g.large: ~$100/월":"cache.r7g.large: ~$100/mo",
        opt: lang==="ko"?"Redis Serverless 옵션: 비활성 시 비용 절감. 반드시 SoT는 DB에 별도 저장":"Redis Serverless option: cost savings when inactive. SoT must be stored separately in DB"
      });
    }
    if(s.data.cache === "dax" || s.data.cache === "both") {
      dbServices.push({
        name: "DynamoDB DAX",
        detail: lang==="ko"?"인메모리 캐시 클러스터":"In-memory cache cluster",
        reason: lang==="ko"?"DynamoDB 응답 마이크로초로 단축, 코드 변경 없음":"Reduce DynamoDB response to microseconds, no code changes",
        cost: lang==="ko"?"dax.r5.large: ~$150/월":"dax.r5.large: ~$150/mo",
        opt: lang==="ko"?"읽기 비중이 높은 테이블에만 적용. 쓰기는 DynamoDB 직접 통과":"Apply only to read-heavy tables. Writes pass directly to DynamoDB"
      });
    }
  }
  if(hasSearch) {
    dbServices.push({ name:"OpenSearch Service", detail:lang==="ko"?"Multi-AZ 배포":"Multi-AZ deployment", reason:lang==="ko"?"풀텍스트 검색, 로그 분석":"Full-text search, log analysis", cost:lang==="ko"?"t3.small: ~$30/월":"t3.small: ~$30/mo", opt:lang==="ko"?"UltraWarm/Cold Storage로 오래된 데이터 비용 절감":"Reduce old data costs with UltraWarm/Cold Storage" });
  }
  if(s.data?.storage?.includes("s3")) {
    dbServices.push({ name:"S3", detail:lang==="ko"?"퍼블릭(정적) + 프라이빗(데이터)":"Public (static) + Private (data)", reason:lang==="ko"?"오브젝트 스토리지, 무제한 확장":"Object storage, unlimited scaling", cost:lang==="ko"?"$0.023/GB/월":"$0.023/GB/mo", opt:lang==="ko"?"Intelligent-Tiering 자동화, Glacier 장기 보관":"Intelligent-Tiering automation, Glacier long-term archival" });
  }
  if(s.data?.storage?.includes("efs")) {
    dbServices.push({ name:"EFS", detail:"Multi-AZ NFS", reason:lang==="ko"?"여러 서버 동시 공유 파일":"Shared files across multiple servers", cost:"$0.30/GB/mo (Standard)", opt:lang==="ko"?"Infrequent Access 티어 활용 시 $0.016/GB":"$0.016/GB with Infrequent Access tier" });
  }
  if(s.data?.storage?.includes("ebs")) {
    dbServices.push({ name:"EBS gp3", detail:lang==="ko"?"단일 서버 전용 블록 스토리지":"Single-server block storage", reason:lang==="ko"?"DB 데이터 디렉터리, 임시 고속 연산 스토리지":"DB data directory, temporary high-speed compute storage", cost:lang==="ko"?"gp3: $0.08/GB/월":"gp3: $0.08/GB/mo", opt:lang==="ko"?"gp2 대비 gp3가 20% 저렴하고 IOPS 독립 설정 가능. io2 Block Express는 SAN급 성능":"gp3 is 20% cheaper than gp2 with independent IOPS config. io2 Block Express for SAN-level performance" });
  }

  // SaaS 워크로드 특화 서비스
  if(isSaaS) {
    dbServices.unshift(
      { name:lang==="ko"?"테넌트 격리 전략":"Tenant isolation strategy", detail:"Row-Level Security (Aurora) / Schema-per-Tenant / DB-per-Tenant", reason:lang==="ko"?"테넌트 간 데이터 누출 방지 (가장 중요한 SaaS 보안)":"Prevent cross-tenant data leakage (most critical SaaS security)", cost:lang==="ko"?"선택 전략에 따라 다름":"Varies by strategy", opt:lang==="ko"?"소규모: RLS로 단일 DB 공유. 대형 테넌트: 전용 DB 인스턴스 제공. 규정 준수: 물리 격리 필수":"Small: share single DB with RLS. Large tenants: dedicated DB instance. Compliance: physical isolation required" },
      { name:lang==="ko"?"AWS PrivateLink (테넌트 API 노출)":"AWS PrivateLink (tenant API exposure)", detail:lang==="ko"?"VPC Endpoint Service로 테넌트 VPC에 프라이빗 API 제공":"Provide private API to tenant VPC via VPC Endpoint Service", reason:lang==="ko"?"인터넷 경유 없이 테넌트 → SaaS API 안전 연결":"Secure tenant -> SaaS API connection without internet", cost:"$0.01/hr + $0.01/GB", opt:lang==="ko"?"NLB + PrivateLink 조합. 테넌트가 자기 VPC에서 Endpoint 생성 시 승인 워크플로 구성":"NLB + PrivateLink combo. Configure approval workflow when tenants create Endpoints in their VPC" },
      { name:lang==="ko"?"AWS Lake Formation (테넌트 분석)":"AWS Lake Formation (tenant analytics)", detail:lang==="ko"?"테넌트별 데이터 카탈로그 + 접근 제어":"Per-tenant data catalog + access control", reason:lang==="ko"?"멀티테넌트 데이터 분석 환경 격리":"Multi-tenant data analytics environment isolation", cost:lang==="ko"?"쿼리 비용만 과금":"Query cost only", opt:lang==="ko"?"Glue Data Catalog + Lake Formation 권한으로 테넌트별 S3 파티션 접근 제어":"Control per-tenant S3 partition access with Glue Data Catalog + Lake Formation permissions" }
    );
  }

  // IoT 워크로드 특화 서비스
  if(isIoT) {
    dbServices.unshift(
      { name:"AWS IoT Core", detail:lang==="ko"?"MQTT 브로커, 디바이스 관리":"MQTT broker, device management", reason:lang==="ko"?"수만 대 디바이스 동시 연결 관리":"Manage tens of thousands of concurrent device connections", cost:lang==="ko"?"$1/100만 메시지":"$1/1M messages", opt:lang==="ko"?"Rules Engine으로 Kinesis·Lambda·DynamoDB로 자동 라우팅":"Auto-route to Kinesis/Lambda/DynamoDB via Rules Engine" },
      { name:"Amazon Timestream", detail:lang==="ko"?"시계열 DB (센서 이력 보관)":"Time-series DB (sensor history)", reason:lang==="ko"?"시간 기반 집계·이상 탐지 쿼리에 최적화":"Optimized for time-based aggregation and anomaly detection queries", cost:lang==="ko"?"쓰기 $0.50/100만 건, 메모리 $0.036/GB·시간":"Write $0.50/1M records, memory $0.036/GB-hr", opt:lang==="ko"?"자동 데이터 티어링: 최신 인메모리 → 오래된 데이터 자동 저비용 SSD":"Auto data tiering: recent in-memory -> old data auto-moved to low-cost SSD" },
      ...(s.workload?.iot_detail === "industrial" ? [{ name:"AWS IoT Greengrass", detail:lang==="ko"?"엣지 컴퓨팅, 로컬 ML 추론":"Edge computing, local ML inference", reason:lang==="ko"?"네트워크 단절 시에도 로컬 디바이스 제어·데이터 처리 지속":"Continue local device control and data processing even during network disconnection", cost:lang==="ko"?"$0.16/디바이스/월 (코어 디바이스)":"$0.16/device/mo (core device)", opt:lang==="ko"?"Lambda 함수를 엣지에서 실행. 오프라인 시 로컬 MQTT로 디바이스 간 통신":"Run Lambda functions at edge. Local MQTT communication between devices when offline" }] : [])
    );
  }

  // 데이터 파이프라인 워크로드 특화 서비스
  if(isData) {
    dbServices.push(
      { name:"AWS Glue", detail:lang==="ko"?"서버리스 ETL + 데이터 카탈로그":"Serverless ETL + data catalog", reason:lang==="ko"?"S3 원본 데이터 변환·정제 자동화":"Automate S3 source data transformation/cleansing", cost:"$0.44/DPU-hr", opt:lang==="ko"?"Glue Data Catalog로 Athena·Redshift·EMR 메타데이터 공유":"Share Athena/Redshift/EMR metadata with Glue Data Catalog" },
      { name:"Amazon Athena", detail:lang==="ko"?"S3 위의 서버리스 SQL":"Serverless SQL on S3", reason:lang==="ko"?"별도 인프라 없이 S3 데이터 즉시 분석":"Instant S3 data analysis without separate infrastructure", cost:lang==="ko"?"$5/TB 쿼리 스캔":"$5/TB query scan", opt:lang==="ko"?"Parquet/ORC 컬럼형 포맷으로 쿼리 비용 90% 절감":"90% query cost reduction with Parquet/ORC columnar format" }
    );
    if(s.scale?.data_volume === "ptb" || s.scale?.data_volume === "tb") {
      dbServices.push({ name:"Amazon Redshift (Serverless)", detail:lang==="ko"?"클라우드 DW, 컬럼형 스토리지":"Cloud DW, columnar storage", reason:lang==="ko"?"대규모 집계 쿼리 고속 처리":"High-speed processing of large aggregate queries", cost:lang==="ko"?"사용 시간당 과금 (Serverless)":"Billed per usage hour (Serverless)", opt:lang==="ko"?"Redshift Spectrum으로 S3 데이터 직접 쿼리 (이동 없음)":"Query S3 data directly with Redshift Spectrum (no data movement)" });
    }
    if(s.workload?.data_detail === "ml_pipeline") {
      dbServices.push({ name:"Amazon SageMaker", detail:lang==="ko"?"ML 모델 학습·배포·추론 플랫폼":"ML model training, deployment, and inference platform", reason:lang==="ko"?"데이터 전처리→학습→배포 파이프라인 통합 관리":"Integrated management of data preprocessing -> training -> deployment pipeline", cost:lang==="ko"?"ml.m5.xlarge 기준 ~$0.23/시간 (학습)":"~$0.23/hr based on ml.m5.xlarge (training)", opt:lang==="ko"?"SageMaker Serverless Inference로 유휴 비용 제거. Spot Training으로 학습 비용 최대 90% 절감":"Eliminate idle costs with SageMaker Serverless Inference. Up to 90% training cost savings with Spot Training" });
    }
    if(s.workload?.data_detail === "stream_analytics" && (hasSearch || s.data?.storage?.includes("s3"))) {
      dbServices.push({ name:"Amazon Kinesis Data Firehose", detail:lang==="ko"?"스트림 → S3/OpenSearch 자동 전송":"Stream -> S3/OpenSearch auto delivery", reason:lang==="ko"?"Kinesis Data Streams 데이터를 변환·압축 후 목적지로 자동 적재":"Auto-load Kinesis Data Streams data to destination after transform/compress", cost:lang==="ko"?"$0.029/GB (수집 기준)":"$0.029/GB (ingestion)", opt:lang==="ko"?"동적 파티셔닝으로 S3 쿼리 비용 절감. 버퍼 크기/시간 조정으로 비용·지연 트레이드오프 최적화":"Reduce S3 query costs with dynamic partitioning. Optimize cost/latency trade-off by adjusting buffer size/time" });
    }
  }

  if(dbServices.length > 0) {
    layers.push({
      id:"data", label:lang==="ko"?"데이터 계층":"Data Layer", icon:"🗄️", color:"#7c3aed", bg:"#f5f3ff",
      services: dbServices,
      insights:[
        lang==="ko"?"DB는 격리 서브넷에 배치. 인터넷 접근 완전 차단":"Place DB in isolated subnets. Block all internet access",
        primaryDbs.some((db: string)=>db.startsWith("rds_")||db.startsWith("aurora")) ? (lang==="ko"?`RDS/Aurora 자동 백업 보존 기간: ${isCritical ? "35일 (최대)" : "7일 이상"} 설정. 스냅샷은 삭제 후에도 보존됨`:`RDS/Aurora auto backup retention: set to ${isCritical ? "35 days (max)" : "7+ days"}. Snapshots are retained even after deletion`) : "",
        hasCache ? (lang==="ko"?"Redis는 캐시/잠금용. SoT는 반드시 DB에 별도 저장 필수":"Redis is for cache/locking only. SoT must be stored separately in DB") : "",
        isCritical ? (lang==="ko"?"저장 데이터 암호화(KMS CMK) + 모든 쿼리 CloudTrail 로깅 필수":"Data-at-rest encryption (KMS CMK) + CloudTrail logging for all queries required") : "",
        s.slo?.rpo === "zero" ? (primaryDbs.some((d: string)=>d.startsWith("aurora")) ? (lang==="ko"?"Aurora: 트랜잭션 로그 S3 연속 백업 + PITR 활성화 필수":"Aurora: continuous S3 backup of transaction logs + PITR required") : (lang==="ko"?"⚠️ RPO=0 요건이지만 Aurora 미선택: 표준 RDS는 최대 5분 RPO. Aurora로 전환하거나 트랜잭션 로깅 전략 별도 수립 필요":"⚠️ RPO=0 required but Aurora not selected: standard RDS has max 5min RPO. Switch to Aurora or establish separate transaction logging strategy")) : "",
        s.scale?.data_volume === "ptb" ? (lang==="ko"?"수십 TB 이상: S3 Intelligent-Tiering + Lifecycle 정책으로 Glacier 자동 이관 필수 (비용 80% 절감)":"10+ TB: S3 Intelligent-Tiering + Lifecycle policy for auto Glacier migration required (80% cost savings)") : "",
        s.slo?.region === "dr" ? (lang==="ko"?"DR 전략: Aurora Global (보조 리전 읽기 전용) + S3 Cross-Region Replication 설정":"DR strategy: Aurora Global (secondary region read-only) + S3 Cross-Region Replication") : "",
        s.slo?.region === "active" ? (lang==="ko"?"Active-Active: Aurora Global + DynamoDB Global Tables 조합. 리전간 쓰기 충돌 해결 전략 필수":"Active-Active: Aurora Global + DynamoDB Global Tables combo. Cross-region write conflict resolution strategy required") : "",
        isGlobal && s.slo?.region === "active" && primaryDbs.includes("dynamodb") ? (lang==="ko"?"DynamoDB Global Tables: 리전간 복제 지연 ~1초. 충돌 방지를 위해 리전별 쓰기 파티셔닝 또는 Last-Writer-Wins 전략 설계 필수":"DynamoDB Global Tables: ~1s cross-region replication delay. Design per-region write partitioning or Last-Writer-Wins strategy to prevent conflicts") : "",
      ].filter(Boolean)
    });
  }

  // ── 6. 메시징/통합 ────────────────────────────────
  if(needsAsync && s.integration?.queue_type?.length > 0) {
    const msgServices: any[] = [];
    if(s.integration.queue_type.includes("sqs")) {
      msgServices.push({ name:"SQS", detail:(types.includes("ecommerce") || types.includes("ticketing") || isCritical) ? (lang==="ko"?"SQS FIFO + DLQ 필수 구성":"SQS FIFO + DLQ required") : (lang==="ko"?"Standard + DLQ 필수 구성":"Standard + DLQ required"), reason:lang==="ko"?"서비스 디커플링, 재시도 보장, 버퍼링":"Service decoupling, guaranteed retries, buffering", cost:lang==="ko"?"$0.40/100만 요청":"$0.40/1M requests", opt:lang==="ko"?"Long Polling으로 빈 수신 비용 제거":"Eliminate empty receive costs with Long Polling" });
    }
    if(s.integration.queue_type.includes("sns")) {
      msgServices.push({ name:"SNS", detail:lang==="ko"?"SNS→SQS 팬아웃 패턴":"SNS->SQS fan-out pattern", reason:lang==="ko"?"1→다수 이벤트 전파":"1-to-many event propagation", cost:lang==="ko"?"$0.50/100만 메시지":"$0.50/1M messages", opt:lang==="ko"?"메시지 필터링으로 SQS 분리":"Separate SQS with message filtering" });
    }
    if(s.integration.queue_type.includes("eventbridge")) {
      msgServices.push({ name:"EventBridge", detail:lang==="ko"?"이벤트 버스 + Scheduler":"Event bus + Scheduler", reason:lang==="ko"?"이벤트 라우팅, 스케줄 작업 (TTL 만료 등)":"Event routing, scheduled tasks (TTL expiry, etc.)", cost:lang==="ko"?"$1/100만 이벤트":"$1/1M events", opt:lang==="ko"?"Scheduler로 Lambda/SQS 트리거. 거의 무과금":"Trigger Lambda/SQS with Scheduler. Near zero cost" });
    }
    if(s.integration.queue_type.includes("kinesis")) {
      msgServices.push({ name:"Kinesis Data Streams", detail:lang==="ko"?"On-Demand 모드 권장":"On-Demand mode recommended", reason:lang==="ko"?"실시간 스트리밍, Replay, 다중 소비자":"Real-time streaming, replay, multiple consumers", cost:"On-Demand: $0.032/GB", opt:lang==="ko"?"Enhanced Fan-Out으로 소비자 확장":"Scale consumers with Enhanced Fan-Out" });
    }
    if(s.integration.queue_type.includes("msk")) {
      msgServices.push({ name:"MSK (Managed Kafka)", detail:lang==="ko"?"브로커 3대, Multi-AZ":"3 brokers, Multi-AZ", reason:lang==="ko"?"기존 Kafka 호환, 초고처리량":"Kafka compatible, ultra-high throughput", cost:lang==="ko"?"kafka.m5.large: ~$153/월/브로커":"kafka.m5.large: ~$153/mo/broker", opt:lang==="ko"?"MSK Serverless로 관리 부담 제거 + Tiered Storage":"Remove management burden with MSK Serverless + Tiered Storage" });
    }
    layers.push({
      id:"messaging", label:lang==="ko"?"메시징/통합":"Messaging/Integration", icon:"📨", color:"#d97706", bg:"#fffbeb",
      services: msgServices,
      insights:[
        lang==="ko"?"DLQ(Dead Letter Queue) 없는 SQS는 불완전. 반드시 설정":"SQS without DLQ (Dead Letter Queue) is incomplete. Must configure",
        s.integration.queue_type.includes("sqs") && (types.includes("ecommerce") || types.includes("ticketing") || isCritical) ? (lang==="ko"?"⚠️ 결제·주문 처리: SQS Standard → FIFO 큐 필수. Standard는 메시지 순서 미보장, 중복 발생 가능. FIFO는 초당 최대 300 TPS (Batching 시 3,000 TPS)":"⚠️ Payment/order processing: SQS Standard -> FIFO queue required. Standard has no message ordering guarantee, duplicates possible. FIFO max 300 TPS (3,000 TPS with batching)") : "",
        s.integration.queue_type.includes("sqs") ? (lang==="ko"?"결제 관련 SQS는 별도 큐 분리 + FIFO 검토":"Separate payment-related SQS into dedicated queue + consider FIFO") : "",
        lang==="ko"?"소비자 서비스 장애 시 메시지 무한 재시도 방지: maxReceiveCount 설정":"Prevent infinite message retries on consumer failure: set maxReceiveCount",
        isCritical || types.includes("ecommerce") ? (lang==="ko"?"Outbox Pattern 권장: DB 트랜잭션과 메시지 발행의 원자성 보장. Transactional Outbox → CDC(Debezium) 또는 EventBridge Pipes 활용":"Outbox Pattern recommended: guarantee atomicity of DB transactions and message publishing. Use Transactional Outbox -> CDC (Debezium) or EventBridge Pipes") : "",
      ].filter(Boolean)
    });
  }

  // ── 6.2 배치 / 워크플로 레이어 ─────────────────────────────────────
  const batchTypes = Array.isArray(s.integration?.batch_workflow)
    ? s.integration.batch_workflow.filter((v: string) => v !== "none")
    : (s.integration?.batch_workflow && s.integration.batch_workflow !== "none"
       ? [s.integration.batch_workflow] : []);

  if(batchTypes.length > 0) {
    const batchSvcs: any[] = [];
    const batchInsights: string[] = [];

    if(batchTypes.includes("eventbridge_sch")) {
      batchSvcs.push({ name:"EventBridge Scheduler", detail:lang==="ko"?"cron / rate 표현식, 타임존 지원":"cron / rate expressions, timezone support", reason:lang==="ko"?"서버 없는 정기 작업 트리거 (Lambda·ECS Task·Step Functions)":"Serverless scheduled task trigger (Lambda/ECS Task/Step Functions)", cost:lang==="ko"?"$1/100만 호출 (첫 14만 무료)":"$1/1M invocations (first 140K free)", opt:lang==="ko"?"FlexibleTimeWindow로 배치 호출 분산. 실패 시 DLQ + 재시도 정책 필수":"Distribute batch invocations with FlexibleTimeWindow. DLQ + retry policy required on failure" });
      batchInsights.push(lang==="ko"?"EventBridge Scheduler: 타임존별 스케줄 지원. 서머타임 자동 처리. IAM 역할로 타겟 서비스 실행 권한 부여":"EventBridge Scheduler: timezone-aware scheduling. Auto DST handling. Grant target service execution via IAM role");
    }
    if(batchTypes.includes("step_functions")) {
      batchSvcs.push({ name:"AWS Step Functions", detail:lang==="ko"?"상태 머신 기반 워크플로, Express·Standard 모드":"State machine-based workflow, Express/Standard modes", reason:lang==="ko"?"서비스 간 오케스트레이션, 오류 자동 재시도·보상 트랜잭션":"Cross-service orchestration, auto-retry, compensating transactions", cost:lang==="ko"?"Standard: $0.025/1000 상태전환 / Express: $1/100만 실행":"Standard: $0.025/1000 state transitions / Express: $1/1M executions", opt:lang==="ko"?"Express 모드: 고빈도 단기 워크플로 (5분 이내). Standard 모드: 장기 실행·감사 필요 워크플로":"Express mode: high-frequency short workflows (<5min). Standard mode: long-running/audit-required workflows" });
      batchInsights.push(lang==="ko"?"Step Functions: Saga 패턴 구현에 최적. 각 단계 실패 시 보상 액션(환불, 재고 복구) 자동 실행 가능":"Step Functions: optimal for Saga pattern. Auto-execute compensating actions (refunds, inventory restore) on step failure");
      batchInsights.push(lang==="ko"?"SDK 통합: Lambda 없이 DynamoDB·SQS·ECS·SNS 직접 호출 가능 (비용 절감)":"SDK integration: call DynamoDB/SQS/ECS/SNS directly without Lambda (cost savings)");
    }
    if(batchTypes.includes("aws_batch")) {
      batchSvcs.push({ name:"AWS Batch", detail:lang==="ko"?"관리형 배치 컴퓨팅, Fargate·EC2·Spot 혼합":"Managed batch computing, Fargate/EC2/Spot mix", reason:lang==="ko"?"ML 학습·유전체 분석·대용량 리포트 병렬 처리":"ML training, genomics analysis, large report parallel processing", cost:lang==="ko"?"Spot 활용 시 EC2 대비 90% 절감":"90% savings vs EC2 with Spot", opt:lang==="ko"?"우선순위 큐 + Spot 인스턴스 조합으로 비용 최소화. 체크포인팅으로 Spot 중단 복구":"Minimize cost with priority queues + Spot instances. Recover from Spot interruption with checkpointing" });
      batchInsights.push(lang==="ko"?"AWS Batch: Spot 인스턴스 중단 시 체크포인트에서 재시작. S3에 중간 결과 저장 필수":"AWS Batch: restart from checkpoint on Spot interruption. Intermediate results must be saved to S3");
    }
    if(batchTypes.includes("ecs_scheduled")) {
      batchSvcs.push({ name:"ECS Scheduled Task", detail:lang==="ko"?"EventBridge Scheduler → ECS Task 실행":"EventBridge Scheduler -> ECS Task execution", reason:lang==="ko"?"기존 컨테이너 코드 재사용, 정기 배치":"Reuse existing container code, scheduled batch", cost:lang==="ko"?"실행 시간만 과금 (Fargate)":"Billed for execution time only (Fargate)", opt:lang==="ko"?"Task 실행 실패 알람: CloudWatch Alarm + SNS. 최소 1회 실행 보장 불가 → 멱등성 설계 필수":"Task failure alarm: CloudWatch Alarm + SNS. At-least-once not guaranteed -- idempotent design required" });
    }

    if(batchSvcs.length > 0) {
      layers.push({
        id:"batch",
        label:lang==="ko"?"배치 / 워크플로":"Batch / Workflow",
        icon:"⚙️",
        color:"#7c3aed",
        bg:"#f5f3ff",
        services: batchSvcs,
        insights: batchInsights
      });
    }
  }

  // ── 6.5 DR / 멀티리전 전략 ─────
  if(s.slo?.region === "dr" || s.slo?.region === "active") {
    const drServices: any[] = [];
    const drInsights: string[] = [];
    if(s.slo?.region === "dr") {
      drServices.push(
        { name:lang==="ko"?"Aurora Global Database (보조 리전 읽기 전용)":"Aurora Global Database (secondary region read-only)", detail:lang==="ko"?"서울(Primary) → 도쿄/싱가포르(Secondary)":"Seoul (Primary) -> Tokyo/Singapore (Secondary)", reason:lang==="ko"?"리전 장애 시 1분 내 수동 페일오버":"Manual failover within 1min on region failure", cost:lang==="ko"?"추가 리전 인스턴스 비용":"Additional region instance cost", opt:lang==="ko"?"RPO < 1초. RTO는 수동 조작 포함 약 1~5분":"RPO <1s. RTO ~1-5min including manual operation" },
        { name:"S3 Cross-Region Replication (CRR)", detail:lang==="ko"?"S3 버킷 → 보조 리전 S3 자동 복제":"S3 bucket -> secondary region S3 auto-replication", reason:lang==="ko"?"파일 데이터 DR 보장":"Guarantee file data DR", cost:lang==="ko"?"$0.015/GB 복제 + 데이터 전송 비용":"$0.015/GB replication + data transfer cost", opt:lang==="ko"?"Replication Time Control(RTC)으로 15분 내 복제 SLA 보장 가능":"Guarantee 15min replication SLA with Replication Time Control (RTC)" },
        { name:lang==="ko"?"Route 53 Failover 라우팅":"Route 53 Failover routing", detail:lang==="ko"?"헬스체크 실패 → DR 리전으로 자동 DNS 전환":"Health check failure -> auto DNS switch to DR region", reason:lang==="ko"?"서비스 URL 변경 없이 DR 자동 전환":"Auto DR switch without service URL change", cost:lang==="ko"?"헬스체크 $0.50/월":"Health check $0.50/mo", opt:lang==="ko"?"TTL을 60초로 낮게 유지해야 DNS 캐시 영향 최소화":"Keep TTL at 60s to minimize DNS cache impact" }
      );
      drInsights.push(lang==="ko"?"DR 훈련(Chaos Engineering) 분기 1회 실시 권장":"Quarterly DR drill (Chaos Engineering) recommended");
      drInsights.push(lang==="ko"?"Pilot Light 패턴: DR 리전에 최소 인프라만 상시 운영 (비용 절감)":"Pilot Light pattern: maintain minimum infrastructure in DR region (cost savings)");
    } else {
      drServices.push(
        { name:lang==="ko"?"Aurora Global Database (멀티리전 Primary-Secondary)":"Aurora Global Database (multi-region Primary-Secondary)", detail:lang==="ko"?"Primary 리전 쓰기, Secondary 리전 읽기 전용 (<1초 복제)":"Primary region writes, secondary region read-only (<1s replication)", reason:lang==="ko"?"글로벌 읽기 레이턴시 최소화 + 리전 장애 시 수동 프로모션":"Minimize global read latency + manual promotion on region failure", cost:lang==="ko"?"리전별 인스턴스 비용":"Per-region instance cost", opt:lang==="ko"?"쓰기는 Primary에 집중, Secondary는 읽기 전용. 페일오버 시 수동 프로모션 필요 (RTO ~1-5분)":"Writes on Primary only, Secondary is read-only. Manual promotion needed on failover (RTO ~1-5min)" },
        { name:"DynamoDB Global Tables", detail:lang==="ko"?"멀티리전 자동 양방향 복제":"Multi-region automatic bidirectional replication", reason:lang==="ko"?"NoSQL 글로벌 동기화, RTT 최소화":"NoSQL global sync, minimize RTT", cost:lang==="ko"?"리전별 WCU·RCU 과금":"Per-region WCU/RCU billing", opt:lang==="ko"?"충돌 해결(Last-Writer-Wins) 정책 사전 설계 필수":"Conflict resolution (Last-Writer-Wins) policy pre-design required" },
        { name:lang==="ko"?"Route 53 레이턴시 기반 라우팅":"Route 53 latency-based routing", detail:lang==="ko"?"사용자 → 가장 가까운 리전 자동 연결":"Auto-connect users to nearest region", reason:lang==="ko"?"글로벌 응답 속도 최적화":"Optimize global response speed", cost:lang==="ko"?"쿼리당 $0.60/100만":"$0.60/1M queries", opt:lang==="ko"?"CloudFront + Lambda@Edge와 조합 시 엣지에서 직접 처리 가능":"Direct edge processing when combined with CloudFront + Lambda@Edge" }
      );
      drInsights.push(lang==="ko"?"Active-Active는 설계 복잡도가 매우 높습니다. 각 리전이 독립적으로 서비스 가능한지 사전 검증 필수":"Active-Active has very high design complexity. Pre-verify that each region can serve independently");
      drInsights.push(lang==="ko"?"글로벌 서비스: 리전별 GDPR 등 법적 데이터 거주 요건 반드시 확인":"Global service: verify legal data residency requirements (GDPR, etc.) per region");
    }
    layers.push({
      id:"dr", label: s.slo?.region === "active" ? (lang==="ko"?"멀티리전 / 글로벌":"Multi-region / Global") : (lang==="ko"?"DR / 재해복구":"DR / Disaster Recovery"), icon:"🌍", color:"#7c3aed", bg:"#f5f3ff",
      services: drServices,
      insights: drInsights
    });
  }

  // ── 7. 보안 ────────────────────────────────────────
  const secInsights: string[] = [];
  const secServices: any[] = [
    { name:"IAM Roles + Policies", detail:lang==="ko"?"서비스별 최소 권한 역할":"Least-privilege roles per service", reason:lang==="ko"?"키 없는 서비스 간 인증":"Keyless inter-service authentication", cost:t("net.vpc.cost"), opt:lang==="ko"?"IAM Access Analyzer로 과도한 권한 탐지 자동화":"Automate excessive permission detection with IAM Access Analyzer" },
    { name:"Security Group", detail:lang==="ko"?"ALB→앱→DB 체이닝":"ALB->App->DB chaining", reason:lang==="ko"?"레이어별 최소 허용 접근":"Minimum allowed access per layer", cost:t("net.vpc.cost"), opt:lang==="ko"?"0.0.0.0/0 인바운드 절대 금지 (ALB 제외)":"Never allow 0.0.0.0/0 inbound (except ALB)" },
    { name:"Secrets Manager", detail:lang==="ko"?"DB 자격증명, API 키":"DB credentials, API keys", reason:lang==="ko"?"환경변수 비밀 저장 금지":"Never store secrets in environment variables", cost:lang==="ko"?"$0.40/비밀/월":"$0.40/secret/mo", opt:lang==="ko"?"비용 절감 시 SSM Parameter Store Standard (무료, Advanced $0.05/개/월)":"For cost savings: SSM Parameter Store Standard (free, Advanced $0.05/param/mo)" },
  ];
  if(isCritical || s.compliance?.encryption !== "basic") {
    secServices.push({ name:"KMS (Customer Managed Key)", detail:lang==="ko"?"RDS, S3, EBS 암호화":"RDS, S3, EBS encryption", reason:lang==="ko"?"저장 데이터 암호화 + 감사 추적":"Data-at-rest encryption + audit trail", cost:lang==="ko"?"$1/키/월 + $0.03/1만 API":"$1/key/mo + $0.03/10K API", opt:lang==="ko"?"AWS Managed Key로 비용 절감 (감사 유연성 낮아짐)":"Cost savings with AWS Managed Key (less audit flexibility)" });
  }
  const certList = s.compliance?.cert || [];
  if(certList.some((c: string) => ["pci","hipaa","isms","sox","gdpr"].includes(c))) {
    const certLabel = certList.includes("pci") ? "PCI-DSS" : certList.includes("hipaa") ? "HIPAA" : certList.includes("isms") ? "ISMS" : "SOX";
    secServices.push({ name:"AWS Config + Security Hub", detail:lang==="ko"?"규정 준수 자동 모니터링":"Automated compliance monitoring", reason:lang==="ko"?`${certLabel} 컴플라이언스 지속 체크`:`${certLabel} continuous compliance checks`, cost:lang==="ko"?"~$5/활성 규칙/월":"~$5/active rule/mo", opt:lang==="ko"?"AWS Managed Rules로 빠른 시작":"Quick start with AWS Managed Rules" });
    if(certList.includes("pci")) secInsights.push(lang==="ko"?"PCI-DSS: 카드 데이터 환경(CDE) 격리, 네트워크 분할 필수. QSA 심사 별도 진행 필요":"PCI-DSS: Cardholder Data Environment (CDE) isolation, network segmentation required. Separate QSA assessment needed");
    if(certList.includes("hipaa")) secInsights.push(lang==="ko"?"HIPAA: PHI 암호화, 접근 로깅, BAA(비즈니스 제휴 계약) AWS와 체결 필수":"HIPAA: PHI encryption, access logging, BAA (Business Associate Agreement) with AWS required");
    if(certList.includes("isms")) secInsights.push(lang==="ko"?"ISMS: 접근 로그 1년 이상 보관, Config Rules로 설정 변경 모니터링, VPC Flow Logs 필수":"ISMS: retain access logs 1+ years, monitor config changes with Config Rules, VPC Flow Logs required");
    if(certList.includes("gdpr")) secInsights.push(lang==="ko"?"GDPR: EU 사용자 데이터는 반드시 EU 리전 저장. 삭제 요청(Right to Erasure) 구현 필수":"GDPR: EU user data must be stored in EU regions. Right to Erasure implementation required");
    if(certList.includes("sox")) secInsights.push(lang==="ko"?"SOX: 재무 데이터 접근 로그, IAM 직무 분리(SoD), CloudTrail 변조 방지 필수":"SOX: financial data access logs, IAM Separation of Duties (SoD), CloudTrail tamper protection required");
  }
  secServices.push({ name:"GuardDuty", detail:lang==="ko"?"ML 기반 위협 탐지":"ML-based threat detection", reason:lang==="ko"?"비정상 API 호출, 암호화폐 채굴 등 자동 탐지":"Auto-detect anomalous API calls, crypto mining, etc.", cost:lang==="ko"?"~$4/100만 이벤트":"~$4/1M events", opt:lang==="ko"?"전 계정 활성화. 비용 대비 효과 가장 높은 보안 서비스":"Enable on all accounts. Highest cost-to-value security service" });
  if(isContainer || s.compute?.arch_pattern === "serverless") {
    secServices.push({ name:"Amazon Inspector v2", detail:lang==="ko"?"ECR 이미지 + Lambda 코드 취약점 자동 스캔":"Auto-scan ECR images + Lambda code for vulnerabilities", reason:lang==="ko"?"CVE 취약점 CI/CD 파이프라인 내 자동 탐지·차단":"Auto-detect/block CVE vulnerabilities in CI/CD pipeline", cost:lang==="ko"?"컨테이너 이미지 $0.09/이미지 스캔":"Container image $0.09/image scan", opt:lang==="ko"?"ECR Push 시 자동 스캔 트리거. 심각도 HIGH 이상 이미지는 배포 게이트 차단 구성":"Auto-trigger scan on ECR Push. Block images with HIGH+ severity at deployment gate" });
  }
  if(isCritical || s.workload?.data_sensitivity === "sensitive") {
    secServices.push({ name:"Amazon Macie", detail:lang==="ko"?"S3 민감정보 자동 탐지 (PII, 카드번호 등)":"Auto-detect sensitive data in S3 (PII, card numbers, etc.)", reason:lang==="ko"?"S3에 저장된 개인정보·금융정보 노출 자동 발견":"Auto-discover exposed PII/financial data in S3", cost:lang==="ko"?"객체 모니터링 $0.10/100만 객체/월":"Object monitoring $0.10/1M objects/mo", opt:lang==="ko"?"자동 민감도 레이블 + EventBridge 연동으로 이상 감지 시 자동 격리":"Auto-quarantine on anomaly detection with auto sensitivity labels + EventBridge" });
  }
  if(s.workload?.data_sensitivity !== "public") {
    secServices.push({ name:"VPC Flow Logs", detail:lang==="ko"?"S3 또는 CloudWatch 저장":"S3 or CloudWatch storage", reason:lang==="ko"?"비정상 트래픽 탐지, 포렌식":"Anomalous traffic detection, forensics", cost:"S3 $0.25/GB (Vended Logs)", opt:lang==="ko"?"Athena로 분석. 보존 기간 설정으로 비용 제어":"Analyze with Athena. Control costs with retention settings" });
  }
  secInsights.push(lang==="ko"?"루트 계정에 MFA 즉시 활성화 + 사용 금지":"Enable MFA on root account immediately + prohibit usage");
  secInsights.push(lang==="ko"?"인바운드 0.0.0.0/0은 ALB SG에만. DB/앱 서버는 SG 참조로만 허용":"Inbound 0.0.0.0/0 only on ALB SG. DB/app servers allow only SG references");
  secInsights.push(lang==="ko"?"Network ACL(NACL): Security Group과 함께 서브넷 레벨 방어선 구성. SG는 Stateful, NACL은 Stateless — 이중 방어로 측면 이동(Lateral Movement) 차단":"Network ACL (NACL): subnet-level defense alongside Security Groups. SG is Stateful, NACL is Stateless -- dual defense blocks lateral movement");

  layers.push({
    id:"security", label:lang==="ko"?"보안":"Security", icon:"🔐", color:"#dc2626", bg:"#fef2f2",
    services: secServices,
    insights: secInsights
  });

  // ── 8. 모니터링/관측성 ────────────────────────────
  layers.push({
    id:"observability", label:lang==="ko"?"모니터링/관측성":"Monitoring/Observability", icon:"📊", color:"#374151", bg:"#f9fafb",
    services:[
      { name:"CloudWatch Metrics + Alarms", detail:lang==="ko"?"핵심 KPI 알람 설정":"Key KPI alarm configuration", reason:lang==="ko"?"시스템 상태 가시성":"System state visibility", cost:lang==="ko"?"커스텀 메트릭 $0.30/개/월":"Custom metrics $0.30/each/mo", opt:lang==="ko"?"Dashboard 3개 무료. 이후 $3/개":"3 dashboards free, then $3/each" },
      { name:"CloudWatch Logs", detail:lang==="ko"?`로그 그룹 보존 ${(s.compliance?.cert || []).some((c: string) => ["isms","pci","hipaa","sox","gdpr"].includes(c)) ? "1년+ (규정 준수 요건)" : "30~90일"}`:`Log group retention ${(s.compliance?.cert || []).some((c: string) => ["isms","pci","hipaa","sox","gdpr"].includes(c)) ? "1yr+ (compliance requirement)" : "30-90 days"}`, reason:lang==="ko"?"앱 로그 중앙 수집":"Centralized app log collection", cost:lang==="ko"?"$0.50/GB 수집 + $0.03/GB 보관":"$0.50/GB ingestion + $0.03/GB storage", opt:lang==="ko"?"보존 기간 최소화 + 오래된 로그 S3 Glacier 아카이브":"Minimize retention + archive old logs to S3 Glacier" },
      { name:"X-Ray", detail:lang==="ko"?"샘플링 5% 권장":"5% sampling recommended", reason:lang==="ko"?"분산 트레이싱, 레이턴시 병목 파악":"Distributed tracing, latency bottleneck identification", cost:lang==="ko"?"$5/100만 트레이스":"$5/1M traces", opt:lang==="ko"?"샘플링 비율 조정으로 비용 제어":"Control costs by adjusting sampling rate" },
      { name:"CloudTrail", detail:lang==="ko"?"모든 API 호출 감사":"Audit all API calls", reason:lang==="ko"?"보안 감사, 이상 행동 감지":"Security auditing, anomalous behavior detection", cost:lang==="ko"?"첫 트레일 관리 이벤트 무료, 추가 $2/10만":"First trail management events free, additional $2/100K", opt:lang==="ko"?"S3 장기 보관 + Athena 쿼리 분석":"S3 long-term storage + Athena query analysis" },
    ],
    insights:[
      lang==="ko"?`핵심 알람: CPU>80%, 메모리>85%, RDS 연결>80%, DLQ 메시지>0, ${isHighAvail ? "5xx 오류율>1%" : "5xx 오류율>5%"}`:`Key alarms: CPU>80%, Memory>85%, RDS connections>80%, DLQ messages>0, ${isHighAvail ? "5xx error rate>1%" : "5xx error rate>5%"}`,
      lang==="ko"?"알람 → SNS → Slack/PagerDuty 연동. 야간 장애 즉시 감지":"Alarms -> SNS -> Slack/PagerDuty integration. Immediate nighttime incident detection",
      lang==="ko"?"X-Ray 활성화로 마이크로서비스 간 레이턴시 병목 가시화":"Visualize inter-microservice latency bottlenecks with X-Ray",
    ]
  });

  // ── 9. CI/CD ──────────────────────────────────────
  layers.push({
    id:"cicd", label:lang==="ko"?"CI/CD / 운영":"CI/CD / Operations", icon:"🔄", color:"#0891b2", bg:"#ecfeff",
    services:[
      { name:s.cicd?.iac === "terraform" ? "Terraform" : s.cicd?.iac === "cdk" ? "AWS CDK" : s.cicd?.iac === "cfn" ? "CloudFormation" : (lang==="ko"?"IaC 미적용":"No IaC"),
        detail:lang==="ko"?"전체 인프라 코드화":"Full infrastructure as code", reason:lang==="ko"?"재현 가능, 코드 리뷰, 버전 관리":"Reproducible, code review, version control", cost:lang==="ko"?"도구 무료":"Tools free", opt:lang==="ko"?"상태 파일 S3 원격 저장 + DynamoDB 락 (Terraform)":"Remote state file in S3 + DynamoDB lock (Terraform)" },
      { name:s.cicd?.pipeline === "github" ? "GitHub Actions" : s.cicd?.pipeline === "codepipeline" ? "AWS CodePipeline + CodeBuild" : s.cicd?.pipeline === "gitlab" ? "GitLab CI/CD" : (lang==="ko"?"수동 배포":"Manual deployment"),
        detail:isServerless ? (lang==="ko"?"S3/Lambda 배포":"S3/Lambda deployment") : isVM ? "CodeDeploy -> EC2 ASG" : `ECR -> ${isK8s ? "EKS" : "ECS"} ${lang==="ko"?"배포":"deployment"}`, reason:lang==="ko"?"자동 빌드/테스트/배포":"Automated build/test/deploy", cost:s.cicd?.pipeline === "codepipeline" ? (lang==="ko"?"$1/파이프라인/월":"$1/pipeline/mo") : s.cicd?.pipeline === "none" ? (lang==="ko"?"무료 (수동)":"Free (manual)") : (lang==="ko"?"GitHub/GitLab 무료 티어 있음":"GitHub/GitLab free tier available"), opt:isServerless ? (lang==="ko"?"SAM/CDK로 Lambda 패키징 + 배포 자동화":"Automate Lambda packaging + deployment with SAM/CDK") : (lang==="ko"?"이미지 취약점 스캔 (ECR) 파이프라인 통합":"Integrate image vulnerability scanning (ECR) in pipeline") },
      { name:`${lang==="ko"?"배포 전략":"Deploy strategy"}: ${s.cicd?.deploy_strategy === "bluegreen" ? "Blue/Green" : s.cicd?.deploy_strategy === "canary" ? "Canary" : "Rolling Update"}`,
        detail:`${s.cicd?.deploy_strategy === "bluegreen" ? (lang==="ko"?"트래픽 전환, 즉각 롤백":"Traffic switch, instant rollback") : s.cicd?.deploy_strategy === "canary" ? (lang==="ko"?"5% → 100% 단계적 전환":"5% -> 100% gradual shift") : (lang==="ko"?"순차 교체":"Sequential replacement")}`,
        reason:lang==="ko"?"무중단 배포":"Zero-downtime deployment", cost:lang==="ko"?"Blue/Green은 일시적 2배 비용":"Blue/Green temporarily doubles cost", opt:s.cicd?.deploy_strategy === "bluegreen" ? (lang==="ko"?"CodeDeploy 통합으로 자동화":"Automate with CodeDeploy integration") : "" },
    ],
    insights:[
      isContainer ? (lang==="ko"?"ECR 이미지 취약점 스캔 자동화 필수 (ECR Scanning)":"ECR image vulnerability scanning automation required (ECR Scanning)") : "",
      s.network?.account_structure !== "single" ? (lang==="ko"?"교차 계정 배포: IAM Role 위임으로 키 없이 배포":"Cross-account deployment: deploy keylessly with IAM Role delegation") : "",
      s.cicd?.env_count === "four" ? (lang==="ko"?"Pre-Prod 환경에서 프로덕션 데이터 일부로 검증 후 배포":"Validate with partial production data in Pre-Prod before deployment") : "",
      s.team?.ops_model === "separate" ? (lang==="ko"?"개발/운영 분리 팀: IaC Pull Request → 운영팀 리뷰 후 머지 게이트 구성 권장":"Separate dev/ops teams: recommend IaC Pull Request -> ops team review merge gate") : "",
      s.team?.ops_model === "managed" ? (lang==="ko"?"AWS 관리형 운영: App Runner 또는 Amplify로 인프라 추상화. CodeDeploy + Elastic Beanstalk 도입 고려":"AWS managed operations: abstract infrastructure with App Runner or Amplify. Consider CodeDeploy + Elastic Beanstalk") : "",
      s.team?.ops_model === "devops" ? (lang==="ko"?"DevOps 팀: Feature Flag(LaunchDarkly 등)와 Canary 배포 조합으로 위험 없는 기능 출시 가능":"DevOps team: risk-free feature releases with Feature Flags (LaunchDarkly, etc.) + Canary deployment") : "",
    ].filter(Boolean)
  });

  // ── 10. 비용 최적화 요약 ──────────────────────────
  const costItems = [
    s.cost?.commitment !== "none"
      ? (isServerless || s.compute?.arch_pattern === "container" || s.compute?.compute_node === "fargate"
          ? (lang==="ko" ? `Compute Savings Plans ${s.cost.commitment === "3yr" ? "3년 최대 66%" : "1년 최대 50%"} 절약 (Lambda·Fargate·ECS 적용 가능. EC2 RI보다 유연)` : `Compute Savings Plans ${s.cost.commitment === "3yr" ? "3yr up to 66%" : "1yr up to 50%"} savings (applies to Lambda/Fargate/ECS. More flexible than EC2 RI)`)
          : (lang==="ko" ? `EC2 Reserved Instance ${s.cost.commitment === "3yr" ? "3년 72%" : "1년 40%"} 절약 (Compute Savings Plans와 병행 검토)` : `EC2 Reserved Instance ${s.cost.commitment === "3yr" ? "3yr 72%" : "1yr 40%"} savings (consider alongside Compute Savings Plans)`))
      : (lang==="ko"?"안정화 후 Compute Savings Plans 전환 (Fargate·Lambda는 RI 불가 → Savings Plans만 가능)":"Switch to Compute Savings Plans after stabilization (Fargate/Lambda can't use RI -- Savings Plans only)"),
    s.cost?.spot_usage !== "no" ? (lang==="ko"?"Fargate Spot/EC2 Spot: Stateless 서비스 70~90% 절약":"Fargate Spot/EC2 Spot: 70-90% savings for Stateless services") : (lang==="ko"?"Spot 미사용: 비용 최적화 기회 있음":"Spot not used: cost optimization opportunity exists"),
    hasCache ? (lang==="ko"?"캐싱으로 DB 부하 감소 → DB 인스턴스 다운사이징 가능":"Reduce DB load with caching -> DB instance downsizing possible") : "",
    hasCDN ? (lang==="ko"?"CloudFront 캐시로 오리진 트래픽/비용 최대 80% 감소":"Up to 80% origin traffic/cost reduction with CloudFront cache") : "",
    lang==="ko"?"VPC Endpoint: NAT GW 데이터전송 비용 절감 (S3/DynamoDB 무료)":"VPC Endpoint: reduce NAT GW data transfer costs (S3/DynamoDB free)",
    lang==="ko"?"Graviton/ARM 인스턴스: 동급 대비 20~40% 절감":"Graviton/ARM instances: 20-40% savings vs equivalent",
    lang==="ko"?"CloudWatch 로그 보존 기간 조정 + S3 Intelligent-Tiering":"Adjust CloudWatch log retention + S3 Intelligent-Tiering",
    lang==="ko"?"미사용 리소스 제거: Trusted Advisor 주 1회 검토":"Remove unused resources: weekly Trusted Advisor review",
  ].filter(Boolean);

  layers.push({
    id:"cost", label:lang==="ko"?"비용 최적화 전략":"Cost Optimization Strategy", icon:"💰", color:"#059669", bg:"#ecfdf5",
    services: costItems.map((item) => ({
      name: item.split(":")[0],
      detail: item.split(":").slice(1).join(":").trim(),
      reason:"", cost:"", opt:""
    })),
    insights:[
      s.cost?.priority === "cost_first" ? (lang==="ko"?"⚡ 비용 최우선 전략: Aurora 대신 RDS, ECS Fargate 대신 Spot EC2, 환경 수 최소화 권장":"Cost-first strategy: RDS instead of Aurora, Spot EC2 instead of ECS Fargate, minimize environments") :
        s.cost?.priority === "perf_first" ? (lang==="ko"?"🔒 성능/안정성 최우선: 약정 없이 On-Demand 유지, Multi-AZ 모든 레이어 적용, 예비 용량 확보 권장":"Performance/reliability first: maintain On-Demand without commitments, apply Multi-AZ to all layers, secure spare capacity") :
        (lang==="ko"?"⚖️ 균형 전략: 안정화 후 1년 RI 전환 + Spot 보조 서비스 적용으로 30~40% 절감":"Balanced strategy: switch to 1yr RI after stabilization + Spot for auxiliary services for 30-40% savings"),
      lang==="ko"?`예상 최적화 가능 절감: ${s.cost?.commitment !== "none" ? "40~72%" : "20~30%"}`:`Estimated optimization savings: ${s.cost?.commitment !== "none" ? "40-72%" : "20-30%"}`,
      lang==="ko"?"Cost Explorer 주 1회 확인 습관화":"Make weekly Cost Explorer review a habit",
      lang==="ko"?"태그(Tag) 전략: 서비스/환경/팀별 비용 분리 추적":"Tag strategy: track costs separately by service/environment/team",
    ]
  });

  // ── Well-Architected Score ─────────────────────────
  const hasCert = (s.compliance?.cert || []).some((c: string) => c !== "none");
  const hasStrictEnc = s.compliance?.encryption === "strict";
  const waScore = {
    operational: (s.cicd?.iac && s.cicd?.iac !== "none" && s.cicd?.pipeline && s.cicd?.pipeline !== "none" && (s.cicd?.deploy_strategy === "canary" || s.cicd?.env_count === "four")) ? 5
      : (s.cicd?.iac && s.cicd?.iac !== "none" && s.cicd?.pipeline && s.cicd?.pipeline !== "none") ? 4
      : (s.cicd?.iac && s.cicd?.iac !== "none") ? 3 : 2,
    security: (isCritical && hasCert && hasStrictEnc) ? 5 : (isCritical || (hasCert && isHighAvail)) ? 4 : (s.workload?.data_sensitivity === "sensitive" || hasCert) ? 3 : 2,
    reliability: (isHighAvail && s.slo?.rto === "lt1min") ? 5 : isHighAvail ? 4 : s.slo?.availability === "99.9" ? 3 : 2,
    performance: isLargeScale && hasCache ? 5 : isLargeScale ? 4 : hasCache ? 4 : 3,
    cost: s.cost?.commitment === "3yr" ? 5 : s.cost?.commitment === "1yr" ? 4 : s.cost?.spot_usage !== "no" ? 3 : 2,
    sustainability: s.compute?.arch_pattern === "serverless" ? 5 : s.compute?.compute_node === "fargate" ? 4 : 3,
  };

  return { layers, waScore };
}
