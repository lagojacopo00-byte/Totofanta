// Badge colorato con le iniziali di una squadra: niente dipendenze
// esterne (stemmi reali), colore stabile per squadra (derivato dal nome),
// leggibile sul tema scuro dell'app. Usato ovunque compaia un nome
// squadra nell'interfaccia.

const PALETTE = [
  "#e0575b",
  "#e08e45",
  "#c9a227",
  "#8bbf3f",
  "#3bb273",
  "#2fb5a6",
  "#3f9fd6",
  "#5c7cea",
  "#8566d9",
  "#c15fc6",
  "#d6577f",
  "#a2673a",
  "#5f8b4c",
  "#4472a8",
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** 2-3 lettere leggibili a colpo d'occhio: per un nome singolo (la
 * maggioranza dei casi, es. "Napoli") le prime 3 lettere; per nomi con
 * più parole (es. squadre personalizzate) le iniziali delle parole. */
export function teamInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return words
      .slice(0, 3)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  }
  return (words[0] ?? "").slice(0, 3).toUpperCase();
}

export function teamColor(name: string): string {
  return PALETTE[hashString(name) % PALETTE.length];
}

const badgeSizeClasses = {
  xs: "h-5 w-5 text-[9px]",
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
} as const;

export function TeamBadge({
  name,
  size = "sm",
}: {
  name: string;
  size?: keyof typeof badgeSizeClasses;
}) {
  return (
    <span
      title={name}
      className={`inline-flex flex-none items-center justify-center rounded-full font-display font-extrabold tracking-tight text-white ${badgeSizeClasses[size]}`}
      style={{ backgroundColor: teamColor(name) }}
    >
      {teamInitials(name)}
    </span>
  );
}

/** Badge + nome per esteso, allineati in riga: la combinazione più usata
 * ovunque nell'app compaia un nome squadra fuori da una &lt;select&gt;. */
export function TeamLabel({
  name,
  hint,
  size = "sm",
}: {
  name: string;
  hint?: string;
  size?: keyof typeof badgeSizeClasses;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <TeamBadge name={name} size={size} />
      <span>
        {name}
        {hint ? <span className="text-foreground-faint"> {hint}</span> : null}
      </span>
    </span>
  );
}
