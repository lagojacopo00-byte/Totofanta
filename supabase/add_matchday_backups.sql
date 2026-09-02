-- Totofanta — backup automatico Excel delle giornate (checkbox "Salva
-- giornate" alla creazione del torneo): colonna sul torneo + bucket
-- storage privato per i file generati (vedi generateMatchdayBackup in
-- src/lib/matchday-export.ts).
--
-- Da eseguire su un database già esistente. Idempotente.

set role postgres;

alter table tournaments
  add column if not exists auto_backup_matchdays boolean not null default false;

insert into storage.buckets (id, name, public)
values ('matchday-backups', 'matchday-backups', false)
on conflict (id) do nothing;

drop policy if exists "organizer reads own tournament matchday backups" on storage.objects;
create policy "organizer reads own tournament matchday backups"
  on storage.objects for select
  using (
    bucket_id = 'matchday-backups'
    and public.is_tournament_owner(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "organizer writes own tournament matchday backups" on storage.objects;
create policy "organizer writes own tournament matchday backups"
  on storage.objects for insert
  with check (
    bucket_id = 'matchday-backups'
    and public.is_tournament_owner(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "organizer replaces own tournament matchday backups" on storage.objects;
create policy "organizer replaces own tournament matchday backups"
  on storage.objects for update
  using (
    bucket_id = 'matchday-backups'
    and public.is_tournament_owner(((storage.foldername(name))[1])::uuid)
  );
