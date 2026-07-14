import Stripe from "stripe";

// Initialize Stripe lazily — constructing the SDK with an empty key throws
// synchronously, and this module is imported (transitively) by route files
// that are eagerly loaded into the route tree. A missing key must fail only
// when a payment feature is actually used, not crash every unrelated route.
function createStripeClient(): Stripe {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Configure it in your environment to enable payments.",
    );
  }
  return new Stripe(stripeKey, {
    appInfo: { name: "Acharya AI", version: "1.0.0" },
  });
}

let _stripe: Stripe | undefined;

export const stripe = new Proxy({} as Stripe, {
  get(_, prop, receiver) {
    if (!_stripe) _stripe = createStripeClient();
    return Reflect.get(_stripe, prop, receiver);
  },
});

// Stripe product and pricing IDs (should be set in environment)
export const stripeProducts = {
  PREMIUM_MONTHLY: process.env.VITE_STRIPE_PREMIUM_MONTHLY_ID || "",
  PREMIUM_YEARLY: process.env.VITE_STRIPE_PREMIUM_YEARLY_ID || "",
  ONE_TIME_READING: process.env.VITE_STRIPE_ONE_TIME_ID || "",
};

export const stripePrices = {
  PREMIUM_MONTHLY: process.env.VITE_STRIPE_PREMIUM_MONTHLY_PRICE || "",
  PREMIUM_YEARLY: process.env.VITE_STRIPE_PREMIUM_YEARLY_PRICE || "",
  ONE_TIME_READING: process.env.VITE_STRIPE_ONE_TIME_PRICE || "",
};

// Webhook secret for payment confirmation
export const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
