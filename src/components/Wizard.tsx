"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  REGISTRO_VACIO,
  RELACIONES,
  TEMAS,
  guardarRegistro,
  nombreCorto,
  type Pais,
  type Registro,
} from "@/lib/registro";
import { FlameMark } from "./Brand";

const PASOS = ["Para quién", "Quien narra", "Tú", "Qué contar", "Enviar"] as const;

export function Wizard() {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [paso, setPaso] = useState(0);
  const [dir, setDir] = useState(1);
  const [r, setR] = useState<Registro>(REGISTRO_VACIO);
  const [intento, setIntento] = useState(false);

  const esYo = r.paraQuien === "yo";

  const valido = useMemo(() => {
    switch (paso) {
      case 0:
        return r.paraQuien !== null;
      case 1:
        return r.narrador.nombre.trim().length > 1 && r.narrador.pais !== null;
      case 2:
        return (
          r.solicitante.nombre.trim().length > 1 &&
          /.+@.+\..+/.test(r.solicitante.email) &&
          (esYo || r.solicitante.relacion !== "")
        );
      case 3:
        return true;
      case 4:
        return r.consentimientos.informado && r.consentimientos.datos;
      default:
        return false;
    }
  }, [paso, r, esYo]);

  const ir = (n: number) => {
    setDir(n > paso ? 1 : -1);
    setIntento(false);
    setPaso(n);
  };

  const siguiente = () => {
    if (!valido) {
      setIntento(true);
      return;
    }
    if (paso < PASOS.length - 1) ir(paso + 1);
    else {
      const final = { ...r, creadoEn: new Date().toISOString() };
      guardarRegistro(final);
      router.push("/gracias/");
    }
  };

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: reduced ? 0 : 28 * d }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: reduced ? 0 : -28 * d }),
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progreso */}
      <ol className="flex items-center gap-2 mb-10" aria-label="Progreso">
        {PASOS.map((p, i) => (
          <li key={p} className="flex-1 flex flex-col gap-2">
            <span
              className={`h-1 rounded-full transition-colors duration-500 ${
                i <= paso ? "bg-ember" : "bg-bark/10"
              }`}
            />
            <span
              className={`text-xs tracking-wide uppercase ${
                i === paso ? "text-bark" : "text-smoke/70"
              } hidden sm:block`}
            >
              {p}
            </span>
          </li>
        ))}
      </ol>

      <div className="relative min-h-[420px]">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={paso}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            {paso === 0 && (
              <Paso
                titulo="¿Para quién es este legado?"
                sub="Puedes empezar el tuyo o encender el de alguien de tu familia."
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Opcion
                    activa={r.paraQuien === "yo"}
                    onClick={() => setR({ ...r, paraQuien: "yo" })}
                    titulo="Para mí"
                    body="Quiero contar mi vida para que mi familia pueda preguntarme."
                  />
                  <Opcion
                    activa={r.paraQuien === "familiar"}
                    onClick={() => setR({ ...r, paraQuien: "familiar" })}
                    titulo="Para alguien de mi familia"
                    body="Quiero regalárselo a mi madre, a mi abuelo, a quien tenga algo que contar."
                  />
                </div>
              </Paso>
            )}

            {paso === 1 && (
              <Paso
                titulo={esYo ? "Cuéntanos de ti." : "¿Quién va a contar su vida?"}
                sub="Solo lo justo para que Julián sepa cómo dirigirse a esta persona."
              >
                <div className="grid gap-5">
                  <Campo
                    id="nombre"
                    label={esYo ? "Tu nombre" : "Su nombre"}
                    value={r.narrador.nombre}
                    onChange={(v) =>
                      setR({ ...r, narrador: { ...r.narrador, nombre: v } })
                    }
                    error={intento && r.narrador.nombre.trim().length < 2 ? "Escribe el nombre." : ""}
                  />
                  <Campo
                    id="apodo"
                    label={esYo ? "¿Cómo te gusta que te llamen?" : "¿Cómo le gusta que le llamen?"}
                    hint="Por ejemplo: doña Rosa, Pepe, abuela Carmen."
                    value={r.narrador.apodo}
                    onChange={(v) =>
                      setR({ ...r, narrador: { ...r.narrador, apodo: v } })
                    }
                  />
                  <fieldset>
                    <legend className="text-sm font-medium text-bark mb-3">
                      {esYo ? "¿Dónde vives?" : "¿Dónde vive?"}
                      <span className="block text-sm font-normal text-smoke mt-1">
                        Elige la voz de Julián: habla con acento de España o de
                        México.
                      </span>
                    </legend>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {(
                        [
                          ["ES", "España"],
                          ["MX", "México"],
                        ] as [Pais, string][]
                      ).map(([code, label]) => (
                        <Opcion
                          key={code}
                          compacta
                          activa={r.narrador.pais === code}
                          onClick={() =>
                            setR({ ...r, narrador: { ...r.narrador, pais: code } })
                          }
                          titulo={label}
                        />
                      ))}
                    </div>
                    {intento && !r.narrador.pais && (
                      <p className="mt-2 text-sm text-ember">Elige un país.</p>
                    )}
                  </fieldset>
                </div>
              </Paso>
            )}

            {paso === 2 && (
              <Paso
                titulo={esYo ? "¿Con quién quieres compartirlo?" : "Y tú, ¿quién eres?"}
                sub={
                  esYo
                    ? "Te escribiremos a ti. Más adelante podrás invitar a tu familia a preguntar."
                    : "Te avisaremos cuando empiecen las conversaciones y cuando haya algo nuevo que preguntar."
                }
              >
                <div className="grid gap-5">
                  <Campo
                    id="snombre"
                    label={esYo ? "Tu nombre completo" : "Tu nombre"}
                    value={r.solicitante.nombre}
                    onChange={(v) =>
                      setR({ ...r, solicitante: { ...r.solicitante, nombre: v } })
                    }
                    error={intento && r.solicitante.nombre.trim().length < 2 ? "Escribe tu nombre." : ""}
                  />
                  <Campo
                    id="email"
                    type="email"
                    label="Tu correo"
                    value={r.solicitante.email}
                    onChange={(v) =>
                      setR({ ...r, solicitante: { ...r.solicitante, email: v } })
                    }
                    error={intento && !/.+@.+\..+/.test(r.solicitante.email) ? "Revisa el correo." : ""}
                  />
                  {!esYo && (
                    <div>
                      <label htmlFor="relacion" className="text-sm font-medium text-bark block mb-2">
                        ¿Qué eres de {nombreCorto(r)}?
                      </label>
                      <select
                        id="relacion"
                        value={r.solicitante.relacion}
                        onChange={(e) =>
                          setR({ ...r, solicitante: { ...r.solicitante, relacion: e.target.value } })
                        }
                        className="w-full h-14 rounded-2xl border border-bark/15 bg-paper px-4 text-base text-bark"
                      >
                        <option value="">Elige una opción</option>
                        {RELACIONES.map((x) => (
                          <option key={x} value={x}>
                            {x}
                          </option>
                        ))}
                      </select>
                      {intento && !r.solicitante.relacion && (
                        <p className="mt-2 text-sm text-ember">Elige la relación.</p>
                      )}
                    </div>
                  )}
                </div>
              </Paso>
            )}

            {paso === 3 && (
              <Paso
                titulo={
                  esYo
                    ? "¿Por dónde te gustaría empezar?"
                    : `¿Qué te gustaría que cuente ${nombreCorto(r)}?`
                }
                sub={
                  esYo
                    ? "Julián lo usará como punto de partida. Luego la conversación irá donde tú quieras."
                    : "Julián lo planteará con delicadeza y en buen momento. Quien narra siempre decide si responde."
                }
              >
                <div className="flex flex-wrap gap-2.5 mb-6">
                  {TEMAS.map((t) => {
                    const on = r.temas.includes(t);
                    return (
                      <button
                        type="button"
                        key={t}
                        aria-pressed={on}
                        onClick={() =>
                          setR({
                            ...r,
                            temas: on ? r.temas.filter((x) => x !== t) : [...r.temas, t],
                          })
                        }
                        className={`px-4 py-2.5 rounded-full border text-sm md:text-base transition-colors ${
                          on
                            ? "bg-bark text-paper border-bark"
                            : "bg-paper text-bark border-bark/15 hover:border-bark/40"
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
                <label htmlFor="preguntas" className="text-sm font-medium text-bark block mb-2">
                  ¿Hay alguna pregunta concreta?{" "}
                  <span className="font-normal text-smoke">(opcional)</span>
                </label>
                <textarea
                  id="preguntas"
                  rows={4}
                  value={r.preguntas}
                  onChange={(e) => setR({ ...r, preguntas: e.target.value })}
                  placeholder={
                    esYo
                      ? "Por ejemplo: cómo decidí venirme a la ciudad, o qué aprendí de mi madre."
                      : "Por ejemplo: ¿cómo conociste a papá? ¿Por qué te fuiste del pueblo?"
                  }
                  className="w-full rounded-2xl border border-bark/15 bg-paper px-4 py-3 text-base text-bark placeholder:text-smoke/60 resize-y"
                />
              </Paso>
            )}

            {paso === 4 && (
              <Paso
                titulo="Antes de encender el fuego."
                sub="Dos cosas que necesitamos que sepas y aceptes."
              >
                <div className="rounded-2xl bg-paper border border-bark/10 p-5 md:p-6 mb-5">
                  <Resumen r={r} />
                </div>
                <div className="grid gap-4">
                  <Check
                    id="c1"
                    checked={r.consentimientos.informado}
                    onChange={(v) =>
                      setR({ ...r, consentimientos: { ...r.consentimientos, informado: v } })
                    }
                    label={
                      esYo
                        ? "Entiendo que hablaré con una inteligencia artificial, que las conversaciones se guardan y que puedo pedir que no se comparta algo o que se borre."
                        : `Entiendo que ${nombreCorto(r)} decidirá si acepta la invitación y qué comparte, y que podrá pedir que algo no se comparta o se borre.`
                    }
                  />
                  <Check
                    id="c2"
                    checked={r.consentimientos.datos}
                    onChange={(v) =>
                      setR({ ...r, consentimientos: { ...r.consentimientos, datos: v } })
                    }
                    label="He leído cómo se tratan los datos."
                    extra={
                      <span className="block mt-1 text-sm text-smoke">
                        Texto pendiente de revisión legal (LG-005). Antes de la beta
                        se sustituirá por el aviso definitivo para España y México.
                      </span>
                    }
                  />
                </div>
                {intento && !valido && (
                  <p className="mt-4 text-sm text-ember">Marca las dos casillas para continuar.</p>
                )}
              </Paso>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navegación */}
      <div className="mt-10 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => ir(Math.max(0, paso - 1))}
          disabled={paso === 0}
          className="px-5 py-3 text-base text-bark disabled:opacity-30 hover:opacity-70 transition-opacity"
        >
          Atrás
        </button>
        <button
          type="button"
          onClick={siguiente}
          className={`inline-flex items-center gap-2 px-7 py-4 rounded-full text-base transition-colors ${
            valido ? "bg-bark text-paper hover:bg-moss" : "bg-bark/40 text-paper"
          }`}
          aria-disabled={!valido}
        >
          {paso === PASOS.length - 1 ? (
            <>
              <FlameMark className="w-5 h-5 text-gold" />
              {esYo ? "Empezar mi legado" : "Enviar la invitación"}
            </>
          ) : (
            "Continuar"
          )}
        </button>
      </div>
    </div>
  );
}

/* ---------- piezas ---------- */

function Paso({
  titulo,
  sub,
  children,
}: {
  titulo: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="font-display text-3xl md:text-[40px] leading-[1.08] tracking-tight mb-3">
        {titulo}
      </h1>
      {sub && <p className="text-base md:text-lg text-smoke leading-relaxed mb-8">{sub}</p>}
      {children}
    </div>
  );
}

function Opcion({
  activa,
  onClick,
  titulo,
  body,
  compacta = false,
}: {
  activa: boolean;
  onClick: () => void;
  titulo: string;
  body?: string;
  compacta?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activa}
      className={`text-left rounded-2xl border transition-all duration-300 ${
        compacta ? "p-4" : "p-6"
      } ${
        activa
          ? "border-ember bg-paper shadow-[0_0_0_4px_rgba(168,72,42,0.12)]"
          : "border-bark/15 bg-paper hover:border-bark/40"
      }`}
    >
      <span className="flex items-start gap-3">
        <span
          className={`mt-1 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
            activa ? "border-ember" : "border-bark/30"
          }`}
          aria-hidden="true"
        >
          {activa && <span className="w-2.5 h-2.5 rounded-full bg-ember" />}
        </span>
        <span>
          <span className="block font-display text-xl md:text-2xl leading-tight">{titulo}</span>
          {body && <span className="block mt-1.5 text-base text-smoke leading-relaxed">{body}</span>}
        </span>
      </span>
    </button>
  );
}

function Campo({
  id,
  label,
  hint,
  value,
  onChange,
  error = "",
  type = "text",
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-bark block mb-2">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={`w-full h-14 rounded-2xl border bg-paper px-4 text-base text-bark ${
          error ? "border-ember" : "border-bark/15"
        }`}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-2 text-sm text-smoke">
          {hint}
        </p>
      )}
      {error && <p className="mt-2 text-sm text-ember">{error}</p>}
    </div>
  );
}

function Check({
  id,
  checked,
  onChange,
  label,
  extra,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  extra?: React.ReactNode;
}) {
  return (
    <label htmlFor={id} className="flex gap-4 cursor-pointer">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 w-5 h-5 accent-[#a8482a] flex-shrink-0"
      />
      <span className="text-base text-bark leading-relaxed">
        {label}
        {extra}
      </span>
    </label>
  );
}

function Resumen({ r }: { r: Registro }) {
  const esYo = r.paraQuien === "yo";
  const pais = r.narrador.pais === "ES" ? "España" : "México";
  return (
    <dl className="grid gap-3 text-base">
      <Row k={esYo ? "Narras" : "Narra"} v={`${r.narrador.nombre}${r.narrador.apodo ? ` (${r.narrador.apodo})` : ""} · ${pais}`} />
      <Row k={esYo ? "Correo" : "Invita"} v={esYo ? r.solicitante.email : `${r.solicitante.nombre}, ${r.solicitante.relacion.toLowerCase()} · ${r.solicitante.email}`} />
      <Row k="Temas" v={r.temas.length ? r.temas.join(" · ") : "Lo decidirá la conversación"} />
      {r.preguntas.trim() && <Row k="Pregunta" v={r.preguntas.trim()} />}
    </dl>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[88px_1fr] gap-3">
      <dt className="text-sm uppercase tracking-wide text-smoke pt-0.5">{k}</dt>
      <dd className="text-bark">{v}</dd>
    </div>
  );
}
