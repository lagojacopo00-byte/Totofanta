import type { FixtureResult } from "./types";

/** Codice competizione di Serie A su football-data.org (v4). Verificato
 * via ricerca e via chiamata reale all'API. */
export const SERIE_A_COMPETITION_CODE = "SA";

/** football-data.org numera la stagione con l'anno di inizio (2026/2027
 * -> 2026), come i seed in supabase/schema.sql. Da aggiornare ogni estate. */
export const CURRENT_SEASON = 2026;

const API_BASE_URL = "https://api.football-data.org/v4";

export interface ApiFixture {
  round: number;
  homeTeamName: string;
  awayTeamName: string;
  kickoffAt: string;
  finished: boolean;
  result: FixtureResult | null;
}

// Intervallo Unicode dei segni diacritici combinanti (U+0300-U+036F),
// costruito da codepoint numerici invece che da un carattere letterale nel
// sorgente: più a prova di problemi di codifica del file.
const COMBINING_DIACRITICS = new RegExp(
  `[${String.fromCharCode(0x0300)}-${String.fromCharCode(0x036f)}]`,
  "g"
);

/** Normalizza un nome squadra per il confronto: minuscolo, senza accenti,
 * senza i prefissi societari più comuni ("AC Milan" / "AS Roma" / "US
 * Sassuolo" / "SSC Napoli" / "Hellas Verona" -> solo il nome "di tutti i
 * giorni"). Serve perché non è garantito che il fornitore dati usi
 * esattamente gli stessi nomi salvati in teams.name — meglio un confronto
 * tollerante che un elenco di alias scritto a mano e sicuramente
 * incompleto/sbagliato alla prima stagione in cui una squadra cambia
 * denominazione ufficiale. Verificato contro i nomi reali di
 * football-data.org (es. "FC Internazionale Milano", "Genoa CFC", "Parma
 * Calcio 1913"): il confronto "contiene" sotto copre anche i suffissi
 * societari/anno di fondazione che questo elenco di prefissi non toglie. */
export function normalizeTeamName(name: string): string {
  return name
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS, "")
    .toLowerCase()
    .replace(/^(ac|as|us|ss|ssc|acf|fc|hellas|calcio)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Fa combaciare un nome squadra ricevuto dall'API con uno dei nomi
 * conosciuti (teams.name in Serie A). Prima un confronto esatto (dopo
 * normalizzazione), poi un confronto "contiene" in entrambe le direzioni
 * come ripiego. Ritorna null se nessuno combacia: il chiamante deve
 * segnalarlo (mai fallire in silenzio, vedi i bug RLS di oggi). */
export function matchTeamName(
  apiName: string,
  knownNames: string[]
): string | null {
  const normalizedApi = normalizeTeamName(apiName);
  for (const known of knownNames) {
    if (normalizeTeamName(known) === normalizedApi) return known;
  }
  for (const known of knownNames) {
    const normalizedKnown = normalizeTeamName(known);
    if (
      normalizedApi.includes(normalizedKnown) ||
      normalizedKnown.includes(normalizedApi)
    ) {
      return known;
    }
  }
  return null;
}

interface RawMatch {
  utcDate: string;
  status: string;
  matchday: number | null;
  homeTeam: { name: string };
  awayTeam: { name: string };
  score: {
    fullTime: { home: number | null; away: number | null };
  };
}

function parseRawMatch(raw: RawMatch): ApiFixture | null {
  if (raw.matchday === null) return null;

  const finished = raw.status === "FINISHED" || raw.status === "AWARDED";
  const { home, away } = raw.score.fullTime;
  let result: FixtureResult | null = null;
  if (finished && home !== null && away !== null) {
    result = home > away ? "home_win" : home < away ? "away_win" : "draw";
  }

  return {
    round: raw.matchday,
    homeTeamName: raw.homeTeam.name,
    awayTeamName: raw.awayTeam.name,
    kickoffAt: raw.utcDate,
    finished,
    result,
  };
}

/** Scarica tutti gli accoppiamenti della stagione (una sola chiamata:
 * l'endpoint /matches filtrato per competizione+stagione restituisce
 * l'intero campionato, andata e ritorno) da football-data.org. Richiede
 * un token gratuito da football-data.org (piano free registrato: 10
 * richieste/minuto).
 *
 * ATTENZIONE ritardo: verificato con una chiamata reale il 2026-09-02 —
 * il piano gratuito aggiorna gli esiti con un sincronismo periodico (circa
 * una volta al giorno), non partita per partita appena finisce. Tutte le
 * partite già giocate avevano lo stesso identico `lastUpdated`, e
 * l'ultima partita finita (la sera prima) è comparsa nel sistema solo
 * ~28 ore dopo. Gli orari (kickoff) invece non hanno questo problema:
 * sono noti in anticipo e non "in ritardo" nello stesso senso. Deciso con
 * l'utente: sincronizzare comunque anche i risultati nonostante il
 * ritardo — la giornata si chiuderà con ~1 giorno di ritardo se nessuno
 * inserisce il risultato a mano nel frattempo (resta possibile farlo,
 * vedi setFixtureResultAction). */
export async function fetchSerieAFixtures(
  apiToken: string,
  season: number = CURRENT_SEASON
): Promise<ApiFixture[]> {
  const url = `${API_BASE_URL}/competitions/${SERIE_A_COMPETITION_CODE}/matches?season=${season}`;
  const res = await fetch(url, {
    headers: { "X-Auth-Token": apiToken },
    // I dati non sono comunque "live" (vedi ritardo sopra), ma mai
    // servire una risposta cache di Next.js qui: "sincronizza ora" deve
    // sempre riflettere l'ultimo stato noto all'API, non uno vecchio.
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(
      `football-data.org ha risposto ${res.status}: ${await res.text()}`
    );
  }

  const body = (await res.json()) as { matches: RawMatch[] };

  return body.matches
    .map(parseRawMatch)
    .filter((f): f is ApiFixture => f !== null);
}
