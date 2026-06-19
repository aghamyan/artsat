import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getServerProfile } from "@/lib/auth";
import { softDeleteAccount } from "@/services/customer.service";

export async function POST(request: Request) {
  const profile = await getServerProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { password } = await request.json();
  if (!password) return NextResponse.json({ error: "Password required" }, { status: 400 });

  const supabase = await createServerSupabaseClient();

  // Verify password before deletion
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password,
  });
  if (authError) return NextResponse.json({ error: "Password is incorrect" }, { status: 400 });

  await softDeleteAccount(profile.id);
  await supabase.auth.signOut();

  return NextResponse.json({ data: { success: true } });
}
