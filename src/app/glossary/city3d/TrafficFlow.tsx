"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { CONNECTIONS, type ConnectionDef } from "./data";

/* ═══════════════════════════════════════════
   Utility: interpolate position along polyline
   ═══════════════════════════════════════════ */

function getPointOnPath(vecs: THREE.Vector3[], t: number, out: THREE.Vector3): THREE.Vector3 {
  if (vecs.length < 2) return out.copy(vecs[0] ?? out);
  let total = 0;
  for (let i = 1; i < vecs.length; i++) total += vecs[i].distanceTo(vecs[i - 1]);
  const target = t * total;
  let cum = 0;
  for (let i = 0; i < vecs.length - 1; i++) {
    const seg = vecs[i + 1].distanceTo(vecs[i]);
    if (cum + seg >= target || i === vecs.length - 2) {
      const st = seg > 0 ? Math.min(1, (target - cum) / seg) : 0;
      return out.lerpVectors(vecs[i], vecs[i + 1], st);
    }
    cum += seg;
  }
  return out.copy(vecs[vecs.length - 1]);
}

/* ═══════════════════════════════════════════
   All connection lines — single useFrame for all
   ═══════════════════════════════════════════ */

interface ConnData {
  vecs: THREE.Vector3[];
  lineObj: THREE.Line;
  mid: THREE.Vector3;
  dotRefs: (THREE.Mesh | null)[];
  speed: number;
  dots: number;
}

function AllFlowConnections({ lang, showLabels = true }: { lang: "ko" | "en"; showLabels?: boolean }) {
  const dataRef = useRef<ConnData[]>([]);
  const _tmp = useMemo(() => new THREE.Vector3(), []);

  const conns = useMemo(() => {
    // Dispose previous
    dataRef.current.forEach(d => {
      d.lineObj.geometry.dispose();
      (d.lineObj.material as THREE.Material).dispose();
    });

    return CONNECTIONS.map(conn => {
      const vecs = conn.points.map(p => new THREE.Vector3(...p));
      const geo = new THREE.BufferGeometry().setFromPoints(vecs);
      const mat = new THREE.LineDashedMaterial({
        color: conn.color, dashSize: 1.2, gapSize: 0.6,
        transparent: true, opacity: 0.35,
      });
      const lineObj = new THREE.Line(geo, mat);
      lineObj.computeLineDistances();
      const mid = getPointOnPath(vecs, 0.5, new THREE.Vector3());
      return { vecs, lineObj, mid, dotRefs: [] as (THREE.Mesh | null)[], speed: conn.speed, dots: conn.dots };
    });
  }, []);

  useEffect(() => {
    dataRef.current = conns;
    return () => conns.forEach(d => {
      d.lineObj.geometry.dispose();
      (d.lineObj.material as THREE.Material).dispose();
    });
  }, [conns]);

  // Single useFrame for ALL connections
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    conns.forEach(d => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (d.lineObj.material as any).dashOffset = -t * d.speed * 3;
      d.dotRefs.forEach((dot, i) => {
        if (!dot) return;
        const phase = ((t * d.speed * 0.4 + i / d.dots) % 1 + 1) % 1;
        getPointOnPath(d.vecs, phase, _tmp);
        dot.position.copy(_tmp);
      });
    });
  });

  // Shared dot geometry + per-color materials (avoid duplicates)
  const dotGeo = useMemo(() => new THREE.SphereGeometry(0.4, 6, 6), []);

  return (
    <group>
      {CONNECTIONS.map((conn, ci) => (
        <group key={conn.id}>
          <primitive object={conns[ci].lineObj} />
          {Array.from({ length: conn.dots }).map((_, di) => (
            <mesh key={di} ref={el => { conns[ci].dotRefs[di] = el; }} geometry={dotGeo}>
              <meshStandardMaterial
                color={conn.color} emissive={conn.color}
                emissiveIntensity={3} transparent opacity={0.9}
              />
            </mesh>
          ))}
          {showLabels && (
            <Html
              position={[conns[ci].mid.x, conns[ci].mid.y + 2, conns[ci].mid.z]}
              center distanceFactor={90}
              style={{ pointerEvents: "none" }}
            >
              <div
                className="whitespace-nowrap rounded-full bg-black/50 px-1.5 py-0.5 text-[6px] font-medium text-white/90"
                style={{ borderLeft: `2px solid ${conn.color}` }}
              >
                {conn.label[lang]}
              </div>
            </Html>
          )}
        </group>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════
   Octopus hub pulsing markers
   ═══════════════════════════════════════════ */

const HUBS: { pos: [number, number, number]; color: string }[] = [
  { pos: [0, 0.2, -46], color: "#fca5a5" },
  { pos: [-22, 0.2, -22], color: "#5b6abf" },
  { pos: [-55, 0.2, 32], color: "#0891b2" },
];

function HubMarkers() {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    refs.current.forEach(mesh => {
      if (!mesh) return;
      const s = 1 + Math.sin(t * 2) * 0.3;
      mesh.scale.set(s, 1, s);
      (mesh.material as THREE.MeshStandardMaterial).opacity = 0.15 + Math.sin(t * 2) * 0.1;
    });
  });

  return (
    <group>
      {HUBS.map((hub, i) => (
        <mesh key={i} ref={el => { refs.current[i] = el; }} position={hub.pos} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[2, 3.5, 24]} />
          <meshStandardMaterial color={hub.color} emissive={hub.color} emissiveIntensity={1.5} transparent opacity={0.2} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════
   Vehicle & person models
   ═══════════════════════════════════════════ */

function CarModel({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[1.5, 0.8, 3]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 1.1, -0.2]}>
        <boxGeometry args={[1.3, 0.6, 1.8]} />
        <meshStandardMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh position={[0, 1.1, 0.8]}>
        <planeGeometry args={[1.2, 0.5]} />
        <meshStandardMaterial color="#bfdbfe" transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

function TruckModel({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[2, 1.4, 5]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 1.9, -1]}>
        <boxGeometry args={[1.8, 0.8, 2]} />
        <meshStandardMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh position={[0, 1.9, 1.5]}>
        <planeGeometry args={[1.6, 0.6]} />
        <meshStandardMaterial color="#bfdbfe" transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

function PersonModel({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, 0.8, 0]}>
        <capsuleGeometry args={[0.18, 0.5, 4, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 1.4, 0]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial color="#fcd9b6" />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════════════════════
   Traffic entities (cars, trucks, people)
   ═══════════════════════════════════════════ */

interface EntityCfg {
  type: "car" | "truck" | "person";
  color: string;
  basePos: [number, number, number];
  axis: "x" | "z";
  speed: number;
  range: number;
  offset: number;
  reversed?: boolean;
  label: { ko: string; en: string };
}

const ENTITIES: EntityCfg[] = [
  // Highway trucks (Internet Highway z=-72)
  { type: "truck", color: "#f59e0b", basePos: [3, 0, -72], axis: "x", speed: 12, range: 80, offset: 0,
    label: { ko: "외부 트래픽", en: "External Traffic" } },
  { type: "truck", color: "#ea580c", basePos: [-3, 0, -72], axis: "x", speed: 9, range: 80, offset: 80, reversed: true,
    label: { ko: "CDN 콘텐츠", en: "CDN Content" } },
  // Main avenue cars (N-S spine, x=0)
  { type: "car", color: "#ef4444", basePos: [2, 0, 0], axis: "z", speed: 10, range: 59, offset: 0,
    label: { ko: "API 요청", en: "API Request" } },
  { type: "car", color: "#3b82f6", basePos: [-2, 0, 0], axis: "z", speed: 7, range: 59, offset: 40, reversed: true,
    label: { ko: "응답 데이터", en: "Response" } },
  // Cross street cars
  { type: "car", color: "#22c55e", basePos: [0, 0, -38], axis: "x", speed: 8, range: 50, offset: 20,
    label: { ko: "내부 라우팅", en: "Internal Route" } },
  { type: "car", color: "#8b5cf6", basePos: [0, 0, 32], axis: "x", speed: 6, range: 50, offset: 60, reversed: true,
    label: { ko: "관리 트래픽", en: "Admin Traffic" } },
  { type: "car", color: "#f97316", basePos: [0, 0, -60], axis: "x", speed: 9, range: 60, offset: 10,
    label: { ko: "엣지 요청", en: "Edge Request" } },
  // NAT-GW outbound car (Public Street z=-38, heading west toward NAT-GW)
  { type: "car", color: "#0ea5e9", basePos: [0, 0, -36], axis: "x", speed: 7, range: 40, offset: 50, reversed: true,
    label: { ko: "아웃바운드", en: "Outbound" } },
  // Private Drive data-processing car (z=-10, east-west internal traffic)
  { type: "car", color: "#a78bfa", basePos: [0, 0, -10], axis: "x", speed: 6, range: 42, offset: 35,
    label: { ko: "서비스 연동", en: "Service Link" } },
  // Service blvd truck (z=55)
  { type: "truck", color: "#d97706", basePos: [3, 0, 55], axis: "x", speed: 7, range: 65, offset: 30,
    label: { ko: "배치 작업", en: "Batch Job" } },
  // People
  { type: "person", color: "#f97316", basePos: [-17, 0, -24], axis: "z", speed: 0.8, range: 5, offset: 0,
    label: { ko: "개발자", en: "Developer" } },
  { type: "person", color: "#7c3aed", basePos: [-17, 0, 0], axis: "z", speed: 0.6, range: 4, offset: 3,
    label: { ko: "컨테이너 관리자", en: "Container Admin" } },
  { type: "person", color: "#0891b2", basePos: [-9, 0, 20], axis: "x", speed: 0.7, range: 5, offset: 5,
    label: { ko: "DBA", en: "DBA" } },
  { type: "person", color: "#b45309", basePos: [-20, 0, 40], axis: "z", speed: 0.5, range: 4, offset: 8,
    label: { ko: "보안 관리자", en: "Security Admin" } },
  { type: "person", color: "#059669", basePos: [38, 0, 66], axis: "x", speed: 0.9, range: 5, offset: 2,
    label: { ko: "데이터 엔지니어", en: "Data Engineer" } },
  { type: "person", color: "#dc2626", basePos: [12, 0, 40], axis: "z", speed: 0.7, range: 3, offset: 6,
    label: { ko: "감사관", en: "Auditor" } },
  { type: "person", color: "#0d9488", basePos: [32, 0, 38], axis: "z", speed: 0.6, range: 4, offset: 4,
    label: { ko: "SRE", en: "SRE" } },
];

function entityRotationY(e: EntityCfg): number {
  if (e.axis === "z") return e.reversed ? Math.PI : 0;
  return e.reversed ? Math.PI / 2 : -Math.PI / 2;
}

function TrafficEntities({ lang, showLabels = true }: { lang: "ko" | "en"; showLabels?: boolean }) {
  const refs = useRef<(THREE.Group | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    ENTITIES.forEach((e, i) => {
      const g = refs.current[i];
      if (!g) return;

      if (e.type === "person") {
        // Back-and-forth walk with direction-aware rotation
        const val = e.basePos[e.axis === "x" ? 0 : 2] + Math.sin(t * e.speed + e.offset) * e.range;
        const dir = Math.cos(t * e.speed + e.offset); // derivative sign = direction
        if (e.axis === "x") {
          g.position.x = val;
          g.rotation.y = dir > 0 ? -Math.PI / 2 : Math.PI / 2;
        } else {
          g.position.z = val;
          g.rotation.y = dir > 0 ? 0 : Math.PI;
        }
      } else {
        // Looping vehicle (rotation is fixed, set at mount)
        const total = e.range * 2;
        const raw = ((t * e.speed + e.offset) % total) - e.range;
        const val = e.reversed ? -raw : raw;
        if (e.axis === "x") g.position.x = val;
        else g.position.z = val;
      }
    });
  });

  return (
    <group>
      {ENTITIES.map((e, i) => (
        <group
          key={i}
          ref={el => { refs.current[i] = el; }}
          position={e.basePos}
          rotation-y={entityRotationY(e)}
        >
          {e.type === "car" && <CarModel color={e.color} />}
          {e.type === "truck" && <TruckModel color={e.color} />}
          {e.type === "person" && <PersonModel color={e.color} />}

          {/* Entity label */}
          {showLabels && (
            <Html
              position={[0, e.type === "truck" ? 3.5 : e.type === "car" ? 2.5 : 2.2, 0]}
              center
              distanceFactor={80}
              style={{ pointerEvents: "none" }}
            >
              <div className="whitespace-nowrap rounded bg-black/60 px-1 py-0.5 text-[6px] font-bold text-white/90 ">
                {e.label[lang]}
              </div>
            </Html>
          )}
        </group>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════
   Export
   ═══════════════════════════════════════════ */

export function TrafficFlow({ lang, showLabels = true }: { lang: "ko" | "en"; showLabels?: boolean }) {
  return (
    <group>
      <AllFlowConnections lang={lang} showLabels={showLabels} />
      <HubMarkers />
      <TrafficEntities lang={lang} showLabels={showLabels} />
    </group>
  );
}
