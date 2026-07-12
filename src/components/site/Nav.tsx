import { Link } from "@tanstack/react-router";

export function SiteNav() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <span className="size-8 rounded-full border border-accent flex items-center justify-center">
            <span className="size-4 bg-accent rounded-full animate-pulse" />
          </span>
          <span className="font-serif text-lg sm:text-xl font-bold tracking-tight">ACHARYA AI</span>
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-foreground/60">
          <a href="/#shastra" className="hover:text-accent transition-colors">The Shastra</a>
          <a href="/#how" className="hover:text-accent transition-colors">How It Works</a>
          <a href="/#pricing" className="hover:text-accent transition-colors">Free Forever</a>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden md:inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-accent">
            <span className="size-1.5 rounded-full bg-accent animate-pulse" /> 22k+ seekers
          </span>
          <Link
            to="/scan"
            className="bg-accent text-accent-foreground px-4 sm:px-5 py-2 rounded-full text-[11px] sm:text-sm font-bold hover:scale-105 transition-transform shadow-gold-sm uppercase tracking-wider"
          >
            Scan now
          </Link>
        </div>
      </div>
    </nav>
  );
}
