# Mappa delle schermate

## Pubbliche / autenticazione

- `/login`, `/play/login`, `/play/signup` — accesso e registrazione
  (organizzatore e giocatore hanno login separati)
- `/play/join/[tournamentId]` — pagina di invito: chi la apre si
  registra/accede e si aggancia da solo al torneo

## Area organizzatore (`/dashboard`, richiede login organizzatore)

- `/dashboard` — elenco dei propri tornei (con badge "Test" per quelli di
  prova)
- `/dashboard/new` — crea un nuovo torneo (nome, competizione, slot di
  default); chi è già "creator" (vedi
  [01_Visione_progetto.md](./01_Visione_progetto.md)) vede anche il
  checkbox "torneo di test"
- `/dashboard/[id]` — pagina del torneo: link di invito, squadre
  disponibili (aggiungi/rimuovi squadre custom), giocatori (aggiungi,
  cambia slot, rimuovi — solo prima che il torneo inizi), avvia il
  torneo, elenco giornate; se il torneo è "di test", anche una sezione
  per aggiungere giocatori finti in blocco e simulare intere giornate
  all'istante
- `/dashboard/[id]/matchday/[matchdayId]` — gestione di una giornata:
  gestisci le scelte di ogni giocatore (se aperta), inserisci/consulta i
  risultati
- `/dashboard/fixtures` — calendario Serie A condiviso da tutti i tornei
  (accoppiamenti per giornata)

## Area giocatore (`/play`, richiede login giocatore)

- `/play` — elenco dei propri tornei con anteprima slot vivi e countdown
- `/play/[tournamentId]` — la schermata principale: posizione in
  classifica, countdown, slot con scelta squadra, storico squadre
  giocate, classifica completa
- `/play/how-it-works` — tutorial (mostrato obbligatoriamente la prima
  volta, poi sempre raggiungibile dal menu)
- `/play/regolamento` — regolamento completo con i casi particolari
  (rinvii, tavolino, mancata scelta, ecc.)

## Proposte, non ancora costruite

Vedi [07_Task_sviluppo.md](./07_Task_sviluppo.md) per lo stato di
ciascuna: onboarding a schermate, redesign della schermata di scelta come
lista partite, stato partita valida/esclusa, login/redirect unificati per
ruolo.
