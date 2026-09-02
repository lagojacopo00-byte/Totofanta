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
    // Contenitore di scroll esplicito (invece di lasciar scrollare
    // html/body): un bug noto di Safari iOS fa scorrere la pagina in
    // orizzontale oltre il bordo quando un header `position: sticky`
    // dipende dallo scroll del documento — vedi anche touch-action in
    // globals.css, che da solo non bastava. Con lo scroll contenuto qui
    // dentro invece che sul documento, l'header sticky non tocca più
    // quel percorso di Safari.
    <div className="flex h-dvh flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain">
      {/* Altezza fissa (invece di auto via padding): la barra sticky del
          picker (team-picker.tsx) si aggancia con un top che deve
          combaciare esattamente con questa — un valore calcolato a
          runtime (misurato via JS) soffriva di un bug noto di Safari:
          un elemento sticky già "agganciato" non si riposiziona sempre
          subito quando il suo `top` cambia dopo il primo render, finché
          non arriva un nuovo scroll — lasciava un vuoto (trovato il
          2026-09-02, con screenshot). Un'altezza fissa nota in anticipo
          evita del tutto il problema: nessun valore che cambia dopo il
          render. */}
      <header className="sticky top-0 z-10 flex h-16 items-center border-b border-line bg-background px-7 sm:h-[72px]">
        <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-3">
          <Brandbar subtitle="Area giocatore" href="/play" />
          <div className="flex flex-none items-center gap-2.5">
            <HamburgerMenu />
            <UserMenu email={user.email ?? ""} signOutAction={playerSignOutAction} />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-lg flex-1 overflow-x-hidden px-7 py-6 sm:py-10">
        {children}
      </main>
    </div>
  );
}
