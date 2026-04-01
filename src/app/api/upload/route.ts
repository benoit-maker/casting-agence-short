import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Generate a signed upload URL so the client can upload directly to Supabase Storage
// This bypasses the Vercel function body size limit
export async function POST(request: NextRequest) {
  const { fileName, contentType, folder } = await request.json();

  if (!fileName || !folder) {
    return NextResponse.json({ error: "fileName et folder requis" }, { status: 400 });
  }

  // Only allow applications/ folder for public uploads
  if (!folder.startsWith("applications")) {
    return NextResponse.json({ error: "Dossier non autorisé" }, { status: 403 });
  }

  const ext = fileName.split(".").pop() || "bin";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const admin = createAdminClient();

  const { data, error } = await admin.storage
    .from("actor-photos")
    .createSignedUploadUrl(path);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: urlData } = admin.storage
    .from("actor-photos")
    .getPublicUrl(path);

  return NextResponse.json({
    signedUrl: data.signedUrl,
    token: data.token,
    path,
    publicUrl: urlData.publicUrl,
  });
}
