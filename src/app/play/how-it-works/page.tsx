import Link from "next/link";
import { requirePlayer } from "@/lib/supabase/require-player";
import { Brandbar } from "@/components/brandbar";
import { BackLink } from "@/components/back-link";
import { button, buttonGhost, card, cardTight, eyebrow } from "@/components/ui";
import { ScrollDots, type ScrollDotSection } from "@/components/scroll-dots";
import {
  BallIcon,
  CoinIcon,
  HeartIcon,
  TrophyIcon,
  ListIcon,
  CalendarIcon,
} from "@/components/rule-icons";
import { markTutorialSeenAction } from "./actions";

const sections: ScrollDotSection[] = [
  { id: "il-gioco", label: "Il gioco, in breve" },
  { id: "premio", label: "Amici e premio" },
  { id: "slot", label: "Gli slot" },
  { id: "vittoria", label: "Chi vince il torneo" },
  { id: "nell-app", label: "Nell'app trovi" },
  { id: "ritmo", label: "Il ritmo della settimana" },
];

export default async function HowItWorksPage(
  props: PageProps<"/play/how-it-works">
) {
  const params = await props.searchParams;
  const next = typeof params.next === "string" ? params.next : "/play";

  await requirePlayer(`/play/how-it-works?next=${encodeURIComponent(next)}`);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-8 px-7 py-8 sm:py-10">
      <BackLink href="/play" label="I tuoi tornei" />
      <Brandbar subtitle="Come funziona" />

      <div id="il-gioco" className="scroll-mt-6">
        <div className="flex items-center gap-2.5">
          <BallIcon className="h-5 w-5 flex-none text-accent" />
          <p className={eyebrow}>Il gioco, in breve</p>
        </div>
        <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight sm:text-4xl">
          Una giornata. Una scelta. Sbagli, sei fuori.
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-foreground-soft">
          Totofanta corre insieme al campionato vero.
        </p>
        <p className="mt-2 text-[15px] leading-relaxed text-foreground-soft">
          Ogni giornata scegli la squadra che pensi possa vincere. Se
          vince, continui il tuo percorso. Se pareggia o perde, quello
          slot è eliminato.
        </p>
        <p className="mt-2 text-[15px] leading-relaxed text-foreground-soft">
          Niente calcoli complicati, niente seconde possibilità:
          sopravvive chi riesce a scegliere meglio degli altri.
        </p>
      </div>

      <section id="premio" className={`${card} scroll-mt-6 border-accent/30`}>
        <div className="flex items-center gap-2.5">
          <CoinIcon className="h-5 w-5 flex-none text-accent" />
          <p className={eyebrow}>Amici, orgoglio e (se volete) soldi veri</p>
        </div>
        <p className="mt-3 text-[15px] leading-relaxed text-foreground-soft">
          Crea un torneo, invita chi vuoi e — se decidete voi — mettete
          in palio un premio reale.
        </p>
        <p className="mt-2 text-[15px] leading-relaxed text-foreground-soft">
          Ogni slot può avere un valore: più slot vengono acquistati, più
          cresce il montepremi.
        </p>
        <p className="mt-2 text-[15px] leading-relaxed text-foreground-soft">
          Alla fine vince chi riesce a restare in gioco più a lungo.
        </p>
      </section>

      <div className="flex flex-col gap-6">
        <section id="slot" className={`${cardTight} scroll-mt-6 p-5`}>
          <div className="flex items-center gap-2.5">
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
          <div className="flex items-center gap-2.5">
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
            vincono ex aequo tutti quelli che erano ancora in corsa prima
            del turno e il montepremi viene diviso secondo le regole del
            torneo.
          </p>
        </section>

        <section id="nell-app" className={`${cardTight} scroll-mt-6 p-5`}>
          <div className="flex items-center gap-2.5">
            <ListIcon className="h-5 w-5 flex-none text-accent" />
            <h2 className="font-display text-lg font-extrabold sm:text-xl">
              Nell&apos;app trovi
            </h2>
          </div>
          <p className="mt-3 text-[15px] leading-relaxed text-foreground-soft">
            La classifica di chi è ancora vivo e chi è già fuori, e
            l&apos;avversario di ogni squadra disponibile.
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-foreground-soft">
            Le giornate vengono aperte dall&apos;organizzatore, che carica
            anche i risultati.
          </p>
        </section>

        <section id="ritmo" className={`${cardTight} scroll-mt-6 p-5`}>
          <div className="flex items-center gap-2.5">
            <CalendarIcon className="h-5 w-5 flex-none text-accent" />
            <h2 className="font-display text-lg font-extrabold sm:text-xl">
              Il ritmo della settimana
            </h2>
          </div>
          <p className="mt-3 text-[15px] leading-relaxed text-foreground-soft">
            Schiera la tua squadra entro la mezzanotte tra giovedì e
            venerdì.
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-foreground-soft">
            Poi si gioca.
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-foreground-soft">
            A mezzanotte tra lunedì e martedì vengono caricati i risultati
            e si apre la giornata successiva.
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-foreground-soft">
            Il conto alla rovescia è sempre visibile in home e nella
            pagina del torneo.
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-foreground-soft">
            Per i casi limite — rinvii, tavolino e mancata scelta — trovi
            tutto nel{" "}
            <Link href="/play/regolamento" className="underline hover:text-accent">
              regolamento completo
            </Link>
            .
          </p>
        </section>
      </div>

      <form
        action={markTutorialSeenAction}
        className={`${card} flex flex-col items-center gap-3 text-center`}
      >
        <input type="hidden" name="next" value={next} />
        <p className="text-sm text-foreground-soft">Tutto chiaro?</p>
        <p className="text-sm text-foreground-soft">
          Questa pagina resta sempre a un click da Come funziona, nella
          tua area giocatore.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button className={button} type="submit">
            Si gioca
          </button>
          <Link href="/play/regolamento" className={buttonGhost}>
            Vedi regolamento
          </Link>
        </div>
      </form>

      <ScrollDots sections={sections} />
    </main>
  );
}
