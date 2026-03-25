"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { Tag } from "@/components/ui/Tag";
import { VideoModal } from "./VideoModal";
import { cn } from "@/lib/utils";
import type { PublicActor } from "@/lib/types";

interface ActorCardProps {
  actor: PublicActor;
}

export function ActorCard({ actor }: ActorCardProps) {
  const [showVideoIndex, setShowVideoIndex] = useState<number | null>(null);

  // Combine video_url (legacy) + video_urls, deduplicate
  const allVideos = [
    ...(actor.video_urls || []),
    ...(actor.video_url && !(actor.video_urls || []).includes(actor.video_url)
      ? [actor.video_url]
      : []),
  ].filter(Boolean);

  const hasVideos = allVideos.length > 0;

  return (
    <>
      <div
        className={cn(
          "bg-white rounded-card border-2 border-gray-200 overflow-hidden transition-all duration-300",
          "hover:border-primary/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5"
        )}
      >
        {/* Photo */}
        <div className="relative">
          {actor.photo_url ? (
            <Image
              src={actor.photo_url}
              alt={actor.display_name}
              width={400}
              height={360}
              className="w-full h-[360px] object-cover"
            />
          ) : (
            <div className="w-full h-[360px] bg-gradient-to-b from-primary-light to-gray-100 flex items-center justify-center">
              <span className="text-6xl font-heading font-bold text-primary/30">
                {actor.display_name[0]}
              </span>
            </div>
          )}
        </div>

        {/* Contenu */}
        <div className="p-5">
          <h3 className="text-lg font-heading font-semibold text-dark mb-3">
            {actor.display_name}
          </h3>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Tag variant={actor.sex === "Femme" ? "female" : "male"}>
              {actor.sex}
            </Tag>
            {actor.age_ranges.map((age) => (
              <Tag key={age} variant="age">{age}</Tag>
            ))}
            {actor.cities.map((city) => (
              <Tag key={city} variant="city">{city}</Tag>
            ))}
          </div>

          {/* Vidéos */}
          {hasVideos && (
            <div className="space-y-2">
              {allVideos.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setShowVideoIndex(i)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-btn border border-gray-200 text-sm font-medium text-gray-600 hover:border-primary hover:text-primary transition-colors cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  {allVideos.length === 1
                    ? "Voir la bande démo"
                    : `Vidéo ${i + 1}`}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal vidéo */}
      {showVideoIndex !== null && allVideos[showVideoIndex] && (
        <VideoModal
          open={true}
          onClose={() => setShowVideoIndex(null)}
          videoUrl={allVideos[showVideoIndex]}
          actorName={actor.display_name}
        />
      )}
    </>
  );
}
