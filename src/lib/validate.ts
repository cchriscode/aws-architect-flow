/* eslint-disable @typescript-eslint/no-explicit-any */
import type { WizardState, ValidationIssue } from "@/lib/types";
import { toArray, azToNum } from "@/lib/shared";

export function validateState(state: WizardState, lang: "ko" | "en" = "ko"): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const E = (title: string, message: string, phases: string[]) => issues.push({severity:"error",title,message,phases});
  const W = (title: string, message: string, phases: string[]) => issues.push({severity:"warn",title,message,phases});

  const _ = lang === "ko" ? {
    availAz:            { t: "99.99% 가용성 + 단일 AZ 불가능", m: "단일 AZ는 AZ 장애 시 전체 중단. 99.99% 달성엔 최소 2 AZ 필수 (3 AZ 권장)." },
    highAvailAz:        { t: "고가용성 목표와 단일 AZ 불일치", m: "99.95%+ 가용성은 Multi-AZ 없이 달성 불가." },
    highAvailDb:        { t: "고가용성 목표와 단일 AZ DB", m: "DB Single-AZ는 수십 분 다운타임 발생. Multi-AZ 필수." },
    avail99_2az:        { t: "99.99% 가용성 + 2 AZ 구성", m: "2 AZ에서 1개 장애 시 용량 50% 손실. 99.99% 달성에는 3 AZ를 강력 권장합니다." },
    rpoZeroSingleAz:   { t: "RPO Zero + Single-AZ DB 불가능", m: "데이터 손실 0은 동기 복제 필수. Multi-AZ Read 이상으로 변경." },
    rto1minSingleRegion:{ t: "1분 RTO + 단일 리전 달성 어려움", m: "리전 전체 장애 시 1분 RTO는 단일 리전으로 달성 불가. DR 리전 검토." },
    rto1minDr:          { t: "1분 RTO + Pilot Light/DR 불일치", m: "Pilot Light/DR은 인프라 확장에 수십 분~1시간 필요. 1분 RTO는 Active-Active만 가능." },
    rpoZeroSyncOnly:    { t: "RPO Zero인데 동기 처리만?", m: "비동기 큐 없는 동기 처리는 일부 요청 유실 가능. 트랜잭션 아웃박스 패턴 검토." },
    critCertEncr:       { t: "PCI/HIPAA/SOX + 기본 암호화 불일치", m: "CMK 암호화 + 키 감사가 심사 필수 항목." },
    critCertNetIso:     { t: "규정 준수 인증 + 기본 네트워크 격리", m: "PCI/HIPAA는 DB·앱 완전 격리 없이 인증 통과 불가." },
    critCertSubnet:     { t: "규정 준수 인증 + 2계층 네트워크", m: "PCI DSS는 CDE 격리 필요. 3계층 서브넷 권장." },
    critCertIac:        { t: "규정 준수 인증 + IaC 없음", m: "PCI/HIPAA/SOX 감사는 인프라 변경 이력 요구. Terraform/CDK 필수." },
    gdprSingleRegion:   { t: "GDPR + 비EU 단일 리전", m: "EU 사용자 데이터를 비EU 리전에만 저장 시 SCC(표준 계약 조항) 등 적절한 전송 메커니즘이 필요합니다. EU 리전 포함이 가장 간단한 규정 준수 경로." },
    gdprGlobalSingle:   { t: "GDPR + 글로벌 사용자 + 단일 리전", m: "글로벌 사용자에게 단일 비EU 리전은 지연시간 문제와 GDPR 전송 규정 대응이 필요합니다. EU 리전 포함 멀티 리전 권장 (SCC로 비EU 리전도 가능하나 복잡)." },
    pciDynamo:          { t: "PCI DSS + DynamoDB 기본 암호화", m: "DynamoDB CMK(고객 관리 키) 암호화가 PCI DSS 심사 항목. CMK 설정 권장." },
    ticketNoRedis:      { t: "선착순 티켓팅에 Redis/DynamoDB 없음", m: "초당 수만 건 동시 선점 요청을 RDB만으로 처리하면 데드락+DB 붕괴 발생." },
    txSyncOnly:         { t: "결제/이커머스 서비스에 동기 처리만", m: "주문→결제→재고 체인을 동기로 연결하면 하나가 느려지면 전체가 느려짐." },
    txRolling:          { t: "결제 서비스에 Rolling 배포", m: "이전/신버전 공존 구간에서 결제 오류 위험. Blue/Green 권장." },
    eksBeginnerTeam:    { t: "EKS + 초급 팀 위험 조합", m: "EKS는 K8s 운영 고급 지식 필요. 초급 팀은 ECS Fargate로 시작 권장." },
    eksManaged:         { t: "EKS + 완전 관리형 운영 불일치", m: "EKS는 K8s 운영 지식 필수. 완전 관리형이면 ECS Fargate가 더 적합." },
    istioBeginnerTeam:  { t: "Istio + 초급 팀 위험", m: "Istio는 고급 서비스 메시 지식 필요. 초급 팀은 AWS App Mesh 또는 없이 시작 권장." },
    istioSolo:          { t: "Istio + 1인 팀 부담", m: "Istio 운영은 전담 플랫폼 엔지니어링 팀이 필요. 1인 팀에게는 큰 운영 부담." },
    karpenterNonK8s:    { t: "Karpenter는 Kubernetes 전용", m: "Karpenter는 Kubernetes 전용. ECS에서는 ECS Auto Scaling 사용." },
    serverlessEks:      { t: "서버리스 + EKS 설정 충돌", m: "서버리스 아키텍처에서 EKS는 오버엔지니어링. Lambda + API Gateway 유지 권장." },
    ultraRpsLambda:     { t: "초고RPS + Lambda 콜드스타트 위험", m: "Lambda Provisioned Concurrency 없이 초고 RPS는 콜드스타트로 p99 급등." },
    lambdaUltraRpsSync: { t: "Lambda + 초고RPS + 동기 DB 복합 위험", m: "콜드스타트 + 동기 RDS 연결 = p99 지연 폭발. 비동기 처리 또는 DynamoDB 전환 필수." },
    spotCritical:       { t: "Spot + 결제/실시간 서비스 위험", m: "Spot은 2분 예고 후 강제 종료. 결제·채팅 유실 위험." },
    spotPartialCritical:{ t: "Spot Partial + 결제/실시간 서비스 주의", m: "Spot 인스턴스 중단 시 일부 결제·채팅 요청 유실 가능. 결제/실시간 워크로드에는 On-Demand 권장." },
    commit3yrMvp:       { t: "3년 약정 + MVP 단계 위험", m: "방향 전환 가능성 높은 MVP에 3년 약정은 비용 낭비 위험. 1년 또는 On-Demand 권장." },
    shieldSmall:        { t: "Shield Advanced + 소규모 서비스 과투자", m: "$3,000/월 고정. 소규모 서비스는 WAF Basic으로 충분." },
    fargateXlarge:      { t: "Fargate + DAU 100만+ 비용 초과", m: "DAU 100만+ Fargate는 EC2+RI 대비 2배 이상 비용 초과 가능. EC2 노드 + RI/Savings Plans 전환 필수." },
    fargateLarge:       { t: "Fargate + 대규모 서비스 비용 비효율", m: "DAU 10만+ 에서 Fargate는 EC2 On-Demand 대비 20~30% 비쌈. EC2+RI 검토." },
    noWafPublic:        { t: "외부 공개 서비스에 WAF 없음", m: "SQL 인젝션·XSS·Bot 공격 무방비. 기본 WAF라도 적용 권장." },
    ecommNoBotCtrl:     { t: "이커머스/티켓팅에 Bot Control 없음", m: "이벤트 당일 봇이 트래픽의 70~90%. Bot Control 없이 공정한 선착순 불가." },
    globalNoCdn:        { t: "글로벌 서비스에 CDN 없음", m: "해외 사용자는 서울 리전 직접 연결로 150~300ms 지연. CloudFront 필수." },
    graphqlAlb:         { t: "GraphQL + ALB HTTP 라우팅 주의", m: "GraphQL은 단일 엔드포인트(/graphql). ALB 경로 기반 라우팅 규칙 별도 설정 필요." },
    largeCacheNone:     { t: "대규모 서비스에 캐시 없음", m: "DAU 10만+ 에서 DB 직접 조회만 사용하면 DB가 병목. ElastiCache 도입 권장." },
    s3SensitiveEncr:    { t: "S3 민감 데이터 + 기본 암호화", m: "중요 데이터는 CMK 암호화 + 버킷 정책 + 퍼블릭 차단 모두 필요." },
    xlargeAccount:      { t: "DAU 100만+ + 단일 계정 위험", m: "서비스 할당량 한도 + 환경 격리 불가. AWS Organizations 멀티 계정 분리 필수." },
    largeAccount:       { t: "대규모 서비스 + 단일 계정", m: "DAU 10만+ 서비스에서 Prod/Dev 같은 계정은 개발 실수가 Prod에 직접 영향." },
    highAvailNoIac:     { t: "고가용성 목표 + IaC 없음", m: "99.95%+ 목표에서 수동 콘솔 관리는 재현성·DR 복구에 치명적. IaC 필수." },
    largeNoIac:         { t: "대규모 서비스에 IaC 없음", m: "수동 콘솔 관리는 재현성·감사·DR 복구에 치명적. Terraform 또는 CDK 필수." },
    multiRegionEnv:     { t: "멀티 리전 + dev/prod만 환경 부족", m: "멀티 리전 DR 배포 검증을 위한 Stage 환경이 없으면 복구 절차 미검증." },
    argoNonEks:         { t: "ArgoCD + EKS 아님", m: "ArgoCD는 Kubernetes 전용. ECS 환경은 CodeDeploy 또는 GitHub Actions 사용." },
    iotSqs:             { t: "초고속 IoT + SQS 비효율", m: "초당 수만 IoT 메시지에 SQS는 처리량·비용 한계. Kinesis Data Streams 검토." },
    lambdaVpcEndpoint:  { t: "Lambda VPC 배치 + VPC Endpoint 미활용", m: "VPC 내 Lambda는 NAT GW 경유 시 데이터 전송 비용 발생. VPC Endpoint 활용으로 NAT 비용 절감 권장." },
    lambdaRds:          { t: "Lambda + 표준 RDS 조합", m: "Lambda 동시 실행 시 RDS 커넥션 폭발. RDS Proxy 필수이며, Aurora Serverless v2가 더 적합." },
    fargateCommit:      { t: "Fargate + 3년 약정 주의", m: "Fargate는 EC2 RI 적용 불가. Compute Savings Plans만 사용 가능(Fargate 최대 ~52% 절감). EC2 RI 72%보다 낮음." },
    globalDbNonAurora:  { t: "Global Database는 Aurora 전용", m: "RDS 표준은 Global Database 미지원. 크로스 리전 복제가 필요하면 Aurora로 전환 필요." },
    serverlessBigData:  { t: "서버리스 + 수십 TB 데이터 처리 주의", m: "Lambda 15분 타임아웃 제한으로 대용량 배치 처리 불가. AWS Batch 또는 ECS Task 병행 필요." },
    msaNoDiscovery:     { t: "대규모 비동기 MSA에 서비스 디스커버리 미설정", m: "ECS Service Connect 또는 Cloud Map으로 서비스 간 통신 관리 권장." },
    realtimeSyncOnly:   { t: "실시간 서비스에 동기 처리만", m: "채팅·알림 등 실시간 이벤트를 동기로만 처리하면 병목 발생. SNS/EventBridge 비동기 전파 검토." },
    globalSingleNoCdn:  { t: "글로벌 사용자 + 단일 리전 + CDN 없음", m: "해외 사용자는 서울 직접 연결로 150~300ms 지연. CloudFront 필수이며 멀티 리전 검토 권장." },
    costEks:            { t: "비용 우선 전략 + EKS 선택 괴리", m: "EKS 클러스터 비용($73/월) + K8s 운영 전문성 필요로 ECS Fargate 대비 총 운영 비용 증가. 비용 우선이면 ECS Fargate 전환 검토." },
    cost3az:            { t: "비용 우선 전략 + 3 AZ 과잉", m: "99.95% 미만 가용성 목표에서 3 AZ는 NAT GW 비용이 2 AZ의 1.5배. 2 AZ로 충분." },
    costNatPerAz:       { t: "비용 우선 전략 + AZ별 NAT GW", m: "규정 준수·고가용성 요건 없이 AZ별 NAT GW는 월 $43×AZ 추가 비용. shared/endpoint 전환 검토." },
    costDbHa:           { t: "비용 우선 전략 + DB 과잉 HA", m: "규정 준수 없이 Read Replica/Global DB는 Multi-AZ 대비 비용 2배+. Multi-AZ면 충분." },
    costShield:         { t: "비용 우선 전략 + Shield Advanced", m: "Shield Advanced는 월 $3,000 고정. 규정 준수 요건 없으면 WAF Basic으로 전환 시 대폭 절감." },
    costBluegreen:      { t: "비용 우선 전략 + Blue/Green 배포", m: "Blue/Green은 배포 시 2배 리소스 필요. PCI 요건 없으면 Rolling 전환 시 배포 리소스 비용 0." },
    costCdnInternal:    { t: "비용 우선 전략 + 내부 도구에 CDN", m: "내부 전용 서비스에 CDN은 불필요한 비용. 제거 시 월 비용 절감." },
    avail99DbSingleAz: { t: "99.9% 가용성 + 단일 AZ DB 주의", m: "99.9% 목표에서도 Single-AZ DB는 연간 43분 다운타임 위험. Multi-AZ 권장." },
    globalDbSingleRegion: { t: "Global DB + 단일 리전 모순", m: "Global Database는 멀티리전 전제 설계. 단일 리전이면 Multi-AZ로 충분." },
    canaryRealtime:     { t: "Canary 배포 + 실시간 서비스 주의", m: "Canary 배포 중 WebSocket 연결 드롭 위험. Blue/Green 또는 연결 드레이닝 검토." },
    dynamoOnDemandLarge:{ t: "대규모 DynamoDB 용량 계획 필요", m: "DAU 10만+ DynamoDB는 On-Demand 사용 시 Provisioned 대비 5~10배 비용 가능. 용량 모드 확인 및 Provisioned + Auto Scaling 검토 권장." },
    iotNetworkIso:      { t: "IoT 디바이스 네트워크 격리 미설정", m: "IoT 디바이스 데이터는 private/strict 네트워크 격리 권장. 기본 네트워크는 디바이스 데이터 유출 위험." },
    mlPipelineServerless:{ t: "ML 파이프라인 + 서버리스 조합 주의", m: "ML 학습 워크로드는 서버리스보다 컨테이너/EC2 권장. Lambda 15분 타임아웃으로 장시간 학습 불가." },
    globalDynamoSingle:  { t: "글로벌 + DynamoDB + 단일 리전", m: "글로벌 사용자 + DynamoDB 조합 시 Global Tables(DR/Active) 권장. 단일 리전은 해외 사용자 지연시간 문제." },
    appMeshEol:          { t: "App Mesh 2026년 9월 지원 종료", m: "AWS App Mesh는 2026년 9월 지원 종료 예정입니다. VPC Lattice 또는 ECS Service Connect로 마이그레이션을 계획하세요." },
    codepipelineCodecommit: { t: "CodeCommit 신규 리포지토리 생성 불가", m: "AWS CodeCommit은 신규 리포지토리 생성이 불가합니다. GitHub 또는 GitLab을 소스 리포지토리로 사용하세요." },
    mskBeginner:         { t: "MSK(Kafka) + 초급 팀 위험", m: "Kafka 운영은 브로커/파티션/리밸런싱 깊은 이해가 필요합니다. 초급 팀은 SQS 또는 Kinesis부터 시작 권장." },
    mskSmallDau:         { t: "MSK + 소규모 서비스 비용 초과", m: "MSK 최소 3브로커 필수로 소규모 서비스에는 비용 대비 효과가 낮습니다. SQS/SNS가 더 적합합니다." },
    stepFuncHighFreq:    { t: "Step Functions Standard + 고빈도 호출", m: "Standard 워크플로는 전환당 과금으로 초당 수천 건은 비용 폭발. Express 워크플로를 검토하세요." },
    daxServerless:       { t: "DAX + 서버리스 VPC 연결 필요", m: "DAX는 VPC 내에서만 접근 가능. Lambda에서 DAX 사용 시 VPC 배치 + 서브넷 그룹 설정이 필요합니다." },
    efsSingleAz:         { t: "EFS + 단일 AZ 데이터 손실 위험", m: "EFS One Zone은 AZ 장애 시 데이터 손실 가능. 운영 환경에서는 EFS Standard(Multi-AZ) 권장." },
    cognitoSelfmgd:      { t: "Cognito + 자체 인증 서버 중복", m: "Cognito와 자체 인증 서버를 동시에 사용하면 관리 포인트가 증가합니다. 역할을 명확히 분리하세요." },
    batchServerless:     { t: "AWS Batch + 서버리스 아키텍처", m: "Batch 작업이 가볍다면 Lambda로 충분합니다. 대용량 배치만 AWS Batch(Fargate 런타임)를 사용하세요." },
    documentdbBeginner:  { t: "DocumentDB + 초급 팀 주의", m: "DocumentDB 클러스터 관리(파라미터 그룹, 커넥션 풀링)에 대한 이해가 필요합니다." },
    documentdbServerless:{ t: "DocumentDB + 서버리스 커넥션 관리", m: "Lambda에서 DocumentDB 접근 시 커넥션 풀 고갈 주의. 커넥션 재사용 또는 Proxy 패턴을 적용하세요." },
    neptuneBeginner:     { t: "Neptune + 초급 팀 위험", m: "Gremlin 또는 SPARQL 쿼리 언어 학습이 필요합니다. 관계형 DB 경험만으로는 운영이 어렵습니다." },
    timestreamAlone:     { t: "Timestream 단독 사용 주의", m: "Timestream은 시계열 데이터 전용입니다. 일반 트랜잭션 데이터는 별도 RDB가 필요합니다." },
    memorydbCacheOnly:   { t: "MemoryDB는 캐시 전용이면 과잉", m: "캐시 전용이면 ElastiCache Redis가 더 적합하고 ~20% 저렴합니다. MemoryDB는 주 DB 역할 시 사용하세요." },
    mqBeginner:          { t: "Amazon MQ + 초급 팀 위험", m: "브로커 관리(Active/Standby, 큐 설정) 이해가 필요합니다. 초급 팀은 SQS/SNS 권장." },
    mqNewProject:        { t: "Amazon MQ + 신규 프로젝트", m: "신규 프로젝트는 AWS 네이티브 SQS/SNS가 더 적합합니다. Amazon MQ는 기존 MQ 마이그레이션용입니다." },
    appRunnerRealtime:   { t: "App Runner + 실시간(WebSocket) 미지원", m: "App Runner는 WebSocket을 지원하지 않습니다. 실시간 서비스는 ECS/EKS를 사용하세요." },
    latticePlusAppMesh:  { t: "VPC Lattice + App Mesh 동시 선택", m: "VPC Lattice와 App Mesh는 역할이 중복됩니다. VPC Lattice(최신)로 통일을 권장합니다." },
    bedrockVpcEndpoint:  { t: "Bedrock + 민감 데이터 시 VPC 엔드포인트 필수", m: "민감 데이터를 Bedrock에 전송할 경우 VPC 엔드포인트를 통해 프라이빗 연결을 사용하세요." },
    springBootLambda:    { t: "Spring Boot + Lambda 조합 비효율", m: "Spring Boot(JVM)는 콜드스타트 3~10초로 Lambda와 궁합이 나쁩니다. 컨테이너(ECS/EKS)를 사용하세요." },
    eksFargateDaemonset: { t: "EKS Fargate + Prometheus DaemonSet 불가", m: "Fargate는 DaemonSet을 지원하지 않습니다. Prometheus Agent 모드 또는 CloudWatch Container Insights를 사용하세요." },
    multiRegionMvp:      { t: "멀티 리전 + MVP 단계 과잉", m: "MVP 단계에서 멀티 리전은 비용 대비 효과가 낮습니다. 단일 리전 + Multi-AZ로 시작하세요." },
    highAvailSolo:       { t: "99.99% 가용성 + 1인 팀 비현실", m: "99.99% 달성에는 온콜 로테이션, 자동 복구, 멀티 리전이 필요합니다. 1인 팀에는 99.9%가 현실적입니다." },
    canaryFlash:         { t: "카나리 배포 + 선착순 이벤트 주의", m: "선착순 이벤트 중 카나리 배포는 일부 사용자에게 다른 버전이 노출됩니다. 이벤트 전후 배포를 분리하세요." },
    noMonitoring:        { t: "모니터링 미설정", m: "CloudWatch, X-Ray 등 모니터링 도구가 선택되지 않았습니다. 프로덕션 환경에서는 모니터링이 필수입니다." },
    noBackupNonEks:      { t: "백업 전략 미설정", m: "DB 백업 외에 애플리케이션 상태·설정 백업 전략이 없습니다. AWS Backup 활용을 검토하세요." },
    prodNoIac:           { t: "IaC 미설정 (프로덕션 권장)", m: "수동 콘솔 관리로는 환경 재현, 변경 추적, 장애 복구가 어렵습니다. Terraform 또는 CDK 도입을 권장합니다." },
  } : {
    availAz:            { t: "99.99% availability + single AZ impossible", m: "Single AZ means full outage on AZ failure. At least 2 AZs required for 99.99% (3 AZs recommended)." },
    highAvailAz:        { t: "High availability target conflicts with single AZ", m: "99.95%+ availability cannot be achieved without Multi-AZ." },
    highAvailDb:        { t: "High availability target conflicts with single-AZ DB", m: "Single-AZ DB causes tens of minutes of downtime. Multi-AZ is required." },
    avail99_2az:        { t: "99.99% availability + 2 AZ configuration", m: "Losing 1 of 2 AZs means 50% capacity loss. 3 AZs strongly recommended for 99.99%." },
    rpoZeroSingleAz:   { t: "RPO Zero + single-AZ DB impossible", m: "Zero data loss requires synchronous replication. Switch to Multi-AZ Read Replica or higher." },
    rto1minSingleRegion:{ t: "1-minute RTO + single region difficult", m: "1-minute RTO is unachievable in a single region during full region failure. Consider a DR region." },
    rto1minDr:          { t: "1-minute RTO + Pilot Light/DR mismatch", m: "Pilot Light/DR requires tens of minutes to an hour for infra scale-up. 1-minute RTO requires Active-Active only." },
    rpoZeroSyncOnly:    { t: "RPO Zero but sync-only processing?", m: "Sync processing without async queues may lose some requests. Consider the transactional outbox pattern." },
    critCertEncr:       { t: "PCI/HIPAA/SOX + default encryption mismatch", m: "CMK encryption + key auditing are mandatory audit items." },
    critCertNetIso:     { t: "Compliance certification + default network isolation", m: "PCI/HIPAA cannot pass certification without full DB and app isolation." },
    critCertSubnet:     { t: "Compliance certification + 2-tier network", m: "PCI DSS requires CDE isolation. 3-tier subnet recommended." },
    critCertIac:        { t: "Compliance certification + no IaC", m: "PCI/HIPAA/SOX audits require infrastructure change history. Terraform/CDK required." },
    gdprSingleRegion:   { t: "GDPR + non-EU single region", m: "Storing EU user data in a non-EU region requires proper transfer mechanisms (SCCs, adequacy decisions). Including an EU region is the simplest compliance path." },
    gdprGlobalSingle:   { t: "GDPR + global users + single region", m: "Single non-EU region for global users causes latency issues and requires GDPR transfer safeguards. Multi-region including EU recommended (SCCs allow non-EU storage but add complexity)." },
    pciDynamo:          { t: "PCI DSS + DynamoDB default encryption", m: "DynamoDB CMK (customer-managed key) encryption is a PCI DSS audit item. CMK configuration recommended." },
    ticketNoRedis:      { t: "First-come-first-served ticketing without Redis/DynamoDB", m: "Processing tens of thousands of concurrent reservation requests with RDB alone causes deadlocks and database overload." },
    txSyncOnly:         { t: "Payment/e-commerce service with sync-only processing", m: "Synchronously chaining order-payment-inventory means one slow link slows everything." },
    txRolling:          { t: "Payment service with rolling deployment", m: "Old/new version coexistence during rolling deploy risks payment errors. Blue/Green recommended." },
    eksBeginnerTeam:    { t: "EKS + beginner team risky combination", m: "EKS requires advanced K8s operational knowledge. Beginner teams should start with ECS Fargate." },
    eksManaged:         { t: "EKS + fully managed ops mismatch", m: "EKS requires K8s operational knowledge. For fully managed ops, ECS Fargate is more suitable." },
    istioBeginnerTeam:  { t: "Istio + beginner team risk", m: "Istio requires advanced service mesh knowledge. Beginner teams should start with AWS App Mesh or none." },
    istioSolo:          { t: "Istio + solo team burden", m: "Istio operations require a dedicated platform engineering team. Major operational burden for a solo developer." },
    karpenterNonK8s:    { t: "Karpenter is Kubernetes-only", m: "Karpenter is Kubernetes-only. Use ECS Auto Scaling for ECS." },
    serverlessEks:      { t: "Serverless + EKS configuration conflict", m: "EKS is over-engineering for a serverless architecture. Recommend keeping Lambda + API Gateway." },
    ultraRpsLambda:     { t: "Very high request rates + Lambda cold start risk", m: "High RPS without Lambda Provisioned Concurrency causes p99 latency spikes from cold starts." },
    lambdaUltraRpsSync: { t: "Lambda + high RPS + sync DB compound risk", m: "Cold starts + synchronous RDS connections = severe p99 latency degradation. Switch to async processing or DynamoDB." },
    spotCritical:       { t: "Spot + payment/realtime service risk", m: "Spot instances terminate with 2-minute warning. Risk of losing payments and chat messages." },
    spotPartialCritical:{ t: "Partial Spot + payment/realtime service risk", m: "Spot interruptions may cause some payment/chat request loss. On-Demand recommended for payment/realtime workloads." },
    commit3yrMvp:       { t: "3-year commitment + MVP stage risk", m: "3-year commitment on a pivot-prone MVP risks wasted spend. 1-year or On-Demand recommended." },
    shieldSmall:        { t: "Shield Advanced + small service overinvestment", m: "$3,000/month fixed cost. WAF Basic is sufficient for small services." },
    fargateXlarge:      { t: "Fargate + DAU 1M+ cost overrun", m: "Fargate at DAU 1M+ can cost 2x+ vs EC2+RI. Switch to EC2 nodes + RI/Savings Plans." },
    fargateLarge:       { t: "Fargate + large-scale service cost inefficiency", m: "At DAU 100K+, Fargate is 20-30% more expensive than EC2 On-Demand. Consider EC2+RI." },
    noWafPublic:        { t: "Public-facing service without WAF", m: "Unprotected against SQL injection, XSS, and bot attacks. At minimum, enable basic WAF." },
    ecommNoBotCtrl:     { t: "E-commerce/ticketing without Bot Control", m: "Bots account for 70\u201390% of traffic on event days. Fair first-come-first-served is impossible without Bot Control." },
    globalNoCdn:        { t: "Global service without CDN", m: "Overseas users face 150-300ms latency connecting directly to the origin region. CloudFront required." },
    graphqlAlb:         { t: "GraphQL + ALB HTTP routing caveat", m: "GraphQL uses a single endpoint (/graphql). Separate ALB path-based routing rules needed." },
    largeCacheNone:     { t: "Large-scale service without cache", m: "At DAU 100K+, DB-only queries create a bottleneck. ElastiCache adoption recommended." },
    s3SensitiveEncr:    { t: "S3 sensitive data + default encryption", m: "Sensitive data requires CMK encryption + bucket policy + public access block together." },
    xlargeAccount:      { t: "DAU 1M+ + single account risk", m: "Service quota limits + no environment isolation. AWS Organizations multi-account separation required." },
    largeAccount:       { t: "Large-scale service + single account", m: "At DAU 100K+, sharing Prod/Dev in one account means dev mistakes directly affect Prod." },
    highAvailNoIac:     { t: "High availability target + no IaC", m: "Manual console management at 99.95%+ targets is fatal for reproducibility and DR recovery. IaC required." },
    largeNoIac:         { t: "Large-scale service without IaC", m: "Manual console management is fatal for reproducibility, auditing, and DR recovery. Terraform or CDK required." },
    multiRegionEnv:     { t: "Multi-region + only dev/prod environments insufficient", m: "Without a Stage environment for multi-region DR deployment verification, recovery procedures remain untested." },
    argoNonEks:         { t: "ArgoCD + not EKS", m: "ArgoCD is Kubernetes-only. For ECS environments, use CodeDeploy or GitHub Actions." },
    iotSqs:             { t: "High-throughput IoT + SQS inefficiency", m: "SQS has throughput and cost limits for tens of thousands of IoT messages per second. Consider Kinesis Data Streams." },
    lambdaVpcEndpoint:  { t: "Lambda in VPC + VPC Endpoint underutilized", m: "Lambda in VPC incurs data transfer costs via NAT Gateway. Use VPC Endpoints to reduce NAT costs." },
    lambdaRds:          { t: "Lambda + standard RDS combination", m: "Concurrent Lambda executions cause RDS connection explosion. RDS Proxy is required; Aurora Serverless v2 is more suitable." },
    fargateCommit:      { t: "Fargate + 3-year commitment caveat", m: "Fargate cannot use EC2 RI. Only Compute Savings Plans available (Fargate max ~52% savings) vs EC2 RI 72%." },
    globalDbNonAurora:  { t: "Global Database is Aurora-only", m: "Standard RDS does not support Global Database. Switch to Aurora if cross-region replication is needed." },
    serverlessBigData:  { t: "Serverless + tens of TB data processing caveat", m: "Lambda 15-minute timeout prevents large batch processing. AWS Batch or ECS Task required alongside." },
    msaNoDiscovery:     { t: "Large-scale async microservices without service discovery", m: "Use ECS Service Connect or Cloud Map for inter-service communication management." },
    realtimeSyncOnly:   { t: "Realtime service with sync-only processing", m: "Processing realtime events like chat and notifications synchronously creates bottlenecks. Consider SNS/EventBridge async propagation." },
    globalSingleNoCdn:  { t: "Global users + single region + no CDN", m: "Overseas users face 150-300ms latency connecting directly to the origin region. CloudFront required and multi-region recommended." },
    costEks:            { t: "Cost-first strategy + EKS selection mismatch", m: "EKS cluster cost ($73/mo) + K8s operational expertise increases total cost of ownership vs ECS Fargate. Consider switching to ECS Fargate for cost optimization." },
    cost3az:            { t: "Cost-first strategy + 3 AZ excess", m: "3 AZs cost 1.5x more for NAT GW than 2 AZs. For availability targets below 99.95%, 2 AZs are sufficient." },
    costNatPerAz:       { t: "Cost-first strategy + per-AZ NAT GW", m: "Without compliance or high-availability requirements, per-AZ NAT GW adds $43/AZ/mo. Consider shared/endpoint." },
    costDbHa:           { t: "Cost-first strategy + excessive DB HA", m: "Without compliance requirements, Read Replica/Global DB costs 2x+ vs Multi-AZ. Multi-AZ is sufficient." },
    costShield:         { t: "Cost-first strategy + Shield Advanced", m: "Shield Advanced is $3,000/mo fixed. Without compliance requirements, switching to WAF Basic saves significantly." },
    costBluegreen:      { t: "Cost-first strategy + Blue/Green deploy", m: "Blue/Green requires 2x resources during deployment. Without PCI requirements, Rolling deploy has zero deployment resource cost." },
    costCdnInternal:    { t: "Cost-first strategy + CDN for internal tool", m: "CDN is unnecessary for internal-only services. Removing it saves monthly costs." },
    avail99DbSingleAz: { t: "Single-AZ DB adds risk at 99.9% availability", m: "Single-AZ DB risks ~43 minutes annual downtime even at 99.9% target. Multi-AZ recommended." },
    globalDbSingleRegion: { t: "Global DB contradicts single-region setup", m: "Global Database is designed for multi-region. Multi-AZ is sufficient for single region." },
    canaryRealtime:     { t: "Canary deploy + realtime service warning", m: "Canary deployment may cause WebSocket connection drops. Consider Blue/Green or connection draining." },
    dynamoOnDemandLarge:{ t: "DynamoDB capacity planning needed at scale", m: "At DAU 100K+, DynamoDB On-Demand can cost 5-10x vs Provisioned. Review capacity mode and consider Provisioned + Auto Scaling." },
    iotNetworkIso:      { t: "IoT device network isolation not configured", m: "Private/strict network isolation recommended for IoT device data. Default network risks device data exposure." },
    mlPipelineServerless:{ t: "ML pipeline + serverless combination caveat", m: "Containers/EC2 recommended over serverless for ML training workloads. Lambda 15-minute timeout prevents long-running training." },
    globalDynamoSingle:  { t: "Global + DynamoDB + single region", m: "Global Tables (DR/Active) recommended for global users + DynamoDB. Single region causes latency issues for overseas users." },
    appMeshEol:          { t: "App Mesh EOL September 2026", m: "AWS App Mesh is scheduled for end of support in September 2026. Plan migration to VPC Lattice or ECS Service Connect." },
    codepipelineCodecommit: { t: "CodeCommit no longer accepts new repositories", m: "AWS CodeCommit no longer allows new repository creation. Use GitHub or GitLab as your source repository." },
    mskBeginner:         { t: "MSK (Kafka) + beginner team risk", m: "Kafka operations require deep understanding of brokers, partitions, and rebalancing. Beginner teams should start with SQS or Kinesis." },
    mskSmallDau:         { t: "MSK + small service cost excess", m: "MSK requires minimum 3 brokers, making it cost-ineffective for small services. SQS/SNS is more suitable." },
    stepFuncHighFreq:    { t: "Step Functions Standard + high-frequency calls", m: "Standard workflows charge per state transition; thousands per second will explode costs. Consider Express workflows." },
    daxServerless:       { t: "DAX + serverless VPC connectivity required", m: "DAX is only accessible within a VPC. Lambda accessing DAX requires VPC placement + subnet group configuration." },
    efsSingleAz:         { t: "EFS + single AZ data loss risk", m: "EFS One Zone risks data loss on AZ failure. Use EFS Standard (Multi-AZ) for production environments." },
    cognitoSelfmgd:      { t: "Cognito + self-managed auth overlap", m: "Using both Cognito and self-managed auth increases management overhead. Clearly separate their roles." },
    batchServerless:     { t: "AWS Batch + serverless architecture", m: "For lightweight batch jobs, Lambda is sufficient. Use AWS Batch (Fargate runtime) only for large-scale batch processing." },
    documentdbBeginner:  { t: "DocumentDB + beginner team caution", m: "DocumentDB cluster management (parameter groups, connection pooling) requires understanding." },
    documentdbServerless:{ t: "DocumentDB + serverless connection management", m: "When accessing DocumentDB from Lambda, beware of connection pool exhaustion. Apply connection reuse or proxy patterns." },
    neptuneBeginner:     { t: "Neptune + beginner team risk", m: "Gremlin or SPARQL query language learning is required. Relational DB experience alone is insufficient for operations." },
    timestreamAlone:     { t: "Timestream standalone usage caution", m: "Timestream is for time-series data only. General transactional data needs a separate relational DB." },
    memorydbCacheOnly:   { t: "MemoryDB is overkill for cache-only", m: "For cache-only use, ElastiCache Redis is more suitable and ~20% cheaper. Use MemoryDB when it serves as a primary DB." },
    mqBeginner:          { t: "Amazon MQ + beginner team risk", m: "Understanding broker management (Active/Standby, queue configuration) is required. Beginner teams should use SQS/SNS." },
    mqNewProject:        { t: "Amazon MQ + new project", m: "For new projects, AWS-native SQS/SNS is more suitable. Amazon MQ is designed for migrating existing MQ systems." },
    appRunnerRealtime:   { t: "App Runner + realtime (WebSocket) unsupported", m: "App Runner does not support WebSocket. Use ECS/EKS for real-time services." },
    latticePlusAppMesh:  { t: "VPC Lattice + App Mesh dual selection", m: "VPC Lattice and App Mesh have overlapping roles. Recommend consolidating to VPC Lattice (latest)." },
    bedrockVpcEndpoint:  { t: "Bedrock + sensitive data requires VPC endpoint", m: "When sending sensitive data to Bedrock, use VPC endpoints for private connectivity." },
    springBootLambda:    { t: "Spring Boot + Lambda inefficient combination", m: "Spring Boot (JVM) has 3-10s cold starts, making it a poor fit for Lambda. Use containers (ECS/EKS) instead." },
    eksFargateDaemonset: { t: "EKS Fargate + Prometheus DaemonSet impossible", m: "Fargate does not support DaemonSets. Use Prometheus Agent mode or CloudWatch Container Insights." },
    multiRegionMvp:      { t: "Multi-region + MVP stage overkill", m: "Multi-region is cost-ineffective at MVP stage. Start with single region + Multi-AZ." },
    highAvailSolo:       { t: "99.99% availability + solo team unrealistic", m: "Achieving 99.99% requires on-call rotation, automated recovery, and multi-region. 99.9% is realistic for solo teams." },
    canaryFlash:         { t: "Canary deploy + flash sale caution", m: "Canary deployment during flash sales exposes some users to different versions. Separate deployments from events." },
    noMonitoring:        { t: "No monitoring configured", m: "No monitoring tool selected (CloudWatch, X-Ray, etc.). Monitoring is essential for production environments." },
    noBackupNonEks:      { t: "No backup strategy configured", m: "No application state/configuration backup strategy beyond DB backups. Consider leveraging AWS Backup." },
    prodNoIac:           { t: "No IaC configured (recommended for production)", m: "Manual console management makes environment reproduction, change tracking, and disaster recovery difficult. Consider adopting Terraform or CDK." },
  };

  const types     = toArray(state.workload?.type);
  const avail     = state.slo?.availability;
  const az        = state.network?.az_count;
  const azNum     = azToNum(az);
  const subnet    = state.network?.subnet_tier;
  const netIso    = state.compliance?.network_iso;
  const cert      = toArray(state.compliance?.cert);
  const encr      = state.compliance?.encryption;
  const dbArr     = toArray(state.data?.primary_db);
  const dbHa      = state.data?.db_ha;
  const cache     = state.data?.cache;
  const rpo       = state.slo?.rpo;
  const rto       = state.slo?.rto;
  const region    = state.slo?.region;
  const dau       = state.scale?.dau;
  const rps       = state.scale?.peak_rps;
  const pattern   = toArray(state.scale?.traffic_pattern);
  const orchest   = state.compute?.orchestration;
  const archP     = state.compute?.arch_pattern;
  const scaling   = state.compute?.scaling;
  const nodeType  = state.compute?.compute_node;
  const exp       = state.team?.cloud_exp;
  const teamSize  = state.team?.team_size;
  const opsModel  = state.team?.ops_model;
  const iac       = state.cicd?.iac;
  const pipeline  = state.cicd?.pipeline;
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
  const storArr   = toArray(state.data?.storage);
  const userTypes = toArray(state.workload?.user_type);
  const meshType  = state.platform?.service_mesh;
  const monitor   = state.platform?.k8s_monitoring;
  const gitops    = state.platform?.gitops;
  const authArr   = toArray(state.integration?.auth);

  const hasCritCert = cert.includes("pci") || cert.includes("hipaa") || cert.includes("sox");
  const isGdpr      = cert.includes("gdpr");
  const isTx        = biz === "transaction" || types.includes("ecommerce") || types.includes("ticketing");
  const isLarge     = dau === "large" || dau === "xlarge";
  const isEks       = orchest === "eks";
  const isServerless= archP === "serverless";
  const hasRdbms    = dbArr.some((d: string) => ["aurora_mysql","aurora_pg","rds_mysql","rds_pg"].includes(d));
  const hasRedis    = cache === "redis" || cache === "both";
  const isInternalOnly = (types.includes("internal") || (userTypes.length === 1 && userTypes[0] === "internal")) && !types.some((t: string) => ["ecommerce","ticketing","realtime","saas"].includes(t));
  const isCostFirst = priority === "cost_first";
  const highAvail   = avail === "99.95" || avail === "99.99";

  // -- 가용성 & AZ --
  if ((avail === "99.95" || avail === "99.99") && az === "1az")
    E(_.highAvailAz.t, _.highAvailAz.m, ["slo","network"]);
  if ((avail === "99.95" || avail === "99.99") && dbHa === "single_az")
    E(_.highAvailDb.t, _.highAvailDb.m, ["slo","data"]);
  if (avail === "99.9" && dbHa === "single_az")
    W(_.avail99DbSingleAz.t, _.avail99DbSingleAz.m, ["slo","data"]);
  if (avail === "99.99" && az === "2az")
    W(_.avail99_2az.t, _.avail99_2az.m, ["slo","network"]);

  // -- RPO / RTO --
  if (rpo === "zero" && dbHa === "single_az")
    E(_.rpoZeroSingleAz.t, _.rpoZeroSingleAz.m, ["slo","data"]);
  if (rto === "lt1min" && region === "single")
    W(_.rto1minSingleRegion.t, _.rto1minSingleRegion.m, ["slo","network"]);
  if (rto === "lt1min" && region === "dr")
    W(_.rto1minDr.t, _.rto1minDr.m, ["slo","network"]);
  if (rpo === "zero" && syncMode === "sync_only" && isTx)
    W(_.rpoZeroSyncOnly.t, _.rpoZeroSyncOnly.m, ["slo","integration"]);
  if (dbHa === "global" && region === "single")
    W(_.globalDbSingleRegion.t, _.globalDbSingleRegion.m, ["data","slo"]);

  // -- 규정 준수 --
  if (hasCritCert && encr !== "strict")
    E(_.critCertEncr.t, _.critCertEncr.m, ["compliance"]);
  if (hasCritCert && !["strict","private"].includes(netIso))
    E(_.critCertNetIso.t, _.critCertNetIso.m, ["compliance","network"]);
  if (hasCritCert && !["3tier","private"].includes(subnet))
    W(_.critCertSubnet.t, _.critCertSubnet.m, ["compliance","network"]);
  if (hasCritCert && (!iac || iac === "none"))
    E(_.critCertIac.t, _.critCertIac.m, ["compliance","cicd"]);
  if (isGdpr && region === "single" && !userTypes.includes("global"))
    W(_.gdprSingleRegion.t, _.gdprSingleRegion.m, ["compliance","slo"]);
  if (isGdpr && region === "single" && userTypes.includes("global"))
    W(_.gdprGlobalSingle.t, _.gdprGlobalSingle.m, ["compliance","slo"]);
  if (cert.includes("pci") && dbArr.includes("dynamodb") && encr !== "strict")
    E(_.pciDynamo.t, _.pciDynamo.m, ["compliance","data"]);

  // -- 티켓팅 / 결제 --
  if (types.includes("ticketing") && (tickD === "flash" || tickD === "concert") && !dbArr.includes("dynamodb") && !hasRedis)
    E(_.ticketNoRedis.t, _.ticketNoRedis.m, ["workload","data"]);
  if (isTx && syncMode === "sync_only")
    W(_.txSyncOnly.t, _.txSyncOnly.m, ["integration"]);
  if (isTx && deploy === "rolling")
    W(_.txRolling.t, _.txRolling.m, ["cicd"]);

  // -- 컴퓨팅 --
  if (isEks && exp === "beginner")
    E(_.eksBeginnerTeam.t, _.eksBeginnerTeam.m, ["compute","team"]);
  if (isEks && opsModel === "managed")
    W(_.eksManaged.t, _.eksManaged.m, ["compute","team"]);
  if (isEks && meshType === "istio" && exp === "beginner")
    W(_.istioBeginnerTeam.t, _.istioBeginnerTeam.m, ["platform","team"]);
  if (isEks && meshType === "istio" && teamSize === "solo")
    W(_.istioSolo.t, _.istioSolo.m, ["platform","team"]);
  // karpenter is a platform-phase field, only settable when orchest === "eks"
  // so karpenter + !isEks is impossible — rule removed as dead code
  if (isServerless && isEks)
    W(_.serverlessEks.t, _.serverlessEks.m, ["compute","platform"]);
  if (rps === "ultra" && isServerless && (!scaling || (Array.isArray(scaling) && scaling.length === 0)))
    W(_.ultraRpsLambda.t, _.ultraRpsLambda.m, ["compute","slo"]);
  if (rps === "ultra" && isServerless && hasRdbms && syncMode === "sync_only")
    E(_.lambdaUltraRpsSync.t, _.lambdaUltraRpsSync.m, ["compute","data","integration"]);

  // -- Spot --
  if (spot === "heavy" && (types.includes("ticketing") || types.includes("realtime") || isTx))
    E(_.spotCritical.t, _.spotCritical.m, ["cost","workload"]);
  if (spot === "partial" && (types.includes("ticketing") || types.includes("realtime") || isTx))
    W(_.spotPartialCritical.t, _.spotPartialCritical.m, ["cost","workload"]);

  // -- 비용 --
  if (commit === "3yr" && stage === "mvp")
    W(_.commit3yrMvp.t, _.commit3yrMvp.m, ["cost","workload"]);
  if (waf === "shield" && (dau === "small" || dau === "medium") && !hasCritCert)
    W(_.shieldSmall.t, _.shieldSmall.m, ["edge","cost"]);
  if (nodeType === "fargate" && dau === "xlarge")
    E(_.fargateXlarge.t, _.fargateXlarge.m, ["compute","cost"]);
  else if (nodeType === "fargate" && isLarge)
    W(_.fargateLarge.t, _.fargateLarge.m, ["compute","cost"]);

  // -- 비용 전략 vs 실제 선택 괴리 --
  if (isCostFirst && isEks)
    W(_.costEks.t, _.costEks.m, ["cost","compute"]);
  if (isCostFirst && az === "3az" && !highAvail)
    W(_.cost3az.t, _.cost3az.m, ["cost","network"]);
  if (isCostFirst && natStrat === "per_az" && !hasCritCert && !highAvail)
    W(_.costNatPerAz.t, _.costNatPerAz.m, ["cost","network"]);
  if (isCostFirst && (dbHa === "multi_az_read" || dbHa === "global") && dataS !== "critical" && !hasCritCert)
    W(_.costDbHa.t, _.costDbHa.m, ["cost","data"]);
  if (isCostFirst && waf === "shield" && !hasCritCert)
    W(_.costShield.t, _.costShield.m, ["cost","edge"]);
  if (isCostFirst && deploy === "bluegreen" && !cert.includes("pci"))
    W(_.costBluegreen.t, _.costBluegreen.m, ["cost","cicd"]);
  if (isCostFirst && cdn && cdn !== "no" && isInternalOnly)
    W(_.costCdnInternal.t, _.costCdnInternal.m, ["cost","edge"]);

  // -- WAF / 엣지 --
  if (!isInternalOnly && (!waf || waf === "no") && types.length > 0)
    W(_.noWafPublic.t, _.noWafPublic.m, ["edge"]);
  if ((types.includes("ecommerce") || types.includes("ticketing")) && waf !== "bot" && waf !== "shield")
    W(_.ecommNoBotCtrl.t, _.ecommNoBotCtrl.m, ["edge"]);
  if (userTypes.includes("global") && (!cdn || cdn === "no") && region !== "single")
    W(_.globalNoCdn.t, _.globalNoCdn.m, ["edge","workload"]);
  if (state.appstack?.protocol === "graphql" && orchest === "ecs")
    W(_.graphqlAlb.t, _.graphqlAlb.m, ["integration","compute"]);

  // -- 데이터 / 캐시 --
  if (isLarge && (!cache || cache === "no") && !dbArr.includes("dynamodb"))
    W(_.largeCacheNone.t, _.largeCacheNone.m, ["scale","data"]);
  if (storArr.includes("s3") && dataS === "critical" && encr !== "strict")
    W(_.s3SensitiveEncr.t, _.s3SensitiveEncr.m, ["data","compliance"]);
  if (isLarge && dbArr.includes("dynamodb"))
    W(_.dynamoOnDemandLarge.t, _.dynamoOnDemandLarge.m, ["data","cost"]);
  if (userTypes.includes("global") && dbArr.includes("dynamodb") && region === "single")
    W(_.globalDynamoSingle.t, _.globalDynamoSingle.m, ["data","slo"]);

  // -- 네트워크 --
  if (dau === "xlarge" && account === "single")
    E(_.xlargeAccount.t, _.xlargeAccount.m, ["scale","network"]);
  else if (isLarge && account === "single")
    W(_.largeAccount.t, _.largeAccount.m, ["scale","network"]);
  if ((avail === "99.95" || avail === "99.99") && (!iac || iac === "none"))
    W(_.highAvailNoIac.t, _.highAvailNoIac.m, ["slo","cicd"]);

  // -- CI/CD --
  if (isLarge && (!iac || iac === "none"))
    E(_.largeNoIac.t, _.largeNoIac.m, ["cicd"]);
  if (!isLarge && !hasCritCert && avail !== "99.95" && avail !== "99.99"
      && (!iac || iac === "none") && stage !== "mvp")
    W(_.prodNoIac.t, _.prodNoIac.m, ["cicd"]);
  if ((avail === "99.95" || avail === "99.99") && region !== "single" && envCnt === "dev_prod")
    W(_.multiRegionEnv.t, _.multiRegionEnv.m, ["slo","cicd"]);
  // gitops is a platform-phase field, only settable when orchest === "eks"
  // so argocd + !isEks is impossible — rule removed as dead code
  if (deploy === "canary" && types.includes("realtime"))
    W(_.canaryRealtime.t, _.canaryRealtime.m, ["cicd","workload"]);

  // -- IoT --
  const queueArr = toArray(queueT);
  if (types.includes("iot") && rps === "ultra" && queueArr.includes("sqs"))
    W(_.iotSqs.t, _.iotSqs.m, ["integration"]);
  if (types.includes("iot") && netIso && !["strict","private"].includes(netIso))
    W(_.iotNetworkIso.t, _.iotNetworkIso.m, ["workload","compliance"]);

  // -- Lambda + VPC --
  if (isServerless && subnet && natStrat && natStrat !== "endpoint" && natStrat !== "none")
    W(_.lambdaVpcEndpoint.t, _.lambdaVpcEndpoint.m, ["compute","network"]);
  if (isServerless && hasRdbms && !dbArr.some((d: string) => d.startsWith("aurora")))
    W(_.lambdaRds.t, _.lambdaRds.m, ["compute","data"]);

  // -- Fargate + 약정 --
  if (commit === "3yr" && nodeType === "fargate")
    W(_.fargateCommit.t, _.fargateCommit.m, ["cost","compute"]);

  // -- Aurora Serverless v2 + Global DB --
  if (dbHa === "global" && hasRdbms && !dbArr.some((d: string) => d.startsWith("aurora")))
    W(_.globalDbNonAurora.t, _.globalDbNonAurora.m, ["data","slo"]);

  // -- 서버리스 + 대용량 데이터 --
  if (isServerless && state.scale?.data_volume === "ptb")
    W(_.serverlessBigData.t, _.serverlessBigData.m, ["compute","scale"]);
  if (state.workload?.data_detail === "ml_pipeline" && isServerless)
    W(_.mlPipelineServerless.t, _.mlPipelineServerless.m, ["compute","workload"]);

  // -- MSA 구성인데 서비스 디스커버리 없음 --
  if (orchest === "ecs" && isLarge && syncMode !== "sync_only" && !apiType)
    W(_.msaNoDiscovery.t, _.msaNoDiscovery.m, ["integration","compute"]);

  // -- 실시간 서비스 + 동기 전용 --
  if (types.includes("realtime") && syncMode === "sync_only")
    W(_.realtimeSyncOnly.t, _.realtimeSyncOnly.m, ["integration","workload"]);

  // -- 글로벌 서비스 + 단일 리전 + CDN 없음 --
  if ((state.workload?.user_type || []).includes("global") && region === "single" && (!cdn || cdn === "no"))
    E(_.globalSingleNoCdn.t, _.globalSingleNoCdn.m, ["edge","slo"]);

  // -- App Mesh EOL --
  if (meshType === "aws_app_mesh")
    W(_.appMeshEol.t, _.appMeshEol.m, ["platform"]);

  // -- CodeCommit deprecation --
  if (pipeline === "codepipeline")
    W(_.codepipelineCodecommit.t, _.codepipelineCodecommit.m, ["cicd"]);

  // -- MSK (Phase 3) --
  if (queueArr.includes("msk") && exp === "beginner")
    W(_.mskBeginner.t, _.mskBeginner.m, ["integration","team"]);
  if (queueArr.includes("msk") && (dau === "tiny" || dau === "small"))
    W(_.mskSmallDau.t, _.mskSmallDau.m, ["integration","cost"]);

  // -- Step Functions --
  const batchArr = toArray(state.integration?.batch_workflow);
  if (batchArr.includes("step_functions") && rps === "ultra")
    W(_.stepFuncHighFreq.t, _.stepFuncHighFreq.m, ["integration","cost"]);

  // -- DAX + Serverless --
  if ((cache === "dax" || cache === "both") && isServerless)
    W(_.daxServerless.t, _.daxServerless.m, ["data","compute"]);

  // -- EFS + Single AZ --
  if (storArr.includes("efs") && az === "1az")
    W(_.efsSingleAz.t, _.efsSingleAz.m, ["data","network"]);

  // -- Cognito + selfmgd overlap --
  if (authArr.includes("cognito") && authArr.includes("selfmgd"))
    W(_.cognitoSelfmgd.t, _.cognitoSelfmgd.m, ["integration"]);

  // -- AWS Batch + serverless --
  if (batchArr.includes("aws_batch") && isServerless)
    W(_.batchServerless.t, _.batchServerless.m, ["integration","compute"]);

  // -- DocumentDB (Phase 4) --
  if (dbArr.includes("documentdb") && exp === "beginner")
    W(_.documentdbBeginner.t, _.documentdbBeginner.m, ["data","team"]);
  if (dbArr.includes("documentdb") && isServerless)
    W(_.documentdbServerless.t, _.documentdbServerless.m, ["data","compute"]);

  // -- Neptune --
  if (dbArr.includes("neptune") && exp === "beginner")
    W(_.neptuneBeginner.t, _.neptuneBeginner.m, ["data","team"]);

  // -- Timestream --
  if (dbArr.includes("timestream") && dbArr.length === 1)
    W(_.timestreamAlone.t, _.timestreamAlone.m, ["data"]);

  // -- MemoryDB --
  if (cache === "memorydb" && !dbArr.includes("memorydb"))
    W(_.memorydbCacheOnly.t, _.memorydbCacheOnly.m, ["data"]);

  // -- Amazon MQ --
  if (queueArr.includes("amazon_mq") && exp === "beginner")
    W(_.mqBeginner.t, _.mqBeginner.m, ["integration","team"]);
  if (queueArr.includes("amazon_mq") && stage === "mvp")
    W(_.mqNewProject.t, _.mqNewProject.m, ["integration"]);

  // -- App Runner --
  if (archP === "app_runner" && types.includes("realtime"))
    E(_.appRunnerRealtime.t, _.appRunnerRealtime.m, ["compute","workload"]);

  // -- VPC Lattice + App Mesh --
  // meshType IS state.platform?.service_mesh, so it can't be both values simultaneously.
  // This rule is unreachable — removed as dead code.

  // -- Bedrock + sensitive data --
  if (state.workload?.data_detail === "ai_genai" && dataS === "critical")
    W(_.bedrockVpcEndpoint.t, _.bedrockVpcEndpoint.m, ["workload","compliance"]);

  // -- Spring Boot + Lambda (Phase 5) --
  if (state.team?.language === "spring_boot" && isServerless)
    E(_.springBootLambda.t, _.springBootLambda.m, ["compute","team"]);

  // -- EKS Fargate + Prometheus DaemonSet --
  if (nodeType === "fargate" && monitor === "prometheus_grafana" && isEks)
    W(_.eksFargateDaemonset.t, _.eksFargateDaemonset.m, ["compute","platform"]);

  // -- Multi-region + MVP --
  if (region === "active" && stage === "mvp")
    W(_.multiRegionMvp.t, _.multiRegionMvp.m, ["slo","workload"]);

  // -- 99.99% + solo --
  if (avail === "99.99" && teamSize === "solo")
    W(_.highAvailSolo.t, _.highAvailSolo.m, ["slo","team"]);

  // -- Canary + flash sale --
  if (deploy === "canary" && state.workload?.ticketing_detail === "flash")
    W(_.canaryFlash.t, _.canaryFlash.m, ["cicd","workload"]);

  // -- Non-EKS monitoring --
  if (!isEks && !isInternalOnly && !isServerless && !monitor && !state.cicd?.monitoring)
    W(_.noMonitoring.t, _.noMonitoring.m, ["cicd"]);

  return issues;
}
