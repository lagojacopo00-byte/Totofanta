import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/require-user";
import * as queries from "@/lib/queries";
import {
  button,
  buttonGhost,
  card,
  cardTight,
  eyebrow,
  input,
  pillAlive,
  pillOut,
} from "@/components/ui";
import { BackLink } from "@/components/back-link";
import { DeleteTournamentButton } from "./delete-tournament-button";
import { UndoLastMatchdayButton } from "./undo-last-matchday-button";
import {
  addPlayerAction,
  addTestPlayersAction,
  editPlayerSlotsAction,
  removePlayerAction,
  simulateMatchdayAction,
  startTournamentAction,
  updateSlotValueAction,
} from "./actions";

const matchdayStatusLabel: Record<string, string> = {
  open: "Aperta",
  locked: "Bloccata",
  completed: "Conclusa",
};

export default async function TournamentPage(props: PageProps<"/dashboard/[id]">) {
  const { id } = await props.params;
  const { supabase, user } = await requireUser();

  let tournament;
  try {
    tournament = await queries.getTournament(supabase, id);
  } catch {
    notFound();
  }
  if (!tournament || tournament.owner_id !== user.id) {
    notFound();
  }

  const [players, matchdays, undoPreview] = await Promise.all([
    queries.getPlayersWithSlots(supabase, tournament.id),
    queries.getMatchdays(supabase, tournament.id),
    queries.getUndoLastMatchdayPreview(supabase, tournament.id),
  ]);

  const winnerNames = players
    .filter((p) => tournament.winners.includes(p.id))
    .map((p) => p.display_name);
  const isDraft = tournament.status === "draft";

  const host = (await headers()).get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const inviteLink = host ? `${protocol}://${host}/play/join/${tournament.id}` : null;

  return (
    <div className="flex flex-col gap-8">
      <BackLink href="/dashboard" label="I tuoi tornei" />
      <div>
        <div className="flex items-center gap-2">
          <p className={eyebrow}>{tournament.competition}</p>
          {tournament.is_test ? (
            <span className="inline-flex items-center rounded-full border border-line bg-surface-2 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-foreground-faint">
              Torneo di test
            </span>
          ) : null}
        </div>
        <h1 className="mt-1 font-display text-2xl font-extrabold">
          {tournament.name}
        </h1>
      </div>

      {tournament.status === "finished" ? (
        <div className={`${card} border-accent/40`}>
          <p className={eyebrow}>Game over</p>
          <p className="mt-2 font-display text-xl font-bold text-accent">
            {winnerNames.length > 1
              ? `Vincono ex aequo: ${winnerNames.join(", ")}`
              : `Vince ${winnerNames[0] ?? "—"}`}
          </p>
          {tournament.decisive_matchday ? (
            <p className="mt-1 text-xs text-foreground-faint">
              Deciso alla giornata {tournament.decisive_matchday}
            </p>
          ) : null}
        </div>
      ) : null}

      {isDraft && inviteLink ? (
        <section className={cardTight}>
          <p className="text-xs font-semibold text-foreground-soft">
            Link di invito
          </p>
          <p className="mt-1 text-xs text-foreground-faint">
            Mandalo ai tuoi amici: chi lo apre — registrandosi al volo se
            non ha ancora un account — entra da solo nel torneo. Zero
            lavoro manuale per te.
          </p>
          <input
            className={`${input} mt-2 text-xs`}
            readOnly
            value={inviteLink}
          />
        </section>
      ) : null}

      <section className={cardTight}>
        <p className="text-xs font-semibold text-foreground-soft">Premio</p>
        <p className="mt-1 text-xs text-foreground-faint">
          Valore in € per slot × numero totale di slot del torneo =
          montepremi mostrato ai giocatori. 0 = nessun premio visibile.
        </p>
        <form
          action={updateSlotValueAction.bind(null, tournament.id)}
          className="mt-2 flex flex-col gap-2 sm:flex-row"
        >
          <input
            className={`${input} sm:w-40`}
            name="slot_value"
            type="number"
            min={0}
            step="0.01"
            defaultValue={tournament.slot_value}
          />
          <button className={buttonGhost} type="submit">
            Salva premio
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-4">
        <p className={eyebrow}>Giocatori</p>
        {players.length === 0 ? (
          <p className="text-sm text-foreground-soft">
            Ancora nessun giocatore. Portane almeno due prima di partire.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {players.map((p) => {
              const alive = p.slots.filter((s) => s.status === "alive").length;
              return (
                <li key={p.id} className={`${cardTight} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}>
                  <div>
                    <p className="font-display font-bold">{p.display_name}</p>
                    <p className="text-xs text-foreground-faint">{p.email}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {p.slots.map((s) => (
                        <span
                          key={s.id}
                          className={s.status === "alive" ? pillAlive : pillOut}
                        >
                          {s.label}
                          {s.status === "eliminated" && s.eliminated_matchday
                            ? ` · G${s.eliminated_matchday}`
                            : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <span
                      className={p.user_id ? pillAlive : "text-xs text-foreground-faint"}
                    >
                      {p.user_id ? "Account collegato" : "In attesa che si registri"}
                    </span>
                    <p className="text-xs text-foreground-faint">
                      {alive}/{p.slots.length} slot vivi
                    </p>
                    <div className="flex items-center gap-1.5">
                      <form
                        action={editPlayerSlotsAction.bind(null, tournament.id, p.id)}
                        className="flex items-center gap-1.5"
                      >
                        <input
                          className={`${input} w-16 px-2 py-1 text-center`}
                          type="number"
                          name="num_slots"
                          min={1}
                          max={100}
                          defaultValue={p.num_slots}
                        />
                        <button className={buttonGhost} type="submit">
                          Aggiorna slot
                        </button>
                      </form>
                      {isDraft ? (
                        <form action={removePlayerAction.bind(null, tournament.id, p.id)}>
                          <button
                            className={`${buttonGhost} border-lose/40 text-lose hover:border-lose hover:text-lose`}
                            type="submit"
                          >
                            Rimuovi
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <form
          action={addPlayerAction.bind(null, tournament.id)}
          className={`${cardTight} flex flex-col gap-2 sm:flex-row`}
        >
          <input
            className={input}
            name="display_name"
            placeholder="Nome del giocatore"
            required
          />
          <input
            className={input}
            name="email"
            type="email"
            placeholder="Email (per il suo account)"
            required
          />
          <input
            className={`${input} sm:w-24`}
            name="num_slots"
            type="number"
            min={1}
            max={100}
            defaultValue={tournament.default_num_slots}
            title="Slot comprati da questo giocatore"
          />
          <button className={button} type="submit">
            Invita
          </button>
        </form>
        <p className="text-xs text-foreground-faint">
          Chi inviti si registra (o accede, se ha già un account) su
          Totofanta con questa stessa email: entra da solo nel torneo,
          senza altri passaggi.
        </p>
      </section>

      {tournament.is_test ? (
        <section className={`${card} flex flex-col gap-3 border-dashed`}>
          <div>
            <p className={eyebrow}>Strumenti torneo di test</p>
            <p className="mt-1 text-xs text-foreground-soft">
              Solo qui: aggiungi giocatori finti e simula giornate intere
              all&apos;istante (scelte e risultati casuali), per capire
              subito quanti slot servono e quanto dura, senza aspettare il
              calendario vero.
            </p>
          </div>

          <form
            action={addTestPlayersAction.bind(null, tournament.id)}
            className="flex flex-col gap-2 sm:flex-row"
          >
            <input
              className={`${input} sm:w-32`}
              name="count"
              type="number"
              min={1}
              max={50}
              defaultValue={10}
              title="Quanti giocatori finti aggiungere"
            />
            <button className={buttonGhost} type="submit">
              Aggiungi giocatori finti
            </button>
          </form>

          {tournament.status === "finished" ? (
            <p className="text-xs text-foreground-faint">
              Torneo finito: niente più giornate da simulare.
            </p>
          ) : (
            <form action={simulateMatchdayAction.bind(null, tournament.id)}>
              <button
                className={button}
                type="submit"
                disabled={players.length < 1}
              >
                Simula giornata
              </button>
            </form>
          )}
        </section>
      ) : null}

      {tournament.status === "draft" ? (
        <form action={startTournamentAction.bind(null, tournament.id)}>
          <button className={button} type="submit" disabled={players.length < 1}>
            Si parte (crea la giornata 1)
          </button>
        </form>
      ) : (
        <section className="flex flex-col gap-3">
          <p className={eyebrow}>Giornate</p>
          <ul className="flex flex-col gap-2">
            {matchdays.map((m) => (
              <li key={m.id}>
                <a
                  href={`/dashboard/${tournament.id}/matchday/${m.id}`}
                  className={`${cardTight} flex items-center justify-between hover:border-accent`}
                >
                  <span className="font-display font-bold">
                    Giornata {m.number}
                  </span>
                  <span
                    className={m.status === "completed" ? pillOut : pillAlive}
                  >
                    {matchdayStatusLabel[m.status]}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {undoPreview ? (
        <section className={`${cardTight} flex items-center justify-between gap-4 border-dashed`}>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Annulla ultima giornata
            </p>
            <p className="text-xs text-foreground-faint">
              Hai sbagliato un risultato della giornata {undoPreview.matchdayNumber}?
              La riapri, correggi e la richiudi.
              {undoPreview.nextMatchdayNumber
                ? ` La giornata ${undoPreview.nextMatchdayNumber} è già aperta${
                    undoPreview.picksAtRisk > 0
                      ? ` (${undoPreview.picksAtRisk} scelt${undoPreview.picksAtRisk === 1 ? "a" : "e"} già fatt${undoPreview.picksAtRisk === 1 ? "a" : "e"}): verrà cancellata`
                      : ": verrà cancellata"
                  }.`
                : ""}
            </p>
          </div>
          <UndoLastMatchdayButton
            tournamentId={tournament.id}
            matchdayNumber={undoPreview.matchdayNumber}
            nextMatchdayNumber={undoPreview.nextMatchdayNumber}
            picksAtRisk={undoPreview.picksAtRisk}
          />
        </section>
      ) : null}

      <section className={`${cardTight} flex items-center justify-between gap-4 border-dashed`}>
        <div>
          <p className="text-sm font-semibold text-foreground">Cancella torneo</p>
          <p className="text-xs text-foreground-faint">
            Cancella il torneo e tutto quello che contiene — giocatori,
            scelte, risultati. Non si torna indietro.
          </p>
        </div>
        <DeleteTournamentButton tournamentId={tournament.id} tournamentName={tournament.name} />
      </section>
    </div>
  );
}
