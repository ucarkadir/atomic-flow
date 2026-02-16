import { NextResponse } from "next/server";
import { addDays, endOfMonth, parse, startOfMonth } from "date-fns";
import { getAuthContext } from "@/lib/auth";
import { buildWeeklySummary } from "@/lib/analytics";
import { isoDate, mondayOf } from "@/lib/date";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { appUser } = await getAuthContext();
  if (!appUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month") ?? new Date().toISOString().slice(0, 7);
  const start = startOfMonth(parse(`${month}-01`, "yyyy-MM-dd", new Date()));
  const end = endOfMonth(start);

  const habits = await prisma.habit.findMany({
    where: { userId: appUser.id },
    select: {
      id: true,
      habitName: true,
      schedules: { select: { weekday: true, isPlanned: true } }
    },
    orderBy: { createdAt: "asc" }
  });

  const weeklyStarts = new Set<string>();
  for (let day = start; day <= end; day = addDays(day, 1)) {
    weeklyStarts.add(isoDate(mondayOf(day)));
  }

  const weeks = [] as Array<{ weekStart: string; weekEnd: string; overallPercent: number }>;

  for (const weekStartStr of [...weeklyStarts].sort()) {
    const weekStart = new Date(`${weekStartStr}T00:00:00.000Z`);
    const weekEndExclusive = addDays(weekStart, 7);

    const entries = await prisma.dailyEntry.findMany({
      where: {
        userId: appUser.id,
        date: {
          gte: weekStart,
          lt: weekEndExclusive
        }
      },
      select: { id: true, habitId: true, date: true, score: true }
    });

    const summary = buildWeeklySummary(habits, entries, weekStart);

    weeks.push({
      weekStart: weekStartStr,
      weekEnd: isoDate(addDays(weekStart, 6)),
      overallPercent: summary.overall.percent
    });
  }

  const monthlyPercent =
    weeks.length > 0
      ? weeks.reduce((acc, week) => acc + week.overallPercent, 0) / weeks.length
      : 0;

  return NextResponse.json({ month, weeks, monthlyPercent });
}
