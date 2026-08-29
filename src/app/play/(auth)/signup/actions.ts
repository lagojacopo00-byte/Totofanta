"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signUpAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("display_name") ?? "").trim();

  if (!email || !password) {
    redirect(
      "/play/signup?error=" + encodeURIComponent("Email e password sono obbligatorie")
    );
  }
  if (password.length < 8) {
    redirect(
      "/play/signup?error=" +
        encodeURIComponent("La password deve avere almeno 8 caratteri")
    );
  }

  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm?next=/play`,
      data: displayName ? { display_name: displayName } : undefined,
    },
  });

  if (error) {
    redirect("/play/signup?error=" + encodeURIComponent(error.message));
  }

  if (data.session) {
    // Conferma email disattivata nel progetto Supabase: sessione già attiva.
    redirect("/play");
  }

  redirect("/play/signup?sent=1");
}
