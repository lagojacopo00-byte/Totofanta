import { redirect } from "next/navigation";

/** Un solo accesso per l'intera app (deciso con l'utente): questa pagina
 * esisteva come "porta separata" per l'organizzatore, distinta da
 * /play/login per il giocatore, anche se la sessione era già la stessa.
 * Resta solo come redirect per non rompere link/segnalibri vecchi. */
export default function LoginRedirectPage() {
  redirect("/play/login");
}
