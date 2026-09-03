"use client";

import { useState } from "react";
import { buttonGhost } from "@/components/ui";

/** Spot di presentazione a schermo intero, sopra a tutto il resto della
 * pagina: parte da solo ad ogni apertura di "Come funziona" e, quando
 * finisce, si toglie di mezzo rivelando la pagina vera e propria
 * (già montata sotto, solo coperta finché questo overlay c'è). "Salta"
 * nel footer fa la stessa cosa subito, per chi non vuole aspettare —
 * niente loop qui, a differenza della prima versione inline: un video
 * a schermo intero che non finisce mai bloccherebbe la pagina. */
export function IntroVideo() {
  const [showing, setShowing] = useState(true);
  if (!showing) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <video
        className="min-h-0 w-full flex-1 object-cover"
        src="/video/spot.mp4"
        autoPlay
        muted
        playsInline
        onEnded={() => setShowing(false)}
      />
      <div className="flex-none border-t border-line bg-background px-7 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
        <div className="mx-auto flex w-full max-w-lg justify-center">
          <button
            type="button"
            className={buttonGhost}
            onClick={() => setShowing(false)}
          >
            Salta
          </button>
        </div>
      </div>
    </div>
  );
}
