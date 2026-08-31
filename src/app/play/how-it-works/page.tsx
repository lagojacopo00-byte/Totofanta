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
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-10">
      <Brandbar subtitle="Come funziona" />

      <div>
        <p className={eyebrow}>Prima di iniziare</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold">
          Le regole in breve
        </h1>
        <p className="mt-2 text-sm text-foreground-soft">
          Totofanta è un &quot;ultimo che resta vince&quot;: niente
          punteggi, niente formazioni. Solo una squadra a giornata, e chi
          sbaglia è fuori.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <section className={cardTight}>
          <p className={eyebrow}>1 · Le tue vite</p>
          <p className="mt-1.5 text-sm text-foreground-soft">
            Quando entri in un torneo hai una o più &quot;vite&quot;
            (qui le chiamiamo <strong className="text-foreground">slot</strong>).
            Se ne hai più di una, funzionano in modo completamente
            indipendente: puoi perderne una e continuare a giocare con le
            altre.
          </p>
        </section>

        <section className={cardTight}>
          <p className={eyebrow}>2 · Una scelta a giornata</p>
          <p className="mt-1.5 text-sm text-foreground-soft">
            Per ogni giornata di campionato ancora aperta, scegli{" "}
            <strong className="text-foreground">una squadra</strong> per
            ciascuna vita ancora viva. Se dimentichi di scegliere entro la
            chiusura della giornata, quella vita viene eliminata come se
            avesse perso.
          </p>
        </section>

        <section className={cardTight}>
          <p className={eyebrow}>3 · Vince solo chi vince davvero</p>
          <p className="mt-1.5 text-sm text-foreground-soft">
            Se la squadra che hai scelto <strong className="text-accent">vince</strong>,
            la tua vita sopravvive alla giornata successiva. Se{" "}
            <strong className="text-lose">pareggia o perde</strong>, quella
            vita è eliminata: game over solo per quello slot, non per te.
          </p>
        </section>

        <section className={cardTight}>
          <p className={eyebrow}>4 · Ogni squadra una sola volta</p>
          <p className="mt-1.5 text-sm text-foreground-soft">
            Su una stessa vita non puoi ripetere una squadra già scelta in
            precedenza: una volta usata, per quello slot è &quot;bruciata&quot;
            per il resto del torneo. Slot diversi possono invece scegliere
            anche la stessa squadra.
          </p>
        </section>

        <section className={cardTight}>
          <p className={eyebrow}>5 · Chi vince il torneo</p>
          <p className="mt-1.5 text-sm text-foreground-soft">
            Il torneo continua finché resta più di un giocatore con
            almeno una vita in gara. Quando resta un solo giocatore con
            vite ancora vive, ha vinto lui. Se una giornata elimina
            proprio tutte le vite rimaste in un colpo solo, vincono ex
            aequo tutti quelli che erano ancora in gara prima di quella
            giornata.
          </p>
        </section>

        <section className={cardTight}>
          <p className={eyebrow}>6 · Cosa trovi nell&apos;app</p>
          <p className="mt-1.5 text-sm text-foreground-soft">
            Nella pagina del torneo trovi la{" "}
            <strong className="text-foreground">classifica</strong> con
            chi è ancora vivo o eliminato, e nel menu di scelta della
            squadra vedi anche l&apos;avversario di giornata, quando
            l&apos;organizzatore lo ha inserito. È l&apos;organizzatore ad
            aprire le giornate e a inserire i risultati: a te resta solo
            scegliere bene.
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
          Ho capito, continua
        </button>
      </form>
    </main>
  );
}
