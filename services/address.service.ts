import { createServerSupabaseClient, createServiceClient } from "@/lib/supabase-server";
import type { CustomerAddress } from "@/lib/types";

export async function getAddresses(customerId: string): Promise<CustomerAddress[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("customer_addresses")
    .select("*")
    .eq("customer_id", customerId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getAddress(id: string, customerId: string): Promise<CustomerAddress | null> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("customer_addresses")
    .select("*")
    .eq("id", id)
    .eq("customer_id", customerId)
    .single();

  return data ?? null;
}

export async function createAddress(
  customerId: string,
  address: Omit<CustomerAddress, "id" | "customer_id" | "created_at" | "updated_at">
): Promise<CustomerAddress> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("customer_addresses")
    .insert({ customer_id: customerId, ...address })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateAddress(
  id: string,
  customerId: string,
  updates: Partial<Omit<CustomerAddress, "id" | "customer_id" | "created_at">>
): Promise<CustomerAddress> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("customer_addresses")
    .update(updates)
    .eq("id", id)
    .eq("customer_id", customerId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAddress(id: string, customerId: string): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("customer_addresses")
    .delete()
    .eq("id", id)
    .eq("customer_id", customerId);

  if (error) throw error;
}
