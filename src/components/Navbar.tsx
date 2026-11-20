"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Wordmark } from "./Brand";

const LINKS = [
  { href: "/#como-funciona", label: "Cómo funciona" },
  { href: "/#dos-lados", label: "Para quién" },
  { href: "/#promesas", label: "Promesas" },
];

/** Barra fija: enlaces a la izquierda, marca centrada, CTA a la derecha. En móvil, menú a pantalla completa. */
export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled || open ? "bg-cream/90 backdrop-blur-md shadow-sm" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="relative flex items-center h-16 md:h-20">
            <nav className="hidden md:flex items-center gap-8 animate-fade-down stagger-1" aria-label="Principal">
              {LINKS.map((l) => (
                <Link key={l.href} href={l.href} className="text-xs tracking-[0.18em] uppercase text-bark hover:opacity-70 transition-opacity">
                  {l.label}
                </Link>
              ))}
            </nav>

            <div className="absolute left-1/2 -translate-x-1/2 animate-fade-down stagger-2">
              <Wordmark />
            </div>

            <Link
              href="/empezar"
              className="hidden md:inline-flex items-center ml-auto px-5 py-2.5 border border-bark/25 text-bark text-xs tracking-[0.18em] uppercase hover:border-bark hover:text-ember transition-colors animate-fade-down stagger-3"
            >
              Empezar
            </Link>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={open}
              className="md:hidden ml-auto relative z-50 w-10 h-10 flex items-center justify-center"
            >
              <span
                className={`absolute w-6 h-[2px] bg-bark rounded transition-all duration-300 ease-[cubic-bezier(0.68,-0.6,0.32,1.6)] ${
                  open ? "rotate-45" : "-translate-y-[3.5px]"
                }`}
              />
              <span
                className={`absolute w-6 h-[2px] bg-bark rounded transition-all duration-300 ease-[cubic-bezier(0.68,-0.6,0.32,1.6)] ${
                  open ? "-rotate-45" : "translate-y-[3.5px]"
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      <div
        className={`md:hidden fixed inset-0 bg-cream z-40 transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        <div
          className={`flex flex-col items-center justify-center h-full gap-8 transition-all duration-500 delay-100 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            open ? "translate-y-0 opacity-100" : "-translate-y-8 opacity-0"
          }`}
        >
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={close} className="font-display text-3xl text-bark tracking-tight">
              {l.label}
            </Link>
          ))}
          <Link href="/empezar" onClick={close} className="mt-4 inline-flex items-center px-8 py-3.5 bg-ember text-paper text-lg tracking-wide">
            Empezar un legado
          </Link>
        </div>
      </div>
    </>
  );
}
