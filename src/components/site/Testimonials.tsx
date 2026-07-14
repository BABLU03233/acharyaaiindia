const TESTIMONIALS = [
  {
    name: "Priya S.",
    city: "Mumbai",
    text: "It told me about my career pivot before I even decided. Genuinely chilling.",
    score: "9.4",
  },
  {
    name: "Rohit M.",
    city: "Bengaluru",
    text: "Read my marriage line accurately. Way deeper than any astrology app I've tried.",
    score: "9.1",
  },
  {
    name: "Anisha K.",
    city: "Dubai",
    text: "The cinematic scan animation is breathtaking. Worth every rupee.",
    score: "9.7",
  },
];

export function Testimonials() {
  return (
    <section className="py-24">
      <div className="text-center mb-12 space-y-4">
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">
          22,000+ Readings Delivered
        </span>
        <h2 className="text-4xl md:text-5xl font-serif">Voices from seekers</h2>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {TESTIMONIALS.map((t) => (
          <div
            key={t.name}
            className="p-8 rounded-3xl border border-border bg-card/50 hover:border-accent/30 transition-all"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="text-accent text-sm tracking-widest">✦ ✦ ✦ ✦ ✦</div>
              <div className="font-serif text-2xl text-accent">{t.score}</div>
            </div>
            <p className="text-foreground/80 text-lg leading-relaxed mb-6 font-serif italic">
              "{t.text}"
            </p>
            <div className="text-sm">
              <div className="font-bold">{t.name}</div>
              <div className="text-foreground/55 text-xs uppercase tracking-widest">{t.city}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
