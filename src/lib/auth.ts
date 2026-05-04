import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/lib/types";

export type AuthResult =
  | { ok: true; userId: string; role: UserRole }
  | { ok: false; status: 401 | 403; error: string };

/**
 * Verifies the current user and (optionally) their role.
 * Always uses the admin client to read the role (bypasses RLS to avoid recursion).
 *
 * @param requiredRole - if provided, the user must have this exact role
 */
export async function requireAuth(
  requiredRole?: UserRole
): Promise<AuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, status: 401, error: "Non autorisé" };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return { ok: false, status: 403, error: "Profil introuvable" };
  }

  const role = profile.role as UserRole;

  if (requiredRole && role !== requiredRole) {
    return { ok: false, status: 403, error: "Accès refusé" };
  }

  return { ok: true, userId: user.id, role };
}

/**
 * Picks only the allowed keys from an object — protects against mass-assignment.
 */
export function pickFields<T extends Record<string, unknown>>(
  body: unknown,
  allowed: readonly (keyof T)[]
): Partial<T> {
  if (!body || typeof body !== "object") return {};
  const result: Partial<T> = {};
  for (const key of allowed) {
    if (key in (body as Record<string, unknown>)) {
      (result as Record<string, unknown>)[key as string] = (
        body as Record<string, unknown>
      )[key as string];
    }
  }
  return result;
}

/**
 * Sanitizes a video URL: only allow https + whitelisted hosts.
 */
const ALLOWED_VIDEO_HOSTS = [
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
  "drive.google.com",
  "vimeo.com",
  "player.vimeo.com",
];

export function isAllowedVideoUrl(url: unknown): url is string {
  if (typeof url !== "string" || url.length > 500) return false;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    // Allow Supabase Storage URLs
    if (u.hostname.endsWith(".supabase.co")) return true;
    if (u.hostname.endsWith(".supabase.in")) return true;
    return ALLOWED_VIDEO_HOSTS.includes(u.hostname);
  } catch {
    return false;
  }
}

export function isAllowedPhotoUrl(url: unknown): url is string {
  if (typeof url !== "string" || url.length > 500) return false;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    return (
      u.hostname.endsWith(".supabase.co") || u.hostname.endsWith(".supabase.in")
    );
  } catch {
    return false;
  }
}
