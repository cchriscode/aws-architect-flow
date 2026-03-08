import { describe, it, expect } from "vitest";
import { generateCodeSnippets } from "@/lib/code-snippets";
import { ALL_FIXTURES } from "./fixtures";

describe("generateCodeSnippets snapshots", () => {
  for (const [name, state] of ALL_FIXTURES) {
    it(name, () => {
      expect(generateCodeSnippets(state)).toMatchSnapshot();
    });
  }
});
