import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * Cerebro de Legado (06) · después de cada conversación.
 *
 *  1. PROCESADOR: lee la transcripción, el briefing que tenía Julián y las
 *     cajas del narrador; guarda solo lo nuevo en fase1.cajas (con su sesión
 *     y su marca de privado), las peticiones, las alertas, si se cumplió la
 *     intención y un resumen breve para el narrador.
 *  2. PREPARADOR: con las cajas ya al día, escribe el briefing y el saludo de
 *     la siguiente sesión en fase1.preparaciones.
 *
 * La llama el webhook alfa-elevenlabs-webhook al guardar la transcripción
 * (o el equipo a mano) con la clave de servicio. Es idempotente: una sesión
 * ya procesada no se vuelve a procesar salvo que se pida con forzar.
 *
 * Modelo: AI_GATEWAY_API_KEY (Vercel AI Gateway) o ANTHROPIC_API_KEY.
 * CEREBRO_MODELO cambia el modelo (por defecto Claude Sonnet 5.5).
 */

const SERVICIO = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CAJAS = [
  "perfil",
  "personas",
  "recuerdos",
  "consejos_valores",
  "mapa_vida",
  "estilo",
  "zonas_delicadas",
  "diario",
  "semillas",
  "anclas",
  "preguntas_familia",
] as const;
const SIEMPRE_PRIVADAS = new Set(["zonas_delicadas", "estilo", "diario", "semillas", "mapa_vida"]);

/* ---------- modelo de lenguaje ---------- */

async function pensar(sistema: string, usuario: string, maxTokens: number): Promise<string> {
  const gateway = Deno.env.get("AI_GATEWAY_API_KEY");
  const anthropic = Deno.env.get("ANTHROPIC_API_KEY");
  const elegido = Deno.env.get("CEREBRO_MODELO");

  if (gateway) {
    const r = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${gateway}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: elegido || "anthropic/claude-sonnet-5.5",
        max_tokens: maxTokens,
        temperature: 0.2,
        messages: [
          { role: "system", content: sistema },
          { role: "user", content: usuario },
        ],
      }),
    });
    if (!r.ok) throw new Error(`gateway ${r.status}: ${(await r.text()).slice(0, 200)}`);
    const d = await r.json();
    return String(d.choices?.[0]?.message?.content ?? "");
  }

  if (anthropic) {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropic,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: elegido || "claude-sonnet-5-5",
        max_tokens: maxTokens,
        temperature: 0.2,
        system: sistema,
        messages: [{ role: "user", content: usuario }],
      }),
    });
    if (!r.ok) throw new Error(`anthropic ${r.status}: ${(await r.text()).slice(0, 200)}`);
    const d = await r.json();
    // deno-lint-ignore no-explicit-any
    return (d.content ?? []).map((b: any) => (b.type === "text" ? b.text : "")).join("");
  }

  throw new Error("sin_modelo");
}

/** Saca el primer objeto JSON de la respuesta (por si viene con texto alrededor). */
function json<T>(texto: string): T {
  const limpio = texto.replace(/^```(?:json)?/m, "").replace(/```\s*$/m, "");
  const ini = limpio.indexOf("{");
  const fin = limpio.lastIndexOf("}");
  if (ini < 0 || fin <= ini) throw new Error("respuesta sin JSON");
  return JSON.parse(limpio.slice(ini, fin + 1)) as T;
}

/* ---------- prompts (06, adaptados a la base de datos) ---------- */

const PROCESADOR = `Eres el procesador de sesiones de Legado. Recibes la transcripción de una conversación entre Julián, el entrevistador, y un narrador; el briefing que tenía Julián; y las cajas del narrador tal como estaban antes. Devuelves SOLO los cambios, en JSON.

Reglas:
- Solo guardas lo que dijo el narrador. Nada de suposiciones ni de completar historias. Si un dato es dudoso, añade "por_confirmar": true.
- Lo que dice Julián no es un recuerdo. Si Julián propuso un significado y el narrador no lo confirmó, no se guarda; si lo corrigió, guardas la versión del narrador.
- Separas hechos de creencias: "tipo": "hecho" (ocurrió) o "creencia" (piensa o cree que).
- Guardas frases textuales solo si son literales del narrador y expresan una idea de legado.
- Privacidad: lo delicado (salud, duelo, conflictos, separaciones, secretos) se marca "privado": true. Lo delicado sobre otras personas va además a zonas_delicadas. Lo que el narrador pidió no compartir es privado aunque no parezca delicado, y va también a "peticiones".
- Estado de cada hilo: los que quedaron abiertos van a semillas con prioridad; lo contado, cerrado, descartado o a medias va a mapa_vida.
- Evalúas si se cumplió la intención del briefing con su criterio "CUMPLIDA SI".
- En diario anotas la energía y cómo terminó la sesión; en estilo, lo que funcionó o no en la conversación.
- Si hubo señales de malestar o peligro, van a "alertas".
- No repites lo que ya está en las cajas.
- Escribe en español neutro, claro y breve. Nunca inventes nombres.

Formato de salida (solo este JSON, sin texto alrededor):
{
  "intencion": { "cumplida": "si" | "parcial" | "no", "por_que": "una frase" },
  "resumen": "2 o 3 frases para el narrador, en segunda persona, cálidas y concretas, sin nada delicado",
  "cajas": [ { "caja": "<una de: perfil, personas, recuerdos, consejos_valores, mapa_vida, estilo, zonas_delicadas, diario, semillas, anclas>", "privado": true|false, "contenido": { ... } } ],
  "peticiones": [ { "tipo": "no_compartir" | "quitar" | "cambiar" | "compartir", "descripcion": "..." } ],
  "alertas": [ { "descripcion": "..." } ]
}

Contenido de cada caja:
- perfil: { "dato", "valor" }
- personas: { "nombre", "relacion", "nota" }
- recuerdos: { "titulo", "que_paso", "quien", "donde", "cuando", "tema", "capa": "me_paso"|"quien_soy"|"como_pienso", "tipo": "hecho"|"creencia", "frase_textual" }
- consejos_valores: { "texto", "tipo": "consejo"|"valor"|"criterio", "para_quien", "frase_textual" }
- mapa_vida: { "tema", "estado": "contado"|"cerrado"|"descartado"|"a_medias" }
- estilo: { "nota" }
- zonas_delicadas: { "tema", "detalle", "pregunta_privacidad": "pregunta para la próxima sesión, si hace falta" }
- diario: { "energia", "como_termino" }
- semillas: { "tema", "por_que_importa", "prioridad": "alta"|"media"|"baja" }
- anclas: { "nombre", "tipo": "lugar"|"objeto"|"costumbre"|"otro" }
Omite los campos que no consten.`;

const PREPARADOR = `Eres el preparador de sesiones de Legado. Recibes las cajas de un narrador y escribes el briefing de su próxima sesión con Julián, el entrevistador de voz, y el saludo con el que Julián abre.

Cómo eliges la intención (una sola):
- Si quedó a medias un hilo importante, lo retomas.
- Si no, eliges la semilla más valiosa. Vale más lo que toca identidad, valores o criterios, transiciones, personas importantes, emociones o algo que el narrador dijo que era importante. Vale menos el detalle vistoso.
- Alternas etapas de la vida y las tres capas: lo que le pasó, quién es y cómo se relaciona, y cómo piensa. Miras el mapa de vida para no repetir.
- Una pregunta de la familia entra si encaja con la intención o si no hay nada más importante, y como mucho una por sesión.
- Si la última sesión terminó con cansancio o tocó algo duro, eliges algo más ligero.
- Si hay una pregunta de privacidad pendiente en zonas delicadas, va en PREGUNTA DE PRIVACIDAD PENDIENTE.

Reglas:
- La intención es una frase concreta, alcanzable en una sesión. "CUMPLIDA SI" se tiene que poder comprobar leyendo la transcripción.
- "CUIDADO CON" nombra el tema sin detalles.
- Solo usas lo que está en las cajas. No inventas ni deduces.
- No copias historias completas: Julián solo necesita orientación.
- Trato siempre de tú. Variante del español según el perfil (España o México).
- Máximo 3.000 caracteres en el briefing.
- El saludo es la primera frase de Julián: saluda por su nombre, se alegra de volver a hablar y pregunta cómo está. Una o dos frases. Sin mencionar el tiempo ni la duración.

Plantilla exacta del briefing, una línea por campo:
NARRADOR: … Trato: tú. Variante: español de …
SESIÓN: <número>. Duración orientativa: 20 a 30 minutos.
INTENCIÓN DE HOY: …
CUMPLIDA SI: …
RETOMAR AL INICIO: …
TEMAS DE RESERVA: primero, …; después, …
TRATO Y RITMO: …
ÚLTIMA SESIÓN: …
CUIDADO CON: …
NO VOLVER A: …
PERSONAS QUE PUEDEN SALIR: … (máximo cinco, nombre y relación)
PREGUNTA DE LA FAMILIA: … (como mucho una, o "ninguna")
PREGUNTA DE PRIVACIDAD PENDIENTE: … (o "ninguna")

Formato de salida (solo este JSON): { "briefing": "…", "saludo": "…" }`;

/* ---------- utilidades ---------- */

function responder(cuerpo: unknown, status = 200) {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// deno-lint-ignore no-explicit-any
function cajasComoTexto(filas: any[]): string {
  const porCaja = new Map<string, string[]>();
  for (const f of filas) {
    const linea = `- ${JSON.stringify(f.contenido)}${f.privado ? " [privado]" : ""}${f.sesion_numero ? ` (sesión ${f.sesion_numero})` : ""}`;
    porCaja.set(f.caja, [...(porCaja.get(f.caja) ?? []), linea]);
  }
  return CAJAS.map((c) => `## ${c}\n${(porCaja.get(c) ?? ["(vacía)"]).join("\n")}`).join("\n\n");
}

/* ---------- función ---------- */

Deno.serve(async (req) => {
  if (req.method !== "POST") return responder({ error: "metodo" }, 405);
  if (req.headers.get("authorization") !== `Bearer ${SERVICIO}`) return responder({ error: "no_autorizado" }, 401);

  let sesionId = "";
  let forzar = false;
  try {
    const b = await req.json();
    sesionId = String(b?.sesion_id ?? "");
    forzar = b?.forzar === true;
  } catch {
    return responder({ error: "datos" }, 400);
  }

  const db = createClient(Deno.env.get("SUPABASE_URL")!, SERVICIO, {
    db: { schema: "fase1" },
    auth: { persistSession: false },
  });

  const { data: s } = await db
    .from("sesiones")
    .select("id, narrador_id, numero, transcripcion, procesada_en, intencion")
    .eq("id", sesionId)
    .maybeSingle();
  if (!s) return responder({ error: "sin_sesion" }, 404);
  if (s.procesada_en && !forzar) return responder({ ok: true, ya: "procesada" });

  const marcarError = async (e: unknown) => {
    const msg = String((e as Error)?.message ?? e).slice(0, 300);
    console.error("procesar-sesion", sesionId, msg);
    await db.from("sesiones").update({ procesado_error: msg }).eq("id", sesionId);
    return responder({ error: "procesar", detalle: msg }, 500);
  };

  const transcripcion = (s.transcripcion ?? "").trim();
  const numeroSiguiente = (s.numero ?? 0) + 1;

  const { data: n } = await db
    .from("narradores")
    .select("id, nombre, como_llamarle, pais, rango_edad, estilos_conversacion")
    .eq("id", s.narrador_id)
    .single();
  const nombre = (n?.como_llamarle || n?.nombre || "").trim();
  const variante = n?.pais === "es" ? "España" : "México";

  const leerCajas = async () => {
    const { data } = await db
      .from("cajas")
      .select("caja, contenido, privado, sesiones(numero)")
      .eq("narrador_id", s.narrador_id)
      .eq("estado", "vigente")
      .order("creado_en");
    // deno-lint-ignore no-explicit-any
    return (data ?? []).map((f: any) => ({ ...f, sesion_numero: f.sesiones?.numero ?? null }));
  };

  try {
    /* 1 · Procesador (solo si hubo conversación de verdad) */
    let resumenGuardado = 0;
    if (transcripcion.length >= 200) {
      const { data: prep } = await db
        .from("preparaciones")
        .select("texto")
        .eq("prepara_sesion_id", s.id)
        .maybeSingle();
      const antes = await leerCajas();

      const entrada = [
        `NARRADOR: ${nombre} · español de ${variante} · rango de edad: ${n?.rango_edad ?? "no indicado"}`,
        `SESIÓN: ${s.numero ?? "?"}`,
        `BRIEFING QUE TENÍA JULIÁN:\n${prep?.texto ?? `INTENCIÓN DE HOY: ${s.intencion ?? "(sin briefing)"}`}`,
        `CAJAS ANTES DE LA SESIÓN:\n${cajasComoTexto(antes)}`,
        `TRANSCRIPCIÓN:\n${transcripcion}`,
      ].join("\n\n");

      type Salida = {
        intencion?: { cumplida?: string; por_que?: string };
        resumen?: string;
        cajas?: { caja: string; privado?: boolean; contenido: Record<string, unknown> }[];
        peticiones?: { tipo: string; descripcion: string }[];
        alertas?: { descripcion: string }[];
      };
      const out = json<Salida>(await pensar(PROCESADOR, entrada, 6000));

      const filas = (out.cajas ?? [])
        .filter((c) => CAJAS.includes(c.caja as (typeof CAJAS)[number]) && c.caja !== "preguntas_familia")
        .filter((c) => c.contenido && typeof c.contenido === "object" && !Array.isArray(c.contenido))
        .map((c) => ({
          narrador_id: s.narrador_id,
          sesion_id: s.id,
          caja: c.caja,
          contenido: c.contenido,
          privado: SIEMPRE_PRIVADAS.has(c.caja) || c.privado === true,
          origen: "procesador",
        }));

      // Reprocesar no duplica: se retira lo que dejó el procesador de esta sesión.
      if (forzar) {
        await db.from("cajas").update({ estado: "retirado" }).eq("sesion_id", s.id).eq("origen", "procesador");
        await db.from("peticiones").delete().eq("sesion_id", s.id).eq("estado", "pendiente");
      }
      if (filas.length) {
        const { error } = await db.from("cajas").insert(filas);
        if (error) throw new Error(`cajas: ${error.message}`);
      }

      const peticiones = (out.peticiones ?? [])
        .filter((p) => ["no_compartir", "quitar", "cambiar", "compartir"].includes(p.tipo) && p.descripcion)
        .map((p) => ({ narrador_id: s.narrador_id, sesion_id: s.id, tipo: p.tipo, descripcion: String(p.descripcion).slice(0, 1000) }));
      if (peticiones.length) await db.from("peticiones").insert(peticiones);

      const alertas = (out.alertas ?? [])
        .filter((a) => a.descripcion)
        .map((a) => ({ narrador_id: s.narrador_id, sesion_id: s.id, descripcion: String(a.descripcion).slice(0, 1000) }));
      if (alertas.length) await db.from("alertas").insert(alertas);

      const cumplida = ["si", "parcial", "no"].includes(out.intencion?.cumplida ?? "") ? out.intencion!.cumplida : null;
      await db
        .from("sesiones")
        .update({
          intencion_cumplida: cumplida,
          intencion_por_que: out.intencion?.por_que?.slice(0, 500) ?? null,
          resumen: out.resumen?.slice(0, 800) ?? null,
        })
        .eq("id", s.id);
      resumenGuardado = filas.length;
    }

    /* 2 · Preparador de la siguiente sesión */
    const despues = await leerCajas();
    const { data: ultima } = await db
      .from("sesiones")
      .select("intencion_cumplida, intencion_por_que")
      .eq("id", s.id)
      .single();
    const entradaPrep = [
      `NARRADOR: ${nombre} · español de ${variante} · rango de edad: ${n?.rango_edad ?? "no indicado"} · en el registro dijeron que le anima: ${(n?.estilos_conversacion ?? []).join(", ") || "no indicado"}`,
      `PRÓXIMA SESIÓN: ${numeroSiguiente}`,
      `ÚLTIMA SESIÓN (${s.numero ?? "?"}): intención ${ultima?.intencion_cumplida ?? "sin evaluar"}${ultima?.intencion_por_que ? ` · ${ultima.intencion_por_que}` : ""}${transcripcion.length < 200 ? " · fue muy corta o no hubo conversación" : ""}`,
      `CAJAS:\n${cajasComoTexto(despues)}`,
    ].join("\n\n");
    const prep = json<{ briefing?: string; saludo?: string }>(await pensar(PREPARADOR, entradaPrep, 2500));
    if (!prep.briefing || !prep.saludo) throw new Error("preparador sin briefing o saludo");

    await db.from("preparaciones").insert({
      narrador_id: s.narrador_id,
      prepara_sesion_numero: numeroSiguiente,
      texto: prep.briefing.slice(0, 3000),
      saludo: prep.saludo.slice(0, 400),
    });

    await db.from("sesiones").update({ procesada_en: new Date().toISOString(), procesado_error: null }).eq("id", s.id);
    return responder({ ok: true, cajas: resumenGuardado, siguiente: numeroSiguiente });
  } catch (e) {
    return await marcarError(e);
  }
});
