import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-client";
import { CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";

type OrderRow = {
  created_at: string;
  provider?: string;
  order_id?: string;
  receipt?: string;
  payment_id?: string;
  amount?: number;
  currency?: string;
  plan?: string;
  plan_label?: string;
  email?: string;
  status?: string;
  method?: string;
};

const STATUS_TONE: Record<string, { icon: typeof CheckCircle2; label: string; className: string }> = {
  paid: {
    icon: CheckCircle2,
    label: "Paid",
    className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/40",
  },
  created: {
    icon: Clock,
    label: "Started",
    className: "bg-amber-500/10 text-amber-700 border-amber-500/40",
  },
  failed: {
    icon: XCircle,
    label: "Failed",
    className: "bg-destructive/10 text-destructive border-destructive/40",
  },
  signature_failed: {
    icon: AlertCircle,
    label: "Signature failed",
    className: "bg-destructive/10 text-destructive border-destructive/40",
  },
};

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function fmtMoney(amount?: number, currency = "INR") {
  if (!amount) return "—";
  return `${currency === "INR" ? "₹" : currency + " "}${(amount / 100).toFixed(2)}`;
}

function StatusBadge({ status }: { status?: string }) {
  const key = status || "created";
  const tone = STATUS_TONE[key] || {
    icon: AlertCircle,
    label: key,
    className: "bg-foreground/5 text-foreground/60 border-border",
  };
  const Icon = tone.icon;
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest " +
        tone.className
      }
    >
      <Icon className="size-3" />
      {tone.label}
    </span>
  );
}

export default function OrdersList() {
  const [rows, setRows] = useState<OrderRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminFetch<{ items: OrderRow[] }>("/api/admin/orders?limit=25")
      .then((data) => setRows(data.items))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load orders"));
  }, []);

  if (error)
    return (
      <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
        {error}
      </div>
    );

  if (!rows)
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 rounded-2xl bg-background animate-pulse" />
        ))}
      </div>
    );

  if (rows.length === 0)
    return (
      <div className="py-12 text-center text-sm text-foreground/50">
        No orders yet. Run through the checkout with the test card to see them here.
      </div>
    );

  return (
    <div className="overflow-x-auto -mx-2">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] font-bold uppercase tracking-widest text-foreground/50 border-b border-border">
            <th className="text-left py-2 px-2">When</th>
            <th className="text-left py-2 px-2">Plan</th>
            <th className="text-left py-2 px-2">Seeker</th>
            <th className="text-right py-2 px-2">Amount</th>
            <th className="text-left py-2 px-2">Status</th>
            <th className="text-left py-2 px-2">Reference</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              data-testid={`admin-orders-row-${i}`}
              className="border-b border-border/40 hover:bg-background/40 transition-colors"
            >
              <td className="py-3 px-2 text-foreground/70 text-xs whitespace-nowrap">
                {fmtDate(r.created_at)}
              </td>
              <td className="py-3 px-2 text-foreground">
                <div className="font-medium">{r.plan_label || r.plan || "—"}</div>
                {r.method && (
                  <div className="text-[10px] uppercase tracking-widest text-foreground/40">
                    {r.method}
                  </div>
                )}
              </td>
              <td className="py-3 px-2 text-foreground/80 text-xs">{r.email || "—"}</td>
              <td className="py-3 px-2 text-right font-mono text-foreground">
                {fmtMoney(r.amount, r.currency)}
              </td>
              <td className="py-3 px-2">
                <StatusBadge status={r.status} />
              </td>
              <td className="py-3 px-2 text-[10px] font-mono text-foreground/50 max-w-[180px] truncate">
                {r.payment_id || r.order_id || r.receipt || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
