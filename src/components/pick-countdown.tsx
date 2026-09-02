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

function formatRemaining(ms: number) {
  if (ms <= 0) return "a momenti";
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}g ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function PickCountdown({ deadline }: { deadline: string | null }) {
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
