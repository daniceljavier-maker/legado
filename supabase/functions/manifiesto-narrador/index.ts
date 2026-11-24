/**
 * Manifest personal de la app del narrador.
 *
 * En iPhone, la app guardada en la pantalla de inicio no comparte sesión ni
 * almacenamiento con Safari, y abre el start_url del manifest. Si el
 * start_url fuese /narrador/ a secas, el narrador abriría el icono y la app
 * no sabría quién es. Por eso cada narrador recibe un manifest cuyo
 * start_url lleva su enlace (/narrador/?acceso=…): el icono entra solo,
 * igual que el enlace que le mandó su familia.
 *
 * La web lo pide en su propio dominio (/narrador/manifiesto/<token>), y
 * Vercel lo reescribe aquí (vercel.json). No consulta la base de datos:
 * solo comprueba el formato. Un token falso da un icono que no entra.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve((req) => {
  if (req.method !== "GET") return new Response("metodo no permitido", { status: 405 });

  const t = new URL(req.url).searchParams.get("t")?.trim() ?? "";
  const startUrl = UUID.test(t) ? `/narrador/?acceso=${t.toLowerCase()}` : "/narrador/";

  const manifest = {
    id: "/narrador/",
    name: "Legatum — Hablar con Julián",
    short_name: "Legatum",
    description: "Tus recuerdos, contados con calma.",
    start_url: startUrl,
    scope: "/narrador/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f1eee9",
    theme_color: "#f1eee9",
    lang: "es",
    icons: [
      { src: "/narrador/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/narrador/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/narrador/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };

  return new Response(JSON.stringify(manifest), {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      // Lleva una llave: que no lo guarde ninguna caché compartida.
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
});
