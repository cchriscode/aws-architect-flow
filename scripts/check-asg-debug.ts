import { TEMPLATES, adjustTemplateForBudget } from "../src/data/templates";
import { generateArchitecture } from "../src/lib/architecture";
import { classifyServices, isComputeService } from "../src/lib/diagram-xml-shared";
import { generateDiagramXmlH } from "../src/lib/diagram-xml-horizontal";

const tpl = TEMPLATES.find(t => t.id === "ticketing")!;
const { state } = adjustTemplateForBudget(tpl.state, "balanced");
const arch = generateArchitecture(state, "ko");
const classified = classifyServices(arch);

const hasEks = classified.app.some(item => item.svc.name.toLowerCase().includes("eks"));
const hasEc2Asg = classified.app.some(item => item.svc.name.toLowerCase().includes("ec2 auto"));
const needsAsg = hasEc2Asg && !hasEks;

console.log("hasEks:", hasEks);
console.log("hasEc2Asg:", hasEc2Asg);
console.log("needsAsg:", needsAsg);
console.log("");
console.log("App services:");
classified.app.forEach(item => console.log(" ", item.svc.name));

// Check the generated XML for ASG
const xml = generateDiagramXmlH(arch, state);
const asgMatches = xml.match(/Auto Scaling Group/g);
console.log("\nASG occurrences in XML:", asgMatches?.length ?? 0);

// Check if ASG is inside AZ or spanning
const lines = xml.split("\n");
for (const line of lines) {
  if (line.includes("Auto Scaling") && line.includes("groupCell")) {
    console.log("ASG cell:", line.substring(0, 200));
  }
}

// Simpler: look for the ASG value in cells
const cellPattern = /value="Auto Scaling Group"/g;
const cellMatches = xml.match(cellPattern);
console.log("ASG cells:", cellMatches?.length ?? 0);
