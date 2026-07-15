import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-client";

type ReadingRow = {
  created_at: string;
  hand?: "left" | "right";
  question?: string;
  quality?: string;
  summary?: string;
  anon_id?: string;
};

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export default function ReadingsList() {
  const [rows, setRows] = useState<ReadingRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminFetch<{ items: ReadingRow[] }>("/api/admin/readings?limit=25")
      .then((data) => setRows(data.items))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load readings"));
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
          <div key={i} className="h-16 rounded-2xl bg-background animate-pulse" />
        ))}
      </div>
    );

  if (rows.length === 0)
    return (
      <div className="py-12 text-center text-sm text-foreground/50">
        No readings yet. Scan a palm at{" "}
        <a href="/scan" className="text-accent hover:underline">
          /scan
        </a>{" "}
        to log the first one.
      </div>
    );

  return (
    <div className="space-y-3">
      {rows.map((r, i) => (
        <div
          key={i}
          data-testid={`admin-readings-row-${i}`}
          className="p-4 rounded-2xl border border-border bg-background/40 space-y-1.5"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
                {r.hand ? `${r.hand} palm` : "palm"}
              </span>
              {r.quality && (
                <span className="text-[10px] font-mono text-foreground/60">
                  · {r.quality} quality
                </span>
              )}
            </div>
            <span className="text-[10px] font-mono text-foreground/40 whitespace-nowrap">
              {fmtDate(r.created_at)}
            </span>
          </div>
          {r.question && (
            <div className="text-xs text-foreground/70 italic">"{r.question}"</div>
          )}
          {r.summary && (
            <div className="text-sm text-foreground/85 font-serif line-clamp-2">
              {r.summary}
            </div>
          )}
          {r.anon_id && (
            <div className="text-[10px] font-mono text-foreground/40 truncate">
              seeker: {r.anon_id}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
