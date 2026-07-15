"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type BillingPeriod = "monthly" | "yearly";

export function Pricing() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");

  const plans = [
    {
      name: "Free",
      description: "Perfect to start your journey",
      price: null,
      period: "Forever",
      badge: null,
      features: [
        "5 palm scans per month",
        "Full destiny reading",
        "Auto line tracing",
        "Reading history",
        "Community access",
      ],
      cta: {
        text: "Get Started",
        action: () => (window.location.href = "/scan"),
      },
      highlighted: false,
    },
    {
      name: "Premium Monthly",
      description: "For the devoted seeker",
      price: billingPeriod === "monthly" ? 9.99 : null,
      period: "per month",
      badge: "Popular",
      features: [
        "Unlimited palm scans",
        "Advanced readings",
        "Priority processing",
        "Full history archive",
        "Ask the Acharya",
        "Email support",
      ],
      cta: {
        text: "Subscribe Now",
        action: () => (window.location.href = "/checkout?plan=monthly"),
      },
      highlighted: true,
    },
    {
      name: "Premium Yearly",
      description: "Best value for annual commitment",
      price: billingPeriod === "yearly" ? 99.99 : null,
      period: "per year",
      badge: "Save 17%",
      features: [
        "Everything in Monthly",
        "20% annual discount",
        "Priority support",
        "Advanced analytics",
        "Export readings",
        "API access (coming soon)",
      ],
      cta: {
        text: "Subscribe Now",
        action: () => (window.location.href = "/checkout?plan=yearly"),
      },
      highlighted: false,
    },
  ];

  return (
    <section id="pricing" className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">
            Flexible Plans
          </span>
          <h2 className="text-4xl md:text-5xl font-serif leading-tight mt-4 mb-4">
            Find your path. <span className="italic text-accent">Your way.</span>
          </h2>
          <p className="text-foreground/70 text-base md:text-lg max-w-2xl mx-auto mb-8">
            Start free, upgrade anytime. All readings powered by ancient Hasta Samudrika Shastra and
            modern AI.
          </p>

          {/* Billing Toggle */}
          <div className="flex justify-center gap-4 mb-12">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                billingPeriod === "monthly"
                  ? "bg-accent text-accent-foreground"
                  : "bg-accent/10 text-foreground hover:bg-accent/20"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod("yearly")}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                billingPeriod === "yearly"
                  ? "bg-accent text-accent-foreground"
                  : "bg-accent/10 text-foreground hover:bg-accent/20"
              }`}
            >
              Yearly
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative ${
                plan.highlighted ? "border-accent/60 md:scale-105 shadow-lg" : ""
              }`}
            >
              {plan.badge && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-accent">
                  {plan.badge}
                </Badge>
              )}

              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Price */}
                <div>
                  {plan.price !== null ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">${plan.price}</span>
                      <span className="text-foreground/60">{plan.period}</span>
                    </div>
                  ) : (
                    <div className="text-4xl font-bold text-accent">Free</div>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <span className="text-accent mt-1">✧</span>
                      <span className="text-sm text-foreground/80">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  onClick={plan.cta.action}
                  className={`w-full ${
                    plan.highlighted
                      ? "bg-accent hover:bg-accent/90"
                      : "bg-accent/20 hover:bg-accent/30"
                  }`}
                >
                  {plan.cta.text}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* One-Time Option */}
        <div className="mt-12 p-8 rounded-lg border border-accent/20 bg-card/50">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-xl font-semibold mb-2">Just want one reading?</h3>
            <p className="text-foreground/70 mb-4">
              Try a single premium palm reading with advanced analysis for just $4.99
            </p>
            <Button
              onClick={() => {
                alert("One-time purchase coming soon! This will redirect to Stripe checkout.");
              }}
              className="bg-accent/20 hover:bg-accent/30"
            >
              One-Time Reading - $4.99
            </Button>
          </div>
        </div>

        {/* FAQ Note */}
        <div className="mt-12 text-center text-sm text-foreground/60">
          <p>
            All plans include our 30-day money-back guarantee. Unsatisfied?{" "}
            <a href="mailto:support@acharyaai.in" className="text-accent hover:underline">
              Contact support
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
