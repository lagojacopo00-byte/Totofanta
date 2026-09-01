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
          La versione veloce è in{" "}
          <Link href="/play/how-it-works" className="underline hover:text-accent">
            Come funziona
          </Link>
          . Qui trovi tutti i casi limite: rinvii, recuperi, tavolino,
          mancata scelta e tutte le regole che decidono davvero chi resta
          in gioco.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <section className={cardTight}>
          <p className={eyebrow}>Come si sopravvive a una giornata</p>
          <p className="mt-1.5 text-sm text-foreground-soft">
            Uno slot resta vivo solo se la squadra scelta{" "}
            <strong className="text-foreground">vince</strong>.
          </p>
          <p className="mt-1.5 text-sm text-foreground-soft">
            Pareggio o sconfitta significano eliminazione: non conta il
            piazzamento, non conta quanto ci sei andato vicino. Nel
            Totofanta conta solo una cosa: il fischio finale.
          </p>
        </section>

        <section className={cardTight}>
          <p className={eyebrow}>Mancata scelta</p>
          <p className="mt-1.5 text-sm text-foreground-soft">
            Uno slot senza una squadra scelta entro la scadenza viene
            considerato sconfitto ed eliminato.
          </p>
          <p className="mt-1.5 text-sm text-foreground-soft">
            Non esistono scelte automatiche, squadre di riserva o
            ripescaggi: scegliere in tempo è responsabilità del giocatore.
          </p>
          <p className="mt-1.5 text-sm text-foreground-soft">
            L&apos;organizzatore può comunque intervenire manualmente, come
            spiegato più sotto.
          </p>
        </section>

        <section className={cardTight}>
          <p className={eyebrow}>Scadenze</p>
          <p className="mt-1.5 text-sm text-foreground-soft">
            Si schiera da lunedì fino alla{" "}
            <strong className="text-foreground">
              mezzanotte tra giovedì e venerdì
            </strong>
            .
          </p>
          <p className="mt-1.5 text-sm text-foreground-soft">
            Da quel momento il mercato chiude fino alla chiusura della
            giornata successiva, quando vengono caricati i risultati e si
            apre il nuovo turno.
          </p>
          <p className="mt-1.5 text-sm text-foreground-soft">
            Il conto alla rovescia in home e nella pagina del torneo
            indica sempre quanto tempo rimane.
          </p>
        </section>

        <section className={cardTight}>
          <p className={eyebrow}>Squadre già usate</p>
          <p className="mt-1.5 text-sm text-foreground-soft">
            Ogni slot ha una memoria propria: una squadra giocata viene
            consumata per sempre su quello slot.
          </p>
          <p className="mt-1.5 text-sm text-foreground-soft">
            Nessuna squadra può essere scelta due volte sullo stesso slot.
          </p>
          <p className="mt-1.5 text-sm text-foreground-soft">
            Gli slot restano indipendenti tra loro: la stessa squadra può
            essere ancora disponibile su un altro slot dello stesso
            giocatore.
          </p>
        </section>

        <section className={cardTight}>
          <p className={eyebrow}>Rinvii, recuperi e tavolino</p>
          <p className="mt-1.5 text-sm text-foreground-soft">
            Conta solo quello che succede nella finestra ufficiale della
            giornata, indicativamente da giovedì a lunedì.
          </p>
          <p className="mt-1.5 text-sm text-foreground-soft">
            Una partita{" "}
            <strong className="text-foreground">rinviata</strong> e{" "}
            <strong className="text-foreground">recuperata</strong> fuori
            da questa finestra non vale per quella giornata: lo slot resta
            vivo, non viene assegnata né vittoria né sconfitta e la
            squadra scelta non viene consumata.
          </p>
          <p className="mt-1.5 text-sm text-foreground-soft">
            La squadra resta quindi disponibile per una scelta futura.
          </p>
          <p className="mt-1.5 text-sm text-foreground-soft">
            Una vittoria a{" "}
            <strong className="text-foreground">tavolino</strong> invece
            vale come un risultato reale dal momento in cui viene
            ufficializzata dagli organi competenti.
          </p>
        </section>

        <section className={cardTight}>
          <p className={eyebrow}>Fine giornata ed eliminazione</p>
          <p className="mt-1.5 text-sm text-foreground-soft">
            La giornata si chiude quando l&apos;organizzatore carica i
            risultati.
          </p>
          <p className="mt-1.5 text-sm text-foreground-soft">
            Da quel momento ogni slot viene aggiornato automaticamente.
          </p>
          <p className="mt-1.5 text-sm text-foreground-soft">
            Un giocatore viene eliminato dal torneo quando tutti i suoi
            slot sono stati eliminati.
          </p>
        </section>

        <section className={cardTight}>
          <p className={eyebrow}>Chi vince il torneo</p>
          <p className="mt-1.5 text-sm text-foreground-soft">
            Si va avanti finché resta più di un giocatore in gara.
          </p>
          <p className="mt-1.5 text-sm text-foreground-soft">
            Se rimane un solo giocatore con almeno uno slot vivo, il
            torneo finisce: ha vinto lui.
          </p>
          <p className="mt-1.5 text-sm text-foreground-soft">
            Se invece una giornata elimina contemporaneamente tutti gli
            slot ancora vivi, vincono ex aequo tutti i giocatori che erano
            ancora in corsa prima del turno.
          </p>
        </section>

        <section className={cardTight}>
          <p className={eyebrow}>Il ruolo dell&apos;organizzatore</p>
          <p className="mt-1.5 text-sm text-foreground-soft">
            L&apos;organizzatore apre le giornate e carica i risultati.
          </p>
          <p className="mt-1.5 text-sm text-foreground-soft">
            Può schierare, modificare o rimuovere la scelta di qualsiasi
            slot in qualsiasi momento, anche oltre la scadenza prevista
            per i giocatori.
          </p>
          <p className="mt-1.5 text-sm text-foreground-soft">
            Serve per gestire eventuali problemi con gli account o
            correggere errori.
          </p>
        </section>
      </div>
    </div>
  );
}
