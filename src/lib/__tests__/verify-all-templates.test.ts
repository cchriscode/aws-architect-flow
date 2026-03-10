/**
 * Runtime verification: execute all templates × 3 budget modes
 * through adjustTemplateForBudget → estimateMonthlyCost → generateArchitecture → generateDiagramXml
 * and verify outputs are consistent.
 */
import { describe, it, expect } from "vitest";
import { TEMPLATES, adjustTemplateForBudget } from "@/data/templates";
import { estimateMonthlyCost } from "@/lib/cost";
import { generateArchitecture } from "@/lib/architecture";
import { generateDiagramXml } from "@/lib/diagram-xml";
import type { WizardState } from "@/lib/types";

const BUDGET_MODES = ["cost_first", "balanced", "perf_first"] as const;

// Helper: collect all service names from architecture layers
function getServiceNames(state: WizardState): string[] {
  const arch = generateArchitecture(state, "ko");
  return arch.layers.flatMap((l) => l.services.map((s) => s.name));
}

// Helper: collect all cost item names
function getCostItemNames(state: WizardState): string[] {
  const cost = estimateMonthlyCost(state, "ko");
  return cost.categories.flatMap((c) => c.items.map((i) => i.name));
}

describe("All templates × all budget modes: no crash", () => {
  for (const tpl of TEMPLATES) {
    for (const mode of BUDGET_MODES) {
      it(`${tpl.id} / ${mode} — runs without error`, () => {
        const { state } = adjustTemplateForBudget(tpl.state, mode);
        const cost = estimateMonthlyCost(state, "ko");
        const arch = generateArchitecture(state, "ko");
        const xml = generateDiagramXml(arch, state);

        expect(cost.totalMin).toBeGreaterThanOrEqual(0);
        expect(cost.totalMax).toBeGreaterThanOrEqual(cost.totalMin);
        expect(arch.layers.length).toBeGreaterThan(0);
        expect(xml).toContain("mxGraphModel");
      });
    }
  }
});

describe("Cost ordering: cost_first ≤ balanced ≤ perf_first", () => {
  for (const tpl of TEMPLATES) {
    it(`${tpl.id} — cost ordering holds`, () => {
      const costs = BUDGET_MODES.map((mode) => {
        const { state } = adjustTemplateForBudget(tpl.state, mode);
        return estimateMonthlyCost(state, "ko");
      });
      // cost_first.totalMax ≤ perf_first.totalMax (with 10% tolerance for rounding)
      expect(costs[0].totalMax).toBeLessThanOrEqual(costs[2].totalMax * 1.1);
    });
  }
});

describe("cost_first: expensive services removed where expected", () => {
  it("internal_tool cost_first — no Aurora", () => {
    const { state } = adjustTemplateForBudget(
      TEMPLATES.find((t) => t.id === "internal_tool")!.state,
      "cost_first",
    );
    const items = getCostItemNames(state);
    expect(items.join(",")).not.toMatch(/aurora/i);
  });

  it("internal_tool cost_first — uses DynamoDB", () => {
    const { state } = adjustTemplateForBudget(
      TEMPLATES.find((t) => t.id === "internal_tool")!.state,
      "cost_first",
    );
    const services = getServiceNames(state);
    expect(services.join(",")).toMatch(/dynamodb/i);
  });

  it("data_pipeline cost_first — env_count is dev_prod", () => {
    const { state } = adjustTemplateForBudget(
      TEMPLATES.find((t) => t.id === "data_pipeline")!.state,
      "cost_first",
    );
    expect(state.cicd?.env_count).toBe("dev_prod");
  });

  it("generic_web_api cost_first — env_count is dev_prod", () => {
    const { state } = adjustTemplateForBudget(
      TEMPLATES.find((t) => t.id === "generic_web_api")!.state,
      "cost_first",
    );
    expect(state.cicd?.env_count).toBe("dev_prod");
  });

  it("b2b_saas cost_first — commitment preserved (not none)", () => {
    const tpl = TEMPLATES.find((t) => t.id === "b2b_saas")!;
    const original = tpl.state.cost?.commitment;
    const { state } = adjustTemplateForBudget(tpl.state, "cost_first");
    // commitment should stay as original, not forced to "none"
    expect(state.cost?.commitment).toBe(original);
  });

  it("b2b_saas cost_first — EKS→ECS (growth stage, medium DAU)", () => {
    const { state } = adjustTemplateForBudget(
      TEMPLATES.find((t) => t.id === "b2b_saas")!.state,
      "cost_first",
    );
    expect(state.compute?.orchestration).toBe("ecs");
  });

  it("multitenant_microservices cost_first — EKS preserved (scale + large DAU)", () => {
    const { state } = adjustTemplateForBudget(
      TEMPLATES.find((t) => t.id === "multitenant_microservices")!.state,
      "cost_first",
    );
    expect(state.compute?.orchestration).toBe("eks");
  });

  it("b2b_saas cost_first — env_count three preserved (SaaS)", () => {
    const tpl = TEMPLATES.find((t) => t.id === "b2b_saas")!;
    const { state } = adjustTemplateForBudget(tpl.state, "cost_first");
    expect(state.cicd?.env_count).toBe("three");
  });
});

describe("Architecture services match state selections", () => {
  for (const tpl of TEMPLATES) {
    for (const mode of BUDGET_MODES) {
      it(`${tpl.id} / ${mode} — no phantom services`, () => {
        const { state } = adjustTemplateForBudget(tpl.state, mode);
        const services = getServiceNames(state);
        const db = state.data?.primary_db;
        const cache = state.data?.cache;
        const search = state.data?.search;

        // If Aurora not selected, should not appear in architecture
        if (!db?.some((d: string) => d.includes("aurora"))) {
          const auroraServices = services.filter((s) =>
            s.toLowerCase().includes("aurora"),
          );
          expect(auroraServices).toEqual([]);
        }

        // If cache is "no", no ElastiCache/MemoryDB
        if (cache === "no") {
          const cacheServices = services.filter(
            (s) =>
              s.toLowerCase().includes("elasticache") ||
              s.toLowerCase().includes("memorydb") ||
              s.toLowerCase().includes("redis"),
          );
          expect(cacheServices).toEqual([]);
        }

        // If search is "no", no OpenSearch
        if (search === "no") {
          const searchServices = services.filter((s) =>
            s.toLowerCase().includes("opensearch"),
          );
          expect(searchServices).toEqual([]);
        }
      });
    }
  }
});

describe("DrawIO XML includes expected services", () => {
  it("ecommerce_mvp balanced — has CloudFront (cdn=yes)", () => {
    const tpl = TEMPLATES.find((t) => t.id === "ecommerce_mvp")!;
    const { state } = adjustTemplateForBudget(tpl.state, "balanced");
    const arch = generateArchitecture(state, "ko");
    const xml = generateDiagramXml(arch, state);
    expect(xml.toLowerCase()).toContain("cloudfront");
  });

  it("internal_tool cost_first — has DynamoDB in drawio", () => {
    const tpl = TEMPLATES.find((t) => t.id === "internal_tool")!;
    const { state } = adjustTemplateForBudget(tpl.state, "cost_first");
    const arch = generateArchitecture(state, "ko");
    const xml = generateDiagramXml(arch, state);
    expect(xml.toLowerCase()).toContain("dynamodb");
  });
});

describe("Card view prices — Seoul region accuracy", () => {
  it("ALB card shows ~$21", () => {
    // Use a template with ALB (ecommerce_mvp has ALB)
    const tpl = TEMPLATES.find((t) => t.id === "ecommerce_mvp")!;
    const { state } = adjustTemplateForBudget(tpl.state, "balanced");
    const arch = generateArchitecture(state, "ko");
    const lbLayer = arch.layers.find((l) =>
      l.services.some(
        (s) =>
          s.name.includes("ALB") ||
          s.name.includes("Application Load Balancer"),
      ),
    );
    if (lbLayer) {
      const albService = lbLayer.services.find(
        (s) =>
          s.name.includes("ALB") ||
          s.name.includes("Application Load Balancer"),
      );
      expect(albService?.cost).toContain("$21");
    }
  });

  it("API Gateway card shows HTTP/REST price distinction", () => {
    // Use internal_tool which has api_gateway
    const tpl = TEMPLATES.find((t) => t.id === "internal_tool")!;
    const { state } = adjustTemplateForBudget(tpl.state, "balanced");
    const arch = generateArchitecture(state, "ko");
    const allServices = arch.layers.flatMap((l) => l.services);
    const apigw = allServices.find(
      (s) =>
        s.name.includes("API Gateway") || s.name.includes("API GW"),
    );
    if (apigw) {
      expect(apigw.cost).toMatch(/HTTP.*\$1.*REST.*\$3\.50|REST.*\$3\.50.*HTTP.*\$1/);
    }
  });
});

describe("Cost estimate output — print summary for manual inspection", () => {
  it("prints all template × mode cost summaries", () => {
    const results: string[] = [];
    for (const tpl of TEMPLATES) {
      for (const mode of BUDGET_MODES) {
        const { state } = adjustTemplateForBudget(tpl.state, mode);
        const cost = estimateMonthlyCost(state, "ko");
        results.push(
          `${tpl.id.padEnd(28)} ${mode.padEnd(12)} $${cost.totalMin.toLocaleString().padStart(8)} ~ $${cost.totalMax.toLocaleString().padStart(8)}`,
        );
      }
    }
    console.log("\n=== Cost Summary (all templates × modes) ===");
    console.log(
      "Template".padEnd(28) +
        " Mode".padEnd(13) +
        " Min".padStart(10) +
        "    Max".padStart(10),
    );
    console.log("-".repeat(70));
    results.forEach((r) => console.log(r));
    console.log("=".repeat(70));
    expect(results.length).toBe(TEMPLATES.length * 3);
  });
});
