"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { ActorPicker } from "@/components/admin/ActorPicker";
import type { Actor } from "@/lib/types";

interface EditCastingActorsProps {
  castingId: string;
  currentActorIds: string[];
}

export function EditCastingActors({
  castingId,
  currentActorIds,
}: EditCastingActorsProps) {
  const router = useRouter();
  const supabase = createClient();
  const [editing, setEditing] = useState(false);
  const [allActors, setAllActors] = useState<Actor[]>([]);
  const [selectedActors, setSelectedActors] = useState<string[]>(currentActorIds);
  const [loading, setLoading] = useState(false);
  const [loadingActors, setLoadingActors] = useState(false);

  useEffect(() => {
    if (editing && allActors.length === 0) {
      setLoadingActors(true);
      supabase
        .from("actors")
        .select("*")
        .eq("is_active", true)
        .order("name")
        .then(({ data }) => {
          setAllActors((data as Actor[]) || []);
          setLoadingActors(false);
        });
    }
  }, [editing, allActors.length, supabase]);

  async function handleSave() {
    if (selectedActors.length === 0) {
      alert("Sélectionnez au moins un acteur");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/castings/${castingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorIds: selectedActors }),
      });

      if (res.ok) {
        setEditing(false);
        router.refresh();
      } else {
        alert("Erreur lors de la mise à jour");
      }
    } catch {
      alert("Erreur lors de la mise à jour");
    }

    setLoading(false);
  }

  if (!editing) {
    return (
      <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
        <Pencil className="w-4 h-4" />
        Modifier les acteurs
      </Button>
    );
  }

  return (
    <div className="bg-white rounded-card border border-gray-200 p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-heading font-semibold text-dark">
          Modifier les acteurs du casting
        </h3>
        <button
          onClick={() => {
            setEditing(false);
            setSelectedActors(currentActorIds);
          }}
          className="p-2 rounded-btn hover:bg-gray-100 cursor-pointer"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {loadingActors ? (
        <p className="text-center text-gray-400 py-8">Chargement des acteurs...</p>
      ) : (
        <ActorPicker
          actors={allActors}
          selected={selectedActors}
          onSelectionChange={setSelectedActors}
        />
      )}

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
        <Button
          variant="ghost"
          onClick={() => {
            setEditing(false);
            setSelectedActors(currentActorIds);
          }}
        >
          Annuler
        </Button>
        <Button onClick={handleSave} loading={loading}>
          <Check className="w-4 h-4" />
          Enregistrer les modifications
        </Button>
      </div>
    </div>
  );
}
