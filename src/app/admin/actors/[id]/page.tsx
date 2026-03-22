import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { ActorForm } from "@/components/admin/ActorForm";
import type { Actor } from "@/lib/types";

export default async function EditActorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: actor } = await supabase
    .from("actors")
    .select("*")
    .eq("id", id)
    .single();

  if (!actor) notFound();

  return (
    <div>
      <h1 className="text-2xl font-heading font-semibold text-dark mb-8">
        Modifier l&apos;acteur
      </h1>
      <ActorForm actor={actor as Actor} />
    </div>
  );
}
