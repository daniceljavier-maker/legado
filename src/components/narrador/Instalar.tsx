"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MARCA } from "@/lib/marca";
import type { Pais } from "@/lib/guion";
import { useInstalar, type Plataforma } from "@/lib/instalar";
import { leerAcceso } from "@/lib/nube";

/**
 * «Guardar en mi pantalla de inicio».
 * Se ofrece al terminar una conversación (OfrecerInstalar, decisión de Dan
 * 24 nov) y está siempre en Ayuda y ajustes. Si el navegador tiene su
 * propio aviso (Android, Chrome), lo lanza; si no (iPhone, WhatsApp…),
 * enseña los pasos con dibujos grandes. Nada de esto sale si ya está instalada.
 */

const CLAVE_OFRECIDO = "legatum.instalar.ofrecido";
const MAX_OFERTAS = 2; // tras la 1.ª conversación y, si dijo «Ahora no», tras la 2.ª
const btnOscuro =
  "w-full min-h-[4.5rem] rounded-xl bg-ember text-paper text-2xl font-semibold flex items-center justify-center px-6 transition-transform active:scale-[0.98]";
const btnClaro =
  "w-full min-h-16 rounded-xl border-2 border-bark text-bark text-[1.35rem] font-semibold flex items-center justify-center px-6 transition-transform active:scale-[0.98]";

function useAccion() {
  const ins = useInstalar();
  const [pasos, setPasos] = useState(false);
  const pulsar = async () => {
    if (ins.hayAviso) {
      await ins.instalar();
      return; // si dice que no, la próxima vez verá los pasos
    }
    setPasos(true);
  };
  return { ...ins, pasos, pulsar, cerrar: () => setPasos(false) };
}

function vecesOfrecido(): number {
  try {
    return Number(localStorage.getItem(CLAVE_OFRECIDO) ?? 0) || 0;
  } catch {
    return MAX_OFERTAS; // sin almacenamiento, no insistimos
  }
}

/**
 * Al terminar una conversación: «¿Te guardo para la próxima vez?».
 * Sale a los dos segundos del «Gracias», como mucho dos veces en total.
 */
export function OfrecerInstalar({ pais }: { pais: Pais }) {
  const a = useAccion();
  const [abierta, setAbierta] = useState(false);

  useEffect(() => {
    if (a.instalada !== false || vecesOfrecido() >= MAX_OFERTAS) return;
    const t = setTimeout(() => {
      setAbierta(true);
      try {
        localStorage.setItem(CLAVE_OFRECIDO, String(vecesOfrecido() + 1));
      } catch {
        /* sin almacenamiento */
      }
    }, 2000);
    return () => clearTimeout(t);
  }, [a.instalada]);

  // Con la hoja abierta, la página de debajo no se mueve.
  useEffect(() => {
    if (!abierta) return;
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = antes;
    };
  }, [abierta]);

  if (a.pasos) return <Pasos plataforma={a.plataforma} pais={pais} onCerrar={a.cerrar} />;
  if (!abierta || a.instalada !== false) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ofrecer-titulo"
      className="fixed inset-0 z-40 bg-bark/40 flex items-end justify-center"
    >
      <div className="w-full max-w-md bg-cream rounded-t-[28px] px-6 pt-7 pb-8 flex flex-col gap-4 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-lima flex items-center justify-center">
          <IconoAnadir className="w-8 h-8 text-bark" />
        </div>
        <h2 id="ofrecer-titulo" className="font-display text-[2.25rem] leading-[1.1]">
          ¿Te guardo para la próxima vez?
        </h2>
        <p className="text-xl text-smoke leading-snug">
          Ponme en la pantalla de inicio de tu teléfono y entrarás con un toque, sin buscar el
          enlace.
        </p>
        <div className="flex flex-col gap-3 mt-2">
          <button
            onClick={() => {
              setAbierta(false);
              void a.pulsar();
            }}
            className={btnOscuro}
          >
            Guardar en mi pantalla de inicio
          </button>
          <button onClick={() => setAbierta(false)} className={btnClaro}>
            Ahora no
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Para Ayuda y ajustes: siempre visible, dice si ya está. */
export function GuardarEnInicioAjustes({ pais }: { pais: Pais }) {
  const a = useAccion();
  if (a.instalada === null) return null;
  return (
    <div className="bg-paper rounded-2xl p-5 flex flex-col gap-3">
      <span className="text-[1.35rem] font-semibold">Pantalla de inicio</span>
      {a.instalada ? (
        <p className="text-xl text-smoke leading-snug">
          Ya me tienes en tu pantalla de inicio. Búscame con el nombre {MARCA}.
        </p>
      ) : (
        <>
          <p className="text-xl text-smoke leading-snug">
            Guárdame como una app más y entra con un toque, sin buscar el enlace.
          </p>
          <button onClick={a.pulsar} className={btnClaro}>
            Guardar en mi pantalla de inicio
          </button>
        </>
      )}
      {a.pasos && <Pasos plataforma={a.plataforma} pais={pais} onCerrar={a.cerrar} />}
    </div>
  );
}

/* ---------- pasos ---------- */

type Paso = { icono?: React.ReactNode; titulo: React.ReactNode; detalle?: React.ReactNode };

function pasosDe(p: Plataforma, pais: Pais): { pasos: Paso[]; nota?: string } {
  const es = pais === "es";
  const anadir = es ? "Añadir" : "Agregar";
  const aInicio = es ? "Añadir a pantalla de inicio" : "Agregar a pantalla de inicio";
  const final = `Ya está: me encontrarás en tu pantalla de inicio con el nombre ${MARCA}.`;

  switch (p) {
    case "ios-safari":
      return {
        pasos: [
          {
            icono: <IconoMas />,
            titulo: "Toca el botón de los tres puntos",
            detalle: (
              <>
                Está junto a la dirección de la página. Si en tu iPhone ves el botón{" "}
                <span className="whitespace-nowrap">
                  Compartir <IconoCompartir className="inline w-6 h-6 align-[-4px]" />,
                </span>{" "}
                tócalo y salta al paso 3.
              </>
            ),
          },
          { icono: <IconoCompartir />, titulo: "Toca «Compartir»" },
          {
            icono: <IconoAnadir />,
            titulo: `Baja un poco y toca «${aInicio}»`,
            detalle: "Es la opción con un cuadrito y el signo +.",
          },
          { titulo: `Toca «${anadir}», arriba a la derecha`, detalle: final },
        ],
      };
    case "ios-otro":
      return {
        pasos: [
          {
            icono: <IconoCompartir />,
            titulo: "Toca el botón Compartir",
            detalle: "En Chrome está arriba, junto a la dirección de la página.",
          },
          {
            icono: <IconoAnadir />,
            titulo: `Baja un poco y toca «${aInicio}»`,
            detalle: "Es la opción con un cuadrito y el signo +.",
          },
          { titulo: `Toca «${anadir}»`, detalle: final },
        ],
        nota: "Si no ves esa opción, abre tu enlace en Safari y hazlo desde allí.",
      };
    case "android":
      return {
        pasos: [
          {
            icono: <IconoMenu />,
            titulo: "Toca el menú de los tres puntos",
            detalle: "Está arriba a la derecha.",
          },
          {
            icono: <IconoAnadir />,
            titulo: "Toca «Instalar app»",
            detalle: es
              ? "En algunos teléfonos se llama «Añadir a pantalla de inicio»."
              : "En algunos teléfonos se llama «Agregar a la pantalla principal».",
          },
          { titulo: "Confirma con «Instalar»", detalle: final },
        ],
        nota: "Si abriste el enlace desde WhatsApp y no ves esas opciones, toca los tres puntos y elige «Abrir en Chrome». Luego repite estos pasos.",
      };
    case "dentro-de-app":
      return {
        pasos: [
          {
            icono: <IconoMenu />,
            titulo: "Abre esta página en tu navegador",
            detalle: "Toca el menú de esta app (los tres puntos) y elige «Abrir en el navegador», «Abrir en Safari» o «Abrir en Chrome».",
          },
          {
            icono: <IconoAnadir />,
            titulo: "Allí, vuelve a tocar «Guardar en mi pantalla de inicio»",
          },
        ],
      };
    default:
      return {
        pasos: [
          { icono: <IconoMenu />, titulo: "Abre el menú del navegador" },
          {
            icono: <IconoAnadir />,
            titulo: "Busca «Instalar» o «Añadir a pantalla de inicio»",
            detalle: final,
          },
        ],
      };
  }
}

function Pasos({
  plataforma,
  pais,
  onCerrar,
}: {
  plataforma: Plataforma;
  pais: Pais;
  onCerrar: () => void;
}) {
  const { pasos, nota } = pasosDe(plataforma, pais);

  // Dentro de Instagram, Facebook…: si la abre en el navegador, que se lleve
  // su enlace en la dirección, o allí no sabríamos quién es.
  useEffect(() => {
    if (plataforma !== "dentro-de-app") return;
    const t = leerAcceso();
    if (!t) return;
    history.replaceState(null, "", `${location.pathname}?acceso=${t}`);
    return () => history.replaceState(null, "", location.pathname);
  }, [plataforma]);

  // Con el panel abierto, la página de debajo no se mueve.
  useEffect(() => {
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = antes;
    };
  }, []);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pasos-titulo"
      className="fixed inset-0 z-50 bg-cream text-bark overflow-y-auto"
    >
      <div className="mx-auto max-w-md min-h-dvh flex flex-col px-6 pt-8 pb-7 gap-6">
        <h1 id="pasos-titulo" className="font-display text-[2.5rem] leading-[1.1]">
          Guárdame en tu pantalla de inicio
        </h1>
        <ol className="flex flex-col gap-4">
          {pasos.map((p, i) => (
            <li key={i} className="bg-paper rounded-2xl p-5 flex gap-4">
              <span className="font-display text-[2rem] leading-none text-ember w-7 shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[1.35rem] font-semibold leading-snug">{p.titulo}</span>
                  {p.icono && (
                    <span className="shrink-0 w-12 h-12 rounded-xl bg-sand flex items-center justify-center [&>svg]:w-7 [&>svg]:h-7">
                      {p.icono}
                    </span>
                  )}
                </div>
                {p.detalle && <p className="text-lg text-smoke leading-snug">{p.detalle}</p>}
              </div>
            </li>
          ))}
        </ol>
        {nota && <p className="text-lg text-smoke leading-snug">{nota}</p>}
        <div className="flex-1" />
        <button onClick={onCerrar} className={btnOscuro}>
          Entendido
        </button>
      </div>
    </div>,
    document.body,
  );
}

/* ---------- iconos ---------- */

type P = { className?: string };
const trazo = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function IconoCompartir({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...trazo}>
      <path d="M12 3v12" />
      <path d="M8 7l4-4 4 4" />
      <path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" />
    </svg>
  );
}

function IconoAnadir({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...trazo}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

function IconoMas({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="5" cy="12" r="2" fill="currentColor" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <circle cx="19" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}

function IconoMenu({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="5" r="2" fill="currentColor" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <circle cx="12" cy="19" r="2" fill="currentColor" />
    </svg>
  );
}
