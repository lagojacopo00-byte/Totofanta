import { Brandbar } from "@/components/brandbar";
import { button, card, input, label } from "@/components/ui";
import { signInWithEmail } from "./actions";

export default async function LoginPage(props: PageProps<"/login">) {
  const params = await props.searchParams;
  const error = typeof params.error === "string" ? params.error : null;
  const sent = params.sent === "1";

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-16">
      <Brandbar subtitle="Accesso organizzatore" />

      {sent ? (
        <div className={card}>
          <p className="text-sm">
            Ti abbiamo mandato un link di accesso via email. Aprilo dallo
            stesso dispositivo per entrare nella tua dashboard.
          </p>
        </div>
      ) : (
        <form action={signInWithEmail} className={`${card} flex flex-col gap-3`}>
          <p className="text-sm text-foreground-soft">
            Niente password: ti mandiamo un link via email per accedere.
          </p>
          {error ? <p className="text-sm text-lose">{error}</p> : null}
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
          <button className={button} type="submit">
            Invia link di accesso
          </button>
        </form>
      )}
    </main>
  );
}
