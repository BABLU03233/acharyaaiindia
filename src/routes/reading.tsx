import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SiteNav } from "@/components/site/Nav";
import { SiteFooter } from "@/components/site/Footer";
import { generateReading, askAcharya } from "@/lib/reading.functions";

export const Route = createFileRoute("/reading")({
  head: () => ({
    meta: [
      { title: "Your Destiny Reading — Hasta AI" },
      { name: "description", content: "Your personalized AI palm reading rooted in Hasta Samudrika Shastra." },
    ],
  }),
  component: Reading,
});

type Section = { title: string; body: string };
type Point = { x: number; y: number };
type LineAnno = { name: string; color: string; points: Point[]; note?: string };
type MountAnno = { name: string; x: number; y: number; state: "raised" | "flat" | "marked"; note?: string };
type SignAnno = { name: string; x: number; y: number; meaning?: string };
type PalmBox = { x: number; y: number; w: number; h: number };
type Annotations = {
  palmDetected: boolean;
  palmBox: PalmBox;
  imageQuality: "excellent" | "good" | "poor";
  notes?: string;
  lines: LineAnno[];
  mounts: MountAnno[];
  signs: SignAnno[];
};
type ReadingData = {
  scores: { destiny: number; wealth: number; love: number; karma: number };
  free: Section[];
  premium: Section[];
  summary: string;
  annotations: Annotations;
};

function Reading() {
  const fetchReading = useServerFn(generateReading);
  const [data, setData] = useState<ReadingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hand, setHand] = useState<"left" | "right">("right");
  const [palmImage, setPalmImage] = useState<string | null>(null);

  useEffect(() => {
    const h =
      (typeof window !== "undefined" &&
        (sessionStorage.getItem("hasta:hand") as "left" | "right" | null)) ||
      "right";
    setHand(h);
    let cancelled = false;
    const imageDataUrl =
      (typeof window !== "undefined" && sessionStorage.getItem("hasta:palmImage")) || undefined;
    if (imageDataUrl) setPalmImage(imageDataUrl);
    fetchReading({ data: { hand: h, imageDataUrl: imageDataUrl || undefined } })
      .then((r) => !cancelled && setData(r as ReadingData))
      .catch((e: unknown) => !cancelled && setError(e instanceof Error ? e.message : "Failed to generate reading"));
    return () => {
      cancelled = true;
    };
  }, [fetchReading]);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 space-y-12">
        <div className="text-center space-y-4">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">Your Destiny Reading</span>
          <h1 className="text-4xl md:text-6xl font-serif text-balance">
            What your <span className="italic text-accent">{hand}</span> palm revealed
          </h1>
          <div className="flex items-center justify-center gap-3 text-xs font-mono uppercase tracking-widest text-foreground/40">
            <span className="size-1.5 bg-accent rounded-full animate-pulse" />
            Synthesized {new Date().toLocaleDateString()} · Hasta Samudrika Shastra
          </div>
          {data?.summary && (
            <p className="max-w-2xl mx-auto font-serif italic text-lg text-foreground/80 pt-4">
              "{data.summary}"
            </p>
          )}
        </div>

        {palmImage && (
          <PalmCanvas image={palmImage} annotations={data?.annotations} loading={!data && !error} />
        )}

        {error && (
          <div className="p-6 rounded-2xl border border-destructive/40 bg-destructive/5 text-center text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { l: "Destiny Score", v: data?.scores.destiny },
            { l: "Wealth Index", v: data?.scores.wealth },
            { l: "Love Aura", v: data?.scores.love },
            { l: "Karmic Light", v: data?.scores.karma },
          ].map((s) => (
            <div key={s.l} className="p-5 rounded-2xl border border-border bg-card text-center">
              <div className="font-serif text-3xl text-accent">
                {s.v !== undefined ? s.v.toFixed(1) : <span className="opacity-30">—</span>}
              </div>
              <div className="text-[10px] uppercase tracking-widest text-foreground/40 font-bold mt-1">{s.l}</div>
            </div>
          ))}
        </div>

        <div className="space-y-8">
          {!data && !error && (
            <div className="space-y-6">
              {[0, 1].map((i) => (
                <div key={i} className="p-8 rounded-3xl border border-border bg-card/60 space-y-3 animate-pulse">
                  <div className="h-6 w-1/3 bg-accent/20 rounded" />
                  <div className="h-4 w-full bg-foreground/10 rounded" />
                  <div className="h-4 w-5/6 bg-foreground/10 rounded" />
                  <div className="h-4 w-4/6 bg-foreground/10 rounded" />
                </div>
              ))}
              <p className="text-center text-xs font-mono uppercase tracking-widest text-accent/70 animate-pulse">
                The sage is consulting the Hasta Samudrika Shastra…
              </p>
            </div>
          )}
          {data?.free.map((p) => (
            <article key={p.title} className="p-8 rounded-3xl border border-border bg-card/60">
              <h2 className="font-serif text-2xl italic text-accent mb-4">{p.title}</h2>
              <p className="text-lg leading-relaxed text-foreground/85 font-serif">{p.body}</p>
            </article>
          ))}
        </div>

        {data && (
          <section className="relative">
            <div className="relative rounded-[32px] border border-border bg-card overflow-hidden">
              <div className="p-12 space-y-6 blur-sm select-none pointer-events-none opacity-60">
                {data.premium.slice(0, 2).map((p) => (
                  <div key={p.title} className="space-y-3">
                    <h2 className="font-serif text-2xl italic text-accent">{p.title}</h2>
                    <p className="text-lg leading-relaxed text-foreground/80 font-serif">{p.body}</p>
                  </div>
                ))}
              </div>

              <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-md p-6">
                <div className="bg-card border border-accent/40 p-8 md:p-10 rounded-3xl shadow-gold text-center max-w-md w-full space-y-6 animate-[float_6s_ease-in-out_infinite]">
                  <div className="size-16 bg-accent rounded-full mx-auto flex items-center justify-center shadow-gold">
                    <span className="text-accent-foreground text-2xl">🔒</span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-serif text-2xl md:text-3xl">Your full reading is ready</h3>
                    <p className="text-sm text-foreground/60">
                      87% of seekers find clarity after unlocking their complete Destiny Analysis.
                    </p>
                  </div>

                  <ul className="text-left space-y-2 text-sm text-foreground/80">
                    {data.premium.map((p) => (
                      <li key={p.title} className="flex items-start gap-2">
                        <span className="text-accent mt-0.5">✧</span> {p.title}
                      </li>
                    ))}
                  </ul>

                  <div className="space-y-3">
                    <button className="w-full bg-accent text-accent-foreground py-4 rounded-xl font-bold hover:scale-[1.02] transition-all">
                      Unlock Full Reading — ₹69
                    </button>
                    <button className="w-full border border-accent/40 py-3 rounded-xl text-sm font-bold hover:bg-accent/5 transition-all">
                      Go Premium ₹299/mo · Unlimited
                    </button>
                  </div>
                  <p className="text-[10px] text-foreground/40 uppercase tracking-widest font-bold">
                    Secure checkout · Razorpay & Stripe · 7-day refund
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        <div className="text-center pt-8">
          <Link to="/scan" className="text-sm text-foreground/60 hover:text-accent underline underline-offset-4">
            ← Scan another palm
          </Link>
        </div>
      </main>

      {data && <AcharyaChat hand={hand} imageDataUrl={palmImage} data={data} />}
      <SiteFooter />
    </div>
  );
}

/* ---------------- Palm canvas with auto-drawn rekhas ---------------- */

function PalmCanvas({
  image,
  annotations,
  loading,
}: {
  image: string;
  annotations?: Annotations;
  loading: boolean;
}) {
  const [active, setActive] = useState<string | null>(null);
  const [drawProgress, setDrawProgress] = useState(0);

  useEffect(() => {
    if (!annotations) return;
    setDrawProgress(0);
    let raf = 0;
    const start = performance.now();
    const dur = 2200;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setDrawProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [annotations]);

  const box: PalmBox = annotations?.palmBox ?? { x: 0, y: 0, w: 1, h: 1 };
  const lines = annotations?.lines ?? [];
  const mounts = annotations?.mounts ?? [];
  const signs = annotations?.signs ?? [];
  const palmDetected = annotations?.palmDetected ?? false;
  const quality = annotations?.imageQuality;

  // Map a (px,py) that is normalized inside palmBox into normalized full-image coords (0..1).
  const toImg = (px: number, py: number) => ({
    x: box.x + px * box.w,
    y: box.y + py * box.h,
  });

  // Catmull-Rom -> cubic Bezier path for smooth line tracing.
  const smoothPath = (pts: Point[]): string => {
    if (pts.length === 0) return "";
    const P = pts.map((p) => toImg(p.x, p.y));
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
  };

  return (
    <section className="space-y-4">
      <div className="relative rounded-3xl overflow-hidden border border-border bg-card shadow-gold-sm">
        <img src={image} alt="Your palm" className="w-full h-auto block" />
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 1 1"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="scanGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0" />
              <stop offset="50%" stopColor="hsl(var(--accent))" stopOpacity="1" />
              <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0" />
            </linearGradient>
            <mask id="palmMask">
              <rect x="0" y="0" width="1" height="1" fill="white" opacity="0.55" />
              <rect
                x={box.x}
                y={box.y}
                width={box.w}
                height={box.h}
                rx={Math.min(box.w, box.h) * 0.18}
                ry={Math.min(box.w, box.h) * 0.18}
                fill="black"
              />
            </mask>
          </defs>

          {/* Dim background outside detected palm */}
          {palmDetected && annotations && (
            <rect
              x="0"
              y="0"
              width="1"
              height="1"
              fill="black"
              opacity={0.35 * drawProgress}
              mask="url(#palmMask)"
            />
          )}

          {/* Palm box outline */}
          {palmDetected && annotations && (
            <rect
              x={box.x}
              y={box.y}
              width={box.w}
              height={box.h}
              rx={Math.min(box.w, box.h) * 0.18}
              ry={Math.min(box.w, box.h) * 0.18}
              fill="none"
              stroke="hsl(var(--accent))"
              strokeWidth={0.0035}
              vectorEffect="non-scaling-stroke"
              opacity={0.35 * drawProgress}
              strokeDasharray="0.012 0.008"
            />
          )}

          {loading && (
            <rect x="0" y="0" width="1" height="1" fill="url(#scanGrad)" opacity="0.15">
              <animate attributeName="opacity" values="0.05;0.25;0.05" dur="1.8s" repeatCount="indefinite" />
            </rect>
          )}

          {lines.map((ln) => {
            if (!ln.points?.length) return null;
            const d = smoothPath(ln.points);
            const isActive = active === ln.name;
            return (
              <g key={ln.name}>
                {/* Soft glow */}
                <path
                  d={d}
                  fill="none"
                  stroke={ln.color}
                  strokeWidth={isActive ? 0.022 : 0.014}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  opacity={0.25}
                  style={{
                    strokeDasharray: 4,
                    strokeDashoffset: 4 * (1 - drawProgress),
                  }}
                />
                {/* Crisp line */}
                <path
                  d={d}
                  fill="none"
                  stroke={ln.color}
                  strokeWidth={isActive ? 0.011 : 0.006}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  opacity={0.98}
                  style={{
                    strokeDasharray: 4,
                    strokeDashoffset: 4 * (1 - drawProgress),
                    transition: "stroke-width 200ms",
                  }}
                />
              </g>
            );
          })}

          {mounts.map((m, i) => {
            const p = toImg(m.x, m.y);
            return (
              <g key={`m-${i}`} style={{ opacity: drawProgress }}>
                <circle cx={p.x} cy={p.y} r={0.014} fill="hsl(var(--accent))" opacity={0.85} />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={0.024}
                  fill="none"
                  stroke="hsl(var(--accent))"
                  strokeWidth={0.003}
                  vectorEffect="non-scaling-stroke"
                  opacity={0.6}
                />
              </g>
            );
          })}

          {signs.map((s, i) => {
            const p = toImg(s.x, s.y);
            return (
              <g key={`s-${i}`} style={{ opacity: drawProgress }}>
                <rect
                  x={p.x - 0.013}
                  y={p.y - 0.013}
                  width={0.026}
                  height={0.026}
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth={0.004}
                  vectorEffect="non-scaling-stroke"
                  transform={`rotate(45 ${p.x} ${p.y})`}
                />
              </g>
            );
          })}
        </svg>

        {loading && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent animate-[scan-line_2.5s_linear_infinite]" />
          </div>
        )}

        {annotations && !palmDetected && (
          <div className="absolute inset-0 flex items-end justify-center p-4 bg-gradient-to-t from-background/80 to-transparent">
            <div className="text-center text-xs font-mono uppercase tracking-widest text-amber-400 bg-background/70 px-4 py-2 rounded-full border border-amber-400/30">
              ⚠ Palm not clearly visible — try a closer, brighter photo
            </div>
          </div>
        )}
      </div>

      {annotations && (
        <div className="flex flex-wrap items-center gap-2 justify-center text-[10px] font-mono uppercase tracking-widest">
          <span
            className={
              "px-2.5 py-1 rounded-full border " +
              (quality === "excellent"
                ? "border-green-500/40 text-green-400"
                : quality === "good"
                ? "border-accent/40 text-accent"
                : "border-amber-400/40 text-amber-400")
            }
          >
            Image: {quality ?? "—"}
          </span>
          <span className="px-2.5 py-1 rounded-full border border-border text-foreground/60">
            Palm {palmDetected ? "locked" : "not detected"}
          </span>
          <span className="px-2.5 py-1 rounded-full border border-border text-foreground/60">
            {lines.length} rekha · {mounts.length} parvat · {signs.length} chinha
          </span>
        </div>
      )}

      {lines.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {lines.map((ln) => (
            <button
              key={ln.name}
              onMouseEnter={() => setActive(ln.name)}
              onMouseLeave={() => setActive(null)}
              onClick={() => setActive((a) => (a === ln.name ? null : ln.name))}
              className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border bg-card hover:bg-accent/5 transition-all"
              style={{ borderColor: ln.color, color: ln.color }}
              title={ln.note}
            >
              <span className="inline-block size-2 rounded-full mr-2" style={{ background: ln.color }} />
              {ln.name}
            </button>
          ))}
        </div>
      )}

      {active && (
        <p className="text-center text-sm text-foreground/70 font-serif italic max-w-xl mx-auto">
          {lines.find((l) => l.name === active)?.note}
        </p>
      )}
    </section>
  );
}

/* ---------------- Q&A bot with the Acharya ---------------- */

type Msg = { role: "user" | "acharya"; text: string };

const SUGGESTED = [
  "When will I marry?",
  "Will I become wealthy?",
  "What career suits me?",
  "What is my hidden talent?",
  "Is foreign travel in my destiny?",
];

function AcharyaChat({
  hand,
  imageDataUrl,
  data,
}: {
  hand: "left" | "right";
  imageDataUrl: string | null;
  data: ReadingData;
}) {
  const ask = useServerFn(askAcharya);
  const [open, setOpen] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "acharya",
      text: "Beta, the rekhas have spoken. What weighs on your heart? Marriage, dhana, career, or the path of dharma — ask, and the shastra shall answer.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setShowInvite(true), 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, open]);

  const context = useMemo(() => {
    const parts = [
      `Summary: ${data.summary}`,
      ...data.free.map((f) => `${f.title}: ${f.body}`),
      ...data.premium.slice(0, 2).map((f) => `${f.title}: ${f.body}`),
    ];
    return parts.join("\n").slice(0, 4000);
  }, [data]);

  const send = async (q: string) => {
    const question = q.trim();
    if (!question || busy) return;
    setMsgs((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setBusy(true);
    try {
      const r = await ask({ data: { hand, question, imageDataUrl: imageDataUrl ?? undefined, context } });
      setMsgs((m) => [...m, { role: "acharya", text: r.answer }]);
    } catch (e) {
      setMsgs((m) => [
        ...m,
        { role: "acharya", text: e instanceof Error ? e.message : "The shastra is silent at this moment." },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {/* Floating launcher */}
      <button
        onClick={() => {
          setOpen(true);
          setShowInvite(false);
        }}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-3 bg-accent text-accent-foreground pl-4 pr-5 py-3 rounded-full shadow-gold hover:scale-105 transition-all"
      >
        <span className="size-9 rounded-full bg-background/20 flex items-center justify-center text-lg">🪔</span>
        <span className="font-bold text-sm">Ask the Acharya</span>
      </button>

      {showInvite && !open && (
        <div className="fixed bottom-24 right-6 z-40 max-w-xs bg-card border border-accent/40 rounded-2xl p-4 shadow-gold animate-[float_6s_ease-in-out_infinite]">
          <p className="text-sm font-serif italic text-foreground/85">
            "Your reading is only the beginning. Ask me anything — marriage, wealth, dharma."
          </p>
          <div className="text-[10px] uppercase tracking-widest font-bold text-accent mt-2">— Acharya Hasta</div>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-background/70 backdrop-blur-sm p-0 md:p-6">
          <div className="w-full max-w-lg h-[80vh] md:h-[640px] bg-card border border-accent/30 rounded-t-3xl md:rounded-3xl shadow-gold flex flex-col overflow-hidden">
            <header className="flex items-center justify-between px-5 py-4 border-b border-border bg-gradient-to-r from-accent/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-accent flex items-center justify-center text-xl">🪔</div>
                <div>
                  <div className="font-serif text-lg">Acharya Hasta</div>
                  <div className="text-[10px] uppercase tracking-widest text-accent">Hasta Samudrika Shastra · Live</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-foreground/60 hover:text-foreground text-2xl leading-none">
                ×
              </button>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
              {msgs.map((m, i) => (
                <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                  <div
                    className={
                      m.role === "user"
                        ? "max-w-[85%] px-4 py-3 rounded-2xl rounded-br-sm bg-accent text-accent-foreground text-sm"
                        : "max-w-[90%] px-4 py-3 rounded-2xl rounded-bl-sm bg-background/60 border border-border text-foreground/90 font-serif leading-relaxed"
                    }
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-2xl bg-background/60 border border-border text-xs font-mono uppercase tracking-widest text-accent animate-pulse">
                    consulting the shastra…
                  </div>
                </div>
              )}
            </div>

            {msgs.length <= 1 && (
              <div className="px-5 pb-2 flex flex-wrap gap-2">
                {SUGGESTED.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    disabled={busy}
                    className="text-xs px-3 py-1.5 rounded-full border border-border bg-background/40 hover:border-accent hover:text-accent transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="p-3 border-t border-border flex gap-2 bg-background/40"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask the Acharya…"
                className="flex-1 bg-card border border-border rounded-full px-5 py-3 text-sm outline-none focus:border-accent"
                disabled={busy}
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="bg-accent text-accent-foreground px-5 py-3 rounded-full font-bold text-sm disabled:opacity-40"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
