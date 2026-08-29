import Link from "next/link";
import { Brandbar } from "@/components/brandbar";
import { button, card, input, label } from "@/components/ui";
import { signUpAction } from "./actions";

export default async function PlayerSignupPage(
  props: PageProps<"/play/signup">
) {
  const params = await props.searchParams;
  const error = typeof params.error === "string" ? params.error : null;
  const sent = params.sent === "1";
  const next = typeof params.next === "string" ? params.next : null;
  const loginHref = next ? `/play/login?next=${encodeURIComponent(next)}` : "/play/login";

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-16">
      <Brandbar subtitle="Crea il tuo account giocatore" />

      {sent ? (
        <div className={card}>
          <p className="text-sm">
            Controlla la tua email per confermare l&apos;account. Dopo la
            conferma potrai accedere ed entrerai automaticamente nei tornei
            per cui sei stato invitato con questa email.
          </p>
        </div>
      ) : (
        <form action={signUpAction} className={`${card} flex flex-col gap-3`}>
          {error ? <p className="text-sm text-lose">{error}</p> : null}
          {next ? <input type="hidden" name="next" value={next} /> : null}

          <label className={label} htmlFor="display_name">
            Come ti chiami
          </label>
          <input
            className={input}
            id="display_name"
            name="display_name"
            required
            placeholder="Il tuo nome"
          />

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
          <p className="text-xs text-foreground-faint">
            Usa la stessa email con cui l&apos;organizzatore ti ha
            invitato: è così che ti riconosciamo nel torneo.
          </p>

          <label className={label} htmlFor="password">
            Password
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
            Crea account
          </button>

          <p className="text-center text-xs text-foreground-faint">
            Hai già un account?{" "}
            <Link href={loginHref} className="text-accent underline">
              Accedi
            </Link>
          </p>
        </form>
      )}
    </main>
  );
}
