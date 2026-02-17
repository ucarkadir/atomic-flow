import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { presetRules } from "@/lib/score-engine";

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
      metric1Label: "Sayfa",
      metric1Unit: "syf",
      ruleJson: presetRules.readingPages
    },
    {
      habitName: "Egzersiz",
      identityStatement: "Aktif biriyim",
      implementationIntention: "Pzt-Cars-Cuma 07:00 parkta",
      habitStacking: "Su ictikten sonra hareket",
      trackingStacking: "Egzersiz bitince kayit",
      weeklyTargetText: "Haftada 3 planli gun",
      metric1Label: "Dakika",
      metric1Unit: "dk",
      ruleJson: {
        mode: "single",
        metric: "m1",
        missingHandling: "NA",
        levels: {
          "5": { m1: { gte: 50 } },
          "4": { m1: { gte: 35 } },
          "3": { m1: { gte: 20 } },
          "2": { m1: { gte: 10 } },
          "1": { else: true }
        }
      },
      plannedWeekdays: [1, 3, 5]
    },
    {
      habitName: "Ingilizce",
      identityStatement: "Ingilizceyi aktif kullanan biriyim",
      implementationIntention: "Her gun 08:00 masa basinda",
      habitStacking: "Kahveden sonra ders",
      trackingStacking: "Ders biter bitmez skor",
      weeklyTargetText: "Haftada 6 gun",
      metric1Label: "Dakika",
      metric1Unit: "dk",
      metric2Label: "Cumle",
      metric2Unit: "adet",
      ruleJson: presetRules.englishDouble
    },
    {
      habitName: "Dans",
      identityStatement: "Ritmi olan biriyim",
      implementationIntention: "Her gun 19:30 salonda",
      habitStacking: "Muzik acinca dans",
      trackingStacking: "Muzik kapaninca takip",
      weeklyTargetText: "Haftada 4 gun",
      metric1Label: "Dakika",
      metric1Unit: "dk",
      ruleJson: {
        mode: "single",
        metric: "m1",
        missingHandling: "NA",
        levels: {
          "5": { m1: { gte: 45 } },
          "4": { m1: { gte: 30 } },
          "3": { m1: { gte: 20 } },
          "2": { m1: { gte: 10 } },
          "1": { else: true }
        }
      }
    },
    {
      habitName: "Teknik gelisim",
      identityStatement: "Surekli ogrenirim",
      implementationIntention: "Her gun 20:30 calisma odasi",
      habitStacking: "Yemekten sonra teknik calisma",
      trackingStacking: "Calisma bitince not",
      weeklyTargetText: "Haftada 5 gun",
      metric1Label: "Dakika",
      metric1Unit: "dk",
      metric2Label: "Gorev",
      metric2Unit: "adet",
      ruleJson: {
        mode: "double",
        missingHandling: "SCORE_1",
        levels: {
          "5": {
            or: [
              { m1: { gte: 45 } },
              { and: [{ m1: { gte: 30 } }, { m2: { gte: 1 } }] }
            ]
          },
          "4": { m1: { gte: 30 } },
          "3": { m1: { gte: 20 } },
          "2": { m1: { gte: 10 } },
          "1": { else: true }
        }
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
        metric1Label: habit.metric1Label,
        metric1Unit: habit.metric1Unit,
        metric2Label: habit.metric2Label ?? null,
        metric2Unit: habit.metric2Unit ?? null,
        supportsCompletedOnly: false,
        invertScore: false,
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
