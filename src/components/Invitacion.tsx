"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FlameMark } from "./Brand";
import { Embers } from "./Embers";
import { leerRegistro, nombreCorto, type Registro } from "@/lib/registro";

/**
 * Lo que recibe quien narra. Pantalla pensada para personas de 60 años o más:
 * texto grande, un solo botón, nada que configurar.
 */
export function Invitacion() {
  const [r, setR] = useState<Registro | null>(null);
  useEffect(() => setR(leerRegistro()), []);

  const quien = r ? nombreCorto(r) : "Rosa";
  const de = r && r.paraQuien === "familiar" ? r.solicitante.nombre : null;
  const relacion = r?.solicitante.relacion?.toLowerCase();

  return (
    <main className="flex-1 relative min-h-screen overflow-hidden bg-cream">
      <div className="absolute inset-0 opacity-80">
        <Embers />
      </div>
      <section className="relative max-w-xl mx-auto px-6 pt-16 md:pt-24 pb-24 flex flex-col items-center text-center">
        <FlameMark className="w-14 h-14 text-ember animate-breathe" />
        <p className="mt-8 text-base md:text-lg text-smoke animate-fade-up stagger-2">
          {de ? `${de}${relacion ? `, tu ${relacion}` : ""}, te ha preparado algo.` : "Alguien que te quiere te ha preparado algo."}
        </p>
        <h1 className="mt-4 font-display text-[44px] md:text-6xl leading-[1.02] tracking-tight animate-fade-up stagger-3">
          Hola, {quien}.
          <br />
          Tu familia quiere escucharte.
        </h1>
        <p className="mt-8 text-xl md:text-2xl text-bark leading-relaxed max-w-md animate-fade-up stagger-4">
          Julián te va a hacer compañía en conversaciones cortas sobre tu vida.
          Solo tienes que hablar. Puedes parar cuando quieras.
        </p>

        <Link
          href="#"
          aria-disabled="true"
          className="mt-12 inline-flex w-full max-w-sm items-center justify-center gap-3 h-[76px] bg-bark text-paper text-xl rounded-full hover:bg-moss transition-colors animate-fade-up stagger-5"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="9" y="3" width="6" height="11" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0" />
            <path d="M12 18v3" />
          </svg>
          Hablar con Julián
        </Link>
        <p className="mt-5 text-base text-smoke animate-fade-up stagger-6">
          Unos 30 minutos. Nada que instalar.
        </p>

        {r?.temas?.length ? (
          <div className="mt-14 w-full text-left rounded-[24px] bg-paper/85 backdrop-blur-sm border border-bark/10 p-6 animate-fade-up stagger-6">
            <p className="text-xs tracking-[0.25em] uppercase text-smoke mb-3">
              Lo que les gustaría escuchar
            </p>
            <ul className="flex flex-col gap-2 text-lg text-bark">
              {r.temas.slice(0, 4).map((t) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-[11px] w-1.5 h-1.5 rounded-full bg-ember flex-shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-base text-smoke">
              Tú decides de qué hablar y qué compartir.
            </p>
          </div>
        ) : null}

        <p className="mt-10 text-sm text-smoke/80 max-w-md">
          Vista previa. El botón se conectará a la app del narrador (pieza 2) cuando
          esté lista.
        </p>
      </section>
    </main>
  );
}
