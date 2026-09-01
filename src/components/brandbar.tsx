import Link from "next/link";

export function Brandbar({
  subtitle,
  href = "/",
}: {
  subtitle?: string;
  href?: string;
}) {
  return (
    <Link href={href} className="flex items-center gap-3">
      <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent-deep shadow-[0_6px_20px_-6px_rgba(62,209,126,0.4)]">
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="12"
            cy="12"
            r="8.4"
            stroke="var(--accent-ink)"
            strokeWidth="1.8"
          />
          <path
            d="M12 6.4v3.2M12 14.4v3.2M6.4 12h3.2M14.4 12h3.2"
            stroke="var(--accent-ink)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div>
        <span className="font-display text-xl font-extrabold tracking-tight text-foreground">
          Toto<span className="text-accent">fanta</span>
        </span>
        {subtitle ? (
          <p className="text-xs text-foreground-faint">{subtitle}</p>
        ) : null}
      </div>
    </Link>
  );
}
