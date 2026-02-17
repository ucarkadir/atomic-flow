import { NextResponse } from "next/server";
import { addDays } from "date-fns";
import { getAuthContext } from "@/lib/auth";
import { buildWeeklySummary } from "@/lib/analytics";
import { isoDate, mondayOf, normalizeDate } from "@/lib/date";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { appUser } = await getAuthContext();
  if (!appUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const weekStartInput = searchParams.get("weekStart");
  const initialDate = weekStartInput ? normalizeDate(weekStartInput) : new Date();
  const weekStart = mondayOf(initialDate);
  const weekEnd = addDays(weekStart, 7);

  const [habits, entries] = await Promise.all([
    prisma.habit.findMany({
      where: { userId: appUser.id },
      select: {
        id: true,
        habitName: true,
        invertScore: true,
        ruleJson: true,
        schedules: { select: { weekday: true, isPlanned: true } }
      },
      orderBy: { createdAt: "asc" }
    }),
    prisma.dailyEntry.findMany({
      where: {
        userId: appUser.id,
        date: {
          gte: weekStart,
          lt: weekEnd
        }
      },
      select: { id: true, habitId: true, date: true, score: true }
    })
  ]);

  const summary = buildWeeklySummary(habits, entries, weekStart);

  return NextResponse.json({
    weekStart: isoDate(weekStart),
    weekEnd: isoDate(addDays(weekStart, 6)),
    ...summary
  });
}
