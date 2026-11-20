"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Embers } from "./Embers";
import { Wordmark } from "./Brand";
import { leerRegistro, nombreCorto, type Registro } from "@/lib/registro";

export function Gracias() {
  const [r, setR] = useState<Registro | null | undefined>(undefined);
  useEffect(() => setR(leerRegistro()), []);

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
              {esYo
                ? "Te hemos escrito con el enlace para tu primera conversación con Julián. Elige un momento tranquilo; bastan veinte o treinta minutos."
                : `Hemos preparado la invitación. Cuando ${quien} la acepte, Julián le propondrá la primera conversación y te avisaremos.`}
            </p>

            <ol className="mt-12 grid gap-6 md:grid-cols-3 animate-fade-up stagger-4">
              <Paso n="1" t="Hoy" b={esYo ? "Revisa tu correo." : `Comparte la invitación con ${quien}, mejor en persona.`} />
              <Paso n="2" t="Esta semana" b="Primera conversación con Julián. Corta, sin prisa." />
              <Paso n="3" t="Con el tiempo" b="Cada sesión añade un anillo. Pronto podrás preguntar." />
            </ol>

            <div className="mt-12 flex flex-wrap gap-4 animate-fade-up stagger-5">
              <Link
                href="/invitacion"
                className="inline-flex items-center px-7 py-4 bg-ember text-paper rounded-full hover:bg-bark transition-colors"
              >
                {esYo ? "Ver mi invitación" : `Ver la invitación como la verá ${quien}`}
              </Link>
              <Link href="/" className="inline-flex items-center px-6 py-4 text-bark hover:opacity-70">
                Volver al inicio
              </Link>
            </div>

            <p className="mt-10 text-sm text-smoke/80 max-w-xl animate-fade-up stagger-6">
              Prototipo: el registro se ha guardado solo en este navegador. El
              envío de correos y el almacenamiento real se conectan cuando esté
              listo el backend del Alfa.
            </p>
          </>
        )}
      </section>
    </main>
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
