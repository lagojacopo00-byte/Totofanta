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
      {/* Un solo elemento sticky, non due coordinati a mano: la barra
          "Slot ancora disponibili" del picker (team-picker.tsx) non è
          più un secondo `position: sticky` separato che deve indovinare
          un `top` combaciante con l'altezza di questo header — tentativo
          già fallito più volte (l'ultimo: altezza fissa + top fisso,
          ancora vulnerabile a scarti su Safari iOS durante lo scroll,
          vedi screenshot del 2026-09-02). Qui c'è solo un contenitore
          vuoto (#picker-sticky-bar-slot) dentro QUESTO stesso header
          sticky: team-picker.tsx ci fa un portale (React createPortal)
          quando è montato. Così la barra è fisicamente una riga in più
          dello stesso blocco sticky — non può scollarsi dall'header per
          costruzione, non c'è nessun valore da far combaciare. Vuoto su
          tutte le altre pagine di /play (nessun impatto visivo lì). */}
      <header className="sticky top-0 z-10 flex flex-col border-b border-line bg-background">
        <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-3 px-7 py-3 sm:py-4">
          <Brandbar subtitle="Area giocatore" href="/play" />
          <div className="flex flex-none items-center gap-2.5">
            <HamburgerMenu />
            <UserMenu email={user.email ?? ""} signOutAction={playerSignOutAction} />
          </div>
        </div>
        <div id="picker-sticky-bar-slot" />
      </header>
      {/* NIENTE overflow-x-hidden qui: su un asse impostato a
          "hidden" e l'altro lasciato implicito, la spec CSS forza
          quello implicito da "visible" ad "auto" — main diventerebbe
          un secondo contenitore di scroll indipendente dal div sopra,
          e la barra sticky di team-picker.tsx (dentro main) si
          aggancerebbe al bordo di main invece che all'header (fuori
          da main), lasciando sempre uno scarto. Il fix per lo scroll
          orizzontale di Safari basta già a livello del div esterno. */}
      <main className="mx-auto w-full max-w-lg flex-1 px-7 py-6 sm:py-10">
        {children}
      </main>
    </div>
  );
}
