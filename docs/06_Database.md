# Database

Schema completo in `supabase/schema.sql` (installazione da zero) +
migrazioni incrementali `supabase/add_*.sql` /
`supabase/rename_*.sql` (da eseguire in ordine su un database già
esistente — ogni file indica quali eseguire prima).

## Tabelle esistenti

| Tabella | A cosa serve |
|---|---|
| `profiles` | un profilo per utente Supabase Auth; oggi porta solo `tutorial_seen_at` |
| `tournaments` | un torneo: nome, competizione, organizzatore (`owner_id`), stato (`draft`/`active`/`finished`), vincitori, `is_test` (torneo di prova) |
| `teams` | squadre selezionabili: quelle di riferimento condivise (`tournament_id` nullo, es. Serie A precaricata) o custom di un singolo torneo |
| `players` | un giocatore *in un torneo* (email, nome, account collegato se già registrato) |
| `slots` | una "vita" indipendente di un giocatore, con etichetta numerica e stato vivo/eliminato |
| `matchdays` | una giornata di un torneo (numero, stato aperta/bloccata/conclusa) |
| `picks` | la scelta di uno slot per una giornata |
| `matchday_results` | il risultato (vinta/pareggio/persa) di una squadra in una giornata |
| `serie_a_fixtures` | il calendario Serie A condiviso (round, casa, trasferta, data/ora opzionale, stato valida/esclusa) |

## Mapping coi nomi del documento di brainstorming

Il documento "Evoluzione App Tornei Pronostici" propone nomi generici
(Users, Tournaments, Participants, Matches, Predictions). Non serve
rinominare nulla: il concetto esiste già, solo con nomi diversi, pensati
per questo gioco specifico:

- **Users** → `auth.users` (gestito da Supabase) + `profiles`
- **Tournaments** → `tournaments`
- **Participants** → `players` (+ `slots`, che nel documento generico non
  esisteva: è specifico del formato "sopravvissuti" con vite multiple)
- **Matches** → `teams` + `serie_a_fixtures` (le fixture non hanno
  ancora un `id`/stato proprio: sono righe testuali round+casa+trasferta)
- **Predictions** → `picks`

Questo mapping è anche la base del "Glossario" richiesto in un
brain-dump precedente, se si vuole un vocabolario ufficiale univoco.

## Ruolo globale `profiles.role`

Colonna `role` su `profiles` (`'player'` di default, `'creator'`),
aggiunta per dare un dato esplicito al ruolo "Creator" descritto in
[01_Visione_progetto.md](./01_Visione_progetto.md). Si diventa
`'creator'` automaticamente al momento di creare un torneo
(`createTournamentAction` chiama `promoteToCreator`) — non c'è nessun
pannello per assegnarlo a mano, e creare un torneo resta possibile per
chiunque come oggi (nessuna nuova restrizione introdotta). La
migrazione `add_creator_role.sql` promuove anche retroattivamente chi
ha già creato tornei in passato. Login e redirect (`/login` →
`/dashboard`, `/play/login` → `/play` o alla pagina richiesta) restano
invariati: il ruolo oggi serve solo a rendere interrogabile "chi è già
un organizzatore su questa piattaforma", non ancora a cambiare
comportamento dell'app — quello arriverà con le funzioni che lo
useranno davvero (es. tornei di test, vedi
[07_Task_sviluppo.md](./07_Task_sviluppo.md)).

## Tornei di test (`tournaments.is_test`)

Colonna booleana, `false` di default. Creabile solo da un account
`creator` (controllo lato Server Action, non RLS: chiunque potrebbe
teoricamente scrivere `is_test` via API diretta, ma non è un dato
sensibile — al massimo un torneo finto etichettato come vero o
viceversa). Due funzioni in `src/lib/queries.ts` la usano:

- `addTestPlayers`: crea N giocatori con nome/email generati
  (`test-XXXXXXXX@totofanta.test`), stesso numero di slot di default del
  torneo.
- `simulateMatchday`: apre la prossima giornata se serve, assegna una
  squadra casuale (tra quelle ancora disponibili) a ogni slot vivo senza
  scelta, genera un esito casuale per ogni squadra coinvolta, e applica
  le conseguenze con la stessa `submitMatchdayResults` usata per i
  risultati veri — quindi elimina gli slot, chiude il torneo o apre la
  giornata successiva esattamente come farebbe l'organizzatore a mano.

Nessuna delle due controlla `is_test` al proprio interno: è il chiamante
(le Server Action in `src/app/dashboard/[id]/actions.ts`) a verificarlo,
per non rischiare mai di usarle per sbaglio su un torneo vero.

## Stato partita (`serie_a_fixtures.kickoff_at` / `.status`)

Due colonne nuove su `serie_a_fixtures`, entrambe gestite
dall'organizzatore da `/dashboard/fixtures`:

- `kickoff_at` (timestamptz, nullabile): data/ora reale del calcio
  d'inizio. Null finché non ancora inserita.
- `status` (`'scheduled'` di default, o `'excluded'`): una partita
  esclusa non conta ai fini del gioco per la sua giornata.

`getExcludedTeamNames` in `src/lib/queries.ts` calcola l'insieme di nomi
squadra "esclusi" per una giornata combinando le due cose: sempre chi è
segnato `'excluded'` a mano, più chi ha una `kickoff_at` nota ma fuori
dalla finestra ufficiale venerdì-sabato-domenica-lunedì (vedi
`src/lib/match-window.ts`) — una partita senza data non è esclusa solo
per quello. Questo insieme è usato in due punti:

- `submitMatchdayResults`: le squadre escluse diventano `exemptSlotIds`
  per `applyMatchdayResults` (`src/lib/game-logic.ts`) — lo slot resta
  vivo senza contare né vittoria né sconfitta — e il loro pick viene
  cancellato subito dopo, così la squadra torna disponibile (non si
  considera usata).
- la pagina di gestione giornata (`/dashboard/[id]/matchday/[matchdayId]`)
  nasconde il selettore vinta/pareggio/persa per le squadre escluse:
  l'organizzatore non deve inserire nessun risultato per loro.

Dettagli sulle regole e sui casi limite (tavolino, rinvii tardivi) in
[02_Regole_gioco.md](./02_Regole_gioco.md).
