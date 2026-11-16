/** Texto de lo que dice Julián. Los audios están en /public/narrador/voz/{mx,es}/<id>.mp3.
 *  Generado a partir del guion de voz; si cambias un texto, hay que regenerar su audio. */
export type Pais = "mx" | "es";

export const LINEAS: Record<string, { mx: string; es: string }> = {
  prueba: { mx: "¡Hola! Soy Julián. Si me oyes bien, ya estamos listos.", es: "¡Hola! Soy Julián. Si me oyes bien, ya estamos listos." },
  intro: { mx: "¡Qué bueno que estás aquí! Hoy no hay prisa ninguna. Tú me cuentas, y yo te escucho.", es: "¡Qué bien que estés aquí! Hoy no hay ninguna prisa. Tú me cuentas, y yo te escucho." },
  infancia1: { mx: "Cuéntame dónde naciste, y cómo era la casa en la que creciste.", es: "Cuéntame dónde naciste, y cómo era la casa en la que creciste." },
  infancia2: { mx: "¿Qué recuerdas de tus papás cuando eras chiquito o chiquita?", es: "¿Qué recuerdas de tus padres cuando eras pequeño o pequeña?" },
  infancia3: { mx: "¿Hay algún olor, alguna comida o algún sonido que te lleve de vuelta a esos años?", es: "¿Hay algún olor, alguna comida o algún sonido que te lleve de vuelta a esos años?" },
  infancia4: { mx: "¿Quién te cuidaba? ¿Qué fue lo que te enseñó?", es: "¿Quién te cuidaba? ¿Qué fue lo que te enseñó?" },
  juventud1: { mx: "¿Cómo era un día normal cuando tenías veinte años?", es: "¿Cómo era un día normal cuando tenías veinte años?" },
  juventud2: { mx: "¿Cuál fue tu primer trabajo? ¿Cómo lo conseguiste?", es: "¿Cuál fue tu primer trabajo? ¿Cómo lo conseguiste?" },
  juventud3: { mx: "Platícame de tus amistades de entonces.", es: "Háblame de tus amistades de entonces." },
  juventud4: { mx: "¿Hubo alguna decisión, de esa época, que te cambió la vida?", es: "¿Hubo alguna decisión, de esa época, que te cambió la vida?" },
  familia1: { mx: "¿Cómo conociste a tu pareja? Quiero oír esa historia.", es: "¿Cómo conociste a tu pareja? Quiero oír esa historia." },
  familia2: { mx: "¿Qué recuerdas del día en que nació tu primer hijo o hija?", es: "¿Qué recuerdas del día en que nació tu primer hijo o hija?" },
  familia3: { mx: "¿Qué tradición de tu familia te gustaría que no se perdiera?", es: "¿Qué tradición de tu familia te gustaría que no se perdiera?" },
  familia4: { mx: "¿Qué te gustaría que supieran tus nietos de ti?", es: "¿Qué te gustaría que supieran tus nietos de ti?" },
  oficio1: { mx: "¿A qué te dedicaste la mayor parte de tu vida?", es: "¿A qué te dedicaste la mayor parte de tu vida?" },
  oficio2: { mx: "¿Qué aprendiste trabajando que no se aprende en ningún libro?", es: "¿Qué aprendiste trabajando que no se aprende en ningún libro?" },
  oficio3: { mx: "¿Hubo alguien que te enseñara el oficio?", es: "¿Hubo alguien que te enseñara el oficio?" },
  delicado1: { mx: "Si tú quieres, cuéntame algo que te haya costado, y de lo que saliste adelante.", es: "Si tú quieres, cuéntame algo que te haya costado, y de lo que saliste adelante." },
  delicado2: { mx: "¿Hay algo que quisieras dejar dicho, aunque no sea fácil? Sin presión, eh.", es: "¿Hay algo que quisieras dejar dicho, aunque no sea fácil? Sin presión, ¿eh?" },
  eco1: { mx: "Mmm... qué bonito.", es: "Mmm... qué bonito." },
  eco2: { mx: "Ay, qué cosa. Gracias por contármelo.", es: "Anda, qué cosa. Gracias por contármelo." },
  eco3: { mx: "Ya veo... sigue, sigue, te escucho.", es: "Ya veo... sigue, sigue, te escucho." },
  eco4: { mx: "Qué historia tan linda.", es: "Qué historia tan bonita." },
  reservado: { mx: "Claro, sin problema. Eso queda solo para ti.", es: "Claro, sin problema. Eso queda solo para ti." },
  pausa: { mx: "Aquí te espero. Cuando quieras, seguimos.", es: "Aquí te espero. Cuando quieras, seguimos." },
  cierre: { mx: "Muchas gracias. Lo que me contaste hoy ya está a salvo. ¡Hasta la próxima!", es: "Muchas gracias. Lo que me has contado hoy ya está a salvo. ¡Hasta la próxima!" },
  ajustes: { mx: "¡Hola! Soy Julián. Así sueno.", es: "¡Hola! Soy Julián. Así sueno." },
};

export function texto(pais: Pais, id: string): string {
  return LINEAS[id]?.[pais] ?? "";
}

export const ECOS = ["eco1", "eco2", "eco3", "eco4"];
