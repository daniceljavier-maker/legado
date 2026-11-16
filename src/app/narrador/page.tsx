import { MARCA } from "@/lib/marca";
import type { Metadata, Viewport } from "next";
import { NarradorApp } from "@/components/narrador/App";
import { RegistrarSW } from "@/components/narrador/RegistrarSW";

export const metadata: Metadata = {
  title: `Hablar con Julián — ${MARCA}`,
  description: "Tus recuerdos, contados con calma. Julián te escucha.",
  manifest: "/narrador/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: MARCA },
  icons: { apple: "/narrador/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#f1eee9",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function NarradorPage() {
  return (
    <main className="flex-1">
      <NarradorApp />
      <RegistrarSW />
    </main>
  );
}
