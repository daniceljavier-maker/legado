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

/** Ajustes del narrador: nombre, acento, letra, pausa. */
export async function subirAjustes(e: EstadoNarrador) {
  const id = await asegurarNarrador(e);
  if (!id || !supabase) return;
  await supabase
    .from("narradores")
    .update({ nombre: e.nombre || null, pais: e.pais, letra: e.letra, pausado: e.pausado })
    .eq("id", id);
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
  } catch {
    // Nada que hacer.
  }
}
