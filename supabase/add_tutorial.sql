-- Totofanta — aggiunge il tutorial "come funziona" per i giocatori.
--
-- Incolla e esegui questo intero file nell'SQL Editor di Supabase (dopo
-- fix_rls_recursion.sql, add_self_join.sql e add_features.sql, già
-- eseguiti). Non tocca tabelle o dati esistenti, solo un'aggiunta.

set role postgres;

alter table profiles
  add column if not exists tutorial_seen_at timestamptz;

-- Nessuna nuova policy necessaria: "a user reads and updates their own
-- profile" (già esistente su profiles) copre anche questa colonna.
