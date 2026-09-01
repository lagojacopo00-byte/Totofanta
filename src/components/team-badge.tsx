// Badge colorato con le iniziali di una squadra: niente dipendenze
// esterne (stemmi reali, niente questioni di licenza — solo un colore di
// sfondo), leggibile sul tema scuro dell'app. Usato ovunque compaia un
// nome squadra nell'interfaccia.

// Colori ufficiali (maglia/identità visiva, i due colori sociali) delle
// squadre di Serie A 2026/2027 — deciso con l'utente: solo colori di
// sfondo, non stemmi/loghi reali. Cercati online (fonti: brand/colori
// squadra, non un'unica lista ufficiale che copra tutti i club — dove il
// club non pubblica un hex preciso per un colore, si usa
// l'approssimazione standard di quel colore nominale, es. "giallo",
// "granata"). Le squadre non in elenco (competizioni diverse, squadre
// custom di un torneo) restano sul colore derivato dal nome (hash) qui
// sotto. Juventus e Udinese sono entrambe storicamente bianconere: non è
// un errore, è così anche nella realtà — restano identiche di proposito.
const OFFICIAL_TEAM_COLORS: Record<string, [string, string]> = {
  Atalanta: ["#0D68B1", "#1E1E1E"], // nerazzurro
  Bologna: ["#9F1F33", "#1B2838"], // rossoblù
  Cagliari: ["#AD002A", "#002350"], // rossoblù
  Como: ["#10416A", "#FFFFFF"], // azzurro
  Fiorentina: ["#61358B", "#FFFFFF"], // viola
  Frosinone: ["#FFD100", "#004393"], // gialloazzurro
  Genoa: ["#AD1919", "#05232F"], // rossoblù
  Inter: ["#00239C", "#000000"], // nerazzurro
  Juventus: ["#000000", "#FFFFFF"], // bianconero
  Lazio: ["#74D1EA", "#FFFFFF"], // biancoceleste
  Lecce: ["#F7D117", "#C8102E"], // giallorosso
  Milan: ["#E4002B", "#101820"], // rossonero
  Monza: ["#DA291C", "#FFFFFF"], // rossobianco
  Napoli: ["#00ABE7", "#FFFFFF"], // azzurro
  Parma: ["#F5C400", "#002F6C"], // gialloblù (crociati)
  Roma: ["#8E1F2F", "#FBB900"], // giallorosso
  Sassuolo: ["#1EA451", "#000000"], // neroverde
  Torino: ["#8A1E03", "#FFFFFF"], // granata
  Udinese: ["#000000", "#FFFFFF"], // bianconero
  Venezia: ["#F76900", "#1B7340"], // arancioneroverde
};

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

/** I due colori sociali di una squadra, per il badge diviso in diagonale.
 * Le squadre senza colore ufficiale (custom, altre competizioni) ne
 * derivano due dal nome (hash), così restano comunque stabili nel tempo. */
export function teamColors(name: string): [string, string] {
  if (OFFICIAL_TEAM_COLORS[name]) return OFFICIAL_TEAM_COLORS[name];
  const hash = hashString(name);
  const first = hash % PALETTE.length;
  const second = (hash + 5) % PALETTE.length;
  return [PALETTE[first], PALETTE[second === first ? (second + 1) % PALETTE.length : second]];
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
  const [primary, secondary] = teamColors(name);
  return (
    <span
      title={name}
      className={`inline-flex flex-none items-center justify-center rounded-full font-display font-extrabold tracking-tight text-white ${badgeSizeClasses[size]}`}
      style={{
        background: `linear-gradient(135deg, ${primary} 50%, ${secondary} 50%)`,
        // Ombra scura sempre, per restare leggibile sopra ENTRAMBE le
        // metà: alcune squadre hanno una metà chiara (bianco, giallo).
        textShadow: "0 0 3px rgba(0,0,0,0.85), 0 0 1px rgba(0,0,0,0.85)",
      }}
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
