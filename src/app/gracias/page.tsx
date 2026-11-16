import type { Metadata } from "next";
import { Gracias } from "@/components/Gracias";

export const metadata: Metadata = {
  title: "El fuego está encendido — Agnis",
};

export default function GraciasPage() {
  return <Gracias />;
}
