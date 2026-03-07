"use client";

import { useState, useMemo } from "react";
import { useSession, signIn } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useWizard } from "@/hooks/use-wizard";
import { PHASES } from "@/data/phases";

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
import { INFO_DB } from "@/lib/info-db";

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

  const { data: session } = useSession();
  const [infoPanel, setInfoPanel] = useState<InfoEntry | null>(null);
  const [activeTab, setActiveTab] = useState("summary");
  const [saveToast, setSaveToast] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Live validation for current phase
  const liveIssues = useMemo(
    () => validateState(allPhaseState),
    [allPhaseState]
  );
  const phaseIssues = liveIssues.filter(
    (i) => i.phases && i.phases.includes(phase.id)
  );

  // Recommendations for current phase
  const allRecs = useMemo(
    () => getRecommendations(allPhaseState),
    [allPhaseState]
  );

  const hasAnyRec = questions.some((q) => {
    if (q.skip) return false;
    return q.opts?.some((o) => allRecs[`${phase.id}.${q.id}.${o.v}`]);
  });

  // Build result tab data
  const resultTabs = useMemo(() => {
    if (!showResult || !arch) return [];
    const _issues = validateState(allPhaseState);
    const _errs = _issues.filter((i) => i.severity === "error").length;
    const _warns = _issues.filter((i) => i.severity === "warn").length;
    const _wa = wellArchitectedScore(allPhaseState);
    const _cost = estimateMonthlyCost(allPhaseState);

    let checklistLabel = "\u2611\uFE0F 체크리스트";
    try {
      const saved = JSON.parse(
        localStorage.getItem("aws_arch_checklist_v1") || "{}"
      );
      const cl = generateChecklist(allPhaseState);
      const done = cl.phases.reduce(
        (s: number, p: any) => s + p.items.filter((i: any) => saved[i.id]).length,
        0
      );
      const total = cl.totalItems;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      checklistLabel = `\u2611\uFE0F 체크리스트 ${pct}%`;
    } catch {}

    let codeLabel = "</> 코드";
    try {
      codeLabel = `</> 코드 ${generateCodeSnippets(allPhaseState).length}개`;
    } catch {}

    return [
      { id: "summary", label: "\uD83D\uDCCA \uC694\uC57D" },
      { id: "cards", label: "\uD83D\uDCCB \uC11C\uBE44\uC2A4 \uC0C1\uC138" },
      { id: "diagram", label: "\uD83D\uDCD0 \uAD6C\uC131\uB3C4" },
      {
        id: "validate",
        label:
          "\uD83D\uDD0D 검증" +
          (_errs > 0
            ? ` \u2757${_errs}`
            : _warns > 0
              ? ` \u26A0\uFE0F${_warns}`
              : " \u2705"),
      },
      { id: "checklist", label: checklistLabel },
      { id: "sg", label: "\uD83D\uDD10 \uC811\uADFC \uC81C\uC5B4" },
      {
        id: "cost",
        label: `\uD83D\uDCB0 비용 $${_cost.totalMid.toLocaleString()}`,
      },
      {
        id: "wafr",
        label: `\uD83C\uDFC6 설계 평가 ${_wa.overall}점`,
      },
      { id: "code", label: codeLabel },
    ];
  }, [showResult, arch, allPhaseState]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-sm text-gray-400">Loading...</div>
      </div>
    );
  }

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
        phases={PHASES}
        currentPhase={showResult ? "__done__" : currentPhase}
        completedPhases={completedPhases}
        onJump={jumpTo}
      />

      {showResult && arch ? (
        /* RESULT VIEW */
        <div className="mx-auto max-w-[1400px] px-7 py-6">
          {/* 완성 배너 */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border-[1.5px] border-emerald-200 bg-emerald-50 px-5 py-4">
            <div>
              <div className="mb-0.5 text-base font-bold text-emerald-600">
                {"\u2726"} 아키텍처 설계 완성
              </div>
              <div className="text-[13px] text-gray-700">
                입력하신 요구사항 전체를 기반으로 도출된 AWS 아키텍처입니다.
              </div>
            </div>
            {/* 저장 버튼 */}
            <div className="relative">
              <button
                onClick={async () => {
                  if (!session) {
                    setShowLoginModal(true);
                    return;
                  }
                  await saveToHistory(allPhaseState, [...completedPhases]);
                  setSaveToast("저장되었습니다");
                  setTimeout(() => setSaveToast(""), 2000);
                }}
                className="rounded-lg border-[1.5px] border-emerald-300 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-600 transition-colors hover:bg-emerald-100"
              >
                {"💾"} 저장
              </button>
              {saveToast && (
                <div className="absolute right-0 top-full z-[100] mt-1 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1 text-[11px] text-white">
                  {saveToast}
                </div>
              )}
            </div>

            {/* 로그인 요청 모달 */}
            {showLoginModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="w-full max-w-xs rounded-xl bg-white p-6 text-center shadow-xl">
                  <p className="mb-1 text-sm font-bold text-gray-900">로그인이 필요합니다</p>
                  <p className="mb-5 text-xs text-gray-500">저장 기능은 로그인 후 이용할 수 있습니다</p>
                  <button
                    onClick={() => { setShowLoginModal(false); signIn("google"); }}
                    className="mb-2 w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                  >
                    Google로 로그인
                  </button>
                  <button
                    onClick={() => setShowLoginModal(false)}
                    className="w-full rounded-lg px-4 py-2 text-sm text-gray-400 transition-colors hover:text-gray-600"
                  >
                    닫기
                  </button>
                </div>
              </div>
            )}
            {/* 탭 전환 */}
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
                phases={PHASES}
                onEdit={jumpTo}
              />
            </div>
          ) : activeTab === "cards" ? (
            <div className="grid grid-cols-[1fr_280px] gap-5">
              <ArchOutput arch={arch} />
              <StateSummary
                state={allPhaseState}
                phases={PHASES}
                onEdit={jumpTo}
              />
            </div>
          ) : activeTab === "diagram" ? (
            <div className="grid grid-cols-[1fr_280px] gap-5">
              <DiagramView arch={arch} state={allPhaseState} />
              <StateSummary
                state={allPhaseState}
                phases={PHASES}
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
                phase={phase}
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

              {/* 실시간 Phase 검증 배너 */}
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
                          ? "\u2757"
                          : "\u26A0\uFE0F"}
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

              {/* 추천 표시 안내 */}
              {hasAnyRec && (
                <div className="mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2 text-[11px] text-yellow-800">
                  <span className="font-bold">{"\uCD94\uCC9C \uD45C\uC2DC \uC548\uB0B4"}:</span>
                  <span className="flex items-center gap-1">
                    <span className="rounded border border-red-300 bg-red-50 px-1 py-px text-[10px] font-bold text-red-600">
                      {"\u2B50"} 필수
                    </span>{" "}
                    {"\uAC15\uB825 \uAD8C\uC7A5"}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="rounded border border-violet-300 bg-violet-50 px-1 py-px text-[10px] font-bold text-violet-600">
                      {"\u2728"} 권장
                    </span>{" "}
                    모범 사례
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="rounded border border-emerald-300 bg-green-50 px-1 py-px text-[10px] font-bold text-emerald-600">
                      {"\uD83D\uDCB0"} 절감
                    </span>{" "}
                    {"\uBE44\uC6A9 \uCD5C\uC801\uD654"}
                  </span>
                  <button
                    onClick={() => {
                      // Track which questions get filled so we can skip dependent questions
                      const filledIds = new Set<string>();
                      // Dependent question IDs that should be skipped if parent changes
                      const skipDeps: Record<string, string[]> = {
                        arch_pattern: ["orchestration", "compute_node", "scaling"],
                        sync_async: ["queue_type"],
                      };
                      for (const q of questions) {
                        if (q.skip) continue;
                        // Skip questions the user already answered
                        const existing = phaseState[q.id];
                        const hasAnswer = Array.isArray(existing) ? existing.length > 0 : existing != null && existing !== "";
                        if (hasAnswer) continue;
                        // Skip questions that depend on a just-filled parent
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
                              const pri = (s: string) => s.startsWith("\u2B50") ? 0 : s.startsWith("\u2728") ? 1 : 2;
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
                    {"\u2728"} {"\uCD94\uCC9C \uC790\uB3D9 \uC120\uD0DD"}
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
                      infoDb={INFO_DB}
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
                      {"\u2190"} \uC774\uC804
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
                      ? `\uB2E4\uC74C \uB2E8\uACC4: ${PHASES[phaseIdx + 1].label} \u2192`
                      : "\u2726 \uC544\uD0A4\uD14D\uCC98 \uB3C4\uCD9C"}
                  </button>
                </div>
                {/* Return to results button (when editing after completion) */}
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
                    {"\u2726"} \uACB0\uACFC \uD654\uBA74\uC73C\uB85C \uB3CC\uC544\uAC00\uAE30 (\uC544\uD0A4\uD14D\uCC98 \uC7AC\uC0DD\uC131)
                  </button>
                )}
              </div>
            </div>

            {/* Summary sidebar — show all completed phases, not just previous ones */}
            <StateSummary
              state={allPhaseState}
              phases={PHASES.filter((p) => completedPhases.has(p.id))}
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
