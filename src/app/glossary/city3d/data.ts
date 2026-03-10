/** 3D City layout — buildings, streets, signs, standalone elements */

// ── Types ──

export interface Building3D {
  id: string;
  label: { ko: string; en: string };
  pos: [number, number, number];
  size: [number, number, number]; // w, h, d
  color: string;
  termIds: string[];
  style: "office" | "tower" | "warehouse" | "civic" | "factory";
  floors: number;
  windowCols: number;
}

export interface Standalone3D {
  id: string;
  termId: string;
  pos: [number, number, number];
  size: [number, number, number];
  color: string;
  style: "shop" | "booth" | "gate" | "checkpoint" | "tower" | "tunnel" | "bridge" | "sign" | "vending";
}

export interface ClusterDef {
  id: string;
  label: { ko: string; en: string };
  pos: [number, number]; // x, z center
  size: [number, number]; // width, depth
  color: string;
}

export interface StreetDef {
  id: string;
  pos: [number, number, number]; // center of street
  size: [number, number]; // length, width
  axis: "x" | "z"; // which axis the street runs along
  label?: string;
  isHighway?: boolean;
}

export interface RoadSignDef {
  id: string;
  termId: string; // "route-table"
  pos: [number, number, number];
  text: { ko: string; en: string };
  arrow: "left" | "right" | "up" | "down";
}

export interface TrafficLightDef {
  id: string;
  pos: [number, number, number];
}

// ── World ──

export const WORLD = {
  size: 180,
  cameraStart: [0, 55, -110] as [number, number, number],
  cameraTarget: [0, 0, -50] as [number, number, number],
};

// ── Streets ──

export const STREETS: StreetDef[] = [
  // Internet Highway (far north, very wide)
  { id: "internet-hwy", pos: [0, 0.02, -72], size: [170, 10], axis: "x", label: "INTERNET HIGHWAY", isHighway: true },
  // Main Avenue (N-S spine)
  { id: "main-ave", pos: [0, 0.02, 0], size: [160, 8], axis: "z", label: "MAIN AVENUE" },
  // Cross streets
  { id: "edge-rd", pos: [0, 0.02, -60], size: [130, 5], axis: "x", label: "EDGE ROAD" },
  { id: "public-st", pos: [0, 0.02, -38], size: [120, 5], axis: "x" },
  { id: "private-dr", pos: [0, 0.02, -10], size: [100, 5], axis: "x" },
  { id: "data-lane", pos: [0, 0.02, 15], size: [80, 4], axis: "x" },
  { id: "admin-rd", pos: [0, 0.02, 32], size: [120, 5], axis: "x", label: "ADMIN ROAD" },
  { id: "service-blvd", pos: [0, 0.02, 55], size: [140, 6], axis: "x", label: "SERVICE BLVD" },
  // Side streets
  { id: "west-st", pos: [-30, 0.02, -5], size: [100, 4], axis: "z" },
  { id: "east-st", pos: [30, 0.02, -5], size: [100, 4], axis: "z" },
];

// ── 10 Large Buildings ──

export const BUILDINGS: Building3D[] = [
  {
    id: "office",
    label: { ko: "오피스 타워", en: "Office Tower" },
    pos: [-22, 0, -24],
    size: [14, 24, 12],
    color: "#5b6abf",
    termIds: ["ec2", "fargate", "graviton", "spot-instance", "aws-batch"],
    style: "office", floors: 8, windowCols: 5,
  },
  {
    id: "container-center",
    label: { ko: "컨테이너 센터", en: "Container Center" },
    pos: [-22, 0, 2],
    size: [12, 18, 10],
    color: "#7c3aed",
    termIds: ["ecs", "eks", "ecs-service-connect"],
    style: "office", floors: 6, windowCols: 4,
  },
  {
    id: "data-library",
    label: { ko: "데이터 도서관", en: "Data Library" },
    pos: [-12, 0, 23],
    size: [20, 14, 14],
    color: "#0891b2",
    termIds: ["rds", "elasticache", "dax", "redshift", "documentdb", "neptune", "memorydb", "rds-proxy", "aurora-serverless"],
    style: "civic", floors: 4, windowCols: 7,
  },
  {
    id: "city-hall",
    label: { ko: "시청", en: "City Hall" },
    pos: [-25, 0, 42],
    size: [18, 20, 14],
    color: "#b45309",
    termIds: ["iam", "organizations", "control-tower", "iam-identity-center", "ssm", "cloudformation", "auto-scaling", "codepipeline", "aws-backup"],
    style: "civic", floors: 6, windowCols: 6,
  },
  {
    id: "security-center",
    label: { ko: "보안 센터", en: "Security Center" },
    pos: [10, 0, 42],
    size: [16, 16, 12],
    color: "#b91c1c",
    termIds: ["guardduty", "security-hub", "inspector", "macie", "iam-access-analyzer", "audit-manager", "aws-config", "kms", "secrets-manager", "acm"],
    style: "office", floors: 5, windowCols: 5,
  },
  {
    id: "control-tower-bldg",
    label: { ko: "관제탑", en: "Watchtower" },
    pos: [35, 0, 36],
    size: [7, 32, 7],
    color: "#0d9488",
    termIds: ["cloudwatch", "xray", "cloudwatch-synthetics", "cloudtrail", "vpc-flow-logs"],
    style: "tower", floors: 10, windowCols: 2,
  },
  {
    id: "messaging-center",
    label: { ko: "메시징 허브", en: "Messaging Hub" },
    pos: [-38, 0, 62],
    size: [14, 14, 12],
    color: "#7c3aed",
    termIds: ["sqs", "sns", "eventbridge", "kinesis", "kinesis-firehose", "step-functions"],
    style: "office", floors: 5, windowCols: 5,
  },
  {
    id: "service-center",
    label: { ko: "서비스 센터", en: "Service Center" },
    pos: [-12, 0, 64],
    size: [14, 16, 12],
    color: "#2563eb",
    termIds: ["api-gateway", "lambda", "cognito", "appsync", "app-runner", "iot-core"],
    style: "office", floors: 5, windowCols: 5,
  },
  {
    id: "warehouse-district",
    label: { ko: "창고 지구", en: "Warehouse District" },
    pos: [16, 0, 62],
    size: [18, 9, 14],
    color: "#c2410c",
    termIds: ["s3", "dynamodb", "ecr"],
    style: "warehouse", floors: 2, windowCols: 2,
  },
  {
    id: "data-factory",
    label: { ko: "데이터 공장", en: "Data Factory" },
    pos: [42, 0, 64],
    size: [16, 14, 12],
    color: "#059669",
    termIds: ["glue", "athena", "timestream", "quicksight", "lake-formation", "bedrock", "sagemaker"],
    style: "factory", floors: 4, windowCols: 5,
  },
];

// ── Standalone Elements (grouped by logical cluster) ──

export const STANDALONE: Standalone3D[] = [
  // ─── Edge: DNS & CDN cluster ───
  { id: "s-route53", termId: "route53", pos: [-38, 0, -64], size: [5, 5, 4], color: "#f59e0b", style: "booth" },
  { id: "s-cloudfront", termId: "cloudfront", pos: [-25, 0, -64], size: [7, 6, 5], color: "#f97316", style: "shop" },
  { id: "s-cf-func", termId: "cloudfront-functions", pos: [-15, 0, -64], size: [3, 4, 3], color: "#fb923c", style: "vending" },
  { id: "s-lambda-edge", termId: "lambda-edge", pos: [-8, 0, -64], size: [5, 5, 4], color: "#ea580c", style: "shop" },
  { id: "s-global-acc", termId: "global-accelerator", pos: [15, 0, -64], size: [7, 6, 4], color: "#78716c", style: "gate" },

  // ─── Gate Security: WAF & Shield flanking IGW ───
  { id: "s-waf", termId: "waf", pos: [-5, 0, -54], size: [5, 4, 4], color: "#ef4444", style: "checkpoint" },
  { id: "s-shield", termId: "shield", pos: [5, 0, -54], size: [4, 12, 4], color: "#dc2626", style: "tower" },

  // ─── VPC Gate ───
  { id: "s-igw", termId: "igw", pos: [0, 0, -50], size: [10, 9, 3], color: "#78716c", style: "gate" },

  // ─── Public: Subnet checkpoint & traffic distribution ───
  { id: "s-nacl", termId: "nacl", pos: [0, 0, -46], size: [5, 4, 4], color: "#fca5a5", style: "checkpoint" },
  { id: "s-alb", termId: "alb", pos: [-10, 0, -44], size: [6, 6, 5], color: "#3b82f6", style: "shop" },
  { id: "s-nlb", termId: "nlb", pos: [10, 0, -44], size: [6, 5, 4], color: "#6b7280", style: "gate" },
  { id: "s-nat-gw", termId: "nat-gw", pos: [-42, 0, -35], size: [6, 5, 5], color: "#0ea5e9", style: "shop" },

  // ─── Private: Building entry & attached storage ───
  { id: "s-sg", termId: "sg", pos: [-22, 0, -32], size: [5, 4, 4], color: "#fca5a5", style: "checkpoint" },
  { id: "s-ebs", termId: "ebs", pos: [-33, 0, -24], size: [6, 5, 5], color: "#d4a574", style: "shop" },
  { id: "s-efs", termId: "efs", pos: [-22, 0, -16], size: [6, 5, 5], color: "#c4956e", style: "shop" },

  // ─── Private: Data Processing cluster (right block) ───
  { id: "s-opensearch", termId: "opensearch", pos: [15, 0, -20], size: [6, 6, 5], color: "#7c3aed", style: "shop" },
  { id: "s-msk", termId: "msk", pos: [27, 0, -20], size: [7, 5, 5], color: "#a78bfa", style: "shop" },
  { id: "s-mq", termId: "amazon-mq", pos: [15, 0, -6], size: [6, 5, 4], color: "#8b5cf6", style: "booth" },

  // ─── Private: Connectivity (east VPC wall) ───
  { id: "s-vpc-ep", termId: "vpc-endpoint", pos: [44, 0, -10], size: [5, 4, 4], color: "#818cf8", style: "booth" },
  { id: "s-privatelink", termId: "privatelink", pos: [44, 0, -20], size: [6, 4, 4], color: "#6366f1", style: "tunnel" },

  // ─── External Connectivity (outside west VPC wall) ───
  { id: "s-peering", termId: "vpc-peering", pos: [-55, 0, -5], size: [7, 3, 4], color: "#8b7d6b", style: "bridge" },
  { id: "s-vpn", termId: "site-to-site-vpn", pos: [-55, 0, 8], size: [6, 4, 4], color: "#4b5563", style: "tunnel" },
  { id: "s-dx", termId: "direct-connect", pos: [-55, 0, 20], size: [7, 3, 4], color: "#6b7280", style: "bridge" },
  { id: "s-transit-gw", termId: "transit-gw", pos: [-55, 0, 32], size: [7, 6, 5], color: "#0891b2", style: "shop" },

  // ─── Regional: Service Mesh cluster (far right) ───
  { id: "s-amp", termId: "amp", pos: [56, 0, 58], size: [3, 4, 3], color: "#ec4899", style: "vending" },
  { id: "s-cloud-map", termId: "cloud-map", pos: [56, 0, 65], size: [2, 5, 1], color: "#0891b2", style: "sign" },
  { id: "s-vpc-lattice", termId: "vpc-lattice", pos: [56, 0, 72], size: [5, 4, 3], color: "#6366f1", style: "tunnel" },
  { id: "s-app-mesh", termId: "app-mesh", pos: [56, 0, 79], size: [4, 4, 3], color: "#fbbf24", style: "checkpoint" },
];

// ── Road Signs (Route Table) ──

export const ROAD_SIGNS: RoadSignDef[] = [
  { id: "rs-1", termId: "route-table", pos: [6, 0, -50], text: { ko: "→ VPC 진입", en: "→ Enter VPC" }, arrow: "right" },
  { id: "rs-2", termId: "route-table", pos: [-6, 0, -50], text: { ko: "← 인터넷", en: "← Internet" }, arrow: "left" },
  { id: "rs-3", termId: "route-table", pos: [6, 0, -10], text: { ko: "데이터 →", en: "Data →" }, arrow: "right" },
  { id: "rs-4", termId: "route-table", pos: [-6, 0, 32], text: { ko: "← 관리", en: "← Admin" }, arrow: "left" },
  { id: "rs-5", termId: "route-table", pos: [6, 0, 55], text: { ko: "서비스 →", en: "Services →" }, arrow: "right" },
  { id: "rs-6", termId: "route-table", pos: [-6, 0, -38], text: { ko: "↓ 프라이빗", en: "↓ Private" }, arrow: "down" },
];

// ── Traffic Lights ──

export const TRAFFIC_LIGHTS: TrafficLightDef[] = [
  { id: "tl-1", pos: [5, 0, -50] },
  { id: "tl-2", pos: [-5, 0, -38] },
  { id: "tl-3", pos: [5, 0, -10] },
  { id: "tl-4", pos: [-5, 0, 32] },
  { id: "tl-5", pos: [5, 0, 55] },
];

// ── Zone defs for ground coloring ──

export const ZONES = [
  { id: "edge", z: [-67, -53], color: "#fef3c7", label: { ko: "엣지 존", en: "EDGE ZONE" }, labelZ: -60 },
  { id: "public", z: [-49, -30], color: "#dbeafe", label: { ko: "퍼블릭 지구", en: "PUBLIC DISTRICT" }, labelZ: -42 },
  { id: "private", z: [-30, 6], color: "#e0e7ff", label: { ko: "프라이빗 지구", en: "PRIVATE DISTRICT" }, labelZ: -15 },
  { id: "data", z: [6, 30], color: "#f3e8ff", label: { ko: "데이터 존", en: "DATA ZONE" }, labelZ: 18 },
  { id: "admin", z: [30, 48], color: "#fef9c3", label: { ko: "관리 지구", en: "ADMIN DISTRICT" }, labelZ: 40 },
  { id: "regional", z: [48, 82], color: "#dcfce7", label: { ko: "리전 서비스", en: "REGIONAL SERVICES" }, labelZ: 65 },
] as const;

// ── Lamp post positions ──

export const LAMP_POSITIONS: [number, number, number][] = [
  // Along main avenue
  [5, 0, -55], [5, 0, -40], [5, 0, -32], [5, 0, -5], [5, 0, 10], [5, 0, 35], [5, 0, 55], [5, 0, 70],
  [-5, 0, -55], [-5, 0, -40], [-5, 0, -32], [-5, 0, -5], [-5, 0, 10], [-5, 0, 35], [-5, 0, 55], [-5, 0, 70],
  // Along cross streets (on sidewalks, not on roads)
  [-20, 0, -34], [-35, 0, -34], [20, 0, -34], [35, 0, -34],
  [-20, 0, 28], [-35, 0, 28], [20, 0, 28], [35, 0, 28],
  [-20, 0, 51], [-35, 0, 51], [20, 0, 51], [35, 0, 51],
];

// ── Tree positions ──

export const TREE_POSITIONS: [number, number, number][] = [
  [-40, 0, -32], [-45, 0, -28], [-38, 0, -18], [-45, 0, -8],
  [42, 0, -30], [48, 0, -20], [45, 0, -8],
  [42, 0, 18], [48, 0, 22],
  [-42, 0, 20], [-48, 0, 24],
  [-50, 0, 70], [-45, 0, 75], [50, 0, 70], [48, 0, 78],
  [50, 0, -55], [-50, 0, -55],
  [-50, 0, 45], [50, 0, 45],
];

// ── Traffic Flow Connections (glowing dotted lines) ──

export interface ConnectionDef {
  id: string;
  label: { ko: string; en: string };
  color: string;
  points: [number, number, number][];
  speed: number;
  dots: number;
}

export const CONNECTIONS: ConnectionDef[] = [
  // ─── Main inbound flow (all right-angle, road-following paths) ───
  { id: "c-dns", label: { ko: "DNS 쿼리", en: "DNS Query" },
    color: "#f59e0b", points: [[-38, 2, -72], [-38, 2, -66]], speed: 0.8, dots: 2 },
  { id: "c-cdn", label: { ko: "콘텐츠 전달", en: "Content Delivery" },
    color: "#f97316", points: [[-38, 2, -64], [-25, 2, -64]], speed: 0.7, dots: 2 },
  { id: "c-sec", label: { ko: "보안 검사", en: "Security Check" },
    color: "#ef4444", points: [[-25, 2, -64], [-5, 2, -64], [-5, 2, -54]], speed: 0.5, dots: 3 },
  { id: "c-shield", label: { ko: "DDoS 방어", en: "DDoS Shield" },
    color: "#dc2626", points: [[-5, 2, -54], [5, 2, -54]], speed: 0.4, dots: 1 },
  { id: "c-gate", label: { ko: "VPC 진입", en: "Enter VPC" },
    color: "#78716c", points: [[0, 2, -54], [0, 2, -50]], speed: 0.9, dots: 2 },
  { id: "c-subnet", label: { ko: "서브넷 필터", en: "Subnet Filter" },
    color: "#fca5a5", points: [[0, 2, -50], [0, 2, -46]], speed: 0.8, dots: 1 },

  // ─── NACL octopus → ALB + NLB (shared trunk then branch) ───
  { id: "c-http", label: { ko: "HTTP 트래픽", en: "HTTP Traffic" },
    color: "#3b82f6", points: [[0, 2, -46], [0, 2, -44], [-10, 2, -44]], speed: 0.5, dots: 2 },
  { id: "c-tcp", label: { ko: "TCP 트래픽", en: "TCP Traffic" },
    color: "#6b7280", points: [[0, 2, -46], [0, 2, -44], [10, 2, -44]], speed: 0.5, dots: 2 },

  // ─── ALB → SG → Office Tower ───
  { id: "c-inst", label: { ko: "인스턴스 접근", en: "Instance Access" },
    color: "#818cf8", points: [[-10, 2, -44], [-22, 2, -44], [-22, 2, -34]], speed: 0.5, dots: 2 },
  { id: "c-compute", label: { ko: "컴퓨팅 진입", en: "Compute Entry" },
    color: "#5b6abf", points: [[-22, 2, -34], [-22, 2, -30]], speed: 0.7, dots: 1 },

  // ─── Office Tower octopus → storage & DB ───
  { id: "c-ebs", label: { ko: "블록 스토리지", en: "Block Storage" },
    color: "#d4a574", points: [[-29, 2, -24], [-33, 2, -24]], speed: 0.4, dots: 1 },
  { id: "c-efs", label: { ko: "파일 공유", en: "File Share" },
    color: "#c4956e", points: [[-22, 2, -18], [-22, 2, -16]], speed: 0.4, dots: 1 },
  { id: "c-db", label: { ko: "DB 쿼리", en: "DB Query" },
    color: "#0891b2", points: [[-22, 2, 1], [-22, 2, 23], [-12, 2, 23]], speed: 0.35, dots: 3 },

  // ─── Outbound ───
  { id: "c-out", label: { ko: "아웃바운드", en: "Outbound" },
    color: "#0ea5e9", points: [[-42, 2, -35], [-42, 2, -50], [0, 2, -50]], speed: 0.4, dots: 2 },

  // ─── Private connectivity ───
  { id: "c-pvt", label: { ko: "프라이빗 터널", en: "Private Tunnel" },
    color: "#6366f1", points: [[44, 2, -20], [44, 2, -10]], speed: 0.3, dots: 1 },

  // ─── NLB → compute (parallel path to ALB) ───
  { id: "c-nlb", label: { ko: "TCP 포워딩", en: "TCP Forward" },
    color: "#6b7280", points: [[10, 2, -44], [10, 2, -34], [-22, 2, -34]], speed: 0.5, dots: 2 },

  // ─── Global Accelerator → ALB (alternative edge path) ───
  { id: "c-ga", label: { ko: "글로벌 가속", en: "Global Accel" },
    color: "#78716c", points: [[15, 2, -64], [15, 2, -50], [0, 2, -50]], speed: 0.6, dots: 2 },

  // ─── Compute → Data Processing (internal traffic) ───
  { id: "c-data-proc", label: { ko: "데이터 처리", en: "Data Processing" },
    color: "#7c3aed", points: [[-15, 2, -10], [15, 2, -10], [15, 2, -20]], speed: 0.4, dots: 2 },

  // ─── Transit GW octopus → external (straight vertical lines) ───
  { id: "c-vpn", label: { ko: "VPN 터널", en: "VPN Tunnel" },
    color: "#4b5563", points: [[-55, 2, 32], [-55, 2, 8]], speed: 0.3, dots: 2 },
  { id: "c-dx", label: { ko: "전용선", en: "Direct Connect" },
    color: "#6b7280", points: [[-55, 2, 32], [-55, 2, 20]], speed: 0.3, dots: 1 },

  // ─── VPC Peering (independent, enters VPC through west wall) ───
  { id: "c-peer", label: { ko: "VPC 피어링", en: "VPC Peering" },
    color: "#8b7d6b", points: [[-55, 2, -5], [-48, 2, -5]], speed: 0.25, dots: 1 },
];

// ── Clusters (sub-group labels on ground) ──

export const CLUSTERS: ClusterDef[] = [
  // Edge
  { id: "dns-cdn", label: { ko: "DNS & CDN", en: "DNS & CDN" }, pos: [-22, -64], size: [38, 8], color: "rgba(251,191,36,0.12)" },
  { id: "gate-security", label: { ko: "게이트 보안", en: "Gate Security" }, pos: [0, -52], size: [20, 8], color: "rgba(239,68,68,0.10)" },
  // Public
  { id: "traffic-dist", label: { ko: "트래픽 분배", en: "Traffic Distribution" }, pos: [0, -44], size: [28, 8], color: "rgba(59,130,246,0.10)" },
  // Private - compute
  { id: "compute", label: { ko: "컴퓨팅", en: "Compute" }, pos: [-22, -10], size: [18, 28], color: "rgba(91,106,191,0.08)" },
  { id: "attached-storage", label: { ko: "연결 스토리지", en: "Attached Storage" }, pos: [-30, -18], size: [12, 16], color: "rgba(212,165,116,0.12)" },
  // Private - data
  { id: "data-proc", label: { ko: "데이터 처리", en: "Data Processing" }, pos: [20, -14], size: [22, 22], color: "rgba(124,58,237,0.08)" },
  { id: "priv-conn", label: { ko: "프라이빗 연결", en: "Private Connectivity" }, pos: [44, -15], size: [10, 16], color: "rgba(99,102,241,0.08)" },
  // External
  { id: "ext-conn", label: { ko: "외부 연결", en: "External Connectivity" }, pos: [-55, 14], size: [14, 46], color: "rgba(6,182,212,0.10)" },
  // Regional
  { id: "svc-mesh", label: { ko: "서비스 메시", en: "Service Mesh" }, pos: [56, 68], size: [12, 30], color: "rgba(99,102,241,0.08)" },
];
