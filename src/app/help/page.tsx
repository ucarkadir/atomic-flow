"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type HabitRuleInfo = {
  id: string;
  habitName: string;
  metric1Label: string;
  metric1Unit: string;
  metric2Label?: string | null;
  metric2Unit?: string | null;
  supportsCompletedOnly: boolean;
  invertScore: boolean;
  ruleJson: unknown;
};

export default function HelpPage() {
  return (
    <Suspense fallback={<main className="text-sm">Yukleniyor...</main>}>
      <HelpContent />
    </Suspense>
  );
}

function HelpContent() {
  const searchParams = useSearchParams();
  const habitId = searchParams.get("habitId");
  const [habitRule, setHabitRule] = useState<HabitRuleInfo | null>(null);

  useEffect(() => {
    if (!habitId) {
      setHabitRule(null);
      return;
    }

    fetch(`/api/habits/${habitId}/rule`)
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as HabitRuleInfo;
      })
      .then((data) => setHabitRule(data))
      .catch(() => setHabitRule(null));
  }, [habitId]);

  return (
    <main className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <section>
            <h3 className="font-semibold">1) Gunluk girdi alanlari</h3>
            <p>
              Metric1/Metric2 aliskanliga ozeldir. Ornek: Dakika(dk), Sayfa(syf), Bardak(adet),
              Tekrar(adet). Completed kutusu yaptim/yapmadim kaydi icindir. Notes serbest not.
            </p>
          </section>

          <section>
            <h3 className="font-semibold">2) Skor hesaplama</h3>
            <p>Single: tek metrik esikleri. Double: OR/AND kosullari. Completed: checkbox tabanli.</p>
            <div className="rounded border bg-white p-3">
              <p className="font-medium">Ornek (Ingilizce)</p>
              <p>5/5 = 45dk veya (30dk + 10 cumle)</p>
              <p>4/5 = 30dk, 3/5 = 15dk, 2/5 = 2dk</p>
            </div>
            <div className="rounded border bg-white p-3">
              <p className="font-medium">Invert score</p>
              <p>
                Negatif aliskanliklarda (ornegin seker yeme) invertScore=true ise hesaplanan skor
                tersine cevrilir: 5-{"\u003e"}1, 4-{"\u003e"}2, 3-{"\u003e"}3.
              </p>
            </div>
          </section>

          <section>
            <h3 className="font-semibold">3) Haftalik yuzdeler</h3>
            <p>filledDays = puanlanan gun sayisi</p>
            <p>sum = skorlar toplami</p>
            <p>avg = sum / filledDays</p>
            <p>percent = sum / (5 * filledDays)</p>
            <p>N/A gunler filledDays hesabina girmez.</p>
          </section>

          <section>
            <h3 className="font-semibold">4) Planli gun ve N/A</h3>
            <p>
              Schedule varsa planli olmayan gunler N/A olur. Planli gunde entry yoksa ruleJson
              missingHandling degeri uygulanir: NA veya SCORE_1/SCORE_2...
            </p>
          </section>

          <section>
            <h3 className="font-semibold">Ornek Senaryo A</h3>
            <div className="rounded border bg-white p-3">
              <p>Aliskanlik: Egzersiz, planli: Pzt-Cars-Cuma</p>
              <p>Sal/Pers gunleri N/A (hesaba katilmaz).</p>
              <p>Pzt skor 4, Cars skor 3, Cuma giris yok + missingHandling=NA oldugunda filledDays=2.</p>
            </div>
          </section>

          <section>
            <h3 className="font-semibold">Ornek Senaryo B</h3>
            <div className="rounded border bg-white p-3">
              <p>Aliskanlik: Gunluk gorev, missingHandling=SCORE_2</p>
              <p>Planli gunde giris yoksa o gun skor 2 sayilir.</p>
            </div>
          </section>
        </CardContent>
      </Card>

      {habitRule ? (
        <Card>
          <CardHeader>
            <CardTitle>Secili Aliskanlik Kurali: {habitRule.habitName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              {habitRule.supportsCompletedOnly
                ? "Completed-only"
                : `${habitRule.metric1Label} (${habitRule.metric1Unit})${habitRule.metric2Label ? ` + ${habitRule.metric2Label} (${habitRule.metric2Unit})` : ""}`}
              {habitRule.invertScore ? " | invertScore=true" : ""}
            </p>
            <pre className="overflow-x-auto rounded border bg-white p-3 text-xs">
              {JSON.stringify(habitRule.ruleJson, null, 2)}
            </pre>
          </CardContent>
        </Card>
      ) : null}
    </main>
  );
}
