import { IndianRupee, ShoppingCart, ScrollText, Users } from "lucide-react";

type Stats = {
  totals: {
    orders: number;
    paid_orders: number;
    readings: number;
    users: number;
    revenue_paise: number;
    revenue_inr: number;
  };
};

function inrFormat(n: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(n);
}

export default function Metrics({ stats }: { stats: Stats }) {
  const items = [
    {
      key: "revenue",
      label: "Revenue",
      value: `₹${inrFormat(stats.totals.revenue_inr)}`,
      sub: `${stats.totals.paid_orders} paid orders`,
      icon: IndianRupee,
      tone: "accent" as const,
    },
    {
      key: "orders",
      label: "Total orders",
      value: inrFormat(stats.totals.orders),
      sub: `${stats.totals.paid_orders} completed`,
      icon: ShoppingCart,
      tone: "accent" as const,
    },
    {
      key: "readings",
      label: "Palm readings",
      value: inrFormat(stats.totals.readings),
      sub: "AI-generated",
      icon: ScrollText,
      tone: "muted" as const,
    },
    {
      key: "users",
      label: "Seekers",
      value: inrFormat(stats.totals.users),
      sub: "unique visitors tracked",
      icon: Users,
      tone: "muted" as const,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((m) => {
        const Icon = m.icon;
        return (
          <div
            key={m.key}
            data-testid={`admin-metric-${m.key}`}
            className={
              "relative rounded-3xl border p-5 " +
              (m.tone === "accent"
                ? "border-accent/25 bg-gradient-to-br from-accent/10 via-card to-card"
                : "border-border bg-card")
            }
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/50">
                {m.label}
              </span>
              <span
                className={
                  "inline-flex size-8 items-center justify-center rounded-full " +
                  (m.tone === "accent"
                    ? "bg-accent text-accent-foreground"
                    : "bg-background border border-border text-accent")
                }
              >
                <Icon className="size-4" strokeWidth={2} />
              </span>
            </div>
            <div className="mt-3 font-serif text-3xl md:text-4xl leading-none">
              {m.value}
            </div>
            <div className="mt-1.5 text-[11px] text-foreground/50">{m.sub}</div>
          </div>
        );
      })}
    </div>
  );
}
