"use client";

import type { WizardState, ValidationIssue } from "@/lib/types";
import { validateState } from "@/lib/validate";

const PHASE_LIST = [
  { id: "workload", label: "서비스 유형" },
  { id: "scale", label: "규모" },
  { id: "team", label: "팀" },
  { id: "slo", label: "SLO" },
  { id: "compliance", label: "규정 준수" },
  { id: "network", label: "네트워크" },
  { id: "compute", label: "컴퓨팅" },
  { id: "data", label: "데이터" },
  { id: "integration", label: "통합" },
  { id: "edge", label: "엣지" },
  { id: "cicd", label: "CI/CD" },
  { id: "cost", label: "비용" },
  { id: "platform", label: "플랫폼" },
  { id: "appstack", label: "앱 스택" },
];

interface ValidationViewProps {
  state: WizardState;
  onEdit?: (phaseId: string) => void;
}

function IssueCard({
  issue,
  phaseLabels,
  onEdit,
}: {
  issue: ValidationIssue;
  phaseLabels: Record<string, string>;
  onEdit?: (phaseId: string) => void;
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
              <span className="text-[11px] text-gray-500">관련 Phase:</span>
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
  const issues = validateState(state);
  const errors = issues.filter((i) => i.severity === "error");
  const warns = issues.filter((i) => i.severity === "warn");
  const phaseLabels: Record<string, string> = {};
  PHASE_LIST.forEach((p) => (phaseLabels[p.id] = p.label));

  if (issues.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
        <div className="mb-4 text-5xl">{"\u2705"}</div>
        <div className="mb-2 text-xl font-bold text-emerald-600">
          모순 없음!
        </div>
        <div className="text-sm text-gray-500">
          선택하신 모든 구성 요소가 서로 일관성 있게 구성되었습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[1fr_280px] gap-5">
      <div>
        {errors.length > 0 && (
          <div className="mb-5">
            <div className="mb-3 flex items-center gap-2 text-[15px] font-bold text-red-600">
              <span>{"\u2757"} 반드시 수정 필요</span>
              <span className="rounded-xl bg-red-600 px-2 py-0.5 text-xs text-white">
                {errors.length}건
              </span>
            </div>
            {errors.map((issue, i) => (
              <IssueCard
                key={i}
                issue={issue}
                phaseLabels={phaseLabels}
                onEdit={onEdit}
              />
            ))}
          </div>
        )}
        {warns.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2 text-[15px] font-bold text-yellow-800">
              <span>{"\u26A0\uFE0F"} 검토 권장</span>
              <span className="rounded-xl bg-amber-500 px-2 py-0.5 text-xs text-white">
                {warns.length}건
              </span>
            </div>
            {warns.map((issue, i) => (
              <IssueCard
                key={i}
                issue={issue}
                phaseLabels={phaseLabels}
                onEdit={onEdit}
              />
            ))}
          </div>
        )}
      </div>
      <div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-3 text-[13px] font-bold text-gray-700">
            검증 결과 요약
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2">
              <span className="text-[13px] font-semibold text-red-600">
                {"\u2757"} 오류
              </span>
              <span className="text-lg font-bold text-red-600">
                {errors.length}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2">
              <span className="text-[13px] font-semibold text-yellow-800">
                {"\u26A0\uFE0F"} 경고
              </span>
              <span className="text-lg font-bold text-yellow-800">
                {warns.length}
              </span>
            </div>
          </div>
          <div className="mt-3.5 text-[11px] leading-relaxed text-gray-400">
            오류({"\u2757"})는 아키텍처 목표를 달성할 수 없거나 규정 위반이
            발생하는 조합입니다.
            <br />
            경고({"\u26A0\uFE0F"})는 베스트 프랙티스에서 벗어나 위험도가
            높아지는 경우입니다.
          </div>
        </div>
      </div>
    </div>
  );
}
