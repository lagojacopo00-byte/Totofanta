"use server";

import { redirect } from "next/navigation";
import { requirePlayer } from "@/lib/supabase/require-player";
import * as queries from "@/lib/queries";

/** Solo percorsi interni all'area giocatore: evita redirect verso URL
 * esterni costruiti a partire dal parametro `next` in query string. */
function safeNext(next: string) {
  if (next.startsWith("/play") && !next.startsWith("//")) return next;
  return "/play";
}

export async function markTutorialSeenAction(formData: FormData) {
  const { supabase, user } = await requirePlayer();
  await queries.markTutorialSeen(supabase, user.id);
  redirect(safeNext(String(formData.get("next") ?? "/play")));
}
