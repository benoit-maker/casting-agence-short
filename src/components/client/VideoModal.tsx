"use client";

import { Modal } from "@/components/ui/Modal";
import { getVideoEmbedUrl } from "@/lib/utils";

interface VideoModalProps {
  open: boolean;
  onClose: () => void;
  videoUrl: string;
  actorName: string;
}

export function VideoModal({ open, onClose, videoUrl, actorName }: VideoModalProps) {
  const embedUrl = getVideoEmbedUrl(videoUrl);
  const isDirectVideo = !embedUrl && /\.(mp4|mov|webm)$/i.test(videoUrl) || videoUrl.includes("supabase.co/storage");

  if (!embedUrl && !isDirectVideo) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6">
        <h3 className="text-lg font-heading font-semibold text-dark mb-4">
          Bande démo — {actorName}
        </h3>
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={`Bande démo de ${actorName}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full rounded-btn"
            />
          ) : (
            <video
              src={videoUrl}
              controls
              autoPlay
              className="absolute inset-0 w-full h-full rounded-btn bg-black"
            />
          )}
        </div>
      </div>
    </Modal>
  );
}
