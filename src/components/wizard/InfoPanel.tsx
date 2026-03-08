"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { InfoEntry } from "@/lib/types";
import { useDict } from "@/lib/i18n/context";

interface InfoPanelProps {
  info: InfoEntry | null;
  onClose: () => void;
}

export function InfoPanel({ info, onClose }: InfoPanelProps) {
  const t = useDict();

  return (
    <Dialog open={!!info} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[560px] gap-0 p-0">
        <DialogHeader className="border-b border-gray-100 px-6 pt-5 pb-4">
          <div className="mb-1 text-[11px] font-bold tracking-wider text-indigo-600">
            {"ℹ️"} {t.questionCard.moreInfo}
          </div>
          <DialogTitle className="text-[17px] font-extrabold text-gray-900">
            {info?.title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t.questionCard.moreInfo}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          {info?.summary && (
            <div className="border-b border-gray-100 bg-gray-50 px-6 py-3.5">
              <div className="text-[13px] leading-[1.7] text-gray-700">
                {info.summary}
              </div>
            </div>
          )}

          {info?.services && info.services.length > 0 && (
            <div className="border-b border-gray-100 px-6 py-4">
              <div className="mb-3 text-[11px] font-bold tracking-wider text-gray-500">
                {t.infoPanel.related}
              </div>
              {info.services.map((svc, i) => (
                <div
                  key={i}
                  className="mb-2.5 rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-bold text-gray-900">
                      {svc.name}
                    </span>
                    <span className="text-[11px] text-indigo-600">
                      {svc.connects}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500">{svc.role}</div>
                </div>
              ))}
            </div>
          )}

          {info?.flow && (
            <div className="border-b border-gray-100 px-6 py-3.5">
              <div className="mb-2 text-[11px] font-bold tracking-wider text-gray-500">
                {"📊"} {t.diagramView.tabData}
              </div>
              <div className="whitespace-pre-wrap rounded-lg border border-emerald-200 bg-green-50 px-3.5 py-2.5 font-mono text-xs leading-[1.8] text-gray-900">
                {info.flow}
              </div>
            </div>
          )}

          {info?.tip && (
            <div className="px-6 py-3.5">
              <div className="mb-1.5 text-[11px] font-bold tracking-wider text-gray-500">
                {t.infoPanel.why}
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs leading-[1.7] text-gray-700">
                {info.tip}
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
