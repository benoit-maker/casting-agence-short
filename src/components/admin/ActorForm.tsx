"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Upload, X, Link, Film, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { generateDisplayName, computeAgeRanges } from "@/lib/utils";
import {
  DEFAULT_CITIES,
  DEFAULT_LANGUAGES,
  RATE_OPTIONS,
  PROFILE_TYPES,
  PROFILE_TYPE_EMOJIS,
  AVAILABILITY_LABELS,
  MICRO_ENTREPRENEUR_LABELS,
  REFERRAL_SOURCE_LABELS,
  type Actor,
  type ProfileType,
} from "@/lib/types";

interface ActorFormProps {
  actor?: Actor;
}

const MAX_VIDEO_SIZE_MB = 100;
const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;
const ACCEPTED_VIDEO_MIME = "video/mp4,video/quicktime,video/webm";
const MAX_VIDEOS = 3;

const ALLOWED_PASTE_HOSTS = [
  "youtube.com", "www.youtube.com", "youtu.be",
  "drive.google.com",
  "vimeo.com", "player.vimeo.com",
];

function isValidVideoUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    if (u.hostname.endsWith(".supabase.co") || u.hostname.endsWith(".supabase.in")) return true;
    return ALLOWED_PASTE_HOSTS.includes(u.hostname);
  } catch { return false; }
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-primary mb-4 after:content-[''] after:flex-1 after:h-px after:bg-gray-200">
      {children}
    </h2>
  );
}

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
  const [profileTypes, setProfileTypes] = useState<ProfileType[]>(actor?.profile_types ?? ["Acteurs"]);
  const [dateOfBirth, setDateOfBirth] = useState(actor?.date_of_birth || "");
  const [cities, setCities] = useState<string[]>(actor?.cities || []);
  const [newCity, setNewCity] = useState("");
  const [editingCities, setEditingCities] = useState(!actor);
  const [languages, setLanguages] = useState<string[]>(actor?.languages || []);
  const [newLanguage, setNewLanguage] = useState("");
  const [phone, setPhone] = useState(actor?.phone || "");
  const [email, setEmail] = useState(actor?.email || "");
  const [rateOption, setRateOption] = useState<string>(() => {
    if (!actor?.rate) return RATE_OPTIONS[0];
    return (RATE_OPTIONS as readonly string[]).includes(actor.rate) ? actor.rate : "Autre";
  });
  const [rateCustom, setRateCustom] = useState(
    actor?.rate && !(RATE_OPTIONS as readonly string[]).includes(actor.rate)
      ? actor.rate
      : ""
  );
  const [photoUrl, setPhotoUrl] = useState(actor?.photo_url || "");
  const [videos, setVideos] = useState<string[]>(() => {
    const merged = [
      ...(actor?.video_url ? [actor.video_url] : []),
      ...(actor?.video_urls || []),
    ];
    return [...new Set(merged)].slice(0, MAX_VIDEOS);
  });
  const [addMode, setAddMode] = useState<"url" | "upload" | null>(null);
  const [linkInput, setLinkInput] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);
  const [notes, setNotes] = useState((actor as any)?.notes || "");
  const [brands, setBrands] = useState<string[]>(actor?.brands || []);
  const [newBrand, setNewBrand] = useState("");
  const [hasWorkedWithUs, setHasWorkedWithUs] = useState(actor?.has_worked_with_us ?? false);
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [videoUploadError, setVideoUploadError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function toggleCity(city: string) {
    setCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]
    );
  }

  function toggleProfileType(pt: ProfileType) {
    setProfileTypes((prev) =>
      prev.includes(pt) ? prev.filter((p) => p !== pt) : [...prev, pt]
    );
  }

  function addCity() {
    const trimmed = newCity.trim();
    if (trimmed && !cities.includes(trimmed)) {
      setCities((prev) => [...prev, trimmed]);
      setNewCity("");
    }
  }

  function toggleLanguage(lang: string) {
    setLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  }

  function addLanguage() {
    const trimmed = newLanguage.trim();
    if (trimmed && !languages.includes(trimmed)) {
      setLanguages((prev) => [...prev, trimmed]);
      setNewLanguage("");
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

  function removeVideo(index: number) {
    setVideos((prev) => prev.filter((_, i) => i !== index));
  }

  function submitLink() {
    const trimmed = linkInput.trim();
    if (!trimmed) return;
    if (!isValidVideoUrl(trimmed)) {
      setLinkError("URL non reconnue. Utilisez un lien YouTube, Google Drive, Vimeo ou un fichier HTTPS.");
      return;
    }
    setVideos((prev) => [...prev, trimmed].slice(0, MAX_VIDEOS));
    setLinkInput("");
    setLinkError(null);
    setAddMode(null);
  }

  async function handleVideoUpload(file: File) {
    if (!file) return;
    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      alert(`La video ne doit pas depasser ${MAX_VIDEO_SIZE_MB} Mo`);
      return;
    }

    setUploadingVideo(true);
    setVideoUploadProgress(0);
    setVideoUploadError(null);
    setAddMode(null);

    try {
      const signRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          folder: "actors/videos",
        }),
      });

      if (!signRes.ok) {
        const err = await signRes
          .json()
          .catch(() => ({ error: "Erreur serveur" }));
        throw new Error(err.error || "Impossible d'obtenir l'URL d'upload");
      }

      const { signedUrl, publicUrl } = await signRes.json();

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", signedUrl);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setVideoUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Échec de l'upload (statut ${xhr.status})`));
          }
        };
        xhr.onerror = () => reject(new Error("Erreur réseau pendant l'upload de la vidéo"));
        xhr.onabort = () => reject(new Error("Upload annulé"));

        const body = new FormData();
        body.append("cacheControl", "3600");
        body.append("", file);
        xhr.send(body);
      });

      setVideos((prev) => [...prev, publicUrl].slice(0, MAX_VIDEOS));
    } catch (err) {
      console.error("Video upload error:", err);
      setVideoUploadError(
        err instanceof Error ? err.message : "Erreur lors de l'upload de la vidéo"
      );
    } finally {
      setUploadingVideo(false);
      setVideoUploadProgress(0);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
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

    if (profileTypes.length === 0) {
      alert("Sélectionnez au moins un type de profil");
      return;
    }

    setLoading(true);
    setError(null);

    const data = {
      name,
      display_name: displayName || generateDisplayName(name),
      sex,
      profile_types: profileTypes,
      date_of_birth: dateOfBirth || null,
      cities,
      phone: phone || null,
      email: email.trim() || null,
      rate: rateOption === "Autre" ? (rateCustom.trim() || null) : rateOption,
      photo_url: photoUrl || null,
      video_url: null,
      video_urls: videos,
      notes,
      brands,
      has_worked_with_us: hasWorkedWithUs,
      languages,
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

  async function handleDelete() {
    if (!actor) return;
    setDeleting(true);
    setDeleteError(null);
    const res = await fetch(`/api/actors/${actor.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin/actors");
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      setDeleteError(body.error || "Erreur lors de la suppression.");
      setConfirmDelete(false);
      setDeleting(false);
    }
  }

  const currentAgeRanges = dateOfBirth ? computeAgeRanges(dateOfBirth) : [];
  const hasCandidatureInfo = !!actor && (
    (actor.availability && actor.availability.length > 0) ||
    actor.accepts_rate !== null ||
    !!actor.micro_entrepreneur_status ||
    !!actor.portfolio_link ||
    !!actor.referral_source
  );

  return (
    <form onSubmit={handleSubmit}>
      <Card className="p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary to-primary-dark px-8 py-7 flex flex-wrap items-center gap-5 text-white">
          <div className="relative flex-shrink-0">
            {photoUrl ? (
              <>
                <Image
                  src={photoUrl}
                  alt="Photo acteur"
                  width={76}
                  height={76}
                  className="w-[76px] h-[76px] rounded-full object-cover border-[3px] border-white/40"
                />
                <button
                  type="button"
                  onClick={() => setPhotoUrl("")}
                  className="absolute -top-1 -right-1 w-[22px] h-[22px] rounded-full bg-white text-dark flex items-center justify-center shadow cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-[76px] h-[76px] rounded-full bg-white/15 border-[3px] border-white/40 flex items-center justify-center text-2xl font-heading font-bold cursor-pointer"
              >
                {uploading ? "…" : name ? name[0].toUpperCase() : <Upload className="w-5 h-5" />}
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

          <div className="flex-1 min-w-[200px]">
            <p className="text-[22px] font-heading font-bold leading-tight truncate">
              {name || "Nouvel acteur"}
            </p>
            <p className="text-[13px] text-white/85 truncate">
              {[
                displayName && `Nom d'affichage : ${displayName}`,
                cities.length > 0 && `📍 ${cities.join(", ")}`,
              ].filter(Boolean).join(" · ")}
            </p>
            <div className="flex flex-wrap gap-2 mt-2.5">
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-pill bg-white/15">
                {sex === "Femme" ? "♀" : "♂"} {sex}
              </span>
              {profileTypes.map((pt) => (
                <span key={pt} className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-pill bg-white/15">
                  {PROFILE_TYPE_EMOJIS[pt]} {pt}
                </span>
              ))}
              {currentAgeRanges.map((age) => (
                <span key={age} className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-pill bg-white/15">
                  {age}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Identité */}
          <section>
            <SectionTitle>Identité</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <Input
                id="name"
                label="Nom complet *"
                placeholder="Pauline Monfort"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-bg"
                required
              />
              <Input
                id="displayName"
                label="Nom d'affichage (client)"
                placeholder="Pauline M."
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="bg-bg"
              />

              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  Sexe *
                </label>
                <div className="flex gap-2">
                  {(["Femme", "Homme"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSex(s)}
                      className={`px-4 py-2 rounded-btn text-sm font-medium transition-colors cursor-pointer ${
                        sex === s
                          ? "bg-primary text-white"
                          : "bg-bg border border-gray-200 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {s === "Femme" ? "♀ " : "♂ "}
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  Type de profil *
                </label>
                <div className="flex flex-wrap gap-2">
                  {PROFILE_TYPES.map((pt) => (
                    <button
                      key={pt}
                      type="button"
                      onClick={() => toggleProfileType(pt)}
                      className={`px-4 py-2 rounded-btn text-sm font-medium transition-colors cursor-pointer ${
                        profileTypes.includes(pt)
                          ? "bg-primary text-white"
                          : "bg-bg border border-gray-200 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {PROFILE_TYPE_EMOJIS[pt]} {pt}
                    </button>
                  ))}
                </div>
              </div>

              <Input
                id="dateOfBirth"
                label="Date de naissance"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="bg-bg"
              />

              <div>
                <label className="block text-sm font-medium text-dark mb-2">
                  Tranche d&apos;age
                </label>
                <div className="flex items-center gap-2">
                  {currentAgeRanges.length > 0 ? (
                    currentAgeRanges.map((age) => (
                      <Tag key={age} variant="age">{age}</Tag>
                    ))
                  ) : (
                    <span className="text-gray-400 text-sm">—</span>
                  )}
                  <span className="text-xs text-gray-400">calculée auto</span>
                </div>
              </div>
            </div>
          </section>

          {/* Localisation & contact */}
          <section>
            <SectionTitle>Localisation &amp; contact</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-dark">
                    Villes *
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditingCities((prev) => !prev)}
                    className="text-xs text-primary hover:text-primary-dark font-semibold cursor-pointer"
                  >
                    {editingCities ? "Terminé" : "Modifier"}
                  </button>
                </div>
                {editingCities ? (
                  <>
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
                        className="bg-bg"
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
                  </>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {cities.length === 0 ? (
                      <span className="text-gray-400 text-sm">—</span>
                    ) : (
                      cities.map((city) => (
                        <Tag key={city} variant="city">{city}</Tag>
                      ))
                    )}
                  </div>
                )}
              </div>

              <Input
                id="phone"
                label="Telephone (interne)"
                placeholder="06 12 34 56 78"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-bg"
              />

              <Input
                id="email"
                label="Email (interne)"
                type="email"
                placeholder="pauline@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-bg"
              />

              <div className="md:col-span-2">
                <label htmlFor="rate" className="block text-sm font-medium text-dark mb-1.5">
                  Tarif (interne)
                </label>
                <select
                  id="rate"
                  value={rateOption}
                  onChange={(e) => setRateOption(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-btn border border-gray-200 bg-bg text-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200 cursor-pointer"
                >
                  {RATE_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                  <option value="Autre">Autre</option>
                </select>
                {rateOption === "Autre" && (
                  <Input
                    className="mt-2 bg-bg"
                    placeholder="Précisez le tarif"
                    value={rateCustom}
                    onChange={(e) => setRateCustom(e.target.value)}
                  />
                )}
              </div>
            </div>
          </section>

          {/* Langues */}
          <section>
            <SectionTitle>Langues</SectionTitle>
            <div className="flex flex-wrap gap-2 mb-3">
              {DEFAULT_LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleLanguage(lang)}
                  className={`px-3 py-1.5 rounded-pill text-sm font-medium transition-colors cursor-pointer ${
                    languages.includes(lang)
                      ? "bg-primary text-white"
                      : "bg-tag-language-bg text-tag-language-text hover:bg-primary/10"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
            {/* Langues custom ajoutees */}
            <div className="flex flex-wrap gap-2 mb-3">
              {languages
                .filter((l) => !DEFAULT_LANGUAGES.includes(l as typeof DEFAULT_LANGUAGES[number]))
                .map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleLanguage(lang)}
                    className="px-3 py-1.5 rounded-pill text-sm font-medium bg-primary text-white cursor-pointer"
                  >
                    {lang} ×
                  </button>
                ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Ajouter une langue..."
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
                className="bg-bg"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addLanguage();
                  }
                }}
              />
              <Button type="button" variant="secondary" onClick={addLanguage}>
                Ajouter
              </Button>
            </div>
          </section>

          {/* Informations de candidature (lecture seule) */}
          {hasCandidatureInfo && actor && (
            <section>
              <SectionTitle>Informations de candidature</SectionTitle>
              <div className="bg-bg border border-gray-200 rounded-card p-5">
                <p className="text-xs text-gray-400 mb-4">
                  Collectées à l&apos;inscription, non modifiables ici.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {actor.availability && actor.availability.length > 0 && (
                    <div>
                      <span className="text-xs text-gray-400 block mb-1">Disponibilité</span>
                      <p className="text-sm font-semibold text-dark">
                        {actor.availability.map((a) => AVAILABILITY_LABELS[a]).join(", ")}
                      </p>
                    </div>
                  )}
                  {actor.accepts_rate !== null && (
                    <div>
                      <span className="text-xs text-gray-400 block mb-1">Tarif 250€/jour</span>
                      <p className={`text-sm font-semibold ${actor.accepts_rate ? "text-success" : "text-red-500"}`}>
                        {actor.accepts_rate ? "✓ Accepté" : "Refusé"}
                      </p>
                    </div>
                  )}
                  {actor.micro_entrepreneur_status && (
                    <div>
                      <span className="text-xs text-gray-400 block mb-1">Micro-entrepreneur</span>
                      <p className="text-sm font-semibold text-dark">
                        {MICRO_ENTREPRENEUR_LABELS[actor.micro_entrepreneur_status]}
                      </p>
                    </div>
                  )}
                  {actor.portfolio_link && (
                    <div>
                      <span className="text-xs text-gray-400 block mb-1">Portfolio</span>
                      <p className="text-sm">
                        <a
                          href={actor.portfolio_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline break-all font-semibold"
                        >
                          {actor.portfolio_link}
                        </a>
                      </p>
                    </div>
                  )}
                  {actor.referral_source && REFERRAL_SOURCE_LABELS[actor.referral_source] && (
                    <div>
                      <span className="text-xs text-gray-400 block mb-1">Nous a connu via</span>
                      <p className="text-sm font-semibold text-dark">
                        {REFERRAL_SOURCE_LABELS[actor.referral_source]}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Vidéos */}
          <section>
            <SectionTitle>Vidéos ({videos.length}/{MAX_VIDEOS})</SectionTitle>

            <div className="flex flex-wrap gap-2 mb-3">
              {Array.from({ length: MAX_VIDEOS }).map((_, i) => {
                const url = videos[i];
                if (url) {
                  return (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 bg-primary-light text-primary rounded-pill text-sm font-medium"
                    >
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 hover:underline"
                      >
                        <Film className="w-3.5 h-3.5" />
                        Vidéo {i + 1}
                      </a>
                      <button
                        type="button"
                        onClick={() => removeVideo(i)}
                        className="p-0.5 hover:text-primary-dark cursor-pointer"
                        title="Supprimer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  );
                }
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => !uploadingVideo && setAddMode("url")}
                    disabled={uploadingVideo}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill border border-dashed border-gray-300 text-gray-400 hover:border-primary hover:text-primary transition-colors cursor-pointer text-sm font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Vidéo {i + 1}
                  </button>
                );
              })}
            </div>

            {/* Upload en cours */}
            {uploadingVideo && (
              <div className="p-4 border-2 border-dashed border-primary/30 rounded-card bg-primary/5 mb-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                  <span className="text-sm text-gray-600">Upload en cours... {videoUploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div className="bg-primary h-1.5 rounded-full transition-all duration-300" style={{ width: `${videoUploadProgress}%` }} />
                </div>
              </div>
            )}

            {/* Erreur d'upload */}
            {videoUploadError && !uploadingVideo && (
              <div className="flex items-start justify-between gap-2 p-3 mb-3 bg-red-50 border border-red-200 rounded-card text-sm text-red-600">
                <span>{videoUploadError}</span>
                <button
                  type="button"
                  onClick={() => setVideoUploadError(null)}
                  className="text-red-400 hover:text-red-600 cursor-pointer flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Panneau d'ajout (lien / fichier) */}
            {!uploadingVideo && addMode !== null && (
              <div className="border border-gray-200 rounded-card p-4 space-y-3 bg-bg">
                {/* Tabs URL / Upload */}
                <div className="flex gap-1 bg-gray-100 rounded-btn p-1 w-fit">
                  <button
                    type="button"
                    onClick={() => { setAddMode("url"); setLinkError(null); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-btn text-sm font-medium transition-colors cursor-pointer ${addMode === "url" ? "bg-white text-dark shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    <Link className="w-3.5 h-3.5" />
                    Lien
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAddMode("upload"); setLinkError(null); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-btn text-sm font-medium transition-colors cursor-pointer ${addMode === "upload" ? "bg-white text-dark shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Fichier
                  </button>
                </div>

                {addMode === "url" && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://youtube.com/... Drive, Vimeo..."
                        value={linkInput}
                        onChange={(e) => { setLinkInput(e.target.value); setLinkError(null); }}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitLink(); } if (e.key === "Escape") { setAddMode(null); setLinkInput(""); setLinkError(null); } }}
                      />
                      <Button type="button" variant="secondary" onClick={submitLink}>OK</Button>
                      <Button type="button" variant="ghost" onClick={() => { setAddMode(null); setLinkInput(""); setLinkError(null); }}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    {linkError && <p className="text-xs text-red-500">{linkError}</p>}
                  </div>
                )}

                {addMode === "upload" && (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-btn text-sm text-gray-600 hover:border-primary hover:text-primary transition-colors cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      Choisir un fichier
                      <span className="text-xs text-gray-400">MP4, MOV, WebM — {MAX_VIDEO_SIZE_MB} Mo max</span>
                    </button>
                    <button type="button" onClick={() => setAddMode(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
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
          </section>

          {/* Marques (interne CDP/admin uniquement) */}
          <section>
            <SectionTitle>Marques (interne)</SectionTitle>
            <p className="text-xs text-gray-400 mb-2 -mt-2">
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
                className="bg-bg"
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
          </section>

          {/* Notes internes (CDP/admin uniquement) */}
          <section>
            <SectionTitle>Notes internes</SectionTitle>
            <p className="text-xs text-gray-400 mb-2 -mt-2">
              Visible uniquement par les CDP et super admins. Jamais affiché aux clients.
            </p>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes sur l'acteur, observations, retour client..."
              rows={4}
              className="w-full px-4 py-2.5 rounded-btn border border-gray-200 bg-bg text-dark placeholder:text-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200 resize-y"
            />
          </section>

          {/* A déjà tourné avec nous */}
          <section className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setHasWorkedWithUs(!hasWorkedWithUs)}
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                hasWorkedWithUs ? "bg-primary" : "bg-gray-200"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  hasWorkedWithUs ? "translate-x-5" : ""
                }`}
              />
            </button>
            <span className="text-sm text-gray-600">
              {hasWorkedWithUs ? "A déjà tourné avec nous" : "N'a pas encore tourné avec nous"}
            </span>
          </section>
        </div>
      </Card>

      {actor && (
        <Card className="mt-6 p-6 border-red-200 bg-red-50/50">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-red-600 mb-3">
            Zone sensible
          </h2>
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-gray-600">
              La suppression de cet acteur est définitive et irréversible.
            </p>
            {confirmDelete ? (
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-sm text-red-600 font-medium">Confirmer la suppression ?</span>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                >
                  Annuler
                </Button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 rounded-btn text-sm font-medium bg-red-500 text-white hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {deleting ? "Suppression..." : "Confirmer"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-btn text-sm font-medium text-red-500 border border-red-200 hover:bg-red-50 transition-colors cursor-pointer flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer cet acteur
              </button>
            )}
          </div>
          {deleteError && (
            <p className="mt-3 text-sm text-red-600">{deleteError}</p>
          )}
        </Card>
      )}

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
