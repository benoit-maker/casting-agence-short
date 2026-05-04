import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  requireAuth,
  pickFields,
  isAllowedPhotoUrl,
  isAllowedVideoUrl,
} from "@/lib/auth";

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("super_admin");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body invalide" }, { status: 400 });
  }

  const data = pickFields<Record<string, unknown>>(body, ALLOWED_FIELDS);

  if (data.sex !== undefined && data.sex !== "Femme" && data.sex !== "Homme") {
    return NextResponse.json({ error: "Sexe invalide" }, { status: 400 });
  }

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
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ actor });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth("super_admin");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const admin = createAdminClient();

  // Remove actor from any castings first
  await admin.from("casting_actors").delete().eq("actor_id", id);

  const { error } = await admin.from("actors").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
