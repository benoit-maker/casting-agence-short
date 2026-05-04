import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Whitelist d'extensions autorisées
const ALLOWED_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "mp4",
  "mov",
  "webm",
]);

const ALLOWED_MIME_PREFIXES = ["image/", "video/"];

const ALLOWED_FOLDERS = new Set(["applications", "applications/videos"]);

const FILENAME_MAX = 200;

// Generate a signed upload URL so the client can upload directly to Supabase Storage
// This bypasses the Vercel function body size limit
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body invalide" }, { status: 400 });
  }

  const { fileName, contentType, folder } = (body as {
    fileName?: string;
    contentType?: string;
    folder?: string;
  }) ?? {};

  if (
    typeof fileName !== "string" ||
    typeof folder !== "string" ||
    !fileName ||
    !folder
  ) {
    return NextResponse.json(
      { error: "fileName et folder requis" },
      { status: 400 }
    );
  }

  if (fileName.length > FILENAME_MAX) {
    return NextResponse.json(
      { error: "Nom de fichier trop long" },
      { status: 400 }
    );
  }

  // Strict folder whitelist (no path traversal possible)
  if (!ALLOWED_FOLDERS.has(folder)) {
    return NextResponse.json(
      { error: "Dossier non autorisé" },
      { status: 403 }
    );
  }

  // Extension whitelist
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return NextResponse.json(
      { error: "Type de fichier non autorisé" },
      { status: 400 }
    );
  }

  // MIME whitelist (image/* or video/*)
  if (
    typeof contentType === "string" &&
    !ALLOWED_MIME_PREFIXES.some((p) => contentType.startsWith(p))
  ) {
    return NextResponse.json(
      { error: "Type MIME non autorisé" },
      { status: 400 }
    );
  }

  // Path is generated server-side: no user-controlled path possible
  const path = `${folder}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${ext}`;

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
