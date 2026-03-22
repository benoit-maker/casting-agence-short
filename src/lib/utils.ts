import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { nanoid } from "nanoid";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateSlug() {
  return nanoid(8);
}

export function getYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\s?]+)/
  );
  return match ? match[1] : null;
}

export function getGoogleDriveId(url: string): string | null {
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

export function getVideoEmbedUrl(url: string): string | null {
  const ytId = getYouTubeId(url);
  if (ytId) return `https://www.youtube.com/embed/${ytId}?autoplay=1`;

  const driveId = getGoogleDriveId(url);
  if (driveId) return `https://drive.google.com/file/d/${driveId}/preview`;

  return null;
}

export function generateDisplayName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

export function getCastingUrl(slug: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://casting.agenceshort.fr";
  return `${base}/c/${slug}`;
}
