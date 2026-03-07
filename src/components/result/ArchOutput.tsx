"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Architecture } from "@/lib/types";

function WAScore({ score }: { score: Record<string, number> }) {
  const items = [
    { k: "operational", l: "운영 탁월성", c: "#059669" },
    { k: "security", l: "보안", c: "#dc2626" },
    { k: "reliability", l: "신뢰성", c: "#2563eb" },
    { k: "performance", l: "성능 효율", c: "#d97706" },
    { k: "cost", l: "비용 최적화", c: "#7c3aed" },
    { k: "sustainability", l: "지속 가능성", c: "#0891b2" },
  ];
  return (
    <div className="mb-5 rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3.5 text-sm font-bold text-gray-900">
        {"\u26A1"} Well-Architected 6 필라 평가
      </div>
      <div className="grid grid-cols-3 gap-2.5">
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
                {["", "초기", "기본", "양호", "우수", "최우수"][v]}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 text-[11px] text-gray-400">
        ※ 입력 답변 기반 자동 평가. 실제 검토는 AWS Well-Architected Tool 사용
        권장
      </div>
    </div>
  );
}

interface ArchOutputProps {
  arch: Architecture;
}

export function ArchOutput({ arch }: ArchOutputProps) {
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
                ({layer.services.length}개 서비스/항목)
              </span>
            </div>
            <div className="text-base text-gray-400">
              {expand[layer.id] ? "\u25B2" : "\u25BC"}
            </div>
          </div>
          {expand[layer.id] && (
            <div className="px-5 pb-4">
              {/* Header */}
              <div className="grid grid-cols-[160px_1fr_1fr_100px_200px] gap-0 border-b border-gray-100 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                <span>서비스</span>
                <span>세부사항</span>
                <span>선택 이유</span>
                <span className="text-center">비용</span>
                <span>최적화</span>
              </div>
              {layer.services.map((svc, i) =>
                svc.reason !== undefined ? (
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
                    {"\uD83D\uDCA1"} 설계 포인트
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
