import Link from "next/link";
import { Brandbar } from "@/components/brandbar";
import { button, card, input, label } from "@/components/ui";
import { loginAction } from "./actions";

export default async function PlayerLoginPage(props: PageProps<"/play/login">) {
  const params = await props.searchParams;
  const error = typeof params.error === "string" ? params.error : null;
  const next = typeof params.next === "string" ? params.next : null;
  const signupHref = next ? `/play/signup?next=${encodeURIComponent(next)}` : "/play/signup";

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-7 py-16">
      <Brandbar subtitle="Accedi" />

      <form action={loginAction} className={`${card} flex flex-col gap-3`}>
        {error ? <p className="text-sm text-lose">{error}</p> : null}
        {next ? <input type="hidden" name="next" value={next} /> : null}

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

        <div className="flex items-center justify-between">
          <label className={label} htmlFor="password">
            Password
          </label>
          <Link href="/play/forgot-password" className="text-xs text-accent underline">
            Password dimenticata?
          </Link>
        </div>
        <input
          className={input}
          id="password"
          name="password"
          type="password"
          required
          placeholder="La tua password"
        />

        <button className={`${button} mt-2`} type="submit">
          Entra
        </button>

        <p className="text-center text-xs text-foreground-faint">
          Prima volta su Totofanta?{" "}
          <Link href={signupHref} className="text-accent underline">
            Registrati
          </Link>
        </p>
      </form>
    </main>
  );
}
