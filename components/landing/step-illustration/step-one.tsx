import type { CSSProperties } from "react";

import {
  IsoBox,
  IsoFrame,
  IsoShadow,
  isoPoint,
  type IsoOrigin,
} from "@/components/landing/step-illustration/iso";

/**
 * Step 01 - "Save your brand once".
 * One tray with color, type, voice, and logo slotted in place.
 */

const KIT_O: IsoOrigin = { x: 200, y: 206 };

const VOICE_BARS = [16, 26, 12, 20];

const delay = (s: number) => ({ "--iso-delay": `${s}s` }) as CSSProperties;

export function StepOneKit() {
  return (
    <IsoFrame title="Colors, type, voice, and logo saved in one kit">
      {/* Tray */}
      <g className="iso-rise">
        <IsoShadow d={204} opacity={0.07} origin={KIT_O} u={-100} v={-100} w={204} z={-6} />
        <IsoBox d={196} h={10} origin={KIT_O} u={-98} v={-98} w={196} />
      </g>

      {/* Color cube */}
      <g className="iso-drop" style={delay(0.15)}>
        <IsoShadow d={56} opacity={0.12} origin={KIT_O} u={-65} v={-65} w={56} z={10} />
        <IsoBox
          d={52}
          h={30}
          left="var(--primary)"
          origin={KIT_O}
          right="var(--primary)"
          shade
          stroke="var(--primary)"
          top="var(--primary)"
          u={-68}
          v={-68}
          w={52}
          z={10}
        />
      </g>

      {/* Type tile */}
      <g className="iso-drop" style={delay(0.27)}>
        <IsoShadow d={54} opacity={0.08} origin={KIT_O} u={18} v={-66} w={54} z={10} />
        <IsoBox d={52} h={12} origin={KIT_O} u={16} v={-68} w={52} z={10} />
        <text
          fill="var(--foreground)"
          fontFamily="var(--font-sans), system-ui, sans-serif"
          fontSize="18"
          textAnchor="middle"
          x={isoPoint(KIT_O, 42, -42, 22).x}
          y={isoPoint(KIT_O, 42, -42, 22).y + 6}
        >
          Aa
        </text>
      </g>

      {/* Voice tile with rising bars */}
      <g className="iso-drop" style={delay(0.39)}>
        <IsoShadow d={54} opacity={0.08} origin={KIT_O} u={-66} v={18} w={54} z={10} />
        <IsoBox d={52} h={12} origin={KIT_O} u={-68} v={16} w={52} z={10} />
        {VOICE_BARS.map((height, i) => (
          <IsoBox
            className="hero-sweep"
            d={8}
            h={height}
            key={i}
            left={i === 1 ? "var(--primary)" : "var(--background-600)"}
            origin={KIT_O}
            right={i === 1 ? "var(--primary)" : "var(--background-600)"}
            shade
            stroke="none"
            style={{ animationDelay: `${i * 0.14}s` }}
            top={i === 1 ? "var(--primary)" : "var(--background-600)"}
            u={-60 + i * 13}
            v={36}
            w={8}
            z={22}
          />
        ))}
      </g>

      {/* Logo tile */}
      <g className="iso-drop" style={delay(0.51)}>
        <IsoShadow d={54} opacity={0.08} origin={KIT_O} u={18} v={18} w={54} z={10} />
        <IsoBox d={52} h={12} origin={KIT_O} u={16} v={16} w={52} z={10} />
        <IsoBox
          d={16}
          h={6}
          left="var(--foreground)"
          origin={KIT_O}
          right="var(--foreground)"
          shade
          stroke="none"
          top="var(--foreground)"
          u={34}
          v={34}
          w={16}
          z={22}
        />
      </g>
    </IsoFrame>
  );
}
