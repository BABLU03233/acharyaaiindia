import { useState } from "react";

export default function ApiCheck() {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function runChecks() {
    setBusy(true);
    try {
      // basic fetch to known endpoints — verify-payment returns 400 without a
      // session_id, which still proves the route is wired up (unlike a 404).
      const res1 = await fetch("/api/verify-payment", { method: "GET" }).catch(() => null);
      const ok1 = res1 ? res1.status !== 404 : false;
      const res2 = await fetch("/api/health", { method: "GET" }).catch(() => null);
      const ok2 = res2 ? res2.ok : false;
      setStatus(`payment:${ok1 ? "ok" : "fail"} health:${ok2 ? "ok" : "fail"}`);
    } catch {
      setStatus("error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-foreground/70">
        Run a quick connectivity check for API endpoints used by analysis and payments.
      </div>
      <div className="flex gap-2">
        <button
          onClick={runChecks}
          className="px-3 py-2 rounded-md bg-gradient-divine text-white font-medium"
        >
          Run checks
        </button>
        <div className="px-3 py-2 rounded-md bg-card border border-border">
          {busy ? "Checking..." : (status ?? "Idle")}
        </div>
      </div>
    </div>
  );
}
