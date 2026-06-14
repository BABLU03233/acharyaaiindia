import { Link } from "@tanstack/react-router";

export function SiteNav() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="size-8 rounded-full border border-accent flex items-center justify-center">
            <span className="size-4 bg-accent rounded-full animate-pulse" />
          </span>
          <span className="font-serif text-xl font-bold tracking-tight">ACHARYA AI</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-foreground/60">
          <a href="/#shastra" className="hover:text-accent transition-colors">The Shastra</a>
          <a href="/#how" className="hover:text-accent transition-colors">How It Works</a>
          <a href="/#pricing" className="hover:text-accent transition-colors">Free Forever</a>
        </div>
        <div className="flex items-center gap-3">
          <button className="hidden sm:inline text-sm font-medium hover:text-accent">Sign In</button>
          <Link
            to="/scan"
            className="bg-accent text-accent-foreground px-5 py-2 rounded-full text-xs sm:text-sm font-bold hover:scale-105 transition-transform shadow-gold-sm uppercase tracking-wider"
          >
            Scan your palm now
          </Link>
        </div>
      </div>
    </nav>
  );
}
