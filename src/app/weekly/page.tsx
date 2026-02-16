"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, format, startOfWeek } from "date-fns";
import { tr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type WeeklyResponse = {
  weekStart: string;
  weekEnd: string;
  rows: Array<{
    habitId: string;
    habitName: string;
    days: Array<{ date: string; score: number | null; planned: boolean }>;
    filledDays: number;
    totalScore: number;
    average: number;
    percent: number;
  }>;
  overall: { filledDays: number; totalScore: number; average: number; percent: number };
};

const dayHeaders = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cts", "Paz"];

export default function WeeklyPage() {
  const defaultMonday = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const [weekStart, setWeekStart] = useState(defaultMonday);
  const [data, setData] = useState<WeeklyResponse | null>(null);

  async function loadWeekly(value: string) {
    const res = await fetch(`/api/weekly?weekStart=${value}`);
    if (!res.ok) return;
    setData(await res.json());
  }

  useEffect(() => {
    loadWeekly(weekStart);
  }, [weekStart]);

  const title = useMemo(() => {
    if (!data) return "";
    return `${format(new Date(`${data.weekStart}T00:00:00`), "d MMM", { locale: tr })} - ${format(new Date(`${data.weekEnd}T00:00:00`), "d MMM", { locale: tr })}`;
  }, [data]);

  return (
    <main>
      <Card>
        <CardHeader>
          <CardTitle>Haftalık Skor Tablosu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 overflow-x-auto">
          <div className="max-w-xs">
            <label className="mb-1 block text-sm">Hafta başlangıcı (Pazartesi)</label>
            <input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} />
          </div>
          {title ? <p className="text-sm text-muted-foreground">{title}</p> : null}

          <table className="min-w-[920px] border-collapse text-sm">
            <thead>
              <tr className="bg-secondary">
                <th className="border p-2 text-left">Alışkanlık</th>
                {dayHeaders.map((day) => (
                  <th key={day} className="border p-2">
                    {day}
                  </th>
                ))}
                <th className="border p-2">Dolu</th>
                <th className="border p-2">Toplam</th>
                <th className="border p-2">Ort</th>
                <th className="border p-2">%</th>
              </tr>
            </thead>
            <tbody>
              {(data?.rows ?? []).map((row) => (
                <tr key={row.habitId}>
                  <td className="border p-2 font-medium">{row.habitName}</td>
                  {row.days.map((day) => (
                    <td key={`${row.habitId}-${day.date}`} className="border p-2 text-center">
                      {day.score ?? (day.planned ? "-" : "N/A")}
                    </td>
                  ))}
                  <td className="border p-2 text-center">{row.filledDays}</td>
                  <td className="border p-2 text-center">{row.totalScore}</td>
                  <td className="border p-2 text-center">{row.average.toFixed(2)}</td>
                  <td className="border p-2 text-center">{row.percent.toFixed(1)}</td>
                </tr>
              ))}
              {data ? (
                <tr className="bg-secondary font-medium">
                  <td className="border p-2">Genel</td>
                  {Array.from({ length: 7 }).map((_, i) => (
                    <td key={addDays(new Date(`${data.weekStart}T00:00:00`), i).toISOString()} className="border p-2 text-center">
                      -
                    </td>
                  ))}
                  <td className="border p-2 text-center">{data.overall.filledDays}</td>
                  <td className="border p-2 text-center">{data.overall.totalScore}</td>
                  <td className="border p-2 text-center">{data.overall.average.toFixed(2)}</td>
                  <td className="border p-2 text-center">{data.overall.percent.toFixed(1)}</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </main>
  );
}
