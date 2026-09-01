"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    redirect(
      "/play/forgot-password?error=" + encodeURIComponent("Inserisci la tua email")
    );
  }

  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  // Non segnaliamo mai se l'email esiste o no (evita di far scoprire a
  // chiunque quali email sono registrate): si mostra sempre lo stesso
  // messaggio di conferma, sia che l'invio riesca sia che l'email non
  // corrisponda a nessun account.
  //
  // redirectTo punta diretto alla pagina (non a /auth/confirm): sul
  // piano gratuito Supabase, senza un tuo SMTP configurato, non si può
  // personalizzare il corpo dell'email per usare il formato
  // token_hash/type che /auth/confirm si aspetta — resta il template di
  // default, che manda la sessione come frammento nell'URL (#access_
  // token=...), leggibile solo lato browser. Vedi reset-password-form.tsx.
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/play/reset-password`,
  });

  redirect("/play/forgot-password?sent=1");
}
