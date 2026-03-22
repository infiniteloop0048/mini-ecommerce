import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

export const getPublishableKey = () =>
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
