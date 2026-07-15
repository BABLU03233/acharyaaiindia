import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createPaymentCheckout } from "@/lib/payment.handlers";
import { withSecurityHeaders } from "@/lib/security";

export const Route = createFileRoute("/api/checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => withSecurityHeaders(await createPaymentCheckout(request)),
    },
  },
});
