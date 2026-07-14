import palmImg from "@/assets/palm-hologram.jpg";
import { cn } from "@/lib/utils";

export function PalmHologram({ className = "" }: { className?: string }) {
  return (
    <div className={cn("relative aspect-square overflow-hidden rounded-2xl", className)}>
      <img
        src={palmImg}
        alt="Glowing divine palm hologram tracing the heart, head, life and fate lines"
        width={1024}
        height={1024}
        className="absolute inset-0 w-full h-full object-cover object-center"
      />

      {/* Color wash — ties the photo's tone into the site's purple palette instead of clashing as a raw dark stock image */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/50 via-accent/15 to-transparent mix-blend-color pointer-events-none" />

      {/* Enhanced scan sweep with glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="animate-[scan-line_4s_ease-in-out_infinite] bg-gradient-to-b from-transparent via-accent/40 to-transparent h-1/3 w-full shadow-lg"
          style={{
            boxShadow: "0 0 30px 10px rgba(193, 121, 26, 0.4)",
          }}
        />

        {/* Top glow effect */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-accent/20 to-transparent animate-pulse" />
      </div>

      {/* Soft aura gradient */}
      <div className="absolute inset-0 bg-aura pointer-events-none" />

      {/* Border glow effect */}
      <div className="absolute inset-0 rounded-2xl border-2 border-accent/20 pointer-events-none" />

      {/* Outer glow ring */}
      <div className="absolute -inset-1 bg-gradient-divine opacity-0 rounded-2xl blur-xl pointer-events-none" />
    </div>
  );
}
