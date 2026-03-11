"use client";

import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useDict } from "@/lib/i18n/context";
import { ChevronLeft, ChevronRight, Check, List, X } from "lucide-react";
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
  const t = useDict();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);
  const [showPhaseList, setShowPhaseList] = useState(false);

  const currentIndex = phases.findIndex((p) => p.id === currentPhase);
  const currentPhaseObj = phases[currentIndex];

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
    <div className="border-b border-gray-200 bg-white">
      {/* Mobile compact bar */}
      <div className="flex items-center gap-2 px-3 py-2.5 md:hidden">
        <button
          type="button"
          disabled={currentIndex <= 0}
          onClick={() => currentIndex > 0 && onJump(phases[currentIndex - 1].id)}
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors",
            currentIndex <= 0
              ? "text-gray-300"
              : "text-gray-600 hover:bg-gray-100 active:bg-gray-200"
          )}
          aria-label="Previous phase"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1 text-center">
          <span className="text-sm font-semibold text-gray-900">
            {currentIndex + 1}/{phases.length}
          </span>
          <span className="mx-1.5 text-gray-400">&mdash;</span>
          <span className="text-sm text-gray-600 truncate">
            {currentPhaseObj?.label}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowPhaseList((v) => !v)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
          aria-label={t.wizard.phaseList}
        >
          <List className="h-5 w-5" />
        </button>

        <button
          type="button"
          disabled={currentIndex >= phases.length - 1}
          onClick={() =>
            currentIndex < phases.length - 1 &&
            onJump(phases[currentIndex + 1].id)
          }
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors",
            currentIndex >= phases.length - 1
              ? "text-gray-300"
              : "text-gray-600 hover:bg-gray-100 active:bg-gray-200"
          )}
          aria-label="Next phase"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile phase list overlay */}
      {showPhaseList && (
        <div className="absolute inset-x-0 top-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/30"
            onClick={() => setShowPhaseList(false)}
          />
          <div className="relative mx-3 mt-14 max-h-[70vh] overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3">
              <span className="text-sm font-bold text-gray-900">
                {t.wizard.phaseList}
              </span>
              <button
                type="button"
                onClick={() => setShowPhaseList(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <ul className="py-1">
              {phases.map((p) => {
                const done = completedPhases.has(p.id);
                const active = p.id === currentPhase;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onJump(p.id);
                        setShowPhaseList(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                        active
                          ? "bg-indigo-50"
                          : "hover:bg-gray-50"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                          active
                            ? "bg-indigo-600 text-white"
                            : done
                              ? "bg-emerald-600 text-white"
                              : "bg-gray-200 text-gray-400"
                        )}
                      >
                        {done && !active ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          p.no
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-sm",
                          active
                            ? "font-bold text-indigo-600"
                            : done
                              ? "text-emerald-700"
                              : "text-gray-500"
                        )}
                      >
                        {p.label}
                      </span>
                      {done && !active && (
                        <Check className="ml-auto h-4 w-4 text-emerald-500" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {/* Desktop horizontal bar */}
      <div
        ref={scrollRef}
        className="scrollbar-hide hidden px-2 py-3 overflow-x-auto md:block md:px-6"
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
                        "flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition-all",
                        active
                          ? "border-2 border-indigo-800 bg-indigo-600 text-white"
                          : "border-2 border-transparent bg-emerald-600 text-white"
                      )}
                    >
                      {!active ? "\u2713" : p.no}
                    </div>
                    <div
                      className={cn(
                        "whitespace-nowrap text-xs",
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
                        "flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition-all",
                        active
                          ? "border-2 border-indigo-800 bg-indigo-600 text-white"
                          : "border-2 border-transparent bg-gray-200 text-gray-400"
                      )}
                    >
                      {p.no}
                    </div>
                    <div
                      className={cn(
                        "whitespace-nowrap text-xs",
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
    </div>
  );
}
