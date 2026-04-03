"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { VideoModal } from "@/components/client/VideoModal";

export function ActorVideoPlayer({ videoUrl, actorName, label }: { videoUrl: string; actorName: string; label?: string }) {
  const [showVideo, setShowVideo] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowVideo(true)}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-btn border border-gray-200 text-sm font-medium text-gray-600 hover:border-primary hover:text-primary transition-colors cursor-pointer"
      >
        <Play className="w-5 h-5" />
        {label || "Voir la bande démo"}
      </button>
      <VideoModal
        open={showVideo}
        onClose={() => setShowVideo(false)}
        videoUrl={videoUrl}
        actorName={actorName}
      />
    </>
  );
}
