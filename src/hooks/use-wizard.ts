"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import type { WizardState } from "@/lib/types";
import { PHASES, type PhaseDefinition } from "@/data/phases";
import { buildPhaseQuestions } from "@/lib/questions";
import { generateArchitecture } from "@/lib/architecture";
import { useLang } from "@/lib/i18n/context";

const SAVE_KEY = "aws_arch_designer_v1";

function loadSaved() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('[wizard] Failed to load saved state:', e);
    return null;
  }
}

export function useWizard() {
  const { lang } = useLang();
  const [currentPhase, setCurrentPhase] = useState<string>("workload");
  const [state, setState] = useState<WizardState>({});
  const [completedPhases, setCompletedPhases] = useState<Set<string>>(
    new Set()
  );
  const [showResult, setShowResult] = useState<boolean>(false);
  const [arch, setArch] = useState<ReturnType<typeof generateArchitecture> | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // localStorage 복원 (클라이언트 마운트 후)
  useEffect(() => {
    const saved = loadSaved();
    if (saved) {
      if (saved.currentPhase) setCurrentPhase(saved.currentPhase);
      if (saved.state) setState(saved.state);
      if (saved.completedPhases) setCompletedPhases(new Set(saved.completedPhases));
      if (saved.showResult) setShowResult(true);
      if (saved.arch) setArch(saved.arch);
    }
    setHydrated(true);
  }, []);

  const phaseIdx = PHASES.findIndex((p) => p.id === currentPhase);
  const phase = PHASES[phaseIdx];
  const phaseState = state[phase.id] || {};
  const questions = buildPhaseQuestions(phase.id, state, phaseState, lang);

  const allPhaseState = useMemo(
    () => ({ ...state, [phase.id]: phaseState }),
    [state, phase.id, phaseState]
  );

  const isPhaseComplete = useMemo(() => {
    return questions
      .filter((q) => !q.skip)
      .every((q) => {
        const v = phaseState[q.id];
        if (Array.isArray(v)) return v.length > 0;
        return v !== undefined && v !== null && v !== "";
      });
  }, [questions, phaseState]);

  // When parent answers change, clear stale dependent fields/phases
  const CLEAR_DEPS: Record<string, { fields?: string[]; phases?: string[] }> = {
    "compute.arch_pattern": { fields: ["orchestration", "compute_node", "scaling"], phases: ["platform"] },
    "compute.orchestration": { phases: ["platform"] },
    "integration.sync_async": { fields: ["queue_type"] },
  };

  function handleAnswer(qId: string, val: string | string[]) {
    setState((prev) => {
      const curPhaseState = prev[phase.id] || {};
      const oldVal = curPhaseState[qId];

      // Only clear dependents if value actually changed
      const changed = JSON.stringify(oldVal) !== JSON.stringify(val);
      const updated: WizardState = {
        ...prev,
        [phase.id]: { ...curPhaseState, [qId]: val },
      };

      if (changed) {
        const deps = CLEAR_DEPS[`${phase.id}.${qId}`];
        if (deps) {
          if (deps.fields) {
            for (const f of deps.fields) {
              delete (updated[phase.id] as Record<string, unknown>)[f];
            }
          }
          if (deps.phases) {
            for (const p of deps.phases) {
              delete updated[p];
            }
            // Also remove cleared phases from completedPhases
            setCompletedPhases((prev) => {
              const next = new Set(prev);
              for (const p of deps.phases!) next.delete(p);
              return next;
            });
          }
        }
      }

      return updated;
    });
  }

  function next() {
    const updatedState = { ...state, [phase.id]: phaseState };
    setCompletedPhases((prev) => new Set([...prev, phase.id]));
    if (phaseIdx < PHASES.length - 1) {
      let nextIdx = phaseIdx + 1;
      while (nextIdx < PHASES.length) {
        const nextPhase = PHASES[nextIdx];
        if (nextPhase.skipPhase && nextPhase.skipPhase(updatedState)) {
          nextIdx++;
        } else break;
      }
      if (nextIdx < PHASES.length) {
        setCurrentPhase(PHASES[nextIdx].id);
      } else {
        // All remaining phases were skipped → show results
        const result = generateArchitecture(updatedState, lang);
        setArch(result);
        setShowResult(true);
      }
    } else {
      const result = generateArchitecture(updatedState, lang);
      setArch(result);
      setShowResult(true);
    }
  }

  function prev() {
    if (phaseIdx > 0) {
      const updatedState = { ...state, [phase.id]: phaseState };
      let prevIdx = phaseIdx - 1;
      while (prevIdx > 0) {
        const prevPhase = PHASES[prevIdx];
        if (prevPhase.skipPhase && prevPhase.skipPhase(updatedState)) {
          prevIdx--;
        } else break;
      }
      setCurrentPhase(PHASES[prevIdx].id);
    }
  }

  function jumpTo(phaseId: string) {
    if (!PHASES.some((p) => p.id === phaseId)) return;
    setCurrentPhase(phaseId);
    setShowResult(false);
  }

  function reset() {
    setState({});
    setCompletedPhases(new Set());
    setCurrentPhase("workload");
    setShowResult(false);
    setArch(null);
  }

  function returnToResults() {
    setShowResult(true);
  }

  function importJSON(data: { state: WizardState; completedPhases: string[] }) {
    setState(data.state);
    setCompletedPhases(new Set(data.completedPhases));
    setShowResult(true);
    setArch(generateArchitecture(data.state, lang));
  }

  function applyTemplate(templateState: WizardState) {
    setState(templateState);
    setCompletedPhases(new Set(PHASES.map((p) => p.id)));
    const result = generateArchitecture(templateState, lang);
    setArch(result);
    setShowResult(true);
  }

  // localStorage 자동 저장
  useEffect(() => {
    if (!hydrated) return;
    try {
      const toSave = {
        currentPhase,
        state,
        showResult,
        arch,
        completedPhases: [...completedPhases],
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(toSave));
    } catch (e) { console.warn('[wizard] Failed to save state:', e); }
  }, [hydrated, currentPhase, state, showResult, arch, completedPhases]);

  // URL에서 상태 복원
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const d = params.get("d");
      if (!d) return;
      const json = decodeURIComponent(escape(atob(d)));
      const parsed = JSON.parse(json);
      if (parsed.state) {
        setState(parsed.state);
        setCompletedPhases(new Set(parsed.completedPhases || []));
        setShowResult(true);
        setArch(generateArchitecture(parsed.state, lang));
        window.history.replaceState({}, "", window.location.pathname);
      }
    } catch (e) { console.warn('[wizard] Failed to restore from URL:', e); }
  }, []);

  return {
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
    returnToResults,
  };
}
