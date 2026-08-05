"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { StatTable, type StatEntry } from "@/components/admin/StatTable";

export interface PubliciteMonthStat {
  week: string;
  femmes: number;
  hommes: number;
  count: number;
  ageRanges: StatEntry[];
}

interface PubliciteMonthlyStatsProps {
  data: PubliciteMonthStat[];
}

const FEMALE_COLOR = "#C2185B";
const MALE_COLOR = "#1565C0";

export function PubliciteMonthlyStats({ data }: PubliciteMonthlyStatsProps) {
  const lastMonthIndex = data.length > 0 ? data.length - 1 : null;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const activeIndex = selectedIndex ?? lastMonthIndex;
  const activeMonth = activeIndex !== null ? data[activeIndex] : null;

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: FEMALE_COLOR }} />
          Femmes
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: MALE_COLOR }} />
          Hommes
        </span>
      </div>

      {data.length > 1 ? (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 5, right: 16, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: 13 }}
            />
            <Bar
              dataKey="femmes"
              name="Femmes"
              stackId="publicite"
              fill={FEMALE_COLOR}
              radius={[0, 0, 0, 0]}
              onClick={(_data, index) => setSelectedIndex(index)}
              cursor="pointer"
            />
            <Bar
              dataKey="hommes"
              name="Hommes"
              stackId="publicite"
              fill={MALE_COLOR}
              radius={[4, 4, 0, 0]}
              onClick={(_data, index) => setSelectedIndex(index)}
              cursor="pointer"
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-sm text-gray-400">Pas encore assez de données pour un histogramme.</p>
      )}

      {activeMonth && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            Répartition par tranche d&apos;âge — {activeMonth.week} ({activeMonth.count} acteur{activeMonth.count !== 1 ? "s" : ""})
          </p>
          <StatTable rows={activeMonth.ageRanges} />
        </div>
      )}
    </div>
  );
}
