/**
 * Unified color system for AWS service categories.
 * Single source of truth — replaces catColors in CostView and pillarColors in WafrView.
 */

/** AWS service category colors (used in CostView, DiagramView, etc.) */
export const SERVICE_CATEGORY_COLORS: Record<string, string> = {
  // Korean labels
  "\uCEF4\uD4E8\uD305": "#6366f1",
  "\uB370\uC774\uD130\uBCA0\uC774\uC2A4": "#2563eb",
  "\uB124\uD2B8\uC6CC\uD06C": "#0891b2",
  "\uC5E3\uC9C0": "#7c3aed",
  "\uC2A4\uD1A0\uB9AC\uC9C0": "#d97706",
  "\uBA54\uC2DC\uC9D5": "#059669",
  "\uC6B4\uC601": "#374151",
  "\uBA40\uD2F0\uB9AC\uC804": "#dc2626",
  // English labels
  Compute: "#6366f1",
  Database: "#2563eb",
  Network: "#0891b2",
  Edge: "#7c3aed",
  Storage: "#d97706",
  Messaging: "#059669",
  Operations: "#374151",
  "Multi-Region": "#dc2626",
};

/** WAFR pillar colors */
export const PILLAR_COLORS: Record<string, string> = {
  ops: "#6366f1",
  sec: "#dc2626",
  rel: "#d97706",
  perf: "#0891b2",
  cost: "#059669",
  sus: "#7c3aed",
};

/** Score color thresholds */
export function scoreColor(s: number): string {
  if (s >= 80) return "#059669";
  if (s >= 60) return "#d97706";
  if (s >= 40) return "#ca8a04";
  return "#dc2626";
}
