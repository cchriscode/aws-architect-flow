/**
 * Generate both vertical & horizontal drawio for every quick-start template,
 * then validate structural correctness against AWS architecture conventions.
 *
 * Run: npx tsx scripts/check-all-templates.ts
 */
import { TEMPLATES } from "../src/data/templates";
import { generateArchitecture } from "../src/lib/architecture";
import { generateDiagramXml } from "../src/lib/diagram-xml";
import { generateDiagramXmlH } from "../src/lib/diagram-xml-horizontal";
import { writeFileSync, mkdirSync } from "fs";

// ── helpers ──

interface Box {
  id: string; name: string; x: number; y: number; w: number; h: number;
  parent: string; isIcon: boolean;
}

function extractAll(xml: string): Box[] {
  const boxes: Box[] = [];
  // Match each mxCell that has a child mxGeometry
  const cellRe = /<mxCell\s+([^>]+)>\s*<mxGeometry\s+([^/]*)\/>/g;
  let m;
  while ((m = cellRe.exec(xml)) !== null) {
    const attrs = m[1];
    const geo = m[2];
    const id = attrs.match(/id="([^"]*)"/)?.[1] ?? "";
    const rawName = attrs.match(/value="([^"]*)"/)?.[1] ?? "";
    const parent = attrs.match(/parent="([^"]*)"/)?.[1] ?? "";
    const style = attrs.match(/style="([^"]*)"/)?.[1] ?? "";
    const name = rawName.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#xa;/g, " ").replace(/<[^>]*>/g, "").trim();
    const x = +(geo.match(/x="([^"]*)"/)?.[1] ?? "0");
    const y = +(geo.match(/y="([^"]*)"/)?.[1] ?? "0");
    const w = +(geo.match(/width="([^"]*)"/)?.[1] ?? "0");
    const h = +(geo.match(/height="([^"]*)"/)?.[1] ?? "0");
    const isIcon = !style.includes("group") && !style.includes("container=1") && !style.includes("fillColor=none");
    boxes.push({ id, name, parent, x, y, w, h, isIcon });
  }
  return boxes;
}

interface Issue { level: "ERROR" | "WARN"; msg: string; }

function validate(xml: string, tplId: string, direction: string): Issue[] {
  const issues: Issue[] = [];
  const allBoxes = extractAll(xml);
  // Filter out edge labels/waypoints (0x0 elements)
  const boxes = allBoxes.filter(b => b.w > 0 && b.h > 0);

  // 1. Must have Region, VPC, at least 1 AZ
  const hasRegion = boxes.some(b => /Region/.test(b.name));
  const hasVpc = boxes.some(b => /VPC/.test(b.name));
  const azCount = boxes.filter(b => /Availability Zone/.test(b.name)).length;

  if (!hasRegion) issues.push({ level: "ERROR", msg: "Missing Region container" });
  if (!hasVpc) issues.push({ level: "WARN", msg: "Missing VPC (may be serverless)" });
  if (hasVpc && azCount === 0) issues.push({ level: "ERROR", msg: "VPC exists but no AZ found" });

  // 2. Check for negative coordinates (can indicate layout overflow)
  for (const b of boxes) {
    if (b.x < -100 || b.y < -100) {
      issues.push({ level: "WARN", msg: `Large negative coords: "${b.name}" (${b.x}, ${b.y})` });
    }
  }

  // 3. Check subnets exist inside AZs
  const pubSubs = boxes.filter(b => /Public Subnet/.test(b.name));
  const privSubs = boxes.filter(b => /Private/.test(b.name) && /Subnet/.test(b.name));
  if (hasVpc && pubSubs.length === 0 && privSubs.length === 0) {
    issues.push({ level: "WARN", msg: "No subnets found inside VPC" });
  }

  // 4. Check ALB placement for multi-AZ
  if (azCount > 1) {
    const albBoxes = boxes.filter(b => b.name === "ALB" || b.name === "NLB");
    if (albBoxes.length > 1) {
      issues.push({ level: "WARN", msg: `Multiple ALB/NLB icons (${albBoxes.length}) — should be 1 between AZs` });
    }
    // Check ALB is NOT inside a subnet (should be between AZs)
    for (const alb of albBoxes) {
      const parentBox = boxes.find(b => b.id === alb.parent);
      if (parentBox && /Subnet/.test(parentBox.name)) {
        issues.push({ level: "ERROR", msg: `ALB inside subnet "${parentBox.name}" — should be between AZs` });
      }
    }
  }

  // 5. Check connections exist
  const edgeCount = (xml.match(/style="[^"]*edgeStyle/g) || []).length;
  if (edgeCount === 0) {
    issues.push({ level: "WARN", msg: "No edge connections found" });
  }

  // 6. Check AWS Cloud container exists (vertical only; horizontal uses flat structure)
  if (direction === "vertical" && !boxes.some(b => /AWS Cloud/.test(b.name))) {
    issues.push({ level: "ERROR", msg: "Missing AWS Cloud container" });
  }

  // 7. Check Users icon exists
  if (!boxes.some(b => /Users|Internal Users/.test(b.name))) {
    issues.push({ level: "WARN", msg: "No Users icon" });
  }

  // 8. Container overlap check — AZs should not overlap each other
  const azBoxes = boxes.filter(b => /Availability Zone/.test(b.name));
  for (let i = 0; i < azBoxes.length; i++) {
    for (let j = i + 1; j < azBoxes.length; j++) {
      const a = azBoxes[i], b2 = azBoxes[j];
      // Same parent means siblings — check overlap
      if (a.parent === b2.parent) {
        const overlapX = a.x < b2.x + b2.w && a.x + a.w > b2.x;
        const overlapY = a.y < b2.y + b2.h && a.y + a.h > b2.y;
        if (overlapX && overlapY) {
          issues.push({ level: "ERROR", msg: `AZ overlap: "${a.name}" and "${b2.name}"` });
        }
      }
    }
  }

  return issues;
}

// ── main ──

const outDir = "scripts/check-output";
try { mkdirSync(outDir, { recursive: true }); } catch {}

const budgets = ["cost_first", "balanced", "perf_first"] as const;
const results: { tpl: string; dir: string; budget: string; errors: number; warns: number; icons: number; edges: number }[] = [];
let totalErrors = 0;
let totalWarns = 0;

console.log("═".repeat(90));
console.log("  AWS Architecture Diagram Validation — All Templates × Both Directions × 3 Budgets");
console.log("═".repeat(90));

for (const tpl of TEMPLATES) {
  for (const budget of budgets) {
    const state = JSON.parse(JSON.stringify(tpl.state));
    if (state.cost) state.cost.priority = budget;

    const arch = generateArchitecture(state, "ko");
    const serviceCount = arch.layers.reduce((s, l) => s + l.services.length, 0);

    for (const dir of ["vertical", "horizontal"] as const) {
      const xml = dir === "vertical"
        ? generateDiagramXml(arch, state)
        : generateDiagramXmlH(arch, state);

      const fname = `${tpl.id}_${budget}_${dir}.drawio`;
      writeFileSync(`${outDir}/${fname}`, xml);

      const issues = validate(xml, tpl.id, dir);
      const errors = issues.filter(i => i.level === "ERROR");
      const warns = issues.filter(i => i.level === "WARN");
      totalErrors += errors.length;
      totalWarns += warns.length;

      const boxes = extractAll(xml);
      const iconCount = boxes.filter(b => b.isIcon).length;
      const edgeCount = (xml.match(/style="[^"]*edgeStyle/g) || []).length;

      results.push({
        tpl: tpl.id, dir, budget,
        errors: errors.length, warns: warns.length,
        icons: iconCount, edges: edgeCount,
      });

      if (issues.length > 0) {
        console.log(`\n▸ ${tpl.id} / ${budget} / ${dir}  (${serviceCount} services → ${iconCount} icons, ${edgeCount} edges)`);
        for (const iss of issues) {
          const marker = iss.level === "ERROR" ? "  ✗" : "  ⚠";
          console.log(`${marker} ${iss.msg}`);
        }
      }
    }
  }
}

// ── Summary ──
console.log("\n" + "═".repeat(90));
console.log("  SUMMARY");
console.log("═".repeat(90));

console.log(`\n${"Template".padEnd(30)} ${"Budget".padEnd(12)} ${"Dir".padEnd(12)} ${"Icons".padStart(6)} ${"Edges".padStart(6)} ${"Err".padStart(5)} ${"Warn".padStart(5)}`);
console.log("─".repeat(76));
for (const r of results) {
  const errStr = r.errors > 0 ? `✗ ${r.errors}` : "  0";
  const warnStr = r.warns > 0 ? `⚠ ${r.warns}` : "  0";
  console.log(`${r.tpl.padEnd(30)} ${r.budget.padEnd(12)} ${r.dir.padEnd(12)} ${r.icons.toString().padStart(6)} ${r.edges.toString().padStart(6)} ${errStr.padStart(5)} ${warnStr.padStart(5)}`);
}

console.log("\n" + "─".repeat(76));
console.log(`Total: ${results.length} diagrams | ${totalErrors} errors | ${totalWarns} warnings`);
console.log(`Output: ${outDir}/`);

if (totalErrors > 0) {
  console.log("\n✗ ERRORS FOUND — diagrams may be broken");
  process.exit(1);
} else if (totalWarns > 0) {
  console.log("\n⚠ Warnings only — review recommended");
} else {
  console.log("\n✓ All diagrams passed validation");
}
