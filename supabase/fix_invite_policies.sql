-- Totofanta — corregge il bug "l'organizzatore aggiunge un'email, la
-- persona si registra, ma non viene agganciata al torneo".
--
-- Diagnosticato il 2026-09-01 riproducendo il problema end-to-end contro
-- produzione: un giocatore invitato per email che si registra con quella
-- stessa email NON viene agganciato al torneo (players.user_id resta
-- null). La causa è la stessa categoria di bug già trovata oggi in
-- URGENTE_migrazioni_mancanti.sql — drift tra schema.sql e il database
-- reale: la policy di RLS che permette a un giocatore di "reclamare" da
-- solo un invito ancora orfano (vedi claimPendingInvites in
-- src/lib/queries.ts) manca o non corrisponde a quella in schema.sql sul
-- progetto Supabase collegato, quindi l'update viene bloccato in
-- silenzio da RLS (nessun errore: PostgREST restituisce semplicemente
-- zero righe aggiornate).
--
-- Questo file ri-applica (drop + create, idempotente) sia questa policy
-- sia quella gemella del link di invito, per essere sicuri che il
-- database corrisponda esattamente a schema.sql. Non tocca dati
-- esistenti, solo le due policy.
--
-- Incolla e esegui questo intero file nell'SQL Editor di Supabase.

set role postgres;

drop policy if exists "a player claims their own pending invite" on players;
create policy "a player claims their own pending invite"
  on players for update
  using (
    user_id is null
    and email = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
  with check (user_id = auth.uid());

drop policy if exists "a player can join a draft tournament via invite link" on players;
create policy "a player can join a draft tournament via invite link"
  on players for insert
  with check (
    user_id = auth.uid()
    and email = lower(coalesce(auth.jwt() ->> 'email', ''))
    and public.is_draft_tournament(tournament_id)
  );
