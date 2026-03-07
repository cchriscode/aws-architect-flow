"use client";

import { cn } from "@/lib/utils";
import type { Phase } from "@/lib/types";

interface ProgressBarProps {
  phases: Phase[];
  currentPhase: string;
  completedPhases: Set<string>;
  onJump: (phaseId: string) => void;
}

export function ProgressBar({
  phases,
  currentPhase,
  completedPhases,
  onJump,
}: ProgressBarProps) {
  return (
    <div className="border-b border-gray-200 bg-white px-6 py-3 overflow-x-auto">
      <div className="flex items-center gap-0 min-w-fit">
        {phases.map((p, i) => {
          const done = completedPhases.has(p.id);
          const active = p.id === currentPhase;
          return (
            <div key={p.id} className="flex items-center">
              <div
                onClick={() => done && onJump(p.id)}
                className={cn(
                  "flex flex-col items-center gap-1 px-1.5",
                  done ? "cursor-pointer" : "cursor-default"
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition-all",
                    active
                      ? "border-2 border-indigo-800 bg-indigo-600 text-white"
                      : done
                        ? "border-2 border-transparent bg-emerald-600 text-white"
                        : "border-2 border-transparent bg-gray-200 text-gray-400"
                  )}
                >
                  {done && !active ? "\u2713" : p.no}
                </div>
                <div
                  className={cn(
                    "whitespace-nowrap text-[9px]",
                    active
                      ? "font-bold text-indigo-600"
                      : done
                        ? "font-normal text-emerald-600"
                        : "font-normal text-gray-400"
                  )}
                >
                  {p.label}
                </div>
              </div>
              {i < phases.length - 1 && (
                <div
                  className={cn(
                    "mb-3 h-0.5 w-4 shrink-0",
                    done ? "bg-emerald-600" : "bg-gray-200"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
