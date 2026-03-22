"use client";

import { useEffect, useState } from "react";

const ORDER_STATUSES = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

type OrderStatus = (typeof ORDER_STATUSES)[number];

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  SHIPPED: "bg-indigo-100 text-indigo-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

interface AdminOrder {
  id: string;
  createdAt: string;
  totalPrice: number;
  status: OrderStatus;
  user: { name: string | null; email: string };
  items: { id: string; quantity: number; product: { name: string } }[];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((data) => {
        setOrders(data);
        setLoading(false);
      });
  }, []);

  async function handleStatusChange(orderId: string, newStatus: OrderStatus) {
    setUpdating(orderId);
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.ok) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    }
    setUpdating(null);
  }

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Orders</h1>

      {loading ? (
        <p className="text-slate-500">Loading orders…</p>
      ) : orders.length === 0 ? (
        <p className="text-slate-500">No orders yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs tracking-wide">
              <tr>
                <th className="px-5 py-3">Order ID</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Items</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  {/* Order ID */}
                  <td className="px-5 py-4 font-mono text-xs text-slate-500">
                    #{order.id.slice(-8).toUpperCase()}
                  </td>

                  {/* Customer */}
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-800">
                      {order.user.name ?? "—"}
                    </p>
                    <p className="text-xs text-slate-400">{order.user.email}</p>
                  </td>

                  {/* Date */}
                  <td className="px-5 py-4 text-slate-600">
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>

                  {/* Items count */}
                  <td className="px-5 py-4 text-slate-600">
                    <span
                      title={order.items
                        .map((i) => `${i.product.name} ×${i.quantity}`)
                        .join(", ")}
                    >
                      {order.items.reduce((s, i) => s + i.quantity, 0)} item
                      {order.items.reduce((s, i) => s + i.quantity, 0) !== 1
                        ? "s"
                        : ""}
                    </span>
                  </td>

                  {/* Total */}
                  <td className="px-5 py-4 font-semibold text-slate-800">
                    ${order.totalPrice.toFixed(2)}
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status]}`}
                      >
                        {order.status}
                      </span>
                      <select
                        value={order.status}
                        disabled={updating === order.id}
                        onChange={(e) =>
                          handleStatusChange(
                            order.id,
                            e.target.value as OrderStatus
                          )
                        }
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
