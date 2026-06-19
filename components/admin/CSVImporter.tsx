"use client";

import React, { useRef, useState } from "react";
import { Upload, CheckCircle, XCircle, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { CsvImportResult } from "@/lib/types";

const CSV_TEMPLATE = [
  "name,description,price,compare_price,category,sku,material,care_instructions,label,tags,is_featured,sizes,colors,color_hexes,stock",
  "Classic White Tee,Premium cotton t-shirt,2999,,T-Shirts,ART-001,100% Cotton,Machine wash cold,new,cotton;basic;essential,false,S;M;L;XL,White;Black,#FFFFFF;#000000,50",
  "Slim Fit Jeans,Modern slim fit jeans,5999,7999,Bottoms,ART-002,98% Cotton 2% Elastane,Cold wash,bestseller,denim;jeans,true,28;30;32;34,Indigo,,30",
].join("\n");

export function CSVImporter() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CsvImportResult[] | null>(null);

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "artsat_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please select a .csv file");
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/products/import", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error ?? "Import failed");

      const { results: importResults, successCount, errorCount } = json.data;
      setResults(importResults);
      toast.success(`Import complete: ${successCount} succeeded, ${errorCount} failed`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const successCount = results?.filter((r) => r.status === "success").length ?? 0;
  const errorCount = results?.filter((r) => r.status === "error").length ?? 0;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Template download */}
      <div className="rounded-lg border p-4 bg-muted/30 flex items-center justify-between">
        <div>
          <p className="font-medium text-sm">CSV Template</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Download the template to see required columns and format
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
          <Download className="h-4 w-4" /> Download Template
        </Button>
      </div>

      {/* Column reference */}
      <div className="rounded-lg border p-4 space-y-2">
        <p className="font-medium text-sm">Required Columns</p>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li><code className="bg-muted px-1 rounded">name</code> — Product name (required)</li>
          <li><code className="bg-muted px-1 rounded">price</code> — Price in dollars, e.g. <code>29.99</code> (required)</li>
          <li><code className="bg-muted px-1 rounded">sizes</code> — Semicolon-separated sizes, e.g. <code>S;M;L</code></li>
          <li><code className="bg-muted px-1 rounded">colors</code> — Semicolon-separated colors, e.g. <code>Black;White</code></li>
          <li><code className="bg-muted px-1 rounded">stock</code> — Initial stock per variant</li>
          <li><code className="bg-muted px-1 rounded">label</code> — new | sale | bestseller | limited</li>
          <li><code className="bg-muted px-1 rounded">category</code> — Category name (auto-created if not exists)</li>
        </ul>
      </div>

      {/* Upload zone */}
      <div
        className="rounded-xl border-2 border-dashed p-10 text-center cursor-pointer hover:border-foreground/40 transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        {loading ? (
          <div className="space-y-2">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Importing products…</p>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-sm font-medium">Click to upload CSV</p>
            <p className="text-xs text-muted-foreground">One CSV file, max 500 rows</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileChange}
          disabled={loading}
        />
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold">Import Results</h3>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {successCount} succeeded
            </Badge>
            {errorCount > 0 && (
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                {errorCount} failed
              </Badge>
            )}
          </div>

          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium">Row</th>
                  <th className="px-4 py-2.5 text-left font-medium">Product</th>
                  <th className="px-4 py-2.5 text-left font-medium">Status</th>
                  <th className="px-4 py-2.5 text-left font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {results.map((r) => (
                  <tr key={`${r.row}-${r.name}`} className="hover:bg-muted/20">
                    <td className="px-4 py-2.5 text-muted-foreground">{r.row}</td>
                    <td className="px-4 py-2.5 font-medium">{r.name}</td>
                    <td className="px-4 py-2.5">
                      {r.status === "success" ? (
                        <div className="flex items-center gap-1 text-green-700">
                          <CheckCircle className="h-4 w-4" /> Success
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-red-700">
                          <XCircle className="h-4 w-4" /> Error
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {r.status === "success"
                        ? r.product_id?.slice(0, 8) + "…"
                        : r.error}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
