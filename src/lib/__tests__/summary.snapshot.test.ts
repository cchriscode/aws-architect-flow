import { describe, it, expect } from "vitest";
import { generateSummary } from "@/lib/summary";
import { ALL_FIXTURES } from "./fixtures";

describe("generateSummary snapshots", () => {
  for (const [name, state] of ALL_FIXTURES) {
    it(`${name} (ko)`, () => {
      expect(generateSummary(state, undefined, "ko")).toMatchSnapshot();
    });
    it(`${name} (en)`, () => {
      expect(generateSummary(state, undefined, "en")).toMatchSnapshot();
    });
  }
});
