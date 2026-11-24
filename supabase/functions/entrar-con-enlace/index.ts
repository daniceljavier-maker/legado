import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * Cambia el enlace unico de un narrador por una sesion de verdad.
 *
 * El narrador no teclea nada: abre su enlace y entra. Es el mismo modelo
 * del MVP, pero ahora la sesion la emite Supabase Auth, asi que a partir
 * de ese momento mandan las politicas de RLS y no la aplicacion.
 *
 * El token es una llave al portador: quien tenga el enlace entra. Sirve
 * para el alfa; antes de vender hace falta caducidad y revocacion.
 * La funcion se autentica sola con el token, por eso no pide JWT.
 *
 * v3 (24 nov, LG-021): devuelve si el narrador ya dio su consentimiento.
 * Si lo registro un familiar, todavia no: la app le ensena la bienvenida
 * y es el narrador quien acepta.
 */

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function responder(cuerpo: unknown, status = 200) {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return responder({ error: "metodo no permitido" }, 405);

  let token = "";
  try {
    token = String((await req.json())?.token ?? "").trim();
  } catch {
    return responder({ error: "peticion invalida" }, 400);
  }

  // Mismo mensaje para formato malo y token inexistente: no decimos cuales existen.
  if (!UUID.test(token)) return responder({ error: "enlace no valido" }, 401);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { db: { schema: "fase1" }, auth: { persistSession: false } },
  );

  const { data: narrador, error: errorBusqueda } = await admin
    .from("narradores")
    .select("id, user_id, nombre, como_llamarle, pais, letra, token_revocado, consentido_en, consentimiento_version")
    .eq("token_acceso", token)
    .maybeSingle();

  if (errorBusqueda) return responder({ error: "no se pudo comprobar el enlace" }, 500);
  if (!narrador || narrador.token_revocado) return responder({ error: "enlace no valido" }, 401);

  // Correo sintetico y estable: no se usa para escribir a nadie, solo
  // como identidad interna. Estos narradores no tienen correo propio.
  const correo = `n-${narrador.id}@narradores.legado.invalid`;
  let userId: string | null = narrador.user_id;

  if (!userId) {
    const { data: creado, error } = await admin.auth.admin.createUser({
      email: correo,
      email_confirm: true,
      user_metadata: { narrador_id: narrador.id, origen: "enlace" },
    });

    if (error || !creado?.user) {
      // Puede existir ya de un intento anterior que no llego a enlazarse.
      const { data: lista } = await admin.auth.admin.listUsers();
      const previo = lista?.users?.find((u) => u.email === correo);
      if (!previo) return responder({ error: "no se pudo preparar la cuenta" }, 500);
      userId = previo.id;
    } else {
      userId = creado.user.id;
    }

    const { error: errorEnlace } = await admin
      .from("narradores")
      .update({ user_id: userId })
      .eq("id", narrador.id);
    if (errorEnlace) return responder({ error: "no se pudo preparar la cuenta" }, 500);
  }

  // Un enlace magico que nunca se envia por correo: devolvemos su token
  // para que la app lo canjee ahi mismo por una sesion.
  const { data: enlace, error: errorToken } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: correo,
  });

  const hash = enlace?.properties?.hashed_token;
  if (errorToken || !hash) return responder({ error: "no se pudo abrir la sesion" }, 500);

  return responder({
    correo,
    token_hash: hash,
    narrador: {
      id: narrador.id,
      nombre: narrador.como_llamarle || narrador.nombre,
      pais: narrador.pais,
      letra: narrador.letra,
      // Los importados del MVP traen consentimiento_version "mvp-fase0" sin fecha.
      consentido: Boolean(narrador.consentido_en || narrador.consentimiento_version),
    },
  });
});
