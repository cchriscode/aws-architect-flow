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
  badge: "aws" | "general" | "k8s";
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
      ko: "아파트 단지. 외부에서 안 보이고 내부 구역이 나뉘어 있다",
      en: "An apartment complex. Invisible from outside, divided into zones inside",
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
      ko: "아파트 단지 안의 동(棟). 1동은 외부 출입 가능, 2동은 내부 전용",
      en: "Buildings within a complex. Building 1 has public access, Building 2 is internal only",
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
      ko: "아파트 단지 정문. 외부와 통하는 유일한 출입구",
      en: "The main gate of the complex. The only entrance from outside",
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
      ko: "아파트 택배함. 안에서 밖으로 보내는 건 되지만, 밖에서 직접 문 앞까지 올 수 없다",
      en: "A mailroom. You can send packages out, but outsiders can't come directly to your door",
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
      ko: "단지 내 편의점. 밖에 나가지 않고 단지 안에서 바로 이용",
      en: "A convenience store inside the complex. No need to go outside",
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
      ko: "도로 표지판. '서울 방면 → 이쪽', '부산 방면 → 저쪽' 같은 안내판",
      en: "Road signs. 'To Seoul → this way', 'To Busan → that way'",
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
      ko: "세대 현관 도어록. 허용된 사람만 들어올 수 있다",
      en: "Your apartment door lock. Only authorized people can enter",
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
      ko: "아파트 동 출입구 경비원. 세대 도어록(SG)과는 별도로 동 입구에서 검사",
      en: "Building entrance guard. Separate from your door lock (SG), checks at the building entrance",
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
      ko: "전화번호부. 'example.com'이라는 이름을 실제 서버 주소로 안내",
      en: "A phone book. Translates 'example.com' to the actual server address",
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
      ko: "전국 편의점 체인. 본사(원본 서버) 대신 가까운 편의점(엣지)에서 바로 제공",
      en: "A nationwide convenience chain. Serves from the nearest store (edge) instead of HQ (origin)",
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
      ko: "건물 보안 검색대. 위험한 물건(공격 패턴)을 가진 사람은 입장 거부",
      en: "Building security checkpoint. Denies entry to those carrying dangerous items (attack patterns)",
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
      ko: "건물 경비 시스템. 기본(Standard)은 일반 경비, 고급(Advanced)은 특수 경호",
      en: "Building security system. Standard is regular guards, Advanced is special protection",
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
      ko: "백화점 안내 데스크. '의류는 3층, 식품은 지하'처럼 요청을 적절한 곳으로 안내",
      en: "A department store info desk. Directs requests — 'clothing floor 3, food basement'",
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
      ko: "고속도로 톨게이트. 내용을 확인하지 않고 빠르게 통과시킨다",
      en: "A highway toll gate. Passes traffic through quickly without inspecting contents",
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
      ko: "호텔 프론트 데스크. 모든 요청을 접수·검증한 뒤 담당 부서로 전달",
      en: "A hotel front desk. Receives and verifies every request before routing to the right department",
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
      ko: "임대 서버. 사양을 고르고, OS를 설치하고, 직접 관리한다",
      en: "A rented server. You pick specs, install OS, and manage it yourself",
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
      ko: "마트 계산대. 손님이 많으면 계산대를 열고, 한산하면 줄인다",
      en: "Grocery checkout lanes. Opens more when busy, closes when quiet",
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
      ko: "자판기. 버튼(이벤트)을 누르면 원하는 것(코드)이 실행되고, 안 쓸 때는 전기 안 먹음",
      en: "A vending machine. Press a button (event), get your result (code runs), zero cost when idle",
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
      ko: "배달 전문 주방. 공간(서버)은 알아서 제공되고, 요리(컨테이너)만 하면 된다",
      en: "A ghost kitchen. Space (servers) is provided automatically, you just cook (run containers)",
    },
  },

  // ── 4. 컨테이너 & K8s ──
  {
    id: "docker",
    name: "Docker",
    group: "container",
    badge: "general",
    desc: {
      ko: "애플리케이션과 모든 의존성을 패키징하는 컨테이너 기술. 어디서든 동일하게 실행.",
      en: "Container technology that packages apps with all dependencies. Runs identically anywhere.",
    },
    placement: "concept",
    related: ["container", "ecs", "eks", "ecr"],
    analogy: {
      ko: "이사 박스. 짐(코드+라이브러리)을 한 박스에 넣으면 어느 집(서버)에서든 바로 사용",
      en: "A moving box. Pack your stuff (code+libs) in a box and it works in any house (server)",
    },
  },
  {
    id: "container",
    name: "Container",
    group: "container",
    badge: "general",
    desc: {
      ko: "Docker 이미지를 실행한 인스턴스. 가볍고 빠르게 시작하며, 호스트 OS를 공유.",
      en: "A running instance of a Docker image. Lightweight, fast to start, shares host OS.",
    },
    placement: "concept",
    related: ["docker", "pod"],
    analogy: {
      ko: "실행 중인 앱. 박스(이미지)를 열어서 실제로 사용하고 있는 상태",
      en: "A running app. The box (image) has been opened and is in active use",
    },
  },
  {
    id: "docker-image",
    name: "Docker Image",
    group: "container",
    badge: "general",
    desc: {
      ko: "컨테이너를 만들기 위한 읽기 전용 템플릿. Dockerfile로 빌드하며, ECR 등 레지스트리에 저장.",
      en: "Read-only template for creating containers. Built from a Dockerfile and stored in registries like ECR.",
    },
    placement: "concept",
    related: ["docker", "container", "ecr", "dockerfile"],
    analogy: {
      ko: "붕어빵 틀. 틀(이미지)로 붕어빵(컨테이너)을 찍어낸다. 틀 자체는 변하지 않음",
      en: "A waffle mold. The mold (image) stamps out waffles (containers). The mold itself doesn't change",
    },
  },
  {
    id: "dockerfile",
    name: "Dockerfile",
    group: "container",
    badge: "general",
    desc: {
      ko: "Docker 이미지를 만드는 설정 파일. OS, 의존성, 실행 명령 등을 순서대로 정의.",
      en: "Configuration file for building Docker images. Defines OS, dependencies, and run commands in order.",
    },
    placement: "concept",
    related: ["docker", "docker-image", "multi-stage-build"],
    analogy: {
      ko: "요리 레시피. '재료 준비 → 조리 → 담기' 순서대로 따라하면 같은 요리(이미지)가 완성",
      en: "A cooking recipe. Follow 'prep → cook → plate' in order and the same dish (image) is produced",
    },
  },
  {
    id: "multi-stage-build",
    name: "Multi-stage Build",
    group: "container",
    badge: "general",
    desc: {
      ko: "Dockerfile을 여러 단계로 나누어 최종 이미지 크기를 줄이는 기법. 빌드 도구는 버리고 실행 파일만 복사.",
      en: "Technique splitting Dockerfile into stages to minimize final image size. Discards build tools, copies only binaries.",
    },
    placement: "concept",
    related: ["dockerfile", "docker-image", "ecr"],
    analogy: {
      ko: "공장에서 완성품만 출하. 제조 도구(빌드 도구)는 공장에 남기고 제품(실행 파일)만 배송",
      en: "Shipping only finished goods. Manufacturing tools (build tools) stay in the factory, only products (binaries) ship",
    },
  },
  {
    id: "docker-compose",
    name: "Docker Compose",
    group: "container",
    badge: "general",
    desc: {
      ko: "여러 컨테이너를 YAML 파일 하나로 정의·실행하는 도구. 로컬 개발 환경 구성에 주로 사용.",
      en: "Tool to define and run multiple containers with a single YAML file. Mainly used for local development setup.",
    },
    placement: "concept",
    related: ["docker", "container", "ecs"],
    analogy: {
      ko: "세트 메뉴 주문서. '밥 + 국 + 반찬'을 한 장(YAML)에 적으면 한 번에 전부 나옴",
      en: "A combo meal order. Write 'rice + soup + sides' on one sheet (YAML) and everything comes at once",
    },
  },
  {
    id: "container-registry",
    name: "Container Registry",
    group: "container",
    badge: "general",
    desc: {
      ko: "Docker 이미지를 저장·배포하는 저장소. Docker Hub, ECR, GitHub Container Registry 등.",
      en: "Repository for storing and distributing Docker images. Docker Hub, ECR, GitHub Container Registry, etc.",
    },
    placement: "concept",
    related: ["docker-image", "ecr", "docker"],
    analogy: {
      ko: "앱스토어. 만든 앱(이미지)을 올려두고, 필요한 서버에서 다운로드해서 실행",
      en: "An app store. Upload your app (image) and any server can download and run it",
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
      ko: "오토바이 사이드카. 본체(메인 앱) 옆에 붙어서 짐(부가 기능)을 나르는 보조 칸",
      en: "A motorcycle sidecar. Attached to the main vehicle (app) to carry extra cargo (auxiliary functions)",
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
      ko: "물류 센터장. 수많은 택배(컨테이너)를 어디에 배치하고, 고장 나면 교체할지 관리",
      en: "A logistics center manager. Decides where to place each package (container) and replaces broken ones",
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
      ko: "같은 방을 쓰는 룸메이트. 네트워크·스토리지를 공유하는 컨테이너 묶음",
      en: "Roommates sharing a room. A group of containers sharing network and storage",
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
      ko: "건물 한 층. Pod(방)들이 이 층(Node) 위에서 돌아간다",
      en: "A floor in a building. Pods (rooms) run on this floor (Node)",
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
      ko: "이케아 조립 설명서. 여러 부품(K8s 리소스)을 한 묶음으로 조립 가능",
      en: "IKEA assembly instructions. Assembles multiple parts (K8s resources) into one package",
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
      ko: "AWS 전용 배달 관리 시스템. 복잡한 물류센터(K8s) 대신 간편 배달 앱",
      en: "AWS's own delivery management. A simpler delivery app instead of a full logistics center (K8s)",
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
      ko: "프랜차이즈 물류센터. 본사(AWS)가 관리 시스템을 제공하고, 운영은 내가 한다",
      en: "A franchise logistics center. HQ (AWS) provides management, you handle operations",
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
      ko: "레시피 보관함. 요리법(이미지)을 저장해두고 필요할 때 꺼내 쓴다",
      en: "A recipe cabinet. Stores recipes (images) and retrieves them when needed",
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
      ko: "사내 전화 교환기. 부서(서비스) 간 통화를 자동 연결·녹음·보안 처리",
      en: "An office phone switchboard. Auto-connects, records, and secures calls between departments (services)",
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
      ko: "엑셀 표. 행과 열이 있는 정형 데이터를 저장. AWS가 백업·업데이트를 대신 해줌",
      en: "An Excel spreadsheet. Stores structured row/column data. AWS handles backup and updates",
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
      ko: "사물함. 번호(키)로 물건(값)을 넣고 빼는 초고속 저장소",
      en: "A locker system. Put in and retrieve items (values) by number (key) at ultra-high speed",
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
      ko: "자주 쓰는 전화번호 즐겨찾기. 매번 전화번호부(DB)를 뒤지지 않고 바로 연결",
      en: "Phone speed dial. Instead of looking up the phone book (DB) every time, connect instantly",
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
      ko: "도서관 검색 시스템. 수백만 권의 책(데이터)에서 원하는 내용을 순식간에 찾아줌",
      en: "A library search system. Finds what you need instantly across millions of books (data)",
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
      ko: "무한 창고. 어떤 물건(파일)이든 넣으면 안전하게 보관해주고, 필요할 때 꺼내준다",
      en: "An infinite warehouse. Store anything (files) safely and retrieve when needed",
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
      ko: "USB 외장하드. 서버(EC2)에 꽂아서 쓰는 추가 저장 공간",
      en: "A USB external hard drive. Extra storage plugged into your server (EC2)",
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
      ko: "회사 공유 폴더. 여러 컴퓨터(서버)에서 동시에 같은 파일을 읽고 쓸 수 있다",
      en: "A company shared folder. Multiple computers (servers) can read/write the same files simultaneously",
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
      ko: "음식점 대기표. 주문(메시지)을 대기열에 넣으면 순서대로 처리",
      en: "A restaurant waiting list. Orders (messages) are queued and processed in order",
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
      ko: "학교 방송 시스템. 한 번 방송하면 모든 교실(구독자)이 동시에 들음",
      en: "A school PA system. One broadcast is heard by all classrooms (subscribers) at once",
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
      ko: "우편 분류 센터. 편지(이벤트)의 주소(규칙)를 보고 적절한 목적지로 배달",
      en: "A mail sorting center. Reads the address (rules) on letters (events) and delivers to the right destination",
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
      ko: "컨베이어 벨트. 끊임없이 들어오는 물건(데이터)을 실시간으로 운반·분류",
      en: "A conveyor belt. Continuously transports and sorts incoming items (data) in real time",
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
      ko: "요리 레시피. '재료 손질 → 볶기 → 끓이기' 각 단계를 순서대로 자동 실행",
      en: "A cooking recipe. Automatically runs 'prep → stir-fry → simmer' steps in order",
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
      ko: "대형 물류 허브. Kinesis보다 더 대규모·복잡한 물류(이벤트) 처리에 적합",
      en: "A major logistics hub. Better suited for larger/more complex logistics (events) than Kinesis",
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
      ko: "회사 사원증 시스템. 부서(역할)에 따라 출입 가능 구역(권한)이 다르다",
      en: "A company badge system. Access areas (permissions) differ by department (role)",
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
      ko: "금고 열쇠 관리인. 모든 금고(암호화된 데이터)의 열쇠를 안전하게 보관",
      en: "A vault key keeper. Securely stores keys for all vaults (encrypted data)",
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
      ko: "건물 출입 시스템. 얼굴(비밀번호), 카드(소셜 로그인), 지문(MFA)으로 본인 확인",
      en: "Building access system. Verifies identity via face (password), card (social login), fingerprint (MFA)",
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
      ko: "CCTV + AI 감지. 건물 곳곳을 모니터링하다 수상한 행동을 자동 알림",
      en: "CCTV with AI. Monitors the building everywhere and auto-alerts on suspicious behavior",
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
      ko: "사업자 등록증. 이 사이트가 진짜임을 증명하는 공인 인증서",
      en: "A business license. An official certificate proving this site is legitimate",
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
      ko: "비밀번호 관리 앱(1Password). 모든 비밀번호를 안전하게 저장하고 주기적으로 변경",
      en: "A password manager (like 1Password). Stores all passwords safely and rotates them periodically",
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
      ko: "건물 출입 기록부. 누가 언제 어디를 다녀갔는지 전부 기록",
      en: "A building access log. Records who went where and when — everything",
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
      ko: "자동 조립 라인. 부품(코드)을 넣으면 검수(테스트) 후 완성품(배포)이 나온다",
      en: "An assembly line. Put in parts (code), inspect (test), and out comes the finished product (deploy)",
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
      ko: "호텔 방 교체. 새 방(Green)을 완벽히 준비한 뒤, 손님을 한 번에 이동",
      en: "A hotel room swap. Prepare the new room (Green) perfectly, then move all guests at once",
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
      ko: "시식 행사. 전체 출시 전에 소수에게 먼저 맛보게 해서 반응을 확인",
      en: "A tasting event. Let a few try before the full launch to check reactions",
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
      ko: "전구 교체. 100개 전구를 한 번에 끄지 않고, 하나씩 새것으로 교체",
      en: "Replacing light bulbs. Instead of turning off all 100, replace them one at a time",
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
      ko: "택배 물류 시스템. 주문(코드) 접수 → 포장(빌드) → 검수(테스트) → 배송(배포) 자동화",
      en: "A delivery logistics system. Order (code) → pack (build) → inspect (test) → ship (deploy) automated",
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
      ko: "건물 관리실 모니터. 전기·수도·엘리베이터 상태를 실시간 확인하고, 이상 시 알림",
      en: "A building management room monitor. Real-time status of electricity, water, elevators, with alerts on anomalies",
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
      ko: "택배 추적 시스템. 물건(요청)이 어디서 멈추고, 어디서 지연되는지 추적",
      en: "A package tracking system. Tracks where items (requests) stall or get delayed",
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
      ko: "설계 도면. 도면(코드)대로 건물(인프라)을 정확히 재현할 수 있다",
      en: "Architecture blueprints. Build the exact same building (infrastructure) from the blueprint (code)",
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
      ko: "프로그래밍 가능한 레고. 코드로 블록(AWS 리소스)을 조립하는 IaC 도구",
      en: "Programmable LEGO. An IaC tool that assembles blocks (AWS resources) with code",
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
      ko: "만능 설계 도면. AWS뿐 아니라 어떤 클라우드든 같은 형식으로 설계 가능",
      en: "Universal blueprints. Design any cloud — not just AWS — in the same format",
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
      ko: "두 아파트 단지를 잇는 구름다리. 밖에 나가지 않고 직접 이동 가능",
      en: "A skybridge between two apartment complexes. Move directly without going outside",
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
      ko: "지하철 환승역. 여러 노선(VPC)이 한 역(허브)에서 만나 자유롭게 환승",
      en: "A subway transfer station. Multiple lines (VPCs) meet at one hub for free interchange",
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
      ko: "전용 고속도로. 일반 도로(인터넷) 대신 나만 쓰는 전용 도로로 AWS에 접속",
      en: "A private highway. Access AWS via your own dedicated road instead of public roads (internet)",
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
      ko: "암호화된 비밀 터널. 인터넷 위에 보안 터널을 만들어 안전하게 통신",
      en: "An encrypted secret tunnel. Creates a secure tunnel over the internet for safe communication",
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
      ko: "도로 CCTV 녹화. 어떤 차(패킷)가 언제 어디로 갔는지 전부 녹화",
      en: "Traffic camera recordings. Records which car (packet) went where and when",
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
      ko: "지하 통로. 밖에 나가지 않고 건물 지하로 연결된 비밀 통로",
      en: "An underground passage. A secret path connecting buildings without going outside",
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
      ko: "VIP 전용 고속도로. 일반 인터넷 대신 AWS 전용 네트워크로 빠르게 이동",
      en: "A VIP express highway. Travels via AWS's private network instead of the public internet",
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
      ko: "편의점 계산대 옆 간단 서비스. 복잡한 일은 못 하지만 빠른 처리에 최적",
      en: "Quick services at a convenience store counter. Can't do complex tasks but optimized for speed",
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
      ko: "각 지점에 배치된 전문 직원. 본사(리전)까지 가지 않고 현장에서 복잡한 업무 처리",
      en: "Specialist staff at each branch. Handles complex work on-site without going to HQ (region)",
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
      ko: "연비 좋은 하이브리드 차. 같은 거리를 더 적은 연료(비용)로 달린다",
      en: "A fuel-efficient hybrid car. Covers the same distance with less fuel (cost)",
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
      ko: "항공 땡처리 좌석. 매우 싸지만 갑자기 취소될 수 있다",
      en: "Last-minute flight deals. Very cheap but could be cancelled suddenly",
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
      ko: "스마트 주차장 관리인. 차(Pod)가 오면 즉시 최적의 주차공간(노드)을 배정",
      en: "A smart parking attendant. Instantly assigns the best spot (node) when a car (Pod) arrives",
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
      ko: "자동 동기화 비서. 설계도(Git)가 바뀌면 건물(클러스터)을 자동으로 업데이트",
      en: "An auto-sync secretary. When blueprints (Git) change, automatically updates the building (cluster)",
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
      ko: "ArgoCD의 대안. 같은 자동 동기화지만 UI 없이 더 가볍게 동작",
      en: "Alternative to ArgoCD. Same auto-sync but lighter without a UI",
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
      ko: "자동 교통 관제 시스템. 모든 도로(서비스 간 통신)에 교통경찰(Envoy)을 배치",
      en: "An automatic traffic control system. Places traffic cops (Envoy) on every road (service communication)",
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
      ko: "주문량 연동 주방 인원 조절. 주문(이벤트)이 밀리면 요리사(Pod)를 자동 투입",
      en: "Kitchen staff scaling by order volume. When orders (events) pile up, chefs (Pods) are auto-deployed",
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
      ko: "건물 안내 데스크. 방문자(요청)를 확인하고 적절한 사무실(서비스)로 안내",
      en: "Building reception desk. Checks visitors (requests) and directs them to the right office (service)",
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
      ko: "자동 인증서 발급기. 만료 전에 알아서 새 인증서로 교체",
      en: "An automatic certificate issuer. Replaces certificates automatically before they expire",
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
      ko: "비밀번호 자동 배달. 금고(Secrets Manager)에서 필요한 비밀번호를 자동으로 가져다 놓음",
      en: "Automatic password delivery. Fetches needed passwords from the vault (Secrets Manager) automatically",
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
      ko: "클러스터 타임머신. 문제가 생기면 이전 시점으로 되돌릴 수 있다",
      en: "A cluster time machine. If something goes wrong, roll back to a previous point in time",
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
      ko: "체온계·혈압계 모음. 클러스터의 건강 수치(메트릭)를 지속적으로 측정",
      en: "A collection of health monitors. Continuously measures the cluster's vital signs (metrics)",
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
      ko: "병원 모니터 화면. 환자(서버)의 심박수·혈압(메트릭)을 한눈에 보여줌",
      en: "Hospital monitor screen. Shows a patient's (server's) heart rate and blood pressure (metrics) at a glance",
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
      ko: "일기장 검색 엔진. 방대한 일기(로그)에서 원하는 날짜·키워드를 빠르게 찾음",
      en: "A diary search engine. Quickly finds dates and keywords in massive diaries (logs)",
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
      ko: "우체부. 각 집(컨테이너)의 편지(로그)를 수거해서 우체국(저장소)에 배달",
      en: "A mail carrier. Picks up letters (logs) from each house (container) and delivers to the post office (storage)",
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
      ko: "건물 규정집. '이 층에는 이런 것만 허용' 같은 규칙을 자동 적용",
      en: "Building regulations. Auto-enforces rules like 'only these things are allowed on this floor'",
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
      ko: "초고속 네트워크 경찰. 커널 수준에서 트래픽을 감시하고 규칙을 적용",
      en: "Ultra-fast network police. Monitors traffic and enforces rules at the kernel level",
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
      ko: "자동 확장 식탁. 손님이 많으면 커지고, 적으면 줄어드는 스마트 테이블",
      en: "An auto-expanding dining table. Gets bigger with more guests, shrinks when fewer",
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
      ko: "DynamoDB 전용 즐겨찾기. 자주 찾는 데이터를 메모리에 저장해 초고속 응답",
      en: "DynamoDB's own speed dial. Stores frequently accessed data in memory for ultra-fast responses",
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
      ko: "거대한 분석 전용 도서관. 수백만 권의 책(데이터)을 한 번에 분석하는 데 특화",
      en: "A massive analytics-only library. Specialized in analyzing millions of books (data) at once",
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
      ko: "체온 기록표. 시간대별 데이터를 순서대로 기록하고 추이를 분석",
      en: "A temperature log chart. Records data chronologically and analyzes trends",
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
      ko: "창고(S3) 검색 도구. 물건을 옮기지 않고 창고에서 바로 원하는 걸 찾아냄",
      en: "A warehouse (S3) search tool. Finds what you need right in the warehouse without moving anything",
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
      ko: "자동 백업 금고. 모든 귀중품(데이터)을 정해진 시간에 자동으로 안전한 곳에 복사",
      en: "An automatic backup vault. Copies all valuables (data) to a safe place on schedule",
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
      ko: "만능 리모컨. 여러 가전(데이터 소스)을 하나의 리모컨(API)으로 조작",
      en: "A universal remote. Controls multiple appliances (data sources) with one remote (API)",
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
      ko: "스마트홈 허브. 집 안의 모든 센서·기기를 중앙에서 연결·제어",
      en: "A smart home hub. Connects and controls all sensors and devices in the house centrally",
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
      ko: "데이터 가공 공장. 원재료(Raw 데이터)를 받아서 정리·변환·배달",
      en: "A data processing factory. Takes raw materials (data), cleans, transforms, and delivers them",
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
      ko: "통합 보안 관제 센터. 모든 보안 카메라(서비스)의 영상을 한 화면에서 모니터링",
      en: "A unified security operations center. Monitors all security camera (service) feeds on one screen",
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
      ko: "건물 안전 점검관. 정기적으로 건물(인프라)의 약한 부분을 찾아서 보고",
      en: "A building safety inspector. Regularly finds and reports weak spots in the building (infrastructure)",
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
      ko: "민감 정보 탐지견. 창고(S3)를 돌아다니며 숨겨진 개인정보를 찾아냄",
      en: "A sensitive data sniffer dog. Roams the warehouse (S3) finding hidden personal information",
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
      ko: "건물 설비 변경 기록부. 어떤 설비가 언제 바뀌었는지 기록하고 규정 위반 여부 검사",
      en: "A facility change log. Records when equipment changed and checks for regulation violations",
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
      ko: "원격 서버 관리 리모컨. SSH 키 없이도 서버에 접속하고, 설정값을 안전하게 보관",
      en: "A remote server management tool. Access servers without SSH keys and store settings securely",
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
      ko: "그룹사 본사. 각 계열사(계정)가 할 수 있는 일의 범위를 본사에서 통제",
      en: "A corporate HQ. Controls what each subsidiary (account) is allowed to do",
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
      ko: "신도시 마스터플랜. 도로·상하수도(보안·로깅)를 자동으로 깔아주는 도시 설계",
      en: "A new city master plan. Automatically lays out roads and utilities (security, logging)",
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
      ko: "만능 출입 카드. 하나의 카드로 모든 건물(계정)에 출입",
      en: "A master access card. One card to enter all buildings (accounts)",
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
      ko: "GitHub 전속 비서. 코드를 올리면 자동으로 검사·포장·배송까지 처리",
      en: "GitHub's personal assistant. Automatically inspects, packages, and ships when you push code",
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
      ko: "GitLab 전속 비서. GitHub Actions와 같은 역할이지만 GitLab 환경에서 동작",
      en: "GitLab's personal assistant. Same role as GitHub Actions but runs in the GitLab environment",
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
      ko: "AWS 전용 설계 도면. AWS 리소스를 템플릿 파일 하나로 자동 생성",
      en: "AWS-specific blueprints. Auto-creates all AWS resources from a single template file",
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
      ko: "컨테이너 전용 건강 검진. 각 컨테이너의 상태를 자동으로 체크하고 기록",
      en: "Container-specific health checkups. Automatically checks and records each container's status",
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
      ko: "관리형 건강 모니터. 직접 장비를 관리하지 않아도 AWS가 모니터링 시스템을 운영",
      en: "A managed health monitor. AWS runs the monitoring system so you don't manage the equipment",
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
      ko: "전용 핫라인. 일반 전화(REST)보다 빠르고 효율적인 서비스 간 직통 회선",
      en: "A dedicated hotline. A faster, more efficient direct line between services than regular calls (REST)",
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
      ko: "맞춤형 뷔페. 원하는 음식(데이터)만 정확히 골라 담을 수 있다",
      en: "A custom buffet. Pick exactly the dishes (data) you want, nothing more",
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
      ko: "전화 통화. HTTP(편지)와 달리 양쪽이 동시에 실시간으로 대화",
      en: "A phone call. Unlike HTTP (letters), both sides talk in real time simultaneously",
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
      ko: "전기 차단기. 과부하(장애)가 오면 자동으로 전기(요청)를 끊어 화재(연쇄 장애)를 방지",
      en: "An electrical circuit breaker. Cuts power (requests) on overload (failure) to prevent fire (cascading failure)",
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
      ko: "여행 예약 시스템. 항공→호텔→렌터카 순서대로 예약하고, 중간에 실패하면 앞의 예약도 취소",
      en: "A trip booking system. Books flight→hotel→car in order; if one fails, cancels all previous bookings",
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
      ko: "등기 우편. 편지(이벤트)를 보낸 기록을 우체국(DB)에 남겨서 분실을 방지",
      en: "Registered mail. Records the letter (event) at the post office (DB) to prevent loss",
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
      ko: "올인원 배달 서비스. 요리(코드)만 주면 포장·배달·인원 조절까지 전부 해줌",
      en: "An all-in-one delivery service. Just hand over the food (code) and it handles packaging, delivery, and staffing",
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
      ko: "자동 세탁기. 빨래(작업)를 넣으면 알아서 돌리고, 양이 많으면 세탁기를 더 켬",
      en: "An automatic washing machine. Load laundry (jobs), it runs itself, and spins up more machines when busy",
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
      ko: "자동 분류 택배 시스템. 물건(데이터)이 들어오면 목적지(S3/Redshift)로 자동 배송",
      en: "An auto-sorting delivery system. Items (data) are auto-shipped to their destination (S3/Redshift)",
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
      ko: "은행 번호표 시스템. 창구(DB 커넥션)가 한정되니 대기표로 순서대로 처리",
      en: "A bank queue system. Limited counters (DB connections), so a ticket system processes in order",
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
      ko: "자동 보고서 생성기. 데이터를 넣으면 예쁜 차트·그래프가 자동으로 나옴",
      en: "An auto-report generator. Feed in data and beautiful charts and graphs come out automatically",
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
      ko: "AI 요리 학원. 재료 준비(데이터)부터 요리(학습), 레스토랑 오픈(배포)까지 전부 지원",
      en: "An AI cooking school. From ingredient prep (data) to cooking (training) to opening a restaurant (deployment)",
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
      ko: "데이터 도서관 사서. 모든 책(데이터)을 정리하고, 누가 어떤 페이지를 볼 수 있는지 관리",
      en: "A data library librarian. Organizes all books (data) and controls who can read which pages",
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
      ko: "미스터리 쇼퍼. 가짜 손님(스크립트)을 보내 매장(서비스)이 정상 운영되는지 확인",
      en: "A mystery shopper. Sends fake customers (scripts) to check if the store (service) is operating normally",
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
      ko: "사내 내선 전화. 부서(서비스) 이름만 누르면 자동으로 연결되고 통화 기록도 남음",
      en: "An office intercom. Just press a department (service) name and you're connected, with call logs included",
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
      ko: "회사 내선번호부. 부서 이름(서비스명)으로 전화번호(IP)를 자동 조회",
      en: "An office phone directory. Auto-looks up phone numbers (IPs) by department name (service name)",
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
      ko: "표준 양식 관리소. 모든 부서가 같은 양식(스키마)을 쓰도록 버전 관리",
      en: "A standard forms office. Ensures all departments use the same forms (schemas) with version control",
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
      ko: "마트 계산대 자동 관리. 줄(CPU)이 길어지면 계산대(Pod)를 열고, 한산하면 닫음",
      en: "Auto-managing checkout lanes. Opens lanes (Pods) when lines (CPU) get long, closes when quiet",
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
      ko: "맞춤 양복. 기성복(기본 설정) 대신 체형(실제 사용량)에 맞게 옷(리소스)을 조정",
      en: "A tailored suit. Adjusts clothes (resources) to fit your body (actual usage) instead of off-the-rack (defaults)",
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
      ko: "주차장 관리인(구형). 빈 주차장(노드)이 부족하면 늘리고, 남으면 줄임. Karpenter보다 느림",
      en: "An old-school parking attendant. Adds/removes lots (nodes) as needed. Slower than Karpenter",
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
      ko: "회사 직급별 권한. 인턴은 열람만, 팀장은 수정 가능, 임원은 삭제까지 가능",
      en: "Company rank-based permissions. Interns can view, managers can edit, executives can delete",
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
      ko: "공유 오피스의 각 사무실. 같은 건물(클러스터)이지만 각 회사(팀)가 독립된 공간을 사용",
      en: "Offices in a shared building. Same building (cluster) but each company (team) uses its own space",
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
      ko: "팀별 법인카드. 모든 직원이 대표 카드를 쓰는 대신, 팀마다 권한이 다른 카드를 발급",
      en: "Team-specific corporate cards. Instead of sharing one card, each team gets a card with specific limits",
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
      ko: "건물 내 내선번호 안내. '영업팀'이라고 하면 내선번호(IP)를 자동으로 알려줌",
      en: "An in-building extension directory. Say 'sales team' and it auto-tells you the extension number (IP)",
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
      ko: "자동 전화번호부 등록. 새 부서(서비스)가 생기면 전화번호부(DNS)에 자동 등록",
      en: "Auto phone book registration. When a new dept (service) is created, it's auto-added to the phone book (DNS)",
    },
  },
  {
    id: "app-mesh",
    name: "App Mesh",
    group: "container",
    badge: "aws",
    desc: {
      ko: "AWS 관리형 서비스 메시. Envoy 프록시 기반으로 ECS/EKS/EC2 서비스 간 통신을 관리.",
      en: "AWS-managed service mesh. Manages communication between ECS/EKS/EC2 services via Envoy proxy.",
    },
    placement: "regional-managed",
    related: ["istio", "service-mesh", "envoy"],
    analogy: {
      ko: "AWS 전용 교통 관제. Istio와 같은 역할이지만 AWS가 직접 관리",
      en: "AWS's own traffic control. Same role as Istio but managed directly by AWS",
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
      ko: "만능 통역사. 서비스 사이에서 통신을 중계하고, 모니터링·보안까지 처리",
      en: "A versatile interpreter. Relays communication between services while handling monitoring and security",
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
      ko: "택배 GPS 추적. 물건(요청)이 각 거점(서비스)을 거치는 경로를 지도에 표시",
      en: "Package GPS tracking. Maps the route of items (requests) through each waypoint (service)",
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
      ko: "지하철 노선도. 모든 역(서비스)과 노선(트래픽)을 한눈에 보여줌",
      en: "A subway map. Shows all stations (services) and routes (traffic) at a glance",
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
      ko: "네트워크 현미경. 커널 수준에서 모든 패킷의 이동을 실시간으로 관찰",
      en: "A network microscope. Observes every packet's movement in real time at the kernel level",
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
      ko: "커널 안에 심은 CCTV. OS 깊숙한 곳에서 네트워크를 초고속으로 감시·제어",
      en: "CCTV planted inside the kernel. Monitors and controls networking at ultra-high speed deep in the OS",
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
      ko: "쌍방 신분증 확인. 방문자도 신분증을 보여주고, 건물 측도 신분증을 보여줘야 입장",
      en: "Two-way ID check. Both the visitor and the building show their IDs before entry is allowed",
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
      ko: "무전기. 적은 전력으로 짧은 메시지를 빠르게 주고받는 통신 방식",
      en: "A walkie-talkie. Quickly exchanges short messages with minimal power consumption",
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
      ko: "놀이공원 자유이용권 팔찌. 팔찌(토큰)만 보여주면 매번 매표소(서버)에 안 가도 됨",
      en: "An amusement park wristband. Just show the band (token) — no need to visit the ticket booth (server) each time",
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
      ko: "소셜 로그인 표준. 'Google로 로그인' 같은 기능의 기반 기술",
      en: "The social login standard. The technology behind 'Sign in with Google' features",
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
      ko: "회사 통합 출입증. 본사 카드(IdP) 하나로 모든 계열사(서비스)에 출입",
      en: "A corporate master badge. One HQ card (IdP) grants access to all subsidiaries (services)",
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
      ko: "전담 비서. 대표(백엔드)가 하나여도 각 고객(프론트엔드)마다 전담 비서(BFF)가 맞춤 응대",
      en: "A dedicated secretary. One CEO (backend) but each client (frontend) gets a personal secretary (BFF)",
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
      ko: "보일러 점화 불씨. 평소에는 작은 불씨(최소 인프라)만 유지하다가, 필요하면 풀 가동",
      en: "A boiler pilot flame. Maintains just a tiny flame (minimal infra) until full heat (scaling) is needed",
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
      ko: "소방 훈련. 실제 화재(장애) 전에 미리 훈련해서 대응 능력을 확인",
      en: "A fire drill. Practice before a real fire (outage) to verify response capabilities",
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
      ko: "공유 오피스. 같은 건물(앱)을 쓰지만 각 회사(테넌트)의 사무실(데이터)은 완전히 분리",
      en: "A shared office building. Same building (app) but each company's (tenant) office (data) is fully separated",
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
      ko: "설계도 자동 시공. 설계도(Git)를 수정하면 건물(클러스터)이 자동으로 변경됨",
      en: "Auto-construction from blueprints. When blueprints (Git) change, the building (cluster) auto-updates",
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
      ko: "복사본 도서관. 원본(Primary) 도서관이 바쁘면 복사본 도서관에서 책을 열람",
      en: "A copy library. When the original (Primary) library is busy, read books at copy libraries",
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
      ko: "타임머신. 실수로 데이터를 지웠어도 원하는 시점으로 되돌릴 수 있다",
      en: "A time machine. Even if data was accidentally deleted, you can go back to any point in time",
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
      ko: "반송 우편함. 배달 실패한 편지(메시지)를 모아두고, 왜 실패했는지 나중에 확인",
      en: "A returned mail box. Collects undeliverable letters (messages) for later investigation",
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
      ko: "은행 번호표. 도착 순서대로 정확히 한 번만 처리. 새치기(순서 뒤바뀜) 불가",
      en: "Bank queue numbers. Processed exactly once in arrival order. No cutting in line (reordering)",
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
      ko: "카드 결제 보안 자격증. 이 인증 없이는 카드 결제를 처리할 수 없다",
      en: "A card payment security certification. Can't process card payments without this certification",
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
      ko: "환자 정보 보호 규정. 병원(시스템)이 환자 기록을 어떻게 보관·접근해야 하는지 규정",
      en: "Patient data protection rules. Governs how hospitals (systems) must store and access patient records",
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
      ko: "유럽 개인정보 보호법. EU 시민의 데이터를 다룰 때 반드시 따라야 하는 규칙",
      en: "European privacy law. Mandatory rules when handling data of EU citizens",
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
      ko: "경비실. 프라이빗 구역에 들어가려면 반드시 경비실(Bastion)을 거쳐야 함",
      en: "A guard house. Must pass through the guard house (Bastion) to enter the private area",
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
      ko: "휴대폰 약정 요금제. 2년 약정(RI)하면 월 요금이 크게 내려가는 것과 같은 원리",
      en: "A phone contract plan. Commit for 2 years (RI) and the monthly bill drops significantly",
    },
  },
];
