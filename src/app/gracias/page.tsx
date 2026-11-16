import { MARCA } from "@/lib/marca";
import type { Metadata } from "next";
import { Gracias } from "@/components/Gracias";

export const metadata: Metadata = {
  title: `Tu legado ha empezado — ${MARCA}`,
};

export default function GraciasPage() {
  return <Gracias />;
}
