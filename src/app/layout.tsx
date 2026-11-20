import { MARCA } from "@/lib/marca";
import type { Metadata } from "next";
import { Inter_Tight, Instrument_Serif } from "next/font/google";
import "./globals.css";

const grotesk = Inter_Tight({
  variable: "--font-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

/* Los titulares llevan serif: dice herencia sin disfrazarse de antiguo. */
const serif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: `${MARCA} — Lo que una familia se pasa de mano en mano`,
  description:
    `${MARCA} ayuda a una persona a contar su vida en conversaciones por voz, para que su familia pueda preguntarle en el futuro.`,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${grotesk.variable} ${serif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
