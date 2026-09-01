# Backlog di sviluppo

Elenco vivo. Aggiornare qui quando si completa o si aggiunge qualcosa,
così questo file (non solo la chat) resta la fonte di verità. La stima di
complessità è: **semplice** (poche ore, un file o due), **media**
(più file, qualche decisione di design, niente di architetturale),
**complessa** (tocca lo schema del database e/o più parti dell'app, o
richiede prima una decisione di prodotto).

## Ordine di sviluppo (indicazione esplicita dell'utente)

1. Logiche di gioco — solide, vedi [02_Regole_gioco.md](./02_Regole_gioco.md)
2. Gestione utenti — Supabase Auth + inviti già a posto; il ruolo
   PLAYER/ADMIN resta da chiarire (vedi sotto)
3. Database — a posto, incluso lo stato partita valida/esclusa
4. Gestione tornei — a posto lato organizzatore, inclusi i tornei di test
5. Flussi principali — invito/regolamento/schermata di scelta a posto
   (redesign come lista partite per giornata completato)
6. Solo dopo: direzione visiva/UX — vedi
   [08_Direzione_visiva_UX.md](./08_Direzione_visiva_UX.md), tenuta
   volutamente in fondo a questo file

## Fatto

- Countdown scadenza pick (giovedì/lunedì) su home e pagina torneo
- Enforcement server-side della finestra di scelta lunedì-giovedì
- Gestione organizzatore: schierare/cambiare/togliere la scelta di
  qualunque slot in qualunque momento
- Pagina Regolamento completa (rinvii, recuperi, tavolino, mancata
  scelta, eliminazione, fine torneo)
- Bug "10 slot senza possibilità di scegliere squadre diverse": causa
  individuata (competizione diversa da "Serie A" senza modo di aggiungere
  squadre a mano) e risolta con una sezione "Squadre" nella dashboard del
  torneo per aggiungere/rimuovere squadre custom, più un avviso quando le
  squadre disponibili sono poche o zero
- Slot rinominati da lettere (A, B, C) a numeri (1, 2, 3), inclusa
  migrazione dei tornei già esistenti
- Ruolo globale `profiles.role` (`player`/`creator`): deciso con
  l'utente come ruolo distinto dall'organizzatore per-torneo, assegnato
  automaticamente alla creazione del primo torneo, senza nuove
  restrizioni su chi può crearne uno. Dettagli in
  [06_Database.md](./06_Database.md). Login/redirect non toccati in
  questo passaggio — vedi sotto cosa resta aperto.
- Tornei di test per il Creator: chi è già "creator" vede un checkbox
  "torneo di test" in `/dashboard/new`; un torneo di test ha una
  sezione in più nella sua pagina per aggiungere giocatori finti in
  blocco e simulare intere giornate all'istante (scelte e risultati
  casuali), per bilanciare slot/durata senza aspettare il calendario
  reale. Dettagli in [06_Database.md](./06_Database.md).
- Stato partita valida/esclusa: `serie_a_fixtures` ha ora data/ora
  (`kickoff_at`) e stato (`status`, valida/esclusa); una partita esclusa
  (a mano, o perché fuori dalla finestra ven-sab-dom-lun) non è
  selezionabile e chi l'aveva già scelta resta vivo senza che conti né
  vittoria né sconfitta. Dettagli in [06_Database.md](./06_Database.md) e
  [02_Regole_gioco.md](./02_Regole_gioco.md).
- Redesign schermata di scelta come lista partite per giornata: in
  `/play/[tournamentId]` le partite della giornata sono ora raggruppate
  per giorno (Venerdì/Sabato/Domenica/Lunedì/"Data da confermare",
  ordine cronologico crescente ven→lun — interpretazione di "decrescente"
  nella richiesta originale, da confermare con l'utente), mostrate a
  coppie casa-ospiti con
  l'orario quando disponibile; le squadre non disponibili (già scelte su
  quello slot, o appartenenti a una partita esclusa/fuori finestra) sono
  oscurate, non cliccabili e mostrano il motivo ("già scelta" / "non
  disponibile"). Le squadre senza una partita in calendario quella
  giornata (tornei con competizione custom) restano selezionabili in una
  sezione a parte "Altre squadre disponibili" — la funzione esistente per
  aggiungere/rimuovere squadre custom di un torneo (dashboard
  organizzatore, sezione "Squadre") non è stata toccata.
- Onboarding per chi arriva da un link di invito e non ha ancora un
  account: `/play/join/[tournamentId]` non rimanda più subito a un login
  anonimo per chi non ha una sessione attiva, ma mostra prima una
  schermata di benvenuto (`invite-welcome.tsx`) con un minimo di contesto
  su cosa sia Totofanta e perché gli è arrivato un invito, poi porta a
  creare l'account o accedere. Il tutorial "Come funziona" esistente non
  è stato toccato: resta identico e si vede comunque subito dopo la
  registrazione, come prima — questa schermata è solo un passo in più
  prima, non un sostituto.

## Bug critico aperto (trovato 2026-09-01)

- **Pagina torneo del giocatore va in errore in produzione**: il database
  Supabase collegato al sito Vercel non ha mai ricevuto le migrazioni
  `add_creator_role.sql`, `add_tournament_is_test.sql` e
  `add_fixture_schedule.sql` (verificato in sola lettura via REST API con
  la chiave pubblica: le colonne `profiles.role`, `tournaments.is_test`,
  `serie_a_fixtures.kickoff_at`/`status` non esistono sul DB reale). La
  query di `getExcludedTeamNames` in `src/lib/queries.ts` seleziona
  esplicitamente `kickoff_at, status`: Postgres risponde con errore
  "column does not exist", non intercettato da nessun try/catch, e
  Next.js mostra l'errore generico. Scatta per qualunque torneo con una
  giornata aperta, cioè il caso normale.
  **Fix pronta**: incollare ed eseguire
  [`supabase/URGENTE_migrazioni_mancanti.sql`](../supabase/URGENTE_migrazioni_mancanti.sql)
  nell'SQL Editor di Supabase (idempotente, non tocca dati esistenti).
  Non eseguita in autonomia perché modifica lo schema del database di
  produzione — richiede l'azione manuale dell'utente nel pannello
  Supabase, come tutte le altre migrazioni di questo progetto.

## Da fare — semplice

- ~~Contatore "pronostici disponibili" nella UI slot~~ — già coperto
  dall'indicatore esistente "N/M tuoi slot vivi" nella card "La tua
  posizione"; non serve duplicarlo altrove.
- Glossario dei termini ufficiali (User/Tournament/Matchday/Team/Slot) —
  vedi già la tabella di mapping in
  [06_Database.md](./06_Database.md), da eventualmente promuovere a
  pagina/sezione a parte se serve anche fuori dal codice.

## Da fare — media

- Colori ufficiali delle squadre nei badge, al posto del colore
  hash-generato attuale — **deciso con l'utente**: solo il colore di
  sfondo ufficiale, iniziali invariate, niente stemmi/loghi reali (niente
  questioni di licenza). Rimandato di proposito alla fase visual/UX, vedi
  [08_Direzione_visiva_UX.md](./08_Direzione_visiva_UX.md).
## Da fare — complessa

- **Unificare login e redirect in base al ruolo**: oggi `/login` →
  `/dashboard` e `/play/login` → `/play` (o alla pagina richiesta)
  restano due porte separate, invariate dall'introduzione del ruolo
  `creator`. **Deciso con l'utente**: il creator deve continuare a poter
  giocare esattamente come un giocatore normale (nessuna perdita di
  accesso a `/play`); in più, se lo desidera, può entrare in una
  "modalità admin" che gli dà tutte le funzionalità di admin di lega
  (es. modificare gli slot degli altri giocatori — già oggi possibile
  dalla dashboard organizzatore). Resta da disegnare *come* si passa da
  una modalità all'altra (un solo login con selettore, o un interruttore
  dentro l'app): rimandato di proposito a quando si affronta questo task,
  per non distrarre da database e flussi principali (ora completati).

## Bassa priorità (esplicitamente rimandato dall'utente)

- Import automatico dei risultati Serie A (CSV/scraping) al posto
  dell'inserimento manuale.

## Direzione visiva / UX (dopo le fondamenta, per esplicita indicazione dell'utente)

Dettagli in [08_Direzione_visiva_UX.md](./08_Direzione_visiva_UX.md).

- Tema scuro spostato su tonalità verdi (non nero puro), contrasto testi
  alto — **media**, tocca variabili di stile diffuse in tutta l'app.
- Sezione Profilo (nome pubblico modificabile dall'utente, separato dai
  dati privati dell'account) — **media**, nuova pagina + colonna
  "display name personale" da aggiungere (oggi il nome lo imposta
  l'organizzatore all'invito).
- Navigazione a 3 sezioni Home/Scelta torneo/Profilo — **semplice una
  volta pronta la pagina Profilo**, è solo aggiungere un link.
- Testi più brevi e diretti nell'interfaccia — **continuo**, da applicare
  mano a mano, non un singolo task.
