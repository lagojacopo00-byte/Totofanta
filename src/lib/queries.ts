import type { SupabaseClient } from "@supabase/supabase-js";
import {
  applyMatchdayResults,
  type AliveSlot,
  type MatchdayPick,
  type Outcome as GameOutcome,
} from "./game-logic";
import type {
  Fixture,
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
  return Array.from({ length: n }, (_, i) => String.fromCharCode(65 + i));
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
  input: { name: string; competition: string; default_num_slots: number }
) {
  const res = await db
    .from("tournaments")
    .insert({
      owner_id: ownerId,
      name: input.name,
      competition: input.competition,
      default_num_slots: input.default_num_slots,
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

  const result = applyMatchdayResults({
    aliveSlotsBefore,
    picks: picksForLogic,
    outcomesByTeam,
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
  input: { round: number; homeTeam: string; awayTeam: string }
) {
  const res = await db
    .from("serie_a_fixtures")
    .upsert(
      { round: input.round, home_team: input.homeTeam, away_team: input.awayTeam },
      { onConflict: "round,home_team" }
    )
    .select("*")
    .single();
  return assertNoError(res) as Fixture;
}

export async function deleteFixture(db: DB, fixtureId: string) {
  assertNoError(await db.from("serie_a_fixtures").delete().eq("id", fixtureId));
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
