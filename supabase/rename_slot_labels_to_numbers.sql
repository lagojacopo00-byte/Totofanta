-- Totofanta — rinomina gli slot esistenti da lettere (A, B, C...) a numeri
-- (1, 2, 3...), nell'ordine alfabetico attuale, per ogni giocatore. Da qui
-- in avanti l'app crea sempre e solo etichette numeriche: questo migra i
-- dati già esistenti così tutti i tornei risultano coerenti.
--
-- Incolla e esegui questo intero file nell'SQL Editor di Supabase (dopo
-- fix_rls_recursion.sql, add_self_join.sql, add_features.sql,
-- add_tutorial.sql e add_custom_teams_delete.sql, già eseguiti). Non tocca
-- altre tabelle, solo la colonna `label` di `slots`.

set role postgres;

do $$
declare
  p record;
  s record;
  n int;
begin
  for p in select id from players loop
    n := 1;
    for s in select id from slots where player_id = p.id order by label asc loop
      update slots set label = n::text where id = s.id;
      n := n + 1;
    end loop;
  end loop;
end $$;
