import Link from "next/link";
import Image from "next/image";
import { Plus, Video, Link2 } from "lucide-react";
import { CopyActorLinkButton } from "@/components/admin/CopyActorLinkButton";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
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

      <div className="bg-white rounded-card border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-100">
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                Photo
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                Nom
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                Sexe
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                Âge
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                Ville
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                Vidéo
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {(actors as Actor[])?.map((actor) => (
              <tr key={actor.id} className="hover:bg-gray-100/50 transition-colors">
                <td className="px-6 py-4">
                  {actor.photo_url ? (
                    <Image
                      src={actor.photo_url}
                      alt={actor.name}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-primary font-heading font-semibold text-sm">
                      {actor.name[0]}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <p className="font-medium text-dark text-sm">{actor.name}</p>
                  {actor.display_name && (
                    <p className="text-xs text-gray-400">{actor.display_name}</p>
                  )}
                </td>
                <td className="px-6 py-4">
                  <Tag variant={actor.sex === "Femme" ? "female" : "male"}>
                    {actor.sex}
                  </Tag>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {actor.age_ranges.map((age) => (
                      <Tag key={age} variant="age">{age}</Tag>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {actor.cities.map((city) => (
                      <Tag key={city} variant="city">{city}</Tag>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {actor.video_url ? (
                    <Video className="w-4 h-4 text-primary" />
                  ) : (
                    <span className="text-gray-400 text-xs">—</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                      actor.is_active ? "text-success" : "text-gray-400"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        actor.is_active ? "bg-success" : "bg-gray-400"
                      }`}
                    />
                    {actor.is_active ? "Actif" : "Inactif"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <CopyActorLinkButton actorId={actor.id} />
                    <Link
                      href={`/admin/actors/${actor.id}`}
                      className="text-sm text-primary hover:text-primary-dark font-medium"
                    >
                      Modifier
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {(!actors || actors.length === 0) && (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                  Aucun acteur pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
