import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { WeeklyBarChart } from "@/components/admin/WeeklyBarChart";

interface StatEntry {
  label: string;
  count: number;
  pct: number;
}

interface ProfileEntry {
  sex: "Femme" | "Homme";
  ageRange: string;
  count: number;
}

interface StatsViewProps {
  total: number;
  active: number;
  sex: StatEntry[];
  ageRanges: StatEntry[];
  topCities: StatEntry[];
  topProfiles: ProfileEntry[];
  rareProfiles: ProfileEntry[];
  weeklyActors: { week: string; count: number }[];
  weeklyWorked: { week: string; count: number }[];
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
    </div>
  );
}

function StatTable({ rows, note }: { rows: StatEntry[]; note?: string }) {
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <div>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-sm text-dark">{row.label}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-dark tabular-nums">{row.count}</span>
                <span className="text-xs text-gray-400 w-9 text-right tabular-nums">{row.pct}%</span>
              </div>
            </div>
            <ProgressBar pct={(row.count / max) * 100} />
          </div>
        ))}
      </div>
      {note && <p className="text-xs text-gray-400 mt-4 italic">{note}</p>}
    </div>
  );
}

function ProfileList({ rows, variant }: { rows: ProfileEntry[]; variant: "top" | "rare" }) {
  const badgeClass =
    variant === "top"
      ? "bg-primary-light text-primary"
      : "bg-orange-100 text-orange-600";

  return (
    <ol className="space-y-3">
      {rows.map((row, i) => (
        <li key={`${row.sex}-${row.ageRange}`} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold flex-shrink-0 ${badgeClass}`}
            >
              {i + 1}
            </span>
            <Tag variant={row.sex === "Femme" ? "female" : "male"}>{row.sex}</Tag>
            <span className="text-sm text-dark truncate">{row.ageRange}</span>
          </div>
          <span className="text-sm font-semibold text-dark tabular-nums flex-shrink-0">
            {row.count} <span className="text-xs font-normal text-gray-400">acteur{row.count !== 1 ? "s" : ""}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

export function StatsView({ total, active, sex, ageRanges, topCities, topProfiles, rareProfiles, weeklyActors, weeklyWorked }: StatsViewProps) {
  const inactive = total - active;
  const activityRate = total ? Math.round((active / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Chiffres clés */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-6">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Total acteurs</p>
          <p className="text-4xl font-heading font-bold text-dark">{total}</p>
        </Card>
        <Card className="p-6">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Ont tourné avec nous</p>
          <p className="text-4xl font-heading font-bold text-success">{active}</p>
        </Card>
        <Card className="p-6">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">N'ont pas encore tourné</p>
          <p className="text-4xl font-heading font-bold text-gray-400">{inactive}</p>
        </Card>
        <Card className="p-6">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Taux d'expérience</p>
          <p className="text-4xl font-heading font-bold text-dark">{activityRate}%</p>
        </Card>
      </div>

      {/* Histogrammes hebdomadaires */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {weeklyActors.length > 1 && (
          <Card className="p-6">
            <h2 className="text-xs font-semibold text-dark uppercase tracking-wide mb-6">
              Nouvelles inscriptions par semaine
            </h2>
            <WeeklyBarChart data={weeklyActors} color="#665DFF" tooltipLabel="Nouveaux acteurs" />
          </Card>
        )}
        {weeklyWorked.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xs font-semibold text-dark uppercase tracking-wide mb-6">
              Nouveaux acteurs ayant tourné par semaine
            </h2>
            <WeeklyBarChart data={weeklyWorked} color="#22c55e" tooltipLabel="Ont tourné" />
          </Card>
        )}
      </div>

      {/* Tableaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xs font-semibold text-dark uppercase tracking-wide mb-5">Répartition par sexe</h2>
          <StatTable rows={sex} />
        </Card>

        <Card className="p-6">
          <h2 className="text-xs font-semibold text-dark uppercase tracking-wide mb-5">Répartition par tranche d'âge</h2>
          <StatTable rows={ageRanges} note="Un acteur peut appartenir à plusieurs tranches d'âge." />
        </Card>

        <Card className="p-6">
          <h2 className="text-xs font-semibold text-dark uppercase tracking-wide mb-5">Top 10 villes</h2>
          <StatTable rows={topCities} note="Un acteur peut être rattaché à plusieurs villes." />
        </Card>

        {/* Profils représentés + rares — une seule Card, deux colonnes */}
        <Card className="p-6">
          <h2 className="text-xs font-semibold text-dark uppercase tracking-wide mb-5">Profils</h2>
          <div className="space-y-6">
            <div>
              <p className="text-xs font-medium text-primary mb-3">Les plus représentés</p>
              <ProfileList rows={topProfiles} variant="top" />
            </div>
            <div className="border-t border-gray-200 pt-6">
              <p className="text-xs font-medium text-orange-500 mb-3">Les plus rares</p>
              <ProfileList rows={rareProfiles} variant="rare" />
              <p className="text-xs text-gray-400 mt-4 italic">À recruter en priorité.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
