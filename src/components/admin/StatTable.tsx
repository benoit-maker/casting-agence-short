export interface StatEntry {
  label: string;
  count: number;
  pct: number;
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function StatTable({ rows, note }: { rows: StatEntry[]; note?: string }) {
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
