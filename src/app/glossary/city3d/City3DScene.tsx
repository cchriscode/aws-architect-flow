"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import { CityEnvironment } from "./Environment";
import { CityBuildings } from "./Buildings";
import { CameraController } from "./CameraController";
import { BUILDINGS } from "./data";
import { GLOSSARY, type GlossaryTerm } from "@/data/glossary";
import type { Dict } from "@/lib/i18n/types";

type SceneMode = "city" | "flyto" | "interior";

/* ═══════════════════════════════════════════
   Info Card (term detail overlay)
   ═══════════════════════════════════════════ */

function InfoCard({
  term,
  lang,
  t,
  onClose,
}: {
  term: GlossaryTerm;
  lang: "ko" | "en";
  t: Dict;
  onClose: () => void;
}) {
  return (
    <div className="absolute right-4 top-4 z-50 w-80 rounded-xl border border-gray-200 bg-white/95 p-4 shadow-2xl backdrop-blur">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-gray-900">{term.name}</span>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-gray-600">
        {term.desc[lang]}
      </p>
      {term.placementNote && (
        <p className="mt-1 text-[11px] text-gray-500">
          {term.placementNote[lang]}
        </p>
      )}
      <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2">
        <span className="text-xs text-amber-700">
          {t.glossary.analogyLabel}: {term.analogy[lang]}
        </span>
      </div>
      {term.related.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          <span className="text-[10px] text-gray-400">
            {t.glossary.relatedLabel}:
          </span>
          {term.related.map((rid) => {
            const rel = GLOSSARY.find((g) => g.id === rid);
            return (
              <span
                key={rid}
                className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600"
              >
                {rel?.name ?? rid}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Interior View (modal overlay with rooms)
   ═══════════════════════════════════════════ */

function InteriorView({
  buildingId,
  lang,
  t,
  onSelectTerm,
  onBack,
}: {
  buildingId: string;
  lang: "ko" | "en";
  t: Dict;
  onSelectTerm: (id: string) => void;
  onBack: () => void;
}) {
  const building = BUILDINGS.find((b) => b.id === buildingId);
  if (!building) return null;

  const terms = building.termIds
    .map((id) => GLOSSARY.find((g) => g.id === id))
    .filter(Boolean) as GlossaryTerm[];

  const cols = terms.length <= 4 ? 2 : terms.length <= 6 ? 3 : 4;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/85 backdrop-blur-md">
      <div className="relative max-h-[85vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl px-6 py-4"
          style={{ backgroundColor: building.color }}
        >
          <div>
            <h3 className="text-lg font-bold text-white">
              {building.label[lang]}
            </h3>
            <p className="text-xs text-white/70">
              {terms.length} services —{" "}
              {lang === "ko"
                ? "방을 클릭하면 상세 정보를 볼 수 있습니다"
                : "Click a room for details"}
            </p>
          </div>
          <button
            onClick={onBack}
            className="rounded-lg bg-white/20 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/30"
          >
            ← {lang === "ko" ? "도시로 돌아가기" : "Back to City"}
          </button>
        </div>

        {/* Floor plan background */}
        <div className="bg-[#f0f4f8] p-6" style={{
          backgroundImage: `
            linear-gradient(rgba(148,163,184,0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148,163,184,0.15) 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
        }}>
          {/* Room grid */}
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
          >
            {terms.map((term) => (
              <button
                key={term.id}
                onClick={() => onSelectTerm(term.id)}
                className="group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white p-4 text-left shadow-sm transition-all hover:border-indigo-400 hover:shadow-lg"
              >
                {/* Room accent bar */}
                <div
                  className="absolute left-0 top-0 h-full w-1 transition-all group-hover:w-1.5"
                  style={{ backgroundColor: building.color }}
                />
                <div className="pl-2">
                  <p className="text-sm font-bold text-gray-900">{term.name}</p>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-gray-500">
                    {term.analogy[lang]}
                  </p>
                  <p className="mt-2 text-[10px] text-gray-400 group-hover:text-indigo-500">
                    {t.glossary.clickToExpand}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Main 3D Scene
   ═══════════════════════════════════════════ */

export default function City3DScene({
  lang,
  t,
}: {
  lang: "ko" | "en";
  t: Dict;
}) {
  const [mode, setMode] = useState<SceneMode>("city");
  const [targetBuildingId, setTargetBuildingId] = useState<string | null>(null);
  const [interiorBuildingId, setInteriorBuildingId] = useState<string | null>(null);
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);

  const selectedTerm = useMemo(
    () => (selectedTermId ? GLOSSARY.find((g) => g.id === selectedTermId) ?? null : null),
    [selectedTermId]
  );

  const handleBuildingClick = useCallback((id: string) => {
    setSelectedTermId(null);
    setTargetBuildingId(id);
    setInteriorBuildingId(id);
    setMode("interior");
  }, []);

  const handleStandaloneClick = useCallback((termId: string) => {
    setSelectedTermId((p) => (p === termId ? null : termId));
  }, []);

  const handleArrived = useCallback(() => {
    // kept for CameraController interface — no longer delays interior
  }, []);

  const handleBack = useCallback(() => {
    setInteriorBuildingId(null);
    setTargetBuildingId(null);
    setSelectedTermId(null);
    setMode("city");
  }, []);

  const handleSelectTermInInterior = useCallback((termId: string) => {
    setSelectedTermId((p) => (p === termId ? null : termId));
  }, []);

  // Defer <Html> label mounting so 3D geometry renders first
  const [showLabels, setShowLabels] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setShowLabels(true), 200);
    return () => clearTimeout(id);
  }, []);

  // Concepts section
  const concepts = useMemo(() => GLOSSARY.filter((g) => g.placement === "concept"), []);
  const [expandedConceptId, setExpandedConceptId] = useState<string | null>(null);
  const expandedConcept = expandedConceptId ? concepts.find((c) => c.id === expandedConceptId) : null;

  return (
    <div className="mt-5">
      <h2 className="text-lg font-bold text-gray-900">
        {t.glossary.viewIllustration}
      </h2>
      <p className="mt-1 text-xs text-gray-500">
        {lang === "ko"
          ? "AWS 서비스를 3D 도시로 시각화. 마우스로 회전/줌, 건물 클릭 → 내부 탐험. 도로 표지판 = 라우트 테이블."
          : "AWS services as a 3D city. Drag=Rotate, Scroll=Zoom, Click buildings to enter. Road signs = Route Tables."}
      </p>

      <div
        className="relative mt-4 overflow-hidden rounded-xl border border-gray-200 shadow-xl"
        style={{ height: "72vh", minHeight: 500 }}
      >
        {/* Canvas wrapped in isolation context — drei <Html> z-indexes (up to ~16M) stay contained here */}
        <div className="absolute inset-0" style={{ isolation: "isolate" }}>
          <Canvas
            shadows
            dpr={[1, 1.5]}
            performance={{ min: 0.5 }}
            camera={{ fov: 50, near: 0.1, far: 500 }}
            style={{
              background: "linear-gradient(180deg, #7EC8E3 0%, #C5E8F7 40%, #E8E4D9 100%)",
              ...(mode === "interior" ? { visibility: "hidden" } : {}),
            }}
          >
            {/* Lighting */}
            <ambientLight intensity={0.45} />
            <directionalLight
              position={[60, 80, 40]}
              intensity={1.3}
              castShadow
              shadow-mapSize-width={1024}
              shadow-mapSize-height={1024}
              shadow-camera-far={250}
              shadow-camera-left={-120}
              shadow-camera-right={120}
              shadow-camera-top={120}
              shadow-camera-bottom={-120}
            />
            <hemisphereLight args={["#87CEEB", "#c8c4b7", 0.25]} />

            {/* Fog for depth */}
            <fog attach="fog" args={["#c5dde8", 180, 450]} />

            <Sky
              distance={450000}
              sunPosition={[100, 40, 80]}
              inclination={0.5}
              azimuth={0.25}
            />

            <CityEnvironment lang={lang} onSignClick={handleStandaloneClick} showLabels={showLabels} />
            <CityBuildings
              lang={lang}
              onBuildingClick={handleBuildingClick}
              onStandaloneClick={handleStandaloneClick}
              showLabels={showLabels}
            />
            <CameraController
              mode={mode === "interior" ? "city" : mode}
              targetBuildingId={targetBuildingId}
              onArrived={handleArrived}
            />
          </Canvas>
        </div>

        {/* UI overlays — outside isolation context, always on top of drei labels */}
        {selectedTerm && (
          <InfoCard
            term={selectedTerm}
            lang={lang}
            t={t}
            onClose={() => setSelectedTermId(null)}
          />
        )}

        {mode === "interior" && interiorBuildingId && (
          <InteriorView
            buildingId={interiorBuildingId}
            lang={lang}
            t={t}
            onSelectTerm={handleSelectTermInInterior}
            onBack={handleBack}
          />
        )}

        {mode === "flyto" && (
          <div className="absolute left-4 top-4 z-30">
            <button
              onClick={handleBack}
              className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-md backdrop-blur hover:bg-gray-50"
            >
              ← {lang === "ko" ? "돌아가기" : "Back"}
            </button>
          </div>
        )}

        {mode === "city" && (
          <div className="absolute bottom-3 left-3 z-20 rounded-lg bg-black/50 px-3 py-1.5 text-[10px] text-white/90 backdrop-blur">
            {lang === "ko"
              ? "🖱 드래그=이동 | 우클릭=회전 | 스크롤=줌 | WASD/화살표=탐색 | 건물클릭=입장"
              : "🖱 Drag=Pan | Right-drag=Rotate | Scroll=Zoom | WASD/Arrows=Navigate | Click=Enter"}
          </div>
        )}
      </div>

      {/* Concepts below */}
      <div className="mt-4 rounded-xl border-[1.5px] border-slate-200 bg-slate-50 p-3">
        <div className="mb-1.5 flex items-center gap-1.5">
          <span className="text-sm">📐</span>
          <span className="text-xs font-bold text-gray-700">
            {t.glossary.placements.concept}
          </span>
          <span className="text-[10px] text-gray-400">({concepts.length})</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4">
          {concepts.map((c) => (
            <button
              key={c.id}
              onClick={() => setExpandedConceptId((p) => (p === c.id ? null : c.id))}
              className={`rounded-lg px-2 py-1 text-[11px] font-medium transition-all ${
                expandedConceptId === c.id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "border border-gray-200 bg-white/80 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
        {expandedConcept && (
          <div className="mt-2 rounded-lg border border-gray-200 bg-white p-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-900">{expandedConcept.name}</span>
              <button onClick={() => setExpandedConceptId(null)} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">{expandedConcept.desc[lang]}</p>
            <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2">
              <span className="text-xs text-amber-700">{t.glossary.analogyLabel}: {expandedConcept.analogy[lang]}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
