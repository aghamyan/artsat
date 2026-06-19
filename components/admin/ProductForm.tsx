"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createProductSchema, type CreateProductValues } from "@/lib/validations/product";
import type { Category, ProductWithVariants } from "@/lib/types";
import { CLOTHING_SIZES } from "@/lib/constants";

interface ProductFormProps {
  categories: Category[];
  product?: ProductWithVariants;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ProductForm({ categories, product }: ProductFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = Boolean(product);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateProductValues>({
    resolver: zodResolver(createProductSchema),
    defaultValues: product
      ? {
          name: product.name,
          slug: product.slug,
          description: product.description ?? "",
          price: product.price,
          compare_price: product.compare_price ?? undefined,
          category_id: product.category_id ?? undefined,
          material: product.material ?? "",
          care_instructions: product.care_instructions ?? "",
          is_active: product.is_active,
          is_featured: product.is_featured,
          label: product.label ?? undefined,
          tags: product.tags ?? [],
          meta_title: product.meta_title ?? "",
          meta_description: product.meta_description ?? "",
          meta_keywords: product.meta_keywords ?? "",
          sku: product.sku ?? "",
          variants: product.variants.map((v) => ({
            sku: v.sku,
            size: v.size ?? undefined,
            color: v.color ?? undefined,
            color_hex: v.color_hex ?? undefined,
            price_delta: v.price_delta,
            stock: v.stock,
            reorder_level: v.reorder_level,
            is_active: v.is_active,
          })),
        }
      : {
          is_active: true,
          is_featured: false,
          tags: [],
          price: 0,
          variants: [
            {
              sku: "",
              price_delta: 0,
              stock: 0,
              reorder_level: 5,
              is_active: true,
            },
          ],
        },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  const nameValue = watch("name");

  async function onSubmit(values: CreateProductValues) {
    setIsSubmitting(true);
    try {
      const url = isEditing
        ? `/api/products/${product!.id}`
        : "/api/admin/products";
      const method = isEditing ? "PATCH" : "POST";

      const payload = isEditing
        ? (({ variants: _v, ...rest }) => rest)(values)
        : values;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to save product");

      toast.success(isEditing ? "Product updated" : "Product created");
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Basic Info */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Basic Information</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Product name"
              onChange={(e) => {
                register("name").onChange(e);
                if (!isEditing) {
                  setValue("slug", slugify(e.target.value));
                }
              }}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug *</Label>
            <Input id="slug" {...register("slug")} placeholder="product-slug" readOnly={isEditing} />
            {errors.slug && (
              <p className="text-xs text-destructive">{errors.slug.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...register("description")}
            placeholder="Product description…"
            rows={4}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="price">Price (cents) *</Label>
            <Input
              id="price"
              type="number"
              {...register("price", { valueAsNumber: true })}
              placeholder="2999"
            />
            {errors.price && (
              <p className="text-xs text-destructive">{errors.price.message}</p>
            )}
            <p className="text-xs text-muted-foreground">Enter in cents: $29.99 = 2999</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="compare_price">Compare Price (cents)</Label>
            <Input
              id="compare_price"
              type="number"
              {...register("compare_price", { valueAsNumber: true, setValueAs: (v) => v === "" || isNaN(v) ? undefined : v })}
              placeholder="4999"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sku">Product SKU</Label>
            <Input id="sku" {...register("sku")} placeholder="ART-001" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select
              defaultValue={product?.category_id ?? "__none__"}
              onValueChange={(v) => setValue("category_id", v === "__none__" ? undefined : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No category</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Label</Label>
            <Select
              defaultValue={product?.label ?? "__none__"}
              onValueChange={(v) =>
                setValue("label", v === "__none__" ? undefined : v as CreateProductValues["label"])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select label" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No label</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="sale">Sale</SelectItem>
                <SelectItem value="bestseller">Best Seller</SelectItem>
                <SelectItem value="limited">Limited</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Checkbox
              id="is_active"
              defaultChecked={product?.is_active ?? true}
              onCheckedChange={(v) => setValue("is_active", Boolean(v))}
            />
            <Label htmlFor="is_active">Active (visible to customers)</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="is_featured"
              defaultChecked={product?.is_featured ?? false}
              onCheckedChange={(v) => setValue("is_featured", Boolean(v))}
            />
            <Label htmlFor="is_featured">Featured on homepage</Label>
          </div>
        </div>
      </section>

      <Separator />

      {/* Material & Care */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Details</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="material">Material</Label>
            <Input id="material" {...register("material")} placeholder="100% Cotton" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input
              id="weight"
              type="number"
              step="0.001"
              {...register("weight", { valueAsNumber: true, setValueAs: (v) => v === "" || isNaN(v) ? undefined : v })}
              placeholder="0.3"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="care_instructions">Care Instructions</Label>
          <Textarea
            id="care_instructions"
            {...register("care_instructions")}
            placeholder="Machine wash cold…"
            rows={2}
          />
        </div>
      </section>

      <Separator />

      {/* SEO */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">SEO</h2>
        <div className="space-y-1.5">
          <Label htmlFor="meta_title">Meta Title</Label>
          <Input
            id="meta_title"
            {...register("meta_title")}
            placeholder={nameValue ? `${nameValue} | Artsat` : "SEO title"}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="meta_description">Meta Description</Label>
          <Textarea
            id="meta_description"
            {...register("meta_description")}
            placeholder="160-character SEO description…"
            rows={2}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="meta_keywords">Meta Keywords</Label>
          <Input
            id="meta_keywords"
            {...register("meta_keywords")}
            placeholder="clothing, artsat, premium"
          />
        </div>
      </section>

      {!isEditing && (
        <>
          <Separator />
          {/* Variants */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Variants</h2>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    sku: "",
                    price_delta: 0,
                    stock: 0,
                    reorder_level: 5,
                    is_active: true,
                  })
                }
              >
                <Plus className="h-4 w-4 mr-1" /> Add Variant
              </Button>
            </div>

            {errors.variants && typeof errors.variants.message === "string" && (
              <p className="text-xs text-destructive">{errors.variants.message}</p>
            )}

            <div className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="rounded-lg border p-4 space-y-3 relative"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">Variant {index + 1}</Badge>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <div className="space-y-1">
                      <Label className="text-xs">SKU *</Label>
                      <Input
                        {...register(`variants.${index}.sku`)}
                        placeholder="ART-001-BLK-M"
                        className="text-xs"
                      />
                      {errors.variants?.[index]?.sku && (
                        <p className="text-xs text-destructive">
                          {errors.variants[index]?.sku?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Size</Label>
                      <Select
                        defaultValue={field.size ?? "__none__"}
                        onValueChange={(v) =>
                          setValue(`variants.${index}.size`, v === "__none__" ? undefined : v)
                        }
                      >
                        <SelectTrigger className="text-xs">
                          <SelectValue placeholder="Size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">None</SelectItem>
                          {CLOTHING_SIZES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Color</Label>
                      <Input
                        {...register(`variants.${index}.color`)}
                        placeholder="Black"
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Color Hex</Label>
                      <Input
                        {...register(`variants.${index}.color_hex`)}
                        placeholder="#000000"
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Stock *</Label>
                      <Input
                        type="number"
                        {...register(`variants.${index}.stock`, { valueAsNumber: true })}
                        placeholder="0"
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Reorder Level</Label>
                      <Input
                        type="number"
                        {...register(`variants.${index}.reorder_level`, { valueAsNumber: true })}
                        placeholder="5"
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Price Delta (cents)</Label>
                      <Input
                        type="number"
                        {...register(`variants.${index}.price_delta`, { valueAsNumber: true })}
                        placeholder="0"
                        className="text-xs"
                      />
                    </div>

                    <div className="flex items-end gap-2 pb-1">
                      <Checkbox
                        id={`variant_active_${index}`}
                        defaultChecked
                        onCheckedChange={(v) =>
                          setValue(`variants.${index}.is_active`, Boolean(v))
                        }
                      />
                      <Label htmlFor={`variant_active_${index}`} className="text-xs">
                        Active
                      </Label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting} className="gap-2">
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEditing ? "Save Changes" : "Create Product"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin/products")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
