"use client";

import { useState } from "react";
import type { CustomerAddress } from "@/lib/types";
import AddressForm from "./AddressForm";

interface Props {
  addresses: CustomerAddress[];
}

export default function AddressList({ addresses: initial }: Props) {
  const [addresses, setAddresses] = useState(initial);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleSaved = (saved: CustomerAddress) => {
    setAddresses((prev) => {
      const idx = prev.findIndex((a) => a.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    setEditing(null);
    setAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this address?")) return;
    setDeleting(id);
    await fetch(`/api/addresses/${id}`, { method: "DELETE" });
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    setDeleting(null);
  };

  return (
    <div className="space-y-4">
      {addresses.length === 0 && !adding && (
        <p className="text-gray-500 text-sm">No saved addresses yet.</p>
      )}

      {addresses.map((address) => (
        <div key={address.id} className="border border-gray-200 rounded-xl p-4">
          {editing === address.id ? (
            <AddressForm
              address={address}
              onSaved={handleSaved}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <div className="flex justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium capitalize">{address.label}</span>
                  {address.is_default && (
                    <span className="text-xs bg-black text-white px-2 py-0.5 rounded-full">Default</span>
                  )}
                  {address.is_billing && (
                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">Billing</span>
                  )}
                </div>
                <p className="text-sm text-gray-800">{address.full_name}</p>
                <p className="text-sm text-gray-600">{address.phone}</p>
                <p className="text-sm text-gray-600">{address.address_line1}</p>
                {address.address_line2 && (
                  <p className="text-sm text-gray-600">{address.address_line2}</p>
                )}
                <p className="text-sm text-gray-600">
                  {address.city}, {address.postal_code}
                </p>
                <p className="text-sm text-gray-600">{address.country}</p>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={() => setEditing(address.id)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(address.id)}
                  disabled={deleting === address.id}
                  className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50"
                >
                  {deleting === address.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {adding ? (
        <div className="border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-4">New Address</h3>
          <AddressForm onSaved={handleSaved} onCancel={() => setAdding(false)} />
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="text-sm font-medium text-black border border-black rounded-lg px-4 py-2 hover:bg-black hover:text-white transition-colors"
        >
          + Add New Address
        </button>
      )}
    </div>
  );
}
