import { useState } from "react";
import { CheckCircle2, XCircle, Loader2, Play } from "lucide-react";

type CheckResult = { name: string; ok: boolean; detail?: string };

export default function ApiCheck() {
  const [results, setResults] = useState<CheckResult[] | null>(null);
  const [busy, setBusy] = useState(false);

  async function runChecks() {
    setBusy(true);
    setResults(null);
    const checks: Array<() => Promise<CheckResult>> = [
      async () => {
        const r = await fetch("/api/health").catch(() => null);
        return {
          name: "Backend health",
          ok: !!r && r.ok,
          detail: r ? `HTTP ${r.status}` : "no response",
        };
      },
      async () => {
        // Razorpay order creation with a bogus email — should fail 400.
        const r = await fetch("/api/razorpay-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: "one-time", email: "invalid", userId: "check" }),
        }).catch(() => null);
        return {
          name: "Razorpay endpoint reachable",
          ok: !!r && r.status !== 404,
          detail: r ? `HTTP ${r.status}` : "no response",
        };
      },
      async () => {
        const r = await fetch("/api/verify-payment").catch(() => null);
        return {
          name: "Legacy Stripe verify",
          ok: !!r && r.status !== 404,
          detail: r ? `HTTP ${r.status}` : "no response",
        };
      },
    ];
    const out: CheckResult[] = [];
    for (const c of checks) out.push(await c());
    setResults(out);
    setBusy(false);
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-foreground/60">
        Verify that the payment and health endpoints are wired correctly.
      </p>
      <button
        data-testid="admin-run-checks"
        onClick={runChecks}
        disabled={busy}
        className="inline-flex items-center gap-2 bg-accent text-accent-foreground rounded-full px-4 py-2 text-xs font-bold shadow-gold-sm hover:scale-[1.03] transition-transform disabled:opacity-50"
      >
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
        Run checks
      </button>

      {results && (
        <ul className="space-y-1.5 pt-2">
          {results.map((r) => (
            <li
              key={r.name}
              className="flex items-center justify-between rounded-xl border border-border bg-background/40 px-3 py-2 text-xs"
            >
              <span className="text-foreground/70">{r.name}</span>
              <span
                className={
                  "inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest " +
                  (r.ok ? "text-emerald-600" : "text-destructive")
                }
              >
                {r.ok ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}
                {r.detail || (r.ok ? "OK" : "FAIL")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
