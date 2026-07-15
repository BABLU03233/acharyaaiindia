import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Users, Star } from "lucide-react";
import { SiteNav } from "@/components/site/Nav";
import { SiteFooter } from "@/components/site/Footer";
import { LiveTicker } from "@/components/site/LiveTicker";
import { PalmHologram } from "@/components/site/PalmHologram";
import { FAQ } from "@/components/site/FAQ";
import { Testimonials } from "@/components/site/Testimonials";
import palmAltImg from "@/assets/palms/palm-open-alt-1200.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Acharya AI — AI Palm Reading rooted in Hasta Samudrika Shastra" },
      {
        name: "description",
        content:
          "Scan your palm. In 60 seconds, get an AI reading rooted in 3,000-year-old Hasta Samudrika Shastra. Free to try.",
      },
    ],
    links: [{ rel: "canonical", href: "https://hasta-aura-reveal.lovable.app/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Acharya AI",
          url: "https://hasta-aura-reveal.lovable.app/",
          description: "AI-powered palm reading rooted in Hasta Samudrika Shastra.",
        }),
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <LiveTicker />

      <main className="flex-1">
        {/* ───────── HERO ───────── */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-aura pointer-events-none" />
          <div className="max-w-7xl mx-auto px-6 py-10 md:py-20 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center relative">
            {/* Copy — deliberately short */}
            <div className="space-y-6 lg:space-y-8 order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/5 pl-1.5 pr-4 py-1.5 text-[11px] uppercase tracking-widest font-bold text-accent">
                <span className="inline-flex size-5 rounded-full bg-accent text-accent-foreground items-center justify-center text-[10px]">
                  ॐ
                </span>
                Ancient wisdom · Modern AI
              </div>

              <h1
                data-testid="hero-title"
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif leading-[1.05] text-balance"
              >
                Your palm.
                <br />
                <span className="italic text-accent">Your destiny.</span>
                <br />
                In 60 seconds.
              </h1>

              <p className="text-foreground/70 text-base md:text-lg max-w-md leading-relaxed">
                Show your hand. The Acharya traces every rekha and reveals what the shastra sees.
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <Link
                  data-testid="hero-cta-scan"
                  to="/scan"
                  className="group inline-flex items-center gap-2 bg-accent text-accent-foreground px-8 py-4 rounded-full font-bold text-base md:text-lg shadow-gold hover:scale-105 transition-transform"
                >
                  Scan my palm free
                  <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <div className="text-[11px] font-semibold uppercase tracking-widest text-foreground/50">
                  No sign-up · 5 free reads
                </div>
              </div>

              {/* Social proof strip */}
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={
                          "size-8 rounded-full border-2 border-background " +
                          ["bg-amber-200", "bg-orange-200", "bg-rose-200", "bg-yellow-200"][i]
                        }
                      />
                    ))}
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-sm font-bold text-foreground">22,481+</span>
                    <span className="text-[10px] uppercase tracking-widest text-foreground/50">
                      Seekers read
                    </span>
                  </div>
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5 text-accent">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Star key={i} className="size-3.5 fill-current" />
                    ))}
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-sm font-bold text-foreground">4.9 / 5</span>
                    <span className="text-[10px] uppercase tracking-widest text-foreground/50">
                      Shastra score
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Real palm image with animated rekhas */}
            <div className="order-1 lg:order-2 relative h-[380px] sm:h-[460px] md:h-[560px] lg:h-[600px] flex items-center justify-center">
              <PalmHologram className="max-w-md mx-auto" />

              {/* Floating stats card — creates FOMO with live count */}
              <div className="hidden md:flex absolute top-6 right-2 lg:right-6 items-center gap-3 rounded-2xl border border-accent/25 bg-card/95 backdrop-blur px-4 py-2.5 shadow-gold-sm animate-[float_6s_ease-in-out_infinite]">
                <span className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <div className="flex flex-col leading-tight">
                  <span className="text-[10px] uppercase tracking-widest text-foreground/50 font-semibold">
                    Live · reading now
                  </span>
                  <span className="text-sm font-bold text-foreground">247 seekers</span>
                </div>
              </div>

              {/* Bottom whisper card */}
              <div className="hidden md:flex absolute bottom-4 left-0 lg:-left-4 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-gold-sm">
                <Sparkles className="size-3.5 text-accent" />
                <span className="text-xs font-serif italic text-foreground/70">
                  "A destiny line breaks at 28…"
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ───────── HOW IT WORKS — 3 visual steps ───────── */}
        <section id="how" className="py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center max-w-lg mx-auto mb-12 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">
                The ritual
              </span>
              <h2 className="text-3xl md:text-4xl font-serif">Three taps to your reading</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { n: "01", t: "Hold your palm up", d: "Front camera, plain background." },
                { n: "02", t: "AI traces every line", d: "Real-time rekhas drawn on your hand." },
                { n: "03", t: "The Acharya answers", d: "Your question, in your own reading." },
              ].map((s) => (
                <div
                  key={s.n}
                  className="p-6 md:p-8 rounded-3xl border border-border bg-card hover:border-accent/40 hover:shadow-gold-sm transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-accent text-xs">{s.n}</span>
                    <span className="size-8 rounded-full bg-accent/10 flex items-center justify-center">
                      <ArrowRight className="size-3.5 text-accent" />
                    </span>
                  </div>
                  <h3 className="font-serif text-xl mb-1.5">{s.t}</h3>
                  <p className="text-sm text-foreground/60">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───────── FOMO strip ───────── */}
        <section className="py-12">
          <div className="max-w-6xl mx-auto px-6">
            <div className="relative rounded-3xl border border-accent/25 bg-gradient-to-br from-accent/8 via-card to-card p-6 md:p-10 flex flex-col md:flex-row items-center gap-6 md:gap-10 overflow-hidden">
              <div className="relative flex items-center justify-center shrink-0 size-32 md:size-40">
                <img
                  src={palmAltImg}
                  alt="A second palm angle"
                  className="max-w-full max-h-full object-contain drop-shadow-[0_8px_20px_rgba(217,156,60,0.35)]"
                />
              </div>
              <div className="flex-1 space-y-3 text-center md:text-left">
                <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 border border-accent/30 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-accent">
                  <Users className="size-3" /> This hour · 247 readings
                </span>
                <h3 className="font-serif text-2xl md:text-3xl leading-tight">
                  What your hand says <span className="italic text-accent">right now</span>
                </h3>
                <p className="text-sm md:text-base text-foreground/60 max-w-xl">
                  Every palm is different. Yours has one specific question the Acharya can answer today.
                </p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <Link
                    to="/scan"
                    className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-6 py-3 rounded-full font-bold text-sm shadow-gold hover:scale-105 transition-transform"
                  >
                    Read mine now
                    <ArrowRight className="size-3.5" />
                  </Link>
                  <span className="text-[11px] uppercase tracking-widest text-foreground/45 font-semibold">
                    Free · 60 seconds
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ───────── Reading preview — sample question chips ───────── */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center space-y-3 mb-8">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">
                Ask anything
              </span>
              <h2 className="text-3xl md:text-4xl font-serif">Popular questions today</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { q: "When will I marry?", icon: "💞" },
                { q: "Will I be rich?", icon: "💰" },
                { q: "My real career?", icon: "🎯" },
                { q: "My hidden talent?", icon: "✨" },
                { q: "Foreign settlement?", icon: "✈️" },
                { q: "Health & vitality?", icon: "🌿" },
                { q: "Soulmate coming?", icon: "🌹" },
                { q: "Business or job?", icon: "📊" },
              ].map((item) => (
                <Link
                  key={item.q}
                  to="/scan"
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-border bg-card hover:border-accent hover:bg-accent/5 hover:scale-[1.03] transition-all text-center"
                >
                  <span className="text-2xl" aria-hidden>
                    {item.icon}
                  </span>
                  <span className="text-xs font-semibold text-foreground/80">{item.q}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <Testimonials />
        <FAQ />

        {/* ───────── Final CTA ───────── */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-6">
            <div className="relative overflow-hidden rounded-[36px] border border-accent/30 bg-gradient-to-br from-accent/10 via-card to-card p-10 md:p-16 text-center">
              <div className="absolute inset-0 bg-aura pointer-events-none" />
              <div className="relative z-10 space-y-6 max-w-xl mx-auto">
                <div className="text-3xl text-accent/60 font-serif">ॐ</div>
                <h2 className="font-serif text-3xl md:text-5xl leading-tight">
                  Your destiny is <span className="italic text-accent">already written.</span>
                </h2>
                <p className="text-foreground/60 text-base md:text-lg">
                  You just haven't read it yet.
                </p>
                <Link
                  data-testid="footer-cta-scan"
                  to="/scan"
                  className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-10 py-4 rounded-full font-bold text-base md:text-lg shadow-gold hover:scale-105 transition-transform"
                >
                  Show me
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
