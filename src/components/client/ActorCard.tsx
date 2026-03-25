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
  const [showVideo, setShowVideo] = useState(false);

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
              <Tag key={age} variant="age">
                {age}
              </Tag>
            ))}
            {actor.cities.map((city) => (
              <Tag key={city} variant="city">
                {city}
              </Tag>
            ))}
          </div>

          {/* Vidéo */}
          {actor.video_url && (
            <button
              onClick={() => setShowVideo(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-btn border border-gray-200 text-sm font-medium text-gray-600 hover:border-primary hover:text-primary transition-colors cursor-pointer"
            >
              <Play className="w-4 h-4" />
              Voir la bande démo
            </button>
          )}
        </div>
      </div>

      {/* Modal vidéo */}
      {actor.video_url && (
        <VideoModal
          open={showVideo}
          onClose={() => setShowVideo(false)}
          videoUrl={actor.video_url}
          actorName={actor.display_name}
        />
      )}
    </>
  );
}
