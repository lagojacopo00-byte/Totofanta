"use client";

import { useEffect, useState } from "react";

export interface ScrollDotSection {
  id: string;
  label: string;
}

/** Indicatore laterale a puntini: un puntino per capitolo, quello del
 * capitolo attualmente a schermo si evidenzia. Usa IntersectionObserver
 * con una fascia sottile a metà altezza invece che "in viewport sì/no",
 * così il puntino attivo cambia quando il capitolo passa il centro dello
 * schermo, non appena ne sfiora un bordo. */
export function ScrollDots({ sections }: { sections: ScrollDotSection[] }) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );

    const elements = sections
      .map((section) => document.getElementById(section.id))
      .filter((el): el is HTMLElement => el !== null);
    for (const el of elements) observer.observe(el);

    return () => observer.disconnect();
  }, [sections]);

  if (sections.length < 2) return null;

  return (
    <nav
      aria-label="Indice dei capitoli"
      className="fixed right-1.5 top-1/2 z-20 flex -translate-y-1/2 flex-col items-end gap-3 sm:right-3"
    >
      {sections.map((section) => {
        const isActive = section.id === activeId;
        return (
          <a
            key={section.id}
            href={`#${section.id}`}
            title={section.label}
            aria-label={section.label}
            aria-current={isActive ? "location" : undefined}
            className="group flex items-center py-1"
          >
            <span
              className={`block rounded-full transition-all ${
                isActive
                  ? "h-2.5 w-2.5 bg-accent"
                  : "h-1.5 w-1.5 bg-foreground-faint/60 group-hover:bg-foreground-soft"
              }`}
            />
          </a>
        );
      })}
    </nav>
  );
}
