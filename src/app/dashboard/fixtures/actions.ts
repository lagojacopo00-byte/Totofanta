"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/require-user";
import * as queries from "@/lib/queries";

/** Converte il valore di un <input type="datetime-local"> (ora locale del
 * browser, senza fuso orario) in un timestamp ISO valido, o null se vuoto
 * o non valido. */
function parseKickoff(raw: FormDataEntryValue | null): string | null {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function addFixtureAction(formData: FormData) {
  const { supabase } = await requireUser();

  const round = Math.max(1, Math.min(38, Number(formData.get("round") ?? 0) || 0));
  const homeTeam = String(formData.get("home_team") ?? "").trim();
  const awayTeam = String(formData.get("away_team") ?? "").trim();
  const kickoffAt = parseKickoff(formData.get("kickoff_at"));

  if (!round || !homeTeam || !awayTeam || homeTeam === awayTeam) {
    return;
  }

  await queries.upsertFixture(supabase, { round, homeTeam, awayTeam, kickoffAt });
  revalidatePath("/dashboard/fixtures");
}

export async function deleteFixtureAction(fixtureId: string) {
  const { supabase } = await requireUser();
  await queries.deleteFixture(supabase, fixtureId);
  revalidatePath("/dashboard/fixtures");
}

/** Imposta (o svuota) la data/ora di calcio d'inizio di una partita già
 * salvata — serve a raggruppare/ordinare le partite per giorno nella
 * schermata di scelta e a capire se rientra nella finestra ven-sab-dom-lun. */
export async function setFixtureKickoffAction(
  fixtureId: string,
  formData: FormData
) {
  const { supabase } = await requireUser();
  const kickoffAt = parseKickoff(formData.get("kickoff_at"));
  await queries.updateFixtureKickoff(supabase, fixtureId, kickoffAt);
  revalidatePath("/dashboard/fixtures");
}

/** Segna/toglie lo stato "esclusa" di una partita: una partita esclusa non
 * conta ai fini del gioco per la sua giornata (vedi
 * docs/02_Regole_gioco.md, "Stato partita valida/esclusa"). */
export async function toggleFixtureStatusAction(
  fixtureId: string,
  currentStatus: "scheduled" | "excluded"
) {
  const { supabase } = await requireUser();
  const next = currentStatus === "excluded" ? "scheduled" : "excluded";
  await queries.setFixtureStatus(supabase, fixtureId, next);
  revalidatePath("/dashboard/fixtures");
}
