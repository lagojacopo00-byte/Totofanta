-- Aggiunge il ruolo globale "creator" sui profili (vedi la discussione in
-- docs/01_Visione_progetto.md e docs/07_Task_sviluppo.md, task "ruoli
-- PLAYER/ADMIN"). Da eseguire su un database già esistente, dopo
-- fix_rls_recursion.sql, add_self_join.sql, add_features.sql,
-- add_tutorial.sql, add_custom_teams_delete.sql,
-- rename_slot_labels_to_numbers.sql.
--
-- Decisione presa con l'utente: "creator" è un ruolo unico di
-- piattaforma, distinto dall'essere organizzatore di un singolo torneo
-- (tournaments.owner_id). Per non introdurre nessuna restrizione nuova
-- (chiunque può già creare un torneo oggi), il ruolo si limita a
-- rendere esplicito chi si comporta già da organizzatore: si diventa
-- "creator" automaticamente creando un torneo (lato applicazione, vedi
-- createTournamentAction), e qui sotto promuoviamo subito chi ha già
-- creato almeno un torneo in passato, così il dato riflette la realtà
-- da subito. Login e redirect non cambiano in questo passaggio.

set role postgres;

alter table profiles
  add column if not exists role text not null default 'player';

alter table profiles drop constraint if exists profiles_role_check;
alter table profiles
  add constraint profiles_role_check check (role in ('player', 'creator'));

update profiles
set role = 'creator'
where id in (select distinct owner_id from tournaments);
