import { TeamBadge } from "@/components/team-badge";
import { card, cardTight, eyebrow, pillAlive, pillOut } from "@/components/ui";

export type RecapSlotStatus = "alive" | "eliminated" | "pending" | "exempt";

export interface RecapSlot {
  id: string;
  label: string;
  homeTeam: string;
  awayTeam: string;
  pickedTeam: string;
  /** Calcio d'inizio della partita della squadra schierata, ISO come
   * salvato su `serie_a_fixtures.kickoff_at` — null se non ancora noto. */
  kickoffAt: string | null;
  result: "home_win" | "draw" | "away_win" | null;
  status: RecapSlotStatus;
}

const statusLabel: Record<RecapSlotStatus, string> = {
  alive: "Vivo",
  eliminated: "Eliminato",
  pending: "In corso",
  exempt: "Esente",
};

const pillPending =
  "inline-flex items-center rounded-full border border-line bg-surface px-2.5 py-1 font-mono text-xs text-foreground-faint";

function statusPillClass(status: RecapSlotStatus): string {
  if (status === "alive" || status === "exempt") return pillAlive;
  if (status === "eliminated") return pillOut;
  return pillPending;
}

// Giorno e ora del calcio d'inizio, es. "dom 13 set, 15:00". Fuso fissato
// su Europe/Rome di proposito: questa sezione è renderizzata lato server
// (su Vercel il fuso di sistema è UTC) e `kickoff_at` è un timestamptz,
// quindi senza `timeZone` un 15:00 italiano verrebbe mostrato "13:00".
// Le partite sono di Serie A e i giocatori sono in Italia: l'ora giusta
// da mostrare è sempre quella italiana.
const kickoffFormat = new Intl.DateTimeFormat("it-IT", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Rome",
});

function kickoffLabel(kickoffAt: string | null): string {
  if (!kickoffAt) return "data da confermare";
  const date = new Date(kickoffAt);
  if (Number.isNaN(date.getTime())) return "data da confermare";
  return kickoffFormat.format(date);
}

/** Esito della partita, solo se già noto: a partita ancora in corso lo
 * dice già la pillola di stato dello slot, ripeterlo sarebbe rumore. */
function resultLabel(slot: RecapSlot): string | null {
  if (!slot.result) return null;
  if (slot.result === "draw") return "pareggio";
  return `ha vinto ${slot.result === "home_win" ? slot.homeTeam : slot.awayTeam}`;
}

/**
 * Riepilogo della giornata aperta, uno slot dello schierato dal
 * giocatore. Ogni riga è centrata sulla SQUADRA SCELTA da quello slot
 * (badge cerchiato di verde e nome per esteso), non sulla partita in
 * quanto tale: l'avversaria compare sotto, sbiadita, insieme a
 * casa/trasferta e a giorno e ora del calcio d'inizio — chiesto
 * dall'utente il 2026-09-12, che dal solo accostamento dei due badge non
 * capiva quale delle due squadre avesse schierato né quando giocasse.
 * Anche se due slot hanno scelto la stessa squadra, ognuno compare
 * separatamente con il proprio stato (deciso con l'utente: "se avevo due
 * slot sull'Inter e l'Inter perde, entrambi eliminati").
 * Progressivo: uno slot la cui partita non è ancora finita resta "In
 * corso" finché non arriva il risultato, senza aspettare che TUTTA la
 * giornata sia completa (a differenza dell'eliminazione vera e propria,
 * che invece aspetta sempre la giornata intera — vedi
 * tryFinalizeRoundEverywhere in src/lib/queries.ts). Solo gli slot con
 * una scelta per questa giornata compaiono: niente slot già eliminati in
 * precedenza, che qui non hanno nulla da mostrare.
 */
export function MatchdayRecap({
  matchdayNumber,
  slots,
}: {
  matchdayNumber: number;
  slots: RecapSlot[];
}) {
  if (slots.length === 0) return null;

  return (
    <section className={`${card} flex flex-col gap-3`}>
      <div>
        <p className={eyebrow}>Giornata {matchdayNumber} · riepilogo</p>
        <p className="mt-1 text-xs text-foreground-faint">
          Cerchiata in verde la squadra che hai schierato, sbiadita
          l&apos;avversaria.
        </p>
      </div>
      <ul className="flex flex-col gap-2">
        {slots.map((slot) => {
          const isHome = slot.pickedTeam === slot.homeTeam;
          const opponent = isHome ? slot.awayTeam : slot.homeTeam;
          const result = resultLabel(slot);
          return (
            <li key={slot.id} className={`${cardTight} flex flex-col gap-2`}>
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex-none rounded-full border border-line bg-surface px-2 py-0.5 font-mono text-[10px] text-foreground-faint">
                  {slot.label}
                </span>
                <span className="inline-flex flex-none rounded-full ring-2 ring-accent ring-offset-2 ring-offset-surface-2">
                  <TeamBadge name={slot.pickedTeam} size="sm" />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                  {slot.pickedTeam}
                </span>
                <span className={`flex-none ${statusPillClass(slot.status)}`}>
                  {statusLabel[slot.status]}
                </span>
              </div>
              <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-foreground-faint">
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <span className="inline-flex flex-none opacity-40 grayscale">
                    <TeamBadge name={opponent} size="xs" />
                  </span>
                  <span className="min-w-0 truncate">
                    {isHome ? "in casa con" : "in trasferta con"} {opponent}
                  </span>
                </span>
                <span aria-hidden="true">·</span>
                <span className="whitespace-nowrap">{kickoffLabel(slot.kickoffAt)}</span>
                {result ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="whitespace-nowrap">{result}</span>
                  </>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
