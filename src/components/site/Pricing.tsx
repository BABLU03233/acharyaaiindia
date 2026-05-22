export function Pricing() {
  return (
    <section id="pricing" className="py-24">
      <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">Unlock Your Destiny</span>
        <h2 className="text-4xl md:text-5xl font-serif">Choose your spiritual access</h2>
        <p className="text-foreground/60">Every plan includes cinematic AI palm scan, line-tracing animation, and Hasta Samudrika insights.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-10 rounded-3xl border border-border bg-card/50 flex flex-col justify-between hover:border-accent/40 transition-all">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-foreground/40">Deep Insight</span>
            <h3 className="text-3xl font-serif italic">Single Path</h3>
            <p className="text-foreground/60 text-sm">One full detailed reading with AI line-tracing and spiritual summary.</p>
            <ul className="space-y-2 pt-4 text-sm text-foreground/70">
              <li>✧ Full personalized reading</li>
              <li>✧ All major lines analyzed</li>
              <li>✧ 12-page destiny PDF</li>
            </ul>
          </div>
          <div className="mt-12">
            <div className="text-5xl font-bold mb-6 font-serif">₹69</div>
            <button className="w-full py-4 border border-border rounded-xl font-bold hover:bg-white/5 transition-all">Purchase Reading</button>
          </div>
        </div>

        <div className="p-10 rounded-3xl border-2 border-accent bg-accent/5 flex flex-col justify-between relative shadow-gold">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">Most Popular</div>
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-accent">Master Shastra</span>
            <h3 className="text-3xl font-serif italic">The Monthly</h3>
            <ul className="space-y-3 pt-2 text-sm">
              <li className="flex items-center gap-2"><span className="text-accent">✧</span> Unlimited palm scans</li>
              <li className="flex items-center gap-2"><span className="text-accent">✧</span> Daily fortune updates</li>
              <li className="flex items-center gap-2"><span className="text-accent">✧</span> AI Spiritual Coach</li>
              <li className="flex items-center gap-2"><span className="text-accent">✧</span> Compatibility scanner</li>
              <li className="flex items-center gap-2"><span className="text-accent">✧</span> Lucky days & wealth guidance</li>
            </ul>
          </div>
          <div className="mt-12">
            <div className="text-5xl font-bold mb-6 font-serif">₹299<span className="text-sm font-normal text-foreground/40">/mo</span></div>
            <button className="w-full py-4 bg-accent text-accent-foreground rounded-xl font-bold hover:scale-[1.02] transition-all">Subscribe Now</button>
          </div>
        </div>

        <div className="p-10 rounded-3xl border border-border bg-card/50 flex flex-col justify-between hover:border-accent/40 transition-all">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-foreground/40">Premium</span>
            <h3 className="text-3xl font-serif italic">Full Reading</h3>
            <p className="text-foreground/60 text-sm">Advanced destiny insights with relationship compatibility analysis.</p>
            <ul className="space-y-2 pt-4 text-sm text-foreground/70">
              <li>✧ Everything in Single Path</li>
              <li>✧ Compatibility analysis</li>
              <li>✧ Career & wealth deep-dive</li>
            </ul>
          </div>
          <div className="mt-12">
            <div className="text-5xl font-bold mb-6 font-serif">₹99</div>
            <button className="w-full py-4 border border-border rounded-xl font-bold hover:bg-white/5 transition-all">Unlock Premium</button>
          </div>
        </div>
      </div>
    </section>
  );
}
