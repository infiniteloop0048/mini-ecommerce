"use client";

import { useEffect, useState } from "react";
import ProductGrid from "@/components/products/ProductGrid";
import { Product } from "@/types";

const CATEGORIES = ["All", "Electronics", "Accessories", "Kitchen", "Footwear"];

export default function ProductsPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        setAllProducts(data);
        setLoading(false);
      });
  }, []);

  const filtered = allProducts.filter((p) => {
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-14 px-4 text-center">
        <h1 className="text-4xl font-bold mb-3">Welcome to ShopNext</h1>
        <p className="text-indigo-100 text-lg">
          Discover our curated collection of quality products
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="w-full sm:w-80 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-500">Loading products…</div>
        ) : (
          <ProductGrid products={filtered} />
        )}
      </div>
    </div>
  );
}
