-- Totofanta — permette anche ai giocatori (non solo all'organizzatore)
-- di leggere il backup Excel del proprio torneo, per il pulsantino
-- "Scarica Excel del torneo" nella pagina del giocatore (deciso con
-- l'utente il 2026-09-03). Senza questa policy, la RLS del bucket
-- "matchday-backups" lasciava leggere solo all'organizzatore: per un
-- giocatore createSignedUrl falliva in silenzio (nessun errore
-- visibile, solo un link che non compariva mai) — stesso tipo di bug
-- già trovato e corretto per profiles.display_name lo stesso giorno.
--
-- Da eseguire su un database già esistente. Idempotente (drop prima
-- di ricreare, non "if not exists": create policy non lo supporta).

set role postgres;

drop policy if exists "player reads own tournament matchday backups" on storage.objects;

create policy "player reads own tournament matchday backups"
  on storage.objects for select
  using (
    bucket_id = 'matchday-backups'
    and public.is_tournament_player(((storage.foldername(name))[1])::uuid)
  );
