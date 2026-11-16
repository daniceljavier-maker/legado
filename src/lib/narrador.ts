/**
 * Modelo de la app del narrador (pieza 2). Hoy todo vive en el navegador;
 * la voz real de Julián (ElevenLabs) y la persistencia (LG-020) llegan después.
 */

export type Pantalla =
  | "bienvenida"
  | "inicio"
  | "sesion"
  | "cierre"
  | "recuerdos"
  | "ajustes";

export type Privacidad = "familia" | "solo-yo";
export type Letra = "normal" | "grande" | "enorme";

export type Tema = {
  id: string;
  titulo: string;
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
  letra: Letra;
  pausado: boolean;
  sesiones: Sesion[];
  privacidad: Record<string, Privacidad>;
};

export const TEMAS: Tema[] = [
  {
    id: "infancia",
    titulo: "Tu infancia",
    preguntas: [
      "Cuéntame dónde naciste y cómo era la casa en la que creciste.",
      "¿Qué recuerdas de tus padres cuando eras pequeña o pequeño?",
      "¿Había algún olor, comida o sonido que te lleve de vuelta a esos años?",
      "¿Quién te cuidaba? ¿Qué te enseñó?",
    ],
  },
  {
    id: "juventud",
    titulo: "Tus años de juventud",
    preguntas: [
      "¿Cómo era un día normal cuando tenías veinte años?",
      "¿Cuál fue tu primer trabajo? ¿Cómo lo conseguiste?",
      "Háblame de tus amistades de entonces.",
      "¿Hubo alguna decisión de esa época que te cambió la vida?",
    ],
  },
  {
    id: "familia",
    titulo: "Tu familia",
    preguntas: [
      "¿Cómo conociste a tu pareja?",
      "¿Qué recuerdas del día en que nació tu primer hijo o hija?",
      "¿Qué tradición de tu familia te gustaría que no se perdiera?",
      "¿Qué te gustaría que supieran tus nietos de ti?",
    ],
  },
  {
    id: "oficio",
    titulo: "El trabajo y los oficios",
    preguntas: [
      "¿A qué te dedicaste la mayor parte de tu vida?",
      "¿Qué aprendiste trabajando que no se aprende en ningún libro?",
      "¿Hubo alguien que te enseñara el oficio?",
    ],
  },
  {
    id: "delicado",
    titulo: "Lo que cuesta contar",
    delicado: true,
    preguntas: [
      "Si quieres, cuéntame algo que te haya costado y de lo que hayas salido.",
      "¿Hay algo que quisieras dejar dicho, aunque no sea fácil?",
    ],
  },
];

export const ESTADO_VACIO: EstadoNarrador = {
  v: 1,
  nombre: "",
  consentido: false,
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
