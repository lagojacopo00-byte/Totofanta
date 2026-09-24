import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import * as queries from "@/lib/queries";

// Sincronizzazione automatica del calendario Serie A (orari + risultati) da
// football-data.org, lanciata dal cron di Vercel (vedi vercel.json). Il
// calendario è condiviso da tutti i tornei e modificabile solo dal
// creator: senza questo giro automatico dipenderebbe dal fatto che il
// creator si ricordi di premere "Sincronizza ora". Usa il client
// service-role perché non c'è nessuna sessione utente. Protetta dal
// segreto CRON_SECRET: Vercel lo invia da solo come "Authorization:
// Bearer <CRON_SECRET>" se la variabile è impostata sul progetto.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const apiKey = process.env.FOOTBALL_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Manca FOOTBALL_API_KEY" },
      { status: 500 }
    );
  }

  try {
    const summary = await queries.syncFixturesFromFootballData(
      createAdminClient(),
      apiKey
    );
    if (summary.unmatched.length > 0) {
      console.warn(
        "[cron sync-fixtures] partite non riconosciute:",
        summary.unmatched
      );
    }
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    console.error("[cron sync-fixtures]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Errore sconosciuto" },
      { status: 500 }
    );
  }
}
