"use client";

import { Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ConfirmBarProps {
  actorName: string;
  onConfirm: () => void;
  onClear: () => void;
  loading: boolean;
}

export function ConfirmBar({
  actorName,
  onConfirm,
  onClear,
  loading,
}: ConfirmBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-40 animate-slide-up">
      <div className="max-w-[1200px] mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-gray-600">
          Votre choix :{" "}
          <span className="font-heading font-semibold text-dark">
            {actorName}
          </span>
        </p>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onClear}>
            <RotateCcw className="w-4 h-4" />
            Changer d&apos;avis
          </Button>
          <Button onClick={onConfirm} loading={loading}>
            <Check className="w-4 h-4" />
            Confirmer mon choix
          </Button>
        </div>
      </div>
    </div>
  );
}
