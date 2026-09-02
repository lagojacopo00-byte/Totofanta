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

Il progetto è nato come gioco personale tra amici. Un obiettivo di
usabilità resta valido: chi arriva da un link di invito deve capire il
gioco in pochi secondi, registrarsi e iniziare senza spiegazioni manuali,
anche senza conoscere chi ha creato il torneo. L'architettura (Next.js +
Supabase) resta comunque adatta a un'eventuale futura app mobile — vedi
[05_Architettura_tecnica.md](./05_Architettura_tecnica.md).

**Deciso il 2026-09-02**: niente ambizione di diventare un prodotto per
estranei/un business. Una ricerca su cinque concorrenti diretti (survivor
pool su calcio) ha dato un quadro più preciso di quanto sembrasse dal
primo confronto:

- **FantaSurvivor** (dal 2022, gruppo di amici di Foggia, poi ambizione
  startup) e **FantaMatinum Survivor** (pool informale via WhatsApp tra
  due persone, nemmeno un'app) sono rimasti piccoli — rispettivamente 32
  recensioni App Store/148 follower Instagram dopo 4 anni, e una manciata
  di partecipanti locali.
- **SkillBol** (MACADE S.R.L., azienda vera, monetizzata con acquisti
  in-app) ha invece 907 recensioni App Store a 4.9/5. **Leghe Survivor
  Soccer** (Survivor Official T.D. SRL, fondata nel 2020, marchio
  registrato in Italia/UE) ha ~17.000 follower Instagram dopo 5-6 anni di
  sviluppo continuo, già alla versione 2.0. **Golazo** (piattaforma USA
  multi-sport, freemium) dichiara 620 pool attive e 6.350 giocatori
  registrati.

Il pattern: non è il genere di gioco a non scalare — è la differenza tra
trattarlo come progetto hobbistico tra amici (resta piccolo) e trattarlo
come azienda vera con anni di investimento continuo, struttura societaria
e monetizzazione (scala, anche se resta comunque un mercato di nicchia).
Decisione, confermata con questo quadro più completo: chiudere le feature
rimaste in [07_Task_sviluppo.md](./07_Task_sviluppo.md) e usare Totofanta
con il proprio gruppo di amici, senza l'impegno da azienda che servirebbe
per scalare seriamente. Di conseguenza non hanno più senso investimenti
in branding/nome/marchio/dominio pubblico o in scalabilità oltre l'uso
attuale — restano valide solo le rifiniture di usabilità e la direzione
visiva/UX già in corso.

**Aggiunto il 2026-09-02**: il progetto ha anche una seconda finalità,
distinta dall'uso con gli amici — l'utente sta seguendo un corso da data
engineer ed è in cerca di lavoro, e vuole inserire Totofanta nel proprio
portfolio. Prima di farlo (non ora, richiesto esplicitamente per più
avanti) vuole rivedere schema e ER del database e tutte le decisioni
progettuali prese finora, poi scrivere una documentazione tecnica che
spieghi come l'app è stata progettata e costruita. Task tracciato in
[07_Task_sviluppo.md](./07_Task_sviluppo.md). Questo non cambia la
decisione sopra (niente scalabilità/utenti esterni): l'obiettivo
portfolio richiede qualità e chiarezza della documentazione tecnica, non
una base utenti ampia.
visiva/UX già in corso per chi gioca con i torneo esistenti.

## Ruoli (terminologia)

- **Organizzatore / "admin di lega"**: chi crea un torneo
  (`tournaments.owner_id`). Gestisce giocatori, squadre, giornate e
  risultati del proprio torneo dalla dashboard (`/dashboard`). Ruolo *per
  torneo*, non globale: resta self-service, chiunque può crearne uno (da
  `/dashboard/new`, raggiungibile anche con un tap da `/play` tramite
  "Crea torneo").
- **Giocatore**: chi partecipa a un torneo (una riga in `players`, con
  uno o più `slots`). Gioca dall'area `/play`.
- **Creator**: ruolo unico a livello di piattaforma (`profiles.role`),
  riservato a chi gestisce l'app stessa (oggi: un solo account). Non si
  ottiene più creando un torneo (lo si otteneva così inizialmente, ma con
  "Crea torneo" ora aperto a ogni giocatore avrebbe reso "creator"
  chiunque organizzi — non è quello che vogliamo): va assegnato a mano
  sul database, vedi
  [`supabase/restrict_creator_role.sql`](../supabase/restrict_creator_role.sql).
  Dettagli tecnici in [06_Database.md](./06_Database.md) e nel task
  chiuso in [07_Task_sviluppo.md](./07_Task_sviluppo.md).

Lo stesso account può essere organizzatore di un torneo e giocatore in un
altro (o nello stesso).
