-- Totofanta — risultato reale di una partita di Serie A, caricato dal
-- creator (unico account con questo potere) da /dashboard/fixtures, così
-- non serve più che ogni admin di lega inserisca a mano lo stesso
-- risultato per il proprio torneo. Vedi docs/02_Regole_gioco.md e
-- docs/07_Task_sviluppo.md ("Risultati centralizzati dal creator").
--
-- Un solo esito per partita (non per squadra separatamente, come invece
-- fa matchday_results): da qui si derivano vittoria/pareggio/sconfitta di
-- entrambe le squadre coinvolte.
--
-- Da eseguire su un database già esistente. Idempotente.

set role postgres;

alter table serie_a_fixtures
  add column if not exists result text
  check (result in ('home_win', 'draw', 'away_win'));
