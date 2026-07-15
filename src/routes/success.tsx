import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { SiteNav } from "@/components/site/Nav";

export const Route = createFileRoute("/success")({
  head: () => ({
    meta: [
      { title: "Payment Successful — Acharya AI" },
      { name: "description", content: "Your payment has been processed successfully." },
    ],
  }),
  component: SuccessPage,
});

type VerifyStatus = "complete" | "failed" | "pending";

function SuccessPage() {
  const [status, setStatus] = useState<VerifyStatus | "unknown">("unknown");
  const [verifying, setVerifying] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const razorpayPaymentId = params.get("payment_id");
    const razorpayOrderId = params.get("order_id");
    const razorpaySignature = params.get("signature");
    const planParam = params.get("plan");

    setPaymentId(razorpayPaymentId);
    setPlan(planParam);

    // Stripe legacy support — /success?session_id=cs_test_... would come from
    // the old Stripe checkout URL that some existing SEO links use.
    const stripeSessionId = params.get("session_id");

    const verify = async () => {
      try {
        if (razorpayPaymentId && razorpayOrderId && razorpaySignature) {
          const email = localStorage.getItem("hasta:checkout-email") || "";
          const res = await fetch("/api/razorpay-verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_payment_id: razorpayPaymentId,
              razorpay_order_id: razorpayOrderId,
              razorpay_signature: razorpaySignature,
              plan: planParam,
              email,
            }),
          });
          const data = (await res.json()) as {
            status: VerifyStatus;
            error?: string;
          };
          setStatus(data.status);
          if (data.status === "complete") {
            try {
              localStorage.setItem("hasta:unlocked", "true");
              if (planParam) localStorage.setItem("hasta:plan", planParam);
            } catch {
              /* ignore */
            }
          } else if (data.error) {
            setMessage(data.error);
          }
        } else if (stripeSessionId) {
          const res = await fetch(`/api/verify-payment?session_id=${stripeSessionId}`);
          if (res.ok) {
            const data = (await res.json()) as { status: VerifyStatus };
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
        } else {
          setStatus("unknown");
        }
      } catch (err) {
        setStatus("unknown");
        setMessage(err instanceof Error ? err.message : "Verification error");
      } finally {
        setVerifying(false);
      }
    };
    void verify();
  }, []);

  const confirmed = status === "complete";
  const failed = status === "failed";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteNav />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center space-y-8">
          {verifying ? (
            <div data-testid="success-verifying" className="space-y-4">
              <Loader2 className="mx-auto size-10 animate-spin text-accent" />
              <p className="text-foreground/60 text-sm uppercase tracking-widest font-mono">
                Verifying your payment…
              </p>
            </div>
          ) : confirmed ? (
            <>
              <div
                data-testid="success-confirmed"
                className="mx-auto size-20 rounded-full bg-accent/10 border-2 border-accent flex items-center justify-center shadow-gold"
              >
                <CheckCircle2 className="size-10 text-accent" strokeWidth={2} />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl md:text-4xl font-serif">Your reading is unlocked</h1>
                <p className="text-foreground/70">
                  Thank you, seeker. The Acharya has your full palm reading ready.
                </p>
              </div>
              <div className="space-y-2 rounded-3xl border border-accent/20 bg-card p-6 text-left">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-accent" />
                  <span>Premium access active</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-accent" />
                  <span>Full Shastra reading revealed</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="size-4 text-accent" />
                  <span>30-day money-back guarantee active</span>
                </div>
              </div>
            </>
          ) : failed ? (
            <>
              <div
                data-testid="success-failed"
                className="mx-auto size-20 rounded-full bg-destructive/10 border-2 border-destructive flex items-center justify-center"
              >
                <XCircle className="size-10 text-destructive" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl md:text-4xl font-serif">Payment not confirmed</h1>
                <p className="text-foreground/70">
                  {message || "The signature could not be verified. No amount was captured — you can try again safely."}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="mx-auto size-20 rounded-full bg-amber-500/10 border-2 border-amber-500 flex items-center justify-center">
                <span className="text-3xl">⏳</span>
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl md:text-4xl font-serif">Payment pending</h1>
                <p className="text-foreground/70">
                  Your bank is still processing this transaction. It usually resolves within a few
                  minutes — no need to pay again.
                </p>
              </div>
            </>
          )}

          <div className="space-y-3">
            {confirmed && (
              <Link
                data-testid="success-read-cta"
                to="/reading"
                className="w-full inline-block bg-accent text-accent-foreground py-3 rounded-full font-bold text-sm hover:scale-[1.02] transition-transform shadow-gold"
              >
                Reveal my full reading →
              </Link>
            )}
            <Link
              to="/"
              className="w-full inline-block bg-card border border-border text-foreground py-3 rounded-full font-semibold text-sm hover:border-accent transition-all"
            >
              Back to home
            </Link>
          </div>

          {(paymentId || plan) && (
            <div className="text-[10px] font-mono text-foreground/40 space-y-1 pt-4">
              {plan && <div>Plan: {plan}</div>}
              {paymentId && <div>Payment ID: {paymentId}</div>}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
