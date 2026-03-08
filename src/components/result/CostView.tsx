"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { WizardState } from "@/lib/types";
import { estimateMonthlyCost } from "@/lib/cost";
import { useDict, useLang } from "@/lib/i18n/context";

interface CostViewProps {
  state: WizardState;
}

export function CostView({ state }: CostViewProps) {
  const t = useDict();
  const { lang } = useLang();
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"current" | "optimized">(
    "current"
  );

  const cost = estimateMonthlyCost(state, lang);

  const optimizedState = {
    ...state,
    cost: {
      ...(state.cost || {}),
      commitment: "1yr",
      spot_usage: "partial",
      priority: "cost_first",
    },
  };
  const costOpt = estimateMonthlyCost(optimizedState, lang);
  const saving = cost.totalMid - costOpt.totalMid;
  const savingPct =
    cost.totalMid > 0 ? Math.round((saving / cost.totalMid) * 100) : 0;

  const activeCost = viewMode === "current" ? cost : costOpt;

  const catColors: Record<string, string> = {
    컴퓨팅: "#6366f1",
    데이터베이스: "#2563eb",
    네트워크: "#0891b2",
    엣지: "#7c3aed",
    스토리지: "#d97706",
    메시징: "#059669",
    운영: "#374151",
    멀티리전: "#dc2626",
    Compute: "#6366f1",
    Database: "#2563eb",
    Network: "#0891b2",
    Edge: "#7c3aed",
    Storage: "#d97706",
    Messaging: "#059669",
    Operations: "#374151",
    "Multi-Region": "#dc2626",
  };

  const tips: { icon: string; text: string }[] = [];
  if (!state.cost?.commitment || state.cost?.commitment === "none")
    tips.push({ icon: "\uD83D\uDCB8", text: t.costView.tips.commit });
  if (!state.cost?.spot_usage || state.cost?.spot_usage === "no")
    tips.push({ icon: "\u26A1", text: t.costView.tips.spot });
  if (
    !state.network?.nat_strategy ||
    state.network.nat_strategy === "per_az"
  )
    tips.push({ icon: "\uD83C\uDF10", text: t.costView.tips.nat });
  if ((state.data?.storage || []).includes("s3"))
    tips.push({ icon: "\uD83D\uDDC4\uFE0F", text: t.costView.tips.s3 });
  if (!state.data?.cache || state.data?.cache === "no")
    tips.push({ icon: "\u26A1", text: t.costView.tips.cache });
  if (state.edge?.waf === "shield")
    tips.push({ icon: "\uD83D\uDEE1\uFE0F", text: t.costView.tips.shield });

  return (
    <div className="grid grid-cols-[1fr_280px] gap-5">
      {/* Main */}
      <div>
        {/* Toggle */}
        <div className="mb-3.5 rounded-xl border border-gray-200 bg-white px-5 py-3.5">
          <div className="mb-3 flex gap-2">
            {[
              { id: "current" as const, label: t.costView.currentCost },
              { id: "optimized" as const, label: t.costView.optimizedScenario },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setViewMode(m.id)}
                className={cn(
                  "rounded-lg border-[1.5px] px-4 py-[7px] text-xs font-semibold",
                  viewMode === m.id
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-gray-200 bg-white text-gray-700"
                )}
              >
                {m.label}
              </button>
            ))}
            {saving > 0 && viewMode === "current" && (
              <div className="ml-auto flex items-center gap-1 text-xs font-bold text-emerald-600">
                {t.costView.savingMsg(saving.toLocaleString(), savingPct)}
              </div>
            )}
          </div>

          {/* Header */}
          <div className="flex items-baseline gap-2.5">
            <span className="text-4xl font-extrabold text-gray-900">
              ${activeCost.totalMid.toLocaleString()}
            </span>
            <span className="text-[13px] text-gray-500">{t.costView.perMonthEstimate}</span>
          </div>
          <div className="mt-0.5 text-xs text-gray-400">
            {t.costView.range} ${activeCost.totalMin.toLocaleString()} ~ $
            {activeCost.totalMax.toLocaleString()}
            {activeCost.hasCommit && (
              <span className="ml-2 rounded bg-emerald-50 px-1.5 py-px text-[11px] font-semibold text-emerald-600">
                {t.costView.commitDiscount}
              </span>
            )}
            {activeCost.hasSpot && (
              <span className="ml-1 rounded bg-sky-50 px-1.5 py-px text-[11px] font-semibold text-sky-600">
                {t.costView.spotMixed}
              </span>
            )}
          </div>
          {viewMode === "optimized" && (
            <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              {t.costView.optimizedDesc(saving.toLocaleString())}
            </div>
          )}
        </div>

        {/* Categories */}
        {activeCost.categories.map((cat) => {
          const pct =
            activeCost.totalMid > 0
              ? Math.round(
                  ((cat.total.min + cat.total.max) / 2 / activeCost.totalMid) *
                    100
                )
              : 0;
          const isOpen = openCat === cat.name;
          const color = catColors[cat.name] || "#6b7280";
          return (
            <div
              key={cat.name}
              className="mb-2 overflow-hidden rounded-[10px] border border-gray-200 bg-white"
            >
              <div
                onClick={() => setOpenCat(isOpen ? null : cat.name)}
                className="flex cursor-pointer items-center gap-3 px-4 py-3"
                style={{
                  background: isOpen ? "#f8faff" : "#fff",
                }}
              >
                <div
                  className="h-3 w-3 shrink-0 rounded-sm"
                  style={{ background: color }}
                />
                <div className="flex-1">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-gray-900">
                      {cat.name}
                    </span>
                    <span
                      className="text-[13px] font-bold"
                      style={{ color }}
                    >
                      $
                      {Math.round(
                        (cat.total.min + cat.total.max) / 2
                      ).toLocaleString()}
                      {t.costView.perMonth}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 flex-1 rounded-sm bg-gray-100">
                      <div
                        className="h-full rounded-sm"
                        style={{
                          width: `${pct}%`,
                          background: color,
                        }}
                      />
                    </div>
                    <span className="shrink-0 text-[11px] text-gray-400">
                      {pct}%
                    </span>
                  </div>
                </div>
                <span className="text-[11px] text-gray-400">
                  {isOpen ? "\u25B2" : "\u25BC"}
                </span>
              </div>
              {isOpen && (
                <div className="border-t border-gray-100 px-4 py-2 pb-3">
                  {cat.items.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between border-b border-gray-50 py-1.5"
                    >
                      <div>
                        <div className="text-xs font-medium text-gray-700">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          {item.desc}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-xs font-semibold text-gray-900">
                          {item.min === item.max
                            ? `$${item.min.toLocaleString()}`
                            : `$${item.min.toLocaleString()}~${item.max.toLocaleString()}`}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {item.min === 0 && item.max === 0
                            ? t.costView.included
                            : t.costView.perMonth}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sidebar */}
      <div>
        {/* Period comparison */}
        <div className="mb-3 rounded-xl border border-gray-200 bg-white p-3.5">
          <div className="mb-2.5 text-xs font-bold text-gray-700">
            {t.costView.periodCompare}
          </div>
          {t.costView.periods.map((p) => (
            <div
              key={p.label}
              className="flex justify-between border-b border-gray-50 py-1"
            >
              <span className="text-xs text-gray-500">{p.label}</span>
              <div className="text-right">
                <div className="text-xs font-semibold text-gray-900">
                  ${(cost.totalMid * p.mult).toLocaleString()}
                </div>
                {saving > 0 && (
                  <div className="text-[10px] text-emerald-600">
                    {t.costView.optimized} $
                    {(costOpt.totalMid * p.mult).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Cost tips */}
        {tips.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-3.5">
            <div className="mb-2.5 text-xs font-bold text-gray-700">
              {t.costView.costTips}
            </div>
            {tips.map((tip, i) => (
              <div
                key={i}
                className="flex items-start gap-2 border-b border-gray-50 py-[7px]"
              >
                <span className="shrink-0 text-sm">{tip.icon}</span>
                <span className="text-[11px] leading-relaxed text-gray-700">
                  {tip.text}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
