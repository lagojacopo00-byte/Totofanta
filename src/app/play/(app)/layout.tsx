import { Brandbar } from "@/components/brandbar";
import { buttonGhost } from "@/components/ui";
import { requirePlayer } from "@/lib/supabase/require-player";
import { playerSignOutAction } from "../actions";

export default async function PlayAreaLayout({
  children,
}: LayoutProps<"/play">) {
  const { user } = await requirePlayer();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-line px-6 py-4">
        <div className="mx-auto flex w-full max-w-lg items-center justify-between">
          <Brandbar subtitle="Area giocatore" />
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-foreground-faint sm:inline">
              {user.email}
            </span>
            <form action={playerSignOutAction}>
              <button className={buttonGhost} type="submit">
                Esci
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-lg flex-1 px-6 py-10">
        {children}
      </main>
    </div>
  );
}
