# Legatum · Pieza 1: web de registro (Alfa de Legado)

Estado: prototipo v0.1 · 15 nov 2026 · Dan + Claude. Pendiente de revisión de Lorena.
El nombre vive en `src/lib/marca.ts`.

## Qué hay
- `/` landing: hero con brasas (canvas, sin vídeo), cómo funciona, dos lados, promesas, Julián, FAQ, CTA.
- `/empezar` registro en 5 pasos: para quién · quien narra (nombre, apodo, país → voz de Julián) · tú · qué contar (caja 11, preguntas de la familia) · consentimiento y envío.
- `/gracias` confirmación y próximos pasos.
- `/invitacion` lo que verá quien narra (texto grande, un botón). El botón se conecta a la pieza 2.
- `/privacidad` borrador con las reglas de producto; texto legal pendiente (LG-005).

## Stack
Next.js 16 (App Router, export estático) · Tailwind 4 · motion · Fraunces + Figtree.
`npm install && npm run dev` · `npm run build` genera `out/`.

## Decisiones de diseño
- Paleta: crema #F6F1E8, corteza #2A2622, musgo #3E5A3F, brasa #A8482A (texto, AA), dorado #E9B868 (solo decorativo).
- Tamaños de texto y botones generosos; foco visible; respeta prefers-reduced-motion.
- Sin dark patterns, sin precios (no aprobados), sin cifras inventadas.

## Registro → base de datos (LG-021, 24 nov 2026)
- El último paso envía el alta a la función `registrar-alta` (Supabase, sin sesión).
  Valida, exige código de invitación al Alfa (`?codigo=…` en el enlace) y limita
  a 8 intentos por hora por conexión. Escribe en una transacción con
  `fase1.registrar_alta`: narrador, familiar que registra, caja Perfil y
  Preguntas de la familia (o Semillas si se registra la propia persona).
- Devuelve el enlace único del narrador (`/narrador/?acceso=…`); `/gracias`
  lo muestra para copiar o enviar por WhatsApp. No se envían correos todavía.
- Si lo registró un familiar, el narrador entra por su enlace, ve la bienvenida
  y acepta él (`consentido_en`). Los importados del MVP entran directos.
- Códigos: tabla `fase1_interno.codigos_alfa` (usos y máximo por código).
- Código fuente de las funciones en `supabase/functions/`.

## Pendiente
- Envío de correo/invitación real.
- Textos legales definitivos (LG-005).
- Conectar `/invitacion` con la app del narrador (pieza 2).
