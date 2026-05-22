import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/site/Nav";
import { SiteFooter } from "@/components/site/Footer";

export const Route = createFileRoute("/reading")({
  head: () => ({
    meta: [
      { title: "Your Destiny Reading — Hasta AI" },
      { name: "description", content: "Your personalized AI palm reading awaits." },
    ],
  }),
  component: Reading,
});

const PREVIEW = [
  {
    title: "The Mount of Jupiter",
    body: "Your Jupiter mount rises with quiet authority. You carry leadership not as ambition but as gravity — others orbit your decisions without needing to be told. The slight crease toward your index finger reveals a soul that has led before, in another life, and now returns to lead again with more compassion than command.",
  },
  {
    title: "The Heart Rekha",
    body: "Your Hridaya Rekha sweeps in a deep, unbroken curve toward Jupiter — you love with conviction and rarely halfway. There is a faint island near its middle stretch, marking an emotional reckoning between the ages of 26 and 31 that ultimately becomes the foundation of your most lasting bond.",
  },
];

const LOCKED = [
  "The Fate Line & your wealth pivot",
  "Marriage timing & soul-bond compatibility",
  "Career path written in your Surya rekha",
  "Karmic lessons of this lifetime",
  "Your hidden talent & spiritual gift",
  "Health vitality through the Ayu line",
];

function Reading() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">Your Destiny Reading</span>
          <h1 className="text-4xl md:text-6xl font-serif text-balance">
            What your <span className="italic text-accent">palm</span> revealed
          </h1>
          <div className="flex items-center justify-center gap-3 text-xs font-mono uppercase tracking-widest text-foreground/40">
            <span className="size-1.5 bg-accent rounded-full animate-pulse" />
            Synthesized {new Date().toLocaleDateString()} · Hasta Samudrika v4.2
          </div>
        </div>

        {/* Destiny score */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { l: "Destiny Score", v: "8.7" },
            { l: "Wealth Index", v: "7.4" },
            { l: "Love Aura", v: "9.1" },
            { l: "Karmic Light", v: "8.2" },
          ].map((s) => (
            <div key={s.l} className="p-5 rounded-2xl border border-border bg-card text-center">
              <div className="font-serif text-3xl text-accent">{s.v}</div>
              <div className="text-[10px] uppercase tracking-widest text-foreground/40 font-bold mt-1">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Free preview */}
        <div className="space-y-8">
          {PREVIEW.map((p) => (
            <article key={p.title} className="p-8 rounded-3xl border border-border bg-card/60">
              <h2 className="font-serif text-2xl italic text-accent mb-4">{p.title}</h2>
              <p className="text-lg leading-relaxed text-foreground/85 font-serif">{p.body}</p>
            </article>
          ))}
        </div>

        {/* Paywall */}
        <section className="relative">
          <div className="relative rounded-[32px] border border-border bg-card overflow-hidden">
            {/* Blurred content behind */}
            <div className="p-12 space-y-6 blur-sm select-none pointer-events-none opacity-60">
              <h2 className="font-serif text-2xl italic text-accent">The Fate Line — Wealth Pivot</h2>
              <p className="text-lg leading-relaxed text-foreground/80 font-serif">
                Your Bhagya Rekha forks distinctly at the Mount of Saturn. This indicates a transformation of how money flows toward you — not by chasing it, but by aligning with a craft that feels almost effortless...
              </p>
              <p className="text-lg leading-relaxed text-foreground/80 font-serif">
                The Sun line strengthens markedly after age 32, suggesting a phase of public recognition through creative or entrepreneurial work...
              </p>
            </div>

            {/* Lock overlay */}
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
                  {LOCKED.map((l) => (
                    <li key={l} className="flex items-start gap-2">
                      <span className="text-accent mt-0.5">✧</span> {l}
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
