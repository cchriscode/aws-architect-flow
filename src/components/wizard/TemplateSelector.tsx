"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import type { WizardState } from "@/lib/types";
import type { CostEstimate } from "@/lib/types";
import type { BudgetPriority, BudgetAdjustResult } from "@/data/templates";
import { useDict } from "@/lib/i18n/context";
import { useLang } from "@/lib/i18n/context";

interface TemplateSelectorProps {
  onSelect: (state: WizardState) => void;
}

interface PendingTemplate {
  id: string;
  label: string;
  icon: string;
}

interface TierData {
  priority: BudgetPriority;
  result: BudgetAdjustResult;
  cost: CostEstimate;
}

export function TemplateSelector({ onSelect }: TemplateSelectorProps) {
  const t = useDict();
  const { lang } = useLang();
  const [pendingTemplate, setPendingTemplate] = useState<PendingTemplate | null>(null);
  const [tiers, setTiers] = useState<TierData[] | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<BudgetPriority>("balanced");

  const ICONS: Record<string, string> = {
    ecommerce_mvp: "\uD83D\uDED2",
    b2b_saas: "\uD83D\uDCBC",
    internal_tool: "\uD83C\uDFE2",
    realtime_chat: "\uD83D\uDCAC",
    data_pipeline: "\uD83D\uDCCA",
    generic_web_api: "\uD83C\uDF10",
    ticketing: "\uD83C\uDFAB",
    iot_platform: "\uD83D\uDCE1",
  };

  // Compute tiers when a template is selected
  useEffect(() => {
    if (!pendingTemplate) {
      setTiers(null);
      setSelectedPriority("balanced");
      return;
    }
    let cancelled = false;
    Promise.all([
      import("@/data/templates"),
      import("@/lib/cost"),
    ]).then(([{ TEMPLATES, adjustTemplateForBudget }, { estimateMonthlyCost }]) => {
      if (cancelled) return;
      const found = TEMPLATES.find((tmpl) => tmpl.id === pendingTemplate.id);
      if (!found) return;
      const priorities: BudgetPriority[] = ["cost_first", "balanced", "perf_first"];
      const computed = priorities.map((p) => {
        const result = adjustTemplateForBudget(found.state, p);
        const cost = estimateMonthlyCost(result.state, lang);
        return { priority: p, result, cost };
      });
      setTiers(computed);
    });
    return () => { cancelled = true; };
  }, [pendingTemplate, lang]);

  const handleTemplateClick = useCallback((tmpl: { id: string; label: string }) => {
    setPendingTemplate({
      id: tmpl.id,
      label: tmpl.label,
      icon: ICONS[tmpl.id] || "\uD83D\uDCE6",
    });
  }, []);

  const handleSelect = useCallback(() => {
    if (!tiers) return;
    const tier = tiers.find((t) => t.priority === selectedPriority);
    if (tier) {
      onSelect(tier.result.state);
      setPendingTemplate(null);
    }
  }, [tiers, selectedPriority, onSelect]);

  const tierMeta = useMemo(() => ({
    cost_first: {
      label: t.budgetModal.costFirst,
      desc: t.budgetModal.costFirstDesc,
      border: "border-emerald-400",
      bg: "bg-emerald-50",
      ring: "ring-emerald-500",
    },
    balanced: {
      label: t.budgetModal.balanced,
      desc: t.budgetModal.balancedDesc,
      border: "border-indigo-400",
      bg: "bg-indigo-50",
      ring: "ring-indigo-500",
    },
    perf_first: {
      label: t.budgetModal.perfFirst,
      desc: t.budgetModal.perfFirstDesc,
      border: "border-amber-400",
      bg: "bg-amber-50",
      ring: "ring-amber-500",
    },
  }), [t]);

  return (
    <div className="mb-6">
      <div className="mb-3">
        <div className="mb-1 text-[15px] font-bold text-gray-900">
          {t.templateSelector.title}
        </div>
        <div className="text-xs text-gray-500">
          {t.templateSelector.desc}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
        {t.templates.map((tmpl) => (
          <button
            key={tmpl.id}
            onClick={() => handleTemplateClick(tmpl)}
            className="group flex flex-col items-start gap-1.5 rounded-xl border-[1.5px] border-gray-200 bg-white px-4 py-3.5 text-left transition-all hover:border-indigo-400 hover:bg-indigo-50 hover:shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{ICONS[tmpl.id] || "\uD83D\uDCE6"}</span>
              <span className="text-[13px] font-bold text-gray-900 group-hover:text-indigo-600">
                {tmpl.label}
              </span>
            </div>
            <div className="text-[11px] leading-relaxed text-gray-500">
              {tmpl.desc}
            </div>
          </button>
        ))}
      </div>
      <div className="mt-3 border-b border-dashed border-gray-200 pb-1 text-center text-[11px] text-gray-400">
        {t.templateSelector.apply}
      </div>

      {/* Budget Strategy Modal */}
      {pendingTemplate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setPendingTemplate(null)}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-4">
              <div className="flex items-center gap-2 text-lg font-bold text-gray-900">
                <span>{pendingTemplate.icon}</span>
                <span>{pendingTemplate.label}</span>
              </div>
              <h3 className="mt-1 text-[15px] font-semibold text-gray-800">
                {t.budgetModal.title}
              </h3>
              <p className="mt-0.5 text-xs text-gray-500">
                {t.budgetModal.desc}
              </p>
            </div>

            {/* Tier cards */}
            <div className="flex flex-col gap-2.5">
              {(["cost_first", "balanced", "perf_first"] as BudgetPriority[]).map((p) => {
                const meta = tierMeta[p];
                const tier = tiers?.find((t) => t.priority === p);
                const isSelected = selectedPriority === p;

                return (
                  <button
                    key={p}
                    onClick={() => setSelectedPriority(p)}
                    className={`relative rounded-xl border-[1.5px] px-4 py-3 text-left transition-all ${
                      isSelected
                        ? `${meta.border} ${meta.bg} ring-2 ${meta.ring}`
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[13px] font-bold text-gray-900">
                          {meta.label}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {meta.desc}
                        </div>
                      </div>
                      {tier && (
                        <div className="text-right">
                          <div className="text-[11px] text-gray-400">
                            {t.budgetModal.estimated}
                          </div>
                          <div className="text-[14px] font-bold text-gray-900">
                            ${tier.cost.totalMin.toLocaleString()}~${tier.cost.totalMax.toLocaleString()}
                            <span className="text-[11px] font-normal text-gray-400">
                              {t.budgetModal.perMonth}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Key changes */}
                    {tier && tier.result.changes.length > 0 && (
                      <div className="mt-2 border-t border-gray-100 pt-2">
                        <div className="text-[10px] font-medium text-gray-400 mb-1">
                          {t.budgetModal.keyChanges}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {tier.result.changes.map((c, i) => (
                            <span
                              key={i}
                              className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {tier && p === "cost_first" && tier.result.changes.length === 0 && (
                      <div className="mt-2 border-t border-gray-100 pt-2">
                        <span className="text-[10px] text-emerald-600">
                          {t.budgetModal.alreadyOptimized}
                        </span>
                      </div>
                    )}
                    {tier && p === "balanced" && tier.result.changes.length === 0 && (
                      <div className="mt-2 border-t border-gray-100 pt-2">
                        <span className="text-[10px] text-indigo-500">
                          {t.budgetModal.baselineConfig}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setPendingTemplate(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-[13px] text-gray-600 hover:bg-gray-50"
              >
                {t.budgetModal.cancel}
              </button>
              <button
                onClick={handleSelect}
                disabled={!tiers}
                className="rounded-lg bg-indigo-600 px-5 py-2 text-[13px] font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {t.budgetModal.generate}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
