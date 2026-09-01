import Link from "next/link";
import { Brandbar } from "@/components/brandbar";
import { button, buttonGhost, card, cardTight, eyebrow } from "@/components/ui";

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
  const loginHref = `/play/login?next=${encodeURIComponent(joinPath)}`;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-7 py-16">
      <Brandbar subtitle="Invito al torneo" />

      <div>
        <p className={eyebrow}>Sei stato invitato</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold leading-tight">
          Qualcuno ti aspetta in un torneo di Totofanta
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-foreground-soft">
          Ogni giornata scegli una squadra di Serie A. Vince davvero? Resti
          in corsa. Pareggia o perde? Sei fuori. Chi resiste più a lungo
          vince il torneo.
        </p>
      </div>

      <section className={`${cardTight}`}>
        <p className={eyebrow}>Prossimo passo</p>
        <p className="mt-1.5 text-sm text-foreground-soft">
          Crea un account con la <strong className="text-foreground">stessa email</strong>{" "}
          a cui è arrivato l&apos;invito: ti agganciamo subito al torneo,
          pronto per scegliere la tua prima squadra.
        </p>
      </section>

      <div className={`${card} flex flex-col gap-3`}>
        <Link href={signupHref} className={button}>
          Crea il tuo account
        </Link>
        <Link href={loginHref} className={buttonGhost}>
          Ho già un account
        </Link>
      </div>
    </main>
  );
}
