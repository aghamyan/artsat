import { createServiceClient } from "@/lib/supabase-server";
import type { AdminLog, Product, ProductVariant } from "@/lib/types";
import type {
  CreateProductValues,
  UpdateProductValues,
} from "@/lib/validations/product";

/** Log an admin action to the audit trail */
export async function logAdminAction(
  adminId: string,
  action: string,
  tableName: string,
  recordId: string | null,
  oldValues: Record<string, unknown> | null,
  newValues: Record<string, unknown> | null
): Promise<void> {
  const supabase = createServiceClient();
  await supabase.from("admin_logs").insert({
    admin_id: adminId,
    action,
    table_name: tableName,
    record_id: recordId,
    old_values: oldValues,
    new_values: newValues,
  });
}

export async function createProduct(
  values: CreateProductValues,
  adminId: string
): Promise<Product> {
  const supabase = createServiceClient();
  const { variants, ...productData } = values;

  const { data: product, error } = await supabase
    .from("products")
    .insert(productData)
    .select()
    .single();

  if (error) throw new Error(error.message);

  const variantRows = variants.map((v) => ({
    ...v,
    product_id: product.id,
  }));

  const { error: variantError } = await supabase
    .from("product_variants")
    .insert(variantRows);

  if (variantError) throw new Error(variantError.message);

  await logAdminAction(adminId, "create", "products", product.id, null, {
    name: product.name,
  });

  return product as Product;
}

export async function updateProduct(
  productId: string,
  values: UpdateProductValues,
  adminId: string
): Promise<Product> {
  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from("products")
    .select("name, price, is_active")
    .eq("id", productId)
    .single();

  const { data: updated, error } = await supabase
    .from("products")
    .update(values)
    .eq("id", productId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  await logAdminAction(
    adminId,
    "update",
    "products",
    productId,
    existing as Record<string, unknown>,
    values as Record<string, unknown>
  );

  return updated as Product;
}

export async function softDeleteProduct(
  productId: string,
  adminId: string
): Promise<void> {
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("products")
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq("id", productId);

  if (error) throw new Error(error.message);

  await logAdminAction(adminId, "delete", "products", productId, null, {
    deleted_at: new Date().toISOString(),
  });
}

export async function restoreProduct(
  productId: string,
  adminId: string
): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("products")
    .update({ deleted_at: null, is_active: true })
    .eq("id", productId);
  if (error) throw new Error(error.message);
  await logAdminAction(adminId, "restore", "products", productId, null, null);
}

export async function bulkUpdateProductStatus(
  productIds: string[],
  isActive: boolean,
  adminId: string
): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("products")
    .update({ is_active: isActive })
    .in("id", productIds);
  if (error) throw new Error(error.message);
  await logAdminAction(adminId, isActive ? "bulk_activate" : "bulk_archive", "products", null, null, {
    product_ids: productIds,
  });
}

// ── Variant management ────────────────────────────────────────

export async function createVariant(
  productId: string,
  values: {
    sku: string;
    size?: string | null;
    color?: string | null;
    color_hex?: string | null;
    price_delta?: number;
    stock: number;
    reorder_level?: number;
  },
  adminId: string
): Promise<ProductVariant> {
  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from("product_variants")
    .select("id")
    .eq("sku", values.sku)
    .maybeSingle();

  if (existing) throw new Error(`SKU "${values.sku}" is already in use`);

  const { data, error } = await supabase
    .from("product_variants")
    .insert({ ...values, product_id: productId, is_active: true })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await logAdminAction(adminId, "create", "product_variants", data.id, null, {
    sku: values.sku,
  });

  return data as ProductVariant;
}

export async function updateVariant(
  variantId: string,
  values: Partial<{
    size: string | null;
    color: string | null;
    color_hex: string | null;
    price_delta: number;
    stock: number;
    reorder_level: number;
    is_active: boolean;
  }>,
  adminId: string
): Promise<ProductVariant> {
  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from("product_variants")
    .select("stock, sku")
    .eq("id", variantId)
    .single();

  const { data, error } = await supabase
    .from("product_variants")
    .update(values)
    .eq("id", variantId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  await logAdminAction(
    adminId,
    "update",
    "product_variants",
    variantId,
    existing as Record<string, unknown>,
    values as Record<string, unknown>
  );

  return data as ProductVariant;
}

export async function deleteVariant(
  variantId: string,
  adminId: string
): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("product_variants")
    .delete()
    .eq("id", variantId);
  if (error) throw new Error(error.message);
  await logAdminAction(adminId, "delete", "product_variants", variantId, null, null);
}

export async function updateVariantStock(
  variantId: string,
  newStock: number,
  adminId: string
): Promise<void> {
  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from("product_variants")
    .select("stock, sku")
    .eq("id", variantId)
    .single();

  const { error } = await supabase
    .from("product_variants")
    .update({ stock: newStock })
    .eq("id", variantId);

  if (error) throw new Error(error.message);

  await logAdminAction(
    adminId,
    "stock_adjustment",
    "product_variants",
    variantId,
    { stock: existing?.stock },
    { stock: newStock }
  );
}

// ── Dashboard / admin stats ───────────────────────────────────

export async function getAdminLogs(
  page = 1,
  limit = 50
): Promise<{ logs: AdminLog[]; total: number }> {
  const supabase = createServiceClient();
  const from = (page - 1) * limit;
  const { data, count, error } = await supabase
    .from("admin_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);
  if (error) throw new Error(error.message);
  return { logs: (data ?? []) as AdminLog[], total: count ?? 0 };
}

export async function getLowStockVariants(
  threshold = 5
): Promise<(ProductVariant & { product_name: string })[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("product_variants")
    .select(`*, product:products(name)`)
    .lte("stock", threshold)
    .gt("stock", 0)
    .eq("is_active", true);

  return (data ?? []).map((v) => ({
    ...v,
    product_name: (v.product as { name: string } | null)?.name ?? "Unknown",
  })) as (ProductVariant & { product_name: string })[];
}

export async function getDashboardStats(): Promise<{
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  lowStockCount: number;
}> {
  const supabase = createServiceClient();

  const [ordersResult, revenueResult, lowStockResult] = await Promise.all([
    supabase.from("orders").select("status", { count: "exact" }),
    supabase.from("orders").select("total").eq("payment_status", "paid"),
    supabase
      .from("product_variants")
      .select("id", { count: "exact" })
      .lte("stock", 5)
      .gt("stock", 0)
      .eq("is_active", true),
  ]);

  const pendingOrders = (ordersResult.data ?? []).filter(
    (o) => o.status === "pending"
  ).length;
  const totalRevenue = (revenueResult.data ?? []).reduce(
    (sum, o) => sum + o.total,
    0
  );

  return {
    totalOrders: ordersResult.count ?? 0,
    pendingOrders,
    totalRevenue,
    lowStockCount: lowStockResult.count ?? 0,
  };
}
