import type { CSSProperties, ReactNode } from "react";

/**
 * Shared helpers for the isometric step illustrations.
 *
 * World space is (u, v, z): u runs down-right on screen, v runs down-left,
 * z is straight up. True 30° isometric projection.
 */
const ISO_COS = 0.866;
const ISO_SIN = 0.5;

export type IsoOrigin = { x: number; y: number };

const round = (n: number) => Math.round(n * 10) / 10;

export function isoPoint(origin: IsoOrigin, u: number, v: number, z = 0) {
  return {
    x: round(origin.x + (u - v) * ISO_COS),
    y: round(origin.y + (u + v) * ISO_SIN - z),
  };
}

export function isoPolygon(
  origin: IsoOrigin,
  points: ReadonlyArray<readonly [number, number, number]>,
) {
  return points
    .map(([u, v, z]) => {
      const p = isoPoint(origin, u, v, z);
      return `${p.x},${p.y}`;
    })
    .join(" ");
}

/** Top face of a box footprint (u, v) → (u+w, v+d) at height z. */
export function isoTopFace(
  origin: IsoOrigin,
  u: number,
  v: number,
  z: number,
  w: number,
  d: number,
) {
  return isoPolygon(origin, [
    [u, v, z],
    [u + w, v, z],
    [u + w, v + d, z],
    [u, v + d, z],
  ]);
}

function isoLeftFace(
  origin: IsoOrigin,
  u: number,
  v: number,
  z: number,
  w: number,
  d: number,
  h: number,
) {
  return isoPolygon(origin, [
    [u, v + d, z + h],
    [u + w, v + d, z + h],
    [u + w, v + d, z],
    [u, v + d, z],
  ]);
}

function isoRightFace(
  origin: IsoOrigin,
  u: number,
  v: number,
  z: number,
  w: number,
  d: number,
  h: number,
) {
  return isoPolygon(origin, [
    [u + w, v, z + h],
    [u + w, v + d, z + h],
    [u + w, v + d, z],
    [u + w, v, z],
  ]);
}

type IsoBoxProps = {
  origin: IsoOrigin;
  u: number;
  v: number;
  z?: number;
  w: number;
  d: number;
  h: number;
  top?: string;
  left?: string;
  right?: string;
  stroke?: string;
  /** Darken the side faces - for boxes drawn in one solid color. */
  shade?: boolean;
  className?: string;
  style?: CSSProperties;
};

export function IsoBox({
  origin,
  u,
  v,
  z = 0,
  w,
  d,
  h,
  top = "var(--sheet)",
  left = "var(--background-300)",
  right = "var(--background-200)",
  stroke = "var(--background-500)",
  shade = false,
  className,
  style,
}: IsoBoxProps) {
  const leftFace = isoLeftFace(origin, u, v, z, w, d, h);
  const rightFace = isoRightFace(origin, u, v, z, w, d, h);

  return (
    <g className={className} style={style}>
      <polygon fill={left} points={leftFace} stroke={stroke} strokeWidth="1" />
      <polygon fill={right} points={rightFace} stroke={stroke} strokeWidth="1" />
      {shade ? (
        <>
          <polygon fill="#000" fillOpacity="0.22" points={leftFace} />
          <polygon fill="#000" fillOpacity="0.1" points={rightFace} />
        </>
      ) : null}
      <polygon
        fill={top}
        points={isoTopFace(origin, u, v, z + h, w, d)}
        stroke={stroke}
        strokeWidth="1"
      />
    </g>
  );
}

/** Soft cast shadow - a blurred footprint drawn on the surface below an element. */
export function IsoShadow({
  origin,
  u,
  v,
  z = 0,
  w,
  d,
  opacity = 0.1,
}: {
  origin: IsoOrigin;
  u: number;
  v: number;
  z?: number;
  w: number;
  d: number;
  opacity?: number;
}) {
  return (
    <polygon
      fill="#000"
      fillOpacity={opacity}
      filter="url(#iso-soft-shadow)"
      points={isoTopFace(origin, u, v, z, w, d)}
    />
  );
}

export function IsoLabel({
  x,
  y,
  children,
  anchor = "middle",
  fill = "var(--muted-foreground)",
  size = 9,
}: {
  x: number;
  y: number;
  children: ReactNode;
  anchor?: "start" | "middle" | "end";
  fill?: string;
  size?: number;
}) {
  return (
    <text
      fill={fill}
      fontFamily="var(--font-mono), ui-monospace, monospace"
      fontSize={size}
      letterSpacing="0.14em"
      textAnchor={anchor}
      x={x}
      y={y}
    >
      {children}
    </text>
  );
}

export function IsoFrame({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div aria-hidden className="relative aspect-square w-full select-none">
      <svg
        className="size-full"
        fill="none"
        viewBox="0 0 400 400"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>{title}</title>
        <defs>
          <filter height="180%" id="iso-soft-shadow" width="180%" x="-40%" y="-40%">
            <feGaussianBlur stdDeviation="3.5" />
          </filter>
        </defs>
        {children}
      </svg>
    </div>
  );
}
