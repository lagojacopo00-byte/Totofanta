import { requirePlayer } from "@/lib/supabase/require-player";
import { getProfileDisplayName } from "@/lib/queries";
import { card, cardTight, eyebrow, input, label, button } from "@/components/ui";
import { BackLink } from "@/components/back-link";
import { updateDisplayNameAction, updatePasswordAction } from "./actions";

export default async function ProfilePage(props: PageProps<"/play/profile">) {
  const { supabase, user } = await requirePlayer();
  const displayName = await getProfileDisplayName(supabase, user.id);
  const params = await props.searchParams;
  const error = typeof params.error === "string" ? params.error : null;
  const saved = params.saved === "1";

  return (
    <div className="flex flex-col gap-6">
      <BackLink href="/play" label="I tuoi tornei" />

      <div>
        <p className={eyebrow}>Profilo</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold">
          Il tuo account
        </h1>
      </div>

      <section className={`${card} flex flex-col gap-2`}>
        <label className={label} htmlFor="display_name">
          Nome pubblico
        </label>
        <p className="text-xs text-foreground-faint">
          Il nome che vedono tutti in classifica, in ogni torneo. Lo cambi
          qui, cambia ovunque — non solo in uno.
        </p>
        <form action={updateDisplayNameAction} className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            className={input}
            id="display_name"
            name="display_name"
            defaultValue={displayName ?? ""}
            placeholder="Come vuoi farti chiamare"
            required
          />
          <button className={button} type="submit">
            Salva
          </button>
        </form>
      </section>

      <section className={`${cardTight} flex flex-col gap-1`}>
        <p className="text-xs font-semibold text-foreground-soft">
          Dati privati dell&apos;account
        </p>
        <p className="text-sm text-foreground">{user.email}</p>
        <p className="text-xs text-foreground-faint">
          La tua email resta solo tua: nessun altro giocatore la vede.
        </p>
      </section>

      <section className={`${card} flex flex-col gap-2`}>
        <label className={label} htmlFor="password">
          Cambia password
        </label>
        {error ? <p className="text-sm text-lose">{error}</p> : null}
        {saved ? (
          <p className="text-sm text-accent">Password aggiornata.</p>
        ) : null}
        <form action={updatePasswordAction} className="mt-1 flex flex-col gap-2 sm:flex-row">
          <input
            className={input}
            id="password"
            name="password"
            type="password"
            minLength={8}
            placeholder="Nuova password, almeno 8 caratteri"
            required
          />
          <button className={button} type="submit">
            Salva
          </button>
        </form>
      </section>
    </div>
  );
}
