export type GlossaryGroup =
  | "networking"
  | "traffic"
  | "compute"
  | "container"
  | "data"
  | "integration"
  | "security"
  | "cicd";

export type PlacementZone =
  | "edge"
  | "vpc-public"
  | "vpc-private"
  | "vpc-isolated"
  | "regional-managed"
  | "account-level"
  | "concept";

export interface GlossaryTerm {
  id: string;
  name: string;
  group: GlossaryGroup;
  badge: "aws" | "general" | "k8s" | "docker";
  desc: { ko: string; en: string };
  placement: PlacementZone;
  placementNote?: { ko: string; en: string };
  related: string[];
  analogy: { ko: string; en: string };
}

export const GLOSSARY_GROUPS: { id: GlossaryGroup; icon: string }[] = [
  { id: "networking", icon: "🌐" },
  { id: "traffic", icon: "🚀" },
  { id: "compute", icon: "⚙️" },
  { id: "container", icon: "📦" },
  { id: "data", icon: "💾" },
  { id: "integration", icon: "🔗" },
  { id: "security", icon: "🔐" },
  { id: "cicd", icon: "🔄" },
];

export const GLOSSARY: GlossaryTerm[] = [
  // ── 1. 네트워킹 기초 ──
  {
    id: "vpc",
    name: "VPC",
    group: "networking",
    badge: "aws",
    desc: {
      ko: "AWS 안의 나만의 사설 네트워크. 모든 리소스가 이 안에 배치된다.",
      en: "Your own private network inside AWS. All resources are placed inside it.",
    },
    placement: "account-level",
    placementNote: {
      ko: "리전 단위 컨테이너. 서브넷을 만들어 내부를 구획",
      en: "Region-level container. Divided internally by subnets",
    },
    related: ["subnet", "igw", "nat-gw", "sg"],
    analogy: {
      ko: "도시 전체를 둘러싼 성벽. 외부에서는 안이 보이지 않고, 내부는 구역(서브넷)으로 나뉘어 관리된다",
      en: "A walled city. Invisible from outside, internally divided into districts (subnets) for organized management",
    },
  },
  {
    id: "subnet",
    name: "Subnet",
    group: "networking",
    badge: "aws",
    desc: {
      ko: "VPC를 더 작은 네트워크로 나눈 것. 퍼블릭/프라이빗으로 구분한다.",
      en: "A smaller network within a VPC. Classified as public or private.",
    },
    placement: "account-level",
    placementNote: {
      ko: "AZ 단위로 생성. 라우트 테이블로 퍼블릭/프라이빗 결정",
      en: "Created per AZ. Route table determines public/private",
    },
    related: ["vpc", "route-table", "nacl"],
    analogy: {
      ko: "도시 안의 구역. 상업구역(퍼블릭)은 외부 방문자가 올 수 있고, 주거구역(프라이빗)은 주민만 출입 가능",
      en: "Districts within the city. The commercial zone (public) is open to visitors, while the residential zone (private) is residents-only",
    },
  },
  {
    id: "igw",
    name: "Internet Gateway",
    group: "networking",
    badge: "aws",
    desc: {
      ko: "VPC와 인터넷을 연결하는 관문. 퍼블릭 서브넷이 외부와 통신하려면 필수.",
      en: "Gateway connecting VPC to the internet. Required for public subnet internet access.",
    },
    placement: "account-level",
    placementNote: {
      ko: "VPC에 1개만 연결. 퍼블릭 서브넷의 라우트 테이블이 이것을 가리킴",
      en: "One per VPC. Public subnet route tables point to this",
    },
    related: ["vpc", "subnet", "nat-gw"],
    analogy: {
      ko: "도시 정문. 외부에서 도시로 들어오거나 나갈 수 있는 유일한 공식 출입구",
      en: "The city's main gate. The only official entrance for entering or leaving the city",
    },
  },
  {
    id: "nat-gw",
    name: "NAT Gateway",
    group: "networking",
    badge: "aws",
    desc: {
      ko: "프라이빗 서브넷의 리소스가 인터넷에 나갈 수 있게 해주는 서비스. 외부에서 안으로 들어오는 건 차단.",
      en: "Lets private subnet resources access the internet. Blocks inbound from outside.",
    },
    placement: "vpc-public",
    placementNote: {
      ko: "퍼블릭 서브넷에 배치. 프라이빗 서브넷의 라우트 테이블이 이것을 가리킴",
      en: "Placed in public subnet. Private subnet route tables point to this",
    },
    related: ["vpc", "subnet", "igw"],
    analogy: {
      ko: "도시 택배 발송 센터. 주민(프라이빗)이 외부로 물건을 보낼 수 있지만, 외부인이 직접 주거구역에 들어올 수는 없다",
      en: "The city's outbound shipping center. Residents (private) can send packages out, but outsiders cannot enter the residential zone directly",
    },
  },
  {
    id: "vpc-endpoint",
    name: "VPC Endpoint",
    group: "networking",
    badge: "aws",
    desc: {
      ko: "VPC 안에서 AWS 서비스(S3, DynamoDB 등)에 인터넷 없이 직접 연결하는 통로.",
      en: "Private connection from VPC to AWS services (S3, DynamoDB, etc.) without internet.",
    },
    placement: "vpc-private",
    placementNote: {
      ko: "NAT Gateway 비용 절감 + 보안 향상. Gateway/Interface 두 가지 타입",
      en: "Saves NAT Gateway costs + improves security. Gateway/Interface types",
    },
    related: ["vpc", "nat-gw", "s3", "dynamodb"],
    analogy: {
      ko: "도시 안에 입점한 관공서 지점. 시청(AWS 서비스)에 가려고 성 밖으로 나갈 필요 없이 도시 안에서 바로 이용",
      en: "A government branch office inside the city. No need to leave the city walls to visit city hall (AWS services)",
    },
  },
  {
    id: "route-table",
    name: "Route Table",
    group: "networking",
    badge: "aws",
    desc: {
      ko: "네트워크 트래픽이 어디로 갈지 결정하는 규칙 목록. 서브넷마다 하나씩 연결된다.",
      en: "Rules that determine where network traffic goes. One per subnet.",
    },
    placement: "account-level",
    related: ["subnet", "igw", "nat-gw"],
    analogy: {
      ko: "도시 도로 표지판. '시청 방면 → 좌회전', '병원 방면 → 우회전' 처럼 트래픽이 갈 방향을 안내",
      en: "City road signs. Directs traffic like 'To City Hall → turn left', 'To Hospital → turn right'",
    },
  },
  {
    id: "sg",
    name: "Security Group",
    group: "networking",
    badge: "aws",
    desc: {
      ko: "인스턴스 수준의 가상 방화벽. 허용할 트래픽만 명시하는 화이트리스트 방식.",
      en: "Instance-level virtual firewall. Whitelist approach — only specified traffic is allowed.",
    },
    placement: "account-level",
    placementNote: {
      ko: "상태 저장(Stateful). 인바운드를 허용하면 아웃바운드 응답은 자동 허용",
      en: "Stateful. If inbound is allowed, outbound response is auto-allowed",
    },
    related: ["nacl", "vpc", "ec2", "alb"],
    analogy: {
      ko: "건물 출입 카드 시스템. 허가된 사람(트래픽)만 건물에 들어올 수 있고, 나갈 때는 자동으로 문이 열림",
      en: "A building access card system. Only authorized people (traffic) can enter, and the door opens automatically when leaving",
    },
  },
  {
    id: "nacl",
    name: "NACL",
    group: "networking",
    badge: "aws",
    desc: {
      ko: "서브넷 수준의 방화벽. 허용/거부 규칙 모두 설정 가능. 상태 비저장(Stateless).",
      en: "Subnet-level firewall. Supports both allow and deny rules. Stateless.",
    },
    placement: "account-level",
    related: ["sg", "subnet"],
    analogy: {
      ko: "구역 출입 검문소. 건물 카드(SG)와 별개로 구역 입구에서 한 번 더 검사하는 이중 보안",
      en: "A district checkpoint. A second layer of security at the district entrance, separate from the building card (SG)",
    },
  },

  // ── 2. 트래픽 진입 ──
  {
    id: "route53",
    name: "Route 53",
    group: "traffic",
    badge: "aws",
    desc: {
      ko: "AWS의 DNS 서비스. 도메인 이름을 IP 주소로 변환하고, 헬스 체크 기반 라우팅 지원.",
      en: "AWS DNS service. Translates domain names to IPs with health-check-based routing.",
    },
    placement: "edge",
    related: ["cloudfront", "alb"],
    analogy: {
      ko: "도시 안내 센터. '시청(example.com)이 어디인가요?' 물으면 정확한 주소(IP)를 알려줌",
      en: "The city information center. Ask 'Where is City Hall (example.com)?' and it gives you the exact address (IP)",
    },
  },
  {
    id: "cloudfront",
    name: "CloudFront",
    group: "traffic",
    badge: "aws",
    desc: {
      ko: "글로벌 CDN 서비스. 전 세계 엣지 로케이션에 콘텐츠를 캐시하여 빠르게 전달.",
      en: "Global CDN service. Caches content at worldwide edge locations for fast delivery.",
    },
    placement: "edge",
    placementNote: {
      ko: "사용자와 가장 가까운 엣지에서 응답. Origin(ALB/S3)에서 콘텐츠 가져옴",
      en: "Responds from the nearest edge. Fetches content from origin (ALB/S3)",
    },
    related: ["route53", "waf", "alb", "s3"],
    analogy: {
      ko: "전국 체인점 네트워크. 본사(원본 서버) 대신 가까운 지점(엣지)에서 바로 서비스 제공",
      en: "A nationwide chain store network. Serves from the nearest branch (edge) instead of headquarters (origin server)",
    },
  },
  {
    id: "waf",
    name: "WAF",
    group: "traffic",
    badge: "aws",
    desc: {
      ko: "웹 애플리케이션 방화벽. SQL Injection, XSS 등 웹 공격을 차단하는 규칙 기반 필터.",
      en: "Web application firewall. Rule-based filter blocking SQL injection, XSS, and other web attacks.",
    },
    placement: "edge",
    related: ["cloudfront", "alb", "shield"],
    analogy: {
      ko: "건물 보안 검색대. 위험물(공격 패턴)을 가진 방문자는 입장을 거부",
      en: "A building security checkpoint. Denies entry to visitors carrying dangerous items (attack patterns)",
    },
  },
  {
    id: "shield",
    name: "Shield",
    group: "traffic",
    badge: "aws",
    desc: {
      ko: "DDoS 방어 서비스. Standard(무료)는 자동 적용, Advanced는 대규모 공격 방어 + 비용 보호.",
      en: "DDoS protection. Standard (free) is auto-applied; Advanced defends large-scale attacks + cost protection.",
    },
    placement: "edge",
    related: ["waf", "cloudfront", "route53"],
    analogy: {
      ko: "도시 방호 시스템. 기본형(Standard)은 일반 방어, 고급형(Advanced)은 대규모 공격까지 방어",
      en: "The city defense system. Standard provides basic defense, Advanced defends against large-scale attacks",
    },
  },
  {
    id: "alb",
    name: "ALB",
    group: "traffic",
    badge: "aws",
    desc: {
      ko: "Application Load Balancer. HTTP/HTTPS 트래픽을 여러 대상에 분배. 경로·호스트 기반 라우팅 지원.",
      en: "Application Load Balancer. Distributes HTTP/HTTPS traffic. Supports path/host-based routing.",
    },
    placement: "vpc-public",
    placementNote: {
      ko: "퍼블릭 서브넷에 배치. 백엔드 타겟은 프라이빗 서브넷",
      en: "Placed in public subnet. Backend targets in private subnet",
    },
    related: ["nlb", "sg", "ec2", "ecs"],
    analogy: {
      ko: "백화점 안내 데스크. '의류는 3층, 식품은 지하'처럼 요청 내용에 따라 적절한 곳으로 안내",
      en: "A department store info desk. Directs visitors based on their needs — 'clothing on floor 3, food in the basement'",
    },
  },
  {
    id: "nlb",
    name: "NLB",
    group: "traffic",
    badge: "aws",
    desc: {
      ko: "Network Load Balancer. TCP/UDP 수준의 초고성능 로드 밸런서. 고정 IP 지원.",
      en: "Network Load Balancer. Ultra-high-performance TCP/UDP load balancer. Supports static IPs.",
    },
    placement: "vpc-public",
    related: ["alb"],
    analogy: {
      ko: "고속도로 톨게이트. 내용물을 검사하지 않고 초고속으로 통과시키는 단순하고 빠른 입구",
      en: "A highway toll gate. A simple, fast entry point that passes traffic through at ultra-high speed without inspecting contents",
    },
  },
  {
    id: "api-gateway",
    name: "API Gateway",
    group: "traffic",
    badge: "aws",
    desc: {
      ko: "API 요청을 관리하는 완전관리형 서비스. 인증, 스로틀링, 캐싱, 변환 기능 내장.",
      en: "Fully managed service for API requests. Built-in auth, throttling, caching, and transformation.",
    },
    placement: "regional-managed",
    placementNote: {
      ko: "VPC 밖의 관리형 서비스. Lambda와 가장 자연스럽게 연결",
      en: "Managed service outside VPC. Pairs most naturally with Lambda",
    },
    related: ["lambda", "alb", "cloudfront"],
    analogy: {
      ko: "호텔 프론트 데스크. 모든 요청을 접수하고, 본인 확인(인증) 후 담당 부서로 전달",
      en: "A hotel front desk. Receives all requests, verifies identity (auth), then routes to the right department",
    },
  },

  // ── 3. 컴퓨트 ──
  {
    id: "ec2",
    name: "EC2",
    group: "compute",
    badge: "aws",
    desc: {
      ko: "가상 서버. OS·사양을 직접 선택하고 완전한 제어권을 가진다.",
      en: "Virtual server. You choose the OS and specs with full control.",
    },
    placement: "vpc-private",
    placementNote: {
      ko: "보통 프라이빗 서브넷 배치. ALB를 통해 외부 트래픽 수신",
      en: "Usually placed in private subnet. Receives external traffic via ALB",
    },
    related: ["auto-scaling", "alb", "sg", "ebs"],
    analogy: {
      ko: "임대 사무실. 크기(사양)와 인테리어(OS)를 직접 골라 입주하고, 관리도 직접 한다",
      en: "A rented office. You choose the size (specs) and interior (OS), move in, and manage it yourself",
    },
  },
  {
    id: "auto-scaling",
    name: "Auto Scaling",
    group: "compute",
    badge: "aws",
    desc: {
      ko: "트래픽에 따라 EC2 인스턴스 수를 자동으로 늘리거나 줄이는 서비스.",
      en: "Automatically adjusts EC2 instance count based on traffic.",
    },
    placement: "account-level",
    related: ["ec2", "alb"],
    analogy: {
      ko: "유동적 사무실 배치. 직원(트래픽)이 많으면 사무실을 늘리고, 적으면 줄여서 임대료 절감",
      en: "Flexible office allocation. Opens more offices when staff (traffic) increases, closes them when quiet to save rent",
    },
  },
  {
    id: "lambda",
    name: "Lambda",
    group: "compute",
    badge: "aws",
    desc: {
      ko: "서버 없이 코드를 실행하는 서버리스 컴퓨팅. 실행한 만큼만 과금.",
      en: "Serverless computing — run code without servers. Pay only for execution time.",
    },
    placement: "regional-managed",
    placementNote: {
      ko: "VPC 밖에서 실행(VPC 연결 옵션도 있음). 이벤트 기반 트리거",
      en: "Runs outside VPC (VPC attachment optional). Event-driven triggers",
    },
    related: ["api-gateway", "sqs", "dynamodb", "s3"],
    analogy: {
      ko: "무인 자판기. 버튼(이벤트)을 누르면 음료(코드)가 나오고, 아무도 안 쓸 때는 유지비 0원",
      en: "An unmanned vending machine. Press a button (event) and a drink (code) comes out. Zero maintenance cost when idle",
    },
  },
  {
    id: "fargate",
    name: "Fargate",
    group: "compute",
    badge: "aws",
    desc: {
      ko: "서버 관리 없이 컨테이너를 실행하는 서버리스 컴퓨팅 엔진. ECS/EKS와 함께 사용.",
      en: "Serverless compute engine for containers — no server management. Used with ECS/EKS.",
    },
    placement: "vpc-private",
    related: ["ecs", "eks", "lambda"],
    analogy: {
      ko: "관리형 작업장. 건물 관리(서버)는 도시(AWS)가 하고, 나는 작업(컨테이너)에만 집중",
      en: "A managed workspace. The city (AWS) handles the building (server), you just focus on your work (containers)",
    },
  },

  // ── 4. 컨테이너 & K8s ──
  {
    id: "docker",
    name: "Docker",
    group: "container",
    badge: "docker",
    desc: {
      ko: "애플리케이션과 모든 의존성을 패키징하는 컨테이너 기술. 어디서든 동일하게 실행.",
      en: "Container technology that packages apps with all dependencies. Runs identically anywhere.",
    },
    placement: "concept",
    related: ["container", "ecs", "eks", "ecr"],
    analogy: {
      ko: "표준 규격 컨테이너 박스. 짐(코드+라이브러리)을 규격 박스에 넣으면 어떤 트럭(서버)에서든 바로 사용",
      en: "A standard shipping container. Pack your cargo (code+libraries) in a standard box and it works on any truck (server)",
    },
  },
  {
    id: "container",
    name: "Container",
    group: "container",
    badge: "docker",
    desc: {
      ko: "Docker 이미지를 실행한 인스턴스. 가볍고 빠르게 시작하며, 호스트 OS를 공유.",
      en: "A running instance of a Docker image. Lightweight, fast to start, shares host OS.",
    },
    placement: "concept",
    related: ["docker", "pod"],
    analogy: {
      ko: "컨테이너 박스를 열어 가동 중인 상태. 박스(이미지) 안의 물건을 꺼내 실제로 사용하고 있는 것",
      en: "A container box opened and running. The contents of the box (image) have been unpacked and are in active use",
    },
  },
  {
    id: "docker-image",
    name: "Docker Image",
    group: "container",
    badge: "docker",
    desc: {
      ko: "컨테이너를 만들기 위한 읽기 전용 템플릿. Dockerfile로 빌드하며, ECR 등 레지스트리에 저장.",
      en: "Read-only template for creating containers. Built from a Dockerfile and stored in registries like ECR.",
    },
    placement: "concept",
    related: ["docker", "container", "ecr", "dockerfile"],
    analogy: {
      ko: "프랜차이즈 매뉴얼. 이 매뉴얼(이미지)대로 가게(컨테이너)를 열면 어디서든 동일한 결과",
      en: "A franchise manual. Open a store (container) following this manual (image) and get identical results anywhere",
    },
  },
  {
    id: "dockerfile",
    name: "Dockerfile",
    group: "container",
    badge: "docker",
    desc: {
      ko: "Docker 이미지를 만드는 설정 파일. OS, 의존성, 실행 명령 등을 순서대로 정의.",
      en: "Configuration file for building Docker images. Defines OS, dependencies, and run commands in order.",
    },
    placement: "concept",
    related: ["docker", "docker-image", "multi-stage-build"],
    analogy: {
      ko: "프랜차이즈 매뉴얼 작성법. '인테리어 → 장비 설치 → 메뉴판 설정' 순서를 적은 설명서",
      en: "A franchise manual writing guide. Instructions listing steps in order: 'interior → equipment → menu setup'",
    },
  },
  {
    id: "multi-stage-build",
    name: "Multi-stage Build",
    group: "container",
    badge: "docker",
    desc: {
      ko: "Dockerfile을 여러 단계로 나누어 최종 이미지 크기를 줄이는 기법. 빌드 도구는 버리고 실행 파일만 복사.",
      en: "Technique splitting Dockerfile into stages to minimize final image size. Discards build tools, copies only binaries.",
    },
    placement: "concept",
    related: ["dockerfile", "docker-image", "ecr"],
    analogy: {
      ko: "공장에서 완성품만 출하. 제조 도구(빌드 도구)는 공장에 남기고 제품(실행 파일)만 가게로 배송",
      en: "Factory ships finished goods only. Manufacturing tools (build tools) stay in the factory; only products (binaries) are shipped to the store",
    },
  },
  {
    id: "docker-compose",
    name: "Docker Compose",
    group: "container",
    badge: "docker",
    desc: {
      ko: "여러 컨테이너를 YAML 파일 하나로 정의·실행하는 도구. 로컬 개발 환경 구성에 주로 사용.",
      en: "Tool to define and run multiple containers with a single YAML file. Mainly used for local development setup.",
    },
    placement: "concept",
    related: ["docker", "container", "ecs"],
    analogy: {
      ko: "복합 매장 세트 주문서. '카페 + 베이커리 + 꽃집'을 한 장(YAML)에 적으면 동시에 전부 오픈",
      en: "A combo store order form. Write 'cafe + bakery + flower shop' on one sheet (YAML) and open them all at once",
    },
  },
  {
    id: "container-registry",
    name: "Container Registry",
    group: "container",
    badge: "docker",
    desc: {
      ko: "Docker 이미지를 저장·배포하는 저장소. Docker Hub, ECR, GitHub Container Registry 등.",
      en: "Repository for storing and distributing Docker images. Docker Hub, ECR, GitHub Container Registry, etc.",
    },
    placement: "concept",
    related: ["docker-image", "ecr", "docker"],
    analogy: {
      ko: "매뉴얼 보관 창고. 만든 매뉴얼(이미지)을 등록해두고, 새 지점을 열 때 다운로드해서 사용",
      en: "A manual storage warehouse. Register your manuals (images) and download them when opening a new branch",
    },
  },
  {
    id: "sidecar",
    name: "Sidecar Container",
    group: "container",
    badge: "general",
    desc: {
      ko: "메인 컨테이너 옆에 붙어 보조 기능(로깅, 프록시, 모니터링 등)을 수행하는 컨테이너.",
      en: "A container running alongside the main one to provide auxiliary functions like logging, proxy, or monitoring.",
    },
    placement: "concept",
    related: ["pod", "istio", "xray", "fluent-bit"],
    analogy: {
      ko: "가게 옆에 붙은 보조 매장. 본 가게(메인 앱) 옆에서 배달 접수(로깅)나 보안 검사(프록시)를 담당",
      en: "An auxiliary shop attached to the main store. Handles delivery reception (logging) or security checks (proxy) next to the main store (app)",
    },
  },
  {
    id: "k8s",
    name: "Kubernetes (K8s)",
    group: "container",
    badge: "k8s",
    desc: {
      ko: "컨테이너 오케스트레이션 플랫폼. 수백~수천 개 컨테이너의 배포·확장·복구를 자동화.",
      en: "Container orchestration platform. Automates deployment, scaling, and recovery of hundreds of containers.",
    },
    placement: "concept",
    related: ["pod", "node", "eks", "helm"],
    analogy: {
      ko: "대형 프랜차이즈 본부. 수백 개 가게(컨테이너)의 오픈·확장·폐점·교체를 자동으로 관리",
      en: "A large franchise headquarters. Automatically manages opening, expanding, closing, and replacing hundreds of stores (containers)",
    },
  },
  {
    id: "pod",
    name: "Pod",
    group: "container",
    badge: "k8s",
    desc: {
      ko: "K8s에서 배포할 수 있는 가장 작은 단위. 하나 이상의 컨테이너를 묶은 것.",
      en: "Smallest deployable unit in K8s. Groups one or more containers together.",
    },
    placement: "concept",
    related: ["k8s", "node", "container"],
    analogy: {
      ko: "같은 건물에 입점한 가게 묶음. 주소(네트워크)와 창고(스토리지)를 공유하는 컨테이너 그룹",
      en: "A group of shops in the same building. Containers sharing an address (network) and warehouse (storage)",
    },
  },
  {
    id: "node",
    name: "Node",
    group: "container",
    badge: "k8s",
    desc: {
      ko: "K8s 클러스터에서 Pod가 실제로 실행되는 서버(물리 또는 가상).",
      en: "A server (physical or virtual) in a K8s cluster where Pods actually run.",
    },
    placement: "concept",
    related: ["k8s", "pod", "ec2"],
    analogy: {
      ko: "가게들이 입점한 건물. Pod(가게)들이 이 건물(Node) 안에서 실제로 운영된다",
      en: "A building where shops are located. Pods (shops) actually operate inside this building (Node)",
    },
  },
  {
    id: "helm",
    name: "Helm",
    group: "container",
    badge: "k8s",
    desc: {
      ko: "K8s 패키지 매니저. 복잡한 K8s 리소스를 하나의 차트(Chart)로 관리·배포.",
      en: "K8s package manager. Manages and deploys complex K8s resources as a single chart.",
    },
    placement: "concept",
    related: ["k8s", "eks"],
    analogy: {
      ko: "프랜차이즈 창업 패키지. 여러 구성요소(K8s 리소스)를 한 묶음으로 쉽게 설치·관리",
      en: "A franchise startup package. Easily installs and manages multiple components (K8s resources) as one bundle",
    },
  },
  {
    id: "ecs",
    name: "ECS",
    group: "container",
    badge: "aws",
    desc: {
      ko: "AWS의 컨테이너 오케스트레이션 서비스. K8s보다 단순하며 AWS 서비스와 긴밀히 통합.",
      en: "AWS container orchestration service. Simpler than K8s with tight AWS integration.",
    },
    placement: "vpc-private",
    related: ["fargate", "ecr", "alb", "eks"],
    analogy: {
      ko: "도시(AWS) 전용 가게 관리 시스템. 복잡한 프랜차이즈 본부(K8s) 대신 간편하게 가게를 관리",
      en: "The city's (AWS) own store management system. Manages stores simply instead of a complex franchise HQ (K8s)",
    },
  },
  {
    id: "eks",
    name: "EKS",
    group: "container",
    badge: "aws",
    desc: {
      ko: "AWS 관리형 K8s 서비스. K8s 컨트롤 플레인을 AWS가 관리.",
      en: "AWS managed K8s service. AWS manages the K8s control plane.",
    },
    placement: "vpc-private",
    placementNote: {
      ko: "컨트롤 플레인은 AWS 관리. 워커 노드는 프라이빗 서브넷",
      en: "Control plane managed by AWS. Worker nodes in private subnet",
    },
    related: ["k8s", "ecs", "fargate", "ecr"],
    analogy: {
      ko: "도시(AWS)에서 운영하는 프랜차이즈 본부. 관리 시스템(컨트롤 플레인)은 도시가 제공하고, 가게 운영은 내가 한다",
      en: "A franchise HQ operated by the city (AWS). The city provides the management system (control plane), you handle store operations",
    },
  },
  {
    id: "ecr",
    name: "ECR",
    group: "container",
    badge: "aws",
    desc: {
      ko: "AWS의 Docker 이미지 저장소. ECS/EKS에서 이미지를 가져다 쓸 수 있다.",
      en: "AWS Docker image registry. ECS/EKS pulls images from here.",
    },
    placement: "regional-managed",
    related: ["docker", "ecs", "eks"],
    analogy: {
      ko: "도시 공인 매뉴얼 보관소. 도시(AWS)가 운영하는 공식 이미지 저장소로, ECS/EKS에서 바로 사용",
      en: "The city's official manual storage. The official image registry run by the city (AWS), directly used by ECS/EKS",
    },
  },
  {
    id: "service-mesh",
    name: "Service Mesh",
    group: "container",
    badge: "general",
    desc: {
      ko: "마이크로서비스 간 통신을 관리하는 인프라 계층. 트래픽 제어·관측·보안을 서비스 코드 밖에서 처리.",
      en: "Infrastructure layer managing microservice communication. Handles traffic control, observability, and security outside app code.",
    },
    placement: "concept",
    related: ["k8s", "eks", "ecs"],
    analogy: {
      ko: "가게 간 내부 통신망. 가게(서비스)들 사이의 주문·배달을 자동으로 관리하고 기록하는 인프라",
      en: "An inter-store communication network. Infrastructure that auto-manages and records orders and deliveries between stores (services)",
    },
  },

  // ── 5. 데이터 ──
  {
    id: "rds",
    name: "RDS / Aurora",
    group: "data",
    badge: "aws",
    desc: {
      ko: "관리형 관계형 DB. MySQL, PostgreSQL 등. Aurora는 AWS 최적화 버전으로 최대 5배 성능.",
      en: "Managed relational DB. MySQL, PostgreSQL, etc. Aurora is AWS-optimized with up to 5x performance.",
    },
    placement: "vpc-isolated",
    placementNote: {
      ko: "격리 서브넷 배치. 인터넷 직접 접근 불가",
      en: "Placed in isolated subnet. No direct internet access",
    },
    related: ["dynamodb", "elasticache", "ec2"],
    analogy: {
      ko: "도시 공공 도서관. 행과 열(테이블)로 정리된 책(데이터)을 저장하고, 도시(AWS)가 관리·백업을 담당",
      en: "The city's public library. Stores books (data) organized in rows and columns (tables), with the city (AWS) handling management and backups",
    },
  },
  {
    id: "dynamodb",
    name: "DynamoDB",
    group: "data",
    badge: "aws",
    desc: {
      ko: "완전관리형 NoSQL DB. 밀리초 지연 시간, 무한 확장. 키-값 또는 문서 모델.",
      en: "Fully managed NoSQL DB. Millisecond latency, infinite scaling. Key-value or document model.",
    },
    placement: "regional-managed",
    placementNote: {
      ko: "VPC 밖 관리형 서비스. VPC Endpoint로 프라이빗 접근 가능",
      en: "Managed service outside VPC. Private access via VPC Endpoint",
    },
    related: ["rds", "lambda", "vpc-endpoint"],
    analogy: {
      ko: "초고속 물품 보관함. 번호(키)로 물건(값)을 넣고 빼며, 보관함은 무한히 늘어난다",
      en: "An ultra-fast locker system. Store and retrieve items (values) by number (key), with infinitely expandable lockers",
    },
  },
  {
    id: "elasticache",
    name: "ElastiCache",
    group: "data",
    badge: "aws",
    desc: {
      ko: "인메모리 캐시 서비스(Redis/Memcached). DB 앞에 두어 읽기 속도를 대폭 향상.",
      en: "In-memory cache (Redis/Memcached). Placed before DB to dramatically improve read speed.",
    },
    placement: "vpc-private",
    related: ["rds", "dynamodb"],
    analogy: {
      ko: "도서관 앞 즐겨찾기 게시판. 자주 찾는 책(데이터)을 미리 꺼내두어 매번 서고(DB)까지 안 가도 됨",
      en: "A favorites board in front of the library. Frequently requested books (data) are pre-staged so you don't have to go to the stacks (DB) every time",
    },
  },
  {
    id: "opensearch",
    name: "OpenSearch",
    group: "data",
    badge: "aws",
    desc: {
      ko: "검색·분석 엔진 서비스. 로그 분석, 전문 검색, 실시간 대시보드 구축에 사용.",
      en: "Search and analytics engine. Used for log analysis, full-text search, and real-time dashboards.",
    },
    placement: "vpc-private",
    related: ["elasticache", "kinesis"],
    analogy: {
      ko: "도시 검색 엔진. 수백만 건의 문서(데이터)에서 원하는 내용을 키워드로 순식간에 찾아주는 시스템",
      en: "The city search engine. Instantly finds what you need by keyword across millions of documents (data)",
    },
  },
  {
    id: "s3",
    name: "S3",
    group: "data",
    badge: "aws",
    desc: {
      ko: "무한 확장 오브젝트 스토리지. 파일, 이미지, 백업, 정적 웹사이트 호스팅까지.",
      en: "Infinitely scalable object storage. Files, images, backups, static website hosting.",
    },
    placement: "regional-managed",
    placementNote: {
      ko: "VPC 밖 글로벌 서비스. VPC Endpoint(Gateway)로 프라이빗 접근",
      en: "Global service outside VPC. Private access via VPC Endpoint (Gateway)",
    },
    related: ["cloudfront", "lambda", "vpc-endpoint"],
    analogy: {
      ko: "도시 무한 창고. 어떤 물건(파일)이든 넣으면 안전하게 보관해주고, 필요할 때 언제든 꺼내준다",
      en: "The city's infinite warehouse. Store anything (files) safely and retrieve whenever needed",
    },
  },
  {
    id: "ebs",
    name: "EBS",
    group: "data",
    badge: "aws",
    desc: {
      ko: "EC2에 붙이는 블록 스토리지(가상 하드디스크). 고성능 SSD부터 저비용 HDD까지.",
      en: "Block storage (virtual hard disk) attached to EC2. From high-performance SSD to low-cost HDD.",
    },
    placement: "vpc-private",
    related: ["ec2", "efs"],
    analogy: {
      ko: "건물에 붙인 개인 창고. 사무실(EC2)에 직접 연결된 전용 저장 공간",
      en: "A private storage unit attached to a building. Dedicated storage space directly connected to your office (EC2)",
    },
  },
  {
    id: "efs",
    name: "EFS",
    group: "data",
    badge: "aws",
    desc: {
      ko: "여러 EC2/컨테이너에서 동시에 접근 가능한 공유 파일 시스템. NFS 프로토콜.",
      en: "Shared file system accessible by multiple EC2/containers simultaneously. NFS protocol.",
    },
    placement: "vpc-private",
    related: ["ec2", "ebs", "ecs"],
    analogy: {
      ko: "도시 공용 파일 캐비넷. 여러 사무실(서버)에서 동시에 같은 서류를 열람·수정할 수 있다",
      en: "The city's shared file cabinet. Multiple offices (servers) can simultaneously read and write the same documents",
    },
  },

  // ── 6. 통합 & 메시징 ──
  {
    id: "sqs",
    name: "SQS",
    group: "integration",
    badge: "aws",
    desc: {
      ko: "완전관리형 메시지 큐. 서비스 간 비동기 통신을 안정적으로 처리.",
      en: "Fully managed message queue. Handles async communication between services reliably.",
    },
    placement: "regional-managed",
    related: ["sns", "lambda", "eventbridge"],
    analogy: {
      ko: "도시 택배 대기열. 주문(메시지)을 접수하면 대기열에 넣고 배달부가 순서대로 처리",
      en: "The city's delivery queue. Orders (messages) are received, queued, and processed in order by delivery staff",
    },
  },
  {
    id: "sns",
    name: "SNS",
    group: "integration",
    badge: "aws",
    desc: {
      ko: "Pub/Sub 메시징 서비스. 하나의 메시지를 여러 구독자(SQS, Lambda, 이메일 등)에 동시 전달.",
      en: "Pub/Sub messaging. Delivers one message to multiple subscribers (SQS, Lambda, email, etc.).",
    },
    placement: "regional-managed",
    related: ["sqs", "lambda", "eventbridge"],
    analogy: {
      ko: "도시 방송 시스템. 한 번 방송하면 모든 구역(구독자)이 동시에 들을 수 있다",
      en: "The city PA system. One broadcast is heard by all districts (subscribers) at the same time",
    },
  },
  {
    id: "eventbridge",
    name: "EventBridge",
    group: "integration",
    badge: "aws",
    desc: {
      ko: "서버리스 이벤트 버스. 이벤트 규칙으로 AWS 서비스/SaaS/커스텀 앱을 연결.",
      en: "Serverless event bus. Connects AWS services, SaaS, and custom apps via event rules.",
    },
    placement: "regional-managed",
    related: ["sqs", "sns", "lambda", "step-functions"],
    analogy: {
      ko: "도시 우편 분류 센터. 편지(이벤트)의 주소(규칙)를 읽고 적절한 목적지로 자동 배달",
      en: "The city mail sorting center. Reads the address (rules) on letters (events) and auto-delivers to the right destination",
    },
  },
  {
    id: "kinesis",
    name: "Kinesis",
    group: "integration",
    badge: "aws",
    desc: {
      ko: "실시간 데이터 스트리밍 서비스. 대량의 로그·이벤트 데이터를 실시간으로 수집·처리.",
      en: "Real-time data streaming. Collects and processes massive log/event data in real time.",
    },
    placement: "regional-managed",
    related: ["lambda", "opensearch", "s3"],
    analogy: {
      ko: "도시 컨베이어 벨트 시스템. 끊임없이 들어오는 물건(데이터)을 실시간으로 운반·분류",
      en: "The city conveyor belt system. Continuously transports and sorts incoming items (data) in real time",
    },
  },
  {
    id: "step-functions",
    name: "Step Functions",
    group: "integration",
    badge: "aws",
    desc: {
      ko: "서버리스 워크플로 오케스트레이션. 여러 Lambda/서비스를 시각적으로 연결·조율.",
      en: "Serverless workflow orchestration. Visually connects and coordinates multiple Lambda/services.",
    },
    placement: "regional-managed",
    related: ["lambda", "sqs", "eventbridge"],
    analogy: {
      ko: "도시 업무 자동화 시스템. '서류 접수 → 심사 → 승인' 각 단계를 순서대로 자동 실행하는 워크플로",
      en: "The city workflow automation system. Auto-executes steps in order: 'receive documents → review → approve'",
    },
  },
  {
    id: "msk",
    name: "MSK (Kafka)",
    group: "integration",
    badge: "aws",
    desc: {
      ko: "관리형 Apache Kafka 서비스. 대규모 실시간 이벤트 스트리밍에 사용.",
      en: "Managed Apache Kafka. Used for large-scale real-time event streaming.",
    },
    placement: "vpc-private",
    related: ["kinesis", "sqs"],
    analogy: {
      ko: "도시 대형 물류 허브. Kinesis(소형 컨베이어)보다 더 대규모·복잡한 이벤트 물류 처리에 적합",
      en: "The city's major logistics hub. Better suited for larger, more complex event logistics than Kinesis (small conveyor)",
    },
  },

  // ── 7. 보안 & 인증 ──
  {
    id: "iam",
    name: "IAM",
    group: "security",
    badge: "aws",
    desc: {
      ko: "AWS 리소스 접근 권한을 관리. 사용자, 역할, 정책으로 '누가 무엇을 할 수 있는지' 제어.",
      en: "Manages access to AWS resources. Controls 'who can do what' via users, roles, and policies.",
    },
    placement: "account-level",
    related: ["cognito", "kms"],
    analogy: {
      ko: "도시 출입증 관리 본부. 부서(역할)에 따라 어떤 시설(리소스)에 출입할 수 있는지 통제",
      en: "The city's access badge headquarters. Controls which facilities (resources) you can enter based on your department (role)",
    },
  },
  {
    id: "kms",
    name: "KMS",
    group: "security",
    badge: "aws",
    desc: {
      ko: "암호화 키 관리 서비스. 데이터 암호화에 쓰는 키를 안전하게 생성·관리·교체.",
      en: "Encryption key management. Securely creates, manages, and rotates keys for data encryption.",
    },
    placement: "account-level",
    related: ["iam", "s3", "rds", "secrets-manager"],
    analogy: {
      ko: "도시 금고 열쇠 관리소. 모든 금고(암호화된 데이터)의 열쇠를 안전하게 보관·교체",
      en: "The city's vault key management office. Securely stores and rotates keys for all vaults (encrypted data)",
    },
  },
  {
    id: "cognito",
    name: "Cognito",
    group: "security",
    badge: "aws",
    desc: {
      ko: "사용자 인증·권한 부여 서비스. 회원가입, 로그인, 소셜 로그인, MFA 지원.",
      en: "User authentication and authorization. Sign-up, login, social login, and MFA support.",
    },
    placement: "regional-managed",
    related: ["iam", "api-gateway", "alb"],
    analogy: {
      ko: "도시 주민등록 센터. 회원가입, 로그인, 신분증(MFA) 발급 등 주민(사용자) 인증을 관리",
      en: "The city's resident registration center. Manages citizen (user) authentication — sign-up, login, ID cards (MFA)",
    },
  },
  {
    id: "guardduty",
    name: "GuardDuty",
    group: "security",
    badge: "aws",
    desc: {
      ko: "위협 탐지 서비스. AWS 계정과 워크로드에서 악의적 활동·비정상 행동을 자동 감지.",
      en: "Threat detection. Automatically detects malicious activity and anomalous behavior in AWS accounts.",
    },
    placement: "account-level",
    related: ["cloudtrail", "iam"],
    analogy: {
      ko: "도시 AI CCTV 시스템. 도시 곳곳을 모니터링하다 수상한 행동이 감지되면 자동으로 알림",
      en: "The city's AI CCTV system. Monitors everywhere and auto-alerts when suspicious behavior is detected",
    },
  },
  {
    id: "acm",
    name: "ACM",
    group: "security",
    badge: "aws",
    desc: {
      ko: "SSL/TLS 인증서 무료 발급·관리. CloudFront, ALB 등에 HTTPS를 적용할 때 사용.",
      en: "Free SSL/TLS certificate provisioning and management. Used for HTTPS on CloudFront, ALB, etc.",
    },
    placement: "account-level",
    related: ["cloudfront", "alb"],
    analogy: {
      ko: "사업자 등록증 발급소. 이 가게(사이트)가 진짜임을 증명하는 인증서를 무료로 발급·갱신",
      en: "A business license bureau. Issues and renews certificates proving this store (site) is legitimate, for free",
    },
  },
  {
    id: "secrets-manager",
    name: "Secrets Manager",
    group: "security",
    badge: "aws",
    desc: {
      ko: "비밀번호, API 키, DB 자격증명 등 민감 정보를 안전하게 저장·자동 교체.",
      en: "Securely stores and auto-rotates passwords, API keys, DB credentials, and other secrets.",
    },
    placement: "account-level",
    related: ["kms", "rds", "iam"],
    analogy: {
      ko: "비밀번호 관리 금고. 모든 비밀번호·API 키를 안전하게 보관하고 주기적으로 자동 교체",
      en: "A password management vault. Securely stores all passwords and API keys, auto-rotating them periodically",
    },
  },
  {
    id: "cloudtrail",
    name: "CloudTrail",
    group: "security",
    badge: "aws",
    desc: {
      ko: "AWS 계정의 모든 API 호출을 기록. '누가, 언제, 무엇을' 했는지 감사 추적.",
      en: "Records all API calls in your AWS account. Audit trail of 'who, when, what'.",
    },
    placement: "account-level",
    related: ["guardduty", "s3", "cloudwatch"],
    analogy: {
      ko: "도시 출입 기록 시스템. 누가 언제 어디를 방문(API 호출)했는지 전부 기록하는 감사 추적",
      en: "The city's access log system. Records who visited (API called) where and when — a complete audit trail",
    },
  },

  // ── 8. CI/CD & 모니터링 ──
  {
    id: "cicd",
    name: "CI/CD",
    group: "cicd",
    badge: "general",
    desc: {
      ko: "코드 변경 시 자동으로 빌드·테스트·배포하는 파이프라인. 수동 배포 실수를 줄이고 배포 속도를 높임.",
      en: "Pipeline that auto-builds, tests, and deploys on code changes. Reduces manual errors and speeds up delivery.",
    },
    placement: "concept",
    related: ["codepipeline", "blue-green", "canary"],
    analogy: {
      ko: "도시 자동 건설 라인. 설계(코드) → 검수(테스트) → 시공(배포)을 자동화하는 파이프라인",
      en: "The city's automated construction line. A pipeline automating design (code) → inspection (test) → construction (deploy)",
    },
  },
  {
    id: "blue-green",
    name: "Blue/Green 배포",
    group: "cicd",
    badge: "general",
    desc: {
      ko: "현재 환경(Blue)과 새 환경(Green)을 동시 운영 후 트래픽을 한 번에 전환하는 배포 전략.",
      en: "Deployment strategy running current (Blue) and new (Green) environments, then switching traffic at once.",
    },
    placement: "concept",
    related: ["canary", "rolling", "cicd"],
    analogy: {
      ko: "건물 교체 공사. 새 건물(Green)을 완벽히 지은 뒤, 입주자를 한 번에 이동시키는 무중단 교체",
      en: "A building replacement project. Build the new building (Green) completely, then move all occupants at once — zero downtime",
    },
  },
  {
    id: "canary",
    name: "Canary 배포",
    group: "cicd",
    badge: "general",
    desc: {
      ko: "새 버전을 소수 사용자에게만 먼저 배포하여 문제를 확인한 뒤 점진적으로 확대하는 전략.",
      en: "Deploys new version to a small subset of users first, then gradually expands after verification.",
    },
    placement: "concept",
    related: ["blue-green", "rolling", "cicd"],
    analogy: {
      ko: "시범 오픈. 전체 오픈 전에 소수 고객에게 먼저 서비스해보고 반응을 확인한 뒤 점진적 확대",
      en: "A soft opening. Serve a few customers first before the grand opening, check reactions, then gradually expand",
    },
  },
  {
    id: "rolling",
    name: "Rolling 배포",
    group: "cicd",
    badge: "general",
    desc: {
      ko: "서버를 하나씩 순차적으로 새 버전으로 교체하는 배포 전략. 다운타임 없이 점진 교체.",
      en: "Deployment strategy replacing servers one by one with the new version. Zero downtime gradual update.",
    },
    placement: "concept",
    related: ["blue-green", "canary", "cicd"],
    analogy: {
      ko: "순차 리모델링. 100개 사무실을 한 번에 닫지 않고, 하나씩 차례로 새것으로 교체하는 무중단 방식",
      en: "Sequential renovation. Instead of closing all 100 offices at once, renovate them one at a time — zero downtime",
    },
  },
  {
    id: "codepipeline",
    name: "CodePipeline",
    group: "cicd",
    badge: "aws",
    desc: {
      ko: "AWS의 CI/CD 파이프라인 서비스. 소스→빌드→테스트→배포를 자동화.",
      en: "AWS CI/CD pipeline service. Automates source → build → test → deploy.",
    },
    placement: "account-level",
    related: ["cicd", "ecs", "eks", "lambda"],
    analogy: {
      ko: "도시 공사 자동화 시스템. 설계(코드) → 자재 조달(빌드) → 검수(테스트) → 시공(배포)을 전자동 처리",
      en: "The city's construction automation. Fully automates design (code) → materials (build) → inspection (test) → construction (deploy)",
    },
  },
  {
    id: "cloudwatch",
    name: "CloudWatch",
    group: "cicd",
    badge: "aws",
    desc: {
      ko: "AWS 리소스 모니터링 서비스. 지표(CPU, 메모리), 로그 수집, 알람 설정 통합 플랫폼.",
      en: "AWS resource monitoring. Unified platform for metrics (CPU, memory), log collection, and alarms.",
    },
    placement: "account-level",
    related: ["xray", "ec2", "lambda", "ecs"],
    analogy: {
      ko: "도시 관제 모니터실. 전기·수도·교통(CPU·메모리·네트워크)을 실시간 모니터링하고 이상 시 알림",
      en: "The city control room. Real-time monitoring of power, water, traffic (CPU, memory, network) with alerts on anomalies",
    },
  },
  {
    id: "xray",
    name: "X-Ray",
    group: "cicd",
    badge: "aws",
    desc: {
      ko: "분산 추적 서비스. 마이크로서비스 간 요청 흐름을 추적하여 병목·오류 지점을 찾아냄.",
      en: "Distributed tracing service. Traces request flows across microservices to find bottlenecks and errors.",
    },
    placement: "account-level",
    related: ["cloudwatch", "lambda", "api-gateway"],
    analogy: {
      ko: "택배 추적 시스템. 물건(요청)이 어느 거점(서비스)에서 멈추거나 지연되는지 경로를 추적",
      en: "A package tracking system. Traces the route of items (requests) to find where they stall or get delayed",
    },
  },
  {
    id: "iac",
    name: "IaC",
    group: "cicd",
    badge: "general",
    desc: {
      ko: "Infrastructure as Code. 인프라를 코드로 정의·관리. 수동 콘솔 조작 대신 코드로 인프라를 재현 가능.",
      en: "Infrastructure as Code. Define and manage infrastructure via code instead of manual console operations.",
    },
    placement: "concept",
    related: ["cdk", "terraform", "codepipeline"],
    analogy: {
      ko: "도시 건축 도면. 도면(코드)대로 건물(인프라)을 정확히 재현할 수 있어 수작업 실수를 방지",
      en: "City architecture blueprints. Build the exact same building (infrastructure) from the blueprint (code), preventing manual errors",
    },
  },
  {
    id: "cdk",
    name: "CDK",
    group: "cicd",
    badge: "aws",
    desc: {
      ko: "AWS Cloud Development Kit. TypeScript, Python 등 프로그래밍 언어로 인프라를 정의.",
      en: "AWS Cloud Development Kit. Define infrastructure using programming languages like TypeScript, Python.",
    },
    placement: "concept",
    related: ["iac", "terraform", "codepipeline"],
    analogy: {
      ko: "프로그래밍 가능한 레고 블록. 코드(TypeScript/Python)로 도시 블록(AWS 리소스)을 조립하는 IaC 도구",
      en: "Programmable LEGO blocks. An IaC tool that assembles city blocks (AWS resources) with code (TypeScript/Python)",
    },
  },
  {
    id: "terraform",
    name: "Terraform",
    group: "cicd",
    badge: "general",
    desc: {
      ko: "HashiCorp의 IaC 도구. AWS뿐 아니라 GCP, Azure 등 멀티 클라우드 인프라를 코드로 관리.",
      en: "HashiCorp's IaC tool. Manages multi-cloud infrastructure (AWS, GCP, Azure) as code.",
    },
    placement: "concept",
    related: ["iac", "cdk"],
    analogy: {
      ko: "만능 건축 도면. AWS뿐 아니라 어떤 도시(클라우드)든 같은 형식의 도면으로 건설 가능",
      en: "Universal blueprints. Design any city (cloud) — not just AWS — using the same format",
    },
  },

  // ── 추가: 네트워킹 ──
  {
    id: "vpc-peering",
    name: "VPC Peering",
    group: "networking",
    badge: "aws",
    desc: {
      ko: "두 VPC를 프라이빗하게 연결. 인터넷을 거치지 않고 VPC 간 직접 통신.",
      en: "Privately connects two VPCs. Direct communication between VPCs without going through the internet.",
    },
    placement: "account-level",
    related: ["vpc", "transit-gw"],
    analogy: {
      ko: "두 도시를 잇는 전용 다리. 외부 도로(인터넷)를 거치지 않고 두 도시가 직접 연결",
      en: "A dedicated bridge between two cities. Direct connection without going through external roads (internet)",
    },
  },
  {
    id: "transit-gw",
    name: "Transit Gateway",
    group: "networking",
    badge: "aws",
    desc: {
      ko: "여러 VPC와 온프레미스 네트워크를 중앙 허브로 연결. VPC Peering의 확장판.",
      en: "Connects multiple VPCs and on-premises networks via a central hub. Scalable alternative to VPC Peering.",
    },
    placement: "account-level",
    related: ["vpc", "vpc-peering", "direct-connect", "site-to-site-vpn"],
    analogy: {
      ko: "중앙 교통 허브. 여러 도시(VPC)가 이 허브 하나를 통해 서로 연결되는 환승 터미널",
      en: "A central transit hub. Multiple cities (VPCs) connect to each other through this single transfer terminal",
    },
  },
  {
    id: "direct-connect",
    name: "Direct Connect",
    group: "networking",
    badge: "aws",
    desc: {
      ko: "온프레미스 데이터센터와 AWS를 전용 회선으로 연결. 인터넷보다 안정적이고 빠르다.",
      en: "Dedicated private connection from on-premises data center to AWS. More stable and faster than internet.",
    },
    placement: "account-level",
    related: ["transit-gw", "site-to-site-vpn", "vpc"],
    analogy: {
      ko: "전용 고속도로. 회사 본사(온프레미스)에서 도시(AWS)까지 나만 쓰는 직통 도로",
      en: "A private highway. Your own dedicated road from company HQ (on-premises) directly to the city (AWS)",
    },
  },
  {
    id: "site-to-site-vpn",
    name: "Site-to-Site VPN",
    group: "networking",
    badge: "aws",
    desc: {
      ko: "온프레미스와 AWS VPC를 암호화된 VPN 터널로 연결. Direct Connect보다 저렴한 대안.",
      en: "Connects on-premises to AWS VPC via encrypted VPN tunnel. Cheaper alternative to Direct Connect.",
    },
    placement: "account-level",
    related: ["direct-connect", "transit-gw", "vpc"],
    analogy: {
      ko: "암호화된 지하 터널. 일반 도로(인터넷) 아래에 비밀 통로를 만들어 안전하게 통신",
      en: "An encrypted underground tunnel. Creates a secret passage under public roads (internet) for secure communication",
    },
  },
  {
    id: "vpc-flow-logs",
    name: "VPC Flow Logs",
    group: "networking",
    badge: "aws",
    desc: {
      ko: "VPC 네트워크 인터페이스의 IP 트래픽 로그를 수집. 보안 분석·트러블슈팅에 사용.",
      en: "Captures IP traffic logs from VPC network interfaces. Used for security analysis and troubleshooting.",
    },
    placement: "account-level",
    related: ["vpc", "cloudwatch", "s3"],
    analogy: {
      ko: "도시 CCTV 녹화 시스템. 어떤 차(패킷)가 언제 어디를 지나갔는지 전부 녹화·기록",
      en: "The city's CCTV recording system. Records which car (packet) passed where and when — everything captured",
    },
  },
  {
    id: "privatelink",
    name: "PrivateLink",
    group: "networking",
    badge: "aws",
    desc: {
      ko: "AWS 서비스나 다른 계정의 서비스에 프라이빗하게 접근하는 기술. VPC Endpoint의 기반 기술.",
      en: "Technology for private access to AWS or third-party services. The foundation of VPC Endpoints.",
    },
    placement: "vpc-private",
    related: ["vpc-endpoint", "vpc"],
    analogy: {
      ko: "건물 사이 지하 연결 통로. 밖에 나가지 않고 지하로 다른 건물(서비스)에 직접 접근",
      en: "An underground passage between buildings. Access other buildings (services) directly via underground without going outside",
    },
  },
  {
    id: "global-accelerator",
    name: "Global Accelerator",
    group: "networking",
    badge: "aws",
    desc: {
      ko: "AWS 글로벌 네트워크를 활용해 사용자 트래픽을 최적 경로로 전달. 고정 IP와 빠른 장애 조치.",
      en: "Routes user traffic via AWS global network for optimal paths. Fixed IPs and fast failover.",
    },
    placement: "edge",
    related: ["alb", "nlb", "cloudfront"],
    analogy: {
      ko: "VIP 전용 고속도로. 일반 도로(인터넷) 대신 도시 전용 네트워크로 빠르게 이동",
      en: "A VIP express highway. Travel via the city's private network instead of public roads (internet)",
    },
  },

  // ── 추가: 트래픽 진입 ──
  {
    id: "cloudfront-functions",
    name: "CloudFront Functions",
    group: "traffic",
    badge: "aws",
    desc: {
      ko: "CloudFront 엣지에서 실행되는 초경량 함수. URL 재작성, 헤더 조작 등 간단한 로직 처리.",
      en: "Lightweight functions running at CloudFront edge. Handles simple logic like URL rewrites and header manipulation.",
    },
    placement: "edge",
    related: ["cloudfront", "lambda-edge"],
    analogy: {
      ko: "도시 입구 간이 서비스 창구. 간단한 안내(URL 변환, 헤더 수정)만 빠르게 처리하는 경량 서비스",
      en: "A quick service kiosk at the city entrance. A lightweight service handling only simple tasks (URL rewrite, header changes) at speed",
    },
  },
  {
    id: "lambda-edge",
    name: "Lambda@Edge",
    group: "traffic",
    badge: "aws",
    desc: {
      ko: "CloudFront 엣지에서 Lambda 함수를 실행. CloudFront Functions보다 복잡한 로직 처리 가능.",
      en: "Runs Lambda functions at CloudFront edge locations. Handles more complex logic than CloudFront Functions.",
    },
    placement: "edge",
    related: ["cloudfront", "lambda", "cloudfront-functions"],
    analogy: {
      ko: "각 지점에 파견된 전문 직원. 본사(리전)까지 가지 않고 현장(엣지)에서 복잡한 업무를 처리",
      en: "Specialist staff deployed to each branch. Handles complex work on-site (edge) without going to headquarters (region)",
    },
  },

  // ── 추가: 컴퓨트 ──
  {
    id: "graviton",
    name: "Graviton",
    group: "compute",
    badge: "aws",
    desc: {
      ko: "AWS가 자체 설계한 ARM 기반 프로세서. x86 대비 최대 40% 가성비 향상.",
      en: "AWS-designed ARM-based processor. Up to 40% better price-performance vs x86.",
    },
    placement: "vpc-private",
    related: ["ec2", "fargate", "lambda"],
    analogy: {
      ko: "연비 좋은 하이브리드 차. 같은 거리(성능)를 더 적은 연료(비용)로 달리는 고효율 엔진",
      en: "A fuel-efficient hybrid car. Covers the same distance (performance) with less fuel (cost) — a high-efficiency engine",
    },
  },
  {
    id: "spot-instance",
    name: "Spot Instance",
    group: "compute",
    badge: "aws",
    desc: {
      ko: "AWS의 여유 컴퓨팅 용량을 최대 90% 할인된 가격에 사용. 단, 2분 전 통보로 회수될 수 있음.",
      en: "Use AWS spare capacity at up to 90% discount. Can be reclaimed with 2-minute notice.",
    },
    placement: "vpc-private",
    related: ["ec2", "auto-scaling", "fargate"],
    analogy: {
      ko: "땡처리 항공편. 매우 저렴하지만 2분 전 통보로 갑자기 취소될 수 있는 좌석",
      en: "A last-minute flight deal. Very cheap but could be cancelled with just 2 minutes' notice",
    },
  },

  // ── 추가: 컨테이너 & K8s ──
  {
    id: "karpenter",
    name: "Karpenter",
    group: "container",
    badge: "k8s",
    desc: {
      ko: "K8s 노드를 자동으로 프로비저닝하는 오토스케일러. Cluster Autoscaler보다 빠르고 유연.",
      en: "Auto-provisions K8s nodes. Faster and more flexible than Cluster Autoscaler.",
    },
    placement: "concept",
    related: ["eks", "node", "auto-scaling"],
    analogy: {
      ko: "스마트 건물 배정 시스템. 새 가게(Pod)가 오면 즉시 최적의 건물(노드)을 자동 할당",
      en: "A smart building assignment system. Instantly assigns the best building (node) when a new shop (Pod) arrives",
    },
  },
  {
    id: "argocd",
    name: "ArgoCD",
    group: "container",
    badge: "k8s",
    desc: {
      ko: "K8s용 GitOps CD 도구. Git 저장소의 상태를 클러스터에 자동 동기화.",
      en: "GitOps CD tool for K8s. Auto-syncs Git repository state to the cluster.",
    },
    placement: "concept",
    related: ["eks", "helm", "flux"],
    analogy: {
      ko: "자동 리모델링 시스템. 설계도(Git)가 바뀌면 가게(클러스터)를 자동으로 업데이트",
      en: "An auto-remodeling system. When blueprints (Git) change, stores (clusters) are automatically updated",
    },
  },
  {
    id: "flux",
    name: "Flux v2",
    group: "container",
    badge: "k8s",
    desc: {
      ko: "CNCF 공식 GitOps 도구. Git 상태를 K8s 클러스터에 지속적으로 동기화.",
      en: "CNCF official GitOps tool. Continuously syncs Git state to K8s clusters.",
    },
    placement: "concept",
    related: ["eks", "argocd", "helm"],
    analogy: {
      ko: "ArgoCD의 경량 대안. 같은 자동 업데이트(GitOps)지만 관리 화면 없이 더 가볍게 동작",
      en: "A lightweight alternative to ArgoCD. Same auto-updates (GitOps) but runs lighter without a management UI",
    },
  },
  {
    id: "istio",
    name: "Istio",
    group: "container",
    badge: "k8s",
    desc: {
      ko: "가장 대표적인 서비스 메시. Envoy 사이드카로 트래픽 제어·관측·보안을 자동 처리.",
      en: "The most popular service mesh. Uses Envoy sidecars for automatic traffic control, observability, and security.",
    },
    placement: "concept",
    related: ["service-mesh", "eks", "k8s"],
    analogy: {
      ko: "도시 교통 관제 센터. 모든 도로(서비스 통신)에 교통경찰(Envoy 사이드카)을 배치해 제어·기록",
      en: "The city traffic control center. Places traffic cops (Envoy sidecars) on every road (service communication) for control and logging",
    },
  },
  {
    id: "keda",
    name: "KEDA",
    group: "container",
    badge: "k8s",
    desc: {
      ko: "이벤트 기반 K8s 오토스케일러. SQS 큐 길이, Kafka 랙 등 외부 메트릭으로 Pod 스케일링.",
      en: "Event-driven K8s autoscaler. Scales Pods based on external metrics like SQS queue length or Kafka lag.",
    },
    placement: "concept",
    related: ["k8s", "sqs", "msk"],
    analogy: {
      ko: "주문량 연동 직원 배치. 주문(이벤트)이 밀리면 직원(Pod)을 자동으로 추가 투입",
      en: "Order-driven staff scheduling. When orders (events) pile up, staff (Pods) are automatically deployed",
    },
  },
  {
    id: "ingress-controller",
    name: "Ingress Controller",
    group: "container",
    badge: "k8s",
    desc: {
      ko: "K8s 클러스터로 들어오는 외부 HTTP 트래픽을 관리. ALB, NGINX, Kong 등 구현체 선택.",
      en: "Manages external HTTP traffic entering K8s cluster. Choose from ALB, NGINX, Kong, etc.",
    },
    placement: "concept",
    related: ["alb", "eks", "k8s"],
    analogy: {
      ko: "도시 입구 안내소. 외부 방문자(HTTP 요청)를 확인하고 적절한 가게(서비스)로 안내",
      en: "The city entrance reception. Checks external visitors (HTTP requests) and directs them to the right shop (service)",
    },
  },
  {
    id: "cert-manager",
    name: "cert-manager",
    group: "container",
    badge: "k8s",
    desc: {
      ko: "K8s에서 TLS 인증서를 자동으로 발급·갱신하는 도구. Let's Encrypt 등과 연동.",
      en: "Automatically provisions and renews TLS certificates in K8s. Integrates with Let's Encrypt, etc.",
    },
    placement: "concept",
    related: ["acm", "eks", "ingress-controller"],
    analogy: {
      ko: "자동 인증서 발급소. 사업자등록증(TLS 인증서)이 만료되기 전에 알아서 새것으로 교체",
      en: "An automatic certificate bureau. Auto-replaces business licenses (TLS certificates) before they expire",
    },
  },
  {
    id: "external-secrets",
    name: "External Secrets Operator",
    group: "container",
    badge: "k8s",
    desc: {
      ko: "AWS Secrets Manager 등 외부 비밀 저장소의 값을 K8s Secret으로 자동 동기화.",
      en: "Auto-syncs secrets from external stores (AWS Secrets Manager, etc.) into K8s Secrets.",
    },
    placement: "concept",
    related: ["secrets-manager", "eks", "kms"],
    analogy: {
      ko: "비밀 금고 배달 서비스. 중앙 금고(Secrets Manager)에서 필요한 비밀번호를 가게(Pod)로 자동 배달",
      en: "A vault delivery service. Auto-delivers needed passwords from the central vault (Secrets Manager) to shops (Pods)",
    },
  },
  {
    id: "velero",
    name: "Velero",
    group: "container",
    badge: "k8s",
    desc: {
      ko: "K8s 클러스터의 리소스와 볼륨을 백업·복원하는 도구. 재해 복구 및 마이그레이션에 사용.",
      en: "Backs up and restores K8s cluster resources and volumes. Used for disaster recovery and migration.",
    },
    placement: "concept",
    related: ["eks", "s3", "ebs"],
    analogy: {
      ko: "가게 타임머신. 문제가 생기면 이전 시점의 상태로 모든 가게(클러스터)를 되돌릴 수 있다",
      en: "A store time machine. If something goes wrong, roll back all stores (cluster) to a previous point in time",
    },
  },
  {
    id: "prometheus",
    name: "Prometheus",
    group: "container",
    badge: "k8s",
    desc: {
      ko: "오픈소스 모니터링 시스템. K8s 환경에서 메트릭 수집·알림의 사실상 표준.",
      en: "Open-source monitoring system. De facto standard for metric collection and alerting in K8s.",
    },
    placement: "concept",
    related: ["grafana", "cloudwatch", "eks"],
    analogy: {
      ko: "도시 건강 측정 센터. 모든 건물(서버)의 온도·습도·전력(메트릭)을 지속적으로 측정·기록",
      en: "The city health measurement center. Continuously measures and records every building's (server's) temperature, humidity, and power (metrics)",
    },
  },
  {
    id: "grafana",
    name: "Grafana",
    group: "container",
    badge: "k8s",
    desc: {
      ko: "메트릭·로그 시각화 대시보드. Prometheus, CloudWatch 등 다양한 데이터 소스를 그래프로 표시.",
      en: "Metric and log visualization dashboard. Displays data from Prometheus, CloudWatch, etc. as graphs.",
    },
    placement: "concept",
    related: ["prometheus", "loki", "cloudwatch"],
    analogy: {
      ko: "도시 현황 대시보드. Prometheus가 측정한 데이터를 그래프·차트로 한눈에 보여주는 모니터",
      en: "The city status dashboard. Displays Prometheus measurements as graphs and charts for at-a-glance monitoring",
    },
  },
  {
    id: "loki",
    name: "Loki",
    group: "container",
    badge: "k8s",
    desc: {
      ko: "경량 로그 수집 시스템. Grafana와 연동하여 K8s 로그를 효율적으로 검색·분석.",
      en: "Lightweight log aggregation system. Works with Grafana for efficient K8s log search and analysis.",
    },
    placement: "concept",
    related: ["grafana", "fluent-bit", "cloudwatch"],
    analogy: {
      ko: "도시 일지 검색 시스템. 방대한 운영 일지(로그)에서 원하는 날짜·키워드를 빠르게 검색",
      en: "The city log search system. Quickly searches for specific dates and keywords in massive operation logs",
    },
  },
  {
    id: "fluent-bit",
    name: "Fluent Bit",
    group: "container",
    badge: "k8s",
    desc: {
      ko: "초경량 로그 수집·전달 에이전트. 컨테이너 로그를 CloudWatch, Loki 등으로 전송.",
      en: "Ultra-lightweight log collection agent. Ships container logs to CloudWatch, Loki, etc.",
    },
    placement: "concept",
    related: ["loki", "cloudwatch", "eks"],
    analogy: {
      ko: "건물별 일지 수거원. 각 건물(컨테이너)의 운영 일지(로그)를 수거해서 보관소(저장소)로 배달",
      en: "A building-by-building log collector. Picks up operation logs from each building (container) and delivers to the archive (storage)",
    },
  },
  {
    id: "kyverno",
    name: "Kyverno",
    group: "container",
    badge: "k8s",
    desc: {
      ko: "K8s 정책 엔진. Pod 보안 정책, 리소스 제한 등을 YAML로 선언적 관리.",
      en: "K8s policy engine. Declaratively manages pod security policies, resource limits, etc. via YAML.",
    },
    placement: "concept",
    related: ["eks", "k8s"],
    analogy: {
      ko: "도시 건축 규정 관리. '이 구역에는 3층 이상 건물 불가' 같은 정책을 자동으로 적용·검사",
      en: "City building code enforcement. Auto-applies and inspects policies like 'no buildings over 3 stories in this zone'",
    },
  },
  {
    id: "cilium",
    name: "Cilium",
    group: "container",
    badge: "k8s",
    desc: {
      ko: "eBPF 기반 K8s 네트워킹·보안·관측 솔루션. 고성능 네트워크 정책 적용.",
      en: "eBPF-based K8s networking, security, and observability. High-performance network policy enforcement.",
    },
    placement: "concept",
    related: ["eks", "k8s", "service-mesh"],
    analogy: {
      ko: "초고속 지하 감시 시스템. 도시 지하(커널) 수준에서 모든 통신을 초고속으로 감시·제어",
      en: "An ultra-fast underground surveillance system. Monitors and controls all communications at the city's underground (kernel) level",
    },
  },

  // ── 추가: 데이터 ──
  {
    id: "aurora-serverless",
    name: "Aurora Serverless v2",
    group: "data",
    badge: "aws",
    desc: {
      ko: "Aurora의 서버리스 버전. 트래픽에 따라 자동으로 용량을 확장·축소. ACU 단위 과금.",
      en: "Serverless version of Aurora. Auto-scales capacity based on traffic. Billed per ACU.",
    },
    placement: "vpc-isolated",
    related: ["rds", "dynamodb", "lambda"],
    analogy: {
      ko: "자동 확장 도서관. 방문자가 많으면 열람실을 늘리고, 적으면 줄이는 스마트 도서관",
      en: "An auto-expanding library. Adds reading rooms when visitors increase, reduces them when quiet — a smart library",
    },
  },
  {
    id: "dax",
    name: "DAX",
    group: "data",
    badge: "aws",
    desc: {
      ko: "DynamoDB 전용 인메모리 캐시. 마이크로초 수준의 읽기 응답 시간.",
      en: "In-memory cache exclusively for DynamoDB. Microsecond-level read response times.",
    },
    placement: "vpc-private",
    related: ["dynamodb", "elasticache"],
    analogy: {
      ko: "도서관(DynamoDB) 전용 초고속 카운터. 자주 찾는 책을 카운터에 미리 꺼내두어 마이크로초 만에 제공",
      en: "An express counter just for the library (DynamoDB). Pre-stages frequently requested books at the counter for microsecond delivery",
    },
  },
  {
    id: "redshift",
    name: "Redshift",
    group: "data",
    badge: "aws",
    desc: {
      ko: "페타바이트 규모의 데이터 웨어하우스. 대규모 분석 쿼리에 최적화.",
      en: "Petabyte-scale data warehouse. Optimized for large-scale analytical queries.",
    },
    placement: "vpc-private",
    related: ["athena", "s3", "rds"],
    analogy: {
      ko: "도시 대형 분석 센터. 수백만 건의 데이터를 한꺼번에 분석하는 데 특화된 전용 시설",
      en: "The city's large-scale analytics center. A dedicated facility specialized in analyzing millions of data records at once",
    },
  },
  {
    id: "documentdb",
    name: "DocumentDB",
    group: "data",
    badge: "aws",
    desc: {
      ko: "MongoDB 호환 문서형 데이터베이스. 기존 MongoDB 코드를 거의 변경 없이 AWS 관리형으로 이전 가능.",
      en: "MongoDB-compatible document database. Migrate existing MongoDB code to AWS managed service with minimal changes.",
    },
    placement: "vpc-isolated",
    related: ["dynamodb", "rds", "dms"],
    analogy: {
      ko: "도시에 유치한 MongoDB 전문 도서관. 기존 MongoDB 방식(코드) 그대로 가져와서 도시(AWS)가 관리",
      en: "A MongoDB-specialist library recruited to the city. Bring your existing MongoDB approach (code) as-is and the city (AWS) manages it",
    },
  },
  {
    id: "neptune",
    name: "Neptune",
    group: "data",
    badge: "aws",
    desc: {
      ko: "그래프 데이터베이스. 소셜 네트워크, 추천 엔진, 사기 탐지 등 관계 중심 데이터 분석에 최적화.",
      en: "Graph database. Optimized for relationship-centric data analysis like social networks, recommendation engines, and fraud detection.",
    },
    placement: "vpc-isolated",
    related: ["dynamodb", "rds", "opensearch"],
    analogy: {
      ko: "도시 인맥 지도 센터. 사람(노드)과 관계(엣지)를 따라가며 '친구의 친구'를 빠르게 찾아냄",
      en: "The city connections mapping center. Follows people (nodes) and relationships (edges) to quickly find 'friends of friends'",
    },
  },
  {
    id: "memorydb",
    name: "MemoryDB for Redis",
    group: "data",
    badge: "aws",
    desc: {
      ko: "내구성을 보장하는 Redis 호환 인메모리 DB. ElastiCache와 달리 트랜잭션 로그로 데이터가 영구 보존됨.",
      en: "Durable Redis-compatible in-memory DB. Unlike ElastiCache, data is permanently preserved via transaction logs.",
    },
    placement: "vpc-isolated",
    related: ["elasticache", "dynamodb", "rds"],
    analogy: {
      ko: "금고가 달린 메모장. 빠르게 읽고 쓸 수 있으면서(Redis) 내용이 절대 사라지지 않는(내구성) 저장소",
      en: "A notepad with a vault. Read and write quickly (Redis) while contents never disappear (durability)",
    },
  },
  {
    id: "timestream",
    name: "Timestream",
    group: "data",
    badge: "aws",
    desc: {
      ko: "시계열 데이터 전용 DB. IoT 센서 데이터, 서버 메트릭 등 시간 기반 데이터 저장·분석.",
      en: "Time-series database. Stores and analyzes time-based data like IoT sensors and server metrics.",
    },
    placement: "regional-managed",
    related: ["kinesis", "cloudwatch"],
    analogy: {
      ko: "도시 기상 관측소 기록. 시간순으로 데이터를 기록하고, 온도 추이·패턴 같은 시계열 분석에 특화",
      en: "The city weather station records. Logs data chronologically, specialized for time-series analysis like temperature trends and patterns",
    },
  },
  {
    id: "athena",
    name: "Athena",
    group: "data",
    badge: "aws",
    desc: {
      ko: "S3에 저장된 데이터를 SQL로 직접 분석. 서버 없이 사용하고, 스캔한 데이터만큼만 과금.",
      en: "Query S3 data directly with SQL. Serverless, pay only for data scanned.",
    },
    placement: "regional-managed",
    related: ["s3", "redshift", "glue"],
    analogy: {
      ko: "창고(S3) 현장 검색 서비스. 물건을 옮기지 않고 창고에서 SQL로 바로 원하는 걸 찾아냄",
      en: "A warehouse (S3) on-site search service. Finds what you need via SQL right in the warehouse without moving anything",
    },
  },
  {
    id: "aws-backup",
    name: "AWS Backup",
    group: "data",
    badge: "aws",
    desc: {
      ko: "AWS 리소스(RDS, EBS, S3 등)의 백업을 중앙에서 자동 관리하는 서비스.",
      en: "Centrally manages automatic backups for AWS resources (RDS, EBS, S3, etc.).",
    },
    placement: "account-level",
    related: ["rds", "ebs", "s3", "efs"],
    analogy: {
      ko: "도시 자동 백업 금고. 모든 중요 시설(데이터)을 정해진 시간에 자동으로 복사·보관",
      en: "The city's automatic backup vault. Auto-copies and stores all important facilities (data) on schedule",
    },
  },

  // ── 추가: 통합 & 메시징 ──
  {
    id: "appsync",
    name: "AppSync",
    group: "integration",
    badge: "aws",
    desc: {
      ko: "관리형 GraphQL/Pub-Sub 서비스. 여러 데이터 소스를 하나의 API로 통합하고 실시간 구독 지원.",
      en: "Managed GraphQL and Pub/Sub service. Unifies multiple data sources into one API with real-time subscriptions.",
    },
    placement: "regional-managed",
    related: ["api-gateway", "dynamodb", "lambda"],
    analogy: {
      ko: "도시 만능 창구. 여러 관공서(데이터 소스)의 업무를 하나의 창구(API)에서 통합 처리하고 실시간 알림도 지원",
      en: "The city's all-in-one counter. Handles business from multiple agencies (data sources) at one counter (API) with real-time notifications",
    },
  },
  {
    id: "iot-core",
    name: "IoT Core",
    group: "integration",
    badge: "aws",
    desc: {
      ko: "IoT 디바이스를 AWS에 연결하는 관리형 서비스. MQTT 프로토콜 기반 양방향 통신.",
      en: "Managed service connecting IoT devices to AWS. Bidirectional communication via MQTT protocol.",
    },
    placement: "regional-managed",
    related: ["kinesis", "lambda", "timestream"],
    analogy: {
      ko: "도시 스마트 센서 허브. 도시 곳곳의 센서·기기(IoT)를 중앙에서 연결·제어하는 관제 시스템",
      en: "The city's smart sensor hub. A control system that centrally connects and manages sensors and devices (IoT) throughout the city",
    },
  },
  {
    id: "glue",
    name: "AWS Glue",
    group: "integration",
    badge: "aws",
    desc: {
      ko: "서버리스 ETL(추출·변환·적재) 서비스. 데이터 카탈로그, 스키마 레지스트리 포함.",
      en: "Serverless ETL (Extract, Transform, Load) service. Includes Data Catalog and Schema Registry.",
    },
    placement: "regional-managed",
    related: ["s3", "athena", "redshift"],
    analogy: {
      ko: "도시 데이터 가공 공장. 원재료(Raw 데이터)를 받아서 정리·변환한 뒤 목적지로 배달",
      en: "The city's data processing factory. Takes raw materials (data), cleans and transforms them, then delivers to the destination",
    },
  },

  // ── 추가: 보안 & 인증 ──
  {
    id: "security-hub",
    name: "Security Hub",
    group: "security",
    badge: "aws",
    desc: {
      ko: "보안 상태를 한 곳에서 통합 관리. GuardDuty, Inspector 등의 결과를 모아서 보여줌.",
      en: "Centralized security posture management. Aggregates findings from GuardDuty, Inspector, etc.",
    },
    placement: "account-level",
    related: ["guardduty", "inspector", "aws-config"],
    analogy: {
      ko: "도시 통합 보안 관제 센터. 모든 보안 카메라(서비스)의 경보를 한 화면에서 통합 모니터링",
      en: "The city's unified security operations center. Monitors all security camera (service) alerts on a single screen",
    },
  },
  {
    id: "inspector",
    name: "Inspector",
    group: "security",
    badge: "aws",
    desc: {
      ko: "EC2, Lambda, ECR 이미지의 소프트웨어 취약점을 자동 스캔·평가.",
      en: "Automatically scans and assesses software vulnerabilities in EC2, Lambda, and ECR images.",
    },
    placement: "account-level",
    related: ["security-hub", "ecr", "ec2"],
    analogy: {
      ko: "도시 건물 안전 점검관. 정기적으로 건물(인프라)의 취약한 부분을 찾아서 보고",
      en: "The city building safety inspector. Regularly finds and reports vulnerable parts of buildings (infrastructure)",
    },
  },
  {
    id: "macie",
    name: "Macie",
    group: "security",
    badge: "aws",
    desc: {
      ko: "S3에 저장된 민감 데이터(개인정보, 신용카드 번호 등)를 자동으로 탐지·분류.",
      en: "Automatically discovers and classifies sensitive data (PII, credit cards, etc.) stored in S3.",
    },
    placement: "account-level",
    related: ["s3", "security-hub", "kms"],
    analogy: {
      ko: "민감 정보 탐지견. 창고(S3)를 돌아다니며 숨겨진 개인정보(주민번호, 카드번호)를 찾아냄",
      en: "A sensitive data sniffer dog. Roams the warehouse (S3) sniffing out hidden personal information (SSN, card numbers)",
    },
  },
  {
    id: "iam-access-analyzer",
    name: "IAM Access Analyzer",
    group: "security",
    badge: "aws",
    desc: {
      ko: "외부에서 접근 가능한 리소스를 자동으로 탐지. S3 버킷, IAM 역할 등의 의도치 않은 공개 노출을 찾아냄.",
      en: "Automatically detects externally accessible resources. Finds unintended public exposure of S3 buckets, IAM roles, etc.",
    },
    placement: "account-level",
    related: ["iam", "s3", "security-hub"],
    analogy: {
      ko: "도시 출입문 점검관. 잠기지 않은 문(공개 리소스)을 자동으로 찾아서 관리자에게 알림",
      en: "The city door inspector. Automatically finds unlocked doors (public resources) and alerts the administrator",
    },
  },
  {
    id: "audit-manager",
    name: "AWS Audit Manager",
    group: "security",
    badge: "aws",
    desc: {
      ko: "규정 준수 감사를 자동화하는 서비스. PCI DSS, HIPAA, SOX 등의 프레임워크에 대한 증거를 자동 수집.",
      en: "Automates compliance auditing. Auto-collects evidence for frameworks like PCI DSS, HIPAA, and SOX.",
    },
    placement: "account-level",
    related: ["aws-config", "security-hub", "cloudtrail"],
    analogy: {
      ko: "자동 감사 비서. 감사 서류(증거)를 자동으로 모아서 규정별 폴더에 정리해줌",
      en: "An auto-audit assistant. Automatically collects audit documents (evidence) and organizes them by regulation",
    },
  },
  {
    id: "aws-config",
    name: "AWS Config",
    group: "security",
    badge: "aws",
    desc: {
      ko: "AWS 리소스 구성 변경을 추적·감사. 규정 준수 여부를 자동으로 평가.",
      en: "Tracks and audits AWS resource configuration changes. Automatically evaluates compliance.",
    },
    placement: "account-level",
    related: ["cloudtrail", "security-hub", "organizations"],
    analogy: {
      ko: "도시 설비 변경 기록부. 어떤 설비가 언제 변경되었는지 기록하고 규정 위반 여부를 자동 검사",
      en: "The city's facility change log. Records when equipment was changed and auto-checks for regulation violations",
    },
  },
  {
    id: "ssm",
    name: "Systems Manager (SSM)",
    group: "security",
    badge: "aws",
    desc: {
      ko: "EC2 인스턴스를 원격 관리하는 통합 도구. SSH 없이 접속, 패치 관리, 파라미터 저장.",
      en: "Unified tool for managing EC2 remotely. SSH-less access, patch management, parameter storage.",
    },
    placement: "account-level",
    related: ["ec2", "secrets-manager", "iam"],
    analogy: {
      ko: "원격 건물 관리 리모컨. 열쇠(SSH) 없이도 건물(서버)에 접근하고, 설정값을 안전하게 보관",
      en: "A remote building management tool. Access buildings (servers) without keys (SSH) and store settings securely",
    },
  },
  {
    id: "organizations",
    name: "Organizations / SCP",
    group: "security",
    badge: "aws",
    desc: {
      ko: "여러 AWS 계정을 중앙에서 관리. SCP(서비스 제어 정책)로 계정별 권한 상한선 설정.",
      en: "Centrally manages multiple AWS accounts. SCP (Service Control Policies) set permission guardrails per account.",
    },
    placement: "account-level",
    related: ["iam", "control-tower", "aws-config"],
    analogy: {
      ko: "도시 연합 본부. 각 도시(계정)가 할 수 있는 일의 범위를 본부에서 통제",
      en: "The city federation headquarters. Controls what each city (account) is allowed to do",
    },
  },
  {
    id: "control-tower",
    name: "Control Tower",
    group: "security",
    badge: "aws",
    desc: {
      ko: "멀티 계정 환경을 모범 사례에 맞게 자동 설정. Landing Zone을 빠르게 구축.",
      en: "Automates multi-account setup with best practices. Quickly builds a Landing Zone.",
    },
    placement: "account-level",
    related: ["organizations", "iam", "aws-config"],
    analogy: {
      ko: "신도시 마스터플랜. 도로·전기·수도(보안·로깅·계정 구조)를 모범 사례에 맞게 자동 설계",
      en: "A new city master plan. Auto-designs roads, power, water (security, logging, account structure) following best practices",
    },
  },
  {
    id: "iam-identity-center",
    name: "IAM Identity Center (SSO)",
    group: "security",
    badge: "aws",
    desc: {
      ko: "여러 AWS 계정과 비즈니스 애플리케이션에 SSO(싱글 사인온)로 접속. SAML/OIDC 연동.",
      en: "SSO access to multiple AWS accounts and business apps. SAML/OIDC federation.",
    },
    placement: "account-level",
    related: ["iam", "organizations", "cognito"],
    analogy: {
      ko: "도시 통합 출입 카드. 하나의 카드로 모든 도시(계정)와 시설(앱)에 출입 가능",
      en: "The city's universal access card. One card to enter all cities (accounts) and facilities (apps)",
    },
  },

  // ── 추가: CI/CD & 모니터링 ──
  {
    id: "github-actions",
    name: "GitHub Actions",
    group: "cicd",
    badge: "general",
    desc: {
      ko: "GitHub에 내장된 CI/CD 도구. Push/PR 이벤트로 빌드·테스트·배포를 자동화.",
      en: "GitHub's built-in CI/CD. Automates build, test, and deploy on push/PR events.",
    },
    placement: "concept",
    related: ["cicd", "codepipeline", "argocd"],
    analogy: {
      ko: "GitHub 전속 건설팀. 설계도(코드)를 올리면 자동으로 검수·시공·배포까지 처리",
      en: "GitHub's dedicated construction crew. Upload blueprints (code) and they auto-handle inspection, construction, and deployment",
    },
  },
  {
    id: "gitlab-cicd",
    name: "GitLab CI/CD",
    group: "cicd",
    badge: "general",
    desc: {
      ko: "GitLab에 내장된 CI/CD 파이프라인. .gitlab-ci.yml로 정의하며, 자체 호스팅 가능.",
      en: "GitLab's built-in CI/CD pipeline. Defined via .gitlab-ci.yml, supports self-hosting.",
    },
    placement: "concept",
    related: ["cicd", "github-actions"],
    analogy: {
      ko: "GitLab 전속 건설팀. GitHub Actions와 같은 역할이지만 GitLab 환경에서 동작",
      en: "GitLab's dedicated construction crew. Same role as GitHub Actions but operates in the GitLab environment",
    },
  },
  {
    id: "cloudformation",
    name: "CloudFormation",
    group: "cicd",
    badge: "aws",
    desc: {
      ko: "AWS 인프라를 JSON/YAML 템플릿으로 정의·배포. AWS 네이티브 IaC 서비스.",
      en: "Define and deploy AWS infrastructure via JSON/YAML templates. AWS-native IaC service.",
    },
    placement: "account-level",
    related: ["cdk", "terraform", "iac"],
    analogy: {
      ko: "도시(AWS) 전용 건축 도면. AWS 리소스를 템플릿 하나로 자동 생성하는 공식 도구",
      en: "The city's (AWS) official blueprints. The official tool that auto-creates all AWS resources from a single template",
    },
  },
  {
    id: "container-insights",
    name: "Container Insights",
    group: "cicd",
    badge: "aws",
    desc: {
      ko: "ECS/EKS 컨테이너의 CPU, 메모리, 네트워크 메트릭을 CloudWatch로 자동 수집.",
      en: "Auto-collects CPU, memory, and network metrics from ECS/EKS containers into CloudWatch.",
    },
    placement: "account-level",
    related: ["cloudwatch", "ecs", "eks"],
    analogy: {
      ko: "건물(컨테이너) 전용 건강 검진. 각 건물의 전력·수도(CPU·메모리) 사용량을 자동 체크·기록",
      en: "Building (container) health checkups. Auto-checks and records each building's power and water (CPU, memory) usage",
    },
  },
  {
    id: "amp",
    name: "Managed Prometheus (AMP)",
    group: "cicd",
    badge: "aws",
    desc: {
      ko: "AWS가 관리하는 Prometheus 호환 모니터링 서비스. 인프라 운영 부담 없이 Prometheus 사용.",
      en: "AWS-managed Prometheus-compatible monitoring. Use Prometheus without infrastructure overhead.",
    },
    placement: "regional-managed",
    related: ["prometheus", "grafana", "cloudwatch"],
    analogy: {
      ko: "도시 관리형 건강 모니터. 직접 장비를 관리하지 않아도 도시(AWS)가 모니터링 시스템을 운영",
      en: "The city's managed health monitor. The city (AWS) runs the monitoring system so you don't manage the equipment yourself",
    },
  },

  // ── 추가: 일반 개념 ──
  {
    id: "grpc",
    name: "gRPC",
    group: "integration",
    badge: "general",
    desc: {
      ko: "Google이 만든 고성능 RPC 프레임워크. Protocol Buffers 직렬화로 REST보다 빠른 서비스 간 통신.",
      en: "Google's high-performance RPC framework. Faster inter-service communication than REST via Protocol Buffers.",
    },
    placement: "concept",
    related: ["graphql", "websocket", "alb"],
    analogy: {
      ko: "전용 핫라인 전화. 일반 전화(REST)보다 빠르고 효율적인 부서 간 직통 회선",
      en: "A dedicated hotline. A faster, more efficient direct line between departments than regular calls (REST)",
    },
  },
  {
    id: "graphql",
    name: "GraphQL",
    group: "integration",
    badge: "general",
    desc: {
      ko: "클라이언트가 필요한 데이터만 정확히 요청할 수 있는 API 쿼리 언어. Over-fetching 방지.",
      en: "API query language letting clients request exactly the data they need. Prevents over-fetching.",
    },
    placement: "concept",
    related: ["appsync", "api-gateway"],
    analogy: {
      ko: "맞춤형 도시락 주문. 원하는 반찬(데이터)만 정확히 골라 담을 수 있어 낭비가 없다",
      en: "A custom bento order. Pick exactly the side dishes (data) you want — nothing wasted",
    },
  },
  {
    id: "websocket",
    name: "WebSocket",
    group: "integration",
    badge: "general",
    desc: {
      ko: "서버와 클라이언트 간 양방향 실시간 통신 프로토콜. 채팅, 알림, 실시간 대시보드에 사용.",
      en: "Bidirectional real-time communication protocol. Used for chat, notifications, and live dashboards.",
    },
    placement: "concept",
    related: ["api-gateway", "alb", "appsync"],
    analogy: {
      ko: "전화 통화. 편지(HTTP)와 달리 양쪽이 동시에 실시간으로 대화하는 통신 방식",
      en: "A phone call. Unlike letters (HTTP), both sides talk simultaneously in real time",
    },
  },
  {
    id: "circuit-breaker",
    name: "Circuit Breaker",
    group: "integration",
    badge: "general",
    desc: {
      ko: "장애가 발생한 서비스로의 호출을 자동 차단하여 연쇄 장애를 방지하는 패턴.",
      en: "Pattern that auto-blocks calls to a failing service to prevent cascading failures.",
    },
    placement: "concept",
    related: ["service-mesh", "istio"],
    analogy: {
      ko: "도시 전기 차단기. 과부하(장애)가 오면 자동으로 전기(요청)를 끊어 화재(연쇄 장애)를 방지",
      en: "The city's electrical circuit breaker. Auto-cuts power (requests) on overload (failure) to prevent fire (cascading failure)",
    },
  },
  {
    id: "saga-pattern",
    name: "Saga Pattern",
    group: "integration",
    badge: "general",
    desc: {
      ko: "분산 트랜잭션을 여러 로컬 트랜잭션으로 분리하고, 실패 시 보상 트랜잭션으로 롤백하는 패턴.",
      en: "Splits distributed transactions into local ones with compensating transactions for rollback on failure.",
    },
    placement: "concept",
    related: ["step-functions", "sqs", "eventbridge"],
    analogy: {
      ko: "연쇄 예약 시스템. 항공→호텔→렌터카 순서로 예약하고, 중간에 실패하면 앞의 예약도 자동 취소",
      en: "A chain booking system. Books flight → hotel → car in order; if one fails, all previous bookings are auto-cancelled",
    },
  },
  {
    id: "outbox-pattern",
    name: "Outbox Pattern",
    group: "integration",
    badge: "general",
    desc: {
      ko: "DB 변경과 이벤트 발행을 원자적으로 처리하는 패턴. 데이터 일관성과 이벤트 전달을 모두 보장.",
      en: "Pattern for atomically persisting DB changes and publishing events. Guarantees both data consistency and event delivery.",
    },
    placement: "concept",
    related: ["sqs", "eventbridge", "rds"],
    analogy: {
      ko: "등기 우편 시스템. 편지(이벤트)를 보낸 기록을 우체국(DB)에 남겨서 분실을 방지",
      en: "A registered mail system. Records that a letter (event) was sent at the post office (DB) to prevent loss",
    },
  },

  // ── 추가 2차: AWS 서비스 ──
  {
    id: "app-runner",
    name: "App Runner",
    group: "compute",
    badge: "aws",
    desc: {
      ko: "소스 코드나 컨테이너 이미지를 넣으면 자동으로 빌드·배포·스케일링하는 완전관리형 서비스.",
      en: "Fully managed service that auto-builds, deploys, and scales from source code or container images.",
    },
    placement: "regional-managed",
    related: ["ecs", "fargate", "lambda"],
    analogy: {
      ko: "올인원 창업 서비스. 요리(코드)만 가져오면 가게(인프라)·배달(배포)·인원(스케일링)까지 전부 해줌",
      en: "An all-in-one business startup service. Just bring the food (code) and it handles the store (infra), delivery (deploy), and staffing (scaling)",
    },
  },
  {
    id: "aws-batch",
    name: "AWS Batch",
    group: "compute",
    badge: "aws",
    desc: {
      ko: "대규모 배치 작업을 자동으로 스케줄링·실행하는 서비스. ML 학습, 데이터 처리 등에 사용.",
      en: "Automatically schedules and runs large-scale batch jobs. Used for ML training, data processing, etc.",
    },
    placement: "vpc-private",
    related: ["ec2", "fargate", "step-functions"],
    analogy: {
      ko: "도시 세탁소. 빨래(배치 작업)를 맡기면 알아서 세탁기(컴퓨팅)를 배정하고 돌려줌",
      en: "The city laundromat. Drop off laundry (batch jobs) and it assigns washing machines (compute) and returns them done",
    },
  },
  {
    id: "kinesis-firehose",
    name: "Kinesis Data Firehose",
    group: "integration",
    badge: "aws",
    desc: {
      ko: "스트리밍 데이터를 S3, Redshift, OpenSearch 등으로 자동 전달하는 파이프라인. 코드 없이 설정만으로 동작.",
      en: "Auto-delivers streaming data to S3, Redshift, OpenSearch, etc. Works with configuration only, no code.",
    },
    placement: "regional-managed",
    related: ["kinesis", "s3", "redshift", "opensearch"],
    analogy: {
      ko: "도시 자동 분류 택배. 물건(스트리밍 데이터)이 들어오면 목적지(S3/Redshift)로 자동 배송",
      en: "The city's auto-sorting delivery service. When items (streaming data) arrive, they're auto-shipped to their destination (S3/Redshift)",
    },
  },
  {
    id: "rds-proxy",
    name: "RDS Proxy",
    group: "data",
    badge: "aws",
    desc: {
      ko: "RDS/Aurora 앞에서 DB 커넥션을 풀링·관리. Lambda처럼 급격히 연결이 늘어나는 환경에서 필수.",
      en: "Pools and manages DB connections in front of RDS/Aurora. Essential for Lambda and other bursty environments.",
    },
    placement: "vpc-private",
    related: ["rds", "lambda", "aurora-serverless"],
    analogy: {
      ko: "도서관 번호표 시스템. 창구(DB 커넥션)가 한정적이니 번호표로 순서대로 처리해서 혼잡 방지",
      en: "A library queue ticket system. Limited counters (DB connections), so a ticket system processes in order to prevent congestion",
    },
  },
  {
    id: "quicksight",
    name: "QuickSight",
    group: "data",
    badge: "aws",
    desc: {
      ko: "서버리스 BI 대시보드 서비스. Redshift, Athena, S3 등의 데이터를 시각화·분석.",
      en: "Serverless BI dashboard service. Visualizes and analyzes data from Redshift, Athena, S3, etc.",
    },
    placement: "regional-managed",
    related: ["redshift", "athena", "s3"],
    analogy: {
      ko: "도시 통계 대시보드. 데이터를 넣으면 차트·그래프가 자동으로 만들어지는 보고서 생성기",
      en: "The city statistics dashboard. Feed in data and charts and graphs are automatically generated — an auto-report builder",
    },
  },
  {
    id: "bedrock",
    name: "Amazon Bedrock",
    group: "data",
    badge: "aws",
    desc: {
      ko: "서버리스 생성형 AI 서비스. Claude, Llama 등 파운데이션 모델을 API로 호출. Knowledge Base로 RAG 구성 가능.",
      en: "Serverless generative AI service. Call foundation models (Claude, Llama, etc.) via API. Build RAG with Knowledge Base.",
    },
    placement: "regional-managed",
    related: ["sagemaker", "s3", "opensearch"],
    analogy: {
      ko: "도시 AI 전문가 파견 서비스. 필요할 때 전문가(AI 모델)를 불러 질문하고, 사용한 만큼만 비용 지불",
      en: "The city's AI expert dispatch service. Call an expert (AI model) when needed, ask questions, and pay only for usage",
    },
  },
  {
    id: "sagemaker",
    name: "SageMaker",
    group: "compute",
    badge: "aws",
    desc: {
      ko: "ML 모델을 빌드·학습·배포하는 완전관리형 플랫폼. 데이터 준비부터 추론 엔드포인트까지.",
      en: "Fully managed platform to build, train, and deploy ML models. From data prep to inference endpoints.",
    },
    placement: "regional-managed",
    related: ["s3", "lambda", "aws-batch"],
    analogy: {
      ko: "도시 AI 연구소. 실험 재료(데이터) 준비부터 연구(학습), 제품 출시(배포)까지 전부 지원하는 시설",
      en: "The city's AI research lab. Supports everything from experiment materials (data) to research (training) to product launch (deployment)",
    },
  },
  {
    id: "lake-formation",
    name: "Lake Formation",
    group: "data",
    badge: "aws",
    desc: {
      ko: "데이터 레이크를 쉽게 구축하고, 세밀한 접근 제어(행/열 수준)를 적용하는 서비스.",
      en: "Easily builds data lakes with fine-grained access control (row/column level).",
    },
    placement: "regional-managed",
    related: ["s3", "glue", "athena"],
    analogy: {
      ko: "도시 데이터 도서관 사서. 모든 데이터를 정리하고, 누가 어떤 페이지를 볼 수 있는지 세밀하게 관리",
      en: "The city's data library curator. Organizes all data and finely controls who can view which pages",
    },
  },
  {
    id: "cloudwatch-synthetics",
    name: "CloudWatch Synthetics",
    group: "cicd",
    badge: "aws",
    desc: {
      ko: "API나 웹 URL을 주기적으로 호출해서 정상 응답 여부를 확인하는 합성 모니터링 서비스.",
      en: "Synthetic monitoring that periodically calls APIs or URLs to verify they respond correctly.",
    },
    placement: "account-level",
    related: ["cloudwatch", "route53", "xray"],
    analogy: {
      ko: "미스터리 쇼퍼. 가짜 손님(스크립트)을 보내 가게(서비스)가 정상 운영되는지 주기적으로 확인",
      en: "A mystery shopper. Sends fake customers (scripts) to periodically check if the store (service) is operating normally",
    },
  },
  {
    id: "ecs-service-connect",
    name: "ECS Service Connect",
    group: "container",
    badge: "aws",
    desc: {
      ko: "ECS 서비스 간 통신을 자동으로 설정하는 기능. 서비스 디스커버리 + 로드밸런싱 + 관측성 내장.",
      en: "Auto-configures communication between ECS services. Built-in service discovery, load balancing, and observability.",
    },
    placement: "vpc-private",
    related: ["ecs", "cloud-map", "service-mesh"],
    analogy: {
      ko: "도시 내선 전화 시스템. 부서(ECS 서비스) 이름만 누르면 자동 연결되고 통화 기록도 남음",
      en: "The city's intercom system. Press a department name (ECS service) and you're auto-connected, with call logs included",
    },
  },
  {
    id: "cloud-map",
    name: "Cloud Map",
    group: "container",
    badge: "aws",
    desc: {
      ko: "AWS 리소스의 서비스 디스커버리. 서비스 이름으로 IP/포트를 자동 조회. Route 53과 통합.",
      en: "Service discovery for AWS resources. Auto-resolves service names to IP/port. Integrates with Route 53.",
    },
    placement: "regional-managed",
    related: ["ecs-service-connect", "eks", "route53"],
    analogy: {
      ko: "도시 내선번호부. 부서 이름(서비스명)으로 전화번호(IP/포트)를 자동으로 찾아주는 시스템",
      en: "The city's extension directory. Auto-looks up phone numbers (IP/port) by department name (service name)",
    },
  },
  {
    id: "amazon-mq",
    name: "Amazon MQ",
    group: "integration",
    badge: "aws",
    desc: {
      ko: "ActiveMQ/RabbitMQ 관리형 메시지 브로커. 온프레미스 MQ를 코드 변경 없이 AWS로 마이그레이션할 때 사용.",
      en: "Managed ActiveMQ/RabbitMQ message broker. Used to migrate on-premises MQ to AWS without code changes.",
    },
    placement: "vpc-private",
    related: ["sqs", "sns", "msk"],
    analogy: {
      ko: "기존 우체국 이사 서비스. 기존 우편 시스템(MQ)을 코드 변경 없이 그대로 도시(AWS)로 이전·운영",
      en: "A post office relocation service. Moves your existing mail system (MQ) to the city (AWS) as-is without code changes",
    },
  },
  {
    id: "vpc-lattice",
    name: "VPC Lattice",
    group: "integration",
    badge: "aws",
    desc: {
      ko: "VPC 간, 계정 간 서비스 통신을 AWS가 관리하는 네트워킹 서비스. App Mesh보다 단순하고 IAM 인증 기반.",
      en: "AWS-managed cross-VPC, cross-account service networking. Simpler than App Mesh with IAM-based auth.",
    },
    placement: "regional-managed",
    related: ["app-mesh", "alb", "cloud-map"],
    analogy: {
      ko: "도시 간 전용 통신선. 서로 다른 도시(VPC)의 부서(서비스)가 전용선으로 안전하게 통신",
      en: "A dedicated line between cities. Departments (services) in different cities (VPCs) communicate securely via private lines",
    },
  },
  {
    id: "schema-registry",
    name: "Schema Registry",
    group: "integration",
    badge: "general",
    desc: {
      ko: "메시지 스키마를 중앙에서 관리·버전 관리. 생산자/소비자 간 호환성을 보장.",
      en: "Centrally manages and versions message schemas. Ensures compatibility between producers and consumers.",
    },
    placement: "concept",
    related: ["msk", "kinesis", "glue"],
    analogy: {
      ko: "도시 공문서 양식 관리소. 모든 부서가 같은 양식(스키마)을 쓰도록 버전을 관리",
      en: "The city's official forms office. Manages versions so all departments use the same forms (schemas)",
    },
  },

  // ── 추가 2차: K8s 생태계 ──
  {
    id: "hpa",
    name: "HPA",
    group: "container",
    badge: "k8s",
    desc: {
      ko: "Horizontal Pod Autoscaler. CPU/메모리 사용률에 따라 Pod 수를 자동으로 늘리거나 줄임.",
      en: "Horizontal Pod Autoscaler. Auto-scales Pod count based on CPU/memory utilization.",
    },
    placement: "concept",
    related: ["vpa", "keda", "karpenter"],
    analogy: {
      ko: "자동 계산대 관리. 줄(CPU 사용률)이 길어지면 계산대(Pod)를 열고, 한산하면 줄이는 시스템",
      en: "Auto checkout lane management. Opens lanes (Pods) when lines (CPU usage) get long, closes them when quiet",
    },
  },
  {
    id: "vpa",
    name: "VPA",
    group: "container",
    badge: "k8s",
    desc: {
      ko: "Vertical Pod Autoscaler. Pod의 CPU/메모리 요청량을 실제 사용량에 맞게 자동 조정.",
      en: "Vertical Pod Autoscaler. Auto-adjusts Pod CPU/memory requests to match actual usage.",
    },
    placement: "concept",
    related: ["hpa", "karpenter"],
    analogy: {
      ko: "맞춤형 사무실 조절. 실제 사용량에 맞춰 사무실 크기(CPU/메모리)를 자동으로 키우거나 줄임",
      en: "Custom office resizing. Auto-adjusts office size (CPU/memory) to match actual usage — bigger or smaller as needed",
    },
  },
  {
    id: "cluster-autoscaler",
    name: "Cluster Autoscaler",
    group: "container",
    badge: "k8s",
    desc: {
      ko: "K8s 클러스터의 노드 수를 자동으로 조절. Node Group의 min/max 범위 내에서 스케일링.",
      en: "Auto-adjusts K8s cluster node count. Scales within Node Group min/max bounds.",
    },
    placement: "concept",
    related: ["karpenter", "eks", "auto-scaling"],
    analogy: {
      ko: "건물 증축 관리인(구형). 공간이 부족하면 건물(노드)을 늘리고 남으면 줄임. Karpenter보다 느림",
      en: "A building expansion manager (legacy). Adds buildings (nodes) when space runs out, removes extras. Slower than Karpenter",
    },
  },
  {
    id: "rbac",
    name: "RBAC",
    group: "container",
    badge: "k8s",
    desc: {
      ko: "Role-Based Access Control. K8s에서 역할 기반으로 리소스 접근 권한을 관리.",
      en: "Role-Based Access Control. Manages resource access permissions by role in K8s.",
    },
    placement: "concept",
    related: ["iam", "k8s", "namespace"],
    analogy: {
      ko: "직급별 출입 권한. 인턴은 로비만, 팀장은 사무실까지, 임원은 금고까지 접근 가능",
      en: "Rank-based access permissions. Interns access the lobby only, managers reach offices, executives access the vault",
    },
  },
  {
    id: "namespace",
    name: "Namespace",
    group: "container",
    badge: "k8s",
    desc: {
      ko: "K8s 클러스터를 논리적으로 분리하는 가상 구역. 팀별·환경별 리소스 격리에 사용.",
      en: "Logically separates a K8s cluster into virtual zones. Used for team or environment resource isolation.",
    },
    placement: "concept",
    related: ["k8s", "rbac", "kyverno"],
    analogy: {
      ko: "공유 건물의 각 층. 같은 건물(클러스터)이지만 각 회사(팀)가 독립된 층을 사용",
      en: "Separate floors in a shared building. Same building (cluster) but each company (team) uses its own independent floor",
    },
  },
  {
    id: "irsa",
    name: "IRSA",
    group: "container",
    badge: "aws",
    desc: {
      ko: "IAM Roles for Service Accounts. K8s Pod에 AWS IAM 역할을 부여해 AWS 서비스 접근 권한을 최소화.",
      en: "IAM Roles for Service Accounts. Grants AWS IAM roles to K8s Pods for least-privilege AWS access.",
    },
    placement: "concept",
    related: ["iam", "eks", "pod"],
    analogy: {
      ko: "팀별 법인카드. 전 직원이 대표 카드를 쓰는 대신, 팀(Pod)마다 권한이 다른 카드를 발급",
      en: "Team-specific corporate cards. Instead of everyone sharing one card, each team (Pod) gets a card with specific spending limits",
    },
  },
  {
    id: "coredns",
    name: "CoreDNS",
    group: "container",
    badge: "k8s",
    desc: {
      ko: "K8s 기본 DNS 서버. 서비스 이름을 클러스터 내부 IP로 변환. EKS에 자동 포함.",
      en: "K8s built-in DNS server. Translates service names to cluster-internal IPs. Auto-included in EKS.",
    },
    placement: "concept",
    related: ["k8s", "eks", "cloud-map"],
    analogy: {
      ko: "건물 내 내선번호 안내. '영업팀'이라고 하면 내선번호(IP)를 자동으로 알려주는 시스템",
      en: "An in-building extension directory. Say 'sales team' and it auto-provides the extension number (IP)",
    },
  },
  {
    id: "external-dns",
    name: "ExternalDNS",
    group: "container",
    badge: "k8s",
    desc: {
      ko: "K8s 서비스/Ingress를 Route 53 등 외부 DNS에 자동 등록하는 도구.",
      en: "Auto-registers K8s services/Ingress into external DNS like Route 53.",
    },
    placement: "concept",
    related: ["route53", "ingress-controller", "eks"],
    analogy: {
      ko: "자동 전화번호부 등록. 새 부서(서비스)가 생기면 도시 전화번호부(DNS)에 자동 등록",
      en: "Auto phone book registration. When a new department (service) is created, it's automatically added to the city directory (DNS)",
    },
  },
  {
    id: "app-mesh",
    name: "App Mesh",
    group: "container",
    badge: "aws",
    desc: {
      ko: "AWS 관리형 서비스 메시. Envoy 프록시 기반으로 ECS/EKS/EC2 서비스 간 통신을 관리. 2026년 서비스 종료 예정.",
      en: "AWS-managed service mesh. Manages communication between ECS/EKS/EC2 services via Envoy proxy. Scheduled for EOL in 2026.",
    },
    placement: "concept",
    related: ["istio", "service-mesh", "envoy"],
    analogy: {
      ko: "도시(AWS) 전용 서비스 간 통신 관리 시스템. Istio와 같은 역할이지만 도시가 직접 운영. 현재 Istio/Cilium으로 대체 추세",
      en: "The city's (AWS) own inter-service communication manager. Same role as Istio but run by the city. Being replaced by Istio/Cilium",
    },
  },
  {
    id: "envoy",
    name: "Envoy Proxy",
    group: "container",
    badge: "general",
    desc: {
      ko: "고성능 L7 프록시. Istio·App Mesh의 사이드카, API Gateway, gRPC 트랜스코딩 등에 사용.",
      en: "High-performance L7 proxy. Used as Istio/App Mesh sidecar, API gateway, gRPC transcoding, etc.",
    },
    placement: "concept",
    related: ["istio", "app-mesh", "sidecar"],
    analogy: {
      ko: "만능 통역·중계사. 가게(서비스) 사이에서 통신을 중계하고, 기록·보안까지 처리",
      en: "A versatile interpreter and relay. Mediates communication between shops (services) while handling logging and security",
    },
  },
  {
    id: "jaeger",
    name: "Jaeger",
    group: "container",
    badge: "k8s",
    desc: {
      ko: "오픈소스 분산 추적 시스템. 마이크로서비스 요청 흐름을 시각화. Istio/Kiali와 연동.",
      en: "Open-source distributed tracing. Visualizes request flows across microservices. Integrates with Istio/Kiali.",
    },
    placement: "concept",
    related: ["xray", "istio", "prometheus"],
    analogy: {
      ko: "택배 GPS 추적 시스템. 물건(요청)이 각 거점(서비스)을 거치는 경로를 지도에 표시",
      en: "A package GPS tracking system. Maps the route of items (requests) through each waypoint (service)",
    },
  },
  {
    id: "kiali",
    name: "Kiali",
    group: "container",
    badge: "k8s",
    desc: {
      ko: "Istio 서비스 메시 대시보드. 서비스 간 통신 토폴로지·트래픽 흐름을 시각화.",
      en: "Istio service mesh dashboard. Visualizes service communication topology and traffic flow.",
    },
    placement: "concept",
    related: ["istio", "jaeger", "grafana"],
    analogy: {
      ko: "도시 교통 현황판. 모든 도로(서비스 통신)와 교차로(연결)를 한눈에 보여주는 대시보드",
      en: "The city traffic status board. A dashboard showing all roads (service communications) and intersections (connections) at a glance",
    },
  },
  {
    id: "hubble",
    name: "Hubble",
    group: "container",
    badge: "k8s",
    desc: {
      ko: "Cilium의 네트워크 관측 도구. eBPF 기반으로 실시간 네트워크 흐름을 시각화.",
      en: "Cilium's network observability tool. Visualizes real-time network flows via eBPF.",
    },
    placement: "concept",
    related: ["cilium", "prometheus", "grafana"],
    analogy: {
      ko: "도시 지하 통신 현미경. 지하(커널) 수준의 모든 통신 흐름을 실시간으로 관찰",
      en: "The city's underground communications microscope. Observes all communication flows at the underground (kernel) level in real time",
    },
  },
  {
    id: "ebpf",
    name: "eBPF",
    group: "container",
    badge: "general",
    desc: {
      ko: "리눅스 커널에서 샌드박스 프로그램을 실행하는 기술. Cilium이 이것으로 고성능 네트워크 정책을 적용.",
      en: "Technology for running sandboxed programs in the Linux kernel. Cilium uses it for high-performance network policies.",
    },
    placement: "concept",
    related: ["cilium", "hubble"],
    analogy: {
      ko: "도시 지하에 심은 초고속 센서. OS 깊숙한 곳에서 네트워크를 초고속으로 감시·제어하는 기술",
      en: "Ultra-fast sensors planted underground. Technology that monitors and controls networking at high speed deep inside the OS",
    },
  },

  // ── 추가 2차: 프로토콜/인증 ──
  {
    id: "mtls",
    name: "mTLS",
    group: "security",
    badge: "general",
    desc: {
      ko: "Mutual TLS. 서버와 클라이언트가 서로의 인증서를 검증하는 양방향 TLS 인증.",
      en: "Mutual TLS. Both server and client verify each other's certificates for bidirectional authentication.",
    },
    placement: "concept",
    related: ["acm", "istio", "service-mesh"],
    analogy: {
      ko: "쌍방 신분증 확인. 방문자도 신분증을 보여주고, 건물 측도 신분증을 보여줘야 입장 가능",
      en: "Two-way ID verification. Both the visitor and the building must show their IDs before entry is allowed",
    },
  },
  {
    id: "mqtt",
    name: "MQTT",
    group: "integration",
    badge: "general",
    desc: {
      ko: "경량 Pub/Sub 메시징 프로토콜. IoT 디바이스처럼 대역폭·배터리가 제한된 환경에 최적.",
      en: "Lightweight pub/sub messaging protocol. Optimized for bandwidth and battery-constrained IoT devices.",
    },
    placement: "concept",
    related: ["iot-core", "sns", "websocket"],
    analogy: {
      ko: "무전기. 적은 전력으로 짧은 메시지를 빠르게 주고받는 경량 통신 방식",
      en: "A walkie-talkie. Quickly exchanges short messages with minimal power consumption — a lightweight communication method",
    },
  },
  {
    id: "jwt",
    name: "JWT",
    group: "security",
    badge: "general",
    desc: {
      ko: "JSON Web Token. 사용자 인증 정보를 담은 자체 포함형 토큰. 서버에 세션을 저장하지 않아도 됨.",
      en: "JSON Web Token. Self-contained token carrying user auth info. No server-side session storage needed.",
    },
    placement: "concept",
    related: ["cognito", "oidc", "api-gateway"],
    analogy: {
      ko: "자유이용권 팔찌. 팔찌(토큰)만 보여주면 매번 매표소(서버)에 가지 않아도 모든 시설 이용 가능",
      en: "An all-access wristband. Just show the band (token) — no need to visit the ticket booth (server) each time to use any facility",
    },
  },
  {
    id: "oidc",
    name: "OIDC",
    group: "security",
    badge: "general",
    desc: {
      ko: "OpenID Connect. OAuth 2.0 위에 사용자 신원 확인 계층을 추가한 인증 프로토콜.",
      en: "OpenID Connect. Authentication protocol adding identity verification on top of OAuth 2.0.",
    },
    placement: "concept",
    related: ["cognito", "jwt", "saml", "iam-identity-center"],
    analogy: {
      ko: "소셜 로그인 표준. 'Google로 로그인' 같은 기능의 기반이 되는 인증 기술",
      en: "The social login standard. The authentication technology behind 'Sign in with Google' features",
    },
  },
  {
    id: "saml",
    name: "SAML",
    group: "security",
    badge: "general",
    desc: {
      ko: "Security Assertion Markup Language. 기업 SSO에서 IdP(Active Directory 등)와 SP 간 인증 정보를 교환하는 XML 기반 프로토콜.",
      en: "Security Assertion Markup Language. XML-based protocol for exchanging auth data between IdP (Active Directory, etc.) and SP in enterprise SSO.",
    },
    placement: "concept",
    related: ["oidc", "cognito", "iam-identity-center"],
    analogy: {
      ko: "도시 연합 통합 출입증. 본부 카드(IdP) 하나로 모든 연합 도시(서비스)에 출입 가능",
      en: "A federation-wide master badge. One HQ card (IdP) grants access to all federated cities (services)",
    },
  },
  {
    id: "oac",
    name: "OAC",
    group: "traffic",
    badge: "aws",
    desc: {
      ko: "Origin Access Control. CloudFront만 S3 버킷에 접근할 수 있도록 제한. 직접 S3 URL 접근 차단.",
      en: "Origin Access Control. Restricts S3 bucket access to CloudFront only. Blocks direct S3 URL access.",
    },
    placement: "edge",
    related: ["cloudfront", "s3"],
    analogy: {
      ko: "VIP 전용 입구. 정문(CloudFront)으로만 입장 가능하고, 뒷문(직접 S3 URL)은 잠겨있음",
      en: "A VIP-only entrance. Entry only through the front gate (CloudFront); the back door (direct S3 URL) is locked",
    },
  },

  // ── 추가 2차: 아키텍처 패턴 ──
  {
    id: "bff",
    name: "BFF",
    group: "integration",
    badge: "general",
    desc: {
      ko: "Backend for Frontend. 각 프론트엔드(웹, 모바일)에 맞춤형 API 계층을 두는 패턴.",
      en: "Backend for Frontend. Pattern with a tailored API layer for each frontend (web, mobile).",
    },
    placement: "concept",
    related: ["api-gateway", "graphql", "alb"],
    analogy: {
      ko: "전담 비서 서비스. 하나의 본부(백엔드)가 있어도 각 고객 유형(프론트엔드)마다 전담 비서가 맞춤 응대",
      en: "A dedicated secretary service. One HQ (backend) but each client type (frontend) gets a personal secretary for tailored responses",
    },
  },
  {
    id: "pilot-light",
    name: "Pilot Light",
    group: "cicd",
    badge: "general",
    desc: {
      ko: "DR 전략 중 하나. 재해 복구 리전에 최소한의 핵심 인프라만 켜두고, 장애 시 스케일 업.",
      en: "A DR strategy. Keeps minimal core infrastructure running in the DR region, scales up on failover.",
    },
    placement: "concept",
    related: ["blue-green", "route53", "rds"],
    analogy: {
      ko: "비상 발전기 대기. 평소에는 최소 전력(인프라)만 유지하다가, 정전(장애) 시 즉시 풀 가동",
      en: "Backup generator on standby. Maintains minimal power (infrastructure) normally, instantly goes full power on outage (failure)",
    },
  },
  {
    id: "chaos-engineering",
    name: "Chaos Engineering",
    group: "cicd",
    badge: "general",
    desc: {
      ko: "의도적으로 장애를 주입하여 시스템 복원력을 검증하는 실천법. Netflix가 시작.",
      en: "Practice of intentionally injecting failures to validate system resilience. Pioneered by Netflix.",
    },
    placement: "concept",
    related: ["pilot-light", "circuit-breaker"],
    analogy: {
      ko: "도시 재난 훈련. 실제 재난(장애) 전에 의도적으로 훈련해서 대응 능력을 검증",
      en: "City disaster drills. Intentionally runs drills before real disasters (outages) to verify response capabilities",
    },
  },
  {
    id: "multitenancy",
    name: "Multitenancy",
    group: "integration",
    badge: "general",
    desc: {
      ko: "하나의 앱 인스턴스로 여러 고객(테넌트)을 서비스하는 아키텍처. 데이터 격리가 핵심.",
      en: "Architecture serving multiple customers (tenants) from one app instance. Data isolation is key.",
    },
    placement: "concept",
    related: ["rds", "dynamodb", "cognito", "lake-formation"],
    analogy: {
      ko: "공유 오피스 건물. 같은 건물(앱)을 쓰지만 각 회사(테넌트)의 사무실(데이터)은 완전히 분리",
      en: "A shared office building. Same building (app) but each company's (tenant) office space (data) is fully separated",
    },
  },
  {
    id: "gitops",
    name: "GitOps",
    group: "cicd",
    badge: "general",
    desc: {
      ko: "Git 저장소를 인프라/앱의 유일한 진실 소스로 사용하는 배포 방식. ArgoCD, Flux가 대표 도구.",
      en: "Deployment approach using Git as the single source of truth for infrastructure/apps. ArgoCD and Flux are key tools.",
    },
    placement: "concept",
    related: ["argocd", "flux", "cicd", "iac"],
    analogy: {
      ko: "설계도 자동 시공 시스템. 설계도(Git)를 수정하면 건물(클러스터)이 자동으로 변경됨",
      en: "An auto-construction-from-blueprints system. When blueprints (Git) change, buildings (clusters) auto-update",
    },
  },

  // ── 추가 2차: DB/메시징 개념 ──
  {
    id: "read-replica",
    name: "Read Replica",
    group: "data",
    badge: "aws",
    desc: {
      ko: "읽기 전용 DB 복제본. 읽기 트래픽을 분산하여 Primary DB 부하를 줄임. Aurora는 최대 15개.",
      en: "Read-only DB copy. Distributes read traffic to reduce Primary DB load. Aurora supports up to 15.",
    },
    placement: "vpc-isolated",
    related: ["rds", "aurora-serverless", "elasticache"],
    analogy: {
      ko: "도서관 분관. 본관(Primary)이 바쁘면 분관에서 같은 책을 열람할 수 있어 본관 부하를 줄임",
      en: "A library branch. When the main library (Primary) is busy, read the same books at branch libraries to reduce the load",
    },
  },
  {
    id: "pitr",
    name: "PITR",
    group: "data",
    badge: "aws",
    desc: {
      ko: "Point-in-Time Recovery. 보존 기간 내 어떤 시점으로든 DB를 복원할 수 있는 기능.",
      en: "Point-in-Time Recovery. Restore a database to any second within the retention window.",
    },
    placement: "concept",
    related: ["rds", "dynamodb", "aws-backup"],
    analogy: {
      ko: "도시 타임머신. 실수로 데이터를 지웠어도 보존 기간 내 원하는 시점으로 되돌릴 수 있다",
      en: "The city's time machine. Even if data was accidentally deleted, you can go back to any point within the retention period",
    },
  },
  {
    id: "dlq",
    name: "DLQ",
    group: "integration",
    badge: "aws",
    desc: {
      ko: "Dead Letter Queue. 처리에 반복 실패한 메시지를 별도 큐에 보관하여 분석·재처리.",
      en: "Dead Letter Queue. Stores messages that repeatedly failed processing for analysis and reprocessing.",
    },
    placement: "regional-managed",
    related: ["sqs", "sns", "lambda"],
    analogy: {
      ko: "반송 우편함. 배달에 반복 실패한 편지(메시지)를 모아두고, 실패 원인을 나중에 분석",
      en: "A returned mail box. Collects letters (messages) that repeatedly failed delivery for later investigation",
    },
  },
  {
    id: "fifo-queue",
    name: "FIFO Queue",
    group: "integration",
    badge: "aws",
    desc: {
      ko: "SQS FIFO 큐. 메시지 순서를 보장하고, 정확히 한 번만 처리(Exactly-once). 결제 등 순서 중요한 작업에 사용.",
      en: "SQS FIFO queue. Guarantees message ordering and exactly-once processing. Used for payments and order-sensitive tasks.",
    },
    placement: "regional-managed",
    related: ["sqs", "dlq"],
    analogy: {
      ko: "은행 번호표 시스템. 도착 순서대로 정확히 한 번만 처리하고, 새치기(순서 뒤바뀜) 불가",
      en: "A bank queue number system. Processed exactly once in arrival order. No cutting in line (reordering) allowed",
    },
  },

  // ── 추가 2차: 보안/컴플라이언스 ──
  {
    id: "pci-dss",
    name: "PCI-DSS",
    group: "security",
    badge: "general",
    desc: {
      ko: "Payment Card Industry Data Security Standard. 카드 결제 데이터를 처리하는 시스템이 반드시 준수해야 하는 보안 표준.",
      en: "Payment Card Industry Data Security Standard. Mandatory security standard for systems processing card payment data.",
    },
    placement: "concept",
    related: ["waf", "kms", "cloudtrail", "vpc"],
    analogy: {
      ko: "카드 결제 보안 자격증. 이 인증 없이는 도시 안에서 카드 결제를 처리할 수 없다",
      en: "A card payment security certification. Cannot process card payments in the city without this certification",
    },
  },
  {
    id: "hipaa",
    name: "HIPAA",
    group: "security",
    badge: "general",
    desc: {
      ko: "미국 의료정보 보호법. 환자 건강 정보(PHI)의 암호화, 접근 로깅, AWS와 BAA 체결이 필수.",
      en: "US healthcare privacy law. Requires PHI encryption, access logging, and a BAA with AWS.",
    },
    placement: "concept",
    related: ["kms", "cloudtrail", "guardduty"],
    analogy: {
      ko: "환자 정보 보호 규정. 병원(시스템)이 환자 기록을 어떻게 보관·접근해야 하는지 엄격하게 규정",
      en: "Patient data protection regulations. Strictly governs how hospitals (systems) must store and access patient records",
    },
  },
  {
    id: "gdpr",
    name: "GDPR",
    group: "security",
    badge: "general",
    desc: {
      ko: "EU 개인정보 보호법. EU 사용자 데이터는 EU 리전에 저장하거나 표준계약조항(SCC)을 적용해야 함.",
      en: "EU data protection regulation. EU user data must be stored in EU regions or covered by Standard Contractual Clauses.",
    },
    placement: "concept",
    related: ["s3", "rds", "organizations"],
    analogy: {
      ko: "유럽 개인정보 보호법. EU 시민의 데이터를 다룰 때 반드시 따라야 하는 국제 규칙",
      en: "European privacy law. Mandatory international rules when handling data of EU citizens",
    },
  },

  // ── 추가 2차: 인프라/비용 ──
  {
    id: "bastion-host",
    name: "Bastion Host",
    group: "networking",
    badge: "general",
    desc: {
      ko: "퍼블릭 서브넷에 배치된 점프 서버. 프라이빗 서브넷의 리소스에 SSH/RDP로 접근할 때 경유.",
      en: "Jump server in a public subnet. Used to SSH/RDP into private subnet resources.",
    },
    placement: "vpc-public",
    related: ["ssm", "sg", "ec2"],
    analogy: {
      ko: "주거구역 출입 관리소. 프라이빗 구역에 들어가려면 반드시 관리소(Bastion)를 거쳐 신분 확인",
      en: "A residential zone guard house. Must pass through the guard house (Bastion) with ID verification to enter the private area",
    },
  },
  {
    id: "reserved-instance",
    name: "Reserved Instance / Savings Plans",
    group: "compute",
    badge: "aws",
    desc: {
      ko: "1~3년 약정으로 최대 72% 할인받는 요금제. RI는 EC2 전용, Savings Plans는 Lambda·Fargate도 적용.",
      en: "Up to 72% discount with 1–3 year commitment. RI is EC2-only; Savings Plans also cover Lambda and Fargate.",
    },
    placement: "concept",
    related: ["ec2", "fargate", "lambda", "spot-instance"],
    analogy: {
      ko: "장기 임대 계약. 1~3년 계약하면 월세(비용)가 최대 72%까지 내려가는 할인 제도",
      en: "A long-term lease contract. Sign a 1-3 year lease and rent (cost) drops by up to 72%",
    },
  },
];
