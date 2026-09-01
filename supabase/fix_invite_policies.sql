-- Totofanta — corregge il bug "l'organizzatore aggiunge un'email, la
-- persona si registra, ma non viene agganciata al torneo".
--
-- Diagnosticato il 2026-09-01 riproducendo il problema end-to-end contro
-- produzione (browser/sessione reale, non service-role, per non
-- bypassare le RLS) e poi con una funzione diagnostica temporanea che ha
-- eseguito la stessa query dell'app dall'interno del database.
--
-- Causa reale: mancava una policy di SELECT per un invito ancora
-- "orfano" (`players.user_id is null`). Senza, per Postgres quella riga
-- è invisibile all'account che dovrebbe reclamarla finché non ha già uno
-- `user_id` che combaci — un classico problema dell'uovo e della
-- gallina — e questo blocca in silenzio anche l'UPDATE che fa
-- l'aggancio vero e proprio (claimPendingInvites in src/lib/queries.ts):
-- nessun errore, PostgREST risponde semplicemente con zero righe
-- aggiornate, per questo il problema passava inosservato.
--
-- (Un primo tentativo di fix, fix_invite_policies.sql eseguito prima di
-- questo, aveva già verificato che la policy di UPDATE corrispondeva
-- esattamente a schema.sql — corretta ma insufficiente da sola: mancava
-- proprio questa policy di SELECT.)
--
-- Incolla e esegui questo intero file nell'SQL Editor di Supabase.
-- Non tocca dati esistenti, solo una nuova policy.

set role postgres;

drop policy if exists "a player can see their own pending invite" on players;
create policy "a player can see their own pending invite"
  on players for select
  using (
    user_id is null
    and email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
