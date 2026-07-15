import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteNav } from "@/components/site/Nav";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Acharya AI Premium" },
      { name: "description", content: "Unlock your complete palm reading — secure test-mode checkout via Razorpay." },
    ],
  }),
  component: CheckoutPage,
});

type PlanKey = "monthly" | "yearly" | "one-time";

const PLANS: Record<
  PlanKey,
  { name: string; price: string; period: string; tagline: string; features: string[]; badge?: string }
> = {
  "one-time": {
    name: "Full Reading",
    price: "₹49",
    period: "one-time",
    tagline: "Unlock this palm's complete Shastra reading",
    features: [
      "Full destiny analysis",
      "Career, wealth, love, karma",
      "Lifetime access to this reading",
    ],
  },
  monthly: {
    name: "Premium Monthly",
    price: "₹699",
    period: "per month",
    tagline: "Unlimited readings + unlimited Acharya chat",
    features: [
      "Unlimited palm scans",
      "Unlimited Acharya conversations",
      "All future readings unlocked",
      "Priority processing",
    ],
    badge: "Most Popular",
  },
  yearly: {
    name: "Premium Yearly",
    price: "₹5,999",
    period: "per year",
    tagline: "Everything in Monthly · Save 28%",
    features: [
      "Everything in Monthly",
      "Save ₹2,389 vs monthly",
      "Priority support",
      "Early access to new features",
    ],
    badge: "Best Value",
  },
};

/** Stable pseudo-identity for this browser — the app has no sign-in flow. */
function getOrCreateAnonId(): string {
  const key = "hasta:anon-id";
  try {
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `anon-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(key, id);
    return id;
  } catch {
    return `anon-${Date.now()}`;
  }
}

/** Inject Razorpay's checkout.js exactly once. */
function loadRazorpayCheckout(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if ((window as unknown as { Razorpay?: unknown }).Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void; on?: (evt: string, cb: (arg: unknown) => void) => void };
  }
}

function CheckoutPage() {
  const searchParams =
    typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const initialPlan = (searchParams.get("plan") || "monthly") as PlanKey;
  const [plan, setPlan] = useState<PlanKey>(
    (["monthly", "yearly", "one-time"] as const).includes(initialPlan) ? initialPlan : "monthly",
  );

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Preload Razorpay's checkout script so the click is instant.
    void loadRazorpayCheckout();
    try {
      const savedEmail = localStorage.getItem("hasta:checkout-email");
      if (savedEmail) setEmail(savedEmail);
      const savedName = localStorage.getItem("hasta:checkout-name");
      if (savedName) setName(savedName);
    } catch {
      /* ignore */
    }
  }, []);

  const details = PLANS[plan];

  const startCheckout = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email so we can send your receipt.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      try {
        localStorage.setItem("hasta:checkout-email", email);
        if (name.trim()) localStorage.setItem("hasta:checkout-name", name.trim());
      } catch {
        /* ignore */
      }

      const orderRes = await fetch("/api/razorpay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          email,
          userId: getOrCreateAnonId(),
          name: name.trim() || undefined,
        }),
      });
      if (!orderRes.ok) {
        const body = (await orderRes.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || "Failed to start checkout");
      }
      const data = (await orderRes.json()) as {
        order: { id: string; amount: number; currency: string; receipt: string };
        plan: { key: PlanKey; label: string; description: string; period: string };
        key_id: string;
        name?: string;
      };

      const scriptOk = await loadRazorpayCheckout();
      if (!scriptOk || typeof window === "undefined" || !window.Razorpay) {
        throw new Error("Razorpay checkout could not load. Check your network and retry.");
      }

      const rz = new window.Razorpay({
        key: data.key_id,
        amount: data.order.amount,
        currency: data.order.currency,
        name: "Acharya AI",
        description: data.plan.label,
        order_id: data.order.id,
        image: "/logo.png",
        prefill: { email, name: name.trim() || undefined, contact: phone.trim() || undefined },
        theme: { color: "#d99c3c" },
        modal: {
          ondismiss: () => setLoading(false),
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          const params = new URLSearchParams({
            payment_id: response.razorpay_payment_id,
            order_id: response.razorpay_order_id,
            signature: response.razorpay_signature,
            plan,
          });
          window.location.href = `/success?${params.toString()}`;
        },
      });
      rz.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteNav />
      <main className="flex-1 max-w-5xl mx-auto w-full px-5 py-10 md:py-16">
        <div className="text-center space-y-3 mb-10">
          <span
            data-testid="checkout-badge"
            className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent"
          >
            Unlock the full reading
          </span>
          <h1 className="text-3xl md:text-5xl font-serif">Choose your path, seeker</h1>
          <p className="text-foreground/60 text-sm md:text-base max-w-lg mx-auto">
            Secure test-mode payment via Razorpay. Cancel anytime · 30-day money-back guarantee.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-10">
          {(Object.keys(PLANS) as PlanKey[]).map((k) => {
            const p = PLANS[k];
            const selected = plan === k;
            return (
              <button
                key={k}
                type="button"
                data-testid={`checkout-plan-${k}`}
                onClick={() => setPlan(k)}
                className={
                  "text-left relative rounded-3xl border-2 p-6 flex flex-col transition-all " +
                  (selected
                    ? "border-accent bg-accent/5 shadow-gold md:scale-105"
                    : "border-border bg-card hover:border-accent/60")
                }
              >
                {p.badge && (
                  <span className="absolute -top-3 left-6 bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                    {p.badge}
                  </span>
                )}
                <h3 className="font-serif text-xl">{p.name}</h3>
                <p className="text-xs text-foreground/60 mt-1">{p.tagline}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{p.price}</span>
                  <span className="text-sm text-foreground/60">{p.period}</span>
                </div>
                <ul className="mt-4 space-y-1.5 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground/80">
                      <span className="text-accent mt-0.5">✧</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div
                  className={
                    "mt-4 text-center py-2 rounded-full font-bold text-xs " +
                    (selected
                      ? "bg-accent text-accent-foreground"
                      : "bg-accent/10 text-accent")
                  }
                >
                  {selected ? "Selected" : "Choose"}
                </div>
              </button>
            );
          })}
        </div>

        <div className="max-w-lg mx-auto space-y-4 rounded-3xl border border-accent/20 bg-card p-6 md:p-8">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-accent font-bold">
                Your selection
              </div>
              <div className="font-serif text-xl mt-1">{details.name}</div>
            </div>
            <div className="text-right">
              <div className="font-serif text-3xl text-accent">{details.price}</div>
              <div className="text-[11px] text-foreground/50 uppercase tracking-widest">
                {details.period}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 pt-2">
            <input
              data-testid="checkout-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name (optional)"
              className="bg-background border border-border rounded-2xl px-4 py-3 text-sm outline-none focus:border-accent"
            />
            <input
              data-testid="checkout-email-input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email for receipt"
              className="bg-background border border-border rounded-2xl px-4 py-3 text-sm outline-none focus:border-accent"
            />
            <input
              data-testid="checkout-phone-input"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone (optional, for UPI)"
              className="bg-background border border-border rounded-2xl px-4 py-3 text-sm outline-none focus:border-accent"
            />
          </div>

          {error && (
            <div
              data-testid="checkout-error"
              className="bg-destructive/10 text-destructive border border-destructive/30 rounded-xl px-4 py-3 text-sm"
            >
              {error}
            </div>
          )}

          <button
            data-testid="checkout-pay-button"
            type="button"
            onClick={startCheckout}
            disabled={loading}
            className="w-full bg-accent text-accent-foreground py-4 rounded-full font-bold text-base hover:scale-[1.02] transition-transform shadow-gold disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? "Opening Razorpay…" : `Pay ${details.price} securely →`}
          </button>

          <div className="flex items-center justify-center gap-2 text-[11px] text-foreground/50 uppercase tracking-widest font-mono">
            <span>Razorpay Test Mode</span>
            <span>·</span>
            <span>UPI · Cards · Netbanking</span>
          </div>
          <div className="text-[11px] text-center text-foreground/40 leading-relaxed">
            Test card: <span className="font-mono text-foreground/70">4111 1111 1111 1111</span> · any CVV · any future expiry ·
            OTP <span className="font-mono text-foreground/70">1111</span>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link to="/" className="text-sm text-foreground/50 hover:text-accent underline underline-offset-4">
            ← Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}
