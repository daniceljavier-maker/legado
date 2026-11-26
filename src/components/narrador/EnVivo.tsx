"use client";

import { useEffect, useRef, useState } from "react";
import { Conversation } from "@elevenlabs/client";
import { iniciarConversacion, type FalloArranque } from "@/lib/nube";

/**
 * LG-024 · Conversación en vivo con Julián (ElevenLabs).
 * El servidor prepara la sesión (briefing, saludo, voz) y da una credencial
 * de un solo uso; aquí solo se conecta, se escucha y se cuelga.
 * La transcripción la guarda el webhook del agente, no la app.
 */

type Estado = "preparando" | "conectando" | "habla" | "escucha" | "colgando" | "error";

const AVISOS: Record<FalloArranque | "microfono" | "corte", string> = {
  sin_sesion: "No te reconozco en este teléfono. Abre otra vez el enlace que te mandó tu familia.",
  sin_narrador: "No te reconozco en este teléfono. Abre otra vez el enlace que te mandó tu familia.",
  sin_consentimiento: "Antes de hablar necesitamos tu permiso. Vuelve al inicio y acepta la bienvenida.",
  pausado: "Tu proyecto está en pausa. Puedes reanudarlo en Ayuda y ajustes.",
  limite_dia: "Hoy ya hemos hablado mucho. Descansa y seguimos otro día.",
  falta_configuracion: "Julián todavía no está listo para hablar en vivo. Inténtalo un poco más tarde.",
  elevenlabs: "Julián no pudo conectarse ahora. Inténtalo de nuevo en un momento.",
  servidor: "Algo falló de nuestro lado. Inténtalo de nuevo en un momento.",
  red: "No hay conexión a internet. Revísala y vuelve a intentarlo.",
  microfono: "Necesito permiso para usar el micrófono. Actívalo en los ajustes del teléfono y vuelve a intentarlo.",
  corte: "Se cortó la conversación. Lo que contaste hasta ahora queda guardado.",
};

const btnOscuro =
  "w-full min-h-[4.5rem] rounded-xl bg-ember text-paper text-2xl font-semibold flex items-center justify-center px-6 transition-transform active:scale-[0.98] disabled:opacity-40";
const btnClaro =
  "w-full min-h-16 rounded-xl border-2 border-bark text-bark text-[1.35rem] font-semibold flex items-center justify-center px-6 transition-transform active:scale-[0.98] disabled:opacity-40";

export function EnVivo({
  onTerminar,
  onVolver,
}: {
  /** Colgó después de haber hablado: pasa al cierre. */
  onTerminar: (segundos: number) => void;
  /** No llegó a empezar: vuelve al inicio. */
  onVolver: () => void;
}) {
  const [estado, setEstado] = useState<Estado>("preparando");
  const [aviso, setAviso] = useState("");
  const [mudo, setMudo] = useState(false);
  const [intento, setIntento] = useState(0);
  const conv = useRef<Conversation | null>(null);
  const inicio = useRef<number | null>(null);
  const cerrada = useRef(false);
  const pidioColgar = useRef(false);
  const orbe = useRef<HTMLDivElement>(null);

  // Arranque: credencial del servidor y conexión con el agente.
  useEffect(() => {
    let vivo = true;
    cerrada.current = false;
    pidioColgar.current = false;
    inicio.current = null;
    setEstado("preparando");
    setAviso("");

    const terminar = () => {
      if (cerrada.current) return;
      cerrada.current = true;
      conv.current = null;
      if (inicio.current) {
        onTerminar(Math.round((Date.now() - inicio.current) / 1000));
      } else if (pidioColgar.current) {
        onVolver();
      } else if (vivo) {
        setAviso(AVISOS.elevenlabs);
        setEstado("error");
      }
    };

    void (async () => {
      const r = await iniciarConversacion();
      if (!vivo) return;
      if (!r.ok) {
        setAviso(AVISOS[r.motivo] ?? AVISOS.servidor);
        setEstado("error");
        return;
      }
      setEstado("conectando");
      const d = r.datos;
      const credencial = d.conversation_token
        ? { conversationToken: d.conversation_token, connectionType: "webrtc" as const }
        : { signedUrl: d.signed_url as string, connectionType: "websocket" as const };
      try {
        const c = await Conversation.startSession({
          ...credencial,
          dynamicVariables: d.variables,
          overrides: { tts: { voiceId: d.voz } },
          onConnect: () => {
            inicio.current = Date.now();
            setEstado("habla");
          },
          onModeChange: ({ mode }) => setEstado(mode === "speaking" ? "habla" : "escucha"),
          onDisconnect: () => terminar(),
          onError: (m) => console.warn("Julián:", m),
        });
        if (!vivo) {
          await c.endSession();
          return;
        }
        conv.current = c;
      } catch (err) {
        if (!vivo) return;
        const nombre = (err as { name?: string })?.name ?? "";
        setAviso(nombre === "NotAllowedError" || nombre === "NotFoundError" ? AVISOS.microfono : AVISOS.elevenlabs);
        setEstado("error");
      }
    })();

    return () => {
      vivo = false;
      cerrada.current = true;
      void conv.current?.endSession();
      conv.current = null;
    };
    // onTerminar cambia en cada render del padre; el arranque solo depende del intento.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intento]);

  // Pantalla encendida mientras habla (en iPhone, si se apaga, se corta el audio).
  useEffect(() => {
    if (estado !== "habla" && estado !== "escucha") return;
    let bloqueo: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<typeof bloqueo> } };
    nav.wakeLock?.request("screen").then((b) => (bloqueo = b)).catch(() => {});
    return () => {
      void bloqueo?.release().catch(() => {});
    };
  }, [estado]);

  // El círculo late con la voz: la de Julián cuando habla, la tuya cuando escucha.
  useEffect(() => {
    let raf = 0;
    const pintar = () => {
      const c = conv.current;
      if (c && orbe.current) {
        const v = estado === "habla" ? c.getOutputVolume() : mudo ? 0 : c.getInputVolume();
        orbe.current.style.transform = `scale(${1 + Math.min(0.35, v * 0.9)})`;
      }
      raf = requestAnimationFrame(pintar);
    };
    raf = requestAnimationFrame(pintar);
    return () => cancelAnimationFrame(raf);
  }, [estado, mudo]);

  const colgar = async () => {
    pidioColgar.current = true;
    setEstado("colgando");
    if (conv.current) await conv.current.endSession();
    else if (inicio.current) onTerminar(Math.round((Date.now() - inicio.current) / 1000));
    else onVolver();
  };

  const silenciar = () => {
    const nuevo = !mudo;
    conv.current?.setMicMuted(nuevo);
    setMudo(nuevo);
  };

  const enLlamada = estado === "habla" || estado === "escucha";
  const titulo =
    estado === "preparando" || estado === "conectando"
      ? "Llamando a Julián…"
      : estado === "habla"
        ? "Julián te habla"
        : estado === "escucha"
          ? mudo
            ? "Micrófono en silencio"
            : "Te escucho"
          : estado === "colgando"
            ? "Despidiéndonos…"
            : "No pudimos hablar";

  return (
    <div className="flex-1 flex flex-col gap-6">
      <div className="flex-1 flex flex-col items-center justify-center gap-8 text-center">
        <div className="relative w-56 h-56 flex items-center justify-center" aria-hidden="true">
          <div
            ref={orbe}
            className={`absolute inset-6 rounded-full transition-colors duration-500 ${
              estado === "habla" ? "bg-ember/85" : estado === "escucha" ? "bg-lima" : "bg-sand"
            } ${!enLlamada && estado !== "error" ? "animate-pulse" : ""}`}
            style={{ transition: "transform 90ms linear, background-color 500ms" }}
          />
          <svg viewBox="0 0 24 24" className="relative w-16 h-16 text-bark" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="3" width="6" height="12" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0" />
            <path d="M12 18v3" />
          </svg>
        </div>
        <h1 aria-live="polite" className="font-display text-[2.75rem] leading-[1.05]">
          {titulo}
        </h1>
        {estado === "error" ? (
          <p role="alert" className="text-xl text-smoke leading-snug max-w-sm">
            {aviso}
          </p>
        ) : (
          <p className="text-xl text-smoke leading-snug max-w-sm">
            {enLlamada
              ? "Habla con calma. Si algo no quieres que lo vea tu familia, dile «esto no lo compartas»."
              : "Un momento, por favor."}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {estado === "error" ? (
          <>
            <button onClick={() => setIntento((i) => i + 1)} className={btnOscuro}>
              Intentar de nuevo
            </button>
            <button onClick={onVolver} className={btnClaro}>
              Volver
            </button>
          </>
        ) : (
          <>
            <button onClick={silenciar} disabled={!enLlamada} className={btnClaro}>
              {mudo ? "Activar mi micrófono" : "Silenciar mi micrófono"}
            </button>
            <button onClick={colgar} disabled={estado === "colgando"} className={btnOscuro}>
              Terminar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
