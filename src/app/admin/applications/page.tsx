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
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
          filtered.map((app) => {
            const isExpanded = expandedId === app.id;
            const age = app.date_of_birth
              ? Math.floor((Date.now() - new Date(app.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
              : null;

            return (
              <Card key={app.id} className="overflow-hidden">
                {/* En-tête cliquable */}
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : app.id)}
                  className="w-full p-6 text-left cursor-pointer hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex gap-5 items-center">
                    {/* Photo miniature */}
                    <div className="flex-shrink-0">
                      {app.photo_urls.length > 0 ? (
                        <Image
                          src={app.photo_urls[0]}
                          alt={`${app.first_name} ${app.last_name}`}
                          width={72}
                          height={72}
                          className="w-18 h-18 rounded-card object-cover"
                        />
                      ) : (
                        <div className="w-18 h-18 rounded-card bg-primary-light flex items-center justify-center text-xl font-heading font-bold text-primary">
                          {app.first_name[0]}{app.last_name[0]}
                        </div>
                      )}
                    </div>

                    {/* Résumé */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-heading font-semibold text-dark">
                          {app.first_name} {app.last_name}
                        </h3>
                        <Tag variant={app.sex === "Femme" ? "female" : "male"}>
                          {app.sex}
                        </Tag>
                        {age !== null && (
                          <span className="text-sm text-gray-500">{age} ans</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {app.city}
                        </span>
                        <span className="flex items-center gap-1">
                          <Camera className="w-3.5 h-3.5" />
                          {app.photo_urls.length} photo{app.photo_urls.length > 1 ? "s" : ""}
                        </span>
                        <span className="flex items-center gap-1">
                          <Film className="w-3.5 h-3.5" />
                          {app.video_urls.length} vidéo{app.video_urls.length > 1 ? "s" : ""}
                        </span>
                        <span className="flex items-center gap-1 text-gray-400">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(app.created_at).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Statut / Actions rapides */}
                    <div className="flex-shrink-0 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {app.status === "pending" ? (
                        <>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleReject(app)}
                            loading={processing === app.id}
                          >
                            <X className="w-4 h-4" />
                            Refuser
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAccept(app)}
                            loading={processing === app.id}
                            className="bg-success hover:bg-success/90"
                          >
                            <Check className="w-4 h-4" />
                            Accepter
                          </Button>
                        </>
                      ) : (
                        <span
                          className={cn(
                            "text-xs font-medium px-3 py-1.5 rounded-pill",
                            app.status === "accepted"
                              ? "bg-green-50 text-success"
                              : "bg-red-50 text-red-500"
                          )}
                        >
                          {app.status === "accepted" ? "✓ Accepté" : "✕ Refusé"}
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {/* Détail déplié */}
                {isExpanded && (
                  <div className="border-t border-gray-200 p-6 bg-gray-50/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Infos personnelles */}
                      <div>
                        <h4 className="text-sm font-semibold text-dark mb-3 uppercase tracking-wide">
                          Informations
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Nom complet</span>
                            <span className="font-medium text-dark">{app.first_name} {app.last_name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Sexe</span>
                            <span className="font-medium text-dark">{app.sex}</span>
                          </div>
                          {app.date_of_birth && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Date de naissance</span>
                              <span className="font-medium text-dark">
                                {new Date(app.date_of_birth).toLocaleDateString("fr-FR")}
                                {age !== null && ` (${age} ans)`}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-500">Ville</span>
                            <span className="font-medium text-dark">{app.city}</span>
                          </div>
                          {app.email && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Email</span>
                              <a href={`mailto:${app.email}`} className="font-medium text-primary hover:underline">{app.email}</a>
                            </div>
                          )}
                          {app.phone && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Téléphone</span>
                              <a href={`tel:${app.phone}`} className="font-medium text-primary hover:underline">{app.phone}</a>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-500">Candidature reçue</span>
                            <span className="font-medium text-dark">
                              {new Date(app.created_at).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Photos */}
                      <div>
                        <h4 className="text-sm font-semibold text-dark mb-3 uppercase tracking-wide">
                          Photos ({app.photo_urls.length})
                        </h4>
                        {app.photo_urls.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {app.photo_urls.map((url, i) => (
                              <button
                                key={i}
                                onClick={() => setMediaModal({ type: "photos", urls: app.photo_urls, name: `${app.first_name} ${app.last_name}`, index: i })}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                              >
                                <Image
                                  src={url}
                                  alt={`Photo ${i + 1}`}
                                  width={100}
                                  height={100}
                                  className="w-24 h-24 rounded-btn object-cover"
                                />
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 italic">Aucune photo</p>
                        )}
                      </div>
                    </div>

                    {/* Vidéos */}
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold text-dark mb-3 uppercase tracking-wide">
                        Vidéos ({app.video_urls.length})
                      </h4>
                      {app.video_urls.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {app.video_urls.map((url, i) => (
                            <button
                              key={i}
                              onClick={() => setMediaModal({ type: "video", urls: [url], name: `${app.first_name} ${app.last_name}`, index: 0 })}
                              className="flex items-center gap-3 p-4 bg-white rounded-btn border border-gray-200 hover:border-primary hover:shadow-sm transition-all cursor-pointer text-left"
                            >
                              <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center flex-shrink-0">
                                <Play className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-dark">Vidéo {i + 1}</p>
                                <p className="text-xs text-gray-400">Cliquer pour lire</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 italic">Aucune vidéo</p>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })
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
