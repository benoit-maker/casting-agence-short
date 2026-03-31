"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Upload, X, Link, Film } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { generateDisplayName } from "@/lib/utils";
import { AGE_RANGES, DEFAULT_CITIES, type Actor } from "@/lib/types";

interface ActorFormProps {
  actor?: Actor;
}

type VideoInputMode = "url" | "upload";

const MAX_VIDEO_SIZE_MB = 100;
const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;
const ACCEPTED_VIDEO_TYPES = ".mp4,.mov,.webm";
const ACCEPTED_VIDEO_MIME = "video/mp4,video/quicktime,video/webm";

export function ActorForm({ actor }: ActorFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
  const [videoUrls, setVideoUrls] = useState<string[]>(actor?.video_urls || []);
  const [notes, setNotes] = useState((actor as any)?.notes || "");
  const [brands, setBrands] = useState<string[]>(actor?.brands || []);
  const [newBrand, setNewBrand] = useState("");
  const [isActive, setIsActive] = useState(actor?.is_active ?? true);
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [videoInputMode, setVideoInputMode] = useState<VideoInputMode>(
    actor?.video_url && !actor.video_url.includes("youtube.com") && !actor.video_url.includes("youtu.be") && !actor.video_url.includes("drive.google.com")
      ? "upload"
      : "url"
  );

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
      alert("La photo ne doit pas depasser 5 Mo");
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

  async function handleVideoUpload(file: File) {
    if (!file) return;

    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      alert(`La video ne doit pas depasser ${MAX_VIDEO_SIZE_MB} Mo`);
      return;
    }

    setUploadingVideo(true);
    setVideoUploadProgress(0);

    const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
    const identifier = actor?.id || Date.now().toString();
    const fileName = `${identifier}-${Date.now()}.${ext}`;
    const path = `actors/videos/${fileName}`;

    // Simulate progress since supabase-js doesn't expose upload progress natively
    const progressInterval = setInterval(() => {
      setVideoUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);

    const { error } = await supabase.storage
      .from("actor-photos")
      .upload(path, file, { upsert: true });

    clearInterval(progressInterval);

    if (error) {
      console.error("Video upload error:", error);
      alert("Erreur lors de l'upload de la video");
      setUploadingVideo(false);
      setVideoUploadProgress(0);
      return;
    }

    setVideoUploadProgress(100);

    const { data: urlData } = supabase.storage
      .from("actor-photos")
      .getPublicUrl(path);

    setVideoUrl(urlData.publicUrl);
    setUploadingVideo(false);
    setVideoUploadProgress(0);
  }

  function handleRemoveVideo() {
    setVideoUrl("");
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  }

  function removeVideoFromList(index: number) {
    setVideoUrls((prev) => prev.filter((_, i) => i !== index));
  }

  function addBrand() {
    const trimmed = newBrand.trim();
    if (trimmed && !brands.includes(trimmed)) {
      setBrands((prev) => [...prev, trimmed]);
      setNewBrand("");
    }
  }

  function removeBrand(brand: string) {
    setBrands((prev) => prev.filter((b) => b !== brand));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
      video_urls: videoUrls,
      notes,
      brands,
      is_active: isActive,
    };

    try {
      const url = actor ? `/api/actors/${actor.id}` : "/api/actors";
      const method = actor ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const result = await res.json();
        setError(result.error || "Erreur lors de l'enregistrement");
        setLoading(false);
        return;
      }

      router.push("/admin/actors");
      router.refresh();
    } catch {
      setError("Erreur réseau, veuillez réessayer");
      setLoading(false);
    }
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

        {/* Tranches d'age */}
        <div>
          <label className="block text-sm font-medium text-dark mb-2">
            Tranches d&apos;age *
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
          {/* Villes custom ajoutees */}
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
            label="Telephone (interne)"
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

        {/* Video */}
        <div>
          <label className="block text-sm font-medium text-dark mb-2">
            Video (bande demo)
          </label>

          {/* Toggle tabs URL / Upload */}
          <div className="flex gap-1 mb-3 bg-gray-100 rounded-btn p-1 w-fit">
            <button
              type="button"
              onClick={() => setVideoInputMode("url")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-btn text-sm font-medium transition-colors cursor-pointer ${
                videoInputMode === "url"
                  ? "bg-white text-dark shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Link className="w-3.5 h-3.5" />
              URL
            </button>
            <button
              type="button"
              onClick={() => setVideoInputMode("upload")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-btn text-sm font-medium transition-colors cursor-pointer ${
                videoInputMode === "upload"
                  ? "bg-white text-dark shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload
            </button>
          </div>

          {videoInputMode === "url" ? (
            <Input
              id="videoUrl"
              placeholder="https://www.youtube.com/watch?v=... ou lien Google Drive"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
          ) : (
            <div>
              {videoUrl && videoInputMode === "upload" ? (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-card border border-gray-200">
                  <Film className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-sm text-gray-700 truncate flex-1">
                    {videoUrl.split("/").pop() || "Video uploadee"}
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveVideo}
                    className="p-1 bg-white rounded-full shadow border border-gray-200 cursor-pointer hover:bg-gray-50"
                  >
                    <X className="w-3 h-3 text-gray-600" />
                  </button>
                </div>
              ) : uploadingVideo ? (
                <div className="p-4 border-2 border-dashed border-primary/30 rounded-card bg-primary/5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
                    <span className="text-sm text-gray-600">
                      Upload en cours... {videoUploadProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${videoUploadProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="w-full p-4 border-2 border-dashed border-gray-200 rounded-card flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-primary hover:text-primary transition-colors cursor-pointer"
                >
                  <Upload className="w-6 h-6" />
                  <span className="text-sm">
                    Cliquer pour uploader une video
                  </span>
                  <span className="text-xs text-gray-400">
                    MP4, MOV ou WebM — {MAX_VIDEO_SIZE_MB} Mo max
                  </span>
                </button>
              )}
              <input
                ref={videoInputRef}
                type="file"
                accept={ACCEPTED_VIDEO_MIME}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleVideoUpload(file);
                }}
              />
            </div>
          )}
        </div>

        {/* Vidéos supplémentaires (multi-vidéos) */}
        {videoUrls.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-dark mb-2">
              Vidéos de l&apos;acteur ({videoUrls.length})
            </label>
            <div className="space-y-2">
              {videoUrls.map((url, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-btn border border-gray-200"
                >
                  <Film className="w-4 h-4 text-primary flex-shrink-0" />
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline truncate flex-1"
                  >
                    Vidéo {i + 1}
                  </a>
                  <button
                    type="button"
                    onClick={() => removeVideoFromList(i)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-btn transition-colors cursor-pointer"
                    title="Supprimer cette vidéo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags marques (interne CDP/admin uniquement) */}
        <div>
          <label className="block text-sm font-medium text-dark mb-1">
            Marques (interne)
          </label>
          <p className="text-xs text-gray-400 mb-2">
            Marques avec lesquelles l&apos;acteur a travaillé. Visible uniquement par les CDP.
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {brands.map((brand) => (
              <span
                key={brand}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-light text-primary rounded-pill text-sm font-medium"
              >
                {brand}
                <button
                  type="button"
                  onClick={() => removeBrand(brand)}
                  className="hover:text-primary-dark cursor-pointer"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Nom de la marque..."
              value={newBrand}
              onChange={(e) => setNewBrand(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addBrand();
                }
              }}
            />
            <Button type="button" variant="secondary" onClick={addBrand}>
              Ajouter
            </Button>
          </div>
        </div>

        {/* Notes internes (CDP/admin uniquement) */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-dark mb-1">
            Notes internes
          </label>
          <p className="text-xs text-gray-400 mb-2">
            Visible uniquement par les CDP et super admins. Jamais affiché aux clients.
          </p>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes sur l'acteur, observations, retour client..."
            rows={4}
            className="w-full px-4 py-2.5 rounded-btn border border-gray-200 bg-white text-dark placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200 resize-y"
          />
        </div>

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

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-btn text-sm text-red-600">
          {error}
        </div>
      )}

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
