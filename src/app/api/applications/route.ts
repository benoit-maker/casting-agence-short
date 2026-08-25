import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAllowedPhotoUrl, isAllowedVideoUrl } from "@/lib/auth";
import { DEFAULT_CITIES, DEFAULT_LANGUAGES, PROFILE_TYPES, UAE_CITIES, AGE_RANGES } from "@/lib/types";

const NAME_MAX = 100;
const STR_MAX = 200;
const URL_MAX = 500;
const MAX_PHOTOS = 5;
const MAX_VIDEOS = 3;
const LANGUAGE_MAX = 50;
const MAX_LANGUAGES = 10;
const ALLOWED_CITIES = new Set<string>([
  ...(DEFAULT_CITIES as readonly string[]),
  ...(UAE_CITIES as readonly string[]),
]);
const ALLOWED_LANGUAGES = new Set<string>(DEFAULT_LANGUAGES as readonly string[]);
const ALLOWED_PROFILE_TYPES = new Set<string>(PROFILE_TYPES as readonly string[]);
const ALLOWED_AGE_RANGES = new Set<string>(AGE_RANGES as readonly string[]);
const ALLOWED_AVAILABILITY = new Set(["flexible", "weekdays", "weekends"]);
const ALLOWED_MICRO_STATUS = new Set(["yes", "no", "can_create"]);
const ALLOWED_REFERRAL_SOURCES = new Set(["facebook", "publicite", "bouche_a_oreille", "recommandation"]);

function isValidString(v: unknown, max = STR_MAX): v is string {
  return typeof v === "string" && v.length > 0 && v.length <= max;
}

function isValidPortfolioLink(v: unknown): boolean {
  if (typeof v !== "string" || v.length > URL_MAX) return false;
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
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
    age_range,
    cities,
    sex,
    profile_types,
    email,
    phone,
    photo_urls,
    video_urls,
    availability,
    accepts_rate,
    portfolio_link,
    micro_entrepreneur_status,
    referral_source,
    languages,
    origin,
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
    profile_types !== undefined &&
    profile_types !== null &&
    (!Array.isArray(profile_types) ||
      profile_types.length === 0 ||
      profile_types.some((pt) => typeof pt !== "string" || !ALLOWED_PROFILE_TYPES.has(pt)))
  ) {
    return NextResponse.json(
      { error: "Type de profil invalide" },
      { status: 400 }
    );
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
  if (!isValidString(phone, 30)) {
    return NextResponse.json(
      { error: "Téléphone invalide ou manquant" },
      { status: 400 }
    );
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

  // Nouveaux champs
  if (
    !Array.isArray(availability) ||
    availability.length === 0 ||
    availability.length > 3 ||
    availability.some(
      (a) => typeof a !== "string" || !ALLOWED_AVAILABILITY.has(a)
    )
  ) {
    return NextResponse.json(
      { error: "Disponibilité invalide" },
      { status: 400 }
    );
  }
  if (typeof accepts_rate !== "boolean") {
    return NextResponse.json(
      { error: "accepts_rate doit être un booléen" },
      { status: 400 }
    );
  }
  if (
    portfolio_link !== null &&
    portfolio_link !== undefined &&
    portfolio_link !== "" &&
    !isValidPortfolioLink(portfolio_link)
  ) {
    return NextResponse.json(
      { error: "Lien portfolio invalide" },
      { status: 400 }
    );
  }
  if (
    typeof micro_entrepreneur_status !== "string" ||
    !ALLOWED_MICRO_STATUS.has(micro_entrepreneur_status)
  ) {
    return NextResponse.json(
      { error: "Statut micro-entrepreneur invalide" },
      { status: 400 }
    );
  }
  if (
    referral_source !== null &&
    referral_source !== undefined &&
    (typeof referral_source !== "string" || !ALLOWED_REFERRAL_SOURCES.has(referral_source))
  ) {
    return NextResponse.json(
      { error: "Source de recrutement invalide" },
      { status: 400 }
    );
  }
  if (
    languages !== undefined &&
    (!Array.isArray(languages) ||
      languages.length > MAX_LANGUAGES ||
      languages.some(
        (l) => typeof l !== "string" || (!ALLOWED_LANGUAGES.has(l) && !isValidString(l, LANGUAGE_MAX))
      ))
  ) {
    return NextResponse.json(
      { error: "Langue(s) invalide(s)" },
      { status: 400 }
    );
  }
  if (
    origin !== null &&
    origin !== undefined &&
    (typeof origin !== "string" || !["fr", "uae"].includes(origin))
  ) {
    return NextResponse.json({ error: "origin invalide" }, { status: 400 });
  }
  if (
    age_range !== null &&
    age_range !== undefined &&
    (typeof age_range !== "string" || !ALLOWED_AGE_RANGES.has(age_range))
  ) {
    return NextResponse.json({ error: "age_range invalide" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { error } = await admin.from("applications").insert({
    first_name,
    last_name,
    date_of_birth: date_of_birth || null,
    age_range: age_range || null,
    city: (cities as string[])[0],
    cities,
    sex,
    ...(Array.isArray(profile_types) ? { profile_types } : {}),
    email: email || null,
    phone,
    photo_urls: photo_urls || [],
    video_urls: video_urls || [],
    availability,
    accepts_rate,
    portfolio_link: portfolio_link || null,
    micro_entrepreneur_status,
    referral_source: referral_source || null,
    languages: languages || [],
    origin: (origin as string) || "fr",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
