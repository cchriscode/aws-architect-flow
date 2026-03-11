"use client";

import { cn } from "@/lib/utils";
import { Lightbulb, AlertTriangle } from "lucide-react";
import type { Question, InfoEntry, Recommendation } from "@/lib/types";
import type { GuardrailWarning } from "@/lib/guardrails";
import { useDict } from "@/lib/i18n/context";

interface QuestionCardProps {
  question: Question;
  value: string | string[] | undefined;
  onChange: (val: string | string[]) => void;
  onInfo?: (info: InfoEntry) => void;
  recommendations?: Record<string, Recommendation>;
  infoDb?: Record<string, InfoEntry>;
  guardrails?: Record<string, GuardrailWarning>;
}

export function QuestionCard({
  question,
  value,
  onChange,
  onInfo,
  recommendations = {},
  infoDb = {},
  guardrails = {},
}: QuestionCardProps) {
  const t = useDict();
  if (question.skip) return null;
  const isMulti = question.multi;
  const vals = Array.isArray(value) ? value : value ? [value] : [];

  function toggle(v: string) {
    if (!isMulti) {
      onChange(v);
      return;
    }
    if (v === "none" || v === "no") {
      onChange([v]);
      return;
    }
    let next = vals.includes(v)
      ? vals.filter((x) => x !== v)
      : [...vals.filter((x) => x !== "none" && x !== "no"), v];
    if (next.length === 0) next = ["none"];
    onChange(next);
  }

  return (
    <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4 md:p-6">
      <div className="mb-1.5 text-[15px] font-bold text-gray-900">
        {question.q}
      </div>
      {question.help && (
        <div className="mb-4 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs leading-relaxed text-gray-500">
          {"💬"} {question.help}
        </div>
      )}
      {isMulti && (
        <div className="mb-2.5 text-[11px] font-semibold text-indigo-600">
          {t.questionCard.helpToggle}
        </div>
      )}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {question.opts.map((opt) => {
          const selected = isMulti ? vals.includes(opt.v) : value === opt.v;
          const infoKey = infoDb[opt.v]
            ? opt.v
            : infoDb[opt.v + "_cert"]
              ? opt.v + "_cert"
              : null;
          const hasInfo = !!infoKey;
          const rec = recommendations[opt.v];
          const guard = guardrails[opt.v];

          const badgeColor = rec?.badge?.startsWith("⭐")
            ? "text-red-600 bg-red-50 border-red-300"
            : rec?.badge?.startsWith("💰")
              ? "text-emerald-600 bg-green-50 border-emerald-300"
              : "text-violet-600 bg-violet-50 border-violet-300";

          const reasonColor = rec?.badge?.startsWith("⭐")
            ? "text-red-600"
            : rec?.badge?.startsWith("💰")
              ? "text-emerald-600"
              : "text-violet-600";

          return (
            <button
              type="button"
              key={opt.v}
              onClick={() => toggle(opt.v)}
              className={cn(
                "relative flex cursor-pointer items-start gap-2.5 rounded-[10px] border-[1.5px] px-3.5 py-3 text-left transition-all",
                selected
                  ? "border-indigo-600 bg-indigo-50"
                  : "border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-violet-50"
              )}
            >
              {/* Radio/Checkbox indicator */}
              <div
                className={cn(
                  "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center transition-colors md:h-[18px] md:w-[18px]",
                  isMulti ? "rounded" : "rounded-full",
                  selected ? "bg-indigo-600" : "bg-gray-300"
                )}
              >
                {selected && (
                  <div
                    className={cn(
                      "bg-white",
                      isMulti ? "h-2 w-2 rounded-sm" : "h-2 w-2 rounded-full"
                    )}
                  />
                )}
              </div>

              {/* Content */}
              <div
                className={cn("min-w-0 flex-1", hasInfo ? "pr-6" : "")}
              >
                <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
                  <div
                    className={cn(
                      "text-[13px] font-semibold",
                      selected ? "text-indigo-600" : "text-gray-900"
                    )}
                  >
                    {opt.l}
                  </div>
                  {rec && (
                    <div
                      title={rec.reason}
                      className={cn(
                        "inline-flex shrink-0 cursor-help items-center gap-0.5 whitespace-nowrap rounded-[5px] border px-1.5 py-px text-[10px] font-bold",
                        badgeColor
                      )}
                    >
                      {rec.badge}
                    </div>
                  )}
                </div>
                {opt.d && (
                  <div className="text-[11px] leading-relaxed text-gray-500">
                    {opt.d}
                  </div>
                )}

                {/* Recommendation reason */}
                {rec && (
                  <div
                    className={cn(
                      "mt-1 flex items-start gap-1 text-[10px] leading-snug opacity-85",
                      reasonColor
                    )}
                  >
                    <Lightbulb className="mt-px h-3 w-3 shrink-0" />
                    <span>{rec.reason}</span>
                  </div>
                )}

                {/* Guardrail warning */}
                {guard && (
                  <div
                    className={cn(
                      "mt-1.5 flex items-start gap-1 rounded border px-2 py-1 text-[10px] leading-snug",
                      guard.level === "warning"
                        ? "border-red-200 bg-red-50 text-red-600"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                    )}
                  >
                    <AlertTriangle className="mt-px h-3 w-3 shrink-0" />
                    <span>{guard.message}</span>
                  </div>
                )}
              </div>

              {/* Info indicator */}
              {hasInfo && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onInfo && infoKey && onInfo(infoDb[infoKey]);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.stopPropagation();
                      e.preventDefault();
                      onInfo && infoKey && onInfo(infoDb[infoKey]);
                    }
                  }}
                  title={t.questionCard.moreInfo}
                  className={cn(
                    "absolute right-2.5 top-2.5 z-[2] flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[1.5px] font-serif text-[11px] font-extrabold leading-none transition-all hover:border-indigo-600 hover:bg-indigo-600 hover:text-white md:h-[22px] md:w-[22px]",
                    selected
                      ? "border-indigo-400 bg-indigo-100 text-indigo-600"
                      : "border-gray-300 bg-gray-100 text-gray-400"
                  )}
                >
                  i
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
