import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateDisplayName } from "@/lib/utils";

export async function POST(request: NextRequest) {
  // Verify authenticated
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { applicationId } = await request.json();

  const admin = createAdminClient();

  // Get the application
  const { data: app, error: appError } = await admin
    .from("applications")
    .select("*")
    .eq("id", applicationId)
    .single();

  if (appError || !app) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const fullName = `${app.last_name} ${app.first_name}`;

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

  // Create actor
  const { data: actor, error: actorError } = await admin
    .from("actors")
    .insert({
      name: fullName,
      display_name: generateDisplayName(fullName),
      sex: app.sex,
      age_ranges: ageRanges,
      cities: [app.city],
      phone: app.phone || null,
      photo_url: app.photo_urls?.[0] || null,
      video_url: app.video_urls?.[0] || null,
      is_active: true,
    })
    .select()
    .single();

  if (actorError) {
    return NextResponse.json({ error: "Failed to create actor" }, { status: 500 });
  }

  // Mark application as accepted
  await admin
    .from("applications")
    .update({ status: "accepted" })
    .eq("id", applicationId);

  return NextResponse.json({ actor });
}
