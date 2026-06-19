import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getServerProfile } from "@/lib/auth";

export async function POST(request: Request) {
  const profile = await getServerProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { current_password, new_password } = await request.json();

  if (!current_password || !new_password) {
    return NextResponse.json({ error: "Both passwords required" }, { status: 400 });
  }
  if (new_password.length < 8) {
    return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();

  // Verify current password
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password: current_password,
  });
  if (authError) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  // Update password
  const { error } = await supabase.auth.updateUser({ password: new_password });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ data: { success: true } });
}
