"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { button, card, input, label } from "@/components/ui";

type Status = "checking" | "ready" | "invalid" | "saved";

/**
 * Componente client di proposito: il link nell'email (template di
 * default di Supabase, l'unico disponibile senza un tuo SMTP — vedi
 * forgot-password/actions.ts) porta qui con la sessione di recupero
 * codificata nel FRAMMENTO dell'URL (#access_token=...), leggibile solo
 * lato browser, mai da un Server Component. Il client Supabase la
 * rileva da solo al primo render (detectSessionInUrl); da lì in poi
 * basta chiamare updateUser direttamente dal browser, niente server
 * action per questa pagina.
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [status, setStatus] = useState<Status>("checking");
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session) {
        setEmail(data.session.user.email ?? null);
        setStatus("ready");
      } else {
        setStatus((s) => (s === "checking" ? "invalid" : s));
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        setEmail(session.user.email ?? null);
        setStatus("ready");
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    if (password.length < 8) {
      setError("La password deve avere almeno 8 caratteri");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      return;
    }
    setStatus("saved");
    router.push("/play");
    router.refresh();
  }

  if (status === "checking") {
    return (
      <div className={card}>
        <p className="text-sm text-foreground-soft">Verifica del link…</p>
      </div>
    );
  }

  if (status === "invalid") {
    return (
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
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`${card} flex flex-col gap-3`}>
      {error ? <p className="text-sm text-lose">{error}</p> : null}
      <p className="text-sm text-foreground-soft">
        Scegli la nuova password{email ? ` per ${email}` : ""}.
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
  );
}
