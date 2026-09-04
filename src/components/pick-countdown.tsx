"use client";

// Conto alla rovescia verso la scadenza per schierare: l'orario del primo
// calcio d'inizio non escluso della giornata aperta, calcolato lato
// server (vedi computePickDeadline in src/lib/pick-window.ts, e
// play/(app)/[tournamentId]/page.tsx che lo passa qui) — non più un
// giorno fisso di calendario. `deadline` null = nessun orario ancora
// noto per questa giornata (calendario non ancora aggiornato): niente
// conto alla rovescia, solo un'indicazione neutra. Calcolato sull'orologio
// del dispositivo di chi guarda, per questo vive in un componente client e
// non mostra nulla finché non è montato (evita disallineamenti col
// rendering del server).

import { useEffect, useState } from "react";
import { formatRemaining } from "@/lib/format-remaining";

interface PickCountdownProps {
  deadline: string | null;
  /** "compact" (default): riga di testo piccola, usata inline sotto al
   * titolo del torneo. "large": numero grande con etichetta sotto, stessa
   * misura di "Slot ancora disponibili" — usato nella barra fissa in
   * cima al picker (vedi team-picker.tsx), così chi scorre la pagina ha
   * sempre sott'occhio sia quanti slot mancano sia quanto tempo resta. */
  variant?: "compact" | "large";
}

export function PickCountdown({ deadline, variant = "compact" }: PickCountdownProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // L'orario è per natura un valore "esterno" a React (l'orologio del
    // dispositivo), non uno stato derivato da props: sincronizzarlo qui è
    // il caso legittimo per questo pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (variant === "large") {
    const isOpen = now && deadline ? now.getTime() < new Date(deadline).getTime() : true;
    const value = !now
      ? "…"
      : !deadline
        ? "—"
        : isOpen
          ? formatRemaining(new Date(deadline).getTime() - now.getTime())
          : "Chiuse";
    const label = !deadline
      ? "Orario da confermare"
      : isOpen
        ? "Schiera entro"
        : "Scelte chiuse";
    return (
      <div className="min-w-0 text-right">
        <p
          className={`whitespace-nowrap font-display text-2xl font-extrabold leading-none sm:text-3xl ${
            isOpen && deadline ? "text-accent" : "text-foreground"
          }`}
        >
          {value}
        </p>
        <p className="mt-1 text-[11px] text-foreground-faint">{label}</p>
      </div>
    );
  }

  if (!now) return null;

  if (!deadline) {
    return (
      <p className="inline-flex items-center gap-1.5 font-mono text-[11px] text-foreground-faint">
        <span className="text-foreground-faint">●</span>
        Orario giornata da confermare
      </p>
    );
  }

  const deadlineDate = new Date(deadline);
  const isOpen = now.getTime() < deadlineDate.getTime();
  const remaining = formatRemaining(deadlineDate.getTime() - now.getTime());

  return (
    <p className="inline-flex items-center gap-1.5 font-mono text-[11px] text-foreground-faint">
      <span className={isOpen ? "text-accent" : "text-foreground-faint"}>●</span>
      {isOpen ? `Schiera entro: ${remaining}` : "Scelte chiuse: in attesa dei risultati"}
    </p>
  );
}
