import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { fetchPayment, verifyCheckoutSignature } from "@/lib/razorpay";
import { logEvent } from "@/lib/event-log";
import { withSecurityHeaders } from "@/lib/security";

/**
 * POST /api/razorpay-verify
 *
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature,
 *         plan, email }
 *
 * Verifies the signature Razorpay returns from the Checkout modal and then
 * cross-checks the payment status via the Payments API. On success we record
 * the completed order for the admin panel and reply `{status: "complete"}`
 * so the /success page can unlock the reading.
 */
export const Route = createFileRoute("/api/razorpay-verify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            razorpay_order_id?: string;
            razorpay_payment_id?: string;
            razorpay_signature?: string;
            plan?: string;
            email?: string;
          };

          const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            plan,
            email,
          } = body;

          if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return withSecurityHeaders(
              new Response(
                JSON.stringify({ status: "failed", error: "Missing verification parameters" }),
                { status: 400, headers: { "content-type": "application/json" } },
              ),
            );
          }

          const signatureOk = verifyCheckoutSignature({
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
          });

          if (!signatureOk) {
            void logEvent("order", {
              provider: "razorpay",
              order_id: razorpay_order_id,
              payment_id: razorpay_payment_id,
              status: "signature_failed",
              plan,
              email,
            });
            return withSecurityHeaders(
              new Response(
                JSON.stringify({ status: "failed", error: "Signature mismatch" }),
                { status: 400, headers: { "content-type": "application/json" } },
              ),
            );
          }

          // Cross-verify payment state via Razorpay directly.
          const payment = await fetchPayment(razorpay_payment_id);
          const captured = payment.status === "captured" || payment.status === "authorized";

          void logEvent("order", {
            provider: "razorpay",
            order_id: razorpay_order_id,
            payment_id: razorpay_payment_id,
            amount: payment.amount,
            currency: payment.currency,
            method: payment.method,
            plan,
            email,
            status: captured ? "paid" : "failed",
            captured_at: payment.created_at
              ? new Date(payment.created_at * 1000).toISOString()
              : null,
          });

          return withSecurityHeaders(
            new Response(
              JSON.stringify({
                status: captured ? "complete" : "failed",
                plan,
                payment_id: razorpay_payment_id,
                amount: payment.amount,
                currency: payment.currency,
                method: payment.method,
              }),
              { status: 200, headers: { "content-type": "application/json" } },
            ),
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to verify payment";
          return withSecurityHeaders(
            new Response(JSON.stringify({ status: "failed", error: message }), {
              status: 500,
              headers: { "content-type": "application/json" },
            }),
          );
        }
      },
    },
  },
});
