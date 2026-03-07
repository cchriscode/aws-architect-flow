"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { WizardState } from "@/lib/types";
import { generateArchitecture } from "@/lib/architecture";
import { getHistoryCount } from "@/lib/history";
import { UserMenu } from "@/components/layout/UserMenu";

interface HeaderProps {
  showResult: boolean;
  completedPhases: Set<string>;
  allPhaseState: WizardState;
  onReset: () => void;
  onImport: (data: {
    state: WizardState;
    completedPhases: string[];
  }) => void;
}

export function Header({
  showResult,
  completedPhases,
  allPhaseState,
  onReset,
  onImport,
}: HeaderProps) {
  const [shareMsg, setShareMsg] = useState("");
  const [historyCount, setHistoryCount] = useState(0);

  useEffect(() => {
    getHistoryCount().then(setHistoryCount);
  }, []);

  function shareURL() {
    try {
      const json = JSON.stringify({
        state: allPhaseState,
        completedPhases: [...completedPhases],
      });
      const b64 = btoa(unescape(encodeURIComponent(json)));
      const url =
        window.location.origin + window.location.pathname + "?d=" + b64;
      navigator.clipboard.writeText(url).then(() => {
        setShareMsg("\u2705 \uB9C1\uD06C \uBCF5\uC0AC\uB428!");
        setTimeout(() => setShareMsg(""), 2500);
      });
    } catch {
      setShareMsg("\u274C \uBCF5\uC0AC \uC2E4\uD328");
    }
  }

  function exportJSON() {
    const json = JSON.stringify(
      {
        state: allPhaseState,
        completedPhases: [...completedPhases],
      },
      null,
      2
    );
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aws-arch-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.state) {
          onImport({
            state: data.state,
            completedPhases: data.completedPhases || [],
          });
        }
      } catch {
        alert("\uC62C\uBC14\uB978 JSON \uD30C\uC77C\uC774 \uC544\uB2D9\uB2C8\uB2E4.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="flex items-center justify-between border-b border-gray-200 bg-white px-7 py-3.5">
      <div className="flex items-center gap-2.5">
        <div className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
        <span className="text-base font-extrabold text-gray-900">
          ArchFlow
        </span>
        <span className="text-xs text-gray-400">
          AWS {"\uC544\uD0A4\uD14D\uCC98"} {"\uC124\uACC4"} {"\uAC00\uC774\uB4DC"}
        </span>
        <Link
          href="/history"
          className="ml-2 flex items-center gap-1 rounded-lg border-[1.5px] border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          {"\uD83D\uDCCB"} {"\uC800\uC7A5"} {"\uBAA9\uB85D"}
          {historyCount > 0 && (
            <span className="rounded-full bg-indigo-600 px-1.5 py-px text-[10px] font-bold text-white">
              {historyCount}
            </span>
          )}
        </Link>
      </div>
      <div className="flex items-center gap-2">
        {showResult && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={exportJSON}
              className="rounded-lg border-[1.5px] border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700"
            >
              {"\u2B07\uFE0F"} JSON
            </button>
            <label className="cursor-pointer rounded-lg border-[1.5px] border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700">
              {"\u2B06\uFE0F"} {"\uBD88\uB7EC\uC624\uAE30"}
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportFile}
              />
            </label>
            <div className="relative">
              <button
                onClick={shareURL}
                className="rounded-lg border-[1.5px] border-indigo-200 bg-indigo-50 px-3.5 py-1.5 text-xs font-semibold text-indigo-600"
              >
                {"\uD83D\uDD17"} {"\uACF5\uC720"}
              </button>
              {shareMsg && (
                <div className="absolute right-0 top-full z-[100] mt-1 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1 text-[11px] text-white">
                  {shareMsg}
                </div>
              )}
            </div>
          </div>
        )}
        {(completedPhases.size > 0 || showResult) && (
          <button
            onClick={onReset}
            className="rounded-lg border-[1.5px] border-gray-200 bg-white px-3.5 py-1.5 text-xs text-gray-500"
          >
            {"\u21BA"} {"\uCC98\uC74C\uBD80\uD130"}
          </button>
        )}
        <UserMenu />
      </div>
    </div>
  );
}
