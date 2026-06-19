"use client";

import { useState } from "react";
import { format } from "date-fns";
import type { ReturnExchangeWithItems, ReturnStatus } from "@/lib/types";

const STATUS_OPTIONS: ReturnStatus[] = ["pending", "approved", "rejected", "shipped_back", "completed", "cancelled"];

interface Props {
  returns: ReturnExchangeWithItems[];
  total: number;
}

export default function ReturnProcessing({ returns: initial, total }: Props) {
  const [returns, setReturns] = useState(initial);
  const [count, setCount] = useState(total);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, { status: ReturnStatus; tracking_number: string; notes: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const startEdit = (r: ReturnExchangeWithItems) => {
    setEditing(r.id);
    setForm((f) => ({
      ...f,
      [r.id]: {
        status: r.status,
        tracking_number: r.tracking_number ?? "",
        notes: r.notes ?? "",
      },
    }));
  };

  const handleSave = async (id: string) => {
    setSaving(id);
    const body = form[id];
    const res = await fetch(`/api/admin/returns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(null);

    if (res.ok) {
      setReturns((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, ...body, tracking_number: body.tracking_number || null, notes: body.notes || null } : r
        )
      );
      setEditing(null);
    }
  };

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">{count} request{count !== 1 ? "s" : ""}</p>

      {returns.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-16">No return requests.</p>
      ) : (
        <div className="space-y-4">
          {returns.map((r) => (
            <div key={r.id} className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <p className="text-sm font-semibold capitalize">
                    {r.request_type} — {r.order_item?.product_name ?? "Item"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Order #{(r.order as unknown as { order_number?: string })?.order_number} · {format(new Date(r.requested_at), "MMM d, yyyy")}
                  </p>
                  <p className="text-xs text-gray-500">
                    Reason: {r.reason.replace("_", " ")}
                    {r.reason_description && ` — ${r.reason_description}`}
                  </p>
                  {r.tracking_number && (
                    <p className="text-xs text-gray-500 mt-1">Tracking: {r.tracking_number}</p>
                  )}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                  r.status === "completed" ? "bg-green-100 text-green-700" :
                  r.status === "rejected" ? "bg-red-100 text-red-700" :
                  "bg-yellow-100 text-yellow-800"
                }`}>
                  {r.status.replace("_", " ")}
                </span>
              </div>

              {editing === r.id ? (
                <div className="space-y-2 mt-3">
                  <select
                    value={form[r.id]?.status}
                    onChange={(e) => setForm((f) => ({ ...f, [r.id]: { ...f[r.id], status: e.target.value as ReturnStatus } }))}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s.replace("_", " ")}</option>
                    ))}
                  </select>
                  <input
                    value={form[r.id]?.tracking_number ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, [r.id]: { ...f[r.id], tracking_number: e.target.value } }))}
                    placeholder="Tracking number (optional)"
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none"
                  />
                  <textarea
                    value={form[r.id]?.notes ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, [r.id]: { ...f[r.id], notes: e.target.value } }))}
                    placeholder="Internal notes (optional)"
                    rows={2}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSave(r.id)}
                      disabled={saving === r.id}
                      className="bg-black text-white text-xs px-4 py-1.5 rounded-lg hover:bg-gray-800 disabled:opacity-50"
                    >
                      {saving === r.id ? "Saving..." : "Save"}
                    </button>
                    <button onClick={() => setEditing(null)} className="text-xs text-gray-600 px-4 py-1.5">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => startEdit(r)}
                  className="mt-2 text-xs text-blue-600 hover:underline"
                >
                  Process
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
