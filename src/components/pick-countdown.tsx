"use client";

// Piccolo timer col ritmo settimanale del gioco: si schiera entro giovedì
// (23:59), poi il conto alla rovescia punta al lunedì successivo a
// mezzanotte, quando escono i risultati e si aprono le nuove scelte. È solo
// il display — la regola vera e propria (quella che blocca davvero le
// scelte lato server) vive in src/lib/pick-window.ts, condivisa con questo
// componente. Calcolato sull'orologio del dispositivo di chi guarda, per
// questo vive in un componente client e non mostra nulla finché non è
// montato (evita disallineamenti col rendering del server).

import { useEffect, useState } from "react";
import { computePickPhase } from "@/lib/pick-window";

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

export function PickCountdown() {
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

  const { phase, target } = computePickPhase(now);
  const remaining = formatRemaining(target.getTime() - now.getTime());

  return (
    <p className="inline-flex items-center gap-1.5 font-mono text-[11px] text-foreground-faint">
      <span
        className={
          phase === "picking" ? "text-accent" : "text-foreground-faint"
        }
      >
        ●
      </span>
      {phase === "picking"
        ? `Schiera entro: ${remaining}`
        : `Risultati ufficiali: ${remaining}`}
    </p>
  );
}
