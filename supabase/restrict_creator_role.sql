-- Totofanta — restringe il ruolo "creator" al solo account che gestisce
-- l'app (vedi docs/01_Visione_progetto.md e la discussione con l'utente
-- in docs/07_Task_sviluppo.md). Prima, "creator" si otteneva
-- automaticamente creando un torneo (add_creator_role.sql); ora che
-- "Crea torneo" è raggiungibile da /play per qualunque giocatore, questo
-- avrebbe reso "creator" chiunque organizzi un torneo — non è più quello
-- che vogliamo. Creare un torneo continua a rendere quell'account
-- organizzatore/"admin di lega" per QUEL torneo (tournaments.owner_id,
-- invariato): "creator" è un ruolo diverso, a sé, riservato a chi gestisce
-- l'app stessa.
--
-- Da eseguire su un database già esistente, dopo add_creator_role.sql.
-- Idempotente: si può rieseguire in sicurezza. Sostituisci l'email sotto
-- se in futuro l'account che gestisce l'app cambia.

set role postgres;

update profiles
set role = 'player'
where role = 'creator';

update profiles
set role = 'creator'
where id = (select id from auth.users where email = 'lagojacopo00@gmail.com');
