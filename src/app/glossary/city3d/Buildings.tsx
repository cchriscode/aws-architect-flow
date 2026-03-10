"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { BUILDINGS, STANDALONE, type Building3D, type Standalone3D } from "./data";
import { GLOSSARY } from "@/data/glossary";

/* ═══════════════════════════════════════════
   Canvas Texture Generator — building facades
   ═══════════════════════════════════════════ */

function createFacadeTexture(
  baseColor: string,
  floors: number,
  cols: number,
  opts?: { hasShop?: boolean; isWarehouse?: boolean }
): THREE.CanvasTexture {
  const W = 256;
  const H = 256;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Base wall color
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, W, H);

  // Subtle brick/panel lines
  ctx.strokeStyle = "rgba(0,0,0,0.06)";
  ctx.lineWidth = 0.5;
  const panelH = H / (floors + 1);
  for (let i = 1; i <= floors; i++) {
    const y = H - i * panelH;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  if (opts?.isWarehouse) {
    // Warehouse: large rolling door
    const doorW = W * 0.6;
    const doorH = H * 0.65;
    ctx.fillStyle = "#555";
    ctx.fillRect((W - doorW) / 2, H - doorH, doorW, doorH);
    // Horizontal lines on door
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 8; i++) {
      const y = H - doorH + i * (doorH / 8);
      ctx.beginPath();
      ctx.moveTo((W - doorW) / 2, y);
      ctx.lineTo((W + doorW) / 2, y);
      ctx.stroke();
    }
  } else {
    // Windows
    const margin = W * 0.08;
    const gap = 4;
    const winW = (W - margin * 2 - (cols - 1) * gap) / cols;
    const winH = panelH * 0.5;
    const winTop = (panelH - winH) / 2;

    for (let floor = 1; floor <= floors; floor++) {
      for (let c = 0; c < cols; c++) {
        const wx = margin + c * (winW + gap);
        const wy = H - floor * panelH + winTop;

        // Window pane
        const lit = Math.random() > 0.35;
        ctx.fillStyle = lit
          ? "rgba(180, 210, 245, 0.85)"
          : "rgba(40, 60, 90, 0.7)";
        ctx.fillRect(wx, wy, winW, winH);

        // Window frame
        ctx.strokeStyle = "rgba(0,0,0,0.2)";
        ctx.lineWidth = 0.8;
        ctx.strokeRect(wx, wy, winW, winH);

        // Cross divider
        ctx.beginPath();
        ctx.moveTo(wx + winW / 2, wy);
        ctx.lineTo(wx + winW / 2, wy + winH);
        ctx.moveTo(wx, wy + winH * 0.45);
        ctx.lineTo(wx + winW, wy + winH * 0.45);
        ctx.strokeStyle = "rgba(0,0,0,0.12)";
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }

    // Ground floor
    if (opts?.hasShop) {
      // Shop window
      ctx.fillStyle = "rgba(200,220,240,0.75)";
      ctx.fillRect(margin, H - panelH + panelH * 0.15, W - margin * 2, panelH * 0.6);
      ctx.strokeStyle = "rgba(0,0,0,0.15)";
      ctx.strokeRect(margin, H - panelH + panelH * 0.15, W - margin * 2, panelH * 0.6);
    }

    // Door
    const doorW = winW * 1.3;
    const doorH = panelH * 0.8;
    ctx.fillStyle = "#3d3428";
    const doorX = (W - doorW) / 2;
    ctx.fillRect(doorX, H - doorH, doorW, doorH);
    // Door arch top
    ctx.beginPath();
    ctx.arc(doorX + doorW / 2, H - doorH, doorW / 2, Math.PI, 0);
    ctx.fillStyle = "#3d3428";
    ctx.fill();
    // Door handle
    ctx.fillStyle = "#c8a84e";
    ctx.beginPath();
    ctx.arc(doorX + doorW * 0.75, H - doorH / 2, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Bottom edge (foundation)
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.fillRect(0, H - 3, W, 3);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createRoofTexture(color: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 64, 64);
  // AC units, vents
  ctx.fillStyle = "rgba(100,100,100,0.5)";
  ctx.fillRect(10, 10, 12, 10);
  ctx.fillRect(40, 30, 14, 12);
  ctx.fillStyle = "rgba(150,150,150,0.3)";
  ctx.fillRect(8, 40, 8, 8);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/* ═══════════════════════════════════════════
   Large Building Component
   ═══════════════════════════════════════════ */

function LargeBuilding({
  b,
  lang,
  hovered,
  onHover,
  onClick,
  showLabels = true,
}: {
  b: Building3D;
  lang: "ko" | "en";
  hovered: boolean;
  onHover: (h: boolean) => void;
  onClick: () => void;
  showLabels?: boolean;
}) {
  const [w, h, d] = b.size;

  const { materials, cleanup } = useMemo(() => {
    const facade = createFacadeTexture(b.color, b.floors, b.windowCols, {
      isWarehouse: b.style === "warehouse",
      hasShop: b.style === "office",
    });
    const sideFacade = createFacadeTexture(b.color, b.floors, Math.max(2, b.windowCols - 1));
    const roof = createRoofTexture("#6b7280");

    const wallMat = new THREE.MeshStandardMaterial({ map: sideFacade });
    const frontMat = new THREE.MeshStandardMaterial({ map: facade });
    const roofMat = new THREE.MeshStandardMaterial({ map: roof });
    const bottomMat = new THREE.MeshStandardMaterial({ color: "#555" });

    // BoxGeometry face order: +x, -x, +y, -y, +z, -z
    const mats = [wallMat, wallMat, roofMat, bottomMat, frontMat, frontMat];
    return {
      materials: mats,
      cleanup: () => {
        facade.dispose();
        sideFacade.dispose();
        roof.dispose();
        mats.forEach((m) => m.dispose());
      },
    };
  }, [b.color, b.floors, b.windowCols, b.style]);

  useEffect(() => cleanup, [cleanup]);

  return (
    <group position={[b.pos[0], 0, b.pos[2]]}>
      {/* Main building body */}
      <mesh
        position={[0, h / 2, 0]}
        material={materials}
        castShadow
        receiveShadow
        onPointerOver={(e) => { e.stopPropagation(); onHover(true); }}
        onPointerOut={() => onHover(false)}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
      >
        <boxGeometry args={[w, h, d]} />
      </mesh>

      {/* Hover highlight overlay */}
      {hovered && (
        <mesh position={[0, h / 2, 0]}>
          <boxGeometry args={[w + 0.3, h + 0.3, d + 0.3]} />
          <meshStandardMaterial color="#6366f1" transparent opacity={0.15} />
        </mesh>
      )}

      {/* Entrance canopy */}
      <mesh position={[0, 2.8, d / 2 + 0.8]} castShadow>
        <boxGeometry args={[4, 0.3, 1.8]} />
        <meshStandardMaterial color="#555" />
      </mesh>

      {/* Tower: pointed roof + antenna */}
      {b.style === "tower" && (
        <group>
          <mesh position={[0, h + 2.5, 0]} castShadow>
            <coneGeometry args={[w / 2 + 0.5, 5, 4]} />
            <meshStandardMaterial color="#0f766e" />
          </mesh>
          <mesh position={[0, h + 7, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 4, 4]} />
            <meshStandardMaterial color="#374151" />
          </mesh>
          {/* Blinking light */}
          <mesh position={[0, h + 9, 0]}>
            <sphereGeometry args={[0.3, 8, 8]} />
            <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.8} />
          </mesh>
        </group>
      )}

      {/* Factory: chimney */}
      {b.style === "factory" && (
        <group>
          <mesh position={[w / 3, h + 3, -d / 4]} castShadow>
            <cylinderGeometry args={[0.8, 1, 6, 8]} />
            <meshStandardMaterial color="#78716c" />
          </mesh>
          <mesh position={[w / 3, h + 6.5, -d / 4]}>
            <cylinderGeometry args={[1, 0.8, 1, 8]} />
            <meshStandardMaterial color="#555" />
          </mesh>
        </group>
      )}

      {/* Civic: entrance steps + columns */}
      {b.style === "civic" && (
        <group>
          {/* Steps */}
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[0, 0.15 + i * 0.3, d / 2 + 1.2 + i * 0.6]} receiveShadow>
              <boxGeometry args={[w * 0.6 - i * 1, 0.3, 0.8]} />
              <meshStandardMaterial color="#d1d5db" />
            </mesh>
          ))}
          {/* Columns */}
          {[-w / 4, w / 4].map((cx) => (
            <mesh key={cx} position={[cx, h * 0.3, d / 2 + 0.1]} castShadow>
              <cylinderGeometry args={[0.4, 0.4, h * 0.55, 8]} />
              <meshStandardMaterial color="#e5e7eb" />
            </mesh>
          ))}
        </group>
      )}

      {/* Label */}
      {showLabels && (
        <Html
          position={[0, h + (b.style === "tower" ? 11 : 3), 0]}
          center
          distanceFactor={80}
          style={{ pointerEvents: "none" }}
        >
          <div
            className={`whitespace-nowrap rounded-lg px-3 py-1 text-center text-xs font-bold shadow-lg transition-colors ${
              hovered
                ? "bg-indigo-600 text-white"
                : "bg-white/90 text-gray-800"
            }`}
          >
            {b.label[lang]}
            <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-black/10 text-[9px]">
              {b.termIds.length}
            </span>
          </div>
        </Html>
      )}
    </group>
  );
}

/* ═══════════════════════════════════════════
   Animated Checkpoint (boom gate)
   ═══════════════════════════════════════════ */

function AnimatedCheckpoint({
  s,
  hovered,
  handlers,
}: {
  s: Standalone3D;
  hovered: boolean;
  handlers: Record<string, (e: any) => void>; // eslint-disable-line @typescript-eslint/no-explicit-any
}) {
  const [w, h, d] = s.size;
  const hCol = hovered ? "#6366f1" : s.color;
  const armRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // Arm oscillates: down (0°) → up (~75°) with smooth easing
    const cycle = (Math.sin(t * 0.8) + 1) / 2; // 0..1
    const angle = cycle * (Math.PI * 0.42); // 0..~75°
    if (armRef.current) armRef.current.rotation.z = angle;
    // Warning light pulses
    if (lightRef.current) {
      const mat = lightRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.3 + Math.abs(Math.sin(t * 3)) * 1.2;
    }
  });

  const armLength = 8;

  return (
    <group {...handlers}>
      {/* Booth — offset to the side so arm crosses the road */}
      <mesh position={[-w / 2 - 0.5, h / 2, 0]} castShadow>
        <boxGeometry args={[w * 0.7, h, d]} />
        <meshStandardMaterial color={hCol} />
      </mesh>
      {/* Booth window */}
      <mesh position={[-w / 2 - 0.5, h * 0.65, d / 2 + 0.06]}>
        <planeGeometry args={[w * 0.5, h * 0.35]} />
        <meshStandardMaterial color="#bfdbfe" transparent opacity={0.7} />
      </mesh>

      {/* Pivot post — vertical pole at road edge */}
      <mesh position={[0, h / 2 + 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.35, h + 1, 8]} />
        <meshStandardMaterial color="#374151" />
      </mesh>

      {/* Animated arm group — pivots at top of post */}
      <group ref={armRef} position={[0, h + 0.8, 0]}>
        {/* Main arm bar */}
        <mesh position={[armLength / 2, 0, 0]} castShadow>
          <boxGeometry args={[armLength, 0.35, 0.35]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
        {/* Red/white stripes on arm */}
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[1.5 + i * 1.8, 0, 0.2]}>
            <boxGeometry args={[0.8, 0.35, 0.05]} />
            <meshStandardMaterial color={i % 2 === 0 ? "white" : "#fbbf24"} />
          </mesh>
        ))}
        {/* Arm tip weight */}
        <mesh position={[armLength, 0, 0]}>
          <boxGeometry args={[0.5, 0.6, 0.5]} />
          <meshStandardMaterial color="#dc2626" />
        </mesh>
      </group>

      {/* Warning light on top of post */}
      <mesh ref={lightRef} position={[0, h + 2, 0]}>
        <sphereGeometry args={[0.45, 8, 8]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#fbbf24"
          emissiveIntensity={hovered ? 1.5 : 0.5}
        />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════════════════════
   Standalone Element
   ═══════════════════════════════════════════ */

function StandaloneEl({
  s,
  hovered,
  onHover,
  onClick,
  showLabels = true,
}: {
  s: Standalone3D;
  hovered: boolean;
  onHover: (h: boolean) => void;
  onClick: () => void;
  showLabels?: boolean;
}) {
  const term = GLOSSARY.find((g) => g.id === s.termId);
  if (!term) return null;
  const [w, h, d] = s.size;
  const hCol = hovered ? "#6366f1" : s.color;

  const handlers = {
    onPointerOver: (e: THREE.Event) => { (e as any).stopPropagation(); onHover(true); },
    onPointerOut: () => onHover(false),
    onClick: (e: THREE.Event) => { (e as any).stopPropagation(); onClick(); },
  };

  return (
    <group position={[s.pos[0], 0, s.pos[2]]}>
      {/* Shape by style */}
      {s.style === "gate" ? (
        <group {...handlers}>
          {/* Pillars */}
          <mesh position={[-w / 2.5, h / 2, 0]} castShadow>
            <boxGeometry args={[w / 4, h, d]} />
            <meshStandardMaterial color={hCol} />
          </mesh>
          <mesh position={[w / 2.5, h / 2, 0]} castShadow>
            <boxGeometry args={[w / 4, h, d]} />
            <meshStandardMaterial color={hCol} />
          </mesh>
          {/* Arch top */}
          <mesh position={[0, h + 0.5, 0]} castShadow>
            <boxGeometry args={[w * 1.1, 1.5, d]} />
            <meshStandardMaterial color={hCol} />
          </mesh>
        </group>
      ) : s.style === "checkpoint" ? (
        <AnimatedCheckpoint s={s} hovered={hovered} handlers={handlers} />
      ) : s.style === "tower" ? (
        <group {...handlers}>
          <mesh position={[0, h / 2, 0]} castShadow>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial color={hCol} />
          </mesh>
          <mesh position={[0, h + 1.5, 0]} castShadow>
            <coneGeometry args={[w / 2 + 0.3, 3, 4]} />
            <meshStandardMaterial color={hCol} />
          </mesh>
          {/* Spotlight */}
          <mesh position={[0, h + 3.5, 0]}>
            <sphereGeometry args={[0.4, 8, 8]} />
            <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.5} />
          </mesh>
        </group>
      ) : s.style === "tunnel" ? (
        <group {...handlers}>
          {/* Mountain/hill */}
          <mesh position={[0, h / 2 + 1, 0]} castShadow>
            <boxGeometry args={[w + 2, h + 2, d + 2]} />
            <meshStandardMaterial color="#6b7280" />
          </mesh>
          {/* Dark opening */}
          <mesh position={[0, h / 2, d / 2 + 1.1]}>
            <planeGeometry args={[w * 0.7, h * 0.8]} />
            <meshStandardMaterial color="#1a1a2e" />
          </mesh>
        </group>
      ) : s.style === "bridge" ? (
        <group {...handlers}>
          {/* Deck */}
          <mesh position={[0, h / 2 + 1, 0]} castShadow>
            <boxGeometry args={[w, 0.6, d]} />
            <meshStandardMaterial color={hCol} />
          </mesh>
          {/* Railings */}
          {[-1, 1].map((side) => (
            <mesh key={side} position={[0, h / 2 + 2, (d / 2) * side]}>
              <boxGeometry args={[w, 1, 0.2]} />
              <meshStandardMaterial color="#78716c" />
            </mesh>
          ))}
          {/* Arch support */}
          <mesh position={[0, 0.5, 0]}>
            <boxGeometry args={[1.5, h, 1.5]} />
            <meshStandardMaterial color="#6b5e4e" />
          </mesh>
        </group>
      ) : s.style === "sign" ? (
        <group {...handlers}>
          <mesh position={[0, 3, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 6, 6]} />
            <meshStandardMaterial color="#78716c" />
          </mesh>
          <mesh position={[0, 5.5, 0]}>
            <boxGeometry args={[3.5, 1.8, 0.15]} />
            <meshStandardMaterial color={hovered ? "#6366f1" : "white"} />
          </mesh>
        </group>
      ) : s.style === "vending" ? (
        <group {...handlers}>
          <mesh position={[0, h / 2, 0]} castShadow>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial color={hCol} />
          </mesh>
          {/* Display panel */}
          <mesh position={[0, h / 2 + 0.5, d / 2 + 0.05]}>
            <planeGeometry args={[w * 0.8, h * 0.4]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          {/* Glowing dots */}
          {[-0.5, 0, 0.5].map((ox) => (
            <mesh key={ox} position={[ox, h / 2 + 0.5, d / 2 + 0.1]}>
              <circleGeometry args={[0.2, 8]} />
              <meshStandardMaterial color="#4ade80" emissive="#4ade80" emissiveIntensity={0.5} />
            </mesh>
          ))}
        </group>
      ) : (
        // Default: shop / booth
        <group {...handlers}>
          <mesh position={[0, h / 2, 0]} castShadow>
            <boxGeometry args={[w, h, d]} />
            <meshStandardMaterial color={hCol} />
          </mesh>
          {/* Awning */}
          {s.style === "shop" && (
            <mesh position={[0, h - 0.5, d / 2 + 0.8]} castShadow>
              <boxGeometry args={[w + 1, 0.2, 1.5]} />
              <meshStandardMaterial color="#c0392b" />
            </mesh>
          )}
          {/* Window */}
          <mesh position={[0, h / 2 + 0.5, d / 2 + 0.05]}>
            <planeGeometry args={[w * 0.7, h * 0.45]} />
            <meshStandardMaterial color="#bfdbfe" transparent opacity={0.7} />
          </mesh>
          {/* Door */}
          <mesh position={[0, 1, d / 2 + 0.05]}>
            <planeGeometry args={[w * 0.3, 2]} />
            <meshStandardMaterial color="#3d3428" />
          </mesh>
        </group>
      )}

      {/* Name label */}
      {showLabels && (
        <Html
          position={[0, Math.max(h + 1.5, 3.5), 0]}
          center
          distanceFactor={100}
          style={{ pointerEvents: "none" }}
        >
          <div
            className={`whitespace-nowrap rounded px-1.5 py-0.5 text-[9px] font-medium shadow ${
              hovered ? "bg-indigo-600 text-white" : "bg-white/80 text-gray-700"
            }`}
          >
            {term.name}
          </div>
        </Html>
      )}
    </group>
  );
}

/* ═══════════════════════════════════════════
   Exported Combined Component
   ═══════════════════════════════════════════ */

export function CityBuildings({
  lang,
  onBuildingClick,
  onStandaloneClick,
  showLabels = true,
}: {
  lang: "ko" | "en";
  onBuildingClick: (id: string) => void;
  onStandaloneClick: (termId: string) => void;
  showLabels?: boolean;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <group>
      {BUILDINGS.map((b) => (
        <LargeBuilding
          key={b.id}
          b={b}
          lang={lang}
          hovered={hoveredId === `b-${b.id}`}
          onHover={(h) => setHoveredId(h ? `b-${b.id}` : null)}
          onClick={() => onBuildingClick(b.id)}
          showLabels={showLabels}
        />
      ))}
      {STANDALONE.map((s) => (
        <StandaloneEl
          key={s.id}
          s={s}
          hovered={hoveredId === s.id}
          onHover={(h) => setHoveredId(h ? s.id : null)}
          onClick={() => onStandaloneClick(s.termId)}
          showLabels={showLabels}
        />
      ))}
    </group>
  );
}
