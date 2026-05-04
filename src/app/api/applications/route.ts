import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAllowedPhotoUrl, isAllowedVideoUrl } from "@/lib/auth";
import { DEFAULT_CITIES } from "@/lib/types";

const NAME_MAX = 100;
const STR_MAX = 200;
const MAX_PHOTOS = 5;
const MAX_VIDEOS = 3;
const ALLOWED_CITIES = new Set<string>(DEFAULT_CITIES as readonly string[]);

function isValidString(v: unknown, max = STR_MAX): v is string {
  return typeof v === "string" && v.length > 0 && v.length <= max;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body invalide" }, { status: 400 });
  }

  const {
    first_name,
    last_name,
    date_of_birth,
    cities,
    sex,
    email,
    phone,
    photo_urls,
    video_urls,
  } = (body as Record<string, unknown>) ?? {};

  if (!isValidString(first_name, NAME_MAX)) {
    return NextResponse.json({ error: "Prénom invalide" }, { status: 400 });
  }
  if (!isValidString(last_name, NAME_MAX)) {
    return NextResponse.json({ error: "Nom invalide" }, { status: 400 });
  }
  if (sex !== "Femme" && sex !== "Homme") {
    return NextResponse.json({ error: "Sexe invalide" }, { status: 400 });
  }
  if (
    !Array.isArray(cities) ||
    cities.length === 0 ||
    cities.length > 10 ||
    cities.some((c) => typeof c !== "string" || !ALLOWED_CITIES.has(c))
  ) {
    return NextResponse.json(
      { error: "Ville(s) invalide(s)" },
      { status: 400 }
    );
  }
  if (
    date_of_birth !== undefined &&
    date_of_birth !== null &&
    (typeof date_of_birth !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date_of_birth))
  ) {
    return NextResponse.json(
      { error: "Date de naissance invalide" },
      { status: 400 }
    );
  }
  if (
    email !== undefined &&
    email !== null &&
    (typeof email !== "string" ||
      email.length > 200 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  ) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }
  if (
    phone !== undefined &&
    phone !== null &&
    (typeof phone !== "string" || phone.length > 30)
  ) {
    return NextResponse.json({ error: "Téléphone invalide" }, { status: 400 });
  }
  if (
    photo_urls !== undefined &&
    (!Array.isArray(photo_urls) ||
      photo_urls.length > MAX_PHOTOS ||
      !photo_urls.every(isAllowedPhotoUrl))
  ) {
    return NextResponse.json(
      { error: "photo_urls invalide" },
      { status: 400 }
    );
  }
  if (
    video_urls !== undefined &&
    (!Array.isArray(video_urls) ||
      video_urls.length > MAX_VIDEOS ||
      !video_urls.every(isAllowedVideoUrl))
  ) {
    return NextResponse.json(
      { error: "video_urls invalide" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const { error } = await admin.from("applications").insert({
    first_name,
    last_name,
    date_of_birth: date_of_birth || null,
    city: (cities as string[])[0],
    cities,
    sex,
    email: email || null,
    phone: phone || null,
    photo_urls: photo_urls || [],
    video_urls: video_urls || [],
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
