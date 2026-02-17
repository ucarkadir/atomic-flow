"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Habit = {
  id: string;
  habitName: string;
  metric1Label: string;
  metric1Unit: string;
  metric2Label?: string | null;
  metric2Unit?: string | null;
  supportsCompletedOnly: boolean;
};

type Entry = {
  habitId: string;
  metric1Value?: number | null;
  metric2Value?: number | null;
  completed?: boolean | null;
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
        metric1Value: entry.metric1Value ?? null,
        metric2Value: entry.metric2Value ?? null,
        completed: entry.completed ?? null,
        notes: entry.notes ?? null
      })
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error ?? "Kayit hatasi");
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
          <CardTitle>Gunluk Girdi</CardTitle>
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
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{habit.habitName}</p>
                      <p className="text-xs text-muted-foreground">
                        {habit.supportsCompletedOnly
                          ? "Bu aliskanlik completed-only"
                          : `${habit.metric1Label} (${habit.metric1Unit})${habit.metric2Label ? ` + ${habit.metric2Label} (${habit.metric2Unit})` : ""}`}
                      </p>
                    </div>
                    <Link href={`/help?habitId=${habit.id}`} className="text-xs text-primary underline">
                      Bu aliskanlik nasil hesaplanir?
                    </Link>
                  </div>

                  {!habit.supportsCompletedOnly ? (
                    <div className={`grid gap-2 ${habit.metric2Label ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
                      <input
                        type="number"
                        min={0}
                        step="0.1"
                        placeholder={`${habit.metric1Label} (${habit.metric1Unit})`}
                        value={entry.metric1Value ?? ""}
                        onChange={(e) =>
                          updateValue(habit.id, { metric1Value: parseNumber(e.target.value) })
                        }
                      />

                      {habit.metric2Label ? (
                        <input
                          type="number"
                          min={0}
                          step="0.1"
                          placeholder={`${habit.metric2Label} (${habit.metric2Unit ?? ""})`}
                          value={entry.metric2Value ?? ""}
                          onChange={(e) =>
                            updateValue(habit.id, { metric2Value: parseNumber(e.target.value) })
                          }
                        />
                      ) : null}

                      <input
                        placeholder="notes"
                        value={entry.notes ?? ""}
                        onChange={(e) => updateValue(habit.id, { notes: e.target.value })}
                      />
                    </div>
                  ) : (
                    <input
                      placeholder="notes"
                      value={entry.notes ?? ""}
                      onChange={(e) => updateValue(habit.id, { notes: e.target.value })}
                    />
                  )}

                  <label className="mt-2 flex items-center gap-2 text-sm">
                    <input
                      className="h-4 w-4"
                      type="checkbox"
                      checked={Boolean(entry.completed)}
                      onChange={(e) => updateValue(habit.id, { completed: e.target.checked })}
                    />
                    Completed
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
