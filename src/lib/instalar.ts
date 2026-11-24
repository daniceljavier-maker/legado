import { useEffect, useState } from "react";

/**
 * Guardar la app del narrador en la pantalla de inicio (PWA).
 *
 * - Android y Chrome de escritorio: el navegador ofrece su propio aviso
 *   (beforeinstallprompt). Lo guardamos y lo lanzamos con nuestro botón.
 * - iPhone: no hay aviso; solo se puede desde el menú de compartir. La app
 *   enseña los pasos.
 * - En iPhone la app instalada no comparte sesión con Safari: por eso el
 *   manifest es personal y su start_url lleva el enlace del narrador
 *   (ver ponerManifestPersonal y supabase/functions/manifiesto-narrador).
 */

type AvisoInstalar = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type Plataforma =
  | "ios-safari" // Safari en iPhone o iPad
  | "ios-otro" // Chrome, Firefox o Edge en iPhone
  | "android"
  | "dentro-de-app" // navegador interno de Instagram, Facebook, etc.
  | "otra";

const CLAVE_INSTALADA = "legatum.instalada";

let aviso: AvisoInstalar | null = null;
const oyentes = new Set<() => void>();
const avisar = () => oyentes.forEach((f) => f());

// Se registra al cargar el módulo: el aviso de Chrome puede llegar muy pronto.
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // sin la barrita de Chrome: lo ofrece nuestro botón
    aviso = e as AvisoInstalar;
    avisar();
  });
  window.addEventListener("appinstalled", () => {
    aviso = null;
    try {
      localStorage.setItem(CLAVE_INSTALADA, "1");
    } catch {
      /* sin almacenamiento */
    }
    avisar();
  });
}

/** ¿Estamos abiertos como app (desde el icono)? */
export function abiertaComoApp(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function yaInstalada(): boolean {
  if (abiertaComoApp()) return true;
  try {
    return localStorage.getItem(CLAVE_INSTALADA) === "1";
  } catch {
    return false;
  }
}

export function plataforma(): Plataforma {
  if (typeof navigator === "undefined") return "otra";
  const ua = navigator.userAgent;
  if (/FBAN|FBAV|Instagram|Line\/|TikTok|Snapchat/i.test(ua)) return "dentro-de-app";
  const ios =
    /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (ios) return /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua) ? "ios-otro" : "ios-safari";
  if (/Android/i.test(ua)) return "android";
  return "otra";
}

/**
 * Estado del botón. `instalada` es null hasta montar (evita parpadeos):
 * mientras tanto no se enseña nada.
 */
export function useInstalar() {
  const [, setVersion] = useState(0);
  const [montada, setMontada] = useState(false);

  useEffect(() => {
    const refrescar = () => setVersion((v) => v + 1);
    oyentes.add(refrescar);
    setMontada(true);
    const mm = window.matchMedia("(display-mode: standalone)");
    mm.addEventListener?.("change", refrescar);
    return () => {
      oyentes.delete(refrescar);
      mm.removeEventListener?.("change", refrescar);
    };
  }, []);

  return {
    instalada: montada ? yaInstalada() : null,
    plataforma: montada ? plataforma() : "otra",
    /** El navegador puede instalarla con su propio aviso. */
    hayAviso: aviso !== null,
    /** Lanza el aviso del navegador. True si la persona aceptó. */
    instalar: async (): Promise<boolean> => {
      if (!aviso) return false;
      const a = aviso;
      aviso = null; // un aviso solo se puede usar una vez
      await a.prompt();
      const { outcome } = await a.userChoice;
      avisar();
      return outcome === "accepted";
    },
  };
}

/**
 * Cambia el manifest por el personal del narrador, para que el icono
 * abra la app ya con su enlace. Vercel sirve /narrador/manifiesto/<token>/
 * desde la función manifiesto-narrador (vercel.json).
 */
export function ponerManifestPersonal(token: string) {
  if (typeof document === "undefined" || !/^[0-9a-f-]{36}$/i.test(token)) return;
  const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  const href = `/narrador/manifiesto/${token}/`;
  if (link && link.getAttribute("href") !== href) link.setAttribute("href", href);
}
