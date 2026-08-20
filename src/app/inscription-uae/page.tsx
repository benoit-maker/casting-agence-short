"use client";

import { useState, useRef } from "react";
import { Upload, X, Check, Camera, Film, Link as LinkIcon } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import {
  UAE_CITIES,
  UAE_AVAILABILITY_LABELS,
  UAE_MICRO_STATUS_LABELS,
  UAE_REFERRAL_SOURCE_LABELS,
  UAE_AGE_RANGE_LABELS,
  type Availability,
  type MicroEntrepreneurStatus,
} from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

export default function InscriptionUAEPage() {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [ageRange, setAgeRange] = useState<string | null>(null);
  const [cities, setCities] = useState<string[]>([]);
  const [sex, setSex] = useState<"Femme" | "Homme">("Femme");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [videoItems, setVideoItems] = useState<VideoItem[]>([]);
  const [newVideoLink, setNewVideoLink] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [referralSource, setReferralSource] = useState<string | null>(null);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [acceptsRate, setAcceptsRate] = useState<boolean | null>(null);
  const [portfolioLink, setPortfolioLink] = useState("");
  const [microStatus, setMicroStatus] = useState<MicroEntrepreneurStatus | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [submitted, setSubmitted] = useState(false);

  type VideoItem =
    | { type: "file"; file: File; name: string }
    | { type: "link"; url: string };
  const MAX_VIDEO_ITEMS = 3;
  const totalVideoItems = videoItems.length;

  function handlePhotoAdd(files: FileList | null) {
    if (!files) return;
    const newPhotos = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setPhotos((prev) => [...prev, ...newPhotos].slice(0, 1));
  }

  function handleVideoFileAdd(files: FileList | null) {
    if (!files) return;
    const remaining = MAX_VIDEO_ITEMS - totalVideoItems;
    if (remaining <= 0) return;
    const newFiles: VideoItem[] = Array.from(files)
      .filter((f) => f.type.startsWith("video/") || f.name.endsWith(".mov"))
      .slice(0, remaining)
      .map((file) => ({ type: "file" as const, file, name: file.name }));
    setVideoItems((prev) => [...prev, ...newFiles]);
  }

  function addVideoLink() {
    const trimmed = newVideoLink.trim();
    if (!trimmed || totalVideoItems >= MAX_VIDEO_ITEMS) return;
    setVideoItems((prev) => [...prev, { type: "link", url: trimmed }]);
    setNewVideoLink("");
    setShowLinkInput(false);
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  function removeVideoItem(index: number) {
    setVideoItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (videoItems.length === 0) {
      alert("You must add at least one video or link.");
      return;
    }
    if (cities.length === 0) {
      alert("You must select at least one city.");
      return;
    }
    if (availability.length === 0) {
      alert("Please indicate your availability.");
      return;
    }
    if (acceptsRate === null) {
      alert("Please specify whether you accept the AED 650–1,300 gross/day rate.");
      return;
    }
    if (microStatus === null) {
      alert("Please specify your visa / work status.");
      return;
    }

    setUploading(true);

    try {
      const supabase = createClient();

      async function uploadFile(file: File, folder: string): Promise<string> {
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
          const err = await res.json().catch(() => ({ error: "Server error" }));
          throw new Error(err.error || "Unable to get upload URL");
        }
        const { path, token, publicUrl } = await res.json();
        const { error } = await supabase.storage
          .from("actor-photos")
          .uploadToSignedUrl(path, token, file, {
            contentType: file.type || "application/octet-stream",
            upsert: true,
          });
        if (error) throw new Error(`Upload failed for ${file.name}`);
        return publicUrl;
      }

      const photoUrls: string[] = [];
      for (let i = 0; i < photos.length; i++) {
        setUploadStatus(`Uploading photo ${i + 1}/${photos.length}...`);
        photoUrls.push(await uploadFile(photos[i].file, "applications"));
      }

      const videoUrls: string[] = [];
      const fileItems = videoItems.filter(
        (item): item is VideoItem & { type: "file" } => item.type === "file"
      );
      const linkItems = videoItems.filter(
        (item): item is VideoItem & { type: "link" } => item.type === "link"
      );
      for (let i = 0; i < fileItems.length; i++) {
        setUploadStatus(`Uploading video ${i + 1}/${fileItems.length}...`);
        videoUrls.push(await uploadFile(fileItems[i].file, "applications/videos"));
      }
      for (const link of linkItems) videoUrls.push(link.url);

      setUploadStatus("Saving your application...");

      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          date_of_birth: null,
          age_range: ageRange,
          cities,
          sex,
          email: email || null,
          phone: phone || null,
          photo_urls: photoUrls,
          video_urls: videoUrls,
          availability,
          accepts_rate: acceptsRate,
          portfolio_link: portfolioLink.trim() || null,
          micro_entrepreneur_status: microStatus,
          referral_source: referralSource,
          origin: "uae",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "An error occurred. Please try again.");
      } else {
        setSubmitted(true);
      }
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "An error occurred. Please try again."
      );
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
            Thank you for your application!
          </h1>
          <p className="text-gray-400">
            Your profile has been successfully submitted. Our team will get back
            to you if your profile matches our needs.
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
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-6 py-6 text-center">
          <Logo className="text-3xl mb-4" />
          <h1 className="text-2xl font-heading font-bold text-dark mb-2">
            Join our talent roster
          </h1>
          <p className="text-gray-400 text-sm">
            Fill in this form to apply. Add your photos and presentation videos.
          </p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal information */}
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-heading font-semibold text-dark">
              Personal information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="lastName"
                label="Last name *"
                placeholder="Smith"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
              <Input
                id="firstName"
                label="First name *"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark mb-2">
                Age range
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(UAE_AGE_RANGE_LABELS).map((range) => {
                  const selected = ageRange === range;
                  return (
                    <button
                      key={range}
                      type="button"
                      onClick={() => setAgeRange(selected ? null : range)}
                      className={cn(
                        "px-4 py-2 rounded-btn text-sm font-medium transition-colors cursor-pointer",
                        selected
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                    >
                      {UAE_AGE_RANGE_LABELS[range]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark mb-2">
                City / Cities *{" "}
                <span className="text-gray-400 font-normal">(multiple selection)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {UAE_CITIES.map((c) => {
                  const selected = cities.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() =>
                        setCities((prev) =>
                          prev.includes(c)
                            ? prev.filter((x) => x !== c)
                            : [...prev, c]
                        )
                      }
                      className={cn(
                        "px-4 py-2 rounded-btn text-sm font-medium transition-colors cursor-pointer",
                        selected
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark mb-2">
                Gender *
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
                    {s === "Femme" ? "♀ Female" : "♂ Male"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="email"
                label="Email"
                type="email"
                placeholder="john@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                id="phone"
                label="Phone"
                placeholder="+971 50 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </Card>

          {/* Availability & rate */}
          <Card className="p-6 space-y-5">
            <h2 className="text-lg font-heading font-semibold text-dark">
              Availability &amp; rate
            </h2>

            <div>
              <label className="block text-sm font-medium text-dark mb-2">
                How are you generally available? *{" "}
                <span className="text-gray-400 font-normal">(multiple choices)</span>
              </label>
              <div className="flex flex-col gap-2">
                {(Object.keys(UAE_AVAILABILITY_LABELS) as Availability[]).map((key) => {
                  const selected = availability.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        setAvailability((prev) =>
                          prev.includes(key)
                            ? prev.filter((x) => x !== key)
                            : [...prev, key]
                        )
                      }
                      className={cn(
                        "px-4 py-3 rounded-btn text-sm font-medium transition-colors cursor-pointer text-left",
                        selected
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                    >
                      {UAE_AVAILABILITY_LABELS[key]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark mb-2">
                Are you willing to work for a rate between AED 650 and AED 1,300 gross/day (depending on the project, format, and duration)? *
              </label>
              <div className="flex gap-3">
                {(
                  [
                    ["Yes", true],
                    ["No", false],
                  ] as const
                ).map(([label, value]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setAcceptsRate(value)}
                    className={cn(
                      "px-5 py-2.5 rounded-btn text-sm font-medium transition-colors cursor-pointer",
                      acceptsRate === value
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark mb-2">
                Visa / Work status *
              </label>
              <div className="flex flex-col gap-2">
                {(
                  Object.keys(UAE_MICRO_STATUS_LABELS) as MicroEntrepreneurStatus[]
                ).map((key) => {
                  const selected = microStatus === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setMicroStatus(key)}
                      className={cn(
                        "px-4 py-3 rounded-btn text-sm font-medium transition-colors cursor-pointer text-left",
                        selected
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                    >
                      {UAE_MICRO_STATUS_LABELS[key]}
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Photos */}
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-heading font-semibold text-dark flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              Photos
            </h2>
            <p className="text-sm text-gray-400">
              Add a profile photo (front-facing portrait preferred).
            </p>

            <div className="flex flex-wrap gap-3">
              {photos.map((photo, i) => (
                <div key={i} className="relative w-24 h-24">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
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

              {photos.length < 1 && (
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
              className="hidden"
              onChange={(e) => handlePhotoAdd(e.target.files)}
            />
          </Card>

          {/* Videos */}
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-heading font-semibold text-dark flex items-center gap-2">
              <Film className="w-5 h-5 text-primary" />
              Presentation videos *
            </h2>
            <p className="text-sm text-gray-400">
              <strong>At least one video is required.</strong> Upload video files or
              paste links (YouTube, Google Drive…). Maximum {MAX_VIDEO_ITEMS} items
              total.
            </p>

            <div className="space-y-2">
              {videoItems.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-gray-100 rounded-btn px-4 py-3"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {item.type === "file" ? (
                      <>
                        <Film className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-sm text-dark truncate max-w-[250px]">
                          {item.name}
                        </span>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          ({Math.round(item.file.size / 1024 / 1024)} MB)
                        </span>
                      </>
                    ) : (
                      <>
                        <LinkIcon className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-sm text-dark truncate max-w-[280px]">
                          {item.url}
                        </span>
                      </>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVideoItem(i)}
                    className="text-gray-400 hover:text-red-500 cursor-pointer flex-shrink-0 ml-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {totalVideoItems < MAX_VIDEO_ITEMS && (
                <>
                  {showLinkInput ? (
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://youtube.com/... or Google Drive link"
                        value={newVideoLink}
                        onChange={(e) => setNewVideoLink(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addVideoLink();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={addVideoLink}
                      >
                        OK
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setShowLinkInput(false);
                          setNewVideoLink("");
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => videoInputRef.current?.click()}
                        className="py-4 rounded-btn border-2 border-dashed border-gray-200 flex items-center justify-center gap-2 text-gray-400 hover:border-primary hover:text-primary transition-colors cursor-pointer"
                      >
                        <Upload className="w-5 h-5" />
                        <span className="text-sm">Upload a video</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowLinkInput(true)}
                        className="py-4 rounded-btn border-2 border-dashed border-gray-200 flex items-center justify-center gap-2 text-gray-400 hover:border-primary hover:text-primary transition-colors cursor-pointer"
                      >
                        <LinkIcon className="w-5 h-5" />
                        <span className="text-sm">Paste a link</span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
            <p className="text-xs text-gray-400">
              {totalVideoItems}/{MAX_VIDEO_ITEMS} items added
            </p>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm,.mov"
              multiple
              className="hidden"
              onChange={(e) => handleVideoFileAdd(e.target.files)}
            />
          </Card>

          {/* Portfolio */}
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-heading font-semibold text-dark flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-primary" />
              Portfolio (optional)
            </h2>
            <p className="text-sm text-gray-400">
              If you have a personal page, Instagram, website or any other link to
              share.
            </p>
            <Input
              id="portfolioLink"
              type="url"
              placeholder="https://instagram.com/..."
              value={portfolioLink}
              onChange={(e) => setPortfolioLink(e.target.value)}
            />
          </Card>

          {/* Referral source */}
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-heading font-semibold text-dark">
              How did you hear about our castings?
            </h2>
            <p className="text-sm text-gray-400">Optional</p>
            <div className="flex flex-col gap-2">
              {Object.entries(UAE_REFERRAL_SOURCE_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    setReferralSource(referralSource === key ? null : key)
                  }
                  className={cn(
                    "px-4 py-3 rounded-btn text-sm font-medium transition-colors cursor-pointer text-left",
                    referralSource === key
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </Card>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            loading={uploading}
          >
            {uploading
              ? uploadStatus || "Sending..."
              : "Submit my application"}
          </Button>
        </form>
      </div>
    </div>
  );
}
