import { createServerSupabaseClient } from "./supabase-server";
import type { Profile } from "./types";

/** Get the current authenticated user's profile from the server */
export async function getServerProfile(): Promise<Profile | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data ?? null;
}

/** Returns true only if current user has admin or staff role */
export async function isAdmin(): Promise<boolean> {
  const profile = await getServerProfile();
  return profile?.role === "admin" || profile?.role === "staff";
}

/** Throws if the current user is not admin — use in API routes */
export async function requireAdmin(): Promise<Profile> {
  const profile = await getServerProfile();
  if (!profile || (profile.role !== "admin" && profile.role !== "staff")) {
    throw new Error("UNAUTHORIZED");
  }
  return profile;
}
