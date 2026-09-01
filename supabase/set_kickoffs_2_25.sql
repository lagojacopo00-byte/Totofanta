-- Totofanta — giorni delle partite per le giornate 2-25 di Serie A
-- 2026/2027 (la giornata 1 è già stata popolata da
-- set_matchday1_kickoffs.sql). Generato da scratch_generate_kickoffs.mjs.
--
-- A differenza della giornata 1 (già giocata, orari reali), queste
-- giornate sono ancora nel futuro rispetto a 'oggi': l'orario tv esatto
-- di ogni singola partita non è ancora stato deciso nella realtà, quindi
-- non può essere 'trovato' da nessuna parte. Quello che INVECE è fissato
-- in anticipo dal calendario stagionale è il weekend giusto di ogni
-- giornata (fonte: ricerca web). Qui si usa quel weekend reale, con le
-- partite divise a metà tra sabato e domenica (ordine come nel seed) a
-- un orario indicativo delle 15:00 — solo il GIORNO è da considerare
-- affidabile, non l'ora esatta (l'utente ha confermato che gli serve
-- solo quello). Le giornate 9 e 18 sono infrasettimanali (mercoledì),
-- tutte le partite in un solo giorno.

set role postgres;

-- Giornata 2
update serie_a_fixtures set kickoff_at = '2026-08-29T15:00:00+02:00' where round = 2 and home_team = 'Atalanta' and away_team = 'Bologna';
update serie_a_fixtures set kickoff_at = '2026-08-29T15:00:00+02:00' where round = 2 and home_team = 'Cagliari' and away_team = 'Inter';
update serie_a_fixtures set kickoff_at = '2026-08-29T15:00:00+02:00' where round = 2 and home_team = 'Fiorentina' and away_team = 'Frosinone';
update serie_a_fixtures set kickoff_at = '2026-08-29T15:00:00+02:00' where round = 2 and home_team = 'Juventus' and away_team = 'Parma';
update serie_a_fixtures set kickoff_at = '2026-08-29T15:00:00+02:00' where round = 2 and home_team = 'Lazio' and away_team = 'Genoa';
update serie_a_fixtures set kickoff_at = '2026-08-30T15:00:00+02:00' where round = 2 and home_team = 'Lecce' and away_team = 'Roma';
update serie_a_fixtures set kickoff_at = '2026-08-30T15:00:00+02:00' where round = 2 and home_team = 'Milan' and away_team = 'Venezia';
update serie_a_fixtures set kickoff_at = '2026-08-30T15:00:00+02:00' where round = 2 and home_team = 'Monza' and away_team = 'Udinese';
update serie_a_fixtures set kickoff_at = '2026-08-30T15:00:00+02:00' where round = 2 and home_team = 'Napoli' and away_team = 'Como';
update serie_a_fixtures set kickoff_at = '2026-08-30T15:00:00+02:00' where round = 2 and home_team = 'Sassuolo' and away_team = 'Torino';

-- Giornata 3
update serie_a_fixtures set kickoff_at = '2026-09-05T15:00:00+02:00' where round = 3 and home_team = 'Bologna' and away_team = 'Sassuolo';
update serie_a_fixtures set kickoff_at = '2026-09-05T15:00:00+02:00' where round = 3 and home_team = 'Cagliari' and away_team = 'Lecce';
update serie_a_fixtures set kickoff_at = '2026-09-05T15:00:00+02:00' where round = 3 and home_team = 'Fiorentina' and away_team = 'Torino';
update serie_a_fixtures set kickoff_at = '2026-09-05T15:00:00+02:00' where round = 3 and home_team = 'Frosinone' and away_team = 'Venezia';
update serie_a_fixtures set kickoff_at = '2026-09-05T15:00:00+02:00' where round = 3 and home_team = 'Genoa' and away_team = 'Como';
update serie_a_fixtures set kickoff_at = '2026-09-06T15:00:00+02:00' where round = 3 and home_team = 'Inter' and away_team = 'Napoli';
update serie_a_fixtures set kickoff_at = '2026-09-06T15:00:00+02:00' where round = 3 and home_team = 'Juventus' and away_team = 'Milan';
update serie_a_fixtures set kickoff_at = '2026-09-06T15:00:00+02:00' where round = 3 and home_team = 'Parma' and away_team = 'Monza';
update serie_a_fixtures set kickoff_at = '2026-09-06T15:00:00+02:00' where round = 3 and home_team = 'Roma' and away_team = 'Atalanta';
update serie_a_fixtures set kickoff_at = '2026-09-06T15:00:00+02:00' where round = 3 and home_team = 'Udinese' and away_team = 'Lazio';

-- Giornata 4
update serie_a_fixtures set kickoff_at = '2026-09-12T15:00:00+02:00' where round = 4 and home_team = 'Atalanta' and away_team = 'Cagliari';
update serie_a_fixtures set kickoff_at = '2026-09-12T15:00:00+02:00' where round = 4 and home_team = 'Como' and away_team = 'Parma';
update serie_a_fixtures set kickoff_at = '2026-09-12T15:00:00+02:00' where round = 4 and home_team = 'Genoa' and away_team = 'Frosinone';
update serie_a_fixtures set kickoff_at = '2026-09-12T15:00:00+02:00' where round = 4 and home_team = 'Inter' and away_team = 'Udinese';
update serie_a_fixtures set kickoff_at = '2026-09-12T15:00:00+02:00' where round = 4 and home_team = 'Lazio' and away_team = 'Milan';
update serie_a_fixtures set kickoff_at = '2026-09-13T15:00:00+02:00' where round = 4 and home_team = 'Lecce' and away_team = 'Monza';
update serie_a_fixtures set kickoff_at = '2026-09-13T15:00:00+02:00' where round = 4 and home_team = 'Napoli' and away_team = 'Bologna';
update serie_a_fixtures set kickoff_at = '2026-09-13T15:00:00+02:00' where round = 4 and home_team = 'Sassuolo' and away_team = 'Juventus';
update serie_a_fixtures set kickoff_at = '2026-09-13T15:00:00+02:00' where round = 4 and home_team = 'Torino' and away_team = 'Roma';
update serie_a_fixtures set kickoff_at = '2026-09-13T15:00:00+02:00' where round = 4 and home_team = 'Venezia' and away_team = 'Fiorentina';

-- Giornata 5
update serie_a_fixtures set kickoff_at = '2026-09-19T15:00:00+02:00' where round = 5 and home_team = 'Bologna' and away_team = 'Torino';
update serie_a_fixtures set kickoff_at = '2026-09-19T15:00:00+02:00' where round = 5 and home_team = 'Fiorentina' and away_team = 'Napoli';
update serie_a_fixtures set kickoff_at = '2026-09-19T15:00:00+02:00' where round = 5 and home_team = 'Frosinone' and away_team = 'Como';
update serie_a_fixtures set kickoff_at = '2026-09-19T15:00:00+02:00' where round = 5 and home_team = 'Juventus' and away_team = 'Atalanta';
update serie_a_fixtures set kickoff_at = '2026-09-19T15:00:00+02:00' where round = 5 and home_team = 'Milan' and away_team = 'Lecce';
update serie_a_fixtures set kickoff_at = '2026-09-20T15:00:00+02:00' where round = 5 and home_team = 'Monza' and away_team = 'Sassuolo';
update serie_a_fixtures set kickoff_at = '2026-09-20T15:00:00+02:00' where round = 5 and home_team = 'Parma' and away_team = 'Genoa';
update serie_a_fixtures set kickoff_at = '2026-09-20T15:00:00+02:00' where round = 5 and home_team = 'Roma' and away_team = 'Inter';
update serie_a_fixtures set kickoff_at = '2026-09-20T15:00:00+02:00' where round = 5 and home_team = 'Udinese' and away_team = 'Cagliari';
update serie_a_fixtures set kickoff_at = '2026-09-20T15:00:00+02:00' where round = 5 and home_team = 'Venezia' and away_team = 'Lazio';

-- Giornata 6
update serie_a_fixtures set kickoff_at = '2026-10-10T15:00:00+02:00' where round = 6 and home_team = 'Atalanta' and away_team = 'Venezia';
update serie_a_fixtures set kickoff_at = '2026-10-10T15:00:00+02:00' where round = 6 and home_team = 'Cagliari' and away_team = 'Juventus';
update serie_a_fixtures set kickoff_at = '2026-10-10T15:00:00+02:00' where round = 6 and home_team = 'Como' and away_team = 'Roma';
update serie_a_fixtures set kickoff_at = '2026-10-10T15:00:00+02:00' where round = 6 and home_team = 'Genoa' and away_team = 'Fiorentina';
update serie_a_fixtures set kickoff_at = '2026-10-10T15:00:00+02:00' where round = 6 and home_team = 'Inter' and away_team = 'Parma';
update serie_a_fixtures set kickoff_at = '2026-10-11T15:00:00+02:00' where round = 6 and home_team = 'Lazio' and away_team = 'Monza';
update serie_a_fixtures set kickoff_at = '2026-10-11T15:00:00+02:00' where round = 6 and home_team = 'Lecce' and away_team = 'Bologna';
update serie_a_fixtures set kickoff_at = '2026-10-11T15:00:00+02:00' where round = 6 and home_team = 'Napoli' and away_team = 'Frosinone';
update serie_a_fixtures set kickoff_at = '2026-10-11T15:00:00+02:00' where round = 6 and home_team = 'Sassuolo' and away_team = 'Milan';
update serie_a_fixtures set kickoff_at = '2026-10-11T15:00:00+02:00' where round = 6 and home_team = 'Torino' and away_team = 'Udinese';

-- Giornata 7
update serie_a_fixtures set kickoff_at = '2026-10-17T15:00:00+02:00' where round = 7 and home_team = 'Bologna' and away_team = 'Inter';
update serie_a_fixtures set kickoff_at = '2026-10-17T15:00:00+02:00' where round = 7 and home_team = 'Fiorentina' and away_team = 'Como';
update serie_a_fixtures set kickoff_at = '2026-10-17T15:00:00+02:00' where round = 7 and home_team = 'Frosinone' and away_team = 'Sassuolo';
update serie_a_fixtures set kickoff_at = '2026-10-17T15:00:00+02:00' where round = 7 and home_team = 'Juventus' and away_team = 'Lazio';
update serie_a_fixtures set kickoff_at = '2026-10-17T15:00:00+02:00' where round = 7 and home_team = 'Milan' and away_team = 'Atalanta';
update serie_a_fixtures set kickoff_at = '2026-10-18T15:00:00+02:00' where round = 7 and home_team = 'Monza' and away_team = 'Cagliari';
update serie_a_fixtures set kickoff_at = '2026-10-18T15:00:00+02:00' where round = 7 and home_team = 'Parma' and away_team = 'Torino';
update serie_a_fixtures set kickoff_at = '2026-10-18T15:00:00+02:00' where round = 7 and home_team = 'Roma' and away_team = 'Genoa';
update serie_a_fixtures set kickoff_at = '2026-10-18T15:00:00+02:00' where round = 7 and home_team = 'Udinese' and away_team = 'Lecce';
update serie_a_fixtures set kickoff_at = '2026-10-18T15:00:00+02:00' where round = 7 and home_team = 'Venezia' and away_team = 'Napoli';

-- Giornata 8
update serie_a_fixtures set kickoff_at = '2026-10-24T15:00:00+02:00' where round = 8 and home_team = 'Atalanta' and away_team = 'Frosinone';
update serie_a_fixtures set kickoff_at = '2026-10-24T15:00:00+02:00' where round = 8 and home_team = 'Cagliari' and away_team = 'Bologna';
update serie_a_fixtures set kickoff_at = '2026-10-24T15:00:00+02:00' where round = 8 and home_team = 'Como' and away_team = 'Sassuolo';
update serie_a_fixtures set kickoff_at = '2026-10-24T15:00:00+02:00' where round = 8 and home_team = 'Genoa' and away_team = 'Venezia';
update serie_a_fixtures set kickoff_at = '2026-10-24T15:00:00+02:00' where round = 8 and home_team = 'Inter' and away_team = 'Fiorentina';
update serie_a_fixtures set kickoff_at = '2026-10-25T15:00:00+01:00' where round = 8 and home_team = 'Lazio' and away_team = 'Parma';
update serie_a_fixtures set kickoff_at = '2026-10-25T15:00:00+01:00' where round = 8 and home_team = 'Lecce' and away_team = 'Juventus';
update serie_a_fixtures set kickoff_at = '2026-10-25T15:00:00+01:00' where round = 8 and home_team = 'Napoli' and away_team = 'Roma';
update serie_a_fixtures set kickoff_at = '2026-10-25T15:00:00+01:00' where round = 8 and home_team = 'Torino' and away_team = 'Monza';
update serie_a_fixtures set kickoff_at = '2026-10-25T15:00:00+01:00' where round = 8 and home_team = 'Udinese' and away_team = 'Milan';

-- Giornata 9
update serie_a_fixtures set kickoff_at = '2026-10-28T20:45:00+01:00' where round = 9 and home_team = 'Fiorentina' and away_team = 'Atalanta';
update serie_a_fixtures set kickoff_at = '2026-10-28T20:45:00+01:00' where round = 9 and home_team = 'Frosinone' and away_team = 'Lecce';
update serie_a_fixtures set kickoff_at = '2026-10-28T20:45:00+01:00' where round = 9 and home_team = 'Genoa' and away_team = 'Juventus';
update serie_a_fixtures set kickoff_at = '2026-10-28T20:45:00+01:00' where round = 9 and home_team = 'Milan' and away_team = 'Bologna';
update serie_a_fixtures set kickoff_at = '2026-10-28T20:45:00+01:00' where round = 9 and home_team = 'Monza' and away_team = 'Napoli';
update serie_a_fixtures set kickoff_at = '2026-10-28T20:45:00+01:00' where round = 9 and home_team = 'Parma' and away_team = 'Udinese';
update serie_a_fixtures set kickoff_at = '2026-10-28T20:45:00+01:00' where round = 9 and home_team = 'Roma' and away_team = 'Cagliari';
update serie_a_fixtures set kickoff_at = '2026-10-28T20:45:00+01:00' where round = 9 and home_team = 'Sassuolo' and away_team = 'Lazio';
update serie_a_fixtures set kickoff_at = '2026-10-28T20:45:00+01:00' where round = 9 and home_team = 'Torino' and away_team = 'Como';
update serie_a_fixtures set kickoff_at = '2026-10-28T20:45:00+01:00' where round = 9 and home_team = 'Venezia' and away_team = 'Inter';

-- Giornata 10
update serie_a_fixtures set kickoff_at = '2026-10-31T15:00:00+01:00' where round = 10 and home_team = 'Atalanta' and away_team = 'Parma';
update serie_a_fixtures set kickoff_at = '2026-10-31T15:00:00+01:00' where round = 10 and home_team = 'Bologna' and away_team = 'Monza';
update serie_a_fixtures set kickoff_at = '2026-10-31T15:00:00+01:00' where round = 10 and home_team = 'Como' and away_team = 'Venezia';
update serie_a_fixtures set kickoff_at = '2026-10-31T15:00:00+01:00' where round = 10 and home_team = 'Frosinone' and away_team = 'Torino';
update serie_a_fixtures set kickoff_at = '2026-10-31T15:00:00+01:00' where round = 10 and home_team = 'Juventus' and away_team = 'Napoli';
update serie_a_fixtures set kickoff_at = '2026-11-01T15:00:00+01:00' where round = 10 and home_team = 'Lazio' and away_team = 'Cagliari';
update serie_a_fixtures set kickoff_at = '2026-11-01T15:00:00+01:00' where round = 10 and home_team = 'Lecce' and away_team = 'Genoa';
update serie_a_fixtures set kickoff_at = '2026-11-01T15:00:00+01:00' where round = 10 and home_team = 'Milan' and away_team = 'Inter';
update serie_a_fixtures set kickoff_at = '2026-11-01T15:00:00+01:00' where round = 10 and home_team = 'Sassuolo' and away_team = 'Fiorentina';
update serie_a_fixtures set kickoff_at = '2026-11-01T15:00:00+01:00' where round = 10 and home_team = 'Udinese' and away_team = 'Roma';

-- Giornata 11
update serie_a_fixtures set kickoff_at = '2026-11-07T15:00:00+01:00' where round = 11 and home_team = 'Cagliari' and away_team = 'Frosinone';
update serie_a_fixtures set kickoff_at = '2026-11-07T15:00:00+01:00' where round = 11 and home_team = 'Fiorentina' and away_team = 'Juventus';
update serie_a_fixtures set kickoff_at = '2026-11-07T15:00:00+01:00' where round = 11 and home_team = 'Genoa' and away_team = 'Milan';
update serie_a_fixtures set kickoff_at = '2026-11-07T15:00:00+01:00' where round = 11 and home_team = 'Inter' and away_team = 'Como';
update serie_a_fixtures set kickoff_at = '2026-11-07T15:00:00+01:00' where round = 11 and home_team = 'Monza' and away_team = 'Atalanta';
update serie_a_fixtures set kickoff_at = '2026-11-08T15:00:00+01:00' where round = 11 and home_team = 'Napoli' and away_team = 'Lazio';
update serie_a_fixtures set kickoff_at = '2026-11-08T15:00:00+01:00' where round = 11 and home_team = 'Parma' and away_team = 'Bologna';
update serie_a_fixtures set kickoff_at = '2026-11-08T15:00:00+01:00' where round = 11 and home_team = 'Roma' and away_team = 'Sassuolo';
update serie_a_fixtures set kickoff_at = '2026-11-08T15:00:00+01:00' where round = 11 and home_team = 'Torino' and away_team = 'Lecce';
update serie_a_fixtures set kickoff_at = '2026-11-08T15:00:00+01:00' where round = 11 and home_team = 'Venezia' and away_team = 'Udinese';

-- Giornata 12
update serie_a_fixtures set kickoff_at = '2026-11-21T15:00:00+01:00' where round = 12 and home_team = 'Atalanta' and away_team = 'Inter';
update serie_a_fixtures set kickoff_at = '2026-11-21T15:00:00+01:00' where round = 12 and home_team = 'Bologna' and away_team = 'Udinese';
update serie_a_fixtures set kickoff_at = '2026-11-21T15:00:00+01:00' where round = 12 and home_team = 'Como' and away_team = 'Cagliari';
update serie_a_fixtures set kickoff_at = '2026-11-21T15:00:00+01:00' where round = 12 and home_team = 'Juventus' and away_team = 'Venezia';
update serie_a_fixtures set kickoff_at = '2026-11-21T15:00:00+01:00' where round = 12 and home_team = 'Lazio' and away_team = 'Lecce';
update serie_a_fixtures set kickoff_at = '2026-11-22T15:00:00+01:00' where round = 12 and home_team = 'Milan' and away_team = 'Frosinone';
update serie_a_fixtures set kickoff_at = '2026-11-22T15:00:00+01:00' where round = 12 and home_team = 'Monza' and away_team = 'Fiorentina';
update serie_a_fixtures set kickoff_at = '2026-11-22T15:00:00+01:00' where round = 12 and home_team = 'Napoli' and away_team = 'Torino';
update serie_a_fixtures set kickoff_at = '2026-11-22T15:00:00+01:00' where round = 12 and home_team = 'Parma' and away_team = 'Roma';
update serie_a_fixtures set kickoff_at = '2026-11-22T15:00:00+01:00' where round = 12 and home_team = 'Sassuolo' and away_team = 'Genoa';

-- Giornata 13
update serie_a_fixtures set kickoff_at = '2026-11-28T15:00:00+01:00' where round = 13 and home_team = 'Cagliari' and away_team = 'Milan';
update serie_a_fixtures set kickoff_at = '2026-11-28T15:00:00+01:00' where round = 13 and home_team = 'Como' and away_team = 'Juventus';
update serie_a_fixtures set kickoff_at = '2026-11-28T15:00:00+01:00' where round = 13 and home_team = 'Frosinone' and away_team = 'Parma';
update serie_a_fixtures set kickoff_at = '2026-11-28T15:00:00+01:00' where round = 13 and home_team = 'Inter' and away_team = 'Genoa';
update serie_a_fixtures set kickoff_at = '2026-11-28T15:00:00+01:00' where round = 13 and home_team = 'Lecce' and away_team = 'Atalanta';
update serie_a_fixtures set kickoff_at = '2026-11-29T15:00:00+01:00' where round = 13 and home_team = 'Roma' and away_team = 'Monza';
update serie_a_fixtures set kickoff_at = '2026-11-29T15:00:00+01:00' where round = 13 and home_team = 'Sassuolo' and away_team = 'Napoli';
update serie_a_fixtures set kickoff_at = '2026-11-29T15:00:00+01:00' where round = 13 and home_team = 'Torino' and away_team = 'Lazio';
update serie_a_fixtures set kickoff_at = '2026-11-29T15:00:00+01:00' where round = 13 and home_team = 'Udinese' and away_team = 'Fiorentina';
update serie_a_fixtures set kickoff_at = '2026-11-29T15:00:00+01:00' where round = 13 and home_team = 'Venezia' and away_team = 'Bologna';

-- Giornata 14
update serie_a_fixtures set kickoff_at = '2026-12-05T15:00:00+01:00' where round = 14 and home_team = 'Bologna' and away_team = 'Roma';
update serie_a_fixtures set kickoff_at = '2026-12-05T15:00:00+01:00' where round = 14 and home_team = 'Fiorentina' and away_team = 'Cagliari';
update serie_a_fixtures set kickoff_at = '2026-12-05T15:00:00+01:00' where round = 14 and home_team = 'Frosinone' and away_team = 'Inter';
update serie_a_fixtures set kickoff_at = '2026-12-05T15:00:00+01:00' where round = 14 and home_team = 'Genoa' and away_team = 'Torino';
update serie_a_fixtures set kickoff_at = '2026-12-05T15:00:00+01:00' where round = 14 and home_team = 'Juventus' and away_team = 'Udinese';
update serie_a_fixtures set kickoff_at = '2026-12-06T15:00:00+01:00' where round = 14 and home_team = 'Lazio' and away_team = 'Atalanta';
update serie_a_fixtures set kickoff_at = '2026-12-06T15:00:00+01:00' where round = 14 and home_team = 'Milan' and away_team = 'Parma';
update serie_a_fixtures set kickoff_at = '2026-12-06T15:00:00+01:00' where round = 14 and home_team = 'Monza' and away_team = 'Como';
update serie_a_fixtures set kickoff_at = '2026-12-06T15:00:00+01:00' where round = 14 and home_team = 'Napoli' and away_team = 'Lecce';
update serie_a_fixtures set kickoff_at = '2026-12-06T15:00:00+01:00' where round = 14 and home_team = 'Venezia' and away_team = 'Sassuolo';

-- Giornata 15
update serie_a_fixtures set kickoff_at = '2026-12-12T15:00:00+01:00' where round = 15 and home_team = 'Atalanta' and away_team = 'Genoa';
update serie_a_fixtures set kickoff_at = '2026-12-12T15:00:00+01:00' where round = 15 and home_team = 'Cagliari' and away_team = 'Venezia';
update serie_a_fixtures set kickoff_at = '2026-12-12T15:00:00+01:00' where round = 15 and home_team = 'Como' and away_team = 'Bologna';
update serie_a_fixtures set kickoff_at = '2026-12-12T15:00:00+01:00' where round = 15 and home_team = 'Inter' and away_team = 'Torino';
update serie_a_fixtures set kickoff_at = '2026-12-12T15:00:00+01:00' where round = 15 and home_team = 'Juventus' and away_team = 'Monza';
update serie_a_fixtures set kickoff_at = '2026-12-13T15:00:00+01:00' where round = 15 and home_team = 'Lazio' and away_team = 'Roma';
update serie_a_fixtures set kickoff_at = '2026-12-13T15:00:00+01:00' where round = 15 and home_team = 'Lecce' and away_team = 'Sassuolo';
update serie_a_fixtures set kickoff_at = '2026-12-13T15:00:00+01:00' where round = 15 and home_team = 'Napoli' and away_team = 'Milan';
update serie_a_fixtures set kickoff_at = '2026-12-13T15:00:00+01:00' where round = 15 and home_team = 'Parma' and away_team = 'Fiorentina';
update serie_a_fixtures set kickoff_at = '2026-12-13T15:00:00+01:00' where round = 15 and home_team = 'Udinese' and away_team = 'Frosinone';

-- Giornata 16
update serie_a_fixtures set kickoff_at = '2026-12-19T15:00:00+01:00' where round = 16 and home_team = 'Atalanta' and away_team = 'Napoli';
update serie_a_fixtures set kickoff_at = '2026-12-19T15:00:00+01:00' where round = 16 and home_team = 'Fiorentina' and away_team = 'Bologna';
update serie_a_fixtures set kickoff_at = '2026-12-19T15:00:00+01:00' where round = 16 and home_team = 'Frosinone' and away_team = 'Lazio';
update serie_a_fixtures set kickoff_at = '2026-12-19T15:00:00+01:00' where round = 16 and home_team = 'Genoa' and away_team = 'Udinese';
update serie_a_fixtures set kickoff_at = '2026-12-19T15:00:00+01:00' where round = 16 and home_team = 'Lecce' and away_team = 'Inter';
update serie_a_fixtures set kickoff_at = '2026-12-20T15:00:00+01:00' where round = 16 and home_team = 'Milan' and away_team = 'Como';
update serie_a_fixtures set kickoff_at = '2026-12-20T15:00:00+01:00' where round = 16 and home_team = 'Roma' and away_team = 'Juventus';
update serie_a_fixtures set kickoff_at = '2026-12-20T15:00:00+01:00' where round = 16 and home_team = 'Sassuolo' and away_team = 'Parma';
update serie_a_fixtures set kickoff_at = '2026-12-20T15:00:00+01:00' where round = 16 and home_team = 'Torino' and away_team = 'Cagliari';
update serie_a_fixtures set kickoff_at = '2026-12-20T15:00:00+01:00' where round = 16 and home_team = 'Venezia' and away_team = 'Monza';

-- Giornata 17
update serie_a_fixtures set kickoff_at = '2027-01-02T15:00:00+01:00' where round = 17 and home_team = 'Bologna' and away_team = 'Juventus';
update serie_a_fixtures set kickoff_at = '2027-01-02T15:00:00+01:00' where round = 17 and home_team = 'Cagliari' and away_team = 'Genoa';
update serie_a_fixtures set kickoff_at = '2027-01-02T15:00:00+01:00' where round = 17 and home_team = 'Como' and away_team = 'Lecce';
update serie_a_fixtures set kickoff_at = '2027-01-02T15:00:00+01:00' where round = 17 and home_team = 'Fiorentina' and away_team = 'Lazio';
update serie_a_fixtures set kickoff_at = '2027-01-02T15:00:00+01:00' where round = 17 and home_team = 'Inter' and away_team = 'Sassuolo';
update serie_a_fixtures set kickoff_at = '2027-01-03T15:00:00+01:00' where round = 17 and home_team = 'Monza' and away_team = 'Milan';
update serie_a_fixtures set kickoff_at = '2027-01-03T15:00:00+01:00' where round = 17 and home_team = 'Parma' and away_team = 'Napoli';
update serie_a_fixtures set kickoff_at = '2027-01-03T15:00:00+01:00' where round = 17 and home_team = 'Roma' and away_team = 'Frosinone';
update serie_a_fixtures set kickoff_at = '2027-01-03T15:00:00+01:00' where round = 17 and home_team = 'Torino' and away_team = 'Venezia';
update serie_a_fixtures set kickoff_at = '2027-01-03T15:00:00+01:00' where round = 17 and home_team = 'Udinese' and away_team = 'Atalanta';

-- Giornata 18
update serie_a_fixtures set kickoff_at = '2027-01-06T20:45:00+01:00' where round = 18 and home_team = 'Atalanta' and away_team = 'Como';
update serie_a_fixtures set kickoff_at = '2027-01-06T20:45:00+01:00' where round = 18 and home_team = 'Frosinone' and away_team = 'Bologna';
update serie_a_fixtures set kickoff_at = '2027-01-06T20:45:00+01:00' where round = 18 and home_team = 'Genoa' and away_team = 'Monza';
update serie_a_fixtures set kickoff_at = '2027-01-06T20:45:00+01:00' where round = 18 and home_team = 'Juventus' and away_team = 'Torino';
update serie_a_fixtures set kickoff_at = '2027-01-06T20:45:00+01:00' where round = 18 and home_team = 'Lazio' and away_team = 'Inter';
update serie_a_fixtures set kickoff_at = '2027-01-06T20:45:00+01:00' where round = 18 and home_team = 'Lecce' and away_team = 'Parma';
update serie_a_fixtures set kickoff_at = '2027-01-06T20:45:00+01:00' where round = 18 and home_team = 'Milan' and away_team = 'Fiorentina';
update serie_a_fixtures set kickoff_at = '2027-01-06T20:45:00+01:00' where round = 18 and home_team = 'Napoli' and away_team = 'Cagliari';
update serie_a_fixtures set kickoff_at = '2027-01-06T20:45:00+01:00' where round = 18 and home_team = 'Sassuolo' and away_team = 'Udinese';
update serie_a_fixtures set kickoff_at = '2027-01-06T20:45:00+01:00' where round = 18 and home_team = 'Venezia' and away_team = 'Roma';

-- Giornata 19
update serie_a_fixtures set kickoff_at = '2027-01-09T15:00:00+01:00' where round = 19 and home_team = 'Bologna' and away_team = 'Genoa';
update serie_a_fixtures set kickoff_at = '2027-01-09T15:00:00+01:00' where round = 19 and home_team = 'Cagliari' and away_team = 'Sassuolo';
update serie_a_fixtures set kickoff_at = '2027-01-09T15:00:00+01:00' where round = 19 and home_team = 'Como' and away_team = 'Lazio';
update serie_a_fixtures set kickoff_at = '2027-01-09T15:00:00+01:00' where round = 19 and home_team = 'Fiorentina' and away_team = 'Lecce';
update serie_a_fixtures set kickoff_at = '2027-01-09T15:00:00+01:00' where round = 19 and home_team = 'Inter' and away_team = 'Juventus';
update serie_a_fixtures set kickoff_at = '2027-01-10T15:00:00+01:00' where round = 19 and home_team = 'Monza' and away_team = 'Frosinone';
update serie_a_fixtures set kickoff_at = '2027-01-10T15:00:00+01:00' where round = 19 and home_team = 'Parma' and away_team = 'Venezia';
update serie_a_fixtures set kickoff_at = '2027-01-10T15:00:00+01:00' where round = 19 and home_team = 'Roma' and away_team = 'Milan';
update serie_a_fixtures set kickoff_at = '2027-01-10T15:00:00+01:00' where round = 19 and home_team = 'Torino' and away_team = 'Atalanta';
update serie_a_fixtures set kickoff_at = '2027-01-10T15:00:00+01:00' where round = 19 and home_team = 'Udinese' and away_team = 'Napoli';

-- Giornata 20
update serie_a_fixtures set kickoff_at = '2027-01-16T15:00:00+01:00' where round = 20 and home_team = 'Atalanta' and away_team = 'Roma';
update serie_a_fixtures set kickoff_at = '2027-01-16T15:00:00+01:00' where round = 20 and home_team = 'Cagliari' and away_team = 'Como';
update serie_a_fixtures set kickoff_at = '2027-01-16T15:00:00+01:00' where round = 20 and home_team = 'Juventus' and away_team = 'Genoa';
update serie_a_fixtures set kickoff_at = '2027-01-16T15:00:00+01:00' where round = 20 and home_team = 'Lazio' and away_team = 'Bologna';
update serie_a_fixtures set kickoff_at = '2027-01-16T15:00:00+01:00' where round = 20 and home_team = 'Lecce' and away_team = 'Udinese';
update serie_a_fixtures set kickoff_at = '2027-01-17T15:00:00+01:00' where round = 20 and home_team = 'Milan' and away_team = 'Torino';
update serie_a_fixtures set kickoff_at = '2027-01-17T15:00:00+01:00' where round = 20 and home_team = 'Napoli' and away_team = 'Fiorentina';
update serie_a_fixtures set kickoff_at = '2027-01-17T15:00:00+01:00' where round = 20 and home_team = 'Parma' and away_team = 'Inter';
update serie_a_fixtures set kickoff_at = '2027-01-17T15:00:00+01:00' where round = 20 and home_team = 'Sassuolo' and away_team = 'Monza';
update serie_a_fixtures set kickoff_at = '2027-01-17T15:00:00+01:00' where round = 20 and home_team = 'Venezia' and away_team = 'Frosinone';

-- Giornata 21
update serie_a_fixtures set kickoff_at = '2027-01-23T15:00:00+01:00' where round = 21 and home_team = 'Bologna' and away_team = 'Atalanta';
update serie_a_fixtures set kickoff_at = '2027-01-23T15:00:00+01:00' where round = 21 and home_team = 'Como' and away_team = 'Napoli';
update serie_a_fixtures set kickoff_at = '2027-01-23T15:00:00+01:00' where round = 21 and home_team = 'Fiorentina' and away_team = 'Sassuolo';
update serie_a_fixtures set kickoff_at = '2027-01-23T15:00:00+01:00' where round = 21 and home_team = 'Frosinone' and away_team = 'Milan';
update serie_a_fixtures set kickoff_at = '2027-01-23T15:00:00+01:00' where round = 21 and home_team = 'Genoa' and away_team = 'Parma';
update serie_a_fixtures set kickoff_at = '2027-01-24T15:00:00+01:00' where round = 21 and home_team = 'Inter' and away_team = 'Venezia';
update serie_a_fixtures set kickoff_at = '2027-01-24T15:00:00+01:00' where round = 21 and home_team = 'Juventus' and away_team = 'Cagliari';
update serie_a_fixtures set kickoff_at = '2027-01-24T15:00:00+01:00' where round = 21 and home_team = 'Lecce' and away_team = 'Torino';
update serie_a_fixtures set kickoff_at = '2027-01-24T15:00:00+01:00' where round = 21 and home_team = 'Monza' and away_team = 'Lazio';
update serie_a_fixtures set kickoff_at = '2027-01-24T15:00:00+01:00' where round = 21 and home_team = 'Roma' and away_team = 'Udinese';

-- Giornata 22
update serie_a_fixtures set kickoff_at = '2027-01-30T15:00:00+01:00' where round = 22 and home_team = 'Atalanta' and away_team = 'Fiorentina';
update serie_a_fixtures set kickoff_at = '2027-01-30T15:00:00+01:00' where round = 22 and home_team = 'Cagliari' and away_team = 'Parma';
update serie_a_fixtures set kickoff_at = '2027-01-30T15:00:00+01:00' where round = 22 and home_team = 'Genoa' and away_team = 'Lecce';
update serie_a_fixtures set kickoff_at = '2027-01-30T15:00:00+01:00' where round = 22 and home_team = 'Lazio' and away_team = 'Venezia';
update serie_a_fixtures set kickoff_at = '2027-01-30T15:00:00+01:00' where round = 22 and home_team = 'Milan' and away_team = 'Juventus';
update serie_a_fixtures set kickoff_at = '2027-01-31T15:00:00+01:00' where round = 22 and home_team = 'Monza' and away_team = 'Roma';
update serie_a_fixtures set kickoff_at = '2027-01-31T15:00:00+01:00' where round = 22 and home_team = 'Napoli' and away_team = 'Inter';
update serie_a_fixtures set kickoff_at = '2027-01-31T15:00:00+01:00' where round = 22 and home_team = 'Sassuolo' and away_team = 'Como';
update serie_a_fixtures set kickoff_at = '2027-01-31T15:00:00+01:00' where round = 22 and home_team = 'Torino' and away_team = 'Frosinone';
update serie_a_fixtures set kickoff_at = '2027-01-31T15:00:00+01:00' where round = 22 and home_team = 'Udinese' and away_team = 'Bologna';

-- Giornata 23
update serie_a_fixtures set kickoff_at = '2027-02-06T15:00:00+01:00' where round = 23 and home_team = 'Atalanta' and away_team = 'Lazio';
update serie_a_fixtures set kickoff_at = '2027-02-06T15:00:00+01:00' where round = 23 and home_team = 'Bologna' and away_team = 'Milan';
update serie_a_fixtures set kickoff_at = '2027-02-06T15:00:00+01:00' where round = 23 and home_team = 'Como' and away_team = 'Monza';
update serie_a_fixtures set kickoff_at = '2027-02-06T15:00:00+01:00' where round = 23 and home_team = 'Fiorentina' and away_team = 'Udinese';
update serie_a_fixtures set kickoff_at = '2027-02-06T15:00:00+01:00' where round = 23 and home_team = 'Inter' and away_team = 'Cagliari';
update serie_a_fixtures set kickoff_at = '2027-02-07T15:00:00+01:00' where round = 23 and home_team = 'Juventus' and away_team = 'Sassuolo';
update serie_a_fixtures set kickoff_at = '2027-02-07T15:00:00+01:00' where round = 23 and home_team = 'Lecce' and away_team = 'Napoli';
update serie_a_fixtures set kickoff_at = '2027-02-07T15:00:00+01:00' where round = 23 and home_team = 'Parma' and away_team = 'Frosinone';
update serie_a_fixtures set kickoff_at = '2027-02-07T15:00:00+01:00' where round = 23 and home_team = 'Roma' and away_team = 'Torino';
update serie_a_fixtures set kickoff_at = '2027-02-07T15:00:00+01:00' where round = 23 and home_team = 'Venezia' and away_team = 'Genoa';

-- Giornata 24
update serie_a_fixtures set kickoff_at = '2027-02-13T15:00:00+01:00' where round = 24 and home_team = 'Bologna' and away_team = 'Como';
update serie_a_fixtures set kickoff_at = '2027-02-13T15:00:00+01:00' where round = 24 and home_team = 'Cagliari' and away_team = 'Lazio';
update serie_a_fixtures set kickoff_at = '2027-02-13T15:00:00+01:00' where round = 24 and home_team = 'Frosinone' and away_team = 'Fiorentina';
update serie_a_fixtures set kickoff_at = '2027-02-13T15:00:00+01:00' where round = 24 and home_team = 'Genoa' and away_team = 'Atalanta';
update serie_a_fixtures set kickoff_at = '2027-02-13T15:00:00+01:00' where round = 24 and home_team = 'Inter' and away_team = 'Milan';
update serie_a_fixtures set kickoff_at = '2027-02-14T15:00:00+01:00' where round = 24 and home_team = 'Monza' and away_team = 'Lecce';
update serie_a_fixtures set kickoff_at = '2027-02-14T15:00:00+01:00' where round = 24 and home_team = 'Napoli' and away_team = 'Juventus';
update serie_a_fixtures set kickoff_at = '2027-02-14T15:00:00+01:00' where round = 24 and home_team = 'Roma' and away_team = 'Parma';
update serie_a_fixtures set kickoff_at = '2027-02-14T15:00:00+01:00' where round = 24 and home_team = 'Torino' and away_team = 'Sassuolo';
update serie_a_fixtures set kickoff_at = '2027-02-14T15:00:00+01:00' where round = 24 and home_team = 'Udinese' and away_team = 'Venezia';

-- Giornata 25
update serie_a_fixtures set kickoff_at = '2027-02-20T15:00:00+01:00' where round = 25 and home_team = 'Atalanta' and away_team = 'Monza';
update serie_a_fixtures set kickoff_at = '2027-02-20T15:00:00+01:00' where round = 25 and home_team = 'Como' and away_team = 'Torino';
update serie_a_fixtures set kickoff_at = '2027-02-20T15:00:00+01:00' where round = 25 and home_team = 'Fiorentina' and away_team = 'Inter';
update serie_a_fixtures set kickoff_at = '2027-02-20T15:00:00+01:00' where round = 25 and home_team = 'Juventus' and away_team = 'Bologna';
update serie_a_fixtures set kickoff_at = '2027-02-20T15:00:00+01:00' where round = 25 and home_team = 'Lazio' and away_team = 'Napoli';
update serie_a_fixtures set kickoff_at = '2027-02-21T15:00:00+01:00' where round = 25 and home_team = 'Lecce' and away_team = 'Frosinone';
update serie_a_fixtures set kickoff_at = '2027-02-21T15:00:00+01:00' where round = 25 and home_team = 'Milan' and away_team = 'Genoa';
update serie_a_fixtures set kickoff_at = '2027-02-21T15:00:00+01:00' where round = 25 and home_team = 'Sassuolo' and away_team = 'Roma';
update serie_a_fixtures set kickoff_at = '2027-02-21T15:00:00+01:00' where round = 25 and home_team = 'Udinese' and away_team = 'Parma';
update serie_a_fixtures set kickoff_at = '2027-02-21T15:00:00+01:00' where round = 25 and home_team = 'Venezia' and away_team = 'Cagliari';

