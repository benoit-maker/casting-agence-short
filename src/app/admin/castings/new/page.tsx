"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { ActorPicker } from "@/components/admin/ActorPicker";
import type { Actor } from "@/lib/types";

export default function NewCastingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [clientName, setClientName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [selectedActors, setSelectedActors] = useState<string[]>([]);
  const [actors, setActors] = useState<Actor[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingActors, setLoadingActors] = useState(true);

  useEffect(() => {
    async function fetchActors() {
      const { data } = await supabase
        .from("actors")
        .select("*")
        .eq("is_active", true)
        .order("name");
      setActors((data as Actor[]) || []);
      setLoadingActors(false);
    }
    fetchActors();
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedActors.length === 0) {
      alert("Sélectionnez au moins un acteur");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/castings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName,
          projectName: projectName || null,
          actorIds: selectedActors,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.casting) {
        alert("Erreur lors de la création");
        setLoading(false);
        return;
      }

      router.push(`/admin/castings/${data.casting.id}`);
      router.refresh();
    } catch {
      alert("Erreur lors de la création");
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-heading font-semibold text-dark mb-8">
        Nouveau casting
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 space-y-4">
          <Input
            id="clientName"
            label="Nom du client *"
            placeholder="Nobinobi"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            required
          />
          <Input
            id="projectName"
            label="Nom du projet"
            placeholder="Campagne été 2025"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-heading font-semibold text-dark mb-4">
            Sélectionnez les acteurs
          </h2>
          {loadingActors ? (
            <p className="text-center text-gray-400 py-8">Chargement...</p>
          ) : (
            <ActorPicker
              actors={actors}
              selected={selectedActors}
              onSelectionChange={setSelectedActors}
            />
          )}
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/admin")}
          >
            Annuler
          </Button>
          <Button type="submit" loading={loading}>
            Créer le casting
          </Button>
        </div>
      </form>
    </div>
  );
}
