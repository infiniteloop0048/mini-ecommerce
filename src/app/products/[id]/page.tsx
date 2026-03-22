"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types";
import { useCartStore } from "@/store/cartStore";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const addItem = useCartStore((s) => s.addItem);

  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data) => {
        if (data) setProduct(data);
        setLoading(false);
      });
  }, [id]);

  function handleAddToCart() {
    if (!product) return;
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-500">
        Loading…
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-gray-500 text-lg">Product not found.</p>
        <Link href="/products" className="text-indigo-600 hover:underline">
          Back to Products
        </Link>
      </div>
    );
  }

  const outOfStock = product.stock === 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link
        href="/products"
        className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline mb-8"
      >
        ← Back to Products
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        {/* Image */}
        <div className="relative h-80 md:h-[420px] bg-gray-100 rounded-2xl overflow-hidden">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No image
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full w-fit mb-3">
            {product.category}
          </span>

          <h1 className="text-2xl font-bold text-slate-900 mb-3">
            {product.name}
          </h1>

          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            {product.description}
          </p>

          <p className="text-3xl font-bold text-indigo-600 mb-2">
            ${product.price.toFixed(2)}
          </p>

          {outOfStock ? (
            <span className="inline-block text-sm font-medium text-red-500 bg-red-50 px-3 py-1 rounded-full w-fit mb-6">
              Out of Stock
            </span>
          ) : (
            <span className="inline-block text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full w-fit mb-6">
              {product.stock} in stock
            </span>
          )}

          {!outOfStock && (
            <div className="flex items-center gap-3 mb-6">
              <label className="text-sm font-medium text-gray-700">Qty:</label>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  −
                </button>
                <span className="px-4 py-1.5 text-sm font-medium border-x border-gray-300">
                  {quantity}
                </span>
                <button
                  onClick={() =>
                    setQuantity((q) => Math.min(product.stock, q + 1))
                  }
                  className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          )}

          <button
            onClick={handleAddToCart}
            disabled={outOfStock}
            className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {added ? "Added to Cart ✓" : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
}
