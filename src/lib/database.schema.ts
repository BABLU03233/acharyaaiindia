/**
 * Supabase Database Schema for Acharya AI
 *
 * This file documents the required database tables and migrations
 * Create these tables in your Supabase dashboard or use the migration files
 */

// ============================================================================
// USER PROFILES TABLE
// ============================================================================
/*
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  stripe_customer_id TEXT UNIQUE,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium_monthly', 'premium_yearly')),
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'canceled', 'past_due')),
  subscription_id TEXT,
  current_period_end TIMESTAMP,
  palm_scans_remaining INT DEFAULT 5,
  total_readings INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_stripe_customer_id ON public.user_profiles(stripe_customer_id);
*/

// ============================================================================
// ORDERS TABLE (Payment Transactions)
// ============================================================================
/*
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  amount_paid INT NOT NULL, -- in cents
  currency TEXT DEFAULT 'usd',
  payment_method TEXT,
  order_status TEXT DEFAULT 'pending' CHECK (order_status IN ('pending', 'completed', 'failed', 'refunded')),
  order_type TEXT NOT NULL CHECK (order_type IN ('one_time', 'subscription')),
  product_description TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_stripe_payment_intent_id ON public.orders(stripe_payment_intent_id);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
*/

// ============================================================================
// PALM READING HISTORY TABLE
// ============================================================================
/*
CREATE TABLE public.palm_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  palm_image_url TEXT,
  hand_side TEXT CHECK (hand_side IN ('left', 'right')),
  reading_text TEXT,
  reading_json JSONB,
  model_used TEXT DEFAULT 'claude-3.5-sonnet',
  processed_at TIMESTAMP DEFAULT now(),
  is_favorite BOOLEAN DEFAULT false,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_palm_readings_user_id ON public.palm_readings(user_id);
CREATE INDEX idx_palm_readings_created_at ON public.palm_readings(created_at DESC);
*/

// ============================================================================
// SUBSCRIPTIONS TABLE
// ============================================================================
/*
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_price_id TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'unpaid', 'canceled', 'paused')),
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  cancel_at TIMESTAMP,
  canceled_at TIMESTAMP,
  ended_at TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);
*/

// ============================================================================
// INVOICES TABLE
// ============================================================================
/*
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT UNIQUE NOT NULL,
  stripe_charge_id TEXT,
  amount INT NOT NULL, -- in cents
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'draft',
  invoice_pdf_url TEXT,
  invoice_number TEXT,
  due_date TIMESTAMP,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX idx_invoices_stripe_invoice_id ON public.invoices(stripe_invoice_id);
*/

// ============================================================================
// PRICING CONFIGURATION TABLE
// ============================================================================
/*
CREATE TABLE public.pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name TEXT UNIQUE NOT NULL,
  tier_slug TEXT UNIQUE NOT NULL CHECK (tier_slug IN ('free', 'premium_monthly', 'premium_yearly')),
  description TEXT,
  price INT, -- in cents, NULL for free tier
  billing_period TEXT, -- 'month', 'year', or NULL for free
  stripe_price_id TEXT,
  max_readings_per_month INT,
  max_palm_scans INT,
  features TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE UNIQUE INDEX idx_pricing_tiers_tier_slug ON public.pricing_tiers(tier_slug) WHERE is_active = true;
*/

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  stripe_customer_id?: string;
  subscription_tier: "free" | "premium_monthly" | "premium_yearly";
  subscription_status: "active" | "inactive" | "canceled" | "past_due";
  subscription_id?: string;
  current_period_end?: string;
  palm_scans_remaining: number;
  total_readings: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  stripe_payment_intent_id: string;
  stripe_customer_id: string;
  amount_paid: number;
  currency: string;
  payment_method?: string;
  order_status: "pending" | "completed" | "failed" | "refunded";
  order_type: "one_time" | "subscription";
  product_description?: string;
  created_at: string;
  updated_at: string;
}

export interface PalmReading {
  id: string;
  user_id: string;
  palm_image_url?: string;
  hand_side: "left" | "right";
  reading_text: string;
  reading_json?: Record<string, unknown>;
  model_used: string;
  processed_at: string;
  is_favorite: boolean;
  tags?: string[];
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_price_id: string;
  plan_name: string;
  status: "active" | "past_due" | "unpaid" | "canceled" | "paused";
  current_period_start: string;
  current_period_end: string;
  cancel_at?: string;
  canceled_at?: string;
  ended_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PricingTier {
  id: string;
  tier_name: string;
  tier_slug: "free" | "premium_monthly" | "premium_yearly";
  description?: string;
  price?: number;
  billing_period?: string;
  stripe_price_id?: string;
  max_readings_per_month?: number;
  max_palm_scans?: number;
  features?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
