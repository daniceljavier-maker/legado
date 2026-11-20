import { MARCA } from "@/lib/marca";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/Reveal";
import { Faq } from "@/components/Faq";
import { Hilo, Parallax, PorPalabras } from "@/components/Movimiento";

/* Fotos generadas para la marca: personas inventadas, no son clientes reales. */
const FOTOS = {
  baile: { src: "/img/baile.webp", alt: "Mujer mayor bailando con una falda coral" },
  guitarra: { src: "/img/guitarra.webp", alt: "Hombre mayor levantando una guitarra" },
  salto: { src: "/img/salto.webp", alt: "Mujer de pelo gris saltando de alegría" },
  cuento: { src: "/img/cuento.webp", alt: "Abuelo con sombrero contando una historia sentado en una silla" },
  cocina: { src: "/img/cocina.webp", alt: "Mujer con delantal, cuchara de madera y cuencos de barro" },
  bici: { src: "/img/bici.webp", alt: "Hombre riendo sobre una bicicleta antigua" },
  album: { src: "/img/album.webp", alt: "Abuela y nieta mirando un álbum de fotos" },
  pareja: { src: "/img/pareja.webp", alt: "Pareja mayor bailando" },
} as const;

type FotoKey = keyof typeof FOTOS;

function Foto({ k, className = "", eager = false }: { k: FotoKey; className?: string; eager?: boolean }) {
  const f = FOTOS[k];
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={f.src}
      alt={f.alt}
      loading={eager ? "eager" : "lazy"}
      className={`block h-full w-full object-cover ${className}`}
    />
  );
}

const btnPrincipal =
  "inline-flex items-center gap-3 h-14 px-8 bg-ember text-paper rounded-full text-base hover:bg-bark transition-colors";
const btnSecundario =
  "inline-flex items-center h-14 px-8 border border-bark/20 rounded-full text-base hover:border-bark transition-colors";

function Punto() {
  return <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-paper/70" />;
}

export default function Home() {
  return (
    <>
      <Hilo />
      <Navbar />
      <main id="top">

        {/* ---------- HERO: una promesa, una foto, una acción ---------- */}
        <section className="flex min-h-[92vh] flex-wrap items-stretch pt-16 md:pt-20">
          <div className="flex flex-[999_1_560px] flex-col justify-center gap-9 px-6 py-16 lg:px-16">
            <h1 className="font-display text-[clamp(2.75rem,7vw,5.6rem)] leading-[0.98] max-w-[14ch]">
              <PorPalabras texto="Guardamos lo que tu familia sabe" />
            </h1>
            <Reveal delay={0.35}>
              <p className="max-w-[38ch] text-lg leading-relaxed text-smoke md:text-xl">
                Para que pase de una generación a la siguiente. {MARCA} conversa por voz con quien
                más quieres y guarda sus historias, sus criterios y sus consejos.
              </p>
            </Reveal>
            <Reveal delay={0.45}>
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/empezar" className={btnPrincipal}>
                  Empezar un legado <Punto />
                </Link>
                <Link href="/#como-funciona" className={btnSecundario}>
                  Cómo funciona
                </Link>
              </div>
            </Reveal>
            <Reveal delay={0.55}>
              <p className="text-sm text-smoke">Beta cerrada · España y México</p>
            </Reveal>
          </div>

          <Parallax recorrido={60} className="min-h-[52vh] flex-[1_1_440px]">
            <div className="h-[calc(100%+120px)] -translate-y-[60px]">
              <Foto k="cuento" eager />
            </div>
          </Parallax>
        </section>

        {/* ---------- LA FRASE: sola, con todo el aire ---------- */}
        <section className="px-6 py-32 md:py-56 lg:px-16">
          <p className="font-display mx-auto max-w-5xl text-center text-[clamp(2rem,5.2vw,4.2rem)] leading-[1.04]">
            <PorPalabras texto="Cada familia guarda historias, criterios y consejos que nadie ha preguntado todavía" />
          </p>
        </section>

        {/* ---------- LAS DOS CARAS ---------- */}
        <section id="dos-lados" className="scroll-mt-20 px-6 pb-32 md:pb-48 lg:px-16">
          <div className="flex flex-col gap-28 md:gap-40">
            {[
              {
                k: "guitarra" as const,
                tag: "Para quien cuenta",
                t: "Hablar, no escribir",
                d: `Julián, el entrevistador de ${MARCA}, pregunta por voz en conversaciones cortas. Quien cuenta decide de qué habla, cuánto rato y qué se queda en privado.`,
                cta: "Ver su invitación",
                href: "/invitacion",
              },
              {
                k: "album" as const,
                tag: "Para quien escucha",
                t: "Preguntar, cuando haga falta",
                d: `La familia pregunta por escrito y ${MARCA} responde solo con lo que esa persona contó, diciendo de qué conversación sale. Sin grabaciones y sin imitar su voz.`,
                cta: "Empezar un legado",
                href: "/empezar",
              },
            ].map((c, i) => (
              <div
                key={c.t}
                className={`flex flex-wrap items-center gap-12 md:gap-20 ${i % 2 ? "md:flex-row-reverse" : ""}`}
              >
                <Parallax recorrido={44} className="aspect-[4/5] flex-[1_1_320px] max-w-md">
                  <div className="h-[calc(100%+88px)] -translate-y-[44px]">
                    <Foto k={c.k} />
                  </div>
                </Parallax>
                <Reveal className="flex-[999_1_360px]">
                  <p className="mb-5 text-xs uppercase tracking-[0.16em] text-smoke">{c.tag}</p>
                  <h2 className="font-display mb-6 max-w-[16ch] text-[clamp(1.9rem,3.6vw,3rem)] leading-[1.04]">
                    {c.t}
                  </h2>
                  <p className="mb-9 max-w-[46ch] text-lg leading-relaxed text-smoke">{c.d}</p>
                  <Link href={c.href} className={i === 0 ? btnSecundario : btnPrincipal}>
                    {c.cta}
                    {i === 0 ? null : <Punto />}
                  </Link>
                </Reveal>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- UNA TIRA DE CARAS, LENTA ---------- */}
        <section className="overflow-hidden pb-32 md:pb-48" aria-hidden="true">
          <div className="marquee flex w-max">
            {[0, 1].map((n) => (
              <div key={n} className="flex gap-4 pr-4">
                {(Object.keys(FOTOS) as FotoKey[]).map((k) => (
                  <div key={k} className="aspect-[4/5] w-56 shrink-0 md:w-72">
                    <Foto k={k} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* ---------- CÓMO FUNCIONA ---------- */}
        <section id="como-funciona" className="scroll-mt-24 px-6 pb-32 md:pb-48 lg:px-16">
          <Reveal>
            <h2 className="font-display mb-16 text-[clamp(2rem,4.4vw,3.5rem)] leading-none md:mb-24">
              Cómo funciona
            </h2>
          </Reveal>
          <ol className="mx-auto max-w-5xl">
            {[
              {
                t: "Registras a quien va a contar",
                d: "Tú mismo o un familiar. Nos dices cómo le gusta que le llamen, dónde vive y qué te gustaría que no se perdiera.",
              },
              {
                t: "Julián se presenta y conversa",
                d: "Por voz, con el acento de su tierra, en sesiones cortas y más o menos semanales. Pregunta una cosa cada vez y retoma donde lo dejaron.",
              },
              {
                t: `${MARCA} ordena sin inventar`,
                d: "Recuerdos, personas, consejos y lugares quedan guardados con la conversación de la que salen. Lo delicado, en privado.",
              },
              {
                t: "La familia pregunta",
                d: `Hoy o dentro de muchos años. Si esa persona no lo contó, ${MARCA} lo dice y no rellena huecos.`,
              },
            ].map((s, i) => (
              <Reveal as="li" key={s.t} delay={i * 0.05} className="border-t border-bark/12 py-10 md:py-14">
                <div className="flex flex-wrap gap-6 md:gap-14">
                  <span className="font-display w-10 shrink-0 text-xl text-ember">0{i + 1}</span>
                  <h3 className="font-display flex-[1_1_240px] max-w-[18ch] text-[clamp(1.4rem,2.4vw,2rem)] leading-[1.1]">
                    {s.t}
                  </h3>
                  <p className="flex-[999_1_320px] max-w-[48ch] text-lg leading-relaxed text-smoke">{s.d}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </section>

        {/* ---------- JULIÁN ---------- */}
        <section className="px-6 pb-32 md:pb-48 lg:px-16">
          <div className="flex flex-wrap items-center gap-14 md:gap-24">
            <Reveal className="flex-[999_1_480px]">
              <p className="mb-8 text-xs uppercase tracking-[0.16em] text-smoke">Julián, el entrevistador</p>
              <blockquote className="font-display max-w-[20ch] text-[clamp(1.8rem,4vw,3.2rem)] leading-[1.06]">
                «La vez pasada me dijiste que lo de la fábrica fue otra vida. ¿Cómo empezó esa otra vida?»
              </blockquote>
              <p className="mt-10 max-w-[46ch] text-lg leading-relaxed text-smoke">
                Julián es una inteligencia artificial y lo dice con naturalidad. No es terapeuta ni
                consejero, no opina ni debate. Deja silencios y, si nota cansancio, propone parar.
              </p>
              <p className="mt-6 text-sm text-smoke">Ejemplo con una narradora inventada.</p>
            </Reveal>
            <Parallax recorrido={40} className="aspect-[4/5] flex-[1_1_300px] max-w-sm">
              <div className="h-[calc(100%+80px)] -translate-y-[40px]">
                <Foto k="cocina" />
              </div>
            </Parallax>
          </div>
        </section>

        {/* ---------- PROMESAS ---------- */}
        <section id="promesas" className="scroll-mt-20 px-6 pb-32 md:pb-48 lg:px-16">
          <Reveal>
            <h2 className="font-display mb-16 max-w-[16ch] text-[clamp(2rem,4.4vw,3.5rem)] leading-[1.04] md:mb-24">
              Historias que se cuidan
            </h2>
          </Reveal>
          <div className="grid gap-12 md:grid-cols-3 md:gap-16">
            {[
              { tag: "Sin imitaciones", t: "Nunca clonamos la voz de nadie" },
              { tag: "Privado por defecto", t: "Lo delicado no se comparte sin permiso" },
              { tag: "Sin inventar", t: "Cada respuesta dice de qué conversación sale" },
            ].map((p, i) => (
              <Reveal key={p.t} delay={i * 0.08}>
                <span className="mb-6 inline-flex items-center gap-2.5 rounded-full bg-lima px-4 py-1.5 text-sm text-bark">
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-moss" />
                  {p.tag}
                </span>
                <p className="font-display max-w-[14ch] text-[clamp(1.4rem,2.2vw,1.9rem)] leading-[1.1]">{p.t}</p>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <p className="mt-16 text-sm text-smoke">
              Compromisos de producto en revisión legal antes de abrir la beta.{" "}
              <Link href="/privacidad" className="underline underline-offset-4 hover:text-ember">
                Leer más
              </Link>
            </p>
          </Reveal>
        </section>

        {/* ---------- PREGUNTAS ---------- */}
        <section id="preguntas" className="scroll-mt-20 px-6 pb-32 md:pb-48 lg:px-16">
          <div className="flex flex-wrap gap-14 md:gap-24">
            <Reveal className="flex-[1_1_280px]">
              <h2 className="font-display text-[clamp(2rem,4.4vw,3.5rem)] leading-none">Preguntas</h2>
            </Reveal>
            <div className="flex-[999_1_420px]">
              <Faq />
            </div>
          </div>
        </section>

        {/* ---------- CIERRE ---------- */}
        <section className="px-6 pb-40 text-center md:pb-56 lg:px-16">
          <p className="font-display mx-auto max-w-4xl text-[clamp(2rem,5vw,4rem)] leading-[1.04]">
            <PorPalabras texto="Alguien de tu familia tiene una historia que todavía nadie ha preguntado" />
          </p>
          <Reveal delay={0.4}>
            <div className="mt-14 flex flex-wrap items-center justify-center gap-5">
              <Link href="/empezar" className={btnPrincipal}>
                Empezar un legado <Punto />
              </Link>
              <span className="text-sm text-smoke">Gratis durante la beta cerrada</span>
            </div>
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  );
}
