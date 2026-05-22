import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SiteNav } from "@/components/site/Nav";

export const Route = createFileRoute("/scan")({
  head: () => ({
    meta: [
      { title: "Palm Scan — Hasta AI" },
      { name: "description", content: "Begin your cinematic AI palm scan and reveal your destiny." },
    ],
  }),
  component: ScanFlow,
});

type Step = "hand" | "scan" | "analyzing";

function ScanFlow() {
  const [step, setStep] = useState<Step>("hand");
  const [hand, setHand] = useState<"left" | "right" | null>(null);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">
        {step === "hand" && (
          <HandPicker
            onSelect={(h) => {
              setHand(h);
              setStep("scan");
            }}
          />
        )}
        {step === "scan" && hand && (
          <CameraScan hand={hand} onComplete={() => setStep("analyzing")} />
        )}
        {step === "analyzing" && <Analyzing />}
      </main>
    </div>
  );
}

function HandPicker({ onSelect }: { onSelect: (h: "left" | "right") => void }) {
  return (
    <div className="py-12 space-y-12">
      <div className="text-center space-y-4">
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">Step 1 of 3</span>
        <h1 className="text-4xl md:text-6xl font-serif">Choose your dominant hand</h1>
        <p className="text-foreground/60 max-w-lg mx-auto">
          Your dominant hand reveals the destiny you are actively creating. Your non-dominant hand reveals what you were born with.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {(["left", "right"] as const).map((h) => (
          <button
            key={h}
            onClick={() => onSelect(h)}
            className="group p-12 rounded-3xl border border-border bg-card hover:border-accent hover:bg-accent/5 hover:shadow-gold transition-all text-left"
          >
            <div className="text-5xl mb-6">{h === "left" ? "🤚" : "✋"}</div>
            <div className="font-serif text-3xl italic mb-2 group-hover:text-accent transition-colors capitalize">
              {h} Hand
            </div>
            <p className="text-sm text-foreground/60">
              {h === "left" ? "Reveals inherited karma and innate gifts." : "Reveals the destiny you are forging now."}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

function CameraScan({ hand, onComplete }: { hand: "left" | "right"; onComplete: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 } },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setStreaming(true);
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Camera access denied";
        setError(message);
      }
    };
    start();
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="py-8 space-y-8">
      <div className="text-center space-y-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">Step 2 of 3</span>
        <h1 className="text-3xl md:text-5xl font-serif">
          Hold your <span className="italic text-accent">{hand}</span> palm steady
        </h1>
        <p className="text-foreground/60">Align your palm inside the glowing outline. Keep fingers slightly spread.</p>
      </div>

      <div className="relative max-w-2xl mx-auto aspect-[3/4] rounded-3xl overflow-hidden border border-border bg-card shadow-gold-sm">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 gap-4">
            <div className="text-accent text-4xl">⚠</div>
            <h3 className="font-serif text-xl">Camera unavailable</h3>
            <p className="text-foreground/60 text-sm max-w-sm">{error}. You can still continue with a demo reading.</p>
            <button onClick={onComplete} className="mt-2 bg-accent text-accent-foreground px-6 py-3 rounded-full font-bold text-sm">
              Continue with demo
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
            />
            {/* Hand guide overlay */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 300 400"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d="M150 380 C 90 380 70 320 70 260 L 70 180 C 70 170 80 165 85 175 L 100 230 L 100 100 C 100 90 115 90 115 100 L 115 200 L 130 80 C 130 70 145 70 145 80 L 145 200 L 160 90 C 160 80 175 80 175 90 L 175 210 L 195 130 C 195 120 210 122 210 132 L 210 240 C 230 240 235 270 230 300 C 225 340 200 380 150 380 Z"
                className="text-accent/60"
              />
            </svg>
            {/* Scan line */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="animate-[scan-line_2.5s_linear_infinite] h-1/4 w-full bg-gradient-to-b from-transparent via-accent/40 to-transparent" />
            </div>
            {/* HUD corners */}
            <div className="absolute top-4 left-4 size-10 border-t-2 border-l-2 border-accent" />
            <div className="absolute top-4 right-4 size-10 border-t-2 border-r-2 border-accent" />
            <div className="absolute bottom-4 left-4 size-10 border-b-2 border-l-2 border-accent" />
            <div className="absolute bottom-4 right-4 size-10 border-b-2 border-r-2 border-accent" />
            {/* Status pill */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur px-4 py-2 rounded-full border border-accent/30 text-xs font-mono text-accent uppercase tracking-widest flex items-center gap-2">
              <span className="size-1.5 bg-green-500 rounded-full animate-pulse" />
              {streaming ? "Detecting Rekhas…" : "Initializing camera…"}
            </div>
          </>
        )}
      </div>

      {!error && (
        <div className="text-center">
          <button
            onClick={onComplete}
            disabled={!streaming}
            className="bg-accent text-accent-foreground px-10 py-4 rounded-full font-bold text-lg hover:scale-105 transition-all shadow-gold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Capture Palm
          </button>
        </div>
      )}
    </div>
  );
}

const LINES = ["Heart Line", "Head Line", "Life Line", "Fate Line", "Sun Line", "Marriage Line"];

function Analyzing() {
  const navigate = useNavigate();
  const [detected, setDetected] = useState<string[]>([]);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    LINES.forEach((l, i) => {
      timers.push(setTimeout(() => setDetected((d) => [...d, l]), 400 + i * 500));
    });
    const finish = setTimeout(() => navigate({ to: "/reading" }), 400 + LINES.length * 500 + 1200);
    timers.push(finish);
    return () => timers.forEach(clearTimeout);
  }, [navigate]);

  return (
    <div className="py-12 space-y-12">
      <div className="text-center space-y-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">Step 3 of 3</span>
        <h1 className="text-3xl md:text-5xl font-serif">
          The sage is reading your <span className="italic text-accent">palm</span>
        </h1>
        <p className="text-foreground/60">Tracing rekhas, analyzing mounts, consulting the Hasta Samudrika…</p>
      </div>

      <div className="max-w-md mx-auto p-8 rounded-3xl border border-border bg-card shadow-gold-sm space-y-4">
        {LINES.map((l) => {
          const ok = detected.includes(l);
          return (
            <div key={l} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <span className={`font-serif text-lg italic ${ok ? "text-accent" : "text-foreground/40"}`}>{l}</span>
              <span className={`text-xs font-mono uppercase tracking-widest ${ok ? "text-accent" : "text-foreground/30"}`}>
                {ok ? "✓ traced" : "..."}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-center text-foreground/40 text-xs uppercase tracking-widest font-mono animate-pulse">
        Synthesizing destiny narrative
      </p>
    </div>
  );
}
