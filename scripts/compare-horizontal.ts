/**
 * Compare generated horizontal XML against reference file (123.md)
 * Uses a DIRECT Architecture object matching 123.md services exactly.
 * Run: npx tsx scripts/compare-horizontal.ts
 */
import { generateDiagramXmlH } from "../src/lib/diagram-xml-horizontal";
import { readFileSync, writeFileSync } from "fs";
import type { Architecture, WizardState } from "../src/lib/types";

// ── Direct Architecture matching 123.md services exactly ──
const arch: Architecture = {
  layers: [
    {
      id: "edge", label: "엣지", icon: "🌐", color: "#8C4FFF", bg: "#F5F0FF",
      services: [
        { name: "Route 53" },
        { name: "CloudFront" },
        { name: "WAF" },
      ],
    },
    {
      id: "network", label: "네트워크", icon: "🔗", color: "#8C4FFF", bg: "#F5F0FF",
      services: [
        { name: "NAT GW 2개 (AZ당 1개)" },
        { name: "VPC Endpoint" },
      ],
    },
    {
      id: "compute", label: "컴퓨트", icon: "⚙️", color: "#ED7100", bg: "#FFF4E6",
      services: [
        { name: "ALB" },
        { name: "EKS on EC2" },
        { name: "EC2 Auto Scaling" },
      ],
    },
    {
      id: "data", label: "데이터", icon: "💾", color: "#C925D1", bg: "#FDF0FF",
      services: [
        { name: "Aurora PostgreSQL" },
        { name: "ElastiCache (Valkey/Redis)" },
        { name: "MSK (Managed Kafka)" },
      ],
    },
    {
      id: "cicd", label: "CI/CD", icon: "🔄", color: "#E7157B", bg: "#FFF0F5",
      services: [
        { name: "Terraform" },
        { name: "GitHub Actions" },
      ],
    },
  ],
  waScore: {},
};

const state: WizardState = {
  network: { az_count: "2az", subnet_tier: "3tier" },
};

const xml = generateDiagramXmlH(arch, state);
writeFileSync("scripts/generated-horizontal.drawio", xml);

const ref = readFileSync("123.md", "utf-8");

// ── Extract containers ──
type Container = { id: string; name: string; x: number; y: number; w: number; h: number };

function extractContainers(xmlStr: string): Container[] {
  const pat = /id="([^"]*)"[^>]*value="([^"]*)"[^>]*(?:shape=mxgraph\.aws4\.group[^"]*|container=[01])[^>]*>[\s\S]*?<mxGeometry\s+x="([^"]*?)"\s+y="([^"]*?)"\s+width="([^"]*?)"\s+height="([^"]*?)"/g;
  const out: Container[] = [];
  let m;
  while ((m = pat.exec(xmlStr)) !== null) {
    const name = m[2].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#xa;/g, " ").replace(/<[^>]*>/g, "").trim();
    if (name && !name.match(/^\s*$/)) {
      out.push({ id: m[1], name: name.slice(0, 55), x: +m[3], y: +m[4], w: +m[5], h: +m[6] });
    }
  }
  out.sort((a, b) => a.y - b.y || a.x - b.x);
  return out;
}

function printContainers(containers: Container[], label: string) {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`  ${label}`);
  console.log("=".repeat(70));
  console.log("Name".padEnd(56) + "X".padStart(7) + "Y".padStart(7) + "W".padStart(7) + "H".padStart(7));
  console.log("-".repeat(84));
  for (const c of containers) {
    console.log(`${c.name.padEnd(56)}${c.x.toString().padStart(7)}${c.y.toString().padStart(7)}${c.w.toString().padStart(7)}${c.h.toString().padStart(7)}`);
  }
}

const refC = extractContainers(ref);
const genC = extractContainers(xml);

printContainers(refC, "REFERENCE (123.md)");
printContainers(genC, "GENERATED");

// ── Side-by-side comparison ──
console.log(`\n${"=".repeat(90)}`);
console.log("  ELEMENT-BY-ELEMENT COMPARISON");
console.log("=".repeat(90));

const items = [
  { label: "Region",       ref: /Region/i,              gen: /Region/i },
  { label: "VPC",          ref: /^VPC/i,                gen: /^VPC/i },
  { label: "AZ A",         ref: /Availability Zone A/i, gen: /Availability Zone A/i },
  { label: "AZ B",         ref: /Availability Zone B/i, gen: /Availability Zone B/i },
  { label: "Public Sub A", ref: /Public Subnet/i,       gen: /Public Subnet/i },
  { label: "EKS Cluster",  ref: /EKS CLUSTER/i,         gen: /EKS CLUSTER/i },
  { label: "App Sub A",    ref: /Private App/i,         gen: /Private App/i },
  { label: "MSK Cluster",  ref: /MSK CLUSTER/i,         gen: /MSK CLUSTER/i },
  { label: "Stream Sub A", ref: /Private Streaming/i,   gen: /Private Streaming/i },
  { label: "Cache Sub A",  ref: /Private Cache/i,       gen: /Private Cache/i },
  { label: "DB Sub A",     ref: /Private DB/i,          gen: /Private DB/i },
];

console.log("\n" + "Element".padEnd(16) + "│ " + "Ref (X, Y, W, H)".padEnd(30) + "│ " + "Gen (X, Y, W, H)".padEnd(30) + "│ Delta");
console.log("─".repeat(16) + "┼" + "─".repeat(32) + "┼" + "─".repeat(32) + "┼" + "─".repeat(20));

for (const item of items) {
  const r = refC.find(c => item.ref.test(c.name));
  const g = genC.find(c => item.gen.test(c.name));

  const rStr = r ? `${r.x}, ${r.y}, ${r.w}, ${r.h}` : "NOT FOUND";
  const gStr = g ? `${g.x}, ${g.y}, ${g.w}, ${g.h}` : "NOT FOUND";

  let delta = "";
  if (r && g) {
    const dx = g.x - r.x, dy = g.y - r.y, dw = g.w - r.w, dh = g.h - r.h;
    if (dx === 0 && dy === 0 && dw === 0 && dh === 0) {
      delta = "EXACT MATCH";
    } else {
      const parts: string[] = [];
      if (dx) parts.push(`dX=${dx}`);
      if (dy) parts.push(`dY=${dy}`);
      if (dw) parts.push(`dW=${dw}`);
      if (dh) parts.push(`dH=${dh}`);
      delta = parts.join(" ");
    }
  } else {
    delta = r ? "GEN MISSING" : g ? "REF MISSING" : "BOTH MISSING";
  }

  console.log(`${item.label.padEnd(16)}│ ${rStr.padEnd(30)}│ ${gStr.padEnd(30)}│ ${delta}`);
}
