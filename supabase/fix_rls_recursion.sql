-- Totofanta — correzione della ricorsione infinita nelle policy RLS
--
-- Incolla e esegui questo intero file nell'SQL Editor di Supabase.
-- Non tocca le tabelle né i dati esistenti: aggiunge alcune funzioni di
-- supporto e sostituisce solo le policy di sicurezza che causavano
-- l'errore "infinite recursion detected in policy for relation
-- tournaments".

create or replace function public.is_tournament_owner(check_tournament_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from tournaments
    where id = check_tournament_id and owner_id = auth.uid()
  );
$$;

create or replace function public.is_tournament_player(check_tournament_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from players
    where tournament_id = check_tournament_id and user_id = auth.uid()
  );
$$;

create or replace function public.owns_player(check_player_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from players p
    join tournaments t on t.id = p.tournament_id
    where p.id = check_player_id and t.owner_id = auth.uid()
  );
$$;

create or replace function public.is_own_player(check_player_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from players
    where id = check_player_id and user_id = auth.uid()
  );
$$;

create or replace function public.owns_matchday(check_matchday_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from matchdays m
    join tournaments t on t.id = m.tournament_id
    where m.id = check_matchday_id and t.owner_id = auth.uid()
  );
$$;

create or replace function public.plays_in_matchday(check_matchday_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from matchdays m
    join players p on p.tournament_id = m.tournament_id
    where m.id = check_matchday_id and p.user_id = auth.uid()
  );
$$;

create or replace function public.owns_slot(check_slot_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from slots s
    join players p on p.id = s.player_id
    join tournaments t on t.id = p.tournament_id
    where s.id = check_slot_id and t.owner_id = auth.uid()
  );
$$;

create or replace function public.is_own_slot(check_slot_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from slots s
    join players p on p.id = s.player_id
    where s.id = check_slot_id and p.user_id = auth.uid()
  );
$$;

grant execute on function
  public.is_tournament_owner(uuid),
  public.is_tournament_player(uuid),
  public.owns_player(uuid),
  public.is_own_player(uuid),
  public.owns_matchday(uuid),
  public.plays_in_matchday(uuid),
  public.owns_slot(uuid),
  public.is_own_slot(uuid)
to authenticated, anon;

drop policy if exists "players read tournaments they belong to" on tournaments;
create policy "players read tournaments they belong to" on tournaments
  for select using (public.is_tournament_player(id));

drop policy if exists "organizer manages custom teams for own tournament" on teams;
create policy "organizer manages custom teams for own tournament" on teams
  for insert with check (public.is_tournament_owner(tournament_id));

drop policy if exists "organizer manages players of own tournament" on players;
create policy "organizer manages players of own tournament" on players
  for all
  using (public.is_tournament_owner(tournament_id))
  with check (public.is_tournament_owner(tournament_id));

drop policy if exists "organizer manages slots of own tournament" on slots;
create policy "organizer manages slots of own tournament" on slots
  for all
  using (public.owns_player(player_id))
  with check (public.owns_player(player_id));

drop policy if exists "a player manages their own slots" on slots;
create policy "a player manages their own slots" on slots
  for all
  using (public.is_own_player(player_id))
  with check (public.is_own_player(player_id));

drop policy if exists "organizer manages matchdays of own tournament" on matchdays;
create policy "organizer manages matchdays of own tournament" on matchdays
  for all
  using (public.is_tournament_owner(tournament_id))
  with check (public.is_tournament_owner(tournament_id));

drop policy if exists "players read matchdays of tournaments they belong to" on matchdays;
create policy "players read matchdays of tournaments they belong to" on matchdays
  for select using (public.is_tournament_player(tournament_id));

drop policy if exists "organizer manages picks of own tournament" on picks;
create policy "organizer manages picks of own tournament" on picks
  for all using (public.owns_matchday(matchday_id));

drop policy if exists "a player manages picks on their own slots" on picks;
create policy "a player manages picks on their own slots" on picks
  for all
  using (public.is_own_slot(slot_id))
  with check (public.is_own_slot(slot_id));

drop policy if exists "organizer manages results of own tournament" on matchday_results;
create policy "organizer manages results of own tournament" on matchday_results
  for all using (public.owns_matchday(matchday_id));

drop policy if exists "players read results of tournaments they belong to" on matchday_results;
create policy "players read results of tournaments they belong to" on matchday_results
  for select using (public.plays_in_matchday(matchday_id));
