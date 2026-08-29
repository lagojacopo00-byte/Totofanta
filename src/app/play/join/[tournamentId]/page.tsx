import { redirect } from "next/navigation";
import { Brandbar } from "@/components/brandbar";
import { requirePlayer } from "@/lib/supabase/require-player";
import * as queries from "@/lib/queries";
import { button, card, eyebrow, input, label } from "@/components/ui";
import { joinTournamentAction } from "./actions";

export default async function JoinTournamentPage(
  props: PageProps<"/play/join/[tournamentId]">
) {
  const { tournamentId } = await props.params;
  const params = await props.searchParams;
  const error = typeof params.error === "string" ? params.error : null;

  const { supabase, user } = await requirePlayer(`/play/join/${tournamentId}`);

  // Se è già iscritto (magari un invito già agganciato in automatico da
  // requirePlayer, o un'iscrizione precedente), niente modulo: si va
  // dritti al torneo.
  try {
    await queries.getPlayerForTournament(supabase, tournamentId, user.id);
    redirect(`/play/${tournamentId}`);
  } catch {
    // Nessuna riga trovata: prosegue sotto con il modulo di iscrizione.
  }

  const preview = await queries.getTournamentInvitePreview(supabase, tournamentId);
  if (!preview) {
    return (
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-16">
        <Brandbar subtitle="Invito al torneo" />
        <div className={card}>
          <p className="text-sm text-foreground-soft">
            Questo link non è valido, oppure il torneo a cui punta è già
            iniziato e non accetta più nuove iscrizioni.
          </p>
        </div>
      </main>
    );
  }

  const defaultDisplayName =
    typeof user.user_metadata?.display_name === "string"
      ? user.user_metadata.display_name
      : "";

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-16">
      <Brandbar subtitle="Invito al torneo" />
      <div>
        <p className={eyebrow}>{preview.competition}</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold">
          {preview.name}
        </h1>
      </div>

      <form
        action={joinTournamentAction.bind(null, tournamentId)}
        className={`${card} flex flex-col gap-3`}
      >
        {error ? <p className="text-sm text-lose">{error}</p> : null}

        <label className={label} htmlFor="display_name">
          Come vuoi essere chiamato in questo torneo
        </label>
        <input
          className={input}
          id="display_name"
          name="display_name"
          required
          defaultValue={defaultDisplayName}
          placeholder="Il tuo nome"
        />
        <p className="text-xs text-foreground-faint">
          Ti verranno assegnati {preview.default_num_slots} slot (le
          &quot;vite&quot; con cui giochi in questo torneo).
        </p>

        <button className={`${button} mt-2`} type="submit">
          Partecipa
        </button>
      </form>
    </main>
  );
}
