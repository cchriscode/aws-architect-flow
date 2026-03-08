/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { WizardState } from "@/lib/types";
import { generateChecklist } from "@/lib/checklist";
import { useDict, useLang } from "@/lib/i18n/context";

interface ChecklistViewProps {
  state: WizardState;
}

export function ChecklistView({ state }: ChecklistViewProps) {
  const t = useDict();
  const { lang } = useLang();
  const STORAGE_KEY = "aws_arch_checklist_v1";
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  });
  const [expandedPhase, setExpandedPhase] = useState("Phase 1");
  const [filterMode, setFilterMode] = useState<"all" | "critical" | "todo">(
    "all"
  );

  const { phases, totalItems, criticalItems } = generateChecklist(state, lang);

  const toggle = (id: string) => {
    const next = { ...checked, [id]: !checked[id] };
    setChecked(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  const resetPhase = (phaseLabel: string) => {
    const phaseItems =
      phases.find((p) => p.phase === phaseLabel)?.items || [];
    const next = { ...checked };
    phaseItems.forEach((i: any) => {
      delete next[i.id];
    });
    setChecked(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  const doneCount = Object.values(checked).filter(Boolean).length;
  const pct =
    totalItems > 0 ? Math.round((doneCount / totalItems) * 100) : 0;

  const filteredItem = (item: { id: string; critical: boolean }) => {
    if (filterMode === "critical") return item.critical;
    if (filterMode === "todo") return !checked[item.id];
    return true;
  };

  const phaseColor = (phase: { items: { id: string }[] }) => {
    const phaseDone = phase.items.filter((i) => checked[i.id]).length;
    if (phaseDone === phase.items.length && phase.items.length > 0)
      return "#059669";
    if (phaseDone > 0) return "#d97706";
    return "#6b7280";
  };

  return (
    <div className="grid grid-cols-[220px_1fr] gap-5">
      {/* Left sidebar */}
      <div>
        {/* Overall progress */}
        <div className="mb-3 rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-1.5 text-xs text-gray-500">{t.checklistView.overallProgress}</div>
          <div className="mb-1 text-[28px] font-extrabold text-gray-900">
            {pct}
            <span className="text-sm font-medium text-gray-400">%</span>
          </div>
          <div className="mb-1.5 h-2 rounded-md bg-gray-100">
            <div
              className="h-full rounded-md transition-[width] duration-400"
              style={{
                width: `${pct}%`,
                background:
                  pct === 100
                    ? "#059669"
                    : pct >= 60
                      ? "#d97706"
                      : "#6366f1",
              }}
            />
          </div>
          <div className="text-[11px] text-gray-400">
            {doneCount} / {totalItems} {t.checklistView.completed} {"\u00B7"} {t.checklistView.criticalItems(criticalItems)}
          </div>
        </div>

        {/* Filter */}
        <div className="mb-3 rounded-xl border border-gray-200 bg-white p-2.5">
          {[
            { id: "all" as const, label: t.checklistView.viewAll },
            { id: "critical" as const, label: t.checklistView.criticalOnly },
            { id: "todo" as const, label: t.checklistView.todoOnly },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterMode(f.id)}
              className={cn(
                "mb-0.5 w-full rounded-md px-2.5 py-[7px] text-left text-xs",
                filterMode === f.id
                  ? "bg-indigo-50 font-bold text-indigo-600"
                  : "bg-transparent font-normal text-gray-700"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Phase list */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {phases.map((phase) => {
            const phaseDone = phase.items.filter(
              (i: any) => checked[i.id]
            ).length;
            const total = phase.items.length;
            const isActive = expandedPhase === phase.phase;
            const col = phaseColor(phase);
            return (
              <div
                key={phase.phase}
                onClick={() => setExpandedPhase(phase.phase)}
                className={cn(
                  "cursor-pointer border-b border-gray-100 px-3.5 py-2.5",
                  isActive ? "bg-indigo-50" : "bg-white"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{phase.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[11px] font-bold"
                      style={{
                        color: isActive ? "#4f46e5" : col,
                      }}
                    >
                      {phase.phase}
                    </div>
                    <div className="truncate text-[10px] text-gray-400">
                      {phase.label}
                    </div>
                  </div>
                  <span
                    className="shrink-0 text-[11px] font-semibold"
                    style={{ color: col }}
                  >
                    {phaseDone}/{total}
                  </span>
                </div>
                <div className="mt-1 h-1 rounded-sm bg-gray-100">
                  <div
                    className="h-full rounded-sm transition-[width] duration-300"
                    style={{
                      width:
                        total > 0
                          ? `${Math.round((phaseDone / total) * 100)}%`
                          : "0%",
                      background: col,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right checklist */}
      <div>
        {phases
          .filter((p) => p.phase === expandedPhase)
          .map((phase) => {
            const filtered = phase.items.filter(filteredItem);
            const phaseDone = phase.items.filter(
              (i: any) => checked[i.id]
            ).length;
            return (
              <div key={phase.phase}>
                <div className="mb-3.5 rounded-xl border border-gray-200 bg-white px-5 py-4">
                  <div className="mb-1 flex items-center gap-3">
                    <span className="text-2xl">{phase.icon}</span>
                    <div className="flex-1">
                      <div className="text-base font-bold text-gray-900">
                        {phase.phase}: {phase.label}
                      </div>
                      <div className="mt-0.5 text-xs text-gray-500">
                        {phaseDone}/{phase.items.length} {t.checklistView.completed}
                        {phase.items.filter((i: any) => i.critical).length >
                          0 && (
                          <span className="ml-2 font-semibold text-red-600">
                            {"\u2757"}
                            {
                              phase.items.filter((i: any) => i.critical)
                                .length
                            }{" "}
                            {t.checklistView.critical}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => resetPhase(phase.phase)}
                      className="rounded-md border border-gray-200 bg-transparent px-2.5 py-1 text-[11px] text-gray-400"
                    >
                      {t.checklistView.reset}
                    </button>
                  </div>
                  <div className="h-2 rounded-md bg-gray-100">
                    <div
                      className="h-full rounded-md transition-[width] duration-400"
                      style={{
                        width:
                          phase.items.length > 0
                            ? `${Math.round((phaseDone / phase.items.length) * 100)}%`
                            : "0%",
                        background:
                          phaseDone === phase.items.length &&
                          phase.items.length > 0
                            ? "#059669"
                            : "#6366f1",
                      }}
                    />
                  </div>
                </div>

                {filtered.length === 0 ? (
                  <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-[13px] text-gray-400">
                    {filterMode === "critical"
                      ? t.checklistView.noCritical
                      : t.checklistView.allDone}
                  </div>
                ) : (
                  filtered.map((item: any) => (
                    <div
                      key={item.id}
                      onClick={() => toggle(item.id)}
                      className={cn(
                        "mb-2 cursor-pointer rounded-[10px] border-[1.5px] px-4 py-3 transition-all",
                        checked[item.id]
                          ? "border-emerald-200 opacity-65"
                          : item.critical
                            ? "border-red-300"
                            : "border-gray-200"
                      )}
                      style={{ background: "#fff" }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="mt-px flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md border-2 transition-all"
                          style={{
                            borderColor: checked[item.id]
                              ? "#059669"
                              : item.critical
                                ? "#dc2626"
                                : "#d1d5db",
                            background: checked[item.id]
                              ? "#059669"
                              : "#fff",
                          }}
                        >
                          {checked[item.id] && (
                            <span className="text-[13px] font-bold text-white">
                              {"\u2713"}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {item.critical && !checked[item.id] && (
                              <span className="shrink-0 rounded border border-red-300 bg-red-50 px-1.5 py-px text-[10px] font-bold text-red-600">
                                {t.checklistView.critical}
                              </span>
                            )}
                            <span
                              className={cn(
                                "text-[13px]",
                                checked[item.id]
                                  ? "font-normal text-gray-400 line-through"
                                  : "font-semibold text-gray-900"
                              )}
                            >
                              {item.text}
                            </span>
                          </div>
                          {item.detail && (
                            <div className="text-xs leading-relaxed text-gray-500">
                              {item.detail}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {/* Phase complete → next */}
                {phaseDone === phase.items.length &&
                  phase.items.length > 0 &&
                  (() => {
                    const idx = phases.findIndex(
                      (p) => p.phase === phase.phase
                    );
                    const next = phases[idx + 1];
                    return next ? (
                      <div className="mt-4 text-center">
                        <button
                          onClick={() => setExpandedPhase(next.phase)}
                          className="rounded-lg bg-indigo-600 px-6 py-2.5 text-[13px] font-semibold text-white"
                        >
                          {next.icon} {t.checklistView.moveToPhase(next.phase)}
                        </button>
                      </div>
                    ) : (
                      <div className="mt-4 rounded-xl border-[1.5px] border-emerald-200 bg-emerald-50 p-5 text-center">
                        <div className="mb-2 text-[32px]">
                          {"\uD83C\uDF89"}
                        </div>
                        <div className="text-base font-bold text-emerald-600">
                          {t.checklistView.allPhasesComplete}
                        </div>
                        <div className="mt-1 text-[13px] text-gray-500">
                          {t.checklistView.allPhasesDoneDesc}
                        </div>
                      </div>
                    );
                  })()}
              </div>
            );
          })}
      </div>
    </div>
  );
}
