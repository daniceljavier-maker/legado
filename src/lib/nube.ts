import { supabase } from "./supabase";
import type { EstadoNarrador, Privacidad, Sesion } from "./narrador";

/**
 * Sincronización con Supabase (esquema fase1).
 *
 * El teléfono manda: localStorage sigue siendo la verdad y la app funciona
 * entera sin red. Esto solo empuja hacia la nube cuando hay sesión abierta.
 * Si algo falla, se calla: nunca se le rompe la sesión a la persona por
 * un problema de conexión.
 */

const CLAVE_ID = "legatum.narrador.id";
const CLAVE_ACCESO = "legatum.acceso";

/**
 * El token del enlace del narrador, guardado en este teléfono. Hace falta
 * para el manifest personal: en iPhone la app instalada abre con él.
 * Es la misma llave que ya tiene en su enlace.
 */
export function leerAcceso(): string | null {
  try {
    return localStorage.getItem(CLAVE_ACCESO);
  } catch {
    return null;
  }
}

function idLocal(): string | null {
  try {
    return localStorage.getItem(CLAVE_ID);
  } catch {
    return null;
  }
}

function guardarIdLocal(id: string) {
  try {
    localStorage.setItem(CLAVE_ID, id);
  } catch {
    // Modo privado o almacenamiento lleno: seguimos sin nube.
  }
}

/** ¿Hay cuenta abierta ahora mismo? */
export async function hayCuenta(): Promise<boolean> {
  if (!supabase) return false;
  const { data } = await supabase.auth.getSession();
  return Boolean(data.session);
}

/**
 * Devuelve el id del narrador en la nube, creándolo la primera vez.
 * Null si no hay nube o no hay cuenta: la app sigue como siempre.
 */
export async function asegurarNarrador(e: EstadoNarrador): Promise<string | null> {
  if (!supabase || !(await hayCuenta())) return null;

  const guardado = idLocal();
  if (guardado) return guardado;

  // ¿Ya tenía una fila de antes, en otro teléfono?
  const { data: mio } = await supabase.from("narradores").select("id").maybeSingle();
  if (mio?.id) {
    guardarIdLocal(mio.id);
    return mio.id;
  }

  const { data: usuario } = await supabase.auth.getUser();
  const { data: creado, error } = await supabase
    .from("narradores")
    .insert({
      user_id: usuario.user?.id,
      nombre: e.nombre || null,
      como_llamarle: e.nombre || null,
      pais: e.pais,
      letra: e.letra,
      pausado: e.pausado,
      consentido_en: e.consentido ? new Date().toISOString() : null,
      consentimiento_version: e.consentido ? "borrador-0" : null,
    })
    .select("id")
    .single();

  if (error || !creado) return null;
  guardarIdLocal(creado.id);
  return creado.id;
}

/**
 * Ajustes del narrador: cómo quiere que le llamen, acento, letra, pausa.
 * El nombre de la app es «cómo quieres que te llame»: va a como_llamarle
 * y no pisa el nombre que puso la familia en el registro.
 */
export async function subirAjustes(e: EstadoNarrador) {
  const id = await asegurarNarrador(e);
  if (!id || !supabase) return;
  await supabase
    .from("narradores")
    .update({ como_llamarle: e.nombre || null, pais: e.pais, letra: e.letra, pausado: e.pausado })
    .eq("id", id);
}

/**
 * El narrador acepta en su bienvenida. Si lo registró un familiar, este es
 * su consentimiento propio; el del familiar queda aparte (LG-005).
 */
export async function aceptarConsentimiento() {
  const id = idLocal();
  if (!id || !supabase || !(await hayCuenta())) return;
  await supabase
    .from("narradores")
    .update({ consentido_en: new Date().toISOString(), consentimiento_version: "borrador-0" })
    .eq("id", id)
    .is("consentido_en", null);
}

/**
 * Una sesión terminada.
 * Hoy sube el tema, la duración y cuántas veces pidió reservar algo. El
 * contenido de lo contado no existe todavía: hace falta transcripción
 * (tabla `recuerdos`, pendiente del Julián en vivo).
 */
export async function subirSesion(e: EstadoNarrador, s: Sesion) {
  const id = await asegurarNarrador(e);
  if (!id || !supabase) return;
  await supabase.from("sesiones").insert({
    narrador_id: id,
    tema_id: s.temaId,
    estado: "terminada",
    inicio: s.inicio,
    fin: new Date().toISOString(),
    segundos: s.segundos,
  });
}

/** Quién puede ver cada tema. */
export async function subirPrivacidad(e: EstadoNarrador, temaId: string, p: Privacidad) {
  const id = await asegurarNarrador(e);
  if (!id || !supabase) return;
  await supabase.from("privacidad_temas").upsert(
    { narrador_id: id, tema_id: temaId, privacidad: p, actualizado_en: new Date().toISOString() },
    { onConflict: "narrador_id,tema_id" },
  );
}

/** «Empezar de cero» en el teléfono: olvida el vínculo con la nube. */
export function olvidarVinculo() {
  try {
    localStorage.removeItem(CLAVE_ID);
    localStorage.removeItem(CLAVE_ACCESO);
  } catch {
    // Nada que hacer.
  }
}

/* ---------- acceso por enlace y recuerdos importados ---------- */

export type Importada = {
  id: string;
  numero: number | null;
  fecha: string;
  caracteres: number;
};

/** Datos del narrador que vienen de la nube al entrar por enlace. */
export type NarradorNube = {
  id: string;
  nombre: string | null;
  pais: "mx" | "es" | null;
  /** False si lo registró un familiar y aún no ha aceptado en su bienvenida. */
  consentido: boolean;
};

/**
 * Cambia el enlace único (?acceso=…) por una sesión de verdad.
 * A partir de aquí manda el RLS de la base, no la app.
 */
export async function entrarConEnlace(token: string): Promise<NarradorNube | null> {
  if (!supabase) return null;
  try {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/entrar-con-enlace`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) return null;

    const datos = await res.json();
    if (!datos?.token_hash) return null;

    const { error } = await supabase.auth.verifyOtp({
      type: "magiclink",
      token_hash: datos.token_hash,
    });
    if (error) return null;

    if (datos.narrador?.id) guardarIdLocal(datos.narrador.id);
    try {
      localStorage.setItem(CLAVE_ACCESO, token);
    } catch {
      // Sin almacenamiento: el icono no podrá entrar solo, pero la sesión sí.
    }
    return datos.narrador ?? null;
  } catch {
    return null;
  }
}

/** Las conversaciones que ya existían antes de esta app. */
export async function leerImportadas(): Promise<Importada[]> {
  if (!supabase || !(await hayCuenta())) return [];
  const { data, error } = await supabase
    .from("sesiones")
    .select("id, numero, inicio, transcripcion")
    .eq("tema_id", "importado")
    .order("numero", { ascending: true });

  if (error || !data) return [];
  return data.map((s) => ({
    id: s.id as string,
    numero: (s.numero as number | null) ?? null,
    fecha: s.inicio as string,
    caracteres: ((s.transcripcion as string | null) ?? "").length,
  }));
}

/** Cierra la sesión en la nube (el teléfono conserva lo suyo). */
export async function salir() {
  await supabase?.auth.signOut();
  olvidarVinculo();
}
