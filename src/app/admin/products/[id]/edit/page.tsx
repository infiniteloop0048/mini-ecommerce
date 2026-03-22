"use client";

import { useEffect, useState, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { Product } from "@/types";

const CATEGORIES = ["Electronics", "Accessories", "Kitchen", "Footwear"];

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Product not found");
        return r.json();
      })
      .then((data) => {
        setProduct(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load product.");
        setLoading(false);
      });
  }, [id]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      description: (form.elements.namedItem("description") as HTMLTextAreaElement).value,
      price: (form.elements.namedItem("price") as HTMLInputElement).value,
      stock: (form.elements.namedItem("stock") as HTMLInputElement).value,
      category: (form.elements.namedItem("category") as HTMLSelectElement).value,
      imageUrl: (form.elements.namedItem("imageUrl") as HTMLInputElement).value || null,
    };

    const res = await fetch(`/api/admin/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      router.push("/admin/products");
    } else {
      const body = await res.json();
      setError(body.error || "Failed to update product.");
      setSubmitting(false);
    }
  }

  if (loading) {
    return <main className="p-8"><p className="text-slate-500">Loading…</p></main>;
  }

  if (error && !product) {
    return <main className="p-8"><p className="text-red-600">{error}</p></main>;
  }

  return (
    <main className="max-w-xl p-8">
      <h1 className="text-3xl font-bold mb-6">Edit Product</h1>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={product?.name}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={3}
            defaultValue={product?.description}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="price">
              Price ($)
            </label>
            <input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={product?.price}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="stock">
              Stock
            </label>
            <input
              id="stock"
              name="stock"
              type="number"
              min="0"
              required
              defaultValue={product?.stock}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="category">
            Category
          </label>
          <select
            id="category"
            name="category"
            required
            defaultValue={product?.category}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select a category</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="imageUrl">
            Image URL <span className="text-gray-400">(optional)</span>
          </label>
          <input
            id="imageUrl"
            name="imageUrl"
            type="url"
            defaultValue={product?.imageUrl ?? ""}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}
