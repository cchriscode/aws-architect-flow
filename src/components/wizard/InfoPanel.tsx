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

interface InfoPanelProps {
  info: InfoEntry | null;
  onClose: () => void;
}

export function InfoPanel({ info, onClose }: InfoPanelProps) {
  return (
    <Dialog open={!!info} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[560px] gap-0 p-0">
        <DialogHeader className="border-b border-gray-100 px-6 pt-5 pb-4">
          <div className="mb-1 text-[11px] font-bold tracking-wider text-indigo-600">
            {"\u2139\uFE0F"} 선택지 상세 정보
          </div>
          <DialogTitle className="text-[17px] font-extrabold text-gray-900">
            {info?.title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            선택지에 대한 상세 정보입니다.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          {/* 요약 */}
          {info?.summary && (
            <div className="border-b border-gray-100 bg-gray-50 px-6 py-3.5">
              <div className="text-[13px] leading-[1.7] text-gray-700">
                {info.summary}
              </div>
            </div>
          )}

          {/* 관련 AWS 서비스 */}
          {info?.services && info.services.length > 0 && (
            <div className="border-b border-gray-100 px-6 py-4">
              <div className="mb-3 text-[11px] font-bold tracking-wider text-gray-500">
                {"\uD83D\uDD27"} 관련 AWS 서비스
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

          {/* 데이터 흐름 */}
          {info?.flow && (
            <div className="border-b border-gray-100 px-6 py-3.5">
              <div className="mb-2 text-[11px] font-bold tracking-wider text-gray-500">
                {"\uD83D\uDCCA"} 데이터 흐름
              </div>
              <div className="whitespace-pre-wrap rounded-lg border border-emerald-200 bg-green-50 px-3.5 py-2.5 font-mono text-xs leading-[1.8] text-gray-900">
                {info.flow}
              </div>
            </div>
          )}

          {/* 핵심 팁 */}
          {info?.tip && (
            <div className="px-6 py-3.5">
              <div className="mb-1.5 text-[11px] font-bold tracking-wider text-gray-500">
                {"\uD83D\uDCA1"} 핵심 포인트
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
