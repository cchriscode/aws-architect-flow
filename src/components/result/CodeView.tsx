"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { WizardState } from "@/lib/types";
import { generateCodeSnippets } from "@/lib/code-snippets";
import { useDict, useLang } from "@/lib/i18n/context";

interface CodeViewProps {
  state: WizardState;
}

const langColors: Record<string, string> = {
  hcl: "#7b42bc",
  typescript: "#3178c6",
  yaml: "#cb171e",
  python: "#3776ab",
};

export function CodeView({ state }: CodeViewProps) {
  const t = useDict();
  const { lang } = useLang();
  const allLabel = lang === "ko" ? "전체" : "All";
  const [activeIdx, setActiveIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [filterCat, setFilterCat] = useState(allLabel);
  const allSnippets = generateCodeSnippets(state);
  const categories = [
    allLabel,
    ...new Set(allSnippets.map((s) => s.category)),
  ];
  const snippets =
    filterCat === allLabel
      ? allSnippets
      : allSnippets.filter((s) => s.category === filterCat);
  const active = snippets[activeIdx] || allSnippets[0];
  const iac = state.cicd?.iac;

  useEffect(() => {
    setActiveIdx(0);
  }, [filterCat]);

  useEffect(() => {
    setFilterCat(allLabel);
  }, [allLabel]);

  const copy = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!allSnippets.length)
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
        <div className="text-[13px] text-gray-500">
          {t.codeView.desc}
        </div>
      </div>
    );

  return (
    <div className="grid grid-cols-[220px_1fr] gap-5">
      <div>
        <div className="mb-2.5 rounded-xl border border-gray-200 bg-white px-3.5 py-3">
          <div className="mb-1 text-[13px] font-bold text-gray-900">
            {t.codeView.title}{" "}
            <span className="rounded-full bg-indigo-600 px-[7px] py-px text-[11px] text-white">
              {allSnippets.length}
            </span>
          </div>
          <div className="text-[11px] text-gray-500">
            IaC:{" "}
            {iac === "cdk"
              ? "CDK (TypeScript)"
              : "Terraform (HCL)"}
          </div>
        </div>
        <div className="mb-2.5 overflow-hidden rounded-xl border border-gray-200 bg-white">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={cn(
                "flex w-full items-center justify-between border-b border-gray-100 px-3.5 py-2 text-left text-xs",
                filterCat === cat
                  ? "bg-indigo-50 font-bold text-indigo-600"
                  : "bg-white font-normal text-gray-700"
              )}
            >
              <span>{cat}</span>
              <span className="text-[10px] text-gray-400">
                {cat === allLabel
                  ? allSnippets.length
                  : allSnippets.filter((s) => s.category === cat)
                      .length}
              </span>
            </button>
          ))}
        </div>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {snippets.map((s, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={cn(
                "w-full border-b border-gray-50 px-3 py-2.5 text-left",
                activeIdx === i ? "bg-indigo-50" : "bg-white"
              )}
            >
              <div
                className={cn(
                  "mb-0.5 text-xs leading-tight",
                  activeIdx === i
                    ? "font-bold text-indigo-600"
                    : "font-medium text-gray-700"
                )}
              >
                {s.title}
              </div>
              <span
                className="text-[10px] font-bold uppercase"
                style={{
                  color: langColors[s.lang] || "#6b7280",
                }}
              >
                {s.lang}
              </span>
            </button>
          ))}
        </div>
      </div>

      {active && (
        <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="flex items-start gap-3 border-b border-gray-100 px-5 py-3.5">
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500">
                  {active.category}
                </span>
                <span
                  className="rounded px-[7px] py-0.5 text-[11px] font-bold uppercase"
                  style={{
                    background:
                      (langColors[active.lang] || "#6b7280") + "20",
                    color: langColors[active.lang] || "#6b7280",
                  }}
                >
                  {active.lang}
                </span>
              </div>
              <div className="mb-0.5 text-[15px] font-bold text-gray-900">
                {active.title}
              </div>
              <div className="text-xs text-gray-500">{active.desc}</div>
            </div>
            <button
              onClick={() => copy(active.code)}
              className={cn(
                "shrink-0 rounded-[7px] border-[1.5px] border-gray-200 px-4 py-[7px] text-xs font-semibold transition-all",
                copied
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-gray-700"
              )}
            >
              {copied ? t.codeView.copied : t.codeView.copyBtn}
            </button>
          </div>
          <div className="flex-1 overflow-hidden bg-[#1e1e1e]">
            <pre className="m-0 max-h-[520px] overflow-auto px-5 py-4 font-[JetBrains_Mono,Fira_Code,Consolas,monospace] text-[11.5px] leading-[1.75] text-gray-300">
              <code>{active.code}</code>
            </pre>
          </div>
          <div className="border-t border-gray-100 bg-gray-50 px-5 py-2 text-[11px] text-gray-500">
            {"💡"} {lang === "ko"
              ? "이 코드는 참고용 스니펫입니다. 배포 전 보안·IAM·네트워크 설정을 반드시 검토하세요."
              : "This is a reference snippet. Review security, IAM, and network settings before deploying."}
          </div>
        </div>
      )}
    </div>
  );
}
