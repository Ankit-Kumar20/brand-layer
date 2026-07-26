/**
 * v7 - Signal: brand consistency as a measured instrument readout.
 */
const SERIES = [
  0.42, 0.28, 0.55, 0.34, 0.48, 0.3, 0.52, 0.38, 0.44, 0.26, 0.5, 0.36, 0.62,
  0.74, 0.82, 0.88, 0.91, 0.94, 0.93, 0.96, 0.95, 0.97, 0.96, 0.98,
];

const CHART_X = 40;
const CHART_TOP = 148;
const BASELINE = 300;
const CHART_WIDTH = 320;
const CHART_HEIGHT = BASELINE - CHART_TOP;
const STEP = CHART_WIDTH / SERIES.length;
const CONNECTED_AT = 12;
const MARKER_X = CHART_X + CONNECTED_AT * STEP;

export function HeroIllustrationSignal() {
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
        <title>Brand consistency measured across agents</title>

        <rect fill="var(--background-50)" height="400" width="400" />

        <text
          fill="var(--muted-foreground)"
          fontFamily="var(--font-mono), ui-monospace, monospace"
          fontSize="9"
          letterSpacing="0.16em"
          x="40"
          y="56"
        >
          ON-BRAND OUTPUT
        </text>
        <circle className="hero-pulse" cx="354" cy="52" fill="var(--primary)" r="3" />
        <text
          fill="var(--primary)"
          fontFamily="var(--font-mono), ui-monospace, monospace"
          fontSize="9"
          letterSpacing="0.16em"
          textAnchor="end"
          x="344"
          y="56"
        >
          LIVE
        </text>

        <text
          fill="var(--foreground)"
          fontFamily="var(--font-mono), ui-monospace, monospace"
          fontSize="38"
          letterSpacing="-0.02em"
          x="40"
          y="104"
        >
          98.4
          <tspan fill="var(--muted-foreground)" fontSize="18">
            %
          </tspan>
        </text>

        {[0, 0.5, 1].map((level) => {
          const y = BASELINE - level * CHART_HEIGHT;
          return (
            <g key={level}>
              <line
                stroke="var(--background-300)"
                strokeDasharray={level === 0 ? undefined : "2 5"}
                strokeWidth="1"
                x1={CHART_X}
                x2={CHART_X + CHART_WIDTH}
                y1={y}
                y2={y}
              />
              <text
                fill="var(--background-600)"
                fontFamily="var(--font-mono), ui-monospace, monospace"
                fontSize="8"
                letterSpacing="0.1em"
                textAnchor="end"
                x={CHART_X - 8}
                y={y + 3}
              >
                {level * 100}
              </text>
            </g>
          );
        })}

        {SERIES.map((value, i) => {
          const height = Math.max(value * CHART_HEIGHT, 2);
          const connected = i >= CONNECTED_AT;
          return (
            <rect
              className={connected ? "hero-sweep" : undefined}
              fill={connected ? "var(--primary)" : "var(--background-500)"}
              height={height}
              key={i}
              style={
                connected
                  ? { animationDelay: `${(i - CONNECTED_AT) * 0.09}s` }
                  : undefined
              }
              width="7"
              x={CHART_X + i * STEP + (STEP - 7) / 2}
              y={BASELINE - height}
            />
          );
        })}

        <line
          stroke="var(--foreground)"
          strokeDasharray="3 4"
          strokeOpacity="0.45"
          strokeWidth="1"
          x1={MARKER_X - STEP / 2}
          x2={MARKER_X - STEP / 2}
          y1={CHART_TOP - 18}
          y2={BASELINE + 10}
        />
        <text
          fill="var(--foreground)"
          fontFamily="var(--font-mono), ui-monospace, monospace"
          fontSize="9"
          letterSpacing="0.14em"
          x={MARKER_X + 2}
          y={CHART_TOP - 24}
        >
          DESIN CONNECTED
        </text>

        <text
          fill="var(--background-600)"
          fontFamily="var(--font-mono), ui-monospace, monospace"
          fontSize="8"
          letterSpacing="0.14em"
          x={CHART_X}
          y={BASELINE + 22}
        >
          −24H
        </text>
        <text
          fill="var(--background-600)"
          fontFamily="var(--font-mono), ui-monospace, monospace"
          fontSize="8"
          letterSpacing="0.14em"
          textAnchor="end"
          x={CHART_X + CHART_WIDTH}
          y={BASELINE + 22}
        >
          NOW
        </text>

        <line
          stroke="var(--background-400)"
          strokeWidth="1"
          x1="40"
          x2="360"
          y1="344"
          y2="344"
        />
        <text
          fill="var(--muted-foreground)"
          fontFamily="var(--font-mono), ui-monospace, monospace"
          fontSize="10"
          letterSpacing="0.18em"
          x="40"
          y="372"
        >
          MEASURED, NOT GUESSED
        </text>
      </svg>
    </div>
  );
}
