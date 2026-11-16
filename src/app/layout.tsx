import type { Metadata } from "next";
import { Inter_Tight } from "next/font/google";
import "./globals.css";

const grotesk = Inter_Tight({
  variable: "--font-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Agnis — El fuego que una familia se pasa de mano en mano",
  description:
    "Agnis ayuda a una persona a contar su vida en conversaciones por voz, para que su familia pueda preguntarle en el futuro.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${grotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
