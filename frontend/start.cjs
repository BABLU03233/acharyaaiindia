// Supervisor wrapper: boots the TanStack Start / Vite dev server for the
// acharyaaiindia project from /app on port 3000. Kubernetes ingress routes
// non-/api traffic here; /api traffic is proxied by /app/backend/server.py.
const { spawn } = require("node:child_process");
const path = require("node:path");

const cwd = "/app";
const port = process.env.PORT || "3000";
const host = process.env.HOST || "0.0.0.0";

const vite = spawn(
  process.execPath,
  [
    path.join(cwd, "node_modules", "vite", "bin", "vite.js"),
    "dev",
    "--host",
    host,
    "--port",
    port,
    "--strictPort",
  ],
  {
    cwd,
    stdio: "inherit",
    env: {
      ...process.env,
      HOST: host,
      PORT: port,
    },
  },
);

vite.on("exit", (code, signal) => {
  console.log(`[frontend] vite exited code=${code} signal=${signal}`);
  process.exit(code ?? 1);
});

const forward = (signal) => () => {
  if (!vite.killed) vite.kill(signal);
};
process.on("SIGTERM", forward("SIGTERM"));
process.on("SIGINT", forward("SIGINT"));
