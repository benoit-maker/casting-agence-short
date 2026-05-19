import { createAdminClient } from "@/lib/supabase/admin";
import { StatsView } from "@/components/admin/StatsView";
import type { Actor } from "@/lib/types";

const AGE_RANGES = ["18-25 ans", "25-40 ans", "40-55 ans", "55+"];
const SEXES = ["Femme", "Homme"] as const;

function getWeekKey(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date.toISOString().slice(0, 10);
}

function formatWeekLabel(isoDate: string): string {
  const date = new Date(isoDate + "T00:00:00");
  return date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
}

function groupByWeek(dates: string[]): { week: string; count: number }[] {
  const map: Record<string, number> = {};
  for (const d of dates) {
    const key = getWeekKey(d);
    map[key] = (map[key] || 0) + 1;
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, count]) => ({ week: formatWeekLabel(key), count }));
}

export default async function StatsPage() {
  const supabase = createAdminClient();

  const [{ data: actorsData }, { data: historyData }] = await Promise.all([
    supabase.from("actors").select("*"),
    supabase.from("worked_with_us_history").select("marked_at"),
  ]);

  const actors = (actorsData as Actor[]) || [];

  const total = actors.length;
  const active = actors.filter((a) => a.has_worked_with_us).length;

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

  const weeklyActors = groupByWeek(actors.map((a) => a.created_at));
  const weeklyWorked = groupByWeek((historyData || []).map((h: { marked_at: string }) => h.marked_at));

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
        weeklyActors={weeklyActors}
        weeklyWorked={weeklyWorked}
      />
    </div>
  );
}
