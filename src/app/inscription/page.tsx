"use client";

import { useState, useRef } from "react";
import { Upload, X, Check, Camera, Film } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export default function InscriptionPage() {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [city, setCity] = useState("");
  const [sex, setSex] = useState<"Femme" | "Homme">("Femme");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [videos, setVideos] = useState<{ file: File; name: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handlePhotoAdd(files: FileList | null) {
    if (!files) return;
    const newPhotos = Array.from(files)
      .filter((f) => f.type.startsWith("image/") && f.size <= 10 * 1024 * 1024)
      .map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));
    setPhotos((prev) => [...prev, ...newPhotos].slice(0, 5));
  }

  function handleVideoAdd(files: FileList | null) {
    if (!files) return;
    const newVideos = Array.from(files)
      .filter(
        (f) =>
          (f.type.startsWith("video/") || f.name.endsWith(".mov")) &&
          f.size <= 500 * 1024 * 1024
      )
      .map((file) => ({ file, name: file.name }));
    setVideos((prev) => [...prev, ...newVideos].slice(0, 4));
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  function removeVideo(index: number) {
    setVideos((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (videos.length === 0) {
      alert("Vous devez ajouter au moins une vidéo.");
      return;
    }

    setUploading(true);

    try {
      // Helper: get signed URL then upload file directly to Supabase Storage
      async function uploadFile(file: File, folder: string): Promise<string | null> {
        // Step 1: Get signed upload URL from our API
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type,
            folder,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Erreur serveur" }));
          throw new Error(err.error || "Impossible d'obtenir l'URL d'upload");
        }
        const { signedUrl, publicUrl } = await res.json();

        // Step 2: Upload file directly to Supabase Storage (no Vercel size limit)
        const uploadRes = await fetch(signedUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        });
        if (!uploadRes.ok) {
          throw new Error(`Échec de l'upload de ${file.name}`);
        }
        return publicUrl;
      }

      // Upload photos
      const photoUrls: string[] = [];
      for (let i = 0; i < photos.length; i++) {
        setUploadStatus(`Upload photo ${i + 1}/${photos.length}...`);
        const url = await uploadFile(photos[i].file, "applications");
        if (url) photoUrls.push(url);
      }

      // Upload videos
      const videoUrls: string[] = [];
      for (let i = 0; i < videos.length; i++) {
        setUploadStatus(`Upload vidéo ${i + 1}/${videos.length}...`);
        const url = await uploadFile(videos[i].file, "applications/videos");
        if (url) videoUrls.push(url);
      }
      setUploadStatus("Enregistrement de la candidature...");

      // Create application record via API route
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          date_of_birth: dateOfBirth || null,
          city,
          sex,
          email: email || null,
          phone: phone || null,
          photo_urls: photoUrls,
          video_urls: videoUrls,
        }),
      });

      if (!res.ok) {
        alert("Erreur lors de l'envoi. Veuillez réessayer.");
      } else {
        setSubmitted(true);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur lors de l'envoi. Veuillez réessayer.");
    }

    setUploading(false);
    setUploadStatus("");
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-success" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-dark mb-3">
            Merci pour votre candidature !
          </h1>
          <p className="text-gray-400">
            Votre profil a bien été enregistré. Notre équipe reviendra vers vous
            si votre profil correspond à nos recherches.
          </p>
          <div className="mt-10">
            <Logo className="text-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-6 py-6 text-center">
          <Logo className="text-3xl mb-4" />
          <h1 className="text-2xl font-heading font-bold text-dark mb-2">
            Rejoignez notre catalogue d&apos;acteurs
          </h1>
          <p className="text-gray-400 text-sm">
            Remplissez ce formulaire pour postuler. Ajoutez vos photos et
            vidéos de présentation.
          </p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Infos personnelles */}
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-heading font-semibold text-dark">
              Informations personnelles
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="lastName"
                label="Nom *"
                placeholder="Dupont"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
              <Input
                id="firstName"
                label="Prénom *"
                placeholder="Marie"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>

            <Input
              id="dateOfBirth"
              label="Date de naissance"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />

            <Input
              id="city"
              label="Ville *"
              placeholder="Bordeaux"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />

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
                    className={cn(
                      "px-5 py-2.5 rounded-btn text-sm font-medium transition-colors cursor-pointer",
                      sex === s
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {s === "Femme" ? "♀ " : "♂ "}
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="email"
                label="Email"
                type="email"
                placeholder="marie@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                id="phone"
                label="Téléphone"
                placeholder="06 12 34 56 78"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </Card>

          {/* Photos */}
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-heading font-semibold text-dark flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              Photos
            </h2>
            <p className="text-sm text-gray-400">
              Ajoutez jusqu&apos;à 5 photos (portrait de face, profil, plan large...). Max 10 Mo par photo.
            </p>

            <div className="flex flex-wrap gap-3">
              {photos.map((photo, i) => (
                <div key={i} className="relative w-24 h-24">
                  <img
                    src={photo.preview}
                    alt={`Photo ${i + 1}`}
                    className="w-full h-full object-cover rounded-btn"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow border border-gray-200 cursor-pointer"
                  >
                    <X className="w-3 h-3 text-gray-600" />
                  </button>
                </div>
              ))}

              {photos.length < 5 && (
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="w-24 h-24 rounded-btn border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-primary hover:text-primary transition-colors cursor-pointer"
                >
                  <Upload className="w-5 h-5" />
                  <span className="text-xs">Photo</span>
                </button>
              )}
            </div>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => handlePhotoAdd(e.target.files)}
            />
          </Card>

          {/* Vidéos */}
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-heading font-semibold text-dark flex items-center gap-2">
              <Film className="w-5 h-5 text-primary" />
              Vidéos de présentation *
            </h2>
            <p className="text-sm text-gray-400">
              <strong>Une vidéo minimum obligatoire.</strong> Vous pouvez en ajouter jusqu&apos;à 4 (self-tape, bande démo, présentation...). Max 500 Mo par vidéo.
            </p>

            <div className="space-y-2">
              {videos.map((video, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-gray-100 rounded-btn px-4 py-3"
                >
                  <div className="flex items-center gap-2">
                    <Film className="w-4 h-4 text-primary" />
                    <span className="text-sm text-dark truncate max-w-[250px]">
                      {video.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      ({Math.round(video.file.size / 1024 / 1024)} Mo)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVideo(i)}
                    className="text-gray-400 hover:text-red-500 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {videos.length < 4 && (
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="w-full py-4 rounded-btn border-2 border-dashed border-gray-200 flex items-center justify-center gap-2 text-gray-400 hover:border-primary hover:text-primary transition-colors cursor-pointer"
                >
                  <Upload className="w-5 h-5" />
                  <span className="text-sm">Ajouter une vidéo</span>
                </button>
              )}
            </div>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm,.mov"
              multiple
              className="hidden"
              onChange={(e) => handleVideoAdd(e.target.files)}
            />
          </Card>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            loading={uploading}
          >
            {uploading ? (uploadStatus || "Envoi en cours...") : "Envoyer ma candidature"}
          </Button>
        </form>
      </div>
    </div>
  );
}
