import Link from "next/link";
import { BallMark } from "./ball-mark";

export function Brandbar({
  subtitle,
  href = "/",
}: {
  subtitle?: string;
  href?: string;
}) {
  return (
    <Link href={href} className="flex items-center gap-3">
      <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[#f4f3ee] shadow-[0_6px_20px_-6px_rgba(62,209,126,0.4)]">
        <BallMark className="h-7 w-7" />
      </div>
      <div>
        <span className="font-display text-3xl font-extrabold tracking-tight text-foreground">
          Toto<span className="text-accent">fanta</span>
        </span>
        {subtitle ? (
          <p className="text-xs text-foreground-faint">{subtitle}</p>
        ) : null}
      </div>
    </Link>
  );
}
