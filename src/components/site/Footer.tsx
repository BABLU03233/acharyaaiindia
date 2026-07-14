export function SiteFooter() {
  return (
    <footer className="py-10 sm:py-12 border-t border-accent/10 mt-12 bg-gradient-to-r from-white via-accent/5 to-white">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-xl bg-gradient-divine flex items-center justify-center shadow-divine-sm shrink-0 text-gold font-serif font-bold text-sm leading-none">
            A
          </div>
          <span className="font-serif text-lg font-bold bg-gradient-divine bg-clip-text text-transparent tracking-tight">
            ACHARYA AI
          </span>
        </div>
        <div className="text-xs text-foreground/55 text-center max-w-sm leading-relaxed">
          © 2026 Hasta Samudrika Labs · For guidance &amp; reflection only · No medical or death
          predictions
        </div>
        <div className="flex gap-3">
          <a
            href="https://x.com"
            target="_blank"
            rel="noreferrer"
            aria-label="Acharya AI on X"
            className="size-10 rounded-full border-2 border-accent/30 flex items-center justify-center text-lg hover:border-accent hover:text-white hover:bg-gradient-divine transition-all duration-300"
          >
            𝕏
          </a>
          <a
            href="https://www.instagram.com"
            target="_blank"
            rel="noreferrer"
            aria-label="Acharya AI on Instagram"
            className="size-10 rounded-full border-2 border-accent/30 flex items-center justify-center text-lg hover:border-accent hover:text-white hover:bg-gradient-divine transition-all duration-300"
          >
            ◈
          </a>
        </div>
      </div>
    </footer>
  );
}
