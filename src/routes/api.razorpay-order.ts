import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createOrder } from "@/lib/razorpay";
import { logEvent } from "@/lib/event-log";
import { withSecurityHeaders } from "@/lib/security";

/**
 * POST /api/razorpay-order
 *
 * Body: { plan: "monthly" | "yearly" | "one-time", email: string, userId: string, name?: string }
 * Reply: { key_id: string, order: {id, amount, currency, receipt}, plan: {...} }
 *
 * Creates a Razorpay order in test mode and records a `pending` order in the
 * admin store so the admin panel can watch checkout attempts live.
 */
export const Route = createFileRoute("/api/razorpay-order")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            plan?: "monthly" | "yearly" | "one-time";
            email?: string;
            userId?: string;
            name?: string;
          };

          if (!body?.plan || !["monthly", "yearly", "one-time"].includes(body.plan)) {
            return withSecurityHeaders(
              new Response(JSON.stringify({ error: "Invalid plan" }), {
                status: 400,
                headers: { "content-type": "application/json" },
              }),
            );
          }
          if (!body.email || !/^\S+@\S+\.\S+$/.test(body.email)) {
            return withSecurityHeaders(
              new Response(JSON.stringify({ error: "Invalid email" }), {
                status: 400,
                headers: { "content-type": "application/json" },
              }),
            );
          }
          const userId = body.userId || `anon-${Date.now()}`;

          const { order, plan, key_id, name: displayName } = await createOrder({
            plan: body.plan,
            email: body.email,
            userId,
            name: body.name,
          });

          // Fire-and-forget ingestion so the admin panel shows the checkout attempt.
          void logEvent("order", {
            provider: "razorpay",
            order_id: order.id,
            receipt: order.receipt,
            amount: order.amount,
            currency: order.currency,
            plan: body.plan,
            plan_label: plan.label,
            email: body.email,
            anon_id: userId,
            status: "created",
          });

          return withSecurityHeaders(
            new Response(
              JSON.stringify({
                order: {
                  id: order.id,
                  amount: order.amount,
                  currency: order.currency,
                  receipt: order.receipt,
                },
                plan: {
                  key: body.plan,
                  label: plan.label,
                  description: plan.description,
                  period: plan.period,
                },
                key_id,
                name: displayName,
              }),
              { status: 200, headers: { "content-type": "application/json" } },
            ),
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to create Razorpay order";
          return withSecurityHeaders(
            new Response(JSON.stringify({ error: message }), {
              status: 500,
              headers: { "content-type": "application/json" },
            }),
          );
        }
      },
    },
  },
});
