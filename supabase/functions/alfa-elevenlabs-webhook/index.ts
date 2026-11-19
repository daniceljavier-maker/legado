import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * Webhook post-llamada del agente "Julian - Alfa" de ElevenLabs.
 *
 * Es el webhook propio del agente del Alfa (sustituye al del espacio solo
 * para ese agente): no toca nada de la maqueta. Guarda la transcripcion en
 * fase1.sesiones, en la fila que indica la variable dinamica sesion_id, que
 * pone nuestro servidor al abrir la conversacion.
 *
 * La transcripcion es interna: la familia nunca la lee (solo consulta
 * fase1.legado_compartible). No se escribe su contenido en los logs.
 * La funcion se autentica con la firma HMAC de ElevenLabs, por eso no pide JWT.
 *
 * Secretos: ALFA_ELEVENLABS_WEBHOOK_SECRET y ALFA_ELEVENLABS_AGENT_ID.
 * Se despliega en el proyecto Supabase legado-mvp con verify_jwt = false.
 */

const SECRETO = Deno.env.get("ALFA_ELEVENLABS_WEBHOOK_SECRET") ?? "";
const AGENTE = Deno.env.get("ALFA_ELEVENLABS_AGENT_ID") ?? "";
const TOLERANCIA_SEG = 30 * 60;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Marcas de tono del modelo expresivo ([warm], [chuckles]...): dan voz, no son texto.
const MARCA_TONO = /\[[^\]\n]{1,40}\]\s*/g;

function responder(cuerpo: unknown, status = 200) {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function iguales(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

// Cabecera ElevenLabs-Signature: "t=<segundos>,v0=<HMAC-SHA256 en hex de `${t}.${cuerpo}`>".
export async function firmaValida(cuerpo: string, cabecera: string | null, secreto = SECRETO) {
  if (!secreto || !cabecera) return false;
  const partes = new Map<string, string>();
  for (const p of cabecera.split(",")) {
    const i = p.indexOf("=");
    if (i > 0) partes.set(p.slice(0, i).trim(), p.slice(i + 1).trim());
  }
  const t = partes.get("t");
  const v0 = partes.get("v0");
  if (!t || !v0 || !/^\d+$/.test(t)) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > TOLERANCIA_SEG) return false;
  const clave = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secreto),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const firma = new Uint8Array(
    await crypto.subtle.sign("HMAC", clave, new TextEncoder().encode(`${t}.${cuerpo}`)),
  );
  const hex = Array.from(firma, (b) => b.toString(16).padStart(2, "0")).join("");
  return iguales(hex, v0.toLowerCase());
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return responder({ error: "metodo no permitido" }, 405);

  const cuerpo = await req.text();
  if (!(await firmaValida(cuerpo, req.headers.get("elevenlabs-signature")))) {
    return responder({ error: "firma no valida" }, 401);
  }

  // deno-lint-ignore no-explicit-any
  let evento: any;
  try {
    evento = JSON.parse(cuerpo);
  } catch {
    return responder({ error: "peticion invalida" }, 400);
  }

  // Solo nos interesa la transcripcion. Otros tipos (audio, fallos) se aceptan y se ignoran.
  if (evento?.type !== "post_call_transcription") return responder({ ignorado: "tipo de evento" });

  const d = evento.data ?? {};
  if (AGENTE && d.agent_id !== AGENTE) return responder({ ignorado: "otro agente" });

  const sesionId = String(d.conversation_initiation_client_data?.dynamic_variables?.sesion_id ?? "");
  if (!UUID.test(sesionId)) {
    console.warn("webhook sin sesion_id valido", d.conversation_id ?? "");
    return responder({ ignorado: "sin sesion_id" });
  }

  const turnos = Array.isArray(d.transcript) ? d.transcript : [];
  const transcripcion = turnos
    // deno-lint-ignore no-explicit-any
    .map((t: any) => {
      if (typeof t?.message !== "string") return null;
      const esJulian = t.role === "agent";
      const texto = (esJulian ? t.message.replace(MARCA_TONO, "") : t.message).trim();
      return texto ? `${esJulian ? "Julián" : "Narrador"}: ${texto}` : null;
    })
    .filter(Boolean)
    .join("\n");

  const inicio = Number(d.metadata?.start_time_unix_secs);
  const segundos = Math.max(0, Math.round(Number(d.metadata?.call_duration_secs) || 0));
  const fin = Number.isFinite(inicio) && inicio > 0
    ? new Date((inicio + segundos) * 1000).toISOString()
    : new Date().toISOString();

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { db: { schema: "fase1" }, auth: { persistSession: false } },
  );

  const { data, error } = await admin
    .from("sesiones")
    .update({
      transcripcion,
      elevenlabs_conversation_id: d.conversation_id ?? null,
      estado: "terminada",
      fin,
      segundos,
    })
    .eq("id", sesionId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("no se pudo guardar la sesion", error.code ?? "");
    return responder({ error: "no se pudo guardar" }, 500);
  }
  if (!data) {
    console.warn("sesion inexistente", sesionId);
    return responder({ ignorado: "sesion inexistente" });
  }
  return responder({ ok: true });
});
