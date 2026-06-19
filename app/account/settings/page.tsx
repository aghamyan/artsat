import type { Metadata } from "next";
import { getServerProfile } from "@/lib/auth";
import { getEmailPreferences } from "@/services/customer.service";
import AccountSettings from "@/components/account/AccountSettings";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Account Settings | ${SITE_NAME}`,
  robots: { index: false },
};

export default async function SettingsPage() {
  const profile = await getServerProfile();
  if (!profile) return null;

  const prefs = await getEmailPreferences(profile.id);

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Account Settings</h1>
      <AccountSettings initialPrefs={prefs} />
    </div>
  );
}
