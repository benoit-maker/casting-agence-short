import Link from "next/link";
import { Plus } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/Button";
import { ActorsList } from "@/components/admin/ActorsList";
import type { Actor } from "@/lib/types";

export default async function ActorsPage() {
  const supabase = createAdminClient();
  const { data: actors } = await supabase
    .from("actors")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-heading font-semibold text-dark">
          Acteurs
        </h1>
        <Link href="/admin/actors/new">
          <Button>
            <Plus className="w-4 h-4" />
            Ajouter un acteur
          </Button>
        </Link>
      </div>

      <ActorsList actors={(actors as Actor[]) || []} />
    </div>
  );
}
