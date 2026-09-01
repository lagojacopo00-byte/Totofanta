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

/** Menu ☰: le pagine di contorno (tutorial, regolamento) che non servono
 * a colpo d'occhio ogni volta, tolte dall'header per lasciargli spazio. */
export function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-line text-foreground-soft transition-colors hover:border-accent hover:text-accent"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M4 6h16M4 12h16M4 18h16"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </button>
      {open ? (
        <div className={dropdown}>
          <Link href="/play" className={dropdownLink} onClick={() => setOpen(false)}>
            I tuoi tornei
          </Link>
          <Link href="/play/how-it-works" className={dropdownLink} onClick={() => setOpen(false)}>
            Come funziona
          </Link>
          <Link href="/play/regolamento" className={dropdownLink} onClick={() => setOpen(false)}>
            Regolamento
          </Link>
        </div>
      ) : null}
    </div>
  );
}

/** Icona utente in alto a destra: email dell'account e uscita, tolte
 * dall'header diretto per lasciare spazio al contenuto della pagina. */
export function UserMenu({
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
        aria-label="Account"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-line text-foreground-soft transition-colors hover:border-accent hover:text-accent"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="8.5" r="3.2" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M4.8 19.2c1.3-3.2 4-4.9 7.2-4.9s5.9 1.7 7.2 4.9"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </button>
      {open ? (
        <div className={`${dropdown} right-0`}>
          <p className="truncate px-3 py-1.5 text-xs text-foreground-faint">{email}</p>
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
