"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Search, Check, GripVertical } from "lucide-react";
import { Tag } from "@/components/ui/Tag";
import { cn } from "@/lib/utils";
import { AGE_RANGES, type Actor } from "@/lib/types";

interface ActorPickerProps {
  actors: Actor[];
  selected: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function ActorPicker({
  actors,
  selected,
  onSelectionChange,
}: ActorPickerProps) {
  const [search, setSearch] = useState("");
  const [filterSex, setFilterSex] = useState<string>("");
  const [filterAge, setFilterAge] = useState<string>("");
  const [filterCity, setFilterCity] = useState<string>("");

  const allCities = useMemo(() => {
    const cities = new Set<string>();
    actors.forEach((a) => a.cities.forEach((c) => cities.add(c)));
    return Array.from(cities).sort();
  }, [actors]);

  const filtered = useMemo(() => {
    return actors.filter((actor) => {
      if (!actor.is_active) return false;
      if (search && !actor.name.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (filterSex && actor.sex !== filterSex) return false;
      if (filterAge && !actor.age_ranges.includes(filterAge)) return false;
      if (filterCity && !actor.cities.includes(filterCity)) return false;
      return true;
    });
  }, [actors, search, filterSex, filterAge, filterCity]);

  function toggleActor(id: string) {
    if (selected.includes(id)) {
      onSelectionChange(selected.filter((s) => s !== id));
    } else {
      onSelectionChange([...selected, id]);
    }
  }

  function removeActor(id: string) {
    onSelectionChange(selected.filter((s) => s !== id));
  }

  const selectedActors = selected
    .map((id) => actors.find((a) => a.id === id))
    .filter(Boolean) as Actor[];

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un acteur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-btn border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <select
          value={filterSex}
          onChange={(e) => setFilterSex(e.target.value)}
          className="px-4 py-2.5 rounded-btn border border-gray-200 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
        >
          <option value="">Tous les sexes</option>
          <option value="Femme">Femme</option>
          <option value="Homme">Homme</option>
        </select>
        <select
          value={filterAge}
          onChange={(e) => setFilterAge(e.target.value)}
          className="px-4 py-2.5 rounded-btn border border-gray-200 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
        >
          <option value="">Toutes les tranches</option>
          {AGE_RANGES.map((age) => (
            <option key={age} value={age}>{age}</option>
          ))}
        </select>
        <select
          value={filterCity}
          onChange={(e) => setFilterCity(e.target.value)}
          className="px-4 py-2.5 rounded-btn border border-gray-200 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
        >
          <option value="">Toutes les villes</option>
          {allCities.map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
      </div>

      {/* Grille des acteurs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filtered.map((actor) => {
          const isSelected = selected.includes(actor.id);
          return (
            <button
              key={actor.id}
              type="button"
              onClick={() => toggleActor(actor.id)}
              className={cn(
                "relative rounded-card border-2 p-2 text-left transition-all cursor-pointer",
                isSelected
                  ? "border-primary bg-primary-light"
                  : "border-gray-200 hover:border-primary/50"
              )}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              {actor.photo_url ? (
                <Image
                  src={actor.photo_url}
                  alt={actor.name}
                  width={160}
                  height={160}
                  className="w-full aspect-square rounded-btn object-cover mb-2"
                />
              ) : (
                <div className="w-full aspect-square rounded-btn bg-gray-100 flex items-center justify-center mb-2 text-2xl font-heading font-semibold text-gray-400">
                  {actor.name[0]}
                </div>
              )}
              <p className="text-sm font-medium text-dark truncate">
                {actor.name}
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                <Tag variant={actor.sex === "Femme" ? "female" : "male"}>
                  {actor.sex}
                </Tag>
              </div>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-gray-400 py-8">
          Aucun acteur trouvé avec ces filtres.
        </p>
      )}

      {/* Acteurs sélectionnés */}
      {selectedActors.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-dark mb-3">
            Acteurs sélectionnés ({selectedActors.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {selectedActors.map((actor, index) => (
              <div
                key={actor.id}
                className="flex items-center gap-2 bg-primary-light rounded-pill px-3 py-1.5"
              >
                <GripVertical className="w-3 h-3 text-gray-400" />
                <span className="text-sm font-medium text-primary">
                  {index + 1}. {actor.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeActor(actor.id)}
                  className="text-primary/50 hover:text-primary cursor-pointer"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
