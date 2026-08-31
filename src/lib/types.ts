// Tipi che rispecchiano le tabelle di supabase/schema.sql.

export type TournamentStatus = "draft" | "active" | "finished";

export interface Tournament {
  id: string;
  owner_id: string;
  name: string;
  competition: string;
  default_num_slots: number;
  missed_pick_rule: "eliminate";
  tie_break_rule: "ex_aequo";
  results_mode: "manual";
  status: TournamentStatus;
  // Torneo "di prova" per il Creator: giocatori finti, giornate simulate.
  // Vedi addTestPlayers/simulateMatchday in src/lib/queries.ts.
  is_test: boolean;
  decisive_matchday: number | null;
  winners: string[];
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  competition: string;
  tournament_id: string | null;
}

export interface Player {
  id: string;
  tournament_id: string;
  user_id: string | null;
  display_name: string;
  email: string;
  num_slots: number;
  created_at: string;
}

export type SlotStatus = "alive" | "eliminated";

export interface Slot {
  id: string;
  player_id: string;
  label: string;
  status: SlotStatus;
  eliminated_matchday: number | null;
}

export type MatchdayStatus = "open" | "locked" | "completed";

export interface Matchday {
  id: string;
  tournament_id: string;
  number: number;
  status: MatchdayStatus;
  lock_at: string | null;
}

export interface Pick {
  id: string;
  slot_id: string;
  matchday_id: string;
  team_id: string;
}

export type Outcome = "win" | "draw" | "loss";

export interface MatchdayResult {
  id: string;
  matchday_id: string;
  team_id: string;
  outcome: Outcome;
}

/** Un accoppiamento reale di Serie A per una giornata (round) numerata
 * come le giornate del torneo (giornata torneo N = giornata reale N).
 * Inserito/aggiornato a mano dall'organizzatore in /dashboard/fixtures. */
export interface Fixture {
  id: string;
  round: number;
  home_team: string;
  away_team: string;
}
