/* eslint-disable @typescript-eslint/no-explicit-any */
import type { WizardState } from "@/lib/types";
import { CRITICAL_CERTS } from "./constants";

/**
 * Normalize a value to a string array.
 * string|string[]|undefined → string[]
 */
export function toArray(val: any): string[] {
  if (Array.isArray(val)) return val;
  if (val != null && val !== "") return [val];
  return [];
}

/**
 * Normalize to a string array and filter out "none".
 */
export function toArrayFiltered(val: any): string[] {
  return toArray(val).filter((v) => v !== "none");
}

/**
 * Convert AZ count string to number.
 * "3az"→3, "1az"→1, default 2
 */
export function azToNum(az: any): number {
  return az === "3az" ? 3 : az === "1az" ? 1 : 2;
}

/** All derived boolean flags from WizardState */
export interface DerivedFlags {
  // Computing
  isEks: boolean;
  isEcs: boolean;
  isServerless: boolean;
  // Scale
  isXL: boolean;
  isLarge: boolean;
  isMedium: boolean;
  isSmall: boolean;
  // Compliance
  hasCritCert: boolean;
  isGdpr: boolean;
  hasPersonalData: boolean;
  // Workload characteristics
  isTx: boolean;
  isHighAvail: boolean;
  isGlobal: boolean;
  isInternalOnly: boolean;
  isCostFirst: boolean;
  // Data
  hasAurora: boolean;
  hasRds: boolean;
  hasRdbms: boolean;
  hasDynamo: boolean;
  hasRedis: boolean;
  // Workload types
  isRealtime: boolean;
  isSaaS: boolean;
  isIoT: boolean;
  isEcom: boolean;
  isTick: boolean;
}

/**
 * Derive common boolean flags from state.
 * Centralizes the 20+ repeated flag computations across all lib files.
 *
 * NOTE on `isTx`: Most files define isTx as ecommerce|ticketing|transaction.
 * wafr.ts additionally includes "realtime" in isTx. Use `f.isTx || f.isRealtime`
 * in wafr.ts to preserve that behavior.
 */
export function deriveFlags(state: WizardState): DerivedFlags {
  const orchest = state.compute?.orchestration;
  const archP = state.compute?.arch_pattern;
  const dau = state.scale?.dau;
  const cert = toArray(state.compliance?.cert);
  const types = toArray(state.workload?.type);
  const dbArr = toArrayFiltered(state.data?.primary_db);
  const cache = state.data?.cache;
  const userTypes = toArray(state.workload?.user_type);
  const avail = state.slo?.availability;

  const isEks = orchest === "eks";
  const isEcs = !isEks && archP !== "serverless" && archP === "container";
  const isServerless = archP === "serverless";

  return {
    isEks,
    isEcs,
    isServerless,

    isXL: dau === "xlarge",
    isLarge: dau === "large" || dau === "xlarge",
    isMedium: dau === "medium",
    isSmall: dau === "tiny" || dau === "small",

    hasCritCert: cert.some((c) => (CRITICAL_CERTS as readonly string[]).includes(c)),
    isGdpr: cert.includes("gdpr"),
    hasPersonalData: ["sensitive", "critical"].includes(state.workload?.data_sensitivity),

    isTx:
      state.workload?.business_model === "transaction" ||
      types.includes("ecommerce") ||
      types.includes("ticketing"),
    isHighAvail: avail === "99.95" || avail === "99.99",
    isGlobal: userTypes.includes("global"),
    isInternalOnly:
      types.length > 0 &&
      types.every((tp) => ["internal", "data", "iot"].includes(tp)) &&
      !userTypes.includes("b2c") &&
      !userTypes.includes("global"),
    isCostFirst: state.cost?.priority === "cost_first",

    hasAurora: dbArr.some((d) => d.startsWith("aurora")),
    hasRds: dbArr.some((d) => d.startsWith("rds")),
    hasRdbms: dbArr.some((d) => d.startsWith("aurora") || d.startsWith("rds")),
    hasDynamo: dbArr.includes("dynamodb"),
    hasRedis: cache === "redis" || cache === "both",

    isRealtime: types.includes("realtime"),
    isSaaS: types.includes("saas"),
    isIoT: types.includes("iot"),
    isEcom: types.includes("ecommerce"),
    isTick: types.includes("ticketing"),
  };
}
