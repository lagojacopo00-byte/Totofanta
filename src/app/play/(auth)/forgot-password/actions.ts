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
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?type=recovery&next=${encodeURIComponent("/play/reset-password")}`,
  });

  redirect("/play/forgot-password?sent=1");
}
