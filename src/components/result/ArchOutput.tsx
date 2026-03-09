"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Architecture } from "@/lib/types";
import { useDict } from "@/lib/i18n/context";
import { useIsMobile } from "@/hooks/use-mobile";

function WAScore({ score }: { score: Record<string, number> }) {
  const t = useDict();
  const items = t.archOutput.pillars.map((p) => ({
    ...p,
    c:
      p.k === "operational"
        ? "#059669"
        : p.k === "security"
          ? "#dc2626"
          : p.k === "reliability"
            ? "#2563eb"
            : p.k === "performance"
              ? "#d97706"
              : p.k === "cost"
                ? "#7c3aed"
                : "#0891b2",
  }));
  return (
    <div className="mb-5 rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3.5 text-sm font-bold text-gray-900">
        {t.archOutput.waPillarTitle}
      </div>
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
        {items.map((item) => {
          const v = score[item.k] || 0;
          return (
            <div
              key={item.k}
              className="rounded-lg border p-3"
              style={{
                background: item.c + "08",
                borderColor: item.c + "30",
              }}
            >
              <div
                className="mb-1.5 text-[11px] font-bold"
                style={{ color: item.c }}
              >
                {item.l}
              </div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-1.5 flex-1 rounded-sm"
                    style={{
                      background: i <= v ? item.c : "#e5e7eb",
                    }}
                  />
                ))}
              </div>
              <div className="mt-1 text-[10px] text-gray-400">
                {t.archOutput.scoreLevels[v]}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 text-[11px] text-gray-400">
        {t.archOutput.waNote}
      </div>
    </div>
  );
}

interface ArchOutputProps {
  arch: Architecture;
}

export function ArchOutput({ arch }: ArchOutputProps) {
  const t = useDict();
  const isMobile = useIsMobile();
  const [expand, setExpand] = useState<Record<string, boolean>>({});
  const toggle = (id: string) =>
    setExpand((e) => ({ ...e, [id]: !e[id] }));

  return (
    <div>
      <WAScore score={arch.waScore} />
      {arch.layers.map((layer) => (
        <div
          key={layer.id}
          className="mb-3 overflow-hidden rounded-xl border-[1.5px]"
          style={{
            borderColor: layer.color + "30",
            borderLeftWidth: 4,
            borderLeftColor: layer.color,
          }}
        >
          <div
            onClick={() => toggle(layer.id)}
            className="flex cursor-pointer items-center justify-between px-5 py-3.5 transition-colors"
            style={{
              background: expand[layer.id] ? layer.bg : "#fff",
            }}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-lg">{layer.icon}</span>
              <span className="text-sm font-bold text-gray-900">
                {layer.label}
              </span>
              <span className="text-[11px] text-gray-400">
                {t.archOutput.serviceCount(layer.services.length)}
              </span>
            </div>
            <div className="text-base text-gray-400">
              {expand[layer.id] ? "\u25B2" : "\u25BC"}
            </div>
          </div>
          {expand[layer.id] && (
            <div className="px-3 pb-4 md:px-5">
              {/* Header — desktop only */}
              <div className="hidden md:grid grid-cols-[160px_1fr_1fr_100px_200px] gap-0 border-b border-gray-100 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                <span>{t.archOutput.colService}</span>
                <span>{t.archOutput.colDetail}</span>
                <span>{t.archOutput.colReason}</span>
                <span className="text-center">{t.archOutput.colCost}</span>
                <span>{t.archOutput.colOptimize}</span>
              </div>
              {layer.services.map((svc, i) =>
                svc.reason !== undefined ? (
                  isMobile ? (
                    <div key={i} className="rounded-lg border border-gray-100 p-3 mb-2">
                      <div className="font-bold text-sm text-gray-900">{svc.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{svc.detail}</div>
                      <div className="text-xs text-gray-700 mt-1">{svc.reason}</div>
                      <div className="flex justify-between text-xs mt-1.5">
                        <span className="text-amber-600">{svc.cost}</span>
                        <span className="text-indigo-600 font-medium">{svc.opt}</span>
                      </div>
                    </div>
                  ) : (
                    <div
                      key={i}
                      className="grid grid-cols-[160px_1fr_1fr_100px_200px] items-start gap-0 border-b border-gray-50 py-2.5"
                    >
                      <div className="pr-2 text-xs font-bold text-gray-900">
                        {svc.name}
                      </div>
                      <div className="pr-2 text-[11px] text-gray-500">
                        {svc.detail}
                      </div>
                      <div className="pr-2 text-[11px] text-gray-700">
                        {svc.reason}
                      </div>
                      <div className="text-center text-[10px] text-amber-600">
                        {svc.cost}
                      </div>
                      <div className="text-[11px] font-medium text-indigo-600">
                        {svc.opt}
                      </div>
                    </div>
                  )
                ) : (
                  <div
                    key={i}
                    className="flex gap-2 border-b border-gray-50 py-2 text-xs text-gray-700"
                  >
                    <span style={{ color: layer.color }}>{"\u25B8"}</span>
                    {svc.name}
                    {svc.detail && (
                      <span className="text-gray-500">: {svc.detail}</span>
                    )}
                  </div>
                )
              )}
              {layer.insights && layer.insights.length > 0 && (
                <div
                  className="mt-3 rounded-lg p-2.5 px-3.5"
                  style={{ background: layer.bg }}
                >
                  <div
                    className="mb-1.5 text-[11px] font-bold"
                    style={{ color: layer.color }}
                  >
                    {t.archOutput.designPoints}
                  </div>
                  {layer.insights.map((ins) => (
                    <div
                      key={ins}
                      className="mb-0.5 text-[11px] text-gray-700"
                    >
                      {"\u2192"} {ins}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
