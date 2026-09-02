"use client";

// Ricarica i dati della pagina (server component) a intervalli regolari,
// senza un refresh completo del browser: usato nella pagina torneo del
// giocatore mentre il torneo è attivo, così il riepilogo giornata e lo
// stato degli slot si aggiornano da soli appena il creator sincronizza da
// football-data.org o inserisce un risultato a mano — invece di dover
// ricaricare manualmente. Non è un vero "push" (nessun automatismo lato
// server aggiorna le API più spesso di quando qualcuno clicca
// "Sincronizza ora": Vercel Hobby non permette cron più che giornalieri,
// vedi docs/07_Task_sviluppo.md); questo copre la metà raggiungibile lato
// client — il dato più fresco possibile, senza azione dell'utente.
// Nessun output visivo: componente invisibile, solo l'effetto collaterale.

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AutoRefresh({ intervalMs = 60_000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
