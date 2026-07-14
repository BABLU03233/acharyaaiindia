import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import logoUrl from "@/assets/acharya-logo.svg";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const NAV_LINKS = [
  { href: "/#shastra", label: "The Shastra" },
  { href: "/#how", label: "How It Works" },
  { href: "/#pricing", label: "Pricing" },
];

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-3 group shrink-0 min-w-0">
      <img
        src={logoUrl}
        alt="Acharya AI"
        className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-md shadow-divine-sm"
      />
      <div className="flex flex-col leading-tight min-w-0">
        <span className="font-serif text-lg sm:text-2xl font-bold tracking-tight whitespace-nowrap">
          <span className="text-foreground">ACHARYA</span> <span className="text-accent">AI</span>
        </span>
        <span className="hidden sm:block text-[10px] text-foreground/55 -mt-0.5 whitespace-nowrap uppercase tracking-[0.12em]">
          Knowledge rooted in Sanatan Dharma
        </span>
      </div>
    </Link>
  );
}

export function SiteNav() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-accent/20 bg-gradient-to-r from-amber-50/90 via-white/90 to-blue-50/90 backdrop-blur-lg shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
        <Logo />

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-foreground/70">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="hover:text-accent transition-colors duration-300 relative group"
            >
              {link.label}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-accent group-hover:w-full transition-all duration-300"></span>
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span className="hidden lg:inline-flex items-center gap-2 rounded-full border border-accent/30 bg-gradient-to-r from-accent/5 to-accent/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-accent">
            <span className="size-2 rounded-full bg-accent animate-pulse" /> 22k+ seekers
          </span>
          <Link
            to="/scan"
            className="bg-gradient-divine text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold hover:shadow-divine transition-all duration-300 hover:scale-105 uppercase tracking-wide whitespace-nowrap"
          >
            Scan now
          </Link>

          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger
              aria-label="Open menu"
              className="md:hidden inline-flex items-center justify-center size-9 sm:size-10 rounded-full border border-accent/20 text-foreground hover:border-accent hover:text-accent transition-colors shrink-0"
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-4/5 sm:max-w-xs bg-card">
              <SheetTitle className="font-serif text-xl flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-divine text-gold text-base font-bold leading-none">
                  A
                </span>
                <span className="text-foreground">ACHARYA</span>{" "}
                <span className="text-accent">AI</span>
              </SheetTitle>
              <div className="mt-8 flex flex-col gap-1">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="px-3 py-3 rounded-lg text-base font-medium text-foreground/80 hover:bg-accent/5 hover:text-accent transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
                <Link
                  to="/scan"
                  className="mt-4 bg-gradient-divine text-white text-center px-6 py-3 rounded-full font-bold uppercase tracking-wide text-sm hover:shadow-divine transition-all"
                >
                  Scan now
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
