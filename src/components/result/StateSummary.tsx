"use client";

import type { Phase, WizardState } from "@/lib/types";
import { buildPhaseQuestions } from "@/lib/questions";

interface StateSummaryProps {
  state: WizardState;
  phases: Phase[];
  onEdit: (phaseId: string) => void;
}

export function StateSummary({ state, phases, onEdit }: StateSummaryProps) {
  const labels: Record<
    string,
    { q: string; v: string }[]
  > = {};

  phases.forEach((p) => {
    const qs = buildPhaseQuestions(p.id, state);
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

  return (
    <div className="sticky top-4 h-fit rounded-xl border border-gray-200 bg-gray-50 p-4">
      <div className="mb-3 text-[13px] font-bold text-gray-700">
        {"\uD83D\uDCCB"} 결정 요약
      </div>
      {phases.map((p) => {
        const entries = labels[p.id];
        if (!entries?.length) return null;
        return (
          <div key={p.id} className="mb-3">
            <div className="mb-1 flex items-center justify-between">
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                {p.icon} {p.label.toUpperCase()}
              </div>
              <div
                onClick={() => onEdit(p.id)}
                className="cursor-pointer rounded border border-indigo-200 px-1.5 py-0.5 text-[10px] text-indigo-600"
              >
                수정
              </div>
            </div>
            {entries.map((e) => (
              <div
                key={e.q}
                className="mb-0.5 flex gap-1.5 text-[11px]"
              >
                <span className="shrink-0 text-gray-400">
                  {"\u2022"}
                </span>
                <span className="text-gray-700">
                  <span className="text-gray-500">{e.q}: </span>
                  {e.v}
                </span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
