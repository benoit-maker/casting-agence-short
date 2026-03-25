"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, Video, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Tag } from "@/components/ui/Tag";
import { CopyActorLinkButton } from "@/components/admin/CopyActorLinkButton";
import type { Actor } from "@/lib/types";

interface ActorsListProps {
  actors: Actor[];
}

export function ActorsList({ actors }: ActorsListProps) {
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const filtered = actors.filter((actor) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      actor.name.toLowerCase().includes(q) ||
      (actor.display_name && actor.display_name.toLowerCase().includes(q)) ||
      actor.cities.some((c) => c.toLowerCase().includes(q))
    );
  });

  async function handleDelete(actorId: string) {
    setDeleting(actorId);
    await fetch(`/api/actors/${actorId}`, { method: "DELETE" });
    setConfirmDelete(null);
    setDeleting(null);
    router.refresh();
  }

  return (
    <>
      {/* Barre de recherche */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher par nom, prénom ou ville..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-btn border border-gray-200 bg-white text-sm text-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        />
        {search && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">
            {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-card border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-100">
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Photo</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Nom</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Sexe</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Âge</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Ville</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Vidéo</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Statut</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map((actor) => (
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
                  <Tag variant={actor.sex === "Femme" ? "female" : "male"}>{actor.sex}</Tag>
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
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${actor.is_active ? "text-success" : "text-gray-400"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${actor.is_active ? "bg-success" : "bg-gray-400"}`} />
                    {actor.is_active ? "Actif" : "Inactif"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <CopyActorLinkButton actorId={actor.id} />
                    {confirmDelete === actor.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(actor.id)}
                          disabled={deleting === actor.id}
                          className="text-xs text-red-500 font-medium hover:text-red-700 cursor-pointer"
                        >
                          {deleting === actor.id ? "..." : "Confirmer"}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(actor.id)}
                        className="p-1.5 rounded-btn text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
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
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                  {search ? "Aucun acteur trouvé pour cette recherche." : "Aucun acteur pour le moment."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
