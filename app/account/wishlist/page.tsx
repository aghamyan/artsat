import type { Metadata } from "next";
import { getServerProfile } from "@/lib/auth";
import { getWishlist } from "@/services/wishlist.service";
import WishlistItems from "@/components/account/WishlistItems";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Wishlist | ${SITE_NAME}`,
  robots: { index: false },
};

export default async function WishlistPage() {
  const profile = await getServerProfile();
  if (!profile) return null;

  const items = await getWishlist(profile.id);

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">My Wishlist</h1>
      <WishlistItems items={items} />
    </div>
  );
}
