"use client";

import { useEffect } from "react";

/** Registra el service worker de la PWA (solo bajo /narrador/). */
export function RegistrarSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/narrador/sw.js", { scope: "/narrador/" }).catch(() => undefined);
  }, []);
  return null;
}
