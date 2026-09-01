import Link from "next/link";
import { requirePlayer } from "@/lib/supabase/require-player";
import { cardTight, eyebrow } from "@/components/ui";
import { BackLink } from "@/components/back-link";

export default async function RegolamentoPage() {
  await requirePlayer();

  return (
    <div className="flex flex-col gap-6">
      <BackLink href="/play" label="I tuoi tornei" />

      <div>
        <p className={eyebrow}>Regole del gioco</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold sm:text-3xl">
          Regolamento
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-foreground-soft">
          La versione breve è nella pagina{" "}
          <Link href="/play/how-it-works" className="underline hover:text-accent">
            Come funziona
          </Link>
          . Qui trovi i casi particolari: rinvii, recuperi, tavolino,
          mancata scelta e come finisce davvero una giornata.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <section className={cardTight}>
          <p className={eyebrow}>Come si sopravvive a una giornata</p>
          <p className="mt-1.5 text-sm text-foreground-soft">
            Uno slot resta vivo solo se la squadra scelta{" "}
            <strong className="text-foreground">vince</strong>. Pareggio o
            sconfitta eliminano lo slot, senza eccezioni: non conta il
            piazzamento, non conta &quot;quasi&quot;, conta solo il risultato
            finale della partita.
          </p>
        </section>

        <section className={cardTight}>
          <p className={eyebrow}>Mancata scelta</p>
          <p className="mt-1.5 text-sm text-foreground-soft">
            Se uno slot arriva alla scadenza senza una squadra scelta, viene
            trattato come una sconfitta: lo slot è eliminato. Non esistono
            scelte automatiche o di riserva — è responsabilità di ognuno
            schierarsi in tempo (l&apos;organizzatore può comunque farlo per
            conto tuo, vedi più sotto).
          </p>
        </section>

        <section className={cardTight}>
          <p className={eyebrow}>Scadenze</p>
          <p className="mt-1.5 text-sm text-foreground-soft">
            Si schiera da lunedì a giovedì; il termine ultimo è{" "}
            <strong className="text-foreground">giovedì a mezzanotte</strong>.
            Da venerdì le scelte restano chiuse fino a lunedì a mezzanotte,
            quando escono i risultati della giornata e si aprono le squadre
            per quella successiva. Il conto alla rovescia in home e nella
            pagina del torneo mostra sempre quanto manca.
          </p>
        </section>

        <section className={cardTight}>
          <p className={eyebrow}>Squadre già usate</p>
          <p className="mt-1.5 text-sm text-foreground-soft">
            Ogni slot ha una propria memoria: una volta giocata, una squadra
            è bruciata per sempre su quello slot e non si può riscegliere. Gli
            slot sono indipendenti tra loro, anche quelli dello stesso
            giocatore: la stessa squadra può tornare libera su un altro slot.
          </p>
        </section>

        <section className={cardTight}>
          <p className={eyebrow}>Rinvii, recuperi e tavolino</p>
          <p className="mt-1.5 text-sm text-foreground-soft">
            Per il gioco vale solo ciò che succede nella finestra ufficiale
            della giornata, all&apos;incirca da giovedì a lunedì. Se una
            partita viene <strong className="text-foreground">rinviata</strong>{" "}
            e si gioca fuori da quella finestra (un{" "}
            <strong className="text-foreground">recupero</strong> successivo),
            per quella giornata non è valida: non conta né come vittoria né
            come sconfitta, lo slot resta vivo e la squadra scelta non si
            considera consumata — resta disponibile per una scelta futura.
            Una vittoria a{" "}
            <strong className="text-foreground">tavolino</strong> (decisa
            dagli organi del campionato, es. per forfait) conta invece come
            un risultato normale, non appena viene ufficializzata.
          </p>
        </section>

        <section className={cardTight}>
          <p className={eyebrow}>Fine giornata ed eliminazione</p>
          <p className="mt-1.5 text-sm text-foreground-soft">
            Una giornata si chiude quando l&apos;organizzatore inserisce i
            risultati delle squadre scelte: da lì lo stato di ogni slot si
            aggiorna in automatico. Un giocatore è fuori dal torneo quando
            tutti i suoi slot sono stati eliminati.
          </p>
        </section>

        <section className={cardTight}>
          <p className={eyebrow}>Chi vince il torneo</p>
          <p className="mt-1.5 text-sm text-foreground-soft">
            Si va avanti finché resta più di un giocatore in gara. Quando ne
            resta uno solo con almeno uno slot vivo, il torneo finisce e ha
            vinto lui. Se invece una giornata elimina in un colpo solo tutti
            gli slot ancora vivi, il torneo finisce comunque: vincono ex
            aequo tutti i giocatori che erano ancora in corsa prima di quella
            giornata.
          </p>
        </section>

        <section className={cardTight}>
          <p className={eyebrow}>Il ruolo dell&apos;organizzatore</p>
          <p className="mt-1.5 text-sm text-foreground-soft">
            L&apos;organizzatore apre le giornate e inserisce i risultati a
            mano. Può anche schierare, cambiare o togliere la scelta di
            qualsiasi slot in qualsiasi momento — anche oltre la scadenza di
            giovedì che vale per i giocatori — utile per chi è indietro con
            l&apos;account o per correggere un errore.
          </p>
        </section>
      </div>
    </div>
  );
}
