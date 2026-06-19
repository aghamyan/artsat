import type { Metadata } from "next";
import { getServerProfile } from "@/lib/auth";
import ProfileForm from "@/components/account/ProfileForm";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Profile | ${SITE_NAME}`,
  robots: { index: false },
};

export default async function ProfilePage() {
  const profile = await getServerProfile();
  if (!profile) return null;

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Edit Profile</h1>
      <ProfileForm profile={profile} />
    </div>
  );
}
