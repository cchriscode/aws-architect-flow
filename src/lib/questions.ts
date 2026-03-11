/* eslint-disable @typescript-eslint/no-explicit-any */
import type { WizardState, Question } from "@/lib/types";
import type { Locale } from "@/lib/i18n/types";
import { t as i18n } from "@/lib/questions-i18n";

/**
 * Apply i18n translations to a question.
 * Looks up q, help, and each opt's l/d from the dictionary.
 * Falls back to the hardcoded Korean text when no translation is found.
 */
function localize(lang: Locale, phase: string, question: Question): Question {
  if (lang === "ko") return question; // Korean strings are already hardcoded
  const dict = i18n(lang, phase, question.id);
  if (!dict) return question;
  // Check if q was already set to English inline (dynamic questions with ternary).
  // If the q doesn't match the Korean dictionary base text, it was customized -- keep it.
  const koDict = i18n("ko", phase, question.id);
  const qAlreadyTranslated = koDict && question.q !== koDict.q;
  const helpAlreadyTranslated = koDict && question.help !== koDict.help;
  return {
    ...question,
    q: qAlreadyTranslated ? question.q : (dict.q || question.q),
    help: helpAlreadyTranslated ? question.help : (dict.help || question.help),
    opts: question.opts?.map((opt) => {
      const translated = dict.opts[opt.v];
      if (!translated) return opt;
      return { ...opt, l: translated.l || opt.l, d: translated.d ?? opt.d };
    }),
  };
}

/** Apply localization to an array of questions */
function localizeAll(lang: Locale, phase: string, questions: Question[]): Question[] {
  if (lang === "ko") return questions;
  return questions.map((q) => localize(lang, phase, q));
}

export function buildPhaseQuestions(
  phaseId: string,
  state: WizardState,
  currentPhaseState: Record<string, any> | undefined = {},
  lang: Locale = "ko"
): Question[] {
  const ps = currentPhaseState ?? {};
  const p = phaseId; // alias for T() calls
  switch(phaseId) {

    // ──────────────────────────────────────────
    case "workload": {
      const selectedTypes = ps?.type || [];
      const qs = [
      {
        id:"type",
        q:"어떤 종류의 서비스인가요? (복수 선택 가능)",
        help:"서비스가 여러 성격을 동시에 가질 수 있습니다. 예: '라이브커머스' → 이커머스 + 실시간 서비스 동시 선택. '스마트팩토리' → IoT + 데이터 분석 동시 선택. 해당하는 것을 모두 선택하세요.",
        multi:true, opts:[
          {v:"web_api",   l:"웹/API 서비스",      d:"회사 홈페이지, 블로그, 일반 앱처럼 요청에 응답하는 서비스. 가장 흔한 형태입니다."},
          {v:"ecommerce", l:"이커머스 / 결제",    d:"상품 판매, 장바구니, 결제가 포함된 서비스. '돈이 오가는 서비스'에 해당합니다."},
          {v:"ticketing", l:"티켓팅 / 예약",      d:"공연·스포츠 예매, 줄서기, 좌석 선택 등 '동시에 많은 사람이 같은 것을 차지하려는' 서비스입니다."},
          {v:"realtime",  l:"실시간 서비스",      d:"채팅, 라이브 스트리밍, 실시간 게임처럼 '지금 이 순간 주고받는' 서비스입니다."},
          {v:"data",      l:"데이터 수집 / 분석", d:"로그 수집, 대용량 분석, AI 학습 파이프라인처럼 데이터를 모으고 가공하는 서비스입니다."},
          {v:"saas",      l:"SaaS / 기업 플랫폼", d:"여러 회사나 팀이 각자의 데이터를 사용하는 멀티 테넌트 B2B 서비스입니다."},
          {v:"iot",       l:"IoT / 디바이스 연동",d:"공장 센서, 스마트홈 기기처럼 '물리적 장치'에서 데이터가 올라오는 서비스입니다."},
          {v:"internal",  l:"사내 도구 / 어드민", d:"직원만 쓰는 내부 시스템, 관리자 대시보드처럼 외부 공개가 필요 없는 서비스입니다."},
        ]
      },
      // ── 서비스 유형별 세부 질문 (선택한 type에 따라 조건부 노출) ──
      ...(selectedTypes.includes("ecommerce") ? [{
        id:"ecommerce_detail",
        q:"이커머스의 구체적인 형태는 무엇인가요?",
        help:"쇼핑몰 형태마다 아키텍처가 크게 달라집니다. 예: 마켓플레이스는 판매자·구매자 양쪽 트래픽 처리가 필요하고, 라이브커머스는 동시 접속 폭증 대비가 핵심입니다.",
        multi:false, opts:[
          {v:"general_shop",  l:"일반 쇼핑몰",         d:"상품 카탈로그 + 장바구니 + 결제. 쿠팡, 11번가류의 전형적인 구조입니다."},
          {v:"marketplace",   l:"마켓플레이스",        d:"판매자·구매자 양면 플랫폼. 네이버 스마트스토어, 당근마켓류. 정산·수수료 처리가 추가됩니다."},
          {v:"live_commerce", l:"라이브커머스",        d:"실시간 방송 + 구매 동시 진행. 방송 중 순간 폭증이 핵심 과제입니다."},
          {v:"subscription",  l:"구독/정기배송",       d:"정기 결제 + 배송 스케줄 관리. 빌링 사이클과 실패 결제 재시도 처리가 필요합니다."},
          {v:"b2b_shop",      l:"B2B 대량 구매",       d:"기업간 대량 주문·견적·계약. 소비자가 아닌 구매담당자가 사용자입니다."},
        ]
      }] : []),
      ...(selectedTypes.includes("ticketing") ? [{
        id:"ticketing_detail",
        q:"티켓팅/예약 서비스의 형태는 무엇인가요?",
        help:"티켓팅 종류마다 동시성 처리 방식이 다릅니다. 콘서트 예매처럼 수만 명이 정확히 같은 시각에 몰리는 경우와, 맛집 예약처럼 비교적 분산되는 경우는 설계가 다릅니다.",
        multi:false, opts:[
          {v:"concert",     l:"콘서트 / 공연 예매",   d:"좌석 선택 + 초 단위 선착순. '오픈런' 상황이 가장 극단적인 형태입니다."},
          {v:"sports",      l:"스포츠 / 이벤트",      d:"시즌 티켓, 팬 클럽 우선구매, 다양한 좌석 등급 처리가 필요합니다."},
          {v:"travel",      l:"숙박 / 여행 예약",     d:"날짜 기반 예약·취소·환불. 여러 날짜 조합의 재고 관리가 복잡합니다."},
          {v:"reservation", l:"맛집 / 병원 예약",     d:"시간대별 슬롯 예약. 당일 취소와 대기자 자동 배정이 중요합니다."},
          {v:"flash",       l:"선착순 / 한정판 이벤트",d:"수량 제한 + 극단적 동시 접속. Redis 원자적 잠금과 SQS FIFO가 핵심입니다."},
        ]
      }] : []),
      ...(selectedTypes.includes("realtime") ? [{
        id:"realtime_detail",
        q:"실시간 서비스의 구체적인 형태는 무엇인가요?",
        help:"실시간 기능 유형마다 WebSocket 사용법과 메시지 처리 방식이 달라집니다. 채팅은 메시지 순서·영속성이 핵심이고, 게임은 상태 동기화 속도가 핵심입니다.",
        multi:false, opts:[
          {v:"chat",      l:"채팅 / 메신저",          d:"1:1 또는 그룹 채팅. 메시지 순서 보장과 오프라인 중 메시지 보관이 필요합니다."},
          {v:"streaming", l:"라이브 스트리밍",        d:"방송 + 다수 시청. 영상 인코딩·배포와 동시 시청자 수백~수만 명 처리가 핵심입니다."},
          {v:"gaming",    l:"멀티플레이어 게임",      d:"실시간 상태 동기화. 100ms 미만 지연시간이 게임성에 직결됩니다."},
          {v:"collab",    l:"실시간 협업 도구",       d:"공동 편집, 커서 동기화. Notion, 피그마류. OT/CRDT 알고리즘 고려가 필요합니다."},
        ]
      }] : []),
      ...(selectedTypes.includes("saas") ? [{
        id:"saas_detail",
        q:"SaaS 플랫폼의 테넌트 격리 모델은 무엇인가요?",
        help:"테넌트(고객사) 데이터를 어떻게 격리하느냐에 따라 DB 설계와 비용이 크게 달라집니다. 보안 요구가 높을수록 격리 수준을 높이지만 비용도 증가합니다.",
        multi:false, opts:[
          {v:"multi_shared",   l:"멀티테넌트 공유 (Pool)",  d:"모든 고객사가 하나의 DB 공유. 비용 최저, 고객사 간 데이터 분리는 Row-level Security로. 소규모 SaaS 표준."},
          {v:"multi_isolated", l:"멀티테넌트 격리 (Bridge)",d:"스키마 또는 DB 수준 고객사 분리. 금융·의료 SaaS. 관리 복잡도 증가, 보안 강화."},
          {v:"single_tenant",  l:"고객사별 독립 인프라 (Silo)",d:"고객마다 별도 VPC·DB. 최고 보안·성능, 최고 비용. 엔터프라이즈 SaaS."},
        ]
      }] : []),
      ...(selectedTypes.includes("iot") ? [{
        id:"iot_detail",
        q:"IoT 서비스의 주요 사용 환경은 무엇인가요?",
        help:"IoT 환경마다 디바이스 수, 메시지 빈도, 지연시간 요구가 다릅니다. 산업 IoT는 수십 ms 지연시간이 생산 안전에 직결되고, 스마트홈은 수백 ms가 허용됩니다.",
        multi:false, opts:[
          {v:"smart_home",        l:"스마트홈 / 스마트빌딩", d:"조명·냉방·보안 장치 수천 개. 메시지는 드물지만 이상 감지 시 즉시 알림이 필요합니다."},
          {v:"industrial",        l:"산업 IoT (IIoT)",        d:"공장 센서 수만 개, 초당 수천 메시지. 저지연 + 데이터 손실 없음이 안전과 직결됩니다."},
          {v:"connected_vehicle", l:"커넥티드 카 / 모빌리티", d:"이동 중 연결, GPS·텔레매틱스. 간헐적 연결과 엣지 처리 설계가 필요합니다."},
          {v:"healthcare_iot",    l:"헬스케어 웨어러블",      d:"심박·혈당 등 생체 데이터. HIPAA·개인정보 보호가 가장 강력하게 요구됩니다."},
        ]
      }] : []),
      ...(selectedTypes.includes("data") ? [{
        id:"data_detail",
        q:"데이터 분석 파이프라인의 주요 목적은 무엇인가요?",
        help:"데이터 파이프라인의 목적에 따라 저장소와 처리 도구가 달라집니다. 실시간 분석은 Kinesis+Lambda, 배치 분석은 S3+Athena, ML은 SageMaker가 중심이 됩니다.",
        multi:false, opts:[
          {v:"log_analytics",    l:"로그 / 이벤트 분석",   d:"클릭스트림, 앱 로그 집계. OpenSearch 또는 CloudWatch Insights로 실시간 조회합니다."},
          {v:"ml_pipeline",      l:"ML / AI 파이프라인",   d:"학습 데이터 수집·전처리·모델 학습. S3 데이터 레이크 + SageMaker가 중심입니다."},
          {v:"bi_dashboard",     l:"BI 대시보드 / 경영 리포트",d:"KPI, 매출 집계. Redshift + QuickSight로 일 단위 배치 집계가 일반적입니다."},
          {v:"stream_analytics", l:"실시간 스트림 분석",   d:"사기 탐지, 실시간 집계. Managed Apache Flink(구 Kinesis Analytics) 또는 MSK + Flink로 ms 단위 처리합니다."},
          {v:"ai_genai",         l:"생성형 AI / RAG 파이프라인", d:"LLM 기반 챗봇, 문서 검색, 코드 생성 등. Amazon Bedrock으로 Claude, Llama 등 모델을 사용합니다. 토큰 기반 과금입니다."},
        ]
      }] : []),
      {
        id:"growth_stage",
        q:"서비스의 현재 단계는 무엇인가요?",
        help:"단계마다 최우선 목표가 다릅니다. MVP는 '검증', 성장기는 '안정적 확장', 성숙기는 '비용 최적화'입니다. 너무 이른 과도한 인프라는 비용 낭비이고, 너무 늦은 확장은 장애로 이어집니다.",
        multi:false, opts:[
          {v:"mvp",    l:"MVP / 아이디어 검증",  d:"아직 사용자를 모으는 중. 최소한의 비용으로 빠르게 출시해 검증하는 것이 최우선입니다."},
          {v:"growth", l:"성장기 — 사용자 확보 중",d:"MAU가 빠르게 증가 중. 기능 개발 속도와 안정성을 동시에 잡아야 합니다."},
          {v:"scale",  l:"스케일업 — 안정적 운영 중",d:"트래픽이 안정적. 이제 성능 최적화와 비용 효율화에 투자할 시점입니다."},
          {v:"mature", l:"성숙기 — 대형 서비스",  d:"수십만~수백만 DAU. 아키텍처 결정 하나가 월 수천만 원 비용과 직결됩니다."},
        ]
      },
      {
        id:"business_model",
        q:"비즈니스 모델(수익 구조)은 무엇인가요?",
        help:"수익 구조가 인프라 선택에 영향을 줍니다. 거래 수수료 모델은 결제 실패 시 직접 손실이 발생하므로 99.99% 가용성이 중요하고, 사내 도구는 비용 최소화가 우선입니다.",
        multi:false, opts:[
          {v:"subscription",  l:"구독형 (월정액)",       d:"정기 결제. 해지 방어와 결제 실패 재시도 처리가 비즈니스 핵심입니다."},
          {v:"transaction",   l:"거래 수수료형 (PG/결제)", d:"거래마다 수수료. 결제 실패 = 직접 손실. 결제 서비스 안정성이 최우선입니다."},
          {v:"saas_license",  l:"기업 라이센스형 (B2B)", d:"연간 계약. SLA 위반 시 계약 페널티. 약속한 가용성 보장이 핵심입니다."},
          {v:"freemium",      l:"부분 무료형 (Freemium)", d:"기본 무료 + 프리미엄 유료. 무료 사용자 비용 최소화와 유료 전환이 관건입니다."},
          {v:"advertising",   l:"광고형",                 d:"페이지뷰·클릭 기반 수익. 트래픽 많을수록 수익. CDN 캐시 최적화가 핵심입니다."},
          {v:"internal_tool", l:"사내 도구 (수익 없음)",  d:"비용 최소화. 직원 생산성 도구. 합리적인 수준의 가용성으로 충분합니다."},
        ]
      },
      {
        id:"data_sensitivity",
        q:"이 서비스에서 다루는 데이터가 얼마나 민감한가요?",
        help:"한 서비스에서 공개 데이터와 결제 정보를 동시에 다루는 경우, 가장 민감한 데이터를 기준으로 선택하세요. 전체 보안 설계는 가장 높은 보호 수준에 맞춰야 합니다.",
        multi:false, opts:[
          {v:"public",   l:"공개 데이터",        d:"뉴스 기사, 상품 목록처럼 누구나 봐도 되는 데이터입니다. 유출돼도 큰 문제가 없습니다."},
          {v:"internal", l:"내부 비즈니스 데이터",d:"주문 내역, 매출 데이터처럼 외부에 공개하면 안 되지만 특별히 규제된 건 아닌 데이터입니다."},
          {v:"sensitive",l:"개인정보 (이름·연락처 등)",d:"이름, 이메일, 전화번호, 주소처럼 개인을 식별할 수 있는 데이터입니다. 법적 보호 대상입니다."},
          {v:"critical", l:"결제 정보 / 의료 기록 / 금융 데이터",d:"카드 번호, 진료 기록처럼 유출 시 법적 제재와 큰 피해가 발생합니다. 가장 강력한 보호가 필요합니다."},
        ]
      },
      {
        id:"user_type",
        q:"이 서비스를 쓰는 사람은 누구인가요? (복수 선택 가능)",
        help:"사용자 유형이 여럿인 경우 모두 선택하세요. 예: 마켓플레이스 → B2C 구매자 + B2B 판매자, 어드민 포함 서비스 → B2C + 사내 직원.",
        multi:true, opts:[
          {v:"b2c",     l:"일반 소비자 (B2C)",  d:"불특정 다수가 쓰는 서비스. 갑자기 트래픽이 폭발할 수 있어 유연한 구조가 필요합니다."},
          {v:"b2b",     l:"기업 고객 (B2B)",    d:"계약한 기업만 사용. 사용 패턴이 예측 가능하고 갑작스러운 트래픽 폭발 가능성이 낮습니다."},
          {v:"internal",l:"사내 직원만",         d:"직원 수가 고정되어 있어 규모 예측이 쉽고 인터넷에 공개할 필요가 없습니다."},
          {v:"global",  l:"전 세계 사용자",      d:"한국뿐 아니라 미국, 유럽 등 여러 나라 사용자를 위한 서비스. 각 지역에서 빠르게 응답해야 합니다."},
        ]
      },
    ];
    return localizeAll(lang, p, qs);
    }

    // ──────────────────────────────────────────
    case "scale": return localizeAll(lang, p, [
      {
        id:"dau",
        q:"하루에 실제로 서비스를 사용하는 사람이 몇 명인가요?",
        help:"현재가 아니라 '6개월~1년 후 목표 규모'를 기준으로 답해 주세요. 이 숫자가 서버 구성과 비용에 가장 큰 영향을 줍니다.",
        multi:false, opts:[
          {v:"tiny",   l:"1,000명 미만",       d:"초기 MVP 또는 사내에서 소수만 쓰는 서비스. 가장 가볍고 저렴한 구성이 가능합니다."},
          {v:"small",  l:"1,000 ~ 10,000명",   d:"초기 스타트업 수준. 서비스가 막 알려지기 시작한 단계입니다."},
          {v:"medium", l:"1만 ~ 10만 명",      d:"성장 중인 서비스. 일반적인 앱/웹 서비스의 중간 규모입니다."},
          {v:"large",  l:"10만 ~ 100만 명",    d:"많이 알려진 서비스. 인프라 설계에 공을 들여야 하는 규모입니다."},
          {v:"xlarge", l:"100만 명 이상",      d:"대형 플랫폼 수준. 별도의 인프라 전담팀이 필요한 규모입니다."},
        ]
      },
      {
        id:"peak_rps",
        q:"가장 바쁠 때 1초에 몇 개의 요청이 들어오나요?",
        help:"RPS(Requests Per Second)는 서버가 버텨야 할 최대 부하를 뜻합니다. 모를 경우 DAU 기반 추정: DAU × 10 ÷ 86,400 × 피크계수(10~20) 으로 계산할 수 있습니다.",
        multi:false, opts:[
          {v:"low",   l:"100 미만",            d:"조용한 서비스. 사내 도구, 초기 MVP에 해당합니다."},
          {v:"mid",   l:"100 ~ 1,000",          d:"일반적인 웹/앱 서비스 수준입니다."},
          {v:"high",  l:"1,000 ~ 10,000",      d:"트래픽이 꽤 많은 서비스. 자동 확장 설계가 필요합니다."},
          {v:"ultra", l:"10,000 이상",          d:"티켓팅 오픈런, 인기 이벤트처럼 특정 순간에 폭발적 트래픽이 몰리는 서비스입니다."},
        ]
      },
      {
        id:"traffic_pattern",
        q:"트래픽 패턴이 어떻게 되나요? (복수 선택 가능)",
        help:"패턴이 복합적인 경우 모두 선택하세요. 예: 쇼핑몰 타임세일 → '낮엔 많고 밤엔 적음' + '특정 시간에 폭발적 증가' 동시 선택. 선택한 패턴 중 가장 까다로운 패턴을 기준으로 설계합니다.",
        multi:true, opts:[
          {v:"steady",  l:"24시간 내내 비슷한 수준",d:"ERP, B2B SaaS처럼 언제나 비슷한 트래픽. 예측이 쉬워 비용 계획이 수월합니다."},
          {v:"business",l:"낮엔 많고 밤엔 적음",    d:"업무시간에 집중되는 사내 도구나 B2B 서비스. 밤에 자동으로 줄이면 비용을 아낄 수 있습니다."},
          {v:"spike",   l:"특정 시간에 폭발적 증가", d:"오픈런, 선착순 이벤트처럼 정해진 시간에 갑자기 몰리는 서비스입니다."},
          {v:"burst",   l:"언제 몰릴지 예측 불가",   d:"바이럴 콘텐츠, SNS 노출에 따라 갑자기 몰릴 수 있는 서비스입니다."},
        ]
      },
      {
        id:"data_volume",
        q:"이 서비스에서 저장·관리할 데이터의 총량은 어느 정도인가요?",
        help:"DB, 파일, 로그를 모두 합친 용량을 생각해 주세요. 저장소 종류와 비용이 여기서 결정됩니다.",
        multi:false, opts:[
          {v:"none",l:"거의 없음 (계산 위주)",  d:"저장보다 연산이 주인 서비스. ML 추론, 실시간 변환 등이 해당합니다."},
          {v:"gb",  l:"수십 ~ 수백 GB",          d:"초기 서비스 또는 데이터가 많지 않은 B2B 도구입니다."},
          {v:"tb",  l:"수 TB",                   d:"수년치 트랜잭션, 이미지/영상 파일이 쌓이는 서비스입니다."},
          {v:"ptb", l:"수십 TB 이상",            d:"로그, 미디어, ML 학습 데이터처럼 대용량 데이터를 다루는 서비스입니다."},
        ]
      },
    ]);

    // ──────────────────────────────────────────
    case "team": {
      return localizeAll(lang, p, [
      {
        id:"team_size",
        q:"이 서비스를 개발하고 운영하는 팀이 몇 명인가요?",
        help:"팀 규모에 따라 '얼마나 복잡한 인프라를 감당할 수 있는지'가 결정됩니다. 화려한 기술도 운영할 사람이 없으면 장애의 원인이 됩니다.",
        multi:false, opts:[
          {v:"solo",  l:"1인 (나 혼자)",   d:"개발부터 운영까지 혼자 합니다. 자동화되고 관리 부담이 적은 서비스 중심으로 설계해야 합니다."},
          {v:"small", l:"2~5명",           d:"소규모 스타트업. 인프라에 너무 많은 시간을 쏟기 어렵습니다."},
          {v:"medium",l:"6~20명",          d:"개발자 중 1~2명이 인프라를 겸할 수 있는 규모입니다."},
          {v:"large", l:"20명 이상",       d:"인프라·SRE 전담팀이 있거나 만들 수 있는 규모입니다."},
        ]
      },
      {
        id:"cloud_exp",
        q:"팀에서 AWS를 가장 많이 아는 사람의 수준은 어느 정도인가요?",
        help:"경험 수준에 따라 권장 서비스가 달라집니다. 모르는 기술을 도입하면 장애 시 대응이 어렵습니다. 솔직하게 선택해 주세요.",
        multi:false, opts:[
          {v:"beginner",l:"입문 (AWS를 써본 적은 있음)",         d:"EC2로 서버 띄우거나 S3에 파일 올려본 경험 정도. 복잡한 설정은 어렵습니다."},
          {v:"mid",     l:"중급 (실무에서 AWS를 1~3년 사용)",   d:"ECS, RDS, VPC 설정 경험이 있고 문서 보면 대부분 설정 가능합니다."},
          {v:"senior",  l:"고급 (AWS 깊은 경험 3년+)",          d:"쿠버네티스, 멀티 계정, 복잡한 네트워크 설계까지 자신 있습니다."},
        ]
      },
      {
        id:"ops_model",
        q:"운영은 어떻게 하고 싶으신가요?",
        help:"운영 모델에 따라 서버를 얼마나 직접 관리할지가 결정됩니다. 관리 부담이 적을수록 자동화 비용(약간의 추가 비용)이 발생합니다.",
        multi:false, opts:[
          {v:"devops",  l:"개발팀이 운영까지 모두 담당",     d:"개발한 사람이 서버도 직접 관리합니다. DevOps 문화가 있는 팀에 적합합니다."},
          {v:"separate",l:"개발팀과 운영팀이 분리되어 있음", d:"개발팀이 만들면 별도 인프라/운영팀이 배포·관리합니다."},
          {v:"managed", l:"AWS가 최대한 알아서 해줬으면 함", d:"서버 관리보다 서비스 개발에 집중하고 싶습니다. 스타트업, 소규모 팀에 적합합니다."},
        ]
      },
      {
        id:"language",
        q:"백엔드 코드를 어떤 언어/프레임워크로 작성할 건가요?",
        help:"언어 선택은 이후 인프라 선택에 직접 영향을 줍니다. Spring Boot는 JVM 워밍업 때문에 서버리스(Lambda)와 궁합이 나쁘고 컨테이너가 유리합니다. Go/Rust는 컨테이너 이미지가 작아 배포 비용이 낮고, Node.js/Python은 Lambda에도 잘 맞습니다.",
        multi:false, opts:[
          {v:"spring_boot",      l:"Java / Spring Boot (엔터프라이즈 표준)",         d:"가장 널리 쓰이는 자바 백엔드 프레임워크입니다. Spring Cloud 생태계(Gateway, Eureka, Config)가 풍부합니다. JVM 특성상 최소 512MB RAM, 콜드스타트 3~10초(SnapStart 시 1~2초). Lambda보다 컨테이너에 적합합니다."},
          {v:"node_express",     l:"Node.js / Express·Fastify (빠른 개발, JS 통일)", d:"프론트엔드와 언어를 통일할 수 있습니다. 콜드스타트가 짧아 Lambda에도 적합합니다. 비동기 I/O 특성상 API 서버에 강합니다."},
          {v:"python_fastapi",   l:"Python / FastAPI·Django (AI/ML 통합, 빠른 개발)", d:"AI/ML 모델 연동이 가장 쉽습니다. FastAPI는 성능이 좋고 타입 힌트를 지원합니다. Lambda에도 잘 맞습니다."},
          {v:"go",               l:"Go (고성능, 적은 메모리, MSA 최적)",              d:"바이너리 하나로 배포되어 컨테이너 이미지가 10MB 수준입니다. 메모리 사용량이 적고 동시 처리 성능이 뛰어납니다. Kubernetes 생태계 도구 대부분이 Go로 작성되어 있습니다."},
          {v:"rust",           l:"Rust (초고성능, 메모리 안전, Lambda 최적)",        d:"Lambda 콜드스타트가 거의 없습니다. 메모리 사용량이 Go의 절반 수준입니다. 학습 곡선이 높아 숙련된 팀에만 권장합니다."},
          {v:"dotnet",         l:".NET / C# (엔터프라이즈, Windows 레거시 통합)",    d:"ASP.NET Core는 Linux 컨테이너에서도 동작합니다. Lambda .NET 8 Native AOT로 콜드스타트 최소화 가능. 기존 Windows 시스템 통합에 강합니다."},
          {v:"mixed",            l:"혼합 (서비스마다 다른 언어)",                     d:"Python으로 ML API, Go로 고성능 API, Java로 레거시 서비스를 각각 운영합니다. 서비스별 최적화가 가능하지만 팀 역량이 분산됩니다."},
        ]
      },
    ]);
    }

    // ──────────────────────────────────────────
    case "slo": {
      const cert = state.compliance?.cert || [];
      const needsHighAvail = cert.includes("pci") || cert.includes("hipaa") || cert.includes("sox");
      const dataIsCritical = state.workload?.data_sensitivity === "critical";
      return localizeAll(lang, p, [
      {
        id:"availability",
        q:(lang === "en"
          ? `How much uptime does the service need per year?${needsHighAvail ? " * Due to selected regulations (PCI/HIPAA/SOX), at least 99.95% is recommended." : ""}`
          : `서비스가 1년에 얼마나 안 꺼져야 하나요?${needsHighAvail ? " ※ 선택한 규정(PCI/HIPAA/SOX)으로 인해 최소 99.95% 이상이 권장됩니다." : ""}`),
        help:"'99.9%'처럼 숫자가 높을수록 허용 다운타임이 짧고 비용도 높아집니다. 서비스가 1시간 멈추면 비즈니스 피해가 얼마나 되는지를 기준으로 판단하세요.",
        multi:false, opts:[
          ...(!needsHighAvail && !dataIsCritical ? [{v:"99", l:"99% — 연간 약 87시간 다운 허용", d:"사내 도구나 중요도 낮은 서비스. 가끔 꺼져도 큰 문제가 없습니다."}] : []),
          {v:"99.9",  l:"99.9% — 연간 약 9시간 다운 허용",     d:"일반적인 B2C 앱이나 쇼핑몰. '분기에 한두 번 짧게 꺼지는' 수준입니다."},
          {v:"99.95", l:"99.95% — 연간 약 4.4시간 다운 허용",  d:"중요 서비스. 결제나 예약이 있어 자주 꺼지면 안 되는 서비스입니다."},
          {v:"99.99", l:"99.99% — 연간 약 53분만 다운 허용",   d:"금융·결제·의료처럼 잠깐이라도 멈추면 큰 손해가 나는 서비스입니다."},
        ]
      },
      {
        id:"rto",
        q:"서버 장애가 났을 때, 얼마나 빨리 복구되어야 하나요? (RTO)",
        help:"RTO(Recovery Time Objective)는 '장애 후 서비스가 다시 정상화되는 최대 허용 시간'입니다. 짧을수록 비용이 높아집니다.",
        multi:false, opts:[
          {v:"hours",   l:"몇 시간 이내",                  d:"야간 배치 서비스나 내부 도구. 담당자가 출근해서 수동으로 복구해도 됩니다."},
          {v:"minutes", l:"30분 이내",                     d:"일반적인 비즈니스 서비스. 담당자가 알림받고 즉시 대응하면 가능한 수준입니다."},
          {v:"lt10min", l:"10분 미만",                     d:"중요한 서비스. 자동화된 복구 프로세스가 일부 필요합니다."},
          {v:"lt1min",  l:"1분 미만 — 거의 자동으로 복구", d:"결제·금융처럼 1분도 멈추면 안 되는 서비스. 자동 장애 감지 + 즉시 복구 설계가 필요합니다."},
        ]
      },
      {
        id:"rpo",
        q:"장애로 데이터를 잃게 된다면, 최대 얼마치까지 허용할 수 있나요? (RPO)",
        help:"RPO(Recovery Point Objective)는 '데이터를 언제 시점으로 복구할 수 있는가'입니다. 결제 서비스는 1건도 잃으면 안 되고, 게시판 서비스는 1시간치 글이 사라져도 감당 가능할 수 있습니다.",
        multi:false, opts:[
          {v:"24h",  l:"하루치 데이터는 잃어도 됨",     d:"매일 새벽 백업으로 충분한 서비스. 중요도 낮은 내부 데이터입니다."},
          {v:"1h",   l:"최대 1시간치만 손실 허용",       d:"1시간마다 백업하는 서비스. 일반적인 웹 서비스 수준입니다."},
          {v:"15min",l:"최대 15분치만 손실 허용",        d:"중요한 서비스. 잦은 백업과 실시간에 가까운 복제가 필요합니다."},
          {v:"zero", l:"데이터 손실 절대 불허",          d:"결제 1건, 트랜잭션 1개도 잃어선 안 됩니다. 실시간 복제가 필요합니다."},
        ]
      },
      {
        id:"region",
        q:"서비스를 어느 지역(리전)에 운영할 계획인가요?",
        help:"한 지역에만 두면 그 지역 전체에 장애가 나면 서비스도 멈춥니다. 중요도에 따라 여러 지역에 나눠두는 전략이 있습니다.",
        multi:false, opts:[
          {v:"single",l:"한 곳에만 (예: 서울)",           d:"국내 서비스 대부분. 단순하고 비용이 낮습니다. 리전 전체 장애 시 서비스 중단 가능성이 있습니다."},
          {v:"dr",    l:"기본 + 비상용 백업 지역",         d:"평소엔 서울에서만 운영하다가 큰 장애 시 다른 리전(예: 도쿄)으로 전환합니다."},
          {v:"active",l:"여러 지역에서 동시에 운영",      d:"미국, 유럽, 아시아에서 동시에 서비스. 글로벌 서비스나 최고 수준의 가용성이 필요할 때 사용합니다."},
        ]
      },
    ]);
    }

    // ──────────────────────────────────────────
    case "compliance": return localizeAll(lang, p, [
      {
        id:"cert",
        q:"반드시 지켜야 할 법적·계약적 보안 규정이 있나요? (복수 선택 가능)",
        help:"보안 인증은 선택이 아니라 사업 가능 조건일 수 있습니다. 모르겠으면 법무/컴플라이언스 담당자에게 확인하세요. 없으면 '없음'을 선택하세요.",
        multi:true, opts:[
          {v:"none",   l:"특별히 없음",         d:"일반적인 웹 서비스. 기본 보안만 갖추면 됩니다."},
          {v:"isms",   l:"ISMS — 정보보호 관리체계",  d:"일정 규모 이상 사업자 의무 인증. 정보보호 관리체계 수립·운영을 검증합니다."},
          {v:"isms_p", l:"ISMS-P — 정보보호 + 개인정보보호", d:"개인정보를 수집하는 서비스에 필요. ISMS에 개인정보 처리 단계별 보호 요구사항이 추가됩니다."},
          {v:"gdpr",   l:"GDPR",               d:"유럽 사용자가 있는 서비스라면 반드시 준수해야 합니다. 위반 시 엄청난 과징금이 부과됩니다."},
          {v:"pci",    l:"PCI-DSS",            d:"신용카드 정보를 직접 처리하는 서비스라면 필수입니다. PG사를 쓰면 일부 면제될 수 있습니다."},
          {v:"hipaa",  l:"HIPAA",              d:"미국 사용자의 의료/건강 정보를 다루는 서비스에 필요합니다."},
          {v:"sox",    l:"SOX",               d:"미국 상장사이거나 미국 상장사의 계열사라면 재무 데이터 관련 규정 준수가 필요합니다."},
        ]
      },
      {
        id:"encryption",
        q:"데이터 암호화는 어느 수준으로 해야 하나요?",
        help:"암호화는 '이동 중인 데이터(전송)'와 '저장된 데이터(저장)' 두 가지를 고려해야 합니다. 민감한 데이터일수록 둘 다 암호화해야 합니다.",
        multi:false, opts:[
          {v:"basic",   l:"전송 중 암호화만 (HTTPS)",         d:"웹사이트 기본. 브라우저와 서버 사이 데이터가 암호화됩니다. DB에 저장된 데이터는 암호화 안 됩니다."},
          {v:"standard",l:"전송 + 저장 데이터 모두 암호화",  d:"DB, 파일 저장소도 암호화합니다. 개인정보를 다루는 서비스의 기본 수준입니다."},
          {v:"strict",  l:"강화 암호화 + 모든 접근 기록 감사",d:"누가 언제 어떤 데이터에 접근했는지까지 기록합니다. 금융·의료·결제 서비스 수준입니다."},
        ]
      },
      {
        id:"network_iso",
        q:"DB 서버 등 민감한 시스템을 인터넷으로부터 얼마나 차단해야 하나요?",
        help:"인터넷에서 DB에 직접 접근 가능하면 해킹 위험이 매우 높습니다. 대부분의 서비스는 DB를 인터넷에서 완전히 차단하는 것이 기본입니다.",
        multi:false, opts:[
          {v:"basic",  l:"기본 격리 — 비밀번호로 보호",              d:"DB가 외부에서 보이긴 하지만 비밀번호가 있습니다. 개발/테스트 환경에는 괜찮지만 운영에는 위험합니다."},
          {v:"strict", l:"강한 격리 — DB는 인터넷에서 완전히 차단",  d:"DB는 같은 내부 네트워크에서만 접근 가능합니다. 운영 서비스의 기본 설계입니다."},
          {v:"private",l:"완전 프라이빗 — 사내망(VPN/전용선)으로만 접근",d:"인터넷을 통한 접근 자체가 없습니다. 금융기관이나 높은 보안 요구 환경입니다."},
        ]
      },
    ]);

    // ──────────────────────────────────────────
    case "network": {
      const needsStrictNet = state.compliance?.cert?.includes("pci") ||
        state.compliance?.cert?.includes("hipaa") || state.slo?.availability === "99.99";
      const isLarge = ["large","xlarge"].includes(state.scale?.dau);
      return localizeAll(lang, p, [
        {
          id:"account_structure",
          q:"AWS 계정을 어떻게 구성할 건가요?",
          help:"계정은 '건물'에 비유할 수 있습니다. 운영(Prod)과 개발(Dev)을 같은 건물에 두면 관리는 쉽지만 개발 실수가 운영에 영향을 줄 수 있습니다.",
          multi:false,
          opts:[
            {v:"single",l:"하나의 계정에 모든 환경을 함께",      d:"가장 단순합니다. 소규모 초기 서비스에 적합하지만, 개발 실수가 운영에 영향을 줄 수 있습니다."},
            {v:"envs",  l:"운영/개발/테스트 계정을 별도로 분리 (권장)", d:"운영 환경을 독립시켜 개발 실수의 영향을 차단합니다. 중소 규모 이상의 운영 서비스 기본입니다."},
            {v:"org",l:"부서·서비스별로 완전히 분리 (AWS Organizations)",d:"대기업 수준. 청구서 통합, 중앙 보안 정책 등을 조직 전체에 적용할 수 있습니다."},
          ]
        },
        {
          id:"az_count",
          q:(lang === "en"
            ? `How many Availability Zones should servers be distributed across?${needsStrictNet ? " * Your security requirements mandate at least 2 AZs." : ""}`
            : `서버를 몇 개의 '데이터센터 구역(가용영역)'에 나눠 배치할까요?${needsStrictNet ? " ※ 선택한 보안 요건상 최소 2개 이상 필요합니다." : ""}`),
          help:"AWS는 한 리전에 여러 개의 독립된 데이터센터(가용영역, AZ)를 운영합니다. 한 곳에 문제가 생겨도 다른 곳에서 서비스를 계속할 수 있습니다.",
          multi:false,
          opts:[
            ...(!needsStrictNet ? [{v:"1az",l:"1개 — 비용 최소, 개발/테스트용",  d:"한 곳에만 배치합니다. 운영 서비스엔 권장하지 않습니다. 개발 환경이나 비용이 매우 중요한 경우에만 사용합니다."}] : []),
            {v:"2az",l:"2개 — 운영 서비스 표준 구성",    d:"두 곳에 나눠 배치합니다. 하나가 문제 생겨도 나머지가 운영됩니다. 대부분의 운영 서비스에 적합합니다."},
            {v:"3az",l:"3개 — 최고 수준의 안정성 필요 시",d:"세 곳에 나눠 최대 안정성을 확보합니다. 금융·결제·의료처럼 잠깐도 멈추면 안 되는 서비스에 사용합니다."},
          ]
        },
        {
          id:"subnet_tier",
          q:"네트워크 내부를 어떻게 구역으로 나눌까요?",
          help:"아파트로 비유하면: 퍼블릭(공개 복도) → 프라이빗(세대) → 격리(금고실) 로 나눌수록 안전합니다. 나눌수록 관리가 복잡해지지만 보안이 강해집니다.",
          multi:false,
          opts:[
            ...(!needsStrictNet ? [{v:"2tier",l:"2구역 — 공개 구역 + 내부 구역",         d:"일반 웹 서비스 기본 구성. 로드밸런서는 공개, 서버와 DB는 내부 구역에 둡니다."}] : []),
            {v:"3tier",l:"3구역 — 공개 / 내부 / DB 전용 격리 구역 (권장)", d:"DB를 별도 격리 구역에 완전히 격리합니다. 해킹 시에도 DB에 바로 접근이 불가능합니다. 운영 서비스 권장입니다."},
            {v:"private",l:"공개 구역 없음 — 모든 접근은 사내망으로만", d:"인터넷에서 아예 접근이 불가능합니다. 전용선이나 VPN으로만 들어올 수 있습니다. 금융·공공기관 수준입니다."},
          ]
        },
        {
          id:"nat_strategy",
          q:"내부 서버가 인터넷에 나가려면 '출구'가 필요합니다. 어떻게 구성할까요?",
          help:"내부(프라이빗) 서버는 외부 API를 호출하거나 소프트웨어를 설치할 때 인터넷 출구(NAT Gateway)가 필요합니다. 이 출구는 유료입니다.",
          skip: state.network?.subnet_tier === "private",
          multi:false, opts:[
            {v:"per_az",  l:"구역마다 별도 출구 (안정적, 권장)",        d:"각 구역에 독립된 출구가 있어 하나가 고장나도 나머지가 작동합니다. 약 월 $43~59 × 구역 수 비용이 듭니다."},
            {v:"shared",  l:"출구 1개 공유 (비용 절감)",                d:"비용을 줄일 수 있지만 이 출구가 문제 생기면 전체 내부 서버의 외부 통신이 막힙니다. 개발 환경에 적합합니다."},
            {v:"endpoint",l:"AWS 서비스 전용 통로 활용으로 출구 최소화",d:"AWS의 S3, DB 등은 전용 내부 통로를 통해 접근해 비용을 줄입니다. 외부 API 호출이 많지 않은 경우에 유리합니다."},
          ]
        },
        {
          id:"hybrid",
          q:"회사 사무실이나 기존 온프레미스 서버와 AWS를 연결해야 하나요? (복수 선택 가능)",
          help:"VPN과 전용선을 함께 쓰는 경우도 흔합니다. 예: Direct Connect(주 경로) + Site-to-Site VPN(백업 경로). 연결이 불필요하면 '아니오'만 선택하세요.",
          multi:true, opts:[
            ...(state.network?.subnet_tier !== "private" ? [{v:"no",  l:"아니오 — 클라우드에만 있으면 됩니다",  d:"모든 시스템이 AWS에 있거나, 사내 서버와 연결이 필요 없습니다."}] : []),
            {v:"vpn", l:"VPN으로 연결 (인터넷 경유 암호화)",    d:"인터넷을 암호화된 터널로 연결합니다. 빠르게 구축 가능하고 비용이 저렴하지만 대역폭이 제한됩니다."},
            {v:"dx",  l:"전용선으로 연결 (Direct Connect)",    d:"물리적 전용선을 설치합니다. 안정적이고 빠르지만 개통에 수주~수개월이 걸리고 비용이 높습니다."},
          ]
        },
        ...(state.network?.account_structure === "org" || state.compliance?.cert?.includes("pci") || state.compliance?.cert?.includes("hipaa") ? [{
          id:"network_firewall",
          q:"VPC 간 또는 인터넷 경계에서 네트워크 트래픽을 심층 검사할 방화벽이 필요한가요?",
          help:"AWS Network Firewall은 VPC 경계에서 IDS/IPS(침입 탐지·방지), 도메인 필터링, Suricata 규칙 기반 패킷 검사를 수행합니다. WAF가 L7(HTTP) 방화벽이라면 Network Firewall은 L3/L4/L7 모두를 커버하는 네트워크 방화벽입니다.",
          multi:false, opts:[
            {v:"none",             l:"없음 — Security Group + NACL로 충분",            d:"Security Group과 NACL로 기본적인 네트워크 격리를 합니다. 소규모 서비스이거나 규정 요건이 없는 경우 충분합니다."},
            {v:"network_firewall", l:"AWS Network Firewall (IDS/IPS, 도메인 필터링)",  d:"Suricata 호환 규칙으로 악성 트래픽 탐지·차단, 특정 도메인만 허용하는 이그레스 필터링이 가능합니다. PCI DSS, HIPAA 환경에서 요구되는 심층 패킷 검사를 수행합니다."},
            {v:"third_party",      l:"3rd-party 방화벽 (Palo Alto, Fortinet 등)",      d:"기존 온프레미스에서 사용하던 벤더의 가상 어플라이언스를 AWS에 배포합니다. 기존 정책·규칙을 재사용할 수 있지만 라이선스 비용이 추가됩니다."},
          ]
        }] : []),
      ]);
    }

    // ──────────────────────────────────────────
    case "compute": {
      const cloudExp = state.team?.cloud_exp || "beginner";
      const isJunior = cloudExp === "beginner";
      const isMid    = cloudExp === "mid";
      const teamLang = state.team?.language;
      const hasDynamo = Array.isArray(state.data?.primary_db) && state.data.primary_db.includes("dynamodb");
      const hasAuroraOrRds = Array.isArray(state.data?.primary_db) && state.data.primary_db.some((d: string) => d.startsWith("aurora") || d.startsWith("rds"));
      const isSpringBoot = teamLang === "spring_boot";

      // 데이터/언어 기반 컴퓨트 가이드
      const computeHints: string[] = [];
      if (lang === "en") {
        if (isSpringBoot) computeHints.push("Spring Boot (JVM) has long cold starts, making containers preferable over Lambda.");
        if (hasDynamo && !hasAuroraOrRds) computeHints.push("A DynamoDB-centric setup pairs well with serverless (Lambda).");
        if (hasAuroraOrRds) computeHints.push("RDS/Aurora requires connection management, so containers (ECS/EKS) are more stable.");
      } else {
        if (isSpringBoot) computeHints.push("Spring Boot(JVM)는 콜드스타트가 길어 Lambda보다 컨테이너가 유리합니다.");
        if (hasDynamo && !hasAuroraOrRds) computeHints.push("DynamoDB 중심 구성은 서버리스(Lambda)와 궁합이 좋습니다.");
        if (hasAuroraOrRds) computeHints.push("RDS/Aurora는 커넥션 관리가 필요하므로 컨테이너(ECS/EKS)가 안정적입니다.");
      }
      const baseHelp = lang === "en"
        ? "The choice between managing servers yourself or letting AWS manage them. Less management burden is more convenient but offers less granular control."
        : "서버를 직접 관리할지, AWS가 관리하게 할지의 선택입니다. 관리 부담이 적을수록 편하지만 세밀한 제어가 어렵습니다.";
      const hintLabel = lang === "en" ? "Based on your earlier selections:" : "앞서 선택한 구성 기반 참고:";
      const computeHelp = computeHints.length > 0
        ? `${baseHelp}\n\n${hintLabel}\n${computeHints.map(h => `• ${h}`).join("\n")}`
        : baseHelp;

      return localizeAll(lang, p, [
        {
          id:"arch_pattern",
          q:"코드를 어떤 방식으로 실행할 건가요?",
          help:computeHelp,
          multi:false,
          opts:[
            {v:"serverless",l:"서버리스 — AWS가 서버를 알아서 관리",      d:"코드만 올리면 AWS가 요청에 맞게 자동으로 실행합니다. 서버를 신경 쓸 필요가 없고 쓴 만큼만 돈을 냅니다. 소규모·이벤트성 처리에 최적입니다."},
            {v:"container", l:"컨테이너 — 가볍고 유연한 실행 단위",        d:"도커(Docker) 컨테이너를 AWS에서 실행합니다. 현재 가장 대중적인 방식입니다. 서버 관리 부담이 적으면서도 유연합니다."},
            {v:"app_runner",l:"App Runner — 가장 단순한 컨테이너 (MVP 최적)", d:"Docker 이미지만 제공하면 빌드·배포·스케일링·TLS 모두 자동입니다. VPC 설정 불필요. WebSocket 미지원, VPC 제어 제한이 있습니다."},
            {v:"vm",l:"VM(가상 서버) — 직접 서버를 빌려 관리",d:"EC2라는 가상 서버를 직접 임대합니다. 세밀한 제어가 가능하지만 OS 패치, 설정, 모니터링을 직접 해야 합니다."},
            {v:"hybrid",    l:"혼합 — 서비스마다 다른 방식 적용",          d:"API는 컨테이너, 알림은 서버리스처럼 특성에 맞게 섞어 씁니다. 복잡하지만 비용과 성능 모두를 최적화할 수 있습니다."},
          ]
        },
        {
          id:"orchestration",
          q:"여러 컨테이너를 어떻게 관리할 건가요?",
          help:"컨테이너가 많아지면 '어디서 몇 개를 돌릴지' 자동 관리가 필요합니다. ECS는 AWS 전용으로 단순하고, EKS는 쿠버네티스 업계 표준입니다. 팀 경험에 관계없이 원하는 방식을 선택하세요.",
          skip: state.compute?.arch_pattern === "serverless" || state.compute?.arch_pattern === "vm" || state.compute?.arch_pattern === "app_runner",
          multi:false,
          opts:[
            {v:"ecs",
             l:"ECS — AWS 전용 컨테이너 관리 (단순함, 권장)",
             d:"AWS가 만든 컨테이너 관리 도구입니다. 쿠버네티스보다 훨씬 단순하고 배우기 쉽습니다. 서비스가 10개 미만이면 대부분 이걸로 충분합니다. 운영 부담이 적고 AWS 서비스와 자연스럽게 통합됩니다."},
            {v:"eks",
             l:lang === "en"
               ? `EKS — Kubernetes${isJunior ? " -- high operational complexity" : isMid ? " (team learning plan needed)" : " (Standard, powerful)"}`
               : `EKS — 쿠버네티스${isJunior ? " ⚠️ 높은 운영 복잡도" : isMid ? " (팀 학습 계획 필요)" : " (표준, 강력)"}`,
             d:lang === "en"
               ? (isJunior
                 ? "Industry-standard Kubernetes. Powerful but very high operational complexity. At the current team experience level, sufficient learning and a roadmap are needed before adoption. Consider ECS first if simplicity is needed."
                 : isMid
                 ? "Industry-standard Kubernetes. Strong for large-scale MSA environments but initial setup and operations take time. Plan K8s learning within the team."
                 : "Industry-standard Kubernetes on AWS. Leverage the powerful ecosystem including Karpenter, Istio, and ArgoCD. Optimal for large-scale MSA services.")
               : (isJunior
                 ? "업계 표준 쿠버네티스입니다. 강력하지만 운영 복잡도가 매우 높습니다. 현재 팀 경험 수준에서는 도입 전 충분한 학습과 로드맵이 필요합니다. 단순함이 필요하다면 ECS를 먼저 고려하세요."
                 : isMid
                 ? "업계 표준 쿠버네티스입니다. 대규모·MSA 환경에 강하지만 초기 셋업과 운영에 시간이 필요합니다. 팀 내 K8s 학습 계획을 함께 세우세요."
                 : "업계 표준 쿠버네티스를 AWS에서 씁니다. Karpenter, Istio, ArgoCD 등 강력한 생태계를 활용할 수 있습니다. 대규모 MSA 서비스에 최적입니다.")},
          ]
        },
        {
          id:"compute_node",
          q:"서버(컴퓨팅 자원)를 어떻게 제공받을 건가요?",
          help:"'내가 서버를 빌려 직접 관리할지', 'AWS가 서버를 알아서 배정해줄지'를 결정합니다. Fargate는 편리하지만 약간 비쌉니다.",
          skip: state.compute?.arch_pattern === "serverless" || state.compute?.arch_pattern === "vm" || state.compute?.arch_pattern === "app_runner",
          multi:false,
          opts:[
            {v:"fargate",  l:"Fargate — 서버 없이 컨테이너만 배포 (권장)", d:"서버를 신경 쓸 필요가 없습니다. AWS가 필요한 자원을 자동으로 배정합니다. 소·중규모 팀에게 가장 추천합니다."},
            {v:"ec2_node",l:"EC2 — 서버를 직접 관리해 비용 절감",d:"가상 서버를 직접 임대해 관리합니다. 손이 많이 가지만 대규모 서비스에서 비용을 크게 줄일 수 있습니다."},
            {v:"mixed",    l:"Fargate + EC2 혼합 — 기본은 편리하게, 피크는 저렴하게", d:"평소엔 Fargate를 쓰고 폭발적 트래픽에는 저렴한 EC2 Spot을 섞습니다. 비용과 편의성의 절충안입니다."},
          ]
        },
        {
          id:"scaling",
          q:"서버 확장 방식은 어떻게 할 건가요? (복수 선택 가능)",
          help:"확장 방식을 여러 개 조합할 수 있습니다. 예: 이벤트성 서비스라면 '스케줄 사전 확장'(이벤트 전 미리 늘림) + 'CPU 기준 자동 확장'(실시간 대응) 둘 다 선택. 평소 트래픽이 일정하다면 CPU 기준 1개로 충분합니다.",
          skip: state.compute?.arch_pattern === "serverless" || state.compute?.arch_pattern === "app_runner",
          multi:true,
          opts:[
            {v:"ecs_asg",l:"CPU/메모리 기준 자동 확장 (기본)", d:"서버가 바빠지면(CPU 70% 이상) 자동으로 추가됩니다. 가장 보편적인 방식입니다. 거의 모든 서비스에 기본으로 적용합니다."},
            {v:"scheduled",l:"스케줄 사전 확장 — 이벤트 전 미리 늘림", d:"'오후 2시 타임세일 시작 10분 전에 서버 10대로 늘려라' 처럼 예약합니다. 스파이크 직전 Cold Start 없이 대비할 수 있습니다."},
            ...((state.compute?.orchestration === "eks") ? [{v:"keda",l:"대기열 메시지 수 기준 확장 (정밀)",d:"처리할 일(SQS 메시지)이 쌓이면 자동으로 서버를 늘립니다. 배치 처리, 이미지 변환 등 작업 기반 서비스에 적합합니다."}] : []),
            {v:"manual",l:"수동 조절 — 자동 확장 없음",                   d:"트래픽이 거의 변하지 않거나 규모가 매우 작은 내부 도구에 적합합니다."},
          ]
        },
      ]);
    }

    // ──────────────────────────────────────────
    case "data": {
      const isCritical = state.workload?.data_sensitivity === "critical";
      const isHighAvail = state.slo?.availability === "99.99" || state.slo?.availability === "99.95";
      const wlTypes: string[] = (state.workload as Record<string, unknown>)?.type as string[] || [];
      return localizeAll(lang, p, [
        {
          id:"primary_db",
          q:"주요 데이터를 어떤 데이터베이스에 저장할 건가요? (복수 선택 가능)",
          help:"DB를 하나만 쓸 필요는 없습니다. 예: Aurora(주문·결제 트랜잭션) + DynamoDB(세션·장바구니·실시간 상태) 조합이 대규모 서비스의 일반적 패턴입니다. 역할이 다른 DB는 함께 선택하세요. 파일만 쓴다면 'DB 없음'을 선택하세요.",
          multi:true, opts:[
            {v:"aurora_pg",   l:"Aurora PostgreSQL — 고성능 관계형 DB",    d:"AWS가 만든 고성능 DB입니다. 복잡한 쿼리, 트랜잭션(결제 등)에 강합니다. RDS보다 높은 쓰기 처리량과 자동 스토리지 확장을 제공합니다. 운영 서비스 권장입니다."},
            {v:"aurora_mysql",l:"Aurora MySQL — MySQL 호환 고성능 DB",     d:"기존에 MySQL을 쓰고 있다면 호환되면서 더 빠른 Aurora MySQL로 올리세요."},
            {v:"rds_pg",      l:"RDS PostgreSQL — 표준 PostgreSQL",         d:"PostgreSQL을 그대로 씁니다. 소·중규모 서비스에 충분하고 Aurora보다 저렴합니다."},
            {v:"rds_mysql",   l:"RDS MySQL — 표준 MySQL",                   d:"MySQL을 그대로 씁니다. 가장 널리 쓰이는 조합입니다."},
            {v:"dynamodb",    l:"DynamoDB — 무제한 확장 NoSQL",             d:"유연한 구조의 데이터를 초고속으로 처리합니다. 단순 조회·저장이 많고 관계가 복잡하지 않은 데이터에 적합합니다."},
            {v:"documentdb",  l:"DocumentDB — MongoDB 호환 문서형 DB",     d:"기존 MongoDB 코드를 그대로 사용합니다. JSON 문서 데이터를 저장하며 관계형보다 유연한 스키마를 제공합니다."},
            ...(["saas","ecommerce","data"].some(t => wlTypes.includes(t)) ? [
              {v:"neptune",   l:"Neptune — 그래프 데이터베이스",            d:"소셜 네트워크, 사기 탐지, 추천 엔진에 최적화됩니다. 데이터 간 관계를 탐색하는 쿼리에 강합니다. Gremlin/SPARQL 쿼리 언어를 사용합니다."},
            ] : []),
            ...(["iot","data"].some(t => wlTypes.includes(t)) ? [
              {v:"timestream", l:"Timestream — 시계열 데이터 전용 DB",      d:"IoT 센서, 서버 메트릭, 금융 시계열 데이터에 최적화됩니다. 시간 기반 집계·이상 탐지 쿼리가 매우 빠릅니다. 서버리스로 관리 부담이 없습니다."},
            ] : []),
            {v:"none",        l:"DB 없음 — 파일(S3)만 사용",               d:"정적 웹사이트, 파일 저장 서비스처럼 별도 DB가 필요 없는 서비스입니다."},
          ]
        },
        {
          id:"db_ha",
          q:"DB 서버가 갑자기 죽으면 어떻게 할 건가요? (데이터베이스 가용성)",
          help:"DB가 멈추면 전체 서비스가 멈춥니다. '자동으로 복구되게 할지', '수동으로 복구할지'를 결정합니다.",
          skip: Array.isArray(state.data?.primary_db) && state.data.primary_db.length === 1 && state.data.primary_db[0] === "none",
          multi:false,
          opts:[
            ...(!isCritical && !isHighAvail ? [{v:"single_az",l:"단일 서버 — 수동 복구 (개발/비용 절감용)",d:"서버가 하나입니다. 고장 시 수동으로 복구해야 합니다. 개발/테스트 환경이나 비용이 매우 중요한 경우에만 사용하세요."}] : []),
            {v:"multi_az",    l:"자동 전환 — 문제 시 자동 복구 (Aurora 15~40초, RDS 1~2분)",    d:"주 서버가 죽으면 예비 서버가 자동으로 받습니다. 운영 서비스 기본입니다. 추가 비용이 있지만 다운타임을 최소화합니다."},
            {v:"multi_az_read",l:"자동 전환 + 읽기 분산 — 속도와 안정성 모두",d:"자동 복구에 더해, 조회 요청을 별도 서버에서 처리해 DB 부하를 줄입니다. 읽기가 많은 서비스에 적합합니다."},
            ...(state.slo?.region === "active" ? [{v:"global",l:"글로벌 복제 — 다른 나라에도 동시 복제",d:"여러 리전에 동시에 데이터를 복제합니다. 한 리전 전체가 장애나도 다른 리전에서 즉시 서비스합니다."}] : []),
          ]
        },
        {
          id:"cache",
          q:"자주 쓰는 데이터를 빠른 임시 저장소(캐시)에 보관할 건가요?",
          help:"캐시는 DB에 매번 물어보는 대신 자주 쓰는 답을 빠른 메모리에 보관하는 기술입니다. 속도는 10~100배 빨라지고 DB 부하는 줄어듭니다.",
          multi:false,
          opts:[
            {v:"no",   l:"캐시 없음 — DB에서 직접 조회",               d:"데이터 양이 적거나 조회 빈도가 낮은 서비스. 단순하고 관리 포인트가 없습니다."},
            {v:"redis",l:"Redis 캐시 (Valkey/Redis 호환) — 빠른 임시 저장소",               d:"세션 관리, 로그인 상태 유지, 좌석 임시 잠금, 초당 요청 제한 등에 활용합니다. 속도가 매우 빠릅니다. ElastiCache는 Valkey(오픈소스 Redis 포크)를 기본 엔진으로 지원합니다."},
            {v:"redis_serverless",l:"ElastiCache Serverless — 자동 스케일링 캐시",  d:"용량 계획 없이 자동으로 확장/축소됩니다. 트래픽 변동이 큰 서비스에 적합합니다. 노드 관리가 필요 없지만 안정적 트래픽에서는 프로비저닝 방식이 더 저렴합니다."},
            {v:"memorydb",l:"MemoryDB — 내구성 보장 Redis (기본 DB 가능)", d:"ElastiCache Redis와 달리 트랜잭션 로그로 데이터 영구 보존. 캐시가 아닌 주 DB로 사용 가능합니다. ~20% 더 비쌉니다."},
            ...(Array.isArray(state.data?.primary_db) && state.data.primary_db.includes("dynamodb") ? [
              {v:"dax",  l:"DAX — DynamoDB 전용 캐시",                  d:"DynamoDB 앞에 붙이는 캐시입니다. DAX SDK로 엔드포인트만 변경하면 응답 속도를 마이크로초 수준으로 높입니다."},
              {v:"both", l:"Redis + DAX 모두 사용",                    d:"복잡한 캐싱이 필요한 대규모 서비스. 두 가지 캐시를 역할별로 활용합니다."},
            ] : []),
          ]
        },
        {
          id:"storage",
          q:"파일(이미지, 문서 등)을 저장해야 하나요? (복수 선택 가능)",
          help:"DB는 구조화된 데이터를, 파일 저장소는 이미지·영상·문서 같은 '덩어리 파일'을 저장합니다. 서비스에 맞는 저장소를 선택하세요.",
          multi:true, opts:[
            {v:"none",l:"파일 저장 필요 없음"},
            {v:"s3",  l:"S3 — 이미지·문서·백업 저장 (가장 범용)",     d:"거의 모든 서비스에 필요합니다. 이미지, PDF, 엑셀, 로그 파일, 백업 등 모든 파일을 저장합니다. 용량 무제한입니다."},
            {v:"efs", l:"EFS — 여러 서버가 동시에 접근하는 공유 폴더", d:"여러 서버가 같은 파일을 동시에 읽고 써야 할 때 사용합니다. CMS 미디어, ML 학습 데이터 공유 등에 활용합니다."},
            {v:"ebs", l:"EBS — 한 서버에 연결된 고성능 디스크",        d:"한 서버가 전용으로 쓰는 고성능 디스크입니다. DB 파일, 임시 연산 파일 등에 활용합니다."},
          ]
        },
        {
          id:"search",
          q:"고급 검색 기능이 필요한가요?",
          help:"'제목에 이 단어가 포함된 글 찾기' 수준은 DB로 가능합니다. '유사한 단어 검색', '상품 필터+정렬' 등 복잡한 검색은 전문 검색 엔진이 필요합니다.",
          multi:false, opts:[
            {v:"no",        l:"검색 기능 없음 / DB 검색으로 충분",   d:"간단한 키워드 검색은 DB의 기본 기능으로 처리합니다."},
            {v:"db_search", l:"DB 기본 검색으로 처리 (LIKE 쿼리)",   d:"DB에서 포함된 단어를 찾는 정도의 단순 검색입니다. 데이터가 수백만 건이 넘으면 느려질 수 있습니다."},
            {v:"opensearch",l:"OpenSearch — 전문 검색 엔진",          d:"쿠팡의 상품 검색, 구인 사이트의 직무 검색처럼 복잡한 검색이 필요한 서비스에 사용합니다. 로그 분석에도 활용됩니다."},
          ]
        },
      ]);
    }

    // ──────────────────────────────────────────
    case "integration": {
      return localizeAll(lang, p, [
        {
          id:"auth",
          q:"사용자 로그인·인증은 어떻게 처리할 건가요? (복수 선택 가능)",
          help:"인증 방식이 여럿인 경우 모두 선택하세요. 예: 고객(Cognito) + 관리자(SSO), 모바일앱(Cognito) + 파트너사(SAML SSO) 동시 운영. 인증이 전혀 없으면 '없음'만 선택하세요.",
          multi:true, opts:[
            {v:"cognito",  l:"Cognito — AWS 관리형 회원가입·로그인",       d:"이메일/비밀번호, 소셜 로그인(Google·Kakao) 통합. 토큰 발급·갱신을 AWS가 자동 처리합니다."},
            {v:"sso",      l:"SSO / 사내 IdP 연동 (SAML·OIDC)",           d:"회사 구글 계정, Azure AD, Okta 등 기존 사내 계정으로 로그인합니다. B2B·내부 도구에 적합합니다."},
            {v:"selfmgd",  l:"자체 인증 서버 (직접 구현)",                  d:"JWT를 직접 발급·검증하는 인증 서버를 운영합니다. 자유도가 높지만 보안 취약점 관리를 직접 해야 합니다."},
            {v:"none",     l:"인증 없음 — 누구나 접근 가능",               d:"공개 API, 정적 웹사이트처럼 로그인이 필요 없는 서비스입니다."},
          ]
        },
        {
          id:"sync_async",
          q:"서비스 내 여러 기능이 서로 데이터를 주고받는 방식은 어떤가요?",
          help:"동기는 '전화 통화'처럼 즉시 응답을 기다립니다. 비동기는 '카카오톡'처럼 메시지만 남겨두고 상대방이 읽을 때 처리합니다. 비동기를 쓰면 한 기능이 느려도 다른 기능에 영향을 안 줍니다.",
          multi:false, opts:[
            {v:"sync_only",l:"동기만 — 요청하면 즉시 응답 대기",     d:"단순한 서비스나 기능이 하나인 서비스. 'A에 요청 → A가 처리 → 바로 응답'으로 단순합니다."},
            {v:"async",    l:"비동기만 — 작업을 큐에 쌓고 나중에 처리",d:"'주문 접수 → 큐에 저장 → 나중에 재고 차감·이메일 발송'처럼 작업을 나눠 처리합니다. 시스템 장애에 강합니다."},
            {v:"mixed",    l:"혼합 — 즉시 응답이 필요한 건 동기, 후처리는 비동기", d:"결제 확인은 즉시(동기), 이메일 발송은 나중에(비동기). 대부분의 복잡한 서비스가 이 방식입니다."},
          ]
        },
        {
          id:"queue_type",
          q:"비동기 처리에 어떤 방식을 사용할 건가요? (복수 선택 가능)",
          help:"메시지 큐는 일감을 쌓아두는 대기열입니다. 주문이 100개 몰려도 서버가 순서대로 처리할 수 있게 해줍니다.",
          skip: state.integration?.sync_async === "sync_only",
          multi:true,
          opts:[
            {v:"sqs",       l:"SQS — 가장 기본적인 대기열",              d:"'처리할 일을 줄 세우는' 기본 큐입니다. 실패하면 자동으로 재시도하고, 계속 실패하면 별도 보관합니다. 대부분의 서비스 기본 선택입니다."},
            {v:"sns",       l:"SNS — 하나의 이벤트를 여러 곳에 동시 전달", d:"결제 완료 1개 이벤트를 → 이메일 발송, 재고 차감, 포인트 적립에 동시에 전달합니다. '방송'처럼 작동합니다."},
            {v:"eventbridge",l:"EventBridge — 이벤트를 규칙에 따라 자동 분류 전달",d:"'VIP 주문이면 A팀에, 일반 주문이면 B팀에 전달'처럼 조건부 라우팅이 가능합니다. 스케줄 작업(매일 오전 9시 실행)에도 씁니다."},
            {v:"kinesis",l:"Kinesis — 실시간 대용량 스트리밍",d:"초당 수만 건의 로그, 클릭 이벤트, 센서 데이터를 실시간으로 처리합니다. 나중에 다시 처리(리플레이)도 가능합니다."},
            {v:"msk",l:"MSK (Kafka) — 초고처리량, 기존 Kafka 연동",d:"이미 Kafka를 쓰고 있거나 초당 수십만 건 이상을 처리해야 하는 경우입니다. 운영 복잡도가 높습니다."},
            {v:"amazon_mq",l:"Amazon MQ — ActiveMQ/RabbitMQ 관리형",d:"기존 온프레미스 MQ를 그대로 마이그레이션할 때 사용합니다. AMQP/MQTT/STOMP 프로토콜 지원. 신규 프로젝트면 SQS를 권장합니다."},
          ]
        },
        {
          id:"api_type",
          q:"사용자(또는 외부 서비스)가 이 서비스에 접근하는 입구는 무엇인가요?",
          help:"서비스의 '정문'을 결정합니다. 트래픽을 받아서 실제 서버에 전달하는 관문입니다.",
          multi:false, opts:[
            {v:"alb",        l:"ALB — 웹/앱 서비스의 표준 로드밸런서",    d:"웹 서비스와 앱 API의 기본 입구입니다. 들어오는 트래픽을 여러 서버에 분산하고 서버 상태를 확인합니다."},
            {v:"api_gateway",l:"API Gateway — 서버리스 API 전용 관문",   d:"서버리스·컨테이너 API 앞에 붙이는 관문입니다. 요청 수 제한, 인증, 버전 관리를 자동으로 처리합니다."},
            {v:"nlb",        l:"NLB — 고성능 / 게임·IoT 전용",           d:"초저지연이 필요하거나 TCP/UDP 기반 통신(게임, IoT)에 사용합니다. HTTP가 아닌 통신에 적합합니다."},
            {v:"both",       l:"ALB + API Gateway 혼합",                 d:"일부는 컨테이너(ALB), 일부는 서버리스(API Gateway)를 혼합해서 씁니다."},
          ]
        },
        {
          id:"batch_workflow",
          q:"대용량 배치 처리나 복잡한 워크플로가 필요한가요? (복수 선택 가능)",
          help:"일반 API 요청과 달리 '대량 데이터 처리', '여러 단계를 순서대로 실행', '매일 자정에 자동 실행'같은 작업에는 전용 서비스가 필요합니다.",
          multi:true, opts:[
            {v:"none",            l:"없음 — API 요청만 처리",                            d:"배치나 스케줄 작업이 없는 순수 API 서비스입니다."},
            {v:"eventbridge_sch", l:"EventBridge Scheduler — 정기 스케줄 작업",          d:"'매일 오전 9시 리포트 생성', '5분마다 데이터 동기화'같은 정기 작업을 트리거합니다. Lambda·ECS Task·Step Functions 실행 가능. Cron 대체재입니다."},
            {v:"step_functions",  l:"Step Functions — 복잡한 단계별 워크플로",            d:"'주문 접수 → 재고 확인 → 결제 → 배송 시작'처럼 여러 단계를 순서대로, 오류 처리와 함께 실행합니다. 각 단계가 실패해도 자동 재시도·보상 트랜잭션이 가능합니다."},
            {v:"aws_batch",       l:"AWS Batch — 대용량 병렬 배치 처리",                 d:"수천 개의 컨테이너를 병렬로 실행하는 대용량 작업에 사용합니다. 리포트 생성, ML 학습, 유전체 분석 등에 적합합니다. Spot 인스턴스 자동 활용으로 비용 절감."},
            {v:"ecs_scheduled",   l:"ECS Scheduled Task — 컨테이너 기반 정기 배치",     d:"ECS 컨테이너를 정해진 시간에 실행합니다. 기존 컨테이너 코드를 재사용할 수 있습니다. EventBridge Scheduler로 트리거합니다."},
            {v:"glue",            l:"AWS Glue — 서버리스 ETL·데이터 카탈로그",           d:"서버리스 ETL 서비스입니다. Spark 기반 대규모 데이터 변환에 적합합니다. 데이터 카탈로그로 스키마 관리도 포함됩니다."},
          ]
        },
      ]);
    }

    // ──────────────────────────────────────────
    case "edge": {
      const ut = state.workload?.user_type || [];
      const isGlobal = Array.isArray(ut) ? ut.includes("global") : ut === "global";
      const isBtoc = Array.isArray(ut) ? ut.includes("b2c") : ut === "b2c";
      return localizeAll(lang, p, [
        {
          id:"cdn",
          q:"콘텐츠를 사용자 가까운 곳에서 빠르게 전달하는 CDN이 필요한가요?",
          help:"CDN은 이미지·CSS·JS 파일을 전 세계 곳곳에 복사해 두고 사용자에게 가장 가까운 곳에서 전달합니다. 로딩 속도가 빨라지고 서버 부담이 줄어듭니다.",
          multi:false, opts:[
            {v:"yes",   l:"CloudFront 사용 — 정적 파일 빠르게 전달",       d:"이미지, JS, CSS를 캐싱해 서버 트래픽을 최대 80% 줄입니다. B2C 서비스라면 거의 필수입니다."},
            {v:"no",    l:"CDN 없음 — 서버에서 직접 전달",                  d:"내부 직원만 쓰는 서비스이거나, API 응답만 있고 정적 파일이 없는 경우입니다."},
            {v:"global",l:"CloudFront + 지역별 다른 오리진 — 글로벌 서비스", d:"국가마다 다른 서버나 콘텐츠를 제공해야 하는 글로벌 서비스입니다."},
            ...(state.workload?.type && (Array.isArray(state.workload.type) ? (state.workload.type.includes("realtime") || state.workload.type.includes("iot")) : false) ? [{v:"global_accelerator", l:"Global Accelerator — TCP/UDP 고정 IP 가속", d:"Anycast IP로 글로벌 TCP/UDP 트래픽을 최적 경로로 전달합니다. 실시간 게임, IoT, 금융 거래처럼 HTTP가 아닌 TCP/UDP 프로토콜에 최적화되어 있습니다."}] : []),
          ]
        },
        {
          id:"dns",
          q:"도메인(주소)을 어떻게 관리하고 장애 시 어떻게 대응할 건가요?",
          help:"DNS는 '도메인 이름'을 '서버 주소'로 바꿔주는 전화번호부입니다. 장애 시 자동으로 다른 서버로 연결해주도록 설정할 수 있습니다.",
          multi:false,
          opts:[
            {v:"basic",   l:"기본 DNS만 — 도메인을 서버 주소로 연결",       d:"단순합니다. 서버가 죽으면 수동으로 연결을 바꿔야 합니다. 내부 서비스나 중요도가 낮은 서비스에 적합합니다."},
            {v:"health",  l:"자동 장애 전환 — 서버 이상 감지 시 자동 전환", d:"주 서버가 죽으면 자동으로 예비 서버로 연결합니다. 운영 서비스 권장 설정입니다."},
            ...(state.slo?.region !== "single" ? [
              {v:"latency",l:"지역별 최적 서버 — 사용자와 가장 가까운 서버로 자동 연결",d:"미국 사용자는 미국 서버로, 한국 사용자는 서울 서버로 자동 연결합니다. 글로벌 서비스에 적합합니다."},
              {v:"geoloc", l:"국가별 다른 서버 — 국가/지역별 맞춤 서버 연결",d:"국가마다 다른 서비스나 규정 준수가 필요할 때 사용합니다."},
            ] : []),
          ]
        },
        {
          id:"waf",
          q:"악성 트래픽이나 봇으로부터 서비스를 보호하는 방화벽이 필요한가요?",
          help:"WAF(웹 방화벽)는 해킹 시도, 과도한 요청, 봇 트래픽을 차단합니다. 티켓팅처럼 매크로가 많은 서비스는 필수입니다.",
          multi:false,
          opts:[
            {v:"no",    l:"없음 — 사내 서비스나 낮은 위협 환경",           d:"직원만 쓰는 내부 서비스이거나 위협이 거의 없는 환경입니다."},
            {v:"basic", l:"기본 WAF — 주요 해킹 공격 차단 + IP 요청 제한",d:"OWASP Top 10 주요 취약점(SQL 인젝션, XSS 등) 방어, IP별 초당 요청 제한. 대부분의 B2C 서비스에 권장합니다."},
            ...(isBtoc || isGlobal ? [
              {v:"bot",   l:"WAF + 봇 차단 — 매크로·자동화 봇 방어",       d:"티켓팅 매크로, 이커머스 재고 독점 봇을 차단합니다. 선착순 이벤트가 있는 서비스에 필수입니다."},
              {v:"shield",l:"WAF + DDoS 완전 방어 (Shield Advanced)",      d:"대규모 DDoS 공격을 방어합니다. 월 $3,000 고정 비용이 발생합니다. 금융·공공·대형 플랫폼에 적합합니다."},
            ] : []),
          ]
        },
      ]);
    }

    // ──────────────────────────────────────────
    case "cicd": {
      const isEksCicd = state.compute?.orchestration === "eks";
      return localizeAll(lang, p, [
      {
        id:"iac",
        q:"인프라(서버, 네트워크 등)를 어떻게 만들고 관리할 건가요?",
        help:"IaC(Infrastructure as Code)는 서버와 네트워크 설정을 코드로 기록하는 방법입니다. 코드로 관리하면 실수를 줄이고 누구나 같은 환경을 만들 수 있습니다.",
        multi:false, opts:[
          {v:"terraform",   l:"Terraform — 가장 범용적인 인프라 코드 도구",d:"AWS뿐 아니라 다른 클라우드에도 쓸 수 있습니다. 가장 많이 쓰이는 표준 도구로 자료가 많습니다."},
          {v:"cdk",         l:"AWS CDK — TypeScript/Python 코드로 인프라 정의",d:"개발자에게 친숙한 언어로 인프라를 정의합니다. AWS 서비스와 가장 자연스럽게 연동됩니다."},
          {v:"cfn",         l:"CloudFormation — AWS 공식 YAML/JSON 인프라 도구",d:"AWS가 공식 제공합니다. 완전 무료이고 AWS 서비스 지원이 가장 빠릅니다."},
          {v:"none",        l:"콘솔에서 직접 클릭해서 설정",               d:"코드가 없는 가장 단순한 방법입니다. 초기 실험이나 소규모 프로젝트에 적합하지만, 환경 재현이 어렵습니다."},
        ]
      },
      {
        id:"pipeline",
        q:"코드를 작성한 후 실제 서비스에 자동으로 배포하는 파이프라인은 무엇을 사용할 건가요?",
        help:"CI/CD 파이프라인은 '코드를 올리면 자동으로 테스트 → 빌드 → 배포'가 이루어지는 자동화 공장입니다. 수동 배포의 실수와 시간을 줄여줍니다.",
        multi:false, opts:[
          {v:"github",      l:"GitHub Actions — 가장 대중적 (GitHub 사용 시)",d:"GitHub에 코드를 올리면 자동으로 테스트하고 배포합니다. 자료가 가장 많고 무료 할당량도 넉넉합니다."},
          {v:"codepipeline",l:"AWS CodePipeline — AWS 내에서 모두 해결",    d:"AWS가 제공하는 파이프라인입니다. AWS 서비스와 완전히 통합되어 별도 도구 없이 사용 가능합니다."},
          {v:"gitlab",      l:"GitLab CI/CD — GitLab 사용 중이거나 사내 설치 선호",d:"GitLab을 사용 중인 팀에 적합합니다. 사내 서버에 직접 설치해 운영할 수도 있습니다."},
          {v:"none",        l:"수동 배포 — 직접 서버에 올림",               d:"자동화가 없는 초기 단계입니다. 실수가 잦아지고 배포가 두려워집니다. 가능한 빨리 자동화를 권장합니다."},
        ]
      },
      {
        id:"deploy_strategy",
        q:"새 버전을 배포할 때 어떤 방식으로 교체할 건가요?",
        help:"서비스 중단 없이 새 버전으로 교체하는 방법입니다. 안전할수록 복잡하고 비용이 높아집니다.",
        multi:false, opts:[
          {v:"rolling",   l:"순차 교체 — 서버를 하나씩 차례로 업데이트",   d:"가장 단순합니다. 배포 중에도 서비스는 계속됩니다. 중간에 문제가 생기면 일부 사용자는 구버전, 일부는 신버전을 보게 됩니다."},
          {v:"bluegreen", l:"블루/그린 — 새 버전을 준비한 후 트래픽을 한번에 전환", d:"구버전(블루)과 신버전(그린)을 동시에 준비하고, 문제가 없으면 신버전으로 전환합니다. 문제 시 1초 만에 롤백 가능합니다. 배포 중 2배 비용이 발생합니다."},
          {v:"canary",    l:"카나리 — 소수 사용자에게 먼저 배포 후 확인",  d:"전체 사용자의 5%에게만 먼저 배포해 문제가 없으면 점진적으로 확대합니다. 위험은 가장 적지만 복잡합니다."},
        ]
      },
      {
        id:"env_count",
        q:"운영, 개발 외에 몇 개의 환경이 필요한가요?",
        help:"환경이 많을수록 '운영에 올라가기 전 충분한 검증'이 가능하지만 비용도 늘어납니다. 팀 규모와 서비스 중요도에 맞게 선택하세요.",
        multi:false, opts:[
          {v:"dev_prod",l:"개발 + 운영 (2단계)",                        d:"가장 단순합니다. 개발에서 바로 운영으로 배포합니다. 소규모 팀에 적합하지만 검증 기회가 적습니다."},
          {v:"three",   l:"개발 + 스테이징 + 운영 (3단계, 표준)",       d:"스테이징에서 운영과 동일한 환경으로 최종 테스트 후 배포합니다. 대부분의 팀이 따르는 표준 구성입니다."},
          {v:"four",    l:"개발 + 스테이징 + 프리-운영 + 운영 (4단계)", d:"운영 직전 단계를 하나 더 두어 안전성을 높입니다. 규정 준수가 중요하거나 대형 조직에 적합합니다."},
        ]
      },
      {
        id:"monitoring",
        q:"어떤 모니터링/옵저버빌리티 도구를 사용할 건가요? (복수 선택 가능)",
        help:"서비스 장애를 빠르게 감지하고 원인을 파악하려면 모니터링이 필수입니다. CloudWatch는 AWS 기본 제공이고, X-Ray는 분산 추적에 특화되어 있습니다.",
        skip: isEksCicd, // EKS users already answered k8s_monitoring in platform phase
        multi:true, opts:[
          {v:"cloudwatch", l:"CloudWatch (AWS 기본 모니터링)",              d:"AWS가 기본 제공하는 모니터링입니다. 로그·메트릭·알람을 한 곳에서 관리합니다. 추가 비용이 적고 설정이 쉽습니다."},
          {v:"xray",       l:"X-Ray (분산 추적)",                           d:"마이크로서비스 간 요청 흐름을 추적합니다. 어디서 느려지는지, 어디서 에러가 나는지 시각적으로 확인할 수 있습니다."},
          {v:"datadog",    l:"Datadog (통합 APM)",                          d:"로그·메트릭·트레이싱을 하나의 플랫폼에서 관리합니다. 강력하지만 비용이 높습니다. 중대규모 팀에 적합합니다."},
          {v:"grafana",    l:"Amazon Managed Grafana (대시보드)",            d:"다양한 데이터 소스를 시각화하는 대시보드 서비스입니다. CloudWatch·Prometheus 등 여러 소스를 통합합니다."},
        ]
      },
    ]);
    }

    // ──────────────────────────────────────────
    case "cost": return localizeAll(lang, p, [
      {
        id:"priority",
        q:"비용 절감과 성능/안정성 사이에서 어디에 더 가중치를 두나요?",
        help:"클라우드는 비용과 성능이 상충하는 경우가 많습니다. 지금 서비스 단계와 비즈니스 상황에 맞게 솔직하게 선택해 주세요.",
        multi:false, opts:[
          {v:"cost_first", l:"비용 최우선 — 가능한 한 저렴하게",          d:"MVP 단계이거나 아직 수익이 없는 서비스. 필요한 기능만 최소한으로 구성합니다."},
          {v:"balanced",   l:"균형 — 합리적 비용에 충분한 성능",          d:"대부분의 성장 단계 서비스. 불필요한 낭비는 피하되 성능도 포기하지 않습니다."},
          {v:"perf_first", l:"성능/안정성 최우선 — 비용보다 품질",        d:"금융·결제처럼 서비스 중단이 곧 큰 손실로 이어지는 경우입니다."},
        ]
      },
      {
        id:"commitment",
        q:"이 서비스를 몇 년 이상 안정적으로 운영할 계획이 있나요?",
        help:"AWS에 장기 약정(1년 또는 3년)을 하면 같은 서버를 훨씬 저렴하게 쓸 수 있습니다. 서비스가 안정화되면 약정을 통해 비용을 크게 줄일 수 있습니다.",
        multi:false, opts:[
          {v:"none",l:"약정 없음 — 그때그때 사용한 만큼만",              d:"서비스 초기이거나 트래픽이 불규칙합니다. 유연성은 높지만 가장 비쌉니다."},
          {v:"1yr", l:"1년 약정 — 약 30~40% 비용 절감",                d:"어느 정도 안정된 서비스입니다. 결제 방식에 따라 30~40% 절감 가능합니다. 규모가 정해지면 바로 하는 게 유리합니다."},
          {v:"3yr", l:"3년 약정 — 최대 60~72% 비용 절감",              d:"장기 운영이 확실한 서비스입니다. 전액 선불 시 최대 72% 절감(EC2 RI 기준). 처음엔 1년으로 시작 후 전환도 가능합니다."},
        ]
      },
      {
        id:"spot_usage",
        q:"저렴한 대신 가끔 갑자기 꺼질 수 있는 서버(Spot)를 활용할 수 있나요?",
        help:"Spot은 AWS에 남는 서버를 70~90% 저렴하게 빌리는 방식입니다. 단, AWS가 필요하면 2분 예고 후 회수할 수 있습니다(EC2 기준. Fargate Spot은 30초). 갑자기 꺼져도 괜찮은 작업에만 사용해야 합니다.",
        multi:false, opts:[
          {v:"no",     l:"사용 안 함 — 안정성이 더 중요",                d:"결제, 세션, DB처럼 중간에 꺼지면 안 되는 서비스입니다."},
          {v:"partial",l:"일부 사용 — 이메일 발송·이미지 처리 등 후처리 작업에만", d:"메인 서버는 안정적으로, 이메일 발송이나 이미지 변환 같은 보조 작업에만 Spot을 씁니다. 70% 절약 가능합니다."},
          {v:"heavy",  l:"적극 활용 — 배치 처리·빌드 서버 등에 전면 적용", d:"데이터 분석, 빌드, 개발 환경처럼 중간에 재시작해도 괜찮은 작업입니다. 비용을 90%까지 줄일 수 있습니다."},
        ]
      },
    ]);


    // ──────────────────────────────────────────
    // Phase 8: K8s 생태계 (EKS 선택 시만 표시)
    // ──────────────────────────────────────────
    case "platform": {
      const isEks = state.compute?.orchestration === "eks";
      if(!isEks) return [];
      const isLarge  = ["large","xlarge"].includes(state.scale?.dau);
      return localizeAll(lang, p, [
        {
          id:"node_provisioner",
          q:"쿠버네티스 노드(서버)를 어떻게 자동으로 늘리고 줄일 건가요?",
          help:"Pod가 늘어나면 그 Pod를 돌릴 노드(EC2 서버)도 자동으로 추가되어야 합니다. Karpenter는 최신 표준이고 Cluster Autoscaler는 오래된 검증된 방법입니다.",
          multi:false, opts:[
            {v:"karpenter",        l:"Karpenter (AWS 권장, 최신 표준)",               d:"Pod의 실제 요구사항에 맞게 노드를 즉시 프로비저닝합니다. Cluster Autoscaler보다 훨씬 빠르고 비용 효율적입니다. AWS가 직접 만들어 EKS와 최적 통합됩니다."},
            {v:"cluster_autoscaler",l:"Cluster Autoscaler (전통적 방법, 안정적)",     d:"오랫동안 검증된 방법입니다. 느리고 낭비가 있지만 레퍼런스가 많습니다. 기존 운영 중인 클러스터라면 이미 쓰고 있을 수 있습니다."},
          ]
        },
        {
          id:"ingress",
          q:"외부 트래픽을 쿠버네티스 서비스로 라우팅하는 Ingress Controller는 무엇을 사용할 건가요?",
          help:"ALB Controller는 AWS와 가장 잘 통합되고, NGINX는 가장 범용적이며, Kong은 API Gateway 기능까지 포함합니다. 어떤 기능이 우선인지에 따라 선택하세요.",
          multi:false, opts:[
            {v:"alb_controller",   l:"AWS ALB Ingress Controller (AWS 네이티브, 권장)", d:"ALB와 직접 통합됩니다. AWS 서비스(WAF, ACM, Target Group)와 자연스럽게 연결됩니다. EKS 표준 구성입니다."},
            {v:"nginx",            l:"NGINX Ingress Controller (범용, 멀티클라우드)", d:"쿠버네티스 표준에 가장 가깝습니다. AWS 외 다른 클라우드로 이식할 가능성이 있다면 이 쪽이 유리합니다. NLB와 함께 쓰는 패턴이 많습니다."},
            {v:"kong",           l:"Kong (API Gateway + Ingress 통합)",              d:"Ingress + API Gateway 기능(인증, 속도 제한, 플러그인)을 하나로 처리합니다. 마이크로서비스가 많고 API 정책을 중앙에서 관리하고 싶을 때 적합합니다."},
            {v:"traefik",        l:"Traefik (자동 인증서 갱신, 간편 설정)",          d:"설정이 단순하고 cert-manager 없이도 TLS 자동 갱신이 됩니다. 중소 규모 마이크로서비스에 좋습니다."},
            ...(ps?.service_mesh === "istio" ? [{v:"istio_gateway", l:"Istio Gateway (Istio 서비스 메시 내장 인그레스)", d:"Istio의 Gateway + VirtualService CRD로 North-South 트래픽을 처리합니다. Istio를 이미 사용 중이라면 별도 Ingress Controller 없이 통합 관리가 가능합니다."}] : []),
            {v:"gateway_api",    l:"K8s Gateway API (차세대 표준)",                  d:"K8s 공식 차세대 Ingress 표준입니다. Istio 1.22+, NGINX, Envoy 등에서 GA 지원. 기존 Ingress를 대체하는 새 API입니다."},
          ]
        },
        {
          id:"service_mesh",
          q:"서비스 간 통신을 암호화하고 세밀하게 제어하는 서비스 메시가 필요한가요?",
          help:"서비스 메시는 모든 서비스 간 트래픽을 가로채서 mTLS 암호화, 서킷브레이커, 트래픽 미러링 등을 자동으로 처리합니다. 강력하지만 운영 복잡도가 크게 높아집니다.",
          multi:false, opts:[
            {v:"none",             l:"없음 — 서비스 메시 미사용 (대부분 팀에 충분)", d:"서비스 간 보안이 덜 중요하거나 팀이 운영 복잡도를 감당하기 어려운 경우입니다. Security Group으로 기본 격리는 됩니다."},
            {v:"vpc_lattice",      l:"VPC Lattice — AWS 네이티브 서비스 간 통신 (최신, 권장)", d:"VPC 간, 계정 간 서비스 통신을 AWS가 관리합니다. App Mesh보다 단순하고 ECS/EKS/Lambda 모두 지원합니다. App Mesh의 대체재입니다."},
            {v:"istio",          l:"Istio (업계 표준, 가장 강력)",                    d:"가장 많이 쓰이는 서비스 메시입니다. mTLS, 서킷브레이커, 카나리 배포, 트래픽 미러링을 세밀하게 제어합니다. 러닝 커브가 높고 리소스를 많이 씁니다."},
            {v:"aws_app_mesh",     l:"AWS App Mesh (⛔ 2026년 지원 종료 — 신규 도입 비권장)",           d:"Envoy 프록시를 AWS가 관리해줍니다. 2026년 9월 지원 종료 예정으로 신규 도입은 비권장합니다. VPC Lattice 또는 Istio로 마이그레이션을 계획하세요."},
          ]
        },
        {
          id:"gitops",
          q:"배포를 Git에 선언하고 자동 동기화하는 GitOps 방식을 도입할 건가요?",
          help:"GitOps는 '운영 상태를 Git에 코드로 기록하고, 클러스터가 자동으로 Git 상태를 따라가게 하는' 방법입니다. 수동 kubectl 적용 실수를 없애고 감사 기록이 Git 히스토리에 남습니다.",
          multi:false, opts:[
            {v:"none",             l:"없음 — CI/CD에서 kubectl/helm으로 직접 배포",    d:"GitHub Actions나 CodePipeline에서 직접 클러스터에 배포합니다. 단순하지만 수동 조작이 가능해 드리프트가 생길 수 있습니다."},
            {v:"argocd",           l:"ArgoCD (K8s 네이티브 GitOps, 가장 많이 씀)",    d:"UI 대시보드가 있어 배포 상태를 시각적으로 확인할 수 있습니다. 자동 싱크, 수동 승인, 롤백이 쉽습니다. K8s GitOps 표준 도구입니다."},
            {v:"flux",           l:"Flux v2 (경량, CLI 중심, Pull 방식)",             d:"ArgoCD보다 가볍고 GitOps Toolkit 기반입니다. CLI 중심이고 멀티테넌트 환경에 강합니다."},
          ]
        },
        {
          id:"k8s_monitoring",
          q:"쿠버네티스 클러스터와 앱을 어떻게 모니터링할 건가요?",
          help:"CloudWatch Container Insights는 AWS 네이티브라 설정이 간단하고, Prometheus+Grafana는 훨씬 상세한 메트릭과 대시보드를 제공합니다.",
          multi:false, opts:[
            {v:"cloudwatch",       l:"CloudWatch Container Insights (AWS 네이티브, 간단)", d:"추가 설치 없이 바로 사용 가능합니다. EKS 콘솔과 통합됩니다. 비용이 메트릭 수에 따라 올라갈 수 있습니다."},
            {v:"prometheus_grafana",l:"Prometheus + Grafana + Loki (K8s 표준 모니터링 스택)", d:"상세한 메트릭 수집, 커스텀 대시보드, 로그 집계(Loki)까지 모두 처리합니다. 오픈소스라 비용이 낮습니다. 단, 직접 설치하고 관리해야 합니다."},
            ...(isLarge ? [
              {v:"hybrid",         l:"CloudWatch + Prometheus 혼합 (대규모 권장)",     d:"AWS 인프라 알람은 CloudWatch로, 앱 상세 메트릭은 Prometheus로 나눠서 사용합니다. 각 도구의 장점을 취하는 대기업 패턴입니다."},
            ] : []),
          ]
        },
        // ── K8s 보안 / 운영 심화 ──────────────────
        {
          id:"k8s_secrets",
          q:"K8s Secret(비밀값)을 어떻게 안전하게 관리할 건가요?",
          help:"K8s 기본 Secret은 base64 인코딩일 뿐 암호화가 아닙니다. Secrets Manager나 Vault와 연동하면 실제로 암호화된 비밀값을 K8s Pod에 자동으로 주입할 수 있습니다.",
          multi:false, opts:[
            {v:"native",           l:"K8s Secret 기본 — 단순 환경변수 주입",            d:"가장 단순하지만 etcd에 Base64로 저장됩니다. K8s RBAC으로 접근 제한 필수. etcd 암호화 별도 설정 권장. 개발 환경이나 민감도가 낮은 값에 적합합니다."},
            {v:"external_secrets", l:"External Secrets Operator + Secrets Manager (권장)", d:"K8s가 AWS Secrets Manager의 값을 자동으로 가져와 Pod에 주입합니다. 비밀값 로테이션 시 자동 반영됩니다. IRSA로 IAM 권한 부여."},
            {v:"secrets_csi",      l:"Secrets Store CSI Driver (볼륨 마운트 방식)",     d:"비밀값을 환경변수 대신 파일로 마운트합니다. 파일 기반 비밀 소비가 필요한 앱에 적합합니다. Secrets Manager, Parameter Store 모두 지원."},
          ]
        },
        {
          id:"pod_security",
          q:"허용되지 않는 컨테이너 이미지나 위험한 설정을 어떻게 차단할 건가요? (정책 엔진)",
          help:"'루트 권한 컨테이너 금지', 'ECR 외 이미지 차단', '리소스 제한 없는 Pod 거부'같은 정책을 자동으로 강제할 수 있습니다. 보안 규정이 있는 환경에서 필수입니다.",
          multi:false, opts:[
            {v:"psa",              l:"Pod Security Admission (K8s 내장, 간단)",           d:"K8s 1.25+에 내장된 기본 정책 엔진입니다. baseline/restricted 프로필로 일반적인 보안을 빠르게 적용합니다. 커스텀 정책은 불가합니다."},
            {v:"kyverno",          l:"Kyverno (YAML 기반 정책, 진입 장벽 낮음)",          d:"YAML로 정책을 작성합니다. OPA/Rego보다 배우기 쉽습니다. 이미지 서명 검증, 자동 라벨 주입도 가능합니다."},
            {v:"opa_gatekeeper",  l:"OPA Gatekeeper (강력한 커스텀 정책, Rego 언어)",   d:"Rego 언어로 매우 세밀한 정책을 작성합니다. 복잡하지만 가장 강력합니다. 금융·공공처럼 엄격한 규정 준수가 필요할 때 적합합니다."},
          ]
        },
        {
          id:"network_policy",
          q:"K8s Pod 간 네트워크 트래픽을 어떻게 격리할 건가요?",
          help:"기본적으로 K8s 클러스터 내 모든 Pod는 서로 통신할 수 있습니다. NetworkPolicy로 '결제 Pod는 DB Pod하고만 통신 가능'처럼 세밀한 격리가 가능합니다.",
          multi:false, opts:[
            {v:"none",             l:"없음 — Security Group으로만 격리",                  d:"Security Group이 Node 레벨 격리를 제공합니다. Pod 간 세밀한 격리는 없지만 단순합니다."},
            {v:"vpc_cni",          l:"AWS VPC CNI NetworkPolicy (EKS 권장, 추가 설치 불필요)", d:"EKS 1.25+에서 VPC CNI 자체가 NetworkPolicy를 지원합니다. 별도 플러그인 없이 K8s 표준 NetworkPolicy 리소스를 그대로 사용합니다."},
            ...(state.compute?.compute_node !== "fargate" ? [{v:"cilium",          l:"Cilium (eBPF 기반, 고성능 + L7 정책)",              d:"eBPF를 사용해 iptables 없이 고성능 네트워크 정책을 적용합니다. HTTP 경로, gRPC 메서드 레벨까지 정책 설정 가능합니다. (⚠️ EKS Fargate에서는 eBPF 미지원으로 사용 불가)"}] : []),
          ]
        },
        {
          id:"k8s_backup",
          q:"K8s 클러스터 리소스(Deployment, ConfigMap 등)를 백업할 건가요?",
          help:"DB 데이터는 AWS Backup으로 보호되지만, K8s 리소스 자체(Deployment 정의, ConfigMap, PVC 데이터)는 별도 백업이 필요합니다. 클러스터 재생성 시 빠른 복구를 위해서입니다.",
          multi:false, opts:[
            {v:"git_only",         l:"Git만으로 충분 — IaC + GitOps면 재생성 가능",      d:"Terraform + ArgoCD로 관리되면 클러스터를 언제든 코드로 재생성할 수 있습니다. 상태 없는(Stateless) 클러스터에 적합합니다."},
            {v:"velero",           l:"Velero (K8s 표준 백업 도구)",                       d:"K8s 리소스와 PVC 볼륨을 S3에 백업합니다. 다른 클러스터로 마이그레이션할 때도 사용합니다. 재해복구 시나리오에 필수입니다."},
          ]
        },
        {
          id:"autoscaling_strategy",
          q:"Pod 수(HPA)와 리소스 요청량(VPA)을 어떻게 자동 조정할 건가요?",
          help:"HPA는 Pod를 수평으로 늘리고, VPA는 각 Pod에 할당된 CPU/메모리를 자동 조정합니다. 둘을 잘못 조합하면 서로 충돌합니다.",
          multi:false, opts:[
            {v:"hpa_only",         l:"HPA만 — Pod 수만 자동 조절 (가장 일반적)",         d:"CPU/메모리 기준으로 Pod를 자동으로 늘리고 줄입니다. 가장 단순하고 예측 가능합니다. 대부분 서비스에 충분합니다."},
            {v:"hpa_keda",         l:"HPA + KEDA — SQS 메시지 수 기준 정밀 확장",        d:"SQS 큐 길이, Kinesis Shard 사용률 등 커스텀 메트릭으로 Pod를 확장합니다. 배치 처리·이벤트 기반 워크로드에 최적입니다."},
            {v:"hpa_vpa",         l:"HPA + VPA — 수평 확장 + 리소스 자동 최적화",       d:"HPA로 Pod 수를 늘리면서 VPA로 각 Pod의 CPU/메모리 요청값을 최적화합니다. VPA는 HPA와 함께 쓸 때 CPU 기반 HPA와 충돌 주의. Requests만 조정하는 VPA 설정 필요."},
          ]
        },
        {
          id:"cluster_strategy",
          q:"클러스터를 어떻게 구성할 건가요?",
          help:"단일 클러스터에 네임스페이스로 환경을 나누면 비용이 절감되지만 격리가 약합니다. 클러스터를 나누면 완전히 격리되지만 비용이 늘어납니다.",
          multi:false, opts:[
            {v:"single_ns",        l:"단일 클러스터 + 네임스페이스 분리 (비용 효율)",     d:"dev/staging/prod를 같은 클러스터의 다른 네임스페이스로 나눕니다. 비용이 적지만 한 네임스페이스 문제가 다른 네임스페이스에 영향을 줄 수 있습니다."},
            {v:"multi_cluster",    l:"클러스터 분리 — prod는 별도 클러스터 (보안 강화)", d:"운영 클러스터는 완전히 독립된 클러스터로 분리합니다. 개발자가 실수로 운영에 접근하는 사고를 원천 차단합니다. 비용은 클러스터당 $73/월 추가."},
          ]
        },
      ]);
    }

    // ──────────────────────────────────────────
    // Phase 9: 애플리케이션 스택 (VM 제외)
    // ──────────────────────────────────────────
    case "appstack": {
      const isServerless = state.compute?.arch_pattern === "serverless";
      const isEks        = state.compute?.orchestration === "eks";
      const isLarge      = ["large","xlarge"].includes(state.scale?.dau);
      return localizeAll(lang, p, [
        {
          id:"api_gateway_impl",
          q:"API 게이트웨이를 어디서, 어떻게 구현할 건가요?",
          help:"AWS API Gateway는 인프라 레벨에서 처리하고, Spring Cloud Gateway나 Kong은 애플리케이션 레벨에서 처리합니다. 둘은 역할이 달라 공존하기도 합니다.",
          multi:false, opts:[
            {v:"aws_apigw",        l:"AWS API Gateway만 사용 (서버리스·소규모 표준)", d:"인증, 속도제한, CORS를 AWS가 처리합니다. Lambda와 가장 자연스럽게 연결됩니다. ECS에서도 사용 가능하나 비용이 올라갈 수 있습니다."},
            {v:"alb_only",         l:"ALB만 사용 (컨테이너 단순 구성)",                d:"API Gateway 없이 ALB가 바로 컨테이너로 트래픽을 전달합니다. 가장 단순하고 저렴합니다. 인증·속도제한은 앱에서 직접 처리합니다."},
            ...(!isServerless && state.team?.language === "spring_boot" ? [
              {v:"spring_gateway",  l:"Spring Cloud Gateway (Spring Boot 팀 표준)",     d:"Spring Boot 팀이라면 자연스러운 선택입니다. ECS/EKS에 Gateway 서비스를 별도 배포합니다. 라우팅, 필터, 로드밸런싱을 코드로 관리합니다."},
            ] : []),
            ...(!isServerless ? [
              {v:"kong",            l:"Kong Gateway (강력한 플러그인 생태계)",            d:"인증, 속도제한, 로깅, 변환을 100개 이상의 플러그인으로 처리합니다. DB(PostgreSQL)가 필요합니다. MSA가 많은 대규모 팀에 적합합니다."},
              {v:"nginx",           l:"NGINX / Envoy (고성능 프록시, 사이드카)",          d:"Istio와 함께 Envoy를 사이드카로 쓰거나, NGINX를 Ingress로 씁니다. 가장 낮은 레이턴시를 자랑합니다."},
            ] : []),
          ]
        },
        {
          id:"protocol",
          q:"서비스 간, 또는 클라이언트-서버 간 통신 프로토콜은 무엇을 사용할 건가요?",
          help:"REST는 범용적이고, gRPC는 빠르고 타입 안전하며, GraphQL은 클라이언트가 필요한 데이터만 요청합니다. 각각 인프라 설정이 달라집니다.",
          multi:false, opts:[
            {v:"rest",             l:"REST / HTTP+JSON (범용 표준)",                    d:"가장 범용적입니다. 브라우저·모바일·서드파티 연동이 쉽습니다. ALB 표준 설정으로 동작합니다."},
            {v:"grpc",             l:"gRPC (고성능 바이너리, MSA 서비스 간 통신)",      d:"Protobuf 직렬화로 REST 대비 수 배 빠릅니다(대용량 페이로드에서 차이 극대화). 타입 안전한 스키마로 계약을 강제합니다. HTTP/2 필수 → ALB HTTP/2 리스너 설정 필요. 브라우저에서 직접 호출은 gRPC-Web 필요합니다."},
            {v:"graphql",          l:"GraphQL (클라이언트 주도 쿼리, BFF 패턴)",       d:"클라이언트가 필요한 필드만 요청합니다. 모바일 앱처럼 네트워크가 제한된 환경에 유리합니다. AppSync(AWS 관리형) 또는 Apollo Server(자체 운영) 선택이 필요합니다."},
            ...(!isServerless ? [
              {v:"mixed",          l:"혼합 (외부는 REST, 내부 MSA 간은 gRPC)",         d:"외부 공개 API는 REST로, 내부 마이크로서비스 간 통신은 gRPC로 나눠 쓰는 대기업 패턴입니다."},
            ] : []),
          ]
        },
        {
          id:"service_discovery",
          q:"여러 마이크로서비스가 서로를 어떻게 찾을 건가요? (서비스 디스커버리)",
          help:"마이크로서비스 환경에서는 각 서비스의 IP가 계속 바뀝니다. 자동으로 최신 주소를 찾아주는 서비스 디스커버리가 필요합니다.",
          skip: !["medium","large","xlarge"].includes(state.scale?.dau) && !isEks,
          multi:false, opts:[
            ...(isEks ? [{v:"k8s_dns",          l:"K8s 내장 DNS (EKS 사용 시 자동 제공)",           d:"K8s가 자동으로 서비스 이름 기반 DNS를 제공합니다. EKS를 쓴다면 별도 설정 없이 사용할 수 있습니다."}] : []),
            {v:"cloud_map",        l:"AWS Cloud Map (ECS·Lambda·EC2 통합 디스커버리)", d:"ECS 서비스를 이름으로 찾아줍니다. ALB와 통합되고 멀티 환경(ECS+Lambda+EC2)을 하나로 관리합니다."},
            ...(!isServerless && state.team?.language === "spring_boot" ? [
              {v:"eureka",         l:"Spring Cloud Eureka (Spring Boot 팀 전통 방식)", d:"Spring Boot 생태계 표준입니다. 별도 Eureka 서버를 ECS/EKS에 배포해야 합니다. Cloud Map이 있으면 불필요할 수 있습니다."},
            ] : []),
          ]
        },
        {
          id:"api_versioning",
          q:"API 버전을 어떻게 관리할 건가요?",
          help:"API가 변경되면 기존 클라이언트(앱, 파트너사)가 깨집니다. 버전 관리 전략에 따라 API Gateway 라우팅 설정이 달라집니다.",
          skip: !(["large","xlarge"].includes(state.scale?.dau) || (Array.isArray(state.workload?.user_type) ? state.workload.user_type.includes("b2b") : state.workload?.user_type === "b2b")),
          multi:false, opts:[
            {v:"url_path",         l:"URL 경로 버전 (/v1/, /v2/) — 가장 단순 명확",     d:"/api/v1/users, /api/v2/users처럼 경로에 버전을 포함합니다. ALB 리스너 규칙으로 버전별 라우팅이 쉽습니다. 가장 많이 쓰이는 방법입니다."},
            {v:"header",           l:"헤더 버전 (Accept: v=2) — URL 깔끔함 유지",       d:"Accept-Version 헤더로 버전을 지정합니다. URL이 바뀌지 않아 깔끔하지만 API Gateway 라우팅이 복잡해집니다."},
            {v:"subdomain",        l:"서브도메인 버전 (v2.api.example.com)",             d:"각 버전을 다른 서브도메인으로 분리합니다. Route 53 + ALB 설정이 버전별로 필요합니다. 완전히 독립적인 배포가 가능합니다."},
          ]
        },
        {
          id:"schema_registry",
          q:"Kafka(MSK)나 Kinesis로 주고받는 메시지의 스키마(형식)를 어떻게 관리할 건가요?",
          help:"메시지 형식이 바뀌면 구 버전 소비자가 깨집니다. Schema Registry는 스키마 버전을 저장하고 호환성을 강제합니다.",
          skip: !Array.isArray(state.integration?.queue_type) ? !(["msk","kinesis"].includes(state.integration?.queue_type)) : !["msk","kinesis"].some(v => (state.integration?.queue_type||[]).includes(v)),
          multi:false, opts:[
            {v:"none",             l:"없음 — JSON 자유 형식 (단순한 경우)",              d:"스키마 관리 없이 JSON을 자유롭게 씁니다. 팀이 작거나 생산자/소비자가 단순할 때 적합합니다. 규모가 커지면 메시지 형식 불일치 장애가 발생합니다."},
            {v:"glue_registry",    l:"AWS Glue Schema Registry (AWS 관리형, MSK/Kinesis 네이티브)", d:"AWS가 제공하는 스키마 레지스트리입니다. MSK, Kinesis와 직접 통합됩니다. Avro, JSON Schema, Protobuf 지원. IAM으로 접근 제어."},
            {v:"confluent_registry",l:"Confluent Schema Registry (Kafka 생태계 표준)",   d:"Kafka 생태계의 사실상 표준입니다. MSK와 함께 자체 운영하거나 Confluent Cloud를 사용합니다. 더 풍부한 호환성 정책(Backward, Forward, Full)을 제공합니다."},
          ]
        },
      ]);
    }

    default: return [];
  }
}
