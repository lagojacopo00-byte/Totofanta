import Link from "next/link";
import { Brandbar } from "@/components/brandbar";
import { button, card, input, label } from "@/components/ui";
import { loginAction } from "./actions";

export default async function PlayerLoginPage(props: PageProps<"/play/login">) {
  const params = await props.searchParams;
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-16">
      <Brandbar subtitle="Accesso giocatore" />

      <form action={loginAction} className={`${card} flex flex-col gap-3`}>
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

        <label className={label} htmlFor="password">
          Password
        </label>
        <input
          className={input}
          id="password"
          name="password"
          type="password"
          required
          placeholder="La tua password"
        />

        <button className={`${button} mt-2`} type="submit">
          Accedi
        </button>

        <p className="text-center text-xs text-foreground-faint">
          Prima volta qui?{" "}
          <Link href="/play/signup" className="text-accent underline">
            Crea un account
          </Link>
        </p>
      </form>
    </main>
  );
}
