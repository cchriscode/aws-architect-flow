import { describe, it, expect } from "vitest";
import { generateChecklist } from "@/lib/checklist";
import { ALL_FIXTURES } from "./fixtures";

describe("generateChecklist snapshots", () => {
  for (const [name, state] of ALL_FIXTURES) {
    it(`${name} (ko)`, () => {
      expect(generateChecklist(state, "ko")).toMatchSnapshot();
    });
    it(`${name} (en)`, () => {
      expect(generateChecklist(state, "en")).toMatchSnapshot();
    });
  }
});
