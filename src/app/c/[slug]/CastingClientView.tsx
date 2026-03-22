"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/ui/Logo";
import { ActorCard } from "@/components/client/ActorCard";
import { ConfirmBar } from "@/components/client/ConfirmBar";
import { SuccessScreen } from "@/components/client/SuccessScreen";
import type { PublicCasting, PublicActor } from "@/lib/types";

interface CastingClientViewProps {
  casting: PublicCasting;
  slug: string;
}

export function CastingClientView({ casting, slug }: CastingClientViewProps) {
  const supabase = createClient();
  const [selectedId, setSelectedId] = useState<string | null>(
    casting.selected_actor_id
  );
  const [confirmed, setConfirmed] = useState(
    casting.status === "selected" && !!casting.selected_actor_id
  );
  const [confirming, setConfirming] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const selectedActor = casting.actors?.find(
    (a: PublicActor) => a.id === selectedId
  );

  async function handleConfirm() {
    if (!selectedId) return;
    setConfirming(true);

    const { data } = await supabase.rpc("select_actor_for_casting", {
      casting_slug: slug,
      actor_uuid: selectedId,
    });

    if ((data as any)?.success) {
      setConfirmed(true);
      setShowSuccess(true);

      // Notify project manager
      try {
        await fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            castingId: casting.id,
            actorId: selectedId,
            slug,
            isChange: casting.status === "selected",
          }),
        });
      } catch {
        // Don't block on notification failure
      }
    }

    setConfirming(false);
  }

  function handleChangeChoice() {
    setShowSuccess(false);
    setConfirmed(false);
    setSelectedId(null);
  }

  if (showSuccess && selectedActor) {
    return (
      <SuccessScreen
        actor={selectedActor}
        clientName={casting.client_name}
        onChangeChoice={handleChangeChoice}
      />
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header sticky */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between">
          <Logo />
          <div className="text-right">
            <p className="text-sm font-heading font-medium text-dark">
              Casting pour {casting.client_name}
            </p>
            <p className="text-xs text-gray-400">
              Sélectionnez votre acteur
            </p>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <section className="max-w-[1200px] mx-auto px-6 py-12 text-center">
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-dark mb-4">
          Choisissez{" "}
          <span className="italic text-primary">votre acteur</span>
        </h1>
        <p className="text-gray-400 max-w-lg mx-auto">
          Découvrez les profils sélectionnés pour votre projet
          {casting.project_name && (
            <> — <span className="font-medium text-gray-600">{casting.project_name}</span></>
          )}
          . Cliquez sur le profil qui vous correspond le mieux.
        </p>
      </section>

      {/* Grid d'acteurs */}
      <section className="max-w-[1200px] mx-auto px-6 pb-32">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
          {casting.actors?.map((actor: PublicActor) => (
            <ActorCard
              key={actor.id}
              actor={actor}
              isSelected={selectedId === actor.id}
              onSelect={() => setSelectedId(actor.id)}
            />
          ))}
        </div>
      </section>

      {/* Barre de confirmation */}
      {selectedId && selectedActor && !showSuccess && (
        <ConfirmBar
          actorName={selectedActor.display_name}
          onConfirm={handleConfirm}
          onClear={handleChangeChoice}
          loading={confirming}
        />
      )}
    </div>
  );
}
