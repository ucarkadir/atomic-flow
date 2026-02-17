import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";
import { calculateScore } from "@/lib/score-engine";
import { normalizeDate } from "@/lib/date";

export async function POST(request: Request) {
  const { appUser } = await getAuthContext();
  if (!appUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { habitId, date, metric1Value, metric2Value, completed, notes } = body;

  if (!habitId || !date) {
    return NextResponse.json({ error: "habitId ve date zorunlu" }, { status: 400 });
  }

  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId: appUser.id },
    select: { id: true, ruleJson: true, invertScore: true }
  });

  if (!habit) {
    return NextResponse.json({ error: "Habit bulunamadi" }, { status: 404 });
  }

  const scoreResult = calculateScore(
    habit.ruleJson,
    {
      metric1Value: toNullableNumber(metric1Value),
      metric2Value: toNullableNumber(metric2Value),
      completed: typeof completed === "boolean" ? completed : null
    },
    habit.invertScore
  );

  const entry = await prisma.dailyEntry.upsert({
    where: {
      userId_habitId_date: {
        userId: appUser.id,
        habitId,
        date: normalizeDate(date)
      }
    },
    create: {
      userId: appUser.id,
      habitId,
      date: normalizeDate(date),
      metric1Value: toNullableNumber(metric1Value),
      metric2Value: toNullableNumber(metric2Value),
      completed: typeof completed === "boolean" ? completed : null,
      notes: notes || null,
      score: scoreResult.score
    },
    update: {
      metric1Value: toNullableNumber(metric1Value),
      metric2Value: toNullableNumber(metric2Value),
      completed: typeof completed === "boolean" ? completed : null,
      notes: notes || null,
      score: scoreResult.score
    }
  });

  return NextResponse.json({ ...entry, usedMissingHandling: scoreResult.usedMissingHandling });
}

function toNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const num = Number(value);
  if (!Number.isFinite(num)) {
    return null;
  }

  return Math.max(0, num);
}
