# Totofanta — istruzioni per Claude Code

Progetto: web app "sopravvissuti" per pronostici Serie A tra amici (Next.js 16 App Router + Turbopack, Supabase Auth + Postgres RLS, Server Actions).

## Regola operativa permanente (dall'utente)

Quando l'utente fa più richieste di fila, sono tutte prioritarie: è compito di Claude giudicare e dire se una modifica è complicata o semplice, non aspettare conferma per iniziare. Ogni modifica richiesta va comunque fatta, anche se la conversazione si sposta su altro nel frattempo — Claude deve tenere traccia delle richieste pendenti e riproporle attivamente, non lasciarle cadere.

## Ordine di sviluppo (indicazione esplicita dell'utente)

1. Logiche di gioco
2. Gestione utenti
3. Database
4. Gestione tornei
5. Flussi principali
6. Solo alla fine: direzione visiva/UX

La direzione visiva/UX resta volutamente in fondo: non proporla o anticiparla finché i punti 1–5 non sono a posto.

## Fonte di verità

- docs/01_Visione_progetto.md → docs/08_Direzione_visiva_UX.md: documentazione viva del progetto, da tenere aggiornata quando si completa o si decide qualcosa (non solo in chat).
- docs/07_Task_sviluppo.md in particolare: backlog vivo, sezioni Fatto / Da fare (semplice, media, complessa) / Bassa priorità.

## Disciplina di verifica prima di ogni commit

- npm run build
- npm run lint
- npm test (test runner: tsx --test src/lib/__tests__/**/*.test.ts)

Solo dopo che tutti e tre passano puliti si committa.

## Commit (indicazione esplicita dell'utente, 2026-09-02)

Quando la verifica sopra passa pulita, committa senza chiedere conferma
ogni volta — l'utente lavora anche da altre sessioni in parallelo (es.
cloud/mobile) sullo stesso repo: prima di committare fai sempre `git
status`/`git pull` per accorgerti di eventuali commit remoti nel
frattempo, e se il locale è indietro integra (merge) con cura invece di
sovrascrivere, specialmente sui file toccati anche dall'altra sessione.
