# Regole del gioco

Versione tecnica, per chi lavora sul codice. La versione per i giocatori
(stesso contenuto, linguaggio semplice) è nell'app su `/play/regolamento`
e nel tutorial `/play/how-it-works`.

## Implementate nel codice

Fonte di verità: `src/lib/game-logic.ts` (logica pura, testata in
`src/lib/__tests__/`) e `src/lib/pick-window.ts` (finestra temporale).

- **Sopravvivenza**: uno slot resta vivo solo se la squadra scelta vince.
  Pareggio o sconfitta eliminano lo slot (`applyMatchdayResults`).
- **Mancata scelta**: uno slot vivo senza pick per la giornata viene
  trattato come sconfitta (`reason: 'missed_pick'`).
- **Slot indipendenti**: ogni slot ha una propria cronologia; una squadra
  già usata su uno slot non è più selezionabile su *quello* slot, ma resta
  libera sugli altri slot dello stesso giocatore (`teamsAvailableForSlot`,
  applicato per-slot in `getPicksForSlot`).
- **Fine torneo**: quando resta un solo giocatore con slot vivi, vince
  lui. Se una giornata azzera tutti gli slot ancora vivi in un colpo solo,
  vincono ex aequo tutti quelli che erano vivi prima di quella giornata
  (spareggio "zero superstiti", vedi `applyMatchdayResults`).
- **Scadenze**: NON più un giorno fisso di calendario (era lunedì-giovedì
  23:59:59, cambiato il 2026-09-02 su richiesta esplicita dell'utente).
  La scadenza è l'orario del calcio d'inizio della PRIMA partita non
  esclusa della giornata aperta, letto dal calendario Serie A
  sincronizzato (`serie_a_fixtures.kickoff_at`) — vedi
  `computePickDeadline` in `pick-window.ts`. Se nessuna partita non
  esclusa ha ancora un orario noto, le scelte restano aperte (nessuna
  scadenza a cui ancorarsi). Enforcement sia server-side
  (`submitPicksAction` rifiuta i pick dopo la scadenza) sia visivo
  (countdown `PickCountdown`, form nascosto quando la finestra è
  chiusa).
- **Override organizzatore**: l'organizzatore può schierare, cambiare o
  togliere la scelta di qualsiasi slot in qualsiasi momento (anche dopo
  la scadenza dei giocatori), dalla pagina di gestione giornata
  (`organizerSetPickAction` / `organizerClearPickAction`).
- **Finestra ufficiale delle partite** (venerdì-sabato-domenica-lunedì,
  vedi `src/lib/match-window.ts`) **e stato partita (valida/esclusa)**:
  ogni partita del calendario (`serie_a_fixtures`) ha ora una data/ora
  opzionale (`kickoff_at`) e uno stato (`status`, `'scheduled'` o
  `'excluded'`). Una partita è considerata esclusa ai fini del gioco per
  la sua giornata se l'organizzatore la marca a mano `'excluded'`
  (tavolino ancora da decidere, casi particolari) oppure se ha una
  data/ora nota ma fuori dalla finestra ven-lun (rinviata a un'altra
  settimana) — vedi `getExcludedTeamNames` in `src/lib/queries.ts`. Una
  partita senza data/ora ancora inserita NON è considerata esclusa solo
  per quello (l'organizzatore può semplicemente non averla ancora
  aggiornata). Effetti concreti:
  - le squadre di una partita esclusa non sono selezionabili nella
    schermata di scelta (oscurate, vedi `docs/07_Task_sviluppo.md`);
  - chi l'aveva già scelta prima che venisse esclusa resta vivo senza che
    conti né come vittoria né come sconfitta (slot "esente", vedi
    `exemptSlotIds` in `src/lib/game-logic.ts`), e la squadra torna
    disponibile per quello slot (il pick viene cancellato da
    `submitMatchdayResults`, non si considera usata).
  - **Tavolino**: una vittoria a tavolino, quando decisa in tempo per la
    giornata in corso, si inserisce come una vittoria normale
    dall'organizzatore — nessun trattamento speciale necessario.

## Decisioni prese su casi particolari

Domande che erano aperte, risolte insieme all'utente introducendo lo
stato partita:

- **Tavolino/rinvio deciso con settimane di ritardo** (oltre la giornata
  successiva, quando la giornata originale è già stata chiusa): il
  sistema **non ricalcola retroattivamente** quella giornata né quelle
  successive — sarebbe un ricalcolo a cascata rischioso. Se serve
  correggere un caso così raro, si usano a mano gli strumenti già
  esistenti dell'organizzatore (schierare/cambiare/togliere pick, e se
  serve un nuovo inserimento risultati). Lo stato "esclusa" serve a
  evitare il problema alla radice, marcando la partita PRIMA di chiudere
  la giornata.
- **Calcolo "entro lunedì 23:59"**: resta a discrezione di chi inserisce i
  risultati (`results_mode` ha un solo valore, `'manual'`) — nessun
  automatismo che blocchi o forzi l'inserimento a un orario preciso.
  L'import automatico via CSV/scraping resta rimandato a bassa priorità
  (vedi `07_Task_sviluppo.md`), ma da quando esiste l'inserimento
  centralizzato del creator (`serie_a_fixtures.result`, uno per partita
  invece che uno per torneo) l'inserimento manuale è comunque unico per
  tutti i tornei Serie A, non più ripetuto da ogni organizzatore.
