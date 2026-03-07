import type { WizardState } from "@/lib/types";
import { generateSummary } from "@/lib/summary";
import { estimateMonthlyCost } from "@/lib/cost";
import { wellArchitectedScore } from "@/lib/wafr";

export interface HistoryEntry {
  id: string;
  name: string;
  savedAt: string;
  state: WizardState;
  completedPhases: string[];
  summary: {
    headline: string;
    monthlyCost: number;
    wafrScore: number;
    archPattern: string;
    workloadTypes: string[];
  };
}

function toHistoryEntry(row: Record<string, unknown>): HistoryEntry {
  return {
    id: row.id as string,
    name: row.name as string,
    savedAt: row.savedAt as string,
    state: row.state as WizardState,
    completedPhases: row.completedPhases as string[],
    summary: {
      headline: row.headline as string,
      monthlyCost: row.monthlyCost as number,
      wafrScore: row.wafrScore as number,
      archPattern: row.archPattern as string,
      workloadTypes: row.workloadTypes as string[],
    },
  };
}

export async function getHistory(): Promise<HistoryEntry[]> {
  const res = await fetch("/api/history");
  if (!res.ok) return [];
  const rows: Record<string, unknown>[] = await res.json();
  return rows.map(toHistoryEntry);
}

export async function getHistoryCount(): Promise<number> {
  const entries = await getHistory();
  return entries.length;
}

export async function saveToHistory(
  state: WizardState,
  completedPhases: string[],
  name?: string
): Promise<HistoryEntry> {
  const cost = estimateMonthlyCost(state);
  const wafr = wellArchitectedScore(state);
  const summaryData = generateSummary(state, { cost, wafr });

  const summary = {
    headline: summaryData.headline,
    monthlyCost: cost.totalMid,
    wafrScore: wafr.overall,
    archPattern: state.compute?.arch_pattern || "container",
    workloadTypes: state.workload?.type || [],
  };

  const res = await fetch("/api/history", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: name || summary.headline,
      state,
      completedPhases,
      summary,
    }),
  });

  const row = await res.json();
  return toHistoryEntry(row);
}

export async function deleteFromHistory(id: string): Promise<void> {
  await fetch(`/api/history/${id}`, { method: "DELETE" });
}

export async function renameHistory(
  id: string,
  newName: string
): Promise<void> {
  await fetch(`/api/history/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: newName }),
  });
}

export async function clearHistory(): Promise<void> {
  await fetch("/api/history", { method: "DELETE" });
}
