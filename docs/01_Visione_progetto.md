# Visione di progetto

## Cos'è

Totofanta è un gioco "sopravvissuti" (survivor pool) basato sulle partite
vere della Serie A. Ogni giocatore ha una o più "vite" indipendenti (gli
**slot**): a ogni giornata sceglie, per ogni slot vivo, una squadra che
pensa vincerà. Se la squadra vince, lo slot resta vivo. Se pareggia,
perde, o il giocatore non sceglie in tempo, lo slot è eliminato. Non si
può ripetere una squadra già usata sullo stesso slot. Il torneo finisce
quando resta un solo giocatore con slot vivi (o, se una giornata elimina
tutti insieme, vincono ex aequo tutti quelli che erano ancora in corsa).

Le regole complete sono in [02_Regole_gioco.md](./02_Regole_gioco.md) e,
per i giocatori, nella pagina `/play/regolamento` dell'app.

## Evoluzione dell'idea

Il progetto è nato come gioco personale tra amici. L'obiettivo attuale è
farne un prodotto usabile anche da chi non conosce chi ha creato il
torneo: arriva da un link di invito, capisce il gioco in pochi secondi,
si registra e inizia senza bisogno di spiegazioni manuali. L'architettura
(Next.js + Supabase) è già adatta a un'eventuale futura app mobile, ma
questo non è un obiettivo a breve termine — vedi
[05_Architettura_tecnica.md](./05_Architettura_tecnica.md).

## Ruoli (terminologia)

- **Organizzatore**: chi crea un torneo (`tournaments.owner_id`). Gestisce
  giocatori, squadre, giornate e risultati del proprio torneo dalla
  dashboard (`/dashboard`). Oggi è un ruolo *per torneo*, non un ruolo
  globale sulla piattaforma.
- **Giocatore**: chi partecipa a un torneo (una riga in `players`, con
  uno o più `slots`). Gioca dall'area `/play`.
- **Creator** (proposto, non ancora implementato): un ruolo unico a
  livello di piattaforma, distinto dall'organizzatore di un singolo
  torneo — pensato per chi sviluppa/gestisce Totofanta stesso (es. per
  creare tornei di test). Vedi la nota in
  [07_Task_sviluppo.md](./07_Task_sviluppo.md) sul task "ruoli
  PLAYER/ADMIN": il concetto va chiarito con l'utente prima di
  implementarlo, perché rischia di sovrapporsi o confondersi col ruolo
  "organizzatore" già esistente.

Lo stesso account può essere organizzatore di un torneo e giocatore in un
altro (o nello stesso).
