# Direzione visiva e UX (proposta, non ancora implementata)

Dal terzo documento di brainstorming dell'utente ("Direzione visiva, UX e
identità dell'app"). Nessuna di queste voci è ancora stata implementata:
sono annotate qui perché, per esplicita indicazione dell'utente, vengono
**dopo** le fondamenta tecniche — vedi l'ordine di priorità in
[07_Task_sviluppo.md](./07_Task_sviluppo.md).

## Identità e stile

- L'app deve comunicare tecnologia, sport, calcio, competizione,
  freschezza, semplicità — non deve sembrare un'app finanziaria/seria, né
  un gioco poco curato.
- Base scura ma su tonalità **verdi** (non nero puro), contrasto testo
  sempre alto. Oggi la palette (`src/components/ui.ts` e le variabili di
  tema) è scura neutra con accento verde sui pulsanti/pill: da rivedere
  per spostare anche lo sfondo verso il verde, non solo l'accento.
- Interfaccia pulita, poche schermate, flusso costante: evitare di
  disperdere l'utente in tante sezioni. Oggi l'app è già abbastanza
  compatta (home, torneo, dashboard, regolamento, how-it-works) — da
  verificare che nuove funzioni non la gonfino inutilmente.

## Linguaggio dell'interfaccia

- Testi brevi, parole chiave, azioni dirette invece di istruzioni
  ("Slot disponibili: 7" invece di spiegare a parole cosa fare). Principio
  già seguito in gran parte (vedi `docs/03_User_experience.md`), da
  applicare con più disciplina mano a mano che si aggiungono schermate.

## Navigazione proposta

Struttura a 3 sezioni: **Home** → **Scelta torneo** (con nome, stato,
eventuale montepremi) → **Profilo** (dati account, nome pubblico,
gestione account). Oggi l'area giocatore ha già Home e pagina torneo;
manca una sezione Profilo dedicata.

## Identità pubblica vs dati privati

Punto concreto e ben definito: separare il **nome visibile agli altri**
(classifiche, tornei) dai dati privati dell'account (email). Oggi
`players.display_name` è già quello che compare in classifica — ma è
l'organizzatore a impostarlo quando invita, non l'utente stesso, e
l'email resta visibile all'organizzatore (mai ai giocatori, già così).
Manca: una sezione Profilo dove l'utente possa scegliere/cambiare il
proprio nome pubblico.

## Mobile-first

Nessuno scroll orizzontale, niente contenuti tagliati, navigazione
verticale, look "nativo". Già la direzione seguita (Tailwind mobile-first,
card a larghezza piena) — da tenere d'occhio quando arrivano schermate più
dense (es. lista partite).

## Nota sull'ordine

L'utente ha indicato esplicitamente questo ordine di sviluppo: 1) logiche
di gioco, 2) gestione utenti, 3) database, 4) gestione tornei, 5) flussi
principali, 6) solo dopo, la parte visiva/UX. Le voci di questo file
restano quindi proposte da riprendere quando i task "complessi" di
[07_Task_sviluppo.md](./07_Task_sviluppo.md) (ruoli, stato partita, tornei
di test) saranno a un punto fermo — non perché siano meno importanti, ma
perché costruire la grafica sopra fondamenta che cambiano ancora
significherebbe rifarla.
