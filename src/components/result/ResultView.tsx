"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Server,
  Network,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ListChecks,
  Shield,
  DollarSign,
  Trophy,
  Code,
  X,
} from "lucide-react";

import { ArchOutput } from "@/components/result/ArchOutput";
import { DiagramView } from "@/components/result/DiagramView";
import { ValidationView } from "@/components/result/ValidationView";
import { ChecklistView } from "@/components/result/ChecklistView";
import { SecurityGroupView } from "@/components/result/SecurityGroupView";
import { CostView } from "@/components/result/CostView";
import { WafrView } from "@/components/result/WafrView";
import { CodeView } from "@/components/result/CodeView";
import { StateSummary } from "@/components/result/StateSummary";
import { SummaryView } from "@/components/result/SummaryView";
import { SlidePanel, SlidePanelTrigger } from "@/components/ui/slide-panel";

import { wellArchitectedScore } from "@/lib/wafr";
import { estimateMonthlyCost } from "@/lib/cost";
import { generateChecklist } from "@/lib/checklist";
import { generateCodeSnippets } from "@/lib/code-snippets";

import type { Dict } from "@/lib/i18n/types";
import type { Locale } from "@/lib/i18n/types";
import type { Architecture, ValidationIssue, WizardState } from "@/lib/types";
import type { PhaseDefinition } from "@/data/phases";

/* ------------------------------------------------------------------ */
/* Tab group definitions                                               */
/* ------------------------------------------------------------------ */

const TAB_GROUPS = [
  { id: "overview", tabs: ["summary", "cards", "diagram"] },
  { id: "risk", tabs: ["validate", "wafr", "sg"] },
  { id: "cost", tabs: ["cost"] },
  { id: "implementation", tabs: ["checklist", "code"] },
] as const;

type TabId = (typeof TAB_GROUPS)[number]["tabs"][number];
type GroupId = (typeof TAB_GROUPS)[number]["id"];

/* ------------------------------------------------------------------ */
/* Lucide icon mapping for each tab                                    */
/* ------------------------------------------------------------------ */

function tabIcon(tabId: string, errorCount: number, warnCount: number) {
  const cls = "h-3.5 w-3.5 shrink-0";
  switch (tabId) {
    case "summary":
      return <LayoutDashboard className={cls} />;
    case "cards":
      return <Server className={cls} />;
    case "diagram":
      return <Network className={cls} />;
    case "validate":
      if (errorCount > 0) return <AlertCircle className={cn(cls, "text-red-500")} />;
      if (warnCount > 0) return <AlertTriangle className={cn(cls, "text-amber-500")} />;
      return <CheckCircle2 className={cn(cls, "text-emerald-500")} />;
    case "checklist":
      return <ListChecks className={cls} />;
    case "sg":
      return <Shield className={cls} />;
    case "cost":
      return <DollarSign className={cls} />;
    case "wafr":
      return <Trophy className={cls} />;
    case "code":
      return <Code className={cls} />;
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */

interface ResultViewProps {
  arch: Architecture;
  allPhaseState: WizardState;
  completedPhases: Set<string>;
  phasesWithLabels: PhaseDefinition[];
  liveIssues: ValidationIssue[];
  activeTab: string;
  setActiveTab: (id: string) => void;
  onJump: (phaseId: string) => void;
  onLoginClick: () => void;
  session: unknown;
  saveToast: string;
  setSaveToast: (v: string) => void;
  t: Dict;
  lang: Locale;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function ResultView({
  arch,
  allPhaseState,
  completedPhases,
  phasesWithLabels,
  liveIssues,
  activeTab,
  setActiveTab,
  onJump,
  t,
  lang,
}: ResultViewProps) {
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  /* ---------- derived counts for icons ----------------------------- */
  const errorCount = liveIssues.filter((i) => i.severity === "error").length;
  const warnCount = liveIssues.filter((i) => i.severity === "warn").length;

  /* ---------- build tab metadata ----------------------------------- */
  const tabMeta = useMemo(() => {
    const _wa = wellArchitectedScore(allPhaseState, lang);
    const _cost = estimateMonthlyCost(allPhaseState, lang);

    let checklistLabel = t.result.tabs.checklist;
    try {
      const saved = JSON.parse(
        localStorage.getItem("aws_arch_checklist_v1") || "{}"
      );
      const cl = generateChecklist(allPhaseState, lang);
      const done = cl.phases.reduce(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (s: number, p: any) => s + p.items.filter((i: any) => saved[i.id]).length,
        0
      );
      const total = cl.totalItems;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      checklistLabel = t.result.tabs.checklistPct(pct);
    } catch (e) {
      console.warn("[ResultView] checklist label:", e);
    }

    let codeLabel = t.result.tabs.code;
    try {
      codeLabel = t.result.tabs.codeCnt(generateCodeSnippets(allPhaseState).length);
    } catch (e) {
      console.warn("[ResultView] code label:", e);
    }

    const strip = (s: string) => s.replace(/^[\p{Emoji_Presentation}\p{So}\s]+/u, "").trim();
    const map: Record<string, string> = {
      summary: strip(t.result.tabs.summary),
      cards: strip(t.result.tabs.serviceDetail),
      diagram: strip(t.result.tabs.diagram),
      validate: strip(t.result.tabs.validation)
        + (errorCount > 0 ? ` (${errorCount})` : warnCount > 0 ? ` (${warnCount})` : ""),
      checklist: strip(checklistLabel),
      sg: strip(t.result.tabs.securityGroups),
      cost: strip(t.result.tabs.cost(_cost.totalMid.toLocaleString())),
      wafr: strip(t.result.tabs.wafr(_wa.overall)),
      code: strip(codeLabel),
    };
    return map;
  }, [allPhaseState, liveIssues, t, lang, errorCount, warnCount]);

  /* ---------- current group/tab state ------------------------------ */
  const currentGroup: GroupId =
    TAB_GROUPS.find((g) => (g.tabs as readonly string[]).includes(activeTab))?.id ?? "overview";
  const currentGroupDef = TAB_GROUPS.find((g) => g.id === currentGroup)!;
  const hasSubTabs = currentGroupDef.tabs.length > 1;

  /* ---------- group label map from dict ----------------------------- */
  const groupLabels: Record<string, string> = {
    overview: t.result.tabGroups.overview,
    risk: t.result.tabGroups.risk,
    cost: t.result.tabGroups.cost,
    implementation: t.result.tabGroups.implementation,
  };

  /* ---------- handlers --------------------------------------------- */
  function handleGroupClick(groupId: string) {
    const group = TAB_GROUPS.find((g) => g.id === groupId);
    if (!group) return;
    // If already in this group, stay on current tab; otherwise go to first tab
    if (groupId === currentGroup) return;
    setActiveTab(group.tabs[0]);
  }

  function handleSubTabClick(tabId: string) {
    setActiveTab(tabId);
  }

  /* ---------- render tab content ----------------------------------- */
  function renderContent() {
    const wrapWithSidebar = (content: React.ReactNode) => (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-[1fr_280px]">
        {content}
        <div className="hidden md:block">
          <StateSummary
            state={allPhaseState}
            phases={phasesWithLabels}
            onEdit={onJump}
          />
        </div>
      </div>
    );

    switch (activeTab) {
      case "summary":
        return wrapWithSidebar(<SummaryView state={allPhaseState} arch={arch} />);
      case "cards":
        return wrapWithSidebar(<ArchOutput arch={arch} />);
      case "diagram":
        return wrapWithSidebar(<DiagramView arch={arch} state={allPhaseState} />);
      case "validate":
        return <ValidationView state={allPhaseState} onEdit={onJump} />;
      case "cost":
        return <CostView state={allPhaseState} />;
      case "wafr":
        return <WafrView state={allPhaseState} />;
      case "checklist":
        return <ChecklistView state={allPhaseState} />;
      case "sg":
        return <SecurityGroupView state={allPhaseState} />;
      case "code":
        return <CodeView state={allPhaseState} />;
      default:
        return null;
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] px-3 py-4 md:px-7 md:py-6">
      {/* Completion banner */}
      {!bannerDismissed && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border-[1.5px] border-emerald-200 bg-emerald-50 px-3 py-3 md:px-5 md:py-4">
          <div className="flex-1">
            <div className="mb-0.5 text-base font-bold text-emerald-600">
              {t.result.completionTitle}
            </div>
            <div className="text-[13px] text-gray-700">
              {t.result.completionDesc}
            </div>
          </div>
          <button
            onClick={() => setBannerDismissed(true)}
            className="rounded-md p-1 text-emerald-400 transition-colors hover:bg-emerald-100 hover:text-emerald-600"
            aria-label={t.result.dismiss}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 2-tier tab navigation — sticky */}
      <div className="sticky top-0 z-10 -mx-3 mb-4 bg-white/95 px-3 backdrop-blur md:-mx-7 md:px-7">
        {/* Primary: group tabs */}
        <div
          className="scrollbar-hide flex gap-1 overflow-x-auto border-b border-gray-200 pb-0"
          role="tablist"
          aria-label="Result sections"
        >
          {TAB_GROUPS.map((g) => (
            <button
              key={g.id}
              role="tab"
              aria-selected={g.id === currentGroup}
              onClick={() => handleGroupClick(g.id)}
              className={cn(
                "shrink-0 whitespace-nowrap border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors",
                g.id === currentGroup
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              {groupLabels[g.id]}
            </button>
          ))}
        </div>

        {/* Secondary: sub-tabs (only when group has >1 tabs) */}
        {hasSubTabs && (
          <div
            className="scrollbar-hide flex gap-1 overflow-x-auto py-2"
            role="tablist"
            aria-label={`${groupLabels[currentGroup]} tabs`}
          >
            {currentGroupDef.tabs.map((tabId) => (
              <button
                key={tabId}
                role="tab"
                aria-selected={activeTab === tabId}
                onClick={() => handleSubTabClick(tabId)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                  activeTab === tabId
                    ? "bg-indigo-50 text-indigo-600 shadow-sm"
                    : "bg-transparent text-gray-500 hover:bg-gray-50"
                )}
              >
                {tabIcon(tabId, errorCount, warnCount)}
                {tabMeta[tabId] ?? tabId}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tab content with fade-in animation */}
      <div
        key={activeTab}
        className="animate-in fade-in slide-in-from-bottom-1 duration-200 ease-out"
      >
        {renderContent()}
      </div>

      {/* Mobile SlidePanel for StateSummary */}
      <SlidePanelTrigger onClick={() => setMobileSidebarOpen(true)} label={t.stateSummary.title} />
      <SlidePanel open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen} title={t.stateSummary.title}>
        <StateSummary
          state={allPhaseState}
          phases={phasesWithLabels}
          onEdit={(id) => { setMobileSidebarOpen(false); onJump(id); }}
        />
      </SlidePanel>
    </div>
  );
}
