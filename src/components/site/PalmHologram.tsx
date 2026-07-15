import palmSrc from "@/assets/palms/palm-open-1200.png";
import palmAltSrc from "@/assets/palms/palm-open-alt-1200.png";
import { cn } from "@/lib/utils";

/**
 * The hero palm — a real hand photograph with the background removed and
 * animated shastra lines traced over it. Designed to feel more like the
 * actual scanning experience than any hologram/illustration ever could.
 *
 * Every element is decorative — no palm-line coordinate is derived from the
 * photo itself, so it looks convincing without misleading the user about
 * their own reading (that happens on /scan → /reading).
 */
export function PalmHologram({
  className = "",
  variant = "primary",
}: {
  className?: string;
  variant?: "primary" | "alt";
}) {
  const src = variant === "alt" ? palmAltSrc : palmSrc;
  return (
    <div className={cn("relative w-full h-full flex items-center justify-center", className)}>
      {/* Radial glow behind the palm */}
      <div className="absolute inset-6 rounded-full bg-gradient-radial from-accent/30 via-accent/10 to-transparent blur-3xl pointer-events-none" />

      {/* The real palm — transparent PNG */}
      <img
        src={src}
        alt="Open palm with the classical Hasta Samudrika Shastra rekhas visible"
        className="relative z-10 max-h-full max-w-full h-full w-auto object-contain drop-shadow-[0_10px_30px_rgba(217,156,60,0.25)] select-none"
        draggable={false}
      />

      {/* Animated line tracer overlay — sits on top of the palm */}
      <svg
        viewBox="0 0 100 130"
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 z-20 w-full h-full pointer-events-none"
        aria-hidden
      >
        <defs>
          <linearGradient id="hero-line-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f5c26b" stopOpacity="0" />
            <stop offset="50%" stopColor="#f5c26b" stopOpacity="1" />
            <stop offset="100%" stopColor="#d99c3c" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="hero-line-rose" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f472b6" stopOpacity="0" />
            <stop offset="50%" stopColor="#f472b6" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#c084fc" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Life line sweep */}
        <path
          d="M 35 55 Q 32 70 40 90 Q 44 100 40 110"
          fill="none"
          stroke="url(#hero-line-gold)"
          strokeWidth="0.55"
          strokeLinecap="round"
          className="palm-line palm-line-1"
        />
        {/* Head line */}
        <path
          d="M 35 60 Q 48 62 60 63 Q 68 63 72 60"
          fill="none"
          stroke="url(#hero-line-gold)"
          strokeWidth="0.5"
          strokeLinecap="round"
          className="palm-line palm-line-2"
        />
        {/* Heart line */}
        <path
          d="M 32 48 Q 46 50 62 50 Q 74 48 78 44"
          fill="none"
          stroke="url(#hero-line-rose)"
          strokeWidth="0.5"
          strokeLinecap="round"
          className="palm-line palm-line-3"
        />
        {/* Fate/Destiny line */}
        <path
          d="M 55 110 Q 54 90 55 70 Q 55 55 55 40"
          fill="none"
          stroke="url(#hero-line-gold)"
          strokeWidth="0.45"
          strokeLinecap="round"
          className="palm-line palm-line-4"
        />

        {/* Little accent dots on the mounts */}
        {[
          [50, 22, 0.6],
          [40, 22, 0.5],
          [60, 22, 0.55],
          [68, 30, 0.45],
        ].map(([cx, cy, r], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="#f5c26b"
            className="palm-dot"
            style={{ animationDelay: `${i * 220 + 800}ms` }}
          />
        ))}
      </svg>

      {/* Scan sweep */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-30 rounded-3xl">
        <div className="palm-scan-sweep absolute w-full h-16 bg-gradient-to-b from-transparent via-accent/25 to-transparent" />
      </div>

      {/* Corner ornaments */}
      <svg
        className="absolute inset-0 z-30 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <g fill="none" stroke="hsla(37,75%,55%,0.5)" strokeWidth="0.3" strokeLinecap="round">
          <path d="M2 12 V2 H12" />
          <path d="M88 2 H98 V12" />
          <path d="M98 88 V98 H88" />
          <path d="M12 98 H2 V88" />
        </g>
      </svg>
    </div>
  );
}
