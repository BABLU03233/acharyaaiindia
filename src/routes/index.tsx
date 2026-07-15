import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/site/Nav";
import { SiteFooter } from "@/components/site/Footer";
import { LiveTicker } from "@/components/site/LiveTicker";
import { PalmHologram } from "@/components/site/PalmHologram";
import { QuestionChips } from "@/components/site/QuestionChips";

import { FAQ } from "@/components/site/FAQ";
import { Testimonials } from "@/components/site/Testimonials";
import { OmParallax } from "@/components/site/OmParallax";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Acharya AI — AI Palm Reading from Hasta Samudrika Shastra" },
      {
        name: "description",
        content:
          "Scan your palm with AI and get a personalized destiny reading rooted in the ancient Indian science of Hasta Samudrika Shastra. Free to start, no card required.",
      },
      {
        property: "og:title",
        content: "Acharya AI — AI Palm Reading from Hasta Samudrika Shastra",
      },
      {
        property: "og:description",
        content:
          "Scan your palm. Unlock your future. AI-powered destiny readings rooted in ancient Indian palmistry — free to start.",
      },
      { property: "og:url", content: "https://hasta-aura-reveal.lovable.app/" },
      {
        property: "twitter:title",
        content: "Acharya AI — AI Palm Reading from Hasta Samudrika Shastra",
      },
      {
        property: "twitter:description",
        content: "Scan your palm. Unlock your future. AI-powered destiny readings — free to start.",
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
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Acharya AI",
          url: "https://hasta-aura-reveal.lovable.app/",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "Is Acharya AI accurate?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Our AI is trained on principles of Hasta Samudrika Shastra, the ancient Indian science of palmistry, combined with modern computer vision. Readings should be treated as spiritual guidance and reflection — not absolute prediction.",
              },
            },
            {
              "@type": "Question",
              name: "Do you store my palm image?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Your palm scans are processed securely and never shared. You can delete your scan history anytime from your account.",
              },
            },
            {
              "@type": "Question",
              name: "Which hand should I scan?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Traditionally the dominant hand shows your present and future, while the non-dominant hand shows your inherent traits. You can choose either at the start of the scan.",
              },
            },
            {
              "@type": "Question",
              name: "Will it tell me when I will die or about medical issues?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "No. Acharya AI never provides death predictions or medical diagnoses. We focus on emotional, spiritual, career and relationship guidance.",
              },
            },
            {
              "@type": "Question",
              name: "What payment methods do you accept?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Acharya AI is free to start, with 5 palm scans a month. For unlimited scans and advanced readings, we accept all major cards, UPI, and net banking via Razorpay for India, and Stripe for international payments.",
              },
            },
          ],
        }),
      },
    ],
  }),
  component: Landing,
});

const RE_KHAS = [
  {
    num: "01",
    title: "Heart Line (Hridaya)",
    body: "The architecture of your emotions — depth of attachment, empathy, and emotional volatility revealed through curvature.",
  },
  {
    num: "02",
    title: "Head Line (Matru)",
    body: "Cognitive density and decision-making style. The balance between logic, intuition and creative imagination.",
  },
  {
    num: "03",
    title: "Life Line (Ayu)",
    body: "Not the length but the quality of energy. We analyze the sweep to map vitality and transformation cycles.",
  },
  {
    num: "04",
    title: "Fate Line (Bhagya)",
    body: "The unfolding of karma through career and circumstance. Where it forks, your destiny pivots.",
  },
  {
    num: "05",
    title: "Sun Line (Surya)",
    body: "Public visibility, fame and creative recognition. A deep Surya rekha forecasts moments of brilliance.",
  },
  {
    num: "06",
    title: "Marriage Line (Vivaha)",
    body: "The pattern of significant partnerships, soul ties and emotional commitments across your timeline.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <LiveTicker />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10 md:py-14">
        {/* ───────── Bento Hero ───────── */}
        <section className="grid grid-cols-12 gap-4 lg:grid-rows-6 lg:min-h-[820px]">
          {/* Primary Hero */}
          <div className="col-span-12 lg:col-span-8 lg:row-span-4 bg-card rounded-3xl border border-border p-6 sm:p-8 md:p-12 flex flex-col lg:justify-end relative overflow-hidden group lg:min-h-0">
            {/* Desktop: palm anchored on the right side, text has its own readable panel on the left */}
            <PalmHologram className="hidden lg:block absolute top-0 right-0 h-full w-1/2 opacity-95 rounded-l-none" />
            <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-card via-card/95 to-transparent pointer-events-none" />

            {/* Mobile/tablet: contained image banner, text lives on solid card below for guaranteed contrast */}
            <PalmHologram className="lg:hidden mb-6 h-52 sm:h-64" />

            <div className="relative z-10 space-y-4 sm:space-y-6 max-w-xl">
              <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-serif leading-[1.1] lg:leading-[1.05] text-balance">
                Your Palm Holds <span className="italic text-accent">Secrets</span> AI Can Reveal.
              </h1>
              <p className="text-foreground/70 text-base md:text-lg leading-relaxed text-pretty">
                Experience Hasta Samudrika Shastra evolved. Ancient Indian wisdom meets neural
                networks to map your destiny from the lines of your hand.
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
                    <div className="size-9 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-[10px] font-bold">
                      +12k
                    </div>
                  </div>
                  <span className="text-[10px] text-foreground/55 font-medium tracking-widest uppercase">
                    40-year lineage
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Side Reading Card */}
          <div className="col-span-12 lg:col-span-4 lg:row-span-3 bg-card rounded-3xl border border-border p-8 flex flex-col justify-between animate-[float_6s_ease-in-out_infinite]">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-accent tracking-tighter px-2 py-1 border border-accent/30 rounded uppercase">
                  Analysis v4.2
                </span>
                <span className="size-2 bg-accent rounded-full animate-pulse" />
              </div>
              <h3 className="font-serif text-2xl">The Life Rekha</h3>
              <p className="text-sm text-foreground/60 leading-relaxed italic">
                "Your energy flows with deep resilience. A split at the age of 28 suggests a major
                geographic shift that unlocks hidden prosperity."
              </p>
            </div>
            <div className="mt-4 p-4 rounded-xl bg-background/60 backdrop-blur border border-border space-y-2">
              <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full w-2/3 bg-accent animate-pulse" />
              </div>
              <div className="flex justify-between text-[10px] uppercase font-bold text-accent/80 tracking-widest">
                <span>Depth Analysis</span>
                <span>88% Accuracy</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="col-span-6 lg:col-span-2 lg:row-span-2 bg-accent text-accent-foreground rounded-3xl p-6 flex flex-col justify-center items-center text-center gap-2 hover:bg-foreground transition-colors duration-500">
            <span className="text-4xl font-bold font-serif">22k+</span>
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">
              Destinies Read
            </span>
          </div>
          <div className="col-span-6 lg:col-span-2 lg:row-span-2 bg-card rounded-3xl border border-border p-6 flex flex-col justify-center items-center text-center gap-2">
            <span className="text-4xl font-bold font-serif text-accent">4.9</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/55">
              Shastra Score
            </span>
          </div>

          {/* Question marquee */}
          <div className="col-span-12 lg:col-span-4 lg:row-span-1 bg-card rounded-3xl border border-border px-6 py-3 lg:py-0 flex items-center gap-4 overflow-hidden">
            <span className="text-xs font-bold uppercase tracking-tighter text-foreground/55 shrink-0">
              Ask:
            </span>
            <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
              {["Will I become rich?", "When will I marry?", "Hidden talents?", "Career path?"].map(
                (q) => (
                  <Link
                    to="/scan"
                    key={q}
                    aria-label={`Scan your palm to explore: ${q}`}
                    className="whitespace-nowrap bg-accent/5 border border-border px-4 py-2 rounded-full text-xs hover:border-accent transition-colors"
                  >
                    {q}
                  </Link>
                ),
              )}
            </div>
          </div>
        </section>

        {/* ───────── How It Works ───────── */}
        <section id="how" className="relative overflow-hidden py-24">
          <OmParallax className="absolute -top-16 left-1/2 -translate-x-1/2 -z-10" speed={0.12} />
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">
              The Ritual
            </span>
            <h2 className="text-4xl md:text-5xl font-serif">Three steps to your destiny</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                n: "01",
                t: "Choose your hand",
                d: "Select dominant or non-dominant. Each reveals a different facet of your karma.",
              },
              {
                n: "02",
                t: "Scan your palm",
                d: "Hold your palm steady. Our AI traces every line, mount and micro-marking in real time.",
              },
              {
                n: "03",
                t: "Receive your reading",
                d: "A cinematic personalised destiny analysis written by the AI sage of Hasta Samudrika.",
              },
            ].map((s) => (
              <div
                key={s.n}
                className="p-10 rounded-3xl border border-border bg-card/40 hover:border-accent/40 hover:bg-accent/5 transition-all"
              >
                <div className="font-mono text-accent text-sm mb-6">{s.n}</div>
                <h3 className="font-serif text-2xl mb-3 italic">{s.t}</h3>
                <p className="text-foreground/60 text-sm leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ───────── Mapping the Rekhas ───────── */}
        <section className="py-24">
          <div className="section-surface rounded-[32px] p-8 md:p-10">
            <div className="text-center max-w-2xl mx-auto mb-10 space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">
                Why the experience feels different
              </span>
              <h2 className="text-4xl md:text-5xl font-serif">
                Grounded guidance, not generic fortune-telling
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                {
                  title: "Thoughtful pacing",
                  text: "The flow feels calm, clear, and guided from scan to reading instead of rushed or overloaded.",
                },
                {
                  title: "Visual clarity",
                  text: "Every step is designed to feel premium, readable, and easy to follow on mobile or desktop.",
                },
                {
                  title: "Human-centered insight",
                  text: "The guidance is framed as reflection and spiritual direction, not fear-based prediction.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-border bg-background/40 p-6"
                >
                  <h3 className="font-serif text-xl mb-2">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-foreground/60">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="shastra" className="relative overflow-hidden py-24">
          <OmParallax className="absolute -top-24 right-0 -z-10" speed={-0.1} />
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">
              Ancient meets Neural
            </span>
            <h2 className="text-4xl md:text-5xl font-serif">Mapping the Rekhas</h2>
            <p className="text-foreground/60">
              Our AI identifies over 150 unique micro-markings on your palm, referencing ancient
              Samudrika texts for hyper-personalized accuracy.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {RE_KHAS.map((r) => (
              <div
                key={r.num}
                className="group p-8 rounded-3xl border border-border bg-card/40 hover:bg-accent/5 transition-all"
              >
                <div className="size-12 rounded-full bg-accent/10 border border-accent/20 mb-6 flex items-center justify-center text-accent font-bold font-mono text-sm">
                  {r.num}
                </div>
                <h4 className="text-xl font-serif mb-3 italic">{r.title}</h4>
                <p className="text-sm text-foreground/60 leading-relaxed">{r.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ───────── Ask the Ancients ───────── */}
        <section className="py-24">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">
              Inquire
            </span>
            <h2 className="text-4xl md:text-5xl font-serif">Ask the ancients</h2>
            <p className="text-foreground/60">
              Pick a question or type your own — your palm carries the answer.
            </p>
          </div>
          <QuestionChips />
        </section>

        <Testimonials />

        <FAQ />

        {/* Final CTA */}
        <section className="py-24">
          <div className="relative rounded-[32px] border border-accent/30 bg-card overflow-hidden p-12 md:p-20 text-center">
            <div className="absolute inset-0 bg-aura pointer-events-none" />
            <OmParallax
              className="absolute -top-10 left-1/2 -translate-x-1/2"
              sizeClassName="text-[220px]"
              speed={0.2}
            />
            <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
              <span className="text-2xl text-accent/70" aria-hidden>
                ॐ
              </span>
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
