import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  applyMatchdayResults,
  teamsAvailableForSlot,
  type AliveSlot,
  type MatchdayPick,
  type Outcome as GameOutcome,
} from "./game-logic";
import { isWithinMatchWindow } from "./match-window";
import type {
  Fixture,
  FixtureStatus,
  Matchday,
  MatchdayResult,
  Pick,
  Player,
  Slot,
  Team,
  Tournament,
} from "./types";

// Le funzioni qui sotto accettano un client Supabase già pronto (quello
// dell'organizzatore autenticato, o quello service-role per le pagine dei
// giocatori) così la stessa logica funziona per entrambi i casi.
// Non essendoci uno schema generato, i client sono tipati genericamente.
type DB = SupabaseClient;

function slotLabels(n: number): string[] {
  return Array.from({ length: n }, (_, i) => String(i + 1));
}

function assertNoError<T>(result: { data: T; error: unknown }): T {
  if (result.error) {
    throw new Error(
      typeof result.error === "object" &&
      result.error !== null &&
      "message" in result.error
        ? String((result.error as { message: unknown }).message)
        : "Errore Supabase"
    );
  }
  return result.data;
}

export async function getOrganizerTournaments(db: DB, ownerId: string) {
  const res = await db
    .from("tournaments")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });
  return assertNoError(res) as Tournament[];
}

export async function createTournament(
  db: DB,
  ownerId: string,
  input: {
    name: string;
    competition: string;
    default_num_slots: number;
    is_test?: boolean;
    slot_value?: number;
  }
) {
  const res = await db
    .from("tournaments")
    .insert({
      owner_id: ownerId,
      name: input.name,
      competition: input.competition,
      default_num_slots: input.default_num_slots,
      is_test: input.is_test ?? false,
      slot_value: input.slot_value ?? 0,
    })
    .select("*")
    .single();
  return assertNoError(res) as Tournament;
}

export async function getTournament(db: DB, tournamentId: string) {
  const res = await db
    .from("tournaments")
    .select("*")
    .eq("id", tournamentId)
    .single();
  return assertNoError(res) as Tournament;
}

/** Cancella un torneo e tutto ciò che dipende da lui (giocatori, slot,
 * giornate, scelte, risultati, squadre custom): tutte le foreign key
 * verso `tournaments` sono `on delete cascade`, quindi basta questa. */
export async function deleteTournament(db: DB, tournamentId: string) {
  assertNoError(await db.from("tournaments").delete().eq("id", tournamentId));
}

export async function getPlayersWithSlots(db: DB, tournamentId: string) {
  const res = await db
    .from("players")
    .select("*, slots(*)")
    .eq("tournament_id", tournamentId)
    .order("created_at", { ascending: true });
  return assertNoError(res) as (Player & { slots: Slot[] })[];
}

export async function getMatchdays(db: DB, tournamentId: string) {
  const res = await db
    .from("matchdays")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("number", { ascending: true });
  return assertNoError(res) as Matchday[];
}

export async function getMatchday(db: DB, matchdayId: string) {
  const res = await db
    .from("matchdays")
    .select("*")
    .eq("id", matchdayId)
    .single();
  return assertNoError(res) as Matchday;
}

export async function getTeamsByIds(db: DB, ids: string[]) {
  if (ids.length === 0) return [] as Team[];
  const res = await db.from("teams").select("*").in("id", ids);
  return assertNoError(res) as Team[];
}

/** L'elenco di riferimento delle squadre di una competizione (es. tutta
 * la Serie A), a prescindere da un torneo specifico — per la pagina di
 * amministrazione del calendario. */
export async function getReferenceTeams(db: DB, competition: string) {
  const res = await db
    .from("teams")
    .select("*")
    .eq("competition", competition)
    .is("tournament_id", null)
    .order("name", { ascending: true });
  return assertNoError(res) as Team[];
}

export async function getPicksForSlot(db: DB, slotId: string) {
  const res = await db.from("picks").select("*").eq("slot_id", slotId);
  return assertNoError(res) as Pick[];
}

export async function getAvailableTeams(
  db: DB,
  tournamentId: string,
  competition: string
) {
  const res = await db
    .from("teams")
    .select("*")
    .or(`tournament_id.eq.${tournamentId},competition.eq.${competition}`)
    .order("name", { ascending: true });
  return assertNoError(res) as Team[];
}

/** Aggiunge una squadra "su misura" per un torneo specifico: usata quando
 * la competizione non è la Serie A precaricata (o comunque manca qualche
 * squadra) e l'organizzatore deve popolare a mano l'elenco delle squadre
 * selezionabili dai giocatori. */
export async function addTeamToTournament(
  db: DB,
  tournamentId: string,
  competition: string,
  name: string
) {
  const res = await db
    .from("teams")
    .insert({ tournament_id: tournamentId, competition, name: name.trim() })
    .select("*")
    .single();
  return assertNoError(res) as Team;
}

/** Toglie una squadra aggiunta a mano per questo torneo (non tocca mai le
 * squadre di riferimento condivise, quelle con tournament_id nullo). */
export async function removeTeamFromTournament(
  db: DB,
  tournamentId: string,
  teamId: string
) {
  assertNoError(
    await db
      .from("teams")
      .delete()
      .eq("id", teamId)
      .eq("tournament_id", tournamentId)
  );
}

export async function addPlayer(
  db: DB,
  tournament: Tournament,
  input: { displayName: string; email: string; numSlots: number }
) {
  const player = assertNoError(
    await db
      .from("players")
      .insert({
        tournament_id: tournament.id,
        display_name: input.displayName,
        email: input.email.trim().toLowerCase(),
        num_slots: input.numSlots,
      })
      .select("*")
      .single()
  ) as Player;

  const labels = slotLabels(input.numSlots);
  const slotsRes = await db
    .from("slots")
    .insert(labels.map((label) => ({ player_id: player.id, label })))
    .select("*");
  const slots = assertNoError(slotsRes) as Slot[];

  return { ...player, slots };
}

/**
 * Toglie del tutto un giocatore da un torneo (e i suoi slot/pick a
 * cascata). Da chiamare solo mentre il torneo è ancora "draft" — è il
 * chiamante (vedi le Server Actions) a doverlo verificare.
 */
export async function removePlayer(db: DB, playerId: string) {
  assertNoError(await db.from("players").delete().eq("id", playerId));
}

/**
 * Cambia il numero di slot di un giocatore GIÀ creato, aggiungendo o
 * togliendo righe in `slots` per farlo combaciare col nuovo totale. Da
 * chiamare solo mentre il torneo è ancora "draft" (nessuna giornata è mai
 * stata aperta): è il chiamante (vedi le Server Actions) a doverlo
 * verificare, qui sotto si assume già valido.
 */
export async function updatePlayerNumSlots(
  db: DB,
  playerId: string,
  newNumSlots: number
) {
  const currentSlots = assertNoError(
    await db.from("slots").select("*").eq("player_id", playerId)
  ) as Slot[];

  const targetLabels = new Set(slotLabels(newNumSlots));
  const currentLabels = new Set(currentSlots.map((s) => s.label));

  const labelsToAdd = [...targetLabels].filter((l) => !currentLabels.has(l));
  const idsToRemove = currentSlots
    .filter((s) => !targetLabels.has(s.label))
    .map((s) => s.id);

  if (idsToRemove.length > 0) {
    assertNoError(await db.from("slots").delete().in("id", idsToRemove));
  }
  if (labelsToAdd.length > 0) {
    assertNoError(
      await db
        .from("slots")
        .insert(labelsToAdd.map((label) => ({ player_id: playerId, label })))
    );
  }

  assertNoError(
    await db
      .from("players")
      .update({ num_slots: newNumSlots })
      .eq("id", playerId)
  );
}

/** Crea la prossima giornata (aperta) e, se il torneo era ancora "draft",
 * lo porta ad "active". */
export async function createNextMatchday(db: DB, tournament: Tournament) {
  const existing = await getMatchdays(db, tournament.id);
  const nextNumber = existing.length > 0
    ? Math.max(...existing.map((m) => m.number)) + 1
    : 1;

  const matchday = assertNoError(
    await db
      .from("matchdays")
      .insert({ tournament_id: tournament.id, number: nextNumber })
      .select("*")
      .single()
  ) as Matchday;

  if (tournament.status === "draft") {
    await db
      .from("tournaments")
      .update({ status: "active" })
      .eq("id", tournament.id);
  }

  return matchday;
}

export async function getPicksForMatchday(db: DB, matchdayId: string) {
  const res = await db.from("picks").select("*").eq("matchday_id", matchdayId);
  return assertNoError(res) as Pick[];
}

export async function getAllPicksForTournamentSlots(
  db: DB,
  slotIds: string[]
) {
  if (slotIds.length === 0) return [] as Pick[];
  const res = await db.from("picks").select("*").in("slot_id", slotIds);
  return assertNoError(res) as Pick[];
}

export async function submitPick(
  db: DB,
  slotId: string,
  matchdayId: string,
  teamId: string
) {
  const res = await db
    .from("picks")
    .upsert(
      { slot_id: slotId, matchday_id: matchdayId, team_id: teamId },
      { onConflict: "slot_id,matchday_id" }
    )
    .select("*")
    .single();
  return assertNoError(res) as Pick;
}

/** Toglie una scelta specifica (usata dall'organizzatore per liberare uno
 * slot su una giornata, es. per lasciare che scelga un'altra squadra). */
export async function deletePick(db: DB, slotId: string, matchdayId: string) {
  assertNoError(
    await db
      .from("picks")
      .delete()
      .eq("slot_id", slotId)
      .eq("matchday_id", matchdayId)
  );
}

export async function getMatchdayResults(db: DB, matchdayId: string) {
  const res = await db
    .from("matchday_results")
    .select("*")
    .eq("matchday_id", matchdayId);
  return assertNoError(res) as MatchdayResult[];
}

/**
 * Il cuore lato server del regolamento: applica i risultati inseriti
 * dall'organizzatore per una giornata, aggiorna gli slot, e se il torneo
 * finisce (vittoria o spareggio ex aequo) lo marca come tale; altrimenti
 * apre automaticamente la giornata successiva.
 */
export async function submitMatchdayResults(
  db: DB,
  tournament: Tournament,
  matchday: Matchday,
  outcomesByTeam: Record<string, GameOutcome>
) {
  const players = await getPlayersWithSlots(db, tournament.id);
  const aliveSlotsBefore: AliveSlot[] = players.flatMap((p) =>
    p.slots
      .filter((s) => s.status === "alive")
      .map((s) => ({ slotId: s.id, playerId: p.id }))
  );

  const picks = await getPicksForMatchday(db, matchday.id);
  const picksForLogic: MatchdayPick[] = picks.map((p) => ({
    slotId: p.slot_id,
    teamId: p.team_id,
  }));

  // Partite segnate "escluse" per questa giornata (rinvio fuori finestra,
  // tavolino non ancora deciso, ecc.): chi le aveva scelte resta vivo senza
  // che conti né come vittoria né come sconfitta — vedi
  // docs/02_Regole_gioco.md ("Stato partita valida/esclusa").
  const excludedNames = await getExcludedTeamNames(db, matchday.number);
  let exemptSlotIds: string[] = [];
  if (excludedNames.size > 0) {
    const pickedTeamIds = Array.from(new Set(picks.map((p) => p.team_id)));
    const pickedTeams = await getTeamsByIds(db, pickedTeamIds);
    const excludedTeamIds = new Set(
      pickedTeams.filter((t) => excludedNames.has(t.name)).map((t) => t.id)
    );
    exemptSlotIds = picks
      .filter((p) => excludedTeamIds.has(p.team_id))
      .map((p) => p.slot_id);
  }

  const result = applyMatchdayResults({
    aliveSlotsBefore,
    picks: picksForLogic,
    outcomesByTeam,
    exemptSlotIds,
  });

  // Salva i risultati per squadra (per audit / storico).
  const resultRows = Object.entries(outcomesByTeam).map(([teamId, outcome]) => ({
    matchday_id: matchday.id,
    team_id: teamId,
    outcome,
  }));
  if (resultRows.length > 0) {
    assertNoError(
      await db
        .from("matchday_results")
        .upsert(resultRows, { onConflict: "matchday_id,team_id" })
    );
  }

  // Elimina gli slot che non sono sopravvissuti.
  const eliminatedSlotIds = result.slotOutcomes
    .filter((o) => !o.survived)
    .map((o) => o.slotId);
  if (eliminatedSlotIds.length > 0) {
    assertNoError(
      await db
        .from("slots")
        .update({ status: "eliminated", eliminated_matchday: matchday.number })
        .in("id", eliminatedSlotIds)
    );
  }

  // Libera di nuovo le squadre degli slot esentati: la partita esclusa non
  // conta, quindi "non si considera usata" (vedi regolamento).
  if (exemptSlotIds.length > 0) {
    await Promise.all(
      exemptSlotIds.map((slotId) => deletePick(db, slotId, matchday.id))
    );
  }

  assertNoError(
    await db
      .from("matchdays")
      .update({ status: "completed" })
      .eq("id", matchday.id)
  );

  if (result.tournamentFinished) {
    assertNoError(
      await db
        .from("tournaments")
        .update({
          status: "finished",
          decisive_matchday: matchday.number,
          winners: result.winners,
        })
        .eq("id", tournament.id)
    );
  } else {
    await createNextMatchday(db, { ...tournament, status: "active" });
  }

  return result;
}

export async function getResultsForMatchdays(db: DB, matchdayIds: string[]) {
  if (matchdayIds.length === 0) return [] as MatchdayResult[];
  const res = await db
    .from("matchday_results")
    .select("*")
    .in("matchday_id", matchdayIds);
  return assertNoError(res) as MatchdayResult[];
}

/**
 * Da chiamare ad ogni accesso di un giocatore: aggancia il suo account a
 * qualunque invito ancora "orfano" con la stessa email (vedi la policy
 * "a player claims their own pending invite" nello schema). Idempotente:
 * non fa nulla se non ci sono inviti in sospeso per quella email.
 */
export async function claimPendingInvites(
  db: DB,
  userId: string,
  email: string
) {
  const res = await db
    .from("players")
    .update({ user_id: userId })
    .eq("email", email.trim().toLowerCase())
    .is("user_id", null)
    .select("id");
  return assertNoError(res) as { id: string }[];
}

/** Tutti i tornei in cui questo account gioca (non li organizza), con lo
 * stato dei propri slot per ciascuno — per l'anteprima nella home
 * ("quanti slot ho ancora vivi in questo torneo"). */
export async function getPlayerMemberships(db: DB, userId: string) {
  const res = await db
    .from("players")
    .select("*, tournaments(*), slots(id, status)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return assertNoError(res) as (Player & {
    tournaments: Tournament;
    slots: Slot[];
  })[];
}

/**
 * Anteprima pubblica (nome, competizione, slot di default) di un torneo
 * ancora "draft", per la pagina di invito — usa una funzione del database
 * perché chi non fa ancora parte del torneo non potrebbe altrimenti
 * leggere la riga in `tournaments` (RLS). Torna `null` se l'id non esiste
 * o il torneo è già iniziato.
 */
export async function getTournamentInvitePreview(db: DB, tournamentId: string) {
  const res = await db.rpc("tournament_invite_preview", {
    check_tournament_id: tournamentId,
  });
  const rows = assertNoError(res) as {
    name: string;
    competition: string;
    default_num_slots: number;
  }[];
  return rows[0] ?? null;
}

/**
 * Un giocatore si iscrive DA SOLO a un torneo (link di invito), invece di
 * essere aggiunto dall'organizzatore: stessa logica di `addPlayer`, ma con
 * `user_id` già impostato al suo account fin da subito.
 */
export async function selfJoinTournament(
  db: DB,
  tournamentId: string,
  input: { userId: string; displayName: string; email: string; numSlots: number }
) {
  const player = assertNoError(
    await db
      .from("players")
      .insert({
        tournament_id: tournamentId,
        user_id: input.userId,
        display_name: input.displayName,
        email: input.email.trim().toLowerCase(),
        num_slots: input.numSlots,
      })
      .select("*")
      .single()
  ) as Player;

  const labels = slotLabels(input.numSlots);
  const slotsRes = await db
    .from("slots")
    .insert(labels.map((label) => ({ player_id: player.id, label })))
    .select("*");
  const slots = assertNoError(slotsRes) as Slot[];

  return { ...player, slots };
}

/** La riga giocatore di QUESTO account in UN torneo specifico. */
export async function getPlayerForTournament(
  db: DB,
  tournamentId: string,
  userId: string
) {
  const res = await db
    .from("players")
    .select("*, slots(*), tournaments(*)")
    .eq("tournament_id", tournamentId)
    .eq("user_id", userId)
    .single();
  const row = assertNoError(res) as Player & {
    slots: Slot[];
    tournaments: Tournament;
  };
  return row;
}

/**
 * Panoramica di tutti i giocatori di un torneo (nome + stato dei loro
 * slot), per la "classifica" che vede ogni giocatore — volutamente senza
 * email, a differenza di `getPlayersWithSlots` che è per l'organizzatore.
 * Richiede la policy "players read all players of tournaments they
 * belong to" (vedi supabase/add_features.sql).
 */
export async function getTournamentStandings(db: DB, tournamentId: string) {
  const res = await db
    .from("players")
    .select("id, display_name, slots(status)")
    .eq("tournament_id", tournamentId)
    .order("created_at", { ascending: true });
  return assertNoError(res) as {
    id: string;
    display_name: string;
    slots: { status: "alive" | "eliminated" }[];
  }[];
}

/**
 * Gli accoppiamenti reali di Serie A per una giornata (round). La
 * giornata N del torneo corrisponde alla giornata reale N: l'organizzatore
 * tiene aggiornati gli accoppiamenti da /dashboard/fixtures.
 */
export async function getFixturesForRound(db: DB, round: number) {
  const res = await db
    .from("serie_a_fixtures")
    .select("*")
    .eq("round", round)
    .order("home_team", { ascending: true });
  return assertNoError(res) as Fixture[];
}

/** Tutti gli accoppiamenti salvati, per la pagina di amministrazione. */
export async function getAllFixtures(db: DB) {
  const res = await db
    .from("serie_a_fixtures")
    .select("*")
    .order("round", { ascending: true })
    .order("home_team", { ascending: true });
  return assertNoError(res) as Fixture[];
}

export async function upsertFixture(
  db: DB,
  input: {
    round: number;
    homeTeam: string;
    awayTeam: string;
    /** undefined = non toccare il campo (default in inserimento: null). */
    kickoffAt?: string | null;
  }
) {
  const res = await db
    .from("serie_a_fixtures")
    .upsert(
      {
        round: input.round,
        home_team: input.homeTeam,
        away_team: input.awayTeam,
        ...(input.kickoffAt !== undefined ? { kickoff_at: input.kickoffAt } : {}),
      },
      { onConflict: "round,home_team" }
    )
    .select("*")
    .single();
  return assertNoError(res) as Fixture;
}

export async function deleteFixture(db: DB, fixtureId: string) {
  assertNoError(await db.from("serie_a_fixtures").delete().eq("id", fixtureId));
}

/** Aggiorna solo la data/ora di calcio d'inizio di una partita già
 * esistente (a differenza di `upsertFixture`, che serve per crearne/
 * aggiornarne una per round+squadra in casa). `null` per svuotarla. */
export async function updateFixtureKickoff(
  db: DB,
  fixtureId: string,
  kickoffAt: string | null
) {
  assertNoError(
    await db
      .from("serie_a_fixtures")
      .update({ kickoff_at: kickoffAt })
      .eq("id", fixtureId)
  );
}

/** Segna/toglie lo stato "esclusa" di una partita (vedi
 * `serie_a_fixtures.status` in supabase/schema.sql): una partita esclusa
 * non conta ai fini del gioco per la sua giornata, vedi
 * `submitMatchdayResults` più sotto. */
export async function setFixtureStatus(
  db: DB,
  fixtureId: string,
  status: FixtureStatus
) {
  assertNoError(
    await db.from("serie_a_fixtures").update({ status }).eq("id", fixtureId)
  );
}

/** Nomi delle squadre "escluse" ai fini del gioco per una giornata
 * (round): sia quelle segnate a mano `status = 'excluded'` (tavolino
 * ancora da decidere, ecc.) sia quelle la cui partita ha un orario noto ma
 * fuori dalla finestra ufficiale ven-sab-dom-lun (rinviata a un'altra
 * settimana) — vedi `isWithinMatchWindow` e docs/02_Regole_gioco.md,
 * "Finestra ufficiale delle partite". Una partita senza data/ora ancora
 * inserita NON è considerata esclusa solo per questo. Usato sia da
 * `submitMatchdayResults` (per esentare gli slot) sia dalla schermata di
 * scelta (per oscurare le squadre non disponibili). */
export async function getExcludedTeamNames(db: DB, round: number) {
  const res = await db
    .from("serie_a_fixtures")
    .select("home_team, away_team, kickoff_at, status")
    .eq("round", round);
  const rows = assertNoError(res) as {
    home_team: string;
    away_team: string;
    kickoff_at: string | null;
    status: FixtureStatus;
  }[];
  const excluded = rows.filter((f) => {
    if (f.status === "excluded") return true;
    if (!f.kickoff_at) return false;
    const date = new Date(f.kickoff_at);
    return !Number.isNaN(date.getTime()) && !isWithinMatchWindow(date);
  });
  return new Set(excluded.flatMap((f) => [f.home_team, f.away_team]));
}

/** true se questo account ha già visto il tutorial "come funziona" almeno
 * una volta (a livello di account, non di singolo torneo: chi entra in più
 * tornei nel tempo non se lo rivede ogni volta). */
export async function hasSeenTutorial(db: DB, userId: string) {
  const res = await db
    .from("profiles")
    .select("tutorial_seen_at")
    .eq("id", userId)
    .maybeSingle();
  const row = assertNoError(res) as { tutorial_seen_at: string | null } | null;
  return Boolean(row?.tutorial_seen_at);
}

export async function markTutorialSeen(db: DB, userId: string) {
  assertNoError(
    await db
      .from("profiles")
      .update({ tutorial_seen_at: new Date().toISOString() })
      .eq("id", userId)
  );
}

export type ProfileRole = "player" | "creator";

/** Il ruolo globale dell'account, non legato a un singolo torneo (a
 * differenza di "organizzatore"/"admin di lega", che è chi possiede un
 * torneo specifico via `tournaments.owner_id` — quello sì, chiunque crei
 * un torneo lo diventa per quel torneo). "creator" è invece un ruolo a sé,
 * riservato all'account che gestisce l'app stessa: non si ottiene
 * creando un torneo, va assegnato a mano sul DB. */
export async function getProfileRole(db: DB, userId: string): Promise<ProfileRole> {
  const res = await db
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  const row = assertNoError(res) as { role: ProfileRole } | null;
  return row?.role ?? "player";
}

/**
 * Aggiunge N giocatori finti a un torneo DI TEST (nome ed email generati,
 * stesso numero di slot di default del torneo): serve a popolare in
 * blocco un torneo di prova senza dover invitare persone vere. Nessun
 * controllo qui su tournament.is_test — è il chiamante (Server Action) a
 * doverlo verificare, per non rischiare mai di usarla su un torneo vero.
 */
export async function addTestPlayers(
  db: DB,
  tournament: Tournament,
  count: number
) {
  const created: (Player & { slots: Slot[] })[] = [];
  for (let i = 0; i < count; i++) {
    const suffix = randomUUID().slice(0, 8);
    created.push(
      await addPlayer(db, tournament, {
        displayName: `Giocatore test ${suffix}`,
        email: `test-${suffix}@totofanta.test`,
        numSlots: tournament.default_num_slots,
      })
    );
  }
  return created;
}

export type SimulateMatchdayResult = {
  matchdayNumber: number;
  picksMade: number;
  tournamentFinished: boolean;
};

/**
 * Simula un'intera giornata di un torneo DI TEST: assegna una squadra
 * scelta a caso (tra quelle non ancora usate su quello slot) a ogni slot
 * vivo che non ha ancora scelto per la giornata aperta, genera un esito
 * casuale per ogni squadra così coinvolta, e applica le conseguenze come
 * farebbe l'organizzatore a mano (submitMatchdayResults) — elimina gli
 * slot che non sopravvivono, chiude il torneo o apre la giornata
 * successiva. Serve a bilanciare slot/durata senza aspettare il
 * calendario reale. Nessun controllo qui su tournament.is_test — stesso
 * discorso di addTestPlayers.
 */
export async function simulateMatchday(
  db: DB,
  tournament: Tournament
): Promise<SimulateMatchdayResult> {
  const matchdays = await getMatchdays(db, tournament.id);
  const matchday =
    matchdays.find((m) => m.status === "open") ??
    (await createNextMatchday(db, tournament));

  const players = await getPlayersWithSlots(db, tournament.id);
  const aliveSlots = players.flatMap((p) =>
    p.slots.filter((s) => s.status === "alive")
  );
  const allSlotIds = players.flatMap((p) => p.slots.map((s) => s.id));

  const [allHistory, currentPicks, availableTeams] = await Promise.all([
    getAllPicksForTournamentSlots(db, allSlotIds),
    getPicksForMatchday(db, matchday.id),
    getAvailableTeams(db, tournament.id, tournament.competition),
  ]);

  const alreadyPicked = new Set(currentPicks.map((p) => p.slot_id));
  let picksMade = 0;

  for (const slot of aliveSlots) {
    if (alreadyPicked.has(slot.id)) continue;
    const usedTeamIds = allHistory
      .filter((p) => p.slot_id === slot.id)
      .map((p) => p.team_id);
    const options = teamsAvailableForSlot(availableTeams, usedTeamIds);
    if (options.length === 0) continue; // ha già usato tutte le squadre disponibili
    const team = options[Math.floor(Math.random() * options.length)];
    await submitPick(db, slot.id, matchday.id, team.id);
    picksMade++;
  }

  const finalPicks = await getPicksForMatchday(db, matchday.id);
  const teamIdsInPlay = Array.from(new Set(finalPicks.map((p) => p.team_id)));
  const possibleOutcomes: GameOutcome[] = ["win", "draw", "loss"];
  const outcomesByTeam: Record<string, GameOutcome> = {};
  for (const teamId of teamIdsInPlay) {
    outcomesByTeam[teamId] =
      possibleOutcomes[Math.floor(Math.random() * possibleOutcomes.length)];
  }

  const result = await submitMatchdayResults(db, tournament, matchday, outcomesByTeam);

  return {
    matchdayNumber: matchday.number,
    picksMade,
    tournamentFinished: result.tournamentFinished,
  };
}
