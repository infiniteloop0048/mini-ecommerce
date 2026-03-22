import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductGrid from "@/components/products/ProductGrid";
import { Product } from "@/types";

export default async function Home() {
  let featured: Product[] = [];
  try {
    featured = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
    });
  } catch {
    // DB unavailable — still render the page
  }

  return (
    <>
      {/* Hero */}
      <section className="bg-indigo-600 text-white py-20 px-4 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
          Welcome to ShopNext
        </h1>
        <p className="text-indigo-200 text-lg mb-8 max-w-xl mx-auto">
          Discover quality products at great prices — electronics, accessories, kitchen essentials, and more.
        </p>
        <Link
          href="/products"
          className="inline-block bg-white text-indigo-600 font-semibold px-8 py-3 rounded-xl hover:bg-indigo-50 transition-colors"
        >
          Shop Now
        </Link>
      </section>

      {/* Featured Products */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">
          {featured.length > 0 ? "Featured Products" : "Start Shopping"}
        </h2>

        {featured.length > 0 ? (
          <ProductGrid products={featured} />
        ) : (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg mb-4">No products yet — check back soon!</p>
            <Link href="/products" className="text-indigo-600 hover:underline font-medium">
              Browse all products
            </Link>
          </div>
        )}

        {featured.length > 0 && (
          <div className="text-center mt-10">
            <Link
              href="/products"
              className="inline-block border border-indigo-600 text-indigo-600 font-medium px-6 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors"
            >
              View All Products
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
