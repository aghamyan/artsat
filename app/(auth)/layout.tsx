import React from "react";
import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-12">
      <Link href="/" className="mb-8 text-2xl font-bold tracking-tight">
        {SITE_NAME}
      </Link>
      <div className="w-full max-w-sm bg-background border rounded-xl shadow-sm p-8">
        {children}
      </div>
    </div>
  );
}
