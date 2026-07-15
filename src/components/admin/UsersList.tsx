import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-client";

type UserRow = {
  email?: string;
  anon_id?: string;
  first_seen_at?: string;
  last_seen_at?: string;
  order_count?: number;
  reading_count?: number;
};

function fmtDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export default function UsersList() {
  const [rows, setRows] = useState<UserRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminFetch<{ items: UserRow[] }>("/api/admin/users?limit=25")
      .then((data) => setRows(data.items))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load users"));
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
        No returning seekers yet. Once someone reads a palm or checks out, they'll appear here.
      </div>
    );

  return (
    <div className="overflow-x-auto -mx-2">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] font-bold uppercase tracking-widest text-foreground/50 border-b border-border">
            <th className="text-left py-2 px-2">Seeker</th>
            <th className="text-right py-2 px-2">Readings</th>
            <th className="text-right py-2 px-2">Orders</th>
            <th className="text-left py-2 px-2">First seen</th>
            <th className="text-left py-2 px-2">Last seen</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((u, i) => (
            <tr
              key={i}
              data-testid={`admin-users-row-${i}`}
              className="border-b border-border/40 hover:bg-background/40 transition-colors"
            >
              <td className="py-3 px-2">
                <div className="font-medium text-foreground text-sm">
                  {u.email || u.anon_id?.slice(0, 12) || "anonymous"}
                </div>
                {u.email && u.anon_id && (
                  <div className="text-[10px] font-mono text-foreground/40 truncate max-w-[180px]">
                    {u.anon_id}
                  </div>
                )}
              </td>
              <td className="py-3 px-2 text-right font-mono">
                {u.reading_count ?? 0}
              </td>
              <td className="py-3 px-2 text-right font-mono">{u.order_count ?? 0}</td>
              <td className="py-3 px-2 text-xs text-foreground/60 whitespace-nowrap">
                {fmtDate(u.first_seen_at)}
              </td>
              <td className="py-3 px-2 text-xs text-foreground/60 whitespace-nowrap">
                {fmtDate(u.last_seen_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
