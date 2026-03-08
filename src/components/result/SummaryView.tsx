"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { generateSummary, type ArchSummary } from "@/lib/summary";
import type { WizardState, Architecture } from "@/lib/types";
import { useDict, useLang } from "@/lib/i18n/context";

interface SummaryViewProps {
  state: WizardState;
  arch?: Architecture;
}

export function SummaryView({ state, arch }: SummaryViewProps) {
  const t = useDict();
  const { lang } = useLang();
  const summary = useMemo(
    () => generateSummary(state, arch ? { arch } : undefined, lang),
    [state, arch, lang]
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
          label={t.summaryView.monthlyEstimate}
          value={`$${summary.stats.monthlyCost.toLocaleString()}`}
          color="text-emerald-600"
        />
        <StatBox
          label={t.summaryView.availabilityTarget}
          value={`${summary.stats.availability}%`}
          color="text-blue-600"
        />
        <StatBox
          label={t.summaryView.wafrScore}
          value={`${summary.stats.wafrScore}${t.summaryView.points}`}
          color="text-violet-600"
        />
        <StatBox
          label={lang === "ko" ? "검증 결과" : "Validation"}
          value={
            summary.stats.errors > 0
              ? `❗${summary.stats.errors} ${lang === "ko" ? "오류" : "errors"}`
              : summary.stats.warnings > 0
                ? `⚠️${summary.stats.warnings} ${lang === "ko" ? "주의" : "warnings"}`
                : `✅ ${lang === "ko" ? "통과" : "Pass"}`
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
      <ComplexityMeter complexity={summary.complexity} lang={lang} />

      {/* Key Services */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-3 text-sm font-bold text-gray-900">
          {t.summaryView.keyServices}
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
      <TeamSection teamReqs={summary.teamReqs} lang={lang} />

      {/* Rollout Roadmap */}
      <RolloutSection rollout={summary.rolloutPath} lang={lang} />

      {/* Next Steps */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-3 text-sm font-bold text-gray-900">
          {"📋"} {lang === "ko" ? "다음 할 일" : "Next Steps"}
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
            {"⚠️"} {lang === "ko" ? "주의사항" : "Warnings"}
          </div>
          <ul className="space-y-1">
            {summary.warnings.map((w, i) => (
              <li key={i} className="text-xs leading-relaxed text-red-700">
                {"•"} {w}
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
  lang,
}: {
  complexity: ArchSummary["complexity"];
  lang: string;
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
          {"📊"} {lang === "ko" ? "복잡도" : "Complexity"}
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
  lang,
}: {
  teamReqs: ArchSummary["teamReqs"];
  lang: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 text-sm font-bold text-gray-900">
        {"👥"} {lang === "ko" ? "필요 팀 구성" : "Required Team"}
      </div>
      <div className="mb-2 text-xs text-gray-700">
        {lang === "ko"
          ? <>최소 <span className="font-bold text-indigo-600">{teamReqs.minDevs}명</span> 권장</>
          : <>Min. <span className="font-bold text-indigo-600">{teamReqs.minDevs}</span> recommended</>
        }
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
  lang,
}: {
  rollout: ArchSummary["rolloutPath"];
  lang: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 text-sm font-bold text-gray-900">
        {"📅"} {lang === "ko" ? "단계별 구축 로드맵" : "Rollout Roadmap"}
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
                    {"•"} {task}
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
