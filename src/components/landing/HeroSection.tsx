"use client";

import { useMemo, useState } from "react";
import { useDict, useLang } from "@/lib/i18n/context";
import { TEMPLATES } from "@/data/templates";
import { generateArchitecture } from "@/lib/architecture";
import { estimateMonthlyCost } from "@/lib/cost";
import { wellArchitectedScore } from "@/lib/wafr";
import { generateSummary } from "@/lib/summary";
import { DiagramView } from "@/components/result/DiagramView";
import { CostView } from "@/components/result/CostView";
import { WafrView } from "@/components/result/WafrView";
import { SummaryView } from "@/components/result/SummaryView";
import { cn } from "@/lib/utils";

interface HeroSectionProps {
  onStart: () => void;
}

const DEMO_TABS = ["summary", "diagram", "cost", "wafr"] as const;
type DemoTab = (typeof DEMO_TABS)[number];

export function HeroSection({ onStart }: HeroSectionProps) {
  const t = useDict();
  const { lang } = useLang();
  const [activeTab, setActiveTab] = useState<DemoTab>("diagram");

  const template = TEMPLATES[0]; // ecommerce_mvp
  const exampleState = template.state;

  const { arch, cost, wafr, summary } = useMemo(() => {
    const a = generateArchitecture(exampleState, lang);
    const c = estimateMonthlyCost(exampleState, lang);
    const w = wellArchitectedScore(exampleState, lang);
    const s = generateSummary(exampleState, { arch: a, cost: c, wafr: w }, lang);
    return { arch: a, cost: c, wafr: w, summary: s };
  }, [exampleState, lang]);

  const tabLabels: Record<DemoTab, string> = {
    summary: lang === "ko" ? "요약" : "Summary",
    diagram: lang === "ko" ? "아키텍처 다이어그램" : "Architecture Diagram",
    cost: lang === "ko" ? `비용 $${cost.totalMid.toLocaleString()}` : `Cost $${cost.totalMid.toLocaleString()}`,
    wafr: `WAFR ${wafr.overall}pts`,
  };

  return (
    <div className="bg-white">
      {/* Hero header */}
      <div className="border-b border-gray-100 px-4 pb-10 pt-12 md:pb-14 md:pt-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-3 text-2xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
            {t.hero.headline}
          </h1>
          <p className="mb-8 text-sm text-gray-500 md:text-base">
            {t.hero.subheadline}
          </p>

          <div className="mx-auto mb-10 grid max-w-2xl grid-cols-2 gap-3 md:grid-cols-4">
            {t.hero.features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-4"
              >
                <div className="mb-2 text-sm font-bold text-indigo-400">{f.icon}</div>
                <div className="text-xs font-bold text-gray-900">{f.title}</div>
                <div className="mt-0.5 text-[10px] text-gray-400">{f.desc}</div>
              </div>
            ))}
          </div>

          <button
            onClick={onStart}
            className="rounded-xl bg-indigo-600 px-10 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md"
          >
            {t.hero.cta}
          </button>
        </div>
      </div>

      {/* Example result showcase */}
      <div className="border-b border-gray-100 bg-gray-50 px-4 py-10 md:py-14">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-6 text-center">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-indigo-500">
              {lang === "ko" ? "예시 결과" : "Example Output"}
            </div>
            <h2 className="text-lg font-bold text-gray-900 md:text-xl">
              {summary.headline}
            </h2>
            <p className="mt-1 text-xs text-gray-400">
              {lang === "ko"
                ? "이커머스 MVP 템플릿으로 생성된 실제 결과입니다"
                : "Real output generated from the E-commerce MVP template"}
            </p>
          </div>

          {/* Stats bar */}
          <div className="mx-auto mb-6 flex max-w-xl justify-center gap-3">
            <div className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-center">
              <div className="text-[10px] text-gray-400">
                {lang === "ko" ? "월간 비용" : "Monthly Cost"}
              </div>
              <div className="text-sm font-bold text-emerald-600">
                ${cost.totalMid.toLocaleString()}
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-center">
              <div className="text-[10px] text-gray-400">WAFR</div>
              <div className="text-sm font-bold text-violet-600">
                {wafr.overall}pts
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-center">
              <div className="text-[10px] text-gray-400">
                {lang === "ko" ? "서비스" : "Services"}
              </div>
              <div className="text-sm font-bold text-blue-600">
                {arch.layers.reduce((s, l) => s + l.services.length, 0)}
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-center">
              <div className="text-[10px] text-gray-400">
                {lang === "ko" ? "가용성" : "Availability"}
              </div>
              <div className="text-sm font-bold text-blue-600">
                {summary.stats.availability}%
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-4 flex justify-center">
            <div className="inline-flex gap-1 rounded-lg bg-gray-200/60 p-1">
              {DEMO_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "rounded-md px-4 py-1.5 text-xs font-semibold transition-all",
                    activeTab === tab
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  {tabLabels[tab]}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
            {activeTab === "summary" && (
              <SummaryView state={exampleState} arch={arch} />
            )}
            {activeTab === "diagram" && (
              <DiagramView arch={arch} state={exampleState} />
            )}
            {activeTab === "cost" && <CostView state={exampleState} />}
            {activeTab === "wafr" && <WafrView state={exampleState} />}
          </div>

          {/* Bottom CTA */}
          <div className="mt-8 text-center">
            <button
              onClick={onStart}
              className="rounded-xl bg-indigo-600 px-10 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md"
            >
              {t.hero.cta}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
