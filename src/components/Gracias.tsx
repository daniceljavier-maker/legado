"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Embers } from "./Embers";
import { Wordmark } from "./Brand";
import { leerAlta, leerRegistro, nombreCorto, type Alta, type Registro } from "@/lib/registro";

export function Gracias() {
  const [r, setR] = useState<Registro | null | undefined>(undefined);
  const [alta, setAlta] = useState<Alta | null>(null);
  useEffect(() => {
    setR(leerRegistro());
    setAlta(leerAlta());
  }, []);

  const esYo = r?.paraQuien === "yo";
  const quien = r ? nombreCorto(r) : "tu familiar";

  return (
    <main className="flex-1 relative min-h-screen overflow-hidden">
      <div className="absolute inset-0">
        <Embers />
      </div>
      <header className="relative max-w-7xl w-full mx-auto px-6 lg:px-8 h-16 md:h-20 flex items-center">
        <Wordmark />
      </header>
      <section className="relative max-w-3xl mx-auto px-6 lg:px-8 pt-10 md:pt-20 pb-32">
        <p className="text-xs tracking-[0.25em] uppercase text-ember mb-5 animate-fade-up stagger-1">
          Hecho
        </p>
        <h1 className="font-display text-4xl md:text-6xl leading-[1.02] tracking-tight animate-fade-up stagger-2">
          {r === null
            ? "No encontramos un registro en este navegador."
            : esYo
              ? "Tu legado ya ha empezado."
              : `El legado de ${quien} ya ha empezado.`}
        </h1>

        {r === null ? (
          <p className="mt-6 text-lg text-smoke animate-fade-up stagger-3">
            <Link href="/empezar" className="underline underline-offset-4">
              Empieza un legado
            </Link>{" "}
            para ver esta página.
          </p>
        ) : (
          <>
            <p className="mt-6 text-lg md:text-xl text-smoke leading-relaxed max-w-xl animate-fade-up stagger-3">
              {!alta
                ? "El registro se guardó solo en este navegador."
                : esYo
                  ? "Este es tu enlace para hablar con Julián. Guárdalo: es tu llave, no hace falta contraseña. Elige un momento tranquilo; bastan veinte o treinta minutos."
                  : `Este es el enlace de ${quien} para hablar con Julián. Compártelo con ${quien}, mejor en persona o por WhatsApp. Es su llave: no lo publiques en ningún sitio.`}
            </p>

            {alta && <Enlace alta={alta} quien={quien} esYo={esYo} />}

            <ol className="mt-12 grid gap-6 md:grid-cols-3 animate-fade-up stagger-4">
              <Paso
                n="1"
                t="Hoy"
                b={esYo ? "Guarda tu enlace en un lugar fácil de encontrar." : `Envía el enlace a ${quien}.`}
              />
              <Paso
                n="2"
                t="Esta semana"
                b={
                  esYo
                    ? "Primera conversación con Julián. Corta, sin prisa."
                    : `${quien} abre el enlace, decide si acepta y tiene su primera conversación con Julián.`
                }
              />
              <Paso n="3" t="Con el tiempo" b="Cada sesión añade un anillo. Pronto podrás preguntar." />
            </ol>

            {!esYo && (
              <div className="mt-12 flex flex-wrap gap-4 animate-fade-up stagger-5">
                <Link
                  href="/invitacion"
                  className="inline-flex items-center px-6 py-4 border border-bark/15 rounded-full text-bark hover:border-bark/40 transition-colors"
                >
                  Ver lo que verá {quien}
                </Link>
                <Link href="/" className="inline-flex items-center px-6 py-4 text-bark hover:opacity-70">
                  Volver al inicio
                </Link>
              </div>
            )}

            <p className="mt-10 text-sm text-smoke/80 max-w-xl animate-fade-up stagger-6">
              Alfa: todavía no enviamos correos. El enlace solo aparece aquí, en
              este navegador; cópialo antes de cerrar.
            </p>
          </>
        )}
      </section>
    </main>
  );
}

function Enlace({ alta, quien, esYo }: { alta: Alta; quien: string; esYo: boolean }) {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(alta.enlace);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      /* el texto sigue a la vista para copiarlo a mano */
    }
  };

  const mensaje = `Hola, ${quien}. Te he preparado algo: conversaciones con Julián para guardar tus recuerdos. Ábrelo cuando tengas un rato tranquilo: ${alta.enlace}`;

  return (
    <div className="mt-10 rounded-[24px] bg-paper/90 backdrop-blur-sm border border-bark/10 p-5 md:p-6 animate-fade-up stagger-4">
      <p className="text-xs tracking-[0.25em] uppercase text-smoke mb-3">
        {esYo ? "Tu enlace" : `Enlace de ${quien}`}
      </p>
      <p className="font-mono text-sm text-bark break-all select-all bg-cream rounded-xl px-4 py-3">
        {alta.enlace}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        {esYo ? (
          <a
            href={alta.enlace}
            className="inline-flex items-center px-7 py-4 bg-ember text-paper rounded-full hover:bg-bark transition-colors"
          >
            Hablar con Julián ahora
          </a>
        ) : (
          <a
            href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-7 py-4 bg-ember text-paper rounded-full hover:bg-bark transition-colors"
          >
            Enviar por WhatsApp
          </a>
        )}
        <button
          type="button"
          onClick={copiar}
          className="inline-flex items-center px-6 py-4 border border-bark/15 rounded-full text-bark hover:border-bark/40 transition-colors"
        >
          <span aria-live="polite">{copiado ? "Copiado" : "Copiar enlace"}</span>
        </button>
      </div>
    </div>
  );
}

function Paso({ n, t, b }: { n: string; t: string; b: string }) {
  return (
    <li className="rounded-2xl bg-paper/80 backdrop-blur-sm border border-bark/10 p-5 flex flex-col gap-2">
      <span className="font-display text-ember text-lg">{n}</span>
      <span className="font-display text-xl">{t}</span>
      <span className="text-base text-smoke leading-relaxed">{b}</span>
    </li>
  );
}
