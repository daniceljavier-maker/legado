import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase para el navegador.
 * La clave publicable está pensada para exponerse: lo que protege los datos
 * son las políticas de RLS del esquema fase1, no el secreto de la clave.
 * Todo vive en el esquema fase1; public es el MVP de fase 0 y no se toca.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const clave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Puede ser null: la app funciona en el teléfono aunque no haya nube. */
export const supabase =
  url && clave
    ? createClient(url, clave, {
        db: { schema: "fase1" },
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      })
    : null;

export const hayNube = () => supabase !== null;
