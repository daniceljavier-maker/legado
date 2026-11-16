import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacidad — Agnis",
};

const PUNTOS = [
  ["Qué guardamos", "Las conversaciones se transcriben y se guardan para que Julián recuerde y para responder a la familia. Son de uso interno."],
  ["Qué no hacemos", "No clonamos la voz de quien narra ni entregamos los audios originales a la familia."],
  ["Lo delicado", "Salud, duelos, conflictos o secretos quedan privados por defecto. Quien narra decide si se comparten."],
  ["Control", "Quien narra puede pedir que algo no se comparta, que se modifique o se borre, y puede pedir una copia de lo que contó."],
  ["Quién accede", "El equipo solo accede por soporte, y cada acceso queda registrado."],
];

export default function PrivacidadPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 pt-28 md:pt-36 pb-24">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <p className="text-xs tracking-[0.25em] uppercase text-smoke mb-4">Privacidad</p>
          <h1 className="font-display text-4xl md:text-5xl leading-[1.05] tracking-tight">
            Cómo cuidamos lo que se cuenta.
          </h1>
          <div className="mt-6 rounded-2xl border border-ember/30 bg-paper p-5 text-base text-bark">
            <strong className="font-medium">Borrador.</strong> Este texto resume
            las reglas de producto acordadas por el equipo. Está pendiente de
            revisión legal para España y México (LG-005) y se sustituirá por el
            aviso definitivo antes de la beta.
          </div>
          <dl className="mt-12 grid gap-8">
            {PUNTOS.map(([k, v]) => (
              <div key={k} className="grid gap-2 md:grid-cols-[200px_1fr] md:gap-8">
                <dt className="font-display text-2xl">{k}</dt>
                <dd className="text-lg text-smoke leading-relaxed">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </main>
      <Footer />
    </>
  );
}
