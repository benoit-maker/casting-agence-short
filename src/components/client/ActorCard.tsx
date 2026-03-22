"use client";

import { useState } from "react";
import Image from "next/image";
import { Play, ArrowRight, Check } from "lucide-react";
import { Tag } from "@/components/ui/Tag";
import { Button } from "@/components/ui/Button";
import { VideoModal } from "./VideoModal";
import { cn } from "@/lib/utils";
import type { PublicActor } from "@/lib/types";

interface ActorCardProps {
  actor: PublicActor;
  isSelected: boolean;
  onSelect: () => void;
}

export function ActorCard({ actor, isSelected, onSelect }: ActorCardProps) {
  const [showVideo, setShowVideo] = useState(false);

  return (
    <>
      <div
        className={cn(
          "bg-white rounded-card border-2 overflow-hidden transition-all duration-300",
          isSelected
            ? "border-primary shadow-lg shadow-primary/10"
            : "border-gray-200 hover:border-primary/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5"
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

          {/* Badge sélectionné */}
          {isSelected && (
            <div className="absolute top-4 right-4 bg-primary text-white px-3 py-1.5 rounded-pill text-sm font-medium flex items-center gap-1.5 shadow-lg">
              <Check className="w-4 h-4" />
              Sélectionné
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

          {/* Actions */}
          <div className="space-y-2">
            {actor.video_url && (
              <button
                onClick={() => setShowVideo(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-btn border border-gray-200 text-sm font-medium text-gray-600 hover:border-primary hover:text-primary transition-colors cursor-pointer"
              >
                <Play className="w-4 h-4" />
                Voir la bande démo
              </button>
            )}

            <Button
              onClick={onSelect}
              variant={isSelected ? "primary" : "navy"}
              className="w-full"
              size="lg"
            >
              {isSelected ? (
                <>
                  <Check className="w-4 h-4" />
                  Sélectionné
                </>
              ) : (
                <>
                  Choisir cet acteur
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
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
