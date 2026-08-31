# Architettura tecnica

## Stack

- **Frontend/backend**: Next.js 16 (App Router, Turbopack), Server
  Actions per tutte le scritture, TypeScript.
- **Database e auth**: Supabase (Postgres + Row Level Security, Supabase
  Auth). Le password non sono mai gestite a mano dall'app: Supabase Auth
  le salva già hashate (bcrypt) — il punto "sicurezza password" del
  documento di brainstorming è quindi già soddisfatto, nessuna azione
  necessaria.
- **Stile**: Tailwind CSS v4, classi riusabili in `src/components/ui.ts`.
- **Repo**: `lagojacopo00-byte/Totofanta` su GitHub. Il deploy è su
  Vercel (progetto `totofanta`), automatico a ogni push su `main`.

## Come si lavora in questo ambiente

Non essendoci un client `git` con push diretto in questo sandbox, le
modifiche vengono scritte localmente, verificate (`npm run build`,
`npm run lint`, `npm test`), e poi committate direttamente su GitHub
tramite l'interfaccia web (automazione browser). Il flusso di
verifica è: screenshot del contenuto nell'editor GitHub prima del
commit, controllo del numero di righe/byte della pagina committata dopo,
per essere certi che il contenuto sia arrivato integro.

## Convenzioni del codice

- Logica di gioco pura e testabile in `src/lib/game-logic.ts` (nessuna
  dipendenza da Next.js o Supabase, testata con `node:test`).
- Query al database centralizzate in `src/lib/queries.ts` — le pagine e
  le Server Action non parlano mai direttamente a Supabase.
- Le Server Action ricontrollano sempre le regole di gioco lato server
  (finestra di scelta, slot vivo, giornata aperta, squadra non già
  usata) anche se RLS già limita l'accesso alle proprie righe: sono
  regole applicative, non vincoli che il database conosce da solo.
- Componenti client (`"use client"`) solo dove serve interattività reale
  (es. il countdown `PickCountdown`), inizializzando lo stato a `null` e
  popolandolo in `useEffect` per evitare mismatch di hydration.

## Obiettivo dichiarato: pronto per il mobile, non prioritario ora

L'architettura attuale (API via Server Actions, dati in Postgres) non
blocca una futura app iOS/Android o l'aggiunta di notifiche push: si
tratta di aggiungere un client (es. React Native/Capacitor) che parla
alle stesse Server Action o a un'API dedicata. Non è però un lavoro da
affrontare ora — nessun task attivo lo riguarda finché non viene
richiesto esplicitamente.
