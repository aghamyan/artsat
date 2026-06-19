import React from "react";
import type { Metadata } from "next";
import { CSVImporter } from "@/components/admin/CSVImporter";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = { title: `Import Products | Admin | ${SITE_NAME}` };

export default function ImportPage() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bulk Import Products</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload a CSV file to create multiple products at once. Categories are auto-created if they don&apos;t exist.
        </p>
      </div>
      <CSVImporter />
    </div>
  );
}
