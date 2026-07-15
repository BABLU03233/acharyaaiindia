import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { withSecurityHeaders } from "@/lib/security";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: () =>
        withSecurityHeaders(
          new Response(JSON.stringify({ ok: true, time: new Date().toISOString() }), {
            headers: { "Content-Type": "application/json" },
          }),
        ),
    },
  },
});
