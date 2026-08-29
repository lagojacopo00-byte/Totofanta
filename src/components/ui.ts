// Piccole classi Tailwind riusabili, in linea con la direzione visiva
// "Totofanta UI": card scure arrotondate, pulsanti a pillola verdi,
// tipografia Sora per i titoli e i dati in monospace.

export const card =
  "rounded-2xl border border-line bg-surface p-6 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.6)]";

export const cardTight =
  "rounded-xl border border-line bg-surface-2 p-4";

export const button =
  "inline-flex items-center justify-center gap-2 rounded-full bg-accent px-4 py-2 font-display text-sm font-bold text-accent-ink transition-colors hover:bg-accent-deep disabled:cursor-not-allowed disabled:opacity-50";

export const buttonGhost =
  "inline-flex items-center justify-center gap-2 rounded-full border border-line px-4 py-2 font-display text-sm font-bold text-foreground transition-colors hover:border-accent hover:text-accent";

export const input =
  "w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-foreground-faint focus:outline-none focus:ring-2 focus:ring-accent";

export const label =
  "font-display text-xs font-bold uppercase tracking-wide text-foreground-soft";

export const eyebrow =
  "font-mono text-[11px] uppercase tracking-[0.14em] text-foreground-faint";

export const pillAlive =
  "inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-win-bg px-2.5 py-1 font-mono text-xs text-accent";

export const pillOut =
  "inline-flex items-center gap-1.5 rounded-full border border-lose/30 bg-lose-bg px-2.5 py-1 font-mono text-xs text-lose";
