import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth";

/**
 * Vérifie que l'utilisateur est PM propriétaire ou super_admin pour ce casting.
 */
async function canManageCasting(
  castingId: string,
  userId: string,
  role: "super_admin" | "project_manager"
): Promise<boolean> {
  if (role === "super_admin") return true;
  const admin = createAdminClient();
  const { data } = await admin
    .from("castings")
    .select("project_manager_id")
    .eq("id", castingId)
    .single();
  return data?.project_manager_id === userId;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  if (!(await canManageCasting(id, auth.userId, auth.role))) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body invalide" }, { status: 400 });
  }

  const { actorIds } = (body as { actorIds?: unknown }) ?? {};

  if (
    !Array.isArray(actorIds) ||
    actorIds.some((x) => typeof x !== "string") ||
    actorIds.length > 100
  ) {
    return NextResponse.json(
      { error: "actorIds doit être un tableau de strings (max 100)" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const { error: deleteError } = await admin
    .from("casting_actors")
    .delete()
    .eq("casting_id", id);

  if (deleteError) {
    return NextResponse.json(
      { error: "Failed to update casting actors" },
      { status: 500 }
    );
  }

  if (actorIds.length > 0) {
    const castingActors = (actorIds as string[]).map((actorId, index) => ({
      casting_id: id,
      actor_id: actorId,
      position: index,
    }));

    const { error: insertError } = await admin
      .from("casting_actors")
      .insert(castingActors);

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to insert casting actors" },
        { status: 500 }
      );
    }
  }

  const { data: casting, error: fetchError } = await admin
    .from("castings")
    .select("*, casting_actors(actor_id, position)")
    .eq("id", id)
    .single();

  if (fetchError || !casting) {
    return NextResponse.json(
      { error: "Failed to fetch updated casting" },
      { status: 500 }
    );
  }

  return NextResponse.json({ casting });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;

  if (!(await canManageCasting(id, auth.userId, auth.role))) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const admin = createAdminClient();

  await admin.from("casting_actors").delete().eq("casting_id", id);

  const { error } = await admin.from("castings").delete().eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete casting" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
