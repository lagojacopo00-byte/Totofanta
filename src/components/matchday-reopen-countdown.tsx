"use client";

// Conto alla rovescia verso la riapertura dello schieramento per la
// prossima giornata, mostrato nella home mentre le scelte della giornata
// aperta sono già chiuse e si aspettano i risultati — punta a
// computeNextRoundReopenAt in src/lib/pick-window.ts (mezzanotte di
// lunedì di chiusura, approssimata). Calcolato sull'orologio del
// dispositivo di chi guarda, per questo client-side, come PickCountdown.

import { useEffect, useState } from "react";
import { formatRemaining } from "@/lib/format-remaining";

export function MatchdayReopenCountdown({ targetIso }: { targetIso: string | null }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (!now || !targetIso) return null;

  const remaining = formatRemaining(new Date(targetIso).getTime() - now.getTime());
  return (
    <span className="font-mono text-[11px] text-foreground-faint">
      Prossima giornata tra: {remaining}
    </span>
  );
}
