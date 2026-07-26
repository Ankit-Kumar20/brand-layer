/**
 * v3 - Radial dial: brand as live signal to generic agents.
 */

/** Trig results differ in the last bit across engines, which breaks hydration. */
const round = (value: number) => Math.round(value * 100) / 100;

export function HeroIllustrationRadial() {
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
        <title>Live brand signal for AI agents</title>

        <rect fill="var(--background-50)" height="400" width="400" />

        <g stroke="var(--background-300)" strokeWidth="1">
          <line x1="40" x2="360" y1="200" y2="200" />
          <line x1="200" x2="200" y1="40" y2="360" />
        </g>

        <circle
          cx="200"
          cy="200"
          r="148"
          stroke="var(--background-400)"
          strokeWidth="1"
        />
        <circle
          className="hero-ring"
          cx="200"
          cy="200"
          fill="none"
          r="112"
          stroke="var(--primary)"
          strokeDasharray="2 8"
          strokeOpacity="0.55"
          strokeWidth="1.25"
        />
        <circle
          cx="200"
          cy="200"
          r="76"
          stroke="var(--background-400)"
          strokeWidth="1"
        />

        {Array.from({ length: 36 }).map((_, i) => {
          const a = (i / 36) * Math.PI * 2 - Math.PI / 2;
          const major = i % 9 === 0;
          const r1 = major ? 138 : 143;
          const r2 = 148;
          return (
            <line
              key={i}
              stroke={major ? "var(--primary)" : "var(--background-500)"}
              strokeWidth={major ? 1.5 : 1}
              x1={round(200 + Math.cos(a) * r1)}
              x2={round(200 + Math.cos(a) * r2)}
              y1={round(200 + Math.sin(a) * r1)}
              y2={round(200 + Math.sin(a) * r2)}
            />
          );
        })}

        {[
          { a: -0.55 },
          { a: 0.35 },
          { a: 2.35 },
          { a: 3.55 },
        ].map((node, i) => {
          const x = round(200 + Math.cos(node.a) * 112);
          const y = round(200 + Math.sin(node.a) * 112);
          return (
            <g key={i}>
              <line
                className="hero-flow-line"
                stroke="var(--background-500)"
                strokeDasharray="3 4"
                strokeWidth="1"
                style={{ animationDelay: `${0.15 * i}s` }}
                x1="200"
                x2={x}
                y1="200"
                y2={y}
              />
              <circle
                cx={x}
                cy={y}
                fill="var(--sheet)"
                r="11"
                stroke="var(--border)"
                strokeWidth="1"
              />
              <circle
                className="hero-pulse"
                cx={x}
                cy={y}
                fill="var(--foreground)"
                r="2.5"
                style={{ animationDelay: `${0.4 + i * 0.2}s` }}
              />
            </g>
          );
        })}

        <circle
          cx="200"
          cy="200"
          fill="var(--sheet)"
          r="44"
          stroke="var(--primary)"
          strokeWidth="1.5"
        />
        <circle
          className="hero-pulse"
          cx="200"
          cy="200"
          fill="var(--primary)"
          r="6"
        />

        <text
          fill="var(--foreground)"
          fontFamily="var(--font-mono), ui-monospace, monospace"
          fontSize="11"
          letterSpacing="0.16em"
          textAnchor="middle"
          x="200"
          y="268"
        >
          BRAND
        </text>
        <text
          fill="var(--muted-foreground)"
          fontFamily="var(--font-mono), ui-monospace, monospace"
          fontSize="10"
          letterSpacing="0.18em"
          textAnchor="middle"
          x="200"
          y="372"
        >
          LIVE CONTEXT · EVERY TOOL
        </text>
      </svg>
    </div>
  );
}
