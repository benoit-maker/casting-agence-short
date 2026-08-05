import { createAdminClient } from "@/lib/supabase/admin";
import { StatsView } from "@/components/admin/StatsView";
import { AGE_RANGES, DEFAULT_CITIES, REFERRAL_SOURCE_LABELS } from "@/lib/types";
import type { Actor } from "@/lib/types";
import type { BlacklistWeekStat } from "@/components/admin/BlacklistWeeklyStats";
import type { PubliciteMonthStat } from "@/components/admin/PubliciteMonthlyStats";

const SEXES = ["Femme", "Homme"] as const;

function getMonthKey(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

function formatMonthLabel(isoDate: string): string {
  const date = new Date(isoDate + "T00:00:00");
  const label = date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function groupByMonth(dates: string[]): { week: string; count: number }[] {
  const map: Record<string, number> = {};
  for (const d of dates) {
    const key = getMonthKey(d);
    map[key] = (map[key] || 0) + 1;
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, count]) => ({ week: formatMonthLabel(key), count }));
}

function groupByMonthSexAge(actors: Actor[]): PubliciteMonthStat[] {
  const map: Record<string, Actor[]> = {};
  for (const actor of actors) {
    const key = getMonthKey(actor.created_at);
    if (!map[key]) map[key] = [];
    map[key].push(actor);
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, monthActors]) => {
      const femmes = monthActors.filter((a) => a.sex === "Femme").length;
      const hommes = monthActors.filter((a) => a.sex === "Homme").length;
      const monthTotal = monthActors.length;
      const ageRanges = AGE_RANGES.map((range) => {
        const count = monthActors.filter((a) => a.age_ranges.includes(range)).length;
        return { label: range, count, pct: monthTotal ? Math.round((count / monthTotal) * 100) : 0 };
      });
      return { week: formatMonthLabel(key), femmes, hommes, count: monthTotal, ageRanges };
    });
}

function groupByMonthWithEntries(
  items: { date: string; name: string; reason: string; reasonDetail: string | null }[]
): BlacklistWeekStat[] {
  const map: Record<string, BlacklistWeekStat> = {};
  for (const item of items) {
    const key = getMonthKey(item.date);
    if (!map[key]) {
      map[key] = { week: formatMonthLabel(key), count: 0, entries: [] };
    }
    map[key].count++;
    map[key].entries.push({ name: item.name, reason: item.reason, reasonDetail: item.reasonDetail });
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, value]) => value);
}

export default async function StatsPage() {
  const supabase = createAdminClient();

  const [{ data: actorsData }, { data: historyData }, { data: blacklistData }] = await Promise.all([
    supabase.from("actors").select("*"),
    supabase.from("worked_with_us_history").select("marked_at"),
    supabase
      .from("blacklist_history")
      .select("blacklisted_at, reason, reason_detail, actors(name, display_name)"),
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

  const topCities = DEFAULT_CITIES.map((city) => {
    const count = actors.filter((a) => a.cities.includes(city)).length;
    return { label: city, count, pct: total ? Math.round((count / total) * 100) : 0 };
  }).sort((a, b) => b.count - a.count);

  const allProfiles = SEXES.flatMap((s) =>
    AGE_RANGES.map((range) => ({
      sex: s,
      ageRange: range,
      count: actors.filter((a) => a.sex === s && a.age_ranges.includes(range)).length,
    }))
  );
  const topProfiles = [...allProfiles].sort((a, b) => b.count - a.count).slice(0, 3);
  const rareProfiles = [...allProfiles].sort((a, b) => a.count - b.count).slice(0, 3);

  const referralSources = Object.entries(REFERRAL_SOURCE_LABELS).map(([key, label]) => {
    const count = actors.filter((a) => a.referral_source === key).length;
    return { label, count, pct: total ? Math.round((count / total) * 100) : 0 };
  }).filter((r) => r.count > 0);

  const publiciteActors = actors.filter((a) => a.referral_source === "publicite");
  const publiciteTotal = publiciteActors.length;
  const publiciteSex = [
    { label: "Femmes", count: publiciteActors.filter((a) => a.sex === "Femme").length },
    { label: "Hommes", count: publiciteActors.filter((a) => a.sex === "Homme").length },
  ].map((d) => ({ ...d, pct: publiciteTotal ? Math.round((d.count / publiciteTotal) * 100) : 0 }));
  const publiciteAgeRanges = AGE_RANGES.map((range) => {
    const count = publiciteActors.filter((a) => a.age_ranges.includes(range)).length;
    return { label: range, count, pct: publiciteTotal ? Math.round((count / publiciteTotal) * 100) : 0 };
  });
  const publiciteMonthly = groupByMonthSexAge(publiciteActors);

  const monthlyActors = groupByMonth(actors.map((a) => a.created_at));
  const monthlyWorked = groupByMonth((historyData || []).map((h: { marked_at: string }) => h.marked_at));

  const monthlyBlacklisted = groupByMonthWithEntries(
    ((blacklistData as unknown as {
      blacklisted_at: string;
      reason: string;
      reason_detail: string | null;
      actors: { name: string; display_name: string | null } | null;
    }[]) || []).map((b) => ({
      date: b.blacklisted_at,
      name: b.actors?.display_name || b.actors?.name || "Acteur supprimé",
      reason: b.reason,
      reasonDetail: b.reason_detail,
    }))
  );

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
        referralSources={referralSources}
        publiciteSex={publiciteSex}
        publiciteAgeRanges={publiciteAgeRanges}
        publiciteMonthly={publiciteMonthly}
        monthlyActors={monthlyActors}
        monthlyWorked={monthlyWorked}
        monthlyBlacklisted={monthlyBlacklisted}
      />
    </div>
  );
}
