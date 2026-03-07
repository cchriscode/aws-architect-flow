"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { WizardState, WafrItem } from "@/lib/types";
import { wellArchitectedScore } from "@/lib/wafr";

interface WafrViewProps {
  state: WizardState;
}

const pillars = [
  { id: "ops", label: "운영 우수성", icon: "\u2699\uFE0F", color: "#6366f1" },
  { id: "sec", label: "보안", icon: "\uD83D\uDD12", color: "#dc2626" },
  { id: "rel", label: "안정성", icon: "\uD83D\uDEE1\uFE0F", color: "#d97706" },
  { id: "perf", label: "성능 효율성", icon: "\u26A1", color: "#0891b2" },
  { id: "cost", label: "비용 최적화", icon: "\uD83D\uDCB0", color: "#059669" },
  { id: "sus", label: "지속가능성", icon: "\uD83C\uDF31", color: "#7c3aed" },
];

function scoreColor(s: number) {
  if (s >= 80) return "#059669";
  if (s >= 60) return "#d97706";
  if (s >= 40) return "#ca8a04";
  return "#dc2626";
}

function itemColor(item: WafrItem) {
  if (item.earnedPts >= item.maxPts) return "#059669";
  if (item.earnedPts > 0) return "#d97706";
  return "#dc2626";
}

function itemIcon(item: WafrItem) {
  if (item.earnedPts >= item.maxPts) return "\u2713";
  if (item.earnedPts > 0) return "\u25B3";
  return "\u2013";
}

export function WafrView({ state }: WafrViewProps) {
  const [activePillar, setActivePillar] = useState("ops");
  const wa = wellArchitectedScore(state);

  const active = pillars.find((p) => p.id === activePillar);
  const items = wa.pillars[activePillar]?.items || [];
  const earnedTotal = items.reduce((s, i) => s + i.earnedPts, 0);
  const maxTotal = items.reduce((s, i) => s + i.maxPts, 0);

  const exportWA = () => {
    const report = {
      generated: new Date().toISOString(),
      overall: wa.overall,
      pillars: pillars.map((p) => {
        const pd = wa.pillars[p.id];
        return {
          id: p.id,
          label: p.label,
          score: pd.score,
          items: pd.items.map((item) => ({
            question: item.q,
            earned: item.earnedPts,
            max: item.maxPts,
            recommendation: item.rec || null,
          })),
        };
      }),
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wa-report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-[1fr_260px] gap-5">
      {/* 메인 */}
      <div>
        {/* 종합 점수 */}
        <div className="mb-3.5 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4">
          <div className="flex items-center gap-4">
            <div
              className="flex h-[72px] w-[72px] items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(${scoreColor(wa.overall)} ${wa.overall * 3.6}deg, #f3f4f6 0)`,
              }}
            >
              <div className="flex h-[54px] w-[54px] items-center justify-center rounded-full bg-white">
                <span
                  className="text-xl font-extrabold"
                  style={{ color: scoreColor(wa.overall) }}
                >
                  {wa.overall}
                </span>
              </div>
            </div>
            <div>
              <div className="text-base font-bold text-gray-900">
                Well-Architected 종합 점수
              </div>
              <div className="mt-0.5 text-xs text-gray-500">
                AWS Well-Architected Framework 6개 Pillar 기준
              </div>
              <div className="mt-1.5 flex gap-1.5">
                {[
                  { t: "80+", c: "#059669" },
                  { t: "60+", c: "#d97706" },
                  { t: "40+", c: "#ca8a04" },
                  { t: "~40", c: "#dc2626" },
                ].map((b) => (
                  <span
                    key={b.t}
                    className="rounded px-1.5 py-px text-[10px] font-semibold"
                    style={{
                      background: b.c + "20",
                      color: b.c,
                    }}
                  >
                    {b.t}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={exportWA}
            className="rounded-lg border-[1.5px] border-gray-200 bg-white px-3.5 py-[7px] text-[11px] font-semibold text-gray-700"
          >
            {"\uD83D\uDCC4"} JSON 내보내기
          </button>
        </div>

        {/* Pillar 탭 */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {pillars.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePillar(p.id)}
              className="rounded-lg border-[1.5px] px-3.5 py-[7px] text-[11px] font-semibold"
              style={{
                background: activePillar === p.id ? p.color : "#fff",
                color: activePillar === p.id ? "#fff" : p.color,
                borderColor: p.color,
              }}
            >
              {p.icon} {p.label}{" "}
              <span className="ml-1 opacity-80">
                {wa.pillars[p.id].score}점
              </span>
            </button>
          ))}
        </div>

        {/* 항목별 점수 */}
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3.5">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-bold text-gray-900">
              {active?.icon} {active?.label} 상세 평가
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-semibold"
                style={{
                  color: scoreColor(wa.pillars[activePillar].score),
                }}
              >
                {earnedTotal}/{maxTotal}점
              </span>
              <span
                className="rounded px-1.5 py-px text-[10px] font-bold"
                style={{
                  background: scoreColor(wa.pillars[activePillar].score) + "18",
                  color: scoreColor(wa.pillars[activePillar].score),
                }}
              >
                {wa.pillars[activePillar].score}점
              </span>
            </div>
          </div>
          <div className="mb-3.5 h-2 rounded-md bg-gray-100">
            <div
              className="h-full rounded-md transition-[width] duration-400"
              style={{
                width: `${maxTotal > 0 ? Math.round((earnedTotal / maxTotal) * 100) : 0}%`,
                background: active?.color,
              }}
            />
          </div>

          {items.map((item, i) => {
            const color = itemColor(item);
            const icon = itemIcon(item);
            const gain = item.maxPts - item.earnedPts;
            const pct = item.maxPts > 0 ? Math.round((item.earnedPts / item.maxPts) * 100) : 0;

            return (
              <div
                key={i}
                className="flex items-start gap-2.5 border-b border-gray-50 py-2.5"
              >
                {/* 아이콘 */}
                <div
                  className="mt-px flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md"
                  style={{ background: color + "18" }}
                >
                  <span
                    className="text-xs font-bold"
                    style={{ color }}
                  >
                    {icon}
                  </span>
                </div>

                {/* 질문 + 개선안 */}
                <div className="flex-1 min-w-0">
                  <span
                    className={cn(
                      "text-xs",
                      item.earnedPts >= item.maxPts
                        ? "font-medium text-gray-700"
                        : "font-normal text-gray-600"
                    )}
                  >
                    {item.q}
                  </span>
                  {item.rec && (
                    <div className="mt-0.5 text-[11px] text-gray-400">
                      {"\u21B3"} {item.rec}
                      {gain > 0 && (
                        <span
                          className="ml-1 font-semibold"
                          style={{ color }}
                        >
                          (+{gain}점 가능)
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* 점수 바 + 텍스트 */}
                <div className="flex shrink-0 flex-col items-end gap-0.5">
                  <span
                    className="text-[11px] font-bold tabular-nums"
                    style={{ color }}
                  >
                    {item.earnedPts}/{item.maxPts}
                  </span>
                  <div className="h-1 w-10 rounded bg-gray-100">
                    <div
                      className="h-full rounded"
                      style={{
                        width: `${pct}%`,
                        background: color,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {/* 개선 권장사항 요약 */}
          {(() => {
            const recsItems = items.filter((item) => item.rec);
            if (recsItems.length === 0) return null;
            return (
              <div className="mt-3.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5">
                <div className="mb-1.5 text-xs font-bold text-yellow-800">
                  개선 권장사항 ({recsItems.length}개)
                </div>
                {recsItems.map((item, i) => (
                  <div
                    key={i}
                    className="flex gap-1.5 py-0.5 text-[11px] text-yellow-800"
                  >
                    <span>{"\u2192"}</span>
                    <span>
                      {item.rec}
                      {item.maxPts - item.earnedPts > 0 && (
                        <span className="ml-1 font-semibold">
                          (+{item.maxPts - item.earnedPts}점)
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      {/* 사이드바 */}
      <div>
        <div className="rounded-xl border border-gray-200 bg-white p-3.5">
          <div className="mb-2.5 text-xs font-bold text-gray-700">
            Pillar별 점수
          </div>
          {pillars.map((p) => (
            <div key={p.id} className="mb-2.5">
              <div className="mb-0.5 flex justify-between">
                <span className="text-[11px] text-gray-700">
                  {p.icon} {p.label}
                </span>
                <span
                  className="text-[11px] font-bold"
                  style={{ color: scoreColor(wa.pillars[p.id].score) }}
                >
                  {wa.pillars[p.id].score}점
                </span>
              </div>
              <div className="h-1.5 rounded bg-gray-100">
                <div
                  className="h-full rounded"
                  style={{
                    width: `${wa.pillars[p.id].score}%`,
                    background: p.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-xl border border-gray-200 bg-white p-3.5">
          <div className="mb-2 text-xs font-bold text-gray-700">
            {"\uD83D\uDCCB"} 점수 기준
          </div>
          {[
            {
              range: "80~100",
              grade: "우수",
              desc: "프로덕션 배포 가능",
              color: "#059669",
            },
            {
              range: "60~79",
              grade: "양호",
              desc: "주요 항목 충족",
              color: "#d97706",
            },
            {
              range: "40~59",
              grade: "개선 필요",
              desc: "핵심 보완 필요",
              color: "#ca8a04",
            },
            {
              range: "0~39",
              grade: "위험",
              desc: "중요 항목 미충족",
              color: "#dc2626",
            },
          ].map((g) => (
            <div
              key={g.range}
              className="flex items-center gap-2 border-b border-gray-50 py-1"
            >
              <div
                className="h-2 w-2 shrink-0 rounded-sm"
                style={{ background: g.color }}
              />
              <div className="flex-1">
                <span
                  className="text-[11px] font-semibold"
                  style={{ color: g.color }}
                >
                  {g.grade}{" "}
                </span>
                <span className="text-[10px] text-gray-400">
                  {g.range}점
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
