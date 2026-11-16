import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-tan text-bark overflow-hidden">
      <div className="px-6 lg:px-8 pt-14 md:pt-16 grid grid-cols-2 md:grid-cols-12 gap-8 text-sm">
        <div className="col-span-2 md:col-span-4">
          <p className="text-bark/60 mb-2">Contacto</p>
          <a href="mailto:hola@agnis.app" className="hover:text-ember transition-colors">hola@agnis.app</a>
          <p className="mt-1">España y México</p>
        </div>
        <nav aria-label="Pie de página" className="md:col-span-3 flex flex-col gap-1">
          <p className="text-bark/60 mb-1">Agnis</p>
          <Link href="/#como-funciona" className="hover:text-ember transition-colors">Cómo funciona</Link>
          <Link href="/#dos-lados" className="hover:text-ember transition-colors">Para quién</Link>
          <Link href="/#preguntas" className="hover:text-ember transition-colors">Preguntas</Link>
          <Link href="/empezar" className="hover:text-ember transition-colors">Empezar</Link>
        </nav>
        <div className="md:col-span-3 flex flex-col gap-1">
          <p className="text-bark/60 mb-1">Legal</p>
          <Link href="/privacidad" className="hover:text-ember transition-colors">Privacidad</Link>
        </div>
        <div className="md:col-span-2 md:text-right">
          <a href="#top" className="hover:text-ember transition-colors">Volver arriba ↑</a>
        </div>
      </div>
      <p aria-hidden="true" className="font-display px-4 lg:px-6 mt-10 md:mt-14 text-[12.6vw] leading-[0.82] whitespace-nowrap select-none">
        de mano en mano
      </p>
      <div className="px-6 lg:px-8 py-5 flex flex-wrap justify-between gap-2 text-xs text-bark/70">
        <span>© 2026 Agnis. Nombre provisional.</span>
        <span>Las fotos muestran personas inventadas.</span>
      </div>
    </footer>
  );
}
