import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createServiceClient } from "@/lib/supabase-server";
import type { Category } from "@/lib/types";

export async function getCategories(activeOnly = true): Promise<Category[]> {
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (activeOnly) query = query.eq("is_active", true);

  const { data } = await query;
  return (data ?? []) as Category[];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single();
  return (data ?? null) as Category | null;
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .single();
  return (data ?? null) as Category | null;
}

export async function createCategory(values: {
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  parent_id?: string;
  sort_order?: number;
}): Promise<Category> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("categories")
    .insert(values)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Category;
}

export async function updateCategory(
  id: string,
  values: Partial<{
    name: string;
    slug: string;
    description: string | null;
    image_url: string | null;
    parent_id: string | null;
    sort_order: number;
    is_active: boolean;
  }>
): Promise<Category> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("categories")
    .update(values)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Category;
}

export async function deleteCategory(id: string): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
