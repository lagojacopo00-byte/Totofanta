export type Theme = "light" | "dark";

export const THEME_COOKIE_NAME = "theme";
// Un anno: stesso ordine di grandezza dei cookie di sessione lunghi, non
// serve rinnovarlo spesso — cambia solo quando l'utente sceglie di nuovo.
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isTheme(value: string | undefined | null): value is Theme {
  return value === "light" || value === "dark";
}

/** Tema di default quando non c'è ancora un cookie (prima visita, o
 * pagine pubbliche mai passate da un login) — "sabbia", vedi
 * docs/08_Direzione_visiva_UX.md. */
export function resolveTheme(value: string | undefined | null): Theme {
  return isTheme(value) ? value : "light";
}
