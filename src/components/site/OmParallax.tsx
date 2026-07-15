import { useEffect, useRef } from "react";

/**
 * A large, faint ॐ glyph that drifts at a different rate than the page as the
 * seeker scrolls — a recurring "divine" motif. Must be placed inside a
 * `relative overflow-hidden` ancestor so it stays clipped to its section.
 */
export function OmParallax({
  className = "",
  speed = 0.15,
  sizeClassName = "text-[320px] sm:text-[420px]",
}: {
  className?: string;
  speed?: number;
  sizeClassName?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const tick = () => {
      const rect = el.parentElement?.getBoundingClientRect();
      if (rect) {
        el.style.transform = `translate3d(0, ${(rect.top * speed).toFixed(2)}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [speed]);

  return (
    <span
      ref={ref}
      aria-hidden
      className={`pointer-events-none select-none font-serif leading-none text-accent/[0.06] ${sizeClassName} ${className}`}
    >
      ॐ
    </span>
  );
}
