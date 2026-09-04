import Link from "next/link";
import { Brandbar } from "@/components/brandbar";
import { button, card } from "@/components/ui";

/**
 * Prima schermata per chi arriva da un link di invito e non ha ancora un
 * account (o non ha una sessione attiva): dà un minimo di contesto su cosa
 * sia Totofanta prima di chiedere di registrarsi, invece di rimbalzare
 * subito su un modulo di login anonimo. Si affianca al tutorial "Come
 * funziona" già esistente (che resta invariato, e si vede comunque subito
 * dopo la registrazione) — non lo sostituisce, è solo un passo in più
 * prima, pensato per chi non ha ancora nessun account.
 */
export function InviteWelcome({ tournamentId }: { tournamentId: string }) {
  const joinPath = `/play/join/${tournamentId}`;
  const signupHref = `/play/signup?next=${encodeURIComponent(joinPath)}`;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-6 px-7 py-16 text-center">
      <Brandbar subtitle="Ti hanno sfidato" />

      <div>
        <h1 className="font-display text-4xl font-extrabold leading-tight">
          Un torneo ti aspetta. Tu ci stai o no?
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-foreground-soft">
          Ogni giornata scegli una squadra di Serie A. Vince? Resti in
          gara. Pareggia o perde? Fuori, senza sconti. Chi sopravvive più
          a lungo si porta a casa tutto.
        </p>
      </div>

      <div className={`${card} w-full`}>
        <Link href={signupHref} className={`${button} w-full`}>
          Accetta la sfida
        </Link>
      </div>
    </main>
  );
}
