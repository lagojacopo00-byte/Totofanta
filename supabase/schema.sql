-- Totofanta — schema del database (Supabase / Postgres)
--
-- Come usarlo: crea un progetto su supabase.com, apri l'SQL Editor e incolla
-- questo intero file, poi esegui. Ricrea da zero tutte le tabelle del
-- progetto (pensato per un progetto Supabase dedicato a Totofanta).
--
-- v2: sia l'organizzatore che i giocatori hanno un account vero (email +
-- password). L'organizzatore invita un giocatore inserendo la sua email e
-- quanti slot gli ha assegnato; quando quella persona si registra (o
-- accede, se ha già un account) con QUELLA email, il suo account si
-- collega automaticamente all'invito.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- PROFILI
-- ---------------------------------------------------------------------------
-- Uno per ogni account Supabase Auth (organizzatore o giocatore: non c'è
-- differenza di ruolo a livello di account, solo di cosa fa quella persona
-- in un dato torneo). Creato automaticamente alla registrazione dal
-- trigger più sotto.
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "a user reads and updates their own profile"
  on profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, lower(new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- TORNEI
-- ---------------------------------------------------------------------------
-- Ogni torneo è indipendente dagli altri (multi-torneo fin dall'inizio):
-- owner_id è l'organizzatore (un account Supabase Auth) che lo ha creato e
-- lo gestisce. In futuro, chiunque potrà registrarsi e creare il proprio.
create table tournaments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  competition text not null default 'Serie A',
  -- Valore proposto di default quando si aggiunge un nuovo giocatore: il
  -- numero REALE di slot di ogni giocatore è deciso individualmente
  -- dall'organizzatore (vedi players.num_slots) e può differire da questo.
  default_num_slots integer not null default 1 check (default_num_slots between 1 and 100),
  -- Cosa succede a chi non sceglie in tempo per uno slot.
  missed_pick_rule text not null default 'eliminate'
    check (missed_pick_rule in ('eliminate')),
  -- Cosa succede se una giornata eliminerebbe TUTTI gli slot ancora vivi.
  tie_break_rule text not null default 'ex_aequo'
    check (tie_break_rule in ('ex_aequo')),
  -- Come entrano i risultati delle partite.
  results_mode text not null default 'manual'
    check (results_mode in ('manual')),
  status text not null default 'draft'
    check (status in ('draft', 'active', 'finished')),
  -- Valorizzata quando il torneo finisce: la giornata in cui si è deciso
  -- il vincitore (per vittoria "normale" o per spareggio ex aequo).
  decisive_matchday integer,
  -- player_id dei vincitori. Più di uno in caso di ex aequo.
  winners jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- SQUADRE
-- ---------------------------------------------------------------------------
-- Elenco di riferimento delle squadre selezionabili. `tournament_id` è NULL
-- per le squadre "di listino" (es. tutta la Serie A, seedate sotto) e
-- valorizzato solo per squadre aggiunte ad hoc da un organizzatore per il
-- proprio torneo (es. una competizione personalizzata).
create table teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  competition text not null,
  tournament_id uuid references tournaments (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (name, competition, tournament_id)
);

create index teams_competition_idx on teams (competition);

-- ---------------------------------------------------------------------------
-- GIOCATORI
-- ---------------------------------------------------------------------------
-- Una riga = "questa persona partecipa a questo torneo, con questi slot".
-- L'organizzatore la crea con la sola email (invito); `user_id` resta NULL
-- finché quella persona non si registra/accede con quella stessa email,
-- momento in cui si "aggancia" da sola (vedi policy "un giocatore
-- reclama il proprio invito" più sotto). Lo stesso account può comparire
-- come giocatore in più tornei diversi (una riga per torneo).
create table players (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  display_name text not null,
  email text not null,
  -- Quanti slot ha comprato/gli sono stati assegnati in QUESTO torneo.
  -- Nessun tetto realistico (100 è solo un freno agli errori di
  -- battitura). Modificabile dall'organizzatore solo mentre il torneo è
  -- ancora "draft" — vedi src/app/dashboard/[id]/actions.ts.
  num_slots integer not null default 1 check (num_slots between 1 and 100),
  created_at timestamptz not null default now(),
  unique (tournament_id, email)
);

create index players_user_idx on players (user_id);

-- ---------------------------------------------------------------------------
-- SLOT
-- ---------------------------------------------------------------------------
-- Uno slot = una "vita" indipendente del giocatore. `label` è la lettera
-- (A, B, C...) mostrata all'utente. Lo storico delle squadre di uno slot si
-- ricava dalle sue righe in `picks`.
create table slots (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players (id) on delete cascade,
  label text not null,
  status text not null default 'alive' check (status in ('alive', 'eliminated')),
  eliminated_matchday integer,
  created_at timestamptz not null default now(),
  unique (player_id, label)
);

-- ---------------------------------------------------------------------------
-- GIORNATE
-- ---------------------------------------------------------------------------
create table matchdays (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments (id) on delete cascade,
  number integer not null,
  lock_at timestamptz,
  status text not null default 'open'
    check (status in ('open', 'locked', 'completed')),
  created_at timestamptz not null default now(),
  unique (tournament_id, number)
);

-- ---------------------------------------------------------------------------
-- SCELTE (PICKS)
-- ---------------------------------------------------------------------------
-- Una riga = "questo slot, in questa giornata, ha scelto questa squadra".
-- Un pick al massimo per slot per giornata. Il vincolo "non puoi ripetere la
-- stessa squadra sullo stesso slot" è applicato dall'applicazione (vedi
-- src/lib/game-logic.ts), non dal database, perché richiede di guardare
-- tutto lo storico dello slot.
create table picks (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references slots (id) on delete cascade,
  matchday_id uuid not null references matchdays (id) on delete cascade,
  team_id uuid not null references teams (id),
  created_at timestamptz not null default now(),
  unique (slot_id, matchday_id)
);

create index picks_matchday_idx on picks (matchday_id);
create index picks_slot_idx on picks (slot_id);

-- ---------------------------------------------------------------------------
-- RISULTATI
-- ---------------------------------------------------------------------------
-- Un risultato per squadra per giornata (non per pick: se tre giocatori
-- scelgono tutti il Napoli, il risultato del Napoli si inserisce una volta
-- sola e si applica a tutti).
create table matchday_results (
  id uuid primary key default gen_random_uuid(),
  matchday_id uuid not null references matchdays (id) on delete cascade,
  team_id uuid not null references teams (id),
  outcome text not null check (outcome in ('win', 'draw', 'loss')),
  created_at timestamptz not null default now(),
  unique (matchday_id, team_id)
);

-- ---------------------------------------------------------------------------
-- RIGA DI SICUREZZA (RLS)
-- ---------------------------------------------------------------------------
-- Sia l'organizzatore che i giocatori usano il client Supabase autenticato
-- con la loro sessione: è Row Level Security, non il codice dell'app, a
-- decidere chi vede/scrive cosa.

alter table tournaments enable row level security;
alter table teams enable row level security;
alter table players enable row level security;
alter table slots enable row level security;
alter table matchdays enable row level security;
alter table picks enable row level security;
alter table matchday_results enable row level security;

-- Tornei ------------------------------------------------------------------

create policy "organizer manages own tournaments"
  on tournaments for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "players read tournaments they belong to"
  on tournaments for select
  using (
    id in (select tournament_id from players where user_id = auth.uid())
  );

-- Squadre -------------------------------------------------------------------

create policy "everyone can read the reference team list"
  on teams for select
  using (true);

create policy "organizer manages custom teams for own tournament"
  on teams for insert
  with check (
    tournament_id in (select id from tournaments where owner_id = auth.uid())
  );

-- Giocatori -------------------------------------------------------------------

create policy "organizer manages players of own tournament"
  on players for all
  using (tournament_id in (select id from tournaments where owner_id = auth.uid()))
  with check (tournament_id in (select id from tournaments where owner_id = auth.uid()));

create policy "a player reads their own memberships"
  on players for select
  using (user_id = auth.uid());

-- Il passaggio chiave dell'invito: appena un account autenticato ha la
-- stessa email di un invito ancora "orfano" (user_id NULL), può
-- agganciarcisi da solo impostando user_id = se stesso. Non può toccare
-- nient'altro (display_name, num_slots, o l'invito di qualcun altro).
create policy "a player claims their own pending invite"
  on players for update
  using (
    user_id is null
    and email = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
  with check (user_id = auth.uid());

-- Slot ------------------------------------------------------------------

create policy "organizer manages slots of own tournament"
  on slots for all
  using (
    player_id in (
      select p.id from players p
      join tournaments t on t.id = p.tournament_id
      where t.owner_id = auth.uid()
    )
  );

create policy "a player manages their own slots"
  on slots for all
  using (
    player_id in (select id from players where user_id = auth.uid())
  )
  with check (
    player_id in (select id from players where user_id = auth.uid())
  );

-- Giornate ------------------------------------------------------------------

create policy "organizer manages matchdays of own tournament"
  on matchdays for all
  using (tournament_id in (select id from tournaments where owner_id = auth.uid()))
  with check (tournament_id in (select id from tournaments where owner_id = auth.uid()));

create policy "players read matchdays of tournaments they belong to"
  on matchdays for select
  using (
    tournament_id in (select tournament_id from players where user_id = auth.uid())
  );

-- Picks ------------------------------------------------------------------

create policy "organizer manages picks of own tournament"
  on picks for all
  using (
    matchday_id in (
      select m.id from matchdays m
      join tournaments t on t.id = m.tournament_id
      where t.owner_id = auth.uid()
    )
  );

create policy "a player manages picks on their own slots"
  on picks for all
  using (
    slot_id in (
      select s.id from slots s
      join players p on p.id = s.player_id
      where p.user_id = auth.uid()
    )
  )
  with check (
    slot_id in (
      select s.id from slots s
      join players p on p.id = s.player_id
      where p.user_id = auth.uid()
    )
  );

-- Risultati ------------------------------------------------------------------

create policy "organizer manages results of own tournament"
  on matchday_results for all
  using (
    matchday_id in (
      select m.id from matchdays m
      join tournaments t on t.id = m.tournament_id
      where t.owner_id = auth.uid()
    )
  );

create policy "players read results of tournaments they belong to"
  on matchday_results for select
  using (
    matchday_id in (
      select m.id from matchdays m
      join players p on p.tournament_id = m.tournament_id
      where p.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- SEED — squadre Serie A 2026/2027
-- ---------------------------------------------------------------------------
insert into teams (name, competition) values
  ('Atalanta', 'Serie A'),
  ('Bologna', 'Serie A'),
  ('Cagliari', 'Serie A'),
  ('Como', 'Serie A'),
  ('Fiorentina', 'Serie A'),
  ('Frosinone', 'Serie A'),
  ('Genoa', 'Serie A'),
  ('Inter', 'Serie A'),
  ('Juventus', 'Serie A'),
  ('Lazio', 'Serie A'),
  ('Lecce', 'Serie A'),
  ('Milan', 'Serie A'),
  ('Monza', 'Serie A'),
  ('Napoli', 'Serie A'),
  ('Parma', 'Serie A'),
  ('Roma', 'Serie A'),
  ('Sassuolo', 'Serie A'),
  ('Torino', 'Serie A'),
  ('Udinese', 'Serie A'),
  ('Venezia', 'Serie A')
on conflict do nothing;
