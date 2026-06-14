import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SiteNav } from "@/components/site/Nav";
import { scanPalmFrame } from "@/lib/reading.functions";

export const Route = createFileRoute("/scan")({
  head: () => ({
    meta: [
      { title: "Scan Your Palm — Free AI Palm Reading | Acharya AI" },
      { name: "description", content: "Upload or capture your palm. The Acharya reads it instantly using the full Hasta Samudrika Shastra. Free and unlimited." },
      { property: "og:title", content: "Scan Your Palm — Free AI Palm Reading | Acharya AI" },
      { property: "og:description", content: "Upload or capture your palm and get an instant AI reading rooted in Hasta Samudrika Shastra." },
      { property: "og:url", content: "https://hasta-aura-reveal.lovable.app/scan" },
    ],
    links: [{ rel: "canonical", href: "https://hasta-aura-reveal.lovable.app/scan" }],
  }),
  component: ScanFlow,
});

type Step = "hand" | "capture" | "analyzing";
type Point = { x: number; y: number };
type LineAnno = { name: string; color: string; points: Point[]; note?: string };
type PalmBox = { x: number; y: number; w: number; h: number };
type Annotations = {
  palmDetected: boolean;
  palmBox: PalmBox;
  imageQuality: "excellent" | "good" | "poor";
  notes?: string;
  observationDigest?: string;
  lines: LineAnno[];
  mounts: Array<{ name: string; x: number; y: number; state: "raised" | "flat" | "marked"; note?: string }>;
  signs: Array<{ name: string; x: number; y: number; meaning?: string }>;
};

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
              try { sessionStorage.setItem("hasta:hand", h); } catch {}
              setStep("capture");
            }}
          />
        )}
        {step === "capture" && hand && (
          <CaptureStep hand={hand} onComplete={() => setStep("analyzing")} />
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

function smoothPath(points: Point[], box: PalmBox) {
  const toImg = (p: Point) => ({ x: box.x + p.x * box.w, y: box.y + p.y * box.h });
  const P = points.map(toImg);
  if (P.length === 0) return "";
  if (P.length === 1) return `M${P[0].x},${P[0].y}`;
  if (P.length === 2) return `M${P[0].x},${P[0].y} L${P[1].x},${P[1].y}`;
  let d = `M${P[0].x.toFixed(5)},${P[0].y.toFixed(5)}`;
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[i - 1] ?? P[i];
    const p1 = P[i];
    const p2 = P[i + 1];
    const p3 = P[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x.toFixed(5)},${c1y.toFixed(5)} ${c2x.toFixed(5)},${c2y.toFixed(5)} ${p2.x.toFixed(5)},${p2.y.toFixed(5)}`;
  }
  return d;
}

function LivePalmOverlay({ annotations, pulse = false }: { annotations: Annotations | null; pulse?: boolean }) {
  if (!annotations?.palmDetected || !annotations.lines.length) return null;
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1 1" preserveAspectRatio="none">
      {annotations.lines.map((line) => {
        const d = smoothPath(line.points, annotations.palmBox);
        if (!d) return null;
        return (
          <g key={line.name}>
            <path
              d={d}
              fill="none"
              stroke={line.color}
              strokeWidth={0.016}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              opacity={0.18}
              className={pulse ? "animate-pulse" : undefined}
            />
            <path
              d={d}
              fill="none"
              stroke={line.color}
              strokeWidth={0.006}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              opacity={0.95}
            />
          </g>
        );
      })}
    </svg>
  );
}

/** Compress an image source to a JPEG data URL ≤ ~900px on the long edge. */
async function compressToDataUrl(src: Blob | string, maxDim = 1280, quality = 0.88): Promise<string> {
  const url = typeof src === "string" ? src : URL.createObjectURL(src);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    if (typeof src !== "string") URL.revokeObjectURL(url);
  }
}

function CaptureStep({ hand, onComplete }: { hand: "left" | "right"; onComplete: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const scanFrame = useServerFn(scanPalmFrame);
  const [mode, setMode] = useState<"camera" | "upload">("camera");
  const [error, setError] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [liveState, setLiveState] = useState<"searching" | "detected" | "rejected">("searching");
  const [liveMsg, setLiveMsg] = useState<string>("Searching for your palm…");
  const [liveAnnotations, setLiveAnnotations] = useState<Annotations | null>(null);
  const consecutiveDetectsRef = useRef(0);
  const scanningRef = useRef(false);
  const completedRef = useRef(false);

  useEffect(() => {
    if (mode !== "camera") return;
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
          setError(null);
        }
      } catch (e: unknown) {
        setStreaming(false);
        setError(e instanceof Error ? e.message : "Camera unavailable");
        setMode("upload");
      }
    };
    start();
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
      setStreaming(false);
    };
  }, [mode]);

  const snapshotDataUrl = (maxDim = 720, quality = 0.7): string | null => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;
    const w = video.videoWidth;
    const h = video.videoHeight;
    const scale = Math.min(1, maxDim / Math.max(w, h));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", quality);
  };

  // Realtime palm detection loop while camera is streaming and nothing captured yet.
  useEffect(() => {
    if (mode !== "camera" || !streaming || preview || busy) return;
    let cancelled = false;
    const loop = async () => {
      while (!cancelled && !completedRef.current) {
        if (scanningRef.current) {
          await new Promise((r) => setTimeout(r, 300));
          continue;
        }
        const frame = snapshotDataUrl(560, 0.6);
        if (!frame) {
          await new Promise((r) => setTimeout(r, 400));
          continue;
        }
        scanningRef.current = true;
        try {
          const v = await scanFrame({ data: { imageDataUrl: frame } });
          if (cancelled || completedRef.current) break;
          if (v.isPalm) {
            consecutiveDetectsRef.current += 1;
            setLiveAnnotations(v.annotations);
            setLiveState("detected");
            setLiveMsg(
              consecutiveDetectsRef.current >= 2
                ? "Palm locked · capturing…"
                : "Palm detected · hold steady…",
            );
            if (consecutiveDetectsRef.current >= 2) {
              completedRef.current = true;
              const full = snapshotDataUrl(1280, 0.88);
              if (full) {
                setPreview(full);
                setBusy(true);
                setStatus("Verifying your palm…");
                await handAndGo(full);
              }
              break;
            }
          } else {
            consecutiveDetectsRef.current = 0;
            setLiveAnnotations(v.annotations.palmDetected ? v.annotations : null);
            setLiveState("rejected");
            setLiveMsg(v.reason || "Not a clear palm — show your open palm in plain background.");
          }
        } catch {
          // ignore transient errors in live loop
        } finally {
          scanningRef.current = false;
        }
        await new Promise((r) => setTimeout(r, 1200));
      }
    };
    loop();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, streaming, preview, busy]);

  const handAndGo = async (dataUrl: string) => {
    setBusy(true);
    setError(null);
    setStatus("Tracing your palm lines…");
    try {
      const v = await scanFrame({ data: { imageDataUrl: dataUrl } });
      setLiveAnnotations(v.annotations);
      if (!v.isPalm) {
        setError(
          `${v.reason} Please show your open ${hand} palm against a plain background, well-lit, with all five fingers visible.`,
        );
        setPreview(null);
        setBusy(false);
        setStatus("");
        completedRef.current = false;
        consecutiveDetectsRef.current = 0;
        return;
      }
      try {
        sessionStorage.setItem("hasta:palmImage", dataUrl);
        sessionStorage.setItem("hasta:annotations", JSON.stringify(v.annotations));
      } catch {
        const smaller = await compressToDataUrl(dataUrl, 640, 0.7);
        sessionStorage.setItem("hasta:palmImage", smaller);
        sessionStorage.setItem("hasta:annotations", JSON.stringify(v.annotations));
      }
      onComplete();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not process the image");
      setBusy(false);
      setStatus("");
    }
  };

  const captureFromCamera = async () => {
    const video = videoRef.current;
    if (!video || !streaming) return;
    setBusy(true);
    const canvas = document.createElement("canvas");
    const w = video.videoWidth;
    const h = video.videoHeight;
    const maxDim = 1280;
    const scale = Math.min(1, maxDim / Math.max(w, h));
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
    setPreview(dataUrl);
    await handAndGo(dataUrl);
  };

  const onFileChosen = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await compressToDataUrl(file);
      setPreview(dataUrl);
      await handAndGo(dataUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read the image");
      setBusy(false);
    }
  };

  return (
    <div className="py-8 space-y-8">
      <div className="text-center space-y-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">Step 2 of 3</span>
        <h1 className="text-3xl md:text-5xl font-serif">
          Scan your <span className="italic text-accent">{hand}</span> palm live
        </h1>
        <p className="text-foreground/60 max-w-xl mx-auto">
          Hold only your open {hand} palm in front of the camera against a plain background. The live scanner will trace the visible rekhas in real time and reject anything that is not a clear palm.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex justify-center">
        <div className="inline-flex p-1 rounded-full border border-border bg-card">
          {(["camera", "upload"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setError(null); setPreview(null); setMode(m); }}
              aria-label={m === "camera" ? "Use live camera to capture palm" : "Upload an existing palm photo"}
              aria-pressed={mode === m}
              className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                mode === m ? "bg-accent text-accent-foreground shadow-gold-sm" : "text-foreground/60 hover:text-foreground"
              }`}
            >
              {m === "camera" ? "Live Camera" : "Upload Photo"}
            </button>
          ))}
        </div>
      </div>

      <div className="relative max-w-2xl mx-auto aspect-[3/4] rounded-3xl overflow-hidden border border-border bg-card shadow-gold-sm">
        {preview ? (
          <>
            <img src={preview} alt="Captured palm" className="absolute inset-0 w-full h-full object-cover" />
            {busy && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm gap-4">
                <div className="size-12 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
                <p className="text-sm font-mono uppercase tracking-widest text-accent">{status || "Verifying…"}</p>
              </div>
            )}
          </>
        ) : mode === "camera" ? (
          error && !streaming ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 gap-4">
              <div className="text-accent text-4xl">⚠</div>
              <h3 className="font-serif text-xl">Camera unavailable</h3>
              <p className="text-foreground/60 text-sm max-w-sm">{error}</p>
              <button
                onClick={() => { setError(null); setMode("upload"); }}
                className="mt-2 bg-accent text-accent-foreground px-6 py-3 rounded-full font-bold text-sm"
              >
                Upload a photo instead
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
              <LivePalmOverlay annotations={liveAnnotations} pulse={liveState === "detected"} />
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/80 to-transparent animate-[scan-line_2.6s_linear_infinite]" />
              </div>
              <div
                className={
                  "absolute bottom-5 left-1/2 -translate-x-1/2 backdrop-blur px-4 py-2 rounded-full text-xs font-mono uppercase tracking-widest flex items-center gap-2 border " +
                  (liveState === "detected"
                    ? "bg-green-500/15 border-green-500/50 text-green-300"
                    : liveState === "rejected"
                    ? "bg-amber-500/15 border-amber-500/50 text-amber-300"
                    : "bg-background/80 border-accent/30 text-accent")
                }
              >
                <span
                  className={
                    "size-1.5 rounded-full animate-pulse " +
                    (liveState === "detected" ? "bg-green-400" : liveState === "rejected" ? "bg-amber-400" : "bg-accent")
                  }
                />
                {streaming ? liveMsg : "Initializing camera…"}
              </div>
            </>
          )
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 gap-4 hover:bg-accent/5 transition-colors"
          >
            <div className="text-accent text-5xl">📷</div>
            <h3 className="font-serif text-2xl">Upload your palm photo</h3>
            <p className="text-foreground/60 text-sm max-w-sm">
              Tap to choose — only the open {hand} palm, plain background, well-lit, center lines visible.
            </p>
            <span className="mt-2 bg-accent text-accent-foreground px-6 py-3 rounded-full font-bold text-sm">
              Choose photo
            </span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => onFileChosen(e.target.files?.[0] ?? null)}
            />
          </button>
        )}
      </div>

      {error && (
        <div className="max-w-xl mx-auto p-4 rounded-2xl border border-destructive/40 bg-destructive/5 text-center text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="text-center">
        {mode === "camera" ? (
          <button
            onClick={captureFromCamera}
            disabled={!streaming || busy}
            className="bg-accent text-accent-foreground px-10 py-4 rounded-full font-bold text-lg hover:scale-105 transition-all shadow-gold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {busy ? status || "Verifying…" : "Capture photo"}
          </button>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="bg-accent text-accent-foreground px-10 py-4 rounded-full font-bold text-lg hover:scale-105 transition-all shadow-gold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {busy ? status || "Verifying…" : "Choose photo"}
          </button>
        )}
      </div>
    </div>
  );
}

function Analyzing() {
  const navigate = useNavigate();
  useEffect(() => {
    const t = setTimeout(() => navigate({ to: "/reading" }), 900);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="py-20 flex flex-col items-center justify-center gap-8">
      <div className="relative size-32">
        <div className="absolute inset-0 rounded-full border-2 border-accent/20" />
        <div className="absolute inset-0 rounded-full border-2 border-t-accent border-r-accent/60 border-b-transparent border-l-transparent animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-4xl">🪔</div>
      </div>
      <div className="text-center space-y-3">
        <h1 className="text-2xl md:text-4xl font-serif">
          The Acharya is reading your <span className="italic text-accent">palm</span>
        </h1>
        <p className="text-foreground/50 text-xs uppercase tracking-widest font-mono animate-pulse">
          Consulting the Hasta Samudrika Shastra
        </p>
      </div>
    </div>
  );
}
