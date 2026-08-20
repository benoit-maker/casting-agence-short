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

export function computeAgeRanges(dateOfBirth: string | null | undefined): string[] {
  if (!dateOfBirth) return [];
  const birthDate = new Date(dateOfBirth);
  const age = Math.floor(
    (Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );
  if (age < 18) return ["Moins de 18 ans"];
  if (age < 25) return ["18-25 ans"];
  if (age < 40) return ["25-40 ans"];
  if (age < 55) return ["40-55 ans"];
  return ["55+"];
}

export function getCastingUrl(slug: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://casting.agenceshort.fr";
  return `${base}/c/${slug}`;
}

const LANGUAGE_ABBREVIATIONS: Record<string, string> = {
  "Français": "FR",
  "Anglais": "EN",
  "Espagnol": "ES",
  "Italien": "IT",
  "Allemand": "DE",
  "Portugais": "PT",
  "Arabe": "AR",
  "Néerlandais": "NL",
  "Russe": "RU",
  "Chinois": "ZH",
};

export function abbreviateLanguage(language: string): string {
  return LANGUAGE_ABBREVIATIONS[language] || language.slice(0, 3).toUpperCase();
}
