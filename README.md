# Totofanta

Il "last man standing" calcistico da giocare con gli amici: una squadra a
giornata, chi perde (o pareggia) è fuori. Vince chi resta l'ultimo con
almeno uno slot ancora vivo.

Questo repository è un MVP funzionante: crea il tuo progetto Supabase,
segui i passi qui sotto e in 10-15 minuti hai un torneo giocabile online,
gratis.

## Cosa c'è già

- Login organizzatore senza password (link via email, Supabase Auth).
- Account vero per ogni giocatore (email + password): l'organizzatore lo
  invita inserendo la sua email e quanti slot gli ha assegnato; quando
  quella persona si registra (o accede, se ha già un account) con QUELLA
  email, si aggancia da sola all'invito — non serve nessun link segreto
  da custodire.
- Creazione di più tornei indipendenti, ciascuno con la propria
  competizione. Ogni giocatore può avere un numero di slot diverso dagli
  altri (decide l'organizzatore, in base a quanti ne ha comprati), senza
  un vero tetto massimo.
- Scelta della squadra a giornata, con divieto di ripetere una squadra
  già usata sullo stesso slot.
- Inserimento manuale dei risultati da parte dell'organizzatore, con
  eliminazione automatica degli slot e passaggio alla giornata
  successiva.
- Spareggio "zero superstiti" (ex aequo) e vittoria quando resta un solo
  giocatore in gara.
- Squadre di Serie A 2026/27 già precaricate.

## Cosa manca ancora (prossimi passi)

- Interfaccia per aggiungere squadre personalizzate a un torneo con
  competizione diversa da Serie A (per ora vanno inserite a mano in
  Supabase, tabella `teams`).
- Notifiche/promemoria prima della scadenza di ogni giornata.
- Recupero password per i giocatori (per ora solo email + password,
  nessun flusso di reset).
- Recupero automatico dei risultati da un servizio dati calcio (per ora
  è tutto manuale, come da regolamento).

## 1. Crea il progetto Supabase

1. Vai su [supabase.com](https://supabase.com), crea un account e un
   nuovo progetto (piano Free va benissimo).
2. Apri **SQL Editor**, incolla tutto il contenuto di
   [`supabase/schema.sql`](./supabase/schema.sql) ed esegui. Questo crea
   le tabelle, le policy di sicurezza, il trigger che crea un profilo ad
   ogni nuova registrazione, e precarica le squadre di Serie A.
3. Vai su **Project Settings → API** e copia:
   - `Project URL`
   - `anon public` key
   - `service_role` key (⚠️ non va mai esposta al browser — il codice
     non la usa più per i giocatori, ma la teniamo pronta per usi
     amministrativi futuri)

## 2. Configura le email di autenticazione

Ci sono due flussi email da collegare allo stesso file
`src/app/auth/confirm/route.ts`, uno per l'organizzatore e uno per i
giocatori:

**Magic Link** (accesso organizzatore, senza password) — in
**Authentication → Email Templates → Magic Link**, sostituisci il link
del template con:

```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard
```

**Confirm signup** (registrazione giocatore, email + password) — in
**Authentication → Email Templates → Confirm signup**, sostituisci il
link con:

```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next=/play
```

Se preferisci che i tuoi amici possano giocare subito senza dover
confermare l'email (utile per un gruppo ristretto), puoi anche disattivare
la conferma da **Authentication → Sign In / Providers → Email → "Confirm
email"**: in quel caso il secondo template non serve.

(Il piano gratuito di Supabase manda le email di autenticazione con un
limite orario basso ma sufficiente per un gruppo di amici; per un uso più
serio conviene collegare un provider SMTP proprio, sempre da
**Authentication → SMTP Settings**.)

## 3. Configura il progetto in locale

```bash
npm install
cp .env.local.example .env.local
```

Apri `.env.local` e incolla i tre valori presi al punto 1.

```bash
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000): trovi la home, il
login organizzatore su `/login` e la dashboard su `/dashboard` una volta
autenticato.

## 4. Prova il flusso completo

1. Accedi da `/login` con la tua email (arriva un link, nessuna
   password).
2. Crea un torneo da `/dashboard/new`.
3. Aggiungi almeno due giocatori: per ognuno indichi nome, email e
   quanti slot ha comprato.
4. Apri `/play/signup` (anche in una finestra anonima, per simulare un
   amico) e registrati con la STESSA email appena invitata: quel
   giocatore risulterà "Account collegato" nella dashboard, con i suoi
   slot già pronti.
5. Clicca "Inizia il torneo" per aprire la giornata 1.
6. Da `/play`, quell'account sceglie una squadra per ogni slot vivo.
7. Torna nella dashboard, apri la giornata dal torneo ed inserisci vinta
   / pareggiata / persa per ogni squadra scelta: il sistema elimina gli
   slot giusti e apre da solo la giornata successiva.

Nota sugli slot: il numero di slot di un giocatore si può cambiare
liberamente finché il torneo è ancora "Non iniziato" (prima di creare la
giornata 1); dopo resta fisso per tutta la durata, per non rimescolare le
carte a torneo in corso.

## Test della logica di gioco

Le regole di eliminazione, indipendenza degli slot e spareggio ex aequo
sono isolate in `src/lib/game-logic.ts` e testate senza bisogno di
Supabase:

```bash
npm test
```

## 5. Deploy gratuito su Vercel

1. Metti questo progetto su GitHub (o GitLab/Bitbucket).
2. Su [vercel.com](https://vercel.com), importa il repository.
3. Nelle Environment Variables del progetto Vercel, aggiungi le stesse
   tre variabili di `.env.local`.
4. Deploy. Il piano gratuito di Vercel copre tranquillamente un torneo
   tra amici.

Una volta deployato, assicurati che l'URL del sito sia impostato
correttamente in **Authentication → URL Configuration → Site URL** su
Supabase (altrimenti Supabase potrebbe rifiutare i redirect delle email
di conferma/accesso).

## Struttura del progetto

```
supabase/schema.sql        Schema del database + policy di sicurezza + seed Serie A
src/lib/game-logic.ts      Regole del gioco, pure e testate (node:test)
src/lib/queries.ts         Tutte le query/scritture verso Supabase
src/lib/supabase/          Client Supabase (browser, server, service-role)
src/app/login              Login organizzatore (magic link)
src/app/dashboard          Area organizzatore: tornei, giocatori, giornate, risultati
src/app/play               Area giocatore: registrazione/accesso (email+password), scelte
```
