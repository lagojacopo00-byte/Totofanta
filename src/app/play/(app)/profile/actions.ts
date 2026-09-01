"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requirePlayer } from "@/lib/supabase/require-player";
import { updateProfileDisplayName } from "@/lib/queries";

export async function updateDisplayNameAction(formData: FormData) {
  const { supabase, user } = await requirePlayer();
  const displayName = String(formData.get("display_name") ?? "").trim();
  if (!displayName) return;

  await updateProfileDisplayName(supabase, user.id, displayName);
  revalidatePath("/play", "layout");
}

/** Cambia la password da loggati: a differenza del recupero via email,
 * qui non serve la vecchia password — essere già autenticati con una
 * sessione valida basta (stesso criterio che usa Supabase Auth). */
export async function updatePasswordAction(formData: FormData) {
  const { supabase } = await requirePlayer();
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) {
    redirect(
      "/play/profile?error=" +
        encodeURIComponent("La password deve avere almeno 8 caratteri")
    );
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect("/play/profile?error=" + encodeURIComponent(error.message));
  }
  redirect("/play/profile?saved=1");
}
