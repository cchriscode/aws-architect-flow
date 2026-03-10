"use client";

import { useState, useMemo } from "react";
import { useDict, useLang } from "@/lib/i18n/context";
import { Header } from "@/components/layout/Header";
import {
  GLOSSARY,
  GLOSSARY_GROUPS,
  type GlossaryTerm,
} from "@/data/glossary";
import { CityIllustrationView } from "./CityIllustrationView";

const BADGE_STYLES: Record<string, string> = {
  aws: "bg-orange-100 text-orange-700",
  general: "bg-gray-100 text-gray-600",
  k8s: "bg-blue-100 text-blue-700",
  docker: "bg-sky-100 text-sky-700",
};

const PLACEMENT_COLORS: Record<string, string> = {
  edge: "bg-orange-100 text-orange-700",
  "vpc-public": "bg-blue-100 text-blue-700",
  "vpc-private": "bg-indigo-100 text-indigo-700",
  "vpc-isolated": "bg-purple-100 text-purple-700",
  "regional-managed": "bg-gray-100 text-gray-600",
  "account-level": "bg-gray-100 text-gray-600",
  concept: "bg-slate-100 text-slate-600",
};

type BadgeFilter = "all" | "aws" | "general" | "k8s" | "docker";

export default function GlossaryPage() {
  const t = useDict();
  const { lang } = useLang();
  const [search, setSearch] = useState("");
  const [badgeFilter, setBadgeFilter] = useState<BadgeFilter>("all");
  const [view, setView] = useState<"list" | "city">("list");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return GLOSSARY.filter((term) => {
      if (badgeFilter !== "all" && term.badge !== badgeFilter) return false;
      if (!q) return true;
      return (
        term.name.toLowerCase().includes(q) ||
        term.id.toLowerCase().includes(q) ||
        term.desc[lang].toLowerCase().includes(q)
      );
    });
  }, [search, badgeFilter, lang]);

  const grouped = useMemo(() => {
    const map = new Map<string, GlossaryTerm[]>();
    for (const term of filtered) {
      const list = map.get(term.group) ?? [];
      list.push(term);
      map.set(term.group, list);
    }
    return map;
  }, [filtered]);

  const badgeLabel = (b: BadgeFilter) => {
    const labels: Record<BadgeFilter, string> = {
      all: t.glossary.badgeAll,
      aws: t.glossary.badgeAws,
      general: t.glossary.badgeGeneral,
      k8s: t.glossary.badgeK8s,
      docker: t.glossary.badgeDocker,
    };
    return labels[b];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="mx-auto max-w-[900px] px-7 py-6">
        {/* Title */}
        <h1 className="text-xl font-bold text-gray-900">{t.glossary.title}</h1>
        <p className="mt-1 text-sm text-gray-500">{t.glossary.subtitle}</p>

        {/* View toggle */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setView("list")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              view === "list"
                ? "bg-indigo-600 text-white"
                : "border-[1.5px] border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {t.glossary.viewList}
          </button>
          <button
            onClick={() => setView("city")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              view === "city"
                ? "bg-indigo-600 text-white"
                : "border-[1.5px] border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {t.glossary.viewCityMap}
          </button>
        </div>

        {view === "list" ? (
          <>
            {/* Search */}
            <div className="relative mt-5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                🔍
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.glossary.searchPlaceholder}
                className="w-full rounded-lg border-[1.5px] border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-indigo-400"
              />
            </div>

            {/* Badge filter */}
            <div className="mt-3 flex gap-2">
              {(["all", "aws", "general", "k8s", "docker"] as BadgeFilter[]).map((b) => (
                <button
                  key={b}
                  onClick={() => setBadgeFilter(b)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    badgeFilter === b
                      ? "bg-indigo-600 text-white"
                      : "border-[1.5px] border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {badgeLabel(b)}
                </button>
              ))}
            </div>

            {/* No results */}
            {filtered.length === 0 && (
              <p className="mt-10 text-center text-sm text-gray-400">
                {t.glossary.noResults}
              </p>
            )}

            {/* Grouped sections */}
            {GLOSSARY_GROUPS.map((g) => {
              const terms = grouped.get(g.id);
              if (!terms || terms.length === 0) return null;
              return (
                <section key={g.id} className="mt-8">
                  <h2 className="flex items-center gap-2 border-b border-gray-200 pb-2 text-sm font-bold text-gray-700">
                    <span>{g.icon}</span>
                    {t.glossary.groups[g.id]}
                  </h2>
                  <div className="mt-3 space-y-3">
                    {terms.map((term) => (
                      <TermCard key={term.id} term={term} lang={lang} t={t} />
                    ))}
                  </div>
                </section>
              );
            })}
          </>
        ) : (
          <CityIllustrationView lang={lang} t={t} />
        )}
      </div>
    </div>
  );
}

function TermCard({
  term,
  lang,
  t,
}: {
  term: GlossaryTerm;
  lang: "ko" | "en";
  t: ReturnType<typeof useDict>;
}) {
  return (
    <div
      id={term.id}
      className="rounded-xl border-[1.5px] border-gray-200 bg-white px-5 py-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-gray-900">{term.name}</span>
        <span
          className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${BADGE_STYLES[term.badge]}`}
        >
          {term.badge.toUpperCase()}
        </span>
        <span
          className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${PLACEMENT_COLORS[term.placement]}`}
        >
          {t.glossary.placements[term.placement]}
        </span>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-gray-600">
        {term.desc[lang]}
      </p>

      {term.placementNote && (
        <p className="mt-1.5 text-xs text-gray-500">
          📍 {term.placementNote[lang]}
        </p>
      )}

      {term.related.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-gray-400">
            {t.glossary.relatedLabel}:
          </span>
          {term.related.map((rid) => {
            const relTerm = GLOSSARY.find((g) => g.id === rid);
            return (
              <a
                key={rid}
                href={`#${rid}`}
                className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-600 transition-colors hover:bg-indigo-100 hover:text-indigo-700"
              >
                {relTerm?.name ?? rid}
              </a>
            );
          })}
        </div>
      )}

      <div className="mt-2.5 rounded-lg bg-amber-50 px-3 py-2">
        <span className="text-xs text-amber-700">
          💡 {t.glossary.analogyLabel}: {term.analogy[lang]}
        </span>
      </div>
    </div>
  );
}
