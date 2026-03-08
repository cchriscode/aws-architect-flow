import { describe, it, expect } from "vitest";
import { generateSecurityGroups } from "@/lib/security-groups";
import { ALL_FIXTURES } from "./fixtures";

describe("generateSecurityGroups snapshots", () => {
  for (const [name, state] of ALL_FIXTURES) {
    it(`${name} (ko)`, () => {
      expect(generateSecurityGroups(state, "ko")).toMatchSnapshot();
    });
    it(`${name} (en)`, () => {
      expect(generateSecurityGroups(state, "en")).toMatchSnapshot();
    });
  }
});
