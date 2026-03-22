import { prisma } from "@/lib/prisma";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  SHIPPED: "bg-indigo-100 text-indigo-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default async function AdminDashboard() {
  const [productCount, orderCount, userCount, revenueResult, recentOrders] =
    await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.user.count(),
      prisma.order.aggregate({ _sum: { totalPrice: true } }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } } },
      }),
    ]);

  const totalRevenue = revenueResult._sum.totalPrice ?? 0;

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
            Products
          </p>
          <p className="text-4xl font-bold text-indigo-600">{productCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
            Orders
          </p>
          <p className="text-4xl font-bold text-blue-600">{orderCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
            Users
          </p>
          <p className="text-4xl font-bold text-purple-600">{userCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
            Total Revenue
          </p>
          <p className="text-4xl font-bold text-green-600">
            ${totalRevenue.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Quick links */}
      <div className="flex gap-4 mb-10">
        <Link
          href="/admin/products"
          className="inline-block bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm"
        >
          Manage Products
        </Link>
        <Link
          href="/admin/orders"
          className="inline-block bg-slate-700 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-slate-800 transition-colors text-sm"
        >
          Manage Orders
        </Link>
      </div>

      {/* Recent orders */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4">Recent Orders</h2>

        {recentOrders.length === 0 ? (
          <p className="text-slate-500 text-sm">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wide">
                <tr>
                  <th className="px-5 py-3">Order ID</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-mono text-xs text-slate-400">
                      #{order.id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-5 py-3 text-slate-700">
                      {order.user.name ?? order.user.email}
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-800">
                      ${order.totalPrice.toFixed(2)}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          STATUS_COLORS[order.status] ?? "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
