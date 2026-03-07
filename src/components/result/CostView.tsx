"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { WizardState } from "@/lib/types";
import { estimateMonthlyCost } from "@/lib/cost";

interface CostViewProps {
  state: WizardState;
}

export function CostView({ state }: CostViewProps) {
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"current" | "optimized">(
    "current"
  );

  const cost = estimateMonthlyCost(state);

  const optimizedState = {
    ...state,
    cost: {
      ...(state.cost || {}),
      commitment: "1yr",
      spot_usage: "partial",
      priority: "cost_first",
    },
  };
  const costOpt = estimateMonthlyCost(optimizedState);
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
  };

  const tips: { icon: string; text: string }[] = [];
  if (!state.cost?.commitment || state.cost?.commitment === "none")
    tips.push({
      icon: "\uD83D\uDCB8",
      text: "1년 약정 적용 시 최대 40% 절감 가능",
    });
  if (!state.cost?.spot_usage || state.cost?.spot_usage === "no")
    tips.push({
      icon: "\u26A1",
      text: "Spot 인스턴스 혼합 시 컴퓨팅 비용 30~70% 절감",
    });
  if (
    !state.network?.nat_strategy ||
    state.network.nat_strategy === "per_az"
  )
    tips.push({
      icon: "\uD83C\uDF10",
      text: "NAT Gateway 공유(1개)로 월 $80~150 절감",
    });
  if ((state.data?.storage || []).includes("s3"))
    tips.push({
      icon: "\uD83D\uDDC4\uFE0F",
      text: "S3 Intelligent-Tiering으로 장기 저장 비용 40% 절감",
    });
  if (!state.data?.cache || state.data?.cache === "no")
    tips.push({
      icon: "\u26A1",
      text: "ElastiCache 도입으로 DB 부하 감소 \u2192 DB 스케일 다운 가능",
    });
  if (state.edge?.waf === "shield")
    tips.push({
      icon: "\uD83D\uDEE1\uFE0F",
      text: "Shield Advanced($3,000) 대신 WAF + Bot Control로 대체 검토",
    });

  return (
    <div className="grid grid-cols-[1fr_280px] gap-5">
      {/* 메인 */}
      <div>
        {/* 토글 */}
        <div className="mb-3.5 rounded-xl border border-gray-200 bg-white px-5 py-3.5">
          <div className="mb-3 flex gap-2">
            {[
              { id: "current" as const, label: "현재 설정 비용" },
              {
                id: "optimized" as const,
                label: "\uD83D\uDCA1 최적화 시나리오",
              },
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
                {"\uD83D\uDCB0"} 최적화로 월{" "}
                <span className="text-sm">
                  ~${saving.toLocaleString()}
                </span>{" "}
                ({savingPct}%) 절감 가능
              </div>
            )}
          </div>

          {/* 헤더 */}
          <div className="flex items-baseline gap-2.5">
            <span className="text-4xl font-extrabold text-gray-900">
              ${activeCost.totalMid.toLocaleString()}
            </span>
            <span className="text-[13px] text-gray-500">/월 (예상)</span>
          </div>
          <div className="mt-0.5 text-xs text-gray-400">
            범위: ${activeCost.totalMin.toLocaleString()} ~ $
            {activeCost.totalMax.toLocaleString()}
            {activeCost.hasCommit && (
              <span className="ml-2 rounded bg-emerald-50 px-1.5 py-px text-[11px] font-semibold text-emerald-600">
                약정 할인 적용
              </span>
            )}
            {activeCost.hasSpot && (
              <span className="ml-1 rounded bg-sky-50 px-1.5 py-px text-[11px] font-semibold text-sky-600">
                Spot 혼합 적용
              </span>
            )}
          </div>
          {viewMode === "optimized" && (
            <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              {"\u2728"} 1년 약정 + Spot 혼합(30%) 적용 시나리오. 현재
              설정 대비 월 <b>${saving.toLocaleString()}</b> 절감.
            </div>
          )}
        </div>

        {/* 카테고리별 */}
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
                      /월
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
                            ? "포함"
                            : "/월"}
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

      {/* 사이드바 */}
      <div>
        {/* 연간 비교 */}
        <div className="mb-3 rounded-xl border border-gray-200 bg-white p-3.5">
          <div className="mb-2.5 text-xs font-bold text-gray-700">
            {"\uD83D\uDCC5"} 비용 기간별 비교
          </div>
          {[
            { label: "월", mult: 1 },
            { label: "분기", mult: 3 },
            { label: "연간", mult: 12 },
            { label: "3년", mult: 36 },
          ].map((p) => (
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
                    최적화 $
                    {(costOpt.totalMid * p.mult).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 절감 팁 */}
        {tips.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-3.5">
            <div className="mb-2.5 text-xs font-bold text-gray-700">
              {"\uD83D\uDCA1"} 비용 절감 팁
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
