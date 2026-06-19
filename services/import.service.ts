import Papa from "papaparse";
import { createServiceClient } from "@/lib/supabase-server";
import type { CsvImportRow, CsvImportResult } from "@/lib/types";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function findOrCreateCategory(
  supabase: ReturnType<typeof createServiceClient>,
  name: string
): Promise<string | null> {
  if (!name?.trim()) return null;
  const slug = slugify(name.trim());
  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .single();
  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("categories")
    .insert({ name: name.trim(), slug })
    .select("id")
    .single();
  if (error) return null;
  return created.id;
}

export async function importProductsFromCsv(
  text: string
): Promise<CsvImportResult[]> {
  const { data: rows, errors } = Papa.parse<CsvImportRow>(text, {
    header: true,
    skipEmptyLines: true,
  });

  if (errors.length) {
    return [{ row: 0, name: "CSV Parse", status: "error", error: errors[0].message }];
  }

  const supabase = createServiceClient();
  const results: CsvImportResult[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // 1-based, header is row 1

    try {
      if (!row.name?.trim()) throw new Error("Missing required field: name");

      const priceRaw = parseFloat(row.price ?? "");
      if (isNaN(priceRaw) || priceRaw < 0)
        throw new Error("Invalid price value");

      const priceInCents = Math.round(priceRaw * 100);
      const comparePriceInCents = row.compare_price
        ? Math.round(parseFloat(row.compare_price) * 100)
        : null;

      const categoryId = row.category
        ? await findOrCreateCategory(supabase, row.category)
        : null;

      const slug = slugify(row.name.trim());
      const tags = row.tags
        ? row.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [];

      const labelValue = row.label?.trim() as
        | "new"
        | "sale"
        | "bestseller"
        | "limited"
        | undefined;
      const label = ["new", "sale", "bestseller", "limited"].includes(
        labelValue ?? ""
      )
        ? labelValue
        : null;

      const { data: product, error: productError } = await supabase
        .from("products")
        .insert({
          name: row.name.trim(),
          slug,
          description: row.description?.trim() ?? null,
          price: priceInCents,
          compare_price: comparePriceInCents,
          category_id: categoryId,
          sku: row.sku?.trim() ?? null,
          material: row.material?.trim() ?? null,
          care_instructions: row.care_instructions?.trim() ?? null,
          label,
          tags,
          is_featured: row.is_featured === "true",
          is_active: true,
        })
        .select("id")
        .single();

      if (productError) throw new Error(productError.message);

      const productId = product.id;

      // Build size/color variants from CSV columns
      const sizes = row.sizes
        ? row.sizes.split(",").map((s) => s.trim()).filter(Boolean)
        : [null];
      const colors = row.colors
        ? row.colors.split(",").map((c) => c.trim()).filter(Boolean)
        : [null];
      const colorHexes = row.color_hexes
        ? row.color_hexes.split(",").map((h) => h.trim())
        : [];
      const stockPerVariant = row.stock ? parseInt(row.stock) : 0;

      const variantRows: object[] = [];
      for (const size of sizes) {
        for (let ci = 0; ci < colors.length; ci++) {
          const color = colors[ci];
          const hex = colorHexes[ci] ?? null;
          const skuParts = [row.sku ?? slug, size, color].filter(Boolean);
          const sku = `${skuParts.join("-")}-${Date.now()}-${variantRows.length}`;
          variantRows.push({
            product_id: productId,
            sku,
            size: size ?? null,
            color: color ?? null,
            color_hex: hex,
            price_delta: 0,
            stock: stockPerVariant,
            reorder_level: 5,
            is_active: true,
          });
        }
      }

      if (variantRows.length > 0) {
        const { error: varError } = await supabase
          .from("product_variants")
          .insert(variantRows);
        if (varError) throw new Error(`Variants: ${varError.message}`);
      }

      results.push({ row: rowNum, name: row.name, status: "success", product_id: productId });
    } catch (err) {
      results.push({
        row: rowNum,
        name: row.name ?? `Row ${rowNum}`,
        status: "error",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return results;
}
