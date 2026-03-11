"use client";

import { useState } from "react";
import type { WizardState } from "@/lib/types";
import { buildPhaseQuestions } from "@/lib/questions";
import { useDict, useLang } from "@/lib/i18n/context";
import { ClipboardList, ChevronDown, ChevronRight } from "lucide-react";

interface Phase {
  id: string;
  label: string;
  icon: string;
}

interface StateSummaryProps {
  state: WizardState;
  phases: Phase[];
  onEdit: (phaseId: string) => void;
  issues?: Array<{ severity: string; phases?: string[] }>;
}

export function StateSummary({ state, phases, onEdit, issues }: StateSummaryProps) {
  const t = useDict();
  const { lang } = useLang();

  // All phases expanded by default
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(phases.map((p) => p.id))
  );

  // Build set of phase ids that have validation issues
  const phasesWithIssues = new Set<string>();
  if (issues) {
    for (const issue of issues) {
      if (issue.phases) {
        for (const ph of issue.phases) {
          phasesWithIssues.add(ph);
        }
      }
    }
  }

  const labels: Record<
    string,
    { q: string; v: string }[]
  > = {};

  phases.forEach((p) => {
    const qs = buildPhaseQuestions(p.id, state, undefined, lang);
    qs.forEach((q) => {
      const v = state[p.id]?.[q.id];
      if (!v) return;
      const val = Array.isArray(v) ? v : [v];
      const found = val
        .map((vv: string) => q.opts?.find((o) => o.v === vv)?.l || vv)
        .join(", ");
      if (!labels[p.id]) labels[p.id] = [];
      labels[p.id].push({ q: q.q.replace("?", ""), v: found });
    });
  });

  function togglePhase(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const boldPhases = new Set(["compute", "data"]);

  return (
    <div className="sticky top-4 h-fit rounded-xl border border-gray-200 bg-gray-50 p-4">
      <div className="mb-3 flex items-center gap-1.5 text-[13px] font-bold text-gray-700">
        <ClipboardList className="h-4 w-4 text-gray-500" />
        {t.stateSummary.title}
      </div>
      {phases.map((p) => {
        const entries = labels[p.id];
        if (!entries?.length) return null;
        const isExpanded = expanded.has(p.id);
        const hasIssue = phasesWithIssues.has(p.id);
        const isBold = boldPhases.has(p.id);
        return (
          <div key={p.id} className="mb-3">
            <div className="mb-1 flex items-center justify-between">
              <button
                onClick={() => togglePhase(p.id)}
                className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-gray-500"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
                {p.icon} {p.label.toUpperCase()}
                {hasIssue && (
                  <span className="ml-1 inline-block h-2 w-2 rounded-full bg-red-500" />
                )}
              </button>
              <div
                onClick={() => onEdit(p.id)}
                className="cursor-pointer rounded border border-indigo-200 px-1.5 py-0.5 text-[10px] text-indigo-600"
              >
                {t.stateSummary.editBtn}
              </div>
            </div>
            {isExpanded &&
              entries.map((e) => (
                <div
                  key={e.q}
                  className="mb-0.5 flex gap-1.5 text-[11px]"
                >
                  <span className="shrink-0 text-gray-400">
                    {"•"}
                  </span>
                  <span className="text-gray-700">
                    <span className="text-gray-500">{e.q}: </span>
                    <span className={isBold ? "font-bold" : ""}>{e.v}</span>
                  </span>
                </div>
              ))}
          </div>
        );
      })}
    </div>
  );
}
