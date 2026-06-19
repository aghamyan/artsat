import type { Metadata } from "next";
import { getServerProfile } from "@/lib/auth";
import { getAddresses } from "@/services/address.service";
import AddressList from "@/components/account/AddressList";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Addresses | ${SITE_NAME}`,
  robots: { index: false },
};

export default async function AddressesPage() {
  const profile = await getServerProfile();
  if (!profile) return null;

  const addresses = await getAddresses(profile.id);

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Saved Addresses</h1>
      <AddressList addresses={addresses} />
    </div>
  );
}
