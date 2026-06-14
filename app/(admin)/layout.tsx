import React from "react";
import { AdminGuard } from "@/components/common/AdminGuard";
import { AdminNav } from "@/components/layout/AdminNav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="flex min-h-screen">
        <AdminNav />
        <main className="flex-1 bg-muted/30 overflow-auto">{children}</main>
      </div>
    </AdminGuard>
  );
}
