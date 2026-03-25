"use client";

import { Logo } from "@/components/ui/Logo";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import { ActorCard } from "@/components/client/ActorCard";
import type { PublicCasting, PublicActor } from "@/lib/types";

interface CastingClientViewProps {
  casting: PublicCasting;
  slug: string;
}

export function CastingClientView({ casting, slug }: CastingClientViewProps) {
  return (
    <AuroraBackground className="min-h-screen !items-start !justify-start">
      {/* Header sticky */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 w-full">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between">
          <Logo />
          <div className="text-right">
            <p className="text-sm font-heading font-medium text-dark">
              Casting pour {casting.client_name}
            </p>
            <p className="text-xs text-gray-400">
              Découvrez nos profils
            </p>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <section className="max-w-[1200px] mx-auto px-6 py-12 text-center w-full">
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-dark mb-4">
          Découvrez{" "}
          <span className="italic text-primary">nos profils</span>
        </h1>
        <p className="text-gray-400 max-w-lg mx-auto">
          Voici les profils sélectionnés pour votre projet
          {casting.project_name && (
            <> — <span className="font-medium text-gray-600">{casting.project_name}</span></>
          )}
          . Consultez leurs bandes démo et contactez-nous pour faire votre choix.
        </p>
      </section>

      {/* Grid d'acteurs */}
      <section className="max-w-[1200px] mx-auto px-6 pb-32 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
          {casting.actors?.map((actor: PublicActor) => (
            <ActorCard
              key={actor.id}
              actor={actor}
            />
          ))}
        </div>
      </section>

      {/* Message de contact fixe en bas */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 z-40">
        <div className="max-w-[1200px] mx-auto px-6 py-4 text-center">
          <p className="text-sm text-gray-600">
            Veuillez contacter votre chef de projet sur WhatsApp pour lui faire part de votre choix.
          </p>
        </div>
      </div>
    </AuroraBackground>
  );
}
