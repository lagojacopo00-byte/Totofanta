import Link from "next/link";
import { redirect } from "next/navigation";
import { Brandbar } from "@/components/brandbar";
import { buttonGhost } from "@/components/ui";
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
      <header className="border-b border-line px-4 py-3 sm:px-6 sm:py-4">
        <div className="mx-auto flex w-full max-w-lg flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <Brandbar subtitle="Area giocatore" />
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 sm:gap-3">
            <Link
              href="/play"
              className="text-xs text-foreground-faint underline hover:text-accent"
            >
              I tuoi tornei
            </Link>
            <Link
              href="/play/how-it-works"
              className="text-xs text-foreground-faint underline hover:text-accent"
            >
              Come funziona
            </Link>
            <Link
              href="/play/regolamento"
              className="text-xs text-foreground-faint underline hover:text-accent"
            >
              Regolamento
            </Link>
            <span className="hidden text-xs text-foreground-faint sm:inline">
              {user.email}
            </span>
            <form action={playerSignOutAction}>
              <button className={`${buttonGhost} px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm`} type="submit">
                Esci
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6 sm:px-6 sm:py-10">
        {children}
      </main>
    </div>
  );
}
