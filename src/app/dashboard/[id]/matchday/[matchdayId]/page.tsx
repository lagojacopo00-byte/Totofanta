import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/require-user";
import * as queries from "@/lib/queries";
import { button, card, cardTight, eyebrow, pillAlive, pillOut } from "@/components/ui";
import { TeamLabel } from "@/components/team-badge";
import { submitResultsAction } from "./actions";

const outcomeLabel = { win: "Vinta", draw: "Pareggiata", loss: "Persa" } as const;

export default async function MatchdayPage(
  props: PageProps<"/dashboard/[id]/matchday/[matchdayId]">
) {
  const { id, matchdayId } = await props.params;
  const { supabase, user } = await requireUser();

  const tournament = await queries.getTournament(supabase, id);
  if (tournament.owner_id !== user.id) notFound();

  const matchday = await queries.getMatchday(supabase, matchdayId);
  if (matchday.tournament_id !== id) notFound();

  const [picks, players] = await Promise.all([
    queries.getPicksForMatchday(supabase, matchday.id),
    queries.getPlayersWithSlots(supabase, id),
  ]);

  const slotOwner = new Map<string, string>();
  for (const p of players) {
    for (const s of p.slots) slotOwner.set(s.id, `${p.display_name} · ${s.label}`);
  }

  const teamIds = Array.from(new Set(picks.map((p) => p.team_id)));
  const teams = await queries.getTeamsByIds(supabase, teamIds);
  const teamName = new Map(teams.map((t) => [t.id, t.name]));

  const pickersByTeam = new Map<string, string[]>();
  for (const p of picks) {
    const list = pickersByTeam.get(p.team_id) ?? [];
    list.push(slotOwner.get(p.slot_id) ?? "?");
    pickersByTeam.set(p.team_id, list);
  }

  const isOpen = matchday.status === "open";
  const results = isOpen ? [] : await queries.getMatchdayResults(supabase, matchday.id);
  const resultByTeam = new Map(results.map((r) => [r.team_id, r.outcome]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className={eyebrow}>{tournament.name}</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold">
          Giornata {matchday.number}
        </h1>
      </div>

      {teamIds.length === 0 ? (
        <p className="text-sm text-foreground-soft">
          Nessuno ha ancora scelto una squadra per questa giornata.
        </p>
      ) : isOpen ? (
        <form
          action={submitResultsAction.bind(null, id, matchday.id)}
          className="flex flex-col gap-3"
        >
          {teamIds.map((teamId) => (
            <div key={teamId} className={`${card} flex items-center justify-between gap-4`}>
              <div>
                <p className="font-display font-bold">
                  <TeamLabel name={teamName.get(teamId) ?? teamId} size="md" />
                </p>
                <p className="text-xs text-foreground-faint">
                  {pickersByTeam.get(teamId)?.join(", ")}
                </p>
              </div>
              <div className="flex gap-1 rounded-full border border-line p-1">
                {(["win", "draw", "loss"] as const).map((o) => (
                  <label
                    key={o}
                    className="cursor-pointer rounded-full px-3 py-1.5 text-xs font-bold has-[:checked]:bg-accent has-[:checked]:text-accent-ink"
                  >
                    <input
                      type="radio"
                      name={`outcome_${teamId}`}
                      value={o}
                      required
                      className="sr-only"
                    />
                    {outcomeLabel[o]}
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button className={`${button} mt-2`} type="submit">
            Applica risultati e passa alla giornata successiva
          </button>
        </form>
      ) : (
        <ul className="flex flex-col gap-2">
          {teamIds.map((teamId) => {
            const outcome = resultByTeam.get(teamId);
            return (
              <li
                key={teamId}
                className={`${cardTight} flex items-center justify-between gap-4`}
              >
                <div>
                  <p className="font-display font-bold">
                  <TeamLabel name={teamName.get(teamId) ?? teamId} size="md" />
                </p>
                  <p className="text-xs text-foreground-faint">
                    {pickersByTeam.get(teamId)?.join(", ")}
                  </p>
                </div>
                <span className={outcome === "win" ? pillAlive : pillOut}>
                  {outcome ? outcomeLabel[outcome] : "—"}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
