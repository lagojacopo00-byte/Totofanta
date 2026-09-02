import Link from "next/link";
import { requirePlayer } from "@/lib/supabase/require-player";
import { cardTight, eyebrow } from "@/components/ui";
import { BackLink } from "@/components/back-link";
import { ScrollDots, type ScrollDotSection } from "@/components/scroll-dots";
import {
  ShieldIcon,
  UserXIcon,
  ClockIcon,
  RepeatOffIcon,
  CalendarArrowIcon,
  FlagIcon,
  TrophyIcon,
  UserGearIcon,
} from "@/components/rule-icons";

const sections: ScrollDotSection[] = [
  { id: "sopravvivere", label: "Come si sopravvive" },
  { id: "mancata-scelta", label: "Mancata scelta" },
  { id: "scadenze", label: "Scadenze" },
  { id: "squadre-usate", label: "Squadre già usate" },
  { id: "rinvii", label: "Rinvii e tavolino" },
  { id: "fine-giornata", label: "Fine giornata" },
  { id: "vittoria", label: "Chi vince il torneo" },
  { id: "organizzatore", label: "L'organizzatore" },
];

export default async function RegolamentoPage() {
  await requirePlayer();

  return (
    <div className="flex flex-col gap-8">
      <BackLink href="/play" label="I tuoi tornei" />

      <div>
        <p className={eyebrow}>Regole del gioco</p>
        <h1 className="mt-1.5 font-display text-3xl font-extrabold sm:text-4xl">
          Regolamento
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-foreground-soft">
          La versione veloce è in{" "}
          <Link href="/play/how-it-works" className="underline hover:text-accent">
            Come funziona
          </Link>
          . Qui trovi tutti i casi limite: rinvii, recuperi, tavolino,
          mancata scelta e tutte le regole che decidono davvero chi resta
          in gioco.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <section id="sopravvivere" className={`${cardTight} scroll-mt-24 p-5`}>
          <div className="flex items-center gap-2.5">
            <ShieldIcon className="h-5 w-5 flex-none text-accent" />
            <h2 className="font-display text-lg font-extrabold sm:text-xl">
              Come si sopravvive a una giornata
            </h2>
          </div>
          <p className="mt-3 text-[15px] leading-relaxed text-foreground-soft">
            Uno slot resta vivo solo se la squadra scelta{" "}
            <strong className="text-foreground">vince</strong>.
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-foreground-soft">
            Pareggio o sconfitta significano eliminazione: non conta il
            piazzamento, non conta quanto ci sei andato vicino. Nel
            Totofanta conta solo una cosa: il fischio finale.
          </p>
        </section>

        <section id="mancata-scelta" className={`${cardTight} scroll-mt-24 p-5`}>
          <div className="flex items-center gap-2.5">
            <UserXIcon className="h-5 w-5 flex-none text-accent" />
            <h2 className="font-display text-lg font-extrabold sm:text-xl">
              Mancata scelta
            </h2>
          </div>
          <p className="mt-3 text-[15px] leading-relaxed text-foreground-soft">
            Uno slot senza una squadra scelta entro la scadenza viene
            considerato sconfitto ed eliminato.
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-foreground-soft">
            Non esistono scelte automatiche, squadre di riserva o
            ripescaggi: scegliere in tempo è responsabilità del giocatore.
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-foreground-soft">
            L&apos;organizzatore può comunque intervenire manualmente, come
            spiegato più sotto.
          </p>
        </section>

        <section id="scadenze" className={`${cardTight} scroll-mt-24 p-5`}>
          <div className="flex items-center gap-2.5">
            <ClockIcon className="h-5 w-5 flex-none text-accent" />
            <h2 className="font-display text-lg font-extrabold sm:text-xl">
              Scadenze
            </h2>
          </div>
          <p className="mt-3 text-[15px] leading-relaxed text-foreground-soft">
            Si schiera fino al{" "}
            <strong className="text-foreground">
              calcio d&apos;inizio della prima partita
            </strong>{" "}
            di quella giornata — non un giorno fisso della settimana: ogni
            giornata ha il proprio orario, letto dal calendario Serie A
            reale.
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-foreground-soft">
            Da quel momento il mercato chiude fino alla chiusura della
            giornata stessa, quando vengono caricati i risultati e si apre
            il nuovo turno.
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-foreground-soft">
            Il conto alla rovescia nella pagina del torneo indica sempre
            quanto tempo rimane.
          </p>
        </section>

        <section id="squadre-usate" className={`${cardTight} scroll-mt-24 p-5`}>
          <div className="flex items-center gap-2.5">
            <RepeatOffIcon className="h-5 w-5 flex-none text-accent" />
            <h2 className="font-display text-lg font-extrabold sm:text-xl">
              Squadre già usate
            </h2>
          </div>
          <p className="mt-3 text-[15px] leading-relaxed text-foreground-soft">
            Ogni slot ha una memoria propria: una squadra giocata viene
            consumata per sempre su quello slot.
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-foreground-soft">
            Nessuna squadra può essere scelta due volte sullo stesso slot.
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-foreground-soft">
            Gli slot restano indipendenti tra loro: la stessa squadra può
            essere ancora disponibile su un altro slot dello stesso
            giocatore.
          </p>
        </section>

        <section id="rinvii" className={`${cardTight} scroll-mt-24 p-5`}>
          <div className="flex items-center gap-2.5">
            <CalendarArrowIcon className="h-5 w-5 flex-none text-accent" />
            <h2 className="font-display text-lg font-extrabold sm:text-xl">
              Rinvii, recuperi e tavolino
            </h2>
          </div>
          <p className="mt-3 text-[15px] leading-relaxed text-foreground-soft">
            Conta solo quello che succede nella finestra ufficiale della
            giornata, indicativamente da giovedì a lunedì.
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-foreground-soft">
            Una partita{" "}
            <strong className="text-foreground">rinviata</strong> e{" "}
            <strong className="text-foreground">recuperata</strong> fuori
            da questa finestra non vale per quella giornata: lo slot resta
            vivo, non viene assegnata né vittoria né sconfitta e la
            squadra scelta non viene consumata.
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-foreground-soft">
            La squadra resta quindi disponibile per una scelta futura.
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-foreground-soft">
            Una vittoria a{" "}
            <strong className="text-foreground">tavolino</strong> invece
            vale come un risultato reale dal momento in cui viene
            ufficializzata dagli organi competenti.
          </p>
        </section>

        <section id="fine-giornata" className={`${cardTight} scroll-mt-24 p-5`}>
          <div className="flex items-center gap-2.5">
            <FlagIcon className="h-5 w-5 flex-none text-accent" />
            <h2 className="font-display text-lg font-extrabold sm:text-xl">
              Fine giornata ed eliminazione
            </h2>
          </div>
          <p className="mt-3 text-[15px] leading-relaxed text-foreground-soft">
            La giornata si chiude quando l&apos;organizzatore carica i
            risultati.
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-foreground-soft">
            Da quel momento ogni slot viene aggiornato automaticamente.
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-foreground-soft">
            Un giocatore viene eliminato dal torneo quando tutti i suoi
            slot sono stati eliminati.
          </p>
        </section>

        <section id="vittoria" className={`${cardTight} scroll-mt-24 p-5`}>
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
            Se rimane un solo giocatore con almeno uno slot vivo, il
            torneo finisce: ha vinto lui.
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-foreground-soft">
            Se invece una giornata elimina contemporaneamente tutti gli
            slot ancora vivi, vincono ex aequo tutti i giocatori che erano
            ancora in corsa prima del turno.
          </p>
        </section>

        <section id="organizzatore" className={`${cardTight} scroll-mt-24 p-5`}>
          <div className="flex items-center gap-2.5">
            <UserGearIcon className="h-5 w-5 flex-none text-accent" />
            <h2 className="font-display text-lg font-extrabold sm:text-xl">
              Il ruolo dell&apos;organizzatore
            </h2>
          </div>
          <p className="mt-3 text-[15px] leading-relaxed text-foreground-soft">
            L&apos;organizzatore apre le giornate e carica i risultati.
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-foreground-soft">
            Può schierare, modificare o rimuovere la scelta di qualsiasi
            slot in qualsiasi momento, anche oltre la scadenza prevista
            per i giocatori.
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-foreground-soft">
            Serve per gestire eventuali problemi con gli account o
            correggere errori.
          </p>
        </section>
      </div>

      <ScrollDots sections={sections} />
    </div>
  );
}
