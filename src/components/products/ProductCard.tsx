"use client";

import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types";
import { useCartStore } from "@/store/cartStore";

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const addItem = useCartStore((s) => s.addItem);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex flex-col shadow-sm">
      {/* Image */}
      <div className="relative h-52 bg-slate-100">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            No image
          </div>
        )}
        <Link
          href={`/products/${product.id}`}
          className="absolute inset-0 z-10 hover:bg-black/5 transition-colors"
          aria-label={`View ${product.name}`}
        />
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full w-fit mb-2">
          {product.category}
        </span>

        <h3 className="text-sm font-semibold text-slate-800 mb-1 line-clamp-2 flex-1">
          {product.name}
        </h3>

        <p className="text-xl font-bold text-indigo-600 mt-2">
          ${product.price.toFixed(2)}
        </p>

        <div className="flex gap-2 mt-3">
          <button
            onClick={() => addItem(product)}
            disabled={product.stock === 0}
            className="flex-1 text-sm font-medium bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
          </button>
          <Link
            href={`/products/${product.id}`}
            className="px-3 py-2 text-sm font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
}
