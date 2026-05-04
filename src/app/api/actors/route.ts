import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  requireAuth,
  pickFields,
  isAllowedPhotoUrl,
  isAllowedVideoUrl,
} from "@/lib/auth";

// Champs autorisés (whitelist anti-mass-assignment)
const ALLOWED_FIELDS = [
  "name",
  "display_name",
  "sex",
  "age_ranges",
  "cities",
  "phone",
  "rate",
  "photo_url",
  "video_url",
  "video_urls",
  "brands",
  "notes",
  "is_active",
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
  // Required fields
  if (typeof data.name !== "string" || !data.name.trim()) {
    return NextResponse.json({ error: "Nom requis" }, { status: 400 });
  }

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
