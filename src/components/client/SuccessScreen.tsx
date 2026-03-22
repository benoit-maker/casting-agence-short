"use client";

import Image from "next/image";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import type { PublicActor } from "@/lib/types";

interface SuccessScreenProps {
  actor: PublicActor;
  clientName: string;
  onChangeChoice: () => void;
}

export function SuccessScreen({
  actor,
  clientName,
  onChangeChoice,
}: SuccessScreenProps) {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-8 animate-bounce-in">
          <CheckCircle2 className="w-20 h-20 text-success mx-auto mb-4" />
          <h1 className="text-3xl font-heading font-bold text-dark mb-2">
            Choix confirmé !
          </h1>
          <p className="text-gray-400">
            Merci pour votre sélection. L&apos;équipe Short a été notifiée.
          </p>
        </div>

        <div className="bg-white rounded-card border border-gray-200 p-6 mb-6">
          {actor.photo_url ? (
            <Image
              src={actor.photo_url}
              alt={actor.display_name}
              width={120}
              height={120}
              className="w-30 h-30 rounded-full object-cover mx-auto mb-4"
            />
          ) : (
            <div className="w-30 h-30 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-4 text-3xl font-heading font-bold text-primary">
              {actor.display_name[0]}
            </div>
          )}
          <p className="text-lg font-heading font-semibold text-dark">
            {actor.display_name}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Sélectionné pour {clientName}
          </p>
        </div>

        <Button variant="ghost" onClick={onChangeChoice}>
          <RotateCcw className="w-4 h-4" />
          Changer d&apos;avis
        </Button>

        <div className="mt-12">
          <Logo className="text-xl" />
        </div>
      </div>
    </div>
  );
}
