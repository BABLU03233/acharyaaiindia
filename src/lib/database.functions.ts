import { createClient } from "@supabase/supabase-js";
import type { UserProfile, Order, PalmReading, Subscription, PricingTier } from "./database.schema";

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase credentials not configured");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// USER PROFILE FUNCTIONS
// ============================================================================

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

export async function createUserProfile(
  userId: string,
  email: string,
  fullName?: string,
): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .insert({
        id: userId,
        email,
        full_name: fullName,
        subscription_tier: "free",
        subscription_status: "inactive",
        palm_scans_remaining: 5,
        total_readings: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error("Error creating user profile:", error);
    return null;
  }
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>,
): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error("Error updating user profile:", error);
    return null;
  }
}

// ============================================================================
// ORDER FUNCTIONS
// ============================================================================

export async function createOrder(
  order: Omit<Order, "id" | "created_at" | "updated_at">,
): Promise<Order | null> {
  try {
    const { data, error } = await supabase.from("orders").insert(order).select().single();

    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error("Error creating order:", error);
    return null;
  }
}

export async function getOrderByPaymentIntentId(paymentIntentId: string): Promise<Order | null> {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("stripe_payment_intent_id", paymentIntentId)
      .single();

    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error("Error fetching order:", error);
    return null;
  }
}

export async function updateOrderStatus(orderId: string, status: string): Promise<Order | null> {
  try {
    const { data, error } = await supabase
      .from("orders")
      .update({
        order_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select()
      .single();

    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error("Error updating order:", error);
    return null;
  }
}

export async function getUserOrders(userId: string, limit: number = 50): Promise<Order[]> {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return [];
  }
}

// ============================================================================
// PALM READING FUNCTIONS
// ============================================================================

export async function savePalmReading(
  reading: Omit<PalmReading, "id" | "created_at">,
): Promise<PalmReading | null> {
  try {
    const { data, error } = await supabase.from("palm_readings").insert(reading).select().single();

    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error("Error saving palm reading:", error);
    return null;
  }
}

export async function getUserPalmReadings(userId: string): Promise<PalmReading[]> {
  try {
    const { data, error } = await supabase
      .from("palm_readings")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching palm readings:", error);
    return [];
  }
}

export async function getPalmReadingById(readingId: string): Promise<PalmReading | null> {
  try {
    const { data, error } = await supabase
      .from("palm_readings")
      .select("*")
      .eq("id", readingId)
      .single();

    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error("Error fetching palm reading:", error);
    return null;
  }
}

export async function toggleFavoritePalmReading(
  readingId: string,
  isFavorite: boolean,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("palm_readings")
      .update({ is_favorite: isFavorite })
      .eq("id", readingId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error toggling favorite:", error);
    return false;
  }
}

// ============================================================================
// SUBSCRIPTION FUNCTIONS
// ============================================================================

export async function createSubscription(
  subscription: Omit<Subscription, "id" | "created_at" | "updated_at">,
): Promise<Subscription | null> {
  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .insert(subscription)
      .select()
      .single();

    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error("Error creating subscription:", error);
    return null;
  }
}

export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      throw error;
    }

    return data || null;
  } catch (error) {
    console.error("Error fetching user subscription:", error);
    return null;
  }
}

export async function updateSubscriptionStatus(
  subscriptionId: string,
  status: string,
): Promise<Subscription | null> {
  try {
    const { data, error } = await supabase
      .from("subscriptions")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscriptionId)
      .select()
      .single();

    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error("Error updating subscription status:", error);
    return null;
  }
}

// ============================================================================
// PRICING TIER FUNCTIONS
// ============================================================================

export async function getPricingTiers(): Promise<PricingTier[]> {
  try {
    const { data, error } = await supabase
      .from("pricing_tiers")
      .select("*")
      .eq("is_active", true)
      .order("price", { ascending: true, nullsFirst: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching pricing tiers:", error);
    return [];
  }
}

export async function getPricingTier(tierSlug: string): Promise<PricingTier | null> {
  try {
    const { data, error } = await supabase
      .from("pricing_tiers")
      .select("*")
      .eq("tier_slug", tierSlug)
      .single();

    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error("Error fetching pricing tier:", error);
    return null;
  }
}
