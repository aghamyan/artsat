"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { Collection } from "@/lib/types";

interface CollectionFormProps {
  collection?: Collection;
  productIds?: string[];
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function CollectionForm({ collection, productIds: initialProductIds = [] }: CollectionFormProps) {
  const router = useRouter();
  const isEditing = Boolean(collection);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(collection?.name ?? "");
  const [slug, setSlug] = useState(collection?.slug ?? "");
  const [description, setDescription] = useState(collection?.description ?? "");
  const [imageUrl, setImageUrl] = useState(collection?.image_url ?? "");
  const [sortOrder, setSortOrder] = useState(collection?.sort_order ?? 0);
  const [isFeatured, setIsFeatured] = useState(collection?.is_featured ?? false);
  const [isActive, setIsActive] = useState(collection?.is_active ?? true);
  const [productIdInput, setProductIdInput] = useState("");
  const [productIds, setProductIds] = useState<string[]>(initialProductIds);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      toast.error("Name and slug are required");
      return;
    }
    setLoading(true);
    try {
      const url = isEditing ? `/api/collections/${collection!.id}` : "/api/collections";
      const method = isEditing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, description: description || null, image_url: imageUrl || null, sort_order: sortOrder, is_featured: isFeatured, is_active: isActive }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      toast.success(isEditing ? "Collection updated" : "Collection created");
      router.push("/admin/collections");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddProduct() {
    const pid = productIdInput.trim();
    if (!pid || productIds.includes(pid)) return;
    try {
      const res = await fetch(`/api/collections/${collection!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_product", product_id: pid }),
      });
      if (!res.ok) throw new Error("Failed to add product");
      setProductIds((p) => [...p, pid]);
      setProductIdInput("");
      toast.success("Product added to collection");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    }
  }

  async function handleRemoveProduct(pid: string) {
    try {
      const res = await fetch(`/api/collections/${collection!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove_product", product_id: pid }),
      });
      if (!res.ok) throw new Error("Failed to remove");
      setProductIds((p) => p.filter((id) => id !== pid));
      toast.success("Product removed from collection");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this collection?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/collections/${collection!.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Collection deleted");
      router.push("/admin/collections");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Name *</Label>
          <Input value={name} onChange={(e) => { setName(e.target.value); if (!isEditing) setSlug(slugify(e.target.value)); }} placeholder="Collection name" />
        </div>
        <div className="space-y-1.5">
          <Label>Slug *</Label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="collection-slug" readOnly={isEditing} />
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        </div>
        <div className="space-y-1.5">
          <Label>Image URL</Label>
          <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" />
        </div>
        <div className="space-y-1.5">
          <Label>Sort Order</Label>
          <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)} />
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Checkbox id="featured" checked={isFeatured} onCheckedChange={(v) => setIsFeatured(Boolean(v))} />
            <Label htmlFor="featured">Featured</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="active" checked={isActive} onCheckedChange={(v) => setIsActive(Boolean(v))} />
            <Label htmlFor="active">Active</Label>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={loading} className="gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEditing ? "Save Changes" : "Create Collection"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.push("/admin/collections")}>Cancel</Button>
          {isEditing && (
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading} className="ml-auto">Delete</Button>
          )}
        </div>
      </form>

      {/* Product management — only available after collection created */}
      {isEditing && (
        <div className="space-y-3">
          <h3 className="font-semibold">Products in Collection ({productIds.length})</h3>
          <div className="flex gap-2">
            <Input
              value={productIdInput}
              onChange={(e) => setProductIdInput(e.target.value)}
              placeholder="Product UUID"
              className="font-mono text-xs"
            />
            <Button type="button" size="sm" onClick={handleAddProduct} disabled={!productIdInput}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {productIds.map((pid) => (
              <Badge key={pid} variant="secondary" className="gap-1 font-mono text-xs">
                {pid.slice(0, 8)}…
                <button onClick={() => handleRemoveProduct(pid)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          {productIds.length === 0 && (
            <p className="text-xs text-muted-foreground">No products in this collection yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
