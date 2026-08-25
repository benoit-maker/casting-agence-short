import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  requireAuth,
  pickFields,
  isAllowedPhotoUrl,
  isAllowedVideoUrl,
} from "@/lib/auth";
import { computeAgeRanges } from "@/lib/utils";
import { PROFILE_TYPES, DEFAULT_LANGUAGES } from "@/lib/types";

const ALLOWED_PROFILE_TYPES = new Set<string>(PROFILE_TYPES as readonly string[]);
const ALLOWED_LANGUAGES = new Set<string>(DEFAULT_LANGUAGES as readonly string[]);
const LANGUAGE_MAX = 50;
const MAX_LANGUAGES = 10;

// Champs autorisés (whitelist anti-mass-assignment)
const ALLOWED_FIELDS = [
  "name",
  "display_name",
  "sex",
  "profile_types",
  "cities",
  "phone",
  "email",
  "rate",
  "photo_url",
  "video_url",
  "video_urls",
  "brands",
  "notes",
  "is_active",
  "is_blacklisted",
  "has_worked_with_us",
  "date_of_birth",
  "languages",
] as const;

export async function POST(request: NextRequest) {
  const auth = await requireAuth("super_admin");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body invalide" }, { status: 400 });
  }

  const data = pickFields<Record<string, unknown>>(body, ALLOWED_FIELDS);

  // Sex check
  if (data.sex !== undefined && data.sex !== "Femme" && data.sex !== "Homme") {
    return NextResponse.json({ error: "Sexe invalide" }, { status: 400 });
  }
  if (
    !Array.isArray(data.profile_types) ||
    data.profile_types.length === 0 ||
    data.profile_types.some((pt) => typeof pt !== "string" || !ALLOWED_PROFILE_TYPES.has(pt))
  ) {
    return NextResponse.json({ error: "Type de profil invalide" }, { status: 400 });
  }
  if (
    data.languages !== undefined &&
    (!Array.isArray(data.languages) ||
      data.languages.length > MAX_LANGUAGES ||
      data.languages.some(
        (l) => typeof l !== "string" || (!ALLOWED_LANGUAGES.has(l) && (!l.trim() || l.length > LANGUAGE_MAX))
      ))
  ) {
    return NextResponse.json({ error: "Langue(s) invalide(s)" }, { status: 400 });
  }
  // Required fields
  if (typeof data.name !== "string" || !data.name.trim()) {
    return NextResponse.json({ error: "Nom requis" }, { status: 400 });
  }

  if (
    data.email !== undefined &&
    data.email !== null &&
    (typeof data.email !== "string" ||
      data.email.length > 200 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
  ) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }

  if (
    data.date_of_birth !== undefined &&
    data.date_of_birth !== null &&
    (typeof data.date_of_birth !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(data.date_of_birth))
  ) {
    return NextResponse.json(
      { error: "Date de naissance invalide" },
      { status: 400 }
    );
  }
  data.age_ranges = computeAgeRanges(data.date_of_birth as string | null | undefined);

  // Validate URLs
  if (data.photo_url && !isAllowedPhotoUrl(data.photo_url)) {
    return NextResponse.json({ error: "photo_url invalide" }, { status: 400 });
  }
  if (data.video_url && !isAllowedVideoUrl(data.video_url)) {
    return NextResponse.json({ error: "video_url invalide" }, { status: 400 });
  }
  if (Array.isArray(data.video_urls)) {
    for (const u of data.video_urls) {
      if (!isAllowedVideoUrl(u)) {
        return NextResponse.json(
          { error: "video_urls contient une URL non autorisée" },
          { status: 400 }
        );
      }
    }
  }

  const admin = createAdminClient();

  const { data: actor, error } = await admin
    .from("actors")
    .insert(data)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ actor });
}
