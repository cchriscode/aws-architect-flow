/* eslint-disable @typescript-eslint/no-explicit-any */
import type { WizardState } from "@/lib/types";

export function generateArchitecture(state: WizardState) {
  const s = state;

  // ── 배열 필드 헬퍼 (multi:true 전환된 필드들)
  const types        = Array.isArray(s.workload?.type) ? s.workload.type : (s.workload?.type ? [s.workload.type] : []);
  const userTypes    = Array.isArray(s.workload?.user_type) ? s.workload.user_type : (s.workload?.user_type ? [s.workload.user_type] : []);
  const trafficPats  = Array.isArray(s.scale?.traffic_pattern) ? s.scale.traffic_pattern : (s.scale?.traffic_pattern ? [s.scale.traffic_pattern] : []);
  const primaryDbs   = Array.isArray(s.data?.primary_db) ? s.data.primary_db.filter((v: string)=>v!=="none") : (s.data?.primary_db && s.data.primary_db !== "none" ? [s.data.primary_db] : []);
  const authMethods  = Array.isArray(s.integration?.auth) ? s.integration.auth.filter((v: string)=>v!=="none") : (s.integration?.auth && s.integration.auth !== "none" ? [s.integration.auth] : []);
  const hybridConns  = Array.isArray(s.network?.hybrid) ? s.network.hybrid.filter((v: string)=>v!=="no") : (s.network?.hybrid && s.network.hybrid !== "no" ? [s.network.hybrid] : []);

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
  const az = s.network?.az_count || "2az";
  const azNum = az === "3az" ? 3 : az === "1az" ? 1 : 2;
  const needsAsync = s.integration?.sync_async !== "sync_only";
  const hasCDN = s.edge?.cdn !== "no";
  const hasCache = s.data?.cache !== "no" && s.data?.cache;
  const hasSearch = s.data?.search === "opensearch";

  const layers: any[] = [];

  // ── 1. 계정/조직 ──────────────────────────────────
  layers.push({
    id:"org", label:"계정/조직 구조", icon:"🏢", color:"#374151", bg:"#f9fafb",
    services:[
      s.network?.account_structure === "org"
        ? { name:"AWS Organizations", detail:"루트 계정 + BU별 멤버 계정", reason:"중앙 정책 관리, 비용 통합", cost:"무료", opt:"SCPs로 권한 경계 설정" }
        : s.network?.account_structure === "envs"
        ? { name:"환경별 계정 분리", detail:"Prod / Stage / Dev 계정", reason:"환경 간 완전 격리, 보안 강화", cost:"무료", opt:"Control Tower로 계정 관리 자동화" }
        : { name:"단일 계정", detail:"태그 기반 환경 구분", reason:"단순한 관리", cost:"무료", opt:"성장 시 계정 분리 계획 수립" },
    ],
    insights:[
      "Prod 계정은 반드시 별도 분리 권장",
      s.network?.account_structure !== "single" ? "AWS Control Tower로 Landing Zone 자동화 가능" : "단일 계정은 IAM 정책으로 환경 격리 필수",
    ]
  });

  // ── 2. 네트워크 ────────────────────────────────────
  const isPrivateNet = s.network?.subnet_tier === "private";
  const subnetDesc = s.network?.subnet_tier === "3tier"
    ? `퍼블릭 ×${azNum} + 프라이빗 ×${azNum} + 격리 ×${azNum} (총 ${azNum*3}개)`
    : isPrivateNet
    ? `프라이빗 전용 ×${azNum} (인터넷 없음, VPN/DX 전용 접근)`
    : `퍼블릭 ×${azNum} + 프라이빗 ×${azNum} (총 ${azNum*2}개)`;
  const hasNat = !isPrivateNet && s.network?.nat_strategy;
  const natDesc = s.network?.nat_strategy === "per_az"
    ? `NAT GW ${azNum}개 (AZ당 1개, HA)` : s.network?.nat_strategy === "shared"
    ? "NAT GW 1개 (공유, 비용절감)" : s.network?.nat_strategy === "endpoint"
    ? "NAT GW 최소화 + VPC Endpoint" : null;

  layers.push({
    id:"network", label:"네트워크 설계", icon:"🌐", color:"#4f46e5", bg:"#eef2ff",
    services:[
      { name:"VPC", detail:`ap-northeast-2, /16 CIDR, ${azNum}개 AZ`, reason:"리소스 격리 경계", cost:"무료", opt:"CIDR 설계 시 미래 확장 고려" },
      { name:"서브넷 구성", detail:subnetDesc, reason:s.network?.subnet_tier === "3tier" ? "DB 완전 격리, 공격 표면 최소화" : isPrivateNet ? "인터넷 없는 완전 내부 네트워크" : "ALB 노출, 앱 격리", cost:"무료", opt:"AZ당 서브넷 CIDR /24 권장" },
      ...(natDesc ? [{ name:natDesc, detail:"프라이빗 서브넷 아웃바운드", reason:"ECR, Secrets 등 AWS 서비스 접근", cost:`~$33/월/개 + $0.045/GB`, opt:"VPC Endpoint 활용 시 NAT 비용 절감" }] : []),
      ...(isPrivateNet ? [{ name:"Transit Gateway / VPN Endpoint", detail:"사내망(VPN 또는 Direct Connect)으로만 접근", reason:"인터넷 완전 차단, 내부망 전용 라우팅", cost:"TGW $0.05/시간 + $0.02/GB", opt:"Client VPN + Mutual TLS로 원격 개발자 접근 허용" }] : []),
      { name:"VPC Endpoint", detail:"S3, ECR, SecretsManager, CloudWatch, SSM", reason:"NAT GW 우회, 보안 강화", cost:"Gateway EP 무료, Interface EP $7/월/개", opt:"S3/DynamoDB는 무료 Gateway Endpoint 우선" },
      ...(hybridConns.includes("vpn") ? [{ name:"Site-to-Site VPN", detail:"Virtual Private Gateway + CGW", reason:"온프레미스 연결", cost:"~$36/월 + 데이터전송", opt:"DR VPN으로 백업 구성 권장" }] : []),
      ...(hybridConns.includes("dx")  ? [{ name:"Direct Connect", detail:"전용선 1Gbps+", reason:"안정적 대역폭, 낮은 레이턴시", cost:"포트 시간당 과금", opt:"VPN을 백업으로 병행 구성" }] : []),
      ...(hybridConns.includes("vpn") && hybridConns.includes("dx") ? [{ name:"VPN + DX 이중화", detail:"DX 주 경로 + VPN 백업", reason:"전용선 장애 시 자동 VPN 페일오버", cost:"두 서비스 합산", opt:"BGP 우선순위로 DX 우선, 장애 시 VPN 자동 전환" }] : []),
      ...(s.network?.account_structure === "org" ? [{ name:"Transit Gateway", detail:"멀티 VPC 중앙 라우팅 허브", reason:"Organizations 멀티 계정 간 VPC 통신 중앙 관리", cost:"$0.05/시간 + $0.02/GB", opt:"RAM(Resource Access Manager)으로 계정 간 TGW 공유. Route Table 분리로 Prod/Dev 트래픽 격리" }] : []),
    ],
    insights:[
      s.network?.subnet_tier === "3tier" ? "격리 서브넷의 DB는 인터넷 완전 차단. SSM Session Manager로 접근" : "DB를 프라이빗 서브넷에만 배치",
      isPrivateNet ? "완전 프라이빗 네트워크: 모든 트래픽은 VPN/DX 경유. Internet Gateway 없음" : s.network?.nat_strategy === "per_az" ? `NAT GW ${azNum}개로 AZ 장애 시 아웃바운드 보호` : "NAT GW 공유 구성: 비용 절감이지만 단일 장애점 주의",
      "Security Group은 IP 대신 SG ID 참조로 체이닝 구성",
      s.compliance?.network_iso === "private" && s.network?.subnet_tier !== "private" ? "⚠️ 보안 요건(완전 프라이빗)과 네트워크 구성(퍼블릭 서브넷 포함)이 불일치합니다. 네트워크 설계를 '사내망 전용'으로 변경 권장" : "",
      ["strict","private"].includes(s.compliance?.network_iso) && !["3tier","private"].includes(s.network?.subnet_tier) ? "⚠️ 보안 요건(DB 완전 차단)에 비해 네트워크가 2구역 구성입니다. 3구역(public/private/isolated) 이상 권장" : "",
    ].filter(Boolean)
  });

  // ── 3. 엣지/CDN (Route 53은 CDN/WAF 없어도 항상 포함) ──────
  {
    const edgeServices = [
      { name:"Route 53", detail:`${s.edge?.dns === "health" ? "헬스체크 + 페일오버 라우팅" : s.edge?.dns === "latency" ? "레이턴시 기반 라우팅" : s.edge?.dns === "geoloc" ? "국가별 라우팅" : "기본 A레코드"}`, reason:"DNS 관리 + 도메인 라우팅", cost:"$0.50/호스팅존/월", opt:"헬스체크 + Route53 Resolver로 내부 DNS 통합" },
      { name:"AWS Certificate Manager (ACM)", detail:"ALB·CloudFront TLS 인증서 자동 발급·갱신", reason:"전송 중 암호화(TLS 1.2+) 필수. 인증서 만료 자동 갱신으로 운영 리스크 제거", cost:"퍼블릭 인증서 무료 (ALB/CloudFront 연결 시)", opt:"us-east-1 리전에 발급한 인증서만 CloudFront에서 사용 가능. 각 리전별 별도 발급 필요" },
      ...(hasCDN ? [{ name:"CloudFront", detail:"정적 파일 + 동적 캐시", reason:"오리진 트래픽 감소, 글로벌 배포", cost:"$0.120/GB (한국, 첫 10TB)", opt:"OAC(Origin Access Control)로 S3 직접 접근 차단. OAI는 Deprecated → OAC로 설정 필수" }] : []),
      ...(s.edge?.waf !== "no" ? [{ name:`WAF${s.edge?.waf === "bot" ? " + Bot Control" : s.edge?.waf === "shield" ? " + Shield Advanced" : ""}`, detail:"CloudFront/ALB 앞단", reason:`OWASP 방어${s.edge?.waf === "bot" ? ", 매크로/봇 차단" : ""}${s.edge?.waf === "shield" ? ", DDoS 방어" : ""}`, cost:s.edge?.waf === "shield" ? "$3,000/월 고정" : "~$20/월+", opt:"관리형 규칙으로 커스텀 룰 비용 절감" }] : []),
    ];
    // CloudFront Functions / Lambda@Edge (CDN 선택 시)
    if(hasCDN && (isGlobal || isSaaS || isTicketing)) {
      edgeServices.push({ name:"CloudFront Functions / Lambda@Edge", detail:"엣지 로케이션에서 요청/응답 가공", reason:`${isTicketing ? "봇 판별 헤더 주입" : isSaaS ? "테넌트별 오리진 라우팅" : "지역별 리다이렉트·A/B 테스트"}`, cost:"CloudFront Functions $0.1/100만 요청, Lambda@Edge $0.6/100만", opt:"단순 헤더 조작은 CloudFront Functions(1ms 이내), DB 조회 등 복잡한 로직은 Lambda@Edge 사용" });
    }
    // CloudWatch Synthetics (고가용성 시)
    if(isHighAvail) {
      edgeServices.push({ name:"CloudWatch Synthetics", detail:"Canary 스크립트로 API/웹 주기적 헬스체크", reason:"사용자보다 먼저 장애를 감지하는 프로액티브 모니터링", cost:"$0.0012/실행 (5분 간격 약 $5/월)", opt:"주요 API 엔드포인트별 Canary 생성. 실패 시 CloudWatch Alarm → SNS 즉시 알림" });
    }

    const edgeInsights = [
      "ALB는 퍼블릭 서브넷에, 앱 서버는 프라이빗 서브넷에 배치",
      hasCDN ? "CloudFront Origin Shield 활성화 시 오리진 보호 강화" : "",
      isTicketing ? "Bot Control 필수: 티켓팅 매크로 방어의 핵심" : "",
      s.slo?.region === "dr" ? "Route 53 Failover: 헬스체크 실패 시 DR 리전으로 자동 전환" : "",
      s.edge?.dns === "health" ? "Route 53 헬스체크 간격 10초로 설정 시 장애 감지 최대 30초" : "",
      isHighAvail ? "CloudWatch Synthetics Canary: 외부 관점에서 API 가용성을 주기적으로 검증" : "",
    ].filter(Boolean);
    layers.push({ id:"edge", label:"엣지/CDN", icon:"🚀", color:"#0891b2", bg:"#ecfeff", services:edgeServices, insights:edgeInsights });
  }

  // ── 4. 컴퓨트 ──────────────────────────────────────
  const computeServices: any[] = [];
  const lbType = s.integration?.api_type;
  const isVM = s.compute?.arch_pattern === "vm";

  // 로드밸런서 / API 입구
  if(lbType === "nlb") {
    computeServices.push({ name:"NLB (Network Load Balancer)", detail:"퍼블릭 서브넷, TCP/UDP", reason:"초저지연, WebSocket/게임/IoT 프로토콜", cost:"~$16/월 + $0.006/NLCU", opt:"Connection draining 설정으로 무중단 배포" });
  } else if(lbType === "api_gateway") {
    computeServices.push({ name:"API Gateway", detail:"REST/HTTP API", reason:"Rate Limit, 인증, Lambda 연동", cost:"$3.50/100만 요청", opt:"HTTP API가 REST API보다 70% 저렴" });
  } else if(lbType === "both") {
    computeServices.push({ name:"ALB (Application Load Balancer)", detail:"퍼블릭 서브넷, TLS 종료", reason:"HTTP/HTTPS 라우팅, 헬스체크", cost:"~$16/월 + $0.008/LCU", opt:"ALB Access Log → S3 → Athena 분석" });
    computeServices.push({ name:"API Gateway", detail:"REST/HTTP API", reason:"Rate Limit, 인증, Lambda 연동", cost:"$3.50/100만 요청", opt:"HTTP API가 REST API보다 70% 저렴" });
  } else {
    computeServices.push({ name:"ALB (Application Load Balancer)", detail:"퍼블릭 서브넷, TLS 종료", reason:"HTTP/HTTPS 라우팅, 헬스체크", cost:"~$16/월 + $0.008/LCU", opt:"ALB Access Log → S3 → Athena 분석" });
  }

  // realtime 워크로드 → WebSocket 서비스 카드 추가
  if(isRealtime) {
    if(lbType === "api_gateway") {
      computeServices.push({ name:"API Gateway WebSocket API", detail:"서버리스 WebSocket 연결 관리", reason:"연결 상태 유지, Lambda로 메시지 라우팅", cost:"$1/100만 메시지 + $0.25/100만 연결 분", opt:"connectionId로 특정 연결에 직접 메시지 전송 가능. 연결당 최대 10시간" });
    }
    if(!hasCache) {
      computeServices.push({ name:"⚠️ Redis Pub/Sub 필수", detail:"서버 간 실시간 메시지 브로드캐스트", reason:"여러 서버에 분산된 WebSocket 클라이언트에게 동시 전달 필요", cost:"ElastiCache Redis ~$100/월", opt:"Redis Pub/Sub 없이 다중 서버 운영 시 같은 서버에 붙은 사용자에게만 메시지 전달됨 (치명적 버그)" });
    } else if(!isServerless) {
      // 캐시가 있어도 Pub/Sub 설정 안내는 필요
      computeServices.push({ name:"Redis Pub/Sub 설정 필요", detail:"기존 Redis에 Pub/Sub 채널 구성", reason:"다중 서버 환경에서 WebSocket 메시지를 모든 서버에 브로드캐스트", cost:"추가 비용 없음 (기존 Redis 활용)", opt:"Redis Pub/Sub 채널 설계: 채팅방 ID 또는 토픽별 채널 분리. SUBSCRIBE/PUBLISH 패턴 구현 필수" });
    }
  }

  // 인증 레이어 - multi 지원
  if(authMethods.includes("cognito")) {
    computeServices.push({ name:"Amazon Cognito", detail:"User Pool + Identity Pool", reason:"회원가입·로그인·소셜 인증 관리형 처리", cost:"MAU 1만 무료(신규 풀), 이후 $0.0055/MAU", opt:"ALB와 직접 통합 가능. Lambda Trigger로 커스텀 인증 흐름 가능" });
  }
  if(authMethods.includes("sso")) {
    computeServices.push({ name:"IAM Identity Center (SSO)", detail:"SAML 2.0 / OIDC 연동", reason:"사내 AD·Google Workspace·Okta 통합 로그인", cost:"무료", opt:"Permission Sets로 계정·서비스별 접근 권한 중앙 관리" });
  }
  if(authMethods.includes("selfmgd")) {
    computeServices.push({ name:"자체 인증 서버 (JWT)", detail:"ECS/EC2 프라이빗 서브넷 배포", reason:"토큰 발급·검증·갱신 직접 제어", cost:"서버 운영 비용 (ECS t3.small ~$15/월)", opt:"⚠️ 보안 취약점 직접 관리 필요. RS256 알고리즘, 짧은 토큰 만료(15분), Refresh Token Rotation 구현 필수" });
  }
  if(authMethods.includes("cognito") && authMethods.includes("sso")) {
    computeServices.push({ name:"인증 이중 구조 설계 필요", detail:"Cognito(고객용) + SSO(관리자용)", reason:"사용자 유형별 인증 분리로 보안 강화", cost:"각 서비스 비용 합산", opt:"관리자 콘솔은 SSO + MFA 필수. ALB 리스너 규칙으로 /admin 경로 → SSO, 나머지 → Cognito 라우팅" });
  }

  // 서버리스
  if(isServerless || s.compute?.arch_pattern === "hybrid") {
    computeServices.push({ name:"Lambda", detail:`ARM/Graviton2, 512MB~3GB`, reason:"이벤트성 처리, 스케일-투-제로", cost:"월 100만 요청 무료", opt:"ARM 선택 시 20% 절감, PowerTuning 필수" });
    const hasRdsDb = primaryDbs.some((db: string) => db !== "dynamodb" && db !== "none");
    if(hasRdsDb) {
      computeServices.push({ name:"RDS Proxy", detail:"Lambda ↔ RDS 커넥션 풀링", reason:"Lambda 스케일업 시 RDS 커넥션 폭발 방지", cost:"db 비용의 ~3%", opt:"Lambda에서 RDS 직접 연결 금지. RDS Proxy 없으면 연결 한도 초과로 장애 발생" });
    }
  }

  // ECR: 컨테이너 패턴 시 이미지 저장소 추가
  const isContainer = !isServerless && !isVM;
  if(isContainer) {
    computeServices.push({ name:"Amazon ECR", detail:"프라이빗 컨테이너 이미지 레지스트리", reason:"빌드된 이미지를 안전하게 저장·버전 관리", cost:"$0.10/GB/월 (저장) + $0.09/GB (전송)", opt:"ECR Lifecycle Policy로 오래된 이미지 자동 삭제. Image Scanning으로 CVE 취약점 자동 탐지" });
  }

  // vm 패턴 → EC2 Auto Scaling
  if(isVM) {
    computeServices.push({ name:"EC2 Auto Scaling Group", detail:`프라이빗 서브넷, ${azNum}AZ, AMI 기반`, reason:"OS 수준 제어, 특수 인스턴스(GPU 등) 필요", cost:"인스턴스 타입별 On-Demand 과금", opt:"Launch Template 사용. RI 1년 40%, Spot Fleet으로 Stateless 70% 절약" });
    computeServices.push({ name:"Systems Manager (SSM)", detail:"Session Manager + Patch Manager", reason:"SSH 없이 서버 접근, OS 패치 자동화", cost:"무료", opt:"배스천 호스트 없이 프라이빗 EC2 직접 접근 가능" });
  } else if(!isServerless) {
    if(isK8s) {
      computeServices.push(
        { name:`EKS ${s.compute?.compute_node === "fargate" ? "Fargate" : "on EC2"}`, detail:`${azNum}AZ, 서비스 10+`, reason:"k8s 오케스트레이션, 이식성", cost:`$73/월(클러스터) + 노드비용`, opt:s.compute?.compute_node === "ec2_node" ? "Karpenter로 Spot+On-Demand 자동 혼합" : "KEDA로 이벤트 기반 스케일링" }
      );
    } else {
      computeServices.push(
        { name:`ECS Fargate`, detail:`프라이빗 서브넷, ${azNum}AZ`, reason:"컨테이너 오케스트레이션, 서버 관리 불필요", cost:"$0.04048/vCPU·시간", opt:`${s.cost?.spot_usage !== "no" ? "Fargate Spot으로 Stateless 서비스 70% 절약" : "Compute Savings Plans 1년 50% 절약"}` }
      );
    }
    if(s.compute?.compute_node === "ec2_node" || s.compute?.compute_node === "mixed") {
      computeServices.push({ name:"EC2 Auto Scaling", detail:"Graviton 인스턴스 권장", reason:"비용 최적화, 특수 인스턴스", cost:"On-Demand 기준", opt:"RI 1년 40%, Spot Fleet으로 Stateless 70% 절약" });
    }
  }

  layers.push({
    id:"compute", label:"컴퓨트 계층", icon:"⚙️", color:"#059669", bg:"#ecfdf5",
    services: computeServices,
    insights:[
      isVM ? "VM 패턴: SSM Session Manager로 배스천 호스트 없이 접근. OS 패치·AMI 갱신 자동화 필수" :
        isK8s ? `EKS 클러스터 고정 비용 $72/월. 서비스 ${isLargeScale ? "많을수록 효율↑" : "10개 미만이면 ECS가 유리"}` : "ECS Fargate는 서버 관리 없이 컨테이너 실행",
      (isK8s && s.compute?.compute_node === "ec2_node") ? "SSM Session Manager: EKS EC2 노드 디버깅에 활용. 배스천 호스트 없이 프라이빗 노드 직접 접근 가능" : "",
      !isServerless && !isVM && isLargeScale ? "ECS Service Connect: 마이크로서비스 간 HTTP/gRPC 통신에 서비스 디스커버리 + 자동 재시도 + 회로차단기 내장. App Mesh 대비 설정 단순" : "",
      isServerless && primaryDbs.some((db: string) => db !== "dynamodb") ? "⚠️ Lambda + RDS: RDS Proxy 없이 직접 연결하면 동시 Lambda 실행 시 커넥션 한도 초과로 장애 발생" : "",
      isTicketing && (!s.data?.cache || s.data.cache === "no") ? "⚠️ 티켓팅 서비스에 캐시 없음: 동시 좌석 요청 처리에 Redis SET NX(원자적 잠금)가 없으면 이중 예매가 발생합니다. Redis 도입을 강력 권장합니다." : "",
      types.includes("ecommerce") && (!s.data?.cache || s.data.cache === "no") ? "⚠️ 이커머스 재고 동시성: Redis SETNX/INCR 원자적 연산으로 재고 임시 잠금 필수. 캐시 없이 DB만 사용 시 Overselling(초과 판매) 발생" : "",
      isRealtime && s.integration?.api_type !== "nlb" ? "실시간 서비스: WebSocket 연결 유지를 위해 API Gateway WebSocket API 또는 NLB 검토 필요. ALB는 기본 유휴 타임아웃 60초 제한 있음." : "",
      isRealtime && lbType === "alb" ? "⚠️ 실시간 서비스에 ALB 사용: ALB Idle Timeout을 3600초로 늘리거나, API Gateway WebSocket API($1/100만 메시지)로 교체 권장" : "",
      s.cost?.spot_usage !== "no" ? "Spot은 Stateless 서비스에만 적용. 결제/DB 절대 금지" : "",
      (() => {
        const scalings = Array.isArray(s.compute?.scaling) ? s.compute.scaling : (s.compute?.scaling ? [s.compute.scaling] : []);
        if(isServerless) return "Lambda 자동 동시성 스케일링. Reserved Concurrency로 최대치 제한 권장";
        const parts: string[] = [];
        if(scalings.includes("ecs_asg"))   parts.push("CPU 70% 기준 Target Tracking");
        if(scalings.includes("scheduled")) parts.push("Scheduled Scaling (이벤트 전 사전 확장)");
        if(scalings.includes("keda"))      parts.push("KEDA SQS 큐 깊이 기반 정밀 확장");
        if(scalings.includes("manual"))    parts.push("수동 조절 (Auto Scaling 없음)");
        return `스케일링: ${parts.length ? parts.join(" + ") : "CPU 70% 기준 Target Tracking"}`;
      })(),
      hasSpike ? "⚡ 스파이크 트래픽: 이벤트 10분 전 Scheduled Scaling으로 사전 예열 필수. Cold Start 방지 위해 최소 인스턴스 수 확보" : "",
      isServerless && (hasSpike || isRealtime || hasBurst) ? "⚡ Lambda Cold Start 방지: Provisioned Concurrency 설정 필수. 이벤트 시작 5분 전 Application Auto Scaling으로 자동 활성화 가능 (스파이크·버스트·실시간 모두 해당)" : "",
      hasBurst && !isServerless ? "⚡ 예측 불가 버스트: ECS Fargate Spot 혼합으로 즉시 확장. CloudFront 캐시로 오리진 보호" : "",
      trafficPats.includes("business") ? "🕐 업무시간 패턴: Scheduled Scaling으로 야간/주말 인스턴스 감소 → 비용 30~50% 절감" : "",
      s.scale?.peak_rps === "ultra" ? "🚀 초당 10,000+ RPS: ALB 미리 워밍 요청(AWS 지원팀), Connection Draining 타임아웃 최적화, ECS 최소 Task 수 50+ 유지" : "",
      s.scale?.peak_rps === "high" ? "📈 초당 1,000~10,000 RPS: Auto Scaling 쿨다운 시간을 60초로 단축, 예상 피크 30분 전 사전 Scaling 이벤트 등록" : "",
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
      platformSvcs.push({ name:"Karpenter", detail:"노드 자동 프로비저닝 (EC2 직접 관리)", reason:"Cluster Autoscaler 대비 5배 빠른 스케일아웃, Spot 자동 다양화", cost:"무료 (EC2 비용만)", opt:"NodePool + EC2NodeClass로 비용 최적화. Consolidation 정책으로 낭비 노드 자동 제거" });
    } else if(np === "cluster_autoscaler") {
      platformSvcs.push({ name:"Cluster Autoscaler", detail:"Auto Scaling Group 기반 노드 확장", reason:"검증된 방법, 레퍼런스 풍부", cost:"무료", opt:"Node Group 최소/최대 설정 필수. 스케일다운 지연 10분 기본" });
    }

    // Ingress Controller
    if(ingress === "alb_controller") {
      platformSvcs.push({ name:"AWS ALB Ingress Controller", detail:"ALB를 K8s Ingress 리소스로 관리", reason:"ALB·WAF·ACM·Target Group 자동 통합", cost:"ALB 비용 ($0.008/LCU-hr)", opt:"IngressClass 분리로 내부/외부 트래픽 구분 관리" });
    } else if(ingress === "nginx") {
      platformSvcs.push({ name:"NGINX Ingress Controller", detail:"K8s 표준 Ingress, NLB 앞단 배치", reason:"멀티클라우드 이식성, 풍부한 레퍼런스", cost:"무료 (NLB 비용 별도)", opt:"ConfigMap으로 업스트림 타임아웃·버퍼 크기 조정 필수" });
    } else if(ingress === "kong") {
      platformSvcs.push({ name:"Kong Gateway (K8s)", detail:"API Gateway + Ingress 통합, KongIngress CRD", reason:"100+ 플러그인: 인증·속도제한·변환 중앙 관리", cost:"Kong OSS 무료, PostgreSQL 필요", opt:"DB-less 모드로 단순화 가능. Rate Limiting 플러그인 필수 적용" });
    } else if(ingress === "traefik") {
      platformSvcs.push({ name:"Traefik Ingress", detail:"자동 TLS, IngressRoute CRD", reason:"설정 단순, cert-manager 없이 인증서 자동 갱신", cost:"무료", opt:"Dashboard 활성화로 라우팅 규칙 시각화" });
    }

    // 서비스 메시
    if(mesh === "istio") {
      platformSvcs.push({ name:"Istio Service Mesh", detail:"Envoy 사이드카 자동 주입, mTLS 전면 적용", reason:"서비스 간 암호화·서킷브레이커·트래픽 미러링", cost:"사이드카당 CPU 50m + 메모리 128Mi 추가", opt:"PeerAuthentication STRICT 모드로 mTLS 강제. VirtualService로 카나리 배포 비율 조정" });
      platformSvcs.push({ name:"Kiali (Istio 대시보드)", detail:"서비스 토폴로지 시각화·트래픽 흐름 실시간", reason:"MSA 복잡성 가시화, 장애 지점 즉시 파악", cost:"무료", opt:"Jaeger 트레이싱과 연동 필수" });
    } else if(mesh === "aws_app_mesh") {
      platformSvcs.push({ name:"AWS App Mesh", detail:"Envoy 프록시 AWS 관리형, Virtual Service/Node", reason:"X-Ray·CloudWatch 자동 통합, 설정 단순", cost:"무료 (Envoy 리소스 비용)", opt:"Virtual Gateway로 외부 트래픽 메시 진입점 설정" });
    }

    // GitOps
    if(gitops === "argocd") {
      platformSvcs.push({ name:"ArgoCD", detail:"Git → K8s 자동 동기화, Web UI 대시보드", reason:"배포 상태 가시화, 자동 드리프트 감지·수정", cost:"무료 (설치 필요)", opt:"App of Apps 패턴으로 멀티 앱 중앙 관리. RBAC으로 팀별 배포 권한 분리" });
    } else if(gitops === "flux") {
      platformSvcs.push({ name:"Flux v2 (GitOps)", detail:"Pull 기반 GitOps, Kustomize·Helm 네이티브", reason:"경량·CLI 중심, 멀티테넌트 강점", cost:"무료", opt:"ImageUpdateAutomation으로 새 이미지 태그 감지 시 Git 자동 커밋" });
    }

    // K8s 모니터링
    if(k8sMon === "prometheus_grafana") {
      platformSvcs.push({ name:"Prometheus Operator", detail:"kube-state-metrics + node-exporter 자동 수집", reason:"K8s 표준 메트릭 스택, 무료·상세", cost:"무료 (스토리지 비용)", opt:"kube-prometheus-stack Helm 차트로 한 번에 설치" });
      platformSvcs.push({ name:"Grafana", detail:"K8s 전용 대시보드 (ID: 315, 6417)", reason:"실시간 클러스터·Pod·노드 시각화", cost:"무료 (OSS)", opt:"Grafana Loki 추가 시 로그도 함께 분석 가능" });
    } else if(k8sMon === "cloudwatch") {
      platformSvcs.push({ name:"CloudWatch Container Insights", detail:"EKS 노드·Pod·컨테이너 메트릭 자동 수집", reason:"추가 설치 없음, EKS 콘솔 통합", cost:"$0.30/커스텀 메트릭/월", opt:"Fluent Bit DaemonSet으로 컨테이너 로그 CloudWatch Logs 전송" });
    } else if(k8sMon === "hybrid") {
      platformSvcs.push({ name:"CloudWatch + Prometheus 혼합", detail:"인프라 알람은 CloudWatch, 앱 메트릭은 Prometheus", reason:"각 도구 장점 취합, 대규모 환경 표준", cost:"CloudWatch 메트릭 비용 + Prometheus 스토리지", opt:"Amazon Managed Prometheus(AMP)로 Prometheus 서버 관리 부담 제거" });
    }

    // 공통 K8s 도구
    platformSvcs.push({ name:"Helm", detail:"K8s 패키지 매니저, Chart 버전 관리", reason:"복잡한 K8s 리소스를 템플릿으로 재사용", cost:"무료", opt:"values.yaml로 환경별(dev/prod) 설정 분리" });
    platformSvcs.push({ name:"cert-manager", detail:"TLS 인증서 자동 발급·갱신 (Let's Encrypt / ACM)", reason:"인증서 만료 장애 원천 차단", cost:"무료", opt:"ClusterIssuer로 전체 네임스페이스 인증서 통합 관리" });

    const secrets    = s.platform?.k8s_secrets;
    const podSec     = s.platform?.pod_security;
    const netPol     = s.platform?.network_policy;
    const k8sBackup  = s.platform?.k8s_backup;
    const asStrategy = s.platform?.autoscaling_strategy;
    const clusterStr = s.platform?.cluster_strategy;

    // K8s Secrets 관리
    if(secrets === "external_secrets") {
      platformSvcs.push({ name:"External Secrets Operator", detail:"Secrets Manager → K8s Secret 자동 동기화", reason:"비밀값 로테이션 시 자동 반영, IRSA 권한 연동", cost:"무료 (Secrets Manager 비용 별도)", opt:"ExternalSecret 리소스에 refreshInterval 설정으로 주기적 동기화. 삭제 정책 설정 필수" });
    } else if(secrets === "secrets_csi") {
      platformSvcs.push({ name:"Secrets Store CSI Driver", detail:"비밀값 파일 마운트 방식, Parameter Store·Secrets Manager 연동", reason:"환경변수 노출 없이 파일로 안전하게 소비", cost:"무료", opt:"SecretProviderClass에 객체 타입·버전 명시. syncSecret으로 K8s Secret 병행 생성 가능" });
    } else {
      platformSvcs.push({ name:"K8s Secret (네이티브)", detail:"Base64 저장, RBAC + 암호화 설정 필요", reason:"단순 구성", cost:"무료", opt:"etcd 암호화(Envelope Encryption) + AWS KMS 연동 필수. Secret 접근 RBAC 최소 권한" });
    }

    // 정책 엔진
    if(podSec === "kyverno") {
      platformSvcs.push({ name:"Kyverno", detail:"YAML 기반 정책: 이미지 검증·라벨 자동 주입·리소스 제한 강제", reason:"OPA보다 쉬운 진입장벽, K8s 네이티브", cost:"무료", opt:"enforce 모드는 점진적 적용. audit 모드로 먼저 위반 파악 후 전환" });
    } else if(podSec === "opa_gatekeeper") {
      platformSvcs.push({ name:"OPA Gatekeeper", detail:"Rego 언어 기반 커스텀 정책, ConstraintTemplate", reason:"금융·공공 규정 준수 필수 환경, 매우 세밀한 정책", cost:"무료", opt:"정책 라이브러리(gatekeeper-library) 활용으로 빠른 시작 가능" });
    } else {
      platformSvcs.push({ name:"Pod Security Admission", detail:"K8s 내장 baseline/restricted 프로필", reason:"추가 설치 없이 기본 Pod 보안 강제", cost:"무료", opt:"네임스페이스 레이블로 적용: pod-security.kubernetes.io/enforce=restricted" });
    }

    // NetworkPolicy
    if(netPol === "vpc_cni") {
      platformSvcs.push({ name:"VPC CNI NetworkPolicy", detail:"K8s 표준 NetworkPolicy, EKS 1.25+ 네이티브", reason:"별도 플러그인 없이 Pod 간 트래픽 격리", cost:"무료", opt:"기본 deny-all 정책 먼저 적용 후 필요한 통신만 허용 (화이트리스트)" });
    } else if(netPol === "cilium") {
      platformSvcs.push({ name:"Cilium (eBPF)", detail:"L3/L4/L7 정책, eBPF 고성능, K8s NetworkPolicy 확장", reason:"iptables 없는 고성능, HTTP 경로·gRPC 메서드 레벨 정책", cost:"무료 (엔터프라이즈 유료)", opt:"Cilium Hubble로 네트워크 흐름 실시간 가시화. Tetragon 연동 시 런타임 보안" });
    }

    // K8s 백업
    if(k8sBackup === "velero") {
      platformSvcs.push({ name:"Velero", detail:"K8s 리소스 + PVC 볼륨 S3 백업·복구", reason:"클러스터 재해복구, 다른 클러스터 마이그레이션", cost:"무료 (S3 스토리지 비용)", opt:"Schedule CRD로 매일 자동 백업. 복구 테스트 정기 실행 필수" });
    }

    // HPA/VPA/KEDA
    if(asStrategy === "hpa_keda") {
      platformSvcs.push({ name:"KEDA (K8s Event Driven Autoscaling)", detail:"SQS 메시지 수·Kinesis Shard·Prometheus 메트릭 기반 확장", reason:"CPU/메모리 외 커스텀 메트릭으로 정밀한 배치 확장", cost:"무료", opt:"ScaledObject에 pollingInterval·cooldownPeriod 설정. minReplicaCount=0으로 비용 최소화 (이벤트 없을 때 0 Pod)" });
    } else if(asStrategy === "hpa_vpa") {
      platformSvcs.push({ name:"VPA (Vertical Pod Autoscaler)", detail:"Pod CPU·메모리 Requests 자동 최적화", reason:"리소스 낭비 없는 정밀 할당, 비용 절감", cost:"무료", opt:"⚠️ HPA(CPU 기준)와 VPA 동시 사용 금지. VPA를 Off 모드로 추천값만 수집 후 수동 적용 권장" });
    }

    // 클러스터 전략
    if(clusterStr === "multi_cluster") {
      platformSvcs.push({ name:"멀티 클러스터 전략", detail:"Prod 클러스터 완전 분리, EKS × 2 이상", reason:"운영/개발 완전 격리, 보안 사고 범위 최소화", cost:"클러스터당 $72/월 추가", opt:"ArgoCD ApplicationSet으로 멀티 클러스터 배포 중앙 관리. AWS Organizations SCP로 계정 분리 연동" });
    }

    const platformInsights = [
      np === "karpenter" ? "Karpenter: Spot 인터럽션 시 자동 노드 교체. PodDisruptionBudget 설정으로 중단 최소화" : "Cluster Autoscaler: Node Group min/max 설정 후 HPA와 함께 사용",
      ingress === "nginx" ? "NGINX: NLB(L4) 앞에 배치. HTTP/2, WebSocket, gRPC 모두 지원" : ingress === "kong" ? "Kong: DB 모드는 PostgreSQL RDS 필요. DB-less KongIngress 모드로 단순화 가능" : "ALB Controller: 서브넷 태그(kubernetes.io/role/elb=1) 필수",
      mesh === "istio" ? "⚠️ Istio 리소스 오버헤드: 서비스 수 × 사이드카 메모리 추가. 소규모에선 과한 복잡도" : mesh === "none" ? "서비스 메시 없음: Security Group으로 Pod 간 트래픽 제어, ECS Service Connect 대안 검토" : "",
      gitops !== "none" ? "GitOps: main 브랜치 보호 규칙 + PR 리뷰 필수. 직접 클러스터 접근 차단" : "",
      secrets === "native" ? "⚠️ K8s Secret 기본: etcd 암호화(aws-encryption-provider + KMS) 설정 필수" : secrets === "external_secrets" ? "External Secrets: IRSA로 Secrets Manager 읽기 권한만 부여. 네임스페이스별 ESO 분리 운영" : "",
      podSec === "kyverno" ? "Kyverno: 정책 위반 시 Pod 생성 거부. CI 파이프라인에서 kubectl dry-run으로 사전 검증" : podSec === "opa_gatekeeper" ? "OPA: ConstraintTemplate + Constraint 쌍으로 정책 정의. audit 로그 → CloudWatch Logs 전송" : "",
      netPol === "cilium" ? "Cilium: eBPF 기반으로 iptables 없음. kube-proxy 대체 가능. Hubble로 네트워크 흐름 실시간 모니터링" : netPol === "vpc_cni" ? "NetworkPolicy: 기본 deny-all 네임스페이스 정책 + 서비스별 허용 규칙. namespace selector로 Cross-NS 허용" : "",
      asStrategy === "hpa_vpa" ? "⚠️ HPA+VPA: VPA를 Recommender 모드로만 사용하고 수동 조정 권장. CPU 기반 HPA와 VPA 동시 적용 금지" : "",
      clusterStr === "multi_cluster" ? "멀티 클러스터: EKS 클러스터 간 직접 통신 불가. PrivateLink 또는 VPC Peering으로 서비스 엔드포인트 공유" : "",
      "kubectl 직접 접근 차단: EKS Access Entry로 IAM 기반 권한만 허용",
    ].filter(Boolean);

    if(platformSvcs.length > 0) {
      layers.push({
        id:"platform",
        label:"K8s 생태계 플랫폼",
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
    const lang = s.team?.language;
    const gw = s.appstack?.api_gateway_impl;
    const proto = s.appstack?.protocol;
    const sd = s.appstack?.service_discovery;

    const appSvcs: any[] = [];
    const appInsights: string[] = [];

    const langMap: Record<string, any> = {
      spring_boot:   { name:"Spring Boot (Java)", detail:"JVM, Spring Cloud 생태계", reason:"국내 기업 표준, 풍부한 레퍼런스", cost:"컨테이너 최소 512MB RAM 필요", opt:"컨테이너화 필수. Lambda 사용 시 GraalVM Native Image로 콜드스타트 단축 가능" },
      node_express:  { name:"Node.js / Express·Fastify", detail:"V8 엔진, 비동기 I/O 특화", reason:"Lambda·컨테이너 모두 적합, 콜드스타트 짧음", cost:"Lambda 128~256MB 충분", opt:"ESM + esbuild 번들링으로 Lambda 패키지 크기 최소화" },
      python_fastapi:{ name:"Python / FastAPI", detail:"타입 힌트, OpenAPI 자동 생성", reason:"AI/ML 연동 최적, 빠른 개발", cost:"Lambda 256MB 권장", opt:"Lambda Layer로 무거운 패키지(numpy, torch) 분리" },
      go:            { name:"Go", detail:"정적 바이너리, 메모리 효율 최상", reason:"컨테이너 이미지 10~15MB, 동시성 강점", cost:"Lambda 128MB로 충분, 컨테이너 최소 사이즈", opt:"multi-stage Docker build로 최종 이미지 최소화" },
      rust:          { name:"Rust", detail:"메모리 안전, 제로 코스트 추상화", reason:"Lambda 콜드스타트 < 1ms, 최소 메모리", cost:"Lambda 64MB로 가능", opt:"cargo lambda로 크로스 컴파일. Axum 프레임워크 권장" },
      mixed:         { name:"폴리글랏 (다중 언어)", detail:"서비스별 최적 언어 선택", reason:"각 서비스 특성에 최적화", cost:"팀 역량 분산 주의", opt:"공통 라이브러리는 Lambda Layer 또는 내부 패키지로 공유" },
    };
    if(langMap[lang]) appSvcs.push(langMap[lang]);

    if(lang === "spring_boot") {
      appInsights.push("⚠️ Spring Boot + Lambda: JVM 콜드스타트 1~3초. Lambda 최소 1GB RAM 설정, Provisioned Concurrency 필수");
      appInsights.push("Spring Boot 컨테이너: Health Check grace period 60초 이상 설정 (JVM 워밍업 시간)");
      appInsights.push("Spring Cloud Config Server → AWS AppConfig로 대체하면 관리 서버 불필요");
    } else if(lang === "go") {
      appInsights.push("Go 컨테이너 이미지: alpine 기반 멀티스테이지 빌드로 최종 10~15MB 달성. ECR 비용 최소화");
    } else if(lang === "python_fastapi") {
      appInsights.push("Python Lambda: 무거운 ML 라이브러리는 Lambda Layer 또는 컨테이너 이미지(10GB) 배포 활용");
    }

    const gwMap: Record<string, any> = {
      aws_apigw:      { name:"AWS API Gateway", detail:"인증·속도제한·CORS AWS 관리형", reason:"Lambda·ECS 통합 용이, 운영 부담 없음", cost:"$3.50/100만 요청", opt:"Usage Plan으로 파트너별 API 키 + 요청 할당량 관리" },
      alb_only:       { name:"ALB 직접 연결", detail:"컨테이너 직접 노출, 인증은 앱 처리", reason:"가장 단순·저렴한 구성", cost:"$0.008/LCU-hr", opt:"WAF 연결로 기본 보안 강화. ALB 액세스 로그 S3 저장 필수" },
      spring_gateway:  { name:"Spring Cloud Gateway", detail:"ECS/EKS에 Gateway 서비스 별도 배포", reason:"Spring Boot 생태계 표준, 코드 기반 라우팅", cost:"ECS Task 추가 (0.25vCPU, 512MB)", opt:"Circuit Breaker(Resilience4j) 내장. Redis로 Rate Limiting 구현" },
      kong:           { name:"Kong Gateway", detail:"선언형 플러그인, PostgreSQL 필요", reason:"100+ 플러그인, 중앙 API 정책 관리", cost:"PostgreSQL RDS 추가 비용", opt:"Kong Deck으로 선언형 설정 관리. Prometheus 플러그인으로 메트릭 수집" },
      nginx:          { name:"NGINX / Envoy 프록시", detail:"고성능 리버스 프록시, Lua 스크립팅", reason:"가장 낮은 레이턴시, 유연한 설정", cost:"컨테이너 리소스 최소", opt:"upstream keepalive 설정으로 커넥션 재사용. limit_req_zone으로 IP 기반 속도제한" },
    };
    if(gw && gwMap[gw]) appSvcs.push(gwMap[gw]);

    if(gw === "spring_gateway") {
      appInsights.push("Spring Cloud Gateway: ECS에 별도 서비스로 배포. 최소 2 Task 이상 (HA). 모든 트래픽이 통과하므로 High CPU 프로파일 설정");
    } else if(gw === "kong") {
      appInsights.push("Kong DB 모드: PostgreSQL RDS 필수 (Aurora PG 권장). DB 장애 시 Kong 전체 영향 → DB-less 모드 검토");
    }

    if(proto === "grpc") {
      appSvcs.push({ name:"gRPC + Protobuf", detail:"HTTP/2 바이너리, 스키마 기반 강타입", reason:"REST 대비 5~10배 성능, 타입 안전 계약", cost:"Protobuf 관리 도구 필요", opt:"gRPC-Web 또는 Envoy 변환으로 브라우저 지원. Schema Registry로 호환성 관리" });
      appInsights.push("gRPC: ALB HTTP/2 리스너 활성화 필수 (기본 비활성). 헬스체크는 gRPC Health Protocol 사용");
      appInsights.push("Protobuf 스키마: Buf CLI로 lint·breaking change 감지. buf.build 레지스트리 활용 가능");
    } else if(proto === "graphql") {
      const useAppSync = !s.team?.language || ["python_fastapi","node_express"].includes(s.team.language);
      appSvcs.push({ name: useAppSync ? "AWS AppSync (GraphQL 관리형)" : "Apollo Server (GraphQL)", detail: useAppSync ? "GraphQL API AWS 완전 관리형, DynamoDB·Lambda·RDS 직접 연결" : "GraphQL 서버 ECS/EKS 배포, DataLoader N+1 방지", reason: useAppSync ? "운영 부담 없음, 실시간 구독(WebSocket) 내장" : "스키마 퍼스트 개발, Federation으로 MSA 분산 가능", cost: useAppSync ? "$4/100만 쿼리·변이" : "컨테이너 리소스", opt: useAppSync ? "API Key·Cognito·IAM 인증 선택 가능" : "DataLoader 필수 (N+1 → Redis 캐시). Apollo Federation으로 서비스별 서브그래프 분리" });
      appInsights.push("GraphQL N+1 문제: DataLoader 패턴 필수. 미적용 시 복잡한 쿼리 한 번에 수백 개 DB 쿼리 발생");
      appInsights.push("GraphQL Depth Limit + Query Complexity 제한 설정으로 DDoS 형태 복잡 쿼리 방어");
    } else if(proto === "mixed") {
      appSvcs.push({ name:"REST (외부) + gRPC (내부 MSA)", detail:"외부 API는 REST, 내부 서비스 간은 gRPC", reason:"범용 외부 호환성 + 내부 고성능 통신", cost:"ALB HTTP/2 + REST 리스너 분리", opt:"Envoy 사이드카로 gRPC ↔ REST 변환. API Gateway는 외부 REST만 처리" });
      appInsights.push("혼합 프로토콜: Ingress 레벨에서 /api/* REST, /grpc/* gRPC 경로 분리. ALB 리스너 규칙으로 라우팅");
    }

    const sdMap: Record<string, any> = {
      k8s_dns:    { name:"K8s 내장 DNS (CoreDNS)", detail:"서비스명.네임스페이스.svc.cluster.local", reason:"EKS 자동 제공, 설정 불필요", cost:"무료", opt:"ExternalDNS로 Route 53 레코드 자동 동기화" },
      cloud_map:  { name:"AWS Cloud Map", detail:"ECS 서비스 이름 기반 디스커버리", reason:"ECS·Lambda·EC2 통합, Route 53 연동", cost:"$1/100만 쿼리", opt:"ECS Service Connect와 함께 사용 시 자동 등록" },
      eureka:     { name:"Spring Cloud Eureka", detail:"서비스 레지스트리 서버 별도 배포", reason:"Spring Boot 전통 방식, 풍부한 레퍼런스", cost:"ECS Task 추가", opt:"AWS Cloud Map으로 대체 시 관리 서버 제거 가능. 신규 프로젝트는 Cloud Map 권장" },
    };
    if(sd && sdMap[sd]) appSvcs.push(sdMap[sd]);
    if(sd === "eureka") appInsights.push("Eureka: 별도 서버 운영 부담. AWS Cloud Map + ECS Service Connect 조합으로 마이그레이션 고려");

    const apiVer = s.appstack?.api_versioning;
    if(apiVer === "url_path") {
      appSvcs.push({ name:"API 버전 관리 (URL 경로)", detail:"/v1/, /v2/ 경로 분리", reason:"명확한 버전 표현, ALB 규칙으로 라우팅", cost:"무료", opt:"구버전 deprecated 헤더 추가 후 6개월 유지·공지 → 제거" });
      appInsights.push("URL 버전: ALB 리스너 규칙에 /v1/* → 구 타겟 그룹, /v2/* → 신 타겟 그룹 분리 설정");
    } else if(apiVer === "header") {
      appSvcs.push({ name:"API 버전 관리 (헤더)", detail:"Accept-Version 헤더 기반 라우팅", reason:"URL 변경 없이 버전 분리", cost:"무료", opt:"API Gateway 스테이지 변수나 Lambda 별칭(Alias)으로 버전 라우팅 구현" });
    } else if(apiVer === "subdomain") {
      appSvcs.push({ name:"API 버전 관리 (서브도메인)", detail:"v2.api.example.com → 별도 ALB", reason:"버전별 완전 독립 배포", cost:"ACM 인증서 추가", opt:"Route 53 CNAME + 버전별 ALB 리스너. 구 버전 서브도메인은 폐기 전 301 리다이렉트" });
    }

    const schReg = s.appstack?.schema_registry;
    if(schReg === "glue_registry") {
      appSvcs.push({ name:"AWS Glue Schema Registry", detail:"Avro·JSON Schema·Protobuf 버전 관리", reason:"MSK/Kinesis 메시지 스키마 호환성 보장", cost:"무료 (SDK 사용 시)", opt:"BACKWARD 호환성 정책 권장. 스키마 변경 시 소비자 먼저 업데이트 후 생산자 변경" });
      appInsights.push("Glue Schema Registry: MSK와 자동 통합. BACKWARD/FORWARD/FULL 호환성 정책 선택 필수");
    } else if(schReg === "confluent_registry") {
      appSvcs.push({ name:"Confluent Schema Registry", detail:"Kafka 생태계 표준, REST API", reason:"풍부한 호환성 정책, 광범위한 클라이언트 지원", cost:"자체 운영 또는 Confluent Cloud", opt:"MSK와 함께 ECS에 자체 운영. Avro 직렬화로 메시지 크기 60~70% 절감" });
    }

    if(appSvcs.length > 0) {
      layers.push({
        id:"appstack",
        label:"애플리케이션 스택",
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
  const haDetail = effectiveDbHa === "multi_az" ? "Multi-AZ, 자동 페일오버 ~30초"
    : effectiveDbHa === "multi_az_read" ? "Multi-AZ + Read Replica"
    : effectiveDbHa === "global" ? "Global Database, 크로스 리전 복제"
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
        ? `RI ${s.cost.commitment === "3yr" ? "3년 최대 66%" : "1년 최대 40%"} 절약. 트래픽 변동 클 경우 Aurora Serverless v2 검토 (0.5 ACU~)`
        : "Aurora Serverless v2: 가변 트래픽에서 비용 40~60% 절감. 안정화 후 RI 전환";
    } else if(isDynamo) {
      dbOpt = isTrafficSteady
        ? "Provisioned + Auto Scaling: 예측 가능한 트래픽에서 On-Demand 대비 60~80% 절감. PITR 반드시 활성화"
        : "On-Demand 모드: 예측 불가 트래픽에 적합. PITR 활성화 필수 (35일 이내 임의 시점 복구)";
    } else if(isRds) {
      dbOpt = s.cost?.commitment !== "none"
        ? `RI ${s.cost.commitment === "3yr" ? "3년 최대 66%" : "1년 최대 40%"} 절약. 백업 보존 기간 ${isCritical ? "35일" : "7일"} 설정 필수`
        : `백업 보존 기간 ${isCritical ? "35일" : "7일"} 설정. 안정화 후 RI 전환`;
    }

    // RDS doesn't support Global Database — downgrade to cross-region read replica
    const dbHaDetail = (isRds && effectiveDbHa === "global")
      ? "크로스 리전 Read Replica, 수동 프로모션"
      : haDetail;

    dbServices.push({
      name: dbName,
      detail: isDynamo ? `${dbHaDetail.replace("Multi-AZ, ", "Global Table 가능, ")}, On-Demand/Provisioned` : `${dbHaDetail}, 격리 서브넷`,
      reason: primaryDbs.length > 1
        ? (isDynamo ? "세션·상태·실시간 NoSQL (낮은 지연)" : "트랜잭션·관계형 데이터 SoT")
        : "주요 데이터 SoT (Source of Truth)",
      cost: isAurora ? "r6g.large: ~$200/월/인스턴스" : isDynamo ? "On-Demand: 요청당 과금" : "db.t3.medium: 서울 ~$70/월",
      opt: dbOpt
    });

    if(isAurora || isRds) {
      dbServices.push({
        name: "AWS Backup",
        detail: `백업 보존 ${isCritical ? "35일" : "7일"}, 크로스 리전 복사`,
        reason: "중앙 백업 정책으로 RPO 보장, 규정 준수 감사 로그 자동화",
        cost: "스토리지 $0.05/GB/월",
        opt: "Backup Vault Lock으로 백업 변조 방지 (WORM). 복구 테스트 분기 1회 실시"
      });
    }
    if(isDynamo) {
      dbServices.push({
        name: "DynamoDB PITR + Backup",
        detail: "Point-in-Time Recovery (35일) + AWS Backup 정책",
        reason: "임의 시점 복구로 RPO 최소화. 실수로 인한 데이터 삭제 복구",
        cost: "PITR: 스토리지 비용의 약 20%",
        opt: "Global Tables 사용 시 각 리전별 PITR 개별 활성화 필요"
      });
    }
  }
  if(hasCache) {
    if(s.data.cache === "redis" || s.data.cache === "both") {
      dbServices.push({
        name: "ElastiCache Redis",
        detail: `${isHighAvail ? "Cluster Mode, Multi-AZ" : "Cluster Mode"}`,
        reason: "세션, 좌석 잠금(SET NX), Rate Limit, Pub/Sub 브로드캐스트",
        cost: "cache.r7g.large: ~$100/월",
        opt: "Redis Serverless 옵션: 비활성 시 비용 절감. 반드시 SoT는 DB에 별도 저장"
      });
    }
    if(s.data.cache === "dax" || s.data.cache === "both") {
      dbServices.push({
        name: "DynamoDB DAX",
        detail: "인메모리 캐시 클러스터",
        reason: "DynamoDB 응답 마이크로초로 단축, 코드 변경 없음",
        cost: "dax.r5.large: ~$150/월",
        opt: "읽기 비중이 높은 테이블에만 적용. 쓰기는 DynamoDB 직접 통과"
      });
    }
  }
  if(hasSearch) {
    dbServices.push({ name:"OpenSearch Service", detail:"Multi-AZ 배포", reason:"풀텍스트 검색, 로그 분석", cost:"t3.small: ~$30/월", opt:"UltraWarm/Cold Storage로 오래된 데이터 비용 절감" });
  }
  if(s.data?.storage?.includes("s3")) {
    dbServices.push({ name:"S3", detail:"퍼블릭(정적) + 프라이빗(데이터)", reason:"오브젝트 스토리지, 무제한 확장", cost:"$0.023/GB/월", opt:"Intelligent-Tiering 자동화, Glacier 장기 보관" });
  }
  if(s.data?.storage?.includes("efs")) {
    dbServices.push({ name:"EFS", detail:"Multi-AZ NFS", reason:"여러 서버 동시 공유 파일", cost:"$0.30/GB/월 (Standard)", opt:"Infrequent Access 티어 활용 시 $0.016/GB" });
  }
  if(s.data?.storage?.includes("ebs")) {
    dbServices.push({ name:"EBS gp3", detail:"단일 서버 전용 블록 스토리지", reason:"DB 데이터 디렉터리, 임시 고속 연산 스토리지", cost:"gp3: $0.08/GB/월", opt:"gp2 대비 gp3가 20% 저렴하고 IOPS 독립 설정 가능. io2 Block Express는 SAN급 성능" });
  }

  // SaaS 워크로드 특화 서비스
  if(isSaaS) {
    dbServices.unshift(
      { name:"테넌트 격리 전략", detail:"Row-Level Security(Aurora) 또는 Schema-per-Tenant 또는 DB-per-Tenant", reason:"테넌트 간 데이터 누출 방지 (가장 중요한 SaaS 보안)", cost:"선택 전략에 따라 다름", opt:"소규모: RLS로 단일 DB 공유. 대형 테넌트: 전용 DB 인스턴스 제공. 규정 준수: 물리 격리 필수" },
      { name:"AWS PrivateLink (테넌트 API 노출)", detail:"VPC Endpoint Service로 테넌트 VPC에 프라이빗 API 제공", reason:"인터넷 경유 없이 테넌트 → SaaS API 안전 연결", cost:"$0.01/시간 + $0.01/GB", opt:"NLB + PrivateLink 조합. 테넌트가 자기 VPC에서 Endpoint 생성 시 승인 워크플로 구성" },
      { name:"AWS Lake Formation (테넌트 분석)", detail:"테넌트별 데이터 카탈로그 + 접근 제어", reason:"멀티테넌트 데이터 분석 환경 격리", cost:"쿼리 비용만 과금", opt:"Glue Data Catalog + Lake Formation 권한으로 테넌트별 S3 파티션 접근 제어" }
    );
  }

  // IoT 워크로드 특화 서비스
  if(isIoT) {
    dbServices.unshift(
      { name:"AWS IoT Core", detail:"MQTT 브로커, 디바이스 관리", reason:"수만 대 디바이스 동시 연결 관리", cost:"$1/100만 메시지", opt:"Rules Engine으로 Kinesis·Lambda·DynamoDB로 자동 라우팅" },
      { name:"Amazon Timestream", detail:"시계열 DB (센서 이력 보관)", reason:"시간 기반 집계·이상 탐지 쿼리에 최적화", cost:"쓰기 $0.50/100만 건, 메모리 $0.036/GB·시간", opt:"자동 데이터 티어링: 최신 인메모리 → 오래된 데이터 자동 저비용 SSD" }
    );
  }

  // 데이터 파이프라인 워크로드 특화 서비스
  if(isData) {
    dbServices.push(
      { name:"AWS Glue", detail:"서버리스 ETL + 데이터 카탈로그", reason:"S3 원본 데이터 변환·정제 자동화", cost:"$0.44/DPU·시간", opt:"Glue Data Catalog로 Athena·Redshift·EMR 메타데이터 공유" },
      { name:"Amazon Athena", detail:"S3 위의 서버리스 SQL", reason:"별도 인프라 없이 S3 데이터 즉시 분석", cost:"$5/TB 쿼리 스캔", opt:"Parquet/ORC 컬럼형 포맷으로 쿼리 비용 90% 절감" }
    );
    if(s.scale?.data_volume === "ptb" || s.scale?.data_volume === "tb") {
      dbServices.push({ name:"Amazon Redshift (Serverless)", detail:"클라우드 DW, 컬럼형 스토리지", reason:"대규모 집계 쿼리 고속 처리", cost:"사용 시간당 과금 (Serverless)", opt:"Redshift Spectrum으로 S3 데이터 직접 쿼리 (이동 없음)" });
    }
  }

  if(dbServices.length > 0) {
    layers.push({
      id:"data", label:"데이터 계층", icon:"🗄️", color:"#7c3aed", bg:"#f5f3ff",
      services: dbServices,
      insights:[
        "DB는 격리 서브넷에 배치. 인터넷 접근 완전 차단",
        primaryDbs.some((db: string)=>db.startsWith("rds_")||db.startsWith("aurora")) ? `RDS/Aurora 자동 백업 보존 기간: ${isCritical ? "35일 (최대)" : "7일 이상"} 설정. 스냅샷은 삭제 후에도 보존됨` : "",
        hasCache ? "Redis는 캐시/잠금용. SoT는 반드시 DB에 별도 저장 필수" : "",
        isCritical ? "저장 데이터 암호화(KMS CMK) + 모든 쿼리 CloudTrail 로깅 필수" : "",
        s.slo?.rpo === "zero" ? (primaryDbs.some((d: string)=>d.startsWith("aurora")) ? "Aurora: 트랜잭션 로그 S3 연속 백업 + PITR 활성화 필수" : "⚠️ RPO=0 요건이지만 Aurora 미선택: 표준 RDS는 최대 5분 RPO. Aurora로 전환하거나 트랜잭션 로깅 전략 별도 수립 필요") : "",
        s.scale?.data_volume === "ptb" ? "수십 TB 이상: S3 Intelligent-Tiering + Lifecycle 정책으로 Glacier 자동 이관 필수 (비용 80% 절감)" : "",
        s.slo?.region === "dr" ? "DR 전략: Aurora Global (보조 리전 읽기 전용) + S3 Cross-Region Replication 설정" : "",
        s.slo?.region === "active" ? "Active-Active: Aurora Global + DynamoDB Global Tables 조합. 리전간 쓰기 충돌 해결 전략 필수" : "",
      ].filter(Boolean)
    });
  }

  // ── 6. 메시징/통합 ────────────────────────────────
  if(needsAsync && s.integration?.queue_type?.length > 0) {
    const msgServices: any[] = [];
    if(s.integration.queue_type.includes("sqs")) {
      msgServices.push({ name:"SQS", detail:"Standard + DLQ 필수 구성", reason:"서비스 디커플링, 재시도 보장, 버퍼링", cost:"$0.40/100만 요청", opt:"Long Polling으로 빈 수신 비용 제거" });
    }
    if(s.integration.queue_type.includes("sns")) {
      msgServices.push({ name:"SNS", detail:"SNS→SQS 팬아웃 패턴", reason:"1→다수 이벤트 전파", cost:"$0.50/100만 메시지", opt:"메시지 필터링으로 SQS 분리" });
    }
    if(s.integration.queue_type.includes("eventbridge")) {
      msgServices.push({ name:"EventBridge", detail:"이벤트 버스 + Scheduler", reason:"이벤트 라우팅, 스케줄 작업 (TTL 만료 등)", cost:"$1/100만 이벤트", opt:"Scheduler로 Lambda/SQS 트리거. 거의 무과금" });
    }
    if(s.integration.queue_type.includes("kinesis")) {
      msgServices.push({ name:"Kinesis Data Streams", detail:"On-Demand 모드 권장", reason:"실시간 스트리밍, Replay, 다중 소비자", cost:"On-Demand: 수집 $0.032/GB", opt:"Enhanced Fan-Out으로 소비자 확장" });
    }
    if(s.integration.queue_type.includes("msk")) {
      msgServices.push({ name:"MSK (Managed Kafka)", detail:"브로커 3대, Multi-AZ", reason:"기존 Kafka 호환, 초고처리량", cost:"kafka.m5.large: ~$153/월/브로커", opt:"MSK Serverless로 관리 부담 제거 + Tiered Storage" });
    }
    layers.push({
      id:"messaging", label:"메시징/통합", icon:"📨", color:"#d97706", bg:"#fffbeb",
      services: msgServices,
      insights:[
        "DLQ(Dead Letter Queue) 없는 SQS는 불완전. 반드시 설정",
        s.integration.queue_type.includes("sqs") && (types.includes("ecommerce") || types.includes("ticketing") || isCritical) ? "⚠️ 결제·주문 처리: SQS Standard → FIFO 큐 필수. Standard는 메시지 순서 미보장, 중복 발생 가능. FIFO는 초당 최대 300 TPS (Batching 시 3,000 TPS)" : "",
        s.integration.queue_type.includes("sqs") ? "결제 관련 SQS는 별도 큐 분리 + FIFO 검토" : "",
        "소비자 서비스 장애 시 메시지 무한 재시도 방지: maxReceiveCount 설정",
        isCritical || types.includes("ecommerce") ? "Outbox Pattern 권장: DB 트랜잭션과 메시지 발행의 원자성 보장. Transactional Outbox → CDC(Debezium) 또는 EventBridge Pipes 활용" : "",
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
      batchSvcs.push({ name:"EventBridge Scheduler", detail:"cron / rate 표현식, 타임존 지원", reason:"서버 없는 정기 작업 트리거 (Lambda·ECS Task·Step Functions)", cost:"$1/100만 호출 (첫 14만 무료)", opt:"FlexibleTimeWindow로 배치 호출 분산. 실패 시 DLQ + 재시도 정책 필수" });
      batchInsights.push("EventBridge Scheduler: 타임존별 스케줄 지원. 서머타임 자동 처리. IAM 역할로 타겟 서비스 실행 권한 부여");
    }
    if(batchTypes.includes("step_functions")) {
      batchSvcs.push({ name:"AWS Step Functions", detail:"상태 머신 기반 워크플로, Express·Standard 모드", reason:"서비스 간 오케스트레이션, 오류 자동 재시도·보상 트랜잭션", cost:"Standard: $0.025/1000 상태전환 / Express: $1/100만 실행", opt:"Express 모드: 고빈도 단기 워크플로 (5분 이내). Standard 모드: 장기 실행·감사 필요 워크플로" });
      batchInsights.push("Step Functions: Saga 패턴 구현에 최적. 각 단계 실패 시 보상 액션(환불, 재고 복구) 자동 실행 가능");
      batchInsights.push("SDK 통합: Lambda 없이 DynamoDB·SQS·ECS·SNS 직접 호출 가능 (비용 절감)");
    }
    if(batchTypes.includes("aws_batch")) {
      batchSvcs.push({ name:"AWS Batch", detail:"관리형 배치 컴퓨팅, Fargate·EC2·Spot 혼합", reason:"ML 학습·유전체 분석·대용량 리포트 병렬 처리", cost:"Spot 활용 시 EC2 대비 90% 절감", opt:"우선순위 큐 + Spot 인스턴스 조합으로 비용 최소화. 체크포인팅으로 Spot 중단 복구" });
      batchInsights.push("AWS Batch: Spot 인스턴스 중단 시 체크포인트에서 재시작. S3에 중간 결과 저장 필수");
    }
    if(batchTypes.includes("ecs_scheduled")) {
      batchSvcs.push({ name:"ECS Scheduled Task", detail:"EventBridge Scheduler → ECS Task 실행", reason:"기존 컨테이너 코드 재사용, 정기 배치", cost:"실행 시간만 과금 (Fargate)", opt:"Task 실행 실패 알람: CloudWatch Alarm + SNS. 최소 1회 실행 보장 불가 → 멱등성 설계 필수" });
    }

    if(batchSvcs.length > 0) {
      layers.push({
        id:"batch",
        label:"배치 / 워크플로",
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
        { name:"Aurora Global Database (보조 리전 읽기 전용)", detail:"서울(Primary) → 도쿄/싱가포르(Secondary)", reason:"리전 장애 시 1분 내 수동 페일오버", cost:"추가 리전 인스턴스 비용", opt:"RPO < 1초. RTO는 수동 조작 포함 약 1~5분" },
        { name:"S3 Cross-Region Replication (CRR)", detail:"S3 버킷 → 보조 리전 S3 자동 복제", reason:"파일 데이터 DR 보장", cost:"$0.015/GB 복제 + 데이터 전송 비용", opt:"Replication Time Control(RTC)으로 15분 내 복제 SLA 보장 가능" },
        { name:"Route 53 Failover 라우팅", detail:"헬스체크 실패 → DR 리전으로 자동 DNS 전환", reason:"서비스 URL 변경 없이 DR 자동 전환", cost:"헬스체크 $0.50/월", opt:"TTL을 60초로 낮게 유지해야 DNS 캐시 영향 최소화" }
      );
      drInsights.push("DR 훈련(Chaos Engineering) 분기 1회 실시 권장");
      drInsights.push("Pilot Light 패턴: DR 리전에 최소 인프라만 상시 운영 (비용 절감)");
    } else {
      drServices.push(
        { name:"Aurora Global Database (멀티리전 Active-Active)", detail:"여러 리전에서 동시 읽기·쓰기", reason:"최저 레이턴시 + 리전 장애 자동 복구", cost:"리전별 인스턴스 비용", opt:"쓰기는 Primary에 집중, Secondary는 읽기 우선 설계 권장" },
        { name:"DynamoDB Global Tables", detail:"멀티리전 자동 양방향 복제", reason:"NoSQL 글로벌 동기화, RTT 최소화", cost:"리전별 WCU·RCU 과금", opt:"충돌 해결(Last-Writer-Wins) 정책 사전 설계 필수" },
        { name:"Route 53 레이턴시 기반 라우팅", detail:"사용자 → 가장 가까운 리전 자동 연결", reason:"글로벌 응답 속도 최적화", cost:"쿼리당 $0.60/100만", opt:"CloudFront + Lambda@Edge와 조합 시 엣지에서 직접 처리 가능" }
      );
      drInsights.push("Active-Active는 설계 복잡도가 매우 높습니다. 각 리전이 독립적으로 서비스 가능한지 사전 검증 필수");
      drInsights.push("글로벌 서비스: 리전별 GDPR 등 법적 데이터 거주 요건 반드시 확인");
    }
    layers.push({
      id:"dr", label: s.slo?.region === "active" ? "멀티리전 / 글로벌" : "DR / 재해복구", icon:"🌍", color:"#7c3aed", bg:"#f5f3ff",
      services: drServices,
      insights: drInsights
    });
  }

  // ── 7. 보안 ────────────────────────────────────────
  const secInsights: string[] = [];
  const secServices: any[] = [
    { name:"IAM Roles + Policies", detail:"서비스별 최소 권한 역할", reason:"키 없는 서비스 간 인증", cost:"무료", opt:"IAM Access Analyzer로 과도한 권한 탐지 자동화" },
    { name:"Security Group", detail:"ALB→앱→DB 체이닝", reason:"레이어별 최소 허용 접근", cost:"무료", opt:"0.0.0.0/0 인바운드 절대 금지 (ALB 제외)" },
    { name:"Secrets Manager", detail:"DB 자격증명, API 키", reason:"환경변수 비밀 저장 금지", cost:"$0.40/비밀/월", opt:"비용 절감 시 SSM Parameter Store Standard (무료, Advanced $0.05/개/월)" },
  ];
  if(isCritical || s.compliance?.encryption !== "basic") {
    secServices.push({ name:"KMS (Customer Managed Key)", detail:"RDS, S3, EBS 암호화", reason:"저장 데이터 암호화 + 감사 추적", cost:"$1/키/월 + $0.03/1만 API", opt:"AWS Managed Key로 비용 절감 (감사 유연성 낮아짐)" });
  }
  const certList = s.compliance?.cert || [];
  if(certList.some((c: string) => ["pci","hipaa","isms","sox"].includes(c))) {
    const certLabel = certList.includes("pci") ? "PCI-DSS" : certList.includes("hipaa") ? "HIPAA" : certList.includes("isms") ? "ISMS" : "SOX";
    secServices.push({ name:"AWS Config + Security Hub", detail:"규정 준수 자동 모니터링", reason:`${certLabel} 컴플라이언스 지속 체크`, cost:"~$5/활성 규칙/월", opt:"AWS Managed Rules로 빠른 시작" });
    if(certList.includes("pci")) secInsights.push("PCI-DSS: 카드 데이터 환경(CDE) 격리, 네트워크 분할 필수. QSA 심사 별도 진행 필요");
    if(certList.includes("hipaa")) secInsights.push("HIPAA: PHI 암호화, 접근 로깅, BAA(비즈니스 제휴 계약) AWS와 체결 필수");
    if(certList.includes("isms")) secInsights.push("ISMS: 접근 로그 1년 이상 보관, Config Rules로 설정 변경 모니터링, VPC Flow Logs 필수");
    if(certList.includes("gdpr")) secInsights.push("GDPR: EU 사용자 데이터는 반드시 EU 리전 저장. 삭제 요청(Right to Erasure) 구현 필수");
    if(certList.includes("sox")) secInsights.push("SOX: 재무 데이터 접근 로그, IAM 직무 분리(SoD), CloudTrail 변조 방지 필수");
  }
  secServices.push({ name:"GuardDuty", detail:"ML 기반 위협 탐지", reason:"비정상 API 호출, 암호화폐 채굴 등 자동 탐지", cost:"~$4/100만 이벤트", opt:"전 계정 활성화. 비용 대비 효과 가장 높은 보안 서비스" });
  if(isContainer || s.compute?.arch_pattern === "serverless") {
    secServices.push({ name:"Amazon Inspector v2", detail:"ECR 이미지 + Lambda 코드 취약점 자동 스캔", reason:"CVE 취약점 CI/CD 파이프라인 내 자동 탐지·차단", cost:"컨테이너 이미지 $0.09/이미지 스캔", opt:"ECR Push 시 자동 스캔 트리거. 심각도 HIGH 이상 이미지는 배포 게이트 차단 구성" });
  }
  if(isCritical || s.workload?.data_sensitivity === "sensitive") {
    secServices.push({ name:"Amazon Macie", detail:"S3 민감정보 자동 탐지 (PII, 카드번호 등)", reason:"S3에 저장된 개인정보·금융정보 노출 자동 발견", cost:"객체 모니터링 $0.10/100만 객체/월", opt:"자동 민감도 레이블 + EventBridge 연동으로 이상 감지 시 자동 격리" });
  }
  if(s.workload?.data_sensitivity !== "public") {
    secServices.push({ name:"VPC Flow Logs", detail:"S3 또는 CloudWatch 저장", reason:"비정상 트래픽 탐지, 포렌식", cost:"S3 전송 $0.25/GB (Vended Logs)", opt:"Athena로 분석. 보존 기간 설정으로 비용 제어" });
  }
  secInsights.push("루트 계정에 MFA 즉시 활성화 + 사용 금지");
  secInsights.push("인바운드 0.0.0.0/0은 ALB SG에만. DB/앱 서버는 SG 참조로만 허용");
  secInsights.push("Network ACL(NACL): Security Group과 함께 서브넷 레벨 방어선 구성. SG는 Stateful, NACL은 Stateless — 이중 방어로 측면 이동(Lateral Movement) 차단");

  layers.push({
    id:"security", label:"보안", icon:"🔐", color:"#dc2626", bg:"#fef2f2",
    services: secServices,
    insights: secInsights
  });

  // ── 8. 모니터링/관측성 ────────────────────────────
  layers.push({
    id:"observability", label:"모니터링/관측성", icon:"📊", color:"#374151", bg:"#f9fafb",
    services:[
      { name:"CloudWatch Metrics + Alarms", detail:"핵심 KPI 알람 설정", reason:"시스템 상태 가시성", cost:"커스텀 메트릭 $0.30/개/월", opt:"Dashboard 3개 무료. 이후 $3/개" },
      { name:"CloudWatch Logs", detail:`로그 그룹 보존 ${(s.compliance?.cert || []).some((c: string) => ["isms","pci","hipaa","sox","gdpr"].includes(c)) ? "1년+ (규정 준수 요건)" : "30~90일"}`, reason:"앱 로그 중앙 수집", cost:"$0.50/GB 수집 + $0.03/GB 보관", opt:"보존 기간 최소화 + 오래된 로그 S3 Glacier 아카이브" },
      { name:"X-Ray", detail:"샘플링 5% 권장", reason:"분산 트레이싱, 레이턴시 병목 파악", cost:"$5/100만 트레이스", opt:"샘플링 비율 조정으로 비용 제어" },
      { name:"CloudTrail", detail:"모든 API 호출 감사", reason:"보안 감사, 이상 행동 감지", cost:"첫 트레일 관리 이벤트 무료, 추가 $2/10만", opt:"S3 장기 보관 + Athena 쿼리 분석" },
    ],
    insights:[
      `핵심 알람: CPU>80%, 메모리>85%, RDS 연결>80%, DLQ 메시지>0, ${isHighAvail ? "5xx 오류율>1%" : "5xx 오류율>5%"}`,
      "알람 → SNS → Slack/PagerDuty 연동. 야간 장애 즉시 감지",
      "X-Ray 활성화로 마이크로서비스 간 레이턴시 병목 가시화",
    ]
  });

  // ── 9. CI/CD ──────────────────────────────────────
  layers.push({
    id:"cicd", label:"CI/CD / 운영", icon:"🔄", color:"#0891b2", bg:"#ecfeff",
    services:[
      { name:s.cicd?.iac === "terraform" ? "Terraform" : s.cicd?.iac === "cdk" ? "AWS CDK" : s.cicd?.iac === "cfn" ? "CloudFormation" : "IaC 미적용",
        detail:"전체 인프라 코드화", reason:"재현 가능, 코드 리뷰, 버전 관리", cost:"도구 무료", opt:"상태 파일 S3 원격 저장 + DynamoDB 락 (Terraform)" },
      { name:s.cicd?.pipeline === "github" ? "GitHub Actions" : s.cicd?.pipeline === "codepipeline" ? "AWS CodePipeline + CodeBuild" : s.cicd?.pipeline === "gitlab" ? "GitLab CI/CD" : "수동 배포",
        detail:isServerless ? "S3/Lambda 배포" : isVM ? "CodeDeploy → EC2 ASG" : `ECR → ${isK8s ? "EKS" : "ECS"} 배포`, reason:"자동 빌드/테스트/배포", cost:s.cicd?.pipeline === "codepipeline" ? "$1/파이프라인/월" : s.cicd?.pipeline === "none" ? "무료 (수동)" : "GitHub/GitLab 무료 티어 있음", opt:isServerless ? "SAM/CDK로 Lambda 패키징 + 배포 자동화" : "이미지 취약점 스캔 (ECR) 파이프라인 통합" },
      { name:`배포 전략: ${s.cicd?.deploy_strategy === "bluegreen" ? "Blue/Green" : s.cicd?.deploy_strategy === "canary" ? "Canary" : "Rolling Update"}`,
        detail:`${s.cicd?.deploy_strategy === "bluegreen" ? "트래픽 전환, 즉각 롤백" : s.cicd?.deploy_strategy === "canary" ? "5% → 100% 단계적 전환" : "순차 교체"}`,
        reason:"무중단 배포", cost:"Blue/Green은 일시적 2배 비용", opt:s.cicd?.deploy_strategy === "bluegreen" ? "CodeDeploy 통합으로 자동화" : "" },
    ],
    insights:[
      isContainer ? "ECR 이미지 취약점 스캔 자동화 필수 (ECR Scanning)" : "",
      s.network?.account_structure !== "single" ? "교차 계정 배포: IAM Role 위임으로 키 없이 배포" : "",
      s.cicd?.env_count === "four" ? "Pre-Prod 환경에서 프로덕션 데이터 일부로 검증 후 배포" : "",
      s.team?.ops_model === "separate" ? "개발/운영 분리 팀: IaC Pull Request → 운영팀 리뷰 후 머지 게이트 구성 권장" : "",
      s.team?.ops_model === "managed" ? "AWS 관리형 운영: App Runner 또는 Amplify로 인프라 추상화. CodeDeploy + Elastic Beanstalk 도입 고려" : "",
      s.team?.ops_model === "devops" ? "DevOps 팀: Feature Flag(LaunchDarkly 등)와 Canary 배포 조합으로 위험 없는 기능 출시 가능" : "",
    ].filter(Boolean)
  });

  // ── 10. 비용 최적화 요약 ──────────────────────────
  const costItems = [
    s.cost?.commitment !== "none"
      ? (isServerless || s.compute?.arch_pattern === "container" || s.compute?.compute_node === "fargate"
          ? `Compute Savings Plans ${s.cost.commitment === "3yr" ? "3년 최대 66%" : "1년 최대 50%"} 절약 (Lambda·Fargate·ECS 적용 가능. EC2 RI보다 유연)`
          : `EC2 Reserved Instance ${s.cost.commitment === "3yr" ? "3년 72%" : "1년 40%"} 절약 (Compute Savings Plans와 병행 검토)`)
      : "안정화 후 Compute Savings Plans 전환 (Fargate·Lambda는 RI 불가 → Savings Plans만 가능)",
    s.cost?.spot_usage !== "no" ? "Fargate Spot/EC2 Spot: Stateless 서비스 70~90% 절약" : "Spot 미사용: 비용 최적화 기회 있음",
    hasCache ? "캐싱으로 DB 부하 감소 → DB 인스턴스 다운사이징 가능" : "",
    hasCDN ? "CloudFront 캐시로 오리진 트래픽/비용 최대 80% 감소" : "",
    "VPC Endpoint: NAT GW 데이터전송 비용 절감 (S3/DynamoDB 무료)",
    "Graviton/ARM 인스턴스: 동급 대비 20~40% 절감",
    "CloudWatch 로그 보존 기간 조정 + S3 Intelligent-Tiering",
    "미사용 리소스 제거: Trusted Advisor 주 1회 검토",
  ].filter(Boolean);

  layers.push({
    id:"cost", label:"비용 최적화 전략", icon:"💰", color:"#059669", bg:"#ecfdf5",
    services: costItems.map((item) => ({
      name: item.split(":")[0],
      detail: item.split(":").slice(1).join(":").trim(),
      reason:"", cost:"", opt:""
    })),
    insights:[
      s.cost?.priority === "cost_first" ? "⚡ 비용 최우선 전략: Aurora 대신 RDS, ECS Fargate 대신 Spot EC2, 환경 수 최소화 권장" :
        s.cost?.priority === "perf_first" ? "🔒 성능/안정성 최우선: 약정 없이 On-Demand 유지, Multi-AZ 모든 레이어 적용, 예비 용량 확보 권장" :
        "⚖️ 균형 전략: 안정화 후 1년 RI 전환 + Spot 보조 서비스 적용으로 30~40% 절감",
      `예상 최적화 가능 절감: ${s.cost?.commitment !== "none" ? "40~72%" : "20~30%"}`,
      "Cost Explorer 주 1회 확인 습관화",
      "태그(Tag) 전략: 서비스/환경/팀별 비용 분리 추적",
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
