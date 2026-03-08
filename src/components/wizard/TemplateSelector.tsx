"use client";

import type { WizardState } from "@/lib/types";
import { useDict } from "@/lib/i18n/context";

interface TemplateSelectorProps {
  onSelect: (state: WizardState) => void;
}

export function TemplateSelector({ onSelect }: TemplateSelectorProps) {
  const t = useDict();
  const ICONS: Record<string, string> = {
    ecommerce_mvp: "🛒",
    b2b_saas: "💼",
    internal_tool: "🏢",
    realtime_chat: "💬",
    data_pipeline: "📊",
    generic_web_api: "🌐",
    ticketing: "🎫",
    iot_platform: "📡",
  };

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
      <div className="grid grid-cols-3 gap-2.5">
        {t.templates.map((tmpl) => (
          <button
            key={tmpl.id}
            onClick={() => {
              // Import template state from the data file
              import("@/data/templates").then(({ TEMPLATES }) => {
                const found = TEMPLATES.find((t) => t.id === tmpl.id);
                if (found) onSelect(found.state);
              });
            }}
            className="group flex flex-col items-start gap-1.5 rounded-xl border-[1.5px] border-gray-200 bg-white px-4 py-3.5 text-left transition-all hover:border-indigo-400 hover:bg-indigo-50 hover:shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{ICONS[tmpl.id] || "📦"}</span>
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
    </div>
  );
}
