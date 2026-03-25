import Image from "next/image";
import { Play } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { Logo } from "@/components/ui/Logo";
import { Tag } from "@/components/ui/Tag";
import { ActorVideoPlayer } from "./ActorVideoPlayer";
import type { Actor } from "@/lib/types";

export default async function ActorPublicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: actor } = await supabase
    .from("actors")
    .select("id, display_name, sex, age_ranges, cities, photo_url, video_url")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (!actor) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="text-center">
          <Logo className="text-3xl mb-6" />
          <h1 className="text-2xl font-heading font-semibold text-dark mb-2">
            Profil introuvable
          </h1>
          <p className="text-gray-400">Ce profil n&apos;existe pas ou n&apos;est plus disponible.</p>
        </div>
      </div>
    );
  }

  const displayName = actor.display_name || "Acteur";

  return (
    <div className="min-h-screen bg-bg">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo />
          <p className="text-xs text-gray-400">Profil acteur</p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="bg-white rounded-card border border-gray-200 overflow-hidden">
          {/* Photo */}
          {actor.photo_url ? (
            <Image
              src={actor.photo_url}
              alt={displayName}
              width={800}
              height={500}
              className="w-full h-[400px] object-cover"
            />
          ) : (
            <div className="w-full h-[400px] bg-gradient-to-b from-primary-light to-gray-100 flex items-center justify-center">
              <span className="text-8xl font-heading font-bold text-primary/20">
                {displayName[0]}
              </span>
            </div>
          )}

          <div className="p-8">
            <h1 className="text-3xl font-heading font-bold text-dark mb-4">
              {displayName}
            </h1>

            <div className="flex flex-wrap gap-2 mb-6">
              <Tag variant={actor.sex === "Femme" ? "female" : "male"}>
                {actor.sex}
              </Tag>
              {(actor.age_ranges as string[]).map((age: string) => (
                <Tag key={age} variant="age">{age}</Tag>
              ))}
              {(actor.cities as string[]).map((city: string) => (
                <Tag key={city} variant="city">{city}</Tag>
              ))}
            </div>

            {/* Video */}
            {actor.video_url && (
              <ActorVideoPlayer videoUrl={actor.video_url} actorName={displayName} />
            )}
          </div>
        </div>

        <div className="text-center mt-10">
          <Logo className="text-xl" />
        </div>
      </div>
    </div>
  );
}
