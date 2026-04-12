import { TEMPLATES, adjustTemplateForBudget } from "../src/data/templates";

const check = (id: string) => {
  const tpl = TEMPLATES.find(t => t.id === id)!;
  const { state } = adjustTemplateForBudget(tpl.state, "balanced");
  console.log(`\n${id}:`);
  console.log("  arch_pattern:", state.compute?.arch_pattern);
  console.log("  orchestration:", state.compute?.orchestration);
  console.log("  compute_node:", state.compute?.compute_node);
  console.log("  api_type:", state.integration?.api_type);
};

check("ticketing");
check("iot_platform");
check("ai_ml_serving");
