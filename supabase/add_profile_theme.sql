-- Totofanta — aggiunge la preferenza di tema (chiaro/scuro) al profilo,
-- selezionabile in /play/profile. Idempotente, non tocca account
-- esistenti (restano su 'light', il tema di default — "sabbia", vedi
-- docs/08_Direzione_visiva_UX.md).

set role postgres;

alter table profiles
  add column if not exists theme text not null default 'light'
  check (theme in ('light', 'dark'));
