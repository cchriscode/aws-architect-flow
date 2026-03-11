"use client";

import { useRef, useEffect } from "react";
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current && activeRef.current) {
      const container = scrollRef.current;
      const el = activeRef.current;
      container.scrollTo({
        left: el.offsetLeft - container.clientWidth / 2 + el.offsetWidth / 2,
        behavior: "smooth",
      });
    }
  }, [currentPhase]);

  return (
    <div
      ref={scrollRef}
      className="scrollbar-hide border-b border-gray-200 bg-white px-2 py-3 overflow-x-auto md:px-6"
    >
      <div className="flex items-center gap-0 min-w-fit">
        {phases.map((p, i) => {
          const done = completedPhases.has(p.id);
          const active = p.id === currentPhase;
          return (
            <div
              key={p.id}
              className="flex items-center"
              ref={active ? activeRef : undefined}
            >
              {done ? (
                <button
                  type="button"
                  onClick={() => onJump(p.id)}
                  className="flex cursor-pointer flex-col items-center gap-1 px-1.5"
                  aria-label={p.label}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold transition-all md:h-7 md:w-7",
                      active
                        ? "border-2 border-indigo-800 bg-indigo-600 text-white"
                        : "border-2 border-transparent bg-emerald-600 text-white"
                    )}
                  >
                    {!active ? "\u2713" : p.no}
                  </div>
                  <div
                    className={cn(
                      "hidden whitespace-nowrap text-[9px] md:block",
                      active ? "font-bold text-indigo-600" : "font-normal text-emerald-600"
                    )}
                  >
                    {p.label}
                  </div>
                </button>
              ) : (
                <div className="flex cursor-default flex-col items-center gap-1 px-1.5">
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold transition-all md:h-7 md:w-7",
                      active
                        ? "border-2 border-indigo-800 bg-indigo-600 text-white"
                        : "border-2 border-transparent bg-gray-200 text-gray-400"
                    )}
                  >
                    {p.no}
                  </div>
                  <div
                    className={cn(
                      "hidden whitespace-nowrap text-[9px] md:block",
                      active ? "font-bold text-indigo-600" : "font-normal text-gray-400"
                    )}
                  >
                    {p.label}
                  </div>
                </div>
              )}
              {i < phases.length - 1 && (
                <div
                  className={cn(
                    "mb-3 h-0.5 w-2 shrink-0 md:w-4",
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
