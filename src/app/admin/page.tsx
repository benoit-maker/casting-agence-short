import Link from "next/link";
import { Plus, Copy, Eye, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { CopyLinkButton } from "@/components/admin/CopyLinkButton";
import type { Casting } from "@/lib/types";

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

      <div className="space-y-4">
        {castings?.map((casting: any) => (
          <Card key={casting.id} className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h2 className="font-heading font-semibold text-dark">
                    {casting.client_name}
                  </h2>
                  <StatusBadge status={casting.status} />
                </div>
                {casting.project_name && (
                  <p className="text-sm text-gray-400">
                    {casting.project_name}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {casting.casting_actors?.[0]?.count || 0} acteurs
                  </span>
                  <span>
                    {new Date(casting.created_at).toLocaleDateString("fr-FR")}
                  </span>
                  {casting.status === "selected" &&
                    casting.selected_actor && (
                      <span className="text-success font-medium">
                        → {casting.selected_actor.display_name || casting.selected_actor.name}
                      </span>
                    )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <CopyLinkButton slug={casting.slug} />
                <Link href={`/admin/castings/${casting.id}`}>
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                    Détails
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}

        {(!castings || castings.length === 0) && (
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
    </div>
  );
}
