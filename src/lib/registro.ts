/**
 * Modelo del registro (pieza 1). Hoy se guarda en el navegador;
 * la persistencia real queda pendiente de LG-020 (Supabase) y LG-005 (legal).
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

export function nombreCorto(r: Registro) {
  return r.narrador.apodo.trim() || r.narrador.nombre.trim() || "tu familiar";
}
