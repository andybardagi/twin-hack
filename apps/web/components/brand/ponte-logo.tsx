import { cn } from "@workspace/ui/lib/utils";

// Stroke weights per rendered size, from the brand sheet: smaller marks get
// heavier strokes so the arcs don't vanish.
const weights = [
  { minSize: 120, ring: 10, dot: 7, bridge: 11 },
  { minSize: 56, ring: 12, dot: 8, bridge: 13 },
  { minSize: 32, ring: 14, dot: 9, bridge: 15 },
  { minSize: 20, ring: 16, dot: 10, bridge: 17 },
] as const;

/**
 * The Ponte mark: an open ring with a dot at the gap, over a bridge arc.
 * Neutral strokes use `currentColor`; the accent follows `--primary`
 * (violet in light mode, coral in dark).
 */
function PonteMark({ size = 32, className }: { size?: number; className?: string }) {
  const weight = weights.find((w) => size >= w.minSize);

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      aria-hidden="true"
      fill="none"
      strokeLinecap="round"
      className={cn("shrink-0", className)}
    >
      {weight ? (
        <>
          <path d="M84 18.4 A48 48 0 1 1 36 18.4" stroke="currentColor" strokeWidth={weight.ring} />
          <circle cx="60" cy="12" r={weight.dot} fill="var(--primary)" />
          <path d="M32 86 A28 28 0 0 1 60 58" stroke="currentColor" strokeWidth={weight.bridge} />
          <path d="M60 58 A28 28 0 0 1 88 86" stroke="var(--primary)" strokeWidth={weight.bridge} />
          <path d="M24 86 H96" stroke="currentColor" strokeWidth={weight.bridge} />
        </>
      ) : (
        // Below 20px the dot and two-tone arc turn to mush; drop to one colour.
        <>
          <path d="M84 18.4 A48 48 0 1 1 36 18.4" stroke="currentColor" strokeWidth={18} />
          <path d="M32 86 A28 28 0 0 1 88 86" stroke="currentColor" strokeWidth={19} />
        </>
      )}
    </svg>
  );
}

/** Mark + "ponte" wordmark. The wordmark is sized from `size`. */
function PonteLogo({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <span
      role="img"
      aria-label="Ponte"
      className={cn("inline-flex items-center", className)}
      style={{ gap: size * 0.18 }}
    >
      <PonteMark size={size} />
      <span
        aria-hidden="true"
        className="font-heading leading-none font-bold tracking-[-0.045em]"
        style={{ fontSize: size * 0.86, marginTop: size * -0.07 }}
      >
        ponte
      </span>
    </span>
  );
}

export { PonteLogo, PonteMark };
