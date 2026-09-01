import { card, eyebrow, input, label, button } from "@/components/ui";
import { requireUser } from "@/lib/supabase/require-user";
import { getProfileRole } from "@/lib/queries";
import { createTournamentAction } from "../actions";

export default async function NewTournamentPage(props: PageProps<"/dashboard/new">) {
  const params = await props.searchParams;
  const error = typeof params.error === "string" ? params.error : null;

  // Il checkbox "torneo di test" si vede solo se si è già creator (si
  // diventa creator creando un primo torneo vero): vedi
  // docs/01_Visione_progetto.md.
  const { supabase, user } = await requireUser();
  const isCreator = (await getProfileRole(supabase, user.id)) === "creator";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className={eyebrow}>Nuovo torneo</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold">
          Imposta le regole
        </h1>
        <p className="mt-2 max-w-md text-sm text-foreground-soft">
          Puoi cambiare questi valori anche più avanti, prima che il torneo
          inizi davvero.
        </p>
      </div>

      <form action={createTournamentAction} className={`${card} flex flex-col gap-4`}>
        {error ? <p className="text-sm text-lose">{error}</p> : null}

        <div className="flex flex-col gap-1.5">
          <label className={label} htmlFor="name">
            Nome del torneo
          </label>
          <input
            className={input}
            id="name"
            name="name"
            required
            placeholder="Es. Sopravvissuti tra colleghi"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={label} htmlFor="competition">
            Competizione
          </label>
          <input
            className={input}
            id="competition"
            name="competition"
            list="competitions"
            defaultValue="Serie A"
          />
          <datalist id="competitions">
            <option value="Serie A" />
            <option value="Serie B" />
            <option value="Champions League" />
          </datalist>
          <p className="text-xs text-foreground-faint">
            Le squadre di Serie A sono già precaricate. Con un&apos;altra
            competizione potrai aggiungere le squadre a mano.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={label} htmlFor="default_num_slots">
            Slot proposti per un nuovo giocatore
          </label>
          <input
            className={input}
            id="default_num_slots"
            name="default_num_slots"
            type="number"
            min={1}
            max={100}
            defaultValue={1}
          />
          <p className="text-xs text-foreground-faint">
            Solo un valore di partenza per il modulo &quot;aggiungi
            giocatore&quot;: deciderai il numero di slot di ognuno
            individualmente, in base a quanti ne ha comprati.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={label} htmlFor="slot_value">
            Valore per slot (€)
          </label>
          <input
            className={input}
            id="slot_value"
            name="slot_value"
            type="number"
            min={0}
            step="0.01"
            defaultValue={0}
          />
          <p className="text-xs text-foreground-faint">
            Facoltativo: se lo lasci a 0 il torneo resta senza premio. Se
            metti un valore, ai giocatori si mostra il premio totale (valore
            × numero di slot del torneo) e la loro quota man mano che
            giocano.
          </p>
        </div>

        {isCreator ? (
          <label className="flex items-start gap-2.5 rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-sm text-foreground-soft">
            <input type="checkbox" name="is_test" className="mt-0.5" />
            <span>
              <span className="font-semibold text-foreground">
                Torneo di test
              </span>{" "}
              — potrai aggiungere giocatori finti e simulare intere
              giornate all&apos;istante, per provare quanti slot/quanto
              dura, senza aspettare il calendario reale.
            </span>
          </label>
        ) : null}

        <button className={`${button} mt-2`} type="submit">
          Crea torneo
        </button>
      </form>
    </div>
  );
}
