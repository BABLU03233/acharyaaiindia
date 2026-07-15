/**
 * Razorpay server-side helpers.
 *
 * NOTE: This module is imported only inside TanStack Start server function
 * handlers (never on the client). The Razorpay SDK is a Node-only package
 * with CommonJS internals — do not add `import Razorpay from "razorpay"` at
 * the top of any component or route module that ships to the browser bundle.
 */
import crypto from "node:crypto";
import Razorpay from "razorpay";

type PlanKey = "monthly" | "yearly" | "one-time";

/**
 * Canonical price table in paise. Kept server-side so a client can't tamper
 * with the amount that gets charged. Amounts mirror the copy on /checkout
 * and /reading (₹49 / ₹699 / ₹5,999).
 */
export const PLAN_CATALOG: Record<
  PlanKey,
  { amount: number; label: string; description: string; period: "one-time" | "monthly" | "yearly" }
> = {
  "one-time": {
    amount: 4900, // ₹49
    label: "Full Reading Unlock",
    description: "One-time unlock of the complete Shastra reading for this palm.",
    period: "one-time",
  },
  monthly: {
    amount: 69900, // ₹699
    label: "Premium Monthly",
    description: "Unlimited palm readings + unlimited Acharya chat.",
    period: "monthly",
  },
  yearly: {
    amount: 599900, // ₹5,999
    label: "Premium Yearly",
    description: "Everything in Monthly — best value, save 28%.",
    period: "yearly",
  },
};

let _client: Razorpay | null = null;

function client(): Razorpay {
  if (_client) return _client;
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error("Razorpay credentials missing (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET).");
  }
  _client = new Razorpay({ key_id, key_secret });
  return _client;
}

export function razorpayPublicKey(): string {
  return process.env.VITE_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "";
}

export async function createOrder(input: {
  plan: PlanKey;
  email: string;
  userId: string;
  name?: string;
}) {
  const plan = PLAN_CATALOG[input.plan];
  if (!plan) throw new Error(`Unknown plan: ${input.plan}`);

  // Razorpay receipt must be <= 40 chars.
  const receipt = `acharya_${input.plan.slice(0, 3)}_${Date.now().toString(36)}`.slice(0, 40);

  const order = await client().orders.create({
    amount: plan.amount,
    currency: "INR",
    receipt,
    notes: {
      plan: input.plan,
      user_email: input.email,
      user_anon_id: input.userId,
      product: plan.label,
    },
  });

  return {
    order,
    plan,
    key_id: razorpayPublicKey(),
    name: input.name,
  };
}

/**
 * Verify the checkout signature Razorpay sends back to the client. Called
 * from /api/razorpay-verify after the client-side checkout modal handler
 * fires. Uses a constant-time comparison to prevent timing leaks.
 */
export function verifyCheckoutSignature(params: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new Error("RAZORPAY_KEY_SECRET missing");
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${params.razorpay_order_id}|${params.razorpay_payment_id}`)
    .digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(params.razorpay_signature, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Verify Razorpay's webhook signature header (X-Razorpay-Signature). */
export function verifyWebhookSignature(rawBody: string, signatureHeader: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signatureHeader, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function fetchPayment(paymentId: string) {
  return client().payments.fetch(paymentId);
}
