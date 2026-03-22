import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { actorIds } = await request.json();

  if (!actorIds || !Array.isArray(actorIds)) {
    return NextResponse.json(
      { error: "actorIds is required and must be an array" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Delete all existing casting_actors for this casting
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

  // Insert the new casting_actors with position ordering
  if (actorIds.length > 0) {
    const castingActors = actorIds.map((actorId: string, index: number) => ({
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

  // Return the updated casting
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  // Delete casting_actors first (foreign key constraint)
  await admin.from("casting_actors").delete().eq("casting_id", id);

  // Delete the casting
  const { error } = await admin.from("castings").delete().eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete casting" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
