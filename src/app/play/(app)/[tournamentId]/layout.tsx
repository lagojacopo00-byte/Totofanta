import { TournamentFooterNav } from "@/components/tournament-footer-nav";

/** Aggiunge la barra flottante di navigazione (Giornata/Storico/Stats/Tu)
 * a tutte le schermate di un torneo — vedi tournament-footer-nav.tsx.
 * pb-36 lascia spazio in fondo perché il contenuto non finisca sotto la
 * barra (56px + padding + margine dal bordo + eventuale safe-area), che
 * è `fixed` e quindi fuori dal flusso normale — l'ultima cosa in pagina
 * (es. il link Excel in fondo allo Storico) deve restare raggiungibile
 * scorrendo, non nascosta sotto la barra. */
export default async function TournamentLayout({
  children,
  params,
}: LayoutProps<"/play/[tournamentId]">) {
  const { tournamentId } = await params;

  return (
    <div className="pb-36">
      {children}
      <TournamentFooterNav tournamentId={tournamentId} />
    </div>
  );
}
