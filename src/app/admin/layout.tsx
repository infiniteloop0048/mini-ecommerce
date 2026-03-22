import Link from "next/link";
import { ReactNode } from "react";

const NAV_LINKS = [
  { href: "/admin", label: "Dashboard", icon: "▪" },
  { href: "/admin/products", label: "Products", icon: "▪" },
  { href: "/admin/orders", label: "Orders", icon: "▪" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-56 bg-slate-900 text-slate-100 flex flex-col flex-shrink-0">
        <div className="px-6 py-5 border-b border-slate-700">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
            ShopNext
          </p>
          <h2 className="text-lg font-bold text-white">Admin Panel</h2>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-6 py-4 border-t border-slate-700">
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            ← Back to Store
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
