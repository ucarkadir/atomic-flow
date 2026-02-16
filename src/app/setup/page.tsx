"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Preset = {
  id: string;
  name: string;
};

type Habit = {
  id: string;
  habitName: string;
  weeklyTargetText: string;
};

const weekdays = [
  { label: "Pzt", value: 1 },
  { label: "Sal", value: 2 },
  { label: "Çar", value: 3 },
  { label: "Per", value: 4 },
  { label: "Cum", value: 5 },
  { label: "Cts", value: 6 },
  { label: "Paz", value: 0 }
];

export default function SetupPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    habitName: "",
    identityStatement: "",
    implementationIntention: "",
    habitStacking: "",
    trackingStacking: "",
    weeklyTargetText: "",
    presetId: "minutes_basic",
    plannedWeekdays: [] as number[]
  });

  const sortedHabits = useMemo(() => habits, [habits]);

  async function loadData() {
    const res = await fetch("/api/habits");
    if (!res.ok) return;
    const data = await res.json();
    setHabits(data.habits ?? []);
    setPresets((data.presets ?? []).map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })));
  }

  useEffect(() => {
    loadData();
  }, []);

  async function createHabit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    if (!res.ok) {
      const data = await res.json();
      setMessage(data.error ?? "Kayıt sırasında hata");
      setLoading(false);
      return;
    }

    setForm({
      habitName: "",
      identityStatement: "",
      implementationIntention: "",
      habitStacking: "",
      trackingStacking: "",
      weeklyTargetText: "",
      presetId: form.presetId,
      plannedWeekdays: []
    });
    setMessage("Alışkanlık eklendi.");
    await loadData();
    setLoading(false);
  }

  async function seedDefaults() {
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/seed", { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Seed hatası");
    } else {
      setMessage(`Örnek alışkanlıklar eklendi: ${data.insertedCount}`);
      await loadData();
    }
    setLoading(false);
  }

  function toggleWeekday(day: number) {
    setForm((prev) => ({
      ...prev,
      plannedWeekdays: prev.plannedWeekdays.includes(day)
        ? prev.plannedWeekdays.filter((d) => d !== day)
        : [...prev.plannedWeekdays, day]
    }));
  }

  return (
    <main className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Alışkanlık Kurulumu</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createHabit} className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm">Alışkanlık</label>
              <input
                required
                value={form.habitName}
                onChange={(e) => setForm((prev) => ({ ...prev, habitName: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm">Kim olmak istiyorum?</label>
              <input
                value={form.identityStatement}
                onChange={(e) => setForm((prev) => ({ ...prev, identityStatement: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm">Uygulama niyeti (gün/saat/yer)</label>
              <input
                value={form.implementationIntention}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, implementationIntention: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-sm">Alışkanlık istifi</label>
              <input
                value={form.habitStacking}
                onChange={(e) => setForm((prev) => ({ ...prev, habitStacking: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm">Takip istifi</label>
              <input
                value={form.trackingStacking}
                onChange={(e) => setForm((prev) => ({ ...prev, trackingStacking: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm">Haftalık hedef</label>
              <input
                required
                value={form.weeklyTargetText}
                onChange={(e) => setForm((prev) => ({ ...prev, weeklyTargetText: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm">Rubrik/Kural preset</label>
              <select
                value={form.presetId}
                onChange={(e) => setForm((prev) => ({ ...prev, presetId: e.target.value }))}
              >
                {presets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm">Planlı günler (opsiyonel)</label>
              <div className="flex flex-wrap gap-2">
                {weekdays.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleWeekday(day.value)}
                    className={`rounded border px-3 py-1 text-sm ${
                      form.plannedWeekdays.includes(day.value) ? "bg-primary text-white" : "bg-white"
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 flex flex-wrap gap-2">
              <Button type="submit" disabled={loading}>
                Alışkanlık Ekle
              </Button>
              <Button type="button" variant="secondary" onClick={seedDefaults} disabled={loading}>
                Örnek alışkanlıklar
              </Button>
            </div>
          </form>
          {message ? <p className="mt-3 text-sm">{message}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mevcut Alışkanlıklar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sortedHabits.length === 0 ? <p className="text-sm text-muted-foreground">Henüz yok.</p> : null}
            {sortedHabits.map((habit) => (
              <div key={habit.id} className="rounded border bg-white p-3">
                <p className="font-medium">{habit.habitName}</p>
                <p className="text-sm text-muted-foreground">{habit.weeklyTargetText}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
