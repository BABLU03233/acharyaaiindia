import palmImg from "@/assets/palm-hologram.jpg";
import { cn } from "@/lib/utils";

export function PalmHologram({ className = "" }: { className?: string }) {
  return (
    <div className={cn("relative aspect-square overflow-hidden rounded-2xl bg-black", className)}>
      <img
        src={palmImg}
        alt="Glowing divine palm hologram tracing the heart, head, life and fate lines"
        width={1024}
        height={1024}
        className="absolute inset-0 w-full h-full object-cover object-center"
      />

      {/* Subtle warm tint — keeps the palm clearly visible instead of washing it out */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/15 via-transparent to-transparent pointer-events-none" />

      {/* Scan sweep */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="animate-[scan-line_4s_ease-in-out_infinite] bg-gradient-to-b from-transparent via-accent/50 to-transparent h-1/3 w-full"
          style={{ boxShadow: "0 0 40px 12px rgba(217, 156, 60, 0.35)" }}
        />
      </div>

      {/* Golden border glow */}
      <div className="absolute inset-0 rounded-2xl border border-accent/30 pointer-events-none" />
    </div>
  );
}
