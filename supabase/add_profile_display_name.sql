-- Totofanta — nome pubblico modificabile dall'utente (docs/08_Direzione_visiva_UX.md,
-- "Identità pubblica vs dati privati"). Deciso con l'utente: un solo nome
-- per account, valido su tutti i tornei — quando impostato, sovrascrive
-- ovunque il players.display_name che l'organizzatore ha messo per quel
-- singolo torneo (vedi resolveDisplayName in src/lib/queries.ts). Non
-- tocca players.display_name: resta il valore di partenza per chi non ha
-- ancora scelto un nome proprio.
--
-- Da eseguire su un database già esistente. Idempotente.

set role postgres;

alter table profiles
  add column if not exists display_name text;
