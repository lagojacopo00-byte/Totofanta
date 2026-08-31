-- Aggiunge la colonna "torneo di test" (vedi docs/07_Task_sviluppo.md,
-- task "Tornei di test per il Creator"). Da eseguire su un database già
-- esistente, dopo add_creator_role.sql (e tutte le migrazioni precedenti
-- elencate lì).
--
-- Un torneo di test è un torneo come gli altri, solo con giocatori finti
-- generabili in blocco e giornate che si possono simulare all'istante
-- invece di aspettare il calendario reale (vedi addTestPlayers e
-- simulateMatchday in src/lib/queries.ts). Nessuna regola di gioco
-- cambia. Creabile solo da un account con profiles.role = 'creator'
-- (verificato lato Server Action, non da RLS: vedi
-- src/app/dashboard/actions.ts).

set role postgres;

alter table tournaments
  add column if not exists is_test boolean not null default false;
