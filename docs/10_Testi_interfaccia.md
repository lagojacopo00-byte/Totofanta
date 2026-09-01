# Testi dell'interfaccia — repertorio completo

Come usarlo: ogni testo ha un'etichetta tra parentesi quadre, es.
`[HOME-TITOLO]`. **Modifica solo la parte tra virgolette dopo l'etichetta**,
lascia l'etichetta stessa invariata (mi serve per ritrovare dove va
rimesso nel codice). Non serve toccare percorsi di file o codice — solo
il testo. Quando hai finito, rimandami il file (o dimmi cosa hai
cambiato) e sistemo io il copy nel codice.

Sono escluse etichette puramente tecniche invisibili (es. `aria-label`
di icone senza testo accanto) — qui c'è tutto quello che si legge
davvero nell'app.

---

## Metadati generali (titolo scheda browser)

File: `src/app/layout.tsx`

- `[META-TITOLO]`: "Totofanta"
- `[META-DESCR]`: "Il last man standing del calcio tra amici: una squadra a giornata, chi sbaglia esce."

---

## Home pubblica — `/`

File: `src/app/page.tsx`

- `[HOME-EYEBROW]`: "Last man standing calcistico tra amici"
- `[HOME-TITOLO]`: "Una squadra a giornata. Se perde sei fuori."
- `[HOME-INTRO]`: "Crea un torneo, invita i tuoi amici, e scegliete una squadra ogni giornata: chi vince continua, chi perde è eliminato. L'ultimo rimasto in gara si porta a casa il premio."
- `[HOME-BTN-SIGNUP]`: "Crea il tuo account"
- `[HOME-BTN-LOGIN]`: "Accedi"
- `[HOME-NOTA]`: "Un solo account per tutto: gioca nei tornei a cui sei invitato e, se vuoi, crea e organizza il tuo. Se sei stato invitato, usa la stessa email con cui ti hanno invitato — ti aggancia da solo al torneo."

---

## Accesso — `/play/login`

File: `src/app/play/(auth)/login/page.tsx`

- `[LOGIN-SOTTOTITOLO]`: "Accedi"
- `[LOGIN-LABEL-EMAIL]`: "Email"
- `[LOGIN-PLACEHOLDER-EMAIL]`: "tu@esempio.it"
- `[LOGIN-LABEL-PASSWORD]`: "Password"
- `[LOGIN-PLACEHOLDER-PASSWORD]`: "La tua password"
- `[LOGIN-BTN]`: "Accedi"
- `[LOGIN-LINK-SIGNUP]`: "Prima volta qui? Crea un account" (la parte cliccabile è "Crea un account")

File: `src/app/play/(auth)/login/actions.ts` (messaggi di errore)

- `[LOGIN-ERR-VUOTI]`: "Inserisci email e password"
- `[LOGIN-ERR-SBAGLIATE]`: "Email o password non corrette"

---

## Registrazione — `/play/signup`

File: `src/app/play/(auth)/signup/page.tsx`

- `[SIGNUP-SOTTOTITOLO]`: "Crea il tuo account"
- `[SIGNUP-CONFERMA-EMAIL]`: "Controlla la tua email per confermare l'account. Dopo la conferma potrai accedere ed entrerai automaticamente nei tornei per cui sei stato invitato con questa email."
- `[SIGNUP-LABEL-NOME]`: "Come ti chiami"
- `[SIGNUP-PLACEHOLDER-NOME]`: "Il tuo nome"
- `[SIGNUP-LABEL-EMAIL]`: "Email"
- `[SIGNUP-PLACEHOLDER-EMAIL]`: "tu@esempio.it"
- `[SIGNUP-NOTA-EMAIL]`: "Se sei stato invitato a un torneo, usa la stessa email con cui l'organizzatore ti ha invitato: ti aggancia da solo lì."
- `[SIGNUP-LABEL-PASSWORD]`: "Password"
- `[SIGNUP-PLACEHOLDER-PASSWORD]`: "Almeno 8 caratteri"
- `[SIGNUP-BTN]`: "Crea account"
- `[SIGNUP-LINK-LOGIN]`: "Hai già un account? Accedi" (la parte cliccabile è "Accedi")

File: `src/app/play/(auth)/signup/actions.ts` (messaggi di errore)

- `[SIGNUP-ERR-OBBLIGATORI]`: "Email e password sono obbligatorie"
- `[SIGNUP-ERR-PASSWORD-CORTA]`: "La password deve avere almeno 8 caratteri"

---

## Benvenuto da invito (chi non ha ancora un account) — `/play/join/[id]`

File: `src/app/play/join/[tournamentId]/invite-welcome.tsx`

- `[INVITO-BENVENUTO-SOTTOTITOLO]`: "Invito al torneo"
- `[INVITO-BENVENUTO-EYEBROW]`: "Sei stato invitato"
- `[INVITO-BENVENUTO-TITOLO]`: "Qualcuno ti aspetta in un torneo di Totofanta"
- `[INVITO-BENVENUTO-INTRO]`: "Ogni giornata scegli una squadra di Serie A. Vince davvero? Resti in corsa. Pareggia o perde? Sei fuori. Chi resiste più a lungo vince il torneo."
- `[INVITO-BENVENUTO-PROSSIMO-PASSO-TITOLO]`: "Prossimo passo"
- `[INVITO-BENVENUTO-PROSSIMO-PASSO-TESTO]`: "Crea un account con la stessa email a cui è arrivato l'invito: ti agganciamo subito al torneo, pronto per scegliere la tua prima squadra."
- `[INVITO-BENVENUTO-BTN-SIGNUP]`: "Crea il tuo account"
- `[INVITO-BENVENUTO-BTN-LOGIN]`: "Ho già un account"

## Modulo iscrizione al torneo (chi ha già un account) — `/play/join/[id]`

File: `src/app/play/join/[tournamentId]/page.tsx`

- `[INVITO-SOTTOTITOLO]`: "Invito al torneo"
- `[INVITO-LINK-NON-VALIDO]`: "Questo link non è valido, oppure il torneo a cui punta è già iniziato e non accetta più nuove iscrizioni."
- `[INVITO-LABEL-NOME]`: "Come vuoi essere chiamato in questo torneo"
- `[INVITO-PLACEHOLDER-NOME]`: "Il tuo nome"
- `[INVITO-NOTA-SLOT]`: "Ti verranno assegnati {N} slot (le "vite" con cui giochi in questo torneo)." — {N} è un numero, non toccarlo
- `[INVITO-BTN]`: "Partecipa"

---

## Tutorial "Come funziona" — `/play/how-it-works`

File: `src/app/play/how-it-works/page.tsx`

- `[TUTORIAL-SOTTOTITOLO]`: "Come funziona"
- `[TUTORIAL-EYEBROW]`: "Il gioco"
- `[TUTORIAL-TITOLO]`: "Una giornata, una scelta. Sbagli e sei fuori."
- `[TUTORIAL-INTRO]`: "Totofanta segue le partite vere del campionato. Ogni giornata scegli la squadra che pensi vincerà. Vince davvero? Resti in corsa. Pareggia o perde? Sei eliminato — zero scuse, come nel calcio vero. Chi resiste più a lungo entra nella storia del torneo."
- `[TUTORIAL-PREMIO-TITOLO]`: "Con gli amici, per la gloria"
- `[TUTORIAL-PREMIO-TESTO]`: "Crea un torneo, invita chi vuoi e — se decidete voi — mettete in palio un premio vero. Chi tiene in vita la propria squadra più a lungo si guadagna il trofeo (e il diritto di vanteria per un anno intero)."
- `[TUTORIAL-VITE-TITOLO]`: "Le tue vite"
- `[TUTORIAL-VITE-TESTO]`: "Hai una o più vite indipendenti (gli slot): perderne una non ti butta fuori dalle altre. Su ogni vita non puoi ripetere una squadra già scelta: una volta giocata, è bruciata per sempre su quello slot."
- `[TUTORIAL-VINCE-TITOLO]`: "Chi vince il torneo"
- `[TUTORIAL-VINCE-TESTO]`: "Si va avanti finché c'è più di un giocatore in gara. Resta uno solo con vite ancora vive? Ha vinto lui. Se una giornata elimina tutti insieme, vincono ex aequo tutti quelli che erano ancora in corsa prima."
- `[TUTORIAL-TROVI-TITOLO]`: "Nell'app trovi"
- `[TUTORIAL-TROVI-TESTO]`: "La classifica di chi è vivo o eliminato, e l'avversario di giornata per ogni squadra scelta. Le giornate le apre l'organizzatore, che inserisce anche i risultati."
- `[TUTORIAL-RITMO-TITOLO]`: "Il ritmo della settimana"
- `[TUTORIAL-RITMO-TESTO]`: "Scegli la squadra entro giovedì. Da venerdì le scelte sono chiuse: lunedì a mezzanotte escono i risultati e si aprono le squadre per la giornata successiva. Nella tua home e nella pagina del torneo trovi sempre il conto alla rovescia. Per i casi particolari (rinvii, tavolino, mancata scelta) c'è il regolamento completo." (l'ultima parte "regolamento completo" è un link)
- `[TUTORIAL-CHIUSURA]`: "Tutto chiaro? Puoi rivedere questa pagina quando vuoi dal link "Come funziona" nell'area giocatore."
- `[TUTORIAL-BTN]`: "Si comincia"

---

## Header e menu — area giocatore (in ogni schermata)

File: `src/components/brandbar.tsx` (logo + sottotitolo, il sottotitolo cambia per pagina — vedi sopra/sotto)

- `[BRAND-NOME]`: "Totofanta" (scritto in due colori, "Toto" + "fanta" — se lo cambi dimmi se vuoi mantenere la doppia colorazione)
- `[BRAND-SOTTOTITOLO-GIOCATORE]`: "Area giocatore" (mostrato nell'header fisso dell'area giocatore)

File: `src/components/player-header-menus.tsx` (menu ☰ e menu account, in alto)

- `[MENU-VOCE-TORNEI]`: "I tuoi tornei"
- `[MENU-VOCE-COME-FUNZIONA]`: "Come funziona"
- `[MENU-VOCE-REGOLAMENTO]`: "Regolamento"
- `[MENU-VOCE-ADMIN]`: "Modalità admin"
- `[MENU-VOCE-PROFILO]`: "Profilo"
- `[MENU-VOCE-ESCI]`: "Esci"

File: `src/components/back-link.tsx` (freccia "torna indietro", usata in più pagine — l'etichetta cambia, vedi ogni schermata)

---

## Home area giocatore ("I tuoi tornei") — `/play`

File: `src/app/play/(app)/page.tsx`

- `[PLAY-HOME-EYEBROW]`: "I tuoi tornei"
- `[PLAY-HOME-SALUTO]`: "Ciao, {nome}" — {nome} è il nome scelto in Profilo (o quello di registrazione), non toccarlo
- `[PLAY-HOME-NESSUN-TORNEO]`: "Non fai ancora parte di nessun torneo. Chiedi all'amico che organizza di invitarti con questa email: {email}"
- `[PLAY-HOME-STATO-BOZZA]`: "Non ancora iniziato"
- `[PLAY-HOME-STATO-CORSO]`: "In corso"
- `[PLAY-HOME-STATO-CONCLUSO]`: "Concluso"
- `[PLAY-HOME-SLOT-VIVI]`: "{N}/{M} slot vivi" — i numeri non si toccano
- `[PLAY-HOME-BTN-CREA]`: "+ Crea torneo"

---

## Pagina torneo (giocatore) — `/play/[id]`

File: `src/app/play/(app)/[tournamentId]/page.tsx`

- `[TORNEO-BACKLINK]`: "I tuoi tornei"
- `[TORNEO-CONCLUSO-TITOLO]`: "Torneo concluso"
- `[TORNEO-VINTO-EXAEQUO]`: "Avete vinto ex aequo!"
- `[TORNEO-VINTO-TU]`: "Hai vinto tu!"
- `[TORNEO-VINTO-ALTRI]`: "Ha vinto {nomi}"
- `[TORNEO-CONCLUSO-GENERICO]`: "Il torneo è concluso."
- `[TORNEO-NON-INIZIATO]`: "Il torneo non è ancora iniziato: l'organizzatore aprirà la prima giornata a breve."
- `[TORNEO-PREMIO-EYEBROW]`: "Premio in palio"
- `[TORNEO-PREMIO-QUOTA]`: "tua quota attuale"
- `[TORNEO-PREMIO-DETTAGLIO]`: "{N}/{M} slot del torneo ancora vivi sono tuoi ({X}€ a slot)."
- `[TORNEO-NESSUNA-GIORNATA]`: "Nessuna giornata aperta al momento."
- `[TORNEO-STAT-GIOCATORI]`: "giocatore" / "giocatori" (singolare/plurale)
- `[TORNEO-STAT-SLOT-GARA]`: "slot in gara"
- `[TORNEO-STAT-SLOT-TOTALI]`: "slot totali"
- `[TORNEO-SQUADRE-GIOCATE-TITOLO]`: "Le squadre che hai già giocato"
- `[TORNEO-SQUADRE-GIOCATE-BLOCCA]`: "{N}/{M} slot vivi" (quante volte blocca)
- `[TORNEO-SQUADRE-GIOCATE-LIBERA]`: "non blocca più nessun slot vivo"
- `[TORNEO-POSIZIONE-TITOLO]`: "La tua posizione"
- `[TORNEO-POSIZIONE-PARIMERITO]`: "A pari merito con altri {N} giocatore/i."
- `[TORNEO-POSIZIONE-COMANDO]`: "Sei al comando."
- `[TORNEO-POSIZIONE-CONTINUA]`: "Continua così per risalire la classifica."
- `[TORNEO-CLASSIFICA-TITOLO]`: "Classifica"
- `[TORNEO-CLASSIFICA-TU]`: "(tu)" — aggiunto dopo il tuo nome in classifica
- `[TORNEO-CLASSIFICA-VIVI]`: "{N}/{M} vivi"

File: `src/components/pick-countdown.tsx` (conto alla rovescia, in home e pagina torneo)

- `[COUNTDOWN-APERTO]`: "Schiera entro giovedì · mancano {tempo}"
- `[COUNTDOWN-CHIUSO]`: "Risultati lunedì a mezzanotte · mancano {tempo}"
- `[COUNTDOWN-IMMINENTE]`: "a momenti"

---

## Scelta squadra (picker) — dentro la pagina torneo

File: `src/app/play/(app)/[tournamentId]/team-picker.tsx`

- `[PICKER-SLOT-DISPONIBILI]`: "Slot ancora disponibili"
- `[PICKER-MODIFICHE-NON-SALVATE]`: "Modifiche non salvate"
- `[PICKER-TITOLO-SCEGLI]`: "Giornata {N} · scegli le squadre"
- `[PICKER-TITOLO-CALENDARIO]`: "Giornata {N} · calendario"
- `[PICKER-NOTA-CHIUSO]`: "Le scelte sono chiuse: si schiera solo da lunedì a giovedì. Qui sotto vedi comunque quando gioca ogni squadra."
- `[PICKER-GIORNO-VENERDI]`: "Venerdì"
- `[PICKER-GIORNO-SABATO]`: "Sabato"
- `[PICKER-GIORNO-DOMENICA]`: "Domenica"
- `[PICKER-GIORNO-LUNEDI]`: "Lunedì"
- `[PICKER-GIORNO-DACONFERMARE]`: "Data da confermare"
- `[PICKER-CASA]`: "Casa"
- `[PICKER-TRASFERTA]`: "Trasferta"
- `[PICKER-VS]`: "vs"
- `[PICKER-RISULTATO-PAREGGIO]`: "Finita · pareggio"
- `[PICKER-RISULTATO-VINTA]`: "Finita · ha vinto {squadra}"
- `[PICKER-ANCORA-ASSEGNABILI]`: "ancora {N} assegnabili"
- `[PICKER-MOTIVO-NON-TORNEO]`: "non in questo torneo"
- `[PICKER-MOTIVO-NON-DISPONIBILE]`: "non disponibile questa giornata"
- `[PICKER-MOTIVO-GIA-USATA]`: "già usata su tutti i tuoi slot"
- `[PICKER-MOTIVO-MASSIMO]`: "hai raggiunto il massimo per questa squadra ({N})"
- `[PICKER-MOTIVO-NESSUNO-SLOT]`: "nessuno slot libero per questa scelta"
- `[PICKER-ALTRE-SQUADRE]`: "Altre squadre disponibili"
- `[PICKER-TOGLI-SLOT]`: "Togli uno slot da {squadra}" (etichetta del bottone "−", non visibile ma letta da chi usa lettori di schermo)
- `[PICKER-ERRORE-NON-REALIZZABILI]`: "Le scelte attuali non sono realizzabili: prova a togliere e rimettere qualche slot."
- `[PICKER-ERRORE-GENERICO]`: "Errore nel salvare le scelte."
- `[PICKER-BTN-SALVO]`: "Salvo…"
- `[PICKER-BTN-SALVATE]`: "Scelte salvate"
- `[PICKER-BTN-CONFERMA]`: "Conferma le scelte"
- `[PICKER-BTN-ANNULLA]`: "Annulla"

---

## Regolamento — `/play/regolamento`

File: `src/app/play/(app)/regolamento/page.tsx`

- `[REG-EYEBROW]`: "Regole del gioco"
- `[REG-TITOLO]`: "Regolamento"
- `[REG-INTRO]`: "La versione breve è nella pagina Come funziona. Qui trovi i casi particolari: rinvii, recuperi, tavolino, mancata scelta e come finisce davvero una giornata." (il link è su "Come funziona")
- `[REG-SOPRAVVIVERE-TITOLO]`: "Come si sopravvive a una giornata"
- `[REG-SOPRAVVIVERE-TESTO]`: "Uno slot resta vivo solo se la squadra scelta vince. Pareggio o sconfitta eliminano lo slot, senza eccezioni: non conta il piazzamento, non conta "quasi", conta solo il risultato finale della partita."
- `[REG-MANCATA-SCELTA-TITOLO]`: "Mancata scelta"
- `[REG-MANCATA-SCELTA-TESTO]`: "Se uno slot arriva alla scadenza senza una squadra scelta, viene trattato come una sconfitta: lo slot è eliminato. Non esistono scelte automatiche o di riserva — è responsabilità di ognuno schierarsi in tempo (l'organizzatore può comunque farlo per conto tuo, vedi più sotto)."
- `[REG-SCADENZE-TITOLO]`: "Scadenze"
- `[REG-SCADENZE-TESTO]`: "Si schiera da lunedì a giovedì; il termine ultimo è giovedì a mezzanotte. Da venerdì le scelte restano chiuse fino a lunedì a mezzanotte, quando escono i risultati della giornata e si aprono le squadre per quella successiva. Il conto alla rovescia in home e nella pagina del torneo mostra sempre quanto manca."
- `[REG-SQUADRE-USATE-TITOLO]`: "Squadre già usate"
- `[REG-SQUADRE-USATE-TESTO]`: "Ogni slot ha una propria memoria: una volta giocata, una squadra è bruciata per sempre su quello slot e non si può riscegliere. Gli slot sono indipendenti tra loro, anche quelli dello stesso giocatore: la stessa squadra può tornare libera su un altro slot."
- `[REG-RINVII-TITOLO]`: "Rinvii, recuperi e tavolino"
- `[REG-RINVII-TESTO]`: "Per il gioco vale solo ciò che succede nella finestra ufficiale della giornata, all'incirca da giovedì a lunedì. Se una partita viene rinviata e si gioca fuori da quella finestra (un recupero successivo), per quella giornata non è valida: non conta né come vittoria né come sconfitta, lo slot resta vivo e la squadra scelta non si considera consumata — resta disponibile per una scelta futura. Una vittoria a tavolino (decisa dagli organi del campionato, es. per forfait) conta invece come un risultato normale, non appena viene ufficializzata."
- `[REG-FINE-GIORNATA-TITOLO]`: "Fine giornata ed eliminazione"
- `[REG-FINE-GIORNATA-TESTO]`: "Una giornata si chiude quando l'organizzatore inserisce i risultati delle squadre scelte: da lì lo stato di ogni slot si aggiorna in automatico. Un giocatore è fuori dal torneo quando tutti i suoi slot sono stati eliminati."
- `[REG-VINCE-TORNEO-TITOLO]`: "Chi vince il torneo"
- `[REG-VINCE-TORNEO-TESTO]`: "Si va avanti finché resta più di un giocatore in gara. Quando ne resta uno solo con almeno uno slot vivo, il torneo finisce e ha vinto lui. Se invece una giornata elimina in un colpo solo tutti gli slot ancora vivi, il torneo finisce comunque: vincono ex aequo tutti i giocatori che erano ancora in corsa prima di quella giornata."
- `[REG-ORGANIZZATORE-TITOLO]`: "Il ruolo dell'organizzatore"
- `[REG-ORGANIZZATORE-TESTO]`: "L'organizzatore apre le giornate e inserisce i risultati a mano. Può anche schierare, cambiare o togliere la scelta di qualsiasi slot in qualsiasi momento — anche oltre la scadenza di giovedì che vale per i giocatori — utile per chi è indietro con l'account o per correggere un errore."

---

## Profilo — `/play/profile`

File: `src/app/play/(app)/profile/page.tsx`

- `[PROFILO-EYEBROW]`: "Profilo"
- `[PROFILO-TITOLO]`: "Il tuo account"
- `[PROFILO-LABEL-NOME]`: "Nome pubblico"
- `[PROFILO-NOTA-NOME]`: "Quello che vedono gli altri giocatori in classifica, in ogni torneo — se lo cambi qui, vale ovunque, non solo in uno."
- `[PROFILO-PLACEHOLDER-NOME]`: "Come vuoi farti chiamare"
- `[PROFILO-BTN-SALVA]`: "Salva"
- `[PROFILO-DATI-PRIVATI-TITOLO]`: "Dati privati dell'account"
- `[PROFILO-NOTA-EMAIL]`: "La tua email non è mai visibile agli altri giocatori."

---

## Dashboard organizzatore — elenco tornei — `/dashboard`

File: `src/app/dashboard/page.tsx`

- `[DASH-EYEBROW]`: "I tuoi tornei"
- `[DASH-TITOLO]`: "Dashboard"
- `[DASH-BTN-NUOVO]`: "+ Nuovo torneo"
- `[DASH-NESSUN-TORNEO]`: "Non hai ancora nessun torneo. Creane uno per iniziare a invitare i tuoi amici."
- `[DASH-TAG-TEST]`: "Test" (etichetta su un torneo di prova)
- `[DASH-STATO-BOZZA]`: "Non ancora iniziato"
- `[DASH-STATO-CORSO]`: "In corso"
- `[DASH-STATO-CONCLUSO]`: "Concluso"

File: `src/app/dashboard/layout.tsx` (header, in ogni pagina della dashboard)

- `[DASH-HEADER-SOTTOTITOLO]`: "Dashboard organizzatore"
- `[DASH-HEADER-MODALITA-GIOCATORE]`: "Modalità giocatore"
- `[DASH-HEADER-CALENDARIO]`: "Calendario Serie A"
- `[DASH-HEADER-ESCI]`: "Esci"

---

## Nuovo torneo — `/dashboard/new`

File: `src/app/dashboard/new/page.tsx`

- `[NUOVO-BACKLINK]`: "I tuoi tornei"
- `[NUOVO-EYEBROW]`: "Nuovo torneo"
- `[NUOVO-TITOLO]`: "Imposta le regole"
- `[NUOVO-INTRO]`: "Puoi cambiare questi valori anche più avanti, prima che il torneo inizi davvero."
- `[NUOVO-LABEL-NOME]`: "Nome del torneo"
- `[NUOVO-PLACEHOLDER-NOME]`: "Es. Sopravvissuti tra colleghi"
- `[NUOVO-LABEL-COMPETIZIONE]`: "Competizione"
- `[NUOVO-NOTA-COMPETIZIONE]`: "Le squadre di Serie A sono già precaricate. Con un'altra competizione potrai aggiungere le squadre a mano."
- `[NUOVO-LABEL-SLOT]`: "Slot proposti per un nuovo giocatore"
- `[NUOVO-NOTA-SLOT]`: "Solo un valore di partenza per il modulo "aggiungi giocatore": deciderai il numero di slot di ognuno individualmente, in base a quanti ne ha comprati."
- `[NUOVO-LABEL-PREMIO]`: "Valore per slot (€)"
- `[NUOVO-NOTA-PREMIO]`: "Facoltativo: se lo lasci a 0 il torneo resta senza premio. Se metti un valore, ai giocatori si mostra il premio totale (valore × numero di slot del torneo) e la loro quota man mano che giocano."
- `[NUOVO-CHECKBOX-TEST-TITOLO]`: "Torneo di test"
- `[NUOVO-CHECKBOX-TEST-TESTO]`: "potrai aggiungere giocatori finti e simulare intere giornate all'istante, per provare quanti slot/quanto dura, senza aspettare il calendario reale."
- `[NUOVO-BTN]`: "Crea torneo"
- `[NUOVO-ERR-NOME]`: "Dai un nome al torneo" (messaggio d'errore se il nome è vuoto)

---

## Pagina torneo (organizzatore) — `/dashboard/[id]`

File: `src/app/dashboard/[id]/page.tsx`

- `[ORG-BACKLINK]`: "I tuoi tornei"
- `[ORG-TAG-TEST]`: "Torneo di test"
- `[ORG-CONCLUSO-TITOLO]`: "Torneo concluso"
- `[ORG-VINCE-EXAEQUO]`: "Vincono ex aequo: {nomi}"
- `[ORG-VINCE]`: "Vince {nome}"
- `[ORG-DECISO-GIORNATA]`: "Deciso alla giornata {N}"
- `[ORG-INVITO-TITOLO]`: "Link di invito"
- `[ORG-INVITO-TESTO]`: "Mandalo ai tuoi amici: chi lo apre (registrandosi, se non ha ancora un account) si iscrive da solo al torneo, senza che tu debba aggiungerlo a mano."
- `[ORG-PREMIO-TITOLO]`: "Premio"
- `[ORG-PREMIO-TESTO]`: "Valore in € per slot, moltiplicato per il numero totale di slot del torneo dà il premio totale mostrato ai giocatori. 0 = nessun premio mostrato."
- `[ORG-PREMIO-BTN]`: "Salva premio"
- `[ORG-GIOCATORI-TITOLO]`: "Giocatori"
- `[ORG-GIOCATORI-NESSUNO]`: "Nessun giocatore ancora. Aggiungine almeno due per iniziare."
- `[ORG-ACCOUNT-COLLEGATO]`: "Account collegato"
- `[ORG-ACCOUNT-ATTESA]`: "In attesa che si registri"
- `[ORG-SLOT-VIVI]`: "{N}/{M} slot vivi"
- `[ORG-BTN-AGGIORNA-SLOT]`: "Aggiorna slot"
- `[ORG-BTN-RIMUOVI]`: "Rimuovi"
- `[ORG-INVITA-PLACEHOLDER-NOME]`: "Nome del giocatore"
- `[ORG-INVITA-PLACEHOLDER-EMAIL]`: "Email (per il suo account)"
- `[ORG-INVITA-BTN]`: "Invita"
- `[ORG-INVITA-NOTA]`: "Chi inviti deve registrarsi (o accedere, se ha già un account) su Totofanta con questa stessa email: si aggancia da solo al torneo."
- `[ORG-TEST-TITOLO]`: "Strumenti torneo di test"
- `[ORG-TEST-TESTO]`: "Solo su questo torneo: aggiungi giocatori finti e simula giornate intere all'istante (scelte e risultati casuali), per provare quanti slot/quanto dura senza aspettare il calendario reale."
- `[ORG-TEST-BTN-AGGIUNGI]`: "Aggiungi giocatori finti"
- `[ORG-TEST-FINITO]`: "Torneo finito: non c'è più nessuna giornata da simulare."
- `[ORG-TEST-BTN-SIMULA]`: "Simula giornata"
- `[ORG-BTN-INIZIA]`: "Inizia il torneo (crea la giornata 1)"
- `[ORG-GIORNATE-TITOLO]`: "Giornate"
- `[ORG-GIORNATA]`: "Giornata {N}"
- `[ORG-GIORNATA-APERTA]`: "Aperta"
- `[ORG-GIORNATA-BLOCCATA]`: "Bloccata"
- `[ORG-GIORNATA-CONCLUSA]`: "Conclusa"
- `[ORG-CANCELLA-TITOLO]`: "Cancella torneo"
- `[ORG-CANCELLA-TESTO]`: "Rimuove il torneo e tutto ciò che contiene: giocatori, scelte, risultati. Non si può annullare."

File: `src/app/dashboard/[id]/delete-tournament-button.tsx`

- `[ORG-CANCELLA-CONFERMA]`: "Cancellare definitivamente "{nome torneo}"? Giocatori, scelte e risultati andranno persi per sempre. Questa azione non si può annullare." (popup di conferma del browser)
- `[ORG-CANCELLA-BTN]`: "Cancella torneo"

---

## Pagina giornata (organizzatore) — `/dashboard/[id]/matchday/[id]`

File: `src/app/dashboard/[id]/matchday/[matchdayId]/page.tsx`

- `[GG-BACKLINK]`: "Torneo"
- `[GG-TITOLO]`: "Giornata {N}"
- `[GG-GESTISCI-TITOLO]`: "Gestisci le scelte"
- `[GG-GESTISCI-TESTO]`: "Puoi schierare, cambiare o togliere la scelta di ogni giocatore quando vuoi — anche oltre la scadenza di giovedì che vale per loro."
- `[GG-NESSUNO-SLOT]`: "Nessuno slot in gara al momento."
- `[GG-NESSUNA-SCELTA]`: "Nessuna scelta"
- `[GG-SELECT-PLACEHOLDER]`: "Scegli squadra…"
- `[GG-BTN-SALVA]`: "Salva"
- `[GG-BTN-RIMUOVI]`: "Rimuovi"
- `[GG-NESSUNA-SCELTA-GIORNATA]`: "Nessuno ha ancora scelto una squadra per questa giornata."
- `[GG-PARTITA-ESCLUSA]`: "Partita esclusa: chi l'ha scelta resta in gara, nessun risultato da inserire."
- `[GG-ESITO-VINTA]`: "Vinta"
- `[GG-ESITO-PAREGGIATA]`: "Pareggiata"
- `[GG-ESITO-PERSA]`: "Persa"
- `[GG-BTN-APPLICA]`: "Applica risultati e passa alla giornata successiva"

---

## Calendario Serie A — `/dashboard/fixtures`

File: `src/app/dashboard/fixtures/page.tsx`

- `[CAL-BACKLINK]`: "I tuoi tornei"
- `[CAL-EYEBROW]`: "Calendario Serie A"
- `[CAL-TITOLO]`: "Accoppiamenti per giornata"
- `[CAL-INTRO]`: "La giornata N di un torneo corrisponde alla giornata N del vero campionato: qui puoi tenere aggiornato chi gioca contro chi, così i tuoi giocatori lo vedono quando scelgono la squadra. Le giornate 1–25 sono già precompilate (fonte: ricerca web, quindi ricontrolla soprattutto le giornate più lontane e correggi se una partita è stata spostata dalle tv); le altre le aggiungi tu."
- `[CAL-LABEL-GIORNATA]`: "Giornata"
- `[CAL-LABEL-CASA]`: "Squadra in casa"
- `[CAL-PLACEHOLDER-CASA]`: "Es. Napoli"
- `[CAL-LABEL-TRASFERTA]`: "Squadra in trasferta"
- `[CAL-PLACEHOLDER-TRASFERTA]`: "Es. Milan"
- `[CAL-LABEL-DATA]`: "Data/ora (opzionale)"
- `[CAL-BTN-SALVA-NUOVA]`: "Salva"
- `[CAL-NESSUN-ACCOPPIAMENTO]`: "Nessun accoppiamento salvato ancora."
- `[CAL-GIORNATA]`: "Giornata {N}"
- `[CAL-ESCLUSA]`: "Esclusa" (etichetta)
- `[CAL-DATA-NON-INSERITA]`: "Data/ora non ancora inserita"
- `[CAL-BTN-SALVA-ORA]`: "Salva ora"
- `[CAL-BTN-ESCLUDI]`: "Escludi"
- `[CAL-BTN-INCLUDI]`: "Includi di nuovo"
- `[CAL-TOOLTIP-ESCLUDI]`: "Una partita esclusa non conta ai fini del gioco per questa giornata"
- `[CAL-BTN-ELIMINA]`: "Elimina"
- `[CAL-RISULTATO-VITTORIA-CASA]`: "Vittoria {squadra in casa}" (etichetta quando risultato = 1)
- `[CAL-RISULTATO-PAREGGIO]`: "Pareggio" (etichetta quando risultato = X)
- `[CAL-RISULTATO-VITTORIA-TRASFERTA]`: "Vittoria {squadra in trasferta}" (etichetta quando risultato = 2)
- `[CAL-TOOLTIP-RISULTATO]`: "Esito reale: chiude subito la giornata su ogni torneo Serie A che ce l'ha aperta, appena tutte le partite di questa giornata hanno un esito" (visibile solo al creator)
- `[CAL-TOOLTIP-CANCELLA-ESITO]`: "Cancella l'esito" (visibile solo al creator)
