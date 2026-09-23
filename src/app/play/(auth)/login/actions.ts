"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getProfileTheme } from "@/lib/queries";
import { THEME_COOKIE_NAME, THEME_COOKIE_MAX_AGE } from "@/lib/theme";

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
      "/play/login?error=" + encodeURIComponent("Servono email e password")
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(
      "/play/login?error=" +
        encodeURIComponent("Email o password sbagliate. Riprova.")
    );
  }

  // Allinea il cookie tema al valore salvato sull'account: senza,
  // accedendo da un browser/dispositivo nuovo si vedrebbe il tema di
  // default (chiaro) finché non si passa di nuovo da /play/profile.
  if (data.user) {
    const theme = await getProfileTheme(supabase, data.user.id);
    (await cookies()).set(THEME_COOKIE_NAME, theme, {
      path: "/",
      maxAge: THEME_COOKIE_MAX_AGE,
      sameSite: "lax",
    });
  }

  redirect(next);
}
