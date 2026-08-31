"use client";

// Piccolo timer col ritmo settimanale del gioco: si schiera entro giovedì
// (23:59), poi il conto alla rovescia punta al lunedì successivo a
// mezzanotte, quando escono i risultati e si aprono le nuove scelte. È solo
// informativo — non blocca nulla lato server — calcolato sull'orologio del
// dispositivo di chi guarda, per questo vive in un componente client e non
// mostra nulla finché non è montato (evita disallineamenti col rendering
// del server).

import { useEffect, useState } from "react";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function computeTarget(now: Date): { phase: "picking" | "waiting"; target: Date } {
  const day = now.getDay(); // 0 dom .. 6 sab
  if (day >= 1 && day <= 4) {
    // Lunedì-giovedì: si schiera, il traguardo è giovedì 23:59:59 di
    // questa settimana.
    const target = startOfDay(addDays(now, 4 - day));
    target.setHours(23, 59, 59, 999);
    return { phase: "picking", target };
  }
  // Venerdì, sabato, domenica: si aspettano i risultati, il traguardo è
  // la mezzanotte del prossimo lunedì.
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  return { phase: "waiting", target: startOfDay(addDays(now, daysUntilMonday)) };
}

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

  const { phase, target } = computeTarget(now);
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
        ? `Schiera entro giovedì · mancano ${remaining}`
        : `Risultati lunedì a mezzanotte · mancano ${remaining}`}
    </p>
  );
}
