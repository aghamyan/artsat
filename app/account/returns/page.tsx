import type { Metadata } from "next";
import { getServerProfile } from "@/lib/auth";
import { getCustomerReturns } from "@/services/return.service";
import ReturnsList from "@/components/account/ReturnsList";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Returns | ${SITE_NAME}`,
  robots: { index: false },
};

export default async function ReturnsPage() {
  const profile = await getServerProfile();
  if (!profile) return null;

  const returns = await getCustomerReturns(profile.id);

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Returns & Exchanges</h1>
      <ReturnsList returns={returns} />
    </div>
  );
}
