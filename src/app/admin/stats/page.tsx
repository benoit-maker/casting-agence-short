import { createAdminClient } from "@/lib/supabase/admin";
import { StatsView } from "@/components/admin/StatsView";
import type { Actor } from "@/lib/types";

const AGE_RANGES = ["18-25 ans", "25-40 ans", "40-55 ans", "55+"];
const SEXES = ["Femme", "Homme"] as const;

export default async function StatsPage() {
  const supabase = createAdminClient();
  const { data } = await supabase.from("actors").select("*");
  const actors = (data as Actor[]) || [];

  const total = actors.length;
  const active = actors.filter((a) => a.is_active).length;

  const sex = [
    { label: "Femmes", count: actors.filter((a) => a.sex === "Femme").length },
    { label: "Hommes", count: actors.filter((a) => a.sex === "Homme").length },
  ].map((d) => ({ ...d, pct: total ? Math.round((d.count / total) * 100) : 0 }));

  const ageRanges = AGE_RANGES.map((range) => {
    const count = actors.filter((a) => a.age_ranges.includes(range)).length;
    return { label: range, count, pct: total ? Math.round((count / total) * 100) : 0 };
  });

  const cityCounts: Record<string, number> = {};
  actors.forEach((a) => a.cities.forEach((c) => { cityCounts[c] = (cityCounts[c] || 0) + 1; }));
  const topCities = Object.entries(cityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([label, count]) => ({ label, count, pct: total ? Math.round((count / total) * 100) : 0 }));

  const allProfiles = SEXES.flatMap((s) =>
    AGE_RANGES.map((range) => ({
      sex: s,
      ageRange: range,
      count: actors.filter((a) => a.sex === s && a.age_ranges.includes(range)).length,
    }))
  );
  const topProfiles = [...allProfiles].sort((a, b) => b.count - a.count).slice(0, 3);
  const rareProfiles = [...allProfiles].sort((a, b) => a.count - b.count).slice(0, 3);

  const monthCounts: Record<string, number> = {};
  actors.forEach((a) => {
    const date = new Date(a.created_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthCounts[key] = (monthCounts[key] || 0) + 1;
  });
  let cumulative = 0;
  const growthData = Object.entries(monthCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, count]) => {
      cumulative += count;
      const [year, month] = key.split("-");
      const label = new Date(Number(year), Number(month) - 1).toLocaleDateString("fr-FR", {
        month: "short",
        year: "numeric",
      });
      return { month: label, total: cumulative };
    });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-semibold text-dark">Statistiques</h1>
        <p className="text-sm text-gray-400 mt-1">Données démographiques des acteurs</p>
      </div>
      <StatsView
        total={total}
        active={active}
        sex={sex}
        ageRanges={ageRanges}
        topCities={topCities}
        topProfiles={topProfiles}
        rareProfiles={rareProfiles}
        growthData={growthData}
      />
    </div>
  );
}
