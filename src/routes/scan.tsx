import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Camera, Hand } from "lucide-react";
import { SiteNav } from "@/components/site/Nav";
import { OmParallax } from "@/components/site/OmParallax";
import { scanPalmFrame } from "@/lib/reading.functions";

export const Route = createFileRoute("/scan")({
  head: () => ({
    meta: [
      { title: "Scan Your Palm — Free AI Palm Reading | Acharya AI" },
      {
        name: "description",
        content:
          "Upload or capture your palm. The Acharya reads it instantly using the full Hasta Samudrika Shastra. Free to start.",
      },
      { property: "og:title", content: "Scan Your Palm — Free AI Palm Reading | Acharya AI" },
      {
        property: "og:description",
        content:
          "Upload or capture your palm and get an instant AI reading rooted in Hasta Samudrika Shastra.",
      },
      { property: "og:url", content: "https://hasta-aura-reveal.lovable.app/scan" },
    ],
    links: [{ rel: "canonical", href: "https://hasta-aura-reveal.lovable.app/scan" }],
  }),
  component: ScanFlow,
});

type Step = "hand" | "capture" | "focus" | "analyzing";
const STEP_NUMBER: Record<Step, number> = { hand: 1, capture: 2, focus: 3, analyzing: 4 };
const TOTAL_STEPS = 4;
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
  mounts: Array<{
    name: string;
    x: number;
    y: number;
    state: "raised" | "flat" | "marked";
    note?: string;
  }>;
  signs: Array<{ name: string; x: number; y: number; meaning?: string }>;
};

const SCAN_TIPS = [
  {
    title: "Keep only one open palm",
    description:
      "Hold your palm steady with fingers relaxed and the full inner palm visible. Avoid props, sleeves, and jewellery.",
  },
  {
    title: "Use even, bright lighting",
    description:
      "Soft daylight or a bright room helps the AI trace your lines clearly. Avoid strong shadows and glare.",
  },
  {
    title: "Center the palm within the frame",
    description:
      "Show the central palm area from wrist to fingertips. The scanner needs the whole palm surface to read correctly.",
  },
];

function ScanFlow() {
  const [step, setStep] = useState<Step>("hand");
  const [hand, setHand] = useState<"left" | "right" | null>(null);

  // Note: deliberately does NOT auto-resume a previously saved hand from
  // sessionStorage on mount. That silently skipped the hand-choice step on
  // every fresh visit to /scan, so the seeker never actually got asked.

  const handleSelect = (selected: "left" | "right") => {
    setHand(selected);
    try {
      sessionStorage.setItem("hasta:hand", selected);
    } catch {
      // ignore storage failures
    }
    setStep("capture");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="relative overflow-hidden flex-1 max-w-6xl mx-auto w-full px-6 py-12 md:py-16">
        <OmParallax className="absolute -top-10 left-1/2 -translate-x-1/2 -z-10" speed={0.1} />
        <div className="mb-10 space-y-4 text-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">
            Step {STEP_NUMBER[step]} of {TOTAL_STEPS}
          </span>
          <h1 className="text-4xl md:text-6xl font-serif leading-tight bg-gradient-divine bg-clip-text text-transparent">
            Scan your palm with precision and receive a deeper Hasta Samudrika reading.
          </h1>
          <p className="mx-auto max-w-3xl text-foreground/70 text-base md:text-lg leading-relaxed">
            Choose your hand, capture the palm clearly, tell the Acharya what weighs on your mind,
            and let them trace your life, love, career and karma from the visible rekhas.
          </p>
        </div>

        {step === "hand" && <HandPicker selected={hand} onSelect={handleSelect} />}

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
                // ignore storage failures
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

function HandPicker({
  selected,
  onSelect,
}: {
  selected?: "left" | "right" | null;
  onSelect: (h: "left" | "right") => void;
}) {
  return (
    <div className="space-y-12">
      <div className="text-center space-y-4">
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">
          Step 1 of {TOTAL_STEPS}
        </span>
        <h1 className="text-4xl md:text-6xl font-serif">Choose your palm for the reading</h1>
        <p className="mx-auto max-w-3xl text-foreground/70 text-base md:text-lg leading-relaxed">
          Your dominant hand shows the destiny you are actively shaping, while the non-dominant hand
          speaks of your innate karma and gifts.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {(["left", "right"] as const).map((h) => {
          const isSelected = selected === h;
          return (
            <button
              key={h}
              onClick={() => onSelect(h)}
              aria-pressed={isSelected}
              className={
                "group relative flex flex-col justify-between rounded-2xl border-2 bg-gradient-to-br from-white to-accent/5 p-8 text-left transition-all hover:border-accent hover:shadow-divine hover:scale-102 " +
                (isSelected ? "border-accent shadow-divine" : "border-accent/20")
              }
            >
              {isSelected && (
                <span className="absolute top-4 right-4 rounded-full bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-widest px-3 py-1">
                  Selected
                </span>
              )}
              <div>
                <div className="mb-6 inline-flex size-20 items-center justify-center rounded-full bg-gradient-divine shadow-divine-sm">
                  <Hand
                    className={"size-9 text-white" + (h === "left" ? " -scale-x-100" : "")}
                    strokeWidth={1.75}
                  />
                </div>
                <div className="font-serif text-3xl italic mb-3 text-accent group-hover:text-accent transition-colors capitalize">
                  {h} Hand
                </div>
                <p className="text-sm text-foreground/70 leading-relaxed">
                  {h === "left"
                    ? "Inherits your deeper soul pattern and karmic gifts."
                    : "Reflects your current choices, action and unfolding destiny."}
                </p>
              </div>
              <div className="mt-8 rounded-full bg-gradient-divine/10 border border-accent/30 p-4 text-xs uppercase tracking-[0.25em] font-semibold text-accent">
                {h === "left" ? "Karma & gifts" : "Action & destiny"}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const FOCUS_OPTIONS = [
  {
    key: "career",
    label: "Career & Success",
    icon: "💼",
    question: "What does my career and professional success look like?",
  },
  {
    key: "money",
    label: "Money & Wealth",
    icon: "💰",
    question: "What does my financial future and wealth look like?",
  },
  {
    key: "marriage",
    label: "Marriage & Love",
    icon: "💞",
    question: "What does my marriage and love life look like?",
  },
  {
    key: "family",
    label: "Family & Relationships",
    icon: "🏡",
    question: "What does my family life and close relationships look like?",
  },
  {
    key: "growth",
    label: "Personal Growth",
    icon: "🌱",
    question: "What is my hidden talent and path of personal growth?",
  },
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
    <div className="space-y-10">
      <div className="text-center space-y-4">
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">
          Step 3 of {TOTAL_STEPS}
        </span>
        <h1 className="text-4xl md:text-6xl font-serif">What is on your mind?</h1>
        <p className="mx-auto max-w-3xl text-foreground/70 text-base md:text-lg leading-relaxed">
          Tell the Acharya where to focus — your destiny reading will be shaped around it.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {FOCUS_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => choose(opt.key, opt.question)}
            className={
              "flex flex-col items-start gap-2 rounded-3xl border-2 p-6 text-left transition-all " +
              (selected === opt.key
                ? "border-accent bg-accent/10 shadow-divine"
                : "border-border bg-card hover:border-accent/50 hover:bg-accent/5")
            }
          >
            <span className="text-3xl" aria-hidden>
              {opt.icon}
            </span>
            <span className="font-serif text-lg text-foreground">{opt.label}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setSelected("other")}
          className={
            "flex flex-col items-start gap-2 rounded-3xl border-2 p-6 text-left transition-all " +
            (selected === "other"
              ? "border-accent bg-accent/10 shadow-divine"
              : "border-border bg-card hover:border-accent/50 hover:bg-accent/5")
          }
        >
          <span className="text-3xl" aria-hidden>
            ✍️
          </span>
          <span className="font-serif text-lg text-foreground">Something else…</span>
        </button>
      </div>

      {showCustom && (
        <div className="max-w-xl mx-auto space-y-4">
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            rows={3}
            placeholder="Tell the Acharya what you'd like to know…"
            className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-accent resize-none"
            aria-label="Describe what you'd like your reading to focus on"
          />
          <div className="text-center">
            <button
              type="button"
              disabled={!customText.trim()}
              onClick={() => onComplete(customText.trim())}
              className="bg-accent text-accent-foreground px-8 py-3 rounded-full font-bold text-sm hover:scale-105 transition-transform shadow-gold disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              Continue to reading
            </button>
          </div>
        </div>
      )}

      <div className="text-center">
        <button
          type="button"
          onClick={() => onComplete("")}
          className="text-sm text-foreground/50 hover:text-accent underline underline-offset-4"
        >
          Skip — give me a general reading
        </button>
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

function expandPalmBox(box: { x: number; y: number; w: number; h: number }, lines: LineAnno[]) {
  const minWidth = 0.9;
  const minHeight = 0.94;
  let { x, y, w, h } = box;

  const points = lines.flatMap((line) => line.points);
  if (points.length >= 2) {
    const minX = Math.min(...points.map((p) => p.x));
    const maxX = Math.max(...points.map((p) => p.x));
    const minY = Math.min(...points.map((p) => p.y));
    const maxY = Math.max(...points.map((p) => p.y));
    const pad = 0.1;
    const lineW = Math.min(1, Math.max(maxX - minX + pad * 2, minWidth));
    const lineH = Math.min(1, Math.max(maxY - minY + pad * 2, minHeight));
    const lineX = Math.max(0, Math.min(1 - lineW, minX - pad));
    const lineY = Math.max(0, Math.min(1 - lineH, minY - pad));
    if (lineW > w || lineH > h) {
      x = lineX;
      y = lineY;
      w = lineW;
      h = lineH;
    }
  }

  if (w < minWidth || h < minHeight) {
    const centerX = x + w / 2;
    const centerY = y + h / 2;
    w = Math.min(1, Math.max(w, minWidth));
    h = Math.min(1, Math.max(h, minHeight));
    x = Math.max(0, Math.min(1 - w, centerX - w / 2));
    y = Math.max(0, Math.min(1 - h, centerY - h / 2));
  }

  return { x, y, w, h };
}

/** Animates 0→1 whenever `dep` changes identity — drives the line "auto-draw" effect. */
function useDrawProgress(dep: unknown, duration = 950) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (dep === null || dep === undefined) return;
    setProgress(0);
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dep, duration]);
  return progress;
}

function LivePalmOverlay({
  annotations,
  pulse = false,
}: {
  annotations: Annotations | null;
  pulse?: boolean;
}) {
  const drawProgress = useDrawProgress(annotations);

  if (!annotations?.palmDetected || !annotations.lines.length) return null;

  const visibleLines = annotations.lines.filter((line) => line.points.length >= 3);
  if (!visibleLines.length) return null;

  const palmBox = expandPalmBox(annotations.palmBox, visibleLines);
  const bracket = Math.min(palmBox.w, palmBox.h) * 0.14;
  const corners = [
    { x: palmBox.x, y: palmBox.y, dx: 1, dy: 1 },
    { x: palmBox.x + palmBox.w, y: palmBox.y, dx: -1, dy: 1 },
    { x: palmBox.x, y: palmBox.y + palmBox.h, dx: 1, dy: -1 },
    { x: palmBox.x + palmBox.w, y: palmBox.y + palmBox.h, dx: -1, dy: -1 },
  ];

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 1 1"
      preserveAspectRatio="none"
    >
      {/* Viewfinder brackets marking the full palm frame, not a solid box */}
      {corners.map((c, i) => (
        <path
          key={i}
          d={`M${c.x},${c.y + c.dy * bracket} L${c.x},${c.y} L${c.x + c.dx * bracket},${c.y}`}
          fill="none"
          stroke={pulse ? "hsla(150, 55%, 55%, 0.9)" : "hsla(37, 75%, 48%, 0.9)"}
          strokeWidth="0.014"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          className="transition-colors duration-300"
        />
      ))}

      {/* Rekhas auto-drawing themselves in real time as the AI traces them */}
      {visibleLines.map((line) => {
        const d = smoothPath(line.points, annotations.palmBox);
        if (!d) return null;
        return (
          <g key={line.name}>
            <path
              d={d}
              fill="none"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="0.022"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              opacity={0.4}
              pathLength={1}
              style={{ strokeDasharray: 1, strokeDashoffset: 1 - drawProgress }}
            />
            <path
              d={d}
              fill="none"
              stroke={line.color}
              strokeWidth="0.03"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              opacity={0.95}
              pathLength={1}
              style={{ strokeDasharray: 1, strokeDashoffset: 1 - drawProgress }}
            />
          </g>
        );
      })}

      {pulse && (
        <>
          {corners.map((c, i) => (
            <circle
              key={`glow-${i}`}
              cx={c.x}
              cy={c.y}
              r={0.014}
              fill="hsl(150, 55%, 55%)"
              className="animate-pulse"
            />
          ))}
        </>
      )}
    </svg>
  );
}

/** Compress an image source to a JPEG data URL ≤ ~900px on the long edge. */
async function compressToDataUrl(
  src: Blob | string,
  maxDim = 1280,
  quality = 0.88,
): Promise<string> {
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
  const [liveState, setLiveState] = useState<"searching" | "detected" | "rejected">("searching");
  const [liveMsg, setLiveMsg] = useState<string>("Searching for your palm…");
  const [liveAnnotations, setLiveAnnotations] = useState<Annotations | null>(null);
  const consecutiveDetectsRef = useRef(0);
  const scanningRef = useRef(false);
  const completedRef = useRef(false);

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
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (JPG, PNG, etc.).");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError("File is too large. Please choose an image under 50MB.");
      return;
    }
    setBusy(true);
    setStatus("Loading your image…");
    try {
      const dataUrl = await compressToDataUrl(file, 1280, 0.88);
      setPreview(dataUrl);
      setStatus("Analyzing the palm…");
      await handAndGo(dataUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read the image. Try a different file.");
      setBusy(false);
      setStatus("");
    }
  };

  const triggerFileInput = () => {
    if (fileRef.current) {
      fileRef.current.value = ""; // Reset input so same file can be selected again
      fileRef.current.click();
    }
  };

  return (
    <div className="py-8 space-y-8">
      <div className="text-center space-y-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">
          Step 2 of {TOTAL_STEPS}
        </span>
        <h1 className="text-3xl md:text-5xl font-serif">
          Scan your <span className="italic text-accent">{hand}</span> palm with confidence
        </h1>
        <p className="text-foreground/60 max-w-xl mx-auto">
          Hold only your open {hand} palm in front of the camera against a plain background. The
          live scanner will trace the visible rekhas in real time and reject anything that is not a
          clear palm.
        </p>
      </div>

      <div className="mx-auto grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-[32px] border border-border bg-card/70 p-5 md:p-6">
          <div className="mb-3 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.3em] text-foreground/45">
            <span>Progress</span>
            <span>2 / {TOTAL_STEPS}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-background/70">
            <div className="h-2 w-1/2 rounded-full bg-accent" />
          </div>
          <div className="mt-4 grid gap-2 text-sm text-foreground/70 sm:grid-cols-4">
            <div className="rounded-2xl border border-border bg-background/40 p-3">
              Choose the hand
            </div>
            <div className="rounded-2xl border border-accent/30 bg-accent/10 p-3">
              Capture the palm
            </div>
            <div className="rounded-2xl border border-border bg-background/40 p-3">
              Tell your focus
            </div>
            <div className="rounded-2xl border border-border bg-background/40 p-3">
              Receive the reading
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-accent/20 bg-accent/5 p-4">
              <div className="flex items-center justify-between">
                <div className="text-[10px] uppercase tracking-[0.3em] text-accent font-bold">
                  Selected hand
                </div>
                <button
                  type="button"
                  onClick={onChangeHand}
                  className="text-[10px] uppercase tracking-[0.2em] font-bold text-foreground/50 hover:text-accent transition-colors underline underline-offset-2"
                >
                  Change
                </button>
              </div>
              <div className="mt-3 text-xl font-serif capitalize text-foreground">{hand} palm</div>
              <p className="mt-2 text-sm text-foreground/70">
                This hand will drive your reading —{" "}
                {hand === "right" ? "your active destiny" : "your innate karma"}.
              </p>
            </div>
            <div className="rounded-3xl border border-border bg-background/70 p-4">
              <div className="text-[10px] uppercase tracking-[0.3em] text-foreground/45 font-bold">
                Capture mode
              </div>
              <div className="mt-3 text-xl font-serif text-foreground">
                {mode === "camera" ? "Live camera" : "Upload photo"}
              </div>
              <p className="mt-2 text-sm text-foreground/70">
                {mode === "camera"
                  ? "The AI locks onto your palm as soon as it detects a clear scan."
                  : "Choose a high-quality photo of your open palm for best accuracy."}
              </p>
            </div>
          </div>
        </div>

        <aside className="rounded-[32px] border border-border bg-background/70 p-6 text-sm text-foreground/80">
          <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-accent mb-4">
            Scan rituals
          </div>
          <div className="space-y-4">
            {SCAN_TIPS.map((tip) => (
              <div
                key={tip.title}
                className="space-y-2 rounded-3xl border border-border bg-card/20 p-4"
              >
                <div className="text-sm font-semibold text-foreground">{tip.title}</div>
                <p className="leading-relaxed text-foreground/70">{tip.description}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* Mode toggle */}
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
              aria-label={
                m === "camera" ? "Use live camera to capture palm" : "Upload an existing palm photo"
              }
              aria-pressed={mode === m}
              className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                mode === m
                  ? "bg-accent text-accent-foreground shadow-gold-sm"
                  : "text-foreground/60 hover:text-foreground"
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
            <img
              src={preview}
              alt="Captured palm"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {busy && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm gap-4">
                <div className="size-12 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
                <p className="text-sm font-mono uppercase tracking-widest text-accent">
                  {status || "Verifying…"}
                </p>
              </div>
            )}
          </>
        ) : mode === "camera" ? (
          error && !streaming ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 gap-4">
              <div className="flex size-16 items-center justify-center rounded-full bg-accent/10 text-accent">
                <AlertTriangle className="size-8" strokeWidth={1.75} />
              </div>
              <h3 className="font-serif text-xl">Camera unavailable</h3>
              <p className="text-foreground/60 text-sm max-w-sm">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  setMode("upload");
                }}
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
                    (liveState === "detected"
                      ? "bg-green-400"
                      : liveState === "rejected"
                        ? "bg-amber-400"
                        : "bg-accent")
                  }
                />
                {streaming ? liveMsg : "Initializing camera…"}
              </div>
            </>
          )
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 gap-4">
            <div className="flex size-20 items-center justify-center rounded-full bg-gradient-divine shadow-divine-sm text-white">
              <Camera className="size-9" strokeWidth={1.75} />
            </div>
            <h3 className="font-serif text-2xl">Upload your palm photo</h3>
            <p className="text-foreground/60 text-sm max-w-sm">
              Tap to choose — only the open {hand} palm, plain background, well-lit, center lines
              visible.
            </p>
            <button
              type="button"
              onClick={triggerFileInput}
              className="mt-2 bg-accent text-accent-foreground px-6 py-3 rounded-full font-bold text-sm transition-shadow shadow-sm hover:shadow-gold"
            >
              Choose photo
            </button>
            <input
              ref={fileRef}
              id="palm-photo-upload"
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(e) => onFileChosen(e.target.files?.[0] ?? null)}
              aria-label="Upload palm image"
            />
          </div>
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
            onClick={triggerFileInput}
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
        <div className="absolute inset-0 flex items-center justify-center font-serif text-4xl text-accent leading-none">
          ॐ
        </div>
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
