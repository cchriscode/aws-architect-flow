"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { generateSummary, type ArchSummary } from "@/lib/summary";
import type { WizardState, Architecture } from "@/lib/types";
import { useDict, useLang } from "@/lib/i18n/context";
import {
  Wrench,
  ClipboardList,
  AlertTriangle,
  BarChart3,
  Users,
  Calendar,
  ChevronDown,
  ChevronUp,
  ChevronRight,
} from "lucide-react";

interface SummaryViewProps {
  state: WizardState;
  arch?: Architecture;
  onNavigateTab?: (tabId: string) => void;
  issues?: { errors: number; warnings: number; criticalCount: number };
}

export function SummaryView({ state, arch, onNavigateTab, issues }: SummaryViewProps) {
  const t = useDict();
  const { lang } = useLang();
  const summary = useMemo(
    () => generateSummary(state, arch ? { arch } : undefined, lang),
    [state, arch, lang]
  );

  const [teamOpen, setTeamOpen] = useState(false);
  const [rolloutOpen, setRolloutOpen] = useState(false);

  // Build quick-action improvement items
  const improvements: { label: string; tabId: string }[] = [];
  const errorCount = issues?.errors ?? summary.stats.errors;
  if (errorCount > 0) {
    improvements.push({
      label: `${t.summaryView.viewTab} ${errorCount} validation errors`,
      tabId: "validate",
    });
  }
  if (summary.stats.wafrScore < 80) {
    improvements.push({
      label: `${t.summaryView.viewTab} — WAFR ${summary.stats.wafrScore}pts`,
      tabId: "wafr",
    });
  }
  if (summary.stats.monthlyCost > 1000) {
    improvements.push({
      label: `${t.summaryView.viewTab} — $${summary.stats.monthlyCost.toLocaleString()}/mo`,
      tabId: "cost",
    });
  }

  return (
    <div className="space-y-4">
      {/* Warnings banner — top */}
      {summary.warnings.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          {summary.warnings.map((w, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-xs leading-relaxed text-red-700"
            >
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-500" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

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
          label={t.summaryView.validation}
          value={
            summary.stats.errors > 0
              ? t.summaryView.validationErrors(summary.stats.errors)
              : summary.stats.warnings > 0
                ? t.summaryView.validationWarnings(summary.stats.warnings)
                : t.summaryView.validationPass
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

      {/* Top 3 Improvements */}
      {improvements.length > 0 && onNavigateTab && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-3 text-sm font-bold text-gray-900">
            {t.summaryView.topImprovements}
          </div>
          <div className="flex flex-col gap-2">
            {improvements.slice(0, 3).map((item, i) => (
              <button
                key={i}
                onClick={() => onNavigateTab(item.tabId)}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-left text-xs font-medium text-gray-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
              >
                <span>{item.label}</span>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Complexity Meter */}
      <ComplexityMeter complexity={summary.complexity} />

      {/* Key Services */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-3 flex items-center gap-1.5 text-sm font-bold text-gray-900">
          <Wrench className="h-4 w-4 text-gray-500" />
          {t.summaryView.keyServices}
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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

      {/* Team Requirements — Accordion */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <button
          onClick={() => setTeamOpen((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-4 text-left"
        >
          <div className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
            <Users className="h-4 w-4 text-gray-500" />
            {t.summaryView.requiredTeam}
          </div>
          {teamOpen ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </button>
        {teamOpen && (
          <div className="border-t border-gray-100 px-5 pb-4 pt-3">
            <TeamContent teamReqs={summary.teamReqs} />
          </div>
        )}
      </div>

      {/* Rollout Roadmap — Accordion */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <button
          onClick={() => setRolloutOpen((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-4 text-left"
        >
          <div className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
            <Calendar className="h-4 w-4 text-gray-500" />
            {t.summaryView.rolloutRoadmap}
          </div>
          {rolloutOpen ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </button>
        {rolloutOpen && (
          <div className="border-t border-gray-100 px-5 pb-4 pt-3">
            <RolloutContent rollout={summary.rolloutPath} />
          </div>
        )}
      </div>

      {/* Next Steps */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-3 flex items-center gap-1.5 text-sm font-bold text-gray-900">
          <ClipboardList className="h-4 w-4 text-gray-500" />
          {t.summaryView.nextSteps}
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
  const t = useDict();
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
        <span className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
          <BarChart3 className="h-4 w-4 text-gray-500" />
          {t.summaryView.complexity}
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

function TeamContent({
  teamReqs,
}: {
  teamReqs: ArchSummary["teamReqs"];
}) {
  const t = useDict();
  return (
    <>
      <div className="mb-2 text-xs text-gray-700">
        {t.summaryView.minDevsBefore}<span className="font-bold text-indigo-600">{teamReqs.minDevs}</span>{t.summaryView.minDevsAfter}
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
    </>
  );
}

function RolloutContent({
  rollout,
}: {
  rollout: ArchSummary["rolloutPath"];
}) {
  return (
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
  );
}
