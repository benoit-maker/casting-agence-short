"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface CompletedStatusToggleProps {
  castingId: string;
  completedOverride: boolean | null;
}

const OPTIONS = [
  { value: null, label: "Automatique" },
  { value: false, label: "Forcer En cours" },
  { value: true, label: "Forcer Terminé" },
] as const;

export function CompletedStatusToggle({
  castingId,
  completedOverride,
}: CompletedStatusToggleProps) {
  const [current, setCurrent] = useState(completedOverride);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function setOverride(value: boolean | null) {
    if (value === current || loading) return;
    const previous = current;
    setCurrent(value);
    setLoading(true);
    const res = await fetch(`/api/castings/${castingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed_override: value }),
    });
    setLoading(false);
    if (res.ok) {
      router.refresh();
    } else {
      setCurrent(previous);
      alert("Erreur lors de la mise à jour du statut");
    }
  }

  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-btn bg-gray-100">
      {OPTIONS.map((opt) => (
        <button
          key={String(opt.value)}
          type="button"
          disabled={loading}
          onClick={() => setOverride(opt.value)}
          className={cn(
            "px-3 py-1.5 rounded-btn text-xs font-medium transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60",
            current === opt.value
              ? "bg-white text-dark shadow-sm"
              : "text-gray-400 hover:text-gray-600"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
