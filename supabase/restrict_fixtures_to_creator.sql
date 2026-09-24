-- Totofanta — il calendario Serie A (serie_a_fixtures) è condiviso da TUTTI
-- i tornei: solo il creator (account che gestisce l'app) può modificarlo.
-- Prima, la policy "authenticated users manage serie a fixtures" lasciava
-- scrivere/cancellare a chiunque fosse loggato: con l'apertura a nuovi
-- utenti qualunque organizzatore di un torneo avrebbe potuto rovinare le
-- partite di tutti. La lettura resta a tutti gli autenticati; la
-- sincronizzazione automatica usa il client service-role (bypassa le RLS).
--
-- Idempotente: si può rieseguire in sicurezza.

create or replace function public.is_creator()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'creator'
  );
$$;

drop policy if exists "authenticated users manage serie a fixtures" on serie_a_fixtures;
drop policy if exists "only creator manages serie a fixtures" on serie_a_fixtures;

create policy "only creator manages serie a fixtures"
  on serie_a_fixtures for all
  using (public.is_creator())
  with check (public.is_creator());
