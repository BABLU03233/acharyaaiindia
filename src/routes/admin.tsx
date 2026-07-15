import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogOut, ShieldAlert, Loader2 } from "lucide-react";
import {
  adminFetch,
  clearAdminToken,
  getAdminToken,
  setAdminToken,
} from "@/lib/admin-client";
import AdminDashboard from "@/components/admin/Dashboard";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Acharya AI" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminRoot,
});

type Screen = "checking" | "login" | "dashboard";

function AdminRoot() {
  const [screen, setScreen] = useState<Screen>("checking");
  const [adminName, setAdminName] = useState<string>("admin");

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      setScreen("login");
      return;
    }
    adminFetch<{ username: string; role: string }>("/api/admin/me")
      .then((me) => {
        setAdminName(me.username);
        setScreen("dashboard");
      })
      .catch(() => setScreen("login"));
  }, []);

  const logout = () => {
    clearAdminToken();
    setScreen("login");
  };

  if (screen === "checking") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="size-6 animate-spin text-accent" />
      </main>
    );
  }

  if (screen === "login") {
    return (
      <LoginScreen
        onSuccess={(username) => {
          setAdminName(username);
          setScreen("dashboard");
        }}
      />
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-gradient-divine flex items-center justify-center text-white font-bold">
              ॐ
            </div>
            <div>
              <div className="font-serif text-lg leading-tight">Acharya AI · Console</div>
              <div className="text-[10px] uppercase tracking-widest text-accent">
                Signed in as {adminName}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="hidden sm:inline text-xs uppercase tracking-widest text-foreground/60 hover:text-accent"
            >
              View site →
            </Link>
            <button
              data-testid="admin-logout"
              onClick={logout}
              className="inline-flex items-center gap-2 border border-border bg-card px-3 py-2 rounded-full text-xs font-semibold hover:border-destructive hover:text-destructive"
            >
              <LogOut className="size-3.5" />
              Log out
            </button>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <AdminDashboard />
      </div>
    </main>
  );
}

function LoginScreen({ onSuccess }: { onSuccess: (username: string) => void }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(body?.detail || "Invalid credentials");
      }
      const data = (await res.json()) as {
        token: string;
        admin: { username: string };
      };
      setAdminToken(data.token);
      onSuccess(data.admin.username);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <form
        onSubmit={submit}
        className="w-full max-w-md bg-card border border-accent/20 rounded-3xl shadow-gold p-8 space-y-6"
      >
        <div className="flex flex-col items-center text-center gap-3">
          <div className="size-14 rounded-2xl bg-gradient-divine flex items-center justify-center text-2xl text-white shadow-divine-sm">
            ॐ
          </div>
          <div>
            <h1 className="font-serif text-2xl">Acharya AI Console</h1>
            <p className="text-xs text-foreground/60 uppercase tracking-widest mt-1">
              Admin sign in
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block space-y-1">
            <span className="text-[11px] uppercase tracking-widest font-bold text-foreground/60">
              Username
            </span>
            <input
              data-testid="admin-login-username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-sm outline-none focus:border-accent"
              required
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[11px] uppercase tracking-widest font-bold text-foreground/60">
              Password
            </span>
            <input
              data-testid="admin-login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-sm outline-none focus:border-accent"
              required
            />
          </label>
        </div>

        {error && (
          <div
            data-testid="admin-login-error"
            className="flex items-start gap-2 rounded-2xl border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive"
          >
            <ShieldAlert className="size-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button
          data-testid="admin-login-submit"
          type="submit"
          disabled={busy}
          className="w-full bg-accent text-accent-foreground py-3 rounded-full font-bold text-sm shadow-gold hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100"
        >
          {busy ? "Signing in…" : "Enter Console"}
        </button>

        <p className="text-[11px] text-center text-foreground/40 leading-relaxed">
          Access restricted. The console tracks every login attempt.
        </p>
      </form>
    </main>
  );
}
