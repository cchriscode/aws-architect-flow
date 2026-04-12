import { TEMPLATES, adjustTemplateForBudget } from "../src/data/templates";
import { generateArchitecture } from "../src/lib/architecture";

const iot = TEMPLATES.find(t => t.id === "iot_platform")!;
const { state } = adjustTemplateForBudget(iot.state, "balanced");
const arch = generateArchitecture(state, "ko");

console.log("=== IoT Template State ===");
console.log("api_type:", state.integration?.api_type);
console.log("api_gateway_impl:", state.appstack?.api_gateway_impl);
console.log("waf:", state.edge?.waf);
console.log("");

console.log("=== ALL Services ===");
for (const l of arch.layers) {
  for (const s of l.services) {
    const n = s.name as string;
    if (n.includes("ALB") || n.includes("WAF") || n.includes("API Gateway") || n.includes("Load") || n.includes("waf") || n.includes("Shield")) {
      console.log(`  [${l.id}] ${n} — ${s.detail}`);
    }
  }
}
