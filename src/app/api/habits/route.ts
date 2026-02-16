import { RuleType } from "@prisma/client";
import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPresetById, rulePresets } from "@/lib/rule-presets";

export async function GET() {
  const { appUser } = await getAuthContext();
  if (!appUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const habits = await prisma.habit.findMany({
    where: { userId: appUser.id },
    include: { schedules: true },
    orderBy: { createdAt: "asc" }
  });

  return NextResponse.json({ habits, presets: rulePresets });
}

export async function POST(request: Request) {
  const { appUser } = await getAuthContext();
  if (!appUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    habitName,
    identityStatement,
    implementationIntention,
    habitStacking,
    trackingStacking,
    weeklyTargetText,
    presetId,
    customRuleJson,
    ruleType,
    plannedWeekdays
  } = body;

  if (!habitName || !weeklyTargetText) {
    return NextResponse.json({ error: "habitName ve weeklyTargetText zorunlu" }, { status: 400 });
  }

  const preset = presetId ? getPresetById(presetId) : null;
  const resolvedRuleType = (preset?.ruleType ?? ruleType ?? RuleType.SINGLE_METRIC) as RuleType;
  const resolvedRuleJson = preset?.ruleJson ?? customRuleJson;

  if (!resolvedRuleJson) {
    return NextResponse.json({ error: "Kural tanimi eksik" }, { status: 400 });
  }

  const habit = await prisma.habit.create({
    data: {
      userId: appUser.id,
      habitName,
      identityStatement: identityStatement ?? "",
      implementationIntention: implementationIntention ?? "",
      habitStacking: habitStacking ?? "",
      trackingStacking: trackingStacking ?? "",
      weeklyTargetText,
      ruleType: resolvedRuleType,
      ruleJson: resolvedRuleJson,
      schedules: plannedWeekdays?.length
        ? {
            create: (plannedWeekdays as number[]).map((weekday) => ({
              weekday,
              isPlanned: true
            }))
          }
        : undefined
    },
    include: { schedules: true }
  });

  return NextResponse.json(habit, { status: 201 });
}
