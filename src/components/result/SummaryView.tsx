"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { generateSummary, type ArchSummary } from "@/lib/summary";
import type { WizardState, Architecture } from "@/lib/types";

interface SummaryViewProps {
  state: WizardState;
  arch?: Architecture;
}

export function SummaryView({ state, arch }: SummaryViewProps) {
  const summary = useMemo(
    () => generateSummary(state, arch ? { arch } : undefined),
    [state, arch]
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-4">
        <div className="mb-1 text-lg font-bold text-indigo-700">
          {summary.headline}
        </div>
        <div className="text-sm text-gray-600">{summary.oneLiner}</div>
      </div>

      {/* Key Stats 4-grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox
          label="\uC6D4 \uC608\uC0C1 \uBE44\uC6A9"
          value={`$${summary.stats.monthlyCost.toLocaleString()}`}
          color="text-emerald-600"
        />
        <StatBox
          label="\uAC00\uC6A9\uC131 \uBAA9\uD45C"
          value={`${summary.stats.availability}%`}
          color="text-blue-600"
        />
        <StatBox
          label="설계 우수성 점수"
          value={`${summary.stats.wafrScore}\uC810`}
          color="text-violet-600"
        />
        <StatBox
          label="\uAC80\uC99D \uACB0\uACFC"
          value={
            summary.stats.errors > 0
              ? `\u2757${summary.stats.errors} \uC624\uB958`
              : summary.stats.warnings > 0
                ? `\u26A0\uFE0F${summary.stats.warnings} \uC8FC\uC758`
                : "\u2705 \uD1B5\uACFC"
          }
          color={
            summary.stats.errors > 0
              ? "text-red-600"
              : summary.stats.warnings > 0
                ? "text-amber-600"
                : "text-emerald-600"
          }
        />
      </div>

      {/* Complexity Meter */}
      <ComplexityMeter complexity={summary.complexity} />

      {/* Key Services */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-3 text-sm font-bold text-gray-900">
          {"\uD83D\uDEE0\uFE0F"} \uD575\uC2EC \uC11C\uBE44\uC2A4 \uAD6C\uC131
        </div>
        <div className="grid grid-cols-2 gap-2">
          {summary.keyServices.map((svc, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
            >
              <span className="mt-0.5 shrink-0 text-base">{svc.icon}</span>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-900">
                  {svc.name}
                </div>
                {svc.role && (
                  <div className="truncate text-[10px] text-gray-500">
                    {svc.role}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team Requirements */}
      <TeamSection teamReqs={summary.teamReqs} />

      {/* Rollout Roadmap */}
      <RolloutSection rollout={summary.rolloutPath} />

      {/* Next Steps */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-3 text-sm font-bold text-gray-900">
          {"\uD83D\uDCCB"} \uB2E4\uC74C \uD560 \uC77C
        </div>
        <ol className="space-y-1.5">
          {summary.nextSteps.map((step, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-xs text-gray-700"
            >
              <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-600">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* Warnings */}
      {summary.warnings.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <div className="mb-2 text-sm font-bold text-red-600">
            {"\u26A0\uFE0F"} \uC8FC\uC758\uC0AC\uD56D
          </div>
          <ul className="space-y-1">
            {summary.warnings.map((w, i) => (
              <li key={i} className="text-xs leading-relaxed text-red-700">
                {"\u2022"} {w}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-center">
      <div className="mb-1 text-[10px] font-semibold text-gray-400">
        {label}
      </div>
      <div className={cn("text-base font-bold", color)}>{value}</div>
    </div>
  );
}

function ComplexityMeter({
  complexity,
}: {
  complexity: ArchSummary["complexity"];
}) {
  const pct = (complexity.score / 10) * 100;
  const barColor =
    complexity.score <= 3
      ? "bg-emerald-500"
      : complexity.score <= 5
        ? "bg-blue-500"
        : complexity.score <= 7
          ? "bg-amber-500"
          : "bg-red-500";
  const labelColor =
    complexity.score <= 3
      ? "text-emerald-600 bg-emerald-50 border-emerald-200"
      : complexity.score <= 5
        ? "text-blue-600 bg-blue-50 border-blue-200"
        : complexity.score <= 7
          ? "text-amber-600 bg-amber-50 border-amber-200"
          : "text-red-600 bg-red-50 border-red-200";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-bold text-gray-900">
          {"\uD83D\uDCCA"} \uBCF5\uC7A1\uB3C4
        </span>
        <span
          className={cn(
            "rounded-md border px-2 py-0.5 text-xs font-bold",
            labelColor
          )}
        >
          {complexity.level} ({complexity.score}/10)
        </span>
      </div>
      <div className="mb-2 h-2.5 overflow-hidden rounded-full bg-gray-100">
        <div
          className={cn("h-full rounded-full transition-all", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {complexity.factors.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {complexity.factors.map((f, i) => (
            <span
              key={i}
              className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] text-gray-500"
            >
              {f}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function TeamSection({
  teamReqs,
}: {
  teamReqs: ArchSummary["teamReqs"];
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 text-sm font-bold text-gray-900">
        {"\uD83D\uDC65"} \uD544\uC694 \uD300 \uAD6C\uC131
      </div>
      <div className="mb-2 text-xs text-gray-700">
        \uCD5C\uC18C <span className="font-bold text-indigo-600">{teamReqs.minDevs}\uBA85</span> \uAD8C\uC7A5
      </div>
      <div className="mb-2 flex flex-wrap gap-1">
        {teamReqs.roles.map((r, i) => (
          <span
            key={i}
            className="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600"
          >
            {r}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-1">
        {teamReqs.skills.map((s, i) => (
          <span
            key={i}
            className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] text-gray-500"
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

function RolloutSection({
  rollout,
}: {
  rollout: ArchSummary["rolloutPath"];
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 text-sm font-bold text-gray-900">
        {"\uD83D\uDCC5"} \uB2E8\uACC4\uBCC4 \uAD6C\uCD95 \uB85C\uB4DC\uB9F5
      </div>
      <div className="space-y-3">
        {rollout.map((step, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                {i + 1}
              </div>
              {i < rollout.length - 1 && (
                <div className="w-px flex-1 bg-indigo-200" />
              )}
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-900">
                  {step.phase}
                </span>
                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                  {step.duration}
                </span>
              </div>
              <ul className="mt-1 space-y-0.5">
                {step.tasks.map((task, j) => (
                  <li key={j} className="text-[11px] text-gray-600">
                    {"\u2022"} {task}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
