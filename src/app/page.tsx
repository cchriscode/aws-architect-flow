"use client";

import { useState, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import { LoginModal } from "@/components/auth/LoginModal";
import { useWizard } from "@/hooks/use-wizard";
import { PHASES } from "@/data/phases";
import { useDict, useLang } from "@/lib/i18n/context";

import { Header } from "@/components/layout/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { ProgressBar } from "@/components/wizard/ProgressBar";
import { ActionToolbar } from "@/components/wizard/ActionToolbar";
import { WizardView } from "@/components/wizard/WizardView";
import { ResultView } from "@/components/result/ResultView";
import { ErrorBoundary } from "@/components/ErrorBoundary";

import { validateState } from "@/lib/validate";
import { getRecommendations } from "@/lib/recommendations";
import { checkGuardrails } from "@/lib/guardrails";
import { saveToHistory } from "@/lib/history";
import { getInfoDb } from "@/lib/info-db";

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
    applyTemplate,
    returnToResults,
  } = useWizard();

  const t = useDict();
  const { lang } = useLang();
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("summary");
  const [saveToast, setSaveToast] = useState("");
  const [shareMsg, setShareMsg] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [heroVisible, setHeroVisible] = useState(true);

  // Read heroVisible from localStorage after hydration to avoid SSR/CSR mismatch
  useEffect(() => {
    try {
      if (localStorage.getItem("archflow_hero_dismissed") === "1") setHeroVisible(false);
    } catch { /* ignore */ }
  }, []);

  const infoDb = useMemo(() => getInfoDb(lang), [lang]);

  /* ---------------------------------------------------------------- */
  /* Shared action handlers                                            */
  /* ---------------------------------------------------------------- */

  async function handleSave() {
    await saveToHistory(allPhaseState, [...completedPhases], undefined, lang);
    setSaveToast(t.result.saved);
    setTimeout(() => setSaveToast(""), 2000);
  }

  async function handleShareURL() {
    if (!session) {
      setShowLoginModal(true);
      return;
    }
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: allPhaseState,
          completedPhases: [...completedPhases],
        }),
      });
      if (!res.ok) throw new Error("Share API failed");
      const { shortId } = await res.json();
      const url = `${window.location.origin}/share/${shortId}`;
      await navigator.clipboard.writeText(url);
      setShareMsg(t.header.linkCopied);
      setTimeout(() => setShareMsg(""), 2500);
    } catch (e) {
      console.warn("[page] Failed to copy share link:", e);
      setShareMsg(t.header.copyFailed);
    }
  }

  function handleReset() {
    reset();
    setActiveTab("summary");
  }

  /* ---------------------------------------------------------------- */
  /* Computed data                                                     */
  /* ---------------------------------------------------------------- */

  const phasesDict = t.phases;

  const liveIssues = useMemo(
    () => validateState(allPhaseState, lang),
    [allPhaseState, lang]
  );

  const phaseIssues = liveIssues.filter(
    (i) => i.phases && i.phases.length === 1 && i.phases[0] === phase.id
  );

  const allRecs = useMemo(
    () => getRecommendations(allPhaseState, lang),
    [allPhaseState, lang]
  );

  const hasAnyRec = questions.some((q) => {
    if (q.skip) return false;
    return q.opts?.some((o) => allRecs[`${phase.id}.${q.id}.${o.v}`]);
  });

  const allGuardrails = useMemo(() => {
    const map: Record<string, Record<string, GuardrailWarning>> = {};
    for (const q of questions) {
      if (q.skip) continue;
      const qg: Record<string, GuardrailWarning> = {};
      for (const o of q.opts) {
        const w = checkGuardrails(allPhaseState, phase.id, q.id, o.v);
        if (w) qg[o.v] = w;
      }
      if (Object.keys(qg).length > 0) map[q.id] = qg;
    }
    return map;
  }, [questions, allPhaseState, phase.id]);

  const phasesWithLabels = useMemo(
    () =>
      PHASES.map((p) => {
        const d = phasesDict.find((pd) => pd.id === p.id);
        return d ? { ...p, label: d.label, desc: d.desc, tip: d.tip } : p;
      }),
    [phasesDict]
  );

  /* ---------------------------------------------------------------- */
  /* Hydration gate                                                    */
  /* ---------------------------------------------------------------- */

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-sm text-gray-400">Loading...</div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /* Render                                                            */
  /* ---------------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-gray-100">
      <Header onLoginClick={() => setShowLoginModal(true)} />

      {/* Landing Hero -- first visit, no saved data */}
      {heroVisible && completedPhases.size === 0 && !showResult && (
        <HeroSection
          onStart={() => {
            setHeroVisible(false);
            localStorage.setItem("archflow_hero_dismissed", "1");
          }}
        />
      )}

      <ProgressBar
        phases={phasesWithLabels}
        currentPhase={showResult ? "__done__" : currentPhase}
        completedPhases={completedPhases}
        onJump={jumpTo}
      />

      <ActionToolbar
        session={session}
        allPhaseState={allPhaseState}
        completedPhases={completedPhases}
        showResult={showResult}
        onSave={handleSave}
        onShare={handleShareURL}
        onReset={handleReset}
        onLoginClick={() => setShowLoginModal(true)}
        saveToast={saveToast}
        shareMsg={shareMsg}
        t={t}
      />

      {showResult && arch ? (
        <ErrorBoundary>
          <ResultView
            arch={arch}
            allPhaseState={allPhaseState}
            completedPhases={completedPhases}
            phasesWithLabels={phasesWithLabels}
            liveIssues={liveIssues}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onJump={jumpTo}
            onLoginClick={() => setShowLoginModal(true)}
            session={session}
            saveToast={saveToast}
            setSaveToast={setSaveToast}
            t={t}
            lang={lang}
          />
        </ErrorBoundary>
      ) : (
        <WizardView
          phase={phase}
          phaseIdx={phaseIdx}
          phaseState={phaseState}
          questions={questions}
          isPhaseComplete={isPhaseComplete}
          allPhaseState={allPhaseState}
          completedPhases={completedPhases}
          arch={arch}
          phasesWithLabels={phasesWithLabels}
          phaseIssues={phaseIssues}
          allRecs={allRecs}
          hasAnyRec={hasAnyRec}
          allGuardrails={allGuardrails}
          infoDb={infoDb}
          handleAnswer={handleAnswer}
          next={next}
          prev={prev}
          jumpTo={jumpTo}
          applyTemplate={applyTemplate}
          returnToResults={returnToResults}
          setActiveTab={setActiveTab}
          t={t}
        />
      )}

      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} />
      )}
    </div>
  );
}
