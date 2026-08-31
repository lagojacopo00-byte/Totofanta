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
- **Creator**: ruolo unico a livello di piattaforma (`profiles.role`),
  distinto dall'organizzatore di un singolo torneo — pensato per
  funzioni future valide su tutta l'app (es. tornei di test). Deciso con
  l'utente: si diventa "creator" automaticamente la prima volta che si
  crea un torneo, senza nessun pannello di assegnazione a mano e senza
  restringere chi può creare un torneo (resta come oggi, self-service).
  Dettagli tecnici in [06_Database.md](./06_Database.md) e nel task
  chiuso in [07_Task_sviluppo.md](./07_Task_sviluppo.md).

Lo stesso account può essere organizzatore di un torneo e giocatore in un
altro (o nello stesso).
