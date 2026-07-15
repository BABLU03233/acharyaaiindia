import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-client";
import Metrics from "./Metrics";
import OrdersList from "./OrdersList";
import ReadingsList from "./ReadingsList";
import UsersList from "./UsersList";
import ApiCheck from "./ApiCheck";
import { Loader2 } from "lucide-react";

type Stats = {
  totals: {
    orders: number;
    paid_orders: number;
    readings: number;
    users: number;
    revenue_paise: number;
    revenue_inr: number;
  };
  daily_orders: Array<{ _id: string; count: number }>;
  daily_readings: Array<{ _id: string; count: number }>;
};

type Tab = "orders" | "readings" | "users";

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("orders");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    adminFetch<Stats>("/api/admin/stats")
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load stats");
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const refresh = () => setReloadKey((k) => k + 1);

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-serif text-3xl md:text-4xl">Overview</h2>
          <p className="text-sm text-foreground/60 mt-1">
            Live activity across the site — orders, readings, and returning seekers.
          </p>
        </div>
        <button
          data-testid="admin-refresh"
          onClick={refresh}
          className="text-xs uppercase tracking-widest font-bold rounded-full border border-border bg-card px-4 py-2 hover:border-accent hover:text-accent transition-all"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {stats ? (
        <Metrics stats={stats} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-3xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 rounded-3xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-5 gap-2 flex-wrap">
            <h3 className="font-serif text-xl">Activity</h3>
            <div className="inline-flex bg-background border border-border rounded-full p-1 text-xs font-bold">
              {(
                [
                  { k: "orders", label: "Orders" },
                  { k: "readings", label: "Readings" },
                  { k: "users", label: "Seekers" },
                ] as const
              ).map((t) => (
                <button
                  key={t.k}
                  data-testid={`admin-tab-${t.k}`}
                  onClick={() => setTab(t.k)}
                  className={
                    "px-4 py-1.5 rounded-full transition-all " +
                    (tab === t.k
                      ? "bg-accent text-accent-foreground shadow-gold-sm"
                      : "text-foreground/60 hover:text-foreground")
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div key={`${tab}-${reloadKey}`}>
            {tab === "orders" && <OrdersList />}
            {tab === "readings" && <ReadingsList />}
            {tab === "users" && <UsersList />}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-border bg-card p-6">
            <h3 className="font-serif text-lg mb-3">Health checks</h3>
            <ApiCheck />
          </section>

          <section className="rounded-3xl border border-accent/20 bg-gradient-to-br from-accent/5 via-card to-card p-6">
            <div className="text-[10px] font-bold uppercase tracking-widest text-accent mb-2">
              Payment test cards
            </div>
            <ul className="text-xs text-foreground/70 space-y-1.5 font-mono">
              <li>Card: 4111 1111 1111 1111</li>
              <li>CVV: any 3 digits</li>
              <li>Expiry: any future date</li>
              <li>OTP: 1111</li>
            </ul>
            <p className="text-[11px] text-foreground/50 mt-3 leading-relaxed">
              Razorpay is in test mode. No real payment is captured — every event still shows up
              here for full visibility.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

export function DashboardLoading() {
  return (
    <div className="py-24 flex items-center justify-center">
      <Loader2 className="size-6 animate-spin text-accent" />
    </div>
  );
}
