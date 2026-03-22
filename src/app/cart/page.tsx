"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/cartStore";

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, totalPrice } = useCartStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <p className="text-5xl mb-4">🛒</p>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Your cart is empty</h1>
        <p className="text-slate-500 mb-8">Add some products to get started.</p>
        <Link
          href="/products"
          className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Your Cart</h1>
        <button
          onClick={clearCart}
          className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
        >
          Clear cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items list */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(({ product, quantity }) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex gap-4 items-center"
            >
              {/* Thumbnail */}
              <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                    No image
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/products/${product.id}`}
                  className="font-semibold text-slate-800 hover:text-indigo-600 transition-colors line-clamp-1"
                >
                  {product.name}
                </Link>
                <p className="text-sm text-slate-500 mt-0.5">{product.category}</p>
                <p className="text-indigo-600 font-bold mt-1">
                  ${product.price.toFixed(2)}
                </p>
              </div>

              {/* Qty controls */}
              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => updateQuantity(product.id, quantity - 1)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 transition-colors text-sm"
                >
                  −
                </button>
                <span className="px-3 py-1.5 text-sm font-medium border-x border-slate-200 min-w-[2rem] text-center text-slate-800">
                  {quantity}
                </span>
                <button
                  onClick={() => updateQuantity(product.id, quantity + 1)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 transition-colors text-sm"
                >
                  +
                </button>
              </div>

              {/* Line total + remove */}
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-slate-800">
                  ${(product.price * quantity).toFixed(2)}
                </p>
                <button
                  onClick={() => removeItem(product.id)}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors mt-1"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 h-fit sticky top-20">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Order Summary</h2>

          <div className="space-y-2 text-sm text-slate-600 mb-4">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="flex justify-between">
                <span className="truncate max-w-[160px]">{product.name} × {quantity}</span>
                <span className="font-medium text-slate-800">
                  ${(product.price * quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-4 flex justify-between font-bold text-slate-900 text-base">
            <span>Total</span>
            <span className="text-indigo-600">${totalPrice().toFixed(2)}</span>
          </div>

          <Link
            href="/checkout"
            className="mt-6 block w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors text-center"
          >
            Proceed to Checkout
          </Link>

          <Link
            href="/products"
            className="mt-3 block text-center text-sm text-slate-500 hover:text-indigo-600 transition-colors"
          >
            ← Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
