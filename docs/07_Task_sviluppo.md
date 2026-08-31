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
3. Database — solido, mancano solo i pezzi elencati sotto (stato partita,
   eventuale ruolo)
4. Gestione tornei — a posto lato organizzatore; mancano i tornei di test
5. Flussi principali — a posto (invito, scelta, risultati, regolamento)
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
  hash-generato attuale (mantenendo le iniziali, non stemmi reali — **da
  confermare con l'utente** se vuole davvero loghi reali, il che
  aggiunge complessità per via di licenze/asset).
- Onboarding a schermate per chi arriva da un link di invito e non è
  ancora registrato (si affianca al tutorial esistente, non lo
  sostituisce).

## Da fare — complessa

- **Ruoli PLAYER/ADMIN**: richiede prima chiarire cosa deve fare
  davvero l'ADMIN (è l'organizzatore, che esiste già per-torneo, o un
  ruolo "Creator" unico sulla piattaforma?) prima di scrivere schema e
  redirect automatici — rischio concreto di costruire la cosa sbagliata.
- **Stato partita valida/esclusa**: nuovo modello dati sul calendario
  (oggi `serie_a_fixtures` non ha nemmeno un `id` proprio) più UI di
  gestione e filtro delle squadre non selezionabili.
- **Redesign schermata di scelta come lista partite per giornata**: il
  cambiamento più visibile del documento di brainstorming. Richiede
  data/ora sulle fixture (assente oggi) per raggruppare "per giorno", più
  un redesign del componente di scelta squadra.
- **Tornei di test per il Creator**: giocatori finti + simulazione
  istantanea di giornate intere, per bilanciare numero di slot/durata
  senza aspettare il calendario reale. Si appoggia in parte al lavoro sui
  ruoli (chi può creare un torneo di test?).

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
