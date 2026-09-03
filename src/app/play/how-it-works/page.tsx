import Link from "next/link";
import { requirePlayer } from "@/lib/supabase/require-player";
import { Brandbar } from "@/components/brandbar";
import { BackLink } from "@/components/back-link";
import { button, buttonGhost, card, cardTight, eyebrow } from "@/components/ui";
import { ScrollDots, type ScrollDotSection } from "@/components/scroll-dots";
import {
  CoinIcon,
  HeartIcon,
  TrophyIcon,
  CalendarIcon,
} from "@/components/rule-icons";
import { markTutorialSeenAction } from "./actions";

const sections: ScrollDotSection[] = [
  { id: "il-gioco", label: "Il gioco, in breve" },
  { id: "premio", label: "Amici e premio" },
  { id: "slot", label: "Gli slot" },
  { id: "vittoria", label: "Chi vince il torneo" },
  { id: "ritmo", label: "Il ritmo della settimana" },
];

export default async function HowItWorksPage(
  props: PageProps<"/play/how-it-works">
) {
  const params = await props.searchParams;
  const next = typeof params.next === "string" ? params.next : "/play";

  await requirePlayer(`/play/how-it-works?next=${encodeURIComponent(next)}`);

  return (
    <>
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-8 px-7 pb-32 pt-8 text-center sm:pt-10">
      {/* Spot di presentazione, in cima: parte da solo ad ogni apertura
          di questa pagina — soprattutto la primissima volta che si entra
          nel sito, prima ancora del testo sotto. Video senza audio
          (verificato con ffprobe), quindi `muted` serve solo a
          soddisfare la policy di autoplay dei browser (Safari iOS
          richiede sia `muted` sia `playsInline`, altrimenti l'autoplay
          non parte o il video va a schermo intero). */}
      <div className="overflow-hidden rounded-2xl border border-line">
        <video
          className="w-full"
          src="/video/spot.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
      </div>

      <BackLink href="/play" label="I tuoi tornei" />
      <div className="flex justify-center">
        <Brandbar subtitle="Come funziona" />
      </div>

      <div id="il-gioco" className="scroll-mt-6">
        <h1 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl">
          Una giornata. Una scelta. Sbagli e sei fuori
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-foreground-soft">
          Totofanta corre insieme al campionato vero.
        </p>
        <p className="mt-2 text-[15px] leading-relaxed text-foreground-soft">
          Ogni giornata scegli la squadra che deve vincere.
        </p>
        <p className="mt-2 text-[15px] leading-relaxed text-foreground-soft">
          Se vince, continui il tuo percorso. Se pareggia o perde sei
          fuori.
        </p>
        <p className="mt-2 text-[15px] leading-relaxed text-foreground-soft">
          Niente calcoli complicati
        </p>
      </div>

      <section id="premio" className={`${card} scroll-mt-6 border-accent/30`}>
        <div className="flex items-center justify-center gap-2.5">
          <CoinIcon className="h-5 w-5 flex-none text-accent" />
          <p className={eyebrow}>Amici, orgoglio e… soldi</p>
        </div>
        <p className="mt-3 text-[15px] leading-relaxed text-foreground-soft">
          Crea un torneo, invita chi vuoi
        </p>
        <p className="mt-2 text-[15px] leading-relaxed text-foreground-soft">
          Scegli il prezzo dello slot
        </p>
        <p className="mt-2 text-[15px] leading-relaxed text-foreground-soft">
          Ogni giocatore compra quanti slot vuole
        </p>
        <p className="mt-2 text-[15px] leading-relaxed text-foreground-soft">
          Prezzo slot X numero slot tot = montepremi finale
        </p>
        <p className="mt-2 text-[15px] leading-relaxed text-foreground-soft">
          L&apos;ultimo sopravvissuto si intasca il bottino
        </p>
      </section>

      <div className="flex flex-col gap-6">
        <section id="slot" className={`${cardTight} scroll-mt-6 p-5`}>
          <div className="flex items-center justify-center gap-2.5">
            <HeartIcon className="h-5 w-5 flex-none text-accent" />
            <h2 className="font-display text-lg font-extrabold sm:text-xl">
              Gli slot
            </h2>
          </div>
          <p className="mt-3 text-[15px] leading-relaxed text-foreground-soft">
            Gli <strong className="text-foreground">slot</strong> sono le
            tue vite nel torneo.
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-foreground-soft">
            Puoi avere una o più possibilità indipendenti: quando uno slot
            viene eliminato, gli altri continuano a giocare.
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-foreground-soft">
            Attenzione però: ogni squadra scelta viene consumata per
            sempre su quello slot. Nessun secondo giro.
          </p>
        </section>

        <section id="vittoria" className={`${cardTight} scroll-mt-6 p-5`}>
          <div className="flex items-center justify-center gap-2.5">
            <TrophyIcon className="h-5 w-5 flex-none text-accent" />
            <h2 className="font-display text-lg font-extrabold sm:text-xl">
              Chi vince il torneo
            </h2>
          </div>
          <p className="mt-3 text-[15px] leading-relaxed text-foreground-soft">
            Si va avanti finché resta più di un giocatore in gara.
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-foreground-soft">
            Se rimane un solo giocatore vivo, il torneo è suo.
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-foreground-soft">
            Se invece una giornata elimina tutti contemporaneamente,
            vincono ex aequo quelli che erano ancora in corsa e il
            montepremi viene diviso in percentuale.
          </p>
        </section>

        <section id="ritmo" className={`${cardTight} scroll-mt-6 p-5`}>
          <div className="flex items-center justify-center gap-2.5">
            <CalendarIcon className="h-5 w-5 flex-none text-accent" />
            <h2 className="font-display text-lg font-extrabold sm:text-xl">
              Il ritmo della settimana
            </h2>
          </div>
          <p className="mt-3 text-[15px] leading-relaxed text-foreground-soft">
            Schiera la tua squadra prima del calcio d&apos;inizio della
            prima partita.
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-foreground-soft">
            Poi si gioca.
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-foreground-soft">
            la giornata successiva si apre appena quella in corso sarà
            completa.
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-foreground-soft">
            Per i casi limite — rinvii – sconfitta simultanea — trovi
            tutto nel{" "}
            <Link href="/play/regolamento" className="underline hover:text-accent">
              regolamento completo
            </Link>
            .
          </p>
        </section>
      </div>

      <div className={`${card} flex flex-col items-center gap-3 text-center`}>
        <p className="text-sm text-foreground-soft">Tutto chiaro?</p>
        <p className="text-sm text-foreground-soft">
          Questa pagina resta sempre a un click da Come funziona, nella
          tua area giocatore.
        </p>
      </div>

      <ScrollDots sections={sections} />
    </main>

    <form
      action={markTutorialSeenAction}
      className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-background px-7 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4"
    >
      <input type="hidden" name="next" value={next} />
      <div className="mx-auto flex w-full max-w-lg flex-wrap justify-center gap-3">
        <button className={button} type="submit">
          Gioca
        </button>
        <Link href="/play/regolamento" className={buttonGhost}>
          Vedi regolamento
        </Link>
      </div>
    </form>
    </>
  );
}
