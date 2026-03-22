import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Trash2 } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { CopyLinkButton } from "@/components/admin/CopyLinkButton";
import { DeleteCastingButton } from "@/components/admin/DeleteCastingButton";
import { getCastingUrl } from "@/lib/utils";
import type { Actor } from "@/lib/types";

export default async function CastingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: casting } = await supabase
    .from("castings")
    .select(
      `*, profiles!castings_project_manager_id_fkey(full_name, email),
       casting_actors(*, actors(*)),
       selected_actor:actors!castings_selected_actor_id_fkey(*)`
    )
    .eq("id", id)
    .single();

  if (!casting) notFound();

  const castingUrl = getCastingUrl(casting.slug);
  const actors = (casting.casting_actors || [])
    .sort((a: any, b: any) => a.position - b.position)
    .map((ca: any) => ca.actors) as Actor[];

  return (
    <div>
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-primary mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux castings
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-heading font-semibold text-dark">
              {casting.client_name}
            </h1>
            <StatusBadge status={casting.status} />
          </div>
          {casting.project_name && (
            <p className="text-gray-400 mt-1">{casting.project_name}</p>
          )}
        </div>
        <DeleteCastingButton castingId={casting.id} />
      </div>

      {/* Infos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-4">
          <p className="text-xs text-gray-400 mb-1">Chef de projet</p>
          <p className="text-sm font-medium text-dark">
            {(casting as any).profiles?.full_name}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-400 mb-1">Date de création</p>
          <p className="text-sm font-medium text-dark">
            {new Date(casting.created_at).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-400 mb-1">Sélection</p>
          {casting.status === "selected" && casting.selected_actor ? (
            <p className="text-sm font-medium text-success">
              {(casting.selected_actor as any).display_name ||
                (casting.selected_actor as any).name}
              {casting.selected_at && (
                <span className="text-gray-400 font-normal">
                  {" "}
                  — le{" "}
                  {new Date(casting.selected_at).toLocaleDateString("fr-FR")}
                </span>
              )}
            </p>
          ) : (
            <p className="text-sm text-gray-400">En attente du client</p>
          )}
        </Card>
      </div>

      {/* Lien public */}
      <Card className="p-4 mb-8">
        <p className="text-xs text-gray-400 mb-2">Lien public</p>
        <div className="flex items-center gap-3">
          <code className="flex-1 text-sm text-primary bg-primary-light px-3 py-2 rounded-btn">
            {castingUrl}
          </code>
          <CopyLinkButton slug={casting.slug} />
          <a
            href={castingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-btn text-gray-400 hover:text-primary hover:bg-primary-light transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </Card>

      {/* Acteurs proposés */}
      <h2 className="text-lg font-heading font-semibold text-dark mb-4">
        Acteurs proposés ({actors.length})
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {actors.map((actor) => {
          const isChosen = casting.selected_actor_id === actor.id;
          return (
            <Card
              key={actor.id}
              className={`overflow-hidden ${isChosen ? "ring-2 ring-primary" : ""}`}
            >
              {actor.photo_url ? (
                <Image
                  src={actor.photo_url}
                  alt={actor.name}
                  width={200}
                  height={200}
                  className="w-full aspect-square object-cover"
                />
              ) : (
                <div className="w-full aspect-square bg-gray-100 flex items-center justify-center text-3xl font-heading font-semibold text-gray-400">
                  {actor.name[0]}
                </div>
              )}
              <div className="p-3">
                <p className="text-sm font-medium text-dark truncate">
                  {actor.name}
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  <Tag variant={actor.sex === "Femme" ? "female" : "male"}>
                    {actor.sex}
                  </Tag>
                </div>
                {isChosen && (
                  <p className="text-xs text-success font-medium mt-2">
                    ✓ Choisi par le client
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
