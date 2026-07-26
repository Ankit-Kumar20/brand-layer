"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Adds `is-shown` once the illustration scrolls into view, kicking off the
 * staggered build animation (see `iso-rise` / `iso-drop` / `iso-fade` in
 * globals.css). Fires once, then disconnects.
 *
 * If the element is already on screen at mount (hero welcome), the build
 * starts on the next frame so the hidden state can paint first.
 */
export function IsoReveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const start = () => setShown(true);

    const rect = el.getBoundingClientRect();
    const alreadyInView =
      rect.top < window.innerHeight * 0.85 && rect.bottom > window.innerHeight * 0.1;

    if (alreadyInView) {
      const frame = requestAnimationFrame(start);
      return () => cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          start();
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={shown ? "iso-reveal is-shown" : "iso-reveal"} ref={ref}>
      {children}
    </div>
  );
}
