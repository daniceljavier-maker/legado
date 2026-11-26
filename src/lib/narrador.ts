import type { Pais } from "./guion";

/**
 * Modelo de la app del narrador (pieza 2). Hoy todo vive en el navegador;
 * la voz real de Julián (ElevenLabs) y la persistencia (LG-020) llegan después.
 */

export type Pantalla =
  | "bienvenida"
  | "inicio"
  | "sesion"
  | "envivo"
  | "cierre"
  | "recuerdos"
  | "ajustes";

export type Privacidad = "familia" | "solo-yo";
export type Letra = "normal" | "grande" | "enorme";

export type Tema = {
  id: string;
  titulo: string;
  /** Ids de línea del guion (ver guion.ts); el texto y el audio dependen del país. */
  preguntas: string[];
  delicado?: boolean;
};

export type Sesion = {
  temaId: string;
  inicio: string;
  segundos: number;
  reservado: number; // cuántas veces pulsó «esto no lo cuentes»
};

export type EstadoNarrador = {
  v: 1;
  nombre: string;
  consentido: boolean;
  /** Acento de Julián: Leo (México) o Rafa (España). */
  pais: Pais;
  letra: Letra;
  pausado: boolean;
  sesiones: Sesion[];
  privacidad: Record<string, Privacidad>;
};

export const TEMAS: Tema[] = [
  {
    id: "infancia",
    titulo: "Tu infancia",
    preguntas: ["infancia1", "infancia2", "infancia3", "infancia4"],
  },
  {
    id: "juventud",
    titulo: "Tus años de juventud",
    preguntas: ["juventud1", "juventud2", "juventud3", "juventud4"],
  },
  {
    id: "familia",
    titulo: "Tu familia",
    preguntas: ["familia1", "familia2", "familia3", "familia4"],
  },
  {
    id: "oficio",
    titulo: "El trabajo y los oficios",
    preguntas: ["oficio1", "oficio2", "oficio3"],
  },
  {
    id: "delicado",
    titulo: "Lo que cuesta contar",
    delicado: true,
    preguntas: ["delicado1", "delicado2"],
  },
];

export const ESTADO_VACIO: EstadoNarrador = {
  v: 1,
  nombre: "",
  consentido: false,
  pais: "mx",
  letra: "grande",
  pausado: false,
  sesiones: [],
  privacidad: { delicado: "solo-yo" },
};

const KEY = "legatum.narrador.v1";

export function leerEstado(): EstadoNarrador {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return ESTADO_VACIO;
    const e = JSON.parse(raw) as EstadoNarrador;
    return { ...ESTADO_VACIO, ...e, privacidad: { ...ESTADO_VACIO.privacidad, ...e.privacidad } };
  } catch {
    return ESTADO_VACIO;
  }
}

export function guardarEstado(e: EstadoNarrador) {
  try {
    localStorage.setItem(KEY, JSON.stringify(e));
  } catch {
    /* sin almacenamiento */
  }
}

/** Siguiente tema: el primero que no tenga sesión, sin contar los delicados. */
export function temaSugerido(e: EstadoNarrador): Tema {
  const hechos = new Set(e.sesiones.map((s) => s.temaId));
  return TEMAS.find((t) => !t.delicado && !hechos.has(t.id)) ?? TEMAS[0];
}

export function saludo(nombre: string) {
  const h = new Date().getHours();
  const parte = h < 13 ? "Buenos días" : h < 20 ? "Buenas tardes" : "Buenas noches";
  return nombre ? `${parte}, ${nombre}.` : `${parte}.`;
}

export function mmss(seg: number) {
  const m = Math.floor(seg / 60);
  const s = seg % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export const ESCALA_LETRA: Record<Letra, string> = {
  normal: "1",
  grande: "1.15",
  enorme: "1.35",
};
