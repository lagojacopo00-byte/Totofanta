import Link from "next/link";
import { Brandbar } from "@/components/brandbar";
import { button, card, input, label } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { updatePasswordAction } from "./actions";

export default async function ResetPasswordPage(
  props: PageProps<"/play/reset-password">
) {
  const params = await props.searchParams;
  const error = typeof params.error === "string" ? params.error : null;

  // Si arriva qui solo dal link mandato via email (vedi
  // forgot-password/actions.ts + /auth/confirm): quel link autentica già
  // l'utente con una sessione temporanea "di recupero", niente password
  // vecchia da chiedere di nuovo.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-7 py-16">
        <Brandbar subtitle="Nuova password" />
        <div className={card}>
          <p className="text-sm text-foreground-soft">
            Questo link non è valido o è scaduto.
          </p>
          <Link
            href="/play/forgot-password"
            className="mt-3 inline-block text-sm text-accent underline"
          >
            Richiedine uno nuovo
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-7 py-16">
      <Brandbar subtitle="Nuova password" />

      <form action={updatePasswordAction} className={`${card} flex flex-col gap-3`}>
        {error ? <p className="text-sm text-lose">{error}</p> : null}
        <p className="text-sm text-foreground-soft">
          Scegli la nuova password per {user.email}.
        </p>

        <label className={label} htmlFor="password">
          Nuova password
        </label>
        <input
          className={input}
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          placeholder="Almeno 8 caratteri"
        />

        <button className={`${button} mt-2`} type="submit">
          Salva la nuova password
        </button>
      </form>
    </main>
  );
}
