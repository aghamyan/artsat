"use client";

import React, { useState } from "react";
import { Plus, Trash2, Pencil, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { ProductVariant } from "@/lib/types";
import { CLOTHING_SIZES } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

interface VariantManagerProps {
  productId: string;
  initialVariants: ProductVariant[];
}

interface NewVariantForm {
  sku: string;
  size: string;
  color: string;
  color_hex: string;
  price_delta: number;
  stock: number;
  reorder_level: number;
}

const EMPTY_FORM: NewVariantForm = {
  sku: "",
  size: "__none__",
  color: "",
  color_hex: "",
  price_delta: 0,
  stock: 0,
  reorder_level: 5,
};

export function VariantManager({ productId, initialVariants }: VariantManagerProps) {
  const [variants, setVariants] = useState<ProductVariant[]>(initialVariants);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewVariantForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStock, setEditStock] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  async function handleCreate() {
    if (!form.sku.trim()) {
      toast.error("SKU is required");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          size: form.size === "__none__" || !form.size ? null : form.size,
          color: form.color || null,
          color_hex: form.color_hex || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to create variant");
      setVariants((prev) => [...prev, json.data]);
      setForm(EMPTY_FORM);
      setShowForm(false);
      toast.success("Variant created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStockSave(variantId: string) {
    const newStock = parseInt(editStock[variantId] ?? "0");
    if (isNaN(newStock) || newStock < 0) {
      toast.error("Stock must be a non-negative integer");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}/variants`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variant_id: variantId, stock: newStock }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to update stock");
      setVariants((prev) =>
        prev.map((v) => (v.id === variantId ? { ...v, stock: newStock } : v))
      );
      setEditingId(null);
      toast.success("Stock updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(variantId: string) {
    if (!confirm("Delete this variant? Orders referencing it will keep historical data."))
      return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}/variants`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variant_id: variantId }),
      });
      if (!res.ok) throw new Error("Failed to delete variant");
      setVariants((prev) => prev.filter((v) => v.id !== variantId));
      toast.success("Variant deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleToggleActive(variant: ProductVariant) {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}/variants`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variant_id: variant.id, is_active: !variant.is_active }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to update");
      setVariants((prev) =>
        prev.map((v) =>
          v.id === variant.id ? { ...v, is_active: !variant.is_active } : v
        )
      );
      toast.success(variant.is_active ? "Variant deactivated" : "Variant activated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Variants ({variants.length})</h2>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowForm(!showForm)}
          disabled={isLoading}
        >
          <Plus className="h-4 w-4 mr-1" /> Add Variant
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
          <h3 className="font-medium text-sm">New Variant</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-xs">SKU *</Label>
              <Input
                value={form.sku}
                onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                placeholder="ART-001-BLK-M"
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Size</Label>
              <Select
                value={form.size}
                onValueChange={(v) => setForm((f) => ({ ...f, size: v }))}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {CLOTHING_SIZES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Color</Label>
              <Input
                value={form.color}
                onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                placeholder="Black"
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Color Hex</Label>
              <Input
                value={form.color_hex}
                onChange={(e) => setForm((f) => ({ ...f, color_hex: e.target.value }))}
                placeholder="#000000"
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Stock</Label>
              <Input
                type="number"
                value={form.stock}
                onChange={(e) => setForm((f) => ({ ...f, stock: parseInt(e.target.value) || 0 }))}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Reorder Level</Label>
              <Input
                type="number"
                value={form.reorder_level}
                onChange={(e) => setForm((f) => ({ ...f, reorder_level: parseInt(e.target.value) || 5 }))}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Price Delta (cents)</Label>
              <Input
                type="number"
                value={form.price_delta}
                onChange={(e) => setForm((f) => ({ ...f, price_delta: parseInt(e.target.value) || 0 }))}
                className="text-xs"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} disabled={isLoading} className="gap-1">
              {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
              Create Variant
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Variants table */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">SKU</th>
              <th className="px-4 py-2.5 text-left font-medium">Size</th>
              <th className="px-4 py-2.5 text-left font-medium">Color</th>
              <th className="px-4 py-2.5 text-right font-medium">Price Delta</th>
              <th className="px-4 py-2.5 text-right font-medium">Stock</th>
              <th className="px-4 py-2.5 text-left font-medium">Status</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {variants.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No variants yet.
                </td>
              </tr>
            )}
            {variants.map((v) => (
              <tr key={v.id} className="hover:bg-muted/20">
                <td className="px-4 py-2.5 font-mono text-xs">{v.sku}</td>
                <td className="px-4 py-2.5">{v.size ?? "—"}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    {v.color_hex && (
                      <span
                        className="h-3 w-3 rounded-full border"
                        style={{ backgroundColor: v.color_hex }}
                      />
                    )}
                    {v.color ?? "—"}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-xs">
                  {v.price_delta === 0 ? "—" : `+${formatPrice(v.price_delta)}`}
                </td>
                <td className="px-4 py-2.5 text-right">
                  {editingId === v.id ? (
                    <div className="flex items-center justify-end gap-1">
                      <Input
                        type="number"
                        value={editStock[v.id] ?? String(v.stock)}
                        onChange={(e) =>
                          setEditStock((prev) => ({ ...prev, [v.id]: e.target.value }))
                        }
                        className="h-7 w-20 text-xs text-right"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => handleStockSave(v.id)}
                        disabled={isLoading}
                      >
                        <Check className="h-3 w-3 text-green-600" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingId(v.id);
                        setEditStock((prev) => ({ ...prev, [v.id]: String(v.stock) }));
                      }}
                      className="hover:underline flex items-center gap-1 ml-auto"
                    >
                      {v.stock}
                      <Pencil className="h-3 w-3 text-muted-foreground" />
                    </button>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <button onClick={() => handleToggleActive(v)} disabled={isLoading}>
                    <Badge
                      variant="secondary"
                      className={
                        v.is_active
                          ? "bg-green-100 text-green-800 cursor-pointer"
                          : "bg-red-100 text-red-800 cursor-pointer"
                      }
                    >
                      {v.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </button>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive"
                    onClick={() => handleDelete(v.id)}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
