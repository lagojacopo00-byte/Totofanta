-- Totofanta — migrazioni mancanti sul database di produzione (trovate il
-- 2026-09-01 diagnosticando il bug "non carica la pagina torneo").
--
-- Il progetto Supabase collegato non ha mai ricevuto add_creator_role.sql,
-- add_tournament_is_test.sql e add_fixture_schedule.sql (verificato via
-- REST API: le colonne sotto non esistono). Il codice attuale dell'app le
-- usa senza controllare che esistano, quindi ogni pagina torneo di un
-- giocatore con una giornata aperta va in errore non appena prova a
-- leggere `serie_a_fixtures.kickoff_at`/`status`.
--
-- Incolla e esegui questo intero file nell'SQL Editor di Supabase.
-- Idempotente (usa "if not exists"), non tocca dati esistenti.
-- Una volta eseguito, questo file si può cancellare: il suo contenuto è
-- solo l'unione di add_creator_role.sql + add_tournament_is_test.sql +
-- add_fixture_schedule.sql, già presenti nella cartella per riferimento.

set role postgres;

-- da add_creator_role.sql ---------------------------------------------------

alter table profiles
  add column if not exists role text not null default 'player';

alter table profiles drop constraint if exists profiles_role_check;
alter table profiles
  add constraint profiles_role_check check (role in ('player', 'creator'));

update profiles
set role = 'creator'
where id in (select distinct owner_id from tournaments);

-- da add_tournament_is_test.sql ---------------------------------------------

alter table tournaments
  add column if not exists is_test boolean not null default false;

-- da add_fixture_schedule.sql -------------------------------------------

alter table serie_a_fixtures
  add column if not exists kickoff_at timestamptz;

alter table serie_a_fixtures
  add column if not exists status text not null default 'scheduled';

alter table serie_a_fixtures
  drop constraint if exists serie_a_fixtures_status_check;

alter table serie_a_fixtures
  add constraint serie_a_fixtures_status_check
  check (status in ('scheduled', 'excluded'));
