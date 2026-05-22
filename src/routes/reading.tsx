import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SiteNav } from "@/components/site/Nav";
import { SiteFooter } from "@/components/site/Footer";
import { generateReading } from "@/lib/reading.functions";

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
type ReadingData = {
  scores: { destiny: number; wealth: number; love: number; karma: number };
  free: Section[];
  premium: Section[];
  summary: string;
};

function Reading() {
  const fetchReading = useServerFn(generateReading);
  const [data, setData] = useState<ReadingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hand, setHand] = useState<"left" | "right">("right");

  useEffect(() => {
    const h =
      (typeof window !== "undefined" &&
        (sessionStorage.getItem("hasta:hand") as "left" | "right" | null)) ||
      "right";
    setHand(h);
    let cancelled = false;
    const imageDataUrl =
      (typeof window !== "undefined" && sessionStorage.getItem("hasta:palmImage")) || undefined;
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
      <SiteFooter />
    </div>
  );
}
