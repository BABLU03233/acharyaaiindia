import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminDashboard from "@/components/admin/Dashboard";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Acharya AI" },
      // Never index or crawl the admin panel.
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminRoot,
});

function AdminRoot() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"checking" | "authorized" | "denied">("checking");

  useEffect(() => {
    let cancelled = false;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (cancelled) return;
        if (data.session) {
          setStatus("authorized");
        } else {
          setStatus("denied");
          navigate({ to: "/" });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("denied");
          navigate({ to: "/" });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (status !== "authorized") {
    return (
      <main className="min-h-screen bg-background-solid flex items-center justify-center px-6">
        <div className="text-center text-sm text-foreground/60">
          {status === "checking" ? "Checking access…" : "Redirecting…"}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background-solid py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Admin Panel</h2>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-accent hover:underline">
              Back to site
            </Link>
          </div>
        </div>

        <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-700">
          Preview data — user and reading lists below are placeholders, not yet wired to the live
          database.
        </div>

        <AdminDashboard />
      </div>
    </main>
  );
}
