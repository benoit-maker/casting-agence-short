import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateSlug } from "@/lib/utils";

export async function POST(request: NextRequest) {
  // Verify the user is authenticated
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientName, projectName, actorIds } = await request.json();

  if (!clientName || !actorIds?.length) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const admin = createAdminClient();
  const slug = generateSlug();

  // Create casting
  const { data: casting, error } = await admin
    .from("castings")
    .insert({
      slug,
      client_name: clientName,
      project_name: projectName || null,
      project_manager_id: user.id,
    })
    .select()
    .single();

  if (error || !casting) {
    return NextResponse.json(
      { error: "Failed to create casting" },
      { status: 500 }
    );
  }

  // Add actors to casting
  const castingActors = actorIds.map((actorId: string, index: number) => ({
    casting_id: casting.id,
    actor_id: actorId,
    position: index,
  }));

  await admin.from("casting_actors").insert(castingActors);

  return NextResponse.json({ casting });
}
