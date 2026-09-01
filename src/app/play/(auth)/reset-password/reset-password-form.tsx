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
 * codificata nel FRAMMENTO dell'URL (#access_token=...&refresh_token=...),
 * leggibile solo lato browser, mai da un Server Component.
 *
 * Non ci si affida al rilevamento automatico di supabase-js
 * (`detectSessionInUrl`): il client di `@supabase/ssr` (`createClient`
 * in src/lib/supabase/client.ts) è pensato per il flusso PKCE con un
 * `?code=` in query string, non per questo frammento — verificato non
 * intercettarlo. Si legge quindi l'hash a mano e si chiama
 * `setSession()` esplicitamente, indipendente da quel comportamento.
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [status, setStatus] = useState<Status>("checking");
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function establishSession() {
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      // DEBUG temporaneo, da togliere.
      console.log("[reset-password] hash raw:", window.location.hash.slice(0, 40));
      console.log("[reset-password] accessToken present:", !!accessToken, "refreshToken present:", !!refreshToken);

      if (!accessToken || !refreshToken) {
        if (!cancelled) setStatus("invalid");
        return;
      }

      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      console.log("[reset-password] setSession result:", { error: error?.message, hasSession: !!data.session });
      if (cancelled) return;

      if (error || !data.session) {
        setStatus("invalid");
        return;
      }
      // Ripulisce il frammento dall'URL (contiene i token in chiaro):
      // non serve più una volta stabilita la sessione.
      window.history.replaceState(null, "", window.location.pathname);
      setEmail(data.session.user.email ?? null);
      setStatus("ready");
    }

    establishSession();
    return () => {
      cancelled = true;
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
