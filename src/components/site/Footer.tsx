export function SiteFooter() {
  return (
    <footer className="py-10 border-t border-border mt-12">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2 opacity-80">
          <span className="size-6 border border-accent rounded-full flex items-center justify-center">
            <span className="size-2 bg-accent rounded-full" />
          </span>
          <span className="font-serif text-lg font-bold tracking-tight">ACHARYA AI</span>
        </div>
        <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground/30 text-center">
          © 2026 Hasta Samudrika Labs · For guidance & reflection only · No medical or death predictions
        </div>
        <div className="flex gap-3">
          <a href="https://x.com" target="_blank" rel="noreferrer" className="size-10 rounded-full border border-border flex items-center justify-center text-lg hover:border-accent hover:text-accent transition-all">𝕏</a>
          <a href="https://www.instagram.com" target="_blank" rel="noreferrer" className="size-10 rounded-full border border-border flex items-center justify-center text-lg hover:border-accent hover:text-accent transition-all">◈</a>
        </div>
      </div>
    </footer>
  );
}
