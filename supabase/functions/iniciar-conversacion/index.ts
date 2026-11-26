import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * LG-024 · Abre una conversación en vivo con Julián.
 *
 * La llama la app del narrador con su sesión de Supabase (verify_jwt = true).
 *  1. Comprueba quién es y que aceptó (consentimiento propio o del MVP).
 *  2. Crea la fila de la sesión en fase1.sesiones (en_curso) con su número.
 *  3. Arma el briefing y el saludo: en la primera sesión salen del registro
 *     (cajas Perfil, Preguntas de la familia o Semillas); después, de la
 *     preparación que deja el preparador del cerebro (fase1.preparaciones).
 *  4. Elige la voz por país (fija desde la primera sesión).
 *  5. Pide a ElevenLabs un token WebRTC (o, si falla, un enlace firmado).
 *
 * El webhook alfa-elevenlabs-webhook guarda luego la transcripción en la
 * fila de esta sesión gracias a la variable dinámica sesion_id.
 *
 * Secretos: ELEVENLABS_API_KEY (clave propia del Alfa) y ALFA_ELEVENLABS_AGENT_ID.
 */

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Voces de Julián por país (decisión de Dan, confirmada el 26 nov).
const VOCES: Record<string, string> = {
  mx: "wXojZ3FhzsE0AumH6Oym", // Leo
  es: Deno.env.get("ALFA_VOZ_ES") || "4LrktOMtQ8IXUJhTLQIX", // Rafa N – Warm Conversational Friend
};

const MAX_SESIONES_DIA = 5; // por narrador

const ESTILOS: Record<string, string> = {
  humor: "se anima con anécdotas y risas",
  reflexiva: "le gusta pensar y hablar de lo que aprendió y por qué decidió lo que decidió",
  detalle: "disfruta recordando lugares, nombres y cómo eran las cosas",
  calma: "prefiere preguntas sencillas y sin prisa",
  conversadora: "se anima sola: basta con darle pie",
};

const RANGOS: Record<string, string> = {
  "menos-50": "menos de 50 años",
  "50-59": "50 a 59 años",
  "60-69": "60 a 69 años",
  "70-79": "70 a 79 años",
  "80-mas": "80 años o más",
};

function responder(cuerpo: unknown, status = 200) {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

type Caja = { caja: string; contenido: Record<string, unknown> };

/** Briefing de la primera sesión, con la plantilla del 06 y solo datos del registro. */
function briefingInicial(n: {
  nombre: string;
  pais: string;
  rango: string | null;
  estilos: string[];
  cajas: Caja[];
}) {
  const es = n.pais === "es";
  const joven = !n.rango || ["menos-50", "50-59", "60-69"].includes(n.rango);
  const mayor = n.rango === "80-mas";

  const preguntas = n.cajas
    .filter((c) => c.caja === "preguntas_familia")
    .map((c) => ({ texto: String(c.contenido.pregunta ?? ""), de: String(c.contenido.de ?? ""), tipo: String(c.contenido.tipo ?? "") }))
    .filter((p) => p.texto);
  const semillas = n.cajas
    .filter((c) => c.caja === "semillas")
    .map((c) => String(c.contenido.tema ?? ""))
    .filter(Boolean);
  const perfil = n.cajas.find((c) => c.caja === "perfil")?.contenido ?? {};
  const registro = String(perfil.registrado_por ?? "");

  // Hipótesis registrada el 19 nov: con 50-65 años, vida adulta; con más de 75, infancia y juventud.
  const intencion = joven
    ? "que cuente una decisión o una etapa de su vida adulta que le marcó (trabajo, familia, un cambio importante) y por qué le importa."
    : "que cuente de dónde viene: la casa y el lugar donde creció y las personas de su infancia.";
  const reserva = [
    ...preguntas.filter((p) => p.tipo === "tema").map((p) => p.texto),
    ...semillas,
    joven ? "las personas que más le enseñaron" : "su juventud y su primer trabajo",
    joven ? "un momento del que se siente orgulloso" : "cómo eran sus padres",
  ].slice(0, 2);
  const familia = preguntas.find((p) => p.tipo === "texto_libre") ?? preguntas[0];

  const ritmo = mayor
    ? "pausado; deja silencios y no encadenes preguntas"
    : joven
      ? "ágil, con preguntas con fondo; si responde con detalle, profundiza"
      : "tranquilo; ve más rápido si responde con soltura";
  const anima = n.estilos.map((e) => ESTILOS[e]).filter(Boolean).join("; ");

  const personas = registro && registro !== "el propio narrador" ? registro : "ninguna registrada todavía";

  const briefing = [
    `NARRADOR: ${n.nombre}. Trato: tú. Variante: español de ${es ? "España" : "México"}.`,
    "SESIÓN: 1. Duración orientativa: 20 a 30 minutos.",
    `INTENCIÓN DE HOY: es la primera conversación. Que se sienta cómodo y ${intencion}`,
    "CUMPLIDA SI: cuenta al menos una historia concreta, con personas o lugares, y dice por qué le importa.",
    "RETOMAR AL INICIO: es la primera vez. Tras el saludo, explica en una frase que puede parar cuando quiera y decir «esto no lo compartas» en cualquier momento.",
    `TEMAS DE RESERVA: primero, ${reserva[0]}; después, ${reserva[1]}.`,
    `TRATO Y RITMO: ${n.rango ? RANGOS[n.rango] : "edad no indicada"}. ${anima ? `Según su familia, ${anima}.` : ""} Ritmo ${ritmo}. Si lo que observas no encaja, sigue lo que observas.`.replace(/\s+/g, " "),
    "ÚLTIMA SESIÓN: ninguna, es la primera.",
    "CUIDADO CON: nada registrado todavía.",
    "NO VOLVER A: nada todavía.",
    `PERSONAS QUE PUEDEN SALIR: ${personas}.`,
    familia
      ? `PREGUNTA DE LA FAMILIA: ${familia.texto}${familia.de ? ` (la pregunta ${familia.de})` : ""}.`
      : "PREGUNTA DE LA FAMILIA: ninguna.",
    "PREGUNTA DE PRIVACIDAD PENDIENTE: ninguna.",
  ].join("\n");

  const saludo = es
    ? `Hola, ${n.nombre}. Soy Julián, encantado de conocerte. ¿Qué tal estás hoy?`
    : `Hola, ${n.nombre}. Soy Julián, qué gusto conocerte. ¿Cómo estás hoy?`;

  return { briefing: briefing.slice(0, 3000), saludo };
}

/** Si el preparador aún no dejó la siguiente sesión: retomar con lo último. */
function briefingSinPreparar(nombre: string, pais: string, numero: number) {
  const es = pais === "es";
  return {
    briefing: [
      `NARRADOR: ${nombre}. Trato: tú. Variante: español de ${es ? "España" : "México"}.`,
      `SESIÓN: ${numero}. Duración orientativa: 20 a 30 minutos.`,
      "INTENCIÓN DE HOY: retomar con calma lo que más le apetezca contar hoy de su vida y profundizar en una historia concreta.",
      "CUMPLIDA SI: cuenta una historia concreta y por qué le importa.",
      "RETOMAR AL INICIO: pregúntale de qué le apetece hablar hoy.",
      "TEMAS DE RESERVA: primero, las personas que más le marcaron; después, un lugar importante de su vida.",
      "TRATO Y RITMO: sigue lo que observes.",
      "PREGUNTA DE PRIVACIDAD PENDIENTE: ninguna.",
    ].join("\n"),
    saludo: es
      ? `Hola, ${nombre}. Qué alegría volver a hablar contigo. ¿Cómo estás hoy?`
      : `Hola, ${nombre}. Qué gusto volver a platicar contigo. ¿Cómo estás hoy?`,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return responder({ error: "metodo" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    db: { schema: "fase1" },
    auth: { persistSession: false },
  });

  // 1 · ¿Quién llama?
  const jwt = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: usuario } = await admin.auth.getUser(jwt);
  if (!usuario?.user) return responder({ error: "sin_sesion" }, 401);

  const { data: n, error: errN } = await admin
    .from("narradores")
    .select("id, nombre, como_llamarle, pais, rango_edad, estilos_conversacion, consentido_en, consentimiento_version, pausado, voz_julian")
    .eq("user_id", usuario.user.id)
    .maybeSingle();
  if (errN) return responder({ error: "servidor" }, 500);
  if (!n) return responder({ error: "sin_narrador" }, 403);
  if (!n.consentido_en && !n.consentimiento_version) return responder({ error: "sin_consentimiento" }, 403);
  if (n.pausado) return responder({ error: "pausado" }, 409);

  const clave = Deno.env.get("ELEVENLABS_API_KEY");
  const agente = Deno.env.get("ALFA_ELEVENLABS_AGENT_ID");
  if (!clave || !agente) return responder({ error: "falta_configuracion" }, 503);

  // Frena abusos: como mucho unas pocas sesiones al día por narrador.
  const hoy = new Date();
  hoy.setUTCHours(0, 0, 0, 0);
  const { count } = await admin
    .from("sesiones")
    .select("id", { count: "exact", head: true })
    .eq("narrador_id", n.id)
    .gte("inicio", hoy.toISOString());
  if ((count ?? 0) >= MAX_SESIONES_DIA) return responder({ error: "limite_dia" }, 429);

  // 2 · Número de sesión: las que ya tienen conversación, más una.
  const { count: hechas } = await admin
    .from("sesiones")
    .select("id", { count: "exact", head: true })
    .eq("narrador_id", n.id)
    .not("transcripcion", "is", null);
  const numero = (hechas ?? 0) + 1;

  // 3 · Briefing y saludo.
  const nombre = (n.como_llamarle || n.nombre || "").trim() || "amigo";
  let briefing: string;
  let saludo: string;
  let preparacionId: string | null = null;

  const { data: prep } = await admin
    .from("preparaciones")
    .select("id, texto, saludo")
    .eq("narrador_id", n.id)
    .eq("prepara_sesion_numero", numero)
    .is("prepara_sesion_id", null)
    .not("saludo", "is", null) // las importadas del MVP (para Luis) no traen saludo
    .order("creado_en", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (prep?.texto) {
    briefing = prep.texto;
    saludo = prep.saludo || briefingSinPreparar(nombre, n.pais, numero).saludo;
    preparacionId = prep.id;
  } else if (numero === 1) {
    const { data: cajas } = await admin
      .from("cajas")
      .select("caja, contenido")
      .eq("narrador_id", n.id)
      .eq("estado", "vigente")
      .in("caja", ["perfil", "preguntas_familia", "semillas"]);
    ({ briefing, saludo } = briefingInicial({
      nombre,
      pais: n.pais,
      rango: n.rango_edad,
      estilos: n.estilos_conversacion ?? [],
      cajas: (cajas ?? []) as Caja[],
    }));
  } else {
    ({ briefing, saludo } = briefingSinPreparar(nombre, n.pais, numero));
  }

  // 4 · Voz: fija desde la primera sesión.
  const voz = n.voz_julian || VOCES[n.pais] || VOCES.mx;

  // La sesión existe antes de llamar a ElevenLabs: el webhook la necesita.
  const { data: sesion, error: errS } = await admin
    .from("sesiones")
    .insert({ narrador_id: n.id, tema_id: "julian", numero, intencion: briefing.match(/INTENCIÓN DE HOY: (.*)/)?.[1] ?? null })
    .select("id")
    .single();
  if (errS || !sesion) return responder({ error: "servidor" }, 500);

  if (preparacionId) {
    await admin.from("preparaciones").update({ prepara_sesion_id: sesion.id }).eq("id", preparacionId);
  }
  if (!n.voz_julian) {
    await admin
      .from("narradores")
      .update({ voz_julian: voz, voz_fijada_en: new Date().toISOString() })
      .eq("id", n.id);
  }

  // 5 · Credencial de un solo uso para conectar con el agente.
  const base = "https://api.elevenlabs.io/v1/convai/conversation";
  const cab = { "xi-api-key": clave };
  let conexion: { conversation_token: string } | { signed_url: string } | null = null;
  try {
    const r = await fetch(`${base}/token?agent_id=${agente}`, { headers: cab });
    if (r.ok) conexion = { conversation_token: (await r.json()).token };
    else console.warn("token webrtc", r.status);
  } catch (e) {
    console.warn("token webrtc", String(e));
  }
  if (!conexion) {
    const r = await fetch(`${base}/get-signed-url?agent_id=${agente}`, { headers: cab });
    if (r.ok) conexion = { signed_url: (await r.json()).signed_url };
    else console.error("enlace firmado", r.status);
  }
  if (!conexion) {
    await admin.from("sesiones").delete().eq("id", sesion.id);
    return responder({ error: "elevenlabs" }, 502);
  }

  return responder({
    ...conexion,
    sesion_id: sesion.id,
    numero,
    voz,
    variables: { sesion_id: sesion.id, saludo, briefing },
  });
});
