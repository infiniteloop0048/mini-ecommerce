"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useCartStore } from "@/store/cartStore";

function CartIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 9m12-9l2 9M9 21a1 1 0 100-2 1 1 0 000 2zm6 0a1 1 0 100-2 1 1 0 000 2z"
      />
    </svg>
  );
}

export default function Navbar() {
  const { data: session } = useSession();
  const itemCount = useCartStore((s) => s.totalItems());
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left — brand + nav links */}
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="text-xl font-bold text-indigo-600 tracking-tight"
            >
              ShopNext
            </Link>
            <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-gray-600">
              <Link href="/" className="hover:text-indigo-600 transition-colors">
                Home
              </Link>
              <Link
                href="/products"
                className="hover:text-indigo-600 transition-colors"
              >
                Products
              </Link>
            </div>
          </div>

          {/* Right — cart + auth */}
          <div className="flex items-center gap-4">
            <Link
              href="/cart"
              className="relative p-2 text-gray-600 hover:text-indigo-600 transition-colors"
            >
              <CartIcon />
              {mounted && itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-indigo-600 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </Link>

            {session ? (
              <div className="flex items-center gap-3">
                {session.user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="text-sm font-medium bg-slate-800 text-white px-3 py-1.5 rounded-lg hover:bg-slate-900 transition-colors"
                  >
                    Admin
                  </Link>
                )}
                <span className="hidden sm:block text-sm text-gray-600 truncate max-w-[160px]">
                  {session.user.email}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-sm font-medium text-gray-600 hover:text-red-500 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
