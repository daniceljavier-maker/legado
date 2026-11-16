import { MARCA } from "@/lib/marca";
import Link from "next/link";

/** Símbolo: dos aros enlazados, una generación que pasa a la siguiente. */
export function FlameMark({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <circle cx="12" cy="16" r="8" stroke="currentColor" strokeWidth="2.4" />
      <circle cx="20" cy="16" r="8" stroke="currentColor" strokeWidth="2.4" opacity="0.55" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2 text-bark ${className}`}
      aria-label={`${MARCA}, inicio`}
    >
      <FlameMark className="w-6 h-6 text-ember" />
      <span className="font-display text-2xl tracking-tight">{MARCA}</span>
    </Link>
  );
}
