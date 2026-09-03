-- Totofanta — nome e cognome sul profilo (distinti dal "nome pubblico",
-- che resta un nickname a scelta libera). Idea: se qualcuno si sceglie
-- un nome pubblico strano, gli altri giocatori possono comunque vedere
-- chi è davvero guardando nome/cognome, mostrati vicino al nome
-- pubblico nella classifica di ogni torneo. Nessuno dei due obbligatorio.
--
-- Da eseguire su un database già esistente. Idempotente.

set role postgres;

alter table profiles
  add column if not exists first_name text,
  add column if not exists last_name text;
