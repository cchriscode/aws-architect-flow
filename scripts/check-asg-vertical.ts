import { TEMPLATES, adjustTemplateForBudget } from "../src/data/templates";
import { generateArchitecture } from "../src/lib/architecture";
import { generateDiagramXml } from "../src/lib/diagram-xml";

const tpl = TEMPLATES.find(t => t.id === "ticketing")!;
const { state } = adjustTemplateForBudget(tpl.state, "balanced");
const arch = generateArchitecture(state, "ko");
const xml = generateDiagramXml(arch, state);

const asgCount = (xml.match(/Auto Scaling Group/g) || []).length;
console.log("[가로 버전] ASG mentions:", asgCount);

const cells = xml.split("<mxCell");
for (const cell of cells) {
  if (cell.includes("Auto Scaling Group")) {
    const parentMatch = cell.match(/parent="([^"]+)"/);
    const xMatch = cell.match(/x="([^"]+)"/);
    const yMatch = cell.match(/y="([^"]+)"/);
    const wMatch = cell.match(/width="([^"]+)"/);
    const hMatch = cell.match(/height="([^"]+)"/);
    console.log(`  parent=${parentMatch?.[1]} x=${xMatch?.[1]} y=${yMatch?.[1]} w=${wMatch?.[1]} h=${hMatch?.[1]}`);
  }
  if (cell.includes("Private App Subnet") || cell.includes("Private Subnet")) {
    if (cell.includes("value=")) {
      const valMatch = cell.match(/value="([^"]+)"/);
      const yMatch = cell.match(/y="([^"]+)"/);
      const hMatch = cell.match(/height="([^"]+)"/);
      if (valMatch?.[1]?.includes("Private"))
        console.log(`  ${valMatch?.[1]}: y=${yMatch?.[1]} h=${hMatch?.[1]}`);
    }
  }
}
