"use client";

import { cn } from "@/lib/utils";
import { useDict } from "@/lib/i18n/context";
import { CheckCircle2 } from "lucide-react";
import type { Phase } from "@/lib/types";

interface PhaseHeaderProps {
  phase: Phase;
  totalPhases: number;
  answeredCount: number;
  totalQuestions: number;
}

export function PhaseHeader({
  phase,
  totalPhases,
  answeredCount,
  totalQuestions,
}: PhaseHeaderProps) {
  const t = useDict();
  const allDone = totalQuestions > 0 && answeredCount >= totalQuestions;
  const pct = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  return (
    <div className="sticky top-0 z-20 mb-4 rounded-xl border border-gray-200 bg-white/95 px-6 py-5 backdrop-blur shadow-sm">
      <div className="flex items-center gap-3.5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-indigo-200 bg-indigo-50 text-[22px]">
          {phase.icon}
        </div>
        <div>
          <div className="mb-0.5 text-[11px] text-gray-400">
            Phase {phase.no} / {totalPhases}
          </div>
          <div className="text-lg font-bold text-gray-900">{phase.label}</div>
          <div className="text-xs text-gray-500">{phase.desc}</div>
        </div>
      </div>

      {/* Question progress */}
      {totalQuestions > 0 && (
        <div className="mt-3">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className={cn(
                "text-[11px] font-medium",
                allDone ? "text-emerald-600" : "text-gray-500"
              )}
            >
              {t.wizard.questionProgress(answeredCount, totalQuestions)}
            </span>
            {allDone && (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            )}
          </div>
          <div className="h-[2px] w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                allDone ? "bg-emerald-500" : "bg-indigo-500"
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {phase.tip && (
        <div className="mt-3.5 rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-[13px] leading-[1.7] text-gray-700">
          {phase.tip}
        </div>
      )}
    </div>
  );
}
