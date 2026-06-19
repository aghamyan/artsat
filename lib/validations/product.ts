import { z } from "zod";

export const productVariantSchema = z.object({
  sku: z.string().min(1).max(100),
  size: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  color_hex: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color")
    .nullable()
    .optional(),
  price_delta: z.number().int().default(0),
  stock: z.number().int().min(0),
  reorder_level: z.number().int().min(0).default(5),
  is_active: z.boolean().default(true),
});

export const createProductSchema = z.object({
  name: z.string().min(2).max(255),
  slug: z
    .string()
    .min(2)
    .max(255)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  description: z.string().nullable().optional(),
  price: z.number().int().positive("Price must be a positive number"),
  compare_price: z.number().int().positive().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  material: z.string().nullable().optional(),
  care_instructions: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  label: z.enum(["new", "sale", "bestseller", "limited"]).nullable().optional(),
  tags: z.array(z.string()).default([]),
  // Phase 2 SEO + extra fields
  meta_title: z.string().max(255).nullable().optional(),
  meta_description: z.string().max(500).nullable().optional(),
  meta_keywords: z.string().max(500).nullable().optional(),
  sku: z.string().max(100).nullable().optional(),
  weight: z.number().positive().nullable().optional(),
  variants: z.array(productVariantSchema).min(1, "At least one variant is required"),
});

export const updateProductSchema = createProductSchema
  .partial()
  .omit({ slug: true, variants: true });

export type CreateProductValues = z.infer<typeof createProductSchema>;
export type UpdateProductValues = z.infer<typeof updateProductSchema>;
export type ProductVariantValues = z.infer<typeof productVariantSchema>;
