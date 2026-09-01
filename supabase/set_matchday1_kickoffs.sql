-- Totofanta — imposta data/ora delle 10 partite della giornata 1 di
-- Serie A 2026/2027 (oggi mancano su tutte le giornate 1-25 precaricate:
-- il seed iniziale aveva salvato solo gli accoppiamenti, mai gli orari).
-- Senza questo, il picker (/play/[tournamentId]) non può raggruppare le
-- partite per giorno e mostra sempre "Data da confermare" per tutte —
-- causa concreta per cui la divisione venerdì/sabato/domenica/lunedì non
-- si è mai vista in pratica sui tornei di test.
--
-- Fonte: ricerca web (corrieredellosport.it, ilfattoquotidiano.it — la
-- prima giornata si è giocata 22-24 agosto 2026). Orari con confidenza
-- alta per Inter-Monza e Udinese-Como (18:30 sabato, confermato da più
-- fonti indipendenti); gli altri orari sono ricostruiti sugli slot
-- standard di programmazione Serie A (sab 15/18/20:45, dom 12:30/15
-- doppia/18/20:45, lun 20:45) incrociati con le fonti disponibili — la
-- GIORNATA (sabato/domenica/lunedì) è affidabile, il MINUTO esatto un
-- po' meno: ricontrolla e correggi da /dashboard/fixtures se una
-- partita risulta spostata rispetto a quanto trasmesso in tv.
--
-- Idempotente: si può rieseguire in sicurezza (aggiorna sempre agli
-- stessi valori). Non tocca risultati/stato, solo kickoff_at.

set role postgres;

update serie_a_fixtures set kickoff_at = '2026-08-22T18:30:00+02:00'
  where round = 1 and home_team = 'Inter' and away_team = 'Monza';
update serie_a_fixtures set kickoff_at = '2026-08-22T18:30:00+02:00'
  where round = 1 and home_team = 'Udinese' and away_team = 'Como';
update serie_a_fixtures set kickoff_at = '2026-08-22T20:45:00+02:00'
  where round = 1 and home_team = 'Genoa' and away_team = 'Napoli';
update serie_a_fixtures set kickoff_at = '2026-08-22T15:00:00+02:00'
  where round = 1 and home_team = 'Parma' and away_team = 'Cagliari';
update serie_a_fixtures set kickoff_at = '2026-08-23T12:30:00+02:00'
  where round = 1 and home_team = 'Venezia' and away_team = 'Lecce';
update serie_a_fixtures set kickoff_at = '2026-08-23T15:00:00+02:00'
  where round = 1 and home_team = 'Atalanta' and away_team = 'Sassuolo';
update serie_a_fixtures set kickoff_at = '2026-08-23T15:00:00+02:00'
  where round = 1 and home_team = 'Torino' and away_team = 'Milan';
update serie_a_fixtures set kickoff_at = '2026-08-23T18:00:00+02:00'
  where round = 1 and home_team = 'Frosinone' and away_team = 'Juventus';
update serie_a_fixtures set kickoff_at = '2026-08-23T20:45:00+02:00'
  where round = 1 and home_team = 'Bologna' and away_team = 'Lazio';
update serie_a_fixtures set kickoff_at = '2026-08-24T20:45:00+02:00'
  where round = 1 and home_team = 'Roma' and away_team = 'Fiorentina';
