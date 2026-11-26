"use client";

import { useEffect, useRef, useState } from "react";
import { Wordmark } from "./Brand";

/**
 * LG-025 · Consulta del familiar (pieza 3).
 * Chat de texto: responde solo con lo que el narrador ha querido compartir
 * y dice de qué sesión sale cada dato. El historial vive solo en esta
 * página (no se guarda en el servidor).
 */

const CLAVE = "legatum.familia.acceso";

type Mensaje =
  | { de: "familia"; texto: string }
  | { de: "legado"; texto: string; sesiones: number[]; noConsta: boolean; pregunta: string; pedida?: boolean };

type Hola = { narrador: string; pais: string; familiar: string | null; sesiones: number; datos: number };

const FALLOS: Record<string, string> = {
  enlace: "Este enlace no es válido o ya no funciona. Pide a quien te invitó que te lo vuelva a mandar.",
  limite_dia: "Por hoy ya has hecho muchas preguntas. Vuelve mañana.",
  falta_configuracion: "La consulta todavía no está activa. Inténtalo un poco más tarde.",
  red: "No hay conexión a internet. Revísala y vuelve a intentarlo.",
  servidor: "Algo falló de nuestro lado. Inténtalo de nuevo en un momento.",
};

async function llamar(cuerpo: Record<string, unknown>) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/consultar-legado`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "" },
      body: JSON.stringify(cuerpo),
    });
    const datos = await res.json().catch(() => null);
    if (res.ok && datos) return { ok: true as const, datos };
    return { ok: false as const, error: String(datos?.error ?? "servidor") };
  } catch {
    return { ok: false as const, error: "red" };
  }
}

export function Familia() {
  const [acceso, setAcceso] = useState<string | null>(null);
  const [hola, setHola] = useState<Hola | null>(null);
  const [fallo, setFallo] = useState("");
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const [pensando, setPensando] = useState(false);
  const fin = useRef<HTMLDivElement>(null);

  // Entrada: la llave llega en el enlace; se guarda aquí y se quita de la dirección.
  useEffect(() => {
    let t: string | null = null;
    try {
      t = new URLSearchParams(location.search).get("acceso")?.trim() || localStorage.getItem(CLAVE);
      if (t) localStorage.setItem(CLAVE, t);
    } catch {
      /* sin almacenamiento */
    }
    if (location.search.includes("acceso=")) history.replaceState(null, "", location.pathname);
    if (!t) {
      setFallo(FALLOS.enlace);
      return;
    }
    setAcceso(t);
    void llamar({ acceso: t, accion: "hola" }).then((r) => {
      if (r.ok) setHola(r.datos as Hola);
      else setFallo(FALLOS[r.error] ?? FALLOS.servidor);
    });
  }, []);

  useEffect(() => {
    fin.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mensajes, pensando]);

  const preguntar = async (p: string) => {
    const pregunta = p.trim();
    if (!acceso || !pregunta || pensando) return;
    setTexto("");
    setMensajes((m) => [...m, { de: "familia", texto: pregunta }]);
    setPensando(true);
    const r = await llamar({ acceso, accion: "preguntar", pregunta });
    setPensando(false);
    if (!r.ok) {
      setMensajes((m) => [
        ...m,
        { de: "legado", texto: FALLOS[r.error] ?? FALLOS.servidor, sesiones: [], noConsta: false, pregunta },
      ]);
      return;
    }
    const d = r.datos as { respuesta: string; sesiones: number[]; no_consta: boolean };
    setMensajes((m) => [
      ...m,
      { de: "legado", texto: d.respuesta, sesiones: d.sesiones ?? [], noConsta: d.no_consta, pregunta },
    ]);
  };

  const pedir = async (i: number) => {
    const m = mensajes[i];
    if (!acceso || m.de !== "legado") return;
    const r = await llamar({ acceso, accion: "pedir", pregunta: m.pregunta });
    if (r.ok) setMensajes((ms) => ms.map((x, j) => (j === i && x.de === "legado" ? { ...x, pedida: true } : x)));
  };

  const nombre = hola?.narrador ?? "";
  const sugerencias = [
    `¿Dónde creció ${nombre}?`,
    `¿Qué consejos ha dado ${nombre}?`,
    `¿Qué personas fueron importantes para ${nombre}?`,
  ];

  return (
    <main className="min-h-dvh bg-cream text-bark flex flex-col">
      <header className="max-w-2xl w-full mx-auto px-6 h-16 md:h-20 flex items-center">
        <Wordmark />
      </header>

      <section className="flex-1 max-w-2xl w-full mx-auto px-6 pb-40 flex flex-col gap-6">
        {fallo && !hola ? (
          <p role="alert" className="mt-10 text-xl text-smoke leading-relaxed">
            {fallo}
          </p>
        ) : !hola ? (
          <p className="mt-10 text-xl text-smoke" aria-busy="true">
            Un momento…
          </p>
        ) : (
          <>
            <div className="mt-6 flex flex-col gap-3">
              <p className="text-xs tracking-[0.25em] uppercase text-ember">Su legado</p>
              <h1 className="font-display text-4xl md:text-5xl leading-[1.05] tracking-tight">
                Pregunta por la historia de {nombre}.
              </h1>
              <p className="text-lg text-smoke leading-relaxed max-w-xl">
                {hola.sesiones > 0
                  ? `Respondo solo con lo que ${nombre} ha querido compartir en sus conversaciones con Julián, y te digo de qué conversación sale cada cosa. Si algo no lo ha contado, te lo diré.`
                  : `${nombre} todavía no ha tenido su primera conversación con Julián. Cuando la tenga, aquí podrás preguntar por lo que cuente.`}
              </p>
            </div>

            <div className="flex flex-col gap-4" aria-live="polite">
              {mensajes.map((m, i) =>
                m.de === "familia" ? (
                  <p key={i} className="self-end max-w-[85%] bg-bark text-cream rounded-2xl rounded-br-md px-5 py-3 text-lg leading-snug">
                    {m.texto}
                  </p>
                ) : (
                  <div key={i} className="self-start max-w-[92%] bg-paper border border-bark/10 rounded-2xl rounded-bl-md px-5 py-4 flex flex-col gap-3">
                    <p className="text-lg leading-relaxed whitespace-pre-line">{m.texto}</p>
                    {m.sesiones.length > 0 && (
                      <p className="text-sm text-smoke">
                        De {m.sesiones.length === 1 ? "la conversación" : "las conversaciones"}{" "}
                        {m.sesiones.join(", ")}
                      </p>
                    )}
                    {m.noConsta && hola.sesiones > 0 && (
                      m.pedida ? (
                        <p className="text-sm text-moss font-medium">
                          Hecho: Julián se lo preguntará a {nombre} en una próxima conversación.
                        </p>
                      ) : (
                        <button
                          onClick={() => void pedir(i)}
                          className="self-start inline-flex items-center px-5 py-3 rounded-full bg-lima text-bark font-medium"
                        >
                          Pedir a Julián que se lo pregunte
                        </button>
                      )
                    )}
                  </div>
                ),
              )}
              {pensando && <p className="self-start text-lg text-smoke animate-pulse">Buscando en su historia…</p>}
              <div ref={fin} />
            </div>

            {mensajes.length === 0 && hola.sesiones > 0 && (
              <div className="flex flex-wrap gap-2">
                {sugerencias.map((s) => (
                  <button
                    key={s}
                    onClick={() => void preguntar(s)}
                    className="px-4 py-2.5 rounded-full border border-bark/15 text-base hover:border-bark/40 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {hola && hola.sesiones > 0 && (
        <form
          onSubmit={(ev) => {
            ev.preventDefault();
            void preguntar(texto);
          }}
          className="fixed bottom-0 inset-x-0 bg-cream/95 backdrop-blur border-t border-bark/10"
        >
          <div className="max-w-2xl mx-auto px-6 py-4 flex gap-3">
            <label htmlFor="pregunta" className="sr-only">
              Tu pregunta
            </label>
            <input
              id="pregunta"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              maxLength={500}
              placeholder={`Pregunta algo sobre ${nombre}…`}
              autoComplete="off"
              className="flex-1 min-h-14 rounded-full bg-paper border border-bark/15 px-5 text-lg outline-none focus:border-bark"
            />
            <button
              type="submit"
              disabled={!texto.trim() || pensando}
              className="min-h-14 px-6 rounded-full bg-ember text-paper text-lg font-medium disabled:opacity-40"
            >
              Preguntar
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
