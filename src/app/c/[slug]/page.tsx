import { createClient } from "@/lib/supabase/server";
import { CastingClientView } from "./CastingClientView";
import { Logo } from "@/components/ui/Logo";
import type { PublicCasting } from "@/lib/types";

export default async function CastingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_casting_by_slug", {
    casting_slug: slug,
  });

  if (error || !data) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="text-center">
          <Logo className="text-3xl mb-6" />
          <h1 className="text-2xl font-heading font-semibold text-dark mb-2">
            Casting introuvable
          </h1>
          <p className="text-gray-400">
            Ce lien n&apos;existe pas ou a expiré.
          </p>
        </div>
      </div>
    );
  }

  const casting = data as unknown as PublicCasting;

  return <CastingClientView casting={casting} slug={slug} />;
}
