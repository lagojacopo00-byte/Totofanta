-- Totofanta — chiusura delle scelte anche a livello database + storico
-- delle modifiche alle scelte (2026-10-12).
--
-- Perché: la scadenza per schierare era controllata solo in
-- submitPicksAction (src/app/play/(app)/[tournamentId]/actions.ts), ma la
-- policy RLS "a player manages picks on their own slots" lascia scrivere
-- su `picks` a un giocatore anche dopo la scadenza (basta chiamare
-- Supabase direttamente). In più `picks.created_at` registra solo la
-- PRIMA creazione: una modifica successiva non lasciava nessuna traccia,
-- quindi non si poteva ricostruire chi aveva cambiato squadra e quando.
--
-- Cosa fa:
--   1) public.pick_deadline(round): stessa regola di computePickDeadline
--      in src/lib/pick-window.ts — primo calcio d'inizio non escluso
--      (dentro la finestra ven-sab-dom-lun) con orario vero; se ci sono
--      solo date senza ora (mezzanotte UTC, segnaposto) ripiego =
--      venerdì 18:30 di Roma della settimana. TENERE ALLINEATE le due.
--   2) trigger BEFORE su picks: dopo la scadenza rifiuta insert/update/
--      delete fatti da un utente autenticato. Passano: il service role
--      (auth.uid() null: cron, simulazioni, azioni admin), l'organizzatore
--      del torneo SU slot non suoi (liberare uno slot altrui), e i tornei
--      di test (is_test).
--   3) tabella pick_history + trigger AFTER su picks: ogni insert/cambio
--      squadra/cancellazione viene registrata con orario e utente.
--      Leggibile solo dall'organizzatore del torneo (vedi
--      /dashboard/[id], sezione "Storico modifiche scelte").
--   4) baseline: le scelte già presenti vengono registrate una volta con
--      source = 'baseline' e changed_at = created_at (la modifica
--      eventuale successiva NON è recuperabile: era sovrascritta).
--
-- Da eseguire su un database già esistente. Idempotente.

set role postgres;

-- 1) Scadenza di una giornata ------------------------------------------------

create or replace function public.pick_deadline(round_number int)
returns timestamptz
language sql stable set search_path = public
as $$
  with f as (
    select kickoff_at
    from serie_a_fixtures
    where round = round_number
      and status <> 'excluded'
      and kickoff_at is not null
      and extract(dow from kickoff_at at time zone 'Europe/Rome') in (5, 6, 0, 1)
  )
  select coalesce(
    (
      select min(kickoff_at) from f
      where (kickoff_at at time zone 'UTC')::time <> time '00:00:00'
    ),
    (
      select (
        ((min(kickoff_at) at time zone 'UTC')::date
          - ((extract(dow from (min(kickoff_at) at time zone 'UTC')::date)::int - 5 + 7) % 7))
        + time '18:30'
      ) at time zone 'Europe/Rome'
      from f
    )
  );
$$;

-- 3) Storico (tabella prima del trigger che ci scrive) ------------------------

create table if not exists pick_history (
  id uuid primary key default gen_random_uuid(),
  changed_at timestamptz not null default now(),
  -- 'insert' = prima scelta, 'update' = cambio squadra, 'delete' = tolta.
  action text not null check (action in ('insert', 'update', 'delete')),
  -- Niente foreign key di proposito: la cancellazione a cascata di slot/
  -- giornate/tornei non deve né fallire né essere bloccata dallo storico.
  slot_id uuid not null,
  matchday_id uuid not null,
  old_team_id uuid,
  new_team_id uuid,
  -- auth.uid() di chi ha scritto; null = lato server (service role/SQL).
  changed_by uuid,
  -- 'live' = registrata dal trigger; 'baseline' = ricostruita da created_at.
  source text not null default 'live' check (source in ('live', 'baseline'))
);

create index if not exists pick_history_matchday_idx on pick_history (matchday_id, changed_at);
create index if not exists pick_history_slot_idx on pick_history (slot_id);

alter table pick_history enable row level security;

drop policy if exists "organizer reads pick history of own tournament" on pick_history;
create policy "organizer reads pick history of own tournament"
  on pick_history for select
  using (public.owns_matchday(matchday_id));

create or replace function public.log_pick_change()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into pick_history (action, slot_id, matchday_id, old_team_id, new_team_id, changed_by)
    values ('insert', new.slot_id, new.matchday_id, null, new.team_id, auth.uid());
  elsif tg_op = 'UPDATE' then
    if new.team_id is distinct from old.team_id then
      insert into pick_history (action, slot_id, matchday_id, old_team_id, new_team_id, changed_by)
      values ('update', new.slot_id, new.matchday_id, old.team_id, new.team_id, auth.uid());
    end if;
  elsif tg_op = 'DELETE' then
    -- Cancellazione a cascata (slot o giornata già spariti): non è una
    -- modifica di una scelta, niente da registrare.
    if exists (select 1 from slots where id = old.slot_id)
       and exists (select 1 from matchdays where id = old.matchday_id) then
      insert into pick_history (action, slot_id, matchday_id, old_team_id, new_team_id, changed_by)
      values ('delete', old.slot_id, old.matchday_id, old.team_id, null, auth.uid());
    end if;
  end if;
  return null;
end;
$$;

drop trigger if exists picks_log_change on picks;
create trigger picks_log_change
  after insert or update or delete on picks
  for each row execute function public.log_pick_change();

-- 2) Chiusura delle scelte ---------------------------------------------------

create or replace function public.enforce_pick_lock()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_matchday_id uuid;
  v_slot_id uuid;
  v_number int;
  v_is_test boolean;
  v_deadline timestamptz;
begin
  -- Service role / SQL editor: nessun utente, nessun blocco.
  if auth.uid() is null then
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  -- Update che non cambia niente (upsert identico): lascia passare.
  if tg_op = 'UPDATE'
     and new.team_id = old.team_id
     and new.slot_id = old.slot_id
     and new.matchday_id = old.matchday_id then
    return new;
  end if;

  if tg_op = 'DELETE' then
    v_matchday_id := old.matchday_id;
    v_slot_id := old.slot_id;
  else
    v_matchday_id := new.matchday_id;
    v_slot_id := new.slot_id;
  end if;

  select m.number, t.is_test
    into v_number, v_is_test
  from matchdays m
  join tournaments t on t.id = m.tournament_id
  where m.id = v_matchday_id;

  -- Giornata sparita (cancellazione a cascata) o torneo di test: via libera.
  if v_number is null or v_is_test then
    return case when tg_op = 'DELETE' then old else new end;
  end if;
  if tg_op = 'DELETE' and not exists (select 1 from slots where id = v_slot_id) then
    return old;
  end if;

  -- L'organizzatore può sistemare gli slot degli ALTRI (es. liberarne uno);
  -- sul proprio slot da giocatore vale la scadenza come per tutti.
  if public.owns_matchday(v_matchday_id) and not public.is_own_slot(v_slot_id) then
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  v_deadline := public.pick_deadline(v_number);
  if v_deadline is not null and now() >= v_deadline then
    raise exception 'Le scelte per questa giornata sono chiuse: è già iniziata la prima partita.';
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists picks_enforce_lock on picks;
create trigger picks_enforce_lock
  before insert or update or delete on picks
  for each row execute function public.enforce_pick_lock();

-- 4) Baseline ----------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pick_history) then
    insert into pick_history (changed_at, action, slot_id, matchday_id, old_team_id, new_team_id, changed_by, source)
    select created_at, 'insert', slot_id, matchday_id, null, team_id, null, 'baseline'
    from picks;
  end if;
end;
$$;
