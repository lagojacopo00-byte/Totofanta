import { requirePlayer } from "@/lib/supabase/require-player";
import {
  getOrganizerTournaments,
  getProfileDisplayName,
  getProfileFullName,
} from "@/lib/queries";
import { card, cardTight, eyebrow, input, label, button } from "@/components/ui";
import { DeleteAccountButton } from "./delete-account-button";
import { EditableField } from "./editable-field";
import { ChangePasswordField } from "./change-password-field";
import {
  updateDisplayNameAction,
  updateEmailAction,
  updateFullNameAction,
  updatePasswordAction,
} from "./actions";

export default async function ProfilePage(props: PageProps<"/play/profile">) {
  const { supabase, user } = await requirePlayer();
  const [displayName, fullName, ownedTournaments] = await Promise.all([
    getProfileDisplayName(supabase, user.id),
    getProfileFullName(supabase, user.id),
    getOrganizerTournaments(supabase, user.id),
  ]);
  const params = await props.searchParams;
  const passwordError = typeof params.passwordError === "string" ? params.passwordError : null;
  const emailError = typeof params.emailError === "string" ? params.emailError : null;
  const savedPassword = params.savedPassword === "1";
  const emailChangeRequested = params.emailChangeRequested === "1";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className={eyebrow}>Profilo</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold">
          Il tuo account
        </h1>
      </div>

      <section className={`${card} flex flex-col gap-2`}>
        <EditableField
          fieldLabel="Nome pubblico"
          description="Il nome che vedono tutti in classifica, in ogni torneo. Lo cambi qui, cambia ovunque — non solo in uno."
          value={displayName ?? ""}
          action={updateDisplayNameAction}
          name="display_name"
          big
        />
      </section>

      <section className={`${card} flex flex-col gap-2`}>
        <p className={label}>Nome e cognome</p>
        <p className="text-xs text-foreground-faint">
          Diverso dal nome pubblico: se scegli un nickname, questo resta
          visibile agli altri giocatori nella classifica di ogni torneo,
          così capiscono comunque chi sei. Facoltativo.
        </p>
        <form
          action={updateFullNameAction}
          className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end"
        >
          <div className="flex flex-1 flex-col gap-1.5">
            <label className={label} htmlFor="first_name">
              Nome
            </label>
            <input
              className={input}
              id="first_name"
              name="first_name"
              defaultValue={fullName.firstName ?? ""}
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <label className={label} htmlFor="last_name">
              Cognome
            </label>
            <input
              className={input}
              id="last_name"
              name="last_name"
              defaultValue={fullName.lastName ?? ""}
            />
          </div>
          <button className={button} type="submit">
            Salva
          </button>
        </form>
      </section>

      <section className={`${card} flex flex-col gap-2`}>
        <EditableField
          fieldLabel="Email (dato privato)"
          description="Resta solo tua: nessun altro giocatore la vede. Cambiarla richiede una conferma via email prima di diventare effettiva."
          value={user.email ?? ""}
          action={updateEmailAction}
          name="email"
          inputType="email"
          startOpen={Boolean(emailError)}
        />
        {emailError ? <p className="text-sm text-lose">{emailError}</p> : null}
        {emailChangeRequested ? (
          <p className="text-sm text-accent">
            Controlla la posta (anche quella nuova) per confermare il
            cambio email.
          </p>
        ) : null}
      </section>

      <section className={`${card} flex flex-col gap-2`}>
        <ChangePasswordField
          action={updatePasswordAction}
          error={passwordError}
          saved={savedPassword}
        />
      </section>

      <section className={`${cardTight} flex flex-col gap-2 border-dashed`}>
        <p className="text-sm font-semibold text-foreground">
          Cancella account
        </p>
        {ownedTournaments.length > 0 ? (
          <p className="text-xs text-foreground-faint">
            Organizzi ancora {ownedTournaments.length}{" "}
            {ownedTournaments.length === 1 ? "torneo" : "tornei"} (
            {ownedTournaments.map((t) => t.name).join(", ")}): cancellali o
            portali a termine prima di poter cancellare l&apos;account —
            cancellare l&apos;account cancellerebbe anche quelli, con i
            dati di tutti gli altri giocatori che ci giocano.
          </p>
        ) : (
          <>
            <p className="text-xs text-foreground-faint">
              Rimuove il tuo account e l&apos;accesso a tutti i tornei a cui
              partecipi. Non si può annullare.
            </p>
            <div>
              <DeleteAccountButton />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
