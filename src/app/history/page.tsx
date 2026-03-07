"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  getHistory,
  deleteFromHistory,
  renameHistory,
  clearHistory,
  type HistoryEntry,
} from "@/lib/history";

const PATTERN_LABELS: Record<string, string> = {
  serverless: "Serverless",
  container: "Container",
  vm: "VM (EC2)",
  hybrid: "Hybrid",
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR");
}

function loadUrl(entry: HistoryEntry): string {
  const json = JSON.stringify({
    state: entry.state,
    completedPhases: entry.completedPhases,
  });
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return `/?d=${b64}`;
}

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await getHistory();
    setEntries(data);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function handleDelete(id: string) {
    await deleteFromHistory(id);
    await refresh();
  }

  async function handleClearAll() {
    if (!confirm("저장된 모든 설계를 삭제하시겠습니까?")) return;
    await clearHistory();
    await refresh();
  }

  function startRename(entry: HistoryEntry) {
    setEditingId(entry.id);
    setEditName(entry.name);
  }

  async function commitRename(id: string) {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== entries.find((e) => e.id === id)?.name) {
      await renameHistory(id, trimmed);
      await refresh();
    }
    setEditingId(null);
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-7 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
          <span className="text-base font-extrabold text-gray-900">
            ArchFlow
          </span>
          <span className="text-xs text-gray-400">
            저장 목록
          </span>
        </div>
        <Link
          href="/"
          className="rounded-lg border-[1.5px] border-gray-200 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          {"\u2190"} 홈으로
        </Link>
      </div>

      <div className="mx-auto max-w-[900px] px-7 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-gray-400">
            불러오는 중...
          </div>
        ) : entries.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center gap-3 rounded-xl border-[1.5px] border-dashed border-gray-300 bg-white px-8 py-16 text-center">
            <div className="text-4xl opacity-40">{"📋"}</div>
            <div className="text-sm font-semibold text-gray-600">
              저장된 설계가 없습니다
            </div>
            <div className="text-xs text-gray-400">
              결과 화면에서 "저장" 버튼을 눌러 아키텍처를 저장하세요
            </div>
            <Link
              href="/"
              className="mt-2 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              설계 시작하기
            </Link>
          </div>
        ) : (
          <>
            {/* Card list */}
            <div className="flex flex-col gap-3">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-xl border-[1.5px] border-gray-200 bg-white px-5 py-4 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Left: name + meta */}
                    <div className="min-w-0 flex-1">
                      {editingId === entry.id ? (
                        <input
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onBlur={() => commitRename(entry.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitRename(entry.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          className="w-full rounded-md border border-indigo-300 px-2 py-1 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                      ) : (
                        <button
                          onClick={() => startRename(entry)}
                          className="truncate text-left text-sm font-bold text-gray-900 hover:text-indigo-600"
                          title="클릭하여 이름 수정"
                        >
                          {entry.name}
                        </button>
                      )}
                      <div className="mt-1 text-[11px] text-gray-400">
                        {relativeTime(entry.savedAt)}
                      </div>
                      {/* Badges */}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-600">
                          ${entry.summary.monthlyCost.toLocaleString()}/월
                        </span>
                        <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                          WAFR {entry.summary.wafrScore}점
                        </span>
                        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                          {PATTERN_LABELS[entry.summary.archPattern] ||
                            entry.summary.archPattern}
                        </span>
                      </div>
                    </div>

                    {/* Right: actions */}
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Link
                        href={loadUrl(entry)}
                        className="rounded-lg border-[1.5px] border-indigo-200 bg-indigo-50 px-3.5 py-1.5 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-100"
                      >
                        불러오기
                      </Link>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="rounded-lg border-[1.5px] border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Clear all */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleClearAll}
                className="rounded-lg border-[1.5px] border-red-200 bg-white px-4 py-2 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
              >
                전체 삭제
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
