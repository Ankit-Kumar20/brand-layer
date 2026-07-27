"use client";

import { useState, type CSSProperties } from "react";

import { IsoReveal } from "@/components/landing/step-illustration/iso-reveal";

/**
 * v4 - Layers: sources compile down through desin into every agent.
 *
 * Welcome build: plates start stacked as a tight deck, fan open to their
 * resting positions, then marks / labels / bracket / caption fade in.
 */
const PLATES = [
  { label: "Sources", y: 110 },
  { label: "Tokens", y: 168 },
  { label: "Context", y: 226 },
  { label: "Agents", y: 284 },
];

const HALF_WIDTH = 108;
const HALF_DEPTH = 34;
const THICKNESS = 8;
const RATIO = HALF_DEPTH / HALF_WIDTH;

/** Midpoint of the open stack - where the closed deck sits. */
const STACK_CENTER = (PLATES[0]!.y + PLATES[PLATES.length - 1]!.y) / 2;
/** Vertical gap between plates while closed (shows thickness). */
const STACK_GAP = 11;
const VIEWBOX = 400;

const delay = (s: number) => ({ "--iso-delay": `${s}s` }) as CSSProperties;

/** Closed-deck Y for plate index `i`, packed around STACK_CENTER. */
function collapsedY(i: number) {
  return STACK_CENTER + (i - (PLATES.length - 1) / 2) * STACK_GAP;
}

/** CSS translate distance (as % of viewBox) from closed → open for plate `i`. */
function stackFrom(i: number) {
  return `${((collapsedY(i) - PLATES[i]!.y) / VIEWBOX) * 100}%`;
}

function rhombus(cx: number, cy: number, halfWidth: number, halfDepth: number) {
  return [
    `${cx - halfWidth},${cy}`,
    `${cx},${cy - halfDepth}`,
    `${cx + halfWidth},${cy}`,
    `${cx},${cy + halfDepth}`,
  ].join(" ");
}

/**
 * Flat mark lying on a plate: a parallelogram in the plate's plane.
 * `halfU` runs down-right along the plate, `halfV` down-left.
 */
function patch(cx: number, cy: number, halfU: number, halfV: number) {
  const round = (n: number) => Math.round(n * 10) / 10;
  return [
    `${round(cx - halfU + halfV)},${round(cy - (halfU + halfV) * RATIO)}`,
    `${round(cx + halfU + halfV)},${round(cy + (halfU - halfV) * RATIO)}`,
    `${round(cx + halfU - halfV)},${round(cy + (halfU + halfV) * RATIO)}`,
    `${round(cx - halfU - halfV)},${round(cy - (halfU - halfV) * RATIO)}`,
  ].join(" ");
}

/** Bar center shifted along the plate's down-left axis by `t`. */
function vShift(cx: number, cy: number, t: number) {
  return { x: cx - t, y: cy + t * RATIO };
}

/** Side faces that give a plate real thickness instead of a drop shadow. */
function slabSides(cx: number, cy: number) {
  const left = [
    `${cx - HALF_WIDTH},${cy}`,
    `${cx},${cy + HALF_DEPTH}`,
    `${cx},${cy + HALF_DEPTH + THICKNESS}`,
    `${cx - HALF_WIDTH},${cy + THICKNESS}`,
  ].join(" ");
  const right = [
    `${cx + HALF_WIDTH},${cy}`,
    `${cx},${cy + HALF_DEPTH}`,
    `${cx},${cy + HALF_DEPTH + THICKNESS}`,
    `${cx + HALF_WIDTH},${cy + THICKNESS}`,
  ].join(" ");
  return { left, right };
}

/** Sources: guideline doc lines, a type specimen, and color swatches. */
function SourcesMarks({ y }: { y: number }) {
  const bars = [
    { t: -11, halfU: 13 },
    { t: 0, halfU: 9 },
    { t: 11, halfU: 13 },
  ];
  return (
    <>
      {bars.map(({ t, halfU }) => {
        const c = vShift(156, y, t);
        return (
          <polygon
            fill="var(--background-600)"
            key={t}
            points={patch(c.x, c.y, halfU, 1.5)}
          />
        );
      })}
      <text
        fill="var(--foreground)"
        fontFamily="var(--font-sans), system-ui, sans-serif"
        fontSize="11"
        textAnchor="middle"
        x="228"
        y={y + 4}
      >
        Aa
      </text>
      <polygon fill="var(--primary)" points={patch(262, y, 5, 5)} />
      <polygon fill="var(--background-500)" points={patch(281, y, 3, 3)} />
    </>
  );
}

/** Tokens: a row of token chips either side of the beam. */
function TokensMarks({ y }: { y: number }) {
  const chips = [
    { dx: -54, fill: "var(--primary)" },
    { dx: -26, fill: "var(--foreground)" },
    { dx: 26, fill: "var(--background-600)" },
    { dx: 54, fill: "var(--background-500)" },
  ];
  return (
    <>
      {chips.map(({ dx, fill }) => (
        <polygon fill={fill} key={dx} points={patch(200 + dx, y, 5.5, 5.5)} />
      ))}
    </>
  );
}

/** Context: compiled text lines with one brand line woven in. */
function ContextMarks({ y }: { y: number }) {
  const bars = [
    { t: -11, halfU: 28, fill: "var(--background-600)" },
    { t: 0, halfU: 18, fill: "var(--primary)" },
    { t: 11, halfU: 24, fill: "var(--background-600)" },
  ];
  return (
    <>
      {bars.map(({ t, halfU, fill }) => {
        const c = vShift(172, y, t);
        return (
          <polygon fill={fill} key={t} points={patch(c.x, c.y, halfU, 1.5)} />
        );
      })}
    </>
  );
}

/** Agents: three live nodes, the center one on the beam. */
function AgentsMarks({ y }: { y: number }) {
  return (
    <>
      {[-30, 0, 30].map((dx) => (
        <polygon
          className={dx === 0 ? "hero-pulse" : undefined}
          fill="var(--primary)"
          key={dx}
          points={patch(200 + dx, y, 5, 5)}
        />
      ))}
    </>
  );
}

const PLATE_MARKS = [SourcesMarks, TokensMarks, ContextMarks, AgentsMarks];

export function HeroIllustrationLayers() {
  const [playId, setPlayId] = useState(0);

  return (
    <div className="group relative w-full max-w-md justify-self-center lg:max-w-none lg:justify-self-end">
      <IsoReveal key={playId}>
        <div aria-hidden className="relative aspect-square w-full select-none">
          <svg
            className="size-full"
            fill="none"
            viewBox="0 0 400 400"
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>Brand context compiled through every layer</title>

            {[...PLATES]
              .map((plate, i) => ({ plate, i }))
              .reverse()
              .map(({ plate, i }) => {
              const accent = i === 1 || i === 2;
              const stroke = accent ? "var(--primary)" : "var(--background-500)";
              const strokeOpacity = accent ? "0.7" : "1";
              const sides = slabSides(200, plate.y);
              const Marks = PLATE_MARKS[i]!;
              return (
                <g
                  className="hero-stack-plate"
                  key={plate.label}
                  style={
                    {
                      "--stack-from": stackFrom(i),
                      "--iso-delay": `${i * 0.04}s`,
                      zIndex: PLATES.length - i,
                    } as CSSProperties
                  }
                >
                  <polygon
                    fill="var(--background-300)"
                    points={sides.left}
                    stroke={stroke}
                    strokeOpacity={strokeOpacity}
                    strokeWidth="1"
                  />
                  <polygon
                    fill="var(--background-200)"
                    points={sides.right}
                    stroke={stroke}
                    strokeOpacity={strokeOpacity}
                    strokeWidth="1"
                  />
                  <polygon
                    fill="var(--sheet)"
                    points={rhombus(200, plate.y, HALF_WIDTH, HALF_DEPTH)}
                    stroke={stroke}
                    strokeOpacity={strokeOpacity}
                    strokeWidth="1"
                  />

                  <g className="hero-stack-detail" style={delay(0.95 + i * 0.08)}>
                    <Marks y={plate.y} />
                  </g>

                  <g className="hero-stack-detail" style={delay(1.05 + i * 0.08)}>
                    <text
                      fill={
                        accent ? "var(--foreground)" : "var(--muted-foreground)"
                      }
                      fontFamily="var(--font-mono), ui-monospace, monospace"
                      fontSize="9"
                      letterSpacing="0.14em"
                      x="322"
                      y={plate.y + 3}
                    >
                      {plate.label.toUpperCase()}
                    </text>
                  </g>
                </g>
              );
            })}

            <g className="hero-stack-detail" style={delay(1.15)}>
              <path
                d="M80 152 H70 V242 H80"
                stroke="var(--primary)"
                strokeOpacity="0.7"
                strokeWidth="1"
              />
              <text
                fill="var(--primary)"
                fontFamily="var(--font-mono), ui-monospace, monospace"
                fontSize="10"
                letterSpacing="0.18em"
                textAnchor="middle"
                transform="rotate(-90 56 197)"
                x="56"
                y="197"
              >
                DESIN
              </text>
            </g>
          </svg>
        </div>
      </IsoReveal>

      <button
        aria-label="Replay animation"
        className="absolute right-2 bottom-2 inline-flex size-8 items-center justify-center text-muted-foreground opacity-100 transition-[opacity,color] duration-300 ease-[var(--ease-swift)] hover:text-foreground focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100"
        onClick={() => setPlayId((id) => id + 1)}
        type="button"
      >
        <ReplayIcon />
      </button>
    </div>
  );
}

function ReplayIcon() {
  return (
    <svg
      aria-hidden
      className="size-3.5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
      viewBox="0 0 16 16"
    >
      <path d="M2.5 8a5.5 5.5 0 0 1 9.2-4.03" />
      <path d="M11.5 2.5v2.8H8.7" />
      <path d="M13.5 8a5.5 5.5 0 0 1-9.2 4.03" />
      <path d="M4.5 13.5v-2.8H7.3" />
    </svg>
  );
}
