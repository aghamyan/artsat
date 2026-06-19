import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getAllReturns } from "@/services/return.service";
import ReturnProcessing from "@/components/admin/ReturnProcessing";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Returns | Admin | ${SITE_NAME}`,
};

export default async function AdminReturnsPage() {
  await requireAdmin();
  const { returns, total } = await getAllReturns(1, 20);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Returns & Exchanges</h1>
      <ReturnProcessing returns={returns} total={total} />
    </div>
  );
}
