"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/require-user";
import * as queries from "@/lib/queries";

export async function addFixtureAction(formData: FormData) {
  const { supabase } = await requireUser();

  const round = Math.max(1, Math.min(38, Number(formData.get("round") ?? 0) || 0));
  const homeTeam = String(formData.get("home_team") ?? "").trim();
  const awayTeam = String(formData.get("away_team") ?? "").trim();

  if (!round || !homeTeam || !awayTeam || homeTeam === awayTeam) {
    return;
  }

  await queries.upsertFixture(supabase, { round, homeTeam, awayTeam });
  revalidatePath("/dashboard/fixtures");
}

export async function deleteFixtureAction(fixtureId: string) {
  const { supabase } = await requireUser();
  await queries.deleteFixture(supabase, fixtureId);
  revalidatePath("/dashboard/fixtures");
}
