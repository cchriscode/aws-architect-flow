"use client";

import type { WizardState, ValidationIssue } from "@/lib/types";
import { validateState } from "@/lib/validate";
import { useDict, useLang } from "@/lib/i18n/context";

interface ValidationViewProps {
  state: WizardState;
  onEdit?: (phaseId: string) => void;
}

function IssueCard({
  issue,
  phaseLabels,
  onEdit,
  relatedPhaseLabel,
}: {
  issue: ValidationIssue;
  phaseLabels: Record<string, string>;
  onEdit?: (phaseId: string) => void;
  relatedPhaseLabel: string;
}) {
  const isError = issue.severity === "error";
  return (
    <div
      className={`mb-3 rounded-[10px] border-[1.5px] px-5 py-4 ${
        isError
          ? "border-red-300 bg-red-50"
          : "border-amber-200 bg-amber-50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-xl">
          {isError ? "\u2757" : "\u26A0\uFE0F"}
        </div>
        <div className="flex-1">
          <div
            className={`mb-1 text-sm font-bold ${
              isError ? "text-red-600" : "text-yellow-800"
            }`}
          >
            {issue.title}
          </div>
          <div className="mb-2 text-[13px] leading-relaxed text-gray-700">
            {issue.message}
          </div>
          {issue.phases && (
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[11px] text-gray-500">{relatedPhaseLabel}</span>
              {issue.phases.map((p) => (
                <span
                  key={p}
                  onClick={() => onEdit && onEdit(p)}
                  className={`cursor-pointer rounded px-2 py-0.5 text-[11px] font-semibold ${
                    isError
                      ? "bg-red-100 text-red-900"
                      : "bg-amber-100 text-yellow-800"
                  }`}
                >
                  {phaseLabels[p] || p} {"\u2192"}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ValidationView({ state, onEdit }: ValidationViewProps) {
  const t = useDict();
  const { lang } = useLang();
  const issues = validateState(state, lang);
  const errors = issues.filter((i) => i.severity === "error");
  const warns = issues.filter((i) => i.severity === "warn");

  const phaseLabels: Record<string, string> = {};
  t.phases.forEach((p) => (phaseLabels[p.id] = p.label));

  if (issues.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
        <div className="mb-4 text-5xl">{"\u2705"}</div>
        <div className="mb-2 text-xl font-bold text-emerald-600">
          {t.validationView.noIssues}
        </div>
        <div className="text-sm text-gray-500">
          {t.validationView.noIssuesDesc}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-[1fr_280px]">
      <div>
        {errors.length > 0 && (
          <div className="mb-5">
            <div className="mb-3 flex items-center gap-2 text-[15px] font-bold text-red-600">
              <span>{t.validationView.mustFix}</span>
              <span className="rounded-xl bg-red-600 px-2 py-0.5 text-xs text-white">
                {t.validationView.count(errors.length)}
              </span>
            </div>
            {errors.map((issue, i) => (
              <IssueCard
                key={i}
                issue={issue}
                phaseLabels={phaseLabels}
                onEdit={onEdit}
                relatedPhaseLabel={t.validationView.relatedPhase}
              />
            ))}
          </div>
        )}
        {warns.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2 text-[15px] font-bold text-yellow-800">
              <span>{t.validationView.reviewRecommended}</span>
              <span className="rounded-xl bg-amber-500 px-2 py-0.5 text-xs text-white">
                {t.validationView.count(warns.length)}
              </span>
            </div>
            {warns.map((issue, i) => (
              <IssueCard
                key={i}
                issue={issue}
                phaseLabels={phaseLabels}
                onEdit={onEdit}
                relatedPhaseLabel={t.validationView.relatedPhase}
              />
            ))}
          </div>
        )}
      </div>
      <div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-3 text-[13px] font-bold text-gray-700">
            {t.validationView.summaryTitle}
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2">
              <span className="text-[13px] font-semibold text-red-600">
                {t.validationView.errors}
              </span>
              <span className="text-lg font-bold text-red-600">
                {errors.length}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2">
              <span className="text-[13px] font-semibold text-yellow-800">
                {t.validationView.warnings}
              </span>
              <span className="text-lg font-bold text-yellow-800">
                {warns.length}
              </span>
            </div>
          </div>
          <div className="mt-3.5 text-[11px] leading-relaxed text-gray-400">
            {t.validationView.errorDesc}
            <br />
            {t.validationView.warningDesc}
          </div>
        </div>
      </div>
    </div>
  );
}
