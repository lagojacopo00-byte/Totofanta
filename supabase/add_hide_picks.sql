-- Totofanta — scelte degli altri giocatori visibili in classifica, con
-- un interruttore per nasconderle (2026-09-11).
--
-- Tre cose:
--   1) players.hide_picks: chi lo attiva tiene nascoste agli altri le
--      proprie scelte finché la giornata è aperta (a scelte chiuse tutto
--      torna visibile a tutti, come già succede nello Storico).
--   2) set_hide_picks(): l'interruttore. È una funzione security definer
--      perché un giocatore non ha (e non deve avere) il permesso di
--      aggiornare la propria riga `players` — potrebbe cambiarsi num_slots
--      o display_name. Così tocca solo quella colonna, solo sulla riga del
--      proprio account.
--   3) Una policy di lettura su `picks` per i giocatori: PRIMA non
--      esisteva. Le uniche due erano "organizer manages picks of own
--      tournament" e "a player manages picks on their own slots", quindi
--      un giocatore non organizzatore leggeva solo le PROPRIE scelte, e
--      lo storico degli altri giocatori gli usciva con le celle vuote —
--      bug mai notato perché chi provava l'app era anche l'organizzatore
--      del torneo, che invece vede tutto. Stessa famiglia del bug su
--      `profiles` documentato in docs/06_Database.md.
--
-- Da eseguire su un database già esistente. Idempotente.

set role postgres;

-- 1) La colonna -----------------------------------------------------------

alter table players
  add column if not exists hide_picks boolean not null default false;

-- 2) L'interruttore -------------------------------------------------------

create or replace function public.set_hide_picks(
  check_tournament_id uuid,
  hide boolean
)
returns void
language sql volatile security definer set search_path = public
as $$
  update players
  set hide_picks = hide
  where tournament_id = check_tournament_id
    and user_id = auth.uid();
$$;

grant execute on function public.set_hide_picks(uuid, boolean) to authenticated;

-- 3) Lettura delle scelte altrui ------------------------------------------

-- Una scelta è visibile agli altri giocatori del torneo se la giornata
-- non è più aperta, oppure se chi l'ha fatta non ha attivato hide_picks.
--
-- Nota: qui la soglia è lo stato della giornata (che l'organizzatore
-- chiude inserendo i risultati), non la scadenza per schierare — il
-- database non conosce gli orari di calcio d'inizio, che stanno in
-- serie_a_fixtures e che l'app calcola con computePickDeadline. È quindi
-- una soglia più PRUDENTE di quella dell'interfaccia, che scopre le
-- scelte già al primo fischio d'inizio: nessuna contraddizione, questa
-- policy è solo la rete di sicurezza contro chi interrogasse l'API
-- Supabase direttamente invece di guardare la pagina.
create or replace function public.pick_visible_to_players(
  check_slot_id uuid,
  check_matchday_id uuid
)
returns boolean
language sql stable security definer set search_path = public
as $$
  select
    coalesce(
      (select m.status <> 'open' from matchdays m where m.id = check_matchday_id),
      false
    )
    or coalesce(
      (
        select not p.hide_picks
        from slots s
        join players p on p.id = s.player_id
        where s.id = check_slot_id
      ),
      false
    );
$$;

-- Anche ad anon, come le altre funzioni usate dentro una policy (vedi
-- fix_rls_recursion.sql): una query senza sessione deve tornare zero
-- righe, non un errore di permessi sulla funzione.
grant execute on function public.pick_visible_to_players(uuid, uuid) to authenticated, anon;

drop policy if exists "players read visible picks of their tournaments" on picks;
create policy "players read visible picks of their tournaments"
  on picks for select
  using (
    public.plays_in_matchday(matchday_id)
    and public.pick_visible_to_players(slot_id, matchday_id)
  );
