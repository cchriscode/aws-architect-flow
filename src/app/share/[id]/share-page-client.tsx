"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useDict, useLang } from "@/lib/i18n/context";
import { generateArchitecture } from "@/lib/architecture";
import { validateState } from "@/lib/validate";
import { wellArchitectedScore } from "@/lib/wafr";
import { estimateMonthlyCost } from "@/lib/cost";
import { generateCodeSnippets } from "@/lib/code-snippets";

import { SummaryView } from "@/components/result/SummaryView";
import { ArchOutput } from "@/components/result/ArchOutput";
import { DiagramView } from "@/components/result/DiagramView";
import { ValidationView } from "@/components/result/ValidationView";
import { ChecklistView } from "@/components/result/ChecklistView";
import { SecurityGroupView } from "@/components/result/SecurityGroupView";
import { CostView } from "@/components/result/CostView";
import { WafrView } from "@/components/result/WafrView";
import { CodeView } from "@/components/result/CodeView";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import type { WizardState } from "@/lib/types";

interface SharePageClientProps {
  state: Record<string, unknown>;
  headline: string;
  monthlyCost: number;
  wafrScore: number;
  serviceCount: number;
}

export function SharePageClient({
  state,
  headline,
  monthlyCost,
  wafrScore,
  serviceCount,
}: SharePageClientProps) {
  const t = useDict();
  const { lang } = useLang();
  const [activeTab, setActiveTab] = useState("summary");

  const wizardState = state as WizardState;
  const arch = useMemo(() => generateArchitecture(wizardState, lang), [wizardState, lang]);

  const resultTabs = useMemo(() => {
    const _issues = validateState(wizardState, lang);
    const _errs = _issues.filter((i) => i.severity === "error").length;
    const _warns = _issues.filter((i) => i.severity === "warn").length;
    const _wa = wellArchitectedScore(wizardState, lang);
    const _cost = estimateMonthlyCost(wizardState, lang);

    const checklistLabel = t.result.tabs.checklist;

    let codeLabel = t.result.tabs.code;
    try {
      codeLabel = t.result.tabs.codeCnt(generateCodeSnippets(wizardState).length);
    } catch { /* ignore */ }

    return [
      { id: "summary", label: t.result.tabs.summary },
      { id: "cards", label: t.result.tabs.serviceDetail },
      { id: "diagram", label: t.result.tabs.diagram },
      {
        id: "validate",
        label:
          t.result.tabs.validation +
          (_errs > 0 ? ` ❗${_errs}` : _warns > 0 ? ` ⚠️${_warns}` : " ✅"),
      },
      { id: "checklist", label: checklistLabel },
      { id: "sg", label: t.result.tabs.securityGroups },
      { id: "cost", label: t.result.tabs.cost(_cost.totalMid.toLocaleString()) },
      { id: "wafr", label: t.result.tabs.wafr(_wa.overall) },
      { id: "code", label: codeLabel },
    ];
  }, [wizardState, t, lang]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-4 py-8">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-5 text-center">
            <div className="mb-1 text-[11px] font-medium text-gray-400">
              {t.share.sharedDesign}
            </div>
            <h1 className="mb-5 text-xl font-extrabold text-gray-900 md:text-2xl">
              {headline}
            </h1>
            <div className="flex justify-center gap-3">
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-center">
                <div className="text-[10px] text-gray-400">
                  {t.share.monthlyCost}
                </div>
                <div className="text-base font-bold text-emerald-600">
                  ${monthlyCost.toLocaleString()}
                  <span className="text-[10px] font-normal text-gray-400">
                    {t.share.perMonth}
                  </span>
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-center">
                <div className="text-[10px] text-gray-400">WAFR</div>
                <div className="text-base font-bold text-violet-600">
                  {wafrScore}
                  <span className="text-[10px] font-normal text-gray-400">pts</span>
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-center">
                <div className="text-[10px] text-gray-400">{t.share.services}</div>
                <div className="text-base font-bold text-blue-600">{serviceCount}</div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/"
              className="inline-block rounded-lg border border-indigo-200 bg-indigo-50 px-6 py-2 text-sm font-semibold text-indigo-600 transition-colors hover:bg-indigo-100"
            >
              {t.share.designYourOwn}
            </Link>
          </div>
        </div>
      </div>

      {/* Result tabs + content — same as main page */}
      <ErrorBoundary>
        <div className="mx-auto max-w-[1400px] px-3 py-4 md:px-7 md:py-6">
          {/* Tab toggle */}
          <div className="mb-4 scrollbar-hide flex gap-1 overflow-x-auto rounded-[10px] bg-gray-200/60 p-1 md:flex-wrap">
            {resultTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "shrink-0 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-semibold transition-all",
                  activeTab === tab.id
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "bg-transparent text-gray-500"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === "summary" ? (
            <SummaryView state={wizardState} arch={arch} />
          ) : activeTab === "cards" ? (
            <ArchOutput arch={arch} />
          ) : activeTab === "diagram" ? (
            <DiagramView arch={arch} state={wizardState} />
          ) : activeTab === "validate" ? (
            <ValidationView state={wizardState} />
          ) : activeTab === "cost" ? (
            <CostView state={wizardState} />
          ) : activeTab === "wafr" ? (
            <WafrView state={wizardState} />
          ) : activeTab === "checklist" ? (
            <ChecklistView state={wizardState} />
          ) : activeTab === "sg" ? (
            <SecurityGroupView state={wizardState} />
          ) : activeTab === "code" ? (
            <CodeView state={wizardState} />
          ) : null}
        </div>
      </ErrorBoundary>
    </div>
  );
}
