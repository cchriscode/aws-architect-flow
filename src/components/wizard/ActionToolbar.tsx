"use client";

import { useState } from "react";
import { Save, Share2, RotateCcw, Lightbulb } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Dict } from "@/lib/i18n/types";
import type { WizardState } from "@/lib/types";

interface ActionToolbarProps {
  session: unknown;
  allPhaseState: WizardState;
  completedPhases: Set<string>;
  showResult: boolean;
  onSave: () => Promise<void>;
  onShare: () => void;
  onReset: () => void;
  onLoginClick: () => void;
  saveToast: string;
  shareMsg: string;
  t: Dict;
}

export function ActionToolbar({
  session,
  allPhaseState,
  completedPhases,
  showResult,
  onSave,
  onShare,
  onReset,
  onLoginClick,
  saveToast,
  shareMsg,
  t,
}: ActionToolbarProps) {
  const [resetOpen, setResetOpen] = useState(false);
  const hasProgress = completedPhases.size > 0 || showResult;

  return (
    <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50/80 to-white px-3 py-2.5 md:px-7">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4">
        {/* Step hint */}
        <div className="hidden items-center gap-1.5 text-[12px] text-indigo-500 md:flex">
          <Lightbulb className="h-3.5 w-3.5" />
          <span>{t.wizard.stepHint}</span>
        </div>

        {hasProgress && (
          <div className="flex flex-wrap items-center gap-1 md:gap-1.5">
            {/* Save */}
            <div className="relative">
              <button
                onClick={async () => {
                  if (!session) {
                    onLoginClick();
                    return;
                  }
                  await onSave();
                }}
                className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 md:py-1.5 md:text-[11px]"
              >
                <Save className="h-3.5 w-3.5" />
                {t.result.saveBtn.replace(/^[\p{Emoji_Presentation}\p{So}\s]+/u, "").trim()}
              </button>
              {saveToast && (
                <div className="absolute right-0 top-full z-[100] mt-1 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1 text-[11px] text-white">
                  {saveToast}
                </div>
              )}
            </div>

            {/* Share */}
            <div className="relative">
              <button
                onClick={onShare}
                className="inline-flex items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-100 md:py-1.5 md:text-[11px]"
              >
                <Share2 className="h-3.5 w-3.5" />
                {t.header.share.replace(/^[\p{Emoji_Presentation}\p{So}\s]+/u, "").trim()}
              </button>
              {shareMsg && (
                <div className="absolute right-0 top-full z-[100] mt-1 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1 text-[11px] text-white">
                  {shareMsg}
                </div>
              )}
            </div>

            {/* Reset */}
            <button
              onClick={() => setResetOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-gray-800 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-gray-900 md:py-1.5 md:text-[11px]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t.header.resetAll.replace(/^[\p{Emoji_Presentation}\p{So}\s]+/u, "").trim()}
            </button>

            <ConfirmDialog
              open={resetOpen}
              onOpenChange={setResetOpen}
              title={t.confirm.resetTitle}
              description={t.confirm.resetDesc}
              confirmLabel={t.confirm.confirm}
              cancelLabel={t.confirm.cancel}
              variant="danger"
              onConfirm={onReset}
            />
          </div>
        )}
      </div>
    </div>
  );
}
