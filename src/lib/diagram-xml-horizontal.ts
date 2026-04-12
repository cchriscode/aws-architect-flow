/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Architecture, ArchService, WizardState } from "@/lib/types";
import {
  type ClassifiedServices, type SvcItem, type IdMap, type PosMap,
  classifyServices, isClusterService, isComputeService,
  ICON_W, ICON_H, ICON_GAP, ICON_LABEL_H, MAX_PER_ROW,
  SUBNET_PAD, SIDEBAR_GROUP_LABEL_H, SIDEBAR_GROUP_GAP,
  resetIdCounter, nextId, esc,
  groupCell, iconCell,
  regionStyle, vpcStyle, flatAzStyle,
  publicSubnetStyle, privateSubnetStyle, isolatedSubnetStyle, cacheSubnetStyle,
  eksClusterStyle, mskClusterStyle, categoryBoxStyle,
  generateEdges, getMirrorLabel, wrapDiagramXml,
  buildSidebarGroups, type SidebarGroupDef,
} from "@/lib/diagram-xml-shared";

// ─── Horizontal-only Constants ───────────────────────────────────────

const H_EXT_COL_X = 170;          // External services X (left vertical column)
const H_EXT_COL_START_Y = 655;    // First external icon Y
const H_EXT_ICON_GAP = 100;       // Gap between external icons vertically
const H_REGION_X = 324;           // Region container X
const H_VPC_OFFSET_X = 172;       // VPC offset from region left (space for managed svcs)
const H_AZ_GAP_Y = 88;            // Gap between AZs vertically
const H_PUBLIC_SUBNET_W = 120;    // Public subnet width (narrow, tall)
const H_CACHE_SUBNET_W = 130;     // Cache subnet width
const H_DB_SUBNET_W = 130;        // DB subnet width
const H_SUBNET_GAP_X = 10;        // Gap between subnets horizontally
const H_CICD_STRIP_H = 110;       // CI/CD strip height
const H_CICD_GAP = 30;            // Gap between region and CI/CD
const H_MANAGED_LEFT_X = 15;      // Managed services left column X (rel to Region)
const H_MANAGED_BELOW_GAP = 20;   // Gap between VPC and below-managed services
const H_MANAGED_RIGHT_GAP = 20;   // Gap between VPC right edge and right-managed
const H_CLUSTER_MIN_W = 205;      // Minimum cluster width
const H_PUB_TO_CLUSTER_GAP = 20;  // Public→first cluster gap
const CLUSTER_PAD_TOP = 40;        // Top padding inside cluster for inner subnet
const CLUSTER_PAD_OFFSET = 1;      // Cluster Y offset from subnet base
const EKS_PAD = { left: 15, right: 10 };
const MSK_PAD = { left: 10, right: 10 };

// Horizontal-specific padding (wider than vertical defaults for landscape orientation)
const AZ_PAD = { top: 35, bottom: 10, left: 20, right: 70 };
const VPC_PAD = { top: 57, bottom: 20, left: 70, right: 30 };
const REGION_PAD = { top: 77, bottom: 20, left: 15, right: 20 };

// Scatter position classification for managed services
type ScatterPos = "left" | "below" | "right";
const SCATTER_MAP: Record<string, ScatterPos> = {
  "API Gateway": "left", "WebSocket API": "left", "Lambda": "left",
  "Cognito": "left", "IAM SSO": "left", "ACM": "left",
  "DynamoDB": "below", "DynamoDB PITR": "below", "Global Tables": "below",
  "Secrets Mgr": "below", "S3": "below", "S3 CRR": "below",
  "SQS": "below", "SNS": "below", "EventBridge": "below",
  "CloudWatch": "below", "X-Ray": "below", "CloudTrail": "below",
  "KMS": "below", "GuardDuty": "below", "Inspector": "below",
  "Macie": "below", "VPC Flow Logs": "below", "Config": "below",
  "SSM": "below", "Step Functions": "below", "IoT Core": "below",
  "EB Scheduler": "below", "AppSync": "below", "Cloud Map": "below",
  "ECR": "below", "AWS Backup": "below", "Timestream": "below",
  "Kinesis": "below", "Prometheus": "below", "Grafana": "below",
  "Container Insights": "below", "AMP": "below", "Datadog": "below",
  "Synthetics": "below", "Organizations": "below",
  "AWS Batch": "below", "ECS Scheduled": "below",
  "Glue ETL": "below", "Athena": "below", "Redshift": "below",
  "Lake Formation": "below", "Schema Registry": "below",
  "CDK": "below", "CFn": "below", "CodePipeline": "below",
  "Transit GW": "right", "VPN": "right", "Direct Connect": "right",
  "VPN+DX": "right", "R53 Failover": "right",
  "RDS Proxy": "right", "Network FW": "right",
  "Security Group": "right", "Security Hub": "right", "Audit Manager": "right",
  "IAM Roles": "right",
};

// ─── Place icons in horizontal layout ──

function placeIconsH(
  items: SvcItem[],
  parentId: string,
  startY: number,
  cells: string[],
  idMap: IdMap,
  posMap: PosMap,
  parentAbsX: number,
  parentAbsY: number,
  maxPerRow: number,
  mirror = false,
) {
  items.forEach((item, idx) => {
    const row = Math.floor(idx / maxPerRow);
    const col = idx % maxPerRow;
    const x = SUBNET_PAD.left + col * (ICON_W + ICON_GAP);
    const y = startY + row * (ICON_H + ICON_LABEL_H);
    const id = nextId();
    const label = mirror ? getMirrorLabel(item.info.label, item.svc.name) : item.info.label;
    cells.push(iconCell(id, label, item.info.shape, item.info.fillColor, parentId, x, y));
    if (!mirror) {
      const key = item.svc.name.toLowerCase();
      if (!idMap[key]) idMap[key] = id;
      posMap[id] = { x: parentAbsX + x + ICON_W / 2, y: parentAbsY + y + ICON_H / 2 };
    }
  });
}

function iconCountToH(count: number, maxPerRow: number): number {
  if (count === 0) return 0;
  const rows = Math.ceil(count / maxPerRow);
  return SUBNET_PAD.top + rows * (ICON_H + ICON_LABEL_H) + SUBNET_PAD.bottom;
}

function iconCountToW(count: number, maxPerRow: number): number {
  if (count === 0) return 0;
  const perRow = Math.min(count, maxPerRow);
  return SUBNET_PAD.left + perRow * (ICON_W + ICON_GAP) - ICON_GAP + SUBNET_PAD.right;
}

/** Convert container=1 → container=0 for non-container overlay elements */
function asOverlay(style: string): string {
  return style.replace(/container=1/g, "container=0");
}

// ─── Main Horizontal Export (FLAT structure) ─────────────────────────

export function generateDiagramXmlH(arch: Architecture, state: WizardState): string {
  resetIdCounter();

  const classified = classifyServices(arch);
  const azNum = state.network?.az_count === "3az" ? 3 : state.network?.az_count === "1az" ? 1 : 2;
  const subnetTier = state.network?.subnet_tier || "2tier";

  // Classify app services
  const hasEks = classified.app.some(item => item.svc.name.toLowerCase().includes("eks"));
  const hasMsk = classified.data.some(item => item.svc.name.toLowerCase().includes("msk"));
  const hasEc2Asg = classified.app.some(item => item.svc.name.toLowerCase().includes("ec2 auto"));
  const needsEksCluster = hasEks;
  const needsAsg = hasEc2Asg && !hasEks;
  const hasCluster = needsEksCluster || needsAsg;

  const appCompute = classified.app.filter(item =>
    needsEksCluster ? isClusterService(item.svc.name) : isComputeService(item.svc.name));
  const appOther = classified.app.filter(item =>
    needsEksCluster ? !isClusterService(item.svc.name) : !isComputeService(item.svc.name));

  // MSK data items
  const mskItems = classified.data.filter(item => item.svc.name.toLowerCase().includes("msk"));
  const cacheItems = classified.data.filter(item => {
    const n = item.svc.name.toLowerCase();
    return n.includes("elasticache") || n.includes("redis") || n.includes("dax");
  });
  const dbItems = classified.data.filter(item => {
    const n = item.svc.name.toLowerCase();
    return !n.includes("msk") && !n.includes("elasticache") && !n.includes("redis") && !n.includes("dax");
  });

  // Scatter region + entrypoint services into position groups
  const leftManaged: SvcItem[] = [];
  const belowManaged: SvcItem[] = [];
  const rightManaged: SvcItem[] = [];
  for (const item of [...classified.region, ...classified.entrypoint]) {
    const pos = SCATTER_MAP[item.info.label] || "below";
    if (pos === "left") leftManaged.push(item);
    else if (pos === "right") rightManaged.push(item);
    else belowManaged.push(item);
  }

  // Separate LB from public — ALB/NLB placed between AZs (VPC level) for 2+ AZ
  const lbItems = classified.public.filter(item => {
    const n = item.svc.name.toLowerCase();
    return n.includes("alb") || n.includes("nlb") || n.includes("load balancer");
  });
  const publicNonLb = azNum > 1
    ? classified.public.filter(item => !lbItems.includes(item))
    : classified.public; // For 1 AZ, keep ALB in public subnet (same as vertical)

  // ── Subnet dimensions ──
  const pubMaxPerRow = 1;
  const appMaxPerRow = 2;
  const cacheMaxPerRow = 1;
  const dbMaxPerRow = 1;

  const pubH = iconCountToH(publicNonLb.length, pubMaxPerRow);
  const appComputeH = iconCountToH(appCompute.length, appMaxPerRow);
  const mskH = iconCountToH(mskItems.length, 1);
  const cacheH = iconCountToH(cacheItems.length, cacheMaxPerRow);
  const dbH = iconCountToH(dbItems.length, dbMaxPerRow);
  const appOtherH = iconCountToH(appOther.length, appMaxPerRow);

  // Per-AZ inner height = tallest subnet
  const azAInnerH = Math.max(pubH, appComputeH + appOtherH, mskH, cacheH, dbH, 260);
  const azBInnerH = Math.max(pubH, appComputeH, mskH, cacheH, dbH, 208);

  // Subnet widths
  const pubW = publicNonLb.length > 0 ? H_PUBLIC_SUBNET_W : 0;
  const appSubW = appCompute.length > 0 ? Math.max(iconCountToW(appCompute.length, appMaxPerRow), H_CLUSTER_MIN_W) : 0;
  const mskSubW = mskItems.length > 0 ? Math.max(iconCountToW(mskItems.length, 1), 170) : 0;
  const cacheW = cacheItems.length > 0 ? H_CACHE_SUBNET_W : 0;
  const dbW = dbItems.length > 0 ? H_DB_SUBNET_W : 0;

  // Cluster widths wrap inner subnet with padding
  const hasEksCluster = hasEks && appCompute.length > 0;
  const hasMskCluster = hasMsk && mskItems.length > 0;
  const eksClusterW = hasEksCluster ? EKS_PAD.left + appSubW + EKS_PAD.right : 0;
  const mskClusterW = hasMskCluster ? MSK_PAD.left + mskSubW + MSK_PAD.right : 0;

  // ALL subnets placed sequentially inside AZ: Public → EKS Cluster → MSK Cluster → Cache → DB
  // Public→cluster gap = 20px, all other gaps = 10px
  const allSubnetsW = (pubW > 0 ? pubW : 0)
    + (eksClusterW > 0 ? H_PUB_TO_CLUSTER_GAP + eksClusterW : 0)
    + (mskClusterW > 0 ? H_SUBNET_GAP_X + mskClusterW : 0)
    + (cacheW > 0 ? H_SUBNET_GAP_X + cacheW : 0)
    + (dbW > 0 ? H_SUBNET_GAP_X + dbW : 0)
    + (!hasEksCluster && appSubW > 0 ? H_PUB_TO_CLUSTER_GAP + appSubW : 0)
    + (!hasMskCluster && mskSubW > 0 ? H_SUBNET_GAP_X + mskSubW : 0);

  const azW = AZ_PAD.left + Math.max(allSubnetsW, 300) + AZ_PAD.right;
  const azAH = AZ_PAD.top + azAInnerH + AZ_PAD.bottom;
  const azBH = AZ_PAD.top + azBInnerH + AZ_PAD.bottom;

  // VPC: AZs stacked vertically
  const vpcInnerH = azAH + (azNum > 1 ? (azNum - 1) * (H_AZ_GAP_Y + azBH) : 0);
  const hasIgw = subnetTier !== "private";
  const vpcW = VPC_PAD.left + azW + VPC_PAD.right;
  const vpcH = VPC_PAD.top + vpcInnerH + VPC_PAD.bottom;

  // Managed services — group by category using shared sidebar logic
  const allManaged = [...leftManaged, ...belowManaged, ...rightManaged];
  const managedGroups = buildSidebarGroups(allManaged);
  const H_MANAGED_COLS = 4;
  const H_MGD_ICON_PAD = 10;  // padding inside each category box around icons
  const H_MANAGED_GROUP_W = H_MGD_ICON_PAD + H_MANAGED_COLS * (ICON_W + ICON_GAP) - ICON_GAP + H_MGD_ICON_PAD;
  const H_MGD_OUTER_PAD = 15; // padding between outer box edge and inner groups
  const H_MGD_GROUPS_PER_ROW = 3;
  const H_MGD_GROUP_GAP_X = 15;
  const H_MGD_GROUP_GAP_Y = 10;

  const managedRowCount = managedGroups.length > 0 ? Math.ceil(managedGroups.length / H_MGD_GROUPS_PER_ROW) : 0;

  function managedGroupH(group: SidebarGroupDef): number {
    const rows = Math.ceil(group.items.length / H_MANAGED_COLS);
    return SIDEBAR_GROUP_LABEL_H + rows * (ICON_H + ICON_LABEL_H) + H_MGD_ICON_PAD;
  }

  // Pre-compute each row's max height
  const managedRowHeights: number[] = [];
  for (let r = 0; r < managedRowCount; r++) {
    let rowMax = 0;
    for (let c = 0; c < H_MGD_GROUPS_PER_ROW; c++) {
      const gi = r * H_MGD_GROUPS_PER_ROW + c;
      if (gi < managedGroups.length) rowMax = Math.max(rowMax, managedGroupH(managedGroups[gi]));
    }
    managedRowHeights.push(rowMax);
  }

  // Outer box content height = sum of row heights + gaps between rows
  const innerGroupsH = managedRowHeights.reduce((sum, h) => sum + h, 0)
    + Math.max(0, managedRowCount - 1) * H_MGD_GROUP_GAP_Y;
  // Outer box total = label + pad-top + content + pad-bottom
  const outerBoxH = managedGroups.length > 0
    ? SIDEBAR_GROUP_LABEL_H + H_MGD_OUTER_PAD + innerGroupsH + H_MGD_OUTER_PAD
    : 0;
  // belowManagedH includes the gap from region to outer box + outer box itself
  const belowManagedH = outerBoxH > 0 ? H_MANAGED_BELOW_GAP + outerBoxH : 0;

  // Left/right managed no longer needed as separate columns
  const leftManagedW = 0;
  const rightManagedW = 0;

  // Region dimensions
  const regionContentW = H_VPC_OFFSET_X + vpcW + (rightManagedW > 0 ? rightManagedW + H_MANAGED_RIGHT_GAP : 0);
  const regionW = Math.max(regionContentW, 600) + REGION_PAD.right;
  const regionH = REGION_PAD.top + vpcH + REGION_PAD.bottom;

  // CI/CD strip
  const hasCicd = classified.cicd.length > 0 || classified.appstack.length > 0;
  const cicdItems = [...classified.cicd, ...classified.appstack];
  const cicdStripW = hasCicd ? Math.max(regionW, 500) : 0;
  const cicdTotalH = hasCicd ? H_CICD_STRIP_H : 0;

  // External column
  const extItems = classified.external;

  // Region Y position
  const regionY = Math.max(H_EXT_COL_START_Y - 75, 40);

  // Total diagram size
  const totalW = Math.max(H_EXT_COL_X + 60 + regionW + 60, cicdStripW + 100);
  const totalH = regionY + regionH + (belowManagedH > 0 ? H_MANAGED_BELOW_GAP + belowManagedH : 0) + (hasCicd ? H_CICD_GAP + cicdTotalH : 0) + 60;

  // ── Pre-compute absolute coordinates ──
  const regionAbsX = H_REGION_X;
  const regionAbsY = regionY;
  const vpcAbsX = regionAbsX + H_VPC_OFFSET_X;
  const vpcAbsY = regionAbsY + REGION_PAD.top;
  const azAbsX = vpcAbsX + VPC_PAD.left;
  const azAAbsY = vpcAbsY + VPC_PAD.top;

  // ── Build cells ──
  const cells: string[] = [];
  const idMap: IdMap = {};
  const posMap: PosMap = {};

  cells.push(`<mxCell id="0"/>`);
  cells.push(`<mxCell id="1" parent="0"/>`);

  // ── 1. External services — vertical column at left (parent="1", already absolute) ──
  const usersId = nextId();
  cells.push(iconCell(usersId, "Users", "mxgraph.aws4.users", "#232F3E", "1",
    H_EXT_COL_X, H_EXT_COL_START_Y, 60, 60));
  idMap["__users__"] = usersId;
  posMap[usersId] = { x: H_EXT_COL_X + 30, y: H_EXT_COL_START_Y + 30 };

  let extY = H_EXT_COL_START_Y + H_EXT_ICON_GAP;
  for (const item of extItems) {
    const id = nextId();
    cells.push(iconCell(id, item.info.label, item.info.shape, item.info.fillColor, "1",
      H_EXT_COL_X, extY, 60, 60));
    idMap[item.svc.name.toLowerCase()] = id;
    posMap[id] = { x: H_EXT_COL_X + 30, y: extY + 30 };
    extY += H_EXT_ICON_GAP;
  }

  // ── 2. Region (parent="1", container=0, absolute coords) ──
  const regionId = nextId();
  cells.push(groupCell(regionId, "AWS Region: ap-northeast-2 (Seoul)", asOverlay(regionStyle()), "1",
    regionAbsX, regionAbsY, regionW, regionH));

  // ── 3. (Left managed removed — all managed services now below VPC) ──

  // ── 4. VPC (parent="1", container=0, absolute coords) ──
  const vpcId = nextId();
  cells.push(groupCell(vpcId, "VPC (10.0.0.0/16)", asOverlay(vpcStyle()), "1",
    vpcAbsX, vpcAbsY, vpcW, vpcH));

  // ── 5. Internet Gateway (parent="1", absolute coords) ──
  if (hasIgw) {
    const igwId = nextId();
    const igwAbsX = vpcAbsX - (ICON_W / 2);
    const igwAbsY = vpcAbsY + (vpcH - ICON_H) / 2;
    cells.push(iconCell(igwId, "Internet Gateway", "mxgraph.aws4.internet_gateway", "#8C4FFF", "1", igwAbsX, igwAbsY));
    idMap["__igw__"] = igwId;
    posMap[igwId] = { x: igwAbsX + ICON_W / 2, y: igwAbsY + ICON_H / 2 };
  }

  // ── 6. VPC Endpoint (parent="1", absolute coords) ──
  if (classified.vpcBoundary.length > 0) {
    let bdryAbsY = vpcAbsY + (hasIgw ? 80 : 30);
    classified.vpcBoundary.forEach((item) => {
      const id = nextId();
      const absX = vpcAbsX + 5;
      cells.push(iconCell(id, item.info.label, item.info.shape, item.info.fillColor, "1", absX, bdryAbsY));
      idMap[item.svc.name.toLowerCase()] = id;
      posMap[id] = { x: absX + ICON_W / 2, y: bdryAbsY + ICON_H / 2 };
      bdryAbsY += ICON_H + 20;
    });
  }

  // ── 7. AZ containers + subnets (all parent="1", absolute coords) ──
  // Pre-compute X positions relative to AZ left edge (cluster-aware)
  let nextXInAz = AZ_PAD.left;
  // Public
  const pubXInAz = nextXInAz;
  if (pubW > 0) nextXInAz += pubW + H_PUB_TO_CLUSTER_GAP;
  // EKS cluster / bare app
  const eksClusterXInAz = nextXInAz;
  const appSubXInAz = hasEksCluster ? nextXInAz + EKS_PAD.left : nextXInAz;
  if (hasEksCluster) nextXInAz += eksClusterW + H_SUBNET_GAP_X;
  else if (appSubW > 0) nextXInAz += appSubW + H_SUBNET_GAP_X;
  // MSK cluster / bare streaming
  const mskClusterXInAz = nextXInAz;
  const mskSubXInAz = hasMskCluster ? nextXInAz + MSK_PAD.left : nextXInAz;
  if (hasMskCluster) nextXInAz += mskClusterW + H_SUBNET_GAP_X;
  else if (mskSubW > 0) nextXInAz += mskSubW + H_SUBNET_GAP_X;
  // Cache, DB
  const cacheXInAz = nextXInAz;
  if (cacheW > 0) nextXInAz += cacheW + H_SUBNET_GAP_X;
  const dbXInAz = nextXInAz;

  for (let azIdx = 0; azIdx < azNum; azIdx++) {
    const azId = nextId();
    const thisAzH = azIdx === 0 ? azAH : azBH;
    const azCurrAbsY = azAAbsY + (azIdx === 0 ? 0 : azAH + (azIdx - 1) * (azBH + H_AZ_GAP_Y) + H_AZ_GAP_Y);
    const azLabel = azIdx === 0 ? "Availability Zone A" : azIdx === 1 ? "Availability Zone B" : `Availability Zone ${azIdx + 1}`;

    // AZ: parent="1", container=0, flat dashed style
    cells.push(groupCell(azId, azLabel, flatAzStyle(), "1",
      azAbsX, azCurrAbsY, azW, thisAzH));

    const mirror = azIdx > 0;
    const thisAzInnerH = azIdx === 0 ? azAInnerH : azBInnerH;
    const subnetBaseY = azCurrAbsY + AZ_PAD.top;

    // 1. Public subnet (bare — full AZ inner height)
    if (publicNonLb.length > 0) {
      const subId = nextId();
      const subH = Math.max(pubH, thisAzInnerH);
      const subAbsX = azAbsX + pubXInAz;
      cells.push(groupCell(subId, "Public Subnet", publicSubnetStyle(), "1",
        subAbsX, subnetBaseY, pubW, subH));
      placeIconsH(publicNonLb, subId, SUBNET_PAD.top, cells, idMap, posMap, subAbsX, subnetBaseY, pubMaxPerRow, mirror);
    }

    // 2. Private App Subnet (inside EKS cluster → reduced height, or bare)
    if (appCompute.length > 0) {
      const subId = nextId();
      const subAbsX = azAbsX + appSubXInAz;
      let subH: number;
      let subAbsY: number;
      if (hasEksCluster) {
        // Inside cluster: offset by CLUSTER_PAD_OFFSET + CLUSTER_PAD_TOP, reduced height
        subAbsY = subnetBaseY + CLUSTER_PAD_OFFSET + CLUSTER_PAD_TOP;
        subH = Math.max(appComputeH + appOtherH, thisAzInnerH - (CLUSTER_PAD_OFFSET + CLUSTER_PAD_TOP));
      } else {
        subAbsY = subnetBaseY;
        subH = Math.max(appComputeH + appOtherH, thisAzInnerH);
      }
      cells.push(groupCell(subId, "Private App Subnet", privateSubnetStyle(), "1",
        subAbsX, subAbsY, appSubW, subH));
      placeIconsH(appCompute, subId, SUBNET_PAD.top, cells, idMap, posMap, subAbsX, subAbsY, appMaxPerRow, mirror);
      if (appOther.length > 0 && !mirror) {
        const otherStartY = SUBNET_PAD.top + Math.ceil(appCompute.length / appMaxPerRow) * (ICON_H + ICON_LABEL_H);
        placeIconsH(appOther, subId, otherStartY, cells, idMap, posMap, subAbsX, subAbsY, appMaxPerRow, false);
      }
    } else if (!hasCluster && classified.app.length > 0) {
      const subId = nextId();
      const appW = Math.max(iconCountToW(classified.app.length, appMaxPerRow), H_CLUSTER_MIN_W);
      const subH = Math.max(iconCountToH(classified.app.length, appMaxPerRow), thisAzInnerH);
      const subAbsX = azAbsX + appSubXInAz;
      cells.push(groupCell(subId, "Private App Subnet", privateSubnetStyle(), "1",
        subAbsX, subnetBaseY, appW, subH));
      placeIconsH(classified.app, subId, SUBNET_PAD.top, cells, idMap, posMap, subAbsX, subnetBaseY, appMaxPerRow, mirror);
    }

    // 3. Private Streaming Subnet (inside MSK cluster → reduced height, or bare)
    if (mskItems.length > 0) {
      const subId = nextId();
      const subAbsX = azAbsX + mskSubXInAz;
      let subH: number;
      let subAbsY: number;
      if (hasMskCluster) {
        subAbsY = subnetBaseY + CLUSTER_PAD_OFFSET + CLUSTER_PAD_TOP;
        subH = Math.max(mskH, thisAzInnerH - (CLUSTER_PAD_OFFSET + CLUSTER_PAD_TOP));
      } else {
        subAbsY = subnetBaseY;
        subH = Math.max(mskH, thisAzInnerH);
      }
      cells.push(groupCell(subId, "Private Streaming Subnet", privateSubnetStyle(), "1",
        subAbsX, subAbsY, mskSubW, subH));
      placeIconsH(mskItems, subId, SUBNET_PAD.top, cells, idMap, posMap, subAbsX, subAbsY, 1, mirror);
    } else {
      const streamItems = classified.data.filter(item => {
        const n = item.svc.name.toLowerCase();
        return n.includes("amazon mq");
      });
      if (streamItems.length > 0) {
        const subId = nextId();
        const sw = Math.max(iconCountToW(streamItems.length, 1), 130);
        const subH = Math.max(iconCountToH(streamItems.length, 1), thisAzInnerH);
        const subAbsX = azAbsX + mskSubXInAz;
        cells.push(groupCell(subId, "Private Streaming Subnet", privateSubnetStyle(), "1",
          subAbsX, subnetBaseY, sw, subH));
        placeIconsH(streamItems, subId, SUBNET_PAD.top, cells, idMap, posMap, subAbsX, subnetBaseY, 1, mirror);
      }
    }

    // 4. Cache subnet (bare — full AZ inner height)
    if (cacheItems.length > 0) {
      const subId = nextId();
      const subH = Math.max(cacheH, thisAzInnerH);
      const subAbsX = azAbsX + cacheXInAz;
      cells.push(groupCell(subId, "Private Cache Subnet", cacheSubnetStyle(), "1",
        subAbsX, subnetBaseY, cacheW, subH));
      placeIconsH(cacheItems, subId, SUBNET_PAD.top, cells, idMap, posMap, subAbsX, subnetBaseY, cacheMaxPerRow, mirror);
    }

    // 5. DB subnet (bare — full AZ inner height)
    if (dbItems.length > 0) {
      const subId = nextId();
      const subH = Math.max(dbH, thisAzInnerH);
      const subAbsX = azAbsX + dbXInAz;
      cells.push(groupCell(subId, "Private DB Subnet", isolatedSubnetStyle(), "1",
        subAbsX, subnetBaseY, dbW, subH));
      placeIconsH(dbItems, subId, SUBNET_PAD.top, cells, idMap, posMap, subAbsX, subnetBaseY, dbMaxPerRow, mirror);
    }
  }

  // ── 7b. ALB/NLB between AZs (parent="1", absolute coords) ──
  if (lbItems.length > 0 && azNum > 1) {
    const lbAbsX = azAbsX + AZ_PAD.left + 20;
    const azABottom = azAAbsY + azAH;
    const lbAbsY = azABottom + (H_AZ_GAP_Y - ICON_H) / 2;
    lbItems.forEach((item, i) => {
      const id = nextId();
      const x = lbAbsX + i * (ICON_W + ICON_GAP);
      cells.push(iconCell(id, item.info.label, item.info.shape, item.info.fillColor, "1", x, lbAbsY));
      idMap[item.svc.name.toLowerCase()] = id;
      posMap[id] = { x: x + ICON_W / 2, y: lbAbsY + ICON_H / 2 };
    });
  }

  // ── 8. AZ-spanning cluster overlays (parent="1", container=0, absolute coords) ──
  const clusterAbsY = azAAbsY + AZ_PAD.top + CLUSTER_PAD_OFFSET;
  const clusterSpanH = azNum > 1
    ? (azAInnerH - CLUSTER_PAD_OFFSET + AZ_PAD.bottom + H_AZ_GAP_Y + AZ_PAD.top + azBInnerH)
    : (azAInnerH - CLUSTER_PAD_OFFSET);

  if (hasEksCluster) {
    const eksAbsX = azAbsX + eksClusterXInAz;
    const clusterId = nextId();
    cells.push(groupCell(clusterId, "EKS CLUSTER", asOverlay(eksClusterStyle()), "1",
      eksAbsX, clusterAbsY, eksClusterW, clusterSpanH));
  } else if (needsAsg && appCompute.length > 0) {
    const asgPad = 8;
    const asgAbsX = azAbsX + eksClusterXInAz - asgPad;
    const asgAbsY = clusterAbsY - asgPad;
    const asgW = appSubW + asgPad * 2;
    const asgH = clusterSpanH + asgPad * 2;
    const clusterId = nextId();
    cells.push(groupCell(clusterId, "Auto Scaling Group", asOverlay(categoryBoxStyle("#ED7100")), "1",
      asgAbsX, asgAbsY, asgW, asgH));
  }

  if (hasMskCluster) {
    const mskOverlayAbsX = azAbsX + mskClusterXInAz;
    const clusterId = nextId();
    cells.push(groupCell(clusterId, "MSK CLUSTER", asOverlay(mskClusterStyle()), "1",
      mskOverlayAbsX, clusterAbsY, mskClusterW, clusterSpanH));
  }

  // ── 9. (Right managed removed — all managed services now below VPC) ──

  // ── 10. Below-VPC managed services — grouped by category in dashed boxes ──
  if (managedGroups.length > 0) {
    const bmBaseX = H_REGION_X;
    const bmBaseY = regionY + regionH + H_MANAGED_BELOW_GAP;

    // Outer "Managed Services" dashed container — sized exactly to fit inner groups
    const colCount = Math.min(managedGroups.length, H_MGD_GROUPS_PER_ROW);
    const outerW = Math.max(
      H_MGD_OUTER_PAD + colCount * H_MANAGED_GROUP_W + (colCount - 1) * H_MGD_GROUP_GAP_X + H_MGD_OUTER_PAD,
      regionW,
    );
    const outerMgdId = nextId();
    cells.push(groupCell(outerMgdId, "Managed Services",
      "fillColor=none;strokeColor=#545B64;dashed=1;dashPattern=3 3;fontColor=#545B64;fontSize=11;fontStyle=1;container=0;pointerEvents=0;collapsible=0;recursiveResize=0;html=1;whiteSpace=wrap;verticalAlign=top;rounded=1;arcSize=3;",
      "1", bmBaseX, bmBaseY, outerW, outerBoxH));

    // Inner groups start after outer label + outer padding
    let curY = bmBaseY + SIDEBAR_GROUP_LABEL_H + H_MGD_OUTER_PAD;
    for (let r = 0; r < managedRowCount; r++) {
      const rowH = managedRowHeights[r];
      for (let c = 0; c < H_MGD_GROUPS_PER_ROW; c++) {
        const gi = r * H_MGD_GROUPS_PER_ROW + c;
        if (gi >= managedGroups.length) break;
        const group = managedGroups[gi];
        const gH = managedGroupH(group);
        const gX = bmBaseX + H_MGD_OUTER_PAD + c * (H_MANAGED_GROUP_W + H_MGD_GROUP_GAP_X);

        // Category dashed sub-box — use each group's exact height
        const catId = nextId();
        cells.push(groupCell(catId, group.label,
          `fillColor=none;strokeColor=#545B64;dashed=1;dashPattern=2 2;fontColor=#232F3E;fontSize=10;fontStyle=1;container=0;pointerEvents=0;collapsible=0;recursiveResize=0;html=1;whiteSpace=wrap;verticalAlign=top;rounded=1;arcSize=5;`,
          "1", gX, curY, H_MANAGED_GROUP_W, gH));

        // Icons inside category box
        group.items.forEach((item, idx) => {
          const col = idx % H_MANAGED_COLS;
          const row2 = Math.floor(idx / H_MANAGED_COLS);
          const ix = gX + H_MGD_ICON_PAD + col * (ICON_W + ICON_GAP);
          const iy = curY + SIDEBAR_GROUP_LABEL_H + row2 * (ICON_H + ICON_LABEL_H);
          const id = nextId();
          cells.push(iconCell(id, item.info.label, item.info.shape, item.info.fillColor, "1", ix, iy));
          idMap[item.svc.name.toLowerCase()] = id;
          posMap[id] = { x: ix + ICON_W / 2, y: iy + ICON_H / 2 };
        });
      }
      curY += rowH + H_MGD_GROUP_GAP_Y;
    }
  }

  // ── 11. CI/CD flow strip ──
  if (hasCicd && cicdItems.length > 0) {
    const stripX = H_REGION_X;
    const stripY = regionY + regionH + (belowManagedH > 0 ? H_MANAGED_BELOW_GAP + belowManagedH : 0) + H_CICD_GAP;
    const stripW = Math.max(cicdStripW, 400);
    const stripId = nextId();
    cells.push(groupCell(stripId, "CI/CD Pipeline", categoryBoxStyle("#ED7100"), "1",
      stripX, stripY, stripW, H_CICD_STRIP_H));

    cicdItems.forEach((item, i) => {
      const iconX = 31 + i * 69;
      const iconY = 30;
      const id = nextId();
      cells.push(iconCell(id, item.info.label, item.info.shape, item.info.fillColor, stripId,
        iconX, iconY, 50, 50));
      idMap[item.svc.name.toLowerCase()] = id;
      posMap[id] = { x: stripX + iconX + 25, y: stripY + iconY + 25 };
    });

  }

  // ── 12. Edges ──
  const edgeCells = generateEdges(classified, idMap, posMap);
  cells.push(...edgeCells);

  return wrapDiagramXml(cells, totalW, totalH);
}
