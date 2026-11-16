"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const ITEMS = [
  {
    q: "¿Hace falta saber usar el móvil?",
    a: "Lo mínimo. Quien narra recibe una invitación, la abre y habla. No hay que escribir ni configurar nada. Si prefiere, un familiar puede acompañarle la primera vez.",
  },
  {
    q: "¿Quién puede ver lo que cuenta?",
    a: "Las historias normales se comparten con la familia que tú indiques. Lo delicado queda en privado hasta que quien narra decida lo contrario. Nadie de la familia escucha los audios originales.",
  },
  {
    q: "¿Y si no quiere contar algo?",
    a: "No pasa nada. Julián no insiste. Puede decir «esto no lo compartas», pedir que se quite un tema o cambiar de conversación en cualquier momento.",
  },
  {
    q: "¿Se puede preguntar mientras la persona vive?",
    a: "Es la parte que estamos definiendo con más cuidado, junto con el consentimiento. Te lo contaremos antes de que empiece la primera sesión.",
  },
  {
    q: "¿Cuánto cuesta?",
    a: "Ahora mismo estamos en una beta cerrada y gratuita con las primeras familias. El precio se anunciará más adelante.",
  },
  {
    q: "¿Por qué se llama Agnis?",
    a: "Por el fuego que una familia mantiene encendido y se pasa de mano en mano: lo que una generación sabe y la siguiente quiere conservar. El nombre es provisional.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <ul className="divide-y divide-bark/10 border-y border-bark/10">
      {ITEMS.map((it, i) => {
        const isOpen = open === i;
        return (
          <li key={it.q}>
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={`faq-${i}`}
              onClick={() => setOpen(isOpen ? null : i)}
              className="w-full flex items-center justify-between gap-6 py-6 text-left"
            >
              <span className="font-display text-xl md:text-2xl leading-snug">
                {it.q}
              </span>
              <span
                className={`relative w-8 h-8 flex-shrink-0 rounded-full border border-bark/20 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isOpen ? "rotate-45" : ""
                }`}
                aria-hidden="true"
              >
                <span className="absolute left-1/2 top-1/2 w-3.5 h-px bg-bark -translate-x-1/2 -translate-y-1/2" />
                <span className="absolute left-1/2 top-1/2 h-3.5 w-px bg-bark -translate-x-1/2 -translate-y-1/2" />
              </span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`faq-${i}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <p className="pb-7 pr-14 text-base md:text-lg text-smoke leading-relaxed">
                    {it.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </li>
        );
      })}
    </ul>
  );
}
