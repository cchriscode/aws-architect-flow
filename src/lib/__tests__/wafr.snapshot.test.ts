import { describe, it, expect } from "vitest";
import { wellArchitectedScore } from "@/lib/wafr";
import { ALL_FIXTURES } from "./fixtures";

describe("wellArchitectedScore snapshots", () => {
  for (const [name, state] of ALL_FIXTURES) {
    it(`${name} (ko)`, () => {
      expect(wellArchitectedScore(state, "ko")).toMatchSnapshot();
    });
    it(`${name} (en)`, () => {
      expect(wellArchitectedScore(state, "en")).toMatchSnapshot();
    });
  }
});
