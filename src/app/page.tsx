"use client";

import { useState, useMemo } from "react";
import { useSession, signIn } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useWizard } from "@/hooks/use-wizard";
import { PHASES } from "@/data/phases";
import { useDict, useLang } from "@/lib/i18n/context";

import { Header } from "@/components/layout/Header";
import { ProgressBar } from "@/components/wizard/ProgressBar";
import { PhaseHeader } from "@/components/wizard/PhaseHeader";
import { QuestionCard } from "@/components/wizard/QuestionCard";
import { InfoPanel } from "@/components/wizard/InfoPanel";
import { TemplateSelector } from "@/components/wizard/TemplateSelector";

import { ArchOutput } from "@/components/result/ArchOutput";
import { DiagramView } from "@/components/result/DiagramView";
import { ValidationView } from "@/components/result/ValidationView";
import { ChecklistView } from "@/components/result/ChecklistView";
import { SecurityGroupView } from "@/components/result/SecurityGroupView";
import { CostView } from "@/components/result/CostView";
import { WafrView } from "@/components/result/WafrView";
import { CodeView } from "@/components/result/CodeView";
import { StateSummary } from "@/components/result/StateSummary";
import { SummaryView } from "@/components/result/SummaryView";

import { validateState } from "@/lib/validate";
import { wellArchitectedScore } from "@/lib/wafr";
import { estimateMonthlyCost } from "@/lib/cost";
import { generateChecklist } from "@/lib/checklist";
import { generateCodeSnippets } from "@/lib/code-snippets";
import { getRecommendations } from "@/lib/recommendations";
import { checkGuardrails } from "@/lib/guardrails";
import { saveToHistory } from "@/lib/history";
import { getInfoDb } from "@/lib/info-db";

import type { InfoEntry } from "@/lib/types";
import type { GuardrailWarning } from "@/lib/guardrails";

export default function Home() {
  const {
    currentPhase,
    state: allPhaseState,
    completedPhases,
    showResult,
    arch,
    phase,
    phaseIdx,
    phaseState,
    questions,
    isPhaseComplete,
    hydrated,
    handleAnswer,
    next,
    prev,
    jumpTo,
    reset,
    importJSON,
    applyTemplate,
  } = useWizard();

  const t = useDict();
  const { lang } = useLang();
  const { data: session } = useSession();
  const [infoPanel, setInfoPanel] = useState<InfoEntry | null>(null);
  const [activeTab, setActiveTab] = useState("summary");
  const [saveToast, setSaveToast] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);

  const infoDb = useMemo(() => getInfoDb(lang), [lang]);

  // Phase data from dictionary
  const phasesDict = t.phases;
  const phaseDict = phasesDict.find((p) => p.id === phase.id);

  // Live validation for current phase
  const liveIssues = useMemo(
    () => validateState(allPhaseState, lang),
    [allPhaseState, lang]
  );
  const phaseIssues = liveIssues.filter(
    (i) => i.phases && i.phases.includes(phase.id)
  );

  // Recommendations for current phase
  const allRecs = useMemo(
    () => getRecommendations(allPhaseState, lang),
    [allPhaseState, lang]
  );

  const hasAnyRec = questions.some((q) => {
    if (q.skip) return false;
    return q.opts?.some((o) => allRecs[`${phase.id}.${q.id}.${o.v}`]);
  });

  // Build result tab data
  const resultTabs = useMemo(() => {
    if (!showResult || !arch) return [];
    const _issues = validateState(allPhaseState, lang);
    const _errs = _issues.filter((i) => i.severity === "error").length;
    const _warns = _issues.filter((i) => i.severity === "warn").length;
    const _wa = wellArchitectedScore(allPhaseState, lang);
    const _cost = estimateMonthlyCost(allPhaseState, lang);

    let checklistLabel = t.result.tabs.checklist;
    try {
      const saved = JSON.parse(
        localStorage.getItem("aws_arch_checklist_v1") || "{}"
      );
      const cl = generateChecklist(allPhaseState, lang);
      const done = cl.phases.reduce(
        (s: number, p: any) => s + p.items.filter((i: any) => saved[i.id]).length,
        0
      );
      const total = cl.totalItems;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      checklistLabel = t.result.tabs.checklistPct(pct);
    } catch {}

    let codeLabel = t.result.tabs.code;
    try {
      codeLabel = t.result.tabs.codeCnt(generateCodeSnippets(allPhaseState).length);
    } catch {}

    return [
      { id: "summary", label: t.result.tabs.summary },
      { id: "cards", label: t.result.tabs.serviceDetail },
      { id: "diagram", label: t.result.tabs.diagram },
      {
        id: "validate",
        label:
          t.result.tabs.validation +
          (_errs > 0
            ? ` ❗${_errs}`
            : _warns > 0
              ? ` ⚠️${_warns}`
              : " ✅"),
      },
      { id: "checklist", label: checklistLabel },
      { id: "sg", label: t.result.tabs.securityGroups },
      {
        id: "cost",
        label: t.result.tabs.cost(_cost.totalMid.toLocaleString()),
      },
      {
        id: "wafr",
        label: t.result.tabs.wafr(_wa.overall),
      },
      { id: "code", label: codeLabel },
    ];
  }, [showResult, arch, allPhaseState, t, lang]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-sm text-gray-400">Loading...</div>
      </div>
    );
  }

  // Build phase labels for ProgressBar / PhaseHeader from dictionary
  const phasesWithLabels = PHASES.map((p) => {
    const d = phasesDict.find((pd) => pd.id === p.id);
    return d ? { ...p, label: d.label, desc: d.desc, tip: d.tip } : p;
  });

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <Header
        showResult={showResult}
        completedPhases={completedPhases}
        allPhaseState={allPhaseState}
        onReset={() => { reset(); setActiveTab("summary"); }}
        onImport={(data) =>
          importJSON({
            state: data.state,
            completedPhases: data.completedPhases,
          })
        }
      />

      {/* Progress */}
      <ProgressBar
        phases={phasesWithLabels}
        currentPhase={showResult ? "__done__" : currentPhase}
        completedPhases={completedPhases}
        onJump={jumpTo}
      />

      {showResult && arch ? (
        /* RESULT VIEW */
        <div className="mx-auto max-w-[1400px] px-7 py-6">
          {/* Completion banner */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border-[1.5px] border-emerald-200 bg-emerald-50 px-5 py-4">
            <div>
              <div className="mb-0.5 text-base font-bold text-emerald-600">
                {t.result.completionTitle}
              </div>
              <div className="text-[13px] text-gray-700">
                {t.result.completionDesc}
              </div>
            </div>
            {/* Save button */}
            <div className="relative">
              <button
                onClick={async () => {
                  if (!session) {
                    setShowLoginModal(true);
                    return;
                  }
                  await saveToHistory(allPhaseState, [...completedPhases], undefined, lang);
                  setSaveToast(t.result.saved);
                  setTimeout(() => setSaveToast(""), 2000);
                }}
                className="rounded-lg border-[1.5px] border-emerald-300 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-600 transition-colors hover:bg-emerald-100"
              >
                {t.result.saveBtn}
              </button>
              {saveToast && (
                <div className="absolute right-0 top-full z-[100] mt-1 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1 text-[11px] text-white">
                  {saveToast}
                </div>
              )}
            </div>

            {/* Login modal */}
            {showLoginModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="w-full max-w-xs rounded-xl bg-white p-6 text-center shadow-xl">
                  <p className="mb-1 text-sm font-bold text-gray-900">{t.result.loginRequired}</p>
                  <p className="mb-5 text-xs text-gray-500">{t.result.loginRequiredDesc}</p>
                  <button
                    onClick={() => { setShowLoginModal(false); signIn("google"); }}
                    className="mb-2 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                  >
                    {t.result.googleLogin}
                  </button>
                  <button
                    onClick={() => setShowLoginModal(false)}
                    className="w-full rounded-lg px-4 py-2 text-sm text-gray-400 transition-colors hover:text-gray-600"
                  >
                    {t.result.close}
                  </button>
                </div>
              </div>
            )}
            {/* Tab toggle */}
            <div className="flex flex-wrap gap-1 rounded-[10px] bg-gray-100 p-1">
              {resultTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold transition-all",
                    activeTab === tab.id
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "bg-transparent text-gray-500"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          {activeTab === "summary" ? (
            <div className="grid grid-cols-[1fr_280px] gap-5">
              <SummaryView state={allPhaseState} arch={arch} />
              <StateSummary
                state={allPhaseState}
                phases={phasesWithLabels}
                onEdit={jumpTo}
              />
            </div>
          ) : activeTab === "cards" ? (
            <div className="grid grid-cols-[1fr_280px] gap-5">
              <ArchOutput arch={arch} />
              <StateSummary
                state={allPhaseState}
                phases={phasesWithLabels}
                onEdit={jumpTo}
              />
            </div>
          ) : activeTab === "diagram" ? (
            <div className="grid grid-cols-[1fr_280px] gap-5">
              <DiagramView arch={arch} state={allPhaseState} />
              <StateSummary
                state={allPhaseState}
                phases={phasesWithLabels}
                onEdit={jumpTo}
              />
            </div>
          ) : activeTab === "validate" ? (
            <ValidationView state={allPhaseState} onEdit={jumpTo} />
          ) : activeTab === "cost" ? (
            <CostView state={allPhaseState} />
          ) : activeTab === "wafr" ? (
            <WafrView state={allPhaseState} />
          ) : activeTab === "checklist" ? (
            <ChecklistView state={allPhaseState} />
          ) : activeTab === "sg" ? (
            <SecurityGroupView state={allPhaseState} />
          ) : activeTab === "code" ? (
            <CodeView state={allPhaseState} />
          ) : null}
        </div>
      ) : (
        /* QUESTION VIEW */
        <div className="mx-auto max-w-[1400px] px-7 py-6">
          <div className="grid grid-cols-[1fr_280px] gap-5">
            <div>
              {/* Phase header */}
              <PhaseHeader
                phase={phaseDict ? { ...phase, label: phaseDict.label, desc: phaseDict.desc, tip: phaseDict.tip } : phase}
                totalPhases={PHASES.length}
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
                        {issue.severity === "error"
                          ? "❗"
                          : "⚠️"}
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
                        const hasAnswer = Array.isArray(existing) ? existing.length > 0 : existing != null && existing !== "";
                        if (hasAnswer) continue;
                        if ([...filledIds].some((fid) => skipDeps[fid]?.includes(q.id))) continue;
                        if (q.multi) {
                          const recOpts = q.opts
                            .filter((o) => o.v !== "none" && allRecs[`${phase.id}.${q.id}.${o.v}`])
                            .map((o) => o.v);
                          if (recOpts.length > 0) {
                            handleAnswer(q.id, recOpts);
                            filledIds.add(q.id);
                          }
                        } else {
                          const ranked = q.opts
                            .filter((o) => allRecs[`${phase.id}.${q.id}.${o.v}`])
                            .sort((a, b) => {
                              const ba = allRecs[`${phase.id}.${q.id}.${a.v}`]?.badge || "";
                              const bb = allRecs[`${phase.id}.${q.id}.${b.v}`]?.badge || "";
                              const pri = (s: string) => s.startsWith("⭐") ? 0 : s.startsWith("✨") ? 1 : 2;
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
                      value={phaseState[q.id]}
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
                      guardrails={Object.fromEntries(
                        q.opts
                          .map((o) => {
                            const w = checkGuardrails(allPhaseState, phase.id, q.id, o.v);
                            return w ? [o.v, w] as [string, GuardrailWarning] : null;
                          })
                          .filter((x): x is [string, GuardrailWarning] => x !== null)
                      )}
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
                    disabled={!isPhaseComplete()}
                    className={cn(
                      "flex-1 rounded-[10px] py-3 text-sm font-bold transition-all",
                      isPhaseComplete()
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
                {arch && completedPhases.size >= PHASES.filter(p => !p.skipPhase || !p.skipPhase(allPhaseState)).length && (
                  <button
                    onClick={() => {
                      importJSON({
                        state: allPhaseState,
                        completedPhases: [...completedPhases],
                      });
                      setActiveTab("summary");
                    }}
                    className="rounded-[10px] border-[1.5px] border-emerald-300 bg-emerald-50 py-2.5 text-[13px] font-semibold text-emerald-600 transition-colors hover:bg-emerald-100"
                  >
                    {t.wizard.returnToResult}
                  </button>
                )}
              </div>
            </div>

            {/* Summary sidebar */}
            <StateSummary
              state={allPhaseState}
              phases={phasesWithLabels.filter((p) => completedPhases.has(p.id))}
              onEdit={jumpTo}
            />
          </div>
        </div>
      )}

      <InfoPanel
        info={infoPanel}
        onClose={() => setInfoPanel(null)}
      />
    </div>
  );
}
