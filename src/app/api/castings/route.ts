import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateSlug } from "@/lib/utils";
import { requireAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body invalide" }, { status: 400 });
  }

  const { clientName, projectName, actorIds } = (body as {
    clientName?: unknown;
    projectName?: unknown;
    actorIds?: unknown;
  }) ?? {};

  if (
    typeof clientName !== "string" ||
    !clientName.trim() ||
    clientName.length > 200
  ) {
    return NextResponse.json(
      { error: "clientName invalide" },
      { status: 400 }
    );
  }
  if (
    projectName !== undefined &&
    projectName !== null &&
    (typeof projectName !== "string" || projectName.length > 200)
  ) {
    return NextResponse.json(
      { error: "projectName invalide" },
      { status: 400 }
    );
  }
  if (
    !Array.isArray(actorIds) ||
    actorIds.length === 0 ||
    actorIds.length > 100 ||
    actorIds.some((x) => typeof x !== "string")
  ) {
    return NextResponse.json(
      { error: "actorIds invalide (1-100 strings)" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const slug = generateSlug();

  const { data: casting, error } = await admin
    .from("castings")
    .insert({
      slug,
      client_name: clientName.trim(),
      project_name:
        typeof projectName === "string" && projectName.trim()
          ? projectName.trim()
          : null,
      project_manager_id: auth.userId,
    })
    .select()
    .single();

  if (error || !casting) {
    return NextResponse.json(
      { error: "Failed to create casting" },
      { status: 500 }
    );
  }

  const castingActors = (actorIds as string[]).map((actorId, index) => ({
    casting_id: casting.id,
    actor_id: actorId,
    position: index,
  }));

  await admin.from("casting_actors").insert(castingActors);

  return NextResponse.json({ casting });
}
