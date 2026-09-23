"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChartIcon, CalendarIcon, ClockIcon, UserIcon } from "@/components/rule-icons";

/** Barra flottante in fondo allo schermo, sempre visibile, per muoversi
 * tra le schermate di un torneo senza dover scorrere — richiesta
 * dall'utente il 2026-09-24 al posto dei link sparsi in pagina. Solo
 * icone (niente etichette: confermato dall'utente), attiva sul verde
 * scuro fisso dell'header (.header-terra, vedi globals.css) per lo
 * stesso motivo — resta la stessa "cornice" fissa dell'app a
 * prescindere dal tema chiaro/scuro scelto. "Tu" punta al profilo
 * globale (non per-torneo): prima era l'icona utente nell'header,
 * tolta da lì per lasciarci solo il menu ad hamburger (vedi
 * play/(app)/layout.tsx). */
export function TournamentFooterNav({ tournamentId }: { tournamentId: string }) {
  const pathname = usePathname();

  const items = [
    { href: `/play/${tournamentId}`, label: "Giornata", Icon: CalendarIcon },
    { href: `/play/${tournamentId}/storico`, label: "Storico", Icon: ClockIcon },
    { href: `/play/${tournamentId}/stats`, label: "Stats", Icon: BarChartIcon },
    { href: "/play/profile", label: "Tu", Icon: UserIcon },
  ];

  return (
    <nav
      className="header-terra fixed inset-x-0 z-20 flex justify-center px-4"
      style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}
      aria-label="Navigazione torneo"
    >
      <div className="flex items-center gap-1 rounded-full bg-background p-1.5 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.6)]">
        {items.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
                active ? "text-accent" : "text-foreground-soft hover:text-accent"
              }`}
            >
              <Icon className="h-5 w-5" />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
