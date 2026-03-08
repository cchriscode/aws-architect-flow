import { describe, it, expect } from "vitest";
import { getRecommendations } from "@/lib/recommendations";
import { ALL_FIXTURES } from "./fixtures";

describe("getRecommendations snapshots", () => {
  for (const [name, state] of ALL_FIXTURES) {
    it(`${name} (ko)`, () => {
      expect(getRecommendations(state, "ko")).toMatchSnapshot();
    });
    it(`${name} (en)`, () => {
      expect(getRecommendations(state, "en")).toMatchSnapshot();
    });
  }
});
