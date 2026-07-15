import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Acharya AI Premium" },
      { name: "description", content: "Complete your purchase and unlock premium features." },
      { property: "og:title", content: "Checkout — Acharya AI Premium" },
    ],
  }),
  component: CheckoutPage,
});

interface CheckoutParams {
  plan?: "monthly" | "yearly" | "one-time";
}

/** Stable pseudo-identity for this browser — this app has no sign-in flow yet. */
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

function CheckoutPage() {
  const router = useRouter();
  const searchParams = new URLSearchParams(window.location.search);
  const plan = (searchParams.get("plan") || "monthly") as CheckoutParams["plan"];

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect to home if plan is invalid
  useEffect(() => {
    if (!["monthly", "yearly", "one-time"].includes(plan || "")) {
      router.navigate({ to: "/" });
    }
  }, [plan, router]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("hasta:checkout-email");
      if (saved) setEmail(saved);
    } catch {
      // ignore storage failures
    }
  }, []);

  const priceMap: Record<NonNullable<CheckoutParams["plan"]>, string> = {
    monthly: import.meta.env.VITE_STRIPE_PREMIUM_MONTHLY_PRICE || "",
    yearly: import.meta.env.VITE_STRIPE_PREMIUM_YEARLY_PRICE || "",
    "one-time": import.meta.env.VITE_STRIPE_ONE_TIME_PRICE || "",
  };
  const modeMap: Record<NonNullable<CheckoutParams["plan"]>, "payment" | "subscription"> = {
    monthly: "subscription",
    yearly: "subscription",
    "one-time": "payment",
  };
  const activePlan = plan || "monthly";
  const priceId = priceMap[activePlan];
  const priceNotConfigured = !priceId;

  const handleCheckout = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email address so we can send your receipt.");
      return;
    }
    if (priceNotConfigured) {
      setError("This plan isn't available for checkout yet — please try again shortly.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      try {
        localStorage.setItem("hasta:checkout-email", email);
      } catch {
        // ignore storage failures
      }

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: getOrCreateAnonId(),
          email,
          priceId,
          mode: modeMap[activePlan],
          successUrl: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/cancel`,
          metadata: { plan: activePlan },
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || "Failed to create checkout session");
      }

      const data = (await response.json()) as { url: string; sessionId: string };

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Stripe did not return a checkout URL");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  const planDetails = {
    monthly: {
      name: "Premium Monthly",
      price: "$9.99",
      period: "per month",
      description: "Unlimited palm scans and advanced readings",
    },
    yearly: {
      name: "Premium Yearly",
      price: "$99.99",
      period: "per year",
      description: "Save 17% with annual billing",
    },
    "one-time": {
      name: "Premium Reading",
      price: "$4.99",
      period: "one-time",
      description: "Single advanced reading with full analysis",
    },
  };

  const details = planDetails[activePlan];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-serif mb-2">{details.name}</h1>
          <p className="text-foreground/70">{details.description}</p>
        </div>

        <div className="bg-card border border-accent/20 rounded-lg p-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-foreground/70">Price:</span>
            <span className="text-2xl font-bold">{details.price}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-foreground/70">Billing:</span>
            <span className="text-foreground">{details.period}</span>
          </div>

          <ul className="space-y-2 pt-4 border-t border-accent/10">
            <li className="flex items-center gap-2 text-sm">
              <span className="text-accent">✧</span>
              Unlimited palm scans
            </li>
            <li className="flex items-center gap-2 text-sm">
              <span className="text-accent">✧</span>
              Advanced reading analysis
            </li>
            <li className="flex items-center gap-2 text-sm">
              <span className="text-accent">✧</span>
              30-day money-back guarantee
            </li>
          </ul>
        </div>

        <div className="space-y-2">
          <label htmlFor="checkout-email" className="text-sm font-medium text-foreground/80">
            Email address
          </label>
          <input
            id="checkout-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-card border border-border rounded-lg px-4 py-3 text-sm outline-none focus:border-accent"
          />
          <p className="text-xs text-foreground/50">
            We'll send your receipt and unlock premium access here.
          </p>
        </div>

        {priceNotConfigured && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-700 p-4 rounded-lg text-sm">
            This plan's Stripe price isn't configured yet in the environment variables.
          </div>
        )}

        {error && (
          <div className="bg-destructive/20 text-destructive p-4 rounded-lg text-sm">{error}</div>
        )}

        <button
          onClick={handleCheckout}
          disabled={loading || priceNotConfigured}
          className="w-full bg-accent text-accent-foreground py-3 rounded-lg font-semibold hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? "Processing..." : "Continue to Payment"}
        </button>

        <div className="text-center text-xs text-foreground/60">
          <p>Payments secured by Stripe • 30-day money-back guarantee</p>
        </div>
      </div>
    </div>
  );
}
