-- Totofanta — corregge un bug di schema: cancellare un torneo con squadre
-- "custom" (tournament_id non nullo, per una competizione diversa dalla
-- Serie A precaricata) falliva con un errore di vincolo di chiave esterna
-- se quelle squadre erano già state scelte in un pick o avevano un
-- risultato salvato.
--
-- Causa: `teams.tournament_id` ha già `on delete cascade` verso
-- `tournaments`, ma `picks.team_id` e `matchday_results.team_id`
-- referenziano `teams(id)` senza nessun `on delete` esplicito (default:
-- blocca subito). Cancellando un torneo, Postgres prova a cancellare le
-- sue squadre custom (cascade da tournaments) mentre picks/risultati le
-- referenziano ancora — anche se ANCHE loro cadrebbero comunque, perché
-- passano per un altro percorso del grafo (tournaments -> matchdays ->
-- picks/matchday_results).
--
-- Incolla e esegui questo intero file nell'SQL Editor di Supabase.
-- Non tocca dati esistenti, solo le due foreign key sotto.

set role postgres;

alter table picks drop constraint picks_team_id_fkey;
alter table picks add constraint picks_team_id_fkey
  foreign key (team_id) references teams (id) on delete cascade;

alter table matchday_results drop constraint matchday_results_team_id_fkey;
alter table matchday_results add constraint matchday_results_team_id_fkey
  foreign key (team_id) references teams (id) on delete cascade;
