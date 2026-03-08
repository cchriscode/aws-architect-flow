import { describe, it, expect } from "vitest";
import { toArray, toArrayFiltered, azToNum, deriveFlags } from "../state-accessors";
import type { WizardState } from "@/lib/types";

describe("toArray", () => {
  it("returns array as-is", () => expect(toArray(["a", "b"])).toEqual(["a", "b"]));
  it("wraps string in array", () => expect(toArray("x")).toEqual(["x"]));
  it("returns [] for undefined", () => expect(toArray(undefined)).toEqual([]));
  it("returns [] for null", () => expect(toArray(null)).toEqual([]));
  it("returns [] for empty string", () => expect(toArray("")).toEqual([]));
  it("returns empty array as-is", () => expect(toArray([])).toEqual([]));
});

describe("toArrayFiltered", () => {
  it("filters out 'none'", () => expect(toArrayFiltered(["pci", "none"])).toEqual(["pci"]));
  it("filters 'none' from string", () => expect(toArrayFiltered("none")).toEqual([]));
  it("passes normal values", () => expect(toArrayFiltered(["hipaa"])).toEqual(["hipaa"]));
  it("returns [] for undefined", () => expect(toArrayFiltered(undefined)).toEqual([]));
});

describe("azToNum", () => {
  it("3az -> 3", () => expect(azToNum("3az")).toBe(3));
  it("1az -> 1", () => expect(azToNum("1az")).toBe(1));
  it("2az -> 2", () => expect(azToNum("2az")).toBe(2));
  it("undefined -> 2", () => expect(azToNum(undefined)).toBe(2));
  it("random string -> 2", () => expect(azToNum("foo")).toBe(2));
});

describe("deriveFlags", () => {
  const base: WizardState = {
    workload: { type: ["ecommerce"], business_model: "transaction", data_sensitivity: "critical", user_type: ["b2c"] },
    compute: { arch_pattern: "container", orchestration: "eks" },
    scale: { dau: "xlarge" },
    compliance: { cert: ["pci", "hipaa"] },
    slo: { availability: "99.99" },
    data: { primary_db: ["aurora_pg", "dynamodb"], cache: "redis" },
    cost: { priority: "balanced" },
  };

  it("computes EKS flags correctly", () => {
    const f = deriveFlags(base);
    expect(f.isEks).toBe(true);
    expect(f.isEcs).toBe(false);
    expect(f.isServerless).toBe(false);
  });

  it("computes scale flags correctly", () => {
    const f = deriveFlags(base);
    expect(f.isXL).toBe(true);
    expect(f.isLarge).toBe(true);
    expect(f.isMedium).toBe(false);
    expect(f.isSmall).toBe(false);
  });

  it("computes compliance flags", () => {
    const f = deriveFlags(base);
    expect(f.hasCritCert).toBe(true);
    expect(f.hasPersonalData).toBe(true);
  });

  it("computes transaction flag", () => {
    const f = deriveFlags(base);
    expect(f.isTx).toBe(true);
  });

  it("computes data flags", () => {
    const f = deriveFlags(base);
    expect(f.hasAurora).toBe(true);
    expect(f.hasRds).toBe(false);
    expect(f.hasDynamo).toBe(true);
    expect(f.hasRedis).toBe(true);
  });

  it("serverless detection", () => {
    const s: WizardState = { compute: { arch_pattern: "serverless" }, cost: {} };
    const f = deriveFlags(s);
    expect(f.isServerless).toBe(true);
    expect(f.isEks).toBe(false);
    expect(f.isEcs).toBe(false);
  });

  it("ECS detection", () => {
    const s: WizardState = { compute: { arch_pattern: "container", orchestration: "ecs" }, cost: {} };
    const f = deriveFlags(s);
    expect(f.isEcs).toBe(true);
    expect(f.isEks).toBe(false);
  });

  it("empty state handles gracefully", () => {
    const f = deriveFlags({});
    expect(f.isEks).toBe(false);
    expect(f.isServerless).toBe(false);
    expect(f.hasCritCert).toBe(false);
    expect(f.isTx).toBe(false);
  });

  it("cost_first flag", () => {
    const s: WizardState = { cost: { priority: "cost_first" } };
    expect(deriveFlags(s).isCostFirst).toBe(true);
  });
});
