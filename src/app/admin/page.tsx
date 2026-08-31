import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CastingsList } from "@/components/admin/CastingsList";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await adminClient
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  let query = adminClient
    .from("castings")
    .select(
      `*, casting_actors(count), selected_actor:actors!castings_selected_actor_id_fkey(name, display_name)`
    )
    .order("created_at", { ascending: false });

  if (profile?.role !== "super_admin") {
    query = query.eq("project_manager_id", user!.id);
  }

  const { data: castings } = await query;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-heading font-semibold text-dark">
          {profile?.role === "super_admin"
            ? "Tous les castings"
            : "Mes castings"}
        </h1>
        <Link href="/admin/castings/new">
          <Button>
            <Plus className="w-4 h-4" />
            Nouveau casting
          </Button>
        </Link>
      </div>

      {castings && castings.length > 0 ? (
        <CastingsList castings={castings as any} />
      ) : (
        <Card className="p-12 text-center">
          <p className="text-gray-400 mb-4">Aucun casting pour le moment.</p>
          <Link href="/admin/castings/new">
            <Button>
              <Plus className="w-4 h-4" />
              Créer mon premier casting
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
