/**
 * Find cases where cost_first min > balanced min
 */
import { describe, it } from "vitest";
import { TEMPLATES, adjustTemplateForBudget } from "@/data/templates";
import { estimateMonthlyCost } from "@/lib/cost";

describe("cost_first min > balanced min anomalies", () => {
  it("find and explain all anomalies", () => {
    for (const tpl of TEMPLATES) {
      const cf = adjustTemplateForBudget(tpl.state, "cost_first");
      const bl = adjustTemplateForBudget(tpl.state, "balanced");
      const costCf = estimateMonthlyCost(cf.state, "ko");
      const costBl = estimateMonthlyCost(bl.state, "ko");

      if (costCf.totalMin > costBl.totalMin) {
        console.log(`\n⚠️  ${tpl.id}: cost_first($${costCf.totalMin}) > balanced($${costBl.totalMin})  차이: +$${costCf.totalMin - costBl.totalMin}`);
        console.log(`  cost_first 변경사항: ${cf.changes.join(", ")}`);

        // Compare DB costs
        const cfDb = costCf.categories.find(c => c.name.includes("데이터"))?.items ?? [];
        const blDb = costBl.categories.find(c => c.name.includes("데이터"))?.items ?? [];
        console.log(`\n  [cost_first DB]`);
        cfDb.forEach(i => console.log(`    ${i.name}: $${i.min}~$${i.max} — ${i.desc}`));
        console.log(`  [balanced DB]`);
        blDb.forEach(i => console.log(`    ${i.name}: $${i.min}~$${i.max} — ${i.desc}`));

        // Compare Network costs
        const cfNet = costCf.categories.find(c => c.name.includes("네트워크"))?.items ?? [];
        const blNet = costBl.categories.find(c => c.name.includes("네트워크"))?.items ?? [];
        console.log(`\n  [cost_first Network]`);
        cfNet.forEach(i => console.log(`    ${i.name}: $${i.min}~$${i.max}`));
        console.log(`  [balanced Network]`);
        blNet.forEach(i => console.log(`    ${i.name}: $${i.min}~$${i.max}`));

        // Compare Edge costs
        const cfEdge = costCf.categories.find(c => c.name.includes("엣지"))?.items ?? [];
        const blEdge = costBl.categories.find(c => c.name.includes("엣지"))?.items ?? [];
        if (cfEdge.length !== blEdge.length) {
          console.log(`\n  [cost_first Edge] ${cfEdge.length} items`);
          cfEdge.forEach(i => console.log(`    ${i.name}: $${i.min}~$${i.max}`));
          console.log(`  [balanced Edge] ${blEdge.length} items`);
          blEdge.forEach(i => console.log(`    ${i.name}: $${i.min}~$${i.max}`));
        }

        // Key state diffs
        console.log(`\n  State diff:`);
        console.log(`    DB: ${JSON.stringify(cf.state.data?.primary_db)} vs ${JSON.stringify(bl.state.data?.primary_db)}`);
        console.log(`    cache: ${cf.state.data?.cache} vs ${bl.state.data?.cache}`);
        console.log(`    search: ${cf.state.data?.search} vs ${bl.state.data?.search}`);
        console.log(`    NAT: ${cf.state.network?.nat_strategy} vs ${bl.state.network?.nat_strategy}`);
        console.log(`    AZ: ${cf.state.network?.az_count} vs ${bl.state.network?.az_count}`);
        console.log(`    commitment: ${cf.state.cost?.commitment} vs ${bl.state.cost?.commitment}`);
        console.log(`    env: ${cf.state.cicd?.env_count} vs ${bl.state.cicd?.env_count}`);
      }
    }
  });
});
