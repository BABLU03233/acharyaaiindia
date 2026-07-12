const ITEMS = [
  "LIVE: DETECTING FATE LINE (+82.4% CLARITY) — MUMBAI, IN",
  "LIVE: MARUKHA MOUNT ANALYSIS COMPLETE — DUBAI, UAE",
  "LIVE: KARMIC CALCULATION IN PROGRESS — LONDON, UK",
  "LIVE: SURYA REKHA UNLOCKED — BANGALORE, IN",
  "LIVE: MARRIAGE LINE READ — TORONTO, CA",
];

export function LiveTicker() {
  const doubled = [...ITEMS, ...ITEMS];
  return (
    <div className="w-full bg-accent/5 border-y border-border py-2 overflow-hidden">
      <div className="flex gap-12 whitespace-nowrap animate-[marquee_40s_linear_infinite] w-max hover:[animation-play-state:paused]">
        {doubled.map((t, i) => (
          <span
            key={i}
            className="font-mono text-[10px] uppercase tracking-widest text-accent/60 flex items-center gap-2"
          >
            <span className="size-1.5 bg-green-500 rounded-full" /> {t}
          </span>
        ))}
      </div>
    </div>
  );
}
