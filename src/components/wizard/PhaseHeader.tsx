import type { Phase } from "@/lib/types";

interface PhaseHeaderProps {
  phase: Phase;
  totalPhases: number;
}

export function PhaseHeader({ phase, totalPhases }: PhaseHeaderProps) {
  return (
    <div className="mb-4 rounded-xl border border-gray-200 bg-white px-6 py-5">
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
      {phase.tip && (
        <div className="mt-3.5 rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-[13px] leading-[1.7] text-gray-700">
          {phase.tip}
        </div>
      )}
    </div>
  );
}
