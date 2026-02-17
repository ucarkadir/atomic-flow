import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  buildDoubleRuleFromThresholds,
  buildSingleRuleFromThresholds,
  getPresetById,
  rulePresets,
  type RulePreset
} from "@/lib/rule-presets";

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
    metric1Label,
    metric1Unit,
    metric2Label,
    metric2Unit,
    supportsCompletedOnly,
    invertScore,
    presetId,
    basicMode,
    thresholds,
    customRuleJson,
    plannedWeekdays
  } = body;

  if (!habitName || !weeklyTargetText) {
    return NextResponse.json({ error: "habitName ve weeklyTargetText zorunlu" }, { status: 400 });
  }

  const preset = presetId ? getPresetById(presetId) : null;
  const ruleJson = resolveRuleJson({ preset, basicMode, thresholds, customRuleJson });

  if (!ruleJson) {
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
      metric1Label: metric1Label ?? preset?.metric1Label ?? "Metric 1",
      metric1Unit: metric1Unit ?? preset?.metric1Unit ?? "adet",
      metric2Label: metric2Label || preset?.metric2Label || null,
      metric2Unit: metric2Unit || preset?.metric2Unit || null,
      supportsCompletedOnly: Boolean(supportsCompletedOnly ?? preset?.supportsCompletedOnly),
      invertScore: Boolean(invertScore),
      ruleJson,
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

function resolveRuleJson(params: {
  preset: RulePreset | null | undefined;
  basicMode?: "single" | "double" | "completed";
  thresholds?: Record<string, number>;
  customRuleJson?: unknown;
}) {
  const { preset, basicMode, thresholds, customRuleJson } = params;

  if (customRuleJson) {
    return customRuleJson;
  }

  if (preset) {
    return preset.ruleJson;
  }

  if (basicMode === "completed") {
    return {
      mode: "completed",
      missingHandling: "SCORE_1",
      levels: {
        "5": { completed: true },
        "1": { else: true }
      }
    };
  }

  if (basicMode === "double") {
    return buildDoubleRuleFromThresholds(
      Number(thresholds?.fiveDirect ?? 45),
      Number(thresholds?.fiveM1 ?? 30),
      Number(thresholds?.fiveM2 ?? 10),
      Number(thresholds?.four ?? 30),
      Number(thresholds?.three ?? 15),
      Number(thresholds?.two ?? 2)
    );
  }

  return buildSingleRuleFromThresholds(
    Number(thresholds?.five ?? 45),
    Number(thresholds?.four ?? 30),
    Number(thresholds?.three ?? 15),
    Number(thresholds?.two ?? 2)
  );
}
