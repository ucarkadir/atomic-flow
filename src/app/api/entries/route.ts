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
  const { habitId, date, minutes, pages, outputCount, didOutput, notes } = body;

  if (!habitId || !date) {
    return NextResponse.json({ error: "habitId ve date zorunlu" }, { status: 400 });
  }

  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId: appUser.id },
    select: { id: true, ruleJson: true }
  });

  if (!habit) {
    return NextResponse.json({ error: "Habit bulunamadi" }, { status: 404 });
  }

  const score = calculateScore(habit.ruleJson, {
    minutes: toNullableInt(minutes),
    pages: toNullableInt(pages),
    outputCount: toNullableInt(outputCount),
    didOutput: typeof didOutput === "boolean" ? didOutput : null
  });

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
      minutes: toNullableInt(minutes),
      pages: toNullableInt(pages),
      outputCount: toNullableInt(outputCount),
      didOutput: typeof didOutput === "boolean" ? didOutput : null,
      notes: notes || null,
      score
    },
    update: {
      minutes: toNullableInt(minutes),
      pages: toNullableInt(pages),
      outputCount: toNullableInt(outputCount),
      didOutput: typeof didOutput === "boolean" ? didOutput : null,
      notes: notes || null,
      score
    }
  });

  return NextResponse.json(entry);
}

function toNullableInt(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const num = Number(value);
  return Number.isFinite(num) ? Math.max(0, Math.round(num)) : null;
}
