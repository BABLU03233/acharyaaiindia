import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Camera, Hand, Upload, RefreshCw, Check } from "lucide-react";
import { SiteNav } from "@/components/site/Nav";
import { scanPalmFrame } from "@/lib/reading.functions";

export const Route = createFileRoute("/scan")({
  head: () => ({
    meta: [
      { title: "Scan Your Palm — Acharya AI" },
      {
        name: "description",
        content: "Scan your palm in three quick steps and get an instant AI reading.",
      },
    ],
  }),
  component: ScanFlow,
});

type Step = "hand" | "capture" | "focus" | "analyzing";
const STEPS: Step[] = ["hand", "capture", "focus", "analyzing"];
const STEP_LABEL: Record<Step, string> = {
  hand: "Hand",
  capture: "Scan",
  focus: "Focus",
  analyzing: "Reading",
};

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

function Stepper({ current }: { current: Step }) {
  const idx = STEPS.indexOf(current);
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((s, i) => {
        const done = i < idx;
        const active = i === idx;
        return (
          <div key={s} className="flex items-center gap-2">
            <div
              className={
                "flex items-center justify-center size-8 rounded-full text-xs font-bold transition-colors " +
                (active
                  ? "bg-accent text-accent-foreground shadow-gold-sm"
                  : done
                  ? "bg-accent/20 text-accent"
                  : "bg-card border border-border text-foreground/40")
              }
            >
              {done ? <Check className="size-4" /> : i + 1}
            </div>
            <span
              className={
                "hidden sm:inline text-xs uppercase tracking-widest font-semibold " +
                (active ? "text-accent" : "text-foreground/40")
              }
            >
              {STEP_LABEL[s]}
            </span>
            {i < STEPS.length - 1 && <div className="w-6 h-px bg-border" />}
          </div>
        );
      })}
    </div>
  );
}

function ScanFlow() {
  const [step, setStep] = useState<Step>("hand");
  const [hand, setHand] = useState<"left" | "right" | null>(null);

  const handleSelect = (selected: "left" | "right") => {
    setHand(selected);
    try {
      sessionStorage.setItem("hasta:hand", selected);
    } catch {
      /* ignore */
    }
    setStep("capture");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="flex-1 max-w-3xl mx-auto w-full px-5 py-8 md:py-12">
        <Stepper current={step} />

        {step === "hand" && <HandPicker onSelect={handleSelect} />}
        {step === "capture" && hand && (
          <CaptureStep
            hand={hand}
            onComplete={() => setStep("focus")}
            onChangeHand={() => {
              setHand(null);
              setStep("hand");
            }}
          />
        )}
        {step === "focus" && (
          <FocusStep
            onComplete={(focus) => {
              try {
                sessionStorage.setItem("hasta:focus", focus);
              } catch {
                /* ignore */
              }
              setStep("analyzing");
            }}
          />
        )}
        {step === "analyzing" && <Analyzing />}
      </main>
    </div>
  );
}

function HandPicker({ onSelect }: { onSelect: (h: "left" | "right") => void }) {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-serif">Which hand?</h1>
        <p className="text-foreground/60 text-sm">Pick the one you write with for your active destiny.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {(["left", "right"] as const).map((h) => (
          <button
            key={h}
            onClick={() => onSelect(h)}
            className="group flex flex-col items-center gap-3 rounded-3xl border-2 border-border bg-card p-6 md:p-8 transition-all hover:border-accent hover:shadow-divine hover:scale-[1.02]"
          >
            <div className="inline-flex size-16 md:size-20 items-center justify-center rounded-full bg-gradient-divine shadow-divine-sm">
              <Hand
                className={"size-8 md:size-10 text-white" + (h === "left" ? " -scale-x-100" : "")}
                strokeWidth={1.75}
              />
            </div>
            <div className="font-serif text-xl md:text-2xl capitalize text-foreground">{h}</div>
            <span className="text-[10px] uppercase tracking-widest text-foreground/50 font-semibold">
              {h === "right" ? "Destiny" : "Karma"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

const FOCUS_OPTIONS = [
  { key: "career", label: "Career", icon: "💼", question: "What does my career look like?" },
  { key: "money", label: "Money", icon: "💰", question: "What does my financial future look like?" },
  { key: "marriage", label: "Love", icon: "💞", question: "What does my love life look like?" },
  { key: "family", label: "Family", icon: "🏡", question: "What does my family life look like?" },
  { key: "growth", label: "Growth", icon: "🌱", question: "What is my hidden talent and path of growth?" },
  { key: "health", label: "Health", icon: "🌿", question: "What does my health and vitality look like?" },
] as const;

function FocusStep({ onComplete }: { onComplete: (focus: string) => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [customText, setCustomText] = useState("");
  const showCustom = selected === "other";

  const choose = (key: string, question: string) => {
    setSelected(key);
    if (key !== "other") onComplete(question);
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-serif">What's on your mind?</h1>
        <p className="text-foreground/60 text-sm">Pick one — the reading will focus here.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {FOCUS_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => choose(opt.key, opt.question)}
            className={
              "flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all " +
              (selected === opt.key
                ? "border-accent bg-accent/10 shadow-divine"
                : "border-border bg-card hover:border-accent/50")
            }
          >
            <span className="text-3xl" aria-hidden>
              {opt.icon}
            </span>
            <span className="font-serif text-sm text-foreground">{opt.label}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setSelected("other")}
          className={
            "flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all " +
            (selected === "other"
              ? "border-accent bg-accent/10 shadow-divine"
              : "border-border bg-card hover:border-accent/50")
          }
        >
          <span className="text-3xl" aria-hidden>
            ✍️
          </span>
          <span className="font-serif text-sm text-foreground">Other</span>
        </button>
      </div>

      {showCustom && (
        <div className="space-y-3">
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            rows={3}
            placeholder="Ask the Acharya…"
            className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-accent resize-none"
          />
          <button
            type="button"
            disabled={!customText.trim()}
            onClick={() => onComplete(customText.trim())}
            className="w-full bg-accent text-accent-foreground py-3 rounded-full font-bold text-sm shadow-gold disabled:opacity-40"
          >
            Continue
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => onComplete("")}
        className="mx-auto block text-xs text-foreground/50 hover:text-accent underline underline-offset-4"
      >
        Skip — general reading
      </button>
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

/** Corner brackets — clean framing, no palm silhouette */
function FrameBrackets({ tone = "accent" }: { tone?: "accent" | "success" | "danger" }) {
  const color =
    tone === "success"
      ? "hsl(142, 70%, 45%)"
      : tone === "danger"
      ? "hsl(0, 75%, 55%)"
      : "hsla(37, 75%, 55%, 0.85)";
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <g fill="none" stroke={color} strokeWidth="0.8" strokeLinecap="round">
        <path d="M6 18 V6 H18" />
        <path d="M82 6 H94 V18" />
        <path d="M94 82 V94 H82" />
        <path d="M18 94 H6 V82" />
      </g>
    </svg>
  );
}

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

function CaptureStep({
  hand,
  onComplete,
  onChangeHand,
}: {
  hand: "left" | "right";
  onComplete: () => void;
  onChangeHand: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const scanFrame = useServerFn(scanPalmFrame);
  const [mode, setMode] = useState<"camera" | "upload">("camera");
  const [error, setError] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    if (mode !== "camera") return;
    let stream: MediaStream | null = null;
    const video = videoRef.current;
    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 } },
          audio: false,
        });
        if (video) {
          video.srcObject = stream;
          await video.play();
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
      if (video) {
        video.pause();
        video.srcObject = null;
      }
      stream?.getTracks().forEach((t) => t.stop());
      setStreaming(false);
    };
  }, [mode]);

  const handAndGo = async (dataUrl: string) => {
    setBusy(true);
    setError(null);
    setStatus("Verifying palm…");
    try {
      const v = await scanFrame({ data: { imageDataUrl: dataUrl } });
      if (!v.isPalm) {
        setError(
          "🖐️ Only a human palm can be scanned. " +
            (v.reason ? v.reason + " " : "") +
            "Please hold up your open palm and try again.",
        );
        setPreview(null);
        setBusy(false);
        setStatus("");
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
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError("Image is too large (max 50MB).");
      return;
    }
    setBusy(true);
    setStatus("Loading…");
    try {
      const dataUrl = await compressToDataUrl(file, 1280, 0.88);
      setPreview(dataUrl);
      await handAndGo(dataUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read the image.");
      setBusy(false);
      setStatus("");
    }
  };

  const triggerFileInput = () => {
    if (fileRef.current) {
      fileRef.current.value = "";
      fileRef.current.click();
    }
  };

  const retake = () => {
    setPreview(null);
    setError(null);
    setBusy(false);
    setStatus("");
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-3xl md:text-4xl font-serif">
          Scan your <span className="italic text-accent capitalize">{hand}</span> palm
        </h1>
        <button
          type="button"
          onClick={onChangeHand}
          className="text-[10px] uppercase tracking-widest text-foreground/50 hover:text-accent font-semibold"
        >
          Change hand
        </button>
      </div>

      {/* Mode toggle — big, obvious */}
      <div className="flex justify-center">
        <div className="inline-flex p-1 rounded-full border border-border bg-card">
          {(["camera", "upload"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setError(null);
                setPreview(null);
                setMode(m);
              }}
              className={
                "flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all " +
                (mode === m
                  ? "bg-accent text-accent-foreground shadow-gold-sm"
                  : "text-foreground/60 hover:text-foreground")
              }
            >
              {m === "camera" ? <Camera className="size-4" /> : <Upload className="size-4" />}
              {m === "camera" ? "Camera" : "Upload"}
            </button>
          ))}
        </div>
      </div>

      {/* THE capture area — big, centered, unmistakable */}
      <div className="relative mx-auto aspect-[3/4] max-w-md rounded-3xl overflow-hidden border-2 border-accent/40 bg-card shadow-gold">
        {preview ? (
          <>
            <img src={preview} alt="Captured palm" className="absolute inset-0 w-full h-full object-cover" />
            {busy && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/70 backdrop-blur-sm gap-3">
                <div className="size-12 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
                <p className="text-xs font-mono uppercase tracking-widest text-accent">{status}</p>
              </div>
            )}
          </>
        ) : mode === "camera" ? (
          error && !streaming ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 gap-3">
              <div className="flex size-14 items-center justify-center rounded-full bg-accent/10 text-accent">
                <AlertTriangle className="size-7" strokeWidth={1.75} />
              </div>
              <p className="text-foreground/70 text-sm">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  setMode("upload");
                }}
                className="mt-1 bg-accent text-accent-foreground px-5 py-2.5 rounded-full font-bold text-sm"
              >
                Upload instead
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
              <FrameBrackets />
              {/* Status pill — reminds user to show palm */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-background/80 backdrop-blur-sm border border-border px-3 py-1.5 text-[11px] font-semibold text-foreground/80">
                <span className="size-1.5 rounded-full bg-accent animate-pulse" />
                Show your open palm
              </div>

              {!streaming && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/40">
                  <div className="size-10 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
                </div>
              )}
            </>
          )
        ) : (
          <button
            type="button"
            onClick={triggerFileInput}
            className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 gap-3 hover:bg-accent/5 transition-colors"
          >
            <div className="flex size-16 items-center justify-center rounded-full bg-gradient-divine shadow-divine-sm text-white">
              <Upload className="size-7" strokeWidth={1.75} />
            </div>
            <p className="font-serif text-lg">Tap to choose a photo</p>
            <p className="text-xs text-foreground/50">JPG or PNG</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => onFileChosen(e.target.files?.[0] ?? null)}
            />
          </button>
        )}
      </div>

      {/* Visual quick-tips row — icons, no paragraphs */}
      {!preview && (
        <div className="flex justify-center gap-6 text-center">
          <div className="flex flex-col items-center gap-1 text-[11px] text-foreground/60">
            <span className="text-2xl">✋</span>
            <span>Open palm</span>
          </div>
          <div className="flex flex-col items-center gap-1 text-[11px] text-foreground/60">
            <span className="text-2xl">💡</span>
            <span>Bright light</span>
          </div>
          <div className="flex flex-col items-center gap-1 text-[11px] text-foreground/60">
            <span className="text-2xl">🎯</span>
            <span>Fill the frame</span>
          </div>
        </div>
      )}

      {error && !preview && (
        <div className="max-w-md mx-auto space-y-3">
          <div className="p-3 rounded-2xl border border-destructive/40 bg-destructive/5 text-center text-xs text-destructive">
            {error}
          </div>
          <div className="flex justify-center gap-2">
            {mode === "camera" && (
              <button
                onClick={() => {
                  setError(null);
                  captureFromCamera();
                }}
                disabled={!streaming || busy}
                className="flex items-center gap-2 border-2 border-border px-5 py-2.5 rounded-full font-bold text-xs hover:border-accent disabled:opacity-40"
              >
                <RefreshCw className="size-3.5" />
                Retake
              </button>
            )}
            <button
              onClick={() => {
                setError(null);
                setMode("upload");
                setTimeout(() => triggerFileInput(), 50);
              }}
              className="flex items-center gap-2 bg-accent text-accent-foreground px-5 py-2.5 rounded-full font-bold text-xs shadow-gold-sm hover:scale-105 transition-all"
            >
              <Upload className="size-3.5" />
              Upload from gallery
            </button>
          </div>
        </div>
      )}


      {/* Primary action button — the ONLY thing user needs to tap */}
      <div className="flex justify-center gap-3">
        {preview ? (
          !busy && (
            <button
              onClick={retake}
              className="flex items-center gap-2 border-2 border-border px-6 py-3 rounded-full font-bold text-sm hover:border-accent"
            >
              <RefreshCw className="size-4" />
              Retake
            </button>
          )
        ) : mode === "camera" ? (
          <button
            onClick={captureFromCamera}
            disabled={!streaming || busy}
            className="flex items-center gap-2 bg-accent text-accent-foreground px-10 py-4 rounded-full font-bold text-base shadow-gold hover:scale-105 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <Camera className="size-5" />
            Capture
          </button>
        ) : (
          <button
            onClick={triggerFileInput}
            disabled={busy}
            className="flex items-center gap-2 bg-accent text-accent-foreground px-10 py-4 rounded-full font-bold text-base shadow-gold hover:scale-105 transition-all disabled:opacity-40"
          >
            <Upload className="size-5" />
            Choose photo
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
    <div className="py-16 flex flex-col items-center justify-center gap-6">
      <div className="relative size-28">
        <div className="absolute inset-0 rounded-full border-2 border-accent/20" />
        <div className="absolute inset-0 rounded-full border-2 border-t-accent border-r-accent/60 border-b-transparent border-l-transparent animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center font-serif text-3xl text-accent">
          ॐ
        </div>
      </div>
      <p className="text-foreground/50 text-xs uppercase tracking-widest font-mono animate-pulse">
        Reading your palm…
      </p>
    </div>
  );
}
