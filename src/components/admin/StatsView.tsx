import { Card } from "@/components/ui/Card";

interface StatEntry {
  label: string;
  count: number;
  pct: number;
}

interface StatsViewProps {
  total: number;
  active: number;
  sex: StatEntry[];
  ageRanges: StatEntry[];
  topCities: StatEntry[];
  availability: StatEntry[];
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

export function StatsView({ total, active, sex, ageRanges, topCities, availability }: StatsViewProps) {
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
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Actifs</p>
          <p className="text-4xl font-heading font-bold text-success">{active}</p>
        </Card>
        <Card className="p-6">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Inactifs</p>
          <p className="text-4xl font-heading font-bold text-gray-400">{inactive}</p>
        </Card>
        <Card className="p-6">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Taux d'activité</p>
          <p className="text-4xl font-heading font-bold text-dark">{activityRate}%</p>
        </Card>
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

        <Card className="p-6">
          <h2 className="text-xs font-semibold text-dark uppercase tracking-wide mb-5">Répartition par disponibilité</h2>
          <StatTable rows={availability} note="Un acteur peut avoir plusieurs disponibilités." />
        </Card>
      </div>
    </div>
  );
}
