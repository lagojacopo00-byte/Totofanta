"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { buttonGhost } from "./ui";

function useClickOutside(onOutside: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handle(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) onOutside();
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onOutside]);
  return ref;
}

const dropdown =
  "absolute z-20 mt-2 min-w-48 rounded-xl border border-line bg-surface p-2 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)]";
const dropdownLink =
  "block rounded-lg px-3 py-2 text-sm text-foreground-soft transition-colors hover:bg-surface-2 hover:text-foreground";

/** Menu ☰: unica voce di navigazione rimasta nell'header (richiesto
 * dall'utente il 2026-09-24 — prima c'era anche l'icona account a
 * parte, ora l'account/uscita sono qui sotto, e il conto alla rovescia
 * per schierare/la freccetta indietro sono spariti perché il logo
 * stesso torna a "I tuoi tornei"). Nessun cerchio attorno all'icona
 * (richiesto lo stesso giorno): solo il tratto dell'hamburger. */
export function HamburgerMenu({
  email,
  signOutAction,
}: {
  email: string;
  signOutAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 flex-none items-center justify-center text-foreground-soft transition-colors hover:text-accent"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M4 6h16M4 12h16M4 18h16"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </button>
      {open ? (
        <div className={`${dropdown} right-0`}>
          <Link href="/play" className={dropdownLink} onClick={() => setOpen(false)}>
            I tuoi tornei
          </Link>
          <Link href="/play/how-it-works" className={dropdownLink} onClick={() => setOpen(false)}>
            Come funziona
          </Link>
          <Link href="/play/regolamento" className={dropdownLink} onClick={() => setOpen(false)}>
            Regolamento
          </Link>
          <div className="my-1 border-t border-line" />
          <Link
            href="/dashboard"
            className={`${dropdownLink} font-semibold text-accent hover:text-accent`}
            onClick={() => setOpen(false)}
          >
            Modalità admin
          </Link>
          <div className="my-1 border-t border-line" />
          <p className="truncate px-3 py-1.5 text-xs text-foreground-faint">{email}</p>
          <Link href="/play/profile" className={dropdownLink} onClick={() => setOpen(false)}>
            Profilo
          </Link>
          <form action={signOutAction}>
            <button className={`${buttonGhost} mt-1 w-full px-3 py-2 text-xs`} type="submit">
              Esci
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
