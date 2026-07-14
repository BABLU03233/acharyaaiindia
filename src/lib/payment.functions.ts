import { stripe } from "./stripe-config";

// Types for payment processing
export interface CreateCheckoutSessionParams {
  userId: string;
  email: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  customerName?: string;
  metadata?: Record<string, string>;
  /** "subscription" for recurring prices (monthly/yearly), "payment" for one-time purchases. */
  mode?: "payment" | "subscription";
}

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}

/**
 * Create a Stripe checkout session for subscriptions or one-time purchases
 */
export async function createCheckoutSession(
  params: CreateCheckoutSessionParams,
): Promise<{ url: string; sessionId: string }> {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: params.mode ?? "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: params.priceId,
          quantity: 1,
        },
      ],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      customer_email: params.email,
      metadata: {
        userId: params.userId,
        ...params.metadata,
      },
    });

    return {
      url: session.url || "",
      sessionId: session.id,
    };
  } catch (error) {
    console.error("Error creating checkout session:", error);
    throw new Error(
      `Failed to create checkout session: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Create a payment intent for direct payment processing
 */
export async function createPaymentIntent(params: {
  userId: string;
  email: string;
  amount: number; // in cents
  currency?: string;
  description?: string;
  metadata?: Record<string, string>;
}): Promise<PaymentIntent> {
  try {
    const intent = await stripe.paymentIntents.create({
      amount: params.amount,
      currency: params.currency || "usd",
      description: params.description,
      // Stripe expects `receipt_email` for sending receipts for PaymentIntents
      receipt_email: params.email,
      metadata: {
        userId: params.userId,
        ...params.metadata,
      },
    });

    return {
      id: intent.id,
      clientSecret: intent.client_secret || "",
      amount: intent.amount,
      currency: intent.currency,
      status: intent.status,
    };
  } catch (error) {
    console.error("Error creating payment intent:", error);
    throw new Error(
      `Failed to create payment intent: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Retrieve customer by email and create if not exists
 */
export async function getOrCreateStripeCustomer(email: string, name?: string): Promise<string> {
  try {
    // Search for existing customer
    const customers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (customers.data.length > 0) {
      return customers.data[0].id;
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email,
      name: name || undefined,
      description: "Acharya AI customer",
    });

    return customer.id;
  } catch (error) {
    console.error("Error getting/creating Stripe customer:", error);
    throw error;
  }
}

/**
 * Get customer subscription status
 */
export async function getCustomerSubscription(customerId: string) {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length > 0) {
      return subscriptions.data[0];
    }

    return null;
  } catch (error) {
    console.error("Error getting customer subscription:", error);
    return null;
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string) {
  try {
    // Some Stripe SDK typings do not expose `del` on the subscription resource.
    // Use update to set cancellation at period end as a safe approach.
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
    return subscription;
  } catch (error) {
    console.error("Error canceling subscription:", error);
    throw error;
  }
}

/**
 * Get payment method details
 */
export async function getPaymentMethod(paymentMethodId: string) {
  try {
    const method = await stripe.paymentMethods.retrieve(paymentMethodId);
    return method;
  } catch (error) {
    console.error("Error retrieving payment method:", error);
    return null;
  }
}

/**
 * Retrieve a Checkout Session and report whether the payment actually completed.
 * Used by the /success page to confirm a payment instead of trusting the redirect alone.
 */
export async function verifyCheckoutSession(sessionId: string): Promise<{
  status: "complete" | "pending" | "failed";
  plan?: string;
  customerEmail?: string | null;
}> {
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const status =
    session.payment_status === "paid" || session.status === "complete"
      ? "complete"
      : session.status === "expired"
        ? "failed"
        : "pending";
  return {
    status,
    plan: typeof session.metadata?.plan === "string" ? session.metadata.plan : undefined,
    customerEmail: session.customer_details?.email ?? session.customer_email,
  };
}

/**
 * Create Razorpay order (for India market)
 * This is a helper for future Razorpay integration
 */
export async function createRazorpayOrder(params: {
  userId: string;
  amount: number; // in paise (1 INR = 100 paise)
  currency?: string;
  description?: string;
  receipt?: string;
}) {
  // This will be implemented when Razorpay is added
  // For now, we're using Stripe
  throw new Error("Razorpay integration coming soon");
}
