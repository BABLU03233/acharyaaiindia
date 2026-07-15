import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/success")({
  head: () => ({
    meta: [
      { title: "Payment Successful — Acharya AI" },
      { name: "description", content: "Your payment has been processed successfully." },
    ],
  }),
  component: SuccessPage,
});

type VerifyStatus = "complete" | "pending" | "failed";

function SuccessPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(true);
  const [status, setStatus] = useState<VerifyStatus | "unknown">("unknown");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("session_id");
    setSessionId(id);

    if (id) {
      verifyPayment(id);
    } else {
      setVerifying(false);
      setStatus("unknown");
    }
  }, []);

  const verifyPayment = async (id: string) => {
    try {
      const response = await fetch(`/api/verify-payment?session_id=${id}`, {
        method: "GET",
      });

      if (response.ok) {
        const data = (await response.json()) as { status: VerifyStatus };
        setStatus(data.status);
        if (data.status === "complete") {
          try {
            localStorage.setItem("hasta:unlocked", "true");
          } catch {
            /* ignore */
          }
        }
      } else {
        setStatus("unknown");
      }
    } catch (error) {
      console.error("Verification error:", error);
      setStatus("unknown");
    } finally {
      setVerifying(false);
    }
  };

  const confirmed = status === "complete";
  const failed = status === "failed";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center space-y-8">
        {verifying ? (
          <div className="space-y-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
            <p className="text-foreground/60">Verifying your payment...</p>
          </div>
        ) : confirmed ? (
          <>
            <div className="space-y-4">
              <div className="text-6xl mb-4">✓</div>
              <h1 className="text-4xl font-serif mb-2">Payment Successful!</h1>
              <p className="text-foreground/70">
                Thank you for your purchase. Your premium features are now active.
              </p>
            </div>
            <div className="space-y-4 bg-accent/10 border border-accent/20 rounded-lg p-6">
              <div className="text-left space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-accent">✓</span>
                  <span>Premium features unlocked</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-accent">✓</span>
                  <span>Confirmation email sent</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-accent">✓</span>
                  <span>30-day money-back guarantee active</span>
                </div>
              </div>
            </div>
          </>
        ) : failed ? (
          <div className="space-y-4">
            <div className="text-6xl mb-4 text-destructive">✕</div>
            <h1 className="text-4xl font-serif mb-2">Payment not completed</h1>
            <p className="text-foreground/70">
              This checkout session expired or was not completed. No charge was made — you can try
              again anytime.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-6xl mb-4 text-amber-500">⏳</div>
            <h1 className="text-4xl font-serif mb-2">Payment pending</h1>
            <p className="text-foreground/70">
              We couldn't confirm your payment yet. If you completed checkout, this should resolve
              shortly — check your email for a receipt, or contact support if it persists.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {confirmed && (
            <Link
              to="/scan"
              className="w-full inline-block bg-accent text-accent-foreground py-3 rounded-lg font-semibold hover:bg-accent/90 transition-all"
            >
              Start Your Premium Reading
            </Link>
          )}
          <Link
            to="/"
            className="w-full inline-block bg-accent/20 text-foreground py-3 rounded-lg font-semibold hover:bg-accent/30 transition-all"
          >
            Back to Home
          </Link>
        </div>

        {sessionId && (
          <div className="text-xs text-foreground/60 space-y-2">
            <p>Session ID: {sessionId}</p>
            {confirmed && <p>Check your email for receipt and account details</p>}
          </div>
        )}
      </div>
    </div>
  );
}
