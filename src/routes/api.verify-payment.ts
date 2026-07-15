import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { verifyPaymentCheckout } from "@/lib/payment.handlers";
import { withSecurityHeaders } from "@/lib/security";

export const Route = createFileRoute("/api/verify-payment")({
  server: {
    handlers: {
      GET: async ({ request }) => withSecurityHeaders(await verifyPaymentCheckout(request)),
    },
  },
});
