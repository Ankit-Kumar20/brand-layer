import type { CSSProperties } from "react";

import {
  IsoBox,
  IsoFrame,
  IsoShadow,
  isoPoint,
  isoPolygon,
  type IsoOrigin,
} from "@/components/landing/step-illustration/iso";

/**
 * Step 02 - "Connect MCP or API".
 * A plug with prongs lined up against the agent socket.
 *
 * Layout sits centered on the plate: agent toward -v, plug toward +v,
 * connection along the isometric axis through the origin.
 */

const PLUG_O: IsoOrigin = { x: 200, y: 205 };

/** Prong u-starts (w=16); centered on the plug so holes line up. */
const PRONGS = [-22, 6];

const delay = (s: number) => ({ "--iso-delay": `${s}s` }) as CSSProperties;

export function StepTwoPlug() {
  return (
    <IsoFrame title="MCP plug connecting the brand kit to your agent">
      {/* Ground plate */}
      <g className="iso-rise">
        <IsoShadow d={204} opacity={0.07} origin={PLUG_O} u={-100} v={-100} w={204} z={-6} />
        <IsoBox d={196} h={8} origin={PLUG_O} u={-98} v={-98} w={196} />
      </g>

      {/* Agent block */}
      <g className="iso-drop" style={delay(0.15)}>
        <IsoShadow d={68} opacity={0.1} origin={PLUG_O} u={-42} v={-69} w={94} z={8} />
        <IsoBox d={64} h={54} origin={PLUG_O} u={-45} v={-72} w={90} z={8} />
        {PRONGS.map((u) => (
          <polygon
            className="step-socket-flash"
            fill="var(--background-600)"
            key={u}
            points={isoPolygon(PLUG_O, [
              [u, -8, 22],
              [u + 16, -8, 22],
              [u + 16, -8, 38],
              [u, -8, 38],
            ])}
          />
        ))}
      </g>

      {/* Connection beams across the gap */}
      <g className="iso-fade" style={delay(0.6)}>
        {PRONGS.map((u, i) => {
          const from = isoPoint(PLUG_O, u + 8, 0, 31);
          const to = isoPoint(PLUG_O, u + 8, -8, 30);
          return (
            <line
              className="hero-beam"
              key={u}
              stroke="var(--primary)"
              strokeDasharray="3 4"
              strokeWidth="1.25"
              style={{ animationDelay: `${i * 0.3}s` }}
              x1={from.x}
              x2={to.x}
              y1={from.y}
              y2={to.y}
            />
          );
        })}
      </g>

      {/* Sliding plug + prongs */}
      <g className="iso-drop" style={delay(0.35)}>
        <g className="step-plug-slide">
          <IsoShadow d={52} opacity={0.1} origin={PLUG_O} u={-27} v={27} w={64} z={8} />
          {PRONGS.map((u) => (
            <IsoBox
              d={24}
              h={10}
              key={u}
              left="var(--background-600)"
              origin={PLUG_O}
              right="var(--background-600)"
              shade
              stroke="none"
              top="var(--background-600)"
              u={u}
              v={0}
              w={16}
              z={26}
            />
          ))}

          <IsoBox
            d={48}
            h={40}
            origin={PLUG_O}
            stroke="var(--primary)"
            top="var(--primary)"
            u={-30}
            v={24}
            w={60}
            z={8}
          />
        </g>
      </g>
    </IsoFrame>
  );
}
