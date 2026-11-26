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

## App del narrador: guardar en la pantalla de inicio (24 nov 2026)
- Botón «Guardar en mi pantalla de inicio» en Inicio (fila lima, solo si falta)
  y en Ayuda y ajustes. Lógica en `src/lib/instalar.ts`, pantalla en
  `src/components/narrador/Instalar.tsx`.
- Android/Chrome: lanza el aviso del navegador (`beforeinstallprompt`).
  iPhone y resto: pasos con dibujos (iOS 26: menú ··· → Compartir).
- En iPhone la app instalada NO comparte sesión con Safari y abre el
  `start_url` del manifest. Por eso, cuando el narrador entra por su enlace,
  la página cambia el manifest por `/narrador/manifiesto/<token>/`, que
  Vercel reescribe (vercel.json) a la función `manifiesto-narrador`: su
  `start_url` lleva el enlace y el icono entra solo.
- El service worker no guarda en caché el manifest personal ni las páginas
  con `?acceso=`.

## Julián en vivo, cerebro y consulta del familiar (26 nov 2026)
- **Julián en vivo (LG-024).** «Hablar con Julián» (con cuenta, es decir, entrando por
  su enlace) abre `EnVivo.tsx`: pide a `iniciar-conversacion` la sesión, el briefing,
  el saludo, la voz (Leo MX, Rafa N Warm ES) y un token WebRTC de ElevenLabs, y conecta
  con `@elevenlabs/client`. La 1.ª sesión se prepara con el registro; las siguientes,
  con lo que deja el preparador. Sin cuenta, sigue el guion pregrabado de prueba.
- **Cerebro.** El webhook guarda la transcripción y lanza `procesar-sesion`:
  procesador (cajas, privado, peticiones, alertas, intención, resumen) y preparador
  (briefing + saludo de la siguiente). Prompts del 06.
- **Consulta del familiar (LG-025).** Quien registra recibe su enlace
  `/familia/?acceso=…` (en `/gracias`). `consultar-legado` responde solo con
  `fase1.legado_compartible`, cita la sesión y, si no consta, permite pedir que
  Julián lo pregunte (caja Preguntas de la familia, origen «familia»).
- **Secretos necesarios en Supabase:** `ELEVENLABS_API_KEY` y `AI_GATEWAY_API_KEY`
  (o `ANTHROPIC_API_KEY`). Opcionales: `CEREBRO_MODELO`, `CONSULTA_MODELO`, `ALFA_VOZ_ES`.

## Pendiente
- Envío de correo/invitación real.
- Textos legales definitivos (LG-005).
- Conectar `/invitacion` con la app del narrador (pieza 2).
