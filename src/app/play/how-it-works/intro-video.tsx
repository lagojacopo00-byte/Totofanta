"use client";

import { createContext, useContext, useState } from "react";
import { buttonGhost } from "@/components/ui";

const ShowVideoContext = createContext<(() => void) | null>(null);

/** Racchiude tutta la pagina "Come funziona": tiene lo stato di
 * visibilità dello spot (mostrato di default) e lo espone via contesto
 * a WatchSpotButton, così un bottone qualunque nella pagina può farlo
 * ripartire senza dover passare stato a mano da page.tsx (che è un
 * Server Component, non può tenerlo lui). */
export function IntroVideoRoot({ children }: { children: React.ReactNode }) {
  const [showing, setShowing] = useState(true);

  return (
    <ShowVideoContext.Provider value={() => setShowing(true)}>
      {showing ? <FullscreenVideo onDone={() => setShowing(false)} /> : null}
      {children}
    </ShowVideoContext.Provider>
  );
}

/** Bottone "Guarda spot" da mettere ovunque nella pagina (richiesto in
 * cima a "Come funziona"): fa ripartire l'overlay a schermo intero. */
export function WatchSpotButton() {
  const show = useContext(ShowVideoContext);
  if (!show) return null;
  return (
    <button type="button" className={buttonGhost} onClick={show}>
      Guarda spot
    </button>
  );
}

/** Spot di presentazione a schermo intero, sopra a tutto il resto della
 * pagina: parte da solo ad ogni apertura di "Come funziona" (o al click
 * di "Guarda spot") e, quando finisce, si toglie di mezzo rivelando la
 * pagina vera e propria sotto. "Salta" nel footer fa la stessa cosa
 * subito — niente loop qui: un video a schermo intero che non finisce
 * mai bloccherebbe la pagina.
 *
 * `h-dvh` (non solo `inset-0`, che da solo assume il 100% del viewport
 * "di riposo") + padding-top con la safe area: su Safari iOS la barra
 * degli indirizzi può sovrapporsi a un elemento `fixed` ancorato al
 * bordo superiore reale dello schermo invece di lasciargli lo spazio
 * sotto di sé — tagliando il logo/titolo vicino all'inizio del video
 * (bug segnalato dall'utente il 2026-09-03). `h-dvh` segue lo spazio
 * DAVVERO visibile quando la barra è mostrata; il padding aggiunge un
 * margine extra per i casi in cui Safari si sovrapponga comunque. */
function FullscreenVideo({ onDone }: { onDone: () => void }) {
  return (
    <div className="fixed inset-x-0 top-0 z-50 flex h-dvh flex-col bg-background pt-[max(1rem,env(safe-area-inset-top))]">
      <video
        className="min-h-0 w-full flex-1 object-cover"
        src="/video/spot.mp4"
        autoPlay
        muted
        playsInline
        onEnded={onDone}
      />
      <div className="flex-none border-t border-line bg-background px-7 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
        <div className="mx-auto flex w-full max-w-lg justify-center">
          <button type="button" className={buttonGhost} onClick={onDone}>
            Salta
          </button>
        </div>
      </div>
    </div>
  );
}
