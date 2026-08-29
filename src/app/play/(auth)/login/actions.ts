"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Solo un percorso interno che parte da /play: evita che qualcuno
 * costruisca un link con un "next" verso un altro sito. */
function safeNext(next: FormDataEntryValue | null): string {
  const value = typeof next === "string" ? next : "";
  return value.startsWith("/play") ? value : "/play";
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!email || !password) {
    redirect(
      "/play/login?error=" + encodeURIComponent("Inserisci email e password")
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(
      "/play/login?error=" +
        encodeURIComponent("Email o password non corrette")
    );
  }

  redirect(next);
}
