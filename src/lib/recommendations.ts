/* eslint-disable @typescript-eslint/no-explicit-any */
import type { WizardState, Recommendation } from "@/lib/types";
import { toArray } from "@/lib/shared";

/**
 * getRecommendations -- returns recommendation badges for each wizard option.
 * Keys are "phase.questionId.optionValue", e.g. "compute.orchestration.eks"
 */
export function getRecommendations(
  state: WizardState,
  lang: "ko" | "en" = "ko"
): Record<string, Recommendation> {
  const recs: Record<string, Recommendation> = {};
  const badgePriority = (b: string) => b.startsWith("\u2B50") ? 0 : b.startsWith("\u2728") ? 1 : 2;
  const t = (ko: string, en: string) => lang === "ko" ? ko : en;
  const R = (
    phase: string,
    q: string,
    val: string,
    badge: string,
    reason: string
  ) => {
    const key = `${phase}.${q}.${val}`;
    const existing = recs[key];
    if (existing) {
      // Keep highest-priority badge, accumulate reasons
      const useBadge = badgePriority(badge) < badgePriority(existing.badge) ? badge : existing.badge;
      recs[key] = { badge: useBadge, reason: `${existing.reason} / ${reason}` };
    } else {
      recs[key] = { badge, reason };
    }
  };

  const types = toArray(state.workload?.type);
  const dau: string | undefined = state.scale?.dau;
  const rps: string | undefined = state.scale?.peak_rps;
  const pattern = toArray(state.scale?.traffic_pattern);
  const vol: string | undefined = state.scale?.data_volume;
  const teamSize: string | undefined = state.team?.team_size;
  const exp: string | undefined = state.team?.cloud_exp;
  const ops: string | undefined = state.team?.ops_model;
  const avail: string | undefined = state.slo?.availability;
  const cert = toArray(state.compliance?.cert);
  const dataS: string | undefined = state.workload?.data_sensitivity;
  const stage: string | undefined = state.workload?.growth_stage;
  const bizModel: string | undefined = state.workload?.business_model;
  const userTypes = toArray(state.workload?.user_type);
  const ecomD: string | undefined = state.workload?.ecommerce_detail;
  const tickD: string | undefined = state.workload?.ticketing_detail;
  const dataD: string | undefined = state.workload?.data_detail;
  const iotD: string | undefined = state.workload?.iot_detail;
  const orchestr: string | undefined = state.compute?.orchestration;
  const region: string | undefined = state.slo?.region;

  const costPriority = state.cost?.priority;
  const isCostFirst = costPriority === "cost_first";
  const isPerfFirst = costPriority === "perf_first";

  const isXL = dau === "xlarge";
  const isLarge = dau === "large" || isXL;
  const isMedPlus = dau === "medium" || isLarge;
  const isSmall = dau === "tiny" || dau === "small";
  const isMVP = stage === "mvp";
  const isMature = stage === "mature" || stage === "scale";
  const isHighRPS = rps === "high" || rps === "ultra";
  const isUltraRPS = rps === "ultra";
  const isHighAvail = avail === "99.95" || avail === "99.99";
  const hasCritCert = cert.some((c) => ["pci", "hipaa", "sox"].includes(c));
  const hasPersonal = dataS === "sensitive" || dataS === "critical";
  const isCritData = dataS === "critical";
  const isGlobal = userTypes.includes("global");
  const isB2B = userTypes.includes("b2b") || types.includes("saas");
  const isTx =
    bizModel === "transaction" ||
    types.includes("ecommerce") ||
    types.includes("ticketing");
  const isEks = orchestr === "eks";
  const isSpiky = pattern.includes("spike") || pattern.includes("burst");
  const isSteady = pattern.includes("steady");
  const isIoT = types.includes("iot");
  const isData = types.includes("data");
  const isRT = types.includes("realtime");
  const isTick = types.includes("ticketing");
  const isEcom = types.includes("ecommerce");
  const isSaaS = types.includes("saas");
  const isWebApi = types.includes("web_api");
  const isInternal =
    types.includes("internal") &&
    !types.some((tp) =>
      ["ecommerce", "ticketing", "realtime", "saas"].includes(tp)
    );
  const isFlash = tickD === "flash" || tickD === "concert";
  const begOrSolo = exp === "beginner" || teamSize === "solo";
  const seniorLarge =
    exp === "senior" && (teamSize === "large" || teamSize === "medium");

  // ── SCALE ──────────────────────────────────────────────────────
  if (isMVP || (bizModel === "internal_tool" && !isMedPlus))
    R("scale","dau","tiny",t("✨ MVP/사내 도구 적정","✨ Ideal for MVP/internal tools"),t("검증 단계에는 초소형부터 시작해 트래픽에 맞게 확장하는 것이 비용 효율적입니다","Starting extra-small during validation and scaling with traffic is the most cost-effective approach"));
  if (isEcom && !isLarge)
    R("scale","dau","small",t("✨ 초기 이커머스 적정","✨ Ideal for early e-commerce"),t("스타트업 이커머스 초기 규모. ECS + Aurora로 시작해 트래픽에 맞게 확장하세요","Early-stage e-commerce scale. Start with ECS + Aurora and scale as traffic grows"));
  if ((isEcom || isSaaS) && !isLarge)
    R("scale","dau","medium",t("✨ 성장기 서비스 적정","✨ Ideal for growth-stage services"),t("DAU 1~10만: Redis 캐시 도입이 필수가 되는 시점입니다","DAU 10K-100K: This is the point where Redis caching becomes essential"));
  if (isLarge && !isXL)
    R("scale","dau","large",t("⭐ 설계 필요 시점","⭐ Architecture design needed"),t("DAU 100만은 MSA 전환 + Aurora Global + EKS 도입 검토 시점입니다","DAU 1M is the point to consider microservices migration + Aurora Global + EKS adoption"));
  if (isXL || (isTick && isFlash) || (isEcom && ecomD === "marketplace"))
    R("scale","dau","xlarge",t("⭐ 전담 인프라팀 필요","⭐ Dedicated infra team required"),t("이 규모는 아키텍처 결정 하나가 월 수천만원 비용 차이를 냅니다","At this scale, a single architecture decision can mean millions in monthly cost difference"));

  if (isInternal || isMVP)
    R("scale","peak_rps","low",t("✨ 사내 도구 적정","✨ Ideal for internal tools"),t("초당 100 이하: 단일 서버로 충분. 오버 엔지니어링 금물","Under 100 RPS: A single server is sufficient. Avoid over-engineering"));
  if (!isHighRPS)
    R("scale","peak_rps","mid",t("✨ 일반 웹 서비스 기준","✨ Standard web service baseline"),t("초당 100~1000: ALB + ECS Fargate 기본 구성으로 충분합니다","100-1000 RPS: A basic ALB + ECS Fargate setup is sufficient"));
  if ((isEcom || isRT || isSaaS) && !isUltraRPS)
    R("scale","peak_rps","high",t("✨ 캐시 필수 시점","✨ Cache becomes essential"),t("초당 1000+: Redis 캐시 없이 DB 직접 쿼리 시 DB가 병목이 됩니다","1000+ RPS: Direct DB queries without Redis cache will make the DB a bottleneck"));
  if (isTick || isFlash || isUltraRPS)
    R("scale","peak_rps","ultra",t("⭐ 극한 동시성 대비 필요","⭐ Extreme concurrency prep needed"),t("초당 1만+: DynamoDB + Redis + CloudFront 조합 없이는 DB/서버 붕괴","10K+ RPS: Database/server overload without DynamoDB + Redis + CloudFront combination"));

  if (isInternal || isSaaS || bizModel === "subscription")
    R("scale","traffic_pattern","steady",t("✨ B2B/구독형 일반 패턴","✨ Typical B2B/subscription pattern"),t("Reserved Instance로 40% 절감. 예측 가능한 비용 관리가 가능합니다","40% savings with Reserved Instances. Enables predictable cost management"));
  if (isInternal || bizModel === "saas_license")
    R("scale","traffic_pattern","business",t("✨ 업무 시간 집중 패턴","✨ Business-hours focused pattern"),t("야간·주말 Scheduled Scaling으로 비용 30~50% 절감 가능합니다","30-50% cost reduction possible with Scheduled Scaling during nights/weekends"));
  if (isEcom || isTick)
    R("scale","traffic_pattern","spike",t("⭐ 이벤트 서비스 필수 체크","⭐ Must-check for event services"),t("타임세일·오픈런: Scheduled Scaling을 이벤트 10분 전에 미리 설정하세요","Flash sales/launches: Set Scheduled Scaling 10 minutes before the event"));
  if (isRT || isIoT || (isEcom && ecomD === "live_commerce"))
    R("scale","traffic_pattern","burst",t("✨ 실시간/라이브 패턴","✨ Realtime/live traffic pattern"),t("CloudFront + SQS 버퍼링으로 예측 불가 폭증을 흡수하세요","Absorb unpredictable traffic spikes with CloudFront + SQS buffering"));
  if (isTick && isFlash)
    R("scale","traffic_pattern","burst",t("⭐ 플래시 세일 burst 필수","⭐ Flash sale burst required"),t("플래시 세일 = 극단적 burst 트래픽. Scheduled Scaling + CloudFront 캐시 필수","Flash sale = extreme burst traffic. Scheduled Scaling + CloudFront caching required"));

  if (isInternal || isMVP)
    R("scale","data_volume","none",t("✨ 연산 위주 서비스","✨ Compute-focused service"),t("Lambda + 외부 API 호출 위주. 자체 저장소 최소화로 비용 절감","Lambda + external API calls. Minimize own storage for cost savings"));
  if (!isData && !isIoT)
    R("scale","data_volume","gb",t("✨ 일반 서비스 적정","✨ Ideal for general services"),t("RDS/Aurora 단일 인스턴스로 수년간 충분합니다. 인덱스 설계가 성능 핵심","A single RDS/Aurora instance is sufficient for years. Index design is the performance key"));
  if (isEcom || isSaaS || (isTick && !isMVP))
    R("scale","data_volume","tb",t("✨ 운영 서비스 적정","✨ Ideal for production services"),t("S3 Intelligent-Tiering으로 오래된 데이터를 자동으로 저렴하게 보관하세요","Use S3 Intelligent-Tiering to automatically store older data at lower cost"));
  if (isData || isIoT || isXL)
    R("scale","data_volume","ptb",t("⭐ 대용량 전략 필요","⭐ Large-scale data strategy needed"),t("S3 데이터 레이크 + Athena 분석. Glacier로 오래된 데이터 이동 자동화 필수","S3 data lake + Athena analytics. Automate moving old data to Glacier"));

  // ── TEAM ───────────────────────────────────────────────────────
  if (isMVP || bizModel === "internal_tool")
    R("team","team_size","solo",t("✨ 1인 MVP 최적","✨ Optimal for solo MVP"),t("Lambda + Aurora Serverless + Cognito: 서버 0대 운영 가능한 스택","Lambda + Aurora Serverless + Cognito: A stack that runs with zero servers"));
  if (isSmall && !isLarge)
    R("team","team_size","small",t("✨ 소규모 스타트업 적정","✨ Ideal for small startups"),t("ECS Fargate로 서버 관리 없이 팀 전원이 서비스 개발에 집중하세요","Focus the entire team on service development with ECS Fargate, no server management"));
  if (isMedPlus && !isXL)
    R("team","team_size","medium",t("✨ 성장기 팀 적정","✨ Ideal for growth-stage teams"),t("1~2명 DevOps 겸직으로 ECS + Terraform 스택 운영 가능한 규모","A scale where 1-2 part-time DevOps can manage an ECS + Terraform stack"));
  if (isXL || isLarge || hasCritCert)
    R("team","team_size","large",t("⭐ 대규모 서비스 필요","⭐ Required for large-scale services"),t("SRE/인프라 전담팀 없이 EKS + 멀티 계정 운영은 장애 위험이 높습니다","Running EKS + multi-account without a dedicated SRE/infra team carries high outage risk"));

  if (isMVP || begOrSolo)
    R("team","cloud_exp","beginner",t("✨ 관리형 서비스 집중","✨ Focus on managed services"),t("ECS Fargate + Aurora Serverless: AWS가 서버·DB를 관리. 코드에만 집중하세요","ECS Fargate + Aurora Serverless: AWS manages servers and DB. Focus only on code"));
  if (!begOrSolo && !seniorLarge)
    R("team","cloud_exp","mid",t("✨ 표준 스택 권장","✨ Standard stack recommended"),t("ECS + ALB + RDS Multi-AZ + Terraform: 중급의 최적 학습 경로입니다","ECS + ALB + RDS Multi-AZ + Terraform: The optimal learning path for mid-level"));
  if (isXL || (isLarge && hasCritCert) || isEks)
    R("team","cloud_exp","senior",t("⭐ 이 규모에 필요","⭐ Required at this scale"),t("EKS + 멀티 계정 + CDK: 고급 스킬 없이 운영 시 대형 장애 위험","EKS + multi-account + CDK: Operating without advanced skills risks major outages"));

  if (isMVP || begOrSolo || ops === "managed")
    R("team","ops_model","managed",t("✨ 소규모/MVP 권장","✨ Recommended for small/MVP"),t("AWS 관리형 서비스 최대 활용. 서버 패치·백업을 AWS에 위임하세요","Maximize AWS managed services. Delegate server patching and backups to AWS"));
  if (!isMVP && !isXL)
    R("team","ops_model","devops",t("✨ 성장기 스타트업 표준","✨ Growth-stage startup standard"),t("개발팀이 배포까지. GitHub Actions + CloudWatch로 자동화하면 충분합니다","Dev team handles deployment. GitHub Actions + CloudWatch automation is sufficient"));
  if (isLarge || hasCritCert || isSaaS)
    R("team","ops_model","separate",t("✨ 대기업/규정 준수 환경","✨ Enterprise/compliance environment"),t("개발/운영 분리로 변경 관리 프로세스 확보. ISMS·SOX 감사 요건 충족","Separate dev/ops for change management processes. Meets ISMS/SOX audit requirements"));

  // ── COMPLIANCE ─────────────────────────────────────────────────
  if (!hasCritCert && !hasPersonal)
    R("compliance","cert","none",t("✨ 일반 서비스 기본","✨ General service baseline"),t("기본 보안(TLS + IAM 최소 권한)만으로 시작. 규정 준수 없이도 보안 가능","Start with basic security (TLS + IAM least privilege). Security is possible without compliance"));
  if (isEcom || isTx)
    R("compliance","cert","pci",t("⚠️ 결제 서비스 검토","⚠️ Review for payment services"),t("카드 직접 처리 시 PCI DSS 필수. PG사 위임 시 카드 데이터가 자사 서버를 통과하지 않아 범위 축소","PCI DSS required for direct card processing. Scope reduces when delegating to payment gateway since card data never touches your servers"));
  if (isGlobal && hasPersonal)
    R("compliance","cert","gdpr",t("⭐ EU 사용자 법적 의무","⭐ Legal obligation for EU users"),t("EU 사용자 데이터 보호 + 잊혀질 권리 구현이 법적 의무. EU 리전 저장이 가장 간단하나 SCC로 비EU 리전도 가능","EU user data protection + right to be forgotten are legal obligations. EU region storage is simplest, but SCCs allow non-EU regions"));
  if (isSaaS && isGlobal && !hasPersonal)
    R("compliance","cert","gdpr",t("⭐ 글로벌 SaaS GDPR 필수","⭐ GDPR required for global SaaS"),t("글로벌 서비스 + 개인정보 처리 가능성 → GDPR 준비 필수. EU 리전 저장이 가장 간단한 규정 준수 경로","Global service + potential personal data processing -> GDPR preparation required. EU region storage is the simplest compliance path"));
  if (isIoT && iotD === "healthcare_iot")
    R("compliance","cert","hipaa",t("⭐ 헬스케어 법적 의무","⭐ Healthcare legal obligation"),t("생체 데이터 처리 시 HIPAA BAA 서명 + KMS 암호화 + CloudTrail이 법적 요건","Processing biometric data requires HIPAA BAA signing + KMS encryption + CloudTrail as legal requirements"));
  if (isB2B && isLarge)
    R("compliance","cert","isms",t("✨ 기업 계약 신뢰성","✨ Enterprise contract credibility"),t("국내 기업 계약 시 ISMS 인증이 영업 경쟁력이 됩니다","ISMS certification becomes a competitive advantage in domestic enterprise contracts"));
  if (bizModel === "saas_license" && isGlobal)
    R("compliance","cert","sox",t("✨ 미국 상장사 대상 SaaS","✨ SaaS for US publicly traded companies"),t("미국 상장 고객사에 ERP·재무 SaaS를 제공한다면 SOX 감사 대응 필요","SOX audit compliance needed if providing ERP/financial SaaS to US publicly traded clients"));

  if (!hasPersonal && !hasCritCert)
    R("compliance","encryption","basic",t("✨ 공개 데이터 서비스 적정","✨ Ideal for public data services"),t("HTTPS만으로 충분. DB 암호화는 비용 추가 없이 언제든 켤 수 있습니다","HTTPS alone is sufficient. DB encryption can be enabled anytime at no additional cost"));
  if (hasPersonal && !hasCritCert)
    R("compliance","encryption","standard",t("⭐ 개인정보 서비스 필수","⭐ Required for personal data services"),t("개인정보보호법: 전송+저장 암호화가 법적 의무입니다. AWS 기본 KMS로 무료 적용","Data protection law: Transit + at-rest encryption is a legal obligation. Free with AWS default KMS"));
  if (hasCritCert || isCritData)
    R("compliance","encryption","strict",t("⭐ 규정 준수 필수","⭐ Required for compliance"),t("PCI/HIPAA/SOX: CMK + CloudTrail 키 사용 감사가 심사 필수 항목입니다","PCI/HIPAA/SOX: CMK + CloudTrail key usage auditing is a mandatory audit item"));

  if (!hasPersonal && isInternal)
    R("compliance","network_iso","basic",t("✨ 사내 도구 적정","✨ Ideal for internal tools"),t("퍼블릭+프라이빗 기본 분리. Security Group으로 서버 간 접근 제어","Basic public+private separation. Security Groups for inter-server access control"));
  if (hasPersonal && !hasCritCert)
    R("compliance","network_iso","strict",t("⭐ 개인정보 서비스 필수","⭐ Required for personal data services"),t("앱+DB 프라이빗 서브넷 완전 격리. 인터넷에서 DB 직접 접근 불가","App+DB fully isolated in private subnets. No direct DB access from the internet"));
  if (hasCritCert || isCritData)
    R("compliance","network_iso","private",t("⭐ 규정 준수 필수","⭐ Required for compliance"),t("VPC Endpoint로 인터넷 없이 AWS 서비스 접근. PCI DSS 네트워크 격리 요건","Access AWS services without internet via VPC Endpoints. Meets PCI DSS network isolation requirements"));

  // ── SLO ────────────────────────────────────────────────────────
  if ((isInternal || isMVP) && !isTx)
    R("slo","availability","99",t("✨ 사내/MVP 적정","✨ Ideal for internal/MVP"),t("연간 87시간 다운 허용. 담당자 알림 + 수동 복구로 충분합니다","87 hours/year downtime allowed. Alert notification + manual recovery is sufficient"));
  if (!isTx && !isHighAvail && !hasCritCert && !isMVP && !isInternal)
    R("slo","availability","99.9",t("✨ 일반 서비스 표준","✨ General service standard"),t("Multi-AZ DB + ECS 2 Task만으로 달성 가능. 대부분 서비스의 출발점","Achievable with just Multi-AZ DB + 2 ECS Tasks. The starting point for most services"));
  if (isTx || (isSaaS && isB2B))
    R("slo","availability","99.95",t("⭐ 결제/B2B SaaS 권장","⭐ Recommended for payment/B2B SaaS"),t("연 4.4시간 이하 다운. 3개 AZ + Aurora Multi-AZ + Route53 헬스체크로 달성","Under 4.4 hours/year downtime. Achieved with 3 AZs + Aurora Multi-AZ + Route53 health checks"));
  if (hasCritCert || (isTx && isLarge) || avail === "99.99")
    R("slo","availability","99.99",t("⭐ 금융/결제 대형 서비스","⭐ Large-scale financial/payment services"),t("연 53분 이하. 3 AZ + Aurora Global + Multi-Region + 완전 자동화 복구 필요","Under 53 min/year. Requires 3 AZs + Aurora Global + Multi-Region + fully automated recovery"));

  if ((isInternal || isMVP) && !isTx)
    R("slo","rto","hours",t("✨ 사내/저중요 서비스 적정","✨ Ideal for internal/low-priority services"),t("CloudWatch 알림 + 담당자 수동 복구. 업무시간 내 복구면 충분합니다","CloudWatch alerts + manual recovery by on-call. Recovery within business hours is sufficient"));
  if (!isTx && !isHighAvail && !isMVP && !isInternal)
    R("slo","rto","minutes",t("✨ 일반 서비스 기준","✨ General service baseline"),t("Auto Scaling + Multi-AZ 자동 복구 + CloudWatch 알림으로 30분 RTO 달성","30-minute RTO achieved with Auto Scaling + Multi-AZ auto-recovery + CloudWatch alerts"));
  if ((isTx && !isLarge && !hasCritCert) || (isSaaS && !hasCritCert))
    R("slo","rto","lt10min",t("⭐ 거래 서비스 권장","⭐ Recommended for transactional services"),t("Multi-AZ 자동 페일오버(30초) + RunBook 자동화. 10분 이내 복구 가능","Multi-AZ auto-failover (30s) + RunBook automation. Recovery possible within 10 minutes"));
  if (hasCritCert || (isTx && isLarge))
    R("slo","rto","lt1min",t("⭐ 금융/결제 필수","⭐ Required for financial/payment"),t("모든 복구 자동화 필수. 인간 개입 없이 30초 내 자동 전환해야 달성 가능","Full recovery automation required. Achievable only with auto-failover within 30s without human intervention"));

  if (isInternal || isMVP)
    R("slo","rpo","24h",t("✨ 비핵심 서비스 적정","✨ Ideal for non-critical services"),t("일간 스냅샷으로 충분. 비용 최소화. 반기 1회 복구 테스트 권장","Daily snapshots are sufficient. Minimize costs. Semi-annual recovery testing recommended"));
  if (!isTx && !isHighAvail && !isMVP && !isInternal)
    R("slo","rpo","1h",t("✨ 일반 서비스 기준","✨ General service baseline"),t("RDS PITR(5분 간격 트랜잭션 로그)로 달성 가능. 추가 비용 없음","Achievable with RDS PITR (5-min interval transaction logs). No additional cost"));
  if ((isTx && !isCritData && !hasCritCert) || (isSaaS && !isCritData) || (hasCritCert && !isCritData && !isTx))
    R("slo","rpo","15min",t("⭐ 거래 서비스 권장","⭐ Recommended for transactional services"),t("Aurora 연속 백업(초 단위 복원) 기본 제공. 설정 없이 수 초 RPO 달성 가능","Aurora continuous backup (second-level restore) included by default. Sub-second RPO achievable without configuration"));
  if (isCritData || (hasCritCert && isTx))
    R("slo","rpo","zero",t("⭐ 금융 트랜잭션 필수","⭐ Required for financial transactions"),t("Aurora 4/6 write quorum으로 커밋된 쓰기 보장 + SQS FIFO 정확히 1회 처리. 데이터 손실 0","Aurora 4/6 write quorum guarantees committed writes + SQS FIFO exactly-once processing. Zero data loss"));

  if (!isGlobal && !isHighAvail && !(isTx && isLarge))
    R("slo","region","single",t("✨ 국내 서비스 기본","✨ Domestic service baseline"),t("서울 리전 단일로 충분. Route53 + Multi-AZ로 AZ 장애는 자동 대응","Single Seoul region is sufficient. AZ failures are automatically handled with Route53 + Multi-AZ"));
  if (isTx && isLarge)
    R("slo","region","dr",t("✨ 대형 거래 서비스 권장","✨ Recommended for large transactional services"),t("Aurora Global + Route53 Failover로 리전 전체 장애 대비. RPO 1초 미만","Prepare for full region failure with Aurora Global + Route53 Failover. RPO under 1 second"));
  if (isGlobal || (isXL && avail === "99.99"))
    R("slo","region","active",t("⭐ 글로벌/초고가용성 필수","⭐ Required for global/ultra-high availability"),t("DynamoDB Global Tables + Route53 지연시간 라우팅으로 전 세계 최저 지연시간","Lowest global latency with DynamoDB Global Tables + Route53 latency-based routing"));

  // ── NETWORK ────────────────────────────────────────────────────
  if (isMVP || isSmall || teamSize === "solo")
    R("network","account_structure","single",t("✨ 소규모 적정","✨ Ideal for small scale"),t("단일 계정 + 환경별 네임스페이스로 시작. 팀 성장 후 멀티 계정으로 마이그레이션","Start with single account + per-environment namespaces. Migrate to multi-account as team grows"));
  if (!isMVP && !isXL && !hasCritCert)
    R("network","account_structure","envs",t("⭐ 성장기 표준","⭐ Growth-stage standard"),t("Prod 계정 분리만으로도 개발 실수의 운영 영향을 차단합니다. AWS 권장 기본","Just separating the Prod account blocks dev mistakes from affecting production. AWS recommended baseline"));
  if (isXL || hasCritCert || (isLarge && isSaaS))
    R("network","account_structure","org",t("⭐ 대규모/규정 준수 필수","⭐ Required for large-scale/compliance"),t("Organizations + Control Tower: SCP로 전 계정 보안 정책 강제. ISMS 감사 대응","Organizations + Control Tower: Enforce security policies across all accounts with SCPs. ISMS audit compliance"));

  if (isMVP && !hasCritCert)
    R("network","az_count","1az",t("✨ MVP 비용 절감","✨ MVP cost savings"),t("NAT GW 1개로 비용 최소화. 운영 전환 시 즉시 2 AZ로 업그레이드 계획 수립","Minimize cost with 1 NAT GW. Plan immediate upgrade to 2 AZs when transitioning to production"));
  if (!hasCritCert && avail !== "99.99")
    R("network","az_count","2az",t("⭐ 운영 서비스 표준","⭐ Production service standard"),t("99.9~99.95% 가용성 달성의 최적 비용점. NAT GW 2개 비용으로 AZ 장애 대응","Optimal cost point for 99.9-99.95% availability. AZ failure resilience at the cost of 2 NAT GWs"));
  if (hasCritCert || avail === "99.99" || (isLarge && isTx))
    R("network","az_count","3az",t("⭐ 고가용성/규정 준수 필수","⭐ Required for high availability/compliance"),t("PCI DSS·HIPAA 권장. AZ 1개 완전 장애에도 서비스 유지. 99.95~99.99% 달성","PCI DSS/HIPAA recommended. Service survives complete AZ failure. Achieves 99.95-99.99%"));

  if (!hasCritCert && dataS !== "critical")
    R("network","subnet_tier","2tier",t("⭐ 대부분 서비스 표준","⭐ Standard for most services"),t("퍼블릭(ALB)+프라이빗(앱+DB): Security Group으로 DB를 앱 서버만 접근 허용","Public (ALB) + Private (app+DB): Security Groups allow DB access only from app servers"));
  if (hasCritCert || isCritData)
    R("network","subnet_tier","3tier",t("⭐ 규정 준수 필수","⭐ Required for compliance"),t("퍼블릭+프라이빗+격리(DB전용): PCI DSS CDE 격리, HIPAA 데이터 보호 요건 충족","Public + Private + Isolated (DB-only): Meets PCI DSS CDE isolation, HIPAA data protection requirements"));
  if (isInternal && hasPersonal)
    R("network","subnet_tier","private",t("✨ 완전 격리 사내 시스템","✨ Fully isolated internal system"),t("VPN 또는 DX로만 접근. 인터넷 공개 불필요한 사내 시스템에 최고 보안","Access only via VPN or DX. Maximum security for internal systems that don't need internet exposure"));

  if (hasCritCert || isHighAvail)
    R("network","nat_strategy","per_az",t("⭐ 고가용성 필수","⭐ Required for high availability"),t("AZ별 독립 NAT GW: 하나의 AZ NAT 장애가 다른 AZ에 영향 없음","Independent NAT GW per AZ: One AZ's NAT failure doesn't affect other AZs"));
  if (!isHighAvail && !hasCritCert && !isSmall)
    R("network","nat_strategy","shared",t("✨ 비용 절감 옵션","✨ Cost savings option"),t("NAT GW 1개 공유로 월 $43+ 절감. 단일 AZ 장애 시 전체 아웃바운드 영향","Save $43+/month sharing 1 NAT GW. Single AZ failure affects all outbound traffic"));
  if (isLarge || isMedPlus)
    R("network","nat_strategy","endpoint",t("💰 대규모 비용 절감","💰 Large-scale cost savings"),t("S3·DynamoDB 트래픽을 NAT GW 없이 직접 라우팅. 대용량 서비스에서 월 수십만원 절감","Route S3/DynamoDB traffic directly without NAT GW. Saves hundreds of dollars/month for high-volume services"));

  if ((!types.includes("saas") || !isLarge) && !isB2B)
    R("network","hybrid","no",t("✨ 퍼블릭 클라우드 전용","✨ Public cloud only"),t("온프레미스 연결 불필요. VPN 설정 없이 단순한 구조 유지","No on-premises connection needed. Maintain simple architecture without VPN setup"));
  if (isB2B && !isXL)
    R("network","hybrid","vpn",t("✨ B2B 사무실 연결","✨ B2B office connectivity"),t("Site-to-Site VPN으로 사무실과 AWS 연결. 구성 빠르고 비용 저렴. 고대역폭 불필요 시","Connect office to AWS with Site-to-Site VPN. Quick setup, low cost. When high bandwidth isn't needed"));
  if (isXL || (isB2B && isLarge) || hasCritCert)
    R("network","hybrid","dx",t("⭐ 대규모/보안 필수","⭐ Required for large-scale/security"),t("Direct Connect: 전용 물리 회선으로 안정적 연결. 온프레미스 DB 연동 또는 대용량 전송","Direct Connect: Reliable connection via dedicated physical line. On-premises DB integration or high-volume transfer"));

  // ── NETWORK: cost-aware recommendations ───────────────────────
  if (isCostFirst)
    R("network","az_count","1az",t("💰 NAT GW 1개로 월 $43+ 절감","💰 Save $43+/mo with 1 NAT GW"),t("비용 우선: NAT GW 1개로 비용 최소화. 운영 전환 시 2 AZ 확장 계획 수립","Cost first: Minimize cost with 1 NAT GW. Plan to expand to 2 AZs when transitioning to production"));
  if (isCostFirst)
    R("network","nat_strategy","endpoint",t("💰 NAT GW 제거로 월 $43~100+ 절감","💰 Save $43-100+/mo by eliminating NAT GW"),t("비용 우선: VPC Endpoint로 S3·DynamoDB 트래픽을 NAT 없이 직접 라우팅. 대용량 서비스에서 큰 절감","Cost first: Route S3/DynamoDB traffic directly via VPC Endpoint without NAT. Significant savings for high-volume services"));
  if (isPerfFirst)
    R("network","az_count","3az",t("⭐ AZ 장애에도 서비스 유지","⭐ Service survives AZ failure"),t("성능 우선: 3 AZ로 AZ 1개 완전 장애에도 서비스 유지. 99.95~99.99% 가용성 달성","Performance first: With 3 AZs, service survives complete AZ failure. Achieves 99.95-99.99% availability"));

  // ── COMPUTE ────────────────────────────────────────────────────
  if (isMVP || begOrSolo || isInternal)
    R("compute","arch_pattern","serverless",t("✨ MVP/소규모 최적","✨ Optimal for MVP/small scale"),t("Lambda + API GW: 서버 0대. 코드만 올리면 바로 서비스. 트래픽 없으면 비용 0","Lambda + API GW: Zero servers. Deploy code and serve immediately. Zero cost with no traffic"));
  if ((!begOrSolo || isMedPlus) && !isIoT)
    R("compute","arch_pattern","container",t("⭐ 대부분 서비스 표준","⭐ Standard for most services"),t("Docker 컨테이너로 환경 일관성. ECS Fargate로 서버 관리 제로. AWS 권장 기본","Environment consistency with Docker containers. Zero server management with ECS Fargate. AWS recommended default"));
  if (isIoT || (isData && dataD !== "ml_pipeline"))
    R("compute","arch_pattern","hybrid",t("✨ IoT/데이터 파이프라인 권장","✨ Recommended for IoT/data pipelines"),t("API 서버는 컨테이너, 이벤트/배치 처리는 Lambda. 역할에 맞는 컴퓨팅 선택","Containers for API servers, Lambda for event/batch processing. Choose compute that fits the role"));
  if (isLarge && isMature && !isIoT)
    R("compute","arch_pattern","vm",t("✨ 고성능/특수 워크로드","✨ High-performance/specialized workloads"),t("ML 추론, 게임 서버처럼 GPU나 특수 인스턴스가 필요한 경우에 한해 선택","Choose only when GPU or specialized instances are needed, like ML inference or game servers"));
  if ((isMVP || (exp === "beginner" && !isXL)) && !isRT)
    R("compute","arch_pattern","app_runner",t("⭐ MVP+입문자 최적","⭐ Best for MVP+beginners"),t("가장 빠르게 컨테이너 서비스 시작. VPC 설정 불필요, 자동 TLS·스케일링","Fastest way to start a container service. No VPC setup needed, auto TLS and scaling"));

  if (begOrSolo || ops === "managed" || (!isLarge && !isEks))
    R("compute","orchestration","ecs",t("⭐ 소~중형 서비스 표준","⭐ Standard for small-to-mid services"),t("ECS Fargate: K8s 없이 컨테이너 운영. EKS 대비 운영 부담 50% 절감. AWS 권장","ECS Fargate: Run containers without K8s. 50% less operational burden vs EKS. AWS recommended"));
  if (seniorLarge || (isXL && exp !== "beginner"))
    R("compute","orchestration","eks",t("✨ 대규모 정밀 제어","✨ Large-scale fine-grained control"),t("Karpenter + KEDA + Argo CD: 수백 개 서비스를 하나의 플랫폼으로 통합 관리","Karpenter + KEDA + Argo CD: Manage hundreds of services on a single unified platform"));
  if (begOrSolo)
    R("compute","orchestration","eks",t("⚠️ 초급 팀 EKS 운영 위험","⚠️ EKS operational risk for beginner teams"),t("EKS는 운영 복잡도 높음 — 초급 팀은 ECS Fargate로 시작 권장. K8s 학습 곡선 + 클러스터 관리 부담","EKS has high operational complexity — beginner teams should start with ECS Fargate. K8s learning curve + cluster management burden"));

  if (begOrSolo || ops === "managed" || isMVP)
    R("compute","compute_node","fargate",t("⭐ 관리 최소화 표준","⭐ Minimal management standard"),t("EC2 노드 패치·관리 없음. Fargate는 EC2 대비 약 20~30% 비용 높음","No EC2 node patching or management. Fargate costs about 20-30% more than EC2"));
  if (isMature && isLarge && exp !== "beginner")
    R("compute","compute_node","ec2_node",t("💰 대규모 비용 절감","💰 Large-scale cost savings"),t("EC2 노드 직접 관리 시 Fargate 대비 40~60% 비용 절감. 운영 역량 필요","40-60% cost savings vs Fargate when managing EC2 nodes directly. Operations expertise required"));
  if (!isMVP && !begOrSolo)
    R("compute","compute_node","mixed",t("✨ 비용·안정성 균형","✨ Cost-stability balance"),t("기본 태스크는 EC2, 스케일아웃은 Fargate. ECS Capacity Provider로 자동 분배","Base tasks on EC2, scale-out on Fargate. Auto-distributed via ECS Capacity Provider"));

  if (!isSpiky && !isIoT)
    R("compute","scaling","ecs_asg",t("⭐ 대부분 서비스 기본","⭐ Default for most services"),t("CPU 70% 기준 자동 확장. min:2 max:10 설정만으로 충분. 가장 단순하고 안정적","Auto-scale at 70% CPU. Settings of min:2 max:10 are sufficient. Simplest and most stable"));
  if (pattern.includes("spike") || isTick)
    R("compute","scaling","scheduled",t("⭐ 이벤트 서비스 필수","⭐ Required for event services"),t("이벤트 10분 전 예약 확장. CPU 기반 확장은 폭증 시작 후 대응이라 늦습니다","Scheduled scale-out 10 min before event. CPU-based scaling reacts after the spike starts, which is too late"));
  if (isIoT || (isData && dataD === "stream_analytics") || isRT)
    R("compute","scaling","keda",t("✨ 이벤트 기반 처리 권장","✨ Recommended for event-driven processing"),t("SQS/Kinesis 메시지 수 기반 확장. CPU보다 30% 더 정확한 스케일링","Scale based on SQS/Kinesis message count. 30% more accurate scaling than CPU-based"));
  if (isInternal && isSteady)
    R("compute","scaling","manual",t("✨ 고정 트래픽 절약","✨ Savings for fixed traffic"),t("트래픽이 완전히 예측 가능하면 고정 용량 + Reserved Instance가 가장 저렴","Fixed capacity + Reserved Instances is cheapest when traffic is fully predictable"));

  // ── COMPUTE: cost-aware recommendations ───────────────────────
  if (isCostFirst && !isLarge && state.team?.language !== "spring_boot")
    R("compute","arch_pattern","serverless",t("💰 유휴 비용 0원 최저 비용 아키텍처","💰 Zero idle cost, lowest cost architecture"),t("비용 우선 + 소규모: Lambda는 트래픽 없을 때 비용 0. 가장 저렴한 시작점","Cost first + small scale: Lambda costs zero with no traffic. The cheapest starting point"));
  if (isCostFirst)
    R("compute","compute_node","fargate",t("💰 EC2 대비 관리 비용 제로","💰 Zero management cost vs EC2"),t("비용 우선: Fargate는 EC2 대비 약간 비싸지만 패치·모니터링 인건비 절감. 총 비용(TCO) 최적","Cost first: Fargate is slightly more expensive than EC2 but saves patching/monitoring labor. Optimal TCO"));
  if (isPerfFirst)
    R("compute","orchestration","eks",t("⭐ 최대 유연성·성능 제어","⭐ Maximum flexibility and performance control"),t("성능 우선: EKS + Karpenter로 노드 타입·스케일링을 세밀하게 제어. 대규모 트래픽 최적화","Performance first: Fine-grained control over node types and scaling with EKS + Karpenter. Large-scale traffic optimization"));

  // ── DATA ───────────────────────────────────────────────────────
  if ((isEcom || isTick) && !isFlash && !isUltraRPS)
    R("data","primary_db","aurora_mysql",t("⭐ 이커머스/일반 서비스 표준","⭐ Standard for e-commerce/general services"),t("주문·결제·회원: Aurora MySQL Serverless v2. AWS 이커머스 레퍼런스 아키텍처 기준","Orders, payments, members: Aurora MySQL Serverless v2. Based on AWS e-commerce reference architecture"));
  if (isSaaS || (isB2B && hasPersonal))
    R("data","primary_db","aurora_pg",t("⭐ SaaS/B2B 표준","⭐ Standard for SaaS/B2B"),t("PostgreSQL Row-Level Security로 테넌트 데이터 격리. JSON 지원으로 유연한 스키마","Tenant data isolation with PostgreSQL Row-Level Security. Flexible schema with JSON support"));
  if (isMVP && !hasCritCert && !isTx)
    R("data","primary_db","rds_mysql",t("✨ MVP 비용 절감","✨ MVP cost savings"),t("RDS MySQL t3.micro: 서울 리전 월 약 $19. Aurora보다 약 20% 저렴. 검증 후 Aurora 마이그레이션","RDS MySQL t3.micro: ~$19/month in Seoul region. ~20% cheaper than Aurora. Migrate to Aurora after validation"));
  if ((isMVP || isSmall) && !hasCritCert && !isTx)
    R("data","primary_db","rds_pg",t("✨ MVP PostgreSQL 비용 절감","✨ MVP PostgreSQL cost savings"),t("RDS PostgreSQL t4g.micro: 서울 리전 월 약 $18. Aurora PG보다 약 20% 저렴. JSONB·배열 등 고급 기능 활용 가능","RDS PostgreSQL t4g.micro: ~$18/month in Seoul region. ~20% cheaper than Aurora PostgreSQL. Advanced features like JSONB and arrays available"));
  if (isHighAvail)
    R("data","primary_db","rds_pg",t("⚠️ 고가용성 시 Aurora 권장","⚠️ Aurora recommended for high availability"),t("99.95%+ 가용성 목표 시 Aurora 권장. RDS 대비 빠른 장애조치 (30초 vs 수 분) + 자동 스토리지 확장","Aurora recommended for 99.95%+ availability targets. Faster failover than RDS (30s vs minutes) + auto storage scaling"));
  if (isHighAvail)
    R("data","primary_db","rds_mysql",t("⚠️ 고가용성 시 Aurora 권장","⚠️ Aurora recommended for high availability"),t("99.95%+ 가용성 목표 시 Aurora MySQL 권장. RDS MySQL 대비 빠른 장애조치 + 최대 15 Read Replica 지원","Aurora MySQL recommended for 99.95%+ availability targets. Faster failover than RDS MySQL + up to 15 Read Replicas"));
  if (isIoT || isFlash || isUltraRPS || (isData && dataD === "stream_analytics"))
    R("data","primary_db","dynamodb",t("⭐ 고성능/IoT 필수","⭐ Required for high-performance/IoT"),t("초당 수만 건 읽기/쓰기 + 자동 확장. 티켓팅 재고 원자적 처리에 최적의 선택","Tens of thousands of reads/writes per second + Auto Scaling. Optimal for atomic ticket inventory processing"));
  if (isInternal && !isTx)
    R("data","primary_db","none",t("✨ 서버리스 데이터 없음 옵션","✨ Serverless no-data option"),t("DynamoDB On-Demand 또는 S3 + Athena로 DB 관리 없이 운영 가능","Operate without DB management using DynamoDB On-Demand or S3 + Athena"));
  if (types.includes("saas") || types.includes("ecommerce"))
    R("data","primary_db","documentdb",t("✨ MongoDB 마이그레이션","✨ MongoDB migration"),t("기존 MongoDB 코드를 변경 없이 AWS 관리형으로 전환. MongoDB 5.0 호환","Migrate existing MongoDB code to AWS managed without changes. MongoDB 5.0 compatible"));
  if (types.includes("saas") || types.includes("ecommerce"))
    R("data","primary_db","neptune",t("✨ 관계 중심 데이터","✨ Relationship-centric data"),t("소셜 네트워크, 사기 탐지, 추천 엔진. 데이터 간 관계 탐색에 최적화","Social networks, fraud detection, recommendation engines. Optimized for exploring data relationships"));
  if (types.includes("iot") || types.includes("data"))
    R("data","primary_db","timestream",t("✨ 시계열 특화","✨ Time-series specialized"),t("IoT 센서, 서버 메트릭, 금융 시계열 데이터에 최적화. 서버리스로 관리 부담 없음","Optimized for IoT sensors, server metrics, financial time-series. Serverless with no management burden"));

  if (isMVP && !hasCritCert)
    R("data","db_ha","single_az",t("✨ MVP 비용 절감","✨ MVP cost savings"),t("MVP 단계 Single-AZ로 비용 절감. 출시 후 Multi-AZ 전환을 로드맵에 포함하세요","Save costs with Single-AZ during MVP phase. Include Multi-AZ migration in your post-launch roadmap"));
  if (!isHighAvail && !hasCritCert && !isMVP)
    R("data","db_ha","multi_az",t("⭐ 운영 서비스 필수","⭐ Required for production services"),t("운영 DB에 Single-AZ는 DB 장애 = 서비스 중단. Multi-AZ가 기본 중의 기본","Single-AZ for production DB means DB failure = service outage. Multi-AZ is the absolute baseline"));
  if (isHighAvail || hasCritCert || (isLarge && isTx))
    R("data","db_ha","multi_az_read",t("⭐ 고가용성/이커머스 필수","⭐ Required for high availability/e-commerce"),t("자동 페일오버 + 읽기 전담 서버. 읽기가 전체 쿼리 70%+ 서비스에서 성능 2배","Auto-failover + dedicated read replicas. 2x performance for services where reads are 70%+ of all queries"));
  if (isGlobal && (isXL || avail === "99.99"))
    R("data","db_ha","global",t("⭐ 글로벌/초고가용성","⭐ Global/ultra-high availability"),t("Aurora Global: 리전 간 복제 1초 미만. 리전 전체 장애 시 1~5분 내 수동 페일오버","Aurora Global: Cross-region replication under 1 second. Manual failover within 1-5 minutes during full region failure"));

  if (isInternal || isMVP || isSmall)
    R("data","cache","no",t("✨ 소규모 불필요","✨ Unnecessary for small scale"),t("DAU 1만 미만은 캐시 없이 DB만으로 충분. 복잡도 최소화가 우선","Under 10K DAU, DB alone is sufficient without cache. Minimizing complexity takes priority"));
  const dbArr = Array.isArray(state.data?.primary_db) ? state.data.primary_db : [];
  const hasDynamoOnly = dbArr.includes("dynamodb") && !dbArr.some((d: string) => d.startsWith("aurora") || d.startsWith("rds"));
  if ((isEcom || isRT || isMedPlus) && !hasDynamoOnly)
    R("data","cache","redis",t("⭐ 중대형 서비스 필수","⭐ Required for mid-to-large services"),t("ElastiCache Redis: DB 부하 70% 절감. 세션·상품·장바구니 캐시의 업계 표준","ElastiCache Redis: 70% DB load reduction. Industry standard for session, product, and cart caching"));
  if (hasDynamoOnly && isMedPlus)
    R("data","cache","dax",t("✨ DynamoDB 전용 캐시","✨ DynamoDB-dedicated cache"),t("DAX: DynamoDB 읽기 지연 ms→μs. 코드 변경 없이 SDK만 교체. DynamoDB 단독 사용 시 최적","DAX: DynamoDB read latency from ms to us. Just swap the SDK, no code changes. Optimal when using DynamoDB exclusively"));
  if (isFlash || (isTick && isUltraRPS))
    R("data","cache","both",t("⭐ 극한 동시성 필수","⭐ Required for extreme concurrency"),t("DynamoDB DAX + ElastiCache 동시 사용. 재고 선점(Redis) + 상세 조회(DAX)","DynamoDB DAX + ElastiCache simultaneous use. Inventory preemption (Redis) + detail lookups (DAX)"));
  if (types.includes("ecommerce") || types.includes("ticketing"))
    R("data","cache","memorydb",t("✨ 내구성 필수","✨ Durability required"),t("캐시 데이터 손실이 비즈니스에 치명적일 때. ElastiCache보다 ~20% 비싸지만 데이터 무손실","When cache data loss is business-critical. ~20% more than ElastiCache but zero data loss"));

  // IoT Core recommendations
  if (isIoT && iotD === "consumer_iot")
    R("data","primary_db","dynamodb",t("⭐ IoT 디바이스 상태 저장","⭐ IoT device state storage"),t("DynamoDB는 디바이스 상태 저장에 최적입니다. TTL로 오래된 상태를 자동 삭제하세요","DynamoDB is optimal for device state storage. Use TTL to auto-delete old states"));
  if (isIoT)
    R("integration","queue_type","kinesis",t("⭐ IoT 실시간 스트리밍","⭐ IoT real-time streaming"),t("Kinesis로 디바이스 데이터를 실시간 수집·분석하세요. SQS보다 순서 보장이 강합니다","Collect and analyze device data in real-time with Kinesis. Stronger ordering guarantees than SQS"));

  if (!isData && !isIoT && !isEcom)
    R("data","storage","none",t("✨ 파일 저장 불필요","✨ File storage unnecessary"),t("DB만으로 충분. 추후 이미지/파일 업로드 추가 시 S3를 붙이면 됩니다","DB alone is sufficient. Just attach S3 when image/file uploads are needed later"));
  if (!isInternal)
    R("data","storage","s3",t("⭐ 파일 저장 표준","⭐ File storage standard"),t("S3는 무제한 확장 + 99.999999999% 내구성. 모든 파일은 S3가 기본","S3 offers unlimited scaling + 99.999999999% durability. S3 is the default for all files"));
  if (isRT && isSaaS)
    R("data","storage","efs",t("✨ 공유 파일시스템 필요 시","✨ When shared filesystem is needed"),t("여러 컨테이너가 동일 파일 공유 시 EFS. NFS 마운트로 투명하게 접근","EFS when multiple containers share the same files. Transparent access via NFS mount"));
  if (isData && dataD === "ml_pipeline")
    R("data","storage","ebs",t("✨ ML 학습 고성능 스토리지","✨ High-performance ML training storage"),t("SageMaker 학습 인스턴스에 EBS io2 연결. IOPS 보장으로 학습 속도 향상","Attach EBS io2 to SageMaker training instances. Guaranteed IOPS for faster training"));

  if (!isEcom || (isSmall && ecomD !== "marketplace"))
    R("data","search","no",t("✨ 검색 불필요","✨ Search unnecessary"),t("DB 인덱스 조회로 충분. 데이터 100만 건 미만이면 LIKE 쿼리도 가능","DB index lookups are sufficient. LIKE queries are also viable under 1M records"));
  if (isEcom && isSmall)
    R("data","search","db_search",t("✨ 소규모 초기 적합","✨ Suitable for small-scale early stage"),t("RDS 전문 검색 인덱스로 시작. 상품 10만 건 이하에서 충분합니다","Start with RDS full-text search indexes. Sufficient for under 100K products"));
  if (isEcom && (isMedPlus || ecomD === "marketplace"))
    R("data","search","opensearch",t("⭐ 마켓플레이스 필수","⭐ Required for marketplace"),t("한글 형태소 분석 + 연관도 정렬 + 패싯 필터링. DB로는 구현 불가한 검색 품질","Korean morphological analysis + relevance ranking + facet filtering. Search quality impossible to achieve with DB alone"));
  if (isRT)
    R("data","search","opensearch",t("⭐ 채팅 메시지 검색 필수","⭐ Required for chat message search"),t("메시지·사용자 검색: OpenSearch 실시간 인덱싱 + 한글 형태소 분석. 채팅 서비스 핵심 기능","Message/user search: OpenSearch real-time indexing + Korean morphological analysis. Core chat service feature"));
  if (isData && (dataD === "log_analytics" || dataD === "stream_analytics"))
    R("data","search","opensearch",t("⭐ 로그/이벤트 분석 필수","⭐ Required for log/event analytics"),t("로그 집계·패턴 분석·실시간 대시보드. CloudWatch Logs Insights 대비 복잡 쿼리 성능 우수","Log aggregation, pattern analysis, real-time dashboards. Superior complex query performance vs CloudWatch Logs Insights"));
  if (isSaaS && isMedPlus)
    R("data","search","opensearch",t("⭐ SaaS 검색/감사 권장","⭐ Recommended for SaaS search/audit"),t("테넌트별 데이터 검색·감사 로그 분석. Kibana 대시보드로 운영 모니터링 통합","Per-tenant data search and audit log analysis. Unified operations monitoring with Kibana dashboards"));
  if (types.includes("data"))
    R("workload","data_detail","ai_genai",t("✨ 생성형 AI 기반","✨ Generative AI based"),t("LLM 활용 서비스에 최적. Amazon Bedrock으로 Claude, Llama 등 모델 API 호출","Optimal for LLM-powered services. Call Claude, Llama models via Amazon Bedrock API"));

  // ── DATA: cost-aware recommendations ──────────────────────────
  if (isCostFirst)
    R("data","primary_db","rds_mysql",t("💰 Aurora 대비 ~20% 저렴","💰 ~20% cheaper than Aurora"),t("비용 우선 시 RDS MySQL로 시작하면 Aurora 대비 월 비용 대폭 절감. 성장 후 Aurora 전환 가능","When cost is priority, starting with RDS MySQL saves significantly vs Aurora. Can migrate to Aurora later"));
  if (isCostFirst && !isCritData)
    R("data","db_ha","single_az",t("💰 Multi-AZ 대비 50% 절감","💰 50% savings vs Multi-AZ"),t("비용 우선 시 Single-AZ로 DB 비용 절반. 핵심 데이터가 아니면 충분한 선택","When cost is priority, Single-AZ halves DB cost. Sufficient when data isn't critical"));
  if (isPerfFirst && isTx)
    R("data","db_ha","multi_az_read",t("⭐ 읽기 분산으로 결제 안정성 강화","⭐ Read distribution for payment stability"),t("성능 우선: 읽기 전용 복제본으로 결제 조회 분산. DB 병목 제거로 거래 안정성 확보","Performance first: Distribute payment reads across replicas. Ensure transaction stability by eliminating DB bottlenecks"));

  // ── INTEGRATION ────────────────────────────────────────────────
  if (!isB2B && !hasCritCert)
    R("integration","auth","cognito",t("⭐ B2C 서비스 표준","⭐ Standard for B2C services"),t("MAU 1만 무료(신규 풀 기준). 소셜 로그인·MFA를 코드 없이 설정만. 자체 구현 대비 보안 사고 대폭 감소","10K MAU free (new pool basis). Social login and MFA with config only, no code. Drastically reduces security incidents vs self-implementation"));
  if (isB2B || isSaaS)
    R("integration","auth","sso",t("⭐ B2B SaaS 필수","⭐ Required for B2B SaaS"),t("SAML/OIDC로 고객사 계정 연동. 퇴사자 접근 차단이 고객 IT팀에서 자동 처리","Integrate client accounts via SAML/OIDC. Departed employee access revocation handled automatically by client IT team"));
  if (hasCritCert && !isB2B)
    R("integration","auth","selfmgd",t("✨ 규정 준수 커스텀 인증","✨ Compliance custom authentication"),t("PCI/HIPAA 특수 요건이 있을 때만 선택. Cognito로 해결 안 될 때 최후 수단","Choose only when PCI/HIPAA has special requirements. Last resort when Cognito can't solve it"));
  if (isHighAvail)
    R("integration","auth","selfmgd",t("⚠️ 자체 인증 SPOF 위험","⚠️ Self-managed auth SPOF risk"),t("자체 인증 서버는 SPOF — 장애 시 전체 서비스 로그인 불가. Cognito/SSO 검토 권장","Self-managed auth server is a SPOF — all service login fails on outage. Consider Cognito/SSO"));

  if (!isTx && isInternal)
    R("integration","sync_async","sync_only",t("✨ 단순 서비스 적합","✨ Suitable for simple services"),t("요청-처리-응답의 단순 구조. 비동기의 복잡도 없이 빠른 개발 가능","Simple request-process-response structure. Fast development without async complexity"));
  if (isTx || isEcom || isTick || isIoT)
    R("integration","sync_async","async",t("⭐ 거래/이벤트 서비스 필수","⭐ Required for transactional/event services"),t("주문-결제-재고-배송 체인: 비동기 분리로 장애 격리. 결제 서비스의 AWS 표준","Order-payment-inventory-shipping chain: Fault isolation via async separation. AWS standard for payment services"));
  if (isSaaS || (isRT && isEcom))
    R("integration","sync_async","mixed",t("✨ 복합 서비스 권장","✨ Recommended for composite services"),t("API는 동기(즉시 응답), 결제·알림은 비동기. 각 서비스의 성격에 맞게 분리","APIs are sync (immediate response), payments/notifications are async. Separated to match each service's nature"));

  if (isEcom || isTick || isTx)
    R("integration","queue_type","sqs",t("⭐ 주문/결제 처리 표준","⭐ Standard for order/payment processing"),t("SQS FIFO: 주문 순서 보장 + 정확히 1회 처리 보장. AWS 이커머스 레퍼런스 표준","SQS FIFO: Guaranteed order sequence + exactly-once processing. AWS e-commerce reference standard"));
  if ((isEcom && isMedPlus) || isSaaS)
    R("integration","queue_type","sns",t("✨ 멀티 시스템 알림 표준","✨ Standard for multi-system notifications"),t("주문 완료 이벤트를 재고·배송·분석 시스템에 동시 전달. Fan-out 패턴의 기본","Deliver order completion events simultaneously to inventory, shipping, and analytics systems. Fan-out pattern basics"));
  if (isSaaS || (isData && dataD !== "ml_pipeline"))
    R("integration","queue_type","eventbridge",t("✨ 이벤트 라우팅 권장","✨ Recommended for event routing"),t("200+ AWS 서비스 통합. 이벤트 규칙 기반 라우팅으로 서비스 간 결합도 최소화","200+ AWS service integrations. Minimize inter-service coupling with event rule-based routing"));
  if (isIoT || (isData && dataD === "stream_analytics") || isRT)
    R("integration","queue_type","kinesis",t("⭐ 스트리밍 필수","⭐ Required for streaming"),t("초당 수만 IoT 메시지·클릭스트림 처리. 최대 365일 리텐션으로 재처리 가능","Process tens of thousands of IoT messages/clickstreams per second. Up to 365-day retention for reprocessing"));
  if (isXL && (isSaaS || isData))
    R("integration","queue_type","msk",t("✨ 대규모 Kafka 표준","✨ Large-scale Kafka standard"),t("MSK: 하루 수백억 이벤트. Schema Registry 강제로 데이터 계약 보장","MSK: Billions of events per day. Schema Registry enforcement guarantees data contracts"));
  { const hyb = state.network?.hybrid;
    const hasOnPrem = Array.isArray(hyb) ? hyb.includes("vpn") || hyb.includes("dx") : hyb === "vpn" || hyb === "dx";
    if (hasOnPrem)
      R("integration","queue_type","amazon_mq",t("✨ 온프레미스 MQ 마이그레이션","✨ On-premises MQ migration"),t("기존 ActiveMQ/RabbitMQ JMS/AMQP 코드 그대로 이전. 신규 프로젝트는 SQS 권장","Migrate existing ActiveMQ/RabbitMQ JMS/AMQP code as-is. SQS recommended for new projects"));
  }

  if (!isIoT && !isUltraRPS && exp !== "beginner")
    R("integration","api_type","alb",t("⭐ 대부분 서비스 기본","⭐ Default for most services"),t("ALB만으로 충분합니다. API Gateway는 불필요한 비용과 복잡도를 추가합니다","ALB alone is sufficient. API Gateway adds unnecessary cost and complexity"));
  if (isIoT || isUltraRPS || isMVP)
    R("integration","api_type","api_gateway",t("✨ 서버리스/IoT 권장","✨ Recommended for serverless/IoT"),t("Lambda 직접 연동 + Rate Limiting + API 키 관리. IoT 디바이스 인증에도 유용","Direct Lambda integration + Rate Limiting + API key management. Also useful for IoT device authentication"));
  if (isIoT && iotD === "industrial")
    R("integration","api_type","nlb",t("✨ 산업 IoT TCP 전용","✨ Industrial IoT TCP dedicated"),t("MQTT·TCP 프로토콜 지원. IoT Core와 연동 시 NLB가 ALB보다 낮은 레이턴시","MQTT/TCP protocol support. NLB has lower latency than ALB when integrating with IoT Core"));
  if (isXL && isMature && isSaaS)
    R("integration","api_type","both",t("✨ 대규모 복합 API","✨ Large-scale composite API"),t("외부 API는 API Gateway(Rate Limit), 내부 서비스 간은 ALB(저비용)로 분리","External APIs use API Gateway (Rate Limit), internal service-to-service uses ALB (low cost)"));

  if (!isData && !isEcom)
    R("integration","batch_workflow","none",t("✨ 배치 불필요","✨ Batch unnecessary"),t("실시간 처리만으로 충분. 추후 정산·리포트 필요 시 EventBridge Scheduler 추가","Real-time processing alone is sufficient. Add EventBridge Scheduler when settlement/reports are needed later"));
  if (isSaaS || (isEcom && ecomD === "subscription"))
    R("integration","batch_workflow","eventbridge_sch",t("✨ 정기 배치 표준","✨ Standard for scheduled batch"),t("EventBridge Scheduler: 매일 새벽 정산, 월간 청구서 발행. Cron보다 안정적","EventBridge Scheduler: Daily early-morning settlement, monthly invoicing. More reliable than Cron"));
  if (isData || (isTx && isLarge))
    R("integration","batch_workflow","aws_batch",t("⭐ 대용량 배치 필수","⭐ Required for large-volume batch"),t("ML 학습·정산·대용량 데이터 변환: Spot으로 70% 비용 절감 + 자동 확장","ML training, settlement, large data transformation: 70% cost savings with Spot + Auto Scaling"));
  if (isEcom && isMedPlus)
    R("integration","batch_workflow","step_functions",t("✨ 복잡한 워크플로우","✨ Complex workflows"),t("주문-결제-재고-배송의 복잡한 상태 관리. 시각적 워크플로우 + 재시도 자동화","Complex state management for order-payment-inventory-shipping. Visual workflows + automated retries"));
  if (isTick || (isEcom && isSpiky))
    R("integration","batch_workflow","ecs_scheduled",t("✨ 이벤트 후 배치","✨ Post-event batch"),t("이벤트 종료 후 정산·통계 집계를 ECS Task로 실행. ECS 클러스터 재사용","Run settlement and statistics aggregation as ECS Tasks after events. Reuse ECS cluster"));

  // ── EDGE ───────────────────────────────────────────────────────
  if (isInternal && !isGlobal)
    R("edge","cdn","no",t("✨ 사내 도구 불필요","✨ Unnecessary for internal tools"),t("내부 직원만 사용 시 CloudFront 불필요. ALB 직접 연결로 단순하게","CloudFront unnecessary when only internal employees use it. Keep it simple with direct ALB connection"));
  if (!isInternal && !isGlobal)
    R("edge","cdn","yes",t("⭐ 모든 외부 서비스 기본","⭐ Default for all external services"),t("CloudFront: 정적 파일 캐시 + 오리진 보호 + HTTPS 자동. 비용보다 이득이 더 큼","CloudFront: Static file cache + origin protection + automatic HTTPS. Benefits outweigh costs"));
  if (isGlobal)
    R("edge","cdn","global",t("⭐ 글로벌 서비스 필수","⭐ Required for global services"),t("Global Accelerator + CloudFront: 전 세계 엣지에서 50ms 이하 응답","Global Accelerator + CloudFront: Sub-50ms response from edge locations worldwide"));
  if (isEcom && isGlobal)
    R("edge","cdn","global",t("⭐ 글로벌 이커머스 CDN 필수","⭐ Global e-commerce CDN required"),t("글로벌 이커머스는 Global CDN 필수. 상품 이미지·정적 자산 캐싱으로 오리진 부하 90% 감소 + 해외 사용자 레이턴시 최소화","Global CDN required for global e-commerce. 90% origin load reduction with product image/static asset caching + minimize overseas user latency"));

  if (!isGlobal && !isHighAvail && !isTx)
    R("edge","dns","basic",t("✨ 단일 리전 기본","✨ Single region baseline"),t("Route53 기본 라우팅. 추가 설정 없이 신뢰할 수 있는 DNS 서비스","Route53 basic routing. Reliable DNS service without additional configuration"));
  if ((isHighAvail || isTx) && !isGlobal)
    R("edge","dns","health",t("⭐ 고가용성 필수","⭐ Required for high availability"),t("Route53 헬스체크: 서버 장애 감지 즉시 DNS 자동 전환. 99.95% 가용성의 마지막 방어선","Route53 health checks: Automatic DNS failover upon server failure detection. Last line of defense for 99.95% availability"));
  if (isGlobal)
    R("edge","dns","latency",t("⭐ 글로벌 서비스 필수","⭐ Required for global services"),t("지연시간 기반 라우팅 + 헬스체크 포함: 사용자를 가장 가까운 리전으로 자동 연결","Latency-based routing + health checks included: Automatically connects users to the nearest region"));
  if (isSaaS && isB2B && isGlobal)
    R("edge","dns","geoloc",t("✨ GDPR/데이터 주권 대응","✨ GDPR/data sovereignty compliance"),t("지역별 법적 요건에 따라 지역 사용자를 특정 리전으로 강제 라우팅","Force-route regional users to specific regions based on local legal requirements"));

  if (isInternal)
    R("edge","waf","no",t("✨ 사내 도구 불필요","✨ Unnecessary for internal tools"),t("인터넷 노출 없는 사내 도구. WAF 대신 보안 그룹 + IAM으로 충분","Internal tools with no internet exposure. Security Groups + IAM are sufficient instead of WAF"));
  if (!hasCritCert && !isEcom && !isTick)
    R("edge","waf","basic",t("⭐ 외부 서비스 기본 보안","⭐ Basic security for external services"),t("SQL 인젝션·XSS·LFI 차단. AWS Managed Rules: 즉시 적용 가능한 기본 규칙 세트","Block SQL injection, XSS, LFI. AWS Managed Rules: Ready-to-apply baseline rule sets"));
  if (isEcom || isTick)
    R("edge","waf","bot",t("⭐ 이커머스/티켓팅 필수","⭐ Required for e-commerce/ticketing"),t("매크로 봇 없이 공정한 선착순 불가. 이벤트 당일 봇이 70~90% 트래픽을 차지합니다","Fair first-come-first-served is impossible without blocking macro bots. Bots account for 70-90% of event-day traffic"));
  if (hasCritCert || avail === "99.99" || (isXL && isTx))
    R("edge","waf","shield",t("⭐ 고가용성/금융 필수","⭐ Required for high availability/financial"),t("DDoS 방어 SLA + 24/7 DRT 대응팀. 공격 중에도 서비스 유지. 금융 규정 준수 요건","DDoS defense SLA + 24/7 DDoS Response Team (DRT). Service maintained during attacks. Financial compliance requirement"));
  if (isTick && isFlash && isHighAvail)
    R("edge","waf","shield",t("⭐ 플래시 세일 DDoS 방어 필수","⭐ Flash sale DDoS defense required"),t("플래시 세일 트래픽과 DDoS 공격 구별 불가. Shield Advanced DRT팀이 실시간 대응하여 정상 트래픽 보호","Cannot distinguish flash sale traffic from DDoS attacks. Shield Advanced DRT team provides real-time response to protect legitimate traffic"));

  // ── EDGE: cost-aware recommendations ──────────────────────────
  if (isCostFirst && isInternal)
    R("edge","waf","no",t("💰 내부 도구에 WAF 불필요","💰 WAF unnecessary for internal tools"),t("비용 우선 + 사내 도구: 인터넷 노출이 없으면 WAF 비용 절약. Security Group + IAM으로 충분","Cost first + internal tools: Save WAF costs when no internet exposure. Security Groups + IAM are sufficient"));
  if (isPerfFirst && !isInternal)
    R("edge","waf","bot",t("⭐ 봇 공격 방어로 안정성 확보","⭐ Stability via bot attack defense"),t("성능 우선: Bot Control로 악성 트래픽 차단. 정상 사용자에게 안정적 응답 보장","Performance first: Block malicious traffic with Bot Control. Guarantee stable responses for legitimate users"));
  if (isCostFirst && isSmall)
    R("edge","cdn","no",t("💰 트래픽 적으면 CDN 비용이 더 큼","💰 CDN costs more with low traffic"),t("비용 우선: 소규모 트래픽에서는 CloudFront 비용이 ALB 직접 연결보다 비쌀 수 있음. 중대형 트래픽에서는 CDN이 오히려 비용 절감","Cost first: For low traffic, CloudFront costs can exceed direct ALB connection. For medium+ traffic, CDN actually reduces costs"));

  // ── CICD ───────────────────────────────────────────────────────
  if (isMVP || begOrSolo)
    R("cicd","iac","cdk",t("✨ 소규모 첫 시작 권장","✨ Recommended for small-scale first start"),t("TypeScript/Python CDK: AWS 서비스를 코드로 정의. Terraform보다 학습 곡선 낮음","TypeScript/Python CDK: Define AWS services as code. Lower learning curve than Terraform"));
  if (!begOrSolo && !isXL)
    R("cicd","iac","terraform",t("⭐ 중대규모 업계 표준","⭐ Industry standard for mid-to-large scale"),t("멀티 계정·멀티 리전 관리의 사실상 표준. AWS 외 서비스도 동일하게 관리 가능","De facto standard for multi-account/multi-region management. Manage non-AWS services the same way"));
  if (isXL && hasCritCert)
    R("cicd","iac","cfn",t("✨ AWS 완전 네이티브","✨ Fully AWS-native"),t("CloudFormation StackSets: 수십 개 계정에 동일 템플릿 일괄 배포. Organizations 통합","CloudFormation StackSets: Bulk deploy identical templates to dozens of accounts. Organizations integration"));
  if (isMVP && isInternal)
    R("cicd","iac","none",t("✨ 초기 수동 설정","✨ Initial manual setup"),t("MVP 초기: 콘솔에서 빠르게 세팅. 서비스 안정 후 IaC로 마이그레이션","Early MVP: Quick setup via console. Migrate to IaC after service stabilizes"));

  if (begOrSolo || isMVP || (!hasCritCert && teamSize !== "large"))
    R("cicd","pipeline","github",t("⭐ 소~중규모 표준","⭐ Standard for small-to-mid scale"),t("GitHub Actions: 가장 빠른 설정. 무료 월 2000분. 오픈소스 액션 생태계 최대","GitHub Actions: Fastest setup. 2000 free minutes/month. Largest open-source action ecosystem"));
  if (isLarge && (hasCritCert || bizModel === "saas_license"))
    R("cicd","pipeline","gitlab",t("✨ 보안 기업 환경","✨ Secure enterprise environment"),t("GitLab CI: 온프레미스 설치 가능. 코드가 외부 서버에 나가지 않아야 하는 금융·공공","GitLab CI: On-premises installation available. For financial/public sectors where code must not leave external servers"));
  if (isLarge && !hasCritCert && bizModel !== "saas_license")
    R("cicd","pipeline","codepipeline",t("✨ AWS 올인 환경","✨ AWS all-in environment"),t("CodePipeline: ECS/EKS 배포 + ECR 연동이 가장 자연스러움. AWS 이벤트 자동 트리거","CodePipeline: Most natural ECS/EKS deployment + ECR integration. AWS event auto-triggers"));

  if (!isTx && !isHighAvail && !hasCritCert)
    R("cicd","deploy_strategy","rolling",t("⭐ 일반 서비스 기본","⭐ Default for general services"),t("Rolling 배포: 추가 비용 없이 무중단 배포. 대부분의 서비스에 충분합니다","Rolling deployment: Zero-downtime deployment at no extra cost. Sufficient for most services"));
  if (isTx || isHighAvail || hasCritCert)
    R("cicd","deploy_strategy","bluegreen",t("⭐ 고가용성/결제 필수","⭐ Required for high availability/payment"),t("Blue/Green: 새 버전 문제 발생 시 1분 내 이전 버전으로 즉시 전환 가능","Blue/Green: Instant rollback to previous version within 1 minute if new version has issues"));
  if (isXL || (isMature && isLarge && !hasCritCert))
    R("cicd","deploy_strategy","canary",t("✨ 대규모 위험 최소화","✨ Risk minimization for large scale"),t("Canary: 트래픽 5%만 새 버전으로. 실제 사용자로 검증 후 점진적 전환","Canary: Only 5% of traffic to new version. Gradual rollout after validation with real users"));

  if (isMVP || isSmall)
    R("cicd","env_count","dev_prod",t("✨ 소규모/MVP 적정","✨ Ideal for small scale/MVP"),t("Dev+Prod 2환경. Stage 없이 빠른 배포. 팀 3명 이상되면 Stage 추가 권장","Dev+Prod 2 environments. Fast deployment without Stage. Stage addition recommended when team exceeds 3"));
  if (!isMVP && !isXL)
    R("cicd","env_count","three",t("⭐ 운영 서비스 표준","⭐ Production service standard"),t("Dev->Stage->Prod: Stage에서 프로덕션 환경 검증 후 배포. 운영 사고 70% 방지","Dev->Stage->Prod: Verify in production-like Stage before deploying. Prevents 70% of production incidents"));
  if (isXL || (isLarge && hasCritCert))
    R("cicd","env_count","four",t("✨ 대규모/규정 준수","✨ Large-scale/compliance"),t("Dev->Stage->PreProd->Prod: 성능 테스트 전용 환경 분리. PCI DSS 환경 분리 요건","Dev->Stage->PreProd->Prod: Separate environment for performance testing. PCI DSS environment separation requirement"));

  // ── CICD: cost-aware recommendations ──────────────────────────
  if (isCostFirst)
    R("cicd","deploy_strategy","rolling",t("💰 추가 비용 없는 무중단 배포","💰 Zero-cost zero-downtime deployment"),t("비용 우선: Rolling 배포는 추가 인프라 비용 없이 무중단 배포 가능. 대부분 서비스에 충분","Cost first: Rolling deployment enables zero-downtime deployment without extra infrastructure cost. Sufficient for most services"));
  if (isPerfFirst)
    R("cicd","deploy_strategy","bluegreen",t("⭐ 1분 내 즉시 롤백 가능","⭐ Instant rollback within 1 minute"),t("성능 우선: Blue/Green은 문제 발생 시 1분 내 이전 버전으로 즉시 전환. 서비스 안정성 최대화","Performance first: Blue/Green enables instant rollback to previous version within 1 minute. Maximizes service stability"));
  if (isPerfFirst)
    R("cicd","env_count","three",t("⭐ Stage 환경으로 프로덕션 사고 70% 방지","⭐ Stage env prevents 70% of production incidents"),t("성능 우선: Dev->Stage->Prod 3환경으로 프로덕션 환경 사전 검증. 운영 사고 대폭 감소","Performance first: Pre-validate in production-like Stage with Dev->Stage->Prod. Drastically reduces production incidents"));

  // ── COST ───────────────────────────────────────────────────────
  if (isMVP || isSmall)
    R("cost","priority","cost_first",t("⭐ MVP/소규모 최우선","⭐ Top priority for MVP/small scale"),t("검증 전 성능 과투자는 낭비. 필요할 때 쉽게 업그레이드 가능한 서비스를 선택하세요","Over-investing in performance before validation is wasteful. Choose services that can be easily upgraded when needed"));
  if (!isMVP && !isXL)
    R("cost","priority","balanced",t("⭐ 성장기 표준","⭐ Growth-stage standard"),t("On-Demand + 1년 RI 혼합 + Spot 배치 활용. 성능 저하 없이 30~40% 절감","On-Demand + 1-year RI mix + Spot batch utilization. 30-40% savings without performance degradation"));
  if (isTx && isLarge)
    R("cost","priority","perf_first",t("✨ 거래 서비스 고려","✨ Consider for transactional services"),t("결제 중단 1시간 손실 > 성능 투자 비용. 병목 제거가 비용 절감보다 ROI 높음","1 hour payment outage loss > performance investment cost. Removing bottlenecks has higher ROI than cost cutting"));

  if (isMVP || isSmall || isSpiky)
    R("cost","commitment","none",t("⭐ 유연성 필요 시 필수","⭐ Essential when flexibility is needed"),t("서비스 방향 변경 가능성이 있으면 약정 금물. On-Demand의 유연성이 더 가치 있음","Avoid commitments if service direction may change. On-Demand flexibility is more valuable"));
  if (isSteady && isMedPlus && !isMVP)
    R("cost","commitment","1yr",t("💰 안정적 서비스 절감","💰 Savings for stable services"),t("1년 RI로 40% 절감. 시리즈 A~B 단계에서 비용 구조 개선에 효과적","40% savings with 1-year RI. Effective for cost structure improvement at Series A-B stage"));
  if (isMature && isLarge && isSteady)
    R("cost","commitment","3yr",t("💰 최대 절감","💰 Maximum savings"),t("3년 Savings Plans: 최대 72% 절감. 서비스 방향이 확정된 성숙기 서비스에 한해","3-year Savings Plans: Up to 72% savings. Only for mature services with confirmed direction"));

  if (isTx || isTick || isRT)
    R("cost","spot_usage","no",t("⭐ 거래/실시간 서비스 필수","⭐ Required for transactional/realtime services"),t("결제·티켓팅·채팅 서버 Spot 사용 금지. 서버 중단 시 트랜잭션 손실 발생","No Spot for payment/ticketing/chat servers. Server interruption causes transaction loss"));
  if ((isData || isIoT) && isTx)
    R("cost","spot_usage","partial",t("💰 혼합 권장","💰 Mixed use recommended"),t("메인 API는 On-Demand, 배치·데이터 처리는 Spot. 안정성과 비용 절감 동시 달성","Main API on On-Demand, batch/data processing on Spot. Achieve both stability and cost savings"));
  if ((isEcom && ecomD === "subscription") && !isTx && !isTick && !isRT)
    R("cost","spot_usage","partial",t("💰 혼합 권장","💰 Mixed use recommended"),t("메인 API는 On-Demand, 배치·데이터 처리는 Spot. 안정성과 비용 절감 동시 달성","Main API on On-Demand, batch/data processing on Spot. Achieve both stability and cost savings"));
  if ((isData || isIoT) && !isTx && !isTick && !isRT)
    R("cost","spot_usage","heavy",t("💰 데이터 처리 최적","💰 Optimal for data processing"),t("ML 학습·ETL·로그 집계: Spot으로 70% 절감. 중단 후 자동 재시작으로 완전 자동화","ML training, ETL, log aggregation: 70% savings with Spot. Fully automated with auto-restart after interruption"));
  if ((isSaaS || isWebApi) && !isTx && !isTick && !isRT && !isData && !isIoT)
    R("cost","spot_usage","partial",t("💰 백그라운드 워커에 Spot 활용","💰 Use Spot for background workers"),t("메인 API는 On-Demand, 백그라운드 작업(리포트·알림·집계)은 Spot으로 비용 절감. 안정성과 비용 최적화 동시 달성","Main API on On-Demand, background tasks (reports, notifications, aggregation) on Spot for savings. Achieve both stability and cost optimization"));

  // ── PLATFORM ───────────────────────────────────────────────────
  R("platform","node_provisioner","karpenter",t("⭐ EKS 신규 표준","⭐ New EKS standard"),t("Cluster Autoscaler 대비 2~3배 빠른 노드 프로비저닝. Spot 혼합 자동 관리","2-3x faster node provisioning vs Cluster Autoscaler. Automatic Spot mix management"));
  if (!isLarge)
    R("platform","node_provisioner","cluster_autoscaler",t("✨ 기존 클러스터 호환","✨ Existing cluster compatible"),t("이미 Cluster Autoscaler 사용 중이면 유지. 신규 클러스터는 Karpenter 권장","Keep if already using Cluster Autoscaler. Karpenter recommended for new clusters"));

  R("platform","ingress","alb_controller",t("⭐ AWS 네이티브 표준","⭐ AWS-native standard"),t("ALB 자동 생성 + WAF/Shield 통합. AWS 환경에서 가장 자연스러운 선택","Auto ALB creation + WAF/Shield integration. Most natural choice in AWS environments"));
  if (isLarge && exp === "senior")
    R("platform","ingress","nginx",t("✨ 고급 라우팅 필요 시","✨ When advanced routing is needed"),t("복잡한 URL 리다이렉트·리라이트·Lua 스크립트가 필요한 경우에 선택","Choose when complex URL redirects, rewrites, or Lua scripts are needed"));
  if (isXL && isSaaS)
    R("platform","ingress","kong",t("✨ API 게이트웨이 통합","✨ API gateway integration"),t("Kong: Rate Limiting·플러그인·개발자 포털이 필요한 대형 API 플랫폼","Kong: For large API platforms that need Rate Limiting, plugins, and developer portals"));

  R("platform","service_mesh","none",t("⭐ 대부분 EKS 서비스 충분","⭐ Sufficient for most EKS services"),t("Service Mesh 없이도 Network Policy + mTLS로 충분. 운영 복잡도 최소화","Network Policy + mTLS is sufficient without Service Mesh. Minimize operational complexity"));
  // App Mesh EOL 2026 — replaced by VPC Lattice (recommended below)
  if (isXL && exp === "senior" && teamSize === "large")
    R("platform","service_mesh","istio",t("✨ 완전한 서비스 메시 필요 시","✨ When full service mesh is needed"),t("mTLS 자동화 + 세밀한 트래픽 제어. 운영 팀 숙련도 필수. 학습 비용 높음","Automated mTLS + fine-grained traffic control. Operations team proficiency required. High learning cost"));
  if (!isEks || exp !== "senior")
    R("platform","service_mesh","vpc_lattice",t("⭐ 최신 서비스 메시","⭐ Latest service mesh"),t("App Mesh(2026 EOL) 대체. 모든 컴퓨트(ECS/EKS/Lambda)에서 사용 가능. 입문자도 가능","App Mesh (2026 EOL) replacement. Works with all compute (ECS/EKS/Lambda). Beginner-friendly"));

  if (begOrSolo || isSmall)
    R("platform","gitops","none",t("✨ 소규모 EKS 불필요","✨ Unnecessary for small EKS"),t("GitHub Actions + kubectl apply로 충분. GitOps 도입 전 기본기 먼저","GitHub Actions + kubectl apply is sufficient. Master the basics before adopting GitOps"));
  if (!begOrSolo && !isSmall)
    R("platform","gitops","argocd",t("⭐ EKS GitOps 표준","⭐ EKS GitOps standard"),t("Git이 진실의 원천. 배포 이력·드리프트 감지·시각적 UI. EKS GitOps의 사실상 표준","Git as the source of truth. Deploy history, drift detection, visual UI. De facto standard for EKS GitOps"));
  if (isLarge && exp === "senior")
    R("platform","gitops","flux",t("✨ Helm 중심 배포 환경","✨ Helm-centric deployment environment"),t("Helm 차트 기반 배포가 주라면 Flux가 더 자연스럽고 가볍습니다","If Helm chart-based deployments are primary, Flux is more natural and lightweight"));

  if (isLarge && exp === "senior")
    R("platform","k8s_monitoring","prometheus_grafana",t("⭐ EKS 오픈소스 표준","⭐ EKS open-source standard"),t("kube-prometheus-stack 한 번에 설치. Grafana 대시보드 수천 개 커뮤니티 제공","Install kube-prometheus-stack at once. Thousands of community-provided Grafana dashboards"));
  if (!isLarge || exp === "beginner")
    R("platform","k8s_monitoring","cloudwatch",t("✨ AWS 올인/소규모 권장","✨ Recommended for AWS all-in/small scale"),t("추가 도구 없이 AWS 콘솔에서 바로. Container Insights 켜기만 하면 됨","Directly from AWS Console with no additional tools. Just enable Container Insights"));
  if (isXL)
    R("platform","k8s_monitoring","hybrid",t("✨ 대규모 이중화 모니터링","✨ Large-scale dual monitoring"),t("Prometheus(메트릭) + CloudWatch(로그·알람): 각자 강점 활용","Prometheus (metrics) + CloudWatch (logs/alarms): Leverage each tool's strengths"));

  R("platform","k8s_secrets","native",t("✨ 소규모 간단한 시작","✨ Simple start for small scale"),t("K8s Secret Base64: 단순하지만 etcd 암호화 필수. 소규모 내부 서비스에 충분","K8s Secret Base64: Simple but etcd encryption is required. Sufficient for small internal services"));
  if (!begOrSolo)
    R("platform","k8s_secrets","secrets_csi",t("⭐ 운영 표준","⭐ Production standard"),t("AWS Secrets Manager 시크릿을 Pod에 자동 마운트. 30일 자동 교체 + CloudTrail 감사","Auto-mount AWS Secrets Manager secrets to Pods. 30-day auto-rotation + CloudTrail auditing"));
  if (isLarge && exp === "senior")
    R("platform","k8s_secrets","external_secrets",t("✨ 기존 K8s Secret 호환","✨ Existing K8s Secret compatible"),t("ESO: Secrets Manager -> K8s Secret 자동 동기화. 기존 앱 코드 변경 없이 도입","ESO: Auto-sync Secrets Manager to K8s Secrets. Adopt without existing app code changes"));

  if (!hasCritCert)
    R("platform","pod_security","psa",t("✨ K8s 내장 기본 보안","✨ K8s built-in baseline security"),t("추가 도구 없이 Privileged Pod 차단. 시작점으로 충분합니다","Block Privileged Pods without additional tools. Sufficient as a starting point"));
  if (hasCritCert || isLarge)
    R("platform","pod_security","kyverno",t("⭐ 규정 준수 권장","⭐ Recommended for compliance"),t("YAML로 정책 작성. 최신 이미지 태그 금지·리소스 Limit 강제. Rego보다 쉬움","Write policies in YAML. Forbid latest image tags, enforce resource limits. Easier than Rego"));
  if (isXL && exp === "senior")
    R("platform","pod_security","opa_gatekeeper",t("✨ 복잡한 커스텀 정책","✨ Complex custom policies"),t("Rego 언어로 무한한 커스텀 정책. 대형 플랫폼 팀의 표준이지만 학습 비용 높음","Unlimited custom policies with Rego language. Standard for large platform teams but high learning cost"));

  R("platform","network_policy","vpc_cni",t("⭐ EKS 기본 표준","⭐ EKS default standard"),t("AWS VPC CNI: Pod에 VPC IP 직접 할당. AWS 서비스와 통신 가장 단순. 기본 선택","AWS VPC CNI: Direct VPC IP assignment to Pods. Simplest communication with AWS services. Default choice"));
  if (hasCritCert || isXL)
    R("platform","network_policy","cilium",t("✨ 고보안/고성능 필요 시","✨ When high security/performance is needed"),t("eBPF 기반 L7 정책 + Hubble 가시성. 네트워크 정책 세밀 제어가 필요할 때","eBPF-based L7 policies + Hubble observability. When fine-grained network policy control is needed"));

  if (!isXL)
    R("platform","k8s_backup","git_only",t("✨ 소규모 충분","✨ Sufficient for small scale"),t("IaC + GitOps로 재배포 가능하면 Velero 불필요. 중요 데이터는 DB 백업으로","Velero unnecessary if redeployable via IaC + GitOps. Use DB backups for important data"));
  if (isLarge || hasCritCert)
    R("platform","k8s_backup","velero",t("⭐ 운영 클러스터 필수","⭐ Required for production clusters"),t("PVC 포함 전체 클러스터 백업. 복구 테스트를 분기 1회 실시하세요","Full cluster backup including PVCs. Conduct recovery tests quarterly"));

  if (!isIoT && !isLarge)
    R("platform","autoscaling_strategy","hpa_only",t("⭐ 대부분 EKS 서비스 기본","⭐ Default for most EKS services"),t("CPU 기반 HPA min:2 max:10: 가장 단순하고 안정적인 K8s 확장 방법","CPU-based HPA min:2 max:10: Simplest and most stable K8s scaling method"));
  if (isIoT || (isData && dataD === "stream_analytics") || isTick)
    R("platform","autoscaling_strategy","hpa_keda",t("⭐ 이벤트 기반 필수","⭐ Required for event-driven"),t("KEDA: SQS/Kinesis 메시지 수 기반 확장. CPU보다 30% 더 정확한 스케일링","KEDA: Scale based on SQS/Kinesis message count. 30% more accurate scaling than CPU-based"));
  if (isXL && isMature)
    R("platform","autoscaling_strategy","hpa_vpa",t("✨ 리소스 최적화 고급","✨ Advanced resource optimization"),t("VPA로 Pod 크기 자동 최적화 + HPA로 Pod 수 조절. 리소스 낭비 최소화","Auto-optimize Pod size with VPA + adjust Pod count with HPA. Minimize resource waste"));

  if (!isXL && !hasCritCert)
    R("platform","cluster_strategy","single_ns",t("✨ 소규모/단일팀 적합","✨ Suitable for small/single team"),t("단일 네임스페이스로 시작. 팀·서비스 증가 시 분리 전략 적용","Start with single namespace. Apply separation strategy as teams and services grow"));
  if (isLarge || hasCritCert || (isSaaS && exp === "senior"))
    R("platform","cluster_strategy","multi_cluster",t("✨ 환경/팀 격리 필요 시","✨ When environment/team isolation is needed"),t("Prod/Stage/Dev 클러스터 분리: 실수가 Prod에 영향 없음. ISMS 환경 분리 충족","Prod/Stage/Dev cluster separation: Mistakes don't affect Prod. Meets ISMS environment separation"));

  // ── APP STACK ──────────────────────────────────────────────────
  if (isIoT || isData)
    R("team","language","python_fastapi",t("⭐ 데이터/IoT 필수","⭐ Required for data/IoT"),t("Python 생태계: boto3·pandas·numpy·TensorFlow. 데이터 처리 라이브러리 압도적","Python ecosystem: boto3, pandas, numpy, TensorFlow. Overwhelmingly dominant data processing libraries"));
  if (isRT || (isEcom && !isSaaS) || isTick)
    R("team","language","node_express",t("⭐ 실시간/이커머스 권장","⭐ Recommended for realtime/e-commerce"),t("비동기 논블로킹: WebSocket·고동시성 API 최적. 프론트 팀과 언어 공유 가능","Async non-blocking: Optimal for WebSocket and high-concurrency APIs. Shared language with frontend team"));
  if (isSaaS || (isB2B && hasCritCert) || bizModel === "saas_license")
    R("team","language","spring_boot",t("✨ 엔터프라이즈 B2B 권장","✨ Recommended for enterprise B2B"),t("Java Spring Boot: 금융·공공·엔터프라이즈에서 검증된 선택. JVM 성능 안정적","Java Spring Boot: Proven choice in financial, public, and enterprise sectors. Stable JVM performance"));
  if (isXL && isMature && exp === "senior")
    R("team","language","go",t("✨ 고성능/마이크로서비스","✨ High-performance/microservices"),t("Go: 컴파일 언어 최고 성능 + 낮은 메모리. K8s 컨트롤러나 고성능 API에 적합","Go: Best compiled language performance + low memory. Suitable for K8s controllers or high-performance APIs"));
  if (!isXL && !isMVP && isMedPlus)
    R("team","language","mixed",t("✨ 서비스별 최적 언어 선택","✨ Optimal language per service"),t("MSA: 서비스마다 최적 언어 선택 가능. 단, 팀 역량 분산 주의","Microservices: Choose the optimal language per service. However, be cautious of team expertise dilution"));

  if (!isXL && !isSaaS)
    R("appstack","api_gateway_impl","alb_only",t("⭐ 대부분 서비스 표준","⭐ Standard for most services"),t("ALB만으로 충분합니다. API Gateway 비용 없이 동일한 라우팅 가능","ALB alone is sufficient. Same routing capabilities without API Gateway cost"));
  if (isMVP || isIoT || begOrSolo)
    R("appstack","api_gateway_impl","aws_apigw",t("✨ Lambda 연동 최적","✨ Optimal for Lambda integration"),t("Lambda 직접 연동 + Rate Limiting + API 키. 서버리스 아키텍처의 기본 조합","Direct Lambda integration + Rate Limiting + API keys. Basic combination for serverless architecture"));
  if (state.team?.language === "spring_boot" && !isMVP)
    R("appstack","api_gateway_impl","spring_gateway",t("✨ Spring Boot 팀 권장","✨ Recommended for Spring Boot teams"),t("Spring Cloud Gateway: Spring 생태계 통합. Circuit Breaker·Rate Limiter 내장. Java 팀에 자연스러운 선택","Spring Cloud Gateway: Spring ecosystem integration. Built-in Circuit Breaker and Rate Limiter. Natural choice for Java teams"));
  if (isSaaS && isB2B && isXL)
    R("appstack","api_gateway_impl","kong",t("✨ 대형 API 플랫폼 권장","✨ Recommended for large API platforms"),t("Kong: 개발자 포털·플러그인·멀티테넌트 Rate Limiting. B2B API 플랫폼 표준","Kong: Developer portal, plugins, multi-tenant Rate Limiting. B2B API platform standard"));

  if (!isXL || !isMature)
    R("appstack","protocol","rest",t("⭐ 대부분 서비스 표준","⭐ Standard for most services"),t("REST HTTP/JSON: 브라우저·앱·서드파티 모두 지원. 학습 곡선 없음. 기본 선택","REST HTTP/JSON: Supported by browsers, apps, and third parties. No learning curve. Default choice"));
  if (isIoT || (isXL && isMature && exp === "senior"))
    R("appstack","protocol","grpc",t("✨ 고성능 내부 통신","✨ High-performance internal communication"),t("gRPC: Protobuf 직렬화로 REST 대비 수 배 빠른 내부 통신. IoT 디바이스 저대역폭 통신","gRPC: Internal communication several times faster than REST with Protobuf serialization. Low-bandwidth IoT device communication"));
  if (isRT || (isSaaS && isB2B))
    R("appstack","protocol","graphql",t("✨ 복잡한 데이터 조회 최적","✨ Optimal for complex data queries"),t("GraphQL: 클라이언트가 필요한 데이터만 요청. 오버페칭 없음. 빠른 프론트 개발","GraphQL: Clients request only the data they need. No over-fetching. Faster frontend development"));
  if (isXL && isMature)
    R("appstack","protocol","mixed",t("✨ 외부 REST + 내부 gRPC","✨ External REST + internal gRPC"),t("외부 API는 REST(호환성), 내부 MSA 통신은 gRPC(성능). 역할 분리","External APIs use REST (compatibility), internal microservices communication uses gRPC (performance). Role separation"));

  // ── MONITORING (non-EKS, CICD phase) ──────────────────────────────
  if (!isEks) {
    R("cicd","monitoring","cloudwatch",t("⭐ AWS 기본 모니터링","⭐ AWS default monitoring"),t("CloudWatch: 추가 설치 없이 로그·메트릭·알람 통합. 대부분 서비스의 기본 선택","CloudWatch: Integrated logs, metrics, and alarms without additional setup. Default choice for most services"));
    if (isMedPlus || isTx)
      R("cicd","monitoring","xray",t("✨ 분산 추적 권장","✨ Distributed tracing recommended"),t("X-Ray: 마이크로서비스 간 요청 흐름 시각화. 병목 구간과 오류 원인 빠른 파악","X-Ray: Visualize request flow between microservices. Quickly identify bottlenecks and error causes"));
    if (isLarge && seniorLarge)
      R("cicd","monitoring","datadog",t("✨ 통합 APM 플랫폼","✨ Unified APM platform"),t("Datadog: 로그·메트릭·트레이스를 하나의 UI에서. 강력하지만 비용이 높습니다","Datadog: Logs, metrics, and traces in a single UI. Powerful but expensive"));
  }

  // ── BATCH: Glue recommendation ──────────────────────────────────
  if (isData && (dataD === "log_analytics" || dataD === "bi_dashboard" || dataD === "stream_analytics"))
    R("integration","batch_workflow","glue",t("⭐ 대용량 ETL 서비스","⭐ Large-scale ETL service"),t("AWS Glue: Spark 기반 서버리스 ETL. 데이터 카탈로그로 스키마 자동 관리. 데이터 레이크 구성에 필수","AWS Glue: Spark-based serverless ETL. Auto-manage schemas with Data Catalog. Essential for data lake setup"));

  // ALB+NLB dual pattern: when gRPC is used with ALB, suggest NLB alongside
  const protocol = state.appstack?.protocol;
  const apiType = state.integration?.api_type;
  if ((protocol === "grpc" || protocol === "mixed") && apiType === "alb")
    R("integration","api_type","alb",t("💡 gRPC 사용 시 NLB 병행 권장","💡 Consider NLB alongside ALB for gRPC"),t("ALB는 HTTP/REST에 최적이지만 gRPC는 NLB가 더 적합합니다. ALB(웹)+NLB(gRPC) 병행 패턴을 고려하세요","ALB is optimal for HTTP/REST but NLB better handles gRPC. Consider ALB(web)+NLB(gRPC) dual pattern"));

  if (!isEks)
    R("appstack","service_discovery","cloud_map",t("⭐ ECS 표준","⭐ ECS standard"),t("AWS Cloud Map: ECS 서비스 자동 등록. Route53 프라이빗 DNS로 이름 기반 통신","AWS Cloud Map: Auto-register ECS services. Name-based communication via Route53 private DNS"));
  if (isEks)
    R("appstack","service_discovery","k8s_dns",t("⭐ EKS 기본","⭐ EKS default"),t("CoreDNS: K8s 내장. 서비스 이름으로 자동 발견. 추가 설정 없이 동작","CoreDNS: Built into K8s. Auto-discovery by service name. Works without additional configuration"));

  R("appstack","api_versioning","url_path",t("⭐ 업계 표준","⭐ Industry standard"),t("URL 경로 /v1/ /v2/: 가장 직관적·캐시 가능·로그 분석 용이. 99% 서비스의 선택","URL path /v1/ /v2/: Most intuitive, cacheable, easy log analysis. Choice of 99% of services"));
  if (isInternal || isSaaS)
    R("appstack","api_versioning","header",t("✨ 헤더 버저닝","✨ Header versioning"),t("Accept: application/v2+json: URL 깔끔하지만 CDN 캐시에 버전 헤더 포함 필요","Accept: application/v2+json: Clean URLs but CDN cache must include version header"));
  if (isB2B && isXL)
    R("appstack","api_versioning","subdomain",t("✨ 완전 격리 버전 관리","✨ Fully isolated version management"),t("v2.api.example.com: 버전별 완전 독립. 대형 B2B API에서 고객사 마이그레이션 관리","v2.api.example.com: Fully independent per version. Client migration management for large B2B APIs"));

  if (!isIoT && !isData && !isXL)
    R("appstack","schema_registry","none",t("✨ 단순 서비스 불필요","✨ Unnecessary for simple services"),t("메시지 스키마 관리 불필요. REST API JSON + OpenAPI 스펙으로 충분","No message schema management needed. REST API JSON + OpenAPI spec is sufficient"));
  if (isIoT || (isData && dataD === "stream_analytics"))
    R("appstack","schema_registry","glue_registry",t("⭐ AWS 네이티브 권장","⭐ AWS-native recommended"),t("MSK·Kinesis 사용 시 Glue Registry가 AWS 통합 가장 자연스러움. IAM 권한 관리","Glue Registry is the most natural AWS integration when using MSK/Kinesis. IAM permission management"));
  if (isXL && isData && exp === "senior")
    R("appstack","schema_registry","confluent_registry",t("✨ Kafka 완전 생태계","✨ Full Kafka ecosystem"),t("대규모 Kafka 사용 시 Confluent Registry가 더 성숙한 스키마 진화 관리 제공","Confluent Registry provides more mature schema evolution management for large-scale Kafka usage"));

  return recs;
}
