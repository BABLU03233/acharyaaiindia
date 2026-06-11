import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/site/Nav";
import { SiteFooter } from "@/components/site/Footer";
import { LiveTicker } from "@/components/site/LiveTicker";
import { PalmHologram } from "@/components/site/PalmHologram";
import { QuestionChips } from "@/components/site/QuestionChips";
import { Pricing } from "@/components/site/Pricing";
import { FAQ } from "@/components/site/FAQ";
import { Testimonials } from "@/components/site/Testimonials";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hasta AI — AI Palm Reading from Hasta Samudrika Shastra" },
      {
        name: "description",
        content:
          "Scan your palm with AI and get a personalized destiny reading rooted in the ancient Indian science of Hasta Samudrika Shastra. Free, unlimited.",
      },
      { property: "og:title", content: "Hasta AI — AI Palm Reading from Hasta Samudrika Shastra" },
      { property: "og:description", content: "Scan your palm. Unlock your future. Free AI-powered destiny readings rooted in ancient Indian palmistry." },
      { property: "og:url", content: "https://hasta-aura-reveal.lovable.app/" },
      { property: "twitter:title", content: "Hasta AI — AI Palm Reading from Hasta Samudrika Shastra" },
      { property: "twitter:description", content: "Scan your palm. Unlock your future. Free AI-powered destiny readings." },
    ],
    links: [{ rel: "canonical", href: "https://hasta-aura-reveal.lovable.app/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Hasta AI",
          url: "https://hasta-aura-reveal.lovable.app/",
          description: "AI-powered palm reading rooted in Hasta Samudrika Shastra.",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Hasta AI",
          url: "https://hasta-aura-reveal.lovable.app/",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            { "@type": "Question", name: "Is Hasta AI accurate?", acceptedAnswer: { "@type": "Answer", text: "Our AI is trained on principles of Hasta Samudrika Shastra, the ancient Indian science of palmistry, combined with modern computer vision. Readings should be treated as spiritual guidance and reflection — not absolute prediction." } },
            { "@type": "Question", name: "Do you store my palm image?", acceptedAnswer: { "@type": "Answer", text: "Your palm scans are processed securely and never shared. You can delete your scan history anytime from your account." } },
            { "@type": "Question", name: "Which hand should I scan?", acceptedAnswer: { "@type": "Answer", text: "Traditionally the dominant hand shows your present and future, while the non-dominant hand shows your inherent traits. You can choose either at the start of the scan." } },
            { "@type": "Question", name: "Will it tell me when I will die or about medical issues?", acceptedAnswer: { "@type": "Answer", text: "No. Hasta AI never provides death predictions or medical diagnoses. We focus on emotional, spiritual, career and relationship guidance." } },
            { "@type": "Question", name: "What payment methods do you accept?", acceptedAnswer: { "@type": "Answer", text: "Hasta AI is completely free. No payment is required." } },
          ],
        }),
      },
    ],
  }),
  component: Landing,
});

const RE_KHAS = [
  { num: "01", title: "Heart Line (Hridaya)", body: "The architecture of your emotions — depth of attachment, empathy, and emotional volatility revealed through curvature." },
  { num: "02", title: "Head Line (Matru)", body: "Cognitive density and decision-making style. The balance between logic, intuition and creative imagination." },
  { num: "03", title: "Life Line (Ayu)", body: "Not the length but the quality of energy. We analyze the sweep to map vitality and transformation cycles." },
  { num: "04", title: "Fate Line (Bhagya)", body: "The unfolding of karma through career and circumstance. Where it forks, your destiny pivots." },
  { num: "05", title: "Sun Line (Surya)", body: "Public visibility, fame and creative recognition. A deep Surya rekha forecasts moments of brilliance." },
  { num: "06", title: "Marriage Line (Vivaha)", body: "The pattern of significant partnerships, soul ties and emotional commitments across your timeline." },
];

function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <LiveTicker />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10 md:py-14">
        {/* ───────── Bento Hero ───────── */}
        <section className="grid grid-cols-12 grid-rows-6 gap-4 min-h-[820px]">
          {/* Primary Hero */}
          <div className="col-span-12 lg:col-span-8 row-span-4 bg-card rounded-3xl border border-border p-8 md:p-12 flex flex-col justify-end relative overflow-hidden group">
            <PalmHologram className="absolute inset-0 opacity-60 group-hover:opacity-90 transition-opacity duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-transparent pointer-events-none" />

            <div className="relative z-10 space-y-6 max-w-xl">
              <h1 className="text-5xl md:text-7xl font-serif leading-[1.05] text-balance">
                Your Palm Holds <span className="italic text-accent">Secrets</span> AI Can Reveal.
              </h1>
              <p className="text-foreground/70 text-base md:text-lg leading-relaxed text-pretty">
                Experience Hasta Samudrika Shastra evolved. Ancient Indian wisdom meets neural networks to map your destiny from the lines of your hand.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Link
                  to="/scan"
                  className="bg-accent text-accent-foreground px-8 py-4 rounded-full font-bold text-base md:text-lg hover:scale-105 transition-transform duration-300 shadow-gold"
                >
                  Scan Your Palm Now
                </Link>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    <div className="size-9 rounded-full border-2 border-background bg-secondary" />
                    <div className="size-9 rounded-full border-2 border-background bg-muted" />
                    <div className="size-9 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-[10px] font-bold">+12k</div>
                  </div>
                  <span className="text-[10px] text-foreground/40 font-medium tracking-widest uppercase">40-year lineage</span>
                </div>
              </div>
            </div>
          </div>

          {/* Side Reading Card */}
          <div className="col-span-12 lg:col-span-4 row-span-3 bg-card rounded-3xl border border-border p-8 flex flex-col justify-between animate-[float_6s_ease-in-out_infinite]">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-accent tracking-tighter px-2 py-1 border border-accent/30 rounded uppercase">Analysis v4.2</span>
                <span className="size-2 bg-accent rounded-full animate-pulse" />
              </div>
              <h3 className="font-serif text-2xl">The Life Rekha</h3>
              <p className="text-sm text-foreground/60 leading-relaxed italic">
                "Your energy flows with deep resilience. A split at the age of 28 suggests a major geographic shift that unlocks hidden prosperity."
              </p>
            </div>
            <div className="mt-4 p-4 rounded-xl bg-background/60 backdrop-blur border border-border space-y-2">
              <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-2/3 bg-accent animate-pulse" />
              </div>
              <div className="flex justify-between text-[10px] uppercase font-bold text-accent/80 tracking-widest">
                <span>Depth Analysis</span>
                <span>88% Accuracy</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="col-span-6 lg:col-span-2 row-span-2 bg-accent text-accent-foreground rounded-3xl p-6 flex flex-col justify-center items-center text-center gap-2 hover:bg-foreground transition-colors duration-500">
            <span className="text-4xl font-bold font-serif">22k+</span>
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Destinies Read</span>
          </div>
          <div className="col-span-6 lg:col-span-2 row-span-2 bg-card rounded-3xl border border-border p-6 flex flex-col justify-center items-center text-center gap-2">
            <span className="text-4xl font-bold font-serif text-accent">4.9</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">Shastra Score</span>
          </div>

          {/* Question marquee */}
          <div className="col-span-12 lg:col-span-4 row-span-1 bg-card rounded-3xl border border-border px-6 flex items-center gap-4 overflow-hidden">
            <span className="text-xs font-bold uppercase tracking-tighter text-foreground/40 shrink-0">Ask:</span>
            <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
              {["Will I become rich?", "When will I marry?", "Hidden talents?", "Career path?"].map((q) => (
                <Link
                  to="/scan"
                  key={q}
                  className="whitespace-nowrap bg-white/5 border border-border px-4 py-2 rounded-full text-xs hover:border-accent transition-colors"
                >
                  {q}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ───────── How It Works ───────── */}
        <section id="how" className="py-24">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">The Ritual</span>
            <h2 className="text-4xl md:text-5xl font-serif">Three steps to your destiny</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: "01", t: "Choose your hand", d: "Select dominant or non-dominant. Each reveals a different facet of your karma." },
              { n: "02", t: "Scan your palm", d: "Hold your palm steady. Our AI traces every line, mount and micro-marking in real time." },
              { n: "03", t: "Receive your reading", d: "A cinematic personalised destiny analysis written by the AI sage of Hasta Samudrika." },
            ].map((s) => (
              <div key={s.n} className="p-10 rounded-3xl border border-border bg-card/40 hover:border-accent/40 hover:bg-accent/5 transition-all">
                <div className="font-mono text-accent text-sm mb-6">{s.n}</div>
                <h3 className="font-serif text-2xl mb-3 italic">{s.t}</h3>
                <p className="text-foreground/60 text-sm leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ───────── Mapping the Rekhas ───────── */}
        <section id="shastra" className="py-24">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">Ancient meets Neural</span>
            <h2 className="text-4xl md:text-5xl font-serif">Mapping the Rekhas</h2>
            <p className="text-foreground/60">
              Our AI identifies over 150 unique micro-markings on your palm, referencing ancient Samudrika texts for hyper-personalized accuracy.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {RE_KHAS.map((r) => (
              <div key={r.num} className="group p-8 rounded-3xl border border-border bg-card/40 hover:bg-accent/5 transition-all">
                <div className="size-12 rounded-full bg-accent/10 border border-accent/20 mb-6 flex items-center justify-center text-accent font-bold font-mono text-sm">{r.num}</div>
                <h4 className="text-xl font-serif mb-3 italic">{r.title}</h4>
                <p className="text-sm text-foreground/60 leading-relaxed">{r.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ───────── Ask the Ancients ───────── */}
        <section className="py-24">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">Inquire</span>
            <h2 className="text-4xl md:text-5xl font-serif">Ask the ancients</h2>
            <p className="text-foreground/60">Pick a question or type your own — your palm carries the answer.</p>
          </div>
          <QuestionChips />
        </section>

        <Testimonials />

        <Pricing />

        <FAQ />

        {/* Final CTA */}
        <section className="py-24">
          <div className="relative rounded-[32px] border border-accent/30 bg-card overflow-hidden p-12 md:p-20 text-center">
            <div className="absolute inset-0 bg-aura pointer-events-none" />
            <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
              <h2 className="font-serif text-4xl md:text-6xl leading-tight">
                Your destiny is <span className="italic text-accent">already written.</span>
              </h2>
              <p className="text-foreground/60 text-lg">Scan your palm. Unlock your future.</p>
              <Link
                to="/scan"
                className="inline-block bg-accent text-accent-foreground px-10 py-5 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-gold"
              >
                Begin Your Reading
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
