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
  created_at timestamptz not null default now(),
  -- Quando l'account ha visto per la prima volta il tutorial "come
  -- funziona" nell'area giocatore. null = non ancora visto.
  tutorial_seen_at timestamptz,
  -- Ruolo globale sulla piattaforma (non legato a un singolo torneo):
  -- tutti partono "player", e si diventa "creator" automaticamente la
  -- prima volta che si crea un torneo (vedi createTournamentAction).
  -- Serve per future funzioni valide su tutta la piattaforma (es. tornei
  -- di test), distinte dall'essere organizzatore di un torneo specifico
  -- (tournaments.owner_id), che resta un concetto per-torneo a sé.
  role text not null default 'player' check (role in ('player', 'creator'))
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
  -- Torneo "di prova" per il Creator: giocatori finti, giornate simulate
  -- istantaneamente (vedi addTestPlayers/simulateMatchday in
  -- src/lib/queries.ts), per bilanciare slot/durata senza aspettare il
  -- calendario reale. Non cambia nessuna regola di gioco, solo chi/come
  -- vengono generati i giocatori e i risultati.
  is_test boolean not null default false,
  -- Valore in euro di OGNI slot: moltiplicato per il numero totale di slot
  -- del torneo dà il premio complessivo in palio, mostrato ai giocatori
  -- nell'area di gioco. 0 (default) = nessun premio, il torneo resta
  -- "gratuito" come prima di questa colonna.
  slot_value numeric(10, 2) not null default 0 check (slot_value >= 0),
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
-- Uno slot = una "vita" indipendente del giocatore. `label` è il numero
-- (1, 2, 3...) mostrato all'utente. Lo storico delle squadre di uno slot si
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
  -- on delete cascade anche qui: se una squadra custom (tournament_id non
  -- nullo) viene cancellata insieme al suo torneo, cade anche il pick che
  -- la referenzia — senza, cancellare il torneo fallirebbe (le squadre
  -- cadrebbero prima, per il cascade di teams.tournament_id, mentre i
  -- pick le referenziano ancora).
  team_id uuid not null references teams (id) on delete cascade,
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
  -- Stesso motivo di picks.team_id sopra: cascade per non bloccare la
  -- cancellazione di un torneo con squadre custom già valutate.
  team_id uuid not null references teams (id) on delete cascade,
  outcome text not null check (outcome in ('win', 'draw', 'loss')),
  created_at timestamptz not null default now(),
  unique (matchday_id, team_id)
);

-- ---------------------------------------------------------------------------
-- CALENDARIO SERIE A
-- ---------------------------------------------------------------------------
-- Accoppiamenti reali (chi gioca contro chi) per ogni giornata di
-- campionato, tenuti aggiornati a mano dall'organizzatore da
-- /dashboard/fixtures. La giornata N di un torneo corrisponde alla
-- giornata N reale: non è legato a un torneo specifico, è condiviso da
-- tutti (come l'elenco squadre).
create table serie_a_fixtures (
  id uuid primary key default gen_random_uuid(),
  round integer not null check (round between 1 and 38),
  home_team text not null,
  away_team text not null,
  -- Data/ora reale del calcio d'inizio. Null finché l'organizzatore non la
  -- inserisce da /dashboard/fixtures: serve a raggruppare le partite della
  -- giornata per giorno (ven/sab/dom/lun) nella schermata di scelta e a
  -- capire se una partita rientra nella finestra ufficiale di gioco.
  kickoff_at timestamptz,
  -- 'excluded' = l'organizzatore ha deciso a mano che questa partita non
  -- conta ai fini del gioco per la sua giornata (rinvio fuori finestra,
  -- tavolino ancora da decidere, ecc.): le squadre coinvolte non sono
  -- selezionabili, e un pick già fatto su una di esse non conta né come
  -- vittoria né come sconfitta (vedi exemptSlotIds in
  -- src/lib/game-logic.ts e submitMatchdayResults in src/lib/queries.ts).
  status text not null default 'scheduled' check (status in ('scheduled', 'excluded')),
  created_at timestamptz not null default now(),
  unique (round, home_team),
  unique (round, away_team)
);

-- ---------------------------------------------------------------------------
-- FUNZIONI DI SUPPORTO PER LE POLICY (rompono la ricorsione RLS)
-- ---------------------------------------------------------------------------
-- Una policy su "tournaments" che interroga "players" e una policy su
-- "players" che interroga "tournaments" creerebbero un ciclo infinito
-- (Postgres rivaluta le RLS della tabella interrogata dentro la
-- subquery, all'infinito). Queste funzioni "security definer" girano
-- coi permessi di chi le ha create (il proprietario delle tabelle, che
-- di norma bypassa le RLS): usarle al posto delle subquery dirette
-- rompe il ciclo.

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

-- Per il link di invito: un torneo esiste ancora "draft" (per decidere se
-- ci si può ancora iscrivere da soli), e un'anteprima con i soli dati non
-- sensibili del torneo (nome, competizione, slot di default) per chi non
-- ne fa ancora parte e quindi non potrebbe altrimenti leggerlo.
create or replace function public.is_draft_tournament(check_tournament_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from tournaments
    where id = check_tournament_id and status = 'draft'
  );
$$;

create or replace function public.tournament_invite_preview(check_tournament_id uuid)
returns table(name text, competition text, default_num_slots integer)
language sql stable security definer set search_path = public
as $$
  select name, competition, default_num_slots from tournaments
  where id = check_tournament_id and status = 'draft';
$$;

grant execute on function
  public.is_tournament_owner(uuid),
  public.is_tournament_player(uuid),
  public.owns_player(uuid),
  public.is_own_player(uuid),
  public.owns_matchday(uuid),
  public.plays_in_matchday(uuid),
  public.owns_slot(uuid),
  public.is_own_slot(uuid),
  public.is_draft_tournament(uuid)
to authenticated, anon;

grant execute on function public.tournament_invite_preview(uuid) to authenticated;

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
alter table serie_a_fixtures enable row level security;

-- Tornei ------------------------------------------------------------------

create policy "organizer manages own tournaments"
  on tournaments for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "players read tournaments they belong to"
  on tournaments for select
  using (public.is_tournament_player(id));

-- Squadre -------------------------------------------------------------------

create policy "everyone can read the reference team list"
  on teams for select
  using (true);

create policy "organizer manages custom teams for own tournament"
  on teams for insert
  with check (public.is_tournament_owner(tournament_id));

-- Solo le squadre aggiunte a mano per un torneo specifico (tournament_id
-- non nullo) si possono togliere, e solo dal suo organizzatore: le squadre
-- di riferimento condivise (tournament_id nullo, es. la Serie A precaricata)
-- non sono mai toccate da questa policy.
create policy "organizer removes custom teams of own tournament"
  on teams for delete
  using (
    tournament_id is not null and public.is_tournament_owner(tournament_id)
  );

-- Giocatori -------------------------------------------------------------------

create policy "organizer manages players of own tournament"
  on players for all
  using (public.is_tournament_owner(tournament_id))
  with check (public.is_tournament_owner(tournament_id));

create policy "a player reads their own memberships"
  on players for select
  using (user_id = auth.uid());

-- Per la classifica che vede ogni giocatore (chi è ancora in gara, chi è
-- eliminato): può leggere anche gli ALTRI giocatori del/dei tornei a cui
-- partecipa (non solo la propria riga).
create policy "players read all players of tournaments they belong to"
  on players for select
  using (public.is_tournament_player(tournament_id));

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

-- Il link di invito: chiunque sia autenticato può iscriversi DA SOLO a un
-- torneo ancora "draft" se ne conosce l'id (il link stesso funge da
-- invito), purché lo faccia con la propria email e a proprio nome.
create policy "a player can join a draft tournament via invite link"
  on players for insert
  with check (
    user_id = auth.uid()
    and email = lower(coalesce(auth.jwt() ->> 'email', ''))
    and public.is_draft_tournament(tournament_id)
  );

-- Slot ------------------------------------------------------------------

create policy "organizer manages slots of own tournament"
  on slots for all
  using (public.owns_player(player_id))
  with check (public.owns_player(player_id));

create policy "a player manages their own slots"
  on slots for all
  using (public.is_own_player(player_id))
  with check (public.is_own_player(player_id));

-- Per la classifica: uno slot altrui è leggibile (solo status/etichetta,
-- non i pick) da chi partecipa allo stesso torneo.
create policy "players read slots of tournaments they belong to"
  on slots for select
  using (
    exists (
      select 1 from players p
      where p.id = slots.player_id
        and public.is_tournament_player(p.tournament_id)
    )
  );

-- Giornate ------------------------------------------------------------------

create policy "organizer manages matchdays of own tournament"
  on matchdays for all
  using (public.is_tournament_owner(tournament_id))
  with check (public.is_tournament_owner(tournament_id));

create policy "players read matchdays of tournaments they belong to"
  on matchdays for select
  using (public.is_tournament_player(tournament_id));

-- Picks ------------------------------------------------------------------

create policy "organizer manages picks of own tournament"
  on picks for all
  using (public.owns_matchday(matchday_id));

create policy "a player manages picks on their own slots"
  on picks for all
  using (public.is_own_slot(slot_id))
  with check (public.is_own_slot(slot_id));

-- Risultati ------------------------------------------------------------------

create policy "organizer manages results of own tournament"
  on matchday_results for all
  using (public.owns_matchday(matchday_id));

create policy "players read results of tournaments they belong to"
  on matchday_results for select
  using (public.plays_in_matchday(matchday_id));

-- Calendario Serie A ----------------------------------------------------

-- Consultabile da chiunque sia autenticato (organizzatore o giocatore, in
-- qualunque torneo): non è un dato sensibile, è il calendario pubblico.
create policy "authenticated users read serie a fixtures"
  on serie_a_fixtures for select
  using (auth.uid() is not null);

-- Chiunque sia autenticato può tenerlo aggiornato: l'app non ha un ruolo
-- "admin" separato dall'organizzatore, e il calendario è condiviso da
-- tutti i tornei.
create policy "authenticated users manage serie a fixtures"
  on serie_a_fixtures for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

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

-- ---------------------------------------------------------------------------
-- SEED — calendario Serie A 2026/2027, giornate 1-25
-- ---------------------------------------------------------------------------
-- Accoppiamenti raccolti da ricerca web (non fonte ufficiale in tempo
-- reale): gli orari/date reali cambiano spesso per gli anticipi/posticipi
-- TV, ma l'accoppiamento (chi gioca contro chi) in una data giornata resta
-- valido. Le giornate 26-38 e qualunque correzione si aggiungono da
-- /dashboard/fixtures.
insert into serie_a_fixtures (round, home_team, away_team) values
  (1, 'Atalanta', 'Sassuolo'),
  (1, 'Bologna', 'Lazio'),
  (1, 'Frosinone', 'Juventus'),
  (1, 'Genoa', 'Napoli'),
  (1, 'Inter', 'Monza'),
  (1, 'Parma', 'Cagliari'),
  (1, 'Roma', 'Fiorentina'),
  (1, 'Torino', 'Milan'),
  (1, 'Udinese', 'Como'),
  (1, 'Venezia', 'Lecce'),
  (2, 'Atalanta', 'Bologna'),
  (2, 'Cagliari', 'Inter'),
  (2, 'Fiorentina', 'Frosinone'),
  (2, 'Juventus', 'Parma'),
  (2, 'Lazio', 'Genoa'),
  (2, 'Lecce', 'Roma'),
  (2, 'Milan', 'Venezia'),
  (2, 'Monza', 'Udinese'),
  (2, 'Napoli', 'Como'),
  (2, 'Sassuolo', 'Torino'),
  (3, 'Bologna', 'Sassuolo'),
  (3, 'Cagliari', 'Lecce'),
  (3, 'Fiorentina', 'Torino'),
  (3, 'Frosinone', 'Venezia'),
  (3, 'Genoa', 'Como'),
  (3, 'Inter', 'Napoli'),
  (3, 'Juventus', 'Milan'),
  (3, 'Parma', 'Monza'),
  (3, 'Roma', 'Atalanta'),
  (3, 'Udinese', 'Lazio'),
  (4, 'Atalanta', 'Cagliari'),
  (4, 'Como', 'Parma'),
  (4, 'Genoa', 'Frosinone'),
  (4, 'Inter', 'Udinese'),
  (4, 'Lazio', 'Milan'),
  (4, 'Lecce', 'Monza'),
  (4, 'Napoli', 'Bologna'),
  (4, 'Sassuolo', 'Juventus'),
  (4, 'Torino', 'Roma'),
  (4, 'Venezia', 'Fiorentina'),
  (5, 'Bologna', 'Torino'),
  (5, 'Fiorentina', 'Napoli'),
  (5, 'Frosinone', 'Como'),
  (5, 'Juventus', 'Atalanta'),
  (5, 'Milan', 'Lecce'),
  (5, 'Monza', 'Sassuolo'),
  (5, 'Parma', 'Genoa'),
  (5, 'Roma', 'Inter'),
  (5, 'Udinese', 'Cagliari'),
  (5, 'Venezia', 'Lazio'),
  (6, 'Atalanta', 'Venezia'),
  (6, 'Cagliari', 'Juventus'),
  (6, 'Como', 'Roma'),
  (6, 'Genoa', 'Fiorentina'),
  (6, 'Inter', 'Parma'),
  (6, 'Lazio', 'Monza'),
  (6, 'Lecce', 'Bologna'),
  (6, 'Napoli', 'Frosinone'),
  (6, 'Sassuolo', 'Milan'),
  (6, 'Torino', 'Udinese'),
  (7, 'Bologna', 'Inter'),
  (7, 'Fiorentina', 'Como'),
  (7, 'Frosinone', 'Sassuolo'),
  (7, 'Juventus', 'Lazio'),
  (7, 'Milan', 'Atalanta'),
  (7, 'Monza', 'Cagliari'),
  (7, 'Parma', 'Torino'),
  (7, 'Roma', 'Genoa'),
  (7, 'Udinese', 'Lecce'),
  (7, 'Venezia', 'Napoli'),
  (8, 'Atalanta', 'Frosinone'),
  (8, 'Cagliari', 'Bologna'),
  (8, 'Como', 'Sassuolo'),
  (8, 'Genoa', 'Venezia'),
  (8, 'Inter', 'Fiorentina'),
  (8, 'Lazio', 'Parma'),
  (8, 'Lecce', 'Juventus'),
  (8, 'Napoli', 'Roma'),
  (8, 'Torino', 'Monza'),
  (8, 'Udinese', 'Milan'),
  (9, 'Fiorentina', 'Atalanta'),
  (9, 'Frosinone', 'Lecce'),
  (9, 'Genoa', 'Juventus'),
  (9, 'Milan', 'Bologna'),
  (9, 'Monza', 'Napoli'),
  (9, 'Parma', 'Udinese'),
  (9, 'Roma', 'Cagliari'),
  (9, 'Sassuolo', 'Lazio'),
  (9, 'Torino', 'Como'),
  (9, 'Venezia', 'Inter'),
  (10, 'Atalanta', 'Parma'),
  (10, 'Bologna', 'Monza'),
  (10, 'Como', 'Venezia'),
  (10, 'Frosinone', 'Torino'),
  (10, 'Juventus', 'Napoli'),
  (10, 'Lazio', 'Cagliari'),
  (10, 'Lecce', 'Genoa'),
  (10, 'Milan', 'Inter'),
  (10, 'Sassuolo', 'Fiorentina'),
  (10, 'Udinese', 'Roma'),
  (11, 'Cagliari', 'Frosinone'),
  (11, 'Fiorentina', 'Juventus'),
  (11, 'Genoa', 'Milan'),
  (11, 'Inter', 'Como'),
  (11, 'Monza', 'Atalanta'),
  (11, 'Napoli', 'Lazio'),
  (11, 'Parma', 'Bologna'),
  (11, 'Roma', 'Sassuolo'),
  (11, 'Torino', 'Lecce'),
  (11, 'Venezia', 'Udinese'),
  (12, 'Atalanta', 'Inter'),
  (12, 'Bologna', 'Udinese'),
  (12, 'Como', 'Cagliari'),
  (12, 'Juventus', 'Venezia'),
  (12, 'Lazio', 'Lecce'),
  (12, 'Milan', 'Frosinone'),
  (12, 'Monza', 'Fiorentina'),
  (12, 'Napoli', 'Torino'),
  (12, 'Parma', 'Roma'),
  (12, 'Sassuolo', 'Genoa'),
  (13, 'Cagliari', 'Milan'),
  (13, 'Como', 'Juventus'),
  (13, 'Frosinone', 'Parma'),
  (13, 'Inter', 'Genoa'),
  (13, 'Lecce', 'Atalanta'),
  (13, 'Roma', 'Monza'),
  (13, 'Sassuolo', 'Napoli'),
  (13, 'Torino', 'Lazio'),
  (13, 'Udinese', 'Fiorentina'),
  (13, 'Venezia', 'Bologna'),
  (14, 'Bologna', 'Roma'),
  (14, 'Fiorentina', 'Cagliari'),
  (14, 'Frosinone', 'Inter'),
  (14, 'Genoa', 'Torino'),
  (14, 'Juventus', 'Udinese'),
  (14, 'Lazio', 'Atalanta'),
  (14, 'Milan', 'Parma'),
  (14, 'Monza', 'Como'),
  (14, 'Napoli', 'Lecce'),
  (14, 'Venezia', 'Sassuolo'),
  (15, 'Atalanta', 'Genoa'),
  (15, 'Cagliari', 'Venezia'),
  (15, 'Como', 'Bologna'),
  (15, 'Inter', 'Torino'),
  (15, 'Juventus', 'Monza'),
  (15, 'Lazio', 'Roma'),
  (15, 'Lecce', 'Sassuolo'),
  (15, 'Napoli', 'Milan'),
  (15, 'Parma', 'Fiorentina'),
  (15, 'Udinese', 'Frosinone'),
  (16, 'Atalanta', 'Napoli'),
  (16, 'Fiorentina', 'Bologna'),
  (16, 'Frosinone', 'Lazio'),
  (16, 'Genoa', 'Udinese'),
  (16, 'Lecce', 'Inter'),
  (16, 'Milan', 'Como'),
  (16, 'Roma', 'Juventus'),
  (16, 'Sassuolo', 'Parma'),
  (16, 'Torino', 'Cagliari'),
  (16, 'Venezia', 'Monza'),
  (17, 'Bologna', 'Juventus'),
  (17, 'Cagliari', 'Genoa'),
  (17, 'Como', 'Lecce'),
  (17, 'Fiorentina', 'Lazio'),
  (17, 'Inter', 'Sassuolo'),
  (17, 'Monza', 'Milan'),
  (17, 'Parma', 'Napoli'),
  (17, 'Roma', 'Frosinone'),
  (17, 'Torino', 'Venezia'),
  (17, 'Udinese', 'Atalanta'),
  (18, 'Atalanta', 'Como'),
  (18, 'Frosinone', 'Bologna'),
  (18, 'Genoa', 'Monza'),
  (18, 'Juventus', 'Torino'),
  (18, 'Lazio', 'Inter'),
  (18, 'Lecce', 'Parma'),
  (18, 'Milan', 'Fiorentina'),
  (18, 'Napoli', 'Cagliari'),
  (18, 'Sassuolo', 'Udinese'),
  (18, 'Venezia', 'Roma'),
  (19, 'Bologna', 'Genoa'),
  (19, 'Cagliari', 'Sassuolo'),
  (19, 'Como', 'Lazio'),
  (19, 'Fiorentina', 'Lecce'),
  (19, 'Inter', 'Juventus'),
  (19, 'Monza', 'Frosinone'),
  (19, 'Parma', 'Venezia'),
  (19, 'Roma', 'Milan'),
  (19, 'Torino', 'Atalanta'),
  (19, 'Udinese', 'Napoli'),
  (20, 'Atalanta', 'Roma'),
  (20, 'Cagliari', 'Como'),
  (20, 'Juventus', 'Genoa'),
  (20, 'Lazio', 'Bologna'),
  (20, 'Lecce', 'Udinese'),
  (20, 'Milan', 'Torino'),
  (20, 'Napoli', 'Fiorentina'),
  (20, 'Parma', 'Inter'),
  (20, 'Sassuolo', 'Monza'),
  (20, 'Venezia', 'Frosinone'),
  (21, 'Bologna', 'Atalanta'),
  (21, 'Como', 'Napoli'),
  (21, 'Fiorentina', 'Sassuolo'),
  (21, 'Frosinone', 'Milan'),
  (21, 'Genoa', 'Parma'),
  (21, 'Inter', 'Venezia'),
  (21, 'Juventus', 'Cagliari'),
  (21, 'Lecce', 'Torino'),
  (21, 'Monza', 'Lazio'),
  (21, 'Roma', 'Udinese'),
  (22, 'Atalanta', 'Fiorentina'),
  (22, 'Cagliari', 'Parma'),
  (22, 'Genoa', 'Lecce'),
  (22, 'Lazio', 'Venezia'),
  (22, 'Milan', 'Juventus'),
  (22, 'Monza', 'Roma'),
  (22, 'Napoli', 'Inter'),
  (22, 'Sassuolo', 'Como'),
  (22, 'Torino', 'Frosinone'),
  (22, 'Udinese', 'Bologna'),
  (23, 'Atalanta', 'Lazio'),
  (23, 'Bologna', 'Milan'),
  (23, 'Como', 'Monza'),
  (23, 'Fiorentina', 'Udinese'),
  (23, 'Inter', 'Cagliari'),
  (23, 'Juventus', 'Sassuolo'),
  (23, 'Lecce', 'Napoli'),
  (23, 'Parma', 'Frosinone'),
  (23, 'Roma', 'Torino'),
  (23, 'Venezia', 'Genoa'),
  (24, 'Bologna', 'Como'),
  (24, 'Cagliari', 'Lazio'),
  (24, 'Frosinone', 'Fiorentina'),
  (24, 'Genoa', 'Atalanta'),
  (24, 'Inter', 'Milan'),
  (24, 'Monza', 'Lecce'),
  (24, 'Napoli', 'Juventus'),
  (24, 'Roma', 'Parma'),
  (24, 'Torino', 'Sassuolo'),
  (24, 'Udinese', 'Venezia'),
  (25, 'Atalanta', 'Monza'),
  (25, 'Como', 'Torino'),
  (25, 'Fiorentina', 'Inter'),
  (25, 'Juventus', 'Bologna'),
  (25, 'Lazio', 'Napoli'),
  (25, 'Lecce', 'Frosinone'),
  (25, 'Milan', 'Genoa'),
  (25, 'Sassuolo', 'Roma'),
  (25, 'Udinese', 'Parma'),
  (25, 'Venezia', 'Cagliari')
on conflict do nothing;
