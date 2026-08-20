import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/admin";
import { Logo } from "@/components/ui/Logo";
import { Tag } from "@/components/ui/Tag";
import { PROFILE_TYPE_EMOJIS, type ProfileType } from "@/lib/types";
import { ActorVideoPlayer } from "./ActorVideoPlayer";

export default async function ActorPublicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: actor } = await supabase
    .from("actors")
    .select("id, display_name, sex, profile_types, age_ranges, cities, languages, photo_url, video_url, video_urls, is_blacklisted")
    .eq("id", id)
    .single();

  if (!actor || actor.is_blacklisted) {
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
  const publicProfileTypes = ((actor.profile_types as ProfileType[] | null) ?? []).filter(
    (pt) => pt !== "Whitelisting"
  );

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
              {publicProfileTypes.map((pt) => (
                <Tag key={pt} variant="profile">{PROFILE_TYPE_EMOJIS[pt]} {pt}</Tag>
              ))}
              {(actor.age_ranges as string[]).map((age: string) => (
                <Tag key={age} variant="age">{age}</Tag>
              ))}
              {(actor.cities as string[]).map((city: string) => (
                <Tag key={city} variant="city">{city}</Tag>
              ))}
              {actor.languages && (actor.languages as string[]).length > 0 &&
                (actor.languages as string[]).map((lang: string) => (
                  <Tag key={lang} variant="language">{lang}</Tag>
                ))}
            </div>

            {/* Videos */}
            {(() => {
              const allVideos = [
                ...(actor.video_url ? [actor.video_url] : []),
                ...((actor.video_urls as string[] | null) ?? []).filter((u: string) => u !== actor.video_url),
              ];
              return allVideos.map((url: string, i: number) => (
                <div key={i} className={i > 0 ? "mt-2" : ""}>
                  <ActorVideoPlayer
                    videoUrl={url}
                    actorName={displayName}
                    label={allVideos.length > 1 ? `Vidéo ${i + 1}` : undefined}
                  />
                </div>
              ));
            })()}
          </div>
        </div>

        <div className="text-center mt-10">
          <Logo className="text-xl" />
        </div>
      </div>
    </div>
  );
}
