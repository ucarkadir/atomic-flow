"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { unitOptions } from "@/lib/rule-presets";

type Preset = {
  id: string;
  name: string;
  mode: "single" | "double" | "completed";
  metric1Label: string;
  metric1Unit: string;
  metric2Label?: string;
  metric2Unit?: string;
  supportsCompletedOnly: boolean;
};

type Habit = {
  id: string;
  habitName: string;
  metric1Label: string;
  metric1Unit: string;
  metric2Label?: string | null;
  metric2Unit?: string | null;
  supportsCompletedOnly: boolean;
  invertScore: boolean;
  weeklyTargetText: string;
};

const weekdays = [
  { label: "Pzt", value: 1 },
  { label: "Sal", value: 2 },
  { label: "Car", value: 3 },
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
  const [advancedMode, setAdvancedMode] = useState(false);
  const [form, setForm] = useState({
    habitName: "",
    identityStatement: "",
    implementationIntention: "",
    habitStacking: "",
    trackingStacking: "",
    weeklyTargetText: "",
    presetId: "",
    basicMode: "single" as "single" | "double" | "completed",
    metric1Label: "Dakika",
    metric1Unit: "dk",
    metric1UnitCustom: "",
    metric2Label: "",
    metric2Unit: "",
    metric2UnitCustom: "",
    supportsCompletedOnly: false,
    invertScore: false,
    plannedWeekdays: [] as number[],
    thresholds: {
      five: 45,
      four: 30,
      three: 15,
      two: 2,
      fiveDirect: 45,
      fiveM1: 30,
      fiveM2: 10
    },
    customRuleJsonText: ""
  });

  const sortedHabits = useMemo(() => habits, [habits]);

  const loadData = useCallback(async () => {
    const res = await fetch("/api/habits");
    if (!res.ok) return;
    const data = await res.json();
    setHabits(data.habits ?? []);
    setPresets(data.presets ?? []);

    setForm((prev) => {
      if (!prev.presetId && data.presets?.length) {
        return { ...prev, presetId: data.presets[0].id };
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function onSelectPreset(presetId: string) {
    setForm((prev) => ({ ...prev, presetId }));
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) return;

    setForm((prev) => ({
      ...prev,
      presetId,
      basicMode: preset.mode,
      metric1Label: preset.metric1Label,
      metric1Unit: preset.metric1Unit,
      metric2Label: preset.metric2Label ?? "",
      metric2Unit: preset.metric2Unit ?? "",
      supportsCompletedOnly: preset.supportsCompletedOnly
    }));
  }

  async function createHabit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    let customRuleJson: unknown = undefined;
    if (advancedMode && form.customRuleJsonText.trim()) {
      try {
        customRuleJson = JSON.parse(form.customRuleJsonText);
      } catch {
        setMessage("Advanced JSON gecersiz.");
        setLoading(false);
        return;
      }
    }

    const payload = {
      habitName: form.habitName,
      identityStatement: form.identityStatement,
      implementationIntention: form.implementationIntention,
      habitStacking: form.habitStacking,
      trackingStacking: form.trackingStacking,
      weeklyTargetText: form.weeklyTargetText,
      presetId: form.presetId || undefined,
      basicMode: form.basicMode,
      metric1Label: form.metric1Label,
      metric1Unit: form.metric1Unit === "__custom__" ? form.metric1UnitCustom : form.metric1Unit,
      metric2Label: form.metric2Label || null,
      metric2Unit:
        form.metric2Unit === "__custom__"
          ? form.metric2UnitCustom || null
          : form.metric2Unit || null,
      supportsCompletedOnly: form.supportsCompletedOnly,
      invertScore: form.invertScore,
      plannedWeekdays: form.plannedWeekdays,
      thresholds: form.thresholds,
      customRuleJson
    };

    const res = await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const data = await res.json();
      setMessage(data.error ?? "Kayit sirasinda hata");
      setLoading(false);
      return;
    }

    setMessage("Aliskanlik eklendi.");
    setForm((prev) => ({
      ...prev,
      habitName: "",
      identityStatement: "",
      implementationIntention: "",
      habitStacking: "",
      trackingStacking: "",
      weeklyTargetText: "",
      metric2Label: "",
      metric2Unit: "",
      metric2UnitCustom: "",
      plannedWeekdays: [],
      customRuleJsonText: ""
    }));

    await loadData();
    setLoading(false);
  }

  async function seedDefaults() {
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/seed", { method: "POST" });
    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error ?? "Seed hatasi");
    } else {
      setMessage(`Ornek aliskanliklar eklendi: ${data.insertedCount}`);
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
          <CardTitle>Aliskanlik Kurulumu</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createHabit} className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm">Aliskanlik</label>
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
              <label className="mb-1 block text-sm">Uygulama niyeti</label>
              <input
                value={form.implementationIntention}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, implementationIntention: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="mb-1 block text-sm">Aliskanlik istifi</label>
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
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm">Haftalik hedef</label>
              <input
                required
                value={form.weeklyTargetText}
                onChange={(e) => setForm((prev) => ({ ...prev, weeklyTargetText: e.target.value }))}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm">Preset</label>
              <select value={form.presetId} onChange={(e) => onSelectPreset(e.target.value)}>
                <option value="">Secme</option>
                {presets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm">Kural modu</label>
              <select
                value={form.basicMode}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    basicMode: e.target.value as "single" | "double" | "completed"
                  }))
                }
              >
                <option value="single">Single</option>
                <option value="double">Double</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm">Metric1 Label</label>
              <input
                disabled={form.supportsCompletedOnly}
                value={form.metric1Label}
                onChange={(e) => setForm((prev) => ({ ...prev, metric1Label: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm">Metric1 Unit</label>
              <select
                disabled={form.supportsCompletedOnly}
                value={form.metric1Unit}
                onChange={(e) => setForm((prev) => ({ ...prev, metric1Unit: e.target.value }))}
              >
                {[...unitOptions, "__custom__"].map((unit) => (
                  <option key={unit} value={unit}>
                    {unit === "__custom__" ? "Custom..." : unit}
                  </option>
                ))}
              </select>
              {form.metric1Unit === "__custom__" ? (
                <input
                  className="mt-2"
                  placeholder="Custom unit"
                  value={form.metric1UnitCustom}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, metric1UnitCustom: e.target.value }))
                  }
                />
              ) : null}
            </div>

            {!form.supportsCompletedOnly && form.basicMode !== "completed" ? (
              <>
                <div>
                  <label className="mb-1 block text-sm">Metric2 Label (opsiyonel)</label>
                  <input
                    value={form.metric2Label}
                    onChange={(e) => setForm((prev) => ({ ...prev, metric2Label: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm">Metric2 Unit (opsiyonel)</label>
                  <select
                    value={form.metric2Unit}
                    onChange={(e) => setForm((prev) => ({ ...prev, metric2Unit: e.target.value }))}
                  >
                    <option value="">Secme</option>
                    {[...unitOptions, "__custom__"].map((unit) => (
                      <option key={unit} value={unit}>
                        {unit === "__custom__" ? "Custom..." : unit}
                      </option>
                    ))}
                  </select>
                  {form.metric2Unit === "__custom__" ? (
                    <input
                      className="mt-2"
                      placeholder="Custom unit"
                      value={form.metric2UnitCustom}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, metric2UnitCustom: e.target.value }))
                      }
                    />
                  ) : null}
                </div>
              </>
            ) : null}

            <div className="rounded border p-3 md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  className="h-4 w-4"
                  type="checkbox"
                  checked={form.supportsCompletedOnly}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, supportsCompletedOnly: e.target.checked }))
                  }
                />
                Sadece completed (yaptim/yapmadim)
              </label>
              <label className="mt-2 flex items-center gap-2 text-sm font-medium">
                <input
                  className="h-4 w-4"
                  type="checkbox"
                  checked={form.invertScore}
                  onChange={(e) => setForm((prev) => ({ ...prev, invertScore: e.target.checked }))}
                />
                Negatif aliskanlik (invert score)
              </label>
            </div>

            <div className="rounded border p-3 md:col-span-2">
              <p className="mb-2 text-sm font-medium">Rule Builder (Basic)</p>
              {form.basicMode === "single" ? (
                <div className="grid gap-2 md:grid-cols-4">
                  <NumberField
                    label="5/5 m1 >="
                    value={form.thresholds.five}
                    onChange={(value) =>
                      setForm((prev) => ({ ...prev, thresholds: { ...prev.thresholds, five: value } }))
                    }
                  />
                  <NumberField
                    label="4/5 m1 >="
                    value={form.thresholds.four}
                    onChange={(value) =>
                      setForm((prev) => ({ ...prev, thresholds: { ...prev.thresholds, four: value } }))
                    }
                  />
                  <NumberField
                    label="3/5 m1 >="
                    value={form.thresholds.three}
                    onChange={(value) =>
                      setForm((prev) => ({ ...prev, thresholds: { ...prev.thresholds, three: value } }))
                    }
                  />
                  <NumberField
                    label="2/5 m1 >="
                    value={form.thresholds.two}
                    onChange={(value) =>
                      setForm((prev) => ({ ...prev, thresholds: { ...prev.thresholds, two: value } }))
                    }
                  />
                </div>
              ) : null}

              {form.basicMode === "double" ? (
                <div className="grid gap-2 md:grid-cols-3">
                  <NumberField
                    label="5/5 secenek A (m1 >= X)"
                    value={form.thresholds.fiveDirect}
                    onChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        thresholds: { ...prev.thresholds, fiveDirect: value }
                      }))
                    }
                  />
                  <NumberField
                    label="5/5 secenek B m1 >= Y"
                    value={form.thresholds.fiveM1}
                    onChange={(value) =>
                      setForm((prev) => ({ ...prev, thresholds: { ...prev.thresholds, fiveM1: value } }))
                    }
                  />
                  <NumberField
                    label="5/5 secenek B m2 >= Z"
                    value={form.thresholds.fiveM2}
                    onChange={(value) =>
                      setForm((prev) => ({ ...prev, thresholds: { ...prev.thresholds, fiveM2: value } }))
                    }
                  />
                  <NumberField
                    label="4/5 m1 >="
                    value={form.thresholds.four}
                    onChange={(value) =>
                      setForm((prev) => ({ ...prev, thresholds: { ...prev.thresholds, four: value } }))
                    }
                  />
                  <NumberField
                    label="3/5 m1 >="
                    value={form.thresholds.three}
                    onChange={(value) =>
                      setForm((prev) => ({ ...prev, thresholds: { ...prev.thresholds, three: value } }))
                    }
                  />
                  <NumberField
                    label="2/5 m1 >="
                    value={form.thresholds.two}
                    onChange={(value) =>
                      setForm((prev) => ({ ...prev, thresholds: { ...prev.thresholds, two: value } }))
                    }
                  />
                </div>
              ) : null}

              {form.basicMode === "completed" ? (
                <p className="text-sm text-muted-foreground">Completed=true ise 5/5, aksi 1/5.</p>
              ) : null}
            </div>

            <div className="rounded border p-3 md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  className="h-4 w-4"
                  type="checkbox"
                  checked={advancedMode}
                  onChange={(e) => setAdvancedMode(e.target.checked)}
                />
                Advanced mode (ruleJson)
              </label>
              {advancedMode ? (
                <textarea
                  className="mt-2 min-h-40"
                  placeholder='{"mode":"single","levels":{...}}'
                  value={form.customRuleJsonText}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, customRuleJsonText: e.target.value }))
                  }
                />
              ) : null}
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm">Planli gunler (opsiyonel)</label>
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
                Aliskanlik Ekle
              </Button>
              <Button type="button" variant="secondary" onClick={seedDefaults} disabled={loading}>
                Ornek aliskanliklar
              </Button>
            </div>
          </form>
          {message ? <p className="mt-3 text-sm">{message}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mevcut Aliskanliklar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sortedHabits.length === 0 ? <p className="text-sm text-muted-foreground">Henuz yok.</p> : null}
            {sortedHabits.map((habit) => (
              <div key={habit.id} className="rounded border bg-white p-3">
                <p className="font-medium">{habit.habitName}</p>
                <p className="text-sm text-muted-foreground">{habit.weeklyTargetText}</p>
                <p className="text-sm text-muted-foreground">
                  {habit.supportsCompletedOnly
                    ? "Completed-only"
                    : `${habit.metric1Label} (${habit.metric1Unit})${habit.metric2Label ? ` + ${habit.metric2Label} (${habit.metric2Unit})` : ""}`}
                  {habit.invertScore ? " | Invert" : ""}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

function NumberField({
  label,
  value,
  onChange
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value || 0))}
      />
    </div>
  );
}
