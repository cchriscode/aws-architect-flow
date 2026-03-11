"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { LoginModal } from "@/components/auth/LoginModal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useDict, useLang } from "@/lib/i18n/context";
import { ClipboardList } from "lucide-react";
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

function useRelativeTime() {
  const t = useDict();
  const { lang } = useLang();
  return (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t.history.justNow;
    if (mins < 60) return t.history.minutesAgo(mins);
    const hours = Math.floor(mins / 60);
    if (hours < 24) return t.history.hoursAgo(hours);
    const days = Math.floor(hours / 24);
    if (days < 30) return t.history.daysAgo(days);
    return new Date(iso).toLocaleDateString(lang === "ko" ? "ko-KR" : "en-US");
  };
}

function loadUrl(entry: HistoryEntry): string {
  const json = JSON.stringify({
    state: entry.state,
    completedPhases: entry.completedPhases,
  });
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return `/?d=${b64}`;
}

/** Group entries by date category */
function groupByDate(
  entries: HistoryEntry[],
  labels: { today: string; yesterday: string; thisWeek: string; earlier: string }
): { label: string; count: number; entries: HistoryEntry[] }[] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86400000;
  // "This week" = last 7 days (excluding today/yesterday)
  const weekStart = todayStart - 6 * 86400000;

  const groups: Record<string, HistoryEntry[]> = {
    today: [],
    yesterday: [],
    thisWeek: [],
    earlier: [],
  };

  for (const entry of entries) {
    const ts = new Date(entry.savedAt).getTime();
    if (ts >= todayStart) {
      groups.today.push(entry);
    } else if (ts >= yesterdayStart) {
      groups.yesterday.push(entry);
    } else if (ts >= weekStart) {
      groups.thisWeek.push(entry);
    } else {
      groups.earlier.push(entry);
    }
  }

  const result: { label: string; count: number; entries: HistoryEntry[] }[] = [];
  if (groups.today.length > 0) result.push({ label: labels.today, count: groups.today.length, entries: groups.today });
  if (groups.yesterday.length > 0) result.push({ label: labels.yesterday, count: groups.yesterday.length, entries: groups.yesterday });
  if (groups.thisWeek.length > 0) result.push({ label: labels.thisWeek, count: groups.thisWeek.length, entries: groups.thisWeek });
  if (groups.earlier.length > 0) result.push({ label: labels.earlier, count: groups.earlier.length, entries: groups.earlier });
  return result;
}

export default function HistoryPage() {
  const t = useDict();
  const relativeTime = useRelativeTime();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Delete confirmation dialog state
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);

  // Undo toast state
  const [toast, setToast] = useState<{ message: string; entry: HistoryEntry } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await getHistory();
    setEntries(data);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Clear toast timer on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  function showUndoToast(entry: HistoryEntry) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message: t.history.deleted, entry });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 5000);
  }

  async function handleUndo(entry: HistoryEntry) {
    setToast(null);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    // Re-save the entry via POST
    await fetch("/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: entry.name,
        state: entry.state,
        completedPhases: entry.completedPhases,
        summary: entry.summary,
      }),
    });
    await refresh();
  }

  async function confirmDelete(id: string) {
    const entry = entries.find((e) => e.id === id);
    await deleteFromHistory(id);
    await refresh();
    if (entry) showUndoToast(entry);
  }

  async function confirmClearAll() {
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

  const groups = groupByDate(entries, {
    today: t.history.today,
    yesterday: t.history.yesterday,
    thisWeek: t.history.thisWeek,
    earlier: t.history.earlier,
  });

  return (
    <div className="min-h-screen bg-gray-100">
      <Header onLoginClick={() => setShowLoginModal(true)} />
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}

      {/* Delete single confirm */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title={t.history.deleteConfirm}
        confirmLabel={t.confirm.delete}
        cancelLabel={t.confirm.cancel}
        variant="danger"
        onConfirm={() => {
          if (deleteTarget) confirmDelete(deleteTarget);
        }}
      />

      {/* Delete all confirm */}
      <ConfirmDialog
        open={deleteAllOpen}
        onOpenChange={setDeleteAllOpen}
        title={t.history.deleteAllConfirm}
        confirmLabel={t.confirm.delete}
        cancelLabel={t.confirm.cancel}
        variant="danger"
        onConfirm={confirmClearAll}
      />

      <div className="mx-auto max-w-[900px] px-7 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-sm font-bold text-gray-700">{t.history.title}</h1>
          <Link
            href="/"
            className="rounded-lg border-[1.5px] border-gray-200 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            {t.history.backHome}
          </Link>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-gray-400">
            {t.history.loading}
          </div>
        ) : entries.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center gap-3 rounded-xl border-[1.5px] border-dashed border-gray-300 bg-white px-8 py-16 text-center">
            <ClipboardList className="h-10 w-10 text-gray-300" />
            <div className="text-sm font-semibold text-gray-600">
              {t.history.emptyTitle}
            </div>
            <div className="text-xs text-gray-400">
              {t.history.emptyDesc}
            </div>
            <Link
              href="/"
              className="mt-2 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              {t.history.startDesign}
            </Link>
          </div>
        ) : (
          <>
            {/* Grouped card list */}
            <div className="flex flex-col gap-5">
              {groups.map((group) => (
                <div key={group.label}>
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-500">
                    <span>{group.label}</span>
                    <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] text-gray-500">
                      {group.count}
                    </span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {group.entries.map((entry) => (
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
                                aria-label={t.history.editNameTooltip}
                                className="w-full rounded-md border border-indigo-300 px-2 py-1 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-200"
                              />
                            ) : (
                              <button
                                onClick={() => startRename(entry)}
                                className="truncate text-left text-sm font-bold text-gray-900 hover:text-indigo-600"
                                title={t.history.editNameTooltip}
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
                                ${entry.summary.monthlyCost.toLocaleString()}{t.history.perMonth}
                              </span>
                              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                                {t.history.wafrScore(entry.summary.wafrScore)}
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
                              {t.history.loadBtn}
                            </Link>
                            <button
                              onClick={() => setDeleteTarget(entry.id)}
                              className="rounded-lg border-[1.5px] border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                            >
                              {t.history.deleteBtn}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Clear all */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setDeleteAllOpen(true)}
                className="rounded-lg border-[1.5px] border-red-200 bg-white px-4 py-2 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
              >
                {t.history.deleteAll}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Undo toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-lg">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-700">{toast.message}</span>
            <button
              onClick={() => handleUndo(toast.entry)}
              className="font-semibold text-indigo-600 hover:text-indigo-700"
            >
              {t.history.undoDelete}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
