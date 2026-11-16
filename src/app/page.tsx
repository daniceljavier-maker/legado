import { MARCA } from "@/lib/marca";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Reveal } from "@/components/Reveal";
import { Faq } from "@/components/Faq";

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
    <img src={f.src} alt={f.alt} loading={eager ? "eager" : "lazy"} className={`block w-full aspect-[4/5] object-cover ${className}`} />
  );
}

/** Miniatura dentro de una frase grande. */
function Chip({ k }: { k: FotoKey }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={FOTOS[k].src}
      alt=""
      aria-hidden="true"
      className="inline-block align-baseline w-[0.85em] h-[0.85em] object-cover object-top mx-[0.12em] translate-y-[0.08em] transition-transform duration-500 hover:scale-150 hover:-rotate-3"
    />
  );
}

const btnDark =
  "inline-flex items-center justify-center h-12 px-7 bg-bark text-cream text-sm font-medium hover:bg-ember transition-colors";
const btnLight =
  "inline-flex items-center justify-center h-12 px-7 bg-paper text-bark text-sm font-medium hover:bg-white transition-colors";

export default function Home() {
  return (
    <>
      <Navbar />
      <main id="top">
        {/* HERO: titular a la izquierda, mosaico a la derecha */}
        <section className="md:grid md:grid-cols-12 md:min-h-screen">
          <div className="md:col-span-4 flex flex-col px-6 lg:px-8 pt-28 md:pt-36 pb-10">
            <h1 className="font-display text-[2.1rem] sm:text-4xl lg:text-[2.75rem] leading-[1.02] text-bark animate-fade-up stagger-2">
              Guardamos lo que tu familia sabe, para que pase de una generación a la siguiente
            </h1>
            <p className="mt-6 text-base text-smoke max-w-sm leading-relaxed animate-fade-up stagger-3">
              {MARCA} conversa por voz con quien más quieres y guarda sus historias, sus criterios y sus consejos. Mañana, los tuyos podrán preguntarle.
            </p>
            <div className="mt-8 flex flex-wrap gap-2 animate-fade-up stagger-4">
              <Link href="/empezar" className={btnDark}>Empezar un legado</Link>
              <Link href="/#como-funciona" className={btnLight}>Cómo funciona</Link>
            </div>
            <p className="mt-12 md:mt-auto text-sm text-smoke animate-fade-up stagger-5">Beta cerrada · España y México</p>
          </div>

          <div className="md:col-span-8 bg-sand px-6 lg:px-10 pt-10 md:pt-28 pb-10 overflow-hidden">
            <div className="grid grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4 max-w-3xl">
              <div className="animate-fade-up stagger-2"><div className="float-a"><Foto k="baile" eager /></div></div>
              <div className="animate-fade-up stagger-3"><div className="float-b"><Foto k="guitarra" eager /></div></div>
              <div className="hidden lg:block" />
              <div className="hidden lg:block" />
              <div className="hidden lg:block" />
              <div className="animate-fade-up stagger-4"><div className="float-b"><Foto k="salto" eager /></div></div>
              <div className="animate-fade-up stagger-5"><div className="float-a"><Foto k="album" eager /></div></div>
              <div className="animate-fade-up stagger-6"><div className="float-b"><Foto k="bici" eager /></div></div>
              <div className="animate-fade-up stagger-5"><div className="float-a"><Foto k="cuento" eager /></div></div>
              <div className="animate-fade-up stagger-6"><div className="float-b"><Foto k="pareja" eager /></div></div>
            </div>
          </div>
        </section>

        {/* FRASE con miniaturas */}
        <section className="px-6 lg:px-8 py-28 md:py-44">
          <Reveal>
            <p className="font-display text-center text-3xl sm:text-5xl lg:text-6xl leading-[1.02] text-bark max-w-5xl mx-auto">
              Cada familia <Chip k="album" /> guarda historias, <Chip k="cuento" /> criterios y consejos <Chip k="cocina" /> que nadie ha preguntado todavía
            </p>
          </Reveal>
        </section>

        {/* DOS LADOS */}
        <section id="dos-lados" className="grid md:grid-cols-2 scroll-mt-20">
          {[
            { k: "cuento" as const, bg: "bg-sand", tag: "Para quien cuenta", t: "Hablar, no escribir", d: `Julián, el entrevistador de ${MARCA}, pregunta por voz en conversaciones cortas. Quien cuenta decide de qué habla, cuánto rato y qué se queda en privado.`, cta: "Ver su invitación", href: "/invitacion" },
            { k: "album" as const, bg: "bg-tan", tag: "Para quien escucha", t: "Preguntar, cuando haga falta", d: `La familia pregunta por escrito y ${MARCA} responde solo con lo que esa persona contó, diciendo de qué conversación sale. Sin grabaciones y sin imitar su voz.`, cta: "Empezar un legado", href: "/empezar" },
          ].map((c, i) => (
            <Reveal key={c.t} delay={i * 0.1} className={`${c.bg} flex flex-col`}>
              <div className="px-6 lg:px-8 pt-10 md:pt-14">
                <div className="max-w-sm mx-auto overflow-hidden group">
                  <Foto k={c.k} className="transition-transform duration-700 group-hover:scale-[1.04]" />
                </div>
              </div>
              <div className="px-6 lg:px-8 py-8 md:flex md:items-end md:justify-between md:gap-8">
                <div className="max-w-md">
                  <p className="text-xs text-smoke mb-2">{c.tag}</p>
                  <h2 className="font-display text-2xl md:text-3xl leading-[1.05] mb-3">{c.t}</h2>
                  <p className="text-sm text-bark/80 leading-relaxed">{c.d}</p>
                </div>
                <Link href={c.href} className={`${i === 0 ? btnLight : btnDark} mt-6 md:mt-0 shrink-0`}>{c.cta}</Link>
              </div>
            </Reveal>
          ))}
        </section>

        {/* PROMESAS */}
        <section id="promesas" className="px-6 lg:px-8 py-24 md:py-36 scroll-mt-20">
          <Reveal><h2 className="font-display text-4xl md:text-6xl leading-none mb-10 md:mb-14">Historias que se cuidan</h2></Reveal>
          <div className="grid md:grid-cols-3 gap-2">
            {[
              { tag: "Sin imitaciones", t: "Nunca clonamos la voz de nadie" },
              { tag: "Privado por defecto", t: "Lo delicado no se comparte sin permiso" },
              { tag: "Sin inventar", t: "Cada respuesta dice de qué conversación sale" },
            ].map((p, i) => (
              <Reveal key={p.t} delay={i * 0.08} className="bg-sand p-5 flex flex-col min-h-[300px] md:min-h-[380px] transition-colors duration-500 hover:bg-tan">
                <p className="text-sm text-bark flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-bark" />{p.tag}</p>
                <p className="font-display text-2xl md:text-[1.7rem] leading-[1.05] text-center my-auto px-4">{p.t}</p>
                <p className="text-xs text-smoke">0{i + 1}</p>
              </Reveal>
            ))}
          </div>
          <p className="mt-4 text-xs text-smoke">
            Compromisos de producto en revisión legal antes de abrir la beta. <Link href="/privacidad" className="underline underline-offset-2 hover:text-ember">Leer más</Link>
          </p>
        </section>

        {/* FRASE + tira de fotos */}
        <section className="pb-24 md:pb-36 overflow-hidden">
          <Reveal className="px-6 lg:px-8">
            <p className="font-display text-center text-3xl sm:text-5xl lg:text-6xl leading-[1.02] max-w-5xl mx-auto mb-12 md:mb-16">
              Una vida entera no cabe en una tarde. Por eso {MARCA} vuelve cada semana, sin prisa.
            </p>
          </Reveal>
          <div className="flex w-max marquee" aria-hidden="true">
            {[0, 1].map((n) => (
              <div key={n} className="flex gap-3 pr-3">
                {(Object.keys(FOTOS) as FotoKey[]).map((k) => (
                  <div key={k} className="w-40 md:w-56 shrink-0"><Foto k={k} /></div>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* CÓMO FUNCIONA: filas */}
        <section id="como-funciona" className="px-6 lg:px-8 pb-24 md:pb-36 scroll-mt-24">
          <Reveal><h2 className="font-display text-4xl md:text-6xl leading-none mb-10 md:mb-14">Cómo funciona</h2></Reveal>
          <ol className="border-t border-bark/15">
            {[
              { t: "Registras a quien va a contar", d: "Tú mismo o un familiar. Nos dices cómo le gusta que le llamen, dónde vive y qué te gustaría que no se perdiera." },
              { t: "Julián se presenta y conversa", d: "Por voz, con el acento de su tierra, en sesiones cortas y más o menos semanales. Pregunta una cosa cada vez y retoma donde lo dejaron." },
              { t: `${MARCA} ordena sin inventar`, d: "Recuerdos, personas, consejos y lugares quedan guardados con la conversación de la que salen. Lo delicado, en privado." },
              { t: "La familia pregunta", d: `Hoy o dentro de muchos años. Si esa persona no lo contó, ${MARCA} lo dice y no rellena huecos.` },
            ].map((s, i) => (
              <Reveal as="li" key={s.t} delay={i * 0.05} className="group grid md:grid-cols-12 gap-2 md:gap-6 py-6 md:py-7 border-b border-bark/15 transition-colors hover:bg-paper md:px-3">
                <span className="md:col-span-1 text-sm text-smoke">0{i + 1}</span>
                <h3 className="md:col-span-5 font-display text-xl md:text-2xl leading-tight">{s.t}</h3>
                <p className="md:col-span-6 text-sm md:text-base text-bark/80 leading-relaxed">{s.d}</p>
              </Reveal>
            ))}
          </ol>
        </section>

        {/* JULIÁN */}
        <section className="grid md:grid-cols-2">
          <Reveal className="bg-sand px-6 lg:px-8 py-14 md:py-20 flex flex-col">
            <p className="text-xs text-smoke mb-6">Julián, el entrevistador</p>
            <p className="font-display text-2xl md:text-4xl leading-[1.05] max-w-lg">
              «La vez pasada me dijiste que lo de la fábrica fue otra vida. ¿Cómo empezó esa otra vida?»
            </p>
            <p className="mt-auto pt-10 text-xs text-smoke">Ejemplo con una narradora inventada.</p>
          </Reveal>
          <Reveal delay={0.1} className="bg-tan px-6 lg:px-8 py-14 md:py-20">
            <h2 className="font-display text-2xl md:text-4xl leading-[1.05] mb-6 max-w-md">Cálido, sereno y curioso por la persona</h2>
            <p className="text-sm md:text-base text-bark/85 leading-relaxed max-w-md">
              Julián es una inteligencia artificial y lo dice con naturalidad. No es terapeuta ni consejero, no opina ni debate. Deja silencios y, si nota cansancio, propone parar.
            </p>
          </Reveal>
        </section>

        {/* PREGUNTAS */}
        <section id="preguntas" className="px-6 lg:px-8 py-24 md:py-36 scroll-mt-20">
          <div className="grid md:grid-cols-12 gap-8">
            <Reveal className="md:col-span-5">
              <div className="bg-sand p-6 md:p-8">
                <h2 className="font-display text-4xl md:text-5xl leading-none mb-8">Preguntas</h2>
                <div className="max-w-[260px] mx-auto"><Foto k="salto" /></div>
              </div>
            </Reveal>
            <div className="md:col-span-7"><Faq /></div>
          </div>
        </section>

        {/* CIERRE */}
        <section className="px-6 lg:px-8 pb-24 md:pb-36 text-center">
          <Reveal>
            <p className="font-display text-3xl sm:text-5xl lg:text-6xl leading-[1.02] max-w-4xl mx-auto">
              Alguien de tu familia tiene una historia que todavía nadie ha preguntado
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <span className="text-sm text-bark">Gratis durante la beta cerrada</span>
              <Link href="/empezar" className={btnDark}>Empezar un legado</Link>
            </div>
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  );
}
