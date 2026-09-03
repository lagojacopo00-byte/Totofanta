"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requirePlayer } from "@/lib/supabase/require-player";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getOrganizerTournaments,
  updateProfileDisplayName,
  updateProfileFullName,
} from "@/lib/queries";

export async function updateDisplayNameAction(formData: FormData) {
  const { supabase, user } = await requirePlayer();
  const displayName = String(formData.get("display_name") ?? "").trim();
  if (!displayName) return;

  await updateProfileDisplayName(supabase, user.id, displayName);
  revalidatePath("/play", "layout");
  // Redirect (invece di un semplice return) anche qui, come le altre due
  // azioni sotto: senza, la sezione "Modifica" in page.tsx non saprebbe
  // quando richiudersi dopo un salvataggio riuscito — un redirect è una
  // navigazione vera, che rimonta il componente da zero.
  redirect("/play/profile?savedName=1");
}

/** Nome e cognome, distinti dal nome pubblico: niente collassa/rivela
 * come le altre sezioni sopra, un form sempre aperto e diretto — vedi
 * updateProfileFullName in queries.ts. Entrambi facoltativi: si può
 * salvare anche vuoti (per svuotarli di nuovo). */
export async function updateFullNameAction(formData: FormData) {
  const { supabase, user } = await requirePlayer();
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();

  await updateProfileFullName(supabase, user.id, firstName, lastName);
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
      "/play/profile?passwordError=" +
        encodeURIComponent("La password deve avere almeno 8 caratteri")
    );
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect("/play/profile?passwordError=" + encodeURIComponent(error.message));
  }
  redirect("/play/profile?savedPassword=1");
}

/** Cambia l'email dell'account. Non è immediato: Supabase manda un'email
 * di conferma al nuovo indirizzo (e di norma anche una notifica al
 * vecchio) prima che il cambio sia effettivo. redirectTo punta diretto
 * qui (non a /auth/confirm): sul piano gratuito, senza un tuo SMTP, non
 * si può personalizzare il template per il formato token_hash/type che
 * quella rotta si aspetta — vedi la stessa nota in
 * forgot-password/actions.ts. Le righe già in `players` con questa email
 * restano collegate come prima (il collegamento vero è `user_id`, non
 * l'email salvata lì, che resta solo lo storico di quale email è stata
 * usata per l'invito). */
export async function updateEmailAction(formData: FormData) {
  const { supabase } = await requirePlayer();
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return;

  const origin = (await headers()).get("origin");
  const { error } = await supabase.auth.updateUser(
    { email },
    { emailRedirectTo: `${origin}/play/profile` }
  );
  if (error) {
    redirect("/play/profile?emailError=" + encodeURIComponent(error.message));
  }
  redirect("/play/profile?emailChangeRequested=1");
}

/** Cancella per sempre l'account — irreversibile. Bloccata se possiede
 * ancora dei tornei (vedi la UI in page.tsx): cancellare l'account
 * cancellerebbe a cascata anche quelli, con tutti i dati degli ALTRI
 * giocatori che ci sono dentro (tournaments.owner_id ha on delete
 * cascade), non solo i propri. Le righe in `players` di tornei altrui a
 * cui questo account partecipa restano invece intatte, solo scollegate
 * (players.user_id ha on delete set null): tornano "in attesa di
 * registrazione" come un invito mai accettato, senza perdere lo storico
 * di slot/pick per gli altri giocatori dello stesso torneo. Usa il
 * client service-role solo per l'operazione di cancellazione vera e
 * propria — l'identità e il controllo "nessun torneo posseduto" sono
 * già verificati sopra con la sessione normale dell'utente. */
export async function deleteAccountAction() {
  const { supabase, user } = await requirePlayer();

  const owned = await getOrganizerTournaments(supabase, user.id);
  if (owned.length > 0) {
    throw new Error(
      "Possiedi ancora dei tornei: cancellali (o portali a termine) prima di eliminare l'account."
    );
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    throw new Error(error.message);
  }

  try {
    await supabase.auth.signOut();
  } catch {
    // L'account non esiste più: normale che la sessione non si possa
    // chiudere "correttamente" lato Supabase, i cookie li puliamo comunque.
  }
  redirect("/");
}
