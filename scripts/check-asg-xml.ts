import { TEMPLATES, adjustTemplateForBudget } from "../src/data/templates";
import { generateArchitecture } from "../src/lib/architecture";
import { generateDiagramXmlH } from "../src/lib/diagram-xml-horizontal";

const tpl = TEMPLATES.find(t => t.id === "ticketing")!;
const { state } = adjustTemplateForBudget(tpl.state, "balanced");
const arch = generateArchitecture(state, "ko");
const xml = generateDiagramXmlH(arch, state);

const asgCount = (xml.match(/Auto Scaling Group/g) || []).length;
console.log("ASG mentions in XML:", asgCount);

const cells = xml.split("<mxCell");
for (const cell of cells) {
  if (cell.includes("Auto Scaling Group")) {
    const parentMatch = cell.match(/parent="([^"]+)"/);
    const xMatch = cell.match(/x="([^"]+)"/);
    const yMatch = cell.match(/y="([^"]+)"/);
    const wMatch = cell.match(/width="([^"]+)"/);
    const hMatch = cell.match(/height="([^"]+)"/);
    const containerMatch = cell.match(/container=([01])/);
    console.log(`ASG cell: parent=${parentMatch?.[1]} x=${xMatch?.[1]} y=${yMatch?.[1]} w=${wMatch?.[1]} h=${hMatch?.[1]} container=${containerMatch?.[1]}`);
  }
}
