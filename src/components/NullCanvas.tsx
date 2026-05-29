import { useEffect, useRef } from "react";

/**
 * Decoupled physical animation: glyph rain rendered at ~9 FPS on a canvas
 * (transform/opacity only, hardware composited). The interactive UI layer
 * sits above at native refresh.
 */
export function NullCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let w = 0, h = 0, cols = 0;
    const FONT = 14;
    let drops: number[] = [];
    const glyphs = "01∅0xNULLΣΛΘΦΞΩ⌬⏚░▓".split("");

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / FONT);
      drops = Array.from({ length: cols }, () => Math.random() * h);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let raf = 0;
    let last = 0;
    const FRAME = 1000 / 9; // 9 fps decoupled
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      if (t - last < FRAME) return;
      last = t;

      ctx.fillStyle = "rgba(5,5,5,0.18)";
      ctx.fillRect(0, 0, w, h);
      ctx.font = `${FONT}px JetBrains Mono, ui-monospace, monospace`;
      for (let i = 0; i < cols; i++) {
        const ch = glyphs[(Math.random() * glyphs.length) | 0];
        const x = i * FONT;
        const y = drops[i];
        const head = Math.random() < 0.04;
        ctx.fillStyle = head
          ? "rgba(245,245,245,0.85)"
          : Math.random() < 0.06
            ? "rgba(180,255,80,0.55)"
            : "rgba(140,140,170,0.35)";
        ctx.fillText(ch, x, y);
        drops[i] = y > h + Math.random() * 200 ? 0 : y + FONT;
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 h-full w-full opacity-[0.35] crt-flicker"
    />
  );
}
