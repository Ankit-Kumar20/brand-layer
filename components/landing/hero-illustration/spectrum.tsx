import type { CSSProperties } from "react";

/**
 * v6 - Spectrum: the brand as a specimen sheet, scanned into data.
 */
const CELL = 50;
const GAP = 14;
const X0 = 52;
const Y0 = 72;
const COLS = 5;
const ROWS = ["Color", "Type", "Space", "Voice"];
const GRID_WIDTH = COLS * CELL + (COLS - 1) * GAP;
const GRID_HEIGHT = ROWS.length * CELL + (ROWS.length - 1) * GAP;

const SWATCHES = [
  "var(--background-200)",
  "var(--background-400)",
  "var(--background-600)",
  "var(--foreground)",
  "var(--primary)",
];

const VOICE = [
  [10, 22, 14, 28],
  [18, 8, 26, 12],
  [24, 14, 30, 18],
  [12, 28, 16, 24],
  [20, 30, 12, 26],
];

const colX = (col: number) => X0 + col * (CELL + GAP);
const rowY = (row: number) => Y0 + row * (CELL + GAP);

export function HeroIllustrationSpectrum() {
  return (
    <div
      aria-hidden
      className="relative aspect-square w-full max-w-md justify-self-center select-none lg:max-w-none lg:justify-self-end"
    >
      <svg
        className="size-full"
        fill="none"
        viewBox="0 0 400 400"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>Brand specimen sheet read as structured data</title>

        <rect fill="var(--background-50)" height="400" width="400" />

        {Array.from({ length: COLS }).map((_, col) => (
          <text
            fill="var(--background-600)"
            fontFamily="var(--font-mono), ui-monospace, monospace"
            fontSize="9"
            key={col}
            letterSpacing="0.12em"
            textAnchor="middle"
            x={colX(col) + CELL / 2}
            y={Y0 - 14}
          >
            {String(col + 1).padStart(2, "0")}
          </text>
        ))}

        {ROWS.map((row, i) => (
          <text
            fill="var(--muted-foreground)"
            fontFamily="var(--font-mono), ui-monospace, monospace"
            fontSize="9"
            key={row}
            letterSpacing="0.12em"
            textAnchor="end"
            x={X0 - 12}
            y={rowY(i) + CELL / 2 + 3}
          >
            {row.toUpperCase()}
          </text>
        ))}

        {Array.from({ length: COLS }).map((_, col) => (
          <g key={col}>
            <rect
              fill={SWATCHES[col]}
              height={CELL}
              width={CELL}
              x={colX(col)}
              y={rowY(0)}
            />

            <rect
              fill="var(--sheet)"
              height={CELL}
              stroke="var(--background-400)"
              strokeWidth="1"
              width={CELL}
              x={colX(col)}
              y={rowY(1)}
            />
            <text
              fill={col === COLS - 1 ? "var(--primary)" : "var(--foreground)"}
              fontFamily="var(--font-sans), system-ui, sans-serif"
              fontSize={13 + col * 2}
              textAnchor="middle"
              x={colX(col) + CELL / 2}
              y={rowY(1) + CELL / 2 + (13 + col * 2) / 3}
            >
              Aa
            </text>

            <rect
              fill="var(--sheet)"
              height={CELL}
              stroke="var(--background-400)"
              strokeWidth="1"
              width={CELL}
              x={colX(col)}
              y={rowY(2)}
            />
            {Array.from({ length: col + 1 }).map((__, bar) => {
              const count = col + 1;
              const span = count * 3 + (count - 1) * 4;
              const start = colX(col) + (CELL - span) / 2;
              return (
                <rect
                  fill={
                    col === COLS - 1 ? "var(--primary)" : "var(--background-600)"
                  }
                  height="20"
                  key={bar}
                  width="3"
                  x={start + bar * 7}
                  y={rowY(2) + 15}
                />
              );
            })}

            <rect
              fill="var(--sheet)"
              height={CELL}
              stroke="var(--background-400)"
              strokeWidth="1"
              width={CELL}
              x={colX(col)}
              y={rowY(3)}
            />
            {VOICE[col]?.map((height, bar) => {
              const start = colX(col) + (CELL - 27) / 2;
              const baseline = rowY(3) + 40;
              return (
                <rect
                  className="hero-sweep"
                  fill={bar === 1 ? "var(--primary)" : "var(--background-600)"}
                  height={height}
                  key={bar}
                  style={{ animationDelay: `${(col * 4 + bar) * 0.08}s` }}
                  width="3"
                  x={start + bar * 8}
                  y={baseline - height}
                />
              );
            })}
          </g>
        ))}

        <g
          className="hero-scan"
          style={{ "--hero-scan-distance": `${GRID_HEIGHT}px` } as CSSProperties}
        >
          <line
            stroke="var(--primary)"
            strokeWidth="1.25"
            x1={X0 - 8}
            x2={X0 + GRID_WIDTH + 8}
            y1={Y0}
            y2={Y0}
          />
          <rect
            fill="var(--primary)"
            height="5"
            width="5"
            x={X0 - 10}
            y={Y0 - 2.5}
          />
          <rect
            fill="var(--primary)"
            height="5"
            width="5"
            x={X0 + GRID_WIDTH + 5}
            y={Y0 - 2.5}
          />
        </g>

        <text
          fill="var(--muted-foreground)"
          fontFamily="var(--font-mono), ui-monospace, monospace"
          fontSize="10"
          letterSpacing="0.18em"
          textAnchor="middle"
          x="200"
          y="368"
        >
          BRAND, READ AS DATA
        </text>
      </svg>
    </div>
  );
}
