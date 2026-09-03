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
 * `object-contain`, non `object-cover`: il primo tentativo di fix per
 * lo scarto della barra di Safari (padding-top con la safe area, tolto
 * qui) ha ristretto il riquadro del video — con `object-cover` (ritaglia
 * per riempire tutto lo spazio) quel riquadro più basso tagliava via
 * proprio la fascia superiore con logo/titolo (bug scoperto dall'utente
 * il 2026-09-03, verificato via screenshot). `object-contain` non
 * ritaglia mai: se le proporzioni non combaciano perfettamente restano
 * bande dello sfondo dell'app sopra/sotto o ai lati, invece di perdere
 * pezzi di video — comunque quasi invisibili, lo sfondo del video è
 * scuro quanto `bg-background`. `h-dvh` (non solo `inset-0`, che da
 * solo assume il 100% del viewport "di riposo") segue lo spazio DAVVERO
 * visibile quando la barra di Safari è mostrata. */
function FullscreenVideo({ onDone }: { onDone: () => void }) {
  return (
    <div className="fixed inset-x-0 top-0 z-50 flex h-dvh flex-col bg-background">
      <video
        className="min-h-0 w-full flex-1 object-contain"
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
