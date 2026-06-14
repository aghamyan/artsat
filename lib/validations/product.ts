import { z } from "zod";

export const productVariantSchema = z.object({
  sku: z.string().min(1).max(100),
  size: z.string().optional(),
  color: z.string().optional(),
  color_hex: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color")
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
  description: z.string().optional(),
  price: z.number().int().positive("Price must be a positive number"),
  compare_price: z.number().int().positive().optional(),
  category_id: z.string().uuid().optional(),
  material: z.string().optional(),
  care_instructions: z.string().optional(),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  label: z.enum(["new", "sale", "bestseller", "limited"]).optional(),
  tags: z.array(z.string()).default([]),
  variants: z.array(productVariantSchema).min(1, "At least one variant is required"),
});

export const updateProductSchema = createProductSchema.partial().omit({ slug: true });

export type CreateProductValues = z.infer<typeof createProductSchema>;
export type UpdateProductValues = z.infer<typeof updateProductSchema>;
export type ProductVariantValues = z.infer<typeof productVariantSchema>;
