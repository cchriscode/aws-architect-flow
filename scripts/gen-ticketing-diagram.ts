import { TEMPLATES, adjustTemplateForBudget } from "../src/data/templates";
import { generateArchitecture } from "../src/lib/architecture";
import { generateDiagramXmlH } from "../src/lib/diagram-xml-horizontal";
import { generateDiagramXml } from "../src/lib/diagram-xml";
import * as fs from "fs";

const tpl = TEMPLATES.find(t => t.id === "ticketing")!;
const { state } = adjustTemplateForBudget(tpl.state, "balanced");
const arch = generateArchitecture(state, "ko");

// 세로 버전
const xmlH = generateDiagramXmlH(arch, state);
fs.writeFileSync("scripts/ticketing-vertical.drawio", xmlH);
console.log("세로 버전 생성: scripts/ticketing-vertical.drawio");

// Count ASG in vertical
const asgCountH = (xmlH.match(/Auto Scaling Group/g) || []).length;
console.log("세로 버전 ASG 수:", asgCountH);

// 가로 버전
const xmlV = generateDiagramXml(arch, state);
fs.writeFileSync("scripts/ticketing-horizontal.drawio", xmlV);
console.log("가로 버전 생성: scripts/ticketing-horizontal.drawio");

const asgCountV = (xmlV.match(/Auto Scaling Group/g) || []).length;
console.log("가로 버전 ASG 수:", asgCountV);

// Parse ASG cells in vertical
console.log("\n=== 세로 버전 ASG 상세 ===");
const cellsH = xmlH.split("<mxCell");
for (const cell of cellsH) {
  if (cell.includes("Auto Scaling Group")) {
    const parentMatch = cell.match(/parent="([^"]+)"/);
    const xMatch = cell.match(/x="([^"]+)"/);
    const yMatch = cell.match(/y="([^"]+)"/);
    const wMatch = cell.match(/width="([^"]+)"/);
    const hMatch = cell.match(/height="([^"]+)"/);
    const containerMatch = cell.match(/container=([01])/);
    console.log(`  parent=${parentMatch?.[1]} x=${xMatch?.[1]} y=${yMatch?.[1]} w=${wMatch?.[1]} h=${hMatch?.[1]} container=${containerMatch?.[1]}`);
  }
}
