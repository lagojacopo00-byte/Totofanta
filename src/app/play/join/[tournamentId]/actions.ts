"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import * as queries from "@/lib/queries";

export async function joinTournamentAction(
  tournamentId: string,
  formData: FormData
) {
  const displayName = String(formData.get("display_name") ?? "").trim();
  if (!displayName) {
    redirect(
      `/play/join/${tournamentId}?error=` +
        encodeURIComponent("Inserisci il tuo nome")
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) {
    redirect(
      `/play/login?next=${encodeURIComponent(`/play/join/${tournamentId}`)}`
    );
  }

  const preview = await queries.getTournamentInvitePreview(supabase, tournamentId);
  if (!preview) {
    redirect(
      `/play/join/${tournamentId}?error=` +
        encodeURIComponent("Questo invito non è più valido")
    );
  }

  await queries.selfJoinTournament(supabase, tournamentId, {
    userId: user.id,
    displayName,
    email: user.email,
    numSlots: preview.default_num_slots,
  });

  redirect(`/play/${tournamentId}`);
}
