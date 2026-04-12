/**
 * Verify FLAT structure of horizontal diagram output.
 * Checks:
 * 1. All structural elements (Region, VPC, AZ, Cluster) → parent="1", container=0
 * 2. Subnets → parent="1", container=1
 * 3. Icons in subnets → parent=subnetId (relative coords)
 * 4. AZ uses flat style (not AWS group shape)
 * 5. Absolute coordinate sanity checks
 * 6. Compare against reference 123.md positions
 *
 * Run: npx tsx scripts/verify-flat-structure.ts
 */
import { TEMPLATES, adjustTemplateForBudget } from "../src/data/templates";
import { generateArchitecture } from "../src/lib/architecture";
import { generateDiagramXmlH } from "../src/lib/diagram-xml-horizontal";
import { readFileSync } from "fs";

let pass = 0;
let fail = 0;

function check(label: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    pass++;
  } else {
    console.log(`  ❌ ${label}${detail ? ` — ${detail}` : ""}`);
    fail++;
  }
}

// ── Parse mxCell elements from XML ──
interface MxCell {
  id: string;
  value: string;
  style: string;
  parent: string;
  x: number;
  y: number;
  w: number;
  h: number;
  isEdge: boolean;
}

function parseCells(xml: string): MxCell[] {
  const cells: MxCell[] = [];
  const pattern = /<mxCell\s+([^>]*)>(?:[\s\S]*?<mxGeometry\s+([^/]*)\/?>)?/g;
  let m;
  while ((m = pattern.exec(xml)) !== null) {
    const attrs = m[1];
    const geo = m[2] || "";

    const id = attrs.match(/id="([^"]*)"/)?.[1] || "";
    const value = (attrs.match(/value="([^"]*)"/)?.[1] || "")
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
    const style = attrs.match(/style="([^"]*)"/)?.[1] || "";
    const parent = attrs.match(/parent="([^"]*)"/)?.[1] || "";
    const isEdge = /edge="1"/.test(attrs);

    const x = parseFloat(geo.match(/x="([^"]*)"/)?.[1] || "0");
    const y = parseFloat(geo.match(/y="([^"]*)"/)?.[1] || "0");
    const w = parseFloat(geo.match(/width="([^"]*)"/)?.[1] || "0");
    const h = parseFloat(geo.match(/height="([^"]*)"/)?.[1] || "0");

    cells.push({ id, value, style, parent, x, y, w, h, isEdge });
  }
  return cells;
}

function findCell(cells: MxCell[], keyword: string): MxCell | undefined {
  return cells.find(c => c.value.toLowerCase().includes(keyword.toLowerCase()) && !c.isEdge);
}

function findAllCells(cells: MxCell[], keyword: string): MxCell[] {
  return cells.filter(c => c.value.toLowerCase().includes(keyword.toLowerCase()) && !c.isEdge);
}

function getContainer(style: string): number {
  const m = style.match(/container=(\d)/);
  return m ? parseInt(m[1]) : -1;
}

function hasAwsGroupShape(style: string): boolean {
  return style.includes("shape=mxgraph.aws4.group");
}

// ═══════════════════════════════════════════════════════════════════════
// TEST 1: Ticketing template (closest to reference 123.md)
// ═══════════════════════════════════════════════════════════════════════
console.log("\n" + "═".repeat(70));
console.log("  TEST 1: Ticketing template — FLAT structure verification");
console.log("═".repeat(70));

const tpl1 = TEMPLATES.find(t => t.id === "ticketing")!;
const { state: s1 } = adjustTemplateForBudget(tpl1.state, "balanced");
const arch1 = generateArchitecture(s1, "ko");
const xml1 = generateDiagramXmlH(arch1, s1);
const cells1 = parseCells(xml1);

// 1a. Structural elements: parent="1", container=0
console.log("\n[1] Structural elements → parent='1', container=0:");
const region1 = findCell(cells1, "AWS Region");
check("Region exists", !!region1);
if (region1) {
  check("Region parent='1'", region1.parent === "1", `got parent='${region1.parent}'`);
  check("Region container=0", getContainer(region1.style) === 0, `got container=${getContainer(region1.style)}`);
}

const vpc1 = findCell(cells1, "VPC");
check("VPC exists", !!vpc1);
if (vpc1) {
  check("VPC parent='1'", vpc1.parent === "1", `got parent='${vpc1.parent}'`);
  check("VPC container=0", getContainer(vpc1.style) === 0, `got container=${getContainer(vpc1.style)}`);
}

const azA1 = findCell(cells1, "Availability Zone A");
check("AZ A exists", !!azA1);
if (azA1) {
  check("AZ A parent='1'", azA1.parent === "1", `got parent='${azA1.parent}'`);
  check("AZ A container=0", getContainer(azA1.style) === 0, `got container=${getContainer(azA1.style)}`);
  check("AZ A uses flat style (no AWS group shape)", !hasAwsGroupShape(azA1.style), `style has mxgraph.aws4.group`);
  check("AZ A has dashed=1", azA1.style.includes("dashed=1"));
  check("AZ A has strokeColor=#147EBA", azA1.style.includes("strokeColor=#147EBA"));
}

const azB1 = findCell(cells1, "Availability Zone B");
check("AZ B exists", !!azB1);
if (azB1) {
  check("AZ B parent='1'", azB1.parent === "1", `got parent='${azB1.parent}'`);
  check("AZ B container=0", getContainer(azB1.style) === 0, `got container=${getContainer(azB1.style)}`);
  check("AZ B uses flat style", !hasAwsGroupShape(azB1.style));
}

// 1b. Subnets: parent="1", container=1
console.log("\n[2] Subnets → parent='1', container=1:");
const pubSubs = findAllCells(cells1, "Public Subnet");
const appSubs = findAllCells(cells1, "Private App Subnet");
const cacheSubs = findAllCells(cells1, "Private Cache Subnet");
const dbSubs = findAllCells(cells1, "Private DB Subnet");
const allSubs = [...pubSubs, ...appSubs, ...cacheSubs, ...dbSubs];

check(`Found ${allSubs.length} subnets (expect ≥4 for 2 AZ)`, allSubs.length >= 4, `got ${allSubs.length}`);

for (const sub of allSubs) {
  check(`${sub.value.slice(0, 30)} parent='1'`, sub.parent === "1", `got parent='${sub.parent}'`);
  check(`${sub.value.slice(0, 30)} container=1`, getContainer(sub.style) === 1, `got container=${getContainer(sub.style)}`);
}

// 1c. Icons in subnets: parent=subnetId (NOT "1")
console.log("\n[3] Icons inside subnets → parent=subnetId:");
const subnetIds = new Set(allSubs.map(s => s.id));
const iconsInSubs = cells1.filter(c =>
  !c.isEdge && subnetIds.has(c.parent) && c.style.includes("resIcon="));
check(`Found icons inside subnets`, iconsInSubs.length > 0, `got ${iconsInSubs.length}`);

for (const ic of iconsInSubs.slice(0, 5)) {
  check(`Icon '${ic.value.slice(0, 20)}' parent=${ic.parent} (subnet)`, subnetIds.has(ic.parent));
  check(`Icon '${ic.value.slice(0, 20)}' relative coords (x<300)`, ic.x < 300, `x=${ic.x}`);
}

// 1d. No structural element has parent=regionId or parent=vpcId
console.log("\n[4] No element (except edges) has parent=regionId or vpcId:");
const regionId = region1?.id || "";
const vpcId = vpc1?.id || "";
const childrenOfRegion = cells1.filter(c => c.parent === regionId && !c.isEdge);
const childrenOfVpc = cells1.filter(c => c.parent === vpcId && !c.isEdge);
check(`No children of Region (${regionId})`, childrenOfRegion.length === 0,
  `found ${childrenOfRegion.length}: ${childrenOfRegion.map(c => c.value.slice(0, 20)).join(", ")}`);
check(`No children of VPC (${vpcId})`, childrenOfVpc.length === 0,
  `found ${childrenOfVpc.length}: ${childrenOfVpc.map(c => c.value.slice(0, 20)).join(", ")}`);

// 1e. AZ IDs should also have no children
if (azA1 && azB1) {
  const childrenOfAzA = cells1.filter(c => c.parent === azA1.id && !c.isEdge);
  const childrenOfAzB = cells1.filter(c => c.parent === azB1.id && !c.isEdge);
  check(`No children of AZ A (${azA1.id})`, childrenOfAzA.length === 0,
    `found ${childrenOfAzA.length}: ${childrenOfAzA.map(c => c.value.slice(0, 20)).join(", ")}`);
  check(`No children of AZ B (${azB1.id})`, childrenOfAzB.length === 0,
    `found ${childrenOfAzB.length}: ${childrenOfAzB.map(c => c.value.slice(0, 20)).join(", ")}`);
}

// 1f. Absolute coordinate sanity
console.log("\n[5] Absolute coordinate sanity:");
if (region1) {
  check("Region X = 324", region1.x === 324, `got ${region1.x}`);
  check("Region Y ~ 575", Math.abs(region1.y - 575) < 10, `got ${region1.y}`);
}
if (vpc1 && region1) {
  check("VPC X = Region.X + 172 = 496", vpc1.x === 496, `got ${vpc1.x}`);
  check("VPC Y = Region.Y + 77", vpc1.y === region1.y + 77, `got ${vpc1.y} (expected ${region1.y + 77})`);
}
if (azA1 && vpc1) {
  check("AZ A X = VPC.X + 70 = 566", azA1.x === 566, `got ${azA1.x}`);
  check("AZ A Y = VPC.Y + 57", azA1.y === vpc1.y + 57, `got ${azA1.y} (expected ${vpc1.y + 57})`);
}
if (azA1 && azB1) {
  const gap = azB1.y - (azA1.y + azA1.h);
  check("AZ B below AZ A with gap=88", gap === 88, `gap=${gap}`);
}

// 1g. Public subnet absolute position
if (pubSubs.length > 0 && azA1) {
  const pub = pubSubs[0];
  check("Public Subnet AZ A: x = AZ.x + 20 = 586", pub.x === 586, `got ${pub.x}`);
  check("Public Subnet AZ A: y = AZ.y + 35", pub.y === azA1.y + 35, `got ${pub.y} (expected ${azA1.y + 35})`);
}

// ═══════════════════════════════════════════════════════════════════════
// TEST 2: b2b_saas (EKS cluster) — FLAT structure
// ═══════════════════════════════════════════════════════════════════════
console.log("\n" + "═".repeat(70));
console.log("  TEST 2: b2b_saas (EKS) — cluster overlay verification");
console.log("═".repeat(70));

const tpl2 = TEMPLATES.find(t => t.id === "b2b_saas")!;
const { state: s2 } = adjustTemplateForBudget(tpl2.state, "balanced");
const arch2 = generateArchitecture(s2, "ko");
const xml2 = generateDiagramXmlH(arch2, s2);
const cells2 = parseCells(xml2);

const eksCluster = findCell(cells2, "EKS CLUSTER");
console.log("\n[6] EKS Cluster overlay:");
if (eksCluster) {
  check("EKS CLUSTER exists", true);
  check("EKS CLUSTER parent='1'", eksCluster.parent === "1", `got parent='${eksCluster.parent}'`);
  check("EKS CLUSTER container=0", getContainer(eksCluster.style) === 0, `got container=${getContainer(eksCluster.style)}`);
  // EKS should span across AZ gap (height > single AZ)
  const azA2 = findCell(cells2, "Availability Zone A");
  if (azA2) {
    check("EKS spans taller than single AZ", eksCluster.h > azA2.h * 0.8,
      `EKS h=${eksCluster.h}, AZ A h=${azA2.h}`);
  }
} else {
  check("EKS CLUSTER exists", false, "not found in b2b_saas output");
}

// Also verify Region/VPC/AZ flat for b2b_saas
const region2 = findCell(cells2, "AWS Region");
const vpc2 = findCell(cells2, "VPC");
const azA2 = findCell(cells2, "Availability Zone A");

if (region2) check("b2b Region parent='1'", region2.parent === "1");
if (vpc2) check("b2b VPC parent='1'", vpc2.parent === "1");
if (azA2) {
  check("b2b AZ A parent='1'", azA2.parent === "1");
  check("b2b AZ A flat style (no group shape)", !hasAwsGroupShape(azA2.style));
}

// ═══════════════════════════════════════════════════════════════════════
// TEST 3: All templates — no crash + structure check
// ═══════════════════════════════════════════════════════════════════════
console.log("\n" + "═".repeat(70));
console.log("  TEST 3: All templates — FLAT structure universal check");
console.log("═".repeat(70));

const BUDGET_MODES = ["cost_first", "balanced", "perf_first"] as const;
let allOk = true;

for (const tpl of TEMPLATES) {
  for (const mode of BUDGET_MODES) {
    const { state } = adjustTemplateForBudget(tpl.state, mode);
    const arch = generateArchitecture(state, "ko");
    const xml = generateDiagramXmlH(arch, state);
    const cells = parseCells(xml);

    const region = findCell(cells, "AWS Region");
    const vpc = findCell(cells, "VPC");
    const azs = findAllCells(cells, "Availability Zone");

    // Check Region
    if (region && region.parent !== "1") {
      console.log(`  ❌ ${tpl.id}/${mode}: Region parent='${region.parent}' (expected '1')`);
      allOk = false; fail++;
    }
    if (region && getContainer(region.style) !== 0) {
      console.log(`  ❌ ${tpl.id}/${mode}: Region container=${getContainer(region.style)} (expected 0)`);
      allOk = false; fail++;
    }

    // Check VPC
    if (vpc && vpc.parent !== "1") {
      console.log(`  ❌ ${tpl.id}/${mode}: VPC parent='${vpc.parent}' (expected '1')`);
      allOk = false; fail++;
    }

    // Check AZs
    for (const az of azs) {
      if (az.parent !== "1") {
        console.log(`  ❌ ${tpl.id}/${mode}: ${az.value} parent='${az.parent}' (expected '1')`);
        allOk = false; fail++;
      }
      if (hasAwsGroupShape(az.style)) {
        console.log(`  ❌ ${tpl.id}/${mode}: ${az.value} uses AWS group shape (should be flat)`);
        allOk = false; fail++;
      }
    }

    // No children of region, vpc, or az IDs (except edges)
    const structIds = new Set([region?.id, vpc?.id, ...azs.map(a => a.id)].filter(Boolean) as string[]);
    for (const cell of cells) {
      if (cell.isEdge) continue;
      if (structIds.has(cell.parent)) {
        console.log(`  ❌ ${tpl.id}/${mode}: '${cell.value.slice(0, 25)}' has parent='${cell.parent}' (structural)`);
        allOk = false; fail++;
        break; // one is enough
      }
    }
  }
}

if (allOk) {
  console.log(`  ✅ All ${TEMPLATES.length * 3} template×mode combinations: FLAT structure OK`);
  pass++;
}

// ═══════════════════════════════════════════════════════════════════════
// TEST 4: Reference 123.md position comparison
// ═══════════════════════════════════════════════════════════════════════
console.log("\n" + "═".repeat(70));
console.log("  TEST 4: Reference 123.md coordinate comparison");
console.log("═".repeat(70));

let refXml: string;
try {
  refXml = readFileSync("123.md", "utf-8");
} catch {
  refXml = "";
  console.log("  ⚠️  123.md not found, skipping reference comparison");
}

if (refXml) {
  const refCells = parseCells(refXml);
  // Reference key positions
  const refRegion = findCell(refCells, "Region");
  const refVpc = findCell(refCells, "VPC");
  const refAzA = findCell(refCells, "Availability Zone A");
  const refAzB = findCell(refCells, "Availability Zone B");
  const refPubA = refCells.find(c => c.value.includes("Public Subnet") && c.y < 900);
  const refEks = findCell(refCells, "EKS CLUSTER");
  const refMsk = findCell(refCells, "MSK CLUSTER");

  console.log("\nReference 123.md key positions:");
  console.log(`  Region:    x=${refRegion?.x}, y=${refRegion?.y}, w=${refRegion?.w}, h=${refRegion?.h}`);
  console.log(`  VPC:       x=${refVpc?.x}, y=${refVpc?.y}, w=${refVpc?.w}, h=${refVpc?.h}`);
  console.log(`  AZ A:      x=${refAzA?.x}, y=${refAzA?.y}, w=${refAzA?.w}, h=${refAzA?.h}`);
  console.log(`  AZ B:      x=${refAzB?.x}, y=${refAzB?.y}, w=${refAzB?.w}, h=${refAzB?.h}`);
  console.log(`  Public A:  x=${refPubA?.x}, y=${refPubA?.y}, w=${refPubA?.w}, h=${refPubA?.h}`);
  console.log(`  EKS:       x=${refEks?.x}, y=${refEks?.y}, w=${refEks?.w}, h=${refEks?.h}`);
  console.log(`  MSK:       x=${refMsk?.x}, y=${refMsk?.y}, w=${refMsk?.w}, h=${refMsk?.h}`);

  // Check reference structure is also FLAT
  console.log("\nReference structure verification:");
  if (refRegion) check("Ref Region parent='1'", refRegion.parent === "1");
  if (refVpc) check("Ref VPC parent='1'", refVpc.parent === "1");
  if (refAzA) check("Ref AZ A parent='1'", refAzA.parent === "1");
  if (refAzB) check("Ref AZ B parent='1'", refAzB.parent === "1");
  if (refEks) check("Ref EKS parent='1'", refEks.parent === "1");
  if (refMsk) check("Ref MSK parent='1'", refMsk.parent === "1");

  // Generated (ticketing) position comparison
  console.log("\nGenerated (ticketing) key positions:");
  console.log(`  Region:    x=${region1?.x}, y=${region1?.y}, w=${region1?.w}, h=${region1?.h}`);
  console.log(`  VPC:       x=${vpc1?.x}, y=${vpc1?.y}, w=${vpc1?.w}, h=${vpc1?.h}`);
  console.log(`  AZ A:      x=${azA1?.x}, y=${azA1?.y}, w=${azA1?.w}, h=${azA1?.h}`);
  console.log(`  AZ B:      x=${azB1?.x}, y=${azB1?.y}, w=${azB1?.w}, h=${azB1?.h}`);
  if (pubSubs[0]) console.log(`  Public A:  x=${pubSubs[0].x}, y=${pubSubs[0].y}, w=${pubSubs[0].w}, h=${pubSubs[0].h}`);

  // Position formula checks
  console.log("\nPosition formula alignment:");
  check("Region X matches (324)", region1?.x === 324 && refRegion?.x === 324);
  if (vpc1 && refVpc) {
    check("VPC X matches formula (Region+172=496)", vpc1.x === 496 && refVpc.x === 496);
  }
  if (azA1 && refAzA) {
    check("AZ A X matches formula (VPC+70=566)", azA1.x === 566 && refAzA.x === 566);
  }
  if (pubSubs[0] && refPubA) {
    check("Public Subnet X matches formula (AZ+20=586)", pubSubs[0].x === 586 && refPubA.x === 586);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════════════
console.log("\n" + "═".repeat(70));
console.log(`  SUMMARY: ${pass} passed, ${fail} failed`);
console.log("═".repeat(70));

if (fail > 0) {
  process.exit(1);
}
