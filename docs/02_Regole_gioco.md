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
- **Scadenze**: si schiera da lunedì a giovedì 23:59:59; da venerdì le
  scelte sono chiuse fino a lunedì a mezzanotte. Enforcement sia
  server-side (`submitPickAction` rifiuta i pick fuori finestra) sia
  visivo (countdown `PickCountdown`, form nascosto quando la finestra è
  chiusa). Vedi `computePickPhase` in `pick-window.ts`.
- **Override organizzatore**: l'organizzatore può schierare, cambiare o
  togliere la scelta di qualsiasi slot in qualsiasi momento (anche fuori
  dalla finestra lunedì-giovedì), dalla pagina di gestione giornata
  (`organizerSetPickAction` / `organizerClearPickAction`).

## Descritte a parole, non ancora modellate nel database

Queste regole sono già nella pagina Regolamento (spiegate ai giocatori)
ma **non hanno un vincolo tecnico** che le faccia rispettare da sole:
oggi dipendono dal buonsenso dell'organizzatore quando inserisce i
risultati a mano.

- **Finestra ufficiale delle partite** (circa giovedì-lunedì): solo le
  partite giocate in quella finestra contano. Rinvii/recuperi fuori
  finestra non contano (né vittoria né sconfitta): lo slot resta vivo e
  la squadra non si considera usata. Oggi questo lo decide l'organizzatore
  a mente, semplicemente non inserendo un risultato per quella squadra
  quella giornata (che equivale a "non giocata" solo se lo slot non aveva
  scelto quella squadra — se l'aveva scelta, il pick resta "in sospeso"
  senza risultato, il che potrebbe confondere).
- **Tavolino**: una vittoria a tavolino conta come una vittoria normale,
  decisione manuale dell'organizzatore.
- **Stato partita (valida/esclusa)**: l'idea proposta nel documento di
  brainstorming (vedi task #14 in
  [07_Task_sviluppo.md](./07_Task_sviluppo.md)) è di dare a ogni partita
  del calendario uno stato esplicito, così le partite problematiche non
  compaiono nemmeno come selezionabili, invece di lasciare che sia
  l'organizzatore a "sistemare a mano" dopo. Non ancora implementato.

## Domande aperte (da chiarire con l'utente prima di codificarle)

- Se una partita rientra nella finestra ufficiale ma viene decisa a
  tavolino con settimane di ritardo (oltre la giornata successiva), cosa
  succede agli slot che nel frattempo hanno continuato a scegliere?
- Il calcolo risultati "entro lunedì 23:59" citato nel documento di
  brainstorming è un vincolo reale da far rispettare al sistema, o resta
  (come oggi) a discrezione dell'organizzatore?
