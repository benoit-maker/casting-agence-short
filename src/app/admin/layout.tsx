import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Sidebar } from "@/components/admin/Sidebar";
import type { Profile } from "@/lib/types";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Use admin client to bypass RLS for profile fetch
  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    // Profile missing — create it instead of redirecting (avoids loop)
    await adminClient.from("profiles").insert({
      id: user.id,
      email: user.email!,
      full_name: user.user_metadata?.full_name || user.email!.split("@")[0],
      role: "project_manager",
    });

    // Re-fetch
    const { data: newProfile } = await adminClient
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!newProfile) {
      // Last resort — sign out and redirect
      await supabase.auth.signOut();
      redirect("/login");
    }

    return (
      <div className="flex min-h-screen bg-bg">
        <Sidebar profile={newProfile as Profile} />
        <main className="flex-1 p-8">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar profile={profile as Profile} />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
