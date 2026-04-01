import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File;
  const folder = formData.get("folder") as string;

  if (!file || !folder) {
    return NextResponse.json({ error: "Fichier et dossier requis" }, { status: 400 });
  }

  // Only allow applications/ folder for public uploads
  if (!folder.startsWith("applications/")) {
    return NextResponse.json({ error: "Dossier non autorisé" }, { status: 403 });
  }

  const ext = file.name.split(".").pop() || "bin";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const admin = createAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await admin.storage
    .from("actor-photos")
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: urlData } = admin.storage
    .from("actor-photos")
    .getPublicUrl(path);

  return NextResponse.json({ url: urlData.publicUrl });
}
