import React from "react";
import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/constants";
import { PaymentAnalytics } from "@/components/admin/PaymentAnalytics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WebhookLog } from "@/components/admin/WebhookLog";

export const metadata: Metadata = {
  title: `Payments | Admin | ${SITE_NAME}`,
};

export default function AdminPaymentsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Payments</h1>

      <Tabs defaultValue="analytics">
        <TabsList>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="mt-6">
          <PaymentAnalytics />
        </TabsContent>

        <TabsContent value="webhooks" className="mt-6">
          <WebhookLog />
        </TabsContent>
      </Tabs>
    </div>
  );
}
