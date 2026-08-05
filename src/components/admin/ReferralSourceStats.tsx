"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { REFERRAL_SOURCE_LABELS } from "@/lib/types";
import { StatTable, type StatEntry } from "@/components/admin/StatTable";

interface ReferralSourceStatsProps {
  sources: StatEntry[];
  publiciteSex: StatEntry[];
  publiciteAgeRanges: StatEntry[];
  note?: string;
}

const PUBLICITE_LABEL = REFERRAL_SOURCE_LABELS.publicite;

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function ReferralSourceStats({ sources, publiciteSex, publiciteAgeRanges, note }: ReferralSourceStatsProps) {
  const [expanded, setExpanded] = useState(false);
  const max = Math.max(...sources.map((r) => r.count), 1);

  return (
    <div>
      <div className="space-y-3">
        {sources.map((row) =>
          row.label === PUBLICITE_LABEL ? (
            <button
              key={row.label}
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="w-full text-left cursor-pointer -mx-2 px-2 py-1 rounded-btn hover:bg-gray-100 transition-colors"
            >
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm text-dark flex items-center gap-1">
                  {row.label}
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
                  />
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-dark tabular-nums">{row.count}</span>
                  <span className="text-xs text-gray-400 w-9 text-right tabular-nums">{row.pct}%</span>
                </div>
              </div>
              <ProgressBar pct={(row.count / max) * 100} />
            </button>
          ) : (
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
          )
        )}
      </div>
      {note && <p className="text-xs text-gray-400 mt-4 italic">{note}</p>}

      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Détail — {PUBLICITE_LABEL}
          </p>
          <div>
            <p className="text-xs font-medium text-primary mb-2">Répartition par sexe</p>
            <StatTable rows={publiciteSex} />
          </div>
          <div>
            <p className="text-xs font-medium text-primary mb-2">Répartition par tranche d&apos;âge</p>
            <StatTable rows={publiciteAgeRanges} />
          </div>
        </div>
      )}
    </div>
  );
}
