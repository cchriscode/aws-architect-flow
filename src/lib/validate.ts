/* eslint-disable @typescript-eslint/no-explicit-any */
import type { WizardState, ValidationIssue } from "@/lib/types";

export function validateState(state: WizardState): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const E = (title: string, message: string, phases: string[]) => issues.push({severity:"error",title,message,phases});
  const W = (title: string, message: string, phases: string[]) => issues.push({severity:"warn",title,message,phases});

  const types     = state.workload?.type || [];
  const avail     = state.slo?.availability;
  const az        = state.network?.az_count;
  const azNum     = az === "3az" ? 3 : az === "1az" ? 1 : 2;
  const subnet    = state.network?.subnet_tier;
  const netIso    = state.compliance?.network_iso;
  const cert      = state.compliance?.cert || [];
  const encr      = state.compliance?.encryption;
  const db        = state.data?.primary_db || [];
  const dbArr     = Array.isArray(db) ? db : [];
  const dbHa      = state.data?.db_ha;
  const cache     = state.data?.cache;
  const rpo       = state.slo?.rpo;
  const rto       = state.slo?.rto;
  const region    = state.slo?.region;
  const dau       = state.scale?.dau;
  const rps       = state.scale?.peak_rps;
  const pattern   = state.scale?.traffic_pattern || [];
  const orchest   = state.compute?.orchestration;
  const archP     = state.compute?.arch_pattern;
  const scaling   = state.compute?.scaling;
  const nodeType  = state.compute?.compute_node;
  const exp       = state.team?.cloud_exp;
  const teamSize  = state.team?.team_size;
  const opsModel  = state.team?.ops_model;
  const iac       = state.cicd?.iac;
  const deploy    = state.cicd?.deploy_strategy;
  const envCnt    = state.cicd?.env_count;
  const waf       = state.edge?.waf;
  const cdn       = state.edge?.cdn;
  const dns       = state.edge?.dns;
  const syncMode  = state.integration?.sync_async;
  const queueT    = state.integration?.queue_type;
  const apiType   = state.integration?.api_type;
  const stage     = state.workload?.growth_stage;
  const biz       = state.workload?.business_model;
  const dataS     = state.workload?.data_sensitivity;
  const spot      = state.cost?.spot_usage;
  const commit    = state.cost?.commitment;
  const priority  = state.cost?.priority;
  const tickD     = state.workload?.ticketing_detail;
  const natStrat  = state.network?.nat_strategy;
  const nodeP     = state.platform?.node_provisioner;
  const account   = state.network?.account_structure;
  const storArr   = Array.isArray(state.data?.storage) ? state.data.storage : [];
  const userTypes = state.workload?.user_type || [];
  const meshType  = state.platform?.service_mesh;
  const monitor   = state.platform?.k8s_monitoring;
  const gitops    = state.platform?.gitops;
  const authArr   = Array.isArray(state.integration?.auth) ? state.integration.auth : [];

  const hasCritCert = cert.includes("pci") || cert.includes("hipaa") || cert.includes("sox");
  const isGdpr      = cert.includes("gdpr");
  const isTx        = biz === "transaction" || types.includes("ecommerce") || types.includes("ticketing");
  const isLarge     = dau === "large" || dau === "xlarge";
  const isEks       = orchest === "eks";
  const isServerless= archP === "serverless";
  const hasRdbms    = dbArr.some((d: string) => ["aurora_mysql","aurora_pg","rds_mysql","rds_pg"].includes(d));
  const hasRedis    = cache === "redis" || cache === "both";

  // -- 가용성 & AZ --
  if (avail === "99.99" && az === "1az")
    E("99.99% 가용성 + 단일 AZ 불가능","단일 AZ는 AZ 장애 시 전체 중단. 99.99% 달성엔 최소 3 AZ 필수.",["slo","network"]);
  if ((avail === "99.95" || avail === "99.99") && az === "1az")
    E("고가용성 목표와 단일 AZ 불일치","99.95%+ 가용성은 Multi-AZ 없이 달성 불가.",["slo","network"]);
  if ((avail === "99.95" || avail === "99.99") && dbHa === "single_az")
    E("고가용성 목표와 단일 AZ DB","DB Single-AZ는 수십 분 다운타임 발생. Multi-AZ 필수.",["slo","data"]);
  if (avail === "99.99" && az === "2az")
    W("99.99% 가용성 + 2 AZ 구성","2 AZ에서 1개 장애 시 용량 50% 손실. 99.99% 달성에는 3 AZ를 강력 권장합니다.",["slo","network"]);

  // -- RPO / RTO --
  if (rpo === "zero" && dbHa === "single_az")
    E("RPO Zero + Single-AZ DB 불가능","데이터 손실 0은 동기 복제 필수. Multi-AZ Read 이상으로 변경.",["slo","data"]);
  if (rto === "lt1min" && region === "single")
    W("1분 RTO + 단일 리전 달성 어려움","리전 전체 장애 시 1분 RTO는 단일 리전으로 달성 불가. DR 리전 검토.",["slo","network"]);
  if (rto === "lt1min" && region === "dr")
    W("1분 RTO + Pilot Light/DR 불일치","Pilot Light/DR은 인프라 확장에 수십 분~1시간 필요. 1분 RTO는 Active-Active만 가능.",["slo","network"]);
  if (rpo === "zero" && syncMode === "sync_only" && isTx)
    W("RPO Zero인데 동기 처리만?","비동기 큐 없는 동기 처리는 일부 요청 유실 가능. 트랜잭션 아웃박스 패턴 검토.",["slo","integration"]);

  // -- 규정 준수 --
  if (hasCritCert && encr !== "strict")
    E("PCI/HIPAA/SOX + 기본 암호화 불일치","CMK 암호화 + 키 감사가 심사 필수 항목.",["compliance"]);
  if (hasCritCert && !["strict","private"].includes(netIso))
    E("규정 준수 인증 + 기본 네트워크 격리","PCI/HIPAA는 DB·앱 완전 격리 없이 인증 통과 불가.",["compliance","network"]);
  if (hasCritCert && !["3tier","private"].includes(subnet))
    W("규정 준수 인증 + 2계층 네트워크","PCI DSS는 CDE 격리 필요. 3계층 서브넷 권장.",["compliance","network"]);
  if (hasCritCert && (!iac || iac === "none"))
    E("규정 준수 인증 + IaC 없음","PCI/HIPAA/SOX 감사는 인프라 변경 이력 요구. Terraform/CDK 필수.",["compliance","cicd"]);
  if (isGdpr && region === "single" && !userTypes.includes("global"))
    W("GDPR + 한국 단일 리전","EU 사용자 데이터를 한국 리전에만 저장하면 GDPR 데이터 거주지 요건 위반 가능.",["compliance","slo"]);
  if (isGdpr && region === "single" && userTypes.includes("global"))
    E("GDPR + 글로벌 사용자 + 단일 리전","EU 사용자 데이터를 한국 단일 리전에 저장하면 GDPR 데이터 거주지 요건 위반. 멀티 리전(EU 리전 포함) 전환 필수.",["compliance","slo"]);
  if (hasCritCert && dbArr.includes("dynamodb") && encr !== "strict")
    W("PCI DSS + DynamoDB 기본 암호화","DynamoDB CMK(고객 관리 키) 암호화가 PCI DSS 심사 항목. CMK 설정 권장.",["compliance","data"]);

  // -- 티켓팅 / 결제 --
  if (types.includes("ticketing") && (tickD === "flash" || tickD === "concert") && !dbArr.includes("dynamodb") && !hasRedis)
    E("선착순 티켓팅에 Redis/DynamoDB 없음","초당 수만 건 동시 선점 요청을 RDB만으로 처리하면 데드락+DB 붕괴 발생.",["workload","data"]);
  if (isTx && syncMode === "sync_only")
    W("결제/이커머스 서비스에 동기 처리만","주문→결제→재고 체인을 동기로 연결하면 하나가 느려지면 전체가 느려짐.",["integration"]);
  if (isTx && deploy === "rolling")
    W("결제 서비스에 Rolling 배포","이전/신버전 공존 구간에서 결제 오류 위험. Blue/Green 권장.",["cicd"]);

  // -- 컴퓨팅 --
  if (isEks && exp === "beginner")
    E("EKS + 초급 팀 위험 조합","EKS는 K8s 운영 고급 지식 필요. 초급 팀은 ECS Fargate로 시작 권장.",["compute","team"]);
  if (isEks && opsModel === "managed")
    W("EKS + 완전 관리형 운영 불일치","EKS는 K8s 운영 지식 필수. 완전 관리형이면 ECS Fargate가 더 적합.",["compute","team"]);
  if (isEks && meshType === "istio" && exp === "beginner")
    W("Istio + 초급 팀 위험","Istio는 고급 서비스 메시 지식 필요. 초급 팀은 AWS App Mesh 또는 없이 시작 권장.",["platform","team"]);
  if (isEks && meshType === "istio" && teamSize === "solo")
    W("Istio + 1인 팀 부담","Istio 운영은 전담 플랫폼 엔지니어링 팀이 필요. 1인 팀에게는 큰 운영 부담.",["platform","team"]);
  if (nodeP === "karpenter" && orchest && !isEks)
    E("Karpenter는 Kubernetes 전용","Karpenter는 Kubernetes 전용. ECS에서는 ECS Auto Scaling 사용.",["platform","compute"]);
  if (isServerless && isEks)
    W("서버리스 + EKS 설정 충돌","서버리스 아키텍처에서 EKS는 오버엔지니어링. Lambda + API Gateway 유지 권장.",["compute","platform"]);
  if (rps === "ultra" && isServerless && (!scaling || (Array.isArray(scaling) && scaling.length === 0)))
    W("초고RPS + Lambda 콜드스타트 위험","Lambda Provisioned Concurrency 없이 초고 RPS는 콜드스타트로 p99 급등.",["compute","slo"]);
  if (rps === "ultra" && isServerless && hasRdbms && syncMode === "sync_only")
    E("Lambda + 초고RPS + 동기 DB 복합 위험","콜드스타트 + 동기 RDS 연결 = p99 지연 폭발. 비동기 처리 또는 DynamoDB 전환 필수.",["compute","data","integration"]);

  // -- Spot --
  if (spot === "heavy" && (types.includes("ticketing") || types.includes("realtime") || isTx))
    E("Spot + 결제/실시간 서비스 위험","Spot은 2분 예고 후 강제 종료. 결제·채팅 유실 위험.",["cost","workload"]);

  // -- 비용 --
  if (commit === "3yr" && stage === "mvp")
    W("3년 약정 + MVP 단계 위험","방향 전환 가능성 높은 MVP에 3년 약정은 비용 낭비 위험. 1년 또는 On-Demand 권장.",["cost","workload"]);
  if (waf === "shield" && (dau === "small" || dau === "medium") && !hasCritCert)
    W("Shield Advanced + 소규모 서비스 과투자","$3,000/월 고정. 소규모 서비스는 WAF Basic으로 충분.",["edge","cost"]);
  if (nodeType === "fargate" && dau === "xlarge")
    E("Fargate + DAU 100만+ 비용 초과","DAU 100만+ Fargate는 EC2+RI 대비 2배 이상 비용 초과 가능. EC2 노드 + RI/Savings Plans 전환 필수.",["compute","cost"]);
  else if (nodeType === "fargate" && isLarge)
    W("Fargate + 대규모 서비스 비용 비효율","DAU 10만+ 에서 Fargate는 EC2 On-Demand 대비 20~30% 비쌈. EC2+RI 검토.",["compute","cost"]);

  // -- WAF / 엣지 --
  const isInternalOnly = types.includes("internal") || (Array.isArray(userTypes) && userTypes.length === 1 && userTypes[0] === "internal");
  if (!isInternalOnly && (!waf || waf === "no") && types.length > 0)
    W("외부 공개 서비스에 WAF 없음","SQL 인젝션·XSS·Bot 공격 무방비. 기본 WAF라도 적용 권장.",["edge"]);
  if ((types.includes("ecommerce") || types.includes("ticketing")) && waf !== "bot" && waf !== "shield")
    W("이커머스/티켓팅에 Bot Control 없음","이벤트 당일 봇이 트래픽의 70~90%. Bot Control 없이 공정한 선착순 불가.",["edge"]);
  if (userTypes.includes("global") && cdn === "no")
    E("글로벌 서비스에 CDN 없음","해외 사용자는 서울 리전 직접 연결로 150~300ms 지연. CloudFront 필수.",["edge","workload"]);
  if (state.appstack?.protocol === "graphql" && orchest === "ecs")
    W("GraphQL + ALB HTTP 라우팅 주의","GraphQL은 단일 엔드포인트(/graphql). ALB 경로 기반 라우팅 규칙 별도 설정 필요.",["integration","compute"]);

  // -- 데이터 / 캐시 --
  if (isLarge && (!cache || cache === "no") && !dbArr.includes("dynamodb"))
    W("대규모 서비스에 캐시 없음","DAU 10만+ 에서 DB 직접 조회만 사용하면 DB가 병목. ElastiCache 도입 권장.",["scale","data"]);
  if (storArr.includes("s3") && dataS === "critical" && encr !== "strict")
    W("S3 민감 데이터 + 기본 암호화","중요 데이터는 CMK 암호화 + 버킷 정책 + 퍼블릭 차단 모두 필요.",["data","compliance"]);

  // -- 네트워크 --
  if (dau === "xlarge" && account === "single")
    E("DAU 100만+ + 단일 계정 위험","서비스 할당량 한도 + 환경 격리 불가. AWS Organizations 멀티 계정 분리 필수.",["scale","network"]);
  else if (isLarge && account === "single")
    W("대규모 서비스 + 단일 계정","DAU 10만+ 서비스에서 Prod/Dev 같은 계정은 개발 실수가 Prod에 직접 영향.",["scale","network"]);
  if ((avail === "99.95" || avail === "99.99") && (!iac || iac === "none"))
    W("고가용성 목표 + IaC 없음","99.95%+ 목표에서 수동 콘솔 관리는 재현성·DR 복구에 치명적. IaC 필수.",["slo","cicd"]);

  // -- CI/CD --
  if (isLarge && (!iac || iac === "none"))
    E("대규모 서비스에 IaC 없음","수동 콘솔 관리는 재현성·감사·DR 복구에 치명적. Terraform 또는 CDK 필수.",["cicd"]);
  if ((avail === "99.95" || avail === "99.99") && region !== "single" && envCnt === "dev_prod")
    W("멀티 리전 + dev/prod만 환경 부족","멀티 리전 DR 배포 검증을 위한 Stage 환경이 없으면 복구 절차 미검증.",["slo","cicd"]);
  if (gitops === "argocd" && orchest && !isEks)
    W("ArgoCD + EKS 아님","ArgoCD는 Kubernetes 전용. ECS 환경은 CodeDeploy 또는 GitHub Actions 사용.",["platform","compute"]);

  // -- IoT --
  const queueArr = Array.isArray(queueT) ? queueT : (queueT ? [queueT] : []);
  if (types.includes("iot") && rps === "ultra" && queueArr.includes("sqs"))
    W("초고속 IoT + SQS 비효율","초당 수만 IoT 메시지에 SQS는 처리량·비용 한계. Kinesis Data Streams 검토.",["integration"]);

  // -- Lambda + VPC --
  if (isServerless && subnet && subnet !== "private" && natStrat !== "endpoint")
    W("Lambda VPC 배치 + VPC Endpoint 미활용","VPC 내 Lambda는 NAT GW 경유 시 데이터 전송 비용 발생. VPC Endpoint 활용으로 NAT 비용 절감 권장.",["compute","network"]);
  if (isServerless && hasRdbms && !dbArr.some((d: string) => d.startsWith("aurora")))
    W("Lambda + 표준 RDS 조합","Lambda 동시 실행 시 RDS 커넥션 폭발. RDS Proxy 필수이며, Aurora Serverless v2가 더 적합.",["compute","data"]);

  // -- Fargate + 약정 --
  if (commit === "3yr" && nodeType === "fargate")
    W("Fargate + 3년 약정 주의","Fargate는 EC2 RI 적용 불가. Compute Savings Plans만 사용 가능(Fargate 최대 ~52% 절감). EC2 RI 72%보다 낮음.",["cost","compute"]);

  // -- Aurora Serverless v2 + Global DB --
  if (dbHa === "global" && hasRdbms && !dbArr.some((d: string) => d.startsWith("aurora")))
    W("Global Database는 Aurora 전용","RDS 표준은 Global Database 미지원. 크로스 리전 복제가 필요하면 Aurora로 전환 필요.",["data","slo"]);

  // -- 서버리스 + 대용량 데이터 --
  if (isServerless && state.scale?.data_volume === "ptb")
    W("서버리스 + 수십 TB 데이터 처리 주의","Lambda 15분 타임아웃 제한으로 대용량 배치 처리 불가. AWS Batch 또는 ECS Task 병행 필요.",["compute","scale"]);

  // -- MSA 구성인데 서비스 디스커버리 없음 --
  if (!isServerless && !isEks && isLarge && syncMode !== "sync_only" && !apiType)
    W("대규모 비동기 MSA에 서비스 디스커버리 미설정","ECS Service Connect 또는 Cloud Map으로 서비스 간 통신 관리 권장.",["integration","compute"]);

  // -- 실시간 서비스 + 동기 전용 --
  if (types.includes("realtime") && syncMode === "sync_only")
    W("실시간 서비스에 동기 처리만","채팅·알림 등 실시간 이벤트를 동기로만 처리하면 병목 발생. SNS/EventBridge 비동기 전파 검토.",["integration","workload"]);

  // -- 글로벌 서비스 + 단일 리전 + CDN 없음 --
  if ((state.workload?.user_type || []).includes("global") && region === "single" && (!cdn || cdn === "no"))
    E("글로벌 사용자 + 단일 리전 + CDN 없음","해외 사용자는 서울 직접 연결로 150~300ms 지연. CloudFront 필수이며 멀티 리전 검토 권장.",["edge","slo"]);

  return issues;
}
