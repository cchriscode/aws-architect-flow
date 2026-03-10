"use client";

import { useRef, useEffect, useCallback } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { MapControls } from "@react-three/drei";
import * as THREE from "three";
import { WORLD, BUILDINGS } from "./data";

type CameraMode = "city" | "flyto" | "interior";

export function CameraController({
  mode,
  targetBuildingId,
  onArrived,
}: {
  mode: CameraMode;
  targetBuildingId: string | null;
  onArrived: () => void;
}) {
  const controlsRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const { camera } = useThree();

  /* ── Fly-to animation state ── */
  const animRef = useRef({
    active: false,
    progress: 0,
    startPos: new THREE.Vector3(),
    startTarget: new THREE.Vector3(),
    endPos: new THREE.Vector3(),
    endTarget: new THREE.Vector3(),
  });

  /* ── Keyboard state ── */
  const keysRef = useRef(new Set<string>());

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    keysRef.current.add(e.code);
  }, []);
  const onKeyUp = useCallback((e: KeyboardEvent) => {
    keysRef.current.delete(e.code);
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [onKeyDown, onKeyUp]);

  /* ── Initial camera ── */
  useEffect(() => {
    camera.position.set(...WORLD.cameraStart);
    camera.lookAt(...WORLD.cameraTarget);
  }, [camera]);

  /* ── Mode transitions ── */
  useEffect(() => {
    const a = animRef.current;

    if (mode === "flyto" && targetBuildingId) {
      const building = BUILDINGS.find((b) => b.id === targetBuildingId);
      if (!building) return;

      const [bx, , bz] = building.pos;
      const [, bh, bd] = building.size;

      a.startPos.copy(camera.position);
      if (controlsRef.current) a.startTarget.copy(controlsRef.current.target);

      a.endPos.set(bx, bh * 0.7 + 5, bz + bd + 18);
      a.endTarget.set(bx, bh / 2, bz);
      a.progress = 0;
      a.active = true;
    } else if (mode === "city") {
      a.startPos.copy(camera.position);
      if (controlsRef.current) a.startTarget.copy(controlsRef.current.target);

      a.endPos.set(...WORLD.cameraStart);
      a.endTarget.set(...WORLD.cameraTarget);
      a.progress = 0;
      a.active = true;
    }
  }, [mode, targetBuildingId, camera]);

  /* ── Reusable vectors (avoid GC) ── */
  const _forward = useRef(new THREE.Vector3());
  const _right = useRef(new THREE.Vector3());
  const _move = useRef(new THREE.Vector3());

  /* ── Frame loop: animation + keyboard nav ── */
  useFrame((_, delta) => {
    const a = animRef.current;

    // Fly-to animation
    if (a.active) {
      a.progress = Math.min(1, a.progress + delta * 5);
      const t = easeInOutCubic(a.progress);
      camera.position.lerpVectors(a.startPos, a.endPos, t);
      if (controlsRef.current) {
        controlsRef.current.target.lerpVectors(a.startTarget, a.endTarget, t);
      }
      if (a.progress >= 1) {
        a.active = false;
        if (mode === "flyto") onArrived();
      }
      return;
    }

    // Keyboard navigation (only in city mode)
    if (mode !== "city") return;

    const keys = keysRef.current;
    if (keys.size === 0) return;

    const speed = 40 * delta;

    // Camera forward direction projected onto XZ plane
    camera.getWorldDirection(_forward.current);
    _forward.current.y = 0;
    _forward.current.normalize();

    // Right vector
    _right.current.crossVectors(_forward.current, camera.up).normalize();

    _move.current.set(0, 0, 0);

    if (keys.has("KeyW") || keys.has("ArrowUp")) _move.current.add(_forward.current);
    if (keys.has("KeyS") || keys.has("ArrowDown")) _move.current.sub(_forward.current);
    if (keys.has("KeyA") || keys.has("ArrowLeft")) _move.current.sub(_right.current);
    if (keys.has("KeyD") || keys.has("ArrowRight")) _move.current.add(_right.current);

    if (_move.current.lengthSq() > 0) {
      _move.current.normalize().multiplyScalar(speed);
      camera.position.add(_move.current);
      if (controlsRef.current) {
        controlsRef.current.target.add(_move.current);
      }
    }
  });

  return (
    <MapControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      maxPolarAngle={Math.PI / 2.1}
      minPolarAngle={0.2}
      minDistance={8}
      maxDistance={350}
      target={WORLD.cameraTarget}
      enabled={mode === "city" && !animRef.current.active}
    />
  );
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
