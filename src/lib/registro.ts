/**
 * Modelo del registro (pieza 1). Hoy se guarda en el navegador;
 * la persistencia real queda pendiente de LG-020 (Supabase) y LG-005 (legal).
 */
export type Pais = "ES" | "MX";

export type Registro = {
  paraQuien: "yo" | "familiar" | null;
  narrador: {
    nombre: string;
    apodo: string;
    pais: Pais | null;
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
  narrador: { nombre: "", apodo: "", pais: null },
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
