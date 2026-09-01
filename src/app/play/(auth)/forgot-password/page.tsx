import Link from "next/link";
import { Brandbar } from "@/components/brandbar";
import { button, card, input, label } from "@/components/ui";
import { requestPasswordResetAction } from "./actions";

export default async function ForgotPasswordPage(
  props: PageProps<"/play/forgot-password">
) {
  const params = await props.searchParams;
  const error = typeof params.error === "string" ? params.error : null;
  const sent = params.sent === "1";

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-7 py-16">
      <Brandbar subtitle="Password dimenticata" />

      {sent ? (
        <div className={card}>
          <p className="text-sm text-foreground-soft">
            Se quell&apos;email corrisponde a un account, ti abbiamo mandato
            un link per scegliere una nuova password. Controlla anche lo
            spam.
          </p>
          <Link
            href="/play/login"
            className="mt-3 inline-block text-sm text-accent underline"
          >
            Torna al login
          </Link>
        </div>
      ) : (
        <form action={requestPasswordResetAction} className={`${card} flex flex-col gap-3`}>
          {error ? <p className="text-sm text-lose">{error}</p> : null}
          <p className="text-sm text-foreground-soft">
            Inserisci l&apos;email del tuo account: ti mandiamo un link per
            scegliere una nuova password.
          </p>

          <label className={label} htmlFor="email">
            Email
          </label>
          <input
            className={input}
            id="email"
            name="email"
            type="email"
            required
            placeholder="tu@esempio.it"
          />

          <button className={`${button} mt-2`} type="submit">
            Mandami il link
          </button>

          <p className="text-center text-xs text-foreground-faint">
            <Link href="/play/login" className="text-accent underline">
              Torna al login
            </Link>
          </p>
        </form>
      )}
    </main>
  );
}
