/**
 * Modelo del registro (pieza 1). Se envía a Supabase (función registrar-alta,
 * esquema fase1) y se guarda también en el navegador para las páginas de
 * gracias e invitación. Textos legales pendientes de LG-005.
 */
export type Pais = "ES" | "MX";

/** Mismos valores que fase1.narradores.rango_edad. */
export type RangoEdad = "menos-50" | "50-59" | "60-69" | "70-79" | "80-mas";

/** Mismos valores que fase1.narradores.estilos_conversacion (hasta dos). */
export type Estilo = "humor" | "reflexiva" | "detalle" | "calma" | "conversadora";

export const RANGOS_EDAD: [RangoEdad, string][] = [
  ["menos-50", "Menos de 50"],
  ["50-59", "50 a 59"],
  ["60-69", "60 a 69"],
  ["70-79", "70 a 79"],
  ["80-mas", "80 o más"],
];

/**
 * Punto de partida del trato de Julián. Los briefings lo ajustan
 * después con lo que se observa en cada sesión.
 */
export const ESTILOS: { id: Estilo; titulo: string; detalle: string }[] = [
  { id: "humor", titulo: "Anécdotas y risas", detalle: "Se anima contando historias con humor." },
  { id: "reflexiva", titulo: "Pensar y reflexionar", detalle: "Le gusta hablar de lo que aprendió y de por qué decidió lo que decidió." },
  { id: "detalle", titulo: "Con detalle", detalle: "Disfruta recordando lugares, nombres y cómo eran las cosas." },
  { id: "calma", titulo: "Con calma", detalle: "Prefiere preguntas sencillas y sin prisa." },
  { id: "conversadora", titulo: "Le encanta hablar", detalle: "Se anima sola: basta con darle pie." },
];

export const MAX_ESTILOS = 2;

export type Registro = {
  paraQuien: "yo" | "familiar" | null;
  narrador: {
    nombre: string;
    apodo: string;
    pais: Pais | null;
    rangoEdad: RangoEdad | null;
    estilos: Estilo[];
  };
  solicitante: {
    nombre: string;
    email: string;
    relacion: string;
  };
  temas: string[];
  preguntas: string;
  consentimientos: {
    informado: boolean;
    datos: boolean;
  };
  creadoEn?: string;
};

export const REGISTRO_VACIO: Registro = {
  paraQuien: null,
  narrador: { nombre: "", apodo: "", pais: null, rangoEdad: null, estilos: [] },
  solicitante: { nombre: "", email: "", relacion: "" },
  temas: [],
  preguntas: "",
  consentimientos: { informado: false, datos: false },
};

export const TEMAS = [
  "Su infancia y de dónde viene",
  "Cómo conoció a su pareja",
  "El trabajo y los oficios",
  "Las personas que más la marcaron",
  "Sus recetas y rituales de familia",
  "Lo que aprendió de sus padres",
  "Lo que le gustaría que supieran sus nietos",
  "Sus criterios: cómo decide, en qué confía",
];

export const RELACIONES = [
  "Hija / hijo",
  "Nieta / nieto",
  "Pareja",
  "Sobrina / sobrino",
  "Hermana / hermano",
  "Otra",
];

const KEY = "legatum.registro.v1";

export function guardarRegistro(r: Registro) {
  try {
    localStorage.setItem(KEY, JSON.stringify(r));
  } catch {
    /* sin almacenamiento disponible */
  }
}

export function leerRegistro(): Registro | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Registro) : null;
  } catch {
    return null;
  }
}

/* ---------- envío a la base de datos (LG-021) ---------- */

/** Lo que devuelve el alta: el enlace único de quien narra. */
export type Alta = { narradorId: string; enlace: string; creadoEn: string };

export type MotivoFallo =
  | "codigo"
  | "demasiados"
  | "correo_repetido"
  | "datos"
  | "red"
  | "servidor";

const KEY_ALTA = "legatum.alta.v1";
const KEY_CODIGO = "legatum.codigo";

export function guardarAlta(a: Alta) {
  try {
    localStorage.setItem(KEY_ALTA, JSON.stringify(a));
  } catch {
    /* sin almacenamiento disponible */
  }
}

export function leerAlta(): Alta | null {
  try {
    const raw = localStorage.getItem(KEY_ALTA);
    return raw ? (JSON.parse(raw) as Alta) : null;
  } catch {
    return null;
  }
}

/**
 * Código de invitación al Alfa. Llega en el enlace (?codigo=…) y se
 * recuerda en este navegador por si la persona vuelve más tarde.
 */
export function leerCodigo(): string {
  try {
    const delEnlace = new URLSearchParams(location.search).get("codigo")?.trim();
    if (delEnlace) {
      localStorage.setItem(KEY_CODIGO, delEnlace);
      return delEnlace;
    }
    return localStorage.getItem(KEY_CODIGO) ?? "";
  } catch {
    return "";
  }
}

export async function enviarRegistro(
  r: Registro,
  codigo: string,
  web: string,
): Promise<{ ok: true; alta: Alta } | { ok: false; motivo: MotivoFallo }> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !clave) return { ok: false, motivo: "servidor" };

  try {
    const res = await fetch(`${base}/functions/v1/registrar-alta`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: clave },
      body: JSON.stringify({
        para_quien: r.paraQuien,
        nombre: r.narrador.nombre,
        como_llamarle: r.narrador.apodo,
        pais: r.narrador.pais,
        rango_edad: r.narrador.rangoEdad,
        estilos: r.narrador.estilos,
        solicitante_nombre: r.solicitante.nombre,
        correo: r.solicitante.email,
        relacion: r.solicitante.relacion,
        temas: r.temas,
        preguntas: r.preguntas,
        consentimientos: r.consentimientos,
        codigo,
        web,
      }),
    });
    const datos = await res.json().catch(() => null);
    if (res.ok && datos?.enlace && datos?.narrador_id) {
      return {
        ok: true,
        alta: {
          narradorId: datos.narrador_id,
          enlace: `${location.origin}${datos.enlace}`,
          creadoEn: new Date().toISOString(),
        },
      };
    }
    const motivo = datos?.error as MotivoFallo | undefined;
    return {
      ok: false,
      motivo:
        motivo && ["codigo", "demasiados", "correo_repetido", "datos"].includes(motivo)
          ? motivo
          : "servidor",
    };
  } catch {
    return { ok: false, motivo: "red" };
  }
}

export function nombreCorto(r: Registro) {
  return r.narrador.apodo.trim() || r.narrador.nombre.trim() || "tu familiar";
}
