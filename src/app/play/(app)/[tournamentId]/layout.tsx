import { TournamentFooterNav } from "@/components/tournament-footer-nav";

/** Aggiunge la barra flottante di navigazione (Giornata/Storico/Stats/Tu)
 * a tutte le schermate di un torneo — vedi tournament-footer-nav.tsx.
 * pb-28 lascia spazio in fondo perché il contenuto non finisca sotto la
 * barra, che è `fixed` e quindi fuori dal flusso normale. */
export default async function TournamentLayout({
  children,
  params,
}: LayoutProps<"/play/[tournamentId]">) {
  const { tournamentId } = await params;

  return (
    <div className="pb-28">
      {children}
      <TournamentFooterNav tournamentId={tournamentId} />
    </div>
  );
}
