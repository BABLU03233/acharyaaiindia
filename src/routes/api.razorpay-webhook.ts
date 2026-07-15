import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { logEvent } from "@/lib/event-log";

/**
 * POST /api/razorpay-webhook
 *
 * Razorpay dashboard → Settings → Webhooks. Configure this URL and set the
 * secret matching `RAZORPAY_WEBHOOK_SECRET`. The webhook body is verified
 * against `X-Razorpay-Signature` using HMAC-SHA256.
 *
 * We accept any status but only mark orders `paid` on `payment.captured`.
 * All events are logged for the admin trail.
 */
export const Route = createFileRoute("/api/razorpay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        const signature = request.headers.get("x-razorpay-signature") || "";
        const valid = verifyWebhookSignature(raw, signature);

        // The webhook can legitimately fire in test-mode without the secret
        // configured yet — still log it, but never trust its contents unless
        // we can verify the signature.
        let event: {
          event?: string;
          payload?: { payment?: { entity?: Record<string, unknown> } };
        } = {};
        try {
          event = JSON.parse(raw);
        } catch {
          return new Response(JSON.stringify({ ok: false, error: "invalid json" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        const paymentEntity = event.payload?.payment?.entity as
          | undefined
          | { id?: string; order_id?: string; amount?: number; currency?: string; status?: string; method?: string; email?: string };

        const status =
          event.event === "payment.captured"
            ? "paid"
            : event.event === "payment.failed"
              ? "failed"
              : "webhook_" + (event.event || "unknown");

        void logEvent("order", {
          provider: "razorpay",
          order_id: paymentEntity?.order_id,
          payment_id: paymentEntity?.id,
          amount: paymentEntity?.amount,
          currency: paymentEntity?.currency,
          method: paymentEntity?.method,
          email: paymentEntity?.email,
          status,
          signature_valid: valid,
          webhook_event: event.event,
        });

        return new Response(JSON.stringify({ ok: true, verified: valid }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
