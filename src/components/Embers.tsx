"use client";

import { useEffect, useRef } from "react";

type Ember = {
  x: number;
  y: number;
  r: number;
  vy: number;
  vx: number;
  life: number;
  max: number;
  hue: number;
};

/**
 * Fondo del hogar: un resplandor cálido abajo y brasas que suben despacio.
 * Sin vídeo: pesa nada, respeta prefers-reduced-motion y no distrae.
 */
export function Embers({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;
    const embers: Ember[] = [];

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const spawn = (): Ember => {
      const max = 900 + Math.random() * 900;
      return {
        x: w * (0.15 + Math.random() * 0.7),
        y: h + 10,
        r: 1.2 + Math.random() * 2.4,
        vy: -(0.25 + Math.random() * 0.45),
        vx: (Math.random() - 0.5) * 0.25,
        life: 0,
        max,
        hue: 20 + Math.random() * 20,
      };
    };

    const drawGlow = () => {
      const g = ctx.createRadialGradient(
        w * 0.5,
        h * 1.05,
        0,
        w * 0.5,
        h * 1.05,
        Math.max(w, h) * 0.75,
      );
      g.addColorStop(0, "rgba(233,184,104,0.55)");
      g.addColorStop(0.35, "rgba(201,100,63,0.22)");
      g.addColorStop(0.7, "rgba(246,241,232,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    };

    const frame = () => {
      ctx.clearRect(0, 0, w, h);
      drawGlow();

      if (!reduced) {
        const target = Math.round((w * h) / 26000);
        while (embers.length < target) embers.push(spawn());

        for (let i = embers.length - 1; i >= 0; i--) {
          const e = embers[i];
          e.life += 16;
          e.x += e.vx + Math.sin(e.life / 900) * 0.15;
          e.y += e.vy;
          const t = e.life / e.max;
          const a = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85;
          ctx.beginPath();
          ctx.fillStyle = `hsla(${e.hue}, 75%, 62%, ${Math.max(0, a) * 0.8})`;
          ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
          ctx.fill();
          if (t >= 1 || e.y < -10) embers.splice(i, 1);
        }
        raf = requestAnimationFrame(frame);
      }
    };

    resize();
    frame();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className={`block w-full h-full ${className}`}
      aria-hidden="true"
    />
  );
}
