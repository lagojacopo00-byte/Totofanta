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
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-7 pt-16 pb-24">
      <Brandbar subtitle="Crea il tuo account" center />

      {sent ? (
        <div className={card}>
          <p className="text-sm">
            Controlla la posta e conferma l&apos;account. Fatto questo,
            accedi e sei già dentro ai tornei per cui ti hanno invitato
            con questa email.
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
            Sei stato invitato? Usa la stessa email dell&apos;invito: ti
            sgancia dritto nel torneo, senza passaggi in più.
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
            Voglio giocare
          </button>

          <p className="text-center text-xs text-foreground-faint">
            Hai già un account?{" "}
            <Link href={loginHref} className="text-accent underline">
              Entra
            </Link>
          </p>
        </form>
      )}
    </main>
  );
}
