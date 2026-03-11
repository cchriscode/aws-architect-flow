"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { PHASES } from "@/data/phases";

import { PhaseHeader } from "@/components/wizard/PhaseHeader";
import { QuestionCard } from "@/components/wizard/QuestionCard";
import { InfoPanel } from "@/components/wizard/InfoPanel";
import { TemplateSelector } from "@/components/wizard/TemplateSelector";
import { StateSummary } from "@/components/result/StateSummary";
import { SlidePanel, SlidePanelTrigger } from "@/components/ui/slide-panel";

import type { Dict } from "@/lib/i18n/types";
import type { InfoEntry, Question, ValidationIssue, WizardState, Recommendation } from "@/lib/types";
import type { GuardrailWarning } from "@/lib/guardrails";
import type { PhaseDefinition } from "@/data/phases";
import type { Architecture } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */

interface WizardViewProps {
  phase: PhaseDefinition;
  phaseIdx: number;
  phaseState: Record<string, unknown>;
  questions: Question[];
  isPhaseComplete: boolean;
  allPhaseState: WizardState;
  completedPhases: Set<string>;
  arch: Architecture | null;
  phasesWithLabels: PhaseDefinition[];
  phaseIssues: ValidationIssue[];
  allRecs: Record<string, Recommendation>;
  hasAnyRec: boolean;
  allGuardrails: Record<string, Record<string, GuardrailWarning>>;
  infoDb: Record<string, InfoEntry>;
  handleAnswer: (qId: string, val: string | string[]) => void;
  next: () => void;
  prev: () => void;
  jumpTo: (phaseId: string) => void;
  applyTemplate: (s: WizardState) => void;
  returnToResults: () => void;
  setActiveTab: (tab: string) => void;
  t: Dict;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function WizardView({
  phase,
  phaseIdx,
  phaseState,
  questions,
  isPhaseComplete,
  allPhaseState,
  completedPhases,
  arch,
  phasesWithLabels,
  phaseIssues,
  allRecs,
  hasAnyRec,
  allGuardrails,
  infoDb,
  handleAnswer,
  next,
  prev,
  jumpTo,
  applyTemplate,
  returnToResults,
  setActiveTab,
  t,
}: WizardViewProps) {
  const [infoPanel, setInfoPanel] = useState<InfoEntry | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Phase dict label (already merged from parent via phasesWithLabels)
  const phaseDict = phasesWithLabels.find((p) => p.id === phase.id);

  // Compute question progress for PhaseHeader
  const activeQuestions = questions.filter((q) => !q.skip);
  const answeredCount = activeQuestions.filter((q) => {
    const v = phaseState[q.id];
    return Array.isArray(v) ? v.length > 0 : v != null && v !== "";
  }).length;

  return (
    <div className="mx-auto max-w-[1400px] px-3 py-4 md:px-7 md:py-6">
      <div className="flex flex-col gap-4 md:grid md:grid-cols-[1fr_280px] md:gap-5">
        <div>
          {/* Phase header */}
          <PhaseHeader
            phase={
              phaseDict
                ? { ...phase, label: phaseDict.label, desc: phaseDict.desc, tip: phaseDict.tip }
                : phase
            }
            totalPhases={PHASES.length}
            answeredCount={answeredCount}
            totalQuestions={activeQuestions.length}
          />

          {/* Quick Start Templates (Phase 1 only, before any answers) */}
          {phaseIdx === 0 && !completedPhases.has("workload") && (
            <TemplateSelector
              onSelect={(s) => {
                applyTemplate(s);
                setActiveTab("summary");
              }}
            />
          )}

          {/* Live Phase validation banner */}
          {phaseIssues.length > 0 && (
            <div className="mb-3">
              {phaseIssues.map((issue, i) => (
                <div
                  key={i}
                  className={cn(
                    "mb-1.5 flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5",
                    issue.severity === "error"
                      ? "border-red-300 bg-red-50"
                      : "border-amber-200 bg-amber-50"
                  )}
                >
                  <span className="shrink-0 text-base">
                    {issue.severity === "error" ? "\u2757" : "\u26A0\uFE0F"}
                  </span>
                  <div className="flex-1">
                    <div
                      className={cn(
                        "mb-0.5 text-xs font-bold",
                        issue.severity === "error"
                          ? "text-red-600"
                          : "text-yellow-800"
                      )}
                    >
                      {issue.title}
                    </div>
                    <div className="text-[11px] leading-relaxed text-gray-700">
                      {issue.message}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recommendation guide */}
          {hasAnyRec && (
            <div className="mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2 text-[11px] text-yellow-800">
              <span className="font-bold">{t.wizard.recGuide}:</span>
              <span className="flex items-center gap-1">
                <span className="rounded border border-red-300 bg-red-50 px-1 py-px text-[10px] font-bold text-red-600">
                  {t.wizard.recRequired}
                </span>{" "}
                {t.wizard.recStrongly}
              </span>
              <span className="flex items-center gap-1">
                <span className="rounded border border-violet-300 bg-violet-50 px-1 py-px text-[10px] font-bold text-violet-600">
                  {t.wizard.recRecommended}
                </span>{" "}
                {t.wizard.recBestPractice}
              </span>
              <span className="flex items-center gap-1">
                <span className="rounded border border-emerald-300 bg-green-50 px-1 py-px text-[10px] font-bold text-emerald-600">
                  {t.wizard.recCostSave}
                </span>{" "}
                {t.wizard.recCostOpt}
              </span>
              <button
                onClick={() => {
                  const filledIds = new Set<string>();
                  const skipDeps: Record<string, string[]> = {
                    arch_pattern: ["orchestration", "compute_node", "scaling"],
                    sync_async: ["queue_type"],
                  };
                  for (const q of questions) {
                    if (q.skip) continue;
                    const existing = phaseState[q.id];
                    const hasAnswer = Array.isArray(existing)
                      ? existing.length > 0
                      : existing != null && existing !== "";
                    if (hasAnswer) continue;
                    if (
                      [...filledIds].some(
                        (fid) => skipDeps[fid]?.includes(q.id)
                      )
                    )
                      continue;
                    if (q.multi) {
                      const pri = (s: string) =>
                        s.startsWith("\u2B50") ? 0 : s.startsWith("\u2728") ? 1 : 2;
                      const recOpts = q.opts
                        .filter(
                          (o) =>
                            o.v !== "none" &&
                            allRecs[`${phase.id}.${q.id}.${o.v}`]
                        )
                        .sort((a, b) => {
                          const ba = allRecs[`${phase.id}.${q.id}.${a.v}`]?.badge || "";
                          const bb = allRecs[`${phase.id}.${q.id}.${b.v}`]?.badge || "";
                          return pri(ba) - pri(bb);
                        })
                        .map((o) => o.v);
                      if (recOpts.length === 0) {
                        // no recs
                      } else if (recOpts.includes("no")) {
                        // "no" is exclusive — pick best between "no" and others
                        const noBadge = allRecs[`${phase.id}.${q.id}.no`]?.badge || "";
                        const bestOther = recOpts.find((v) => v !== "no");
                        const otherBadge = bestOther
                          ? allRecs[`${phase.id}.${q.id}.${bestOther}`]?.badge || ""
                          : "";
                        if (!bestOther || pri(noBadge) <= pri(otherBadge)) {
                          handleAnswer(q.id, ["no"]);
                        } else {
                          handleAnswer(q.id, [bestOther]);
                        }
                        filledIds.add(q.id);
                      } else {
                        // pick the single best recommendation
                        handleAnswer(q.id, [recOpts[0]]);
                        filledIds.add(q.id);
                      }
                    } else {
                      const ranked = q.opts
                        .filter(
                          (o) => allRecs[`${phase.id}.${q.id}.${o.v}`]
                        )
                        .sort((a, b) => {
                          const ba =
                            allRecs[`${phase.id}.${q.id}.${a.v}`]?.badge || "";
                          const bb =
                            allRecs[`${phase.id}.${q.id}.${b.v}`]?.badge || "";
                          const pri = (s: string) =>
                            s.startsWith("\u2B50") ? 0 : s.startsWith("\u2728") ? 1 : 2;
                          return pri(ba) - pri(bb);
                        });
                      if (ranked.length > 0) {
                        handleAnswer(q.id, ranked[0].v);
                        filledIds.add(q.id);
                      }
                    }
                  }
                }}
                className="ml-auto shrink-0 rounded-md border border-indigo-300 bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-600 transition-colors hover:bg-indigo-100"
              >
                {t.wizard.autoSelect}
              </button>
            </div>
          )}

          {/* Questions */}
          {questions.map(
            (q) =>
              !q.skip && (
                <QuestionCard
                  key={q.id}
                  question={q}
                  value={phaseState[q.id] as string | string[] | undefined}
                  onChange={(v) => handleAnswer(q.id, v)}
                  onInfo={setInfoPanel}
                  infoDb={infoDb}
                  recommendations={Object.fromEntries(
                    Object.entries(allRecs)
                      .filter(([k]) =>
                        k.startsWith(`${phase.id}.${q.id}.`)
                      )
                      .map(([k, v]) => [
                        k.split(".").slice(2).join("."),
                        v,
                      ])
                  )}
                  guardrails={allGuardrails[q.id] || {}}
                />
              )
          )}

          {/* Navigation */}
          <div className="mt-2 flex flex-col gap-2">
            <div className="flex gap-2.5">
              {phaseIdx > 0 && (
                <button
                  onClick={() => prev()}
                  className="rounded-[10px] border-[1.5px] border-gray-200 bg-white px-6 py-3 text-[13px] font-medium text-gray-500"
                >
                  {t.wizard.prevBtn}
                </button>
              )}
              <button
                onClick={next}
                disabled={!isPhaseComplete}
                className={cn(
                  "flex-1 rounded-[10px] py-3 text-sm font-bold transition-all",
                  isPhaseComplete
                    ? "cursor-pointer bg-indigo-600 text-white"
                    : "cursor-not-allowed bg-gray-200 text-gray-400"
                )}
              >
                {phaseIdx < PHASES.length - 1
                  ? t.wizard.nextStep(phasesWithLabels[phaseIdx + 1]?.label || "")
                  : t.wizard.generateArch}
              </button>
            </div>
            {/* Return to results button */}
            {arch &&
              completedPhases.size >=
                PHASES.filter(
                  (p) => !p.skipPhase || !p.skipPhase(allPhaseState)
                ).length && (
                <button
                  onClick={() => {
                    returnToResults();
                    setActiveTab("summary");
                  }}
                  className="rounded-[10px] border-[1.5px] border-emerald-300 bg-emerald-50 py-2.5 text-[13px] font-semibold text-emerald-600 transition-colors hover:bg-emerald-100"
                >
                  {t.wizard.returnToResult}
                </button>
              )}
          </div>
        </div>

        {/* Summary sidebar -- desktop */}
        <div className="hidden md:block">
          <StateSummary
            state={allPhaseState}
            phases={phasesWithLabels.filter((p) => completedPhases.has(p.id))}
            onEdit={jumpTo}
          />
        </div>
      </div>

      {/* Mobile SlidePanel for wizard sidebar */}
      <SlidePanelTrigger onClick={() => setMobileSidebarOpen(true)} label={t.stateSummary.title} />
      <SlidePanel open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen} title={t.stateSummary.title}>
        <StateSummary
          state={allPhaseState}
          phases={phasesWithLabels.filter((p) => completedPhases.has(p.id))}
          onEdit={(id) => {
            setMobileSidebarOpen(false);
            jumpTo(id);
          }}
        />
      </SlidePanel>

      <InfoPanel info={infoPanel} onClose={() => setInfoPanel(null)} />
    </div>
  );
}
