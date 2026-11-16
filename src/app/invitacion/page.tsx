import type { Metadata } from "next";
import { Invitacion } from "@/components/Invitacion";

export const metadata: Metadata = {
  title: "Tienes una invitación — Agnis",
};

export default function InvitacionPage() {
  return <Invitacion />;
}
