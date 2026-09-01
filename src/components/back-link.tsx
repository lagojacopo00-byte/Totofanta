import Link from "next/link";

/** Freccia "torna indietro" per le schermate secondarie dell'area
 * giocatore: senza, l'unico modo per tornare all'elenco tornei era
 * passare dal menu ☰. */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground-faint transition-colors hover:text-accent"
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M15 5 8 12l7 7"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label}
    </Link>
  );
}
