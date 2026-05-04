import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth";

const VALID_ROLES = new Set(["super_admin", "project_manager"]);

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

  const { profileId, newRole } = (body as {
    profileId?: unknown;
    newRole?: unknown;
  }) ?? {};

  if (typeof profileId !== "string" || typeof newRole !== "string") {
    return NextResponse.json(
      { error: "Paramètres invalides" },
      { status: 400 }
    );
  }
  if (!VALID_ROLES.has(newRole)) {
    return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ role: newRole })
    .eq("id", profileId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
