import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

  const { email, password, fullName } = (body as {
    email?: unknown;
    password?: unknown;
    fullName?: unknown;
  }) ?? {};

  if (
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 200
  ) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }
  if (
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > 200
  ) {
    return NextResponse.json(
      { error: "Mot de passe : 8 caractères minimum" },
      { status: 400 }
    );
  }
  if (
    typeof fullName !== "string" ||
    !fullName.trim() ||
    fullName.length > 200
  ) {
    return NextResponse.json({ error: "Nom invalide" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: newUser, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error || !newUser?.user) {
    return NextResponse.json(
      { error: error?.message || "Erreur de création" },
      { status: 400 }
    );
  }

  // Trigger handle_new_user has been dropped for security — insert profile manually
  const { error: profileError } = await admin.from("profiles").insert({
    id: newUser.user.id,
    email,
    full_name: fullName,
    role: "project_manager",
  });

  if (profileError) {
    // Rollback: delete the auth user since the profile failed
    await admin.auth.admin.deleteUser(newUser.user.id);
    return NextResponse.json(
      { error: "Erreur création profil : " + profileError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ user: newUser });
}
