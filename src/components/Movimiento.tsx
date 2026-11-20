"use client";

import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";

/**
 * Movimiento ligado al scroll.
 *
 * La fotografía se mueve más despacio que la página, así que la escena
 * gana profundidad sin que nada se despegue. Todo se apaga con
 * prefers-reduced-motion: quien pide menos movimiento ve una página quieta.
 */

/** Una imagen que se queda atrás mientras la página sube. */
export function Parallax({
  children,
  recorrido = 80,
  className = "",
}: {
  children: ReactNode;
  /** Cuántos píxeles se descuelga, de arriba abajo del recorrido. */
  recorrido?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useSpring(useTransform(scrollYProgress, [0, 1], [recorrido, -recorrido]), {
    stiffness: 90,
    damping: 28,
    mass: 0.6,
  });

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div style={reduced ? undefined : { y }} className="h-full w-full">
        {children}
      </motion.div>
    </div>
  );
}

/**
 * Una frase que se revela palabra a palabra al entrar en pantalla.
 * Para los titulares grandes: cada palabra pesa, y así se nota.
 */
export function PorPalabras({
  texto,
  className = "",
  delay = 0,
}: {
  texto: string;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  const palabras = texto.split(" ");

  if (reduced) return <span className={className}>{texto}</span>;

  return (
    <motion.span
      className={className}
      initial="oculto"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      transition={{ delayChildren: delay, staggerChildren: 0.045 }}
    >
      {palabras.map((p, i) => (
        // El recorte va aquí. El detonante vive en el padre: si estuviera
        // en la palabra, que arranca fuera de esta caja, nunca entraría
        // en pantalla y la animación no dispararía jamás.
        <span key={`${p}-${i}`} className="inline-block overflow-hidden align-bottom">
          <motion.span
            className="inline-block"
            variants={{ oculto: { y: "105%" }, visible: { y: 0 } }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          >
            {p}
            {i < palabras.length - 1 ? "\u00A0" : ""}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}

/** El hilo que acompaña al scroll por el lateral: dice cuánto queda. */
export function Hilo() {
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const escala = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });
  if (reduced) return null;
  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX: escala }}
      className="fixed inset-x-0 top-0 z-50 h-[2px] origin-left bg-ember"
    />
  );
}
