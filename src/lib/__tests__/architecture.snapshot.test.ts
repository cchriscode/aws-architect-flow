import { describe, it, expect } from "vitest";
import { generateArchitecture } from "@/lib/architecture";
import { ALL_FIXTURES } from "./fixtures";

describe("generateArchitecture snapshots", () => {
  for (const [name, state] of ALL_FIXTURES) {
    it(`${name} (ko)`, () => {
      expect(generateArchitecture(state, "ko")).toMatchSnapshot();
    });
    it(`${name} (en)`, () => {
      expect(generateArchitecture(state, "en")).toMatchSnapshot();
    });
  }
});
