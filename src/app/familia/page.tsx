import { MARCA } from "@/lib/marca";
import type { Metadata } from "next";
import { Familia } from "@/components/Familia";

export const metadata: Metadata = {
  title: `Pregunta por su historia — ${MARCA}`,
  robots: { index: false, follow: false },
};

export default function FamiliaPage() {
  return <Familia />;
}
