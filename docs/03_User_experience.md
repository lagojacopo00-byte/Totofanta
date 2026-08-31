# User experience

## Flusso attuale

1. L'organizzatore crea un torneo da `/dashboard/new` (nome, competizione,
   slot di default), poi invita i giocatori via email o condividendo il
   link `/play/join/[tournamentId]`.
2. Chi apre il link si registra o accede con quella stessa email e si
   aggancia da solo al torneo (nessun intervento manuale
   dell'organizzatore necessario).
3. Alla primissima volta nell'area giocatore, l'app mostra il tutorial
   `/play/how-it-works` (redirect automatico se `tutorial_seen_at` è
   nullo sul profilo).
4. Da lì in poi, l'area giocatore (`/play`) mostra i propri tornei, e la
   pagina di un torneo (`/play/[tournamentId]`) mostra posizione in
   classifica, countdown, slot con form di scelta squadra, storico
   squadre giocate e classifica completa.
5. L'organizzatore gestisce tutto da `/dashboard/[id]`: giocatori,
   squadre disponibili, giornate, risultati, e può intervenire sulle
   scelte di chiunque in qualsiasi momento da
   `/dashboard/[id]/matchday/[matchdayId]`.

## Onboarding per chi arriva da un invito (proposto, non implementato)

Il documento di brainstorming propone un onboarding più leggero per chi
arriva da un link/QR/Instagram e non conosce il gioco: 3-4 schermate
("Gioca con gli amici" → "Ogni settimana scegli una squadra" → "Sei
stato invitato al torneo X" → pulsante "Partecipa"), *prima* delle
opzioni Accedi/Registrati. È un flusso diverso dal tutorial
`/play/how-it-works` attuale, che si vede solo *dopo* essersi registrati.
Si tratta quindi di un'aggiunta, non di una sostituzione — vedi il task
corrispondente in [07_Task_sviluppo.md](./07_Task_sviluppo.md).

## Principi di design seguiti finora

- Mobile-first, card scure arrotondate, verde accento, tipografia Sora +
  monospace per i dati numerici (vedi `src/components/ui.ts`).
- Il numero più importante (la propria posizione, gli slot vivi) va
  sempre in cima, "sopra la piega".
- Le squadre sono rappresentate con iniziali su sfondo colorato
  (`TeamBadge`), non stemmi reali — scelta esplicita presa in una
  conversazione precedente per evitare questioni di licenza sui loghi. Il
  documento di brainstorming più recente chiede "loghi ufficiali": è in
  contraddizione con questa scelta, va confermato col committente cosa
  vuole davvero (vedi task colori/loghi in
  [07_Task_sviluppo.md](./07_Task_sviluppo.md)).
- Tutto il testo rivolto all'utente è in italiano colloquiale.
