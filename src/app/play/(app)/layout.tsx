import { redirect } from "next/navigation";
import { Brandbar } from "@/components/brandbar";
import { HamburgerMenu, UserMenu } from "@/components/player-header-menus";
import { requirePlayer } from "@/lib/supabase/require-player";
import * as queries from "@/lib/queries";
import { playerSignOutAction } from "../actions";

export default async function PlayAreaLayout({
  children,
}: LayoutProps<"/play">) {
  const { supabase, user } = await requirePlayer();

  // Prima volta in assoluto che questo account entra nell'area giocatore
  // (per esempio arrivando direttamente su un link salvato, senza passare
  // dalla pagina di invito): mostra il tutorial prima di tutto il resto.
  if (!(await queries.hasSeenTutorial(supabase, user.id))) {
    redirect("/play/how-it-works");
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-line px-5 py-3 sm:px-6 sm:py-4">
        <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <HamburgerMenu />
            <Brandbar subtitle="Area giocatore" />
          </div>
          <UserMenu email={user.email ?? ""} signOutAction={playerSignOutAction} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-lg flex-1 overflow-x-hidden px-5 py-6 sm:px-6 sm:py-10">
        {children}
      </main>
    </div>
  );
}
