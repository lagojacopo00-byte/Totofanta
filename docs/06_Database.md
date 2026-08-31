# Database

Schema completo in `supabase/schema.sql` (installazione da zero) +
migrazioni incrementali `supabase/add_*.sql` /
`supabase/rename_*.sql` (da eseguire in ordine su un database già
esistente — ogni file indica quali eseguire prima).

## Tabelle esistenti

| Tabella | A cosa serve |
|---|---|
| `profiles` | un profilo per utente Supabase Auth; oggi porta solo `tutorial_seen_at` |
| `tournaments` | un torneo: nome, competizione, organizzatore (`owner_id`), stato (`draft`/`active`/`finished`), vincitori |
| `teams` | squadre selezionabili: quelle di riferimento condivise (`tournament_id` nullo, es. Serie A precaricata) o custom di un singolo torneo |
| `players` | un giocatore *in un torneo* (email, nome, account collegato se già registrato) |
| `slots` | una "vita" indipendente di un giocatore, con etichetta numerica e stato vivo/eliminato |
| `matchdays` | una giornata di un torneo (numero, stato aperta/bloccata/conclusa) |
| `picks` | la scelta di uno slot per una giornata |
| `matchday_results` | il risultato (vinta/pareggio/persa) di una squadra in una giornata |
| `serie_a_fixtures` | il calendario Serie A condiviso (round, casa, trasferta) — usato solo per mostrare l'avversario, non ha ancora data/ora |

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

## Cosa manca per le proposte più recenti

- **Stato partita (valida/esclusa)**: richiede una colonna di stato (e
  probabilmente un `id` proprio) su `serie_a_fixtures`, oggi assente.
- **Data/ora delle partite**: richiesta per raggruppare la schermata di
  scelta "per giorno" — oggi `serie_a_fixtures` ha solo il numero di
  giornata, non una data.
- **Ruolo ADMIN/Creator globale**: richiederebbe una colonna ruolo su
  `profiles` (oggi assente) — da chiarire prima cosa deve effettivamente
  sbloccare, vedi [01_Visione_progetto.md](./01_Visione_progetto.md).
