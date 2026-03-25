"use client";

import { MessageCircle } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import { ActorCard } from "@/components/client/ActorCard";
import type { PublicCasting, PublicActor } from "@/lib/types";

const WHATSAPP_NUMBER = "33612345678"; // À remplacer par le vrai numéro

interface CastingClientViewProps {
  casting: PublicCasting;
  slug: string;
}

export function CastingClientView({ casting, slug }: CastingClientViewProps) {
  const whatsappMessage = encodeURIComponent(
    `Bonjour ! Suite au casting pour ${casting.client_name}${casting.project_name ? ` (${casting.project_name})` : ""}, j'aimerais échanger sur les profils proposés.`
  );
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`;

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

      {/* Barre WhatsApp fixe en bas */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 shadow-2xl z-40">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-gray-600">
            Un profil vous intéresse ? <span className="font-medium text-dark">Contactez-nous directement.</span>
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] hover:bg-[#1da851] text-white font-heading font-medium rounded-btn transition-colors text-sm"
          >
            <MessageCircle className="w-5 h-5" />
            Nous contacter sur WhatsApp
          </a>
        </div>
      </div>
    </AuroraBackground>
  );
}
