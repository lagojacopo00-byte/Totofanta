"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updatePasswordAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) {
    redirect(
      "/play/reset-password?error=" +
        encodeURIComponent("La password deve avere almeno 8 caratteri")
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(
      "/play/login?error=" +
        encodeURIComponent("Link scaduto o già usato: richiedine uno nuovo")
    );
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect("/play/reset-password?error=" + encodeURIComponent(error.message));
  }

  redirect("/play");
}
