import Link from "next/link";
import { Brandbar } from "@/components/brandbar";
import { buttonGhost } from "@/components/ui";
import { requireUser } from "@/lib/supabase/require-user";
import { signOutAction } from "./actions";

export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  const { user } = await requireUser();

  return (
    // Contenitore di scroll esplicito (invece di lasciar scrollare
    // html/body), stesso pattern di src/app/play/(app)/layout.tsx: un
    // header `position: sticky` che dipende dallo scroll del documento
    // riapre il bug di scroll orizzontale su Safari iOS già risolto lì.
    <div className="flex h-dvh flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain">
      <header className="sticky top-0 z-10 border-b border-line bg-background px-7 py-4">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between">
          <Brandbar subtitle="Dashboard organizzatore" />
          <div className="flex items-center gap-3">
            <Link href="/play" className={`${buttonGhost} font-semibold text-accent`}>
              Modalità giocatore
            </Link>
            <Link href="/dashboard/fixtures" className={`${buttonGhost} hidden sm:inline-flex`}>
              Calendario Serie A
            </Link>
            <span className="hidden text-xs text-foreground-faint sm:inline">
              {user.email}
            </span>
            <form action={signOutAction}>
              <button className={buttonGhost} type="submit">
                Esci
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-7 py-10">
        {children}
      </main>
    </div>
  );
}
