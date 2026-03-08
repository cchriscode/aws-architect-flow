import { describe, it, expect } from "vitest";
import { estimateMonthlyCost } from "@/lib/cost";
import { ALL_FIXTURES } from "./fixtures";

describe("estimateMonthlyCost snapshots", () => {
  for (const [name, state] of ALL_FIXTURES) {
    it(`${name} (ko)`, () => {
      expect(estimateMonthlyCost(state, "ko")).toMatchSnapshot();
    });
    it(`${name} (en)`, () => {
      expect(estimateMonthlyCost(state, "en")).toMatchSnapshot();
    });
  }
});
