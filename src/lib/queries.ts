import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  applyMatchdayResults,
  computeRoundOutcomes,
  teamsAvailableForSlot,
  type AliveSlot,
  type MatchdayPick,
  type Outcome as GameOutcome,
} from "./game-logic";
import { isWithinMatchWindow } from "./match-window";
import { computePickDeadline, isPickingWindowOpen } from "./pick-window";
import { fetchSerieAFixtures, matchTeamName } from "./football-api";
import { createAdminClient } from "./supabase/admin";
import {
  buildMatchdayBackupXlsx,
  type BackupPlayerSnapshot,
} from "./matchday-export";
import type {
  Fixture,
  FixtureResult,
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
    auto_backup_matchdays?: boolean;
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
      auto_backup_matchdays: input.auto_backup_matchdays ?? false,
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

/** Cambia il valore per slot (premio) di un torneo già creato: a
 * differenza del numero di slot per giocatore, questo non tocca la
 * meccanica di gioco (chi ha già scelto cosa), quindi può cambiare in
 * qualunque momento, non solo mentre il torneo è "draft". */
export async function updateTournamentSlotValue(
  db: DB,
  tournamentId: string,
  slotValue: number
) {
  assertNoError(
    await db
      .from("tournaments")
      .update({ slot_value: slotValue })
      .eq("id", tournamentId)
  );
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
  const players = assertNoError(res) as (Player & { slots: Slot[] })[];
  const overrides = await getProfileDisplayNames(db, players.map((p) => p.user_id));
  return players.map((p) => ({ ...p, display_name: resolveDisplayName(p, overrides) }));
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
  input: {
    displayName: string;
    email: string;
    numSlots: number;
    // Impostato solo quando l'organizzatore aggiunge SE STESSO come
    // giocatore (checkbox "Parteciperò anch'io" in creazione torneo):
    // essendo già un account autenticato, non serve passare dal
    // meccanismo dell'invito "orfano" (players.user_id null, agganciato
    // più tardi via claimPendingInvites) — si collega subito.
    userId?: string | null;
  }
) {
  const player = assertNoError(
    await db
      .from("players")
      .insert({
        tournament_id: tournament.id,
        display_name: input.displayName,
        email: input.email.trim().toLowerCase(),
        num_slots: input.numSlots,
        user_id: input.userId ?? null,
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
 * togliendo righe in `slots` per farlo combaciare col nuovo totale.
 * Consentita in qualunque momento del torneo (decisione esplicita
 * dell'utente: prima era ristretta a "draft", ma un torneo di test può
 * scoprire slot mal configurati solo a torneo già iniziato). Quando si
 * riduce il numero, si tolgono per prima le righe già "eliminated"
 * (nessuna perdita per il giocatore) e solo se non bastano si toccano
 * anche quelle "alive" (dall'etichetta più alta), per non cancellare per
 * sbaglio storico vivo quando basterebbe pulire slot già persi.
 */
export async function updatePlayerNumSlots(
  db: DB,
  playerId: string,
  newNumSlots: number
) {
  const currentSlots = assertNoError(
    await db.from("slots").select("*").eq("player_id", playerId)
  ) as Slot[];

  if (newNumSlots > currentSlots.length) {
    const currentLabels = new Set(currentSlots.map((s) => s.label));
    const newLabels = slotLabels(newNumSlots).filter((l) => !currentLabels.has(l));
    assertNoError(
      await db
        .from("slots")
        .insert(newLabels.map((label) => ({ player_id: playerId, label })))
    );
  } else if (newNumSlots < currentSlots.length) {
    const eliminated = currentSlots.filter((s) => s.status === "eliminated");
    const alive = currentSlots
      .filter((s) => s.status === "alive")
      .sort((a, b) => Number(b.label) - Number(a.label));
    const idsToRemove = [...eliminated, ...alive]
      .slice(0, currentSlots.length - newNumSlots)
      .map((s) => s.id);
    assertNoError(await db.from("slots").delete().in("id", idsToRemove));
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
/**
 * La prima giornata Serie A ancora "giocabile": quella il cui primo
 * calcio d'inizio non escluso non è ancora passato (vedi
 * computePickDeadline in pick-window.ts). Se un torneo si avvia mentre
 * una giornata è già in corso (o già finita), la giornata 1 del torneo
 * non riparte dalla giornata reale 1 — potrebbe essere già finita da
 * settimane — ma da qui: deciso con l'utente il 2026-09-02. Una
 * giornata non ancora in calendario (nessuna partita configurata) viene
 * saltata, non considerata "giocabile" per difetto. Ritorna 1 se
 * nessuna giornata risulta ancora giocabile (fine stagione, o
 * calendario non ancora inserito) — stesso comportamento di sempre in
 * quel caso limite.
 */
export async function findCurrentPlayableRound(db: DB): Promise<number> {
  for (let round = 1; round <= 38; round++) {
    const fixtures = await getFixturesForRound(db, round);
    if (fixtures.length === 0) continue;
    const excludedNames = await getExcludedTeamNames(db, round);
    const deadline = computePickDeadline(fixtures, excludedNames);
    if (isPickingWindowOpen(deadline)) return round;
  }
  return 1;
}

export async function createNextMatchday(db: DB, tournament: Tournament) {
  const existing = await getMatchdays(db, tournament.id);
  const nextNumber = existing.length > 0
    ? Math.max(...existing.map((m) => m.number)) + 1
    : await findCurrentPlayableRound(db);

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

  // Squadre scelte in questa giornata (serve sia per le partite escluse
  // sotto, sia per il backup Excel più in fondo).
  const pickedTeamIds = Array.from(new Set(picks.map((p) => p.team_id)));
  const pickedTeams = await getTeamsByIds(db, pickedTeamIds);
  const teamNameById = new Map(pickedTeams.map((t) => [t.id, t.name]));

  // Partite segnate "escluse" per questa giornata (rinvio fuori finestra,
  // tavolino non ancora deciso, ecc.): chi le aveva scelte resta vivo senza
  // che conti né come vittoria né come sconfitta — vedi
  // docs/02_Regole_gioco.md ("Stato partita valida/esclusa").
  const excludedNames = await getExcludedTeamNames(db, matchday.number);
  let exemptSlotIds: string[] = [];
  if (excludedNames.size > 0) {
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

  if (tournament.auto_backup_matchdays) {
    await generateMatchdayBackup(db, tournament, matchday, {
      players,
      picks,
      teamNameById,
      eliminatedSlotIds: new Set(eliminatedSlotIds),
    });
  }

  return result;
}

/**
 * Genera il file Excel di backup di una giornata appena chiusa e lo carica
 * nel bucket storage "matchday-backups" (percorso
 * "<tournament_id>/giornata-<numero>.xlsx", sovrascritto se già esiste —
 * es. dopo "Annulla ultima giornata" + rinserimento). Solo per i tornei
 * con `auto_backup_matchdays` attivo (checkbox "Salva giornate" alla
 * creazione). Non blocca mai la chiusura della giornata: un problema di
 * storage non deve impedire l'aggiornamento del gioco vero, che a questo
 * punto della funzione è già stato applicato — un errore qui finisce solo
 * nei log del server.
 */
async function generateMatchdayBackup(
  db: DB,
  tournament: Tournament,
  matchday: Matchday,
  data: {
    players: (Player & { slots: Slot[] })[];
    picks: Pick[];
    teamNameById: Map<string, string>;
    eliminatedSlotIds: Set<string>;
  }
) {
  try {
    const pickBySlot = new Map(data.picks.map((p) => [p.slot_id, p.team_id]));
    const snapshot: BackupPlayerSnapshot[] = data.players.map((player) => ({
      displayName: player.display_name,
      slots: player.slots
        .slice()
        .sort((a, b) => Number(a.label) - Number(b.label))
        .map((slot) => {
          const teamId = pickBySlot.get(slot.id);
          const eliminatedNow = data.eliminatedSlotIds.has(slot.id);
          const status: "alive" | "eliminated" =
            slot.status === "eliminated" || eliminatedNow ? "eliminated" : "alive";
          return {
            label: slot.label,
            teamName: teamId ? (data.teamNameById.get(teamId) ?? null) : null,
            status,
          };
        }),
    }));

    const buffer = await buildMatchdayBackupXlsx(matchday.number, snapshot);
    const path = `${tournament.id}/giornata-${matchday.number}.xlsx`;
    const res = await db.storage.from("matchday-backups").upload(path, buffer, {
      contentType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      upsert: true,
    });
    if (res.error) {
      console.error(
        `[generateMatchdayBackup] upload fallito per ${path}:`,
        res.error.message
      );
    }
  } catch (err) {
    console.error(
      `[generateMatchdayBackup] errore generando il backup per il torneo ${tournament.id}, giornata ${matchday.number}:`,
      err
    );
  }
}

/** Elenca i backup Excel già generati per un torneo (vedi
 * generateMatchdayBackup), più recenti prima, con un link di download
 * firmato valido un'ora — per la sezione "Backup giornate" della
 * dashboard organizzatore. */
export async function listMatchdayBackups(db: DB, tournamentId: string) {
  const list = await db.storage.from("matchday-backups").list(tournamentId);
  if (list.error || !list.data) return [];

  const withUrls = await Promise.all(
    list.data.map(async (file) => {
      const signed = await db.storage
        .from("matchday-backups")
        .createSignedUrl(`${tournamentId}/${file.name}`, 3600);
      return { name: file.name, url: signed.data?.signedUrl ?? null };
    })
  );

  return withUrls
    .filter((f): f is { name: string; url: string } => f.url !== null)
    .sort((a, b) => b.name.localeCompare(a.name, undefined, { numeric: true }));
}

function lastCompletedMatchday(matchdays: Matchday[]): Matchday | null {
  const completed = matchdays.filter((m) => m.status === "completed");
  if (completed.length === 0) return null;
  return completed.reduce((max, m) => (m.number > max.number ? m : max));
}

/** Cosa succederebbe annullando l'ultima giornata completata, senza
 * toccare nulla: per far vedere all'organizzatore il rischio (scelte già
 * fatte sulla giornata successiva, se già aperta) prima che confermi —
 * vedi undoLastMatchday più sotto, di cui questa rispecchia la logica. */
export async function getUndoLastMatchdayPreview(db: DB, tournamentId: string) {
  const matchdays = await getMatchdays(db, tournamentId);
  const target = lastCompletedMatchday(matchdays);
  if (!target) return null;

  const nextMatchday = matchdays.find((m) => m.number === target.number + 1) ?? null;
  const picksAtRisk = nextMatchday
    ? (await getPicksForMatchday(db, nextMatchday.id)).length
    : 0;

  return {
    matchdayNumber: target.number,
    nextMatchdayNumber: nextMatchday?.number ?? null,
    picksAtRisk,
  };
}

/**
 * Annulla l'ultima giornata COMPLETATA di un torneo — la "rete di
 * sicurezza" per quando l'organizzatore si accorge di aver sbagliato un
 * risultato dopo averlo già salvato. Riporta la giornata a "open",
 * cancella i risultati salvati per lei, rimette in vita gli slot che
 * proprio lei aveva eliminato (riconosciuti da `eliminated_matchday`,
 * univoco per slot) e, se era stata lei a chiudere il torneo (vittoria o
 * spareggio ex aequo), lo riporta "active" azzerando `decisive_matchday`
 * e `winners`. Le scelte (picks) di quella giornata non vengono toccate:
 * non sono mai state cancellate da submitMatchdayResults (a parte quelle
 * esentate per una partita esclusa, che è corretto restino libere), quindi
 * tornano visibili così com'erano appena la giornata riapre.
 *
 * Nel frattempo può già essere stata aperta la giornata successiva
 * (submitMatchdayResults la crea in automatico): va cancellata per
 * tornare allo stato di prima, insieme a QUALUNQUE scelta i giocatori
 * potrebbero già averci fatto. Per questo la funzione conta e restituisce
 * quante scelte andrebbero perse, così la UI può avvisare prima di
 * chiamarla (vedi undoLastMatchdayAction).
 *
 * Si annulla sempre e solo l'ultima giornata completata (mai una a scelta
 * più indietro): richiamandola più volte si torna indietro una giornata
 * alla volta.
 */
export async function undoLastMatchday(db: DB, tournament: Tournament) {
  const matchdays = await getMatchdays(db, tournament.id);
  const target = lastCompletedMatchday(matchdays);
  if (!target) {
    throw new Error("Nessuna giornata completata da annullare.");
  }
  const nextMatchday = matchdays.find((m) => m.number === target.number + 1) ?? null;

  const players = await getPlayersWithSlots(db, tournament.id);
  const slotIdsToRevive = players
    .flatMap((p) => p.slots)
    .filter((s) => s.eliminated_matchday === target.number)
    .map((s) => s.id);

  if (slotIdsToRevive.length > 0) {
    assertNoError(
      await db
        .from("slots")
        .update({ status: "alive", eliminated_matchday: null })
        .in("id", slotIdsToRevive)
    );
  }

  assertNoError(
    await db.from("matchday_results").delete().eq("matchday_id", target.id)
  );

  assertNoError(
    await db.from("matchdays").update({ status: "open" }).eq("id", target.id)
  );

  // La giornata successiva (se già aperta) è una conseguenza diretta di
  // quella che stiamo annullando: cade insieme a lei. Le sue picks
  // cadono da sole (on delete cascade).
  let picksLost = 0;
  if (nextMatchday) {
    const picks = await getPicksForMatchday(db, nextMatchday.id);
    picksLost = picks.length;
    assertNoError(await db.from("matchdays").delete().eq("id", nextMatchday.id));
  }

  if (tournament.status === "finished" && tournament.decisive_matchday === target.number) {
    assertNoError(
      await db
        .from("tournaments")
        .update({ status: "active", decisive_matchday: null, winners: [] })
        .eq("id", tournament.id)
    );
  }

  return {
    reopenedMatchday: target.number,
    revivedSlots: slotIdsToRevive.length,
    deletedNextMatchday: nextMatchday?.number ?? null,
    picksLost,
  };
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
    .select("id, display_name, user_id, slots(status, eliminated_matchday)")
    .eq("tournament_id", tournamentId)
    .order("created_at", { ascending: true });
  const rows = assertNoError(res) as {
    id: string;
    display_name: string;
    user_id: string | null;
    slots: { status: "alive" | "eliminated"; eliminated_matchday: number | null }[];
  }[];
  const overrides = await getProfileDisplayNames(db, rows.map((r) => r.user_id));
  return rows.map((r) => ({ ...r, display_name: resolveDisplayName(r, overrides) }));
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

/** Salva l'esito reale di una partita — solo il creator può chiamarla
 * (verificato dal chiamante, vedi setFixtureResultAction). Da sola non
 * elimina nessuno slot: vedi tryFinalizeRoundEverywhere. */
export async function updateFixtureResult(
  db: DB,
  fixtureId: string,
  result: FixtureResult | null
) {
  assertNoError(
    await db.from("serie_a_fixtures").update({ result }).eq("id", fixtureId)
  );
}

/**
 * Sincronizza date/ora e risultati reali di Serie A da football-data.org:
 * scarica l'intera stagione (una sola chiamata), aggiorna kickoff_at per
 * ogni partita e, per quelle già finite, chiama updateFixtureResult +
 * tryFinalizeRoundEverywhere — lo stesso percorso che già usa il creator
 * cliccando 1/X/2 a mano su /dashboard/fixtures, solo con la sorgente del
 * dato automatica invece che manuale. Non tocca mai `status` (una
 * partita segnata "esclusa" a mano resta tale): quella è una decisione
 * dell'app, non un fatto che l'API conosca.
 *
 * ATTENZIONE ritardo risultati: il piano gratuito di football-data.org
 * aggiorna gli esiti circa una volta al giorno, non appena finisce la
 * partita (vedi il commento in fetchSerieAFixtures in football-api.ts,
 * verificato con una chiamata reale). Gli orari (kickoff_at) invece sono
 * sempre aggiornati, essendo noti in anticipo. Deciso con l'utente:
 * sincronizzare comunque anche i risultati nonostante il ritardo — il
 * creator può sempre inserirne uno a mano prima per chiudere la giornata
 * subito, invece di aspettare il giro automatico del giorno dopo.
 *
 * Ritorna un riepilogo per mostrare all'utente cosa è successo — in
 * particolare `unmatched`, i nomi squadra che l'API ha restituito e che
 * non abbiamo saputo far combaciare con nessuna squadra nota: senza
 * questo la sincronizzazione di quelle partite fallirebbe in silenzio
 * (stessa categoria di bug delle policy RLS mancanti trovate oggi).
 */
export async function syncFixturesFromFootballData(
  db: DB,
  apiToken: string,
  season?: number
) {
  const [apiFixtures, knownTeams] = await Promise.all([
    fetchSerieAFixtures(apiToken, season),
    getReferenceTeams(db, "Serie A"),
  ]);
  const knownNames = knownTeams.map((t) => t.name);

  let kickoffsSynced = 0;
  let resultsSynced = 0;
  const roundsToFinalize = new Set<number>();
  const unmatched: { home: string; away: string }[] = [];

  for (const f of apiFixtures) {
    const homeTeam = matchTeamName(f.homeTeamName, knownNames);
    const awayTeam = matchTeamName(f.awayTeamName, knownNames);
    if (!homeTeam || !awayTeam) {
      unmatched.push({ home: f.homeTeamName, away: f.awayTeamName });
      continue;
    }

    const row = await upsertFixture(db, {
      round: f.round,
      homeTeam,
      awayTeam,
      kickoffAt: f.kickoffAt,
    });
    kickoffsSynced += 1;

    if (f.finished && f.result) {
      if (row.result !== f.result) {
        await updateFixtureResult(db, row.id, f.result);
        resultsSynced += 1;
      }
      roundsToFinalize.add(f.round);
    }
  }

  for (const round of roundsToFinalize) {
    await tryFinalizeRoundEverywhere(round);
  }

  return { kickoffsSynced, resultsSynced, unmatched };
}

/**
 * Chiude automaticamente la giornata aperta di ogni torneo Serie A attivo
 * che corrisponde a questo round — ma SOLO se tutte le partite non escluse
 * di quel round hanno ormai un risultato reale caricato dal creator.
 *
 * Deciso con l'utente: il creator carica i risultati partita per partita,
 * anche "quasi in live" appena finisce una partita — ma l'eliminazione
 * scatta solo a giornata intera nota, mai prima. Il motivo è tecnico: la
 * logica di gioco (applyMatchdayResults) tratta una squadra senza esito
 * ancora noto come se avesse perso, per non lasciare mai uno slot "a
 * metà" — quindi applicare risultati parziali eliminerebbe per errore chi
 * ha scelto una squadra che deve ancora giocare. Va richiamata dopo ogni
 * salvataggio di risultato: se la giornata non è ancora completa, non
 * fa nulla (nessun errore, va bene richiamarla finché non lo è).
 *
 * Usa SEMPRE il client service-role internamente (non accetta un `db` dal
 * chiamante): tocca tornei di QUALUNQUE organizzatore, non solo quello
 * dell'account che ha innescato la chiamata (il creator, cliccando 1/X/2
 * o "Sincronizza ora"). Le policy RLS di tournaments/matchdays/slots
 * concedono scrittura solo al proprietario del singolo torneo — con il
 * client normale del creator, ogni torneo altrui verrebbe filtrato in
 * silenzio (0 righe toccate, nessun errore): stessa categoria di bug
 * delle policy RLS mancanti trovate oggi, qui causata dal client
 * sbagliato invece che da una policy mancante. Bug scoperto e corretto
 * il 2026-09-02, prima di mandare in produzione la funzione di backup
 * giornate che si aggancia qui.
 */
export async function tryFinalizeRoundEverywhere(round: number) {
  const db = createAdminClient();
  const fixtures = await getFixturesForRound(db, round);
  const { ready, outcomeByTeamName } = computeRoundOutcomes(
    fixtures.map((f) => ({
      home_team: f.home_team,
      away_team: f.away_team,
      status: f.status,
      result: f.result,
    }))
  );
  if (!ready) return { finalized: [] as string[] };

  const res = await db
    .from("matchdays")
    .select("*, tournaments(*)")
    .eq("number", round)
    .eq("status", "open");
  const rows = assertNoError(res) as (Matchday & { tournaments: Tournament | null })[];

  const finalized: string[] = [];
  for (const row of rows) {
    const tournament = row.tournaments;
    if (
      !tournament ||
      tournament.competition !== "Serie A" ||
      tournament.status !== "active" ||
      // I tornei di test hanno il proprio meccanismo indipendente
      // (simulateMatchday, esiti casuali): non devono essere toccati da
      // risultati reali, altrimenti si mescolerebbero con le simulazioni.
      tournament.is_test
    ) {
      continue;
    }
    const teams = await getAvailableTeams(db, tournament.id, tournament.competition);
    const outcomesByTeam: Record<string, GameOutcome> = {};
    for (const t of teams) {
      const outcome = outcomeByTeamName.get(t.name);
      if (outcome) outcomesByTeam[t.id] = outcome;
    }
    await submitMatchdayResults(db, tournament, row, outcomesByTeam);
    finalized.push(tournament.id);
  }
  return { finalized };
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

/** Nome pubblico scelto dall'utente (profiles.display_name), o null se
 * non l'ha ancora impostato (o se la migrazione add_profile_display_name.sql
 * non è ancora stata eseguita — chiamata dalla home, che esisteva già
 * prima di questa colonna: non deve rompersi per un arricchimento
 * facoltativo). In quel caso resta valido il nome che l'organizzatore ha
 * messo per ogni singolo torneo. */
export async function getProfileDisplayName(db: DB, userId: string): Promise<string | null> {
  const res = await db
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .maybeSingle();
  if (res.error) return null;
  const row = res.data as { display_name: string | null } | null;
  return row?.display_name ?? null;
}

export async function updateProfileDisplayName(db: DB, userId: string, displayName: string) {
  assertNoError(
    await db
      .from("profiles")
      .update({ display_name: displayName })
      .eq("id", userId)
  );
}

/** Nomi pubblici scelti dagli utenti per gli account passati (solo quelli
 * che l'hanno impostato). Usata per sovrascrivere, ovunque si mostrano i
 * giocatori di un torneo, il players.display_name che l'organizzatore ha
 * messo per quel torneo — stessa persona, stesso nome in ogni torneo.
 *
 * Difensiva di proposito (a differenza delle altre funzioni qui, che
 * usano assertNoError e quindi propagano l'errore): questa viene
 * chiamata da getPlayersWithSlots e getTournamentStandings, già in uso
 * su pagine esistenti — se la migrazione add_profile_display_name.sql
 * non è ancora stata eseguita sul DB di produzione (profiles.display_name
 * non esiste), quelle pagine non devono rompersi solo perché manca un
 * arricchimento facoltativo: si ripiega sui nomi già in players. */
async function getProfileDisplayNames(
  db: DB,
  userIds: (string | null)[]
): Promise<Map<string, string>> {
  const ids = Array.from(new Set(userIds.filter((id): id is string => Boolean(id))));
  if (ids.length === 0) return new Map();
  const res = await db
    .from("profiles")
    .select("id, display_name")
    .in("id", ids)
    .not("display_name", "is", null);
  if (res.error) return new Map();
  const rows = res.data as { id: string; display_name: string }[];
  return new Map(rows.map((r) => [r.id, r.display_name]));
}

function resolveDisplayName(
  player: { display_name: string; user_id: string | null },
  overrides: Map<string, string>
): string {
  return (player.user_id && overrides.get(player.user_id)) || player.display_name;
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
