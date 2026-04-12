/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Architecture, ArchService, WizardState } from "@/lib/types";
import {
  type ClassifiedServices, type SvcItem, type SubnetDef, type SubnetSizeInfo,
  type CategoryDef, type SidebarGroupDef, type IdMap, type PosMap,
  classifyServices, buildSidebarGroups, catBoxSize, subnetSize,
  isComputeService, isClusterService,
  ICON_W, ICON_H, ICON_GAP, ICON_LABEL_H, MAX_PER_ROW,
  SUBNET_PAD, AZ_PAD, VPC_PAD, REGION_PAD, CLOUD_PAD,
  AZ_GAP, SUBNET_GAP, USERS_Y, USERS_TO_CLOUD_GAP, EXTERNAL_TO_REGION_GAP,
  SIDEBAR_W, SIDEBAR_COLS, SIDEBAR_GROUP_LABEL_H, SIDEBAR_GROUP_GAP, SIDEBAR_ICON_COL_W,
  IGW_SPACE, ENTRY_TO_VPC_GAP, VPCBDRY_GAP, CLUSTER_PAD, CLUSTER_GAP,
  CAT_MAX_PER_ROW, CAT_PAD, CAT_BOX_GAP, CAT_ROW_GAP, CATEGORY_META,
  resetIdCounter, nextId, esc,
  groupCell, iconCell,
  awsCloudStyle, regionStyle, vpcStyle, azStyle,
  publicSubnetStyle, privateSubnetStyle,
  clusterContainerStyle, asgContainerStyle, categoryBoxStyle,
  generateEdges, getMirrorLabel, placeIcons, wrapDiagramXml,
} from "@/lib/diagram-xml-shared";

// ─── Layout Computation (Vertical) ───────────────────────────────────

function computeLayout(classified: ClassifiedServices, azNum: number, subnetTier: string, azGap = AZ_GAP) {
  const hasEks = classified.app.some(item => item.svc.name.toLowerCase().includes("eks"));
  const hasEc2Asg = classified.app.some(item => item.svc.name.toLowerCase().includes("ec2 auto"));
  const needsCluster = hasEks;
  const needsAsg = hasEc2Asg && !hasEks;

  const appCompute = classified.app.filter(item =>
    needsCluster ? isClusterService(item.svc.name) : isComputeService(item.svc.name));
  const appOther = classified.app.filter(item =>
    needsCluster ? !isClusterService(item.svc.name) : !isComputeService(item.svc.name));
  const hasClusterContainer = (needsCluster || needsAsg) && appCompute.length > 0;

  const allPrivate = [...classified.app, ...classified.data];
  const mergedCount = allPrivate.length;

  const subnets: SubnetDef[] = [];

  if (subnetTier === "private") {
    if (mergedCount > 0) {
      subnets.push({ label: "Private Subnet", count: mergedCount, styleKey: "merged" });
    }
  } else if (subnetTier === "3tier") {
    if (classified.public.length > 0) {
      subnets.push({ label: "Public Subnet", count: classified.public.length, styleKey: "public" });
    }
    if (classified.app.length > 0) {
      subnets.push({ label: "Private App Subnet", count: classified.app.length, styleKey: "app" });
    }
    if (classified.data.length > 0) {
      subnets.push({ label: "Private Data Subnet (Isolated)", count: classified.data.length, styleKey: "data" });
    }
  } else {
    if (classified.public.length > 0) {
      subnets.push({ label: "Public Subnet", count: classified.public.length, styleKey: "public" });
    }
    if (mergedCount > 0) {
      subnets.push({ label: "Private Subnet", count: mergedCount, styleKey: "merged" });
    }
  }

  const mergedOther = [...appOther, ...classified.data];

  const subnetSizes: SubnetSizeInfo[] = subnets.map(s => {
    const needsClusterHere = (s.styleKey === "app" || s.styleKey === "merged") && hasClusterContainer;
    if (needsClusterHere) {
      const compPerRow = Math.min(appCompute.length, MAX_PER_ROW);
      const compRows = Math.ceil(appCompute.length / MAX_PER_ROW);
      const clusterH = CLUSTER_PAD.top + compRows * (ICON_H + ICON_LABEL_H) + CLUSTER_PAD.bottom;

      const others = s.styleKey === "merged" ? mergedOther : appOther;
      const otherPerRow = Math.min(others.length || 0, MAX_PER_ROW);
      const otherRows = Math.ceil((others.length || 0) / MAX_PER_ROW);
      const otherH = others.length > 0 ? otherRows * (ICON_H + ICON_LABEL_H) : 0;

      const maxPerRow = Math.max(compPerRow, otherPerRow, 1);
      const w = SUBNET_PAD.left + maxPerRow * (ICON_W + ICON_GAP) - ICON_GAP + SUBNET_PAD.right;
      if (needsAsg) {
        // ASG: no inner cluster box, icons placed directly
        const h = SUBNET_PAD.top + compRows * (ICON_H + ICON_LABEL_H) + (otherH > 0 ? otherH : 0) + SUBNET_PAD.bottom;
        return { w: Math.max(w, 200), h, clusterH: 0 };
      }
      const clusterLabelGap = 18;
      const h = SUBNET_PAD.top + clusterLabelGap + clusterH + (otherH > 0 ? CLUSTER_GAP + otherH : 0) + SUBNET_PAD.bottom;
      return { w: Math.max(w, 200), h, clusterH };
    }
    const size = subnetSize(s.count);
    return { ...size, clusterH: 0 };
  });

  const maxSubnetW = subnetSizes.reduce((m, s) => Math.max(m, s.w), 200);
  const totalSubnetH = subnetSizes.reduce((sum, s) => sum + s.h, 0)
    + Math.max(0, subnets.length - 1) * SUBNET_GAP;

  const azW = AZ_PAD.left + maxSubnetW + AZ_PAD.right;
  const azH = AZ_PAD.top + totalSubnetH + AZ_PAD.bottom;

  const vpcW = VPC_PAD.left + azNum * azW + (azNum - 1) * azGap + VPC_PAD.right;
  const hasIgw = subnetTier !== "private";

  const vpcBdryCount = classified.vpcBoundary.length;
  const vpcBdryH = vpcBdryCount > 0 ? VPCBDRY_GAP + ICON_H + ICON_LABEL_H : 0;

  const vpcH = VPC_PAD.top + (hasIgw ? IGW_SPACE : 0) + azH + vpcBdryH + VPC_PAD.bottom;

  const hasVpc = subnets.length > 0;

  const sidebarGroups = buildSidebarGroups(classified.region);
  const sidebarNeeded = classified.region.length > 0;
  const sidebarContentH = sidebarGroups.reduce((sum, g) => sum + g.h, 0)
    + Math.max(0, sidebarGroups.length - 1) * SIDEBAR_GROUP_GAP + 40;
  const sidebarH = Math.max(hasVpc ? vpcH : 100, sidebarContentH);

  const categories: CategoryDef[] = [];
  for (const meta of CATEGORY_META) {
    const items = classified[meta.key] as SvcItem[];
    if (items.length > 0) {
      const size = catBoxSize(items.length);
      categories.push({ ...meta, items, ...size });
    }
  }
  const topCats = categories.filter(c => c.position === "top");
  const bottomCats = categories.filter(c => c.position === "bottom");
  const hasTopCats = topCats.length > 0;
  const hasBottomCats = bottomCats.length > 0;
  const topCatRowW = hasTopCats
    ? topCats.reduce((sum, c) => sum + c.w, 0) + (topCats.length - 1) * CAT_BOX_GAP : 0;
  const topCatRowH = hasTopCats ? Math.max(...topCats.map(c => c.h)) : 0;
  const bottomCatRowW = hasBottomCats
    ? bottomCats.reduce((sum, c) => sum + c.w, 0) + (bottomCats.length - 1) * CAT_BOX_GAP : 0;
  const bottomCatRowH = hasBottomCats ? Math.max(...bottomCats.map(c => c.h)) : 0;

  const entryCount = classified.entrypoint.length;
  const entryRowW = entryCount * (ICON_W + ICON_GAP) - (entryCount > 0 ? ICON_GAP : 0);
  const entryRowH = entryCount > 0 ? ICON_H + ICON_LABEL_H + ENTRY_TO_VPC_GAP : 0;

  const mainContentH = Math.max(hasVpc ? vpcH : 100, sidebarH);
  const regionContentW = (hasVpc ? vpcW : 0) + (sidebarNeeded ? SIDEBAR_W + 30 : 0);
  const regionW = REGION_PAD.left + Math.max(regionContentW, entryRowW + 40, 400) + REGION_PAD.right;
  const regionH = REGION_PAD.top + entryRowH + mainContentH + REGION_PAD.bottom;

  const extCount = classified.external.length;
  const extRowW = extCount * (ICON_W + ICON_GAP) - (extCount > 0 ? ICON_GAP : 0);
  const extRowH = extCount > 0 ? ICON_H + ICON_LABEL_H + EXTERNAL_TO_REGION_GAP : 0;

  const cloudContentW = Math.max(regionW, extRowW + 60);
  const cloudW = CLOUD_PAD.left + cloudContentW + CLOUD_PAD.right;
  const cloudH = CLOUD_PAD.top + extRowH + regionH + CLOUD_PAD.bottom;

  const usersH = ICON_H + ICON_LABEL_H;
  const topRowH = hasTopCats ? Math.max(usersH, topCatRowH) : usersH;
  const cloudY = USERS_Y + topRowH + USERS_TO_CLOUD_GAP;
  const topCatsNeededW = hasTopCats ? cloudW + CAT_BOX_GAP + topCatRowW + 40 : 0;
  const totalW = Math.max(cloudW + 40, topCatsNeededW, hasBottomCats ? bottomCatRowW + 40 : 0, 600);
  const totalH = cloudY + cloudH + (hasBottomCats ? CAT_ROW_GAP + bottomCatRowH : 0) + 40;

  return {
    subnets, subnetSizes, maxSubnetW,
    azW, azH, azNum,
    vpcW, vpcH, hasVpc, hasIgw,
    sidebarNeeded, sidebarH, sidebarGroups,
    regionW, regionH, mainContentH,
    cloudW, cloudH, cloudY,
    extRowW, extRowH, extCount,
    totalW, totalH,
    subnetTier,
    appCompute, appOther, mergedOther, allPrivate,
    needsCluster, needsAsg, hasClusterContainer,
    topCats, bottomCats, hasTopCats, hasBottomCats,
    topCatRowW, topCatRowH, bottomCatRowW, bottomCatRowH,
    entryRowW, entryRowH, entryCount,
    vpcBdryCount, vpcBdryH,
    azGap,
  };
}

// ─── Main Export (Vertical Layout) ───────────────────────────────────

export function generateDiagramXml(arch: Architecture, state: WizardState): string {
  resetIdCounter();

  const classified = classifyServices(arch);
  const azNum = state.network?.az_count === "3az" ? 3 : state.network?.az_count === "1az" ? 1 : 2;
  const subnetTier = state.network?.subnet_tier || "2tier";

  // Separate LB from public — place between AZs for 2+ AZ
  const lbItems = classified.public.filter(item => {
    const n = item.svc.name.toLowerCase();
    return n.includes("alb") || n.includes("nlb") || n.includes("load balancer");
  });
  const publicNonLb = azNum > 1
    ? classified.public.filter(item => !lbItems.includes(item))
    : classified.public;
  const origPublic = classified.public;
  const lbAzGap = lbItems.length > 0 && azNum > 1 ? Math.max(AZ_GAP, ICON_W + 16) : AZ_GAP;
  if (azNum > 1 && lbItems.length > 0) classified.public = publicNonLb;
  const layout = computeLayout(classified, azNum, subnetTier, lbAzGap);
  classified.public = origPublic;

  const cells: string[] = [];
  const idMap: IdMap = {};
  const posMap: PosMap = {};

  // Root cells
  cells.push(`<mxCell id="0"/>`);
  cells.push(`<mxCell id="1" parent="0"/>`);

  // ── Users icon ──
  const usersId = nextId();
  const cloudX = (layout.totalW - layout.cloudW) / 2;
  const usersX = cloudX + (layout.cloudW - ICON_W) / 2;
  const usersLabel = subnetTier === "private" ? "Internal Users" : "Users";
  cells.push(iconCell(usersId, usersLabel, "mxgraph.aws4.users", "#232F3E", "1", usersX, USERS_Y));
  idMap["__users__"] = usersId;
  posMap[usersId] = { x: usersX + ICON_W / 2, y: USERS_Y + ICON_H / 2 };

  // ── AWS Cloud container ──
  const cloudId = nextId();
  cells.push(groupCell(cloudId, "AWS Cloud", awsCloudStyle(), "1",
    cloudX, layout.cloudY, layout.cloudW, layout.cloudH));

  // ── External services ──
  if (classified.external.length > 0) {
    const startX = (layout.cloudW - layout.extRowW) / 2;
    classified.external.forEach((item, i) => {
      const id = nextId();
      const x = startX + i * (ICON_W + ICON_GAP);
      cells.push(iconCell(id, item.info.label, item.info.shape, item.info.fillColor, cloudId, x, CLOUD_PAD.top));
      idMap[item.svc.name.toLowerCase()] = id;
      posMap[id] = { x: cloudX + x + ICON_W / 2, y: layout.cloudY + CLOUD_PAD.top + ICON_H / 2 };
    });
  }

  // ── Region container ──
  const regionId = nextId();
  const regionX = (layout.cloudW - layout.regionW) / 2;
  const regionY = CLOUD_PAD.top + layout.extRowH;
  cells.push(groupCell(regionId, "Region (ap-northeast-2)", regionStyle(), cloudId,
    regionX, regionY, layout.regionW, layout.regionH));

  // ── Entrypoint icons ──
  const regionAbsX = cloudX + regionX;
  const regionAbsY = layout.cloudY + regionY;
  if (classified.entrypoint.length > 0) {
    const entryStartX = REGION_PAD.left + (layout.hasVpc ? (layout.vpcW - layout.entryRowW) / 2 : 20);
    classified.entrypoint.forEach((item, i) => {
      const id = nextId();
      const x = entryStartX + i * (ICON_W + ICON_GAP);
      cells.push(iconCell(id, item.info.label, item.info.shape, item.info.fillColor, regionId, x, REGION_PAD.top));
      idMap[item.svc.name.toLowerCase()] = id;
      posMap[id] = { x: regionAbsX + x + ICON_W / 2, y: regionAbsY + REGION_PAD.top + ICON_H / 2 };
    });
  }

  // ── VPC container ──
  const vpcOffsetY = REGION_PAD.top + layout.entryRowH;
  let vpcId = "";
  if (layout.hasVpc) {
    vpcId = nextId();
    const vpcX = REGION_PAD.left;
    const vpcY = vpcOffsetY;
    cells.push(groupCell(vpcId, "VPC (10.0.0.0/16)", vpcStyle(), regionId,
      vpcX, vpcY, layout.vpcW, layout.vpcH));

    const vpcAbsX = regionAbsX + vpcX;
    const vpcAbsY = regionAbsY + vpcY;

    // ── Internet Gateway ──
    if (layout.hasIgw) {
      const igwId = nextId();
      const igwX = (layout.vpcW - ICON_W) / 2;
      const igwY = -(ICON_H / 2);
      cells.push(iconCell(igwId, "Internet Gateway", "mxgraph.aws4.internet_gateway", "#8C4FFF", vpcId, igwX, igwY));
      idMap["__igw__"] = igwId;
      posMap[igwId] = { x: vpcAbsX + igwX + ICON_W / 2, y: vpcAbsY + igwY + ICON_H / 2 };
    }

    // ── AZ containers ──
    for (let azIdx = 0; azIdx < azNum; azIdx++) {
      const azId = nextId();
      const azX = VPC_PAD.left + azIdx * (layout.azW + layout.azGap);
      const azY = VPC_PAD.top + (layout.hasIgw ? IGW_SPACE : 0);
      const azLabel = `Availability Zone ${azIdx + 1}`;
      cells.push(groupCell(azId, azLabel, azStyle(), vpcId,
        azX, azY, layout.azW, layout.azH));

      const azAbsX = vpcAbsX + azX;
      const azAbsY = vpcAbsY + azY;

      // ── Subnets inside AZ ──
      let subnetY = AZ_PAD.top;
      layout.subnets.forEach((sub, si) => {
        const subId = nextId();
        const subW = layout.maxSubnetW;
        const subH = layout.subnetSizes[si].h;
        if (subH === 0) return;

        const subX = AZ_PAD.left;
        const style = sub.styleKey === "public" ? publicSubnetStyle() : privateSubnetStyle();
        cells.push(groupCell(subId, sub.label, style, azId,
          subX, subnetY, subW, subH));

        const subAbsX = azAbsX + subX;
        const subAbsY = azAbsY + subnetY;

        const mirror = azIdx > 0;

        if (sub.styleKey === "public") {
          placeIcons(publicNonLb, subId, SUBNET_PAD.top, cells, idMap, posMap, subAbsX, subAbsY, mirror);

        } else if (sub.styleKey === "app" || sub.styleKey === "merged") {
          const others = sub.styleKey === "merged" ? layout.mergedOther : layout.appOther;

          if (layout.hasClusterContainer && layout.appCompute.length > 0) {
            // For EKS: cluster container inside subnet (per-AZ)
            // For ASG: icons placed directly, overlay added later spanning all AZs
            if (layout.needsCluster) {
              const clusterId = nextId();
              const clusterLabelGap = 18;
              const clusterX = SUBNET_PAD.left;
              const clusterY = SUBNET_PAD.top + clusterLabelGap;
              const clusterW = subW - SUBNET_PAD.left - SUBNET_PAD.right;
              const clusterH = layout.subnetSizes[si].clusterH;
              const clusterSt = clusterContainerStyle();
              cells.push(groupCell(clusterId, "EKS Cluster", clusterSt, subId,
                clusterX, clusterY, clusterW, clusterH));

              const clusterAbsX = subAbsX + clusterX;
              const clusterAbsY = subAbsY + clusterY;

              layout.appCompute.forEach((item, idx) => {
                const row = Math.floor(idx / MAX_PER_ROW);
                const col = idx % MAX_PER_ROW;
                const iconX = CLUSTER_PAD.left + col * (ICON_W + ICON_GAP);
                const iconY = CLUSTER_PAD.top + row * (ICON_H + ICON_LABEL_H);
                const iconId = nextId();
                const iconLabel = mirror ? getMirrorLabel(item.info.label, item.svc.name) : item.info.label;
                cells.push(iconCell(iconId, iconLabel, item.info.shape, item.info.fillColor, clusterId, iconX, iconY));
                if (!mirror) {
                  const key = item.svc.name.toLowerCase();
                  if (!idMap[key]) idMap[key] = iconId;
                  posMap[iconId] = { x: clusterAbsX + iconX + ICON_W / 2, y: clusterAbsY + iconY + ICON_H / 2 };
                }
              });

              if (others.length > 0) {
                const otherStartY = clusterY + clusterH + CLUSTER_GAP;
                placeIcons(others, subId, otherStartY, cells, idMap, posMap, subAbsX, subAbsY, mirror);
              }
            } else {
              // ASG: place icons directly in subnet, overlay added after AZ loop
              placeIcons(layout.appCompute, subId, SUBNET_PAD.top, cells, idMap, posMap, subAbsX, subAbsY, mirror);
              if (others.length > 0) {
                const compRows = Math.ceil(layout.appCompute.length / MAX_PER_ROW);
                const otherStartY = SUBNET_PAD.top + compRows * (ICON_H + ICON_LABEL_H);
                placeIcons(others, subId, otherStartY, cells, idMap, posMap, subAbsX, subAbsY, mirror);
              }
              // Track AZ app subnet positions for ASG overlay spanning all AZs
              if (azIdx === 0) {
                (layout as any)._asgOverlay = { x: subAbsX, y: subAbsY, w: subW, h: subH };
              }
              if (azIdx === azNum - 1) {
                (layout as any)._asgOverlayEnd = { x: subAbsX, y: subAbsY, w: subW, h: subH };
              }
            }
          } else {
            const allItems = sub.styleKey === "merged" ? layout.allPrivate : classified.app;
            placeIcons(allItems, subId, SUBNET_PAD.top, cells, idMap, posMap, subAbsX, subAbsY, mirror);
          }

        } else if (sub.styleKey === "data") {
          placeIcons(classified.data, subId, SUBNET_PAD.top, cells, idMap, posMap, subAbsX, subAbsY, mirror);
        }

        subnetY += subH + SUBNET_GAP;
      });
    }

    // ── LB between AZs ──
    if (lbItems.length > 0 && azNum > 1) {
      const azY = VPC_PAD.top + (layout.hasIgw ? IGW_SPACE : 0);
      const lbVpcX = VPC_PAD.left + layout.azW + (layout.azGap - ICON_W) / 2;
      const lbVpcY = azY + AZ_PAD.top + SUBNET_PAD.top;
      lbItems.forEach((item, i) => {
        const id = nextId();
        const y = lbVpcY + i * (ICON_H + ICON_LABEL_H);
        cells.push(iconCell(id, item.info.label, item.info.shape, item.info.fillColor, vpcId, lbVpcX, y));
        idMap[item.svc.name.toLowerCase()] = id;
        posMap[id] = { x: vpcAbsX + lbVpcX + ICON_W / 2, y: vpcAbsY + y + ICON_H / 2 };
      });
    }
  }

  // ── ASG spanning overlay (across all AZs) ──
  if (layout.needsAsg && (layout as any)._asgOverlay) {
    const asgStart = (layout as any)._asgOverlay;
    const asgEnd = (layout as any)._asgOverlayEnd || asgStart;
    const asgPad = 8;
    const asgId = nextId();
    const asgX = asgStart.x - asgPad;
    const asgY = asgStart.y - asgPad;
    const asgW = (asgEnd.x + asgEnd.w) - asgStart.x + asgPad * 2;
    const asgH = Math.max(asgStart.h, (asgEnd.y + asgEnd.h) - asgStart.y) + asgPad * 2;
    cells.push(groupCell(asgId, "Auto Scaling Group", asgContainerStyle().replace("container=1", "container=0"), "1",
      asgX, asgY, asgW, asgH));
  }

  // ── VPC Boundary icons ──
  if (vpcId && classified.vpcBoundary.length > 0) {
    const vpcAbsX2 = regionAbsX + REGION_PAD.left;
    const vpcAbsY2 = regionAbsY + vpcOffsetY;
    const bdryY = VPC_PAD.top + (layout.hasIgw ? IGW_SPACE : 0) + layout.azH + VPCBDRY_GAP;
    classified.vpcBoundary.forEach((item, i) => {
      const id = nextId();
      const x = VPC_PAD.left + i * (ICON_W + ICON_GAP);
      cells.push(iconCell(id, item.info.label, item.info.shape, item.info.fillColor, vpcId, x, bdryY));
      idMap[item.svc.name.toLowerCase()] = id;
      posMap[id] = { x: vpcAbsX2 + x + ICON_W / 2, y: vpcAbsY2 + bdryY + ICON_H / 2 };
    });
  }

  // ── Region sidebar ──
  if (layout.sidebarNeeded) {
    const sideX = REGION_PAD.left + (layout.hasVpc ? layout.vpcW + 30 : 20);
    const sideGroupId = nextId();
    cells.push(groupCell(sideGroupId, "Managed Services",
      "fillColor=none;strokeColor=#545B64;dashed=1;dashPattern=3 3;fontColor=#545B64;fontSize=11;fontStyle=1;container=1;pointerEvents=0;collapsible=0;recursiveResize=0;html=1;whiteSpace=wrap;verticalAlign=top;rounded=1;arcSize=3;",
      regionId, sideX, vpcOffsetY, SIDEBAR_W, layout.sidebarH));

    const sideAbsX = regionAbsX + sideX;
    const sideAbsY = regionAbsY + vpcOffsetY;
    let sideY = 30;

    for (const group of layout.sidebarGroups) {
      const labelId = nextId();
      cells.push(`<mxCell id="${labelId}" value="${esc(group.label)}" style="text;html=1;fontSize=10;fontStyle=1;fontColor=#232F3E;align=left;verticalAlign=middle;spacingLeft=5;fillColor=none;strokeColor=none;" vertex="1" parent="${sideGroupId}"><mxGeometry x="5" y="${sideY}" width="${SIDEBAR_W - 10}" height="${SIDEBAR_GROUP_LABEL_H}" as="geometry"/></mxCell>`);
      sideY += SIDEBAR_GROUP_LABEL_H;

      const padLeft = (SIDEBAR_W - SIDEBAR_COLS * ICON_W - (SIDEBAR_COLS - 1) * ICON_GAP) / 2;
      group.items.forEach((item, idx) => {
        const col = idx % SIDEBAR_COLS;
        const row = Math.floor(idx / SIDEBAR_COLS);
        const iconX = padLeft + col * SIDEBAR_ICON_COL_W;
        const iconY = sideY + row * (ICON_H + ICON_LABEL_H);
        const iconId = nextId();
        cells.push(iconCell(iconId, item.info.label, item.info.shape, item.info.fillColor, sideGroupId, iconX, iconY));
        const key = item.svc.name.toLowerCase();
        if (!idMap[key]) idMap[key] = iconId;
        posMap[iconId] = { x: sideAbsX + iconX + ICON_W / 2, y: sideAbsY + iconY + ICON_H / 2 };
      });

      sideY += group.rows * (ICON_H + ICON_LABEL_H) + SIDEBAR_GROUP_GAP;
    }
  }

  // ── Top category boxes ──
  if (layout.hasTopCats) {
    const topCatX = cloudX + layout.cloudW + CAT_BOX_GAP;
    let tcX = topCatX;
    for (const cat of layout.topCats) {
      const catId = nextId();
      cells.push(groupCell(catId, cat.label, categoryBoxStyle(cat.borderColor), "1",
        tcX, USERS_Y, cat.w, cat.h));
      cat.items.forEach((item, idx) => {
        const row = Math.floor(idx / CAT_MAX_PER_ROW);
        const col = idx % CAT_MAX_PER_ROW;
        const iconX = CAT_PAD.left + col * (ICON_W + ICON_GAP);
        const iconY = CAT_PAD.top + row * (ICON_H + ICON_LABEL_H);
        const iconId = nextId();
        cells.push(iconCell(iconId, item.info.label, item.info.shape, item.info.fillColor, catId, iconX, iconY));
        const key = item.svc.name.toLowerCase();
        if (!idMap[key]) idMap[key] = iconId;
        posMap[iconId] = { x: tcX + iconX + ICON_W / 2, y: USERS_Y + iconY + ICON_H / 2 };
      });
      tcX += cat.w + CAT_BOX_GAP;
    }
  }

  // ── Bottom category boxes ──
  if (layout.hasBottomCats) {
    const bottomCatY = layout.cloudY + layout.cloudH + CAT_ROW_GAP;
    const startX = (layout.totalW - layout.bottomCatRowW) / 2;
    let catX = startX;
    for (const cat of layout.bottomCats) {
      const catId = nextId();
      cells.push(groupCell(catId, cat.label, categoryBoxStyle(cat.borderColor), "1",
        catX, bottomCatY, cat.w, cat.h));
      cat.items.forEach((item, idx) => {
        const row = Math.floor(idx / CAT_MAX_PER_ROW);
        const col = idx % CAT_MAX_PER_ROW;
        const iconX = CAT_PAD.left + col * (ICON_W + ICON_GAP);
        const iconY = CAT_PAD.top + row * (ICON_H + ICON_LABEL_H);
        const iconId = nextId();
        cells.push(iconCell(iconId, item.info.label, item.info.shape, item.info.fillColor, catId, iconX, iconY));
        const key = item.svc.name.toLowerCase();
        if (!idMap[key]) idMap[key] = iconId;
        posMap[iconId] = { x: catX + iconX + ICON_W / 2, y: bottomCatY + iconY + ICON_H / 2 };
      });
      catX += cat.w + CAT_BOX_GAP;
    }
  }

  // ── Edges ──
  const edgeCells = generateEdges(classified, idMap, posMap);
  cells.push(...edgeCells);

  return wrapDiagramXml(cells, layout.totalW, layout.totalH);
}
