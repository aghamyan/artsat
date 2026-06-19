import React from "react";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import AccountNav from "@/components/account/AccountNav";
import { getServerProfile } from "@/lib/auth";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const profile = await getServerProfile();
  if (!profile) redirect("/login?redirect=/account");

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-10 w-full">
          <div className="flex flex-col md:flex-row gap-8">
            <AccountNav />
            <div className="flex-1 min-w-0">{children}</div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
