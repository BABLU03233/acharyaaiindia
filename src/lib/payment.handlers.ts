import { json } from "@tanstack/react-start";
import Stripe from "stripe";
import { createCheckoutSession, verifyCheckoutSession } from "@/lib/payment.functions";
import { stripeWebhookSecret } from "@/lib/stripe-config";

async function verifyStripeWebhook(request: Request): Promise<Stripe.Event> {
  if (!stripeWebhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature") || "";

  // constructEvent is pure local HMAC verification — it never makes a network call,
  // so it must not require the real STRIPE_SECRET_KEY just to check a signature.
  // Constructed lazily (only when a webhook actually arrives) to match the
  // lazy-Stripe-client pattern in stripe-config.ts.
  const webhookVerifier = new Stripe("sk_webhook_signature_verification_only");

  try {
    return webhookVerifier.webhooks.constructEvent(body, signature, stripeWebhookSecret);
  } catch (error) {
    throw new Error(
      `Webhook signature verification failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Handle payment webhook events from Stripe.
 *
 * NOTE: Persistence is intentionally TODO — the `orders` / `subscriptions` / `user_profiles`
 * tables documented in src/lib/database.schema.ts do not exist in the connected Supabase
 * project yet (its generated types.ts has an empty Tables map). Writing to them here would
 * throw at runtime. Create those tables first, then fill in the TODOs below with
 * `supabaseAdmin.from(...).upsert(...)` calls.
 */
export const handlePaymentWebhook = async (request: Request) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const event = await verifyStripeWebhook(request);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("✅ Checkout completed:", session.id, session.customer_email);
        // TODO: once `orders`/`user_profiles` tables exist, upsert the paid order here.
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("✅ Payment succeeded:", paymentIntent.id);
        // TODO: Update database with successful payment
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("❌ Payment failed:", paymentIntent.id);
        // TODO: Update database with failed payment
        break;
      }

      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("✅ Subscription created:", subscription.id);
        // TODO: Update user subscription status
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("✅ Subscription updated:", subscription.id);
        // TODO: Update user subscription details
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("❌ Subscription canceled:", subscription.id);
        // TODO: Update user subscription status to canceled
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("✅ Invoice paid:", invoice.id);
        // TODO: Send invoice email
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return json(
      { error: error instanceof Error ? error.message : "Webhook processing failed" },
      { status: 400 },
    );
  }
};

/**
 * Create a checkout session for payment
 */
export const createPaymentCheckout = async (request: Request) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = (await request.json()) as {
      userId: string;
      email: string;
      priceId: string;
      successUrl: string;
      cancelUrl: string;
      customerName?: string;
      mode?: "payment" | "subscription";
      metadata?: Record<string, string>;
    };

    if (!body.userId || !body.email || !body.priceId) {
      return json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!/^\S+@\S+\.\S+$/.test(body.email)) {
      return json({ error: "Invalid email address" }, { status: 400 });
    }

    const result = await createCheckoutSession({
      userId: body.userId,
      email: body.email,
      priceId: body.priceId,
      successUrl: body.successUrl,
      cancelUrl: body.cancelUrl,
      customerName: body.customerName,
      mode: body.mode,
      metadata: body.metadata,
    });

    return json(result);
  } catch (error) {
    console.error("Checkout session creation error:", error);
    return json(
      { error: error instanceof Error ? error.message : "Failed to create checkout session" },
      { status: 500 },
    );
  }
};

/**
 * Confirm a completed Checkout Session (used by the /success page).
 */
export const verifyPaymentCheckout = async (request: Request) => {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id");
  if (!sessionId) {
    return json({ error: "session_id is required" }, { status: 400 });
  }

  try {
    const result = await verifyCheckoutSession(sessionId);
    return json(result);
  } catch (error) {
    console.error("Payment verification error:", error);
    return json(
      { error: error instanceof Error ? error.message : "Failed to verify payment" },
      { status: 500 },
    );
  }
};

/**
 * Get customer subscription and payment status
 */
export const getPaymentStatus = async (request: Request) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = (await request.json()) as { email: string };

    if (!body.email) {
      return json({ error: "Email required" }, { status: 400 });
    }

    // TODO: Query database for user's subscription and payment status once
    // the `user_profiles`/`subscriptions` tables exist.
    return json({
      isSubscribed: false,
      subscriptionPlan: null,
      nextBillingDate: null,
      status: "none",
    });
  } catch (error) {
    console.error("Payment status error:", error);
    return json(
      { error: error instanceof Error ? error.message : "Failed to get payment status" },
      { status: 500 },
    );
  }
};
