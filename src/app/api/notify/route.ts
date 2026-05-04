import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * HMAC token to ensure /api/notify can only be called by clients that loaded
 * the public casting page (which gets the token at SSR time).
 */
function expectedNotifyToken(slug: string, actorId: string): string {
  const secret = process.env.NOTIFY_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return crypto
    .createHmac("sha256", secret)
    .update(`${slug}:${actorId}`)
    .digest("hex")
    .slice(0, 32);
}

export function generateNotifyToken(slug: string, actorId: string): string {
  return expectedNotifyToken(slug, actorId);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { castingId, actorId, slug, isChange, token } = (body ?? {}) as {
      castingId?: unknown;
      actorId?: unknown;
      slug?: unknown;
      isChange?: unknown;
      token?: unknown;
    };

    if (
      typeof castingId !== "string" ||
      typeof actorId !== "string" ||
      typeof slug !== "string" ||
      typeof token !== "string"
    ) {
      return NextResponse.json(
        { error: "Paramètres invalides" },
        { status: 400 }
      );
    }

    // Token check (constant time)
    const expected = expectedNotifyToken(slug, actorId);
    const a = Buffer.from(token);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return NextResponse.json({ error: "Token invalide" }, { status: 403 });
    }

    const supabase = createAdminClient();

    const { data: casting } = await supabase
      .from("castings")
      .select("*, profiles!castings_project_manager_id_fkey(email, full_name)")
      .eq("id", castingId)
      .eq("slug", slug)
      .single();

    if (!casting) {
      return NextResponse.json({ error: "Casting not found" }, { status: 404 });
    }

    const { data: actor } = await supabase
      .from("actors")
      .select("name, display_name")
      .eq("id", actorId)
      .single();

    if (!actor) {
      return NextResponse.json({ error: "Actor not found" }, { status: 404 });
    }

    const pm = (casting as any).profiles;
    if (!pm?.email) {
      return NextResponse.json({ error: "PM email missing" }, { status: 500 });
    }

    const actorName = actor.display_name || actor.name;
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://casting.agenceshort.fr";

    const subject = isChange
      ? `🔄 ${casting.client_name} a changé son choix d'acteur`
      : `🎬 ${casting.client_name} a choisi son acteur !`;

    await resend.emails.send({
      from: "Casting Short <casting@agenceshort.fr>",
      to: pm.email,
      subject,
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="font-family: 'Rubik', sans-serif; color: #131313;">
            ${isChange ? "Changement de choix" : "Acteur sélectionné"} !
          </h2>
          <p style="color: #454545;">
            <strong>${casting.client_name}</strong> a ${isChange ? "changé son choix et" : ""} sélectionné
            <strong style="color: #665DFF;"> ${actorName}</strong>
            ${casting.project_name ? ` pour le projet "${casting.project_name}"` : ""}.
          </p>
          <a href="${appUrl}/admin/castings/${castingId}"
             style="display: inline-block; background: #665DFF; color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 500; margin-top: 16px;">
            Voir le détail
          </a>
          <p style="color: #8A8A8A; font-size: 12px; margin-top: 32px;">
            — L'équipe Short
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notification error:", error);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  }
}
