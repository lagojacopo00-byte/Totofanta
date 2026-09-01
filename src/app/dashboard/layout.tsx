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
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-line px-7 py-4">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between">
          <Brandbar subtitle="Dashboard organizzatore" />
          <div className="flex items-center gap-3">
            <Link href="/dashboard/fixtures" className={buttonGhost}>
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
