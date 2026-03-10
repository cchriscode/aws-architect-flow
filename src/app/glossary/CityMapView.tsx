"use client";

import { useState, useMemo } from "react";
import {
  GLOSSARY,
  type GlossaryTerm,
  type PlacementZone,
} from "@/data/glossary";
import type { Dict } from "@/lib/i18n/types";

/* ═══════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════ */

/** 32×20 brick tile as data URI for CSS background-image */
const BRICK_TILE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='20'%3E%3Crect width='32' height='20' fill='%239a8b7a'/%3E%3Crect x='1' y='1' width='14' height='8' rx='1' fill='%238b7d6b'/%3E%3Crect x='17' y='1' width='14' height='8' rx='1' fill='%237a6e5e'/%3E%3Crect x='-7' y='11' width='14' height='8' rx='1' fill='%237a6e5e'/%3E%3Crect x='9' y='11' width='14' height='8' rx='1' fill='%238b7d6b'/%3E%3Crect x='25' y='11' width='14' height='8' rx='1' fill='%237a6e5e'/%3E%3C/svg%3E")`;

const BADGE_STYLES: Record<string, string> = {
  aws: "bg-orange-100 text-orange-700",
  general: "bg-gray-100 text-gray-600",
  k8s: "bg-blue-100 text-blue-700",
  docker: "bg-sky-100 text-sky-700",
};

const ZONE_ICONS: Record<string, string> = {
  "account-level": "🏢",
  "regional-managed": "🏛️",
  edge: "🌐",
  "vpc-public": "🚪",
  "vpc-private": "🏠",
  "vpc-isolated": "🔒",
  concept: "📐",
};

const ZONE_ORDER: PlacementZone[] = [
  "account-level",
  "regional-managed",
  "edge",
  "vpc-public",
  "vpc-private",
  "vpc-isolated",
];

/* ═══════════════════════════════════════════
   SVG Illustrations
   ═══════════════════════════════════════════ */

/** Corner tower — bird's eye view castle turret with flag */
function TowerSVG({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 48"
      className={className}
      aria-hidden
    >
      {/* outer circle — brick */}
      <circle cx="18" cy="24" r="16" fill="#8b7d6b" stroke="#6b5e4e" strokeWidth="1.5" />
      {/* inner circle — light stone */}
      <circle cx="18" cy="24" r="10" fill="#c4b5a3" stroke="#9a8b7a" strokeWidth="1" />
      {/* center dot */}
      <circle cx="18" cy="24" r="3" fill="#6b5e4e" />
      {/* flagpole */}
      <line x1="18" y1="24" x2="18" y2="4" stroke="#5a4e3e" strokeWidth="1.5" />
      {/* flag */}
      <polygon points="18,4 30,9 18,14" fill="#c0392b" opacity="0.9" />
    </svg>
  );
}

/** City gate — arch with portcullis grate and torches */
function GateSVG() {
  return (
    <div className="mb-1 flex justify-center">
      <svg viewBox="0 0 140 70" className="h-14 w-32 md:h-16 md:w-36" aria-hidden>
        {/* left pillar */}
        <rect x="10" y="12" width="18" height="58" rx="2" fill="#8b7d6b" stroke="#6b5e4e" strokeWidth="1" />
        {/* right pillar */}
        <rect x="112" y="12" width="18" height="58" rx="2" fill="#8b7d6b" stroke="#6b5e4e" strokeWidth="1" />
        {/* arch */}
        <path
          d="M28,70 L28,30 Q70,0 112,30 L112,70"
          fill="none"
          stroke="#6b5e4e"
          strokeWidth="2.5"
        />
        {/* inner arch fill (dark opening) */}
        <path
          d="M32,70 L32,33 Q70,6 108,33 L108,70 Z"
          fill="#3d3226"
          opacity="0.3"
        />
        {/* portcullis vertical bars */}
        {[44, 56, 70, 84, 96].map((x) => (
          <line key={`pv${x}`} x1={x} y1="28" x2={x} y2="70" stroke="#5a4e3e" strokeWidth="1.5" opacity="0.5" />
        ))}
        {/* portcullis horizontal bars */}
        {[38, 48, 58, 68].map((y) => (
          <line key={`ph${y}`} x1="36" y1={y} x2="104" y2={y} stroke="#5a4e3e" strokeWidth="1" opacity="0.4" />
        ))}
        {/* left torch */}
        <circle cx="18" cy="10" r="5" fill="#f39c12" opacity="0.8" />
        <circle cx="18" cy="10" r="8" fill="#f39c12" opacity="0.2" />
        {/* right torch */}
        <circle cx="122" cy="10" r="5" fill="#f39c12" opacity="0.8" />
        <circle cx="122" cy="10" r="8" fill="#f39c12" opacity="0.2" />
        {/* GATE text */}
        <text
          x="70"
          y="56"
          textAnchor="middle"
          fontSize="11"
          fill="#c4b5a3"
          fontWeight="bold"
          fontFamily="serif"
          letterSpacing="2"
        >
          GATE
        </text>
      </svg>
    </div>
  );
}

/** Cobblestone road with direction arrow — full-width with extensions */
function RoadSVG() {
  return (
    <div className="my-1 flex items-center py-1.5">
      {/* left road surface */}
      <div className="h-1 flex-1 rounded-full bg-amber-200/50" />
      {/* cobblestone center */}
      <div className="mx-2 shrink-0">
        <svg viewBox="0 0 80 44" className="h-9 w-20" aria-hidden>
          {/* road body */}
          <rect x="4" y="2" width="72" height="36" rx="4" fill="#c4b5a3" />
          {/* cobblestones */}
          {[
            [16, 8], [32, 6], [48, 9], [64, 7],
            [12, 16], [28, 15], [44, 17], [60, 16],
            [18, 24], [34, 23], [50, 25], [66, 23],
          ].map(([cx, cy], i) => (
            <ellipse key={i} cx={cx} cy={cy} rx="5" ry="3" fill="#b0a18e" stroke="#9a8b7a" strokeWidth="0.5" />
          ))}
          {/* center dashed line */}
          <line x1="40" y1="4" x2="40" y2="34" stroke="#9a8b7a" strokeWidth="1.5" strokeDasharray="3,3" />
          {/* arrow */}
          <polygon points="34,32 40,42 46,32" fill="#8b7d6b" />
        </svg>
      </div>
      {/* right road surface */}
      <div className="h-1 flex-1 rounded-full bg-amber-200/50" />
    </div>
  );
}

/** 4-direction compass rose */
function CompassRoseSVG() {
  return (
    <svg viewBox="0 0 80 80" className="h-16 w-16 md:h-20 md:w-20" aria-hidden>
      {/* outer ring */}
      <circle cx="40" cy="40" r="36" fill="none" stroke="#9a8b7a" strokeWidth="1" opacity="0.6" />
      <circle cx="40" cy="40" r="30" fill="none" stroke="#9a8b7a" strokeWidth="0.5" opacity="0.4" />
      {/* N pointer — red diamond (emphasized) */}
      <polygon points="40,10 44,38 40,36 36,38" fill="#c0392b" opacity="0.7" />
      {/* S pointer */}
      <polygon points="40,70 44,42 40,44 36,42" fill="#9a8b7a" opacity="0.5" />
      {/* E pointer */}
      <polygon points="70,40 42,36 44,40 42,44" fill="#9a8b7a" opacity="0.5" />
      {/* W pointer */}
      <polygon points="10,40 38,36 36,40 38,44" fill="#9a8b7a" opacity="0.5" />
      {/* center */}
      <circle cx="40" cy="40" r="3" fill="#6b5e4e" />
      {/* labels */}
      <text x="40" y="8" textAnchor="middle" fontSize="8" fill="#c0392b" fontWeight="bold" fontFamily="serif">N</text>
      <text x="40" y="78" textAnchor="middle" fontSize="7" fill="#9a8b7a" fontFamily="serif">S</text>
      <text x="77" y="43" textAnchor="middle" fontSize="7" fill="#9a8b7a" fontFamily="serif">E</text>
      <text x="3" y="43" textAnchor="middle" fontSize="7" fill="#9a8b7a" fontFamily="serif">W</text>
    </svg>
  );
}

/** Parchment scroll title banner */
function TitleScrollSVG({ text }: { text: string }) {
  return (
    <div className="flex justify-center">
      <svg viewBox="0 0 300 60" className="h-12 w-60 md:h-14 md:w-72" aria-hidden>
        {/* scroll body */}
        <rect x="30" y="8" width="240" height="44" rx="4" fill="#f5e6c8" stroke="#c4a97d" strokeWidth="1.5" />
        {/* left curl */}
        <ellipse cx="30" cy="30" rx="12" ry="26" fill="#e8d5b0" stroke="#c4a97d" strokeWidth="1" />
        <ellipse cx="30" cy="30" rx="6" ry="22" fill="#f5e6c8" />
        {/* right curl */}
        <ellipse cx="270" cy="30" rx="12" ry="26" fill="#e8d5b0" stroke="#c4a97d" strokeWidth="1" />
        <ellipse cx="270" cy="30" rx="6" ry="22" fill="#f5e6c8" />
        {/* decorative lines */}
        <line x1="50" y1="14" x2="250" y2="14" stroke="#c4a97d" strokeWidth="0.5" opacity="0.5" />
        <line x1="50" y1="46" x2="250" y2="46" stroke="#c4a97d" strokeWidth="0.5" opacity="0.5" />
        {/* title text */}
        <text
          x="150"
          y="36"
          textAnchor="middle"
          fontSize="16"
          fill="#5a4232"
          fontWeight="bold"
          fontFamily="serif"
          letterSpacing="3"
        >
          {text}
        </text>
      </svg>
    </div>
  );
}

/** Simple tree — trunk + canopy */
function TreeSVG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 28" className={className ?? "h-6 w-4"} aria-hidden>
      {/* trunk */}
      <rect x="8" y="18" width="4" height="10" rx="1" fill="#8b6914" />
      {/* canopy */}
      <circle cx="10" cy="12" r="8" fill="#5d8a3c" opacity="0.8" />
      <circle cx="7" cy="14" r="5" fill="#4a7a2e" opacity="0.6" />
      <circle cx="13" cy="10" r="5" fill="#6b9e48" opacity="0.6" />
    </svg>
  );
}

/* ═══════════════════════════════════════════
   StoneWall wrapper — brick-textured frame
   ═══════════════════════════════════════════ */

function StoneWall({
  children,
  showTowers = false,
  wallColor = "dark",
}: {
  children: React.ReactNode;
  showTowers?: boolean;
  wallColor?: "dark" | "light";
}) {
  const wallThickness = wallColor === "dark" ? 22 : 18;
  const brickOpacity = wallColor === "dark" ? 1 : 0.7;
  const crenH = 8;

  const wallStyle: React.CSSProperties = {
    backgroundImage: BRICK_TILE,
    backgroundRepeat: "repeat",
    opacity: brickOpacity,
  };

  return (
    <div className="relative" style={{ padding: wallThickness + crenH }}>
      {/* ─ TOP wall ─ */}
      <div
        className="absolute left-0 right-0"
        style={{ top: crenH, height: wallThickness, ...wallStyle }}
      />
      {/* ─ Crenellation on top ─ */}
      <div
        className="absolute left-0 right-0"
        style={{
          top: 0,
          height: crenH,
          backgroundImage: BRICK_TILE,
          backgroundRepeat: "repeat",
          opacity: brickOpacity,
          maskImage:
            "repeating-linear-gradient(90deg, black 0px 10px, transparent 10px 18px)",
          WebkitMaskImage:
            "repeating-linear-gradient(90deg, black 0px 10px, transparent 10px 18px)",
        }}
      />
      {/* ─ BOTTOM wall ─ */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{ height: wallThickness, ...wallStyle }}
      />
      {/* ─ LEFT wall ─ */}
      <div
        className="absolute bottom-0 left-0"
        style={{ top: crenH, width: wallThickness, ...wallStyle }}
      />
      {/* ─ RIGHT wall ─ */}
      <div
        className="absolute bottom-0 right-0"
        style={{ top: crenH, width: wallThickness, ...wallStyle }}
      />

      {/* ─ Corner towers ─ */}
      {showTowers && (
        <>
          <TowerSVG className="absolute -left-4 -top-4 z-10 h-12 w-10" />
          <TowerSVG className="absolute -right-4 -top-4 z-10 h-12 w-10" />
          <TowerSVG className="absolute -bottom-4 -left-4 z-10 h-12 w-10" />
          <TowerSVG className="absolute -bottom-4 -right-4 z-10 h-12 w-10" />
        </>
      )}

      {/* ─ Content ─ */}
      <div className="relative z-[1] rounded-sm bg-white/20 p-3">
        {children}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Zone helpers
   ═══════════════════════════════════════════ */

function ZoneHeader({
  zone,
  count,
  t,
}: {
  zone: PlacementZone;
  count: number;
  t: Dict;
}) {
  return (
    <div className="mb-1.5 flex items-center gap-1.5">
      <span className="text-sm">{ZONE_ICONS[zone]}</span>
      <span className="text-xs font-bold text-gray-700">
        {t.glossary.placements[zone]}
      </span>
      <span className="text-[10px] text-gray-400">({count})</span>
      <span className="ml-1 hidden text-[10px] text-gray-400 sm:inline">
        — {t.glossary.zoneDescs[zone]}
      </span>
    </div>
  );
}

function ZoneContent({
  terms,
  expandedId,
  onToggle,
  lang,
  t,
  gridCols,
}: {
  terms: GlossaryTerm[];
  expandedId: string | null;
  onToggle: (id: string) => void;
  lang: "ko" | "en";
  t: Dict;
  gridCols?: boolean;
}) {
  const expanded = expandedId
    ? terms.find((tm) => tm.id === expandedId)
    : null;

  return (
    <>
      <div
        className={
          gridCols
            ? "grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4"
            : "flex flex-wrap gap-1.5"
        }
      >
        {terms.map((term) => (
          <button
            key={term.id}
            onClick={() => onToggle(term.id)}
            title={term.analogy[lang]}
            className={`rounded-lg px-2 py-1 text-[11px] font-medium transition-all ${
              expandedId === term.id
                ? "bg-indigo-600 text-white shadow-sm"
                : "border border-gray-200 bg-white/80 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
            }`}
          >
            {term.name}
          </button>
        ))}
      </div>
      {expanded && (
        <div className="mt-2 rounded-lg border border-gray-200 bg-white p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900">
                {expanded.name}
              </span>
              <span
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${BADGE_STYLES[expanded.badge]}`}
              >
                {expanded.badge.toUpperCase()}
              </span>
            </div>
            <button
              onClick={() => onToggle(expanded.id)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            {expanded.desc[lang]}
          </p>
          <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2">
            <span className="text-xs text-amber-700">
              💡 {t.glossary.analogyLabel}: {expanded.analogy[lang]}
            </span>
          </div>
          {expanded.related.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-gray-400">
                {t.glossary.relatedLabel}:
              </span>
              {expanded.related.map((rid) => {
                const rel = GLOSSARY.find((g) => g.id === rid);
                return (
                  <span
                    key={rid}
                    className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-600"
                  >
                    {rel?.name ?? rid}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════
   Main export
   ═══════════════════════════════════════════ */

export function CityMapView({
  lang,
  t,
}: {
  lang: "ko" | "en";
  t: Dict;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const termsByZone = useMemo(() => {
    const map = new Map<PlacementZone, GlossaryTerm[]>();
    for (const term of GLOSSARY) {
      const list = map.get(term.placement) ?? [];
      list.push(term);
      map.set(term.placement, list);
    }
    return map;
  }, []);

  const toggle = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  const zp = (zone: PlacementZone) => ({
    terms: termsByZone.get(zone) ?? [],
    expandedId,
    onToggle: toggle,
    lang,
    t,
  });

  const cnt = (zone: PlacementZone) =>
    (termsByZone.get(zone) ?? []).length;

  /* Tree positions scattered around the castle (desktop only) */
  const trees = [
    "top-16 left-6", "top-24 left-2", "top-40 left-8",
    "top-16 right-8", "top-32 right-3", "top-52 right-6",
    "bottom-24 left-4", "bottom-16 left-10",
    "bottom-20 right-5", "bottom-32 right-10",
  ];

  return (
    <div className="mt-5">
      <h2 className="text-lg font-bold text-gray-900">
        {t.glossary.cityMapTitle}
      </h2>
      <p className="mt-1 text-xs text-gray-500">{t.glossary.cityMapDesc}</p>

      {/* Map container — parchment background */}
      <div
        className="relative mt-4 overflow-hidden rounded-2xl p-4 md:p-8"
        style={{
          background:
            "linear-gradient(135deg, #fefce8 0%, #fff7ed 40%, #fffbeb 100%)",
          backgroundImage:
            "radial-gradient(circle, #d4c5a9 0.5px, transparent 0.5px)",
          backgroundSize: "14px 14px",
        }}
      >
        {/* Compass — top right */}
        <div className="pointer-events-none absolute right-3 top-3 opacity-40 md:right-5 md:top-4">
          <CompassRoseSVG />
        </div>

        {/* Title scroll */}
        <div className="mb-4 md:mb-6">
          <TitleScrollSVG text="CLOUD CITY" />
        </div>

        {/* Trees scattered (desktop only) */}
        <div className="pointer-events-none hidden md:block">
          {trees.map((pos, i) => (
            <TreeSVG
              key={i}
              className={`absolute ${pos} h-7 w-5 opacity-50`}
            />
          ))}
        </div>

        {/* ── DESKTOP: nested city layout ── */}
        <div className="hidden md:block">
          {/* Account Level — outermost castle wall */}
          <StoneWall showTowers wallColor="dark">
            <ZoneHeader zone="account-level" count={cnt("account-level")} t={t} />
            <ZoneContent {...zp("account-level")} />

            {/* Regional Managed — inner castle wall */}
            <div className="mt-3">
              <StoneWall wallColor="light">
                <ZoneHeader zone="regional-managed" count={cnt("regional-managed")} t={t} />
                <ZoneContent {...zp("regional-managed")} />

                {/* Edge — City Gate */}
                <div className="mx-auto mt-4 max-w-lg">
                  <GateSVG />
                  <div className="rounded-lg border-2 border-orange-300 bg-orange-50/60 p-2.5">
                    <ZoneHeader zone="edge" count={cnt("edge")} t={t} />
                    <ZoneContent {...zp("edge")} />
                  </div>
                </div>

                <RoadSVG />

                {/* VPC-Public — Public Square */}
                <div className="mx-auto max-w-lg rounded-lg border-2 border-blue-300 bg-blue-50/60 p-3">
                  <ZoneHeader zone="vpc-public" count={cnt("vpc-public")} t={t} />
                  <ZoneContent {...zp("vpc-public")} />
                </div>

                <RoadSVG />

                {/* VPC-Private — Inner District */}
                <div className="mx-auto max-w-lg rounded-lg border-2 border-indigo-300 bg-indigo-50/60 p-3">
                  <ZoneHeader zone="vpc-private" count={cnt("vpc-private")} t={t} />
                  <ZoneContent {...zp("vpc-private")} />

                  {/* VPC-Isolated — Vault */}
                  <div className="mt-2 rounded-lg border-2 border-purple-300 bg-purple-50/60 p-2.5">
                    <ZoneHeader zone="vpc-isolated" count={cnt("vpc-isolated")} t={t} />
                    <ZoneContent {...zp("vpc-isolated")} />
                  </div>
                </div>
              </StoneWall>
            </div>
          </StoneWall>
        </div>

        {/* ── MOBILE: stacked layout ── */}
        <div className="space-y-2 md:hidden">
          {ZONE_ORDER.map((zone, i) => (
            <div key={zone}>
              <div
                className={`rounded-lg border-[1.5px] p-2.5 ${
                  zone === "account-level"
                    ? "border-stone-400 bg-white/20"
                    : zone === "regional-managed"
                      ? "border-stone-300 bg-white/20"
                      : zone === "edge"
                        ? "border-orange-300 bg-orange-50/60"
                        : zone === "vpc-public"
                          ? "border-blue-300 bg-blue-50/60"
                          : zone === "vpc-private"
                            ? "border-indigo-300 bg-indigo-50/60"
                            : "border-purple-300 bg-purple-50/60"
                }`}
              >
                {zone === "edge" && <GateSVG />}
                <ZoneHeader zone={zone} count={cnt(zone)} t={t} />
                <ZoneContent {...zp(zone)} />
              </div>
              {i < ZONE_ORDER.length - 1 && <RoadSVG />}
            </div>
          ))}
        </div>

        {/* Traffic flow legend */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-1 text-[10px] text-stone-500">
          <span>🌐 Internet</span>
          <span>→</span>
          <span>🏰 Gate</span>
          <span>→</span>
          <span>🚪 Public</span>
          <span>→</span>
          <span>🏠 Private</span>
          <span>→</span>
          <span>🔒 Vault</span>
        </div>
      </div>

      {/* Concept section — outside the city */}
      <div className="mt-4 rounded-xl border-[1.5px] border-slate-200 bg-slate-50 p-3">
        <ZoneHeader zone="concept" count={cnt("concept")} t={t} />
        <ZoneContent {...zp("concept")} gridCols />
      </div>
    </div>
  );
}
