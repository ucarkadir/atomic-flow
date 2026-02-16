"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type MonthlyResponse = {
  month: string;
  weeks: Array<{ weekStart: string; weekEnd: string; overallPercent: number }>;
  monthlyPercent: number;
};

export default function MonthlyPage() {
  const defaultMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(defaultMonth);
  const [data, setData] = useState<MonthlyResponse | null>(null);

  async function loadMonthly(value: string) {
    const res = await fetch(`/api/monthly?month=${value}`);
    if (!res.ok) return;
    setData(await res.json());
  }

  useEffect(() => {
    loadMonthly(month);
  }, [month]);

  const monthlyPercent = useMemo(() => data?.monthlyPercent ?? 0, [data]);

  return (
    <main>
      <Card>
        <CardHeader>
          <CardTitle>Aylık Özet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-xs">
            <label className="mb-1 block text-sm">Ay</label>
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>

          <div className="rounded border bg-white p-4">
            <p className="text-sm text-muted-foreground">Aylık yüzde (haftalık geneller ortalaması)</p>
            <p className="text-2xl font-semibold">%{monthlyPercent.toFixed(1)}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[520px] text-sm">
              <thead>
                <tr className="bg-secondary">
                  <th className="border p-2 text-left">Hafta</th>
                  <th className="border p-2 text-left">Aralık</th>
                  <th className="border p-2 text-right">Genel %</th>
                </tr>
              </thead>
              <tbody>
                {(data?.weeks ?? []).map((week, index) => (
                  <tr key={week.weekStart}>
                    <td className="border p-2">{index + 1}. hafta</td>
                    <td className="border p-2">
                      {week.weekStart} - {week.weekEnd}
                    </td>
                    <td className="border p-2 text-right">%{week.overallPercent.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
