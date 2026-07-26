/**
 * v8 - Blueprint: the wordmark under measurement, spec-sheet style.
 */
const CAP = 150;
const BASE = 204;
const LEFT = 112;
const RIGHT = 288;

const SWATCHES = [
  { fill: "var(--primary)", label: "FF5800" },
  { fill: "var(--foreground)", label: "171717" },
  { fill: "var(--background-400)", label: "E2E2E2" },
];

export function HeroIllustrationBlueprint() {
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
        <title>The desin wordmark, measured and specified</title>

        <rect fill="var(--background-50)" height="400" width="400" />

        {Array.from({ length: 9 }).map((_, row) =>
          Array.from({ length: 9 }).map((__, col) => (
            <circle
              cx={40 + col * 40}
              cy={40 + row * 40}
              fill="var(--background-400)"
              key={`${row}-${col}`}
              r="0.75"
            />
          )),
        )}

        {[
          { x: 24, y: 24, dx: 1, dy: 1 },
          { x: 376, y: 24, dx: -1, dy: 1 },
          { x: 24, y: 376, dx: 1, dy: -1 },
          { x: 376, y: 376, dx: -1, dy: -1 },
        ].map((corner) => (
          <path
            d={`M${corner.x + corner.dx * 18} ${corner.y} H${corner.x} V${corner.y + corner.dy * 18}`}
            key={`${corner.x}-${corner.y}`}
            stroke="var(--background-500)"
            strokeWidth="1"
          />
        ))}

        <text
          fill="var(--muted-foreground)"
          fontFamily="var(--font-mono), ui-monospace, monospace"
          fontSize="9"
          letterSpacing="0.16em"
          x="40"
          y="58"
        >
          IDENTITY / WORDMARK
        </text>
        <text
          fill="var(--background-600)"
          fontFamily="var(--font-mono), ui-monospace, monospace"
          fontSize="9"
          letterSpacing="0.16em"
          textAnchor="end"
          x="360"
          y="58"
        >
          SPEC 1.0
        </text>

        <line
          className="hero-ring"
          stroke="var(--primary)"
          strokeDasharray="4 6"
          strokeOpacity="0.7"
          strokeWidth="1"
          x1="88"
          x2="312"
          y1={CAP}
          y2={CAP}
        />
        <line
          className="hero-ring"
          stroke="var(--primary)"
          strokeDasharray="4 6"
          strokeOpacity="0.7"
          strokeWidth="1"
          x1="88"
          x2="312"
          y1={BASE}
          y2={BASE}
        />

        <text
          fill="var(--foreground)"
          fontFamily="var(--font-sans), system-ui, sans-serif"
          fontSize="72"
          fontWeight="500"
          letterSpacing="-0.02em"
          textAnchor="middle"
          x="200"
          y={BASE}
        >
          desin
        </text>

        {[
          { x: LEFT, y: CAP },
          { x: RIGHT, y: CAP },
          { x: LEFT, y: BASE },
          { x: RIGHT, y: BASE },
        ].map((mark) => (
          <path
            d={`M${mark.x - 4} ${mark.y} H${mark.x + 4} M${mark.x} ${mark.y - 4} V${mark.y + 4}`}
            key={`${mark.x}-${mark.y}`}
            stroke="var(--primary)"
            strokeWidth="1"
          />
        ))}

        <g stroke="var(--background-600)" strokeWidth="1">
          <line x1="92" x2="92" y1={CAP} y2={BASE} />
          <line x1="88" x2="96" y1={CAP} y2={CAP} />
          <line x1="88" x2="96" y1={BASE} y2={BASE} />
        </g>
        <text
          fill="var(--muted-foreground)"
          fontFamily="var(--font-mono), ui-monospace, monospace"
          fontSize="9"
          letterSpacing="0.1em"
          textAnchor="end"
          x="82"
          y={(CAP + BASE) / 2 + 3}
        >
          54
        </text>

        <g stroke="var(--background-600)" strokeWidth="1">
          <line x1={LEFT} x2={RIGHT} y1="244" y2="244" />
          <line x1={LEFT} x2={LEFT} y1="240" y2="248" />
          <line x1={RIGHT} x2={RIGHT} y1="240" y2="248" />
        </g>
        <text
          fill="var(--muted-foreground)"
          fontFamily="var(--font-mono), ui-monospace, monospace"
          fontSize="9"
          letterSpacing="0.1em"
          textAnchor="middle"
          x={(LEFT + RIGHT) / 2}
          y="238"
        >
          176
        </text>

        <line
          stroke="var(--background-400)"
          strokeWidth="1"
          x1="40"
          x2="360"
          y1="284"
          y2="284"
        />

        {SWATCHES.map((swatch, i) => (
          <g key={swatch.label}>
            <rect
              fill={swatch.fill}
              height="20"
              width="20"
              x={40 + i * 84}
              y="304"
            />
            <text
              fill="var(--muted-foreground)"
              fontFamily="var(--font-mono), ui-monospace, monospace"
              fontSize="9"
              letterSpacing="0.08em"
              x={68 + i * 84}
              y="318"
            >
              {swatch.label}
            </text>
          </g>
        ))}

        <text
          fill="var(--muted-foreground)"
          fontFamily="var(--font-mono), ui-monospace, monospace"
          fontSize="10"
          letterSpacing="0.18em"
          x="40"
          y="356"
        >
          EVERY DETAIL, SPECIFIED
        </text>
      </svg>
    </div>
  );
}
