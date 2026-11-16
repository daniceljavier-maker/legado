import Link from "next/link";

/** Marca Agnis: tres llamas que se pasan de una generación a otra. */
export function FlameMark({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M16 3c2.8 4.2 6.5 7.6 6.5 13.2 0 4.1-2.9 7.4-6.5 7.4s-6.5-3.3-6.5-7.4C9.5 10.6 13.2 7.2 16 3z"
        fill="currentColor"
        opacity="0.35"
      />
      <path
        d="M16 9c1.9 2.9 4.4 5.2 4.4 9 0 2.8-2 5-4.4 5s-4.4-2.2-4.4-5c0-3.8 2.5-6.1 4.4-9z"
        fill="currentColor"
        opacity="0.65"
      />
      <path
        d="M16 15c1 1.6 2.4 2.9 2.4 5 0 1.6-1.1 2.8-2.4 2.8s-2.4-1.2-2.4-2.8c0-2.1 1.4-3.4 2.4-5z"
        fill="currentColor"
      />
      <path
        d="M8 29c2.6-1.6 5.3-2.4 8-2.4s5.4.8 8 2.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2 text-bark ${className}`}
      aria-label="Agnis, inicio"
    >
      <FlameMark className="w-6 h-6 text-ember" />
      <span className="font-display text-2xl tracking-tight">Agnis</span>
    </Link>
  );
}
