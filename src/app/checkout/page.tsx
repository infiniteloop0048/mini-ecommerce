"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCartStore } from "@/store/cartStore";

interface ShippingForm {
  fullName: string;
  email: string;
  address: string;
  city: string;
  country: string;
}

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { items, totalPrice } = useCartStore();

  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ShippingForm>({
    fullName: "",
    email: "",
    address: "",
    city: "",
    country: "",
  });

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (session?.user?.email) {
      setForm((f) => ({ ...f, email: session.user.email ?? "" }));
    }
  }, [session]);

  if (!mounted) return null;

  if (status === "unauthenticated") {
    router.push("/auth/login");
    return null;
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <p className="text-5xl mb-4">🛒</p>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Your cart is empty</h1>
        <p className="text-slate-500 mb-8">Add some products before checking out.</p>
        <Link
          href="/products"
          className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map(({ product, quantity }) => ({
            productId: product.id,
            quantity,
          })),
        }),
      });

      // Safely parse JSON — a 500 with no body would otherwise throw
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};

      if (!res.ok) {
        throw new Error(data.error ?? `Server error (${res.status})`);
      }

      if (!data.url) {
        throw new Error("No checkout URL returned from server");
      }

      // Redirect to Stripe's hosted checkout page
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  };

  const subtotal = totalPrice();
  const itemCount = items.reduce((sum, { quantity }) => sum + quantity, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Checkout</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Shipping form */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-5">Shipping Information</h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1">
                  Address
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  required
                  value={form.address}
                  onChange={handleChange}
                  placeholder="123 Main Street"
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-slate-700 mb-1">
                    City
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    required
                    value={form.city}
                    onChange={handleChange}
                    placeholder="New York"
                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-slate-700 mb-1">
                    Country
                  </label>
                  <input
                    id="country"
                    name="country"
                    type="text"
                    required
                    value={form.country}
                    onChange={handleChange}
                    placeholder="United States"
                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Stripe info notice */}
          <div className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-600">
            <span className="text-lg leading-none mt-0.5">🔒</span>
            <p>
              Your payment is processed securely by{" "}
              <span className="font-semibold text-slate-800">Stripe</span>. You will
              be redirected to complete your card details.
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {error}
            </p>
          )}
        </div>

        {/* Order summary */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 h-fit sticky top-20">
          <h2 className="text-lg font-bold text-slate-800 mb-1">Order Summary</h2>
          <p className="text-sm text-slate-400 mb-4">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </p>

          <div className="space-y-2 text-sm text-slate-600 mb-4">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="flex justify-between">
                <span className="truncate max-w-[150px]">
                  {product.name} × {quantity}
                </span>
                <span className="font-medium text-slate-800">
                  ${(product.price * quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-4 flex justify-between font-bold text-slate-900 text-base mb-6">
            <span>Total</span>
            <span className="text-indigo-600">${subtotal.toFixed(2)}</span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Redirecting…
              </>
            ) : (
              "Pay with Stripe"
            )}
          </button>

          <Link
            href="/cart"
            className="mt-3 block text-center text-sm text-slate-500 hover:text-indigo-600 transition-colors"
          >
            ← Back to Cart
          </Link>
        </div>
      </form>
    </div>
  );
}
