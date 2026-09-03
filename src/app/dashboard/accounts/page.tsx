import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/require-user";
import * as queries from "@/lib/queries";
import { buttonGhost, cardTight, eyebrow, input } from "@/components/ui";
import { BackLink } from "@/components/back-link";
import { adminUpdateProfileNameAction } from "./actions";

const dateFormat = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short", year: "numeric" });

/** Solo per il creator: tutti gli account della piattaforma, con la
 * possibilità di compilare nome pubblico/nome/cognome per conto di chi
 * non lo farebbe mai da solo — servono soprattutto in classifica (vedi
 * docs/06_Database.md, "Identità pubblica facoltativa"). Non un pannello
 * di amministrazione più ampio: niente eliminazione account, cambio
 * ruolo o altro da qui. */
export default async function AccountsPage() {
  const { supabase, user } = await requireUser();
  const role = await queries.getProfileRole(supabase, user.id);
  if (role !== "creator") notFound();

  const profiles = await queries.getAllProfiles();

  return (
    <div className="flex flex-col gap-6">
      <BackLink href="/dashboard" label="I tuoi tornei" />
      <div>
        <p className={eyebrow}>Solo per te, creator</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold">Account</h1>
        <p className="mt-2 max-w-lg text-sm text-foreground-soft">
          Tutti gli account registrati. Puoi compilare nome pubblico, nome
          e cognome per conto di chi non lo fa da solo — compaiono nella
          classifica di ogni torneo a cui partecipa.
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {profiles.map((p) => (
          <li key={p.id} className={`${cardTight} flex flex-col gap-2`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="truncate text-sm text-foreground-faint">{p.email}</span>
              <span className="flex flex-none items-center gap-2">
                {p.role === "creator" ? (
                  <span className="font-mono text-[10px] uppercase tracking-wide text-accent">
                    creator
                  </span>
                ) : null}
                <span className="font-mono text-[10px] text-foreground-faint">
                  dal {dateFormat.format(new Date(p.createdAt))}
                </span>
              </span>
            </div>
            <form
              action={adminUpdateProfileNameAction.bind(null, p.id)}
              className="flex flex-col gap-2 sm:flex-row"
            >
              <input
                className={input}
                name="display_name"
                placeholder="Nome pubblico"
                defaultValue={p.displayName ?? ""}
              />
              <input
                className={input}
                name="first_name"
                placeholder="Nome"
                defaultValue={p.firstName ?? ""}
              />
              <input
                className={input}
                name="last_name"
                placeholder="Cognome"
                defaultValue={p.lastName ?? ""}
              />
              <button className={`${buttonGhost} flex-none`} type="submit">
                Salva
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
