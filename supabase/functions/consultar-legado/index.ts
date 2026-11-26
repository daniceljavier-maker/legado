import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * LG-025 · Consulta del familiar (pieza 3).
 *
 * El familiar entra con su propio enlace (/familia/?acceso=<token>). Esta
 * función es lo único que lee por él, y solo lee fase1.legado_compartible
 * de su narrador: nada privado, nada retirado, ni las cajas internas. Nunca
 * ve transcripciones ni audios.
 *
 * Acciones:
 *  - hola: nombre del narrador y si ya hay algo que consultar.
 *  - preguntar: responde con un modelo de lenguaje usando solo esos datos y
 *    citando la sesión de cada uno. Si no consta, lo dice.
 *  - pedir: deja la pregunta en «Preguntas de la familia» para que Julián
 *    se la plantee al narrador en una próxima sesión.
 *
 * Se autentica con el token del familiar (sin JWT). Límite diario por familiar.
 * Modelo: AI_GATEWAY_API_KEY o ANTHROPIC_API_KEY; CONSULTA_MODELO lo cambia.
 */

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_PREGUNTAS_DIA = 40;

function responder(cuerpo: unknown, status = 200) {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

async function pensar(sistema: string, usuario: string, maxTokens: number): Promise<string> {
  const gateway = Deno.env.get("AI_GATEWAY_API_KEY");
  const anthropic = Deno.env.get("ANTHROPIC_API_KEY");
  const elegido = Deno.env.get("CONSULTA_MODELO");
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
    if (!r.ok) throw new Error(`gateway ${r.status}`);
    const d = await r.json();
    return String(d.choices?.[0]?.message?.content ?? "");
  }
  if (anthropic) {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": anthropic, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      body: JSON.stringify({
        model: elegido || "claude-sonnet-5-5",
        max_tokens: maxTokens,
        temperature: 0.2,
        system: sistema,
        messages: [{ role: "user", content: usuario }],
      }),
    });
    if (!r.ok) throw new Error(`anthropic ${r.status}`);
    const d = await r.json();
    // deno-lint-ignore no-explicit-any
    return (d.content ?? []).map((b: any) => (b.type === "text" ? b.text : "")).join("");
  }
  throw new Error("sin_modelo");
}

function json<T>(texto: string): T {
  const limpio = texto.replace(/^```(?:json)?/m, "").replace(/```\s*$/m, "");
  const ini = limpio.indexOf("{");
  const fin = limpio.lastIndexOf("}");
  if (ini < 0 || fin <= ini) throw new Error("respuesta sin JSON");
  return JSON.parse(limpio.slice(ini, fin + 1)) as T;
}

/** Prompt de la consulta del familiar (pendiente en el 06; propuesta del 26 nov). */
function sistema(nombre: string, variante: string) {
  return `Eres la IA mediadora de Legado. Respondes a una persona de la familia de ${nombre} usando SOLO los fragmentos de su legado que recibes. Cada fragmento indica de qué sesión sale.

Reglas:
- No inventas, no completas y no deduces. Si algo no consta en los fragmentos, lo dices con calidez en una frase («Eso ${nombre} todavía no lo ha contado») y marcas "no_consta": true.
- Hablas de ${nombre} en tercera persona. Nunca hablas como si fueras ${nombre} ni imitas su manera de hablar.
- Si usas una frase textual suya, va entre comillas, tal cual.
- Después de cada dato pones la sesión entre corchetes, por ejemplo [sesión 2].
- Respuestas breves y cálidas: de 2 a 5 frases. Español de ${variante}. Tratas de tú a quien pregunta.
- No das consejos médicos, legales ni económicos, ni opinas sobre la familia.
- Si preguntan por algo privado, por las grabaciones o por cosas que no puedes ver, explicas que solo conoces lo que ${nombre} ha querido compartir.
- Si la pregunta no tiene que ver con ${nombre} ni con su historia, lo dices amablemente y no la respondes.

Formato de salida (solo este JSON): { "respuesta": "…", "sesiones": [números de sesión usados], "no_consta": true | false }`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return responder({ error: "metodo" }, 405);

  // deno-lint-ignore no-explicit-any
  let b: any;
  try {
    b = await req.json();
  } catch {
    return responder({ error: "datos" }, 400);
  }
  const token = String(b?.acceso ?? "").trim();
  const accion = String(b?.accion ?? "hola");
  const pregunta = typeof b?.pregunta === "string" ? b.pregunta.replace(/\s+/g, " ").trim().slice(0, 500) : "";
  if (!UUID.test(token)) return responder({ error: "enlace" }, 401);

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    db: { schema: "fase1" },
    auth: { persistSession: false },
  });

  const { data: f } = await db
    .from("familiares")
    .select("id, nombre, relacion, narrador_id, token_revocado, acceso_desde, narradores(nombre, como_llamarle, pais, pausado)")
    .eq("token_acceso", token)
    .maybeSingle();
  if (!f || f.token_revocado) return responder({ error: "enlace" }, 401);

  // deno-lint-ignore no-explicit-any
  const n = (f as any).narradores ?? {};
  const nombre = String(n.como_llamarle || n.nombre || "tu familiar").trim();
  const variante = n.pais === "es" ? "España" : "México";

  if (accion === "hola") {
    if (!f.acceso_desde) {
      await db.from("familiares").update({ acceso_desde: new Date().toISOString(), activo: true }).eq("id", f.id);
    }
    const [{ count: sesiones }, { count: datos }] = await Promise.all([
      db.from("sesiones").select("id", { count: "exact", head: true }).eq("narrador_id", f.narrador_id).not("procesada_en", "is", null),
      db.from("legado_compartible").select("id", { count: "exact", head: true }).eq("narrador_id", f.narrador_id),
    ]);
    return responder({ narrador: nombre, pais: n.pais ?? "mx", familiar: f.nombre, sesiones: sesiones ?? 0, datos: datos ?? 0 });
  }

  if (accion === "pedir") {
    if (pregunta.length < 4) return responder({ error: "datos" }, 400);
    const { error } = await db.from("cajas").insert({
      narrador_id: f.narrador_id,
      caja: "preguntas_familia",
      contenido: { pregunta, de: `${f.nombre ?? "Familia"}${f.relacion ? ` (${f.relacion})` : ""}`, tipo: "chat" },
      origen: "familia",
    });
    if (error) return responder({ error: "servidor" }, 500);
    return responder({ ok: true });
  }

  if (accion !== "preguntar" || pregunta.length < 3) return responder({ error: "datos" }, 400);

  const hoy = new Date();
  hoy.setUTCHours(0, 0, 0, 0);
  const { count: usadas } = await db
    .from("consultas_familia")
    .select("id", { count: "exact", head: true })
    .eq("familiar_id", f.id)
    .gte("en", hoy.toISOString());
  if ((usadas ?? 0) >= MAX_PREGUNTAS_DIA) return responder({ error: "limite_dia" }, 429);

  const { data: filas } = await db
    .from("legado_compartible")
    .select("caja, contenido, sesion_numero, sesion_fecha")
    .eq("narrador_id", f.narrador_id)
    .limit(400);

  let salida: { respuesta: string; sesiones: number[]; no_consta: boolean };
  if (!filas?.length) {
    salida = {
      respuesta: `${nombre} todavía no ha compartido historias. Cuando hable con Julián, aquí podrás preguntar por lo que cuente.`,
      sesiones: [],
      no_consta: true,
    };
  } else {
    const fragmentos = filas
      .map((r) => `- [${r.caja}${r.sesion_numero ? `, sesión ${r.sesion_numero}` : ", registro"}] ${JSON.stringify(r.contenido)}`)
      .join("\n");
    try {
      const out = json<{ respuesta?: string; sesiones?: number[]; no_consta?: boolean }>(
        await pensar(sistema(nombre, variante), `FRAGMENTOS DEL LEGADO DE ${nombre.toUpperCase()}:\n${fragmentos}\n\nPREGUNTA DE ${String(f.nombre ?? "la familia").toUpperCase()}: ${pregunta}`, 900),
      );
      salida = {
        respuesta: String(out.respuesta ?? "").slice(0, 2000) || "No pude responder ahora. Inténtalo de nuevo.",
        sesiones: Array.isArray(out.sesiones) ? out.sesiones.filter((x) => Number.isInteger(x)).slice(0, 10) : [],
        no_consta: out.no_consta === true,
      };
    } catch (e) {
      const msg = String((e as Error)?.message ?? e);
      console.error("consultar-legado", msg);
      return responder({ error: msg === "sin_modelo" ? "falta_configuracion" : "servidor" }, msg === "sin_modelo" ? 503 : 500);
    }
  }

  await db.from("consultas_familia").insert({
    familiar_id: f.id,
    narrador_id: f.narrador_id,
    sin_respuesta: salida.no_consta,
  });

  return responder(salida);
});
