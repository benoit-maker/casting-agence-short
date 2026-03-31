"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function DeleteCastingButton({ castingId }: { castingId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);
    const res = await fetch(`/api/castings/${castingId}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Erreur lors de la suppression");
      setLoading(false);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-red-500">Supprimer ?</span>
        <Button variant="danger" size="sm" onClick={handleDelete} loading={loading}>
          Confirmer
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
          Annuler
        </Button>
      </div>
    );
  }

  return (
    <Button variant="danger" size="sm" onClick={() => setConfirming(true)}>
      <Trash2 className="w-4 h-4" />
      Supprimer
    </Button>
  );
}
