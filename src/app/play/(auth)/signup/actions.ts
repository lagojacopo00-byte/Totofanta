"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Solo un percorso interno che parte da /play: evita che qualcuno
 * costruisca un link con un "next" verso un altro sito. */
function safeNext(next: FormDataEntryValue | null): string {
  const value = typeof next === "string" ? next : "";
  return value.startsWith("/play") ? value : "/play";
}

export async function signUpAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("display_name") ?? "").trim();
  const next = safeNext(formData.get("next"));

  if (!email || !password) {
    redirect(
      "/play/signup?error=" + encodeURIComponent("Servono email e password")
    );
  }
  if (password.length < 8) {
    redirect(
      "/play/signup?error=" +
        encodeURIComponent("La password ci vuole più lunga: almeno 8 caratteri.")
    );
  }

  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(next)}`,
      data: displayName ? { display_name: displayName } : undefined,
    },
  });

  if (error) {
    redirect("/play/signup?error=" + encodeURIComponent(error.message));
  }

  if (data.session) {
    // Conferma email disattivata nel progetto Supabase: sessione già attiva.
    redirect(next);
  }

  redirect("/play/signup?sent=1");
}
