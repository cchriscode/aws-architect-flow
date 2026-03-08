import { describe, it, expect } from "vitest";
import {
  COMMITMENT_DISCOUNT,
  FARGATE_COMMITMENT_DISCOUNT,
  SPOT_DISCOUNT,
  DAU_SCALE,
  CRITICAL_CERTS,
} from "../constants";

describe("constants", () => {
  it("COMMITMENT_DISCOUNT has correct values", () => {
    expect(COMMITMENT_DISCOUNT["3yr"]).toBe(0.34);
    expect(COMMITMENT_DISCOUNT["1yr"]).toBe(0.65);
    expect(COMMITMENT_DISCOUNT.none).toBe(1.0);
  });

  it("FARGATE_COMMITMENT_DISCOUNT has correct values", () => {
    expect(FARGATE_COMMITMENT_DISCOUNT["3yr"]).toBe(0.48);
    expect(FARGATE_COMMITMENT_DISCOUNT["1yr"]).toBe(0.78);
    expect(FARGATE_COMMITMENT_DISCOUNT.none).toBe(1.0);
  });

  it("SPOT_DISCOUNT has correct values", () => {
    expect(SPOT_DISCOUNT.heavy).toBe(0.30);
    expect(SPOT_DISCOUNT.partial).toBe(0.70);
    expect(SPOT_DISCOUNT.no).toBe(1.0);
  });

  it("DAU_SCALE has correct values", () => {
    expect(DAU_SCALE.xlarge).toBe(8);
    expect(DAU_SCALE.large).toBe(4);
    expect(DAU_SCALE.medium).toBe(2);
    expect(DAU_SCALE.small).toBe(1);
    expect(DAU_SCALE.tiny).toBe(0.5);
  });

  it("CRITICAL_CERTS contains expected values", () => {
    expect(CRITICAL_CERTS).toContain("pci");
    expect(CRITICAL_CERTS).toContain("hipaa");
    expect(CRITICAL_CERTS).toContain("sox");
    expect(CRITICAL_CERTS).toHaveLength(3);
  });
});
