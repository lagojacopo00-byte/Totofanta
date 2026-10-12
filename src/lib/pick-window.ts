// Scadenza per schierare gli slot di una giornata: NON più un orario fisso
// di calendario (era giovedì 23:59) — deciso con l'utente il 2026-09-02
// (spec funzionale via messaggi vocali, punto 2) — ma l'orario reale del
// primo calcio d'inizio di quella giornata specifica, letto dal
// calendario Serie A sincronizzato (serie_a_fixtures.kickoff_at). Ogni
// giornata ha quindi una scadenza diversa, calcolata sul momento invece
// che assunta dal giorno della settimana. Usato sia per il conto alla
// rovescia mostrato ai giocatori (vedi src/components/pick-countdown.tsx)
// sia — qui — come regola effettiva applicata server-side in
// submitPicksAction.

export interface FixtureForDeadline {
  kickoff_at: string | null;
  home_team: string;
  away_team: string;
}

/**
 * Alcune partite arrivano dal calendario con la sola DATA, senza orario:
 * football-data.org (e il sync) le salva come mezzanotte UTC esatta
 * (T00:00:00Z, cioè le 02:00 italiane — orario in cui in Serie A non si
 * gioca mai). Quel valore NON è un calcio d'inizio reale: trattarlo come
 * tale chiudeva le scelte la domenica alle 02:00, a weekend già iniziato
 * (scoperto il 2026-10-12 sulle giornate 6 e 7).
 */
export function isPlaceholderKickoff(kickoffAt: string | Date): boolean {
  const d = typeof kickoffAt === "string" ? new Date(kickoffAt) : kickoffAt;
  if (Number.isNaN(d.getTime())) return false;
  return (
    d.getUTCHours() === 0 &&
    d.getUTCMinutes() === 0 &&
    d.getUTCSeconds() === 0 &&
    d.getUTCMilliseconds() === 0
  );
}

const ROME_TZ = "Europe/Rome";
const FALLBACK_HOUR = 18;
const FALLBACK_MINUTE = 30;
const FRIDAY = 5;

/** Differenza (ms) tra l'ora di Roma e UTC in un dato istante. */
function romeOffsetMs(at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: ROME_TZ,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second")
  );
  return asUtc - Math.floor(at.getTime() / 1000) * 1000;
}

/** L'istante UTC corrispondente a un'ora "a muro" di Roma. */
function romeWallTimeToDate(y: number, m: number, d: number, h: number, mi: number): Date {
  const guess = Date.UTC(y, m, d, h, mi);
  let result = guess - romeOffsetMs(new Date(guess));
  result = guess - romeOffsetMs(new Date(result));
  return new Date(result);
}

/**
 * Scadenza di ripiego per una giornata in cui NESSUNA partita non esclusa
 * ha ancora un orario vero (solo la data): venerdì alle 18:30 di Roma
 * della settimana della partita con la data più vicina. È il peggior caso
 * plausibile (anticipo del venerdì): meglio chiudere un po' presto che
 * tenere aperto fin dopo il primo fischio. Quando il calendario avrà gli
 * orari veri, la scadenza torna quella reale. Questa stessa regola è
 * replicata in SQL (public.pick_deadline in
 * supabase/add_pick_lock_and_history.sql): tenerle allineate.
 */
function fallbackDeadline(placeholderDates: Date[]): Date {
  const first = placeholderDates.reduce((a, b) => (a.getTime() <= b.getTime() ? a : b));
  // La data del segnaposto è la data UTC (00:00Z = giorno del calendario).
  const day = Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), first.getUTCDate());
  const back = (new Date(day).getUTCDay() - FRIDAY + 7) % 7;
  const friday = new Date(day - back * 24 * 60 * 60 * 1000);
  return romeWallTimeToDate(
    friday.getUTCFullYear(),
    friday.getUTCMonth(),
    friday.getUTCDate(),
    FALLBACK_HOUR,
    FALLBACK_MINUTE
  );
}

/**
 * La scadenza per schierare: l'orario del PRIMO calcio d'inizio tra le
 * partite non escluse di questa giornata (una partita esclusa a mano, o
 * rinviata fuori dalla finestra ufficiale, non conta per la scadenza:
 * non è comunque giocabile). Gli orari segnaposto (solo data, vedi
 * isPlaceholderKickoff) non contano come calcio d'inizio: se TUTTE le
 * partite non escluse hanno solo la data si usa la scadenza di ripiego
 * (venerdì 18:30 Roma). Ritorna null solo se nessuna partita non esclusa
 * ha nemmeno una data — in quel caso le scelte restano aperte, perché
 * non c'è niente a cui ancorare la chiusura.
 */
export function computePickDeadline(
  fixtures: FixtureForDeadline[],
  excludedTeamNames: Set<string>
): Date | null {
  const dates = fixtures
    .filter(
      (f) =>
        !excludedTeamNames.has(f.home_team) && !excludedTeamNames.has(f.away_team)
    )
    .map((f) => (f.kickoff_at ? new Date(f.kickoff_at) : null))
    .filter((d): d is Date => d !== null && !Number.isNaN(d.getTime()));

  const real = dates.filter((d) => !isPlaceholderKickoff(d));
  if (real.length > 0) return new Date(Math.min(...real.map((d) => d.getTime())));
  if (dates.length === 0) return null;
  return fallbackDeadline(dates);
}

export function isPickingWindowOpen(
  deadline: Date | null,
  now: Date = new Date()
): boolean {
  if (!deadline) return true;
  return now.getTime() < deadline.getTime();
}

/**
 * Approssimazione di quando riapre lo schieramento per la prossima
 * giornata, per il conto alla rovescia mostrato nella home mentre si
 * aspettano i risultati (vedi src/components/matchday-reopen-countdown.tsx):
 * la mezzanotte di lunedì di chiusura della giornata in corso, cioè le
 * 00:00 del martedì successivo alla scadenza di schieramento — la
 * finestra ufficiale delle partite è ven-sab-dom-lun (vedi
 * src/lib/match-window.ts), quindi il lunedì finisce quando inizia il
 * martedì. È solo un'indicazione di calendario: non segue la chiusura
 * reale per mano dell'organizzatore, che può avvenire prima o dopo.
 */
export function computeNextRoundReopenAt(pickDeadline: Date): Date {
  const target = new Date(pickDeadline);
  target.setHours(0, 0, 0, 0);
  const TUESDAY = 2;
  let daysToAdd = (TUESDAY - target.getDay() + 7) % 7;
  if (daysToAdd === 0) daysToAdd = 7;
  target.setDate(target.getDate() + daysToAdd);
  return target;
}
