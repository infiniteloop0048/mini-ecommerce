"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Order } from "@/types";
import { useCartStore } from "@/store/cartStore";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  SHIPPED: "bg-indigo-100 text-indigo-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

// Isolated component so useSearchParams is inside a Suspense boundary
function SuccessBanner() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "true";
  const clearCart = useCartStore((s) => s.clearCart);

  useEffect(() => {
    if (success) clearCart();
  }, [success, clearCart]);

  if (!success) return null;

  return (
    <div className="mb-6 flex items-start gap-3 bg-green-50 border border-green-200 rounded-2xl px-5 py-4">
      <span className="text-green-500 text-xl leading-none mt-0.5">✓</span>
      <div>
        <p className="font-semibold text-green-800">Payment successful!</p>
        <p className="text-sm text-green-700 mt-0.5">
          Your order has been placed. It may take a moment to appear below.
        </p>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load orders");
        return r.json();
      })
      .then((data) => {
        setOrders(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <p className="text-slate-500">Loading orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Suspense required by Next.js for useSearchParams in static prerendering */}
      <Suspense fallback={null}>
        <SuccessBanner />
      </Suspense>

      <h1 className="text-3xl font-bold text-slate-900 mb-8">Your Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">📦</p>
          <h2 className="text-xl font-bold text-slate-800 mb-2">No orders yet</h2>
          <p className="text-slate-500 mb-8">
            Your order history will appear here once you place an order.
          </p>
          <Link
            href="/products"
            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
            >
              {/* Order header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-mono text-slate-400 mb-1">
                    #{order.id.slice(-8).toUpperCase()}
                  </p>
                  <p className="text-sm text-slate-500">
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      STATUS_COLORS[order.status] ?? "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {order.status}
                  </span>
                  <span className="font-bold text-indigo-600">
                    ${order.totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Order items */}
              <div className="border-t border-slate-100 pt-4 space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm text-slate-600">
                    <span>
                      {item.product.name} × {item.quantity}
                    </span>
                    <span className="font-medium text-slate-800">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
