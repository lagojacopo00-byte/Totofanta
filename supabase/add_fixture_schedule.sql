-- Migrazione incrementale: data/ora e stato (valida/esclusa) sul
-- calendario Serie A condiviso. Da eseguire su un database già esistente,
-- dopo tutte le migrazioni precedenti. Idempotente: rieseguibile senza
-- effetti collaterali.
--
-- Vedi il commento su `serie_a_fixtures` in supabase/schema.sql e
-- docs/02_Regole_gioco.md ("Stato partita valida/esclusa") per il perché.

set role postgres;

alter table serie_a_fixtures
  add column if not exists kickoff_at timestamptz;

alter table serie_a_fixtures
  add column if not exists status text not null default 'scheduled';

alter table serie_a_fixtures
  drop constraint if exists serie_a_fixtures_status_check;

alter table serie_a_fixtures
  add constraint serie_a_fixtures_status_check
  check (status in ('scheduled', 'excluded'));
