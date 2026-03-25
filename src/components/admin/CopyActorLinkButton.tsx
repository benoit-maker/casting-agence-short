"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";

export function CopyActorLinkButton({ actorId }: { actorId: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const base = process.env.NEXT_PUBLIC_APP_URL || "https://casting-agence-short.vercel.app";
    await navigator.clipboard.writeText(`${base}/a/${actorId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-btn text-gray-400 hover:text-primary hover:bg-primary-light transition-colors cursor-pointer"
      title="Copier le lien du profil"
    >
      {copied ? (
        <Check className="w-4 h-4 text-success" />
      ) : (
        <Link2 className="w-4 h-4" />
      )}
    </button>
  );
}
