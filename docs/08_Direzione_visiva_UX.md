# Direzione visiva e UX

Dal terzo documento di brainstorming dell'utente ("Direzione visiva, UX e
identità dell'app"). Erano annotate qui perché, per esplicita indicazione
dell'utente, sarebbero venute **dopo** le fondamenta tecniche — vedi
l'ordine di priorità in [07_Task_sviluppo.md](./07_Task_sviluppo.md).
Le fondamenta sono a un punto fermo e l'utente ha chiesto esplicitamente
di partire con questa parte: lo stato di ogni voce è segnato qui sotto.

## Identità e stile

- L'app deve comunicare tecnologia, sport, calcio, competizione,
  freschezza, semplicità — non deve sembrare un'app finanziaria/seria, né
  un gioco poco curato.
- **Fatto (2026-09-23) — identità "terra"**: sostituita la base scura su
  tonalità verdi con una palette calda su base **sabbia** (chiaro,
  default) / **espresso** (scuro), accento **senape**, niente verde
  neon né effetti glow — decisa con l'utente confrontando 4 alternative
  (crema, sabbia, argilla, pietra), scelta "sabbia". Rimosso anche
  l'unico effetto "neon" trovato nel codice: un'ombra a bagliore verde
  dietro il logo in [brandbar.tsx](../src/components/brandbar.tsx). Le
  variabili di tema restano in
  [globals.css](../src/app/globals.css) (`:root` = chiaro, `:root[data-theme="dark"]`
  = scuro): il resto dell'app (pulsanti, pill, badge) non ha dovuto
  cambiare, legge sempre le stesse variabili CSS.
- **Fatto — tema selezionabile**: chiaro/scuro non è più fisso, si
  sceglie da `/play/profile` (nuova colonna `profiles.theme`, vedi
  [06_Database.md](./06_Database.md)). Applicato via un attributo
  `data-theme` sull'`<html>` letto da un cookie (non dal database a ogni
  pagina, per non appesantire il caricamento) — il cookie si aggiorna
  subito quando si cambia tema dal profilo, e si risincronizza dal
  valore salvato sull'account a ogni login (così un dispositivo/browser
  nuovo parte già con la scelta giusta, non con il default).
- Interfaccia pulita, poche schermate, flusso costante: evitare di
  disperdere l'utente in tante sezioni. Oggi l'app è già abbastanza
  compatta (home, torneo, dashboard, regolamento, how-it-works) — da
  verificare che nuove funzioni non la gonfino inutilmente.

## Linguaggio dell'interfaccia

- Testi brevi, parole chiave, azioni dirette invece di istruzioni
  ("Slot disponibili: 7" invece di spiegare a parole cosa fare). Principio
  già seguito in gran parte (vedi `docs/03_User_experience.md`), da
  applicare con più disciplina mano a mano che si aggiungono schermate.

## Navigazione — Fatto

Struttura a 3 sezioni: **Home** → **Scelta torneo** (con nome, stato,
eventuale montepremi) → **Profilo** (dati account, nome pubblico,
gestione account). "Profilo" è raggiungibile dal menu account (icona in
alto a destra) in ogni schermata dell'area giocatore — non una barra di
navigazione persistente a 3 tab, ma soddisfa lo stesso bisogno con
un'aggiunta minima, coerente con l'interfaccia compatta già seguita.

## Identità pubblica vs dati privati — Fatto

Separato il **nome visibile agli altri** (classifiche, tornei) dai dati
privati dell'account (email). Deciso con l'utente: un solo nome per
account (`profiles.display_name`, nuova colonna), valido su tutti i
tornei — quando impostato da `/play/profile`, sovrascrive ovunque il
`players.display_name` che l'organizzatore ha messo per il singolo
torneo (vedi `resolveDisplayName` in
[queries.ts](../src/lib/queries.ts)). L'email resta visibile solo
all'organizzatore, mai agli altri giocatori, come già prima.

## Mobile-first — Fatto

Nessuno scroll orizzontale (bug di Safari iOS risolto, vedi
[07_Task_sviluppo.md](./07_Task_sviluppo.md)), niente contenuti tagliati,
navigazione verticale, look "nativo". Margine laterale aumentato
ovunque (px-7/28px) per non restare appiccicati ai bordi su schermi
stretti.

## Nota sull'ordine

L'utente aveva indicato questo ordine di sviluppo: 1) logiche di gioco,
2) gestione utenti, 3) database, 4) gestione tornei, 5) flussi
principali, 6) solo dopo, la parte visiva/UX. I punti 1-5 sono a un
punto fermo e l'utente ha chiesto esplicitamente di procedere con
questa parte — le voci sopra segnate "Fatto" sono state implementate;
restano aperti solo il tono dei testi (continuo, non un singolo task) e
eventuali rifiniture ulteriori.
