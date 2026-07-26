import type { CSSProperties } from "react";

import {
  IsoBox,
  IsoFrame,
  IsoShadow,
  isoPoint,
  isoTopFace,
  type IsoOrigin,
} from "@/components/landing/step-illustration/iso";

/**
 * Step 03 - "Create anywhere".
 * A grid of tool canvases sharing one raised brand cube.
 * Footprint matches the 196×196 platforms on steps 01 and 02.
 */

const GRID_O: IsoOrigin = { x: 200, y: 212 };

/** 3 tiles of 56 + 2 gaps of 14 = 196, centered on [-98, 98]. */
const TILE = 56;
const GRID_POSITIONS = [-98, -28, 42];

/** Flat content marks drawn on a tile's top face, offset from its corner. */
type TileMark = { du: number; dv: number; w: number; d: number };

const MARK_EMAIL: TileMark[] = [
  { du: 13, dv: 14, w: 30, d: 5 },
  { du: 13, dv: 24, w: 20, d: 5 },
  { du: 13, dv: 34, w: 30, d: 5 },
];
const MARK_POST: TileMark[] = [
  { du: 16, dv: 15, w: 24, d: 24 },
  { du: 16, dv: 43, w: 16, d: 4 },
];
const MARK_BANNER: TileMark[] = [
  { du: 10, dv: 18, w: 36, d: 10 },
  { du: 10, dv: 34, w: 20, d: 5 },
];
const MARK_PAGE: TileMark[] = [
  { du: 13, dv: 13, w: 14, d: 14 },
  { du: 31, dv: 13, w: 12, d: 5 },
  { du: 13, dv: 32, w: 30, d: 5 },
];

const TILE_MARKS: Record<string, TileMark[]> = {
  "-98,-98": MARK_EMAIL,
  "-28,-98": MARK_POST,
  "42,-98": MARK_BANNER,
  "-98,-28": MARK_PAGE,
  "42,-28": MARK_EMAIL,
  "-98,42": MARK_BANNER,
  "-28,42": MARK_POST,
  "42,42": MARK_PAGE,
};

/** Dashed brand-flow segments in the gaps around the center cube. */
const GRID_LINKS: Array<[number, number, number, number]> = [
  [28, 0, 42, 0],
  [-28, 0, -42, 0],
  [0, 28, 0, 42],
  [0, -28, 0, -42],
];

const delay = (s: number) => ({ "--iso-delay": `${s}s` }) as CSSProperties;

export function StepThreeGrid() {
  const centerTop = 28;
  const dot = isoPoint(GRID_O, 0, 0, centerTop + 14);

  return (
    <IsoFrame title="A grid of canvases sharing one brand">
      {GRID_POSITIONS.map((v, row) =>
        GRID_POSITIONS.map((u, col) => {
          const isCenter = u === -28 && v === -28;
          if (isCenter) {
            return (
              <g className="iso-drop" key={`${u},${v}`} style={delay(0.55)}>
                <IsoShadow
                  d={TILE + 6}
                  opacity={0.12}
                  origin={GRID_O}
                  u={u - 1}
                  v={v - 1}
                  w={TILE + 6}
                  z={-4}
                />
                <IsoBox
                  d={TILE}
                  h={28}
                  left="var(--primary)"
                  origin={GRID_O}
                  right="var(--primary)"
                  shade
                  stroke="var(--primary)"
                  top="var(--primary)"
                  u={u}
                  v={v}
                  w={TILE}
                />
                <circle
                  className="hero-pulse"
                  cx={dot.x}
                  cy={dot.y}
                  fill="var(--primary)"
                  r="3"
                />
              </g>
            );
          }
          return (
            <g
              className="iso-rise"
              key={`${u},${v}`}
              style={delay((row * 3 + col) * 0.06)}
            >
              <IsoShadow
                d={TILE + 4}
                opacity={0.07}
                origin={GRID_O}
                u={u}
                v={v}
                w={TILE + 4}
                z={-4}
              />
              <IsoBox d={TILE} h={8} origin={GRID_O} u={u} v={v} w={TILE} />
              {TILE_MARKS[`${u},${v}`]?.map((mark, i) => (
                <polygon
                  fill="var(--background-500)"
                  key={i}
                  points={isoTopFace(
                    GRID_O,
                    u + mark.du,
                    v + mark.dv,
                    8,
                    mark.w,
                    mark.d,
                  )}
                />
              ))}
            </g>
          );
        }),
      )}

      <g className="iso-fade" style={delay(0.8)}>
        {GRID_LINKS.map(([u1, v1, u2, v2], i) => {
          const a = isoPoint(GRID_O, u1, v1, 8);
          const b = isoPoint(GRID_O, u2, v2, 8);
          return (
            <line
              className="hero-beam"
              key={i}
              stroke="var(--primary)"
              strokeDasharray="3 4"
              strokeOpacity="0.8"
              strokeWidth="1.25"
              style={{ animationDelay: `${i * 0.25}s` }}
              x1={a.x}
              x2={b.x}
              y1={a.y}
              y2={b.y}
            />
          );
        })}
      </g>
    </IsoFrame>
  );
}
