"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import {
  STREETS,
  ZONES,
  CLUSTERS,
  LAMP_POSITIONS,
  TREE_POSITIONS,
  ROAD_SIGNS,
  TRAFFIC_LIGHTS,
  WORLD,
  type RoadSignDef,
} from "./data";
import { TrafficFlow } from "./TrafficFlow";

/* ═══════════════════════════════════════════
   Ground + Zones
   ═══════════════════════════════════════════ */

function Ground() {
  return (
    <group>
      {/* Base ground */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.05, 5]} receiveShadow>
        <planeGeometry args={[WORLD.size + 40, WORLD.size + 40]} />
        <meshStandardMaterial color="#c8c4b7" />
      </mesh>

      {/* Zone overlays */}
      {ZONES.map((zone) => {
        const depth = zone.z[1] - zone.z[0];
        const cz = (zone.z[0] + zone.z[1]) / 2;
        return (
          <mesh key={zone.id} rotation-x={-Math.PI / 2} position={[0, -0.02, cz]} receiveShadow>
            <planeGeometry args={[WORLD.size - 20, depth]} />
            <meshStandardMaterial color={zone.color} transparent opacity={0.45} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ═══════════════════════════════════════════
   Zone Labels (floating)
   ═══════════════════════════════════════════ */

function ZoneLabels({ lang }: { lang: "ko" | "en" }) {
  return (
    <group>
      {ZONES.map((zone) => (
        <Html
          key={zone.id}
          position={[-60, 0.5, zone.labelZ]}
          center
          distanceFactor={120}
          style={{ pointerEvents: "none" }}
        >
          <div className="whitespace-nowrap rounded bg-black/30 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white/80 ">
            {zone.label[lang]}
          </div>
        </Html>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════
   Cluster ground patches + labels
   ═══════════════════════════════════════════ */

function ClusterPatches({ lang }: { lang: "ko" | "en" }) {
  return (
    <group>
      {CLUSTERS.map((cl) => (
        <group key={cl.id}>
          {/* Colored ground patch */}
          <mesh rotation-x={-Math.PI / 2} position={[cl.pos[0], 0.04, cl.pos[1]]} receiveShadow>
            <planeGeometry args={[cl.size[0], cl.size[1]]} />
            <meshStandardMaterial color={cl.color} transparent opacity={0.6} />
          </mesh>
          {/* Dashed border */}
          <mesh rotation-x={-Math.PI / 2} position={[cl.pos[0], 0.05, cl.pos[1]]}>
            <planeGeometry args={[cl.size[0] + 0.4, cl.size[1] + 0.4]} />
            <meshStandardMaterial color={cl.color} transparent opacity={0.25} wireframe />
          </mesh>
          {/* Label */}
          <Html
            position={[cl.pos[0], 0.3, cl.pos[1] - cl.size[1] / 2 + 1]}
            center
            distanceFactor={100}
            style={{ pointerEvents: "none" }}
          >
            <div className="whitespace-nowrap rounded-sm bg-white/60 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider text-gray-500 ">
              {cl.label[lang]}
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════
   Streets with markings
   ═══════════════════════════════════════════ */

function Streets({ showLabels = true }: { showLabels?: boolean }) {
  return (
    <group>
      {STREETS.map((st) => {
        const isZ = st.axis === "z";
        const len = st.size[0];
        const w = st.size[1];
        const roadW = isZ ? w : len;
        const roadD = isZ ? len : w;

        return (
          <group key={st.id} position={st.pos}>
            {/* Asphalt */}
            <mesh rotation-x={-Math.PI / 2} receiveShadow>
              <planeGeometry args={[roadW, roadD]} />
              <meshStandardMaterial color={st.isHighway ? "#555" : "#666"} />
            </mesh>

            {/* Center dashed line */}
            <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0]}>
              <planeGeometry args={isZ ? [0.25, len] : [len, 0.25]} />
              <meshStandardMaterial color="#fbbf24" />
            </mesh>

            {/* Edge lines */}
            <mesh rotation-x={-Math.PI / 2} position={isZ ? [w / 2 - 0.3, 0.01, 0] : [0, 0.01, w / 2 - 0.3]}>
              <planeGeometry args={isZ ? [0.15, len] : [len, 0.15]} />
              <meshStandardMaterial color="white" transparent opacity={0.5} />
            </mesh>
            <mesh rotation-x={-Math.PI / 2} position={isZ ? [-w / 2 + 0.3, 0.01, 0] : [0, 0.01, -w / 2 + 0.3]}>
              <planeGeometry args={isZ ? [0.15, len] : [len, 0.15]} />
              <meshStandardMaterial color="white" transparent opacity={0.5} />
            </mesh>

            {/* Sidewalks (raised, lighter) */}
            {isZ ? (
              <>
                <mesh position={[w / 2 + 1.5, 0.15, 0]} castShadow receiveShadow>
                  <boxGeometry args={[2.5, 0.3, len]} />
                  <meshStandardMaterial color="#d1d5db" />
                </mesh>
                <mesh position={[-w / 2 - 1.5, 0.15, 0]} castShadow receiveShadow>
                  <boxGeometry args={[2.5, 0.3, len]} />
                  <meshStandardMaterial color="#d1d5db" />
                </mesh>
              </>
            ) : (
              <>
                <mesh position={[0, 0.15, w / 2 + 1.5]} castShadow receiveShadow>
                  <boxGeometry args={[len, 0.3, 2.5]} />
                  <meshStandardMaterial color="#d1d5db" />
                </mesh>
                <mesh position={[0, 0.15, -w / 2 - 1.5]} castShadow receiveShadow>
                  <boxGeometry args={[len, 0.3, 2.5]} />
                  <meshStandardMaterial color="#d1d5db" />
                </mesh>
              </>
            )}

            {/* Street label */}
            {showLabels && st.label && (
              <Html
                position={isZ ? [w / 2 + 3, 0.5, 0] : [0, 0.5, -w / 2 - 3]}
                center
                distanceFactor={140}
                style={{ pointerEvents: "none" }}
              >
                <div className="whitespace-nowrap text-[7px] font-bold uppercase tracking-wider text-gray-400">
                  {st.label}
                </div>
              </Html>
            )}
          </group>
        );
      })}

      {/* Crosswalks at main intersections */}
      {[-50, -38, -10, 32, 55].map((z) => (
        <group key={`cw-${z}`}>
          {Array.from({ length: 6 }).map((_, i) => (
            <mesh key={i} rotation-x={-Math.PI / 2} position={[-3 + i * 1.3, 0.03, z]}>
              <planeGeometry args={[0.8, 3]} />
              <meshStandardMaterial color="white" transparent opacity={0.7} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════
   VPC Walls
   ═══════════════════════════════════════════ */

function VPCWalls() {
  const wallH = 5;
  const wallT = 1.2;
  const wallColor = "#8b7d6b";
  const gateGap = 14;

  // Create a brick-like pattern via vertex colors won't work easily,
  // so we use horizontal lines (thin boxes) for brick texture effect.
  const BrickLines = ({ w, h, d }: { w: number; h: number; d: number }) => (
    <group>
      {Array.from({ length: Math.floor(h / 1.2) }).map((_, i) => (
        <mesh key={i} position={[0, -h / 2 + 0.6 + i * 1.2, d > w ? 0 : 0]}>
          <boxGeometry args={[w + 0.02, 0.05, d + 0.02]} />
          <meshStandardMaterial color="#7a6e5e" />
        </mesh>
      ))}
    </group>
  );

  return (
    <group>
      {/* North wall (split for IGW) */}
      <group position={[0, wallH / 2, -50]}>
        {/* Left segment */}
        <mesh position={[-(gateGap / 2 + 30), 0, 0]} castShadow>
          <boxGeometry args={[55, wallH, wallT]} />
          <meshStandardMaterial color={wallColor} />
        </mesh>
        <BrickLines w={55} h={wallH} d={wallT} />
        {/* Right segment */}
        <mesh position={[(gateGap / 2 + 30), 0, 0]} castShadow>
          <boxGeometry args={[55, wallH, wallT]} />
          <meshStandardMaterial color={wallColor} />
        </mesh>
      </group>

      {/* Crenellations on north wall */}
      {Array.from({ length: 12 }).map((_, i) => {
        const x = -62 + i * 6;
        if (Math.abs(x) < gateGap / 2 + 2) return null;
        return (
          <mesh key={`cn-${i}`} position={[x, wallH + 1, -50]} castShadow>
            <boxGeometry args={[2.5, 2, wallT + 0.1]} />
            <meshStandardMaterial color="#a39585" />
          </mesh>
        );
      })}

      {/* South wall (split for main-ave gate) */}
      <mesh position={[-(gateGap / 2 + 30), wallH / 2, 48]} castShadow>
        <boxGeometry args={[55, wallH, wallT]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>
      <mesh position={[(gateGap / 2 + 30), wallH / 2, 48]} castShadow>
        <boxGeometry args={[55, wallH, wallT]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>
      {Array.from({ length: 18 }).map((_, i) => {
        const x = -52 + i * 6;
        if (Math.abs(x) < gateGap / 2 + 2) return null;
        return (
          <mesh key={`cs-${i}`} position={[x, wallH + 1, 48]} castShadow>
            <boxGeometry args={[2.5, 2, wallT + 0.1]} />
            <meshStandardMaterial color="#a39585" />
          </mesh>
        );
      })}

      {/* West wall */}
      <mesh position={[-48, wallH / 2, -1]} castShadow>
        <boxGeometry args={[wallT, wallH, 98]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>

      {/* East wall */}
      <mesh position={[48, wallH / 2, -1]} castShadow>
        <boxGeometry args={[wallT, wallH, 98]} />
        <meshStandardMaterial color={wallColor} />
      </mesh>

      {/* VPC label on north wall */}
      <Html position={[-40, wallH + 3, -50]} center distanceFactor={100} style={{ pointerEvents: "none" }}>
        <div className="text-xs font-bold tracking-[4px] text-amber-900/60">VPC</div>
      </Html>
    </group>
  );
}

/* ═══════════════════════════════════════════
   Instanced Trees
   ═══════════════════════════════════════════ */

function Trees() {
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const canopyRef = useRef<THREE.InstancedMesh>(null);
  const count = TREE_POSITIONS.length;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const scales = useMemo(
    () => TREE_POSITIONS.map(() => 0.6 + Math.random() * 0.5),
    []
  );

  useMemo(() => {
    if (!trunkRef.current || !canopyRef.current) return;
    TREE_POSITIONS.forEach((pos, i) => {
      const s = scales[i];
      dummy.position.set(pos[0], 2 * s, pos[2]);
      dummy.scale.set(s * 0.8, s, s * 0.8);
      dummy.updateMatrix();
      trunkRef.current!.setMatrixAt(i, dummy.matrix);

      dummy.position.set(pos[0], 5 * s, pos[2]);
      dummy.scale.set(s * 1.3, s * 1.2, s * 1.3);
      dummy.updateMatrix();
      canopyRef.current!.setMatrixAt(i, dummy.matrix);
    });
    trunkRef.current.instanceMatrix.needsUpdate = true;
    canopyRef.current.instanceMatrix.needsUpdate = true;
  }, [dummy, scales]);

  return (
    <group>
      <instancedMesh ref={trunkRef} args={[undefined, undefined, count]} castShadow>
        <cylinderGeometry args={[0.25, 0.4, 4, 6]} />
        <meshStandardMaterial color="#6b4423" />
      </instancedMesh>
      <instancedMesh ref={canopyRef} args={[undefined, undefined, count]} castShadow>
        <coneGeometry args={[2.2, 4.5, 8]} />
        <meshStandardMaterial color="#2d8a4e" />
      </instancedMesh>
    </group>
  );
}

/* ═══════════════════════════════════════════
   Instanced Lamp Posts
   ═══════════════════════════════════════════ */

function LampPosts() {
  const poleRef = useRef<THREE.InstancedMesh>(null);
  const lampRef = useRef<THREE.InstancedMesh>(null);
  const count = LAMP_POSITIONS.length;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useMemo(() => {
    if (!poleRef.current || !lampRef.current) return;
    LAMP_POSITIONS.forEach((pos, i) => {
      dummy.position.set(pos[0], 3, pos[2]);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      poleRef.current!.setMatrixAt(i, dummy.matrix);

      dummy.position.set(pos[0] + 0.8, 5.5, pos[2]);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      lampRef.current!.setMatrixAt(i, dummy.matrix);
    });
    poleRef.current.instanceMatrix.needsUpdate = true;
    lampRef.current.instanceMatrix.needsUpdate = true;
  }, [dummy]);

  return (
    <group>
      <instancedMesh ref={poleRef} args={[undefined, undefined, count]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 6, 6]} />
        <meshStandardMaterial color="#78716c" />
      </instancedMesh>
      <instancedMesh ref={lampRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[0.35, 8, 8]} />
        <meshStandardMaterial color="#fef9c3" emissive="#fef08a" emissiveIntensity={0.4} />
      </instancedMesh>
    </group>
  );
}

/* ═══════════════════════════════════════════
   Road Signs (Route Table representation)
   ═══════════════════════════════════════════ */

function RoadSigns({
  lang,
  onSignClick,
}: {
  lang: "ko" | "en";
  onSignClick: (termId: string) => void;
}) {
  return (
    <group>
      {ROAD_SIGNS.map((sign: RoadSignDef) => (
        <group key={sign.id} position={sign.pos}>
          {/* Post */}
          <mesh position={[0, 2.8, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 5.6, 6]} />
            <meshStandardMaterial color="#6b7280" />
          </mesh>
          {/* Sign board (green, highway-style) */}
          <mesh
            position={[0, 5.2, 0]}
            onClick={(e) => { e.stopPropagation(); onSignClick(sign.termId); }}
          >
            <boxGeometry args={[4, 1.8, 0.15]} />
            <meshStandardMaterial color="#166534" />
          </mesh>
          <Html
            position={[0, 5.2, 0.1]}
            center
            distanceFactor={80}
            style={{ pointerEvents: "none" }}
          >
            <div className="whitespace-nowrap text-[8px] font-bold text-white" style={{ textShadow: "0 0 3px rgba(0,0,0,0.6)" }}>
              {sign.text[lang]}
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════
   Traffic Lights
   ═══════════════════════════════════════════ */

function TrafficLights() {
  return (
    <group>
      {TRAFFIC_LIGHTS.map((tl) => (
        <group key={tl.id} position={tl.pos}>
          {/* Pole */}
          <mesh position={[0, 3.5, 0]}>
            <cylinderGeometry args={[0.1, 0.12, 7, 6]} />
            <meshStandardMaterial color="#374151" />
          </mesh>
          {/* Light housing */}
          <mesh position={[0, 6.8, 0]}>
            <boxGeometry args={[0.7, 2.2, 0.5]} />
            <meshStandardMaterial color="#1f2937" />
          </mesh>
          {/* Red */}
          <mesh position={[0, 7.5, 0.26]}>
            <circleGeometry args={[0.22, 12]} />
            <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.6} />
          </mesh>
          {/* Yellow */}
          <mesh position={[0, 6.8, 0.26]}>
            <circleGeometry args={[0.22, 12]} />
            <meshStandardMaterial color="#854d0e" />
          </mesh>
          {/* Green */}
          <mesh position={[0, 6.1, 0.26]}>
            <circleGeometry args={[0.22, 12]} />
            <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
}


/* ═══════════════════════════════════════════
   Export
   ═══════════════════════════════════════════ */

export function CityEnvironment({
  lang,
  onSignClick,
  showLabels = true,
}: {
  lang: "ko" | "en";
  onSignClick: (termId: string) => void;
  showLabels?: boolean;
}) {
  return (
    <group>
      <Ground />
      {showLabels && <ZoneLabels lang={lang} />}
      {showLabels && <ClusterPatches lang={lang} />}
      <Streets showLabels={showLabels} />
      <VPCWalls />
      <Trees />
      <LampPosts />
      {showLabels && <RoadSigns lang={lang} onSignClick={onSignClick} />}
      <TrafficLights />
      <TrafficFlow lang={lang} showLabels={showLabels} />
    </group>
  );
}
