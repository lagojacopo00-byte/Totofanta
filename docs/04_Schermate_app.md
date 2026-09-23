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
- `/play/[tournamentId]` ("Giornata") — la schermata principale: in cima
  il premio in palio e la propria quota (se l'organizzatore ha impostato
  un valore per slot), poi il **picker** (una sola lista di partite per
  la giornata aperta, raggruppate per giorno e mostrate casa-ospite con
  "vs"; si clicca il badge di una squadra per assegnarle uno slot in
  più, un bottone rosso "−" ne toglie uno, si conferma tutto insieme —
  resta visibile in sola lettura, con gli orari, anche a scelte chiuse;
  vedi [07_Task_sviluppo.md](./07_Task_sviluppo.md)), poi posizione in
  classifica e classifica completa (ogni riga si apre sulle scelte di
  quel giocatore per la giornata in corso, visibili a tutti — vedi
  [02_Regole_gioco.md](./02_Regole_gioco.md))
- `/play/[tournamentId]/storico` ("Storico") — storico completo del
  torneo come classifica: una riga per giocatore in ordine di slot vivi
  decrescente (pari merito = stesso numero), il proprio evidenziato; un
  click apre la tabella giornata per giornata di quel giocatore
- `/play/[tournamentId]/stats` ("Stats") — i numeri del torneo:
  giocatori, slot ancora in gara, slot totali
- `/play/how-it-works` — tutorial (mostrato obbligatoriamente la prima
  volta, poi sempre raggiungibile dal menu)
- `/play/regolamento` — regolamento completo con i casi particolari
  (rinvii, tavolino, mancata scelta, ecc.)

Le tre schermate di un torneo (Giornata/Storico/Stats) più il profilo
("Tu") si raggiungono da una barra flottante in fondo allo schermo, solo
icone — vedi [08_Direzione_visiva_UX.md](./08_Direzione_visiva_UX.md).
Nell'header sopra resta solo il logo (torna a "I tuoi tornei") e il menu
☰ (le altre pagine — tutorial, regolamento, modalità admin — più
profilo/uscita, spostati lì dall'icona account che c'era prima).

## Proposte, non ancora costruite

Vedi [07_Task_sviluppo.md](./07_Task_sviluppo.md) per lo stato di
ciascuna: onboarding a schermate, redesign della schermata di scelta come
lista partite, stato partita valida/esclusa, login/redirect unificati per
ruolo.
