"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { WizardState } from "@/lib/types";
import { generateSecurityGroups } from "@/lib/security-groups";
import { useDict, useLang } from "@/lib/i18n/context";

interface SecurityGroupViewProps {
  state: WizardState;
}

export function SecurityGroupView({ state }: SecurityGroupViewProps) {
  const t = useDict();
  const { lang } = useLang();
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const { groups, code, iac } = generateSecurityGroups(state, lang);

  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4">
        <div>
          <div className="mb-1 text-[15px] font-bold text-gray-900">
            {t.securityGroupView.title}
          </div>
          <div className="text-xs text-gray-500">
            {t.securityGroupView.sgCount(groups.length)}
          </div>
        </div>
        <button
          onClick={() => setShowCode(!showCode)}
          className={cn(
            "rounded-lg border-[1.5px] px-4 py-2 text-xs font-semibold",
            showCode
              ? "border-indigo-200 bg-indigo-50 text-indigo-600"
              : "border-gray-200 bg-white text-gray-700"
          )}
        >
          {showCode
            ? t.securityGroupView.showDiagram
            : t.securityGroupView.showCode}
        </button>
      </div>

      {showCode ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
            <span className="text-xs font-semibold text-gray-700">
              {iac === "cdk" ? "TypeScript (CDK)" : "HCL (Terraform)"}
            </span>
            <button
              onClick={copy}
              className={cn(
                "rounded-md border border-gray-200 px-3 py-1 text-[11px]",
                copied
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-gray-700"
              )}
            >
              {copied ? t.securityGroupView.copied : t.securityGroupView.copy}
            </button>
          </div>
          <pre className="m-0 max-h-[600px] overflow-auto bg-[#1e1e1e] px-5 py-4 font-[JetBrains_Mono,monospace] text-[11px] leading-[1.7] text-gray-300">
            <code>{code}</code>
          </pre>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3 md:grid-cols-[repeat(auto-fill,minmax(340px,1fr))]">
          {groups.map((sg) => (
            <div
              key={sg.id}
              className="overflow-hidden rounded-xl border-[1.5px]"
              style={{ borderColor: sg.color + "40" }}
            >
              <div
                className="border-b px-4 py-3"
                style={{
                  background: sg.color + "10",
                  borderColor: sg.color + "30",
                }}
              >
                <div
                  className="text-[13px] font-bold"
                  style={{ color: sg.color }}
                >
                  {sg.name}
                </div>
                <div className="mt-0.5 text-[11px] text-gray-500">
                  {sg.desc}
                </div>
              </div>
              <div className="bg-white px-4 py-3">
                {sg.inbound.length > 0 && (
                  <div className="mb-3">
                    <div className="mb-1.5 text-[11px] font-bold text-blue-600">
                      {t.securityGroupView.inboundAllow}
                    </div>
                    {sg.inbound.map((r, i) => (
                      <div
                        key={i}
                        className="mb-1 flex items-center gap-2 rounded-md bg-blue-50 px-2 py-1"
                      >
                        <span className="min-w-[36px] text-right text-[11px] font-bold text-blue-700">
                          {r.port}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {"\u2190"}
                        </span>
                        <span className="flex-1 text-[11px] text-gray-700">
                          {r.from}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {sg.outbound.length > 0 && (
                  <div>
                    <div className="mb-1.5 text-[11px] font-bold text-emerald-600">
                      {t.securityGroupView.outboundAllow}
                    </div>
                    {sg.outbound.map((r, i) => (
                      <div
                        key={i}
                        className="mb-1 flex items-center gap-2 rounded-md bg-green-50 px-2 py-1"
                      >
                        <span className="min-w-[36px] text-right text-[11px] font-bold text-green-700">
                          {r.port}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {"\u2192"}
                        </span>
                        <span className="flex-1 text-[11px] text-gray-700">
                          {r.to}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {sg.inbound.length === 0 && sg.outbound.length === 0 && (
                  <div className="p-2 text-center text-xs text-gray-400">
                    {t.securityGroupView.allBlocked}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-yellow-800">
        {t.securityGroupView.prefixWarning}
      </div>
    </div>
  );
}
