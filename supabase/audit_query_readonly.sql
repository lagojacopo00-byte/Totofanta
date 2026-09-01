-- Totofanta — query di sola lettura per l'audit schema.sql vs database
-- reale (2026-09-01). NON modifica nulla: esegui nell'SQL Editor di
-- Supabase e incolla il risultato (tutte e tre le tabelle, una sotto
-- l'altra) nella chat con Claude Code.

-- 1) Tutte le RLS policy su public.*
select
  tablename,
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 2) Tutte le foreign key su public.* con la regola di ON DELETE
-- (via pg_constraint direttamente, per non perdere quelle che puntano a
-- auth.users come profiles.id/tournaments.owner_id/players.user_id — la
-- versione precedente di questa query, basata su information_schema, le
-- ometteva).
select
  conrelid::regclass as table_name,
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
from pg_constraint
where contype = 'f'
  and connamespace = 'public'::regnamespace
order by conrelid::regclass::text, conname;

-- 3) Tutti i check constraint su public.*
select
  conrelid::regclass as table_name,
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
from pg_constraint
where contype = 'c'
  and connamespace = 'public'::regnamespace
order by conrelid::regclass::text, conname;
