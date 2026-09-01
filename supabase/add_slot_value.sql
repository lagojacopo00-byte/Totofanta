-- Totofanta — aggiunge il valore in euro di ogni slot, per calcolare il
-- premio totale in palio in un torneo (vedi docs/07_Task_sviluppo.md,
-- feature "Premio"). Da eseguire su un database già esistente, dopo tutte
-- le migrazioni precedenti. Idempotente, non tocca dati esistenti (i
-- tornei già creati restano a 0 = nessun premio mostrato).

set role postgres;

alter table tournaments
  add column if not exists slot_value numeric(10, 2) not null default 0
  check (slot_value >= 0);
