"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Habit = { id: string; habitName: string };
type Entry = {
  habitId: string;
  minutes?: number | null;
  pages?: number | null;
  outputCount?: number | null;
  didOutput?: boolean | null;
  notes?: string | null;
  score?: number;
};

export default function DailyPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [message, setMessage] = useState("");

  async function loadData(selectedDate: string) {
    const res = await fetch(`/api/daily?date=${selectedDate}`);
    if (!res.ok) return;
    const data = await res.json();
    setHabits(data.habits ?? []);

    const mapped: Record<string, Entry> = {};
    for (const item of data.entries ?? []) {
      mapped[item.habitId] = item;
    }
    setEntries(mapped);
  }

  useEffect(() => {
    loadData(date);
  }, [date]);

  const rows = useMemo(() => habits, [habits]);

  async function saveEntry(habitId: string) {
    const entry = entries[habitId] ?? { habitId };
    const res = await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        habitId,
        date,
        minutes: entry.minutes ?? null,
        pages: entry.pages ?? null,
        outputCount: entry.outputCount ?? null,
        didOutput: entry.didOutput ?? null,
        notes: entry.notes ?? null
      })
    });
    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error ?? "Kayıt hatası");
      return;
    }

    setEntries((prev) => ({ ...prev, [habitId]: data }));
    setMessage(`${data.score}/5 kaydedildi`);
  }

  function updateValue(habitId: string, patch: Partial<Entry>) {
    setEntries((prev) => ({
      ...prev,
      [habitId]: {
        ...(prev[habitId] ?? { habitId }),
        ...patch
      }
    }));
  }

  return (
    <main className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Günlük Girdi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-xs">
            <label className="mb-1 block text-sm">Tarih</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          {message ? <p className="text-sm">{message}</p> : null}
          <div className="space-y-3">
            {rows.map((habit) => {
              const entry = entries[habit.id] ?? { habitId: habit.id };
              return (
                <div key={habit.id} className="rounded border bg-white p-3">
                  <p className="mb-2 font-medium">{habit.habitName}</p>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <input
                      type="number"
                      min={0}
                      placeholder="minutes"
                      value={entry.minutes ?? ""}
                      onChange={(e) => updateValue(habit.id, { minutes: parseNumber(e.target.value) })}
                    />
                    <input
                      type="number"
                      min={0}
                      placeholder="pages"
                      value={entry.pages ?? ""}
                      onChange={(e) => updateValue(habit.id, { pages: parseNumber(e.target.value) })}
                    />
                    <input
                      type="number"
                      min={0}
                      placeholder="outputCount"
                      value={entry.outputCount ?? ""}
                      onChange={(e) => updateValue(habit.id, { outputCount: parseNumber(e.target.value) })}
                    />
                    <input
                      placeholder="notes"
                      value={entry.notes ?? ""}
                      onChange={(e) => updateValue(habit.id, { notes: e.target.value })}
                    />
                  </div>
                  <label className="mt-2 flex items-center gap-2 text-sm">
                    <input
                      className="h-4 w-4"
                      type="checkbox"
                      checked={Boolean(entry.didOutput)}
                      onChange={(e) => updateValue(habit.id, { didOutput: e.target.checked })}
                    />
                    didOutput
                  </label>

                  <div className="mt-2 flex items-center gap-2">
                    <Button size="sm" onClick={() => saveEntry(habit.id)}>
                      Kaydet
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Son skor: {entry.score ? `${entry.score}/5` : "-"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

function parseNumber(value: string) {
  if (!value) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
