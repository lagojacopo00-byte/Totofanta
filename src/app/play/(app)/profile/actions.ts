"use server";

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
