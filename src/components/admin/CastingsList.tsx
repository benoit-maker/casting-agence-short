"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { CopyLinkButton } from "@/components/admin/CopyLinkButton";
import { InlineCastingName } from "@/components/admin/InlineCastingName";
import { isCastingCompleted } from "@/lib/utils";
import type { Casting } from "@/lib/types";

interface CastingListItem extends Casting {
  casting_actors: { count: number }[];
  selected_actor: { name: string; display_name: string | null } | null;
}

export function CastingsList({ castings }: { castings: CastingListItem[] }) {
  const [tab, setTab] = useState<"active" | "completed">("active");

  const activeCount = castings.filter((c) => !isCastingCompleted(c)).length;
  const completedCount = castings.length - activeCount;

  const filtered = castings.filter(
    (c) => isCastingCompleted(c) === (tab === "completed")
  );

  return (
    <>
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {([
          ["active", `En cours (${activeCount})`],
          ["completed", `Terminé (${completedCount})`],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
              tab === key
                ? "border-primary text-primary"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((casting) => (
          <Card key={casting.id} className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <InlineCastingName
                    castingId={casting.id}
                    initialValue={casting.client_name}
                    className="font-heading font-semibold text-dark"
                  />
                  <StatusBadge status={casting.status} />
                </div>
                {casting.project_name && (
                  <p className="text-sm text-gray-400">
                    {casting.project_name}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {casting.casting_actors?.[0]?.count || 0} acteurs
                  </span>
                  <span>
                    {new Date(casting.created_at).toLocaleDateString("fr-FR")}
                  </span>
                  {casting.status === "selected" &&
                    casting.selected_actor && (
                      <span className="text-success font-medium">
                        → {casting.selected_actor.display_name || casting.selected_actor.name}
                      </span>
                    )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <CopyLinkButton slug={casting.slug} />
                <Link href={`/admin/castings/${casting.id}`}>
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                    Détails
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}

        {filtered.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-gray-400">
              {tab === "completed"
                ? "Aucun casting terminé."
                : "Aucun casting en cours."}
            </p>
          </Card>
        )}
      </div>
    </>
  );
}
