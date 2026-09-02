"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Freccia "torna indietro" nell'header, a sinistra del logo: consolida
 * lì la stessa azione che prima era ripetuta come link di testo in cima
 * a ogni pagina secondaria (torneo, regolamento, profilo) — tutte
 * puntavano comunque alla stessa destinazione ("/play"). Nascosta sulla
 * pagina radice, dove non c'è nulla da cui tornare indietro. */
export function HeaderBackLink() {
  const pathname = usePathname();
  if (pathname === "/play") return null;

  return (
    <Link
      href="/play"
      aria-label="Torna a I tuoi tornei"
      className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-foreground-faint transition-colors hover:text-accent"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M15 5 8 12l7 7"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}
