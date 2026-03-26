"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Check, X, Film, Camera, Calendar, MapPin, Clock, Play, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

interface Application {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  city: string;
  sex: "Femme" | "Homme";
  email: string | null;
  phone: string | null;
  photo_urls: string[];
  video_urls: string[];
  status: "pending" | "accepted" | "rejected";
  created_at: string;
}

export default function ApplicationsPage() {
  const supabase = createClient();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "accepted" | "rejected" | "all">("pending");
  const [processing, setProcessing] = useState<string | null>(null);
  const [mediaModal, setMediaModal] = useState<{ type: "photos" | "video"; urls: string[]; name: string; index: number } | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  async function fetchApplications() {
    const { data } = await supabase
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });
    setApplications((data as Application[]) || []);
    setLoading(false);
  }

  async function handleAccept(app: Application) {
    setProcessing(app.id);

    // Create actor from application
    const res = await fetch("/api/applications/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId: app.id }),
    });

    if (res.ok) {
      setApplications((prev) =>
        prev.map((a) => (a.id === app.id ? { ...a, status: "accepted" as const } : a))
      );
    }
    setProcessing(null);
  }

  async function handleReject(app: Application) {
    setProcessing(app.id);

    await supabase
      .from("applications")
      .update({ status: "rejected" })
      .eq("id", app.id);

    setApplications((prev) =>
      prev.map((a) => (a.id === app.id ? { ...a, status: "rejected" as const } : a))
    );
    setProcessing(null);
  }

  const filtered =
    filter === "all"
      ? applications
      : applications.filter((a) => a.status === filter);

  const pendingCount = applications.filter((a) => a.status === "pending").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-heading font-semibold text-dark">
            Candidatures
          </h1>
          {pendingCount > 0 && (
            <p className="text-sm text-gray-400 mt-1">
              {pendingCount} candidature{pendingCount > 1 ? "s" : ""} en attente
            </p>
          )}
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-6">
        {(
          [
            { key: "pending", label: "En attente" },
            { key: "accepted", label: "Acceptées" },
            { key: "rejected", label: "Refusées" },
            { key: "all", label: "Toutes" },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              "px-4 py-2 rounded-btn text-sm font-medium transition-colors cursor-pointer",
              filter === key
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className="space-y-4">
        {loading ? (
          <Card className="p-12 text-center text-gray-400">Chargement...</Card>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center text-gray-400">
            Aucune candidature {filter !== "all" ? "dans cette catégorie" : ""}.
          </Card>
        ) : (
          filtered.map((app) => (
            <Card key={app.id} className="p-6">
              <div className="flex gap-6">
                {/* Photos */}
                <div className="flex-shrink-0">
                  {app.photo_urls.length > 0 ? (
                    <Image
                      src={app.photo_urls[0]}
                      alt={`${app.first_name} ${app.last_name}`}
                      width={120}
                      height={120}
                      className="w-30 h-30 rounded-card object-cover"
                    />
                  ) : (
                    <div className="w-30 h-30 rounded-card bg-primary-light flex items-center justify-center text-2xl font-heading font-bold text-primary">
                      {app.first_name[0]}
                      {app.last_name[0]}
                    </div>
                  )}
                  {app.photo_urls.length > 1 && (
                    <p className="text-xs text-gray-400 text-center mt-1">
                      +{app.photo_urls.length - 1} photo{app.photo_urls.length > 2 ? "s" : ""}
                    </p>
                  )}
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-heading font-semibold text-dark">
                        {app.first_name} {app.last_name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Tag variant={app.sex === "Femme" ? "female" : "male"}>
                          {app.sex}
                        </Tag>
                        <Tag variant="city">{app.city}</Tag>
                        {app.date_of_birth && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(app.date_of_birth).toLocaleDateString("fr-FR")}
                          </span>
                        )}
                      </div>

                      {/* Contact */}
                      <div className="flex gap-4 mt-2 text-xs text-gray-400">
                        {app.email && <span>{app.email}</span>}
                        {app.phone && <span>{app.phone}</span>}
                      </div>

                      {/* Médias cliquables */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {app.photo_urls.length > 1 && (
                          <button
                            onClick={() => setMediaModal({ type: "photos", urls: app.photo_urls, name: `${app.first_name} ${app.last_name}`, index: 0 })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-btn border border-gray-200 text-xs font-medium text-gray-600 hover:border-primary hover:text-primary transition-colors cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            Voir les {app.photo_urls.length} photos
                          </button>
                        )}
                        {app.video_urls.map((url, i) => (
                          <button
                            key={i}
                            onClick={() => setMediaModal({ type: "video", urls: [url], name: `${app.first_name} ${app.last_name}`, index: 0 })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-btn border border-gray-200 text-xs font-medium text-gray-600 hover:border-primary hover:text-primary transition-colors cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5" />
                            {app.video_urls.length === 1 ? "Voir la vidéo" : `Vidéo ${i + 1}`}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        {new Date(app.created_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </div>
                    </div>

                    {/* Actions */}
                    {app.status === "pending" ? (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleReject(app)}
                          loading={processing === app.id}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAccept(app)}
                          loading={processing === app.id}
                          className="bg-success hover:bg-success/90"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <span
                        className={cn(
                          "text-xs font-medium px-3 py-1 rounded-pill",
                          app.status === "accepted"
                            ? "bg-green-50 text-success"
                            : "bg-red-50 text-red-500"
                        )}
                      >
                        {app.status === "accepted" ? "Accepté" : "Refusé"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal photos/vidéos */}
      {mediaModal && (
        <Modal open={true} onClose={() => setMediaModal(null)}>
          <div className="p-6">
            <h3 className="text-lg font-heading font-semibold text-dark mb-4">
              {mediaModal.type === "photos" ? "Photos" : "Vidéo"} — {mediaModal.name}
            </h3>
            {mediaModal.type === "photos" ? (
              <div className="grid grid-cols-2 gap-3">
                {mediaModal.urls.map((url, i) => (
                  <Image
                    key={i}
                    src={url}
                    alt={`Photo ${i + 1}`}
                    width={400}
                    height={400}
                    className="w-full rounded-btn object-cover"
                  />
                ))}
              </div>
            ) : (
              <video
                src={mediaModal.urls[0]}
                controls
                autoPlay
                className="w-full rounded-btn max-h-[70vh]"
              />
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
