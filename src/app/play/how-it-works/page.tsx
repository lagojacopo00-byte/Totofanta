import Link from "next/link";
import { requirePlayer } from "@/lib/supabase/require-player";
import { Brandbar } from "@/components/brandbar";
import { button, card, cardTight, eyebrow } from "@/components/ui";
import { markTutorialSeenAction } from "./actions";

export default async function HowItWorksPage(
  props: PageProps<"/play/how-it-works">
) {
  const params = await props.searchParams;
  const next = typeof params.next === "string" ? params.next : "/play";

  await requirePlayer(`/play/how-it-works?next=${encodeURIComponent(next)}`);

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-5 px-4 py-8 sm:px-6 sm:py-10">
      <Brandbar subtitle="Come funziona" />

      <div>
        <p className={eyebrow}>Il gioco</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold leading-tight">
          Una giornata, una scelta. Sbagli e sei fuori.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-foreground-soft">
          Totofanta segue le partite vere del campionato. Ogni giornata
          scegli la squadra che pensi vincerà. Vince davvero? Resti in
          corsa. Pareggia o perde? Sei eliminato — zero scuse, come nel
          calcio vero. Chi resiste più a lungo entra nella storia del
          torneo.
        </p>
      </div>

      <section className={`${card} border-accent/30`}>
        <p className={eyebrow}>Con gli amici, per la gloria</p>
        <p className="mt-2 text-sm leading-relaxed text-foreground-soft">
          Crea un torneo, invita chi vuoi e — se decidete voi — mettete
          in palio un premio vero. Chi tiene in vita la propria squadra
          più a lungo si guadagna il trofeo (e il diritto di vanteria per
          un anno intero).
        </p>
      </section>

      <div className="flex flex-col gap-3">
        <section className={cardTight}>
          <p className={eyebrow}>Le tue vite</p>
          <p className="mt-1.5 text-sm text-foreground-soft">
            Hai una o più vite indipendenti (gli <strong className="text-foreground">slot</strong>):
            perderne una non ti butta fuori dalle altre. Su ogni vita non
            puoi ripetere una squadra già scelta: una volta giocata, è
            bruciata per sempre su quello slot.
          </p>
        </section>

        <section className={cardTight}>
          <p className={eyebrow}>Chi vince il torneo</p>
          <p className="mt-1.5 text-sm text-foreground-soft">
            Si va avanti finché c&apos;è più di un giocatore in gara.
            Resta uno solo con vite ancora vive? Ha vinto lui. Se una
            giornata elimina tutti insieme, vincono ex aequo tutti quelli
            che erano ancora in corsa prima.
          </p>
        </section>

        <section className={cardTight}>
          <p className={eyebrow}>Nell&apos;app trovi</p>
          <p className="mt-1.5 text-sm text-foreground-soft">
            La classifica di chi è vivo o eliminato, e l&apos;avversario
            di giornata per ogni squadra scelta. Le giornate le apre
            l&apos;organizzatore, che inserisce anche i risultati.
          </p>
        </section>

        <section className={cardTight}>
          <p className={eyebrow}>Il ritmo della settimana</p>
          <p className="mt-1.5 text-sm text-foreground-soft">
            Scegli la squadra entro giovedì. Da venerdì le scelte sono
            chiuse: lunedì a mezzanotte escono i risultati e si aprono le
            squadre per la giornata successiva. Nella tua home e nella
            pagina del torneo trovi sempre il conto alla rovescia. Per i
            casi particolari (rinvii, tavolino, mancata scelta) c&apos;è il{" "}
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
        <p className="text-sm text-foreground-soft">
          Tutto chiaro? Puoi rivedere questa pagina quando vuoi dal link
          &quot;Come funziona&quot; nell&apos;area giocatore.
        </p>
        <button className={button} type="submit">
          Si comincia
        </button>
      </form>
    </main>
  );
}
