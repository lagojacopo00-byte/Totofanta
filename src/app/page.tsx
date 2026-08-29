import Link from "next/link";
import { Brandbar } from "@/components/brandbar";
import { button, buttonGhost, eyebrow } from "@/components/ui";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-8 px-6 py-24">
      <Brandbar />
      <div>
        <p className={eyebrow}>Last man standing calcistico tra amici</p>
        <h1 className="mt-3 max-w-lg text-4xl font-extrabold leading-[1.05] tracking-tight font-display text-balance">
          Una squadra a giornata. Se perde sei fuori.
        </h1>
        <p className="mt-4 max-w-md text-foreground-soft">
          Crea un torneo, invita i tuoi amici, e scegliete una squadra ogni
          giornata: chi vince continua, chi perde è eliminato. L&apos;ultimo
          rimasto in gara si porta a casa il premio.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/login" className={button}>
          Accedi come organizzatore
        </Link>
        <Link href="/dashboard/new" className={buttonGhost}>
          Crea un torneo
        </Link>
      </div>
      <p className="text-xs text-foreground-faint">
        Sei stato invitato a giocare?{" "}
        <Link href="/play/signup" className="text-accent underline">
          Crea il tuo account
        </Link>{" "}
        (o{" "}
        <Link href="/play/login" className="text-accent underline">
          accedi
        </Link>{" "}
        se ne hai già uno) con la stessa email a cui sei stato invitato.
      </p>
    </main>
  );
}
