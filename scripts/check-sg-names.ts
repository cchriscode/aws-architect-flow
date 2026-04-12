import { generateSecurityGroups } from "../src/lib/security-groups";
import type { WizardState } from "../src/lib/types";

const state: WizardState = {
  workload: { type: ["ecommerce","realtime"], data_sensitivity: "critical", user_type: ["b2c"] },
  compute: { arch_pattern: "container", orchestration: "ecs", compute_node: "fargate" },
  data: { primary_db: ["aurora_pg","dynamodb"], cache: "redis" },
  integration: { auth: ["cognito"], api_type: "alb" },
  edge: { cdn: "yes", waf: "bot" },
  network: { subnet_tier: "3tier" },
  team: { language: "node_express" },
};
const sg = generateSecurityGroups(state, "ko");
sg.groups.forEach(g => console.log(`${g.id}: "${g.name}"`));
