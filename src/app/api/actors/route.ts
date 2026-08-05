import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  requireAuth,
  pickFields,
  isAllowedPhotoUrl,
  isAllowedVideoUrl,
} from "@/lib/auth";
import { computeAgeRanges } from "@/lib/utils";
import { PROFILE_TYPES } from "@/lib/types";

const ALLOWED_PROFILE_TYPES = new Set<string>(PROFILE_TYPES as readonly string[]);

// Champs autorisés (whitelist anti-mass-assignment)
const ALLOWED_FIELDS = [
  "name",
  "display_name",
  "sex",
  "profile_type",
  "cities",
  "phone",
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
    data.profile_type !== undefined &&
    (typeof data.profile_type !== "string" || !ALLOWED_PROFILE_TYPES.has(data.profile_type))
  ) {
    return NextResponse.json({ error: "Type de profil invalide" }, { status: 400 });
  }
  // Required fields
  if (typeof data.name !== "string" || !data.name.trim()) {
    return NextResponse.json({ error: "Nom requis" }, { status: 400 });
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
