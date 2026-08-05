import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/Button";
import { ActorsList } from "@/components/admin/ActorsList";
import type { Actor, UserRole } from "@/lib/types";

export default async function ActorsPage() {
  const supabase = createAdminClient();
  const { data: actors } = await supabase
    .from("actors")
    .select("*")
    .order("created_at", { ascending: false });

  const userSupabase = await createClient();
  const {
    data: { user },
  } = await userSupabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();
  const role = (profile?.role as UserRole) || "project_manager";

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-heading font-semibold text-dark">
          Acteurs
        </h1>
        {role !== "catalogue" && (
          <Link href="/admin/actors/new">
            <Button>
              <Plus className="w-4 h-4" />
              Ajouter un acteur
            </Button>
          </Link>
        )}
      </div>

      <ActorsList actors={(actors as Actor[]) || []} role={role} />
    </div>
  );
}
