"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { generateDisplayName } from "@/lib/utils";
import { AGE_RANGES, DEFAULT_CITIES, type Actor } from "@/lib/types";

interface ActorFormProps {
  actor?: Actor;
}

export function ActorForm({ actor }: ActorFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(actor?.name || "");
  const [displayName, setDisplayName] = useState(actor?.display_name || "");
  const [sex, setSex] = useState<"Femme" | "Homme">(actor?.sex || "Femme");
  const [ageRanges, setAgeRanges] = useState<string[]>(actor?.age_ranges || []);
  const [cities, setCities] = useState<string[]>(actor?.cities || []);
  const [newCity, setNewCity] = useState("");
  const [phone, setPhone] = useState(actor?.phone || "");
  const [rate, setRate] = useState(actor?.rate || "");
  const [photoUrl, setPhotoUrl] = useState(actor?.photo_url || "");
  const [videoUrl, setVideoUrl] = useState(actor?.video_url || "");
  const [isActive, setIsActive] = useState(actor?.is_active ?? true);
  const [uploading, setUploading] = useState(false);

  function toggleAge(age: string) {
    setAgeRanges((prev) =>
      prev.includes(age) ? prev.filter((a) => a !== age) : [...prev, age]
    );
  }

  function toggleCity(city: string) {
    setCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]
    );
  }

  function addCity() {
    const trimmed = newCity.trim();
    if (trimmed && !cities.includes(trimmed)) {
      setCities((prev) => [...prev, trimmed]);
      setNewCity("");
    }
  }

  async function handlePhotoUpload(file: File) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("La photo ne doit pas dépasser 5 Mo");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `${actor?.id || "new"}-${Date.now()}.${ext}`;
    const path = `actors/${fileName}`;

    const { error } = await supabase.storage
      .from("actor-photos")
      .upload(path, file, { upsert: true });

    if (error) {
      alert("Erreur lors de l'upload");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("actor-photos")
      .getPublicUrl(path);

    setPhotoUrl(urlData.publicUrl);
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const data = {
      name,
      display_name: displayName || generateDisplayName(name),
      sex,
      age_ranges: ageRanges,
      cities,
      phone: phone || null,
      rate: rate || null,
      photo_url: photoUrl || null,
      video_url: videoUrl || null,
      is_active: isActive,
    };

    if (actor) {
      await supabase.from("actors").update(data).eq("id", actor.id);
    } else {
      await supabase.from("actors").insert(data);
    }

    router.push("/admin/actors");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="p-6 space-y-6">
        {/* Photo */}
        <div>
          <label className="block text-sm font-medium text-dark mb-2">
            Photo
          </label>
          <div className="flex items-center gap-4">
            {photoUrl ? (
              <div className="relative">
                <Image
                  src={photoUrl}
                  alt="Photo acteur"
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-card object-cover"
                />
                <button
                  type="button"
                  onClick={() => setPhotoUrl("")}
                  className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow border border-gray-200 cursor-pointer"
                >
                  <X className="w-3 h-3 text-gray-600" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-24 h-24 rounded-card border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-primary hover:text-primary transition-colors cursor-pointer"
              >
                <Upload className="w-5 h-5" />
                <span className="text-xs">{uploading ? "..." : "Upload"}</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePhotoUpload(file);
              }}
            />
          </div>
        </div>

        {/* Nom */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="name"
            label="Nom complet *"
            placeholder="Pauline Monfort"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            id="displayName"
            label="Nom d'affichage (client)"
            placeholder="Pauline M."
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>

        {/* Sexe */}
        <div>
          <label className="block text-sm font-medium text-dark mb-2">
            Sexe *
          </label>
          <div className="flex gap-3">
            {(["Femme", "Homme"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSex(s)}
                className={`px-4 py-2 rounded-btn text-sm font-medium transition-colors cursor-pointer ${
                  sex === s
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {s === "Femme" ? "♀ " : "♂ "}
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Tranches d'âge */}
        <div>
          <label className="block text-sm font-medium text-dark mb-2">
            Tranches d&apos;âge *
          </label>
          <div className="flex flex-wrap gap-2">
            {AGE_RANGES.map((age) => (
              <button
                key={age}
                type="button"
                onClick={() => toggleAge(age)}
                className={`px-3 py-1.5 rounded-pill text-sm font-medium transition-colors cursor-pointer ${
                  ageRanges.includes(age)
                    ? "bg-primary text-white"
                    : "bg-tag-age-bg text-tag-age-text hover:bg-primary/20"
                }`}
              >
                {age}
              </button>
            ))}
          </div>
        </div>

        {/* Villes */}
        <div>
          <label className="block text-sm font-medium text-dark mb-2">
            Villes *
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {DEFAULT_CITIES.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => toggleCity(city)}
                className={`px-3 py-1.5 rounded-pill text-sm font-medium transition-colors cursor-pointer ${
                  cities.includes(city)
                    ? "bg-primary text-white"
                    : "bg-tag-city-bg text-tag-city-text hover:bg-success/20"
                }`}
              >
                📍 {city}
              </button>
            ))}
          </div>
          {/* Villes custom ajoutées */}
          <div className="flex flex-wrap gap-2 mb-3">
            {cities
              .filter((c) => !DEFAULT_CITIES.includes(c as typeof DEFAULT_CITIES[number]))
              .map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => toggleCity(city)}
                  className="px-3 py-1.5 rounded-pill text-sm font-medium bg-primary text-white cursor-pointer"
                >
                  📍 {city} ×
                </button>
              ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Ajouter une ville..."
              value={newCity}
              onChange={(e) => setNewCity(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCity();
                }
              }}
            />
            <Button type="button" variant="secondary" onClick={addCity}>
              Ajouter
            </Button>
          </div>
        </div>

        {/* Infos internes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="phone"
            label="Téléphone (interne)"
            placeholder="06 12 34 56 78"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Input
            id="rate"
            label="Tarif (interne)"
            placeholder="300€/jour"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </div>

        {/* Vidéo */}
        <Input
          id="videoUrl"
          label="URL vidéo YouTube (bande démo)"
          placeholder="https://www.youtube.com/watch?v=..."
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
        />

        {/* Actif */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
              isActive ? "bg-primary" : "bg-gray-200"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                isActive ? "translate-x-5" : ""
              }`}
            />
          </button>
          <span className="text-sm text-gray-600">
            {isActive ? "Actif" : "Inactif"}
          </span>
        </div>
      </Card>

      <div className="flex justify-end gap-3 mt-6">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/admin/actors")}
        >
          Annuler
        </Button>
        <Button type="submit" loading={loading}>
          {actor ? "Enregistrer" : "Ajouter l'acteur"}
        </Button>
      </div>
    </form>
  );
}
