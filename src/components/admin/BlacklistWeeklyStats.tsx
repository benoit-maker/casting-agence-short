"use client";

import { useState } from "react";
import { WeeklyBarChart } from "@/components/admin/WeeklyBarChart";

export interface BlacklistEntry {
  name: string;
  reason: string;
  reasonDetail: string | null;
}

export interface BlacklistWeekStat {
  week: string;
  count: number;
  entries: BlacklistEntry[];
}

interface BlacklistWeeklyStatsProps {
  data: BlacklistWeekStat[];
}

function EntryList({ entries }: { entries: BlacklistEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-gray-400 mt-3">Aucun acteur sorti ce mois-ci.</p>;
  }
  return (
    <ul className="mt-3 divide-y divide-gray-200 border border-gray-200 rounded-btn overflow-hidden">
      {entries.map((e, i) => (
        <li key={i} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
          <span className="text-dark font-medium truncate">{e.name}</span>
          <span className="text-gray-500 text-right truncate">
            {e.reason}
            {e.reason === "Autre" && e.reasonDetail ? ` — ${e.reasonDetail}` : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function BlacklistWeeklyStats({ data }: BlacklistWeeklyStatsProps) {
  const lastMonthIndex = data.length > 0 ? data.length - 1 : null;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const activeIndex = selectedIndex ?? lastMonthIndex;
  const activeMonth = activeIndex !== null ? data[activeIndex] : null;
  const currentMonthCount = lastMonthIndex !== null ? data[lastMonthIndex].count : 0;

  return (
    <div>
      <button
        type="button"
        onClick={() => lastMonthIndex !== null && setSelectedIndex(lastMonthIndex)}
        className="text-left mb-4 cursor-pointer group"
      >
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Ce mois-ci</p>
        <p className="text-3xl font-heading font-bold text-dark group-hover:text-red-500 transition-colors">
          {currentMonthCount} sorti{currentMonthCount !== 1 ? "s" : ""}
        </p>
      </button>

      {data.length > 1 ? (
        <WeeklyBarChart
          data={data.map(({ week, count }) => ({ week, count }))}
          color="#EF4444"
          tooltipLabel="Sorties"
          onBarClick={(index) => setSelectedIndex(index)}
        />
      ) : (
        <p className="text-sm text-gray-400">Pas encore assez de données pour un histogramme.</p>
      )}

      {activeMonth && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            {activeMonth.week}
          </p>
          <EntryList entries={activeMonth.entries} />
        </div>
      )}
    </div>
  );
}
