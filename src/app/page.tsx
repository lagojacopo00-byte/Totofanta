import Link from "next/link";
import { Brandbar } from "@/components/brandbar";
import { button, buttonGhost, eyebrow } from "@/components/ui";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-8 px-7 py-24">
      <Brandbar />
      <div>
        <p className={eyebrow}>Il last man standing di Serie A</p>
        <h1 className="mt-3 max-w-lg text-4xl font-extrabold leading-[1.05] tracking-tight font-display text-balance">
          Scegli la squadra vincente. Se perde, sei fuori. Punto.
        </h1>
        <p className="mt-4 max-w-md text-foreground-soft">
          Crea un torneo, chiama a raccolta gli amici e ogni giornata
          scegliete una squadra: vince, resti in gara. Perde o pareggia,
          sei fuori — senza appello. L&apos;ultimo rimasto in piedi si
          prende tutto.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/play/signup" className={button}>
          Registrati e sopravvivi
        </Link>
        <Link href="/play/login" className={buttonGhost}>
          Accedi
        </Link>
      </div>
      <p className="text-xs text-foreground-faint">
        Un account, tutti i tornei: gioca dove ti invitano o organizza il
        tuo. Sei stato invitato? Usa la stessa email dell&apos;invito e
        sei dentro in automatico.
      </p>
    </main>
  );
}
