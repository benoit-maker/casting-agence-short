import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { first_name, last_name, date_of_birth, city, sex, email, phone, photo_urls, video_urls } = body;

  if (!first_name || !last_name || !city || !sex) {
    return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { error } = await admin.from("applications").insert({
    first_name,
    last_name,
    date_of_birth: date_of_birth || null,
    city,
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
