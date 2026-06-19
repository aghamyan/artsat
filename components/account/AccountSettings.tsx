"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { EmailPreferences } from "@/lib/types";
import ChangePasswordForm from "./ChangePasswordForm";

const PREF_LABELS: Array<{ key: keyof Omit<EmailPreferences, "id" | "customer_id" | "updated_at">; label: string; description: string }> = [
  { key: "order_notifications", label: "Order Notifications", description: "Updates on your order status" },
  { key: "review_invitations", label: "Review Invitations", description: "Reminders to review purchased products" },
  { key: "marketing_emails", label: "Marketing Emails", description: "Promotions and special offers" },
  { key: "product_alerts", label: "Product Alerts", description: "Back-in-stock and price drop alerts" },
  { key: "newsletter", label: "Newsletter", description: "Style tips and brand news" },
];

interface Props {
  initialPrefs: EmailPreferences | null;
}

export default function AccountSettings({ initialPrefs }: Props) {
  const router = useRouter();
  const [prefs, setPrefs] = useState<Omit<EmailPreferences, "id" | "customer_id" | "updated_at">>({
    order_notifications: initialPrefs?.order_notifications ?? true,
    marketing_emails: initialPrefs?.marketing_emails ?? false,
    product_alerts: initialPrefs?.product_alerts ?? false,
    review_invitations: initialPrefs?.review_invitations ?? true,
    newsletter: initialPrefs?.newsletter ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [prefSaved, setPrefSaved] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handlePrefChange = (key: keyof typeof prefs) => {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
    setPrefSaved(false);
  };

  const savePrefs = async () => {
    setSaving(true);
    await fetch("/api/account/email-prefs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prefs),
    });
    setSaving(false);
    setPrefSaved(true);
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError("Please enter your password");
      return;
    }
    setDeleting(true);
    setDeleteError(null);

    const res = await fetch("/api/account/delete-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: deletePassword }),
    });
    const json = await res.json();
    setDeleting(false);

    if (!res.ok) {
      setDeleteError(json.error ?? "Failed to delete account");
      return;
    }

    router.push("/");
  };

  return (
    <div className="space-y-10 max-w-lg">
      {/* Change Password */}
      <section>
        <h2 className="text-base font-semibold mb-4">Change Password</h2>
        <ChangePasswordForm />
      </section>

      {/* Email Preferences */}
      <section>
        <h2 className="text-base font-semibold mb-4">Email Preferences</h2>
        <div className="space-y-3">
          {PREF_LABELS.map(({ key, label, description }) => (
            <div key={key} className="flex items-center justify-between gap-4 py-2 border-b border-gray-100 last:border-0">
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-gray-500">{description}</p>
              </div>
              <button
                onClick={() => handlePrefChange(key)}
                className={`relative w-10 h-5 rounded-full transition-colors ${prefs[key] ? "bg-black" : "bg-gray-300"}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${prefs[key] ? "translate-x-5" : ""}`}
                />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={savePrefs}
            disabled={saving}
            className="bg-black text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : "Save Preferences"}
          </button>
          {prefSaved && <span className="text-sm text-green-600">Saved!</span>}
        </div>
      </section>

      {/* Danger Zone */}
      <section className="border border-red-200 rounded-xl p-5">
        <h2 className="text-base font-semibold text-red-700 mb-2">Danger Zone</h2>
        <p className="text-sm text-gray-600 mb-4">
          Deleting your account is permanent. Your data will be retained for legal purposes but your account will no longer be accessible.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="text-sm font-medium text-red-600 border border-red-300 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
        >
          Delete Account
        </button>
      </section>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl">
            <h3 className="text-base font-semibold mb-2">Confirm Account Deletion</h3>
            <p className="text-sm text-gray-600 mb-4">Enter your password to confirm.</p>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Your password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            {deleteError && <p className="text-sm text-red-600 mb-3">{deleteError}</p>}
            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 bg-red-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting ? "Deleting..." : "Delete My Account"}
              </button>
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteError(null); setDeletePassword(""); }}
                className="flex-1 border border-gray-300 text-sm py-2.5 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
