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
- Redesign schermata di scelta come lista partite per giornata (prima
  versione, poi sostituita dal picker unico descritto sotto): raggruppo
  per giorno, coppie casa-ospiti, squadre non disponibili oscurate.
- **Picker unico per la scelta squadra** (sostituisce la prima versione
  sopra, che ripeteva l'intera lista partite una volta per slot — con
  molti slot diventava una lista di liste, illeggibile): in
  `/play/[tournamentId]` ora c'è UNA SOLA lista di partite raggruppate
  per giorno; ogni partita è una card con casa e ospite affiancati e un
  "vs" in mezzo, per chiarire subito chi gioca contro chi. Si assegnano
  più slot alla stessa squadra cliccando ripetutamente il suo badge (un
  click = uno slot in più su quella squadra), con un contatore visibile
  e un bottone rosso "−" di fianco per toglierne uno; le scelte si
  confermano tutte insieme con "Conferma le scelte" (si può anche
  annullare prima di confermare). Il calcolo di quale slot fisico vada a
  quale squadra usa un vero matching bipartito
  ([`src/lib/slot-assignment.ts`](../src/lib/slot-assignment.ts),
  algoritmo di Kuhn, con test dedicati): un "primo slot libero" ingenuo
  potrebbe bloccare scelte in realtà possibili quando gli slot hanno
  storici diversi (quali squadre hanno già usato in passato). Nuova
  server action `submitPicksAction` (sostituisce la vecchia
  `submitPickAction` one-shot) che applica l'intera assegnazione in
  blocco, comprese le rimozioni. Le squadre non disponibili (già scelte
  su quello slot per TUTTI gli slot, o appartenenti a una partita
  esclusa/fuori finestra) restano oscurate col motivo. Le squadre senza
  una partita in calendario quella giornata (tornei con competizione
  custom) restano selezionabili in una sezione a parte "Altre squadre
  disponibili" — la funzione esistente per aggiungere/rimuovere squadre
  custom di un torneo (dashboard organizzatore, sezione "Squadre") non è
  stata toccata.
- Onboarding per chi arriva da un link di invito e non ha ancora un
  account: `/play/join/[tournamentId]` non rimanda più subito a un login
  anonimo per chi non ha una sessione attiva, ma mostra prima una
  schermata di benvenuto (`invite-welcome.tsx`) con un minimo di contesto
  su cosa sia Totofanta e perché gli è arrivato un invito, poi porta a
  creare l'account o accedere. Il tutorial "Come funziona" esistente non
  è stato toccato: resta identico e si vede comunque subito dopo la
  registrazione, come prima — questa schermata è solo un passo in più
  prima, non un sostituto.
- Rifiniture alla schermata torneo del giocatore, in ordine di richiesta:
  header dell'area giocatore fisso in alto durante lo scroll; freccia
  "torna indietro" su pagina torneo, tutorial e regolamento (prima
  l'unico modo era il menu ☰); rimossa la lista finale "I tuoi slot"
  (stato/storico per singolo slot) che appesantiva la pagina senza
  aggiungere informazioni non già coperte altrove.
- **Premio** (`tournaments.slot_value`): l'organizzatore imposta un
  valore in € per slot alla creazione del torneo (0 = nessun premio,
  compatibile con tutti i tornei esistenti). In `/play/[tournamentId]`,
  in cima e vicino agli "slot ancora disponibili", si vede il premio
  totale (valore × slot totali del torneo) e la quota attuale del
  giocatore (suoi slot vivi / slot totali del torneo) — la percentuale
  che gli spetterebbe se scattasse uno spareggio ex aequo con tutti gli
  slot in gara. Lo split effettivo del premio non è ancora implementato,
  per ora è solo un'informazione mostrata. Dettagli in
  [06_Database.md](./06_Database.md).
- **Calendario sempre visibile anche a scelte chiuse**: il picker (con
  gli orari delle partite) spariva del tutto quando la finestra di
  scelta lunedì-giovedì era chiusa — cioè proprio nel weekend, quando
  si gioca davvero e serve sapere quando scendono in campo le squadre
  scelte. Ora il calendario resta sempre visibile in sola lettura
  (`TeamPicker` accetta una prop `readOnly`): i controlli di scelta si
  disabilitano, spariscono i bottoni di conferma, ma le partite
  raggruppate per giorno con gli orari restano.
- **Bug critico risolto (trovato e chiuso 2026-09-01)**: la pagina torneo
  del giocatore andava in errore in produzione perché il database
  Supabase collegato a Vercel non aveva ricevuto le migrazioni
  `add_creator_role.sql`, `add_tournament_is_test.sql` e
  `add_fixture_schedule.sql` (colonne `profiles.role`, `tournaments.is_test`,
  `serie_a_fixtures.kickoff_at`/`status` mancanti sul DB reale, causa lo
  stesso problema anche su `/dashboard/new` per l'organizzatore). Risolto
  eseguendo
  [`supabase/URGENTE_migrazioni_mancanti.sql`](../supabase/URGENTE_migrazioni_mancanti.sql)
  nell'SQL Editor di Supabase.
- Migrazione `add_slot_value.sql` (colonna `tournaments.slot_value` per la
  feature Premio) eseguita in produzione: la feature è ora live, non solo
  nel codice.
- File morto `src/lib/supabase/admin.ts` (mai importato altrove) rimosso.
- **Bug scroll orizzontale su iOS Safari risolto**: l'header
  `position: sticky` dell'area giocatore faceva scorrere l'intera pagina
  oltre il bordo destro (bug noto di Safari iOS, non contenuto che sfora —
  `overflow-x: hidden` su `html`/`body` da solo non basta contro questo
  bug). Aggiunto `touch-action: pan-y` su `html`/`body` in
  [globals.css](../src/app/globals.css) per bloccare il gesto orizzontale
  invece di dipendere dal calcolo di overflow di Safari.
- **Cancellazione torneo**: l'organizzatore può cancellare del tutto un
  torneo esistente (pulsante in fondo alla pagina torneo, con conferma
  esplicita perché irreversibile — giocatori, scelte e risultati sono
  persi). Nessuna migrazione necessaria: le foreign key verso
  `tournaments` sono già tutte `on delete cascade`.
- **"Crea torneo" raggiungibile da `/play`**: un giocatore può diventare
  organizzatore/"admin di lega" di un nuovo torneo con un tap, senza
  dover conoscere l'URL della dashboard — stessa sessione, nessun login
  separato (vedi sotto: `/login` e `/play/login` restano due pagine solo
  per chi non ha ancora una sessione).
- **Ruolo "creator" ristretto**: deciso con l'utente — "creator" (un
  ruolo a sé, riservato a chi gestisce l'app, oggi un solo account) non
  si ottiene più automaticamente creando un torneo. Creare un torneo
  continua a rendere quell'account organizzatore/"admin di lega" per
  quel torneo soltanto (self-service, invariato). Rimossa
  `promoteToCreator`; migrazione manuale
  [`supabase/restrict_creator_role.sql`](../supabase/restrict_creator_role.sql)
  per riportare tutti a "player" tranne l'account che gestisce l'app.
- **Bug scroll orizzontale, parte 2**: il fix precedente (`touch-action:
  pan-y`) non bastava su Safari iOS reale — si poteva ancora scorrere
  lateralmente da fermi (senza zoomare) perdendo contenuto ai bordi.
  Causa più profonda: l'header `position: sticky` dell'area giocatore
  dipendeva dallo scroll del documento (`html`/`body`), ed è proprio lì
  che Safari ha il bug. Fix: l'area giocatore (`play/(app)/layout.tsx`)
  ora ha il proprio contenitore di scroll esplicito (`h-dvh`,
  `overflow-y: auto`), così l'header sticky non tocca più lo scroll del
  documento. Aumentato anche il margine orizzontale dai bordi (da
  `px-5`/20px a `px-6`/24px) su richiesta esplicita dell'utente.

- **Modifica del premio dopo la creazione**: nuova sezione "Premio" nella
  dashboard organizzatore per cambiare `slot_value` in qualunque momento
  (non solo alla creazione) — non tocca la meccanica di gioco, quindi non
  serve restare in "draft" come per il numero di slot.
- **Trasparenza nella scelta squadra** (deciso con l'utente: prima si
  scopriva a tentativi cosa fosse ancora possibile): nuova
  `maxAssignableForTeam` in
  [`src/lib/slot-assignment.ts`](../src/lib/slot-assignment.ts) (ricerca
  binaria su `solveSlotAssignment`, la fattibilità è monotona nel
  conteggio — se n slot sono assegnabili, n-1 lo sono sempre) calcola in
  anticipo il massimo assegnabile a ciascuna squadra tenendo fisse le
  scelte già fatte sulle altre. Nel picker (`team-picker.tsx`) questo
  numero si vede subito come "ancora N assegnabili" invece di scoprirlo
  cliccando finché il bottone non si blocca. La card "Le squadre che hai
  già giocato" ora riporta anche su quanti degli slot vivi attuali
  ciascuna squadra non è più disponibile (N/M), non solo che è stata
  giocata da qualche parte in passato.
- **L'admin può modificare gli slot di un giocatore in qualunque momento**:
  "Aggiorna slot" prima spariva appena il torneo usciva da "draft", senza
  modo di correggere slot mal configurati dopo (causa concreta di un bug
  segnalato: giocatori di test creati in bulk con 1 solo slot ciascuno,
  irraggiungibili da correggere una volta aperta la prima giornata).
  Riducendo il numero, `updatePlayerNumSlots` toglie per prima le righe
  già "eliminated" e solo se non bastano tocca quelle "alive", per non
  cancellare storico vivo quando basterebbe pulire slot già persi.
  "Rimuovi" giocatore resta invece ristretto a "draft" (non richiesto).
- **Colori ufficiali delle squadre nei badge**: anticipato dalla fase
  visual/UX su richiesta esplicita dell'utente. Mappa
  `OFFICIAL_TEAM_COLORS` in
  [team-badge.tsx](../src/components/team-badge.tsx) per le 20 squadre di
  Serie A 2026/2027 (solo sfondo, iniziali invariate, niente stemmi/loghi
  reali — non è cambiato). Squadre non in elenco (altre competizioni,
  custom di un torneo) restano sul colore hash-generato come prima.
- **Orari giornata 1 per il picker**: mai popolati nel seed originale
  (solo gli accoppiamenti) — il picker non poteva raggruppare per giorno
  e mostrava sempre "Data da confermare". Migrazione manuale
  [`supabase/set_matchday1_kickoffs.sql`](../supabase/set_matchday1_kickoffs.sql)
  (fonte: ricerca web — giorno affidabile, orario esatto ricostruito
  sugli slot standard dove non confermato da più fonti).
- **Giorni giornate 2-25**: migrazione manuale
  [`supabase/set_kickoffs_2_25.sql`](../supabase/set_kickoffs_2_25.sql).
  A differenza della giornata 1 (già giocata), queste sono ancora nel
  futuro: l'orario tv esatto di ogni partita non è deciso nella realtà
  a questo punto della stagione, quindi non è "trovabile" da nessuna
  parte — **deciso con l'utente**: usato il weekend reale di ogni
  giornata (fisso in anticipo dal calendario stagionale, fonte: ricerca
  web), partite divise tra sabato/domenica a un orario indicativo delle
  15:00 — solo il giorno è affidabile, non l'ora esatta. Giornate 9 e 18
  infrasettimanali (mercoledì): tutte le partite in un giorno.
- **Rimossa la sezione "Squadre" dalla dashboard organizzatore**:
  richiesta esplicita dell'utente, non voleva vederle né aggiungerne da
  lì. **Attenzione**: era il modo per aggiungere squadre custom a un
  torneo con competizione diversa da Serie A (vedi bug "10 slot senza
  possibilità di scegliere squadre diverse" più sopra in questo file) —
  `addTeamAction`/`removeTeamAction` restano nel codice ma non sono più
  raggiungibili da nessuna UI. Se in futuro serve di nuovo un torneo con
  competizione custom, questa funzione andrà reintrodotta (magari solo
  quando `tournament.competition !== "Serie A"`).
- **Risultati centralizzati dal creator**: il creator carica l'esito
  reale di ogni partita (1/X/2) una volta sola da `/dashboard/fixtures`
  (nuova colonna `serie_a_fixtures.result`, migrazione manuale
  [`supabase/add_fixture_result.sql`](../supabase/add_fixture_result.sql)),
  invece che ogni admin di lega lo inserisca separatamente per il
  proprio torneo. Riservato al creator, verificato lato server. Chiude
  la giornata aperta di ogni torneo Serie A attivo che corrisponde a
  quel round SOLO quando tutte le partite non escluse hanno ormai un
  esito noto (mai prima, anche se i risultati arrivano partita per
  partita: `applyMatchdayResults` tratta una squadra senza esito come
  se avesse perso, quindi applicare risultati parziali eliminerebbe per
  errore chi ha scelto una squadra che deve ancora giocare) — vedi
  `tryFinalizeRoundEverywhere` in
  [queries.ts](../src/lib/queries.ts). Il picker del giocatore (già in
  sola lettura durante il weekend) mostra l'esito di ogni partita non
  appena caricato, come un piccolo "monitor" della giornata in corso.
- **Login unificato e interruttore modalità admin/giocatore**: risolto
  il task "complesso" rimasto aperto a lungo. Un solo accesso per tutta
  l'app (`/login` è ora un redirect a `/play/login`, che serve sia
  organizzatori che giocatori — la sessione era già condivisa, restava
  solo la UI duplicata). Nuovo interruttore visibile: "Modalità admin"
  nel menu ☰ dell'area giocatore (va a `/dashboard`) e "Modalità
  giocatore" nell'header della dashboard organizzatore (va a `/play`).
  Il creator continua a giocare come chiunque altro, nessuna perdita di
  accesso a `/play`.
- **Data nel picker, tasto indietro dashboard, più margine dai bordi**:
  ogni gruppo giorno nel picker mostra anche la data (non solo "Sabato",
  anche "22 agosto"); aggiunto `BackLink` (mancava) a tutte le pagine
  della dashboard organizzatore (torneo, nuovo torneo, calendario,
  pagina giornata); margine laterale aumentato ovunque (px-6/24px ->
  px-7/28px, uniformato dove era più stretto).
- **Gestione account utente** (in `/play/profile`): recupero password
  via email (nuove pagine `/play/forgot-password` e
  `/play/reset-password`, riusa `/auth/confirm` con `type=recovery`),
  cambio password da loggati (non serve la vecchia), cambio email
  (richiede conferma via email, non immediato), cancellazione account.
  La cancellazione è bloccata se l'account possiede ancora dei tornei
  (`tournaments.owner_id` ha `on delete cascade`: cancellarlo
  cancellerebbe anche quelli, con i dati di tutti gli altri giocatori —
  vedi `deleteAccountAction` in
  [profile/actions.ts](../src/app/play/(app)/profile/actions.ts)); i
  tornei altrui a cui partecipa restano invece intatti, solo scollegati
  (`players.user_id` ha `on delete set null`). Ricreato
  `src/lib/supabase/admin.ts` (client service-role, unico modo per
  cancellare il proprio account: Supabase non lo espone lato utente).
  Non richiede nessuna configurazione di template email su Supabase (sul
  piano gratuito, senza un tuo SMTP, l'editor dei template resta bloccato
  in sola lettura): entrambi i flussi usano il template di default così
  com'è, leggendo la sessione dal frammento dell'URL lato browser — vedi
  `reset-password-form.tsx` e la nota nel README.
- **Annulla ultima giornata** (rete di sicurezza per un risultato inserito
  per sbaglio, in `/dashboard/[id]`): nuova `undoLastMatchday` in
  [queries.ts](../src/lib/queries.ts) riapre l'ultima giornata COMPLETATA
  (sempre e solo quella, mai una a scelta più indietro — richiamarla più
  volte torna indietro una giornata alla volta), cancella i suoi risultati
  salvati, rimette vivi gli slot che aveva eliminato (letti da
  `eliminated_matchday`, univoco per slot) e, se era stata lei a chiudere
  il torneo (vittoria o spareggio ex aequo), lo riporta "active" azzerando
  `decisive_matchday`/`winners`. Se la giornata successiva era già stata
  aperta (succede in automatico appena si chiude una giornata), viene
  cancellata — con le eventuali scelte già fatte dai giocatori sopra: la
  UI (`UndoLastMatchdayButton`) mostra prima quante andrebbero perse
  (`getUndoLastMatchdayPreview`) e chiede conferma esplicita. Le scelte
  della giornata annullata non si toccano: non erano mai state cancellate
  da `submitMatchdayResults`, tornano visibili così com'erano appena la
  giornata riapre. Verificato end-to-end con dati disposable su un torneo
  di test contro il database di produzione (annullo di una giornata
  normale con next matchday già aperto e con una scelta sopra, e annullo
  della giornata che aveva chiuso il torneo per spareggio zero superstiti).
  Nessuna modifica allo schema/RLS: le policy "organizer manages..." già
  esistenti per slots/matchdays/matchday_results coprono tutto.
  In questo test è emerso un bug di schema pre-esistente e non collegato,
  poi corretto — vedi voce sotto.
- **Solo Serie A come competizione**: tolto il campo "Competizione" dal
  form di creazione torneo (`/dashboard/new`) — l'unica competizione
  utilizzabile per ora è la Serie A precaricata, farla scegliere non
  serviva. `createTournamentAction` la fissa a "Serie A" lato server (non
  più letta dal form). Di conseguenza `addTeamAction`/`removeTeamAction`
  (dashboard) e `addTeamToTournament`/`removeTeamFromTournament`
  (queries.ts) erano già codice morto (nessuna UI li richiamava più da
  quando era stata tolta la sezione "Squadre") e sono stati rimossi.
- **Fix bug schema — cancellazione torneo con squadre custom**: emerso
  testando "annulla ultima giornata" con squadre create ad hoc per il
  test. `picks.team_id` e `matchday_results.team_id` referenziavano
  `teams(id)` senza `on delete cascade`: cancellando un torneo con
  squadre custom (`teams.tournament_id` non nullo) già scelte/valutate,
  Postgres provava a cancellarle (cascade da `tournaments`) mentre
  picks/risultati le referenziavano ancora, con un errore di chiave
  esterna. Corretto con `on delete cascade` su entrambe le FK — vedi
  [supabase/fix_team_fk_cascade.sql](../supabase/fix_team_fk_cascade.sql)
  (da eseguire nell'SQL Editor di Supabase) e lo stesso cambio riportato in
  `schema.sql` per i progetti nuovi. Con la voce sopra (solo Serie A,
  niente più squadre custom creabili) il caso che innescava il bug non è
  più raggiungibile dall'app, ma la foreign key resta corretta comunque.
- **Fix bug — invito per email non si agganciava**: riprodotto end-to-end
  contro produzione (browser/sessione reale, non service-role, per non
  bypassare le RLS): l'organizzatore aggiunge un giocatore per email
  (`addPlayerAction`), quella persona si registra con la STESSA email, ma
  `players.user_id` restava `null` — non veniva agganciata al torneo,
  restava "Ancora nessun torneo all'attivo" in home. Causa reale (trovata
  con una funzione diagnostica temporanea che ha eseguito la stessa query
  dell'app dall'interno del database): mancava una policy di SELECT per
  un invito ancora "orfano" (`user_id is null`). Senza, per Postgres
  quella riga è invisibile all'account che dovrebbe reclamarla finché non
  ha già uno `user_id` che combaci — un classico problema dell'uovo e
  della gallina delle RLS — e questo blocca in silenzio anche l'UPDATE
  che fa l'aggancio vero e proprio (`claimPendingInvites` in queries.ts,
  chiamata da `requirePlayer` a ogni pagina dell'area giocatore): nessun
  errore, PostgREST risponde 200 con zero righe, per questo passava
  inosservato. (Un primo giro aveva anche verificato/riallineato — non
  era quella la causa finale — la policy di UPDATE contro schema.sql,
  utile comunque contro il drift già visto oggi in
  `URGENTE_migrazioni_mancanti.sql`.) Il percorso "link di invito"
  (`selfJoinTournament`, solo su tornei ancora "draft") non aveva questo
  problema (l'INSERT non ha bisogno di vedere una riga preesistente) ed è
  risultato già funzionante nei test. Corretto aggiungendo la policy di
  SELECT mancante — vedi
  [supabase/fix_invite_policies.sql](../supabase/fix_invite_policies.sql)
  — **eseguita**, confermato in produzione il 2026-09-01 — e lo stesso
  cambio riportato in `schema.sql`. Nessuna modifica al codice
  applicativo: la logica in queries.ts era già corretta.
- **Audit sistematico schema.sql vs database reale (2026-09-01)**: dopo i
  due bug sopra (stessa causa: drift tra `schema.sql` e il progetto
  Supabase collegato), confronto completo colonne + check constraint +
  foreign key (`ON DELETE`) + RLS policy tra `schema.sql` e il database
  reale. Colonne verificate via REST API (service-role key, script
  disposable non commesso); check constraint, FK e policy via query di
  sola lettura eseguite dall'utente nell'SQL Editor — vedi
  [supabase/audit_query_readonly.sql](../supabase/audit_query_readonly.sql)
  (tenuto nel repo, riutilizzabile per audit futuri: nessuna delle tre
  query modifica nulla).
  - Colonne: tutte presenti in produzione, incluse `profiles.role`,
    `tournaments.is_test`, `serie_a_fixtures.kickoff_at`/`status` (i due
    bug sopra, già corretti). Emerso però un drift nella direzione
    opposta, solo di documentazione: `schema.sql` non elencava
    `profiles.display_name` (da `add_profile_display_name.sql`) né
    `serie_a_fixtures.result` (da `add_fixture_result.sql`) — colonne
    che esistono e sono usate regolarmente dal codice, semplicemente
    mai riportate nel file "fonte di verità" quando le rispettive
    migrazioni incrementali sono state scritte. Corretto aggiungendo
    entrambe le colonne a `schema.sql` (nessuna migrazione da eseguire:
    il database reale era già a posto).
  - Check constraint: tutti corrispondono esattamente, incluso quello
    su `serie_a_fixtures.result` appena aggiunto a `schema.sql`.
  - Foreign key (con `ON DELETE`): tutte e 12 corrispondono esattamente
    a `schema.sql`, incluse le tre verso `auth.users`
    (`profiles.id`/`tournaments.owner_id`/`players.user_id`) e le due
    cascade di `fix_team_fk_cascade.sql` (`picks.team_id`,
    `matchday_results.team_id`) — confermate applicate in produzione.
  - **RLS policy: 21 su 22 — mancava `"organizer removes custom teams
    of own tournament"` (DELETE su `teams`)**, la migrazione
    [`supabase/add_custom_teams_delete.sql`](../supabase/add_custom_teams_delete.sql)
    a quanto pare non fu mai eseguita in produzione. Stesso pattern
    esatto dei due bug sopra (RLS che nega in silenzio, PostgREST
    risponde 200 con zero righe). Impatto pratico oggi basso: la
    sezione "Squadre" è stata rimossa dalla dashboard (vedi "Solo Serie
    A come competizione" sopra), quindi nessuna UI chiama più
    `removeTeamAction` — ma la funzione resta nel codice per un
    eventuale futuro torneo a competizione custom, e senza questa
    policy tornerebbe a fallire in silenzio. Nessun nuovo file
    necessario: bastava eseguire `add_custom_teams_delete.sql` (già
    idempotente) nell'SQL Editor — **eseguita**, confermato in
    produzione lo stesso giorno.
  - **Esito finale (poi superato, vedi voce sopra "Trova la vera causa
    dell'invito per email"): nessun drift residuo tra schema.sql e la
    produzione** su colonne, check constraint, foreign key e RLS policy
    esistenti — l'audit confronta ciò che `schema.sql` dichiara contro
    ciò che il database ha davvero, quindi per costruzione non poteva
    scoprire una policy che mancava da ENTRAMBI: la policy SELECT per
    invito orfano trovata subito dopo (vedi sopra) era un buco di design
    dello schema stesso, non un drift.
- **Sincronizzazione automatica del calendario Serie A da
  football-data.org**: nuovo bottone "Sincronizza ora" su
  `/dashboard/fixtures` (solo creator) che scarica data/ora e risultati
  reali della stagione e li applica a `serie_a_fixtures` — stesso
  percorso già usato per l'inserimento manuale (`updateFixtureResult` +
  `tryFinalizeRoundEverywhere`), solo con la sorgente del dato
  automatica. Non tocca mai `status` (una partita esclusa a mano resta
  tale). Nuovo modulo
  [`src/lib/football-api.ts`](../src/lib/football-api.ts) (logica pura,
  testata) con un confronto nomi squadra tollerante (accenti, maiuscole,
  prefissi/suffissi societari come "AC"/"FC"/"CFC"/anno di fondazione)
  invece di un elenco di alias scritto a mano — verificato contro i nomi
  reali dell'API (es. "FC Internazionale Milano", "Genoa CFC"), zero
  nomi non riconosciuti nel primo giro reale contro produzione (vedi
  sotto). I nomi non riconosciuti (se mai capitassero) finiscono nel
  riepilogo mostrato all'utente e nella console del server, mai persi
  silenziosamente. Scartata l'automazione via cron (Vercel Cron sul
  piano Hobby gira al massimo una volta al giorno): il creator clicca il
  bottone durante la finestra di gioco, come già faceva a mano per i
  risultati.
  - **Prima scelta, poi scartata: API-Football**. Piano gratuito
    verificato con una chiave reale: aggiornamento ogni 15 secondi
    durante le partite, ma **non copre la stagione in corso** — il free
    plan permette solo le stagioni 2022-2024, quella 2026/2027 richiede
    un piano a pagamento (~$19/mese). Scoperto testando direttamente
    l'API (la ricerca preliminare non l'aveva verificato con
    precisione), non dopo aver scritto il codice.
  - **Passato a football-data.org**: piano gratuito registrato (token
    gratuito, 10 richieste/minuto) che include la stagione in corso.
    Verificato con una chiamata reale: **gli esiti hanno un ritardo di
    circa 24-30 ore** (aggiornamento periodico, non partita per
    partita — tutte le partite già giocate avevano lo stesso identico
    `lastUpdated`), mentre gli orari (`kickoff_at`) sono sempre corretti
    da subito (noti in anticipo, non soggetti allo stesso ritardo).
    Deciso con l'utente: sincronizzare comunque anche i risultati
    nonostante il ritardo — il creator può sempre inserirne uno a mano
    prima per chiudere la giornata subito, come faceva già.
  - **Verificato end-to-end contro produzione** (2026-09-02, solo tornei
    di test attivi quindi nessun impatto su tornei reali —
    `tryFinalizeRoundEverywhere` esclude comunque sempre i tornei di
    test): sincronizzate tutte le 380 partite della stagione con
    data/ora corrette, applicati i 20 risultati delle giornate 1-2 già
    giocate, **zero nomi squadra non riconosciuti**.
- **Bug corretto — `tryFinalizeRoundEverywhere` con l'RLS sbagliata**:
  trovato preparando il backup delle giornate (punto 6 sotto), prima di
  mandarlo in produzione. La funzione chiude la giornata su OGNI torneo
  Serie A attivo, non solo quelli dell'account che l'ha innescata (il
  creator, cliccando 1/X/2 su `/dashboard/fixtures` o "Sincronizza ora")
  — ma girava con il client normale del creator, e le policy RLS di
  `tournaments`/`matchdays`/`slots` concedono scrittura solo al
  proprietario del singolo torneo. Per ogni torneo NON di proprietà del
  creator, la scrittura sarebbe stata filtrata in silenzio (0 righe
  toccate, nessun errore) — stessa categoria dei bug RLS di stamattina,
  qui causata dal client sbagliato invece che da una policy mancante.
  Il test end-to-end di oggi non l'aveva mostrato perché c'erano solo
  tornei di test attivi (esclusi a priori dalla funzione). Corretto
  facendo usare a `tryFinalizeRoundEverywhere` sempre il client
  service-role internamente, non più quello di chi la chiama — riguarda
  sia la sincronizzazione automatica sia l'inserimento manuale 1/X/2
  (quest'ultimo bacato allo stesso modo ancora prima di oggi).
- **Backup automatico delle giornate** (checklist completa in
  "Specifiche funzionali — Aggiornamenti", punti 5 e 6, richiesta
  dall'utente via messaggi vocali il 2026-09-02; iniziato da questi due
  perché indicati come priorità):
  - **Punto 5 (Inserimento manuale dei risultati partita per partita)**:
    era già implementato da prima (`FixtureResultButtons` su
    `/dashboard/fixtures`, tre pulsanti 1/X/2 per partita — mai squadra
    per squadra, quindi nessuna combinazione incoerente possibile) e la
    sincronizzazione da football-data.org già sostituisce un risultato
    manuale con quello ufficiale quando arriva. Aggiunta solo
    un'etichetta esplicita "Anticipa risultati" nella UI.
  - **Punto 6 (Backup Excel delle giornate)**: nuovo. Checkbox "Salva
    giornate" alla creazione del torneo (`tournaments.auto_backup_matchdays`,
    impostabile solo in creazione) — se attivo, ogni volta che
    `submitMatchdayResults` chiude una giornata (manuale, automatica da
    API o simulata) genera un file Excel via
    [`src/lib/matchday-export.ts`](../src/lib/matchday-export.ts) (nuova
    dipendenza `exceljs`, l'unica libreria che supporta la colorazione
    delle celle richiesta — un CSV non può rappresentare verde/rosso) e
    lo carica nel bucket storage privato `matchday-backups` (percorso
    `<tournament_id>/giornata-<numero>.xlsx`, vedi
    [`supabase/add_matchday_backups.sql`](../supabase/add_matchday_backups.sql)
    — **eseguita**, confermato in produzione il 2026-09-02). Colonne =
    giocatori, righe = tutti gli slot (1..N, N = il massimo tra i
    giocatori), cella = squadra scelta in quella giornata colorata di
    verde (slot vivo) o rosso (eliminato). La generazione non blocca mai
    la chiusura della giornata: un errore di storage finisce solo nei
    log del server. Sezione "Backup giornate" nella dashboard del
    torneo con i link di download (scadenza firma 1 ora, si rigenerano
    ricaricando la pagina). **Verificato end-to-end contro produzione**
    (torneo di test creato, 5 giocatori finti, giornata simulata, file
    generato/scaricato/verificato, poi tutto ripulito).
  - **Bug corretto durante la preparazione**: vedi la voce sopra su
    `tryFinalizeRoundEverywhere` — trovato proprio agganciando il
    backup a quella funzione.
  - **Ancora da fare, stessa checklist** (punti 1-4, non ancora
    iniziati): chiusura formazioni dinamica sull'orario reale della
    prima partita (non più giovedì 24:00) + aggiornamento testi di
    Regolamento/Come funziona; pagina di recap risultati per il
    giocatore (slot schierati, badge squadre, esito, stato); refresh
    automatico lato giocatore quando la sincronizzazione porta nuovi
    risultati (oggi serve ricaricare la pagina).

## Da fare — semplice

- ~~Contatore "pronostici disponibili" nella UI slot~~ — già coperto
  dall'indicatore esistente "N/M tuoi slot vivi" nella card "La tua
  posizione"; non serve duplicarlo altrove.
- Glossario dei termini ufficiali (User/Tournament/Matchday/Team/Slot) —
  vedi già la tabella di mapping in
  [06_Database.md](./06_Database.md), da eventualmente promuovere a
  pagina/sezione a parte se serve anche fuori dal codice.

## Da fare — complessa

Nessuna al momento.

## Bassa priorità (esplicitamente rimandato dall'utente)

- ~~Import automatico dei risultati Serie A (CSV/scraping) al posto
  dell'inserimento manuale~~ — fatto, vedi "Sincronizzazione automatica
  del calendario Serie A da football-data.org" sopra in Fatto.

## Direzione visiva / UX

Le fondamenta (punti 1-5 dell'ordine di sviluppo) sono a un punto fermo:
su richiesta esplicita dell'utente questa parte è partita. Dettagli in
[08_Direzione_visiva_UX.md](./08_Direzione_visiva_UX.md).

- **Fatto — tema scuro spostato su tonalità verdi**: sfondo, bordi e
  testo secondario in [globals.css](../src/app/globals.css) ora hanno
  una tonalità verde chiaramente percepibile (prima il verde c'era solo
  nei numeri hex, troppo debole per essere visto).
- **Fatto — sezione Profilo**: nome pubblico modificabile dall'utente,
  un solo nome per account su tutti i tornei, separato dall'email
  (dato privato). Dettagli sopra in "Fatto" e in
  [06_Database.md](./06_Database.md).
- **Fatto — navigazione**: "Profilo" raggiungibile dal menu account
  (icona in alto a destra) in ogni schermata dell'area giocatore.
- Testi più brevi e diretti nell'interfaccia — **continuo**, da applicare
  mano a mano, non un singolo task chiudibile qui.
- **Fatto — più aria in Regolamento e Come funziona**: titoli dei
  capitoli diventati `h2` (20px, grassetto, prima erano solo l'eyebrow
  minuscolo), testo dei paragrafi ingrandito, più spazio tra le sezioni
  (`gap-3` → `gap-6`), una piccola icona per capitolo (stesso stile SVG
  del picker: `stroke-only`, tratti arrotondati — nuovo file
  [rule-icons.tsx](../src/components/rule-icons.tsx)) e un indicatore
  laterale a puntini che segue lo scroll ed evidenzia il capitolo
  corrente (nuovo componente riutilizzabile
  [scroll-dots.tsx](../src/components/scroll-dots.tsx), basato su
  `IntersectionObserver`).
