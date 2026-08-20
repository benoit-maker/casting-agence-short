import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  requireAuth,
  pickFields,
  isAllowedPhotoUrl,
  isAllowedVideoUrl,
} from "@/lib/auth";
import { BLACKLIST_REASONS, PROFILE_TYPES, DEFAULT_LANGUAGES } from "@/lib/types";
import { computeAgeRanges } from "@/lib/utils";

const ALLOWED_BLACKLIST_REASONS = new Set<string>(BLACKLIST_REASONS as readonly string[]);
const ALLOWED_PROFILE_TYPES = new Set<string>(PROFILE_TYPES as readonly string[]);
const ALLOWED_LANGUAGES = new Set<string>(DEFAULT_LANGUAGES as readonly string[]);
const REASON_DETAIL_MAX = 200;
const LANGUAGE_MAX = 50;
const MAX_LANGUAGES = 10;

const ALLOWED_FIELDS = [
  "name",
  "display_name",
  "sex",
  "profile_types",
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
  "languages",
] as const;

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(["super_admin", "project_manager"]);
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

  if (
    data.profile_types !== undefined &&
    (!Array.isArray(data.profile_types) ||
      data.profile_types.length === 0 ||
      data.profile_types.some((pt) => typeof pt !== "string" || !ALLOWED_PROFILE_TYPES.has(pt)))
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
  if ("date_of_birth" in data) {
    data.age_ranges = computeAgeRanges(data.date_of_birth as string | null);
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

  const rawBody = (body as Record<string, unknown>) ?? {};
  const reason = rawBody.reason;
  const reasonDetail = rawBody.reason_detail;

  if (data.is_blacklisted === true) {
    if (typeof reason !== "string" || !ALLOWED_BLACKLIST_REASONS.has(reason)) {
      return NextResponse.json({ error: "Motif de blacklist invalide" }, { status: 400 });
    }
    if (
      reason === "Autre" &&
      (typeof reasonDetail !== "string" || !reasonDetail.trim() || reasonDetail.length > REASON_DETAIL_MAX)
    ) {
      return NextResponse.json({ error: "Précisez le motif" }, { status: 400 });
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

  if (typeof data.has_worked_with_us === "boolean") {
    if (data.has_worked_with_us) {
      const { error: historyError } = await admin
        .from("worked_with_us_history")
        .insert({ actor_id: id });
      if (historyError) {
        console.error("[actors PUT] worked_with_us_history insert error:", historyError.message);
      }
    } else {
      const { error: historyError } = await admin
        .from("worked_with_us_history")
        .delete()
        .eq("actor_id", id);
      if (historyError) {
        console.error("[actors PUT] worked_with_us_history delete error:", historyError.message);
      }
    }
  }

  if (data.is_blacklisted === true) {
    const { error: blacklistError } = await admin.from("blacklist_history").insert({
      actor_id: id,
      reason,
      reason_detail: reason === "Autre" ? (reasonDetail as string).trim() : null,
    });
    if (blacklistError) {
      console.error("[actors PUT] blacklist_history insert error:", blacklistError.message);
    }
  }

  return NextResponse.json({ actor });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(["super_admin", "project_manager"]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const admin = createAdminClient();

  // Détacher l'acteur de toutes les tables qui le référencent
  await admin.from("casting_actors").delete().eq("actor_id", id);
  await admin.from("castings").update({ selected_actor_id: null, status: "pending" }).eq("selected_actor_id", id);

  const { error } = await admin.from("actors").delete().eq("id", id);

  if (error) {
    console.error("[delete actor] error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
