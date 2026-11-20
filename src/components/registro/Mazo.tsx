"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";

/**
 * Piezas del registro: una baraja que la persona va armando.
 *
 * Cada paso es una tarjeta. Las que ya contestó quedan detrás, con su
 * pestaña visible y su respuesta escrita, como carpetas en un cajón. La
 * tarjeta activa se inclina siguiendo el puntero.
 *
 * Nada de esto se mueve si el sistema pide menos movimiento, y en pantallas
 * táctiles la inclinación no existe: no hay puntero que seguir.
 */

/* ---------- luz de fondo ---------- */

/** Una luz cálida que sigue al puntero con retraso. Da profundidad sin pesar. */
export function Luz() {
  const reduced = useReducedMotion();
  const [fino, setFino] = useState(false);
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.35);
  const sx = useSpring(x, { stiffness: 40, damping: 24, mass: 1.2 });
  const sy = useSpring(y, { stiffness: 40, damping: 24, mass: 1.2 });

  useEffect(() => {
    setFino(window.matchMedia("(pointer: fine)").matches);
  }, []);

  useEffect(() => {
    if (reduced || !fino) return;
    const mover = (e: PointerEvent) => {
      x.set(e.clientX / window.innerWidth);
      y.set(e.clientY / window.innerHeight);
    };
    window.addEventListener("pointermove", mover, { passive: true });
    return () => window.removeEventListener("pointermove", mover);
  }, [reduced, fino, x, y]);

  const left = useTransform(sx, (v) => `${v * 100}%`);
  const top = useTransform(sy, (v) => `${v * 100}%`);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        style={{ left, top }}
        className="absolute h-[70vmax] w-[70vmax] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-90 blur-[80px]"
      >
        <div className="h-full w-full rounded-full bg-[radial-gradient(circle,var(--color-tan)_0%,transparent_62%)]" />
      </motion.div>
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(60%_100%_at_50%_100%,var(--color-sand)_0%,transparent_70%)] opacity-80" />
      <Grano />
    </div>
  );
}

/** Grano finísimo, para que el fondo no parezca un degradado de plantilla. */
function Grano() {
  return (
    <svg className="absolute inset-0 h-full w-full opacity-[0.035] mix-blend-multiply">
      <filter id="grano-registro">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grano-registro)" />
    </svg>
  );
}

/* ---------- tarjeta con inclinación ---------- */

export function Tarjeta({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [fino, setFino] = useState(false);

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const muelle = { stiffness: 150, damping: 20, mass: 0.6 };
  const rotX = useSpring(useTransform(py, [-0.5, 0.5], [3.5, -3.5]), muelle);
  const rotY = useSpring(useTransform(px, [-0.5, 0.5], [-4.5, 4.5]), muelle);
  const brilloX = useTransform(px, [-0.5, 0.5], ["25%", "75%"]);
  const brilloY = useTransform(py, [-0.5, 0.5], ["20%", "80%"]);

  useEffect(() => {
    setFino(window.matchMedia("(pointer: fine)").matches);
  }, []);

  const activo = !reduced && fino;

  const seguir = (e: React.PointerEvent) => {
    if (!activo) return;
    const caja = ref.current?.getBoundingClientRect();
    if (!caja) return;
    px.set((e.clientX - caja.left) / caja.width - 0.5);
    py.set((e.clientY - caja.top) / caja.height - 0.5);
  };

  const soltar = () => {
    px.set(0);
    py.set(0);
  };

  return (
    <div style={{ perspective: 1400 }} className={className}>
      <motion.div
        ref={ref}
        onPointerMove={seguir}
        onPointerLeave={soltar}
        style={activo ? { rotateX: rotX, rotateY: rotY, transformStyle: "preserve-3d" } : undefined}
        className="relative rounded-[28px] bg-paper shadow-[0_1px_2px_rgba(51,50,49,0.04),0_18px_50px_-24px_rgba(51,50,49,0.35)]"
      >
        {activo && <Reflejo x={brilloX} y={brilloY} />}
        <div className="relative p-7 md:p-10">{children}</div>
      </motion.div>
    </div>
  );
}

/** El reflejo que delata que la tarjeta es un objeto y no un rectángulo. */
function Reflejo({ x, y }: { x: MotionValue<string>; y: MotionValue<string> }) {
  const fondo = useTransform(
    [x, y],
    ([cx, cy]: string[]) =>
      `radial-gradient(60% 60% at ${cx} ${cy}, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 70%)`,
  );
  return (
    <motion.div
      aria-hidden="true"
      style={{ background: fondo }}
      className="pointer-events-none absolute inset-0 rounded-[28px]"
    />
  );
}

/* ---------- pestañas de lo ya contestado ---------- */

export type Pestana = { titulo: string; respuesta: string };

/**
 * Las tarjetas ya resueltas, apiladas como carpetas. Se puede volver a
 * cualquiera, y cada una enseña lo que la persona contestó.
 */
export function Pestanas({
  hechas,
  actual,
  onIr,
}: {
  hechas: Pestana[];
  actual: number;
  onIr: (i: number) => void;
}) {
  if (hechas.length === 0) return null;
  const ultima = hechas.length - 1;
  return (
    <ol className="mb-[-10px] flex flex-col items-center">
      {hechas.map((p, i) => (
        <motion.li
          key={p.titulo}
          layout
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
          style={{
            // Cuanto más vieja, más estrecha y más atrás: el mazo gana fondo.
            zIndex: i,
            width: `calc(100% - ${(ultima - i) * 24}px)`,
            opacity: 1 - (ultima - i) * 0.12,
          }}
          className={i === 0 ? "w-full" : "-mt-1.5 w-full"}
        >
          <button
            type="button"
            onClick={() => onIr(i)}
            className="group flex w-full items-baseline gap-3 rounded-t-[22px] bg-sand/80 px-6 pb-4 pt-2.5 text-left shadow-[0_-1px_0_rgba(51,50,49,0.06)] transition-colors hover:bg-sand"
          >
            <span className="text-xs uppercase tracking-wide text-smoke">{p.titulo}</span>
            <span className="min-w-0 flex-1 truncate text-sm text-bark">{p.respuesta}</span>
            <span className="shrink-0 text-xs text-smoke opacity-0 transition-opacity group-hover:opacity-100">
              Cambiar
            </span>
          </button>
        </motion.li>
      ))}
      <li aria-hidden="true" className="sr-only">
        Vas por el paso {actual + 1}.
      </li>
    </ol>
  );
}

/** Los bordes de las tarjetas que aún faltan, asomando por debajo. */
export function Resto({ cuantas }: { cuantas: number }) {
  if (cuantas <= 0) return null;
  return (
    <div aria-hidden="true" className="relative mx-auto -mt-2 h-6">
      {Array.from({ length: Math.min(cuantas, 3) }).map((_, i) => (
        <motion.div
          key={i}
          layout
          className="absolute inset-x-0 mx-auto rounded-b-[24px] bg-paper shadow-[0_10px_24px_-18px_rgba(51,50,49,0.5)]"
          style={{
            top: i * 7,
            width: `calc(100% - ${(i + 1) * 26}px)`,
            height: 18,
            opacity: 0.85 - i * 0.22,
            zIndex: -i,
          }}
        />
      ))}
    </div>
  );
}

/* ---------- botón píldora con el punto ---------- */

export function Pildora({
  children,
  onClick,
  tono = "oscuro",
  disabled = false,
  "aria-disabled": ariaDisabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  tono?: "oscuro" | "claro";
  disabled?: boolean;
  "aria-disabled"?: boolean;
}) {
  const oscuro = tono === "oscuro";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-disabled={ariaDisabled}
      className={`group relative inline-flex items-center gap-3 overflow-hidden rounded-full px-7 py-4 text-base transition-colors duration-300 disabled:opacity-30 ${
        oscuro
          ? "bg-bark text-paper hover:bg-moss"
          : "border border-bark/15 bg-transparent text-bark hover:border-bark/40"
      }`}
    >
      <span className="relative z-10">{children}</span>
      <span
        aria-hidden="true"
        className={`relative z-10 h-1.5 w-1.5 rounded-full transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1 ${
          oscuro ? "bg-gold" : "bg-ember"
        }`}
      />
    </button>
  );
}
