-- Totofanta — permette all'organizzatore di TOGLIERE una squadra aggiunta a
-- mano al proprio torneo (finora si potevano solo aggiungere: mancava la
-- policy di RLS per il delete, quindi il pulsante "Rimuovi" non avrebbe
-- funzionato).
--
-- Incolla e esegui questo intero file nell'SQL Editor di Supabase (dopo
-- fix_rls_recursion.sql, add_self_join.sql, add_features.sql e
-- add_tutorial.sql, già eseguiti). Non tocca tabelle o dati esistenti,
-- solo una nuova policy.

set role postgres;

drop policy if exists "organizer removes custom teams of own tournament" on teams;

-- Solo le squadre aggiunte a mano per un torneo specifico (tournament_id
-- non nullo) si possono togliere, e solo dal suo organizzatore: le squadre
-- di riferimento condivise (tournament_id nullo, es. la Serie A precaricata)
-- non sono mai toccate da questa policy.
create policy "organizer removes custom teams of own tournament"
  on teams for delete
  using (
    tournament_id is not null and public.is_tournament_owner(tournament_id)
  );
