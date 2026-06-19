"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import type { Category } from "@/lib/types";

interface CategoryFormProps {
  category?: Category;
  parentCategories: Category[];
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function CategoryForm({ category, parentCategories }: CategoryFormProps) {
  const router = useRouter();
  const isEditing = Boolean(category);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [imageUrl, setImageUrl] = useState(category?.image_url ?? "");
  const [sortOrder, setSortOrder] = useState(category?.sort_order ?? 0);
  const [isActive, setIsActive] = useState(category?.is_active ?? true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      toast.error("Name and slug are required");
      return;
    }
    setLoading(true);
    try {
      const url = isEditing ? `/api/categories/${category!.id}` : "/api/categories";
      const method = isEditing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, description: description || null, image_url: imageUrl || null, sort_order: sortOrder, is_active: isActive }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      toast.success(isEditing ? "Category updated" : "Category created");
      router.push("/admin/categories");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this category? Products will become uncategorized.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/categories/${category!.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Category deleted");
      router.push("/admin/categories");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div className="space-y-1.5">
        <Label>Name *</Label>
        <Input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!isEditing) setSlug(slugify(e.target.value));
          }}
          placeholder="Category name"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Slug *</Label>
        <Input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="category-slug"
          readOnly={isEditing}
        />
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

      <div className="flex items-center gap-2">
        <Checkbox id="cat_active" checked={isActive} onCheckedChange={(v) => setIsActive(Boolean(v))} />
        <Label htmlFor="cat_active">Active</Label>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={loading} className="gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEditing ? "Save Changes" : "Create Category"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push("/admin/categories")}>
          Cancel
        </Button>
        {isEditing && (
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading} className="ml-auto">
            Delete
          </Button>
        )}
      </div>
    </form>
  );
}
