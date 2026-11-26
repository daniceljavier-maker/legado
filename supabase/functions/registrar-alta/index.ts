import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * LG-021 · Guarda el alta de la web de registro (pieza 1) en fase1.
 *
 * Es pública (la llama el formulario, sin sesión), así que se defiende sola:
 *  - valida cada campo y su tamaño;
 *  - exige un código de invitación al Alfa (beta cerrada);
 *  - limita los intentos por conexión (guarda solo un hash de la IP);
 *  - escribe todo en una sola transacción con fase1.registrar_alta,
 *    que solo puede ejecutar el service role.
 *
 * Devuelve el enlace único del narrador y, si registra un familiar, el suyo
 * para consultar el legado. En el Alfa no se envían correos: quien registra
 * comparte el enlace del narrador a mano.
 */

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RANGOS = ["menos-50", "50-59", "60-69", "70-79", "80-mas"];
const ESTILOS = ["humor", "reflexiva", "detalle", "calma", "conversadora"];
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function responder(cuerpo: unknown, status = 200) {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

/** Una línea de texto limpia, o "" si no es texto. */
function linea(v: unknown, max: number): string {
  return typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

async function hashIp(req: Request): Promise<string> {
  const ip =
    (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() ||
    req.headers.get("cf-connecting-ip") ||
    "desconocida";
  const datos = new TextEncoder().encode(`legatum-alfa|${ip}`);
  const hash = await crypto.subtle.digest("SHA-256", datos);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return responder({ error: "metodo" }, 405);
  if (Number(req.headers.get("content-length") ?? 0) > 20_000) {
    return responder({ error: "datos" }, 413);
  }

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return responder({ error: "datos" }, 400);
  }

  // Trampa para bots: un campo que una persona no ve ni rellena.
  if (linea(b.web, 200)) return responder({ error: "datos" }, 400);

  const paraQuien = b.para_quien === "yo" ? "yo" : b.para_quien === "familiar" ? "familiar" : null;
  const nombre = linea(b.nombre, 80);
  const comoLlamarle = linea(b.como_llamarle, 60);
  const pais = String(b.pais ?? "").toLowerCase();
  const rangoEdad = String(b.rango_edad ?? "");
  const estilos = Array.isArray(b.estilos) ? [...new Set(b.estilos.map(String))] : [];
  const solicitante = linea(b.solicitante_nombre, 100);
  const correo = linea(b.correo, 254).toLowerCase();
  const relacion = linea(b.relacion, 40);
  const temas = Array.isArray(b.temas)
    ? [...new Set(b.temas.map((t) => linea(t, 120)).filter(Boolean))].slice(0, 12)
    : [];
  const preguntas = typeof b.preguntas === "string" ? b.preguntas.trim().slice(0, 2000) : "";
  const codigo = linea(b.codigo, 32);
  const consentimientos = b.consentimientos as Record<string, unknown> | undefined;

  const valido =
    paraQuien !== null &&
    nombre.length >= 2 &&
    (pais === "es" || pais === "mx") &&
    RANGOS.includes(rangoEdad) &&
    estilos.length <= 2 &&
    estilos.every((e) => ESTILOS.includes(e)) &&
    solicitante.length >= 2 &&
    CORREO.test(correo) &&
    (paraQuien === "yo" || relacion.length >= 2) &&
    consentimientos?.informado === true &&
    consentimientos?.datos === true;

  if (!valido) return responder({ error: "datos" }, 400);
  if (!codigo) return responder({ error: "codigo" }, 403);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { db: { schema: "fase1" }, auth: { persistSession: false } },
  );

  const { data, error } = await admin.rpc("registrar_alta", {
    p_codigo: codigo,
    p_ip_hash: await hashIp(req),
    p: {
      para_quien: paraQuien,
      nombre,
      como_llamarle: comoLlamarle,
      pais,
      rango_edad: rangoEdad,
      estilos,
      solicitante_nombre: solicitante,
      correo,
      relacion: paraQuien === "yo" ? "" : relacion,
      temas,
      preguntas,
    },
  });

  if (error) {
    console.error("registrar_alta", error.message);
    return responder({ error: "servidor" }, 500);
  }

  const r = data as { error?: string; narrador_id?: string; token?: string; token_familia?: string };
  if (r?.error === "codigo") return responder({ error: "codigo" }, 403);
  if (r?.error === "demasiados") return responder({ error: "demasiados" }, 429);
  if (r?.error === "correo_repetido") return responder({ error: "correo_repetido" }, 409);
  if (!r?.narrador_id || !r?.token) return responder({ error: "servidor" }, 500);

  return responder({
    ok: true,
    narrador_id: r.narrador_id,
    enlace: `/narrador/?acceso=${r.token}`,
    // Si registra un familiar: su propio enlace para consultar el legado (LG-025).
    ...(r.token_familia ? { enlace_familia: `/familia/?acceso=${r.token_familia}` } : {}),
  });
});
