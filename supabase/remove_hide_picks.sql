-- Totofanta — toglie l'interruttore "nascondi le mie scelte agli altri",
-- introdotto e tolto lo stesso giorno (2026-09-11) su richiesta
-- dell'utente: da ora le scelte di tutti sono visibili a tutti i
-- giocatori del torneo, anche a giornata aperta. L'interruttore si poteva
-- aggirare (nascondi tutta la settimana, scopri un attimo prima della
-- scadenza, guarda, cambia, rinascondi) e la reciprocità "chi nasconde
-- non vede" stava solo nell'interfaccia, non nella RLS.
--
-- Prende il posto di add_hide_picks.sql (tolta dal repo, resta nella
-- storia git):
--   1) la policy di lettura su `picks` per i giocatori non guarda più
--      hide_picks: basta giocare nel torneo. Questa policy PRIMA di
--      add_hide_picks.sql non esisteva proprio — un giocatore non
--      organizzatore leggeva solo le PROPRIE scelte e lo storico degli
--      altri gli usciva con le celle vuote — quindi va eseguita anche se
--      add_hide_picks.sql non era mai stata eseguita;
--   2) cancella le due funzioni che servivano solo all'interruttore;
--   3) cancella la colonna players.hide_picks.
--
-- Da eseguire su un database già esistente. Idempotente.

set role postgres;

drop policy if exists "players read visible picks of their tournaments" on picks;
drop policy if exists "players read picks of their tournaments" on picks;
create policy "players read picks of their tournaments"
  on picks for select
  using (public.plays_in_matchday(matchday_id));

drop function if exists public.pick_visible_to_players(uuid, uuid);
drop function if exists public.set_hide_picks(uuid, boolean);

alter table players drop column if exists hide_picks;
