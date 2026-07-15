import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/cancel")({
  head: () => ({
    meta: [
      { title: "Payment Canceled — Acharya AI" },
      { name: "description", content: "Your payment has been canceled." },
    ],
  }),
  component: CancelPage,
});

function CancelPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-4">
          <div className="text-6xl mb-4">✕</div>
          <h1 className="text-4xl font-serif mb-2">Payment Canceled</h1>
          <p className="text-foreground/70">
            Your payment has been canceled. Your free account is still active and you can continue
            using Acharya AI.
          </p>
        </div>

        <div className="bg-accent/10 border border-accent/20 rounded-lg p-6">
          <p className="text-sm text-foreground/70 mb-4">
            Having trouble with payment? Our support team is here to help.
          </p>
          <ul className="text-left space-y-2 text-sm text-foreground/80">
            <li className="flex items-center gap-2">
              <span className="text-accent">•</span>
              <span>Your free account remains active</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-accent">•</span>
              <span>You can try again anytime</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-accent">•</span>
              <span>30-day money-back guarantee applies</span>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <Link
            to="/"
            className="w-full inline-block bg-accent text-accent-foreground py-3 rounded-lg font-semibold hover:bg-accent/90 transition-all"
          >
            Back to Home
          </Link>
          <Link
            to="/scan"
            className="w-full inline-block bg-accent/20 text-foreground py-3 rounded-lg font-semibold hover:bg-accent/30 transition-all"
          >
            Continue with Free Version
          </Link>
        </div>

        <div className="text-xs text-foreground/60">
          <p>Need help?</p>
          <a href="mailto:support@acharyaai.in" className="text-accent hover:underline">
            Contact our support team
          </a>
        </div>
      </div>
    </div>
  );
}
