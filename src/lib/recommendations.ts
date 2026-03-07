/* eslint-disable @typescript-eslint/no-explicit-any */
import type { WizardState, Recommendation } from "@/lib/types";

/**
 * getRecommendations -- returns recommendation badges for each wizard option.
 * Keys are "phase.questionId.optionValue", e.g. "compute.orchestration.eks"
 */
export function getRecommendations(
  state: WizardState
): Record<string, Recommendation> {
  const recs: Record<string, Recommendation> = {};
  const badgePriority = (b: string) => b.startsWith("\u2B50") ? 0 : b.startsWith("\u2728") ? 1 : 2;
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

  const types: string[] = state.workload?.type || [];
  const dau: string | undefined = state.scale?.dau;
  const rps: string | undefined = state.scale?.peak_rps;
  const pattern: string[] = state.scale?.traffic_pattern || [];
  const vol: string | undefined = state.scale?.data_volume;
  const teamSize: string | undefined = state.team?.team_size;
  const exp: string | undefined = state.team?.cloud_exp;
  const ops: string | undefined = state.team?.ops_model;
  const avail: string | undefined = state.slo?.availability;
  const cert: string[] = state.compliance?.cert || [];
  const dataS: string | undefined = state.workload?.data_sensitivity;
  const stage: string | undefined = state.workload?.growth_stage;
  const bizModel: string | undefined = state.workload?.business_model;
  const userTypes: string[] = state.workload?.user_type || [];
  const ecomD: string | undefined = state.workload?.ecommerce_detail;
  const tickD: string | undefined = state.workload?.ticketing_detail;
  const dataD: string | undefined = state.workload?.data_detail;
  const iotD: string | undefined = state.workload?.iot_detail;
  const orchestr: string | undefined = state.compute?.orchestration;
  const region: string | undefined = state.slo?.region;

  const isXL = dau === "xlarge";
  const isLarge = dau === "large" || isXL;
  const isMedPlus = dau === "medium" || isLarge;
  const isSmall = dau === "tiny" || dau === "small";
  const isMVP = stage === "mvp";
  const isMature = stage === "mature" || stage === "scale";
  const isHighRPS = rps === "high" || rps === "ultra";
  const isUltraRPS = rps === "ultra";
  const isHighAvail = avail === "99.95" || avail === "99.99";
  const hasCritCert =
    cert.includes("pci") || cert.includes("hipaa") || cert.includes("sox");
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
  const isInternal =
    types.includes("internal") &&
    !types.some((t) =>
      ["ecommerce", "ticketing", "realtime", "saas"].includes(t)
    );
  const isFlash = tickD === "flash" || tickD === "concert";
  const begOrSolo = exp === "beginner" || teamSize === "solo";
  const seniorLarge =
    exp === "senior" && (teamSize === "large" || teamSize === "medium");

  // ── SCALE ──────────────────────────────────────────────────────
  if (isMVP || (bizModel === "internal_tool" && !isMedPlus))
    R("scale","dau","tiny","✨ MVP/사내 도구 적정","검증 단계에는 초소형부터 시작해 트래픽에 맞게 확장하는 것이 비용 효율적입니다");
  if (isEcom && !isLarge)
    R("scale","dau","small","✨ 초기 이커머스 적정","스타트업 이커머스 초기 규모. ECS + Aurora로 시작해 트래픽에 맞게 확장하세요");
  if ((isEcom || isSaaS) && !isLarge)
    R("scale","dau","medium","✨ 성장기 서비스 적정","DAU 1~10만: Redis 캐시 도입이 필수가 되는 시점입니다");
  if (isLarge && !isXL)
    R("scale","dau","large","⭐ 설계 필요 시점","DAU 100만은 MSA 전환 + Aurora Global + EKS 도입 검토 시점입니다");
  if (isXL || (isTick && isFlash) || (isEcom && ecomD === "marketplace"))
    R("scale","dau","xlarge","⭐ 전담 인프라팀 필요","이 규모는 아키텍처 결정 하나가 월 수천만원 비용 차이를 냅니다");

  if (isInternal || isMVP)
    R("scale","peak_rps","low","✨ 사내 도구 적정","초당 100 이하: 단일 서버로 충분. 오버 엔지니어링 금물");
  if (!isHighRPS)
    R("scale","peak_rps","mid","✨ 일반 웹 서비스 기준","초당 100~1000: ALB + ECS Fargate 기본 구성으로 충분합니다");
  if ((isEcom || isRT || isSaaS) && !isUltraRPS)
    R("scale","peak_rps","high","✨ 캐시 필수 시점","초당 1000+: Redis 캐시 없이 DB 직접 쿼리 시 DB가 병목이 됩니다");
  if (isTick || isFlash || isUltraRPS)
    R("scale","peak_rps","ultra","⭐ 극한 동시성 대비 필요","초당 1만+: DynamoDB + Redis + CloudFront 조합 없이는 DB/서버 붕괴");

  if (isInternal || isSaaS || bizModel === "subscription")
    R("scale","traffic_pattern","steady","✨ B2B/구독형 일반 패턴","Reserved Instance로 40% 절감. 예측 가능한 비용 관리가 가능합니다");
  if (isInternal || bizModel === "saas_license")
    R("scale","traffic_pattern","business","✨ 업무 시간 집중 패턴","야간·주말 Scheduled Scaling으로 비용 30~50% 절감 가능합니다");
  if (isEcom || isTick)
    R("scale","traffic_pattern","spike","⭐ 이벤트 서비스 필수 체크","타임세일·오픈런: Scheduled Scaling을 이벤트 10분 전에 미리 설정하세요");
  if (isRT || isIoT || (isEcom && ecomD === "live_commerce"))
    R("scale","traffic_pattern","burst","✨ 실시간/라이브 패턴","CloudFront + SQS 버퍼링으로 예측 불가 폭증을 흡수하세요");

  if (isInternal || isMVP)
    R("scale","data_volume","none","✨ 연산 위주 서비스","Lambda + 외부 API 호출 위주. 자체 저장소 최소화로 비용 절감");
  if (!isData && !isIoT)
    R("scale","data_volume","gb","✨ 일반 서비스 적정","RDS/Aurora 단일 인스턴스로 수년간 충분합니다. 인덱스 설계가 성능 핵심");
  if (isEcom || isSaaS || (isTick && !isMVP))
    R("scale","data_volume","tb","✨ 운영 서비스 적정","S3 Intelligent-Tiering으로 오래된 데이터를 자동으로 저렴하게 보관하세요");
  if (isData || isIoT || isXL)
    R("scale","data_volume","ptb","⭐ 대용량 전략 필요","S3 데이터 레이크 + Athena 분석. Glacier로 오래된 데이터 이동 자동화 필수");

  // ── TEAM ───────────────────────────────────────────────────────
  if (isMVP || bizModel === "internal_tool")
    R("team","team_size","solo","✨ 1인 MVP 최적","Lambda + Aurora Serverless + Cognito: 서버 0대 운영 가능한 스택");
  if (isSmall && !isLarge)
    R("team","team_size","small","✨ 소규모 스타트업 적정","ECS Fargate로 서버 관리 없이 팀 전원이 서비스 개발에 집중하세요");
  if (isMedPlus && !isXL)
    R("team","team_size","medium","✨ 성장기 팀 적정","1~2명 DevOps 겸직으로 ECS + Terraform 스택 운영 가능한 규모");
  if (isXL || isLarge || hasCritCert)
    R("team","team_size","large","⭐ 대규모 서비스 필요","SRE/인프라 전담팀 없이 EKS + 멀티 계정 운영은 장애 위험이 높습니다");

  if (isMVP || begOrSolo)
    R("team","cloud_exp","beginner","✨ 관리형 서비스 집중","ECS Fargate + Aurora Serverless: AWS가 서버·DB를 관리. 코드에만 집중하세요");
  if (!begOrSolo && !seniorLarge)
    R("team","cloud_exp","mid","✨ 표준 스택 권장","ECS + ALB + RDS Multi-AZ + Terraform: 중급의 최적 학습 경로입니다");
  if (isXL || (isLarge && hasCritCert) || isEks)
    R("team","cloud_exp","senior","⭐ 이 규모에 필요","EKS + 멀티 계정 + CDK: 고급 스킬 없이 운영 시 대형 장애 위험");

  if (isMVP || begOrSolo || ops === "managed")
    R("team","ops_model","managed","✨ 소규모/MVP 권장","AWS 관리형 서비스 최대 활용. 서버 패치·백업을 AWS에 위임하세요");
  if (!isMVP && !isXL)
    R("team","ops_model","devops","✨ 성장기 스타트업 표준","개발팀이 배포까지. GitHub Actions + CloudWatch로 자동화하면 충분합니다");
  if (isLarge || hasCritCert || isSaaS)
    R("team","ops_model","separate","✨ 대기업/규정 준수 환경","개발/운영 분리로 변경 관리 프로세스 확보. ISMS·SOX 감사 요건 충족");

  // ── COMPLIANCE ─────────────────────────────────────────────────
  if (!hasCritCert && !hasPersonal)
    R("compliance","cert","none","✨ 일반 서비스 기본","기본 보안(TLS + IAM 최소 권한)만으로 시작. 규정 준수 없이도 보안 가능");
  if (isEcom || isTx)
    R("compliance","cert","pci","⚠️ 결제 서비스 검토","카드 직접 처리 시 PCI DSS 필수. PG사 위임 시 카드 데이터가 자사 서버를 통과하지 않아 범위 축소");
  if (isGlobal && hasPersonal)
    R("compliance","cert","gdpr","⭐ EU 사용자 법적 의무","EU 사용자 데이터는 EU 리전 저장 + 잊혀질 권리 구현이 법적 의무");
  if (isIoT && iotD === "healthcare_iot")
    R("compliance","cert","hipaa","⭐ 헬스케어 법적 의무","생체 데이터 처리 시 HIPAA BAA 서명 + KMS 암호화 + CloudTrail이 법적 요건");
  if (isB2B && isLarge)
    R("compliance","cert","isms","✨ 기업 계약 신뢰성","국내 기업 계약 시 ISMS 인증이 영업 경쟁력이 됩니다");
  if (bizModel === "saas_license" && isGlobal)
    R("compliance","cert","sox","✨ 미국 상장사 대상 SaaS","미국 상장 고객사에 ERP·재무 SaaS를 제공한다면 SOX 감사 대응 필요");

  if (!hasPersonal && !hasCritCert)
    R("compliance","encryption","basic","✨ 공개 데이터 서비스 적정","HTTPS만으로 충분. DB 암호화는 비용 추가 없이 언제든 켤 수 있습니다");
  if (hasPersonal && !hasCritCert)
    R("compliance","encryption","standard","⭐ 개인정보 서비스 필수","개인정보보호법: 전송+저장 암호화가 법적 의무입니다. AWS 기본 KMS로 무료 적용");
  if (hasCritCert || isCritData)
    R("compliance","encryption","strict","⭐ 규정 준수 필수","PCI/HIPAA/SOX: CMK + CloudTrail 키 사용 감사가 심사 필수 항목입니다");

  if (!hasPersonal && isInternal)
    R("compliance","network_iso","basic","✨ 사내 도구 적정","퍼블릭+프라이빗 기본 분리. Security Group으로 서버 간 접근 제어");
  if (hasPersonal && !hasCritCert)
    R("compliance","network_iso","strict","⭐ 개인정보 서비스 필수","앱+DB 프라이빗 서브넷 완전 격리. 인터넷에서 DB 직접 접근 불가");
  if (hasCritCert || isCritData)
    R("compliance","network_iso","private","⭐ 규정 준수 필수","VPC Endpoint로 인터넷 없이 AWS 서비스 접근. PCI DSS 네트워크 격리 요건");

  // ── SLO ────────────────────────────────────────────────────────
  if ((isInternal || isMVP) && !isTx)
    R("slo","availability","99","✨ 사내/MVP 적정","연간 87시간 다운 허용. 담당자 알림 + 수동 복구로 충분합니다");
  if (!isTx && !isHighAvail && !hasCritCert && !isMVP && !isInternal)
    R("slo","availability","99.9","✨ 일반 서비스 표준","Multi-AZ DB + ECS 2 Task만으로 달성 가능. 대부분 서비스의 출발점");
  if (isTx || (isSaaS && isB2B))
    R("slo","availability","99.95","⭐ 결제/B2B SaaS 권장","연 4.4시간 이하 다운. 3개 AZ + Aurora Multi-AZ + Route53 헬스체크로 달성");
  if (hasCritCert || (isTx && isLarge) || avail === "99.99")
    R("slo","availability","99.99","⭐ 금융/결제 대형 서비스","연 52분 이하. 3 AZ + Aurora Global + Multi-Region + 완전 자동화 복구 필요");

  if ((isInternal || isMVP) && !isTx)
    R("slo","rto","hours","✨ 사내/저중요 서비스 적정","CloudWatch 알림 + 담당자 수동 복구. 업무시간 내 복구면 충분합니다");
  if (!isTx && !isHighAvail && !isMVP && !isInternal)
    R("slo","rto","minutes","✨ 일반 서비스 기준","Auto Scaling + Multi-AZ 자동 복구 + CloudWatch 알림으로 30분 RTO 달성");
  if ((isTx && !isLarge && !hasCritCert) || (isSaaS && !hasCritCert))
    R("slo","rto","lt10min","⭐ 거래 서비스 권장","Multi-AZ 자동 페일오버(30초) + RunBook 자동화. 10분 이내 복구 가능");
  if (hasCritCert || (isTx && isLarge))
    R("slo","rto","lt1min","⭐ 금융/결제 필수","모든 복구 자동화 필수. 인간 개입 없이 30초 내 자동 전환해야 달성 가능");

  if (isInternal || isMVP)
    R("slo","rpo","24h","✨ 비핵심 서비스 적정","일간 스냅샷으로 충분. 비용 최소화. 반기 1회 복구 테스트 권장");
  if (!isTx && !isHighAvail && !isMVP && !isInternal)
    R("slo","rpo","1h","✨ 일반 서비스 기준","RDS PITR(5분 간격 트랜잭션 로그)로 달성 가능. 추가 비용 없음");
  if ((isTx && !isCritData && !hasCritCert) || (isSaaS && !isCritData) || (hasCritCert && !isCritData && !isTx))
    R("slo","rpo","15min","⭐ 거래 서비스 권장","Aurora 연속 백업(초 단위 복원) 기본 제공. 설정 없이 수 초 RPO 달성 가능");
  if (isCritData || (hasCritCert && isTx))
    R("slo","rpo","zero","⭐ 금융 트랜잭션 필수","Aurora 4/6 write quorum으로 커밋된 쓰기 보장 + SQS FIFO 정확히 1회 처리. 데이터 손실 0");

  if (!isGlobal && !isHighAvail && !(isTx && isLarge))
    R("slo","region","single","✨ 국내 서비스 기본","서울 리전 단일로 충분. Route53 + Multi-AZ로 AZ 장애는 자동 대응");
  if (isTx && isLarge)
    R("slo","region","dr","✨ 대형 거래 서비스 권장","Aurora Global + Route53 Failover로 리전 전체 장애 대비. RPO 1초 미만");
  if (isGlobal || (isXL && avail === "99.99"))
    R("slo","region","active","⭐ 글로벌/초고가용성 필수","DynamoDB Global Tables + Route53 지연시간 라우팅으로 전 세계 최저 지연시간");

  // ── NETWORK ────────────────────────────────────────────────────
  if (isMVP || isSmall || teamSize === "solo")
    R("network","account_structure","single","✨ 소규모 적정","단일 계정 + 환경별 네임스페이스로 시작. 팀 성장 후 멀티 계정으로 마이그레이션");
  if (!isMVP && !isXL && !hasCritCert)
    R("network","account_structure","envs","⭐ 성장기 표준","Prod 계정 분리만으로도 개발 실수의 운영 영향을 차단합니다. AWS 권장 기본");
  if (isXL || hasCritCert || (isLarge && isSaaS))
    R("network","account_structure","org","⭐ 대규모/규정 준수 필수","Organizations + Control Tower: SCP로 전 계정 보안 정책 강제. ISMS 감사 대응");

  if (isMVP && !hasCritCert)
    R("network","az_count","1az","✨ MVP 비용 절감","NAT GW 1개로 비용 최소화. 운영 전환 시 즉시 2 AZ로 업그레이드 계획 수립");
  if (!hasCritCert && avail !== "99.99")
    R("network","az_count","2az","⭐ 운영 서비스 표준","99.9~99.95% 가용성 달성의 최적 비용점. NAT GW 2개 비용으로 AZ 장애 대응");
  if (hasCritCert || avail === "99.99" || (isLarge && isTx))
    R("network","az_count","3az","⭐ 고가용성/규정 준수 필수","PCI DSS·HIPAA 권장. AZ 1개 완전 장애에도 서비스 유지. 99.95~99.99% 달성");

  if (!hasCritCert && dataS !== "critical")
    R("network","subnet_tier","2tier","⭐ 대부분 서비스 표준","퍼블릭(ALB)+프라이빗(앱+DB): Security Group으로 DB를 앱 서버만 접근 허용");
  if (hasCritCert || isCritData)
    R("network","subnet_tier","3tier","⭐ 규정 준수 필수","퍼블릭+프라이빗+격리(DB전용): PCI DSS CDE 격리, HIPAA 데이터 보호 요건 충족");
  if (isInternal && hasPersonal)
    R("network","subnet_tier","private","✨ 완전 격리 사내 시스템","VPN 또는 DX로만 접근. 인터넷 공개 불필요한 사내 시스템에 최고 보안");

  if (hasCritCert || isHighAvail)
    R("network","nat_strategy","per_az","⭐ 고가용성 필수","AZ별 독립 NAT GW: 하나의 AZ NAT 장애가 다른 AZ에 영향 없음");
  if (!isHighAvail && !hasCritCert && !isSmall)
    R("network","nat_strategy","shared","✨ 비용 절감 옵션","NAT GW 1개 공유로 월 $33+ 절감. 단일 AZ 장애 시 전체 아웃바운드 영향");
  if (isLarge || isMedPlus)
    R("network","nat_strategy","endpoint","💰 대규모 비용 절감","S3·DynamoDB 트래픽을 NAT GW 없이 직접 라우팅. 대용량 서비스에서 월 수십만원 절감");

  if (!types.includes("saas") || !isLarge)
    R("network","hybrid","no","✨ 퍼블릭 클라우드 전용","온프레미스 연결 불필요. VPN 설정 없이 단순한 구조 유지");
  if (isB2B && !isXL)
    R("network","hybrid","vpn","✨ B2B 사무실 연결","Site-to-Site VPN으로 사무실과 AWS 연결. 구성 빠르고 비용 저렴. 고대역폭 불필요 시");
  if (isXL || (isB2B && isLarge) || hasCritCert)
    R("network","hybrid","dx","⭐ 대규모/보안 필수","Direct Connect: 전용 물리 회선으로 안정적 연결. 온프레미스 DB 연동 또는 대용량 전송");

  // ── COMPUTE ────────────────────────────────────────────────────
  if (isMVP || begOrSolo || isInternal)
    R("compute","arch_pattern","serverless","✨ MVP/소규모 최적","Lambda + API GW: 서버 0대. 코드만 올리면 바로 서비스. 트래픽 없으면 비용 0");
  if ((!begOrSolo || isMedPlus) && !isIoT)
    R("compute","arch_pattern","container","⭐ 대부분 서비스 표준","Docker 컨테이너로 환경 일관성. ECS Fargate로 서버 관리 제로. AWS 권장 기본");
  if (isIoT || (isData && dataD !== "ml_pipeline"))
    R("compute","arch_pattern","hybrid","✨ IoT/데이터 파이프라인 권장","API 서버는 컨테이너, 이벤트/배치 처리는 Lambda. 역할에 맞는 컴퓨팅 선택");
  if (isLarge && isMature && !isIoT)
    R("compute","arch_pattern","vm","✨ 고성능/특수 워크로드","ML 추론, 게임 서버처럼 GPU나 특수 인스턴스가 필요한 경우에 한해 선택");

  if (begOrSolo || ops === "managed" || (!isLarge && !isEks))
    R("compute","orchestration","ecs","⭐ 소~중형 서비스 표준","ECS Fargate: K8s 없이 컨테이너 운영. EKS 대비 운영 부담 50% 절감. AWS 권장");
  if (seniorLarge || (isXL && exp !== "beginner"))
    R("compute","orchestration","eks","✨ 대규모 정밀 제어","Karpenter + KEDA + Argo CD: 수백 개 서비스를 하나의 플랫폼으로 통합 관리");

  if (begOrSolo || ops === "managed" || isMVP)
    R("compute","compute_node","fargate","⭐ 관리 최소화 표준","EC2 노드 패치·관리 없음. Fargate는 EC2 대비 약 20~30% 비용 높음");
  if (isMature && isLarge && exp !== "beginner")
    R("compute","compute_node","ec2_node","💰 대규모 비용 절감","EC2 노드 직접 관리 시 Fargate 대비 40~60% 비용 절감. 운영 역량 필요");
  if (!isMVP && !begOrSolo)
    R("compute","compute_node","mixed","✨ 비용·안정성 균형","기본 태스크는 EC2, 스케일아웃은 Fargate. ECS Capacity Provider로 자동 분배");

  if (!isSpiky && !isIoT)
    R("compute","scaling","ecs_asg","⭐ 대부분 서비스 기본","CPU 70% 기준 자동 확장. min:2 max:10 설정만으로 충분. 가장 단순하고 안정적");
  if (pattern.includes("spike") || isTick)
    R("compute","scaling","scheduled","⭐ 이벤트 서비스 필수","이벤트 10분 전 예약 확장. CPU 기반 확장은 폭증 시작 후 대응이라 늦습니다");
  if (isIoT || (isData && dataD === "stream_analytics") || isRT)
    R("compute","scaling","keda","✨ 이벤트 기반 처리 권장","SQS/Kinesis 메시지 수 기반 확장. CPU보다 30% 더 정확한 스케일링");
  if (isInternal && isSteady)
    R("compute","scaling","manual","✨ 고정 트래픽 절약","트래픽이 완전히 예측 가능하면 고정 용량 + Reserved Instance가 가장 저렴");

  // ── DATA ───────────────────────────────────────────────────────
  if ((isEcom || isTick) && !isFlash && !isUltraRPS)
    R("data","primary_db","aurora_mysql","⭐ 이커머스/일반 서비스 표준","주문·결제·회원: Aurora MySQL Serverless v2. AWS 이커머스 레퍼런스 아키텍처 기준");
  if (isSaaS || (isB2B && hasPersonal))
    R("data","primary_db","aurora_pg","⭐ SaaS/B2B 표준","PostgreSQL Row-Level Security로 테넌트 데이터 격리. JSON 지원으로 유연한 스키마");
  if (isMVP && !hasCritCert && !isTx)
    R("data","primary_db","rds_mysql","✨ MVP 비용 절감","RDS MySQL t3.micro: 서울 리전 월 약 $19. Aurora보다 약 20% 저렴. 검증 후 Aurora 마이그레이션");
  if ((isMVP || isSmall) && !hasCritCert && !isTx)
    R("data","primary_db","rds_pg","✨ MVP PostgreSQL 비용 절감","RDS PostgreSQL t4g.micro: 서울 리전 월 약 $18. Aurora PG보다 약 20% 저렴. JSONB·배열 등 고급 기능 활용 가능");
  if (isIoT || isFlash || isUltraRPS || (isData && dataD === "stream_analytics"))
    R("data","primary_db","dynamodb","⭐ 고성능/IoT 필수","초당 수만 건 읽기/쓰기 + 자동 확장. 티켓팅 재고 원자적 처리에 최적의 선택");
  if (isInternal && !isTx)
    R("data","primary_db","none","✨ 서버리스 데이터 없음 옵션","DynamoDB On-Demand 또는 S3 + Athena로 DB 관리 없이 운영 가능");

  if (isMVP && !hasCritCert)
    R("data","db_ha","single_az","✨ MVP 비용 절감","MVP 단계 Single-AZ로 비용 절감. 출시 후 Multi-AZ 전환을 로드맵에 포함하세요");
  if (!isHighAvail && !hasCritCert && !isMVP)
    R("data","db_ha","multi_az","⭐ 운영 서비스 필수","운영 DB에 Single-AZ는 DB 장애 = 서비스 중단. Multi-AZ가 기본 중의 기본");
  if (isHighAvail || hasCritCert || (isLarge && isTx))
    R("data","db_ha","multi_az_read","⭐ 고가용성/이커머스 필수","자동 페일오버 + 읽기 전담 서버. 읽기가 전체 쿼리 70%+ 서비스에서 성능 2배");
  if (isGlobal && (isXL || avail === "99.99"))
    R("data","db_ha","global","⭐ 글로벌/초고가용성","Aurora Global: 리전 간 복제 1초 미만. 리전 전체 장애 시 1~5분 내 수동 페일오버");

  if (isInternal || isMVP || isSmall)
    R("data","cache","no","✨ 소규모 불필요","DAU 1만 미만은 캐시 없이 DB만으로 충분. 복잡도 최소화가 우선");
  const dbArr = Array.isArray(state.data?.primary_db) ? state.data.primary_db : [];
  const hasDynamoOnly = dbArr.includes("dynamodb") && !dbArr.some((d: string) => d.startsWith("aurora") || d.startsWith("rds"));
  if ((isEcom || isRT || isMedPlus) && !hasDynamoOnly)
    R("data","cache","redis","⭐ 중대형 서비스 필수","ElastiCache Redis: DB 부하 70% 절감. 세션·상품·장바구니 캐시의 업계 표준");
  if (hasDynamoOnly && isMedPlus)
    R("data","cache","dax","✨ DynamoDB 전용 캐시","DAX: DynamoDB 읽기 지연 ms→μs. 코드 변경 없이 SDK만 교체. DynamoDB 단독 사용 시 최적");
  if (isFlash || (isTick && isUltraRPS))
    R("data","cache","both","⭐ 극한 동시성 필수","DynamoDB DAX + ElastiCache 동시 사용. 재고 선점(Redis) + 상세 조회(DAX)");

  if (!isData && !isIoT && !isEcom)
    R("data","storage","none","✨ 파일 저장 불필요","DB만으로 충분. 추후 이미지/파일 업로드 추가 시 S3를 붙이면 됩니다");
  if (!isInternal)
    R("data","storage","s3","⭐ 파일 저장 표준","S3는 무제한 확장 + 99.999999999% 내구성. 모든 파일은 S3가 기본");
  if (isRT && isSaaS)
    R("data","storage","efs","✨ 공유 파일시스템 필요 시","여러 컨테이너가 동일 파일 공유 시 EFS. NFS 마운트로 투명하게 접근");
  if (isData && dataD === "ml_pipeline")
    R("data","storage","ebs","✨ ML 학습 고성능 스토리지","SageMaker 학습 인스턴스에 EBS io2 연결. IOPS 보장으로 학습 속도 향상");

  if (!isEcom || (isSmall && ecomD !== "marketplace"))
    R("data","search","no","✨ 검색 불필요","DB 인덱스 조회로 충분. 데이터 100만 건 미만이면 LIKE 쿼리도 가능");
  if (isEcom && isSmall)
    R("data","search","db_search","✨ 소규모 초기 적합","RDS 전문 검색 인덱스로 시작. 상품 10만 건 이하에서 충분합니다");
  if (isEcom && (isMedPlus || ecomD === "marketplace"))
    R("data","search","opensearch","⭐ 마켓플레이스 필수","한글 형태소 분석 + 연관도 정렬 + 패싯 필터링. DB로는 구현 불가한 검색 품질");
  if (isRT)
    R("data","search","opensearch","⭐ 채팅 메시지 검색 필수","메시지·사용자 검색: OpenSearch 실시간 인덱싱 + 한글 형태소 분석. 채팅 서비스 핵심 기능");
  if (isData && (dataD === "log_analytics" || dataD === "stream_analytics"))
    R("data","search","opensearch","⭐ 로그/이벤트 분석 필수","로그 집계·패턴 분석·실시간 대시보드. CloudWatch Logs Insights 대비 복잡 쿼리 성능 우수");
  if (isSaaS && isMedPlus)
    R("data","search","opensearch","⭐ SaaS 검색/감사 권장","테넌트별 데이터 검색·감사 로그 분석. Kibana 대시보드로 운영 모니터링 통합");

  // ── INTEGRATION ────────────────────────────────────────────────
  if (!isB2B && !hasCritCert)
    R("integration","auth","cognito","⭐ B2C 서비스 표준","MAU 1만 무료(신규 풀 기준). 소셜 로그인·MFA를 코드 없이 설정만. 자체 구현 대비 보안 사고 대폭 감소");
  if (isB2B || isSaaS)
    R("integration","auth","sso","⭐ B2B SaaS 필수","SAML/OIDC로 고객사 계정 연동. 퇴사자 접근 차단이 고객 IT팀에서 자동 처리");
  if (hasCritCert && !isB2B)
    R("integration","auth","selfmgd","✨ 규정 준수 커스텀 인증","PCI/HIPAA 특수 요건이 있을 때만 선택. Cognito로 해결 안 될 때 최후 수단");

  if (!isTx && isInternal)
    R("integration","sync_async","sync_only","✨ 단순 서비스 적합","요청-처리-응답의 단순 구조. 비동기의 복잡도 없이 빠른 개발 가능");
  if (isTx || isEcom || isTick || isIoT)
    R("integration","sync_async","async","⭐ 거래/이벤트 서비스 필수","주문-결제-재고-배송 체인: 비동기 분리로 장애 격리. 결제 서비스의 AWS 표준");
  if (isSaaS || (isRT && isEcom))
    R("integration","sync_async","mixed","✨ 복합 서비스 권장","API는 동기(즉시 응답), 결제·알림은 비동기. 각 서비스의 성격에 맞게 분리");

  if (isEcom || isTick || isTx)
    R("integration","queue_type","sqs","⭐ 주문/결제 처리 표준","SQS FIFO: 주문 순서 보장 + 정확히 1회 처리 보장. AWS 이커머스 레퍼런스 표준");
  if ((isEcom && isMedPlus) || isSaaS)
    R("integration","queue_type","sns","✨ 멀티 시스템 알림 표준","주문 완료 이벤트를 재고·배송·분석 시스템에 동시 전달. Fan-out 패턴의 기본");
  if (isSaaS || (isData && dataD !== "ml_pipeline"))
    R("integration","queue_type","eventbridge","✨ 이벤트 라우팅 권장","200+ AWS 서비스 통합. 이벤트 규칙 기반 라우팅으로 서비스 간 결합도 최소화");
  if (isIoT || (isData && dataD === "stream_analytics") || isRT)
    R("integration","queue_type","kinesis","⭐ 스트리밍 필수","초당 수만 IoT 메시지·클릭스트림 처리. 최대 365일 리텐션으로 재처리 가능");
  if (isXL && (isSaaS || isData))
    R("integration","queue_type","msk","✨ 대규모 Kafka 표준","MSK: 하루 수백억 이벤트. Schema Registry 강제로 데이터 계약 보장");

  if (!isIoT && !isUltraRPS && exp !== "beginner")
    R("integration","api_type","alb","⭐ 대부분 서비스 기본","ALB만으로 충분합니다. API Gateway는 불필요한 비용과 복잡도를 추가합니다");
  if (isIoT || isUltraRPS || isMVP)
    R("integration","api_type","api_gateway","✨ 서버리스/IoT 권장","Lambda 직접 연동 + Rate Limiting + API 키 관리. IoT 디바이스 인증에도 유용");
  if (isIoT && iotD === "industrial")
    R("integration","api_type","nlb","✨ 산업 IoT TCP 전용","MQTT·TCP 프로토콜 지원. IoT Core와 연동 시 NLB가 ALB보다 낮은 레이턴시");
  if (isXL && isMature && isSaaS)
    R("integration","api_type","both","✨ 대규모 복합 API","외부 API는 API Gateway(Rate Limit), 내부 서비스 간은 ALB(저비용)로 분리");

  if (!isData && !isEcom)
    R("integration","batch_workflow","none","✨ 배치 불필요","실시간 처리만으로 충분. 추후 정산·리포트 필요 시 EventBridge Scheduler 추가");
  if (isSaaS || (isEcom && ecomD === "subscription"))
    R("integration","batch_workflow","eventbridge_sch","✨ 정기 배치 표준","EventBridge Scheduler: 매일 새벽 정산, 월간 청구서 발행. Cron보다 안정적");
  if (isData || (isTx && isLarge))
    R("integration","batch_workflow","aws_batch","⭐ 대용량 배치 필수","ML 학습·정산·대용량 데이터 변환: Spot으로 70% 비용 절감 + 자동 확장");
  if (isEcom && isMedPlus)
    R("integration","batch_workflow","step_functions","✨ 복잡한 워크플로우","주문-결제-재고-배송의 복잡한 상태 관리. 시각적 워크플로우 + 재시도 자동화");
  if (isTick || (isEcom && isSpiky))
    R("integration","batch_workflow","ecs_scheduled","✨ 이벤트 후 배치","이벤트 종료 후 정산·통계 집계를 ECS Task로 실행. ECS 클러스터 재사용");

  // ── EDGE ───────────────────────────────────────────────────────
  if (isInternal && !isGlobal)
    R("edge","cdn","no","✨ 사내 도구 불필요","내부 직원만 사용 시 CloudFront 불필요. ALB 직접 연결로 단순하게");
  if (!isInternal && !isGlobal)
    R("edge","cdn","yes","⭐ 모든 외부 서비스 기본","CloudFront: 정적 파일 캐시 + 오리진 보호 + HTTPS 자동. 비용보다 이득이 더 큼");
  if (isGlobal)
    R("edge","cdn","global","⭐ 글로벌 서비스 필수","Global Accelerator + CloudFront: 전 세계 엣지에서 50ms 이하 응답");

  if (!isGlobal && !isHighAvail && !isTx)
    R("edge","dns","basic","✨ 단일 리전 기본","Route53 기본 라우팅. 추가 설정 없이 신뢰할 수 있는 DNS 서비스");
  if ((isHighAvail || isTx) && !isGlobal)
    R("edge","dns","health","⭐ 고가용성 필수","Route53 헬스체크: 서버 장애 감지 즉시 DNS 자동 전환. 99.95% 가용성의 마지막 방어선");
  if (isGlobal)
    R("edge","dns","latency","⭐ 글로벌 서비스 필수","지연시간 기반 라우팅 + 헬스체크 포함: 사용자를 가장 가까운 리전으로 자동 연결");
  if (isSaaS && isB2B && isGlobal)
    R("edge","dns","geoloc","✨ GDPR/데이터 주권 대응","지역별 법적 요건에 따라 지역 사용자를 특정 리전으로 강제 라우팅");

  if (isInternal)
    R("edge","waf","no","✨ 사내 도구 불필요","인터넷 노출 없는 사내 도구. WAF 대신 보안 그룹 + IAM으로 충분");
  if (!hasCritCert && !isEcom && !isTick)
    R("edge","waf","basic","⭐ 외부 서비스 기본 보안","SQL 인젝션·XSS·LFI 차단. AWS Managed Rules: 즉시 적용 가능한 기본 규칙 세트");
  if (isEcom || isTick)
    R("edge","waf","bot","⭐ 이커머스/티켓팅 필수","매크로 봇 없이 공정한 선착순 불가. 이벤트 당일 봇이 70~90% 트래픽을 차지합니다");
  if (hasCritCert || avail === "99.99" || (isXL && isTx))
    R("edge","waf","shield","⭐ 고가용성/금융 필수","DDoS 방어 SLA + 24/7 DRT 대응팀. 공격 중에도 서비스 유지. 금융 규정 준수 요건");

  // ── CICD ───────────────────────────────────────────────────────
  if (isMVP || begOrSolo)
    R("cicd","iac","cdk","✨ 소규모 첫 시작 권장","TypeScript/Python CDK: AWS 서비스를 코드로 정의. Terraform보다 학습 곡선 낮음");
  if (!begOrSolo && !isXL)
    R("cicd","iac","terraform","⭐ 중대규모 업계 표준","멀티 계정·멀티 리전 관리의 사실상 표준. AWS 외 서비스도 동일하게 관리 가능");
  if (isXL && hasCritCert)
    R("cicd","iac","cfn","✨ AWS 완전 네이티브","CloudFormation StackSets: 수십 개 계정에 동일 템플릿 일괄 배포. Organizations 통합");
  if (isMVP && isInternal)
    R("cicd","iac","none","✨ 초기 수동 설정","MVP 초기: 콘솔에서 빠르게 세팅. 서비스 안정 후 IaC로 마이그레이션");

  if (begOrSolo || isMVP || (!hasCritCert && teamSize !== "large"))
    R("cicd","pipeline","github","⭐ 소~중규모 표준","GitHub Actions: 가장 빠른 설정. 무료 월 2000분. 오픈소스 액션 생태계 최대");
  if (isLarge && (hasCritCert || bizModel === "saas_license"))
    R("cicd","pipeline","gitlab","✨ 보안 기업 환경","GitLab CI: 온프레미스 설치 가능. 코드가 외부 서버에 나가지 않아야 하는 금융·공공");
  if (isLarge && !hasCritCert && bizModel !== "saas_license")
    R("cicd","pipeline","codepipeline","✨ AWS 올인 환경","CodePipeline: ECS/EKS 배포 + ECR 연동이 가장 자연스러움. AWS 이벤트 자동 트리거");

  if (!isTx && !isHighAvail && !hasCritCert)
    R("cicd","deploy_strategy","rolling","⭐ 일반 서비스 기본","Rolling 배포: 추가 비용 없이 무중단 배포. 대부분의 서비스에 충분합니다");
  if (isTx || isHighAvail || hasCritCert)
    R("cicd","deploy_strategy","bluegreen","⭐ 고가용성/결제 필수","Blue/Green: 새 버전 문제 발생 시 1분 내 이전 버전으로 즉시 전환 가능");
  if (isXL || (isMature && isLarge && !hasCritCert))
    R("cicd","deploy_strategy","canary","✨ 대규모 위험 최소화","Canary: 트래픽 5%만 새 버전으로. 실제 사용자로 검증 후 점진적 전환");

  if (isMVP || isSmall)
    R("cicd","env_count","dev_prod","✨ 소규모/MVP 적정","Dev+Prod 2환경. Stage 없이 빠른 배포. 팀 3명 이상되면 Stage 추가 권장");
  if (!isMVP && !isXL)
    R("cicd","env_count","three","⭐ 운영 서비스 표준","Dev->Stage->Prod: Stage에서 프로덕션 환경 검증 후 배포. 운영 사고 70% 방지");
  if (isXL || (isLarge && hasCritCert))
    R("cicd","env_count","four","✨ 대규모/규정 준수","Dev->Stage->PreProd->Prod: 성능 테스트 전용 환경 분리. PCI DSS 환경 분리 요건");

  // ── COST ───────────────────────────────────────────────────────
  if (isMVP || isSmall)
    R("cost","priority","cost_first","⭐ MVP/소규모 최우선","검증 전 성능 과투자는 낭비. 필요할 때 쉽게 업그레이드 가능한 서비스를 선택하세요");
  if (!isMVP && !isXL)
    R("cost","priority","balanced","⭐ 성장기 표준","On-Demand + 1년 RI 혼합 + Spot 배치 활용. 성능 저하 없이 30~40% 절감");
  if (isTx && isLarge)
    R("cost","priority","perf_first","✨ 거래 서비스 고려","결제 중단 1시간 손실 > 성능 투자 비용. 병목 제거가 비용 절감보다 ROI 높음");

  if (isMVP || isSmall || isSpiky)
    R("cost","commitment","none","⭐ 유연성 필요 시 필수","서비스 방향 변경 가능성이 있으면 약정 금물. On-Demand의 유연성이 더 가치 있음");
  if (isSteady && isMedPlus && !isMVP)
    R("cost","commitment","1yr","💰 안정적 서비스 절감","1년 RI로 40% 절감. 시리즈 A~B 단계에서 비용 구조 개선에 효과적");
  if (isMature && isLarge && isSteady)
    R("cost","commitment","3yr","💰 최대 절감","3년 Savings Plans: 최대 72% 절감. 서비스 방향이 확정된 성숙기 서비스에 한해");

  if (isTx || isTick || isRT)
    R("cost","spot_usage","no","⭐ 거래/실시간 서비스 필수","결제·티켓팅·채팅 서버 Spot 사용 금지. 서버 중단 시 트랜잭션 손실 발생");
  if ((isData || isIoT) && isTx)
    R("cost","spot_usage","partial","💰 혼합 권장","메인 API는 On-Demand, 배치·데이터 처리는 Spot. 안정성과 비용 절감 동시 달성");
  if ((isEcom && ecomD === "subscription") && !isTx && !isTick && !isRT)
    R("cost","spot_usage","partial","💰 혼합 권장","메인 API는 On-Demand, 배치·데이터 처리는 Spot. 안정성과 비용 절감 동시 달성");
  if ((isData || isIoT) && !isTx && !isTick && !isRT)
    R("cost","spot_usage","heavy","💰 데이터 처리 최적","ML 학습·ETL·로그 집계: Spot으로 70% 절감. 중단 후 자동 재시작으로 완전 자동화");

  // ── PLATFORM ───────────────────────────────────────────────────
  R("platform","node_provisioner","karpenter","⭐ EKS 신규 표준","Cluster Autoscaler 대비 2~3배 빠른 노드 프로비저닝. Spot 혼합 자동 관리");
  if (!isLarge)
    R("platform","node_provisioner","cluster_autoscaler","✨ 기존 클러스터 호환","이미 Cluster Autoscaler 사용 중이면 유지. 신규 클러스터는 Karpenter 권장");

  R("platform","ingress","alb_controller","⭐ AWS 네이티브 표준","ALB 자동 생성 + WAF/Shield 통합. AWS 환경에서 가장 자연스러운 선택");
  if (isLarge && exp === "senior")
    R("platform","ingress","nginx","✨ 고급 라우팅 필요 시","복잡한 URL 리다이렉트·리라이트·Lua 스크립트가 필요한 경우에 선택");
  if (isXL && isSaaS)
    R("platform","ingress","kong","✨ API 게이트웨이 통합","Kong: Rate Limiting·플러그인·개발자 포털이 필요한 대형 API 플랫폼");

  R("platform","service_mesh","none","⭐ 대부분 EKS 서비스 충분","Service Mesh 없이도 Network Policy + mTLS로 충분. 운영 복잡도 최소화");
  if (hasCritCert && isXL)
    R("platform","service_mesh","aws_app_mesh","✨ AWS 관리형 메시 권장","App Mesh: Istio보다 운영 단순. AWS X-Ray 통합으로 서비스 간 추적 가능");
  if (isXL && exp === "senior" && teamSize === "large")
    R("platform","service_mesh","istio","✨ 완전한 서비스 메시 필요 시","mTLS 자동화 + 세밀한 트래픽 제어. 운영 팀 숙련도 필수. 학습 비용 높음");

  if (begOrSolo || isSmall)
    R("platform","gitops","none","✨ 소규모 EKS 불필요","GitHub Actions + kubectl apply로 충분. GitOps 도입 전 기본기 먼저");
  if (!begOrSolo && !isSmall)
    R("platform","gitops","argocd","⭐ EKS GitOps 표준","Git이 진실의 원천. 배포 이력·드리프트 감지·시각적 UI. EKS GitOps의 사실상 표준");
  if (isLarge && exp === "senior")
    R("platform","gitops","flux","✨ Helm 중심 배포 환경","Helm 차트 기반 배포가 주라면 Flux가 더 자연스럽고 가볍습니다");

  if (isLarge && exp === "senior")
    R("platform","k8s_monitoring","prometheus_grafana","⭐ EKS 오픈소스 표준","kube-prometheus-stack 한 번에 설치. Grafana 대시보드 수천 개 커뮤니티 제공");
  if (!isLarge || exp === "beginner")
    R("platform","k8s_monitoring","cloudwatch","✨ AWS 올인/소규모 권장","추가 도구 없이 AWS 콘솔에서 바로. Container Insights 켜기만 하면 됨");
  if (isXL)
    R("platform","k8s_monitoring","hybrid","✨ 대규모 이중화 모니터링","Prometheus(메트릭) + CloudWatch(로그·알람): 각자 강점 활용");

  R("platform","k8s_secrets","native","✨ 소규모 간단한 시작","K8s Secret Base64: 단순하지만 etcd 암호화 필수. 소규모 내부 서비스에 충분");
  if (!begOrSolo)
    R("platform","k8s_secrets","secrets_csi","⭐ 운영 표준","AWS Secrets Manager 시크릿을 Pod에 자동 마운트. 30일 자동 교체 + CloudTrail 감사");
  if (isLarge && exp === "senior")
    R("platform","k8s_secrets","external_secrets","✨ 기존 K8s Secret 호환","ESO: Secrets Manager -> K8s Secret 자동 동기화. 기존 앱 코드 변경 없이 도입");

  if (!hasCritCert)
    R("platform","pod_security","psa","✨ K8s 내장 기본 보안","추가 도구 없이 Privileged Pod 차단. 시작점으로 충분합니다");
  if (hasCritCert || isLarge)
    R("platform","pod_security","kyverno","⭐ 규정 준수 권장","YAML로 정책 작성. 최신 이미지 태그 금지·리소스 Limit 강제. Rego보다 쉬움");
  if (isXL && exp === "senior")
    R("platform","pod_security","opa_gatekeeper","✨ 복잡한 커스텀 정책","Rego 언어로 무한한 커스텀 정책. 대형 플랫폼 팀의 표준이지만 학습 비용 높음");

  R("platform","network_policy","vpc_cni","⭐ EKS 기본 표준","AWS VPC CNI: Pod에 VPC IP 직접 할당. AWS 서비스와 통신 가장 단순. 기본 선택");
  if (hasCritCert || isXL)
    R("platform","network_policy","cilium","✨ 고보안/고성능 필요 시","eBPF 기반 L7 정책 + Hubble 가시성. 네트워크 정책 세밀 제어가 필요할 때");

  if (!isXL)
    R("platform","k8s_backup","git_only","✨ 소규모 충분","IaC + GitOps로 재배포 가능하면 Velero 불필요. 중요 데이터는 DB 백업으로");
  if (isLarge || hasCritCert)
    R("platform","k8s_backup","velero","⭐ 운영 클러스터 필수","PVC 포함 전체 클러스터 백업. 복구 테스트를 분기 1회 실시하세요");

  if (!isIoT && !isLarge)
    R("platform","autoscaling_strategy","hpa_only","⭐ 대부분 EKS 서비스 기본","CPU 기반 HPA min:2 max:10: 가장 단순하고 안정적인 K8s 확장 방법");
  if (isIoT || (isData && dataD === "stream_analytics") || isTick)
    R("platform","autoscaling_strategy","hpa_keda","⭐ 이벤트 기반 필수","KEDA: SQS/Kinesis 메시지 수 기반 확장. CPU보다 30% 더 정확한 스케일링");
  if (isXL && isMature)
    R("platform","autoscaling_strategy","hpa_vpa","✨ 리소스 최적화 고급","VPA로 Pod 크기 자동 최적화 + HPA로 Pod 수 조절. 리소스 낭비 최소화");

  if (!isXL && !hasCritCert)
    R("platform","cluster_strategy","single_ns","✨ 소규모/단일팀 적합","단일 네임스페이스로 시작. 팀·서비스 증가 시 분리 전략 적용");
  if (isLarge || hasCritCert || (isSaaS && exp === "senior"))
    R("platform","cluster_strategy","multi_cluster","✨ 환경/팀 격리 필요 시","Prod/Stage/Dev 클러스터 분리: 실수가 Prod에 영향 없음. ISMS 환경 분리 충족");

  // ── APP STACK ──────────────────────────────────────────────────
  if (isIoT || isData)
    R("team","language","python_fastapi","⭐ 데이터/IoT 필수","Python 생태계: boto3·pandas·numpy·TensorFlow. 데이터 처리 라이브러리 압도적");
  if (isRT || (isEcom && !isSaaS) || isTick)
    R("team","language","node_express","⭐ 실시간/이커머스 권장","비동기 논블로킹: WebSocket·고동시성 API 최적. 프론트 팀과 언어 공유 가능");
  if (isSaaS || (isB2B && hasCritCert) || bizModel === "saas_license")
    R("team","language","spring_boot","✨ 엔터프라이즈 B2B 권장","Java Spring Boot: 금융·공공·엔터프라이즈에서 검증된 선택. JVM 성능 안정적");
  if (isXL && isMature && exp === "senior")
    R("team","language","go","✨ 고성능/마이크로서비스","Go: 컴파일 언어 최고 성능 + 낮은 메모리. K8s 컨트롤러나 고성능 API에 적합");
  if (!isXL && !isMVP && isMedPlus)
    R("team","language","mixed","✨ 서비스별 최적 언어 선택","MSA: 서비스마다 최적 언어 선택 가능. 단, 팀 역량 분산 주의");

  if (!isXL && !isSaaS)
    R("appstack","api_gateway_impl","alb_only","⭐ 대부분 서비스 표준","ALB만으로 충분합니다. API Gateway 비용 없이 동일한 라우팅 가능");
  if (isMVP || isIoT || begOrSolo)
    R("appstack","api_gateway_impl","aws_apigw","✨ Lambda 연동 최적","Lambda 직접 연동 + Rate Limiting + API 키. 서버리스 아키텍처의 기본 조합");
  if (state.team?.language === "spring_boot" && !isMVP)
    R("appstack","api_gateway_impl","spring_gateway","✨ Spring Boot 팀 권장","Spring Cloud Gateway: Spring 생태계 통합. Circuit Breaker·Rate Limiter 내장. Java 팀에 자연스러운 선택");
  if (isSaaS && isB2B && isXL)
    R("appstack","api_gateway_impl","kong","✨ 대형 API 플랫폼 권장","Kong: 개발자 포털·플러그인·멀티테넌트 Rate Limiting. B2B API 플랫폼 표준");

  if (!isXL || !isMature)
    R("appstack","protocol","rest","⭐ 대부분 서비스 표준","REST HTTP/JSON: 브라우저·앱·서드파티 모두 지원. 학습 곡선 없음. 기본 선택");
  if (isIoT || (isXL && isMature && exp === "senior"))
    R("appstack","protocol","grpc","✨ 고성능 내부 통신","gRPC: Protobuf 직렬화로 REST 대비 수 배 빠른 내부 통신. IoT 디바이스 저대역폭 통신");
  if (isRT || (isSaaS && isB2B))
    R("appstack","protocol","graphql","✨ 복잡한 데이터 조회 최적","GraphQL: 클라이언트가 필요한 데이터만 요청. 오버페칭 없음. 빠른 프론트 개발");
  if (isXL && isMature)
    R("appstack","protocol","mixed","✨ 외부 REST + 내부 gRPC","외부 API는 REST(호환성), 내부 MSA 통신은 gRPC(성능). 역할 분리");

  if (!isEks)
    R("appstack","service_discovery","cloud_map","⭐ ECS 표준","AWS Cloud Map: ECS 서비스 자동 등록. Route53 프라이빗 DNS로 이름 기반 통신");
  if (isEks)
    R("appstack","service_discovery","k8s_dns","⭐ EKS 기본","CoreDNS: K8s 내장. 서비스 이름으로 자동 발견. 추가 설정 없이 동작");

  R("appstack","api_versioning","url_path","⭐ 업계 표준","URL 경로 /v1/ /v2/: 가장 직관적·캐시 가능·로그 분석 용이. 99% 서비스의 선택");
  if (isInternal || isSaaS)
    R("appstack","api_versioning","header","✨ 헤더 버저닝","Accept: application/v2+json: URL 깔끔하지만 CDN 캐시에 버전 헤더 포함 필요");
  if (isB2B && isXL)
    R("appstack","api_versioning","subdomain","✨ 완전 격리 버전 관리","v2.api.example.com: 버전별 완전 독립. 대형 B2B API에서 고객사 마이그레이션 관리");

  if (!isIoT && !isData && !isXL)
    R("appstack","schema_registry","none","✨ 단순 서비스 불필요","메시지 스키마 관리 불필요. REST API JSON + OpenAPI 스펙으로 충분");
  if (isIoT || (isData && dataD === "stream_analytics"))
    R("appstack","schema_registry","glue_registry","⭐ AWS 네이티브 권장","MSK·Kinesis 사용 시 Glue Registry가 AWS 통합 가장 자연스러움. IAM 권한 관리");
  if (isXL && isData && exp === "senior")
    R("appstack","schema_registry","confluent_registry","✨ Kafka 완전 생태계","대규모 Kafka 사용 시 Confluent Registry가 더 성숙한 스키마 진화 관리 제공");

  return recs;
}
