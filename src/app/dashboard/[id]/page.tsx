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
import {
  addPlayerAction,
  editPlayerSlotsAction,
  startTournamentAction,
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

  const [players, matchdays] = await Promise.all([
    queries.getPlayersWithSlots(supabase, tournament.id),
    queries.getMatchdays(supabase, tournament.id),
  ]);

  const winnerNames = players
    .filter((p) => tournament.winners.includes(p.id))
    .map((p) => p.display_name);
  const isDraft = tournament.status === "draft";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className={eyebrow}>{tournament.competition}</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold">
          {tournament.name}
        </h1>
      </div>

      {tournament.status === "finished" ? (
        <div className={`${card} border-accent/40`}>
          <p className={eyebrow}>Torneo concluso</p>
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

      <section className="flex flex-col gap-4">
        <p className={eyebrow}>Giocatori</p>
        {players.length === 0 ? (
          <p className="text-sm text-foreground-soft">
            Nessun giocatore ancora. Aggiungine almeno due per iniziare.
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
                    {isDraft ? (
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
                    ) : null}
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
          Chi inviti deve registrarsi (o accedere, se ha già un account) su
          Totofanta con questa stessa email: si aggancia da solo al torneo.
        </p>
      </section>

      {tournament.status === "draft" ? (
        <form action={startTournamentAction.bind(null, tournament.id)}>
          <button className={button} type="submit" disabled={players.length < 1}>
            Inizia il torneo (crea la giornata 1)
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
    </div>
  );
}
