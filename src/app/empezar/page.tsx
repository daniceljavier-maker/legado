import { MARCA } from "@/lib/marca";
import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/Brand";
import { Wizard } from "@/components/Wizard";

export const metadata: Metadata = {
  title: `Empezar un legado — ${MARCA}`,
};

export default function EmpezarPage() {
  return (
    <main className="flex-1 flex flex-col">
      <header className="max-w-7xl w-full mx-auto px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between">
        <Wordmark />
        <Link href="/" className="text-sm text-bark hover:opacity-70">
          Salir
        </Link>
      </header>
      <section className="flex-1 max-w-7xl w-full mx-auto px-6 lg:px-8 py-10 md:py-16">
        <Wizard />
      </section>
    </main>
  );
}
