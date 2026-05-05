import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateDisplayName } from "@/lib/utils";
import { requireAuth } from "@/lib/auth";

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

  const { applicationId } = (body as { applicationId?: unknown }) ?? {};
  if (typeof applicationId !== "string") {
    return NextResponse.json(
      { error: "applicationId requis" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const { data: app, error: appError } = await admin
    .from("applications")
    .select("*")
    .eq("id", applicationId)
    .single();

  if (appError || !app) {
    return NextResponse.json(
      { error: "Application not found" },
      { status: 404 }
    );
  }

  const fullName = `${app.first_name} ${app.last_name}`;

  // Determine age range from date of birth
  let ageRanges: string[] = [];
  if (app.date_of_birth) {
    const birthDate = new Date(app.date_of_birth);
    const age = Math.floor(
      (Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    );
    if (age < 25) ageRanges = ["18-25 ans"];
    else if (age < 40) ageRanges = ["25-40 ans"];
    else if (age < 55) ageRanges = ["40-55 ans"];
    else ageRanges = ["55+"];
  }

  const { data: actor, error: actorError } = await admin
    .from("actors")
    .insert({
      name: fullName,
      display_name: generateDisplayName(fullName),
      sex: app.sex,
      age_ranges: ageRanges,
      cities:
        app.cities && app.cities.length > 0
          ? app.cities
          : app.city
            ? [app.city]
            : [],
      phone: app.phone || null,
      photo_url: app.photo_urls?.[0] || null,
      video_url: app.video_urls?.[0] || null,
      video_urls: app.video_urls || [],
      availability: app.availability || [],
      accepts_rate: app.accepts_rate ?? null,
      portfolio_link: app.portfolio_link || null,
      micro_entrepreneur_status: app.micro_entrepreneur_status || null,
      is_active: true,
    })
    .select()
    .single();

  if (actorError) {
    return NextResponse.json(
      { error: "Failed to create actor" },
      { status: 500 }
    );
  }

  await admin
    .from("applications")
    .update({ status: "accepted" })
    .eq("id", applicationId);

  return NextResponse.json({ actor });
}
