"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChartIcon, CalendarIcon, ClockIcon, UserIcon } from "@/components/rule-icons";

/** Barra flottante in fondo allo schermo, sempre visibile, per muoversi
 * tra le schermate di un torneo senza dover scorrere — richiesta
 * dall'utente il 2026-09-24 al posto dei link sparsi in pagina. Solo
 * icone (niente etichette: confermato dall'utente), attiva sul verde
 * scuro fisso dell'header (.header-terra, vedi globals.css) per lo
 * stesso motivo — resta la stessa "cornice" fissa dell'app a
 * prescindere dal tema chiaro/scuro scelto. Icone grandi (56px, non le
 * 44px iniziali): segnalate "piccoline" lo stesso giorno. "Tu" porta al
 * profilo globale (non per-torneo, prima era l'icona utente nell'header,
 * tolta da lì per lasciarci solo il menu ad hamburger — vedi
 * play/(app)/layout.tsx) mantenendo però il torneo in `?t=`, così la
 * pagina profilo può rimontare la STESSA barra (vedi
 * play/(app)/profile/page.tsx) invece di farla sparire.
 *
 * Viene montata (portale) direttamente in document.body, non dentro il
 * contenitore con overflow-y-auto di play/(app)/layout.tsx: su Safari iOS
 * un elemento `fixed` dentro un contenitore che scrolla può avere l'area
 * dei tocchi sfalsata, quindi la barra si vedeva ma i tap non facevano
 * niente (segnalato dall'utente il 2026-10-12). */
export function TournamentFooterNav({ tournamentId }: { tournamentId: string }) {
  const pathname = usePathname();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const items = [
    { href: `/play/${tournamentId}`, label: "Giornata", Icon: CalendarIcon },
    { href: `/play/${tournamentId}/storico`, label: "Storico", Icon: ClockIcon },
    { href: `/play/${tournamentId}/stats`, label: "Stats", Icon: BarChartIcon },
    { href: `/play/profile?t=${tournamentId}`, label: "Tu", Icon: UserIcon },
  ];

  if (!mounted) return null;

  return createPortal(
    <nav
      className="header-terra fixed inset-x-0 z-20 flex justify-center px-4"
      style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}
      aria-label="Navigazione torneo"
    >
      <div className="flex items-center gap-1.5 rounded-full bg-background p-2 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.6)]">
        {items.map(({ href, label, Icon }) => {
          const active = pathname === href.split("?")[0];
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={`flex h-14 w-14 items-center justify-center rounded-full transition-colors ${
                active ? "text-accent" : "text-foreground-soft hover:text-accent"
              }`}
            >
              <Icon className="h-6 w-6" />
            </Link>
          );
        })}
      </div>
    </nav>,
    document.body,
  );
}
