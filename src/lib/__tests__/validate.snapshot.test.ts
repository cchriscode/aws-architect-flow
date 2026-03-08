import { describe, it, expect } from "vitest";
import { validateState } from "@/lib/validate";
import { ALL_FIXTURES } from "./fixtures";

describe("validateState snapshots", () => {
  for (const [name, state] of ALL_FIXTURES) {
    it(`${name} (ko)`, () => {
      expect(validateState(state, "ko")).toMatchSnapshot();
    });
    it(`${name} (en)`, () => {
      expect(validateState(state, "en")).toMatchSnapshot();
    });
  }
});
