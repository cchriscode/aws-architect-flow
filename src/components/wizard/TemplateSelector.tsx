"use client";

import { TEMPLATES } from "@/data/templates";
import type { WizardState } from "@/lib/types";

interface TemplateSelectorProps {
  onSelect: (state: WizardState) => void;
}

export function TemplateSelector({ onSelect }: TemplateSelectorProps) {
  return (
    <div className="mb-6">
      <div className="mb-3">
        <div className="mb-1 text-[15px] font-bold text-gray-900">
          {"\u26A1"} 빠른 시작 &mdash; 템플릿으로 바로 시작하기
        </div>
        <div className="text-xs text-gray-500">
          \uC544\uB798 \uD15C\uD50C\uB9BF\uC744 \uC120\uD0DD\uD558\uBA74 14\uB2E8\uACC4 \uC9C8\uBB38 \uC5C6\uC774 \uBC14\uB85C \uC544\uD0A4\uD14D\uCC98 \uACB0\uACFC\uB97C \uBC1B\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uACB0\uACFC \uD654\uBA74\uC5D0\uC11C \uC218\uC815\uB3C4 \uAC00\uB2A5\uD569\uB2C8\uB2E4.
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(t.state)}
            className="group flex flex-col items-start gap-1.5 rounded-xl border-[1.5px] border-gray-200 bg-white px-4 py-3.5 text-left transition-all hover:border-indigo-400 hover:bg-indigo-50 hover:shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{t.icon}</span>
              <span className="text-[13px] font-bold text-gray-900 group-hover:text-indigo-600">
                {t.label}
              </span>
            </div>
            <div className="text-[11px] leading-relaxed text-gray-500">
              {t.desc}
            </div>
          </button>
        ))}
      </div>
      <div className="mt-3 border-b border-dashed border-gray-200 pb-1 text-center text-[11px] text-gray-400">
        \uB610\uB294 \uC544\uB798 \uC9C8\uBB38\uC5D0 \uC9C1\uC811 \uB2F5\uBCC0\uD558\uC5EC \uB9DE\uCDA4 \uC124\uACC4\uD558\uAE30 {"\u2193"}
      </div>
    </div>
  );
}
