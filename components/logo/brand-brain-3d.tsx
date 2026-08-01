"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  DoubleSide,
  ExtrudeGeometry,
  NoToneMapping,
  Path,
  Shape,
  SRGBColorSpace,
  TOUCH,
} from "three";

import { cn } from "@/lib/utils";

type ThemeId = "chrome" | "ink" | "signal";

type Theme = {
  id: ThemeId;
  label: string;
  bg: string;
  stroke: string;
  core: string;
  coreEmissive: string;
  hint: "light" | "dark";
};

const THEMES: Theme[] = [
  {
    id: "chrome",
    label: "Chrome",
    bg: "#ededed",
    stroke: "#171717",
    core: "#ff5800",
    coreEmissive: "#ff6a1a",
    hint: "light",
  },
  {
    id: "ink",
    label: "Ink",
    bg: "#171717",
    stroke: "#ffffff",
    core: "#ff5800",
    coreEmissive: "#ff6a1a",
    hint: "dark",
  },
  {
    id: "signal",
    label: "Signal",
    bg: "#ff5800",
    stroke: "#ffffff",
    core: "#ffffff",
    coreEmissive: "#ffffff",
    hint: "dark",
  },
];

/** Match SVG viewBox proportions (r 11 / 7.5 / 5, stroke 1.4 / 1.2). */
const SCALE = 0.175;
const OUTER_R = 11 * SCALE;
const MID_R = 7.5 * SCALE;
const CORE_R = 5 * SCALE;
const OUTER_STROKE = 1.4 * SCALE;
const MID_STROKE = 1.2 * SCALE;

/** strokeDasharray="2.5 2" on r=11 circle */
const SVG_R = 11;
const DASH = 2.5;
const GAP = 2;
const DEPTH = 0.28;
const CORE_DEPTH = 0.36;

const extrudeBase = {
  bevelEnabled: false,
} as const;

function ringShape(innerR: number, outerR: number) {
  const shape = new Shape();
  shape.absarc(0, 0, outerR, 0, Math.PI * 2, false);
  const hole = new Path();
  hole.absarc(0, 0, innerR, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  return shape;
}

function arcDashShape(
  radius: number,
  halfStroke: number,
  start: number,
  end: number,
) {
  const outer = radius + halfStroke;
  const inner = Math.max(radius - halfStroke, 0.001);
  const shape = new Shape();
  shape.absarc(0, 0, outer, start, end, false);
  shape.absarc(0, 0, inner, end, start, true);
  return shape;
}

function circleShape(radius: number) {
  const shape = new Shape();
  shape.absarc(0, 0, radius, 0, Math.PI * 2, false);
  return shape;
}

function makeExtrude(shape: Shape, depth: number, curveSegments: number) {
  const geo = new ExtrudeGeometry(shape, {
    ...extrudeBase,
    depth,
    curveSegments,
  });
  geo.translate(0, 0, -depth / 2);
  geo.computeVertexNormals();
  return geo;
}

function StrokeMaterial({ color }: { color: string }) {
  const isWhite = color.toLowerCase() === "#ffffff";
  if (isWhite) {
    return (
      <meshBasicMaterial color="#ffffff" side={DoubleSide} toneMapped={false} />
    );
  }
  return (
    <meshStandardMaterial
      color={color}
      metalness={0.08}
      roughness={0.55}
      side={DoubleSide}
    />
  );
}

function DashedRing({ stroke }: { stroke: string }) {
  const dashes = useMemo(() => {
    const dashFraction = DASH / (DASH + GAP);
    // Round to a count that fits the SVG dash period, then space evenly
    // so every gap is identical around the full circle.
    const count = Math.round((Math.PI * 2 * SVG_R) / (DASH + GAP));
    const periodAngle = (Math.PI * 2) / count;
    const dashAngle = periodAngle * dashFraction;

    return Array.from({ length: count }, (_, i) => {
      const start = i * periodAngle;
      const end = start + dashAngle;
      return {
        key: i,
        geometry: makeExtrude(
          arcDashShape(OUTER_R, OUTER_STROKE / 2, start, end),
          DEPTH,
          10,
        ),
      };
    });
  }, []);

  return (
    <group>
      {dashes.map((dash) => (
        <mesh geometry={dash.geometry} key={dash.key}>
          <StrokeMaterial color={stroke} />
        </mesh>
      ))}
    </group>
  );
}

function MidRing({ stroke }: { stroke: string }) {
  const geometry = useMemo(
    () =>
      makeExtrude(
        ringShape(MID_R - MID_STROKE / 2, MID_R + MID_STROKE / 2),
        DEPTH,
        64,
      ),
    [],
  );

  return (
    <mesh geometry={geometry}>
      <StrokeMaterial color={stroke} />
    </mesh>
  );
}

function CoreDisc({
  core,
  coreEmissive,
}: {
  core: string;
  coreEmissive: string;
}) {
  const geometry = useMemo(
    () => makeExtrude(circleShape(CORE_R), CORE_DEPTH, 64),
    [],
  );

  const isWhite = core.toLowerCase() === "#ffffff";

  return (
    <mesh geometry={geometry}>
      {isWhite ? (
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      ) : (
        <meshStandardMaterial
          color={core}
          emissive={coreEmissive}
          emissiveIntensity={0.4}
          metalness={0.05}
          roughness={0.4}
        />
      )}
    </mesh>
  );
}

function BrandBrainMark({ theme }: { theme: Theme }) {
  return (
    <group rotation={[0.22, -0.38, 0.06]}>
      <DashedRing stroke={theme.stroke} />
      <MidRing stroke={theme.stroke} />
      <CoreDisc core={theme.core} coreEmissive={theme.coreEmissive} />
    </group>
  );
}

function ResponsiveCamera() {
  const { camera, size } = useThree();

  useLayoutEffect(() => {
    // Pull back on narrow canvases so the mark keeps padding on phones.
    const z = size.width < 420 ? 12.4 : size.width < 720 ? 10.6 : 9.2;
    camera.position.set(0, 0.08, z);
    camera.updateProjectionMatrix();
  }, [camera, size.width]);

  return null;
}

function Scene({
  reducedMotion,
  theme,
}: {
  reducedMotion: boolean;
  theme: Theme;
}) {
  return (
    <>
      <color attach="background" args={[theme.bg]} />
      <ambientLight intensity={0.85} />
      <directionalLight intensity={1.2} position={[3.5, 4, 6]} />
      <directionalLight intensity={0.4} position={[-3, -1, 2]} />
      <directionalLight intensity={0.55} position={[0, 2, -4]} />

      <ResponsiveCamera />
      <BrandBrainMark key={theme.id} theme={theme} />

      <OrbitControls
        autoRotate={!reducedMotion}
        autoRotateSpeed={0.5}
        dampingFactor={0.08}
        enableDamping
        enablePan={false}
        enableZoom={false}
        maxPolarAngle={Math.PI * 0.7}
        minPolarAngle={Math.PI * 0.3}
        rotateSpeed={0.85}
        target={[0, 0, 0]}
        touches={{ ONE: TOUCH.ROTATE, TWO: TOUCH.ROTATE }}
      />
    </>
  );
}

type BrandBrain3DProps = {
  className?: string;
};

export function BrandBrain3D({ className }: BrandBrain3DProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [themeId, setThemeId] = useState<ThemeId>("chrome");
  const [coarsePointer, setCoarsePointer] = useState(false);
  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0];

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = window.matchMedia("(pointer: coarse)");
    const syncMotion = () => setReducedMotion(motion.matches);
    const syncCoarse = () => setCoarsePointer(coarse.matches);
    syncMotion();
    syncCoarse();
    motion.addEventListener("change", syncMotion);
    coarse.addEventListener("change", syncCoarse);
    return () => {
      motion.removeEventListener("change", syncMotion);
      coarse.removeEventListener("change", syncCoarse);
    };
  }, []);

  return (
    <div
      aria-label="Interactive 3D Brand Brain logo. Drag or swipe to rotate."
      className={cn(
        "relative w-full overflow-hidden",
        // Square + capped height on phones; wider frame on desktop.
        "aspect-square max-h-[min(70svh,28rem)] sm:aspect-[4/3] sm:max-h-none",
        className,
      )}
      role="img"
      style={{ backgroundColor: theme.bg }}
    >
      <div className="absolute inset-0 touch-none overscroll-none">
        <Canvas
          camera={{ position: [0, 0.08, 9.2], fov: 36 }}
          dpr={[1, coarsePointer ? 1.5 : 1.75]}
          flat
          gl={{ antialias: true, alpha: false }}
          onCreated={({ gl }) => {
            gl.toneMapping = NoToneMapping;
            gl.outputColorSpace = SRGBColorSpace;
          }}
          style={{ touchAction: "none" }}
        >
          <Suspense fallback={null}>
            <Scene reducedMotion={reducedMotion} theme={theme} />
          </Suspense>
        </Canvas>
      </div>

      <div
        aria-label="Surface theme"
        className="absolute top-3 right-3 z-10 flex items-center gap-1 sm:top-4 sm:right-4 sm:gap-1"
        role="radiogroup"
      >
        {THEMES.map((t) => {
          const active = t.id === themeId;
          return (
            <button
              aria-checked={active}
              className={cn(
                "min-h-11 min-w-11 touch-manipulation px-2.5 text-label transition-colors duration-300 ease-[var(--ease-swift)] sm:min-h-0 sm:min-w-0 sm:px-1.5",
                theme.hint === "dark"
                  ? active
                    ? "text-sheet"
                    : "text-sheet/45 hover:text-sheet/80"
                  : active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
              )}
              key={t.id}
              onClick={() => setThemeId(t.id)}
              role="radio"
              type="button"
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <p
        className={cn(
          "pointer-events-none absolute bottom-3 left-3 text-label sm:bottom-4 sm:left-4",
          theme.hint === "dark" ? "text-sheet/50" : "text-muted-foreground",
        )}
      >
        {coarsePointer ? "Swipe to orbit" : "Drag to orbit"}
      </p>
    </div>
  );
}
