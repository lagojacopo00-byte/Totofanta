-- Totofanta — aggiunge il prezzo per slot (tournaments.slot_value) al
-- ritorno di tournament_invite_preview, così la pagina di invito
-- (/play/join/[tournamentId]) può mostrare prezzo singolo e totale prima
-- che il giocatore scelga quanti slot prendere. Da eseguire su un
-- database già esistente, dopo add_slot_value.sql.

set role postgres;

-- "create or replace" non basta: sta cambiando la lista di colonne
-- ritornate (returns table), non solo il corpo della funzione.
drop function if exists public.tournament_invite_preview(uuid);

create function public.tournament_invite_preview(check_tournament_id uuid)
returns table(name text, competition text, default_num_slots integer, slot_value numeric)
language sql stable security definer set search_path = public
as $$
  select name, competition, default_num_slots, slot_value from tournaments
  where id = check_tournament_id and status = 'draft';
$$;

grant execute on function public.tournament_invite_preview(uuid) to authenticated;
