import { RuleType } from "@prisma/client";
import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { presetRules, singleMetricRule } from "@/lib/score-engine";

export async function POST() {
  const { appUser } = await getAuthContext();
  if (!appUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const defaults = [
    {
      habitName: "Kitap okuma",
      identityStatement: "Her gun okuyan biriyim",
      implementationIntention: "Her gun 21:00 salonda",
      habitStacking: "Yatmadan once kitabi ac",
      trackingStacking: "Kapatmadan once giris yap",
      weeklyTargetText: "Haftada 5 gun 20+ sayfa",
      ruleType: RuleType.SINGLE_METRIC,
      ruleJson: singleMetricRule("pages", [
        [5, 35],
        [4, 28],
        [3, 20],
        [2, 10],
        [1, 0]
      ])
    },
    {
      habitName: "Egzersiz",
      identityStatement: "Aktif biriyim",
      implementationIntention: "Pzt-Cars-Cuma 07:00 parkta",
      habitStacking: "Su ictikten sonra 30 dk hareket",
      trackingStacking: "Egzersiz bitince kayit",
      weeklyTargetText: "Haftada 3 planli gun",
      ruleType: RuleType.SINGLE_METRIC,
      ruleJson: singleMetricRule("minutes", [
        [5, 50],
        [4, 35],
        [3, 20],
        [2, 10],
        [1, 0]
      ]),
      plannedWeekdays: [1, 3, 5]
    },
    {
      habitName: "Ingilizce",
      identityStatement: "Ingilizceyi aktif kullanan biriyim",
      implementationIntention: "Her gun 08:00 masa basinda",
      habitStacking: "Kahveden sonra ders",
      trackingStacking: "Ders biter bitmez skor",
      weeklyTargetText: "Haftada 6 gun",
      ruleType: RuleType.DOUBLE_METRIC,
      ruleJson: presetRules.englishDoubleMetric
    },
    {
      habitName: "Dans",
      identityStatement: "Ritmi olan biriyim",
      implementationIntention: "Her gun 19:30 salonda",
      habitStacking: "Muzik acinca 20 dk dans",
      trackingStacking: "Muzik listesi kapaninca takip",
      weeklyTargetText: "Haftada 4 gun",
      ruleType: RuleType.SINGLE_METRIC,
      ruleJson: singleMetricRule("minutes", [
        [5, 45],
        [4, 30],
        [3, 20],
        [2, 10],
        [1, 0]
      ])
    },
    {
      habitName: "Teknik gelisim",
      identityStatement: "Surekli ogrenirim",
      implementationIntention: "Her gun 20:30 calisma odasi",
      habitStacking: "Yemekten sonra 30 dk teknik calisma",
      trackingStacking: "Calisma bitince not gir",
      weeklyTargetText: "Haftada 5 gun",
      ruleType: RuleType.CHECKBOX_ASSISTED,
      ruleJson: {
        levels: [
          {
            score: 5,
            any: [
              { all: [{ metric: "minutes", op: "gte", value: 45 }] },
              {
                all: [
                  { metric: "minutes", op: "gte", value: 30 },
                  { metric: "didOutput", op: "eq", value: true }
                ]
              }
            ]
          },
          { score: 4, any: [{ all: [{ metric: "minutes", op: "gte", value: 30 }] }] },
          { score: 3, any: [{ all: [{ metric: "minutes", op: "gte", value: 20 }] }] },
          { score: 2, any: [{ all: [{ metric: "minutes", op: "gte", value: 10 }] }] },
          { score: 1, any: [{ all: [] }] }
        ]
      }
    }
  ];

  const created = [];

  for (const habit of defaults) {
    const exists = await prisma.habit.findFirst({
      where: {
        userId: appUser.id,
        habitName: habit.habitName
      },
      select: { id: true }
    });

    if (exists) {
      continue;
    }

    const inserted = await prisma.habit.create({
      data: {
        userId: appUser.id,
        habitName: habit.habitName,
        identityStatement: habit.identityStatement,
        implementationIntention: habit.implementationIntention,
        habitStacking: habit.habitStacking,
        trackingStacking: habit.trackingStacking,
        weeklyTargetText: habit.weeklyTargetText,
        ruleType: habit.ruleType,
        ruleJson: habit.ruleJson,
        schedules: habit.plannedWeekdays?.length
          ? {
              create: habit.plannedWeekdays.map((weekday) => ({
                weekday,
                isPlanned: true
              }))
            }
          : undefined
      }
    });

    created.push(inserted.id);
  }

  return NextResponse.json({ insertedCount: created.length });
}
