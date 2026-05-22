import palmImg from "@/assets/palm-hologram.jpg";

export function PalmHologram({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <img
        src={palmImg}
        alt="Glowing golden palm hologram tracing the heart, head, life and fate lines"
        width={1024}
        height={1024}
        className="w-full h-full object-cover object-center"
      />
      {/* scan sweep */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="animate-[scan-line_3s_linear_infinite] bg-gradient-to-b from-transparent via-accent/30 to-transparent h-1/4 w-full" />
      </div>
      {/* aura */}
      <div className="absolute inset-0 bg-aura pointer-events-none" />
    </div>
  );
}
