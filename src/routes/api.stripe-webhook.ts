import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { handlePaymentWebhook } from "@/lib/payment.handlers";
import { withSecurityHeaders } from "@/lib/security";

export const Route = createFileRoute("/api/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => withSecurityHeaders(await handlePaymentWebhook(request)),
    },
  },
});
