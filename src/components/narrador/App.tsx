"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MARCA } from "@/lib/marca";
import { leerRegistro } from "@/lib/registro";
import {
  ESCALA_LETRA,
  ESTADO_VACIO,
  TEMAS,
  guardarEstado,
  leerEstado,
  mmss,
  saludo,
  temaSugerido,
  type EstadoNarrador,
  type Letra,
  type Pantalla,
  type Privacidad,
  type Tema,
} from "@/lib/narrador";
import { texto, type Pais } from "@/lib/guion";
import { olvidarVinculo, subirAjustes, subirPrivacidad, subirSesion } from "@/lib/nube";
import { Oido, callar, decir, ecoAlAzar, secuencia } from "./Julian";

/* ---------- piezas comunes ---------- */

function Anillos({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="12" cy="16" r="8" stroke="currentColor" strokeWidth="2.4" />
      <circle cx="20" cy="16" r="8" stroke="currentColor" strokeWidth="2.4" opacity="0.55" />
    </svg>
  );
}

function Marca() {
  return (
    <div className="flex items-center gap-2">
      <Anillos />
      <span className="font-display text-2xl">{MARCA}</span>
    </div>
  );
}

function Volver({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 min-h-12 text-[1.35rem] font-medium -ml-1"
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M15 6l-6 6 6 6" />
      </svg>
      Volver
    </button>
  );
}

const btnDark =
  "w-full min-h-[4.5rem] rounded-xl bg-bark text-cream text-2xl font-semibold flex items-center justify-center px-6 transition-transform active:scale-[0.98] disabled:opacity-40";
const btnLight =
  "w-full min-h-16 rounded-xl border-2 border-bark text-bark text-[1.35rem] font-semibold flex items-center justify-center px-6 transition-transform active:scale-[0.98]";
const card = "bg-paper rounded-2xl p-5 flex flex-col gap-3";

/* ---------- app ---------- */

export function NarradorApp() {
  const [e, setE] = useState<EstadoNarrador | null>(null);
  const [pantalla, setPantalla] = useState<Pantalla>("inicio");
  const [temaActual, setTemaActual] = useState<Tema | null>(null);
  const [ultima, setUltima] = useState<{ tema: Tema; segundos: number; reservado: number } | null>(null);

  useEffect(() => {
    const est = leerEstado();
    // Si el familiar ya registró un nombre en este navegador, lo usamos.
    const reg = leerRegistro();
    const nombre = est.nombre || reg?.narrador.apodo || reg?.narrador.nombre || "";
    const reg_pais = reg?.narrador.pais === "ES" ? "es" : reg?.narrador.pais === "MX" ? "mx" : null;
    const del_equipo: Pais = navigator.language.toLowerCase().startsWith("es-es") ? "es" : "mx";
    const pais: Pais = est.sesiones.length || est.consentido ? est.pais : (reg_pais ?? del_equipo);
    const inicial = { ...est, nombre, pais };
    setE(inicial);
    setPantalla(inicial.consentido ? "inicio" : "bienvenida");
  }, []);

  const actualizar = useCallback((cambio: Partial<EstadoNarrador>) => {
    setE((prev) => {
      if (!prev) return prev;
      const n = { ...prev, ...cambio };
      guardarEstado(n);
      return n;
    });
  }, []);

  // El tamaño de letra se aplica en <html> para que escale todo (rem).
  useEffect(() => {
    if (!e) return;
    document.documentElement.style.fontSize = `calc(16px * ${ESCALA_LETRA[e.letra]})`;
    return () => {
      document.documentElement.style.fontSize = "";
    };
  }, [e]);

  if (!e) return <div className="min-h-dvh bg-cream" aria-busy="true" />;

  return (
    <div className="min-h-dvh bg-cream text-bark">
      <div className="mx-auto max-w-md min-h-dvh flex flex-col px-6 pt-8 pb-7 gap-5">
        {pantalla === "bienvenida" && (
          <Bienvenida
            nombre={e.nombre}
            pais={e.pais}
            onPais={(pais) => actualizar({ pais })}
            onNombre={(nombre) => actualizar({ nombre })}
            onListo={() => {
              const listo = { ...e, consentido: true };
              actualizar({ consentido: true });
              void subirAjustes(listo);
              setPantalla("inicio");
            }}
          />
        )}
        {pantalla === "inicio" && (
          <Inicio
            e={e}
            onHablar={(t) => {
              setTemaActual(t);
              setPantalla("sesion");
            }}
            onRecuerdos={() => setPantalla("recuerdos")}
            onAjustes={() => setPantalla("ajustes")}
          />
        )}
        {pantalla === "sesion" && temaActual && (
          <SesionVoz
            tema={temaActual}
            pais={e.pais}
            onTerminar={(segundos, reservado) => {
              const sesion = { temaId: temaActual.id, inicio: new Date().toISOString(), segundos, reservado };
              actualizar({ sesiones: [...e.sesiones, sesion] });
              void subirSesion(e, sesion);
              setUltima({ tema: temaActual, segundos, reservado });
              setPantalla("cierre");
            }}
          />
        )}
        {pantalla === "cierre" && ultima && (
          <Cierre
            nombre={e.nombre}
            pais={e.pais}
            ultima={ultima}
            onRecuerdos={() => setPantalla("recuerdos")}
            onInicio={() => setPantalla("inicio")}
          />
        )}
        {pantalla === "recuerdos" && (
          <Recuerdos
            e={e}
            onPrivacidad={(id, p) => {
              actualizar({ privacidad: { ...e.privacidad, [id]: p } });
              void subirPrivacidad(e, id, p);
            }}
            onVolver={() => setPantalla("inicio")}
          />
        )}
        {pantalla === "ajustes" && (
          <Ajustes
            e={e}
            onPais={(pais) => {
              actualizar({ pais });
              void subirAjustes({ ...e, pais });
            }}
            onLetra={(letra) => {
              actualizar({ letra });
              void subirAjustes({ ...e, letra });
            }}
            onPausa={(pausado) => actualizar({ pausado })}
            onVolver={() => setPantalla("inicio")}
          />
        )}
      </div>
    </div>
  );
}

/* ---------- 1 · bienvenida ---------- */

function Bienvenida({
  nombre,
  pais,
  onPais,
  onNombre,
  onListo,
}: {
  nombre: string;
  pais: Pais;
  onPais: (p: Pais) => void;
  onNombre: (n: string) => void;
  onListo: () => void;
}) {
  const [paso, setPaso] = useState(1);
  const [oye, setOye] = useState<"no" | "probando" | "si">("no");
  const [mic, setMic] = useState<"no" | "pidiendo" | "si" | "denegado">("no");
  const [nivel, setNivel] = useState(0);
  const oido = useRef<Oido | null>(null);

  useEffect(() => {
    if (mic !== "si") return;
    let raf = 0;
    const tick = () => {
      setNivel((n) => n * 0.7 + (oido.current?.nivel() ?? 0) * 0.3);
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [mic]);

  useEffect(
    () => () => {
      oido.current?.cerrar();
      callar();
    },
    [],
  );

  const probarVoz = () => {
    setOye("probando");
    decir(pais, "prueba", () => setOye("si"));
  };

  const probarMic = async () => {
    setMic("pidiendo");
    oido.current = new Oido();
    const ok = await oido.current.abrir();
    setMic(ok ? "si" : "denegado");
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <Marca />
        <span className="text-smoke text-lg">Paso {paso} de 3</span>
      </div>

      {paso === 1 && (
        <div className="flex-1 flex flex-col gap-5 animate-fade-up">
          <div className="h-52 rounded-3xl bg-sand flex items-center justify-center text-bark">
            <Anillos size={96} />
          </div>
          <h1 className="font-display text-[2.5rem] leading-[1.1]">Hola. Soy Julián.</h1>
          <p className="text-2xl leading-snug">
            Alguien que te quiere me ha pedido ayudarte a guardar tus recuerdos.
          </p>
          <p className="text-[1.35rem] leading-snug text-smoke">Tú cuentas y yo escucho. Sin prisa.</p>
          <label className="flex flex-col gap-2 mt-2">
            <span className="text-lg text-smoke">¿Cómo quieres que te llame?</span>
            <input
              value={nombre}
              onChange={(ev) => onNombre(ev.target.value)}
              placeholder="Tu nombre"
              autoComplete="given-name"
              className="min-h-16 rounded-xl bg-paper px-5 text-2xl border-2 border-transparent focus:border-bark outline-none"
            />
          </label>
          <div className="flex flex-col gap-2">
            <span className="text-lg text-smoke">¿Cómo prefieres que hable yo?</span>
            <div className="flex gap-2" role="group" aria-label="Acento de Julián">
              <Opcion activa={pais === "mx"} onClick={() => onPais("mx")}>
                De México
              </Opcion>
              <Opcion activa={pais === "es"} onClick={() => onPais("es")}>
                De España
              </Opcion>
            </div>
          </div>
        </div>
      )}

      {paso === 2 && (
        <div className="flex-1 flex flex-col gap-5 animate-fade-up">
          <h1 className="font-display text-[2.5rem] leading-[1.1]">Antes de empezar</h1>
          <div className="flex flex-col gap-3">
            {[
              "Lo que me cuentes lo guardo para que no se pierda.",
              "Los audios no se entregan a tu familia.",
              "Tú decides qué temas puede consultar tu familia.",
              "Puedes parar cuando quieras, y decirme «esto no lo cuentes».",
            ].map((t) => (
              <div key={t} className="bg-paper rounded-2xl px-5 py-4 text-[1.35rem] leading-snug">
                {t}
              </div>
            ))}
          </div>
          <p className="text-lg text-smoke">
            Texto provisional, pendiente de revisión legal. El texto completo estará en «Mis datos y privacidad».
          </p>
        </div>
      )}

      {paso === 3 && (
        <div className="flex-1 flex flex-col gap-5 animate-fade-up">
          <h1 className="font-display text-[2.5rem] leading-[1.1]">Probemos el sonido</h1>
          <div className={card}>
            <span className="text-[1.35rem] font-medium">1. ¿Me oyes?</span>
            <button onClick={probarVoz} className={btnLight} disabled={oye === "probando"}>
              {oye === "no" ? "Escuchar a Julián" : oye === "probando" ? "Hablando…" : "Oírlo otra vez"}
            </button>
            {oye === "si" && <span className="text-lg text-moss">Si lo has oído, vamos bien.</span>}
          </div>
          <div className={card}>
            <span className="text-[1.35rem] font-medium">2. ¿Te oigo yo?</span>
            {mic !== "si" && (
              <button onClick={probarMic} className={btnLight} disabled={mic === "pidiendo"}>
                {mic === "pidiendo" ? "Pidiendo permiso…" : "Activar el micrófono"}
              </button>
            )}
            {mic === "si" && (
              <>
                <span className="text-xl text-smoke">Di «hola» en voz alta.</span>
                <Medidor nivel={nivel} />
              </>
            )}
            {mic === "denegado" && (
              <span className="text-lg text-ember">
                No tengo permiso para el micrófono. Puedes dármelo en los ajustes del teléfono y volver a probar.
              </span>
            )}
          </div>
        </div>
      )}

      {paso < 3 ? (
        <button onClick={() => setPaso(paso + 1)} className={btnDark}>
          {paso === 1 ? "Siguiente" : "Estoy de acuerdo"}
        </button>
      ) : (
        <button
          onClick={() => {
            oido.current?.cerrar();
            onListo();
          }}
          className={btnDark}
        >
          Empezar
        </button>
      )}
    </>
  );
}

function Medidor({ nivel }: { nivel: number }) {
  return (
    <div className="h-3.5 rounded-full bg-sand overflow-hidden" role="meter" aria-label="Nivel del micrófono" aria-valuenow={Math.round(nivel * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-ember transition-[width] duration-75" style={{ width: `${Math.max(4, nivel * 100)}%` }} />
    </div>
  );
}

/* ---------- 2 · inicio ---------- */

function Inicio({
  e,
  onHablar,
  onRecuerdos,
  onAjustes,
}: {
  e: EstadoNarrador;
  onHablar: (t: Tema) => void;
  onRecuerdos: () => void;
  onAjustes: () => void;
}) {
  const tema = useMemo(() => temaSugerido(e), [e]);
  const n = e.sesiones.length + 1;

  return (
    <>
      <Marca />
      <div className="flex flex-col gap-2 mt-4 animate-fade-up">
        <h1 className="font-display text-[2.75rem] leading-[1.05]">{saludo(e.nombre)}</h1>
        <p className="text-2xl leading-snug">Hoy: {tema.titulo.toLowerCase()}.</p>
        <p className="text-xl text-smoke">
          Sesión {n} · tú decides cuánto rato
          {e.pausado ? " · proyecto en pausa" : ""}
        </p>
      </div>

      <div className="flex-1 flex items-center">
        <button
          onClick={() => onHablar(tema)}
          disabled={e.pausado}
          className="w-full min-h-40 rounded-[28px] bg-bark text-cream flex flex-col items-center justify-center gap-3 text-3xl font-semibold tracking-tight animate-latido transition-transform active:scale-[0.98] disabled:opacity-40 disabled:animate-none"
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="9" y="3" width="6" height="12" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0" />
            <path d="M12 18v3" />
          </svg>
          Hablar con Julián
        </button>
      </div>

      <div className="flex flex-col gap-2.5">
        <Fila onClick={onRecuerdos}>Mis recuerdos</Fila>
        <Fila onClick={onAjustes}>Ayuda y ajustes</Fila>
        <p className="text-lg text-smoke text-center mt-1">Solo tú decides qué se comparte.</p>
      </div>
    </>
  );
}

function Fila({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="min-h-16 rounded-xl bg-paper px-5 flex items-center justify-between text-[1.35rem] font-medium transition-transform active:scale-[0.98]"
    >
      <span>{children}</span>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 6l6 6-6 6" />
      </svg>
    </button>
  );
}

/* ---------- 3 · sesión de voz ---------- */

function SesionVoz({
  tema,
  pais,
  onTerminar,
}: {
  tema: Tema;
  pais: Pais;
  onTerminar: (segundos: number, reservado: number) => void;
}) {
  const [fase, setFase] = useState<"preparando" | "habla" | "escucha" | "pausa">("preparando");
  const [i, setI] = useState(0);
  const [seg, setSeg] = useState(0);
  const [reservado, setReservado] = useState(0);
  const [aviso, setAviso] = useState<string | null>(null);
  const [nivel, setNivel] = useState(0);
  const [micOk, setMicOk] = useState<boolean | null>(null);
  const oido = useRef<Oido | null>(null);
  const faseRef = useRef(fase);
  faseRef.current = fase;

  const pregunta = texto(pais, tema.preguntas[Math.min(i, tema.preguntas.length - 1)]);
  const esUltima = i >= tema.preguntas.length - 1;

  // micrófono
  useEffect(() => {
    oido.current = new Oido();
    oido.current.abrir().then(setMicOk);
    return () => {
      oido.current?.cerrar();
      callar();
    };
  }, []);

  // nivel
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (faseRef.current === "escucha") {
        setNivel((n) => n * 0.7 + (oido.current?.nivel() ?? 0) * 0.3);
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);

  // cronómetro
  useEffect(() => {
    const id = setInterval(() => {
      if (faseRef.current !== "pausa" && faseRef.current !== "preparando") setSeg((s) => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const hablarYEscuchar = useCallback(
    (ids: string[]) => {
      setFase("habla");
      secuencia(pais, ids, () => setFase("escucha"));
    },
    [pais],
  );

  const empezar = () => hablarYEscuchar(["intro", tema.preguntas[0]]);

  const siguiente = () => {
    if (esUltima) {
      callar();
      onTerminar(seg, reservado);
      return;
    }
    const n = i + 1;
    setI(n);
    hablarYEscuchar([ecoAlAzar(), tema.preguntas[n]]);
  };

  const noLoCuentes = () => {
    setReservado((r) => r + 1);
    setAviso("Entendido. Esto queda solo para ti.");
    setTimeout(() => setAviso(null), 3000);
    hablarYEscuchar(["reservado"]);
  };

  const pausar = () => {
    if (fase === "pausa") {
      setFase("escucha");
    } else {
      callar();
      setFase("pausa");
      decir(pais, "pausa");
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <span className="text-xl text-smoke">
          {tema.titulo} · {mmss(seg)}
        </span>
        <span className={`text-xl font-medium ${fase === "escucha" ? "text-ember" : "text-smoke"}`}>
          {fase === "preparando" ? "Listo" : fase === "habla" ? "Julián habla" : fase === "escucha" ? "Te escucho" : "En pausa"}
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-7">
        <Orbe fase={fase} nivel={nivel} />

        {fase === "preparando" ? (
          <>
            <p className="font-display text-[2rem] leading-tight text-center">
              {micOk === false ? "No oigo tu micrófono." : "Cuando quieras, empezamos."}
            </p>
            {micOk === false && (
              <p className="text-lg text-smoke text-center">
                Puedes seguir igualmente: dale permiso en los ajustes del teléfono cuando puedas.
              </p>
            )}
          </>
        ) : (
          <div className="w-full flex flex-col gap-3">
            <span className="text-lg text-smoke">Julián pregunta</span>
            <p className="font-display text-[1.75rem] leading-snug" aria-live="polite">
              {pregunta}
            </p>
            {aviso && <p className="text-xl text-moss font-medium animate-fade-up">{aviso}</p>}
          </div>
        )}
      </div>

      {fase === "preparando" ? (
        <button onClick={empezar} className={btnDark}>
          Empezar
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          <button onClick={noLoCuentes} className="w-full min-h-16 rounded-xl border-2 border-ember text-ember text-[1.35rem] font-semibold active:scale-[0.98]">
            Esto no lo cuentes
          </button>
          <button onClick={siguiente} className={btnLight}>
            {esUltima ? "Ya está, lo dejo aquí" : "Siguiente pregunta"}
          </button>
          <div className="flex gap-3">
            <button onClick={pausar} className={btnLight}>
              {fase === "pausa" ? "Seguir" : "Pausar"}
            </button>
            <button
              onClick={() => {
                callar();
                onTerminar(seg, reservado);
              }}
              className={btnDark}
            >
              Terminar
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Orbe({ fase, nivel }: { fase: string; nivel: number }) {
  const escala = fase === "escucha" ? 1 + nivel * 0.35 : 1;
  return (
    <div className="w-56 h-56 rounded-full bg-sand flex items-center justify-center" aria-hidden="true">
      <div
        className={`w-[9.5rem] h-[9.5rem] rounded-full bg-tan flex items-center justify-center transition-transform duration-100 ${fase === "habla" ? "animate-breathe" : ""}`}
        style={{ transform: `scale(${escala})` }}
      >
        <div className={`w-20 h-20 rounded-full ${fase === "pausa" ? "bg-smoke" : "bg-bark"}`} />
      </div>
    </div>
  );
}

/* ---------- 4 · cierre ---------- */

function Cierre({
  nombre,
  pais,
  ultima,
  onRecuerdos,
  onInicio,
}: {
  nombre: string;
  pais: Pais;
  ultima: { tema: Tema; segundos: number; reservado: number };
  onRecuerdos: () => void;
  onInicio: () => void;
}) {
  useEffect(() => {
    decir(pais, "cierre");
    return () => callar();
  }, [pais]);

  return (
    <>
      <Marca />
      <div className="flex flex-col gap-2 mt-2 animate-fade-up">
        <h1 className="font-display text-[2.75rem] leading-[1.05]">Gracias{nombre ? `, ${nombre}` : ""}.</h1>
        <p className="text-2xl leading-snug">Hoy hemos hablado de:</p>
      </div>
      <div className="flex flex-wrap gap-2.5 animate-fade-up stagger-2">
        <span className="px-4 py-2.5 rounded-full bg-sand text-xl font-medium">{ultima.tema.titulo}</span>
        <span className="px-4 py-2.5 rounded-full bg-sand text-xl font-medium">{mmss(ultima.segundos)} min</span>
        {ultima.reservado > 0 && (
          <span className="px-4 py-2.5 rounded-full bg-sand text-xl font-medium">
            {ultima.reservado} {ultima.reservado === 1 ? "cosa solo para ti" : "cosas solo para ti"}
          </span>
        )}
      </div>
      <div className={`${card} animate-fade-up stagger-3`}>
        <span className="text-lg text-smoke font-medium">Lo que me has contado, en pocas líneas</span>
        <p className="text-[1.35rem] leading-snug text-smoke">
          Aquí irá un resumen escrito por Julián, que podrás corregir. Llega con la voz real y el «cerebro» de Legatum.
        </p>
      </div>
      <div className="flex-1" />
      <div className="flex flex-col gap-3">
        <button onClick={onRecuerdos} className={btnDark}>
          Repasar lo que conté
        </button>
        <button onClick={onInicio} className={btnLight}>
          Hasta la próxima
        </button>
      </div>
    </>
  );
}

/* ---------- 5 · mis recuerdos ---------- */

function Recuerdos({
  e,
  onPrivacidad,
  onVolver,
}: {
  e: EstadoNarrador;
  onPrivacidad: (id: string, p: Privacidad) => void;
  onVolver: () => void;
}) {
  const cuenta = (id: string) => e.sesiones.filter((s) => s.temaId === id).length;

  return (
    <>
      <Volver onClick={onVolver} />
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[2.5rem] leading-[1.1]">Mis recuerdos</h1>
        <p className="text-xl text-smoke leading-snug">Elige qué temas puede consultar tu familia.</p>
      </div>
      <div className="flex flex-col gap-3">
        {TEMAS.map((t) => {
          const n = cuenta(t.id);
          const p: Privacidad = e.privacidad[t.id] ?? "familia";
          return (
            <div key={t.id} className={card}>
              <div className="flex flex-col gap-0.5">
                <span className="text-2xl font-semibold">{t.titulo}</span>
                <span className="text-lg text-smoke">
                  {t.delicado ? "Privado por defecto" : n === 0 ? "Todavía no hemos hablado" : n === 1 ? "1 sesión" : `${n} sesiones`}
                </span>
              </div>
              <div className="flex gap-2" role="group" aria-label={`Quién puede consultar ${t.titulo}`}>
                <Opcion activa={p === "familia"} onClick={() => onPrivacidad(t.id, "familia")}>
                  Familia
                </Opcion>
                <Opcion activa={p === "solo-yo"} onClick={() => onPrivacidad(t.id, "solo-yo")}>
                  Solo yo
                </Opcion>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-lg text-smoke text-center leading-snug mt-2">Tus audios originales no se entregan a nadie.</p>
    </>
  );
}

function Opcion({ activa, onClick, children }: { activa: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={activa}
      className={`flex-1 min-h-12 rounded-[10px] text-xl font-medium transition-colors ${
        activa ? "bg-bark text-cream" : "border-2 border-tan text-bark"
      }`}
    >
      {children}
    </button>
  );
}

/* ---------- 6 · ayuda y ajustes ---------- */

function Ajustes({
  e,
  onPais,
  onLetra,
  onPausa,
  onVolver,
}: {
  e: EstadoNarrador;
  onPais: (p: Pais) => void;
  onLetra: (l: Letra) => void;
  onPausa: (p: boolean) => void;
  onVolver: () => void;
}) {
  const letras: { id: Letra; nombre: string; cls: string }[] = [
    { id: "normal", nombre: "Normal", cls: "text-lg" },
    { id: "grande", nombre: "Grande", cls: "text-[1.35rem]" },
    { id: "enorme", nombre: "Enorme", cls: "text-[1.6rem]" },
  ];

  return (
    <>
      <Volver onClick={onVolver} />
      <h1 className="font-display text-[2.5rem] leading-[1.1]">Ayuda y ajustes</h1>
      <div className="flex flex-col gap-3">
        <div className={card}>
          <span className="text-[1.35rem] font-semibold">Tamaño de letra</span>
          <div className="flex gap-2" role="group" aria-label="Tamaño de letra">
            {letras.map((l) => (
              <button
                key={l.id}
                onClick={() => onLetra(l.id)}
                aria-pressed={e.letra === l.id}
                className={`flex-1 min-h-12 rounded-[10px] font-medium ${l.cls} ${
                  e.letra === l.id ? "bg-bark text-cream" : "border-2 border-tan"
                }`}
              >
                {l.nombre}
              </button>
            ))}
          </div>
        </div>

        <div className={card}>
          <span className="text-[1.35rem] font-semibold">Cómo habla Julián</span>
          <div className="flex gap-2" role="group" aria-label="Acento de Julián">
            <Opcion activa={e.pais === "mx"} onClick={() => onPais("mx")}>
              De México
            </Opcion>
            <Opcion activa={e.pais === "es"} onClick={() => onPais("es")}>
              De España
            </Opcion>
          </div>
          <button onClick={() => decir(e.pais, "ajustes")} className={btnLight}>
            Escuchar
          </button>
        </div>

        <div className="min-h-16 bg-paper rounded-2xl px-5 flex items-center justify-between">
          <span className="text-[1.35rem] font-semibold">Pausar mi proyecto</span>
          <button
            role="switch"
            aria-checked={e.pausado}
            aria-label="Pausar mi proyecto"
            onClick={() => onPausa(!e.pausado)}
            className={`w-14 h-8 rounded-full p-1 flex items-center transition-colors ${e.pausado ? "bg-ember justify-end" : "bg-tan justify-start"}`}
          >
            <span className="w-6 h-6 rounded-full bg-paper block" />
          </button>
        </div>

        <a href="/privacidad/" className="min-h-16 bg-paper rounded-2xl px-5 flex items-center justify-between text-[1.35rem] font-semibold">
          <span>Mis datos y privacidad</span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </a>
      </div>

      <div className="flex-1" />
      <p className="text-base text-smoke text-center">
        Sesiones guardadas en este teléfono: {e.sesiones.length}.
      </p>
      <button
        onClick={() => {
          if (confirm("Esto borra lo guardado en este teléfono. ¿Seguimos?")) {
            guardarEstado(ESTADO_VACIO);
            olvidarVinculo();
            location.reload();
          }
        }}
        className="text-lg text-smoke underline underline-offset-4 min-h-12"
      >
        Empezar de cero
      </button>
    </>
  );
}
