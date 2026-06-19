"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import type { CustomerWithStats } from "@/lib/types";

interface Props {
  customers: CustomerWithStats[];
  total: number;
  initialSearch?: string;
}

export default function CustomerList({ customers: initial, total, initialSearch = "" }: Props) {
  const [customers, setCustomers] = useState(initial);
  const [count, setCount] = useState(total);
  const [search, setSearch] = useState(initialSearch);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const fetchCustomers = async (q: string, p: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: "20" });
    if (q) params.set("search", q);
    const res = await fetch(`/api/admin/customers?${params}`);
    const json = await res.json();
    setCustomers(json.data?.customers ?? []);
    setCount(json.data?.total ?? 0);
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers(search, 1);
  };

  const totalPages = Math.ceil(count / 20);

  return (
    <div>
      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
        <button
          type="submit"
          className="bg-black text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800"
        >
          Search
        </button>
      </form>

      <p className="text-sm text-gray-500 mb-4">{count} customer{count !== 1 ? "s" : ""}</p>

      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : customers.length === 0 ? (
        <p className="text-sm text-gray-500">No customers found.</p>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Joined</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Orders</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">{c.full_name ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{c.email}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {format(new Date(c.created_at), "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{c.order_count ?? 0}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/customers/${c.id}`}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => { const p = Math.max(1, page - 1); setPage(p); fetchCustomers(search, p); }}
            disabled={page === 1}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-40"
          >
            Prev
          </button>
          <span className="px-3 py-1 text-sm text-gray-600">{page} / {totalPages}</span>
          <button
            onClick={() => { const p = Math.min(totalPages, page + 1); setPage(p); fetchCustomers(search, p); }}
            disabled={page === totalPages}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
